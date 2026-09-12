require('dotenv').config();
const aiAnalyzer = require('../src/core/aiAnalyzer');
const database = require('../src/core/database');
const https = require('https');

const serpApiKey = process.env.SERPAPI_KEY;

const FORUM_QUERIES = [
  {
    source: 'reddit',
    query: 'site:reddit.com/r/askdentists ("turkey" OR "istanbul" OR "all on 4" OR "quote") ("implant" OR "veneers")',
    location: 'Birleşik Krallık / Avrupa 🇬🇧'
  },
  {
    source: 'reddit',
    query: 'site:reddit.com/r/de ("Zahnarzt" OR "Zahnklinik" OR "Implantate") ("Türkei" OR "Istanbul" OR "empfehlen")',
    location: 'Almanya 🇩🇪'
  },
  {
    source: 'gutefrage',
    query: 'site:gutefrage.net ("Zahnarzt" OR "Zahnklinik") ("Türkei" OR "Istanbul" OR "Kosten" OR "Erfahrungen")',
    location: 'Almanya / Avusturya 🇩🇪🇦🇹'
  },
  {
    source: 'reddit',
    query: 'site:reddit.com/r/germany ("dentist" OR "dental implants" OR "turkey teeth") ("recommend" OR "quote")',
    location: 'Almanya (Uluslararası) 🇩🇪'
  }
];

function searchGoogleSerp(q) {
  return new Promise(resolve => {
    const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&tbs=qdr:m3&num=10&api_key=${serpApiKey}`;
    const req = https.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.organic_results || []);
        } catch(e) { resolve([]); }
      });
    });
    req.on('error', () => resolve([]));
    req.setTimeout(8000, () => { req.destroy(); resolve([]); });
  });
}

(async () => {
  console.log('🚀 [Forum & Topluluk Hasta Avcısı] Başlatılıyor (Son 90 Gün + Gemini Denetimli)...');
  let added = 0;

  for (const item of FORUM_QUERIES) {
    console.log(`\n🔍 Tarama: [${item.source.toUpperCase()}] ${item.query}`);
    const results = await searchGoogleSerp(item.query);
    console.log(`   ↳ Google'dan ${results.length} adet sonuç geldi.`);

    for (const res of results) {
      const link = res.link;
      const title = res.title || '';
      const snippet = res.snippet || '';
      const combinedText = `${title}\n${snippet}`;

      const sourceId = `harvest_${item.source}_${Buffer.from(link).toString('base64').slice(-12)}`;
      if (database.isDuplicate(item.source, sourceId)) {
        continue;
      }

      // Gemini AI Analizi
      const analysis = await aiAnalyzer.analyze(combinedText, {
        author: res.author || 'Forum Patient',
        url: link,
        date: res.date,
        snippet: snippet,
        location: item.location
      });

      if (!analysis.is_lead) {
        console.log(`   ❌ Gemini Eledi: [${analysis.reason || 'Geçersiz'}] - ${title.slice(0, 45)}`);
        continue;
      }

      added++;
      console.log(`   ✅ GEMINI ONAYLADI! ${analysis.treatment_category} | ${analysis.location} | AI Skoru: ${analysis.ai_score}`);
      console.log(`      Başlık: ${title.slice(0, 60)}...`);

      const leadRecord = {
        source: item.source,
        source_id: sourceId,
        author: res.author || (item.source === 'reddit' ? 'Reddit Patient' : 'Gutefrage Patient'),
        author_url: link,
        url: link,
        content: combinedText,
        treatment_category: analysis.treatment_category || 'implant',
        urgency: analysis.urgency || 'high',
        location: analysis.location || item.location,
        sentiment: analysis.sentiment || 'Diş hekimi / klinik tavsiyesi arayışı',
        ai_score: analysis.ai_score || 90,
        suggested_reply: analysis.suggested_reply || '',
        status: 'new',
        created_at: new Date().toISOString()
      };

      database.addLead(leadRecord);
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n🏁 Toplam eklenen taze doğrulanmış lead: ${added}`);
  const stats = database.getStats();
  console.log('📊 Güncel Veritabanı:', stats.channels);
})();
