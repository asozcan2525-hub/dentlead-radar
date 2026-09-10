/**
 * Google Arama & Soru Portalları (SERP) Modülü
 * SerpApi veya Google Custom Search API tanımlandığında son tartışmaları çeker.
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

    try {
      const query = encodeURIComponent('"diş hekimi tavsiyesi" OR "implant yaptıranlar" OR "dişim ağrıyor" site:forum.donanimhaber.com OR site:kizlarsoruyor.com OR site:doktortakvimi.com');
      const url = `https://serpapi.com/search.json?q=${query}&tbm=nws&api_key=${serpApiKey}&num=10&gl=tr&hl=tr`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const results = data.organic_results || data.news_results || [];

        for (const item of results) {
          rawItems.push({
            source: 'google',
            source_id: `google_${item.position || Math.random().toString(36).substring(7)}`,
            author: item.source || 'Açık Tartışma',
            author_url: item.link,
            url: item.link,
            content: `${item.title}: ${item.snippet || ''}`,
            created_at: new Date().toISOString(),
            location: 'Türkiye'
          });
        }
      }
    } catch (err) {
      console.warn('SerpApi arama uyarısı:', err.message);
    }

    return rawItems;
  }
};

module.exports = googleSerpScraper;
