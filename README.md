# Neophytou B2B — Backend (automation engine)

This is the backend automation engine for the Neophytou Jewellery B2B lead-generation
system. It will grow phase by phase: lead discovery → enrichment → AI scoring →
email validation → PostgreSQL/Sheets sync → Brevo outreach & suppression → analytics.

Right now it contains only the **Phase 0 scaffold** plus **connection test scripts**.

## Requirements
- Node.js 18+ (uses the built-in `fetch`)
- A `.env` file (copy from `.env.example`)

## Setup
```bash
cd backend
cp .env.example .env      # then open .env and fill in your real keys
npm install
```

## Test all four connections
```bash
npm run test:all
```

Or run them one at a time:
```bash
npm run test:neon
npm run test:places
npm run test:openai
npm run test:brevo
```

Each test does a single, tiny call and prints ✅ or ❌ with a helpful hint on failure.
Your API keys stay in your local `.env` and are never committed (see `.gitignore`).

## Notes
- **Brevo** blocks calls from unauthorized IPs. If `test:brevo` returns 401, add this
  machine's public IP under Brevo → SMTP & API → Authorized IPs, then re-run.
- **OpenAI** test uses `gpt-4o-mini` with a 5-token cap — costs a fraction of a cent.
- **Neon** must be an EU-region project (GDPR data residency).
