import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const vertex = vi.hoisted(() => ({ ctor: vi.fn(), generateContent: vi.fn(), embedContent: vi.fn() }));
const oai = vi.hoisted(() => ({ ctor: vi.fn(), create: vi.fn(), embed: vi.fn() }));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: vertex.generateContent, embedContent: vertex.embedContent };
    constructor(opts: unknown) { vertex.ctor(opts); }
  },
}));
vi.mock('openai', () => ({
  default: class {
    chat = { completions: { create: oai.create } };
    embeddings = { create: oai.embed };
    constructor(opts: unknown) { oai.ctor(opts); }
  },
}));
vi.mock('./log', () => ({ log: vi.fn() }));

import { embed, generate, LlmUnavailableError, resetLlmClients, type ToolSpec } from './llm';

const vec = (n = 768) => Array.from({ length: n }, () => 0.1);
const TOOL: ToolSpec = { name: 'getMyOrders', description: 'd', parameters: { type: 'object', properties: {} } };
const ENV = {
  LLM_PROVIDER: 'vertex', GOOGLE_CLOUD_PROJECT: 'proj', VERTEX_LOCATION: 'asia-south1', VERTEX_MODEL: 'gemini-x',
  VERTEX_EMBEDDING_MODEL: 'text-embedding-x', OPENAI_API_KEY: 'sk-test', OPENAI_MODEL: 'gpt-x', OPENAI_EMBEDDING_MODEL: 'emb-x',
};

beforeEach(() => {
  vi.clearAllMocks();
  resetLlmClients();
  for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
  vi.stubEnv('LLM_FALLBACK', '');
});
afterEach(() => vi.unstubAllEnvs());

describe('generate (vertex)', () => {
  it('uses Vertex AI with the project and location, and maps tools and tool calls', async () => {
    vertex.generateContent.mockResolvedValue({
      candidates: [{ content: { role: 'model', parts: [{ functionCall: { id: 'c1', name: 'getMyOrders', args: { orderId: 'WW-1001' } } }] } }],
      usageMetadata: { totalTokenCount: 42 },
    });
    const out = await generate({ system: 'sys', turns: [{ role: 'user', text: 'hi' }], tools: [TOOL] });
    expect(vertex.ctor).toHaveBeenCalledWith({ vertexai: true, project: 'proj', location: 'asia-south1' });
    const req = vertex.generateContent.mock.calls[0][0];
    expect(req.model).toBe('gemini-x');
    expect(req.config.systemInstruction).toBe('sys');
    expect(req.config.tools[0].functionDeclarations[0]).toMatchObject({ name: 'getMyOrders', parametersJsonSchema: TOOL.parameters });
    expect(out).toMatchObject({ text: '', tokens: 42, provider: 'vertex', toolCalls: [{ id: 'c1', name: 'getMyOrders', args: { orderId: 'WW-1001' } }] });
  });

  it('sends tool results back as functionResponse parts and replays raw model content', async () => {
    vertex.generateContent.mockResolvedValue({ candidates: [{ content: { parts: [{ text: 'Done.' }] } }] });
    const raw = { role: 'model', parts: [{ functionCall: { id: 'c1', name: 'getMyOrders', args: {} }, thoughtSignature: 'sig' }] };
    const out = await generate({
      system: 's',
      turns: [
        { role: 'user', text: 'q' },
        { role: 'assistant', toolCalls: [{ id: 'c1', name: 'getMyOrders', args: {} }], raw: { provider: 'vertex', content: raw } },
        { role: 'tool', callId: 'c1', name: 'getMyOrders', result: { orders: [] } },
      ],
    });
    const contents = vertex.generateContent.mock.calls[0][0].contents;
    expect(contents[1]).toBe(raw);
    expect(contents[2]).toEqual({ role: 'user', parts: [{ functionResponse: { id: 'c1', name: 'getMyOrders', response: { result: { orders: [] } } } }] });
    expect(out.text).toBe('Done.');
  });

  it('retries once, then falls back to OpenAI when configured', async () => {
    vi.stubEnv('LLM_FALLBACK', 'openai');
    vertex.generateContent.mockRejectedValue(Object.assign(new Error('overloaded'), { status: 503 }));
    oai.create.mockResolvedValue({ choices: [{ message: { content: 'From OpenAI' } }], usage: { total_tokens: 7 } });
    const out = await generate({ system: 's', turns: [{ role: 'user', text: 'q' }] });
    expect(vertex.generateContent).toHaveBeenCalledTimes(2);
    expect(out).toMatchObject({ text: 'From OpenAI', provider: 'openai', tokens: 7 });
  });

  it('throws LlmUnavailableError without a fallback, and does not retry a 400', async () => {
    vertex.generateContent.mockRejectedValue(Object.assign(new Error('bad request'), { status: 400 }));
    await expect(generate({ system: 's', turns: [{ role: 'user', text: 'q' }] })).rejects.toBeInstanceOf(LlmUnavailableError);
    expect(vertex.generateContent).toHaveBeenCalledTimes(1);
    expect(oai.create).not.toHaveBeenCalled();
  });

  it('treats a missing or unknown LLM_PROVIDER as unavailable', async () => {
    vi.stubEnv('LLM_PROVIDER', 'gemini-free');
    await expect(generate({ system: 's', turns: [] })).rejects.toBeInstanceOf(LlmUnavailableError);
    vi.stubEnv('LLM_PROVIDER', '');
    await expect(generate({ system: 's', turns: [] })).rejects.toBeInstanceOf(LlmUnavailableError);
  });
});

