const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const db = new DatabaseSync(path.join(__dirname, '../data/dental_leads.db'));

db.prepare("DELETE FROM leads WHERE email LIKE ? OR author LIKE ?").run("%dentist%", "%dentist%");
const rows = db.prepare("SELECT id, author, email, location, treatment_category FROM leads WHERE email IS NOT NULL ORDER BY id ASC").all();
console.log("Final pure verified email patients count:", rows.length);
rows.forEach((r, i) => console.log((i+1) + ": @" + r.author + " (" + r.email + ") | " + r.location + " | " + r.treatment_category));
