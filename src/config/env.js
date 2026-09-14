import 'dotenv/config';

const required = ['DATABASE_URL', 'GOOGLE_PLACES_API_KEY', 'OPENAI_API_KEY', 'BREVO_API_KEY'];

const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  HUNTER_API_KEY: process.env.HUNTER_API_KEY,
  GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
  GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
  TEST_EMAILS: process.env.TEST_EMAILS,
  SENDER_EMAIL: process.env.SENDER_EMAIL,
  SENDER_NAME: process.env.SENDER_NAME,
  WEBHOOK_PORT: process.env.WEBHOOK_PORT,     // optional — default 3000
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET, // optional — shared secret for the webhook URL
};

export function assertEnv() {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

export default env;