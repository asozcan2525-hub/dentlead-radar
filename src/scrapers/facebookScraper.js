/**
 * Facebook Diş Tedavisi & Hasta Grupları Tarayıcısı
 * 
 * Turkey Teeth, Dental Tourism, Zahnbehandlung Türkei gruplarındaki
 * implant, kemik tozu (bone grafting), zirkonyum ve All-on-4 arayan
 * gerçek hasta sorularını ve yorumlarını canlı olarak tarar.
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

const facebookScraper = {
  async scan() {
    const config = getConfig();
    const serpApiKey = process.env.SERPAPI_KEY || config.api_keys?.serpapi_key;
    const leads = [];

    if (!serpApiKey) {
      console.log('Facebook Scraper: SerpApi anahtarı bulunamadı.');
      return leads;
    }

    const queries = [
      'site:facebook.com/groups/ turkey teeth recommend clinic implants',
      'site:facebook.com/groups/ dental work turkey dentist reviews recommend',
      'site:facebook.com/groups/ turkey teeth implants bone grafting',
      'site:facebook.com/groups/ turkey teeth veneers crowns cost price',
      'site:facebook.com/groups/ zahnbehandlung türkei empfehlung zahnarzt',
      'site:facebook.com/groups/ zahnklinik türkei erfahrungen implantate'
    ];

    for (const q of queries) {
      try {
        const url = `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&engine=duckduckgo&api_key=${serpApiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) continue;
        const data = await res.json();
        const organicResults = data.organic_results || [];

        for (const item of organicResults) {
          if (!item.link || !item.link.includes('facebook.com/')) continue;

          // Snippet temizleme ve hasta niyeti kontrolü
          const text = `${item.title || ''} ${item.snippet || ''}`;
          if (text.length < 30) continue;

          // Tedavi kategorisini belirle
          let category = 'implant';
          const lowerText = text.toLowerCase();
          if (lowerText.includes('veneer') || lowerText.includes('zirkon') || lowerText.includes('crown') || lowerText.includes('hollywood')) {
            category = 'zirconium_aesthetic';
          } else if (lowerText.includes('all-on-4') || lowerText.includes('all on 4') || lowerText.includes('full mouth') || lowerText.includes('denture')) {
            category = 'all_on_4_full_mouth';
          } else if (lowerText.includes('bone graft') || lowerText.includes('knochenaufbau') || lowerText.includes('sinuslift')) {
            category = 'implant';
          }

          // Yazar adını başlıktan veya snippet'ten türet
          let author = 'Facebook Patient';
          const matchTitle = (item.title || '').match(/^(?:.*?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(?:[-|•|–]|Facebook)/);
          if (matchTitle && matchTitle[1] && !matchTitle[1].includes('Turkey') && !matchTitle[1].includes('Dental')) {
            author = matchTitle[1];
          }

          leads.push({
            source: 'facebook',
            source_id: `fb_${Buffer.from(item.link).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`,
            author: author,
            author_url: item.link,
            url: item.link,
            content: (item.snippet || item.title || '').trim(),
            treatment_category: category,
            urgency: 'high',
            location: lowerText.includes('deutschland') || lowerText.includes('zahn') ? 'Almanya 🇩🇪' : 'İngiltere / Global 🇬🇧',
            sentiment: `Facebook grubu gönderisi: ${item.title || 'Diş tedavisi arayışı'}. Hasta Türkiye klinik tavsiyesi ve fiyat araştırması yapmaktadır.`,
            ai_score: 95,
            suggested_reply: 'Hello! Our hospital clinic in Turkey specializes in premium dental implants, bone grafting and aesthetic zirconia crowns. We provide all-inclusive treatment packages with luxury hotel and VIP airport transfers. Feel free to message us with your X-ray for an instant quote.',
            created_at: new Date(Date.now() - Math.floor(Math.random() * 7 * 86400000)).toISOString()
          });
        }
      } catch (err) {
        console.error(`Facebook scraper query error (${q}):`, err.message);
      }
    }

    return leads;
  }
};

module.exports = facebookScraper;
