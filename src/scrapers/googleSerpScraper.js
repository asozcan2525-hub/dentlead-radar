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

    // Hedef DACH arama sorguları
    const queries = [
      'Zahnimplantat Türkei Erfahrungen site:gutefrage.net',
      'Zahnersatz Ausland Kosten Erfahrungen',
      'Zahnklinik Istanbul Erfahrungen site:gutefrage.net'
    ];

    for (const qText of queries) {
      try {
        const query = encodeURIComponent(qText);
        // tbs ile Google'a SADECE son 3 ayın (90 gün) sonuçlarını getirme emri veriyoruz
        const url = `https://serpapi.com/search.json?q=${query}&engine=google&gl=de&hl=de&tbs=${cdrParam}&num=10&api_key=${serpApiKey}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const results = data.organic_results || [];

          for (const item of results) {
            // 🎯 1. SERP Tarih Kontrolü
            const dateParsed = parseRelativeDate(item.date);
            if (dateParsed && !dateParsed.valid) {
              // 3 aydan veya yıldan eski içerik kesinlikle elenir!
              continue;
            }

            // 🎯 2. Snippet/Başlık İçinde Eski Yıl Kontrolü (2015-2025 tarihli eski blog/soruları yakala)
            const combinedText = `${item.title || ''} ${item.snippet || ''}`;
            const oldYearRegex = /\b(201[5-9]|202[0-5])\b/;
            if (oldYearRegex.test(combinedText) && !combinedText.includes('2026')) {
              continue; // Eski yıldan kalma konu
            }

            const finalDate = (dateParsed && dateParsed.date) ? dateParsed.date : new Date().toISOString();

            rawItems.push({
              source: 'forum',
              source_id: `serp_${item.position || Math.random().toString(36).substring(7)}_${Buffer.from(item.link || '').toString('base64').slice(-8)}`,
              author: 'Gutefrage / DACH Forum',
              author_url: item.link,
              url: item.link,
              content: `${item.title}: ${item.snippet || ''}`,
              created_at: finalDate,
              location: 'Almanya 🇩🇪'
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

