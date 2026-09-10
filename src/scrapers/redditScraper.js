/**
 * Reddit DACH & Uluslararası Diş Sağlığı Arama Modülü
 * r/FragReddit, r/de, r/Finanzen, r/Austria, r/Switzerland topluluklarını Almanca sorgularla tarar.
 */

const SUBREDDITS = ['FragReddit', 'de', 'Finanzen', 'Austria', 'Switzerland', 'askdentists'];

const GERMAN_QUERIES = [
  'Zahnimplantat OR Zahnersatz',
  'Türkei Zahnbehandlung OR "Zähne machen"',
  'Zahnarzt Kosten Ausland',
  'Veneers OR Zirkonkronen',
  'All-on-4 OR "Heil- und Kostenplan"'
];

const redditScraper = {
  async scan() {
    const rawItems = [];
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DentLeadBot/2.0 (German Dental Tourism Radar)'
    };

    for (const sub of SUBREDDITS) {
      for (const query of GERMAN_QUERIES.slice(0, 3)) {
        try {
          const encodedQuery = encodeURIComponent(query);
          const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodedQuery}&restrict_sr=1&sort=new&limit=10`;

          const res = await fetch(url, { headers });
          if (!res.ok) continue;

          const data = await res.json();
          const posts = data?.data?.children || [];

          for (const item of posts) {
            const post = item.data;
            if (!post) continue;

            const fullContent = `${post.title || ''}\n${post.selftext || ''}`.trim();
            if (fullContent.length < 20) continue;

            let detectedCountry = 'Almanya (DE)';
            if (sub === 'Austria') detectedCountry = 'Avusturya (AT)';
            else if (sub === 'Switzerland') detectedCountry = 'İsviçre (CH)';

            rawItems.push({
              source: 'reddit',
              source_id: `reddit_${post.id}`,
              author: post.author || 'reddit_user',
              author_url: `https://reddit.com/user/${post.author}`,
              url: `https://reddit.com${post.permalink}`,
              content: fullContent,
              created_at: new Date(post.created_utc * 1000).toISOString(),
              location: detectedCountry
            });
          }
        } catch (err) {
          console.warn(`Reddit r/${sub} arama uyarısı:`, err.message);
        }
      }
    }

    return rawItems;
  }
};

module.exports = redditScraper;
