const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(__dirname, '../data/dental_leads.db');
const db = new DatabaseSync(dbPath);

const exactPostUrl = 'https://www.facebook.com/groups/turkeyteeth/permalink/1586243929633555/';

db.prepare(`
  UPDATE leads 
  SET url = ?, author_url = 'https://www.facebook.com/alina.tee.33/'
  WHERE author = 'Alina Tee'
`).run(exactPostUrl);

const rows = db.prepare("SELECT id, author, url, author_url FROM leads WHERE author = 'Alina Tee'").all();
console.log('✅ Alina Tee URL başarıyla güncellendi:');
console.log(rows);
