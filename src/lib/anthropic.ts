import Anthropic from '@anthropic-ai/sdk';

// ─── Lazy init para que el build de Next.js no requiera ANTHROPIC_API_KEY ─
let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  _client = new Anthropic({ apiKey: key });
  return _client;
}

// Proxy para mantener la API antigua (anthropic.messages.create(...)) sin romper imports
export const anthropic: Anthropic = new Proxy({} as Anthropic, {
  get(_t, prop) {
    const c = getAnthropic() as unknown as Record<PropertyKey, unknown>;
    const v = c[prop];
    return typeof v === 'function' ? (v as (...args: unknown[]) => unknown).bind(c) : v;
  },
});
