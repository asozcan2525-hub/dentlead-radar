const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const db = new DatabaseSync(path.join(__dirname, '../data/dental_leads.db'));

const before = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;
console.log('Total leads before purge:', before);

// Delete all unverified forum entries from reddit, gutefrage
const deleted = db.prepare("DELETE FROM leads WHERE source IN ('reddit', 'gutefrage', 'gutefrage.net', 'forums', 'tripadvisor')").run();
console.log('Deleted unverified forum records:', deleted.changes);

const after = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;
console.log('Total leads after purge:', after);

const sources = db.prepare('SELECT source, COUNT(*) as count FROM leads GROUP BY source').all();
console.log('Remaining verified leads by source:', sources);
