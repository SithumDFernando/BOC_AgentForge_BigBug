// Input checks before any model call. Patterns can be bypassed; the real control is the tool scope (SECURITY rule 5).

const INJECTION = [
  /ignore (all )?(previous|prior|above) (instructions|rules)/i,
  /disregard (your|all|the|previous)/i,
  /you are now/i,
  /act as (if|a|an)\b/i,
  /forget (everything|all|your)/i,
  /new system prompt/i,
  /system\s*:/i,
  /jailbreak/i,
  /DAN mode/i,
  /developer mode/i,
  /<\s*\/?\s*system\s*>/i,
  /\[INST\]/i,
  /reveal (your|the) (system )?prompt/i,
  /show (all|every) (orders|customers|users)/i,
];

const CARD = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE = /\+?\d[\d\s-]{8,}\d/g;

export function detectInjection(text: string): boolean {
  return INJECTION.some(p => p.test(text));
}

// Applies only to text sent to the model; routing uses the original message.
export function scrubPii(text: string): { text: string; types: string[] } {
  const types = new Set<string>();
  let out = text.replace(CARD, () => (types.add('card'), '[REDACTED_CARD]'));
  out = out.replace(EMAIL, () => (types.add('email'), '[REDACTED_EMAIL]'));
  out = out.replace(PHONE, match => {
    // Dates (2026-10-13) and short numbers aren't phone numbers: require 9–15 digits.
    const digits = match.replace(/\D/g, '').length;
    if (digits < 9 || digits > 15) return match;
    types.add('phone');
    return '[REDACTED_PHONE]';
  });
  return { text: out, types: [...types] };
}

export function extractEmail(text: string): string | undefined {
  return text.match(EMAIL)?.[0];
}
