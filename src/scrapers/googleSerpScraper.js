/**
 * Google Arama & DACH Forum Portalları (SERP) Modülü
 * SerpApi ile Google Germany (gl=de, hl=de) ve Gutefrage.net/Med1 tartışmalarını canlı çeker.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

function getConfig() {
  try {
    const configPath = path.join(__dirname, '../../config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err) {
    console.error('Config okuma hatası:', err.message);
  }
  return {};
}

const { parseRelativeDate } = require('../core/dateUtils');

const googleSerpScraper = {
  async scan() {
    const config = getConfig();
    const serpApiKey = process.env.SERPAPI_KEY || config.api_keys?.serpapi_key;
    const rawItems = [];

    if (!serpApiKey) {
      return rawItems;
    }

    // 🎯 Son 90 gün (3 Ay) Tarih Aralığı Hesabı (Google cdr formatı: MM/DD/YYYY)
    const now = new Date();
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);
    const formatDate = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
    const cdrParam = `cdr:1,cd_min:${formatDate(ninetyDaysAgo)},cd_max:${formatDate(now)}`;

    // Hedef DACH ve Avrupa doğrudan hasta arama sorguları
    const queries = [
      'site:reddit.com/r/FragReddit Zahnarzt Ausland OR Kosten',
      'site:reddit.com/r/Austria Zahnarzt Ausland OR Türkei',
      'site:reddit.com/r/askdentists Turkey teeth implants',
      'site:reddit.com/r/de Zahnarzt teuer Kosten'
    ];

    const promoterKeywords = [
      'deinzahnteam', 'prof.dr.', 'dr. med.', 'unsere praxis', 'unser team', 'wir bieten',
      'termin vereinbaren', 'jetzt unverbindlich', 'qualit\u00e4t vor preis'
    ];

    for (const qText of queries) {
      try {
        const query = encodeURIComponent(qText);
        const url = `https://serpapi.com/search.json?q=${query}&engine=google&gl=de&hl=de&tbs=qdr:m3&num=10&api_key=${serpApiKey}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const results = data.organic_results || [];

          for (const item of results) {
            // Sadece Reddit veya soru bağlantıları
            if (!item.link || !item.link.includes('reddit.com/r/')) continue;

            const combinedText = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();

            // 🛑 1. Reklamcı / Klinik / Tanıtıcı Kontrolü
            let isPromoter = false;
            for (const pk of promoterKeywords) {
              if (combinedText.includes(pk)) {
                isPromoter = true;
                break;
              }
            }
            if (isPromoter) continue;

            // 📅 2. Katı Tarih & Tazelik Kontrolü (Maksimum 90 Gün)
            const dateStr = (item.date || '').toLowerCase();
            if (dateStr) {
              if (
                dateStr.includes('year') || dateStr.includes('yr') || 
                dateStr.includes('jahr') || /\b(201\d|202[0-5])\b/.test(dateStr)
              ) {
                continue; // 90 günden eski sonuç elendi
              }
            }

            // Metin içinde 2 yıl önce / 4 yıl önce / 2024 / silindi / arşiv kontrolü
            const oldTimeRegex = /(?:(\d+)\s*(?:yıl|yil|sene)\s*önce)|(?:vor\s*(\d+)\s*jahren?)|(?:(\d+)\s*years?\s*ago)|(?:(\d+)\s*yrs?\s*ago)|\b(201\d|202[0-5])\b/i;
            if (oldTimeRegex.test(combinedText)) {
              continue; // Eski tarihli başlık/içerik elendi
            }
            if (
              combinedText.includes('archiviert') || 
              combinedText.includes('arşivlenmiş') || 
              combinedText.includes('[silindi]') || 
              combinedText.includes('[deleted]') ||
              combinedText.includes('[removed]')
            ) {
              continue;
            }

            // 🎯 3. Gerçek Hasta İfadesi Kontrolü (1. Tekil Şahıs)
            const hasPatientSignal = (
              combinedText.includes('ich') || combinedText.includes('mein') || 
              combinedText.includes('mir') || combinedText.includes('brauche') || 
              combinedText.includes('my') || combinedText.includes('i need') || 
              combinedText.includes('mother') || combinedText.includes('all on') || 
              combinedText.includes('kosten') || combinedText.includes('quote')
            );
            if (!hasPatientSignal) continue;

            // Kesin hesaplanan tarih
            let finalDate = new Date().toISOString();
            if (dateStr) {
              const daysMatch = dateStr.match(/(\d+)\s*(?:day|tag|gün)/);
              const weeksMatch = dateStr.match(/(\d+)\s*(?:week|woche|hafta)/);
              if (daysMatch) {
                finalDate = new Date(Date.now() - parseInt(daysMatch[1]) * 24 * 60 * 60 * 1000).toISOString();
              } else if (weeksMatch) {
                finalDate = new Date(Date.now() - parseInt(weeksMatch[1]) * 7 * 24 * 60 * 60 * 1000).toISOString();
              }
            }

            rawItems.push({
              source: 'reddit',
              source_id: `serp_${item.position || Math.random().toString(36).substring(7)}_${Buffer.from(item.link || '').toString('base64').slice(-8)}`,
              author: 'Reddit Patient',
              author_url: item.link,
              url: item.link,
              content: `${item.title}: ${item.snippet || ''}`,
              created_at: finalDate,
              location: item.link.includes('/r/Austria') ? 'Avusturya 🇦🇹' : 'Almanya 🇩🇪'
            });
          }
        }
      } catch (err) {
        console.warn('SerpApi arama uyarısı:', err.message);
      }
    }

    return rawItems;
  }
};

module.exports = googleSerpScraper;

