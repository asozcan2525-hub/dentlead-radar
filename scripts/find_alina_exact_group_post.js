require('dotenv').config();

async function findAlinaGroupPost() {
  const serpKey = process.env.SERPAPI_KEY;

  const queries = [
    'site:facebook.com/groups/turkeyteeth/ "Alina Tee"',
    'site:facebook.com/groups/turkeyteeth/ "bone grafting"',
    'site:facebook.com/groups/turkeyteeth/ "Can someone recommend a dental clinic in Turkey for implants and bone grafting"',
    'site:facebook.com/groups/turkeyteeth/ "Alina"',
    'site:facebook.com/groups/turkeyteeth/posts/ "bone grafting"',
    'site:facebook.com/groups/turkeyteeth/permalink/ "bone grafting"'
  ];

  for (const q of queries) {
    console.log('\n--- Query:', q);
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&engine=google&api_key=${serpKey}`;
    const res = await fetch(url);
    const data = await res.json();
    const results = data.organic_results || [];
    console.log('Found:', results.length);
    for (const r of results) {
      console.log(' *', r.title);
      console.log('   LINK:', r.link);
      console.log('   SNIPPET:', (r.snippet || '').slice(0, 160));
    }
  }
}

findAlinaGroupPost().catch(console.error);
