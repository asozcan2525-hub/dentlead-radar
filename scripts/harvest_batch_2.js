const https = require('https');
const fs = require('fs');
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
          resolve([]);
        }
      });
    });
    req.on('error', () => resolve([]));
    req.setTimeout(25000, () => {
      req.destroy();
      console.log(`[25s Timeout]`);
      resolve([]);
    });
  });
}

const queries = [
  'site:facebook.com/groups "turkey teeth" "gmail.com"',
  'site:facebook.com/groups "dental implants" "turkey" "gmail.com"',
  'site:facebook.com/groups "zahnbehandlung türkei" "gmail.com" OR "gmx.de"',
  'site:tripadvisor.com/ShowTopic "turkey teeth" "gmail.com"',
  'site:tripadvisor.com/ShowTopic "dental clinic" "turkey" "email me" gmail.com',
  'site:reddit.com/r/Dentistry "email me at" gmail.com',
  'site:reddit.com/r/askdentists "send me an email" OR "email me at"',
  'site:reddit.com/r/teeth "gmail.com"',
  'site:gutefrage.net "Zahnarzt" "Zahnersatz" "gmail.com" OR "gmx.de"',
  'site:gutefrage.net "Zahnimplantat" "Erfahrungen" "Türkei" "mail"',
  '"I need dental work" "email me at" gmail.com',
  '"looking for a good dentist" "my email is" OR "email me" gmail.com'
];

async function main() {
  const existing = fs.existsSync('scratch_new_serp_harvest.json') 
    ? JSON.parse(fs.readFileSync('scratch_new_serp_harvest.json', 'utf8'))
    : [];

  console.log(`Mevcut kayıt: ${existing.length}. Yeni sorgular taranıyor...`);
  const allResults = [...existing];
  
  for (const q of queries) {
    const res = await querySerp(q);
    allResults.push(...res);
    await new Promise(r => setTimeout(r, 800));
  }
  
  console.log('Toplam biriken organik sonuç:', allResults.length);
  fs.writeFileSync('scratch_new_serp_harvest.json', JSON.stringify(allResults, null, 2));
}

main();
