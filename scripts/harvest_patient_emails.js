require('dotenv').config();
const fs = require('fs');

const apiKey = process.env.SERPAPI_KEY || process.env.SERPAPI_API_KEY;
if (!apiKey) {
  console.error("SERPAPI_API_KEY missing");
  process.exit(1);
}

const queries = [
  'site:reddit.com/r/askdentists "email me" gmail.com',
  'site:reddit.com/r/askdentists "contact me" gmail.com',
  'site:reddit.com/r/Dentistry "email me" gmail.com',
  'site:reddit.com/r/Invisalign "email me" gmail.com',
  'site:reddit.com/r/braces "email" gmail.com',
  '"dental work" "turkey" "gmail.com" "email"',
  'site:tripadvisor.com/ShowTopic "dental" "turkey" "gmail.com"',
  'site:gutefrage.net "zahn" "gmail.com"',
  'site:gutefrage.net "zahnarzt" "gmail.com" OR "gmx.de"',
  'site:facebook.com "zahnimplantat" "schreiben sie mir" "gmail.com"',
  'site:facebook.com "dentist" "email me" "gmail.com"'
];

async function run() {
  const results = [];
  for (const q of queries) {
    console.log(`Searching SerpApi: ${q}`);
    try {
      const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&api_key=${apiKey}&num=10`;
      const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!res.ok) {
        console.warn(`HTTP ${res.status} for ${q}`);
        continue;
      }
      const data = await res.json();
      if (data && data.organic_results) {
        for (const item of data.organic_results) {
          const rawText = (item.title || '') + ' ' + (item.snippet || '');
          const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
          const matches = rawText.match(emailRegex);
          if (matches && matches.length > 0) {
            const cleanEmails = [...new Set(matches.map(e => e.toLowerCase()))];
            // Filter out obvious spam / search engine / clinic marketing emails if needed, but collect all candidates
            results.push({
              query: q,
              title: item.title,
              link: item.link,
              snippet: item.snippet,
              emails: cleanEmails
            });
          }
        }
      }
    } catch (err) {
      console.warn(`Error searching "${q}": ${err.message}`);
    }
  }

  console.log(`Total found with emails: ${results.length}`);
  fs.writeFileSync('scratch_harvested_patient_emails.json', JSON.stringify(results, null, 2));
  console.log('Saved to scratch_harvested_patient_emails.json');
}

run();
