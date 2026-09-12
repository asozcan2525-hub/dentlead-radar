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
          const count = j.organic_results?.length || 0;
          console.log(`[${Date.now() - t0}ms] Query "${q.substring(0, 45)}..." -> ${count} results`);
          resolve(j.organic_results || []);
        } catch (e) {
          resolve([]);
        }
      });
    });
    req.on('error', () => resolve([]));
    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`[10s Timeout] "${q.substring(0, 40)}"`);
      resolve([]);
    });
  });
}

const fastQueries = [
  'site:tripadvisor.com/ShowTopic "turkey teeth" "gmail.com"',
  'site:tripadvisor.com/ShowTopic "dental implants" "turkey" "gmail.com"',
  'site:tripadvisor.com/ShowTopic "dentist" "antalya" "gmail.com"',
  'site:reddit.com/r/Dentistry "email me at" gmail.com',
  'site:reddit.com/r/askdentists "send me an email" OR "email me at"',
  'site:reddit.com/r/teeth "gmail.com"',
  'site:reddit.com/r/Invisalign "gmail.com"',
  'site:gutefrage.net "Zahnarzt" "Zahnersatz" "gmail.com"',
  'site:gutefrage.net "Zahnimplantat" "Türkei" "mail"',
  'site:gutefrage.net "Zahnklinik" "Türkei" "Erfahrungen" "email"',
  '"I need dental work" "email me at" gmail.com',
  '"looking for a good dentist" "my email is" OR "email me" gmail.com',
  '"dental treatment in turkey" "email me" gmail.com',
  '"cosmetic dentistry" "quote" "email me" gmail.com'
];

async function main() {
  const existing = fs.existsSync('scratch_new_serp_harvest.json') 
    ? JSON.parse(fs.readFileSync('scratch_new_serp_harvest.json', 'utf8'))
    : [];

  console.log(`Mevcut organik havuz: ${existing.length}. Yeni 14 hızlı sorgu taranıyor...`);
  const allResults = [...existing];
  
  for (const q of fastQueries) {
    const res = await querySerp(q);
    allResults.push(...res);
    await new Promise(r => setTimeout(r, 600));
  }
  
  console.log('✅ Tarama bitti! Toplam biriken organik sonuç:', allResults.length);
  fs.writeFileSync('scratch_new_serp_harvest.json', JSON.stringify(allResults, null, 2));
}

main();