describe('generate (openai)', () => {
  it('maps tools and parses tool-call arguments', async () => {
    vi.stubEnv('LLM_PROVIDER', 'openai');
    oai.create.mockResolvedValue({
      choices: [{ message: { content: null, tool_calls: [{ id: 't1', type: 'function', function: { name: 'getMyOrders', arguments: '{"orderId":"NV-1001"}' } }] } }],
      usage: { total_tokens: 9 },
    });
    const out = await generate({
      system: 'sys',
      turns: [{ role: 'user', text: 'q' }, { role: 'tool', callId: 't0', name: 'searchPolicies', result: { found: false } }],
      tools: [TOOL],
    });
    const req = oai.create.mock.calls[0][0];
    expect(req.model).toBe('gpt-x');
    expect(req.messages[0]).toEqual({ role: 'system', content: 'sys' });
    expect(req.messages[2]).toEqual({ role: 'tool', tool_call_id: 't0', content: '{"found":false}' });
    expect(req.tools[0]).toEqual({ type: 'function', function: { name: 'getMyOrders', description: 'd', parameters: TOOL.parameters } });
    expect(out.toolCalls).toEqual([{ id: 't1', name: 'getMyOrders', args: { orderId: 'NV-1001' } }]);
  });
});

describe('embed', () => {
  it('asks Vertex AI for 768 dimensions and batches 120 inputs as 50 + 50 + 20, in order', async () => {
    vertex.embedContent.mockImplementation(async ({ contents }: { contents: string[] }) => ({ embeddings: contents.map(() => ({ values: vec() })) }));
    const texts = Array.from({ length: 120 }, (_, i) => `t${i}`);
    const out = await embed(texts, 'query');
    expect(vertex.embedContent.mock.calls.map(c => c[0].contents.length)).toEqual([50, 50, 20]);
    expect(vertex.embedContent.mock.calls[0][0].contents[0]).toBe('t0');
    expect(vertex.embedContent.mock.calls[0][0].config).toMatchObject({ outputDimensionality: 768, taskType: 'RETRIEVAL_QUERY' });
    expect(out).toHaveLength(120);
  });

  it('sends one input per request for gemini-embedding models', async () => {
    vi.stubEnv('VERTEX_EMBEDDING_MODEL', 'gemini-embedding-001');
    vertex.embedContent.mockResolvedValue({ embeddings: [{ values: vec() }] });
    await embed(['a', 'b', 'c']);
    expect(vertex.embedContent).toHaveBeenCalledTimes(3);
  });

  it('never falls back, and throws on a wrong vector length', async () => {
    vi.stubEnv('LLM_FALLBACK', 'openai');
    vertex.embedContent.mockResolvedValue({ embeddings: [{ values: vec(3072) }] });
    await expect(embed(['a'])).rejects.toThrow(/unexpected vectors/);
    expect(oai.embed).not.toHaveBeenCalled();
  });

  it('uses OpenAI with dimensions: 768 when it is the primary', async () => {
    vi.stubEnv('LLM_PROVIDER', 'openai');
    oai.embed.mockResolvedValue({ data: [{ index: 1, embedding: vec() }, { index: 0, embedding: vec() }] });
    const out = await embed(['a', 'b']);
    expect(oai.embed).toHaveBeenCalledWith({ model: 'emb-x', input: ['a', 'b'], dimensions: 768 });
    expect(out).toHaveLength(2);
  });
});
