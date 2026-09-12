require('dotenv').config();

async function findAlina() {
  const serpKey = process.env.SERPAPI_KEY;
  const queries = [
    'site:facebook.com "Alina Tee"',
    'site:facebook.com "Alina Tee" Turkey',
    'site:facebook.com "recommend a dental clinic in Turkey" "bone grafting"',
    'site:facebook.com/groups/ "bone grafting" "Turkey" "recommend"',
    'site:facebook.com/groups/ "implants and bone grafting" "Turkey"'
  ];

  for (const q of queries) {
    console.log('\n--- Searching:', q);
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&engine=google&api_key=${serpKey}`;
    const res = await fetch(url);
    const data = await res.json();
    const results = data.organic_results || [];
    console.log('Results:', results.length);
    for (const r of results) {
      console.log(' *', r.title);
      console.log('   URL:', r.link);
      console.log('   Snippet:', (r.snippet || '').slice(0, 150));
    }
  }
}

findAlina().catch(console.error);
