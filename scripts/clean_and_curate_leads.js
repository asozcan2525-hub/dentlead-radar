const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(__dirname, '../data/dental_leads.db');
const db = new DatabaseSync(dbPath);

console.log('🧹 LİSTE TEMİZLİK VE KALİTE KÜRASYONU BAŞLADI...');

// 1. Bilinen spam ve alakasız adayları sil
const deleteStmt = db.prepare('DELETE FROM leads WHERE id = ?');
const allLeads = db.prepare('SELECT * FROM leads').all();

let deletedCount = 0;
for (const lead of allLeads) {
  const contentLower = (lead.content || '').toLowerCase();
  const emailLower = (lead.email || '').toLowerCase();
  const titleLower = (lead.content || '').split(':')[0].toLowerCase();

  let shouldDelete = false;
  let reason = '';

  // Lula spam kontrolü
  if (emailLower.includes('lula') || contentLower.includes('lula@gmail') || contentLower.includes('falsificaram')) {
    shouldDelete = true;
    reason = 'Portekizce aşı spami (lula)';
  }
  // Hijyen öğrencisi kontrolü
  else if (emailLower.includes('az1674462') || contentLower.includes('hygiene cleaning') || contentLower.includes('hygienist')) {
    shouldDelete = true;
    reason = 'Hijyenist öğrencisi';
  }
  // Asistan mülakatı arayan
  else if (emailLower.includes('jannaschulz') || contentLower.includes('interview in dental assisting')) {
    shouldDelete = true;
    reason = 'Asistan mülakatı';
  }
  // Ekipman / maske satıcısı
  else if (contentLower.includes('n95 masks') || contentLower.includes('schick 33 sensors')) {
    shouldDelete = true;
    reason = 'Dental ekipman/maske';
  }
  // Klinik pazarlaması
  else if (emailLower.includes('nuglowaesthetics') || contentLower.includes('guidofamilydentistry') || contentLower.includes('turkeydentalcentre')) {
    shouldDelete = true;
    reason = 'Klinik pazarlaması';
  }
  // Alakasız içerik (otel, sadece tren bileti vb.)
  else if (contentLower.includes('business hotels') && !contentLower.includes('dental implant')) {
    shouldDelete = true;
    reason = 'Otel/Turizm ilanı';
  }

  if (shouldDelete) {
    deleteStmt.run(lead.id);
    deletedCount++;
    console.log(`   ❌ SİLİNDİ [ID: ${lead.id}] ${reason} -> ${lead.email || lead.author}`);
  }
}

console.log(`Toplam silinen alakasız/spam kayıt: ${deletedCount}`);

// 2. Yazar isimlerini temizle (@@Patient -> Patient, r/Dentistry -> Patient)
const updateAuthorStmt = db.prepare('UPDATE leads SET author = ? WHERE id = ?');
const leadsAfter = db.prepare('SELECT id, author, source FROM leads').all();
for (const l of leadsAfter) {
  let author = l.author || 'Patient';
  if (author.startsWith('@')) author = author.replace(/^@+/, '');
  if (author === 'rDentistry' || author === 'raskdentists' || author === 'askdentists' || author === 'Dentistry') {
    author = `Patient_${l.source.toUpperCase()}_${l.id}`;
  }
  if (author.length < 2) author = `Patient_${l.id}`;
  updateAuthorStmt.run(author, l.id);
}

// 3. E-Postalı hastaları pure_verified_patient_leads.json dosyasına senkronize et
const emailLeads = db.prepare("SELECT * FROM leads WHERE email IS NOT NULL AND email != ''").all();
const emailList = emailLeads.map(l => ({
  id: l.id,
  email: l.email,
  author: l.author,
  url: l.url,
  platform: l.source,
  category: l.treatment_category,
  urgency: l.urgency,
  evidenceReason: l.sentiment,
  created_at: l.created_at,
  location: l.location
}));

fs.writeFileSync(path.join(__dirname, '../data/pure_verified_patient_leads.json'), JSON.stringify(emailList, null, 2));

const totalAfter = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;
console.log('\n======================================================');
console.log(`✅ TEMİZLİK TAMAMLANDI!`);
console.log(`   - Güncel Temiz Hasta Sayısı: ${totalAfter}`);
console.log(`   - Doğrulanmış E-Postalı Hasta Sayısı: ${emailLeads.length}`);
console.log(`   - pure_verified_patient_leads.json güncellendi.`);
console.log('======================================================\n');
