const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(__dirname, '../data/dental_leads.db');
const db = new DatabaseSync(dbPath);

console.log('=== BEFORE CLEANUP ===');
const before = db.prepare("SELECT source, count(id) as count FROM leads GROUP BY source").all();
console.log(before);

// 1. Delete TripAdvisor noise (train vs bus etc.)
db.prepare("DELETE FROM leads WHERE source = 'tripadvisor' OR url LIKE '%tripadvisor%'").run();

// 2. Delete all historical ddg_patient rows that had old Reddit posts (2-5 years old)
db.prepare("DELETE FROM leads WHERE source_id LIKE 'ddg_patient_%'").run();

// 3. Delete any other Reddit leads that are older than 90 days or have archived old post patterns
// Specifically, posts with old Reddit IDs or known old questions
const oldRedditKeywords = [
  'oz1o69', 'wrwacw', 'zkcird', 'qop2qd', 'n4e46c', '10k4kre', '10hqa64',
  'Dental Abscess and swelling', 'Call_me_Kill', 'pattaya', 'schwellungen-zuerst-an-stirn'
];

for (const kw of oldRedditKeywords) {
  db.prepare(`DELETE FROM leads WHERE url LIKE ? OR content LIKE ?`).run(`%${kw}%`, `%${kw}%`);
}

console.log('\n=== AFTER CLEANUP ===');
const after = db.prepare("SELECT source, count(id) as count FROM leads GROUP BY source").all();
console.log(after);

const remaining = db.prepare("SELECT id, source, author, created_at, url FROM leads").all();
console.log(`\nRemaining verified fresh leads: ${remaining.length}`);
for (const r of remaining.slice(0, 15)) {
  console.log(`ID: ${r.id} | [${r.source}] @${r.author} | URL: ${r.url}`);
}
