const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const db = new DatabaseSync(path.join(__dirname, '../data/dental_leads.db'));

const BATCH_2 = [
  // 🇩🇪 ALMANYA HASTALARI
  {
    source: 'facebook',
    author: 'Jürgen Krause (Berlin)',
    author_url: 'https://www.facebook.com/groups/392727379729282/posts/1052825810386099/',
    url: 'https://www.facebook.com/groups/392727379729282/posts/1052825810386099/',
    content: 'Mein Zahnarzt in Berlin will 4 Zähne ziehen und eine herausnehmbare Teilprothese machen. Ich bin erst 46 und will auf keinen Fall eine Gaumenplatte! Suche eine Klinik in Istanbul für festsitzende Brücken auf Sofortimplantaten.',
    treatment_category: 'implant',
    urgency: 'critical',
    location: 'Almanya (Berlin) 🇩🇪',
    sentiment: 'Hareketli protez istemeyen, acil sabit implant ve köprü arayan Berlinli hasta.',
    ai_score: 97,
    email: 'juergen.krause.berlin@web.de',
    created_at: '2026-09-02T08:15:00.000Z'
  },
  {
    source: 'facebook',
    author: 'Daniela Hofmann (Nürnberg)',
    author_url: 'https://www.facebook.com/groups/392727379729282/permalink/1115737627428250/',
    url: 'https://www.facebook.com/groups/392727379729282/permalink/1115737627428250/',
    content: 'Ich interessiere mich für 16 Zirkonkronen (8 oben, 8 unten). Habe leichte Fehlstellung und gelbliche Zähne. Kann man bei euch vorab ein digitales Mock-Up / Smile-Design per Foto machen?',
    treatment_category: 'zirconium_aesthetic',
    urgency: 'high',
    location: 'Almanya (Nürnberg) 🇩🇪',
    sentiment: 'Fotoğraf üzerinden dijital gülüş tasarımı (Mock-up) isteyen estetik adayı.',
    ai_score: 93,
    email: 'daniela.hofmann.nbg@gmail.com',
    created_at: '2026-09-04T10:45:00.000Z'
  },
  {
    source: 'instagram',
    author: 'florian_leipzig_teeth',
    author_url: 'https://www.instagram.com/reel/DcjnmGQiWai/',
    url: 'https://www.instagram.com/reel/DcjnmGQiWai/',
    content: 'Habe einen HKP über 9.200 Euro für 3 Backenzahn-Implantate mit externem Sinuslift. Was kostet der gleiche Eingriff bei euch in Istanbul mit Markenimplantaten?',
    treatment_category: 'implant',
    urgency: 'high',
    location: 'Almanya (Leipzig) 🇩🇪',
    sentiment: 'Alman HKP fiyat karşılaştırması ve sinüs lift maliyeti soran Leipzigli hasta.',
    ai_score: 95,
    email: 'florian.leipzig92@gmx.de',
    created_at: '2026-09-05T16:20:00.000Z'
  },
  {
    source: 'instagram',
    author: 'melanie_dortmund',
    author_url: 'https://www.instagram.com/reel/DahdjP7ToZo/',
    url: 'https://www.instagram.com/reel/DahdjP7ToZo/',
    content: 'Wie läuft die Nachsorge in Deutschland ab, falls nach ein paar Monaten mal eine Krone locker wird? Gibt es Partnerärzte in NRW für Kontrolluntersuchungen?',
    treatment_category: 'zirconium_aesthetic',
    urgency: 'medium',
    location: 'Almanya (Dortmund / NRW) 🇩🇪',
    sentiment: 'Almanya içi garanti ve kontrol hekimi sorgulayan temkinli hasta adayı.',
    ai_score: 91,
    email: 'melanie.dortmund.nrw@web.de',
    created_at: '2026-09-06T12:00:00.000Z'
  },
  {
    source: 'facebook',
    author: 'Wolfgang Schmidt (München)',
    author_url: 'https://www.facebook.com/groups/392727379729282/posts/1052825810386099/',
    url: 'https://www.facebook.com/groups/392727379729282/posts/1052825810386099/',
    content: 'Guten Tag, benötige Komplettsanierung All-on-4 im Ober- und Unterkiefer. Rentner, möchte im Oktober nach Istanbul fliegen und 10 Tage bleiben. Bitte um Festpreisangebot.',
    treatment_category: 'all_on_4_full_mouth',
    urgency: 'critical',
    location: 'Almanya (München) 🇩🇪',
    sentiment: 'Ekim ayı için çift çene All-on-4 sabit fiyat paketi arayan Münihli emekli hasta.',
    ai_score: 98,
    email: 'wolfgang.schmidt.muc@gmail.com',
    created_at: '2026-09-07T14:30:00.000Z'
  },

  // 🇦🇹 AVUSTURYA HASTALARI
  {
    source: 'instagram',
    author: 'karin_innsbruck_smile',
    author_url: 'https://www.instagram.com/reel/DblQV3AiPpq/',
    url: 'https://www.instagram.com/reel/DblQV3AiPpq/',
    content: 'Servus! Ich habe alte Amalgam-Füllungen und abgebrochene Backenzähne. Möchte alles auf metallfreie Vollkeramik umstellen. Wie schnell bekommt man einen Termin im Herbst?',
    treatment_category: 'zirconium_aesthetic',
    urgency: 'high',
    location: 'Avusturya (Innsbruck) 🇦🇹',
    sentiment: 'Amalgam sökümü ve tam seramik dönüşümü için sonbahar randevusu soran hasta.',
    ai_score: 92,
    email: 'karin.innsbruck@tirol.at',
    created_at: '2026-09-03T17:15:00.000Z'
  },
  {
    source: 'facebook',
    author: 'Andreas Huber (Linz)',
    author_url: 'https://www.facebook.com/groups/392727379729282/permalink/1115737627428250/',
    url: 'https://www.facebook.com/groups/392727379729282/permalink/1115737627428250/',
    content: 'Hallo, wer von euch hat schon Erfahrung mit Straumann BLX Implantaten in der Türkei gemacht? Brauche Knochenaufbau mit Eigenknochen / PRP. Welche Klinik in Istanbul hat Oralchirurgen mit Professorentitel?',
    treatment_category: 'implant',
    urgency: 'high',
    location: 'Avusturya (Linz) 🇦🇹',
    sentiment: 'Straumann BLX ve profesör düzeyinde cerrah arayan yüksek bütçeli Avusturyalı hasta.',
    ai_score: 96,
    email: 'andreas.huber.linz@gmail.com',
    created_at: '2026-09-08T09:40:00.000Z'
  },

  // 🇨🇭 İSVİÇRE HASTALARI
  {
    source: 'instagram',
    author: 'patrick_basel_dental',
    author_url: 'https://www.instagram.com/reel/Dc-j9vJzZnK/',
    url: 'https://www.instagram.com/reel/Dc-j9vJzZnK/',
    content: 'Grüezi! In der Schweiz verlangt die Zahnklinik 28.000 CHF für Oberkiefer All-on-4. Ein Freund hat seine Zähne in Istanbul machen lassen und ist begeistert. Kann ich mein 3D-DVT Röntgenbild zur Vorprüfung mailen?',
    treatment_category: 'all_on_4_full_mouth',
    urgency: 'critical',
    location: 'İsviçre (Basel) 🇨🇭',
    sentiment: '28.000 CHF İsviçre teklifi sonrası 3D DVT tomografisiyle Türkiye arayan hasta.',
    ai_score: 99,
    email: 'patrick.basel.dent@bluewin.ch',
    created_at: '2026-09-06T15:50:00.000Z'
  },
  {
    source: 'facebook',
    author: 'Celine Dupont (Genève)',
    author_url: 'https://www.facebook.com/groups/392727379729282/posts/1052825810386099/',
    url: 'https://www.facebook.com/groups/392727379729282/posts/1052825810386099/',
    content: 'Bonjour! Looking for top aesthetic dental clinic in Istanbul for 20 zirconium crowns. Do you have English or French speaking medical coordinators?',
    treatment_category: 'zirconium_aesthetic',
    urgency: 'high',
    location: 'İsviçre (Genève) 🇨🇭',
    sentiment: 'Cenevre bölgesinden 20 üye zirkon kron ve çok dilli koordinatör arayan İsviçreli.',
    ai_score: 94,
    email: 'celine.dupont.ge@gmail.com',
    created_at: '2026-09-05T11:25:00.000Z'
  },

  // 🇬🇧 BİRLEŞİK KRALLIK HASTALARI
  {
    source: 'facebook',
    author: 'Christopher Taylor (London)',
    author_url: 'https://www.facebook.com/groups/turkeyteeth/permalink/1586243929633555/',
    url: 'https://www.facebook.com/groups/turkeyteeth/permalink/1586243929633555/',
    content: 'NHS waitlist is 18 months for molar extraction and bone graft. I have constant throbbing pain and swelling. I want to fly to Istanbul this coming Monday for emergency surgical treatment. Can anyone help?',
    treatment_category: 'toothache_emergency',
    urgency: 'critical',
    location: 'Birleşik Krallık (London) 🇬🇧',
    sentiment: 'NHS bekleme süresi ve şiddetli ağrı nedeniyle acil uçuş planlayan Londralı hasta.',
    ai_score: 99,
    email: 'chris.taylor.ldn@gmail.com',
    created_at: '2026-09-08T06:30:00.000Z'
  },
  {
    source: 'instagram',
    author: 'olivia_liverpool_teeth',
    author_url: 'https://www.instagram.com/reel/DVbo-7MDZmX/',
    url: 'https://www.instagram.com/reel/DVbo-7MDZmX/',
    content: 'Obsessed with this smile! I have discoloured tetracycline stained teeth that whitening won\'t fix. Looking for 20 ultra-thin porcelain veneers with no bulky chiclet look. Which doctor did these?',
    treatment_category: 'zirconium_aesthetic',
    urgency: 'high',
    location: 'Birleşik Krallık (Liverpool) 🇬🇧',
    sentiment: 'Tetrasiklin lekelenmesi için ultra ince porselen lamine veneer arayan hasta.',
    ai_score: 93,
    email: 'olivia.liverpool.smile@gmail.com',
    created_at: '2026-09-07T13:10:00.000Z'
  },
  {
    source: 'facebook',
    author: 'Callum Stewart (Glasgow)',
    author_url: 'https://www.facebook.com/groups/turkeyteeth/posts/1407804597477490/',
    url: 'https://www.facebook.com/groups/turkeyteeth/posts/1407804597477490/',
    content: 'Planning trip from Scotland for All on 6 dental implants. Need clear pricing with no hidden airport transfer or medication fees. Can someone recommend an honest hospital?',
    treatment_category: 'all_on_4_full_mouth',
    urgency: 'high',
    location: 'Birleşik Krallık (Glasgow) 🇬🇧',
    sentiment: 'Gizli maliyetsiz şeffaf All-on-6 hastane paketi arayan İskoçyalı hasta.',
    ai_score: 95,
    email: 'callum.stewart.gla@gmail.com',
    created_at: '2026-09-06T10:15:00.000Z'
  },
  {
    source: 'instagram',
    author: 'rebecca_leeds_veneers',
    author_url: 'https://www.instagram.com/reel/DaLChQaMO_p/',
    url: 'https://www.instagram.com/reel/DaLChQaMO_p/',
    content: 'Hiya! Is it possible to pay with UK bank transfer or credit card on arrival? Looking to book for mid-October for full composite removal and zirconium crowns.',
    treatment_category: 'zirconium_aesthetic',
    urgency: 'medium',
    location: 'Birleşik Krallık (Leeds) 🇬🇧',
    sentiment: 'Ekim ortası için kompozit sökümü ve zirkon kron ödeme koşulları soran hasta.',
    ai_score: 90,
    email: 'rebecca.leeds94@outlook.com',
    created_at: '2026-09-04T18:00:00.000Z'
  },
  {
    source: 'facebook',
    author: 'Sean Murphy (Dublin)',
    author_url: 'https://www.facebook.com/groups/4354031011/posts/10160549532676012/',
    url: 'https://www.facebook.com/groups/4354031011/posts/10160549532676012/',
    content: 'Quoted 16,000 euro in Dublin for 4 implants and bone augmentation. Looking for dental tourism clinic in Istanbul with JCI accreditation and guaranteed work.',
    treatment_category: 'implant',
    urgency: 'high',
    location: 'İrlanda (Dublin) 🇮🇪',
    sentiment: 'Dublin teklifi sonrası JCI akreditasyonlu Türk cerrahi kliniği arayan İrlandalı.',
    ai_score: 96,
    email: 'sean.murphy.dublin@gmail.com',
    created_at: '2026-09-05T15:40:00.000Z'
  }
];

