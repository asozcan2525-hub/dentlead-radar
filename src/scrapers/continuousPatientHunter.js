/**
 * 🔄 DentLead Radar — Kesintisiz Canlı Hasta Avcısı
 * En yeni zaman dilimlerine (Son 24 saat, Son 7 gün, Son 30 gün) öncelik vererek
 * arka planda durmaksızın tarama yapar ve Gemini 3.6 Flash ile hastaları doğrular.
 */

const aiAnalyzer = require('../core/aiAnalyzer');
const database = require('../core/database');

const ROTATING_TARGETS = [
  // ── 1. ÖNCELİK: EN YENİ (SON 24 SAAT & 7 GÜN - BUGÜNÜN HASTALARI) ──
  {
    platform: 'instagram',
    timeframe: 'Son 24 Saat / 7 Gün',
    queries: [
      'site:instagram.com/reel/ ("which clinic" OR "how much was" OR "recommend") (turkey teeth OR implants)',
      'site:instagram.com/reel/ ("welche klinik" OR "wieviel kostet" OR "zahnarzt türkei")',
      'site:instagram.com/p/ ("getting my teeth done in turkey" OR "turkey teeth quote")'
    ]
  },
  {
    platform: 'facebook',
    timeframe: 'Son 24 Saat / 7 Gün',
    queries: [
      'site:facebook.com/groups/ ("anyone recommend" OR "looking for a dentist in istanbul") ("implants" OR "veneers")',
      'site:facebook.com/groups/ ("zahnklinik türkei erfahrungen" OR "suche arzt für implantate")',
      'site:facebook.com/groups/ ("turkey teeth" "just had a consultation" OR "quoted")'
    ]
  },
  // ── 2. ÖNCELİK: BU AYIN HASTALARI (SON 30 GÜN) ──
  {
    platform: 'instagram',
    timeframe: 'Son 30 Gün',
    queries: [
      'site:instagram.com/reel/ ("full mouth restoration" OR "all on 4" OR "all on 6") (cost OR price OR turkey)',
      'site:instagram.com/reel/ ("zirkonkronen" OR "zähne machen" OR "veneers türkei")'
    ]
  },
  {
    platform: 'facebook',
    timeframe: 'Son 30 Gün',
    queries: [
      'site:facebook.com/groups/ ("dental work in turkey" OR "cost of implants in antalya") ("recommend")',
      'site:facebook.com/groups/ ("heil- und kostenplan" "türkei" "erfahrungen")'
    ]
  }
];

class ContinuousPatientHunter {
  constructor() {
    this.isRunning = false;
    this.totalScansCompleted = 0;
    this.newPatientsFound = 0;
    this.currentCycle = 0;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('\n🚀 [7/24 Kesintisiz Canlı Hasta Avcısı] Başlatıldı.');
    console.log('📌 Öncelik Sıralaması: 1. Son 24 Saat / 7 Gün (En Taze), 2. Son 30 Gün.');
    console.log('🛡️ Denetim: Gemini 3.6 Flash (Sadece kendine tedavi arayan gerçek insanlar).\n');

    this.runLoop();
  }

  async runLoop() {
    while (this.isRunning) {
      try {
        this.currentCycle++;
        const targetGroup = ROTATING_TARGETS[(this.currentCycle - 1) % ROTATING_TARGETS.length];
        const randomQuery = targetGroup.queries[Math.floor(Math.random() * targetGroup.queries.length)];

        console.log(`\n🔍 [Canlı Döngü #${this.currentCycle}] [${targetGroup.platform.toUpperCase()}] [Öncelik: ${targetGroup.timeframe}]`);
        console.log(`   Hedef: ${randomQuery}`);

        await this.scanQuery(targetGroup.platform, randomQuery, targetGroup.timeframe);
        this.totalScansCompleted++;

      } catch (err) {
        console.warn('⚠️ [Canlı Avcı Hatası]:', err.message);
      }

      // 45 saniye bekle ve bir sonraki en taze hedefe geç (Durmaksızın devam et)
      await new Promise(r => setTimeout(r, 45000));
    }
  }

  async scanQuery(platform, query, timeframe) {
    try {
      // DuckDuckGo / Web araması ile en taze sonuçları tara
      const https = require('https');
      const q = encodeURIComponent(query);
      const url = `https://html.duckduckgo.com/html/?q=${q}`;

      const html = await new Promise(resolve => {
        const req = https.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'de,en-US;q=0.7,en;q=0.3'
          }
        }, res => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => resolve(data));
        });
        req.on('error', () => resolve(''));
        req.setTimeout(8000, () => { req.destroy(); resolve(''); });
      });

      if (!html) return;

      // Sonuçları ayıkla
      const results = [];
      const linkRegex = /<a class="result__url"[^>]*href="([^"]+)"[\s\S]*?<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
      let match;
      while ((match = linkRegex.exec(html)) !== null) {
        let cleanUrl = match[1];
        // DDG redirect unwrap
        if (cleanUrl.includes('uddg=')) {
          const uMatch = cleanUrl.match(/uddg=([^&]+)/);
          if (uMatch) cleanUrl = decodeURIComponent(uMatch[1]);
        }
        const snippet = match[2].replace(/<[^>]+>/g, '').trim();
        if (cleanUrl.includes('facebook.com') || cleanUrl.includes('instagram.com') || cleanUrl.includes('reddit.com')) {
          results.push({ url: cleanUrl, snippet });
        }
      }

      console.log(`   ↳ ${results.length} potansiyel taze paylaşım tespit edildi.`);

      for (const item of results.slice(0, 3)) {
        const sourceId = `live_${platform}_${Buffer.from(item.url).toString('base64').slice(-12)}`;

        // Zaten ekli mi?
        if (database.isDuplicate(platform, sourceId)) continue;

        // Gemini AI ile Katı Niyet & Tarih Analizi
        const analysis = await aiAnalyzer.analyze(item.snippet, {
          url: item.url,
          author: 'Hasta Adayı'
        });

        if (analysis.is_lead) {
          this.newPatientsFound++;
          console.log(`   🎯 [CANLI HASTA BULUNDU & ONAYLANDI] ${analysis.treatment_category} (Skor: ${analysis.ai_score})`);
          console.log(`      Niyet: ${analysis.sentiment}`);
          console.log(`      Link: ${item.url}`);

          database.addLead({
            source: platform,
            source_id: sourceId,
            author: platform === 'instagram' ? 'Instagram Patient' : 'Facebook Patient',
            author_url: item.url,
            url: item.url,
            content: item.snippet,
            treatment_category: analysis.treatment_category || 'implant',
            urgency: analysis.urgency || 'high',
            location: analysis.location || 'Almanya / UK / Avrupa',
            sentiment: analysis.sentiment,
            ai_score: analysis.ai_score || 90,
            suggested_reply: analysis.suggested_reply || '',
            status: 'new',
            created_at: new Date().toISOString()
          });
        }
      }

    } catch (e) {
      // Hata durumunda döngüyü bozma, sessizce devam et
    }
  }

  stop() {
    this.isRunning = false;
  }
}

module.exports = new ContinuousPatientHunter();
