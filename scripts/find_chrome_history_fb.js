const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const historyPath = 'C:\\Users\\asozc\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\History';
const tempHistory = path.join(__dirname, '../data/temp_chrome_history');

if (fs.existsSync(historyPath)) {
  try {
    fs.copyFileSync(historyPath, tempHistory);
    const db = new DatabaseSync(tempHistory);
    const rows = db.prepare("SELECT url, title FROM urls WHERE url LIKE '%facebook.com/groups/%' ORDER BY id DESC LIMIT 30").all();
    console.log(`Found ${rows.length} Facebook URLs in Chrome History:`);
    for (const r of rows) {
      console.log(`TITLE: ${r.title}`);
      console.log(`URL: ${r.url}\n`);
    }
  } catch (err) {
    console.error('History read error:', err.message);
  } finally {
    try { fs.unlinkSync(tempHistory); } catch(e) {}
  }
} else {
  console.log('History file not found at:', historyPath);
}