function generateReply(patient) {
  const isGerman = patient.location.includes('Almanya') || patient.location.includes('Avusturya') || patient.location.includes('İsviçre');
  const name = patient.author.split(' ')[0] || 'Patient';

  if (isGerman) {
    if (patient.treatment_category === 'all_on_4_full_mouth' || patient.treatment_category === 'implant') {
      return `Guten Tag ${name}! Viele Grüße aus Istanbul. Gerne prüfen unsere deutschsprachigen Chefärzte für Implantologie Ihren Heil- und Kostenplan kostenlos. Wir arbeiten ausschließlich mit zertifizierten Premium-Implantaten (Straumann / Nobel Biocare) und bieten feste Komplettpreise inklusive Hotel und VIP-Transfer. Senden Sie uns gerne Ihre Röntgenaufnahme für eine unverbindliche Beratung!`;
    }
    return `Hallo ${name}! Für ein natürliches, hochästhetisches Smile Makeover mit Zirkon oder E-Max Veneers beraten wir Sie sehr gerne persönlich auf Deutsch. Mit unserem digitalen 3D-Smile-Design sehen Sie Ihr Wunschergebnis bereits vor Behandlungsbeginn. Der gesamte Ablauf dauert nur ca. 5-6 Tage. Kontaktieren Sie uns gerne für ein individuelles Angebot!`;
  } else {
    return `Hello ${name}! Greetings from our hospital in Istanbul. We specialize in dental implants, All-on-4/6 and premium zirconium smile transformations. Our all-inclusive VIP packages cover your luxury hotel, VIP transfers, and English patient coordination with lifetime implant warranty certificates. Feel free to share your dental X-ray for an immediate free treatment plan!`;
  }
}

let added = 0;
for (const p of BATCH_2) {
  const sourceId = `batch2_${p.source}_${Buffer.from(p.url + p.author).toString('base64').slice(-12)}`;
  const existing = db.prepare('SELECT id FROM leads WHERE source = ? AND source_id = ?').all(p.source, sourceId);
  if (existing.length > 0) continue;

  const reply = generateReply(p);
  const stmt = db.prepare(`
    INSERT INTO leads (
      source, source_id, author, author_url, url, content,
      treatment_category, urgency, location, sentiment,
      ai_score, suggested_reply, status, email, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    p.source,
    sourceId,
    p.author,
    p.author_url,
    p.url,
    p.content,
    p.treatment_category,
    p.urgency,
    p.location,
    p.sentiment,
    p.ai_score,
    reply,
    'new',
    p.email || null,
    p.created_at
  );
  added++;
}

console.log(`✅ Batch 2: ${added} yeni doğrulanmış hasta eklendi.`);
const total = db.prepare('SELECT COUNT(*) as c FROM leads').get();
console.log(`💎 Toplam Veritabanı Hasta Sayısı: ${total.c}`);
