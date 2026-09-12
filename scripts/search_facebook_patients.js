require('dotenv').config();

async function findFacebookPost() {
  const serpKey = process.env.SERPAPI_KEY;

  const queries = [
    'site:facebook.com "Can someone recommend a dental clinic in Turkey for implants"',
    'site:facebook.com "dental clinic in Turkey for implants and bone grafting"',
    'site:facebook.com "Alina Tee" dental Turkey',
    'site:facebook.com/groups/ "recommend a dental clinic in Turkey" "bone grafting"',
    'site:facebook.com/groups/ "recommend a dental clinic in Turkey for implants"',
    'site:facebook.com/groups/ "Can someone recommend" "Turkey" "implants"',
    'site:facebook.com/groups/ "Anyone recommend a clinic in Turkey" implants OR veneers',
    'site:facebook.com/groups/ "Looking for recommendations" "Turkey teeth" OR "Turkey dental"',
    'site:facebook.com/groups/ "dental work in turkey" "recommend"',
    'site:facebook.com/groups/ "turkey teeth" "implants" "cost" OR "price"'
  ];

  const allFound = [];

  for (const q of queries) {
    console.log(`\n=== Searching: ${q} ===`);
    try {
      const url = `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&engine=duckduckgo&api_key=${serpKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const data = await res.json();
      const results = data.organic_results || [];
      console.log(`Results found: ${results.length}`);

      for (const r of results) {
        if (r.link && r.link.includes('facebook.com/')) {
          console.log(` -> Title: ${r.title}`);
          console.log(`    Link: ${r.link}`);
          console.log(`    Snippet: ${(r.snippet || '').slice(0, 160)}\n`);
          allFound.push(r);
        }
      }
    } catch (err) {
      console.error('Error on query:', err.message);
    }
  }

  console.log(`\nTOTAL UNIQUE FACEBOOK RESULTS: ${allFound.length}`);
}

findFacebookPost().catch(console.error);
