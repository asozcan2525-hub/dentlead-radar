const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(__dirname, '../data/dental_leads.db');
const db = new DatabaseSync(dbPath);

const target = db.prepare("SELECT * FROM leads WHERE author LIKE '%Call_me_Kill%' OR content LIKE '%Dental Abscess%'").all();
console.log('Target lead found:', target);

const redditLeads = db.prepare("SELECT id, author, url, created_at FROM leads WHERE source = 'reddit' LIMIT 15").all();
console.log('\nSample Reddit Leads:');
for (const r of redditLeads) {
  console.log(`ID: ${r.id} | Author: ${r.author} | URL: ${r.url} | DB Date: ${r.created_at}`);
}
