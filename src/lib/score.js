import env from '../config/env.js';

const ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini'; // cheap + capable enough for evidence-based classification

export const CATEGORIES = [
  'fine_diamond',
  'mid_jewellery',
  'costume_or_steel',
  'pawn_cashforgold',
  'wholesaler_or_brand',
  'other',
];

const SYSTEM = `You score jewellery businesses for Neophytou, a FINE-JEWELLERY WHOLESALER (18KT gold; natural & lab-grown diamonds; diamond tennis bracelets/necklaces; engagement/bridal; luxury). We seek RETAIL trade partners that sell this kind of high-end jewellery. QUALITY OVER QUANTITY.

For each business, use the evidence (name, domain, city, name_is_jewellery flag, detected website signals, website text snippet) to choose ONE category and a fit_score 0-100.

Categories and score bands:
- fine_diamond (80-100): clearly sells 18KT gold and/or natural or lab-grown diamonds, engagement/bridal, tennis pieces, or luxury fine jewellery.
- mid_jewellery (45-70): a genuine jewellery shop or goldsmith, but limited or unclear high-end/diamond signals.
- costume_or_steel (10-30): costume/fashion jewellery, stainless-steel focused, silver-only, gold-plated, or low-cost accessories.
- pawn_cashforgold (0-15): pawnshop / cash-for-gold / ενεχυροδανειστήριο.
- wholesaler_or_brand (20-50): manufacturer, brand, or wholesaler — not a retail shop.
- other (0-10): not a jewellery business.

Weigh POSITIVE signals (18k, 750, diamond, lab-grown, tennis, engagement, bridal, solitaire, luxury, carat, white/yellow/rose gold, Greek equivalents) UP toward fine_diamond.
Weigh NEGATIVE signals (stainless/steel, costume, silver-only/925, plated, pawn/cash-for-gold, Greek equivalents) DOWN.
A shop selling gold AND silver is NOT silver-only.

IMPORTANT — missing website: if website_text is "(not fetched)" you have less evidence, so DO NOT default to "other" or a near-zero score just because information is missing. In that case:
- If name_is_jewellery is true (the name clearly means a jewellery shop), classify as mid_jewellery with a score of 40-50 and reason starting with "unverified:".
- Only use "other" / near-zero when the name itself gives no jewellery signal at all.

Keep reason under 14 words. Return STRICT JSON only, no prose:
{"results":[{"id":<int>,"fit_score":<int>,"category":"<category>","reason":"<short>"}]}`;

/**
 * Score a batch of evidence items via one OpenAI call.
 * @param {Array<{id, name, domain, city, signals_positive, signals_negative, snippet, fetched, name_is_jewellery}>} items
 * @returns {Promise<Array<{id:number, fit_score:number, fit_category:string, fit_reason:string}>>}
 */
export async function scoreLeads(items) {
  // Trim payload to keep tokens low.
  const payload = items.map((it) => ({
    id: it.id,
    name: it.name,
    domain: it.domain,
    city: it.city,
    name_is_jewellery: it.name_is_jewellery,
    positive: it.signals_positive,
    negative: it.signals_negative,
    website_text: it.fetched ? it.snippet : '(not fetched)',
  }));

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: 'Score these businesses:\n' + JSON.stringify(payload) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 1800,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${data.error?.message || JSON.stringify(data)}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
  } catch {
    throw new Error('Could not parse model JSON');
  }

  const results = Array.isArray(parsed.results) ? parsed.results : [];
  return results
    .map((r) => ({
      id: Number(r.id),
      fit_score: Math.max(0, Math.min(100, parseInt(r.fit_score, 10) || 0)),
      fit_category: CATEGORIES.includes(r.category) ? r.category : 'other',
      fit_reason: String(r.reason || '').slice(0, 200),
    }))
    .filter((r) => Number.isFinite(r.id));
}