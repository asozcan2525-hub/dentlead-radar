const https = require('https');
const fs = require('fs');
const path = require('path');
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
          console.log(`[${Date.now() - t0}ms] "${q.substring(0, 45)}..." -> ${j.organic_results?.length || 0} results`);
          resolve(j.organic_results || []);
        } catch (e) {
          console.log(`[${Date.now() - t0}ms] JSON parse error`);
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
      console.log(`[25s Timeout] "${q.substring(0, 40)}"`);
      resolve([]);
    });
  });
}

const targetedQueries = [
  '"dental treatment in turkey" "email me"',
  '"my dental quote" "email me"',
  'site:reddit.com/r/askdentists "send me an email"',
  'site:reddit.com/r/Dentistry "email me at" gmail.com',
  'site:tripadvisor.com "my email is" "dentist" "turkey"',
  'site:tripadvisor.com "email me at" "dentist" "antalya"',
  'site:gutefrage.net "meine email" "zahnarzt"',
  'site:gutefrage.net "meine e-mail" "zähne"',
  '"looking for dental implants" "email me" gmail.com',
  '"turkey teeth" "email me at" gmail.com'
];

async function run() {
  console.log(`🎯 Hedefli E-Posta Taraması Başlatılıyor (${targetedQueries.length} sorgu)...`);
  const allResults = [];
  
  for (const q of targetedQueries) {
    const res = await querySerp(q);
    allResults.push(...res);
    // 1 saniye bekle
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\nToplam yeni sonuç toplandı: ${allResults.length}`);
  fs.writeFileSync(path.join(__dirname, '../data/raw_targeted_serp_emails.json'), JSON.stringify(allResults, null, 2));
}

run();
