import 'dotenv/config';

const required = ['DATABASE_URL', 'GOOGLE_PLACES_API_KEY', 'OPENAI_API_KEY', 'BREVO_API_KEY'];

const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  BREVO_API_KEY: process.env.BREVO_API_KEY,
};

export function assertEnv() {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

export default env;
