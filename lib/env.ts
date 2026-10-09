// Read env vars at request time only. Never at import time: `next build` runs without secrets.

export type RequiredEnv =
  | 'JWT_SECRET'
  | 'APP_BASE_URL'
  | 'FIREBASE_PROJECT_ID'
  | 'FIREBASE_CLIENT_EMAIL'
  | 'FIREBASE_PRIVATE_KEY'
  | 'OPENAI_API_KEY'
  | 'OPENAI_MODEL'
  | 'OPENAI_EMBEDDING_MODEL'
  | 'SMTP_HOST'
  | 'SMTP_PORT'
  | 'SMTP_USER'
  | 'SMTP_PASS'
  | 'SMTP_FROM'
  | 'DEMO_EMAIL_TO'
  | 'EMAIL_ALLOWLIST'
  | 'WALKWAVE_ADMIN_PASSWORD'
  | 'NOVA_ADMIN_PASSWORD'
  | 'NOVA_DEMO_API_KEY';

export function env(name: RequiredEnv): string {
  const value = process.env[name];
  if (!value || !value.trim()) throw new Error(`Missing env var ${name}`);
  return value;
}

export function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value : undefined;
}
