/**
 * YouTube DACH Sağlık Turizmi Yorum Tarayıcısı
 * YouTube'daki "Zähne in der Türkei Erfahrungen", "Zahnimplantate Türkei" videolarının altındaki
 * yorumları tarar. (Alman hastaların en çok soru sorduğu ve klinik tavsiyesi istediği yerdir).
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

const SEARCH_QUERIES = [
  'Zähne Türkei Erfahrungen',
  'Zahnimplantate Türkei Kosten',
  'Veneers Türkei Erfahrung',
  'Zahnersatz Ausland Türkei'
];

const youtubeScraper = {
  async scan() {
    const config = getConfig();
    const apiKey = process.env.YOUTUBE_API_KEY || config.api_keys?.youtube_api_key;
    const rawItems = [];

    if (!apiKey) {
      return rawItems;
    }

    try {
      for (const query of SEARCH_QUERIES.slice(0, 2)) {
        // 1. İlgili Almanca videoları ara
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&relevanceLanguage=de&maxResults=5&key=${apiKey}`;
        const searchRes = await fetch(searchUrl);
        if (!searchRes.ok) continue;

        const searchData = await searchRes.json();
        const videoIds = (searchData.items || []).map(i => i.id?.videoId).filter(Boolean);

        // 2. Her videonun altındaki en güncel yorumları tara
        for (const videoId of videoIds) {
          const commentUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&order=time&key=${apiKey}`;
          const commentRes = await fetch(commentUrl);
          if (!commentRes.ok) continue;

          const commentData = await commentRes.json();
          for (const item of (commentData.items || [])) {
            const c = item.snippet?.topLevelComment?.snippet;
            if (!c) continue;

            const text = (c.textDisplay || c.textOriginal || '').trim();
            const lower = text.toLowerCase();

            // Sadece klinik soran, fiyat soran veya tedavi arayan yorumları filtrele
            if (
              lower.includes('klinik') || 
              lower.includes('arzt') || 
              lower.includes('kosten') || 
              lower.includes('preis') || 
              lower.includes('wie viel') || 
              lower.includes('empfehlen') || 
              lower.includes('kontakt') ||
              lower.includes('implantat')
            ) {
              rawItems.push({
                source: 'youtube',
                source_id: `yt_${item.id}`,
                author: c.authorDisplayName || 'YouTube_User',
                author_url: c.authorChannelUrl || `https://www.youtube.com/watch?v=${videoId}`,
                url: `https://www.youtube.com/watch?v=${videoId}&lc=${item.id}`,
                content: text,
                created_at: c.publishedAt ? new Date(c.publishedAt).toISOString() : new Date().toISOString(),
                location: 'Almanya (DE)'
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn('YouTube API tarama uyarısı:', err.message);
    }

    return rawItems;
  }
};

module.exports = youtubeScraper;
