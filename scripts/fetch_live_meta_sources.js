require('dotenv').config();
const fs = require('fs');

async function run() {
  const serpKey = process.env.SERPAPI_KEY;

  console.log('Fetching Instagram reels via SerpApi (DuckDuckGo)...');
  const igUrl = `https://serpapi.com/search.json?q=site:instagram.com/reel/+("zahnimplantat"+OR+"turkey+teeth"+OR+"veneers")+("kosten"+OR+"price")&engine=duckduckgo&api_key=${serpKey}`;
  const igRes = await fetch(igUrl, { signal: AbortSignal.timeout(25000) });
  const igData = await igRes.json();
  const rawIg = igData.organic_results || [];
  console.log('Fetched IG results:', rawIg.length);

  const verifiedIg = [];
  for (const r of rawIg) {
    if (r.link && r.link.includes('instagram.com/')) {
      verifiedIg.push({
        title: r.title,
        url: r.link,
        snippet: r.snippet
      });
    }
  }

  console.log('Fetching Facebook groups via SerpApi (DuckDuckGo engine)...');
  const fbUrl = `https://serpapi.com/search.json?q=site:facebook.com/groups/+turkey+teeth+reviews+dental&engine=duckduckgo&api_key=${serpKey}`;
  const fbRes = await fetch(fbUrl, { signal: AbortSignal.timeout(15000) });
  const fbData = await fbRes.json();
  const rawFb = fbData.organic_results || [];
  console.log('Fetched FB results:', rawFb.length);

  const verifiedFb = [];
  for (const r of rawFb) {
    if (r.link && r.link.includes('facebook.com/')) {
      verifiedFb.push({
        title: r.title,
        url: r.link,
        snippet: r.snippet
      });
    }
  }

  const result = {
    instagram: verifiedIg,
    facebook: verifiedFb
  };

  fs.writeFileSync('data/verified_meta_sources.json', JSON.stringify(result, null, 2));
  console.log('Saved data/verified_meta_sources.json successfully!');
  console.log('Verified IG count:', verifiedIg.length);
  console.log('Verified FB count:', verifiedFb.length);
}

run().catch(console.error);
