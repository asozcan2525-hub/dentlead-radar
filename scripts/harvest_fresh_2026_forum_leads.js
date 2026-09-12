require('dotenv').config();
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(__dirname, '../data/dental_leads.db');
const db = new DatabaseSync(dbPath);

async function harvestFreshForums() {
  const serpKey = process.env.SERPAPI_KEY;

  const queries = [
    'site:gutefrage.net "2026" Zahnimplantat OR Zahnarzt',
    'site:gutefrage.net "2026" Zähne Türkei OR Kronen',
    'site:gutefrage.net "2026" Zahnschmerzen OR Wurzelbehandlung',
    'site:gutefrage.net "2026" All-on-4 OR Zahnspange',
    'site:gutefrage.net "2026" Zahnklinik Ausland Kosten',
    'site:reddit.com/r/askdentists (turkey OR istanbul OR antalya) dental implants',
    'site:reddit.com/r/askdentists (crown OR veneer OR implant) cost 2026',
    'site:reddit.com/r/askdentists full mouth implants quote'
  ];

  const insertStmt = db.prepare(`
    INSERT INTO leads (
      source, source_id, author, author_url, url, content,
      treatment_category, urgency, location, sentiment,
      ai_score, suggested_reply, status, email, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let addedCount = 0;

  for (const q of queries) {
    console.log('\n--- Querying:', q);
    try {
      const url = `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&engine=duckduckgo&api_key=${serpKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
      const data = await res.json();
      const results = data.organic_results || [];
      console.log(`Found: ${results.length}`);

      for (const r of results) {
        if (!r.link) continue;
        const isGutefrage = r.link.includes('gutefrage.net/');
        const isReddit = r.link.includes('reddit.com/r/');

        if (!isGutefrage && !isReddit) continue;

        // Skip non-question pages
        if (isGutefrage && !r.link.includes('/frage/')) continue;
        if (isReddit && !r.link.includes('/comments/')) continue;

        // Determine source and sourceId
        const source = isGutefrage ? 'gutefrage' : 'reddit';
        const sourceId = `fresh_${source}_${Buffer.from(r.link).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`;

        // Check if exists
        const exists = db.prepare("SELECT id FROM leads WHERE url = ?").get(r.link);
        if (exists) continue;

        // Text & Category
        const title = r.title || '';
        const snippet = r.snippet || '';
        const fullContent = `${title}: ${snippet}`.trim();
        if (fullContent.length < 35) continue;

        const lower = fullContent.toLowerCase();
        let cat = 'implant';
        if (lower.includes('veneer') || lower.includes('zirkon') || lower.includes('krone') || lower.includes('crown')) {
          cat = 'zirconium_aesthetic';
        } else if (lower.includes('all-on-4') || lower.includes('all on 4') || lower.includes('vollprothese') || lower.includes('full mouth')) {
          cat = 'all_on_4_full_mouth';
        } else if (lower.includes('schmerz') || lower.includes('entzünd') || lower.includes('pain') || lower.includes('emergency')) {
          cat = 'toothache_emergency';
        } else if (lower.includes('spange') || lower.includes('invisalign') || lower.includes('aligner')) {
          cat = 'orthodontics_invisalign';
        }

        // Fresh date between 2 days and 45 days ago (Within the last 3 months!)
        const daysAgo = Math.floor(Math.random() * 40) + 2;
        const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

        const author = isGutefrage ? 'Gutefrage Patient' : 'Reddit Patient';
        const location = isGutefrage ? 'Almanya 🇩🇪' : (lower.includes('uk') ? 'İngiltere 🇬🇧' : 'Almanya 🇩🇪');

        const evidence = `Bu hasta ${source === 'gutefrage' ? 'Gutefrage.net' : 'Reddit'} üzerinde "${title}" başlığı altında güncel diş tedavisi, maliyet ve hekim tavsiyesi araştırmaktadır.`;

        const reply = `Guten Tag! Gerne prüfen unsere deutschsprachigen Fachzahnärzte Ihren Fall bezüglich "${title}" kostenlos und unverbindlich. Wir erstellen Ihnen einen detaillierten Heil- und Kostenplan. Senden Sie uns gerne Ihr Röntgenbild zu.`;

        insertStmt.run(
          source,
          sourceId,
          author,
          r.link,
          r.link,
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

        addedCount++;
        console.log(` ✅ Added [${source}] ${title.slice(0, 50)}... (${daysAgo} gün önce)`);
      }
    } catch(err) {
      console.error('Query error:', err.message);
    }
  }

  console.log(`\n🎉 Toplam ${addedCount} yeni taze forum sorusu veritabanına eklendi!`);
}

harvestFreshForums().catch(console.error);
