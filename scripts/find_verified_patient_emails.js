/**
 * KANITLI HASTA E-POSTASI BULUCU
 * SerpApi ile gerçek Google araması yaparak, son 3 ayda diş sorunu yaşamış
 * ve e-posta adresi paylaşmış GERÇEK kişileri bulur.
 * 
 * Her sonuçta:
 * - Orijinal gönderi linki (kanıt)
 * - Gönderinin tam snippet'i
 * - E-posta adresinin hangi bağlamda paylaşıldığı
 * - Google'ın tarih bilgisi
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const apiKey = process.env.SERPAPI_KEY || process.env.SERPAPI_API_KEY;
if (!apiKey) {
  console.error("❌ SERPAPI_KEY eksik! .env dosyasına SERPAPI_KEY ekleyin.");
  process.exit(1);
}

// E-posta regex
const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;

// Klinik/marketing e-postalarını ayıkla (bunlar HASTA DEĞİL)
const EXCLUDED_PATTERNS = [
  'support@', 'info@', 'contact@', 'press@', 'noreply@', 'no-reply@',
  'admin@', 'office@', 'hello@', 'team@', 'help@', 'sales@',
  'marketing@', 'newsletter@', 'privacy@', 'abuse@', 'postmaster@',
  'webmaster@', 'service@', 'billing@', 'feedback@', 'booking@',
  'appointment@', 'clinic@', 'praxis@', 'dental@', 'zahnarzt@',
  'reception@', 'enquiries@', 'reservations@',
  // Sosyal medya/platform domainleri
  'reddit.com', 'facebook.com', 'instagram.com', 'twitter.com',
  'tripadvisor.com', 'gutefrage.net', 'google.com', 'youtube.com',
  'example.com', 'test.com'
];

// Diş hekimi / klinik adı tespit kelimeleri
const CLINIC_INDICATORS = [
  'dr.', 'dr ', 'prof.', 'praxis', 'clinic', 'klinik', 'dental care',
  'dental office', 'zahnarztpraxis', 'zahnklinik', 'dentalcare',
  'dentistry', 'ortodonti', 'implant center', 'smile design',
  'our practice', 'our clinic', 'we offer', 'book an appointment',
  'termin vereinbaren', 'unsere praxis', 'wir bieten'
];

// ===== GERÇEK HASTA ARAYAN SORGULAMALAR =====
// Her sorgu grubunda: arama terimi, hangi platformda, ne tür hasta aranıyor
const SEARCH_QUERIES = [
  // ─── Grup 1: Reddit'te diş sorunu + e-posta bırakan hastalar ───
  {
    query: 'site:reddit.com "tooth" OR "teeth" OR "dental" "email me" OR "contact me at" gmail.com OR outlook.com',
    platform: 'Reddit',
    description: 'Reddit - Diş sorunu yaşayan ve e-posta paylaşan kişiler',
    patientLikely: true
  },
  {
    query: 'site:reddit.com/r/askdentists "gmail.com" OR "outlook.com" OR "hotmail.com"',
    platform: 'Reddit r/askdentists',
    description: 'Reddit AskDentists - E-posta bırakan soru soranlar',
    patientLikely: true
  },
  {
    query: 'site:reddit.com "implant" OR "crown" OR "veneer" "email" gmail.com OR yahoo.com',
    platform: 'Reddit',
    description: 'Reddit - İmplant/kron/veneer arayan ve e-posta bırakan',
    patientLikely: true
  },
  {
    query: 'site:reddit.com "toothache" OR "root canal" OR "wisdom tooth" "email me" gmail.com',
    platform: 'Reddit',
    description: 'Reddit - Diş ağrısı/kanal tedavisi/yirmilik diş + e-posta',
    patientLikely: true
  },

  // ─── Grup 2: Almanca forumlar ───
  {
    query: 'site:gutefrage.net "zahnarzt" OR "zahnschmerzen" OR "implantat" gmail.com OR gmx.de OR web.de',
    platform: 'Gutefrage.net',
    description: 'Gutefrage - Almanca diş sorusu + e-posta',
    patientLikely: true
  },
  {
    query: 'site:gutefrage.net "zahn" OR "zahnersatz" OR "krone" gmail.com OR gmx.de',
    platform: 'Gutefrage.net',
    description: 'Gutefrage - Diş/kron/protez sorunu + e-posta',
    patientLikely: true
  },

  // ─── Grup 3: Dental turizmi ───
  {
    query: '"dental tourism" OR "teeth turkey" OR "dental implants turkey" "email" gmail.com OR outlook.com',
    platform: 'Web Genel',
    description: 'Dental turizmi - Türkiye diş tedavisi arayan + e-posta',
    patientLikely: true
  },
  {
    query: '"zahnbehandlung türkei" OR "zahnimplantate türkei" gmail.com OR gmx.de OR web.de',
    platform: 'Web Genel (DE)',
    description: 'Almanca - Türkiye diş tedavisi arayan + e-posta',
    patientLikely: true
  },

  // ─── Grup 4: Facebook dental grupları ───
  {
    query: 'site:facebook.com "dental" OR "dentist" OR "tooth" "email me" gmail.com',
    platform: 'Facebook',
    description: 'Facebook - Diş sorunlu ve e-posta paylaşan kişiler',
    patientLikely: true
  },
  {
    query: 'site:facebook.com "zahnimplantat" OR "zahnarzt" gmail.com OR gmx.de',
    platform: 'Facebook (DE)',
    description: 'Facebook - Almanca diş implant arayanlar',
    patientLikely: true
  },

  // ─── Grup 5: TripAdvisor dental turizmi ───
  {
    query: 'site:tripadvisor.com "dental" "turkey" OR "istanbul" gmail.com OR outlook.com',
    platform: 'TripAdvisor',
    description: 'TripAdvisor - Dental turizmi tartışmaları + e-posta',
    patientLikely: true
  },

  // ─── Grup 6: Diş ağrısı / acil yardım ───
  {
    query: '"need dentist" OR "looking for dentist" "email" gmail.com OR outlook.com OR yahoo.com',
    platform: 'Web Genel',
    description: 'Diş hekimi arayan kişiler + e-posta',
    patientLikely: true
  },
  {
    query: '"brauche zahnarzt" OR "suche zahnarzt" gmail.com OR gmx.de OR web.de',
    platform: 'Web Genel (DE)',
    description: 'Almanca - Diş hekimi arayan + e-posta',
    patientLikely: true
  },

  // ─── Grup 7: İkinci görüş / fiyat araştırması ───
  {
    query: '"dental quote" OR "dental estimate" OR "second opinion" "email" gmail.com',
    platform: 'Web Genel',
    description: 'Diş tedavisi teklifi/ikinci görüş arayan + e-posta',
    patientLikely: true
  },
  {
    query: '"Heil- und Kostenplan" OR "Kostenvoranschlag" "zahnarzt" gmail.com OR gmx.de',
    platform: 'Web Genel (DE)',
    description: 'Almanca - HKP/maliyet karşılaştırması yapan + e-posta',
    patientLikely: true
  }
];

async function searchSerpApi(queryObj) {
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(queryObj.query)}&api_key=${apiKey}&num=10&tbs=qdr:m3`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      console.warn(`  ⚠️ HTTP ${res.status} — ${queryObj.platform}`);
      return [];
    }
    
    const data = await res.json();
    
    // SerpApi kredi bilgisi
    if (data.search_metadata) {
      console.log(`  📊 SerpApi Status: ${data.search_metadata.status || 'ok'}`);
    }
    
    return data.organic_results || [];
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`  ⏱️ Timeout — ${queryObj.platform}`);
    } else {
      console.warn(`  ❌ Hata: ${err.message}`);
    }
    return [];
  }
}

function isClinicEmail(email, snippet) {
  const lowerEmail = email.toLowerCase();
  const lowerSnippet = (snippet || '').toLowerCase();
  
  // Excluded pattern kontrolü
  if (EXCLUDED_PATTERNS.some(ex => lowerEmail.includes(ex))) return true;
  
  // E-posta adresinde klinik göstergesi
  if (CLINIC_INDICATORS.some(ci => lowerEmail.includes(ci.replace(/\s/g, '')))) return true;
  
  // Snippet'te klinik tanıtımı
  const clinicContext = CLINIC_INDICATORS.filter(ci => lowerSnippet.includes(ci));
  if (clinicContext.length >= 2) return true; // 2+ klinik göstergesi = muhtemelen klinik
  
  return false;
}

function determineCategory(text) {
  const lower = text.toLowerCase();
  
  if (lower.includes('all on 4') || lower.includes('all-on-4') || lower.includes('all on 6') || lower.includes('full mouth') || lower.includes('komplettsanierung')) {
    return { category: 'all_on_4_full_mouth', urgency: 'critical' };
  }
  if (lower.includes('implant') || lower.includes('implantat') || lower.includes('zahnimplantat')) {
    return { category: 'implant', urgency: 'high' };
  }
  if (lower.includes('veneer') || lower.includes('zirkon') || lower.includes('crown') || lower.includes('krone') || lower.includes('hollywood smile') || lower.includes('aesthetic')) {
    return { category: 'zirconium_aesthetic', urgency: 'high' };
  }
  if (lower.includes('aligner') || lower.includes('invisalign') || lower.includes('brace') || lower.includes('zahnspange') || lower.includes('orthodon')) {
    return { category: 'orthodontics_invisalign', urgency: 'medium' };
  }
  if (lower.includes('pain') || lower.includes('schmerz') || lower.includes('emergency') || lower.includes('notfall') || lower.includes('ache') || lower.includes('swelling') || lower.includes('infection')) {
    return { category: 'emergency_toothache', urgency: 'critical' };
  }
  if (lower.includes('root canal') || lower.includes('wurzelbehandlung') || lower.includes('endodont')) {
    return { category: 'root_canal', urgency: 'high' };
  }
  if (lower.includes('wisdom') || lower.includes('weisheitszahn') || lower.includes('weisheitszähne')) {
    return { category: 'wisdom_tooth', urgency: 'medium' };
  }
  return { category: 'general_checkup', urgency: 'medium' };
}

function determineLocation(text, link) {
  const lower = (text + ' ' + link).toLowerCase();
  
  if (lower.includes('wien') || lower.includes('österreich') || lower.includes('austria') || lower.includes('graz') || lower.includes('salzburg') || lower.includes('/r/austria')) {
    return 'Avusturya 🇦🇹';
  }
  if (lower.includes('zürich') || lower.includes('schweiz') || lower.includes('switzerland') || lower.includes('bern') || lower.includes('basel')) {
    return 'İsviçre 🇨🇭';
  }
  if (lower.includes('uk') || lower.includes('england') || lower.includes('london') || lower.includes('manchester') || lower.includes('nhs') || lower.includes('british')) {
    return 'İngiltere 🇬🇧';
  }
  if (lower.includes('berlin') || lower.includes('münchen') || lower.includes('hamburg') || lower.includes('frankfurt') || lower.includes('köln') || lower.includes('deutschland') || lower.includes('germany') || lower.includes('gutefrage')) {
    return 'Almanya 🇩🇪';
  }
  if (lower.includes('turkey') || lower.includes('türkei') || lower.includes('istanbul') || lower.includes('antalya')) {
    return 'Türkiye / Dental Turizm';
  }
  return 'Bilinmiyor';
}

async function run() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🔍 KANITLI HASTA E-POSTASI BULUCU — SerpApi Canlı Tarama');
  console.log('  📅 Son 3 ay filtresi aktif (Google tbs=qdr:m3)');
  console.log(`  📊 Toplam ${SEARCH_QUERIES.length} farklı sorgu taranacak`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  const verifiedLeads = [];
  const seenEmails = new Set();
  const seenLinks = new Set();
  let totalSearches = 0;
  let totalResults = 0;

  for (let i = 0; i < SEARCH_QUERIES.length; i++) {
    const queryObj = SEARCH_QUERIES[i];
    console.log(`\n[${i + 1}/${SEARCH_QUERIES.length}] ${queryObj.description}`);
    console.log(`  Platform: ${queryObj.platform}`);
    console.log(`  Sorgu: ${queryObj.query.substring(0, 80)}...`);

    const results = await searchSerpApi(queryObj);
    totalSearches++;
    totalResults += results.length;
    
    console.log(`  → ${results.length} sonuç bulundu`);

    for (const item of results) {
      const rawText = `${item.title || ''} ${item.snippet || ''}`;
      const emails = rawText.match(EMAIL_REGEX);
      
      if (!emails || emails.length === 0) continue;

      for (const rawEmail of emails) {
        const email = rawEmail.toLowerCase();
        
        // Deduplikasyon
        if (seenEmails.has(email)) continue;
        
        // Klinik/marketing e-posta kontrolü
        if (isClinicEmail(email, item.snippet)) {
          console.log(`  ⛔ Klinik/marketing e-postası atlandı: ${email}`);
          continue;
        }
        
        // Aynı linki tekrar ekleme
        if (item.link && seenLinks.has(item.link)) continue;
        
        seenEmails.add(email);
        if (item.link) seenLinks.add(item.link);

        const fullText = `${item.title || ''} ${item.snippet || ''}`;
        const { category, urgency } = determineCategory(fullText);
        const location = determineLocation(fullText, item.link || '');

        const lead = {
          // === KANİT BİLGİLERİ ===
          email: email,
          source_url: item.link || '',                    // Kanıt linki (orijinal gönderi)
          source_title: item.title || '',                 // Gönderi başlığı
          source_snippet: item.snippet || '',             // E-postanın bulunduğu metin
          source_platform: queryObj.platform,             // Hangi platformda bulundu
          search_query: queryObj.query,                   // Hangi arama ile bulundu
          search_description: queryObj.description,       // Aramanın açıklaması
          
          // === HASTA BİLGİLERİ ===
          treatment_category: category,
          urgency: urgency,
          location: location,
          
          // === META ===
          google_date: item.date || null,                 // Google'ın gösterdiği tarih
          found_at: new Date().toISOString(),             // Ne zaman bulundu
          is_verified: true,                              // Gerçek SerpApi sonucu
          
          // === E-POSTA BAĞLAMI ===
          email_context: extractEmailContext(item.snippet, email)
        };

        verifiedLeads.push(lead);
        console.log(`  ✅ KANİTLI LEAD: ${email}`);
        console.log(`     📍 Platform: ${queryObj.platform}`);
        console.log(`     🔗 Kanıt: ${(item.link || '').substring(0, 70)}...`);
        console.log(`     🦷 Kategori: ${category} (${urgency})`);
      }
    }

    // Rate limiting
    if (i < SEARCH_QUERIES.length - 1) {
      console.log('  ⏳ Sonraki sorgu için 2s bekleniyor...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // === SONUÇ RAPORU ===
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  📊 TARAMA SONUÇ RAPORU');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Toplam arama yapılan sorgu: ${totalSearches}`);
  console.log(`  Toplam Google sonucu: ${totalResults}`);
  console.log(`  Kanıtlı e-posta lead: ${verifiedLeads.length}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Kaydet
  const outputPath = path.join(__dirname, '..', 'verified_email_leads.json');
  fs.writeFileSync(outputPath, JSON.stringify(verifiedLeads, null, 2));
  console.log(`💾 Kaydedildi: ${outputPath}`);

  // Lead detaylarını göster
  if (verifiedLeads.length > 0) {
    console.log('\n📋 BULUNAN KANİTLI HASTALAR:');
    console.log('─'.repeat(60));
    verifiedLeads.forEach((lead, idx) => {
      console.log(`\n${idx + 1}. ${lead.email}`);
      console.log(`   🔗 Kaynak: ${lead.source_url}`);
      console.log(`   📝 Başlık: ${lead.source_title}`);
      console.log(`   💬 Bağlam: "${lead.email_context}"`);
      console.log(`   🦷 Tedavi: ${lead.treatment_category} (${lead.urgency})`);
      console.log(`   📍 Konum: ${lead.location}`);
      console.log(`   📅 Google Tarih: ${lead.google_date || 'Belirtilmemiş'}`);
    });
  }

  return verifiedLeads;
}

function extractEmailContext(snippet, email) {
  if (!snippet) return '';
  // E-postanın etrafındaki +-50 karakteri al (bağlam)
  const idx = snippet.toLowerCase().indexOf(email.toLowerCase());
  if (idx === -1) return snippet.substring(0, 120);
  const start = Math.max(0, idx - 50);
  const end = Math.min(snippet.length, idx + email.length + 50);
  return '...' + snippet.substring(start, end) + '...';
}

// Doğrudan çalıştırma veya require
if (require.main === module) {
  run().catch(err => {
    console.error('Tarama hatası:', err);
    process.exit(1);
  });
}

module.exports = { run };
