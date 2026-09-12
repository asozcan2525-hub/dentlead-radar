const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(__dirname, '../data/dental_leads.db');
const db = new DatabaseSync(dbPath);

const sources = db.prepare("SELECT source, count(id) as count FROM leads GROUP BY source").all();
console.log('Sources breakdown:', sources);

const ddgPatients = db.prepare("SELECT count(id) as count FROM leads WHERE source_id LIKE 'ddg_patient_%'").get();
console.log('ddg_patient leads count:', ddgPatients.count);

const sampleUrls = db.prepare("SELECT id, source, url FROM leads WHERE source IN ('reddit', 'gutefrage', 'gutefrage.net', 'tripadvisor') LIMIT 20").all();
console.log('\nSample forum URLs:');
for (const s of sampleUrls) {
  console.log(`ID: ${s.id} | Source: ${s.source} | URL: ${s.url}`);
}
