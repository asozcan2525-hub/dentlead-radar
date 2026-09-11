/**
 * Google Arama & DACH Forum Portalları (SERP) Modülü
 * SerpApi ile Google Germany (gl=de, hl=de) ve Gutefrage.net/Med1 tartışmalarını canlı çeker.
 */

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

const googleSerpScraper = {
  async scan() {
    const config = getConfig();
    const serpApiKey = process.env.SERPAPI_KEY || config.api_keys?.serpapi_key;
    const rawItems = [];

    if (!serpApiKey) {
      return rawItems;
    }

    // Hedef DACH arama sorguları
    const queries = [
      '(Zahnimplantat OR Zahnersatz OR Zahnklinik) (Türkei OR Istanbul) site:gutefrage.net',
      '(Zahnbehandlung OR Zahnimplantate) Ausland Erfahrungen site:gutefrage.net'
    ];

    for (const qText of queries) {
      try {
        const query = encodeURIComponent(qText);
        const url = `https://serpapi.com/search.json?q=${query}&engine=google&gl=de&hl=de&num=10&api_key=${serpApiKey}`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const results = data.organic_results || [];

          for (const item of results) {
            rawItems.push({
              source: 'forum',
              source_id: `serp_${item.position || Math.random().toString(36).substring(7)}_${Buffer.from(item.link || '').toString('base64').slice(-8)}`,
              author: 'Gutefrage / DACH Forum',
              author_url: item.link,
              url: item.link,
              content: `${item.title}: ${item.snippet || ''}`,
              created_at: new Date().toISOString(),
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

