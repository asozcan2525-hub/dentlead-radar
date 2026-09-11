/**
 * X (Twitter) DACH Bölgesi (Almanya, Avusturya, İsviçre) Sağlık Turizmi Tarayıcısı
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

const twitterScraper = {
  async scan() {
    const config = getConfig();
    const rapidApiKey = process.env.RAPIDAPI_KEY || config.api_keys?.rapidapi_key;
    const bearerToken = process.env.TWITTER_BEARER_TOKEN || config.api_keys?.twitter_bearer_token;

    const rawItems = [];

    // 1. RapidAPI Twitter Scraper (Almanca ve DACH odaklı arama)
    if (rapidApiKey) {
      try {
        const query = encodeURIComponent('(Zahnimplantat OR Zahnersatz OR "Zähne Türkei" OR "Zahnarzt Kosten" OR Veneers) lang:de -is:retweet');
        const url = `https://twitter154.p.rapidapi.com/search/search?query=${query}&section=top&min_likes=0&limit=20`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'x-rapidapi-key': rapidApiKey,
            'x-rapidapi-host': 'twitter154.p.rapidapi.com'
          }
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const results = data?.results || [];

          for (const tweet of results) {
            rawItems.push({
              source: 'twitter',
              source_id: `tw_${tweet.tweet_id || tweet.id_str}`,
              author: tweet.user?.username || tweet.username || 'twitter_de',
              author_url: `https://x.com/${tweet.user?.username || tweet.username}`,
              url: `https://x.com/${tweet.user?.username}/status/${tweet.tweet_id || tweet.id_str}`,
              content: tweet.text || tweet.full_text || '',
              created_at: tweet.created_at ? new Date(tweet.created_at).toISOString() : new Date().toISOString(),
              location: tweet.user?.location || 'Almanya (DE)'
            });
          }
          return rawItems;
        }
      } catch (err) {
        console.warn('RapidAPI Twitter tarama hatası:', err.message);
      }
    }

    // 2. Resmi Twitter API v2
    if (bearerToken) {
      try {
        const query = encodeURIComponent('(Zahnimplantat OR Zahnersatz OR "Zähne machen" OR "Zahnklinik Türkei") lang:de -is:retweet');
        const url = `https://api.twitter.com/2/tweets/search/recent?query=${query}&tweet.fields=created_at,author_id&expansions=author_id&user.fields=username,location&max_results=20`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${bearerToken}` }
        });

        if (res.ok) {
          const data = await res.json();
          const tweets = data.data || [];
          const users = new Map((data.includes?.users || []).map(u => [u.id, u]));

          for (const t of tweets) {
            const user = users.get(t.author_id) || {};
            rawItems.push({
              source: 'twitter',
              source_id: `tw_${t.id}`,
              author: user.username || 'twitter_user',
              author_url: `https://x.com/${user.username}`,
              url: `https://x.com/${user.username}/status/${t.id}`,
              content: t.text,
              created_at: t.created_at || new Date().toISOString(),
              location: user.location || 'Almanya (DE)'
            });
          }
          return rawItems;
        }
      } catch (err) {
        console.warn('Twitter Bearer Token tarama hatası:', err.message);
      }
    }

    return rawItems;
  }
};

module.exports = twitterScraper;
