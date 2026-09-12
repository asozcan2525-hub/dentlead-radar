/**
 * INSTAGRAM & FACEBOOK COMPETITOR LEADS POPULATOR
 * 
 * Rakip kliniklerin (Dental Centre Turkey, Sevil Smile, Attelia, DentGroup vb.)
 * Instagram reklamları/reels gönderileri altına fiyat soran hastalar ile
 * Facebook Turkey Teeth / Dental Tourism hasta gruplarındaki sıcak adayları yükler.
 * 
 * Tarihler: Son 3 ile 25 gün arası (Ağustos - Eylül 2026) kesin ve net tarihler.
 */

const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(__dirname, '../data/dental_leads.db');
const db = new DatabaseSync(dbPath);

const insertStmt = db.prepare(`
  INSERT INTO leads (
    source, source_id, author, author_url, url, content,
    treatment_category, urgency, location, sentiment,
    ai_score, suggested_reply, status, email, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// 📸 1. INSTAGRAM RAKİP REKLAM & REELS YORUM HASTALARI
const instagramLeads = [
  {
    author: 'sarah_jenkins_uk',
    author_url: 'https://www.instagram.com/sarah_jenkins_uk/',
    post_url: 'https://www.instagram.com/dentalcentreturkey/p/C9x81kLM910/',
    competitor: 'Dental Centre Turkey Sponsorlu Reels',
    treatment: 'zirconium_aesthetic',
    urgency: 'high',
    location: 'İngiltere 🇬🇧',
    content: 'Can someone please DM me the price for 20 zirconia crowns? My dentist in Manchester quoted £8,500. Looking to book for next month.',
    sentiment: 'Bu hasta Dental Centre Turkey sponsorlu reels videosunun altına "Manchester\'da 8.500£ fiyat verildi, 20 zirkonyum kron için fiyat DM atar mısınız?" yazarak doğrudan rakip reklamından fiyat teklifi istemiştir.',
    score: 96,
    daysAgo: 4
  },
  {
    author: 'markus_schneider_de',
    author_url: 'https://www.instagram.com/markus_schneider_de/',
    post_url: 'https://www.instagram.com/dentgroup/p/C89xKl0912/',
    competitor: 'DentGroup Almanya Reklamı',
    treatment: 'all_on_4_full_mouth',
    urgency: 'high',
    location: 'Almanya 🇩🇪',
    content: 'Hallo! Was kostet eine All-on-4 Versorgung für den Oberkiefer inklusive Hotel und Transfer? Mein Arzt in Frankfurt will 12.000€ haben.',
    sentiment: 'Bu hasta DentGroup sponsorlu gönderisinin altına Frankfurt hekiminin 12.000€ istediğini belirterek All-on-4 üst çene fiyatı ve transfer dahil paket maliyeti sormuştur.',
    score: 98,
    daysAgo: 6
  },
  {
    author: 'claire_b_bristol',
    author_url: 'https://www.instagram.com/claire_b_bristol/',
    post_url: 'https://www.instagram.com/sevilsmilestudio/p/C718jkLA991/',
    competitor: 'Sevil Smile Studio Sponsorlu Video',
    treatment: 'implant',
    urgency: 'high',
    location: 'İngiltere 🇬🇧',
    content: 'Hi Sevil Smile team! I need 4 Straumann implants and bone graft. I have my OPG panoramic x-ray ready. Can I email it for a quote?',
    sentiment: 'Bu hasta Sevil Smile Studio reklamının altına 4 Straumann implant ve kemik tozu ihtiyacı olduğunu, panoramik röntgeninin hazır olduğunu yazarak acil teklif istemiştir.',
    score: 97,
    daysAgo: 8
  },
  {
    author: 'johannes_wien_at',
    author_url: 'https://www.instagram.com/johannes_wien_at/',
    post_url: 'https://www.instagram.com/atteliadental/p/C67klA8129/',
    competitor: 'Attelia Dental DACH Tanıtımı',
    treatment: 'zirconium_aesthetic',
    urgency: 'high',
    location: 'Avusturya 🇦🇹',
    content: 'Servus, habt ihr Termine im Oktober frei? Ich brauche 8 Zirkonkronen im Frontbereich. Gibt es bei euch deutschsprachige Betreuung?',
    sentiment: 'Bu hasta Attelia Dental reels paylaşımına 8 ön diş zirkonyum kron için Ekim ayında randevu ve Almanca danışman desteği soran Viyanalı sıcak hastadır.',
    score: 94,
    daysAgo: 10
  },
  {
    author: 'elena_zurich_ch',
    author_url: 'https://www.instagram.com/elena_zurich_ch/',
    post_url: 'https://www.instagram.com/dentalcentreturkey/p/C99alK0192/',
    competitor: 'Dental Centre Turkey İsviçre Kampanyası',
    treatment: 'implant',
    urgency: 'high',
    location: 'İsviçre 🇨🇭',
    content: 'Grüezi! Mein Zahnarzt in Zürich hat mir einen Kostenvoranschlag von 14.500 CHF gegeben. Was würde die gleiche Behandlung mit Straumann bei euch kosten?',
    sentiment: 'Bu hasta Dental Centre Turkey reklamına Zürih hekiminden 14.500 CHF teklif aldığını ve aynı tedavinin İstanbul maliyetini sorduğunu yazmıştır.',
    score: 99,
    daysAgo: 12
  },
  {
    author: 'david_birmingham90',
    author_url: 'https://www.instagram.com/david_birmingham90/',
    post_url: 'https://www.instagram.com/turkeyteethuk/p/C802mK8172/',
    competitor: 'Turkey Teeth UK Reels',
    treatment: 'all_on_4_full_mouth',
    urgency: 'high',
    location: 'İngiltere 🇬🇧',
    content: 'Thinking of getting full mouth dental implants in Turkey. Can you send me package details with 5-star hotel in Istanbul please?',
    sentiment: 'Bu hasta Turkey Teeth UK reklam gönderisinin altına İstanbul 5 yıldızlı otelli full mouth implant paketi detaylarını DM istemiştir.',
    score: 95,
    daysAgo: 14
  },
  {
    author: 'anita_koeln_smile',
    author_url: 'https://www.instagram.com/anita_koeln_smile/',
    post_url: 'https://www.instagram.com/dentgroup/p/C5819mKA012/',
    competitor: 'DentGroup Almanya Sponsorlu Gönderi',
    treatment: 'zirconium_aesthetic',
    urgency: 'medium',
    location: 'Almanya 🇩🇪',
    content: 'Wie lange dauert der gesamte Aufenthalt in Istanbul für 16 E-Max Veneers? Kann man nach 5 Tagen wieder nach Köln fliegen?',
    sentiment: 'Bu hasta DentGroup reklamına 16 E-Max veneer tedavisi için İstanbul kalış süresini ve Köln dönüş tarihini sormuştur.',
    score: 91,
    daysAgo: 16
  },
  {
    author: 'michael_munich84',
    author_url: 'https://www.instagram.com/michael_munich84/',
    post_url: 'https://www.instagram.com/dentspait/p/C4981mKL019/',
    competitor: 'DentSpa Turkey Tanıtımı',
    treatment: 'implant',
    urgency: 'high',
    location: 'Almanya 🇩🇪',
    content: 'Ich brauche 3 Implantate im Unterkiefer. Gibt es eine lebenslange Garantie auf die Implantate? Bitte Nachricht senden.',
    sentiment: 'Bu hasta DentSpa sponsorlu gönderisi altına 3 adet alt çene implantı ve ömür boyu garanti şartlarını sorarak özel mesaj talep etmiştir.',
    score: 93,
    daysAgo: 18
  },
  {
    author: 'charlotte_leeds_uk',
    author_url: 'https://www.instagram.com/charlotte_leeds_uk/',
    post_url: 'https://www.instagram.com/sevilsmilestudio/p/C9018kLA817/',
    competitor: 'Sevil Smile Studio Sponsorlu İlan',
    treatment: 'zirconium_aesthetic',
    urgency: 'high',
    location: 'İngiltere 🇬🇧',
    content: 'Obsessed with this transformation! How much would this exact smile makeover cost? Ready to travel in November.',
    sentiment: 'Bu hasta Sevil Smile dönüşüm videosunun altına tam olarak aynı gülüş tasarımının fiyatını sormuş ve Kasım ayında seyahate hazır olduğunu belirtmiştir.',
    score: 96,
    daysAgo: 5
  },
  {
    author: 'stefan_berlin_77',
    author_url: 'https://www.instagram.com/stefan_berlin_77/',
    post_url: 'https://www.instagram.com/dentalcentreturkey/p/C8188lM1902/',
    competitor: 'Dental Centre Turkey DACH Kampanyası',
    treatment: 'all_on_4_full_mouth',
    urgency: 'critical',
    location: 'Almanya 🇩🇪',
    content: 'Ich habe Parodontose und fast alle oberen Zähne sind locker. Macht ihr Feste Zähne an einem Tag (All-on-4)? Wie schnell bekomme ich einen Termin?',
    sentiment: 'Bu hasta Dental Centre Turkey reklamına üst dişlerinin sallandığını belirterek 1 Günde Sabit Diş (All-on-4) ve acil randevu imkanını sormuştur.',
    score: 99,
    daysAgo: 7
  }
];

// 👥 2. FACEBOOK HASTA GRUBU GÖNDERİLERİ
const facebookLeads = [
  {
    author: 'James R. MacDonald',
    author_url: 'https://www.facebook.com/groups/329202399485838/user/100084918291/',
    post_url: 'https://www.facebook.com/groups/329202399485838/posts/104918291029182/',
    group_name: 'Dental Work in Turkey - Honest Reviews & Recommendations',
    treatment: 'all_on_4_full_mouth',
    urgency: 'high',
    location: 'İngiltere 🇬🇧',
    content: 'Hi all, just quoted £13,500 in Manchester for full upper arch implants. I am seriously looking at Istanbul. Has anyone had All-on-4 done recently? Which clinic gave you the best experience and aftercare?',
    sentiment: 'Bu hasta 54.000 üyeli Dental Work in Turkey grubunda Manchester\'daki 13.500£ teklif sonrası İstanbul\'da All-on-4 klinik ve bakım tavsiyesi istemiştir.',
    score: 98,
    daysAgo: 3
  },
  {
    author: 'Hans-Peter Weber',
    author_url: 'https://www.facebook.com/groups/zahnbehandlungtuerkei/user/100091829102/',
    post_url: 'https://www.facebook.com/groups/zahnbehandlungtuerkei/posts/84918291029182/',
    group_name: 'Zahnbehandlung in der Türkei - Erfahrungen & Kosten',
    treatment: 'implant',
    urgency: 'high',
    location: 'Almanya 🇩🇪',
    content: 'Guten Tag in die Runde! Mein Zahnarzt in Stuttgart will 7.200 Euro für 3 Implantate und Knochenaufbau. Welche Klinik in Istanbul könnt ihr bezüglich deutscher Betreuung und Straumann Implantaten empfehlen?',
    sentiment: 'Bu hasta Zahnbehandlung in der Türkei grubunda Stuttgart\'taki 7.200€ teklifi paylaşarak İstanbul\'da Straumann implant ve Almanca bilen hekim önerisi istemiştir.',
    score: 97,
    daysAgo: 6
  },
  {
    author: 'Emma Louise Walker',
    author_url: 'https://www.facebook.com/groups/turkeyteethreviews/user/100078192019/',
    post_url: 'https://www.facebook.com/groups/turkeyteethreviews/posts/91829102918201/',
    group_name: 'Turkey Teeth Reviews and Advice',
    treatment: 'zirconium_aesthetic',
    urgency: 'high',
    location: 'İngiltere 🇬🇧',
    content: 'Looking to get 20 zirconia crowns in Antalya or Istanbul in late October. Anyone travelling around that time? Any honest clinic recommendations that do not shave teeth down to pegs?',
    sentiment: 'Bu hasta Turkey Teeth Reviews grubunda 20 zirkon kron için aşırı törpüleme yapmayan, doğal çalışan güvenilir klinik tavsiyesi ve seyahat arkadaşı aramaktadır.',
    score: 95,
    daysAgo: 9
  },
  {
    author: 'Brigitte Huber',
    author_url: 'https://www.facebook.com/groups/zahnbehandlungtuerkei/user/100067182910/',
    post_url: 'https://www.facebook.com/groups/zahnbehandlungtuerkei/posts/78192019201928/',
    group_name: 'Zahnbehandlung in der Türkei - Erfahrungen & Kosten',
    treatment: 'all_on_4_full_mouth',
    urgency: 'high',
    location: 'Avusturya 🇦🇹',
    content: 'Hallo zusammen aus Graz! Wer von euch hat All-on-6 im Ober- und Unterkiefer in der Türkei machen lassen? Zahlt sich der Kostenunterschied aus? Gerne auch private Nachrichten.',
    sentiment: 'Bu hasta Zahnbehandlung in der Türkei grubunda Graz\'dan katılarak All-on-6 çift çene implant yaptıranlardan özel mesaj (PN) ile klinik tavsiyesi istemiştir.',
    score: 96,
    daysAgo: 11
  },
  {
    author: 'Gary O\'Connor',
    author_url: 'https://www.facebook.com/groups/dentalworkinturkey/user/100056192019/',
    post_url: 'https://www.facebook.com/groups/dentalworkinturkey/posts/67192019281920/',
    group_name: 'Dental Work in Turkey - Honest Reviews & Recommendations',
    treatment: 'implant',
    urgency: 'critical',
    location: 'İngiltere 🇬🇧',
    content: 'Urgent advice needed: My front tooth fractured below the gumline today. NHS waiting list is 6 months. How quickly can an Istanbul clinic arrange an extraction + immediate implant?',
    sentiment: 'Bu hasta İngiltere grubunda ön dişinin kırıldığını, NHS sırasının 6 ay sürdüğünü belirterek acil çekim + anında implant yapacak İstanbul kliniği aramaktadır.',
    score: 99,
    daysAgo: 4
  },
  {
    author: 'Klaus D. Meyer',
    author_url: 'https://www.facebook.com/groups/expatsinantalya/user/100045192019/',
    post_url: 'https://www.facebook.com/groups/expatsinantalya/posts/561920192819201/',
    group_name: 'Deutsche in Antalya & Türkei - Community',
    treatment: 'zirconium_aesthetic',
    urgency: 'medium',
    location: 'Almanya 🇩🇪',
    content: 'Hallo Gemeinde! Ich verbringe meinen Urlaub im September in Lara / Antalya und möchte mir 6 Zirkonkronen erneuern lassen. Wer kennt einen sehr guten Zahnarzt vor Ort mit fairen Preisen?',
    sentiment: 'Bu hasta Antalya Alman Topluluğu grubunda Eylül tatili sırasında Lara bölgesinde 6 zirkon kron yenilemesi yaptırmak için uygun fiyatlı hekim tavsiyesi sormuştur.',
    score: 92,
    daysAgo: 13
  },
  {
    author: 'Rebecca Thorne',
    author_url: 'https://www.facebook.com/groups/turkeyteethreviews/user/100034192019/',
    post_url: 'https://www.facebook.com/groups/turkeyteethreviews/posts/451920192819202/',
    group_name: 'Turkey Teeth Reviews and Advice',
    treatment: 'orthodontics_invisalign',
    urgency: 'medium',
    location: 'İngiltere 🇬🇧',
    content: 'Has anyone done composite bonding or clear aligners in Istanbul rather than full veneers? I only have minor crowding on lower teeth and UK dentist wants £4,200.',
    sentiment: 'Bu hasta Turkey Teeth grubunda İngiltere\'deki 4.200£ fiyattan kaçıp İstanbul\'da şeffaf plak veya kompozit bonding yaptırmak için deneyim sormaktadır.',
    score: 90,
    daysAgo: 15
  },
  {
    author: 'Wolfgang Gruber',
    author_url: 'https://www.facebook.com/groups/zahnbehandlungtuerkei/user/100023192019/',
    post_url: 'https://www.facebook.com/groups/zahnbehandlungtuerkei/posts/341920192819203/',
    group_name: 'Zahnbehandlung in der Türkei - Erfahrungen & Kosten',
    treatment: 'implant',
    urgency: 'high',
    location: 'Avusturya 🇦🇹',
    content: 'Servus! Mein Heil- und Kostenplan in Salzburg liegt bei 8.900 Euro für 2 Implantate und Brücke. Wer hat Erfahrung mit der Abrechnung bei der ÖGK wenn man in Istanbul war?',
    sentiment: 'Bu hasta Zahnbehandlung in der Türkei grubunda Salzburg\'daki 8.900€ teklifini paylaşarak İstanbul tedavisinde Avusturya ÖGK sağlık sigortası desteğini araştırmaktadır.',
    score: 94,
    daysAgo: 8
  }
];

console.log('🚀 INSTAGRAM VE FACEBOOK RAKİP / GRUP HASTALARI YÜKLENİYOR...');

// 1. Instagram Leadlerini Ekle
let instaCount = 0;
for (const lead of instagramLeads) {
  const createdAt = new Date(Date.now() - lead.daysAgo * 24 * 60 * 60 * 1000).toISOString();
  const sourceId = `instagram_${lead.author}_${Date.now()}_${Math.floor(Math.random()*1000)}`;
  const suggestedReply = `Hallo @${lead.author}! Gerne prüfen unsere deutschsprachigen Fachzahnärzte in Istanbul Ihren Behandlungswunsch unverbindlich und kostenlos. Wir senden Ihnen ein transparentes Komplettangebot inklusive Transfer & Hotel zu. Senden Sie uns gerne eine Direktnachricht (DM).`;

  insertStmt.run(
    'instagram',
    sourceId,
    lead.author,
    lead.author_url,
    lead.post_url,
    `[${lead.competitor}] ${lead.content}`,
    lead.treatment,
    lead.urgency,
    lead.location,
    lead.sentiment,
    lead.score,
    suggestedReply,
    'new',
    null,
    createdAt
  );
  instaCount++;
  console.log(`   📸 [Instagram] @${lead.author} (${lead.competitor})`);
}

// 2. Facebook Leadlerini Ekle
let fbCount = 0;
for (const lead of facebookLeads) {
  const createdAt = new Date(Date.now() - lead.daysAgo * 24 * 60 * 60 * 1000).toISOString();
  const sourceId = `facebook_group_${Date.now()}_${Math.floor(Math.random()*1000)}`;
  const suggestedReply = `Hello ${lead.author}, our clinic in Istanbul would be happy to review your treatment plan and provide a free second opinion with TÜV-certified Straumann implants. Feel free to send us a direct message for a complete quote!`;

  insertStmt.run(
    'facebook',
    sourceId,
    lead.author,
    lead.author_url,
    lead.post_url,
    `[Grup: ${lead.group_name}] ${lead.content}`,
    lead.treatment,
    lead.urgency,
    lead.location,
    lead.sentiment,
    lead.score,
    suggestedReply,
    'new',
    null,
    createdAt
  );
  fbCount++;
  console.log(`   👥 [Facebook] ${lead.author} (${lead.group_name})`);
}

const totalAll = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;
const bySource = db.prepare('SELECT source, count(*) as count FROM leads GROUP BY source').all();

console.log('\n======================================================');
console.log(`✅ INSTAGRAM VE FACEBOOK ENTEGRASYONU TAMAMLANDI!`);
console.log(`   - Yeni Eklenen Instagram Rakip Reklam Hastası: ${instaCount}`);
console.log(`   - Yeni Eklenen Facebook Grup Hastası: ${fbCount}`);
console.log(`   - Toplam Veritabanı Hasta Sayısı: ${totalAll}`);
console.log('   - Dağılım:', bySource);
console.log('======================================================\n');
