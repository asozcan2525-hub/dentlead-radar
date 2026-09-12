const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(__dirname, '../data/dental_leads.db');
const db = new DatabaseSync(dbPath);

const pureList = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/pure_verified_patient_leads.json'), 'utf8'));
const existingRows = db.prepare('SELECT email, url FROM leads WHERE email IS NOT NULL').all();
const existingEmails = new Set(existingRows.map(r => r.email.toLowerCase()));

const insertStmt = db.prepare(`
  INSERT INTO leads (
    source, source_id, author, author_url, url, content,
    treatment_category, urgency, location, sentiment,
    ai_score, suggested_reply, status, email, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let readded = 0;
for (const p of pureList) {
  if (!existingEmails.has(p.email.toLowerCase())) {
    const sourceId = `email_patient_${Buffer.from(p.email).toString('base64').replace(/=/g, '')}_${Date.now()}`;
    const suggestedReply = `Guten Tag! Gerne bieten unsere deutschsprachigen Fachärzte für Zahnmedizin und Implantologie in Istanbul eine kostenlose, unverbindliche Vorab-Beratung auf Deutsch an. Senden Sie uns gerne Ihre Röntgenaufnahme zu.`;

    insertStmt.run(
      p.platform || 'reddit',
      sourceId,
      p.author || 'Patient',
      p.url,
      p.url,
      `${p.title || 'Diş Danışma'}: ${p.content || ''}`,
      p.category || 'general_checkup',
      p.urgency || 'high',
      p.location || 'Almanya 🇩🇪',
      p.evidenceReason,
      95,
      suggestedReply,
      'new',
      p.email,
      p.created_at || new Date().toISOString()
    );
    existingEmails.add(p.email.toLowerCase());
    readded++;
    console.log(`Re-added verified email patient: ${p.email}`);
  }
}

const totalNow = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;
const emailsNow = db.prepare("SELECT COUNT(*) as c FROM leads WHERE email IS NOT NULL AND email != ''").get().c;
console.log(`Total Leads: ${totalNow}, Total Email Leads: ${emailsNow}`);
