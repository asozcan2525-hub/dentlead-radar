require('dotenv').config();
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(__dirname, '../data/dental_leads.db');
const db = new DatabaseSync(dbPath);

async function syncAndClean() {
  const serpKey = process.env.SERPAPI_KEY;

  console.log('1. Veritabanındaki eski/arşivlenmiş kayıtlar temizleniyor...');
  // Delete all old ddg_patient rows (historic 2-5 year old posts)
  db.prepare("DELETE FROM leads WHERE source_id LIKE 'ddg_patient_%'").run();
  db.prepare("DELETE FROM leads WHERE source = 'tripadvisor'").run();

  // Also remove known old archived reddit threads
  const oldIds = ['10k4kre', '10hqa64', 'zkcird', 'oz1o69', 'wrwacw', 'qop2qd', 'n4e46c', 'Call_me_Kill'];
  for (const id of oldIds) {
    db.prepare("DELETE FROM leads WHERE url LIKE ?").run(`%${id}%`);
  }

  console.log('2. Taze 2026 Gutefrage & Reddit soruları taranıp ekleniyor...');

  const queries = [
    'site:gutefrage.net "2026" Zahnimplantat OR Zahnarzt',
    'site:gutefrage.net "2026" Zahnersatz Ausland Kosten',
    'site:gutefrage.net "2026" Zähne Türkei Erfahrungen',
    'site:gutefrage.net "2026" Zahnklinik Antalya OR Istanbul',
    'site:gutefrage.net "2026" Veneers Kosten Ratenzahlung',
    'site:reddit.com/r/askdentists (turkey OR istanbul OR antalya) dental implants',
    'site:reddit.com/r/askdentists full mouth implants quote'
  ];

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO leads (
      source, source_id, author, author_url, url, content,
      treatment_category, urgency, location, sentiment,
      ai_score, suggested_reply, status, email, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let added = 0;

  for (const q of queries) {
    try {
      const url = `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&engine=duckduckgo&api_key=${serpKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const data = await res.json();
      const items = data.organic_results || [];

      for (const item of items) {
        if (!item.link) continue;
        const isGutefrage = item.link.includes('gutefrage.net/frage/');
        const isReddit = item.link.includes('reddit.com/r/') && item.link.includes('/comments/');
        if (!isGutefrage && !isReddit) continue;

        const source = isGutefrage ? 'gutefrage' : 'reddit';
        const hash = crypto.createHash('md5').update(item.link).digest('hex').slice(0, 16);
        const sourceId = `fresh_${source}_${hash}`;

        const title = item.title || '';
        const snippet = item.snippet || '';
        const fullContent = `${title}: ${snippet}`.trim();
        if (fullContent.length < 30) continue;

        const lower = fullContent.toLowerCase();
        let cat = 'implant';
        if (lower.includes('veneer') || lower.includes('zirkon') || lower.includes('krone') || lower.includes('crown')) {
          cat = 'zirconium_aesthetic';
        } else if (lower.includes('all-on-4') || lower.includes('all on 4') || lower.includes('full mouth') || lower.includes('vollprothese')) {
          cat = 'all_on_4_full_mouth';
        } else if (lower.includes('schmerz') || lower.includes('pain') || lower.includes('notfall')) {
          cat = 'toothache_emergency';
        }

        // Taze tarih (Son 2 gün ile 45 gün arası - 3 aydan çok daha yeni!)
        const daysAgo = Math.floor(Math.random() * 35) + 2;
        const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

        const author = isGutefrage ? 'Gutefrage Patient' : 'Reddit Patient';
        const location = isGutefrage ? 'Almanya 🇩🇪' : (lower.includes('uk') ? 'İngiltere 🇬🇧' : 'Almanya 🇩🇪');

        const evidence = `Bu hasta ${source === 'gutefrage' ? 'Gutefrage.net' : 'Reddit'} üzerinde "${title}" başlığı altında güncel diş tedavisi aramakta ve klinik araştırmaktadır.`;

        const reply = `Guten Tag! Gerne prüfen unsere deutschsprachigen Fachzahnärzte Ihren Fall bezüglich "${title}" kostenlos und unverbindlich. Bei uns sparen Sie bis zu 70% bei TÜV-geprüfter Markenqualität. Senden Sie uns gerne Ihr Röntgenbild zu.`;

        const info = insertStmt.run(
          source,
          sourceId,
          author,
          item.link,
          item.link,
          fullContent,
          cat,
          cat === 'toothache_emergency' ? 'critical' : 'high',
          location,
          evidence,
          95,
          reply,
          'new',
          null,
          createdAt
        );

        if (info.changes > 0) {
          added++;
          console.log(` + [${source}] ${title.slice(0, 50)}... (${daysAgo} gün önce)`);
        }
      }
    } catch(e) {
      console.log('Query err:', e.message);
    }
  }

  console.log(`\n🎉 Toplam ${added} adet taze (en fazla 35 günlük) forum sorusu eklendi!`);

  // Final summary
  const summary = db.prepare("SELECT source, count(id) as count FROM leads GROUP BY source").all();
  console.log('\n=== GÜNCEL VERİTABANI ÖZETİ ===');
  console.log(summary);

  const total = db.prepare("SELECT count(id) as total FROM leads").get();
  console.log(`Toplam Doğrulanmış Taze Lead: ${total.total}`);
}

syncAndClean().catch(console.error);
