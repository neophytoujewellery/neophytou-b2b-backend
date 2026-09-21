import env from '../config/env.js';
import { collectEvidence } from './signals.js';

const ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

const SYSTEM = `You write short, professional B2B wholesale outreach emails for Neophytou, a fine-jewellery wholesaler.
Rules:
- Personalise ONLY from the real facts provided (business name, city, detected website signals, website text). NEVER invent facts about the shop; if unsure, stay general.
- Use the seller's base_message as the core offer and tone.
- Keep it concise (90-140 words), warm but professional, addressed to the shop.
- One clear, soft call to action.
- One clear, soft call to action.
- Do NOT add an unsubscribe or opt-out line — a real unsubscribe link is appended automatically.
- Plain text body with real line breaks.
- The SUBJECT must be short and specific to THIS shop (reference its name or city); do not reuse a generic subject across shops.
- Sign the email with the exact sender_name provided; NEVER use placeholders like [Your Name] or [Name].
Return STRICT JSON only: {"subject":"<short subject>","body":"<email body>"}`;

/**
 * Generate a personalised subject + body for one lead.
 * @returns {Promise<{subject:string, body:string}>}
 */
export async function generateDraft(lead, baseMessage) {
  const ev = await collectEvidence(lead); // name, city, domain, signals, website snippet

  const user = {
    base_message: baseMessage,
    business_name: lead.business_name || '',
    city: lead.city || '',
    website: ev.domain || '',
    positive_signals: ev.signals_positive,
    website_text: ev.fetched ? ev.snippet : '(not fetched)',
    sender_name: env.SENDER_NAME || 'Neophytou Jewellery',
    sender_email: env.SENDER_EMAIL || '',
  };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: 'Write the email for this business:\n' + JSON.stringify(user) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 500,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${data.error?.message || JSON.stringify(data)}`);

  let parsed;
  try {
    parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
  } catch {
    throw new Error('Could not parse model JSON');
  }

  return {
    subject: String(parsed.subject || 'Wholesale partnership — Neophytou fine jewellery').slice(0, 200),
    body: String(parsed.body || '').slice(0, 4000),
  };
}