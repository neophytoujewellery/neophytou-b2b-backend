// Simple, professional B2B outreach template.
// AI personalization (based on each retailer's website) is added in a later step.

const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function buildEmail(lead, { senderName, senderEmail }) {
  const name = lead.business_name ? esc(lead.business_name) : 'there';

  const subject = `Wholesale partnership — Neophytou fine jewellery`;

  const text = `Hello ${lead.business_name || 'there'},

I'm reaching out from Neophytou Jewellery, a fine-jewellery house specialising in 18KT gold, natural and lab-grown diamonds, diamond tennis bracelets and necklaces, and engagement/bridal pieces.

We're expanding our network of trade partners in Greece, and your shop stood out as a strong potential fit for our collections.

If you're open to it, I'd be glad to share our wholesale catalogue and terms — no obligation at all.

Would a short call in the next week or two work for you?

Warm regards,
${senderName}
Neophytou Jewellery
${senderEmail}

—
If you'd prefer not to receive these emails, just reply "unsubscribe" and we'll remove you immediately.`;

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222;max-width:560px">
  <p>Hello ${name},</p>
  <p>I'm reaching out from <strong>Neophytou Jewellery</strong>, a fine-jewellery house specialising in
  18KT gold, natural and lab-grown diamonds, diamond tennis bracelets and necklaces, and engagement/bridal pieces.</p>
  <p>We're expanding our network of trade partners in Greece, and your shop stood out as a strong potential fit for our collections.</p>
  <p>If you're open to it, I'd be glad to share our wholesale catalogue and terms — no obligation at all.
  Would a short call in the next week or two work for you?</p>
  <p>Warm regards,<br>
  ${esc(senderName)}<br>
  Neophytou Jewellery<br>
  <a href="mailto:${esc(senderEmail)}">${esc(senderEmail)}</a></p>
  <hr style="border:none;border-top:1px solid #ddd;margin:18px 0">
  <p style="font-size:12px;color:#888">If you'd prefer not to receive these emails, just reply "unsubscribe" and we'll remove you immediately.</p>
</div>`;

  return { subject, html, text };
}