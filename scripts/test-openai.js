import 'dotenv/config';

const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.error('❌ OPENAI_API_KEY is missing in .env');
  process.exit(1);
}

// Tiny call on purpose — just to confirm the key + billing work. Costs a fraction of a cent.
try {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
      max_tokens: 5,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('❌ OpenAI API error:', res.status, data.error?.message || JSON.stringify(data));
    console.error('   Check: is billing active and the key valid?');
    process.exit(1);
  }

  console.log('✅ OpenAI API working — model replied:', data.choices?.[0]?.message?.content?.trim());
} catch (err) {
  console.error('❌ OpenAI request failed:', err.message);
  process.exit(1);
}
