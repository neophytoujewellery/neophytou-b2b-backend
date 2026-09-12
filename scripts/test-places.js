import 'dotenv/config';

const key = process.env.GOOGLE_PLACES_API_KEY;
if (!key) {
  console.error('❌ GOOGLE_PLACES_API_KEY is missing in .env');
  process.exit(1);
}

try {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.id',
    },
    body: JSON.stringify({ textQuery: 'jewellery store in Athens, Greece' }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('❌ Places API error:', res.status, data.error?.message || JSON.stringify(data));
    console.error('   Check: is "Places API (New)" enabled for this project, and is the key allowed to call it?');
    process.exit(1);
  }

  const places = (data.places || []).slice(0, 3);
  console.log(`✅ Google Places API working — showing ${places.length} sample result(s):`);
  for (const p of places) {
    console.log(`   • ${p.displayName?.text} — ${p.formattedAddress}`);
  }
} catch (err) {
  console.error('❌ Places request failed:', err.message);
  process.exit(1);
}
