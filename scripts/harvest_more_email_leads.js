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
          const count = j.organic_results?.length || 0;
          console.log(`[${Date.now() - t0}ms] Query "${q.substring(0, 45)}..." -> ${count} results`);
          resolve(j.organic_results || []);
        } catch (e) {
          resolve([]);
        }
      });
    });
    req.on('error', () => resolve([]));
    req.setTimeout(8000, () => {
      req.destroy();
      console.log(`[Timeout] "${q.substring(0, 40)}"`);
      resolve([]);
    });
  });
}

const deepQueries = [
  'site:tripadvisor.com/ShowTopic "dentist" "Istanbul" "gmail.com"',
  'site:tripadvisor.com/ShowTopic "dentist" "Antalya" "gmail.com"',
  'site:tripadvisor.com/ShowTopic "veneers" "turkey" "gmail.com"',
  'site:tripadvisor.co.uk/ShowTopic "teeth" "turkey" "gmail.com"',
  'site:tripadvisor.co.uk/ShowTopic "dental" "turkey" "gmail.com"',
  'site:tripadvisor.de "Zahnarzt" "Türkei" "gmail.com"',
  'site:expat.com "dentist" "turkey" "gmail.com"',
  'site:realself.com "veneers" "turkey" "gmail.com"',
  'site:realself.com "implants" "turkey" "gmail.com"',
  'site:reddit.com/r/Turkey "dentist" "gmail.com"',
  'site:reddit.com/r/istanbul "dentist" "gmail.com"',
  'site:reddit.com "dental work in turkey" "gmail.com"',
  'site:reddit.com "teeth done in turkey" "gmail.com"',
  'site:quora.com "dental tourism in turkey" "gmail.com"',
  'site:quora.com "dental implants in turkey" "gmail.com"',
  'site:gutefrage.net "Zähne" "Türkei" "gmail.com"',
  'site:gutefrage.net "Zahnersatz" "Türkei" "mail"'
];

async function run() {
  console.log(`🚀 Derin E-posta Taraması Başlatılıyor (${deepQueries.length} sorgu)...`);
  const allResults = [];
  
  for (const q of deepQueries) {
    const res = await querySerp(q);
    for (const r of res) {
      allResults.push(r);
    }
  }

  console.log(`Toplam toplanan organik sonuç sayısı: ${allResults.length}`);
  fs.writeFileSync(path.join(__dirname, '../data/raw_more_serp_emails.json'), JSON.stringify(allResults, null, 2));
}

run();
