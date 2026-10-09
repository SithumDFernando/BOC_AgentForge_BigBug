import { describe, expect, it } from 'vitest';
import { parseChatInput } from './validation';
import { rateLimit } from './rate-limit';

describe('parseChatInput', () => {
  it('trims the message and keeps a valid requestId', () => {
    const r = parseChatInput({ message: '  hi  ', requestId: 'abc-12345' });
    expect(r).toEqual({ message: 'hi', history: [], requestId: 'abc-12345' });
  });

  it('rejects empty and over-long messages', () => {
    expect(() => parseChatInput({ message: '   ' })).toThrow('between 1 and 4,000');
    expect(() => parseChatInput({ message: 'x'.repeat(4001) })).toThrow('between 1 and 4,000');
    expect(() => parseChatInput(null)).toThrow('between 1 and 4,000');
  });

  it('keeps the last 8 valid turns, cut to 4000 characters', () => {
    const turns = Array.from({ length: 10 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `t${i}` }));
    const r = parseChatInput({ message: 'q', history: [...turns, { role: 'system', content: 'x' }, 'junk', { role: 'user', content: 'y'.repeat(5000) }] });
    expect(r.history).toHaveLength(8);
    expect(r.history.at(-1)!.content).toHaveLength(4000);
    expect(r.history.every(t => t.role === 'user' || t.role === 'assistant')).toBe(true);
  });

  it('replaces an invalid requestId with a UUID', () => {
    const r = parseChatInput({ message: 'q', requestId: 'bad/id' });
    expect(r.requestId).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('rateLimit', () => {
  it('throws 429 after the limit within the window', () => {
    const key = 'test:limit';
    rateLimit(key, 2);
    rateLimit(key, 2);
    expect(() => rateLimit(key, 2)).toThrow(expect.objectContaining({ status: 429 }));
  });
});
