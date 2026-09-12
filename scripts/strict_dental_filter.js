const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, '../data/dental_leads.db');
const db = new DatabaseSync(dbPath);

console.log('🛡️ KATI DİŞ SAĞLIĞI VE HASTA DENETİMİ BAŞLATILIYOR...');

const STRICT_DENTAL_REGEX = /(zahn|zähne|zahnarzt|zahnersatz|zahnspange|zahnimplantat|implant|kronen|krone|veneer|all on|all-on|invisalign|aligner|dentist|dental|teeth|tooth|root canal|wurzelbehandlung|hollywood smile|kiefer|karies|zahnschmerz)/i;

const NON_DENTAL_BLACKLIST = [
  'wolfcut', 'candida', 'nagelbettentzündung', 'lymphknoten', 'serienschalter',
  'ameisenbiss', 'gelnägel', 'lohnbooster', 'speckkäfer', 'furchtbarsten jobs',
  'dümmsten sachen', 'dinge in deutschland', 'schwerste schaden', 'deutsch sprechen beim arzt',
  'gesellschaftspolit', 'wie lohnt sich das', 'was läuft in deutschland',
  'n95 masks', 'schick 33', 'twin flash', 'dental school has failed', 'hotel', 'grill',
  'bed and breakfast', 'airside', 'vacina', 'lula', 'hygiene cleaning'
];

const rows = db.prepare('SELECT id, author, url, email, content, sentiment FROM leads').all();
const deleteStmt = db.prepare('DELETE FROM leads WHERE id = ?');

let removed = 0;
let kept = 0;

for (const row of rows) {
  const text = `${row.content || ''} ${row.url || ''} ${row.sentiment || ''}`.toLowerCase();
  
  // 1. Blacklist check
  const hasBlacklist = NON_DENTAL_BLACKLIST.some(b => text.includes(b));
  // 2. Must match dental keywords in content or title
  const hasDental = STRICT_DENTAL_REGEX.test(row.content);

  if (hasBlacklist || !hasDental) {
    deleteStmt.run(row.id);
    removed++;
    console.log(`❌ SİLİNDİ: [ID ${row.id}] ${row.content.substring(0, 70)}...`);
  } else {
    kept++;
  }
}

console.log('\n======================================================');
console.log(`✅ KATI TEMİZLİK BİTTİ!`);
console.log(`   - Silinen İlgisiz Konular: ${removed}`);
console.log(`   - Kalan %100 GERÇEK DİŞ HASTALARI: ${kept}`);
console.log('======================================================\n');
