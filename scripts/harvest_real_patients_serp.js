const https = require('https');
require('dotenv').config();

const apiKey = process.env.SERPAPI_KEY;

function querySerp(q) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&engine=google&gl=de&hl=de&num=10&api_key=${apiKey}`;
    const req = https.get(url, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        try {
          const j = JSON.parse(b);
          console.log(`[${Date.now() - t0}ms] Query "${q.substring(0, 45)}..." -> ${j.organic_results?.length || 0} results`);
          resolve(j.organic_results || []);
        } catch (e) {
          console.log(`[${Date.now() - t0}ms] Parse error`);
          resolve([]);
        }
      });
    });
    req.on('error', (e) => {
      console.log(`[${Date.now() - t0}ms] Error: ${e.message}`);
      resolve([]);
    });
    req.setTimeout(25000, () => {
      req.destroy();
      console.log(`[25s Timeout]`);
      resolve([]);
    });
  });
}

const queries = [
  'site:reddit.com/r/askdentists "gmail.com"',
  'site:reddit.com/r/Dentistry "looking for a dentist"',
  'site:reddit.com/r/Invisalign "email me"',
  'site:tripadvisor.com/ShowTopic "dental" "turkey" "gmail.com"',
  'site:tripadvisor.com/ShowTopic "dental" "istanbul" "gmail.com"',
  'site:gutefrage.net "Zahnarzt" "gmail.com"',
  'site:gutefrage.net "Zahnschmerzen" "gmx.de"',
  'site:facebook.com "dental work" "turkey" "email me"',
  'site:facebook.com "dental implants" "email me" gmail.com',
  '"looking for a dentist" "email me at" gmail.com'
];

async function main() {
  const allResults = [];
  for (const q of queries) {
    const res = await querySerp(q);
    allResults.push(...res);
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('Total organic results found:', allResults.length);
  const fs = require('fs');
  fs.writeFileSync('scratch_new_serp_harvest.json', JSON.stringify(allResults, null, 2));
}

main();
