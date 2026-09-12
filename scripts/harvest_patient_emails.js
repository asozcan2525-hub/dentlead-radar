require('dotenv').config();
const fs = require('fs');
const path = require('path');

const apiKey = process.env.SERPAPI_KEY || process.env.SERPAPI_API_KEY;
if (!apiKey) {
  console.error("SERPAPI_API_KEY missing");
  process.exit(1);
}

// 🎯 Son 3 ay tarih filtresi parametresi (Google tbs=qdr:m3)
const DATE_FILTER = '&tbs=qdr:m3';

// Genişletilmiş sorgular: DACH bölgesi + global diş hastası e-postaları
const queries = [
  // Reddit — Diş sorunları ve e-posta bırakan hastalar
  'site:reddit.com/r/askdentists "email me" gmail.com OR gmx.de OR web.de OR outlook.com',
  'site:reddit.com/r/askdentists "contact me" gmail.com OR gmx.de OR web.de',
  'site:reddit.com/r/Dentistry "email me" gmail.com OR gmx.de OR web.de',
  'site:reddit.com/r/Invisalign "email" gmail.com OR outlook.com',
  'site:reddit.com/r/braces "email" gmail.com OR outlook.com',
  'site:reddit.com/r/FragReddit "zahnarzt" "gmail.com" OR "gmx.de" OR "web.de"',
  'site:reddit.com/r/Austria "zahnarzt" "gmail.com" OR "gmx.de"',

  // Dental turizmi — Türkiye odaklı
  '"dental work" "turkey" "gmail.com" "email"',
  '"dental implants" "turkey" "contact" gmail.com OR outlook.com',
  '"teeth turkey" "email me" gmail.com OR hotmail.com',
  '"zahnimplantate" "türkei" "gmail.com" OR "gmx.de"',
  '"zahnbehandlung" "türkei" "email" gmail.com OR gmx.de OR web.de',

  // TripAdvisor — Dental turizmi tartışmaları
  'site:tripadvisor.com/ShowTopic "dental" "turkey" "gmail.com"',
  'site:tripadvisor.com/ShowTopic "dentist" "istanbul" gmail.com OR outlook.com',

  // Gutefrage — Almanca diş soruları + e-posta
  'site:gutefrage.net "zahn" "gmail.com" OR "gmx.de" OR "web.de"',
  'site:gutefrage.net "zahnarzt" "gmail.com" OR "gmx.de"',
  'site:gutefrage.net "zahnimplantat" "email" gmail.com OR gmx.de',
  'site:gutefrage.net "zahnersatz" gmail.com OR gmx.de OR web.de',

  // Facebook — Dental grupları
  'site:facebook.com "zahnimplantat" "schreiben sie mir" "gmail.com"',
  'site:facebook.com "dental" "email me" "gmail.com"',
  'site:facebook.com "zahnarzt" "türkei" gmail.com OR gmx.de',
  'site:facebook.com "veneers" "turkey" "email" gmail.com',

  // Instagram — Dental içerik
  'site:instagram.com "dental" "turkey" "email" gmail.com',
  'site:instagram.com "zahnklinik" "istanbul" gmail.com OR gmx.de',

  // Genel dental sorun aramaları + e-posta
  '"toothache" "help" "email me" gmail.com OR outlook.com',
  '"zahnschmerzen" "hilfe" gmail.com OR gmx.de OR web.de',
  '"dental implant cost" "email" gmail.com OR yahoo.com OR outlook.com'
];

// E-posta regex — genişletilmiş domain desteği
const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

// Marketing/klinik/sistem e-postalarını ayıklama listesi
const EXCLUDED_PATTERNS = [
  'support@', 'info@', 'contact@', 'press@', 'noreply@', 'no-reply@',
  'admin@', 'office@', 'hello@', 'team@', 'help@', 'sales@',
  'marketing@', 'newsletter@', 'privacy@', 'abuse@', 'postmaster@',
  'webmaster@', 'service@', 'billing@', 'feedback@',
  'reddit.com', 'facebook.com', 'instagram.com', 'twitter.com',
  'tripadvisor.com', 'gutefrage.net', 'google.com', 'youtube.com',
  'example.com', 'test.com', 'spam.com'
];

async function run() {
  const results = [];
  const seenEmails = new Set();

  console.log(`🔍 Toplam ${queries.length} sorgu taranacak (Son 3 ay filtreli)...\n`);

  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    console.log(`[${i + 1}/${queries.length}] Taranıyor: ${q.substring(0, 80)}...`);

    try {
      const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&api_key=${apiKey}&num=10${DATE_FILTER}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(60000) });

      if (!res.ok) {
        console.warn(`  ⚠️ HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();
      if (data && data.organic_results) {
        for (const item of data.organic_results) {
          const rawText = (item.title || '') + ' ' + (item.snippet || '');
          const matches = rawText.match(EMAIL_REGEX);

          if (matches && matches.length > 0) {
            const cleanEmails = [...new Set(matches.map(e => e.toLowerCase()))];

            for (const email of cleanEmails) {
              // Excluded pattern kontrolü
              if (EXCLUDED_PATTERNS.some(ex => email.includes(ex))) continue;
              // Deduplikasyon
              if (seenEmails.has(email)) continue;
              seenEmails.add(email);

              results.push({
                query: q,
                title: item.title,
                link: item.link,
                snippet: item.snippet,
                emails: [email],
                harvested_at: new Date().toISOString()
              });
              console.log(`  ✅ E-posta bulundu: ${email}`);
            }
          }
        }
      }

      // Rate limiting — SerpApi'yi aşırı yüklememek için
      await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (err) {
      console.warn(`  ❌ Hata: ${err.message}`);
    }
  }

  console.log(`\n📊 Toplam bulunan benzersiz e-posta lead: ${results.length}`);

  // Sonuçları kaydet
  const outputPath = path.join(__dirname, '..', 'scratch_harvested_patient_emails.json');
  
  // Mevcut sonuçları yükle ve birleştir (deduplikasyon ile)
  let existing = [];
  try {
    if (fs.existsSync(outputPath)) {
      existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    }
  } catch (e) { /* dosya yoksa sorun yok */ }

  const existingEmails = new Set();
  for (const item of existing) {
    for (const email of (item.emails || [])) {
      existingEmails.add(email.toLowerCase());
    }
  }

  const newResults = results.filter(r => 
    r.emails.some(e => !existingEmails.has(e))
  );

  const merged = [...existing, ...newResults];
  fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2));
  console.log(`💾 Toplam ${merged.length} sonuç kaydedildi (${newResults.length} yeni)`);
  console.log(`   Dosya: ${outputPath}`);
}

// Doğrudan çalıştırma veya require ile import
if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
