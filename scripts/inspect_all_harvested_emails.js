const fs = require('fs');

const data = JSON.parse(fs.readFileSync('scratch_new_serp_harvest.json', 'utf8'));
const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;

console.log('Total items in scratch_new_serp_harvest.json:', data.length);
let found = 0;
for (const item of data) {
  const text = `${item.title || ''} ${item.snippet || ''}`;
  const emails = text.match(emailRegex);
  if (emails) {
    found++;
    console.log(`[${found}] ${emails.join(', ')}`);
    console.log(`    Title: ${item.title}`);
    console.log(`    Link: ${item.link}`);
    console.log(`    Snippet: ${item.snippet}\n`);
  }
}
