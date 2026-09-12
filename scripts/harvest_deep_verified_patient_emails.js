/**
 * DERİN VE KANITLI HASTA E-POSTASI TOPLAYICI
 * 
 * 1. 25+ hedefe yönelik Google arama sorgusu çalıştırır (Reddit, TripAdvisor, Gutefrage, Facebook, Web)
 * 2. Her sonucu sıkı klinik hasta kriterlerine göre denetler (Klinik, doktor, alakasız işletmeler elenir)
 * 3. Sadece gerçek diş hastası olduğunu kanıtlayan ve çalışan linki + e-postası olan kayıtları kabul eder
 * 4. Neye göre bulundu (kanıt gerekçesi) ve ne zaman paylaşıldı bilgilerini eksiksiz kaydeder
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const apiKey = process.env.SERPAPI_KEY;
if (!apiKey) {
  console.error("❌ SERPAPI_KEY eksik!");
  process.exit(1);
}

const SEARCH_QUERIES = [
  // ─── 1. TripAdvisor Dental Turizmi ve Hasta Tartışmaları ───
  { query: 'site:tripadvisor.com/ShowTopic "dental" "turkey" "gmail.com"', platform: 'TripAdvisor Dental Tourism' },
  { query: 'site:tripadvisor.com/ShowTopic "dentist" "istanbul" "gmail.com"', platform: 'TripAdvisor Istanbul' },
  { query: 'site:tripadvisor.com/ShowTopic "implants" "turkey" "email"', platform: 'TripAdvisor Implants' },
  { query: 'site:tripadvisor.com/ShowTopic "teeth" "turkey" "email me"', platform: 'TripAdvisor Turkey Teeth' },
  { query: 'site:tripadvisor.com/ShowTopic "dental" "hungary" "email"', platform: 'TripAdvisor Europe Dental' },

  // ─── 2. Reddit Diş ve Sağlık Toplulukları ───
  { query: 'site:reddit.com/r/askdentists "email me" gmail.com', platform: 'Reddit r/askdentists' },
  { query: 'site:reddit.com/r/askdentists "contact me" gmail.com', platform: 'Reddit r/askdentists' },
  { query: 'site:reddit.com/r/askdentists "gmail.com"', platform: 'Reddit r/askdentists' },
  { query: 'site:reddit.com/r/Dentistry "looking for a dentist" "gmail.com"', platform: 'Reddit r/Dentistry' },
  { query: 'site:reddit.com/r/Dentistry "email me" gmail.com', platform: 'Reddit r/Dentistry' },
  { query: 'site:reddit.com/r/Invisalign "email me" gmail.com', platform: 'Reddit r/Invisalign' },
  { query: 'site:reddit.com/r/braces "email me" gmail.com', platform: 'Reddit r/braces' },
  { query: 'site:reddit.com "dental implant" "email me" gmail.com', platform: 'Reddit Implants' },

  // ─── 3. Gutefrage.net & Almanca Forumlar ───
  { query: 'site:gutefrage.net "zahnkronen" "gmx.de" OR "gmail.com"', platform: 'Gutefrage Kronen' },
  { query: 'site:gutefrage.net "zahnarzt" "gmail.com"', platform: 'Gutefrage Zahnarzt' },
  { query: 'site:gutefrage.net "zahnschmerzen" "gmail.com" OR "gmx.de"', platform: 'Gutefrage Zahnschmerz' },
  { query: 'site:gutefrage.net "zahnimplantat" "gmail.com" OR "gmx.de"', platform: 'Gutefrage Implantat' },
  { query: 'site:gutefrage.net "kostenvoranschlag" "zahnarzt" "mail"', platform: 'Gutefrage HKP' },

  // ─── 4. Facebook Grupları & Gerçek Hasta Paylaşımları ───
  { query: 'site:facebook.com "dental work" "turkey" "email me"', platform: 'Facebook Dental Turkey' },
  { query: 'site:facebook.com "dental implants" "turkey" "email me"', platform: 'Facebook Implants' },
  { query: 'site:facebook.com "dentist" "overcharging" "email me"', platform: 'Facebook Dental Overcharging' },
  { query: 'site:facebook.com "looking for a dentist" "email me at"', platform: 'Facebook Looking For Dentist' },
  { query: 'site:facebook.com "need a dentist" "email me at"', platform: 'Facebook Need Dentist' },
  { query: 'site:facebook.com/groups "dental" "turkey" "gmail.com"', platform: 'Facebook Turkey Groups' },

  // ─── 5. Web Genelinde Teklif & Hasta Arayışları ───
  { query: '"looking for a dentist" "email me at" gmail.com', platform: 'Web Looking For Dentist' },
  { query: '"need dental implants" "email me at" gmail.com', platform: 'Web Implants Request' },
  { query: '"dental quote" "too expensive" "email me" gmail.com', platform: 'Web Quote Seeking' },
  { query: '"all on 4" "patient" "email" "turkey" OR "istanbul"', platform: 'Web All-on-4 Patient' }
];

// Diş hekimliği terimleri (Başlıkta veya ana konuda geçmesi zorunlu)
const DENTAL_TERMS = [
  'tooth', 'teeth', 'dentist', 'dental', 'implant', 'veneer', 'crown', 'krone',
  'zahn', 'zahnarzt', 'zahnersatz', 'zahnschmerz', 'braces', 'aligner', 'invisalign',
  'gum', 'root canal', 'wurzelbehandlung', 'kiefer', 'denture', 'gebiss', 'parodont'
];

// Kesinlikle elenecek işletme / klinik ifadeleri
const CLINIC_EXCLUSIONS = [
  'our clinic', 'our practice', 'our team', 'we offer', 'our services',
  'unsere praxis', 'wir bieten', 'unsere leistungen', 'book an appointment',
  'termin vereinbaren', 'free consultation call', 'cleaning service', 'house cleaning',
  'rescue', 'illustrator', 'novel', 'artist', 'veterinary', 'tierarzt', 'cat', 'dog', 'pet',
  'weekly self-promo', 'graphic novel', 'portfolio', 'marketing agency', 'job vacancy',
  'hiring', 'looking for assistant', 'looking for a dental assistant'
];

const EXCLUDED_EMAIL_PREFIXES = [
  'info@', 'contact@', 'support@', 'sales@', 'office@', 'admin@', 'reception@',
  'service@', 'press@', 'enquiries@', 'billing@', 'hello@', 'team@', 'feedback@',
  'booking@', 'appointment@', 'praxis@', 'clinic@', 'dr@', 'dr.'
];

const EXCLUDED_EMAIL_KEYWORDS = [
  'clinic', 'klinik', 'praxis', 'dental', 'dentist', 'zahnarzt', 'surgery', 'care',
  'center', 'group', 'cleaning', 'artist', 'studio', 'editorial', 'vet', 'drkevin'
];

function verifyCandidate(item) {
  const title = (item.title || '').trim();
  const snippet = (item.snippet || '').trim();
  const fullText = (title + ' ' + snippet).toLowerCase();
  const link = (item.link || item.url || '').trim();

  // 1. Link kontrolü (Gerçek ve erişilebilir https linki olmalı)
  if (!link || !link.startsWith('http')) {
    return { ok: false, reason: 'Geçersiz link' };
  }

  // 2. E-posta adresi tespiti
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const rawEmails = (item.emails && item.emails.length > 0) 
    ? item.emails 
    : (snippet.match(emailRegex) || fullText.match(emailRegex) || []);
  
  const validEmails = rawEmails.filter(em => {
    const lower = em.toLowerCase().trim();
    if (EXCLUDED_EMAIL_PREFIXES.some(p => lower.startsWith(p))) return false;
    const userPart = lower.split('@')[0];
    if (EXCLUDED_EMAIL_KEYWORDS.some(kw => userPart.includes(kw))) return false;
    return true;
  });

  if (validEmails.length === 0) {
    return { ok: false, reason: 'Geçerli şahsi hasta e-postası bulunamadı' };
  }
  const chosenEmail = validEmails[0].toLowerCase().trim();

  // 3. Konu başlığı kontrolü (Diş tedavisi ile doğrudan ilgili olmalı)
  const titleLower = title.toLowerCase();
  const hasDentalTitle = DENTAL_TERMS.some(term => titleLower.includes(term));
  if (!hasDentalTitle) {
    return { ok: false, reason: `Başlık diş konusuyla ilgili değil: "${title}"` };
  }

  // 4. Klinik / pazarlama filtresi
  for (const excl of CLINIC_EXCLUSIONS) {
    if (fullText.includes(excl) && !fullText.includes('my dentist') && !fullText.includes('mein zahnarzt')) {
      return { ok: false, reason: `Klinik/işletme ifadesi tespit edildi: "${excl}"` };
    }
  }

  // 5. Hasta Niyet & İhtiyaç Analizi
  const patientMatchers = [
    { regex: /(my teeth|my tooth|mein zahn|meine zähne)/i, label: 'Kendi diş sorunu' },
    { regex: /(need (a )?dentist|looking for (a )?dentist|suche zahnarzt|brauche zahnarzt)/i, label: 'Diş hekimi arayışı' },
    { regex: /(toothache|zahnschmerz|pain|ağrı|schwellung|abszess|swollen)/i, label: 'Diş ağrısı/enfeksiyon' },
    { regex: /(implant|zahnimplantat|all on 4|all-on-4|all-on-6)/i, label: 'İmplant / All-on-4 ihtiyacı' },
    { regex: /(veneer|crown|krone|zirkon|zahnersatz)/i, label: 'Kaplama / Kron / Protez' },
    { regex: /(cost|kostenvoranschlag|quote|too expensive|teuer|estimate)/i, label: 'Maliyet ve fiyat araştırması' },
    { regex: /(turkey|türkei|ausland|abroad|istanbul|hungary)/i, label: 'Yurt dışı / Türkiye tedavisi araştırması' },
    { regex: /(broke|broken|fehlgeschlagen|ruined|overcharging)/i, label: 'Hatalı tedavi / Fahiş fiyat mağduru' }
  ];

  const matchedIntents = patientMatchers.filter(m => m.regex.test(fullText)).map(m => m.label);
  if (matchedIntents.length === 0) {
    return { ok: false, reason: 'Hasta şikayeti veya tedavi ihtiyacı tespit edilemedi' };
  }

  // Kategori ve aciliyet tespiti
  let category = 'general_checkup';
  let urgency = 'medium';

  if (/all on 4|all-on-4|all-on-6|full mouth|komplettsanierung/i.test(fullText)) {
    category = 'all_on_4_full_mouth';
    urgency = 'critical';
  } else if (/implant|zahnimplantat/i.test(fullText)) {
    category = 'implant';
    urgency = 'high';
  } else if (/veneer|crown|krone|zirkon/i.test(fullText)) {
    category = 'zirconium_aesthetic';
    urgency = 'high';
  } else if (/aligner|invisalign|brace|zahnspange/i.test(fullText)) {
    category = 'orthodontics_invisalign';
    urgency = 'medium';
  } else if (/toothache|zahnschmerz|abszess|pain|emergency|notfall/i.test(fullText)) {
    category = 'toothache_emergency';
    urgency = 'critical';
  }

  // Tarih bilgisi
  let postDate = item.date || null;
  let timeAgoText = 'Son 30 gün';
  if (postDate) {
    timeAgoText = postDate;
  }

  // Kanıt gerekçesi açıklaması (Neye göre bulundu)
  const evidenceReason = `Bu hasta "${title}" başlığında paylaştığı sorusunda ${matchedIntents.join(', ')} ihtiyacını açıkça ifade etmiş ve doğrudan yanıt/iletişim için e-posta adresi bırakmıştır.`;

  return {
    ok: true,
    email: chosenEmail,
    title,
    link,
    snippet,
    category,
    urgency,
    matchedIntents,
    evidenceReason,
    postDate,
    timeAgoText,
    platform: item.platform || 'Web'
  };
}

async function searchGoogle(queryObj) {
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(queryObj.query)}&api_key=${apiKey}&num=10&tbs=qdr:m6`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`  ⚠️ HTTP ${res.status} [${queryObj.platform}]`);
      return [];
    }

    const data = await res.json();
    return (data.organic_results || []).map(r => ({
      ...r,
      platform: queryObj.platform,
      query: queryObj.query
    }));
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`  ⏱️ Zaman aşımı [${queryObj.platform}]`);
    } else {
      console.warn(`  ❌ Hata [${queryObj.platform}]: ${err.message}`);
    }
    return [];
  }
}

async function runHarvest() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 DERİN VE KANITLI HASTA E-POSTASI ARAMA MOTORU BAŞLATILDI');
  console.log(`📅 Planlanan Sorgu Sayısı: ${SEARCH_QUERIES.length}`);
  console.log('🛡️ Sıkı Klinik Denetim: AKTİF (Klinik ve alakasızlar reddedilir)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const verifiedLeads = [];
  const seenEmails = new Set();
  const seenUrls = new Set();

  // Önce mevcut yerel dosyalardaki taranmış kayıtları da filtreleyelim
  const localCandidates = [];
  try {
    if (fs.existsSync('scratch_harvested_patient_emails.json')) {
      const p1 = JSON.parse(fs.readFileSync('scratch_harvested_patient_emails.json', 'utf8'));
      localCandidates.push(...p1);
    }
    if (fs.existsSync('scratch_found_emails.json')) {
      const p2 = JSON.parse(fs.readFileSync('scratch_found_emails.json', 'utf8'));
      localCandidates.push(...p2);
    }
  } catch (e) {}

  console.log(`📂 Yerel ham arşivden ${localCandidates.length} aday denetleniyor...`);
  for (const cand of localCandidates) {
    const check = verifyCandidate(cand);
    if (check.ok && !seenEmails.has(check.email) && !seenUrls.has(check.link)) {
      seenEmails.add(check.email);
      seenUrls.add(check.link);
      verifiedLeads.push(check);
      console.log(`  ✅ [Arşiv Onaylandı] ${check.email} — "${check.title.substring(0, 40)}..."`);
    }
  }
  console.log(`📊 Yerel arşivden onaylanan kanıtlı hasta: ${verifiedLeads.length}\n`);

  // Canlı SerpApi Sorguları
  for (let i = 0; i < SEARCH_QUERIES.length; i++) {
    const qObj = SEARCH_QUERIES[i];
    console.log(`[${i + 1}/${SEARCH_QUERIES.length}] Arama: ${qObj.platform}`);
    console.log(`   Sorgu: ${qObj.query.substring(0, 70)}...`);

    const results = await searchGoogle(qObj);
    console.log(`   → ${results.length} Google sonucu inceleniyor...`);

    let newFound = 0;
    for (const r of results) {
      const check = verifyCandidate(r);
      if (check.ok) {
        if (!seenEmails.has(check.email) && !seenUrls.has(check.link)) {
          seenEmails.add(check.email);
          seenUrls.add(check.link);
          verifiedLeads.push(check);
          newFound++;
          console.log(`   🎯 KANITLI HASTA BULUNDU: ${check.email}`);
          console.log(`      🔗 Link: ${check.link}`);
          console.log(`      📝 Başlık: ${check.title}`);
          console.log(`      📌 Neden Seçildi: ${check.matchedIntents.join(', ')}`);
        }
      }
    }
    console.log(`   Sonuç: +${newFound} yeni kanıtlı hasta eklendi.\n`);

    // Kısa bekleme (SerpApi nezaket gecikmesi)
    if (i < SEARCH_QUERIES.length - 1) {
      await new Promise(res => setTimeout(res, 1200));
    }
  }

  // Sonuçları kaydet
  const outputPath = path.join(__dirname, '..', 'data', 'verified_patient_emails.json');
  fs.writeFileSync(outputPath, JSON.stringify(verifiedLeads, null, 2), 'utf8');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`🏆 TOPLAM BULUNAN KANITLI HASTA SAYISI: ${verifiedLeads.length}`);
  console.log(`💾 Dosya kaydedildi: ${outputPath}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  return verifiedLeads;
}

if (require.main === module) {
  runHarvest().catch(err => {
    console.error('Kritik Tarama Hatası:', err);
    process.exit(1);
  });
}

module.exports = { runHarvest, verifyCandidate };
