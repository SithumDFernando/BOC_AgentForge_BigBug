import { GoogleGenAI, type Content, type Part } from '@google/genai';
import OpenAI from 'openai';
import { env, optionalEnv } from './env';
import { log } from './log';

// The only module that talks to a model provider (D21). Vertex AI Gemini by default, OpenAI as an
// optional fallback for generate(). Clients are created lazily: `next build` runs without secrets.

export const EMBEDDING_DIMENSIONS = 768;
const TIMEOUT_MS = 20_000;
// Room for models that reason before answering; the prompts keep replies to a few sentences (D29).
const MAX_OUTPUT_TOKENS = 1024;

export type ToolSpec = { name: string; description: string; parameters: Record<string, unknown> };
export type ToolCall = { id: string; name: string; args: unknown };
export type Turn =
  | { role: 'user' | 'assistant'; text: string }
  | { role: 'assistant'; toolCalls: ToolCall[]; raw?: { provider: Provider; content: unknown } }
  | { role: 'tool'; callId: string; name: string; result: unknown };
export type Provider = 'vertex' | 'openai';
export type GenerateResult = { text: string; toolCalls: ToolCall[]; tokens: number; provider: Provider; raw?: unknown };
type GenerateInput = { system: string; turns: Turn[]; tools?: ToolSpec[] };

export class LlmUnavailableError extends Error {
  constructor() {
    super('The model provider is unavailable.');
    this.name = 'LlmUnavailableError';
  }
}

function primary(): Provider {
  const value = env('LLM_PROVIDER');
  if (value !== 'vertex' && value !== 'openai') throw new Error(`Unknown LLM_PROVIDER ${value}`);
  return value;
}

let vertexClient: GoogleGenAI | undefined;
function vertex(): GoogleGenAI {
  vertexClient ??= new GoogleGenAI({ vertexai: true, project: env('GOOGLE_CLOUD_PROJECT'), location: env('VERTEX_LOCATION') });
  return vertexClient;
}

let openaiClient: OpenAI | undefined;
function openai(): OpenAI {
  openaiClient ??= new OpenAI({ apiKey: env('OPENAI_API_KEY'), timeout: TIMEOUT_MS, maxRetries: 0 });
  return openaiClient;
}

// Test hook: drop memoized clients so a test can change env between cases.
export function resetLlmClients() {
  vertexClient = undefined;
  openaiClient = undefined;
}

function statusOf(err: unknown): number | undefined {
  const status = (err as { status?: unknown })?.status ?? (err as { code?: unknown })?.code;
  return typeof status === 'number' ? status : undefined;
}

// 429, 5xx, timeouts and network failures are worth one retry; other 4xx are not.
function retryable(err: unknown): boolean {
  const status = statusOf(err);
  if (status === undefined) return !(err instanceof Error && err.message.startsWith('Missing env var'));
  return status === 429 || status >= 500;
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (!retryable(err)) throw err;
    return await fn();
  }
}

function describe(err: unknown) {
  return { status: statusOf(err), error: String(err).slice(0, 300) };
}

// ---- Vertex AI (Gemini) ----

function toGemini(turns: Turn[]): Content[] {
  const contents: Content[] = [];
  for (const t of turns) {
    if ('toolCalls' in t) {
      // Replay Gemini's own content verbatim when we have it (it can carry thought signatures).
      if (t.raw?.provider === 'vertex') contents.push(t.raw.content as Content);
      else contents.push({ role: 'model', parts: t.toolCalls.map(c => ({ functionCall: { id: c.id, name: c.name, args: c.args as Record<string, unknown> } })) });
    } else if (t.role === 'tool') {
      const part: Part = { functionResponse: { id: t.callId, name: t.name, response: { result: t.result } } };
      const last = contents[contents.length - 1];
      if (last?.role === 'user' && last.parts?.every(p => p.functionResponse)) last.parts.push(part);
      else contents.push({ role: 'user', parts: [part] });
    } else {
      contents.push({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: t.text }] });
    }
  }
  return contents;
}

async function generateVertex(i: GenerateInput): Promise<GenerateResult> {
  const res = await vertex().models.generateContent({
    model: env('VERTEX_MODEL'),
    contents: toGemini(i.turns),
    config: {
      systemInstruction: i.system,
      temperature: 0.2,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      httpOptions: { timeout: TIMEOUT_MS },
      ...(i.tools?.length
        ? { tools: [{ functionDeclarations: i.tools.map(t => ({ name: t.name, description: t.description, parametersJsonSchema: t.parameters })) }] }
        : {}),
    },
  });
  const content = res.candidates?.[0]?.content;
  const parts = content?.parts ?? [];
  const text = parts.filter(p => typeof p.text === 'string' && !p.thought).map(p => p.text).join('').trim();
  const toolCalls = parts
    .filter(p => p.functionCall)
    .map((p, n) => ({ id: p.functionCall!.id || `call_${n}`, name: p.functionCall!.name ?? '', args: p.functionCall!.args ?? {} }));
  return { text, toolCalls, tokens: res.usageMetadata?.totalTokenCount ?? 0, provider: 'vertex', raw: content };
}

