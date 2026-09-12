const fs = require('fs');

const DENTAL_TERMS = [
  'tooth', 'teeth', 'dentist', 'dental', 'implant', 'veneer', 'crown', 'krone',
  'zahn', 'zahnarzt', 'zahnersatz', 'zahnschmerz', 'braces', 'aligner', 'invisalign',
  'gum', 'root canal', 'wurzelbehandlung', 'kiefer', 'denture', 'gebiss', 'parodont'
];

const CLINIC_EXCLUSIONS = [
  'our clinic', 'our practice', 'our team', 'we offer', 'our services',
  'unsere praxis', 'wir bieten', 'unsere leistungen', 'book an appointment',
  'termin vereinbaren', 'free consultation call', 'cleaning service', 'rescue',
  'illustrator', 'novel', 'artist', 'veterinary', 'tierarzt', 'cat', 'dog', 'pet',
  'weekly self-promo', 'graphic novel', 'portfolio', 'marketing'
];

const EXCLUDED_EMAIL_PREFIXES = [
  'info@', 'contact@', 'support@', 'sales@', 'office@', 'admin@', 'reception@',
  'service@', 'press@', 'enquiries@', 'billing@', 'hello@', 'team@', 'feedback@'
];

const EXCLUDED_EMAIL_TERMS = [
  'clinic', 'klinik', 'praxis', 'dental', 'dentist', 'zahnarzt', 'surgery', 'care', 'center', 'group'
];

function verifyPatient(candidate) {
  const title = candidate.title || '';
  const snippet = candidate.snippet || '';
  const text = (title + ' ' + snippet).toLowerCase();
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  let email = (candidate.email || (candidate.emails && candidate.emails[0]) || '').toLowerCase().trim();
  if (!email) {
    const found = (title + ' ' + snippet).match(emailRegex);
    if (found && found.length > 0) {
      email = found[0].toLowerCase().trim();
    }
  }

  // 1. Email check
  if (!email || !email.includes('@') || !email.includes('.')) {
    return { ok: false, reason: 'Geçersiz veya eksik e-posta' };
  }

  if (EXCLUDED_EMAIL_PREFIXES.some(p => email.startsWith(p))) {
    return { ok: false, reason: `İşletme/kurumsal e-posta öneki: ${email}` };
  }

  const emailUsername = email.split('@')[0];
  if (EXCLUDED_EMAIL_TERMS.some(term => emailUsername.includes(term))) {
    return { ok: false, reason: `E-postada klinik/doktor emaresi: ${email}` };
  }

  // 2. Title must be related to dentistry / teeth
  const titleLower = title.toLowerCase();
  const hasDentalTitle = DENTAL_TERMS.some(term => titleLower.includes(term));
  if (!hasDentalTitle) {
    return { ok: false, reason: `Başlık diş konusuyla ilgili değil: "${title}"` };
  }

  // 3. Must not be a business / marketing post
  for (const excl of CLINIC_EXCLUSIONS) {
    if (text.includes(excl) && !text.includes('my dentist') && !text.includes('mein zahnarzt')) {
      return { ok: false, reason: `Klinik/pazarlama veya alakasız içerik tespiti: "${excl}"` };
    }
  }

  // 4. Must show patient problem / intent
  const patientIntentMatchers = [
    { regex: /(my teeth|my tooth|mein zahn|meine zähne)/i, label: 'Kendi diş sorunu' },
    { regex: /(need (a )?dentist|looking for (a )?dentist|suche zahnarzt|brauche zahnarzt)/i, label: 'Diş hekimi arayışı' },
    { regex: /(toothache|zahnschmerz|pain|ağrı|schwellung|abszess)/i, label: 'Diş ağrısı/enfeksiyon' },
    { regex: /(implant|zahnimplantat|all on 4|all-on-4|all-on-6)/i, label: 'İmplant / All-on-4 ihtiyacı' },
    { regex: /(veneer|crown|krone|zirkon|zahnersatz)/i, label: 'Kaplama / Kron / Protez' },
    { regex: /(cost|kostenvoranschlag|quote|heil- und kostenplan|too expensive|teuer)/i, label: 'Maliyet ve fiyat şikayeti' },
    { regex: /(turkey|türkei|ausland|abroad|istanbul)/i, label: 'Yurt dışı / Türkiye tedavisi araştırması' },
    { regex: /(broke|broken|fehlgeschlagen|ruined|overcharging)/i, label: 'Başarısız tedavi / Yanlış işlem mağduru' }
  ];

  const matchedIntents = patientIntentMatchers.filter(m => m.regex.test(text)).map(m => m.label);

  if (matchedIntents.length === 0) {
    return { ok: false, reason: 'Hasta niyet veya sorun ifadesi bulunamadı' };
  }

  // Determine Category
  let category = 'general_checkup';
  let urgency = 'medium';

  if (/all on 4|all-on-4|all-on-6|full mouth|komplettsanierung/i.test(text)) {
    category = 'all_on_4_full_mouth';
    urgency = 'critical';
  } else if (/implant|zahnimplantat/i.test(text)) {
    category = 'implant';
    urgency = 'high';
  } else if (/veneer|crown|krone|zirkon/i.test(text)) {
    category = 'zirconium_aesthetic';
    urgency = 'high';
  } else if (/aligner|invisalign|brace|zahnspange/i.test(text)) {
    category = 'orthodontics_invisalign';
    urgency = 'medium';
  } else if (/toothache|zahnschmerz|abszess|pain|emergency|notfall/i.test(text)) {
    category = 'toothache_emergency';
    urgency = 'critical';
  }

  // Evidence reason explanation
  const evidenceReason = `Bu hasta "${title}" başlığında paylaştığı gönderide (${matchedIntents.join(', ')}) ihtiyacını belirtmiş ve doğrudan iletişim için e-posta adresi bırakmıştır.`;

  return {
    ok: true,
    email,
    category,
    urgency,
    matchedIntents,
    evidenceReason,
    link,
    title,
    snippet
  };
}

module.exports = { verifyPatient };

if (require.main === module) {
  const raw = JSON.parse(fs.readFileSync('scratch_harvested_patient_emails.json', 'utf8'));
  console.log(`Toplam taranan ham kayıt: ${raw.length}`);
  let verified = 0;
  raw.forEach((r, i) => {
    const res = verifyPatient(r);
    if (res.ok) {
      verified++;
      console.log(`\n[${verified}] ✅ KANITLI HASTA: ${res.email}`);
      console.log(`     🔗 Link: ${res.link}`);
      console.log(`     📝 Başlık: ${res.title}`);
      console.log(`     🎯 Teşhis/İhtiyaç: ${res.category} (${res.urgency})`);
      console.log(`     📌 Gerekçe: ${res.evidenceReason}`);
      console.log(`     💬 Kanıt Metni: "${res.snippet.substring(0, 110)}..."`);
    }
  });
  console.log(`\n======================================================`);
  console.log(`Doğrulanmış Kanıtlı Hasta Sayısı: ${verified} / ${raw.length}`);
}
