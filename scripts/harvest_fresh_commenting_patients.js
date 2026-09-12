require('dotenv').config();
const aiAnalyzer = require('../src/core/aiAnalyzer');
const database = require('../src/core/database');

const serpApiKey = process.env.SERPAPI_KEY;

if (!serpApiKey) {
  console.error('SERPAPI_KEY bulunamadı!');
  process.exit(1);
}

// Yeni tarihli (Son 3 Ay / 90 Gün) hasta yorumu ve hekim arayanlar için hedef sorgular
const TARGET_QUERIES = [
  // 1. Instagram Reels Yorumları (Fiyat ve klinik soran hastalar)
  {
    platform: 'instagram',
    query: 'site:instagram.com/reel/ ("which clinic" OR "how much was" OR "can you recommend") (turkey teeth OR dental implants)',
    location: 'Birleşik Krallık / Avrupa 🇬🇧'
  },
  {
    platform: 'instagram',
    query: 'site:instagram.com/reel/ ("welche klinik" OR "wieviel hat es gekostet" OR "kannst du empfehlen") (zähne türkei OR implantate)',
    location: 'Almanya 🇩🇪'
  },
  {
    platform: 'instagram',
    query: 'site:instagram.com/reel/ ("wer war schon da" OR "kosten all on" OR "zirkon kronen") (istanbul OR antalya)',
    location: 'Almanya / Avusturya 🇩🇪🇦🇹'
  },

  // 2. Facebook Grup Gönderileri ve Yorumları (Tavsiye ve hekim arayanlar)
  {
    platform: 'facebook',
    query: 'site:facebook.com/groups/ ("can anyone recommend" OR "looking for a good dentist") (turkey teeth OR implants OR veneers)',
    location: 'Birleşik Krallık 🇬🇧'
  },
  {
    platform: 'facebook',
    query: 'site:facebook.com/groups/ ("suche guten zahnarzt" OR "wer kann eine klinik empfehlen") (türkei zahnbehandlung OR istanbul)',
    location: 'Almanya 🇩🇪'
  },
  {
    platform: 'facebook',
    query: 'site:facebook.com/groups/ ("hat jemand erfahrungen mit" OR "suche arzt für implantate") (istanbul zahnarzt)',
    location: 'Almanya 🇩🇪'
  },

  // 3. TikTok & YouTube Video Yorumları
  {
    platform: 'tiktok',
    query: 'site:tiktok.com/ ("how much did you pay" OR "what clinic did you go to") (turkey teeth OR veneers)',
    location: 'İngiltere / Avrupa 🇬🇧'
  },
  {
    platform: 'youtube',
    query: 'site:youtube.com/watch ("welche klinik war das" OR "kannst du mir den arzt nennen") (zahnarzt türkei)',
    location: 'Almanya 🇩🇪'
  }
];

const https = require('https');

function searchGoogleSerp(q) {
  return new Promise(resolve => {
    // Google Past 3 Months (tbs=qdr:m3)
    const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&tbs=qdr:m3&num=10&api_key=${serpApiKey}`;
    const req = https.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.organic_results || []);
        } catch (e) {
          resolve([]);
        }
      });
    });
    req.on('error', err => {
      console.warn(`Arama hatası (${q}):`, err.message);
      resolve([]);
    });
    req.setTimeout(8000, () => {
      req.destroy();
      resolve([]);
    });
  });
}

async function harvest() {
  console.log('🚀 [Gemini Destekli Hasta Avcısı] Başlatılıyor...');
  console.log('📌 Filtre: Sadece son 90 gün (tbs=qdr:m3), hekim ve fiyat soran gerçek hastalar\n');

  let totalFound = 0;
  let verifiedCount = 0;
  let rejectedCount = 0;

  for (const item of TARGET_QUERIES) {
    console.log(`\n🔍 Tarama Yapılıyor [${item.platform.toUpperCase()}]: ${item.query.slice(0, 60)}...`);
    const results = await searchGoogleSerp(item.query);
    console.log(`   ↳ Google'dan ${results.length} adet potansiyel sonuç döndü.`);

    for (const res of results) {
      totalFound++;
      const link = res.link;
      const title = res.title || '';
      const snippet = res.snippet || '';
      const combinedText = `${title}\n${snippet}`;

      // Daha önce eklenmiş mi kontrol et
      const sourceId = `harvest_${item.platform}_${Buffer.from(link).toString('base64').slice(-12)}`;
      if (database.isDuplicate(item.platform, sourceId)) {
        console.log(`   ⏭️ Zaten veritabanında mevcut: ${title.slice(0, 40)}`);
        continue;
      }

      // Gemini AI ile Katı Niyet & Tarih Analizi
      const analysis = await aiAnalyzer.analyze(combinedText, {
        author: res.author || 'Hasta Adayı',
        url: link,
        date: res.date,
        snippet: snippet,
        location: item.location
      });

      if (!analysis.is_lead) {
        rejectedCount++;
        console.log(`   ❌ Gemini Eledi: [${analysis.reason || 'Hasta değil veya eski'}] - ${title.slice(0, 45)}`);
        continue;
      }

      // Kesin doğrulanmış hasta
      verifiedCount++;
      console.log(`   ✅ GEMINI ONAYLADI! Tedavi: ${analysis.treatment_category} | Lokasyon: ${analysis.location} | Skor: ${analysis.ai_score}`);
      console.log(`      Başlık: ${title.slice(0, 60)}...`);

      // İsim türetme / ayıklama
      let authorName = 'Hasta Adayı';
      if (item.platform === 'instagram') {
        const m = link.match(/instagram\.com\/([^\/]+)/);
        if (m && m[1] !== 'reel' && m[1] !== 'p') authorName = m[1];
        else authorName = 'Instagram Patient';
      } else if (item.platform === 'facebook') {
        authorName = 'Facebook Patient';
      }

      const leadRecord = {
        source: item.platform,
        source_id: sourceId,
        author: authorName,
        author_url: link,
        url: link,
        content: combinedText,
        treatment_category: analysis.treatment_category || 'implant',
        urgency: analysis.urgency || 'high',
        location: analysis.location || item.location,
        sentiment: analysis.sentiment || 'Diş hekimi ve fiyat arayışı (Canlı)',
        ai_score: analysis.ai_score || 90,
        suggested_reply: analysis.suggested_reply || '',
        status: 'new',
        created_at: new Date().toISOString()
      };

      database.addLead(leadRecord);
    }

    // Kısa bekleme (Rate limit önleme)
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`🏁 Tarama Özeti:`);
  console.log(`   Toplam İncelenen: ${totalFound}`);
  console.log(`   ❌ Yapay Zeka Tarafından Elenen: ${rejectedCount}`);
  console.log(`   ✅ Onaylanıp Sisteme Eklenen Taze Hasta: ${verifiedCount}`);
  console.log('═══════════════════════════════════════════════════\n');

  const stats = database.getStats();
  console.log('📊 Güncel Veritabanı Durumu:', stats.channels);
}

harvest();