// ---- OpenAI ----

type OpenAIMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

function toOpenAI(system: string, turns: Turn[]): OpenAIMessage[] {
  const messages: OpenAIMessage[] = [{ role: 'system', content: system }];
  for (const t of turns) {
    if ('toolCalls' in t) {
      messages.push({
        role: 'assistant',
        content: null,
        tool_calls: t.toolCalls.map(c => ({ id: c.id, type: 'function' as const, function: { name: c.name, arguments: JSON.stringify(c.args ?? {}) } })),
      });
    } else if (t.role === 'tool') {
      messages.push({ role: 'tool', tool_call_id: t.callId, content: JSON.stringify(t.result) });
    } else {
      messages.push({ role: t.role, content: t.text });
    }
  }
  return messages;
}

function parseArgs(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw; // validateArgs rejects anything that isn't an object
  }
}

async function generateOpenAI(i: GenerateInput): Promise<GenerateResult> {
  // No temperature: some current "mini" models only accept the default.
  const res = await openai().chat.completions.create({
    model: env('OPENAI_MODEL'),
    messages: toOpenAI(i.system, i.turns),
    max_completion_tokens: MAX_OUTPUT_TOKENS,
    ...(i.tools?.length
      ? { tools: i.tools.map(t => ({ type: 'function' as const, function: { name: t.name, description: t.description, parameters: t.parameters } })) }
      : {}),
  });
  const message = res.choices[0]?.message;
  const toolCalls = (message?.tool_calls ?? [])
    .filter(c => c.type === 'function')
    .map(c => ({ id: c.id, name: c.function.name, args: parseArgs(c.function.arguments) }));
  return { text: (message?.content ?? '').trim(), toolCalls, tokens: res.usage?.total_tokens ?? 0, provider: 'openai' };
}

// ---- Public API ----

const generators: Record<Provider, (i: GenerateInput) => Promise<GenerateResult>> = { vertex: generateVertex, openai: generateOpenAI };

export async function generate(input: GenerateInput): Promise<GenerateResult> {
  let provider: Provider;
  try {
    provider = primary();
  } catch (err) {
    log('ERROR', 'model provider misconfigured', describe(err));
    throw new LlmUnavailableError();
  }
  try {
    return await withRetry(() => generators[provider](input));
  } catch (err) {
    log('WARNING', 'model call failed', { provider, ...describe(err) });
  }
  if (provider === 'vertex' && optionalEnv('LLM_FALLBACK') === 'openai' && optionalEnv('OPENAI_API_KEY')) {
    try {
      return await generateOpenAI(input);
    } catch (err) {
      log('WARNING', 'fallback model call failed', { provider: 'openai', ...describe(err) });
    }
  }
  throw new LlmUnavailableError();
}

// Embeddings always come from the primary provider: vectors from two models aren't comparable.
export async function embed(texts: string[], task: 'document' | 'query' = 'document'): Promise<number[][]> {
  const provider = primary();
  const out: number[][] = [];
  if (provider === 'vertex') {
    const model = env('VERTEX_EMBEDDING_MODEL');
    // gemini-embedding models on Vertex AI accept one input per request.
    const size = model.startsWith('gemini-embedding') ? 1 : 50;
    for (let i = 0; i < texts.length; i += size) {
      const batch = texts.slice(i, i + size);
      const res = await withRetry(() => vertex().models.embedContent({
        model,
        contents: batch,
        config: { outputDimensionality: EMBEDDING_DIMENSIONS, taskType: task === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT', httpOptions: { timeout: TIMEOUT_MS } },
      }));
      for (const e of res.embeddings ?? []) out.push(e.values ?? []);
    }
  } else {
    const model = env('OPENAI_EMBEDDING_MODEL');
    for (let i = 0; i < texts.length; i += 50) {
      const batch = texts.slice(i, i + 50);
      const res = await withRetry(() => openai().embeddings.create({ model, input: batch, dimensions: EMBEDDING_DIMENSIONS }));
      for (const d of [...res.data].sort((a, b) => a.index - b.index)) out.push(d.embedding);
    }
  }
  if (out.length !== texts.length || out.some(v => v.length !== EMBEDDING_DIMENSIONS)) {
    throw new Error(`Embedding provider returned unexpected vectors (expected ${texts.length} × ${EMBEDDING_DIMENSIONS})`);
  }
  return out;
}
