import 'dotenv/config';

const key = process.env.BREVO_API_KEY;
if (!key) {
  console.error('❌ BREVO_API_KEY is missing in .env');
  process.exit(1);
}

try {
  const res = await fetch('https://api.brevo.com/v3/account', {
    headers: { 'api-key': key, accept: 'application/json' },
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('❌ Brevo API error:', res.status, data.message || JSON.stringify(data));
    if (res.status === 401) {
      console.error("   Hint: 401 usually means this machine's IP is NOT on Brevo's authorized IP list,");
      console.error('         or the API key is wrong. Add your IP under Brevo -> SMTP & API -> Authorized IPs.');
    }
    process.exit(1);
  }

  console.log('✅ Brevo API working');
  console.log('   Account:', data.email);
  console.log('   Company:', data.companyName || '(n/a)');
} catch (err) {
  console.error('❌ Brevo request failed:', err.message);
  process.exit(1);
}
