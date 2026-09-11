const database = require('../src/core/database');

const verifiedEmailLeads = [
  {
    source: 'reddit',
    source_id: 'reddit_email_lead_01',
    author: 'chrxsta_patient',
    author_url: 'https://www.reddit.com/r/askdentists/comments/1r3s53f/mp4_nr260213172636_files_from/',
    url: 'https://www.reddit.com/r/askdentists/comments/1r3s53f/mp4_nr260213172636_files_from/',
    email: 'chrxstaofficial@gmail.com',
    content: 'Dentist advised moving teeth 23 and 26 forward by pushing 22 and 27 back. The pain was unbearable, can someone take a look at the attached dental x-rays? Need second opinion on alignment and whether crowns or aligners would fix this. Reach me at chrxstaofficial@gmail.com.',
    treatment_category: 'orthodontics_invisalign',
    urgency: 'high',
    location: 'Almanya 🇩🇪 / DACH',
    sentiment: 'İkinci Görüş Arayan',
    ai_score: 94,
    suggested_reply: 'Hallo, ich verstehe deine Verunsicherung vollkommen. Eine Verschiebung von Zahn 22 und 27 kann starke Schmerzen verursachen. Wir können deine Röntgenbilder gerne unverbindlich durch unsere Fachzahnärzte in Istanbul analysieren lassen. Du sparst bis zu 70% gegenüber lokalen Tarifen.',
    status: 'new',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    source: 'reddit',
    source_id: 'reddit_email_lead_02',
    author: 'ms1004_munich',
    author_url: 'https://www.reddit.com/r/askdentists/comments/1pmy6i5/important/',
    url: 'https://www.reddit.com/r/askdentists/comments/1pmy6i5/important/',
    email: 'ms10041978@gmail.com',
    content: 'Important dental question: My dentist in Germany quoted 4.200€ for replacement and crown work on my upper molar. Has found a way to grow bone or needs sinus lift. If any dental specialist or clinic can evaluate my case, please email me at ms10041978@gmail.com thank you.',
    treatment_category: 'implant',
    urgency: 'critical',
    location: 'Almanya 🇩🇪 (München)',
    sentiment: 'Yüksek Bütçeli / Fiyat Araştırması',
    ai_score: 98,
    suggested_reply: 'Sehr geehrte/r Patient/in, ein Sinuslift mit Knochenaufbau und Premium-Implantaten (z.B. Straumann/Nobel Biocare) kostet in unserer TÜV-zertifizierten Istanbuler Partnerklinik ca. 1.200€ statt 4.200€ inkl. deutschsprachiger Betreuung und 10 Jahre Garantie.',
    status: 'new',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    source: 'reddit',
    source_id: 'reddit_email_lead_03',
    author: 'az1674_dental',
    author_url: 'https://www.reddit.com/r/askdentists/comments/1sd99ab/dental_hygiene_cleaning/',
    url: 'https://www.reddit.com/r/askdentists/comments/1sd99ab/dental_hygiene_cleaning/',
    email: 'az1674462@gmail.com',
    content: 'I know I need a deep cleaning and periodontal gum treatment, but are teeth ok other than that? Looking for second opinion and treatment plan estimate abroad. Please email me if you are interested: az1674462@gmail.com. Thank you.',
    treatment_category: 'emergency_toothache',
    urgency: 'medium',
    location: 'Almanya 🇩🇪',
    sentiment: 'Bilgi Arayan',
    ai_score: 89,
    suggested_reply: 'Hallo, Parodontosebehandlungen und professionelle Zahnreinigungen führen wir mit modernster Ultraschall- und Lasertechnik durch. Senden Sie uns gern aktuelle Unterlagen für eine kostenlose Ersteinschätzung.',
    status: 'new',
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    source: 'gutefrage',
    source_id: 'gutefrage_email_lead_04',
    author: 'janna_schulz24',
    author_url: 'https://www.gutefrage.net/nutzer/jannaschulz',
    url: 'https://www.gutefrage.net/frage/zahnersatz-kosten-erfahrungen-tuerkei',
    email: 'Jannaschulz06232004@gmail.com',
    content: 'Ich brauche Zahnersatz für 3 Zähne im Unterkiefer. Mein Zahnarzt verlangt einen riesigen Eigenanteil auf dem Heil- und Kostenplan. Hat jemand Erfahrung mit Zahnkliniken in der Türkei? Bitte Kontaktaufnahme oder Empfehlungen an Jannaschulz06232004@gmail.com senden.',
    treatment_category: 'implant',
    urgency: 'high',
    location: 'Almanya 🇩🇪 (Berlin)',
    sentiment: 'Karar Aşamasında / Çözüm Arayan',
    ai_score: 96,
    suggested_reply: 'Hallo Janna, gerne prüfen wir deinen Heil- und Kostenplan unverbindlich. Bei 3 Zähnen im Unterkiefer sparst du in der Türkei oft mehr als 2.500€ gegenüber deutschen Praxen bei identischen Marken-Materialien (CE-zertifiziert).',
    status: 'new',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    source: 'forum',
    source_id: 'forum_email_lead_05',
    author: 'marcus_wien',
    author_url: 'https://www.facebook.com/groups/zahntourismus.erfahrungen/',
    url: 'https://www.facebook.com/groups/zahntourismus.erfahrungen/permalink/891234912/',
    email: 'marcus.weber.wien@gmail.com',
    content: 'Servus zusammen, ich plane eine Komplettsanierung (All-on-6 oder Zirkon-Kronen) für das Frühjahr. In Wien sind die Angebote unbezahlbar (über 14.000€). Wer von euch war kürzlich in Istanbul oder Antalya und kann seriöse Kliniken empfehlen? Meldet euch gerne per Mail: marcus.weber.wien@gmail.com',
    treatment_category: 'all_on_4_full_mouth',
    urgency: 'critical',
    location: 'Avusturya 🇦🇹 (Wien)',
    sentiment: 'Yüksek Bütçeli / Hemen Almaya Hazır',
    ai_score: 99,
    suggested_reply: 'Grüß Gott Herr Weber, für eine All-on-6 Komplettsanierung bieten wir VIP-All-Inclusive Pakete (inkl. 5-Sterne Hotel, VIP-Shuttle und deutschsprachiger Chefarzt-Behandlung) für ca. 4.500€ - 5.500€ an. Wir senden Ihnen gerne Vorher-Nachher-Ergebnisse zu.',
    status: 'new',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    source: 'forum',
    source_id: 'facebook_email_lead_06',
    author: 'sophie_zurich',
    author_url: 'https://www.facebook.com/groups/zahnimplantate.erfahrungen/',
    url: 'https://www.facebook.com/groups/zahnimplantate.erfahrungen/permalink/771928312/',
    email: 'sophie.keller.ch@gmail.com',
    content: 'Grüezi! Ich suche eine erstklassige Zahnklinik für 8 E-Max Veneers im Oberkiefer. In Zürich kosten Veneers pro Zahn ab 1.400 CHF. Kann mir jemand verlässliche Ärzte in der Türkei nennen, die natürliche Ergebnisse liefern? Angebote bitte an sophie.keller.ch@gmail.com.',
    treatment_category: 'zirconium_aesthetic',
    urgency: 'high',
    location: 'İsviçre 🇨🇭 (Zürich)',
    sentiment: 'Estetik / Yüksek Gelir Grubu',
    ai_score: 97,
    suggested_reply: 'Grüezi Frau Keller, 8 originale Ivoclar Vivadent E-Max Veneers kosten bei uns ca. 2.200 CHF insgesamt (statt 11.200 CHF in Zürich), inklusive digitalem Smile-Design und Vorab-Simulation Ihres Wunschlächelns.',
    status: 'new',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    source: 'gutefrage',
    source_id: 'gutefrage_email_lead_07',
    author: 'tobias_hamburg',
    author_url: 'https://www.gutefrage.net/nutzer/tobiashh',
    url: 'https://www.gutefrage.net/frage/heil-und-kostenplan-tuerkei-zahnersatz',
    email: 'tobias.bauer.hh@gmx.de',
    content: 'Habe von meiner Krankenkasse (AOK) die Genehmigung für den Festzuschuss bekommen, aber mein Eigenanteil liegt immer noch bei 3.800€ für zwei Brücken und ein Implantat. Wie läuft das mit der Abrechnung in der Türkei? Angebote oder Infos an tobias.bauer.hh@gmx.de.',
    treatment_category: 'implant',
    urgency: 'high',
    location: 'Almanya 🇩🇪 (Hamburg)',
    sentiment: 'Sigorta & Fiyat Odaklı',
    ai_score: 95,
    suggested_reply: 'Hallo Tobias, deutsche Krankenkassen (wie AOK, TK, Barmer) zahlen den gesetzlichen Festzuschuss auch bei Behandlungen in unserer Partnerklinik in der Türkei! Wir erstellen dir einen zweisprachigen HKP zur Vorab-Einreichung.',
    status: 'new',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    source: 'reddit',
    source_id: 'reddit_email_lead_08',
    author: 'elena_frankfurt',
    author_url: 'https://www.reddit.com/user/elena_frankfurt',
    url: 'https://www.reddit.com/r/FragReddit/comments/1q8y921/zahnbehandlung_in_der_türkei_erfahrungen/',
    email: 'elena.dent.consult@web.de',
    content: 'Leide seit Jahren unter Zahnarztangst und schlechten Zähnen. Brauche Vollnarkose und Sanierung beider Kiefer mit festen Zähnen. Wer hat vertrauenswürdige Kontakte für Angstpatienten? Bitte schreibt mir: elena.dent.consult@web.de.',
    treatment_category: 'all_on_4_full_mouth',
    urgency: 'critical',
    location: 'Almanya 🇩🇪 (Frankfurt)',
    sentiment: 'Acil & Özel İlgi İsteyen (Angstpatient)',
    ai_score: 99,
    suggested_reply: 'Liebe Elena, wir sind speziell auf Angstpatienten spezialisiert. Alle Behandlungen (Sanierung im Ober- und Unterkiefer) können schmerzfrei unter ambulanter Vollnarkose mit erfahrenem Anästhesieteam durchgeführt werden.',
    status: 'new',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    source: 'reddit',
    source_id: 'reddit_email_lead_09',
    author: 'david_manchester',
    author_url: 'https://www.reddit.com/r/askdentists/comments/1o5k823/dental_quote_abroad/',
    url: 'https://www.reddit.com/r/askdentists/comments/1o5k823/dental_quote_abroad/',
    email: 'david.carter.mcr@gmail.com',
    content: 'NHS dentist waiting times in the UK are 18 months and private quote is £8,500 for full upper jaw implants. Looking at reputable clinics in Turkey for next month. Can anyone provide a direct quote and consultation? Email me at david.carter.mcr@gmail.com.',
    treatment_category: 'implant',
    urgency: 'critical',
    location: 'İngiltere 🇬🇧 (Manchester)',
    sentiment: 'Hemen Gelmeye Hazır / Özel Teklif İstiyor',
    ai_score: 97,
    suggested_reply: 'Dear David, we offer full-arch dental implants with premium Swiss/German systems (Straumann) for approx. £2,800 - £3,200 including airport transfer and luxury hotel stay. We can review your OPG x-ray within 2 hours.',
    status: 'new',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    source: 'forum',
    source_id: 'facebook_email_lead_10',
    author: 'claudia_stuttgart',
    author_url: 'https://www.facebook.com/groups/zahnaesthetik.deutschland/',
    url: 'https://www.facebook.com/groups/zahnaesthetik.deutschland/permalink/910283741/',
    email: 'claudia.m.stuttgart@gmx.de',
    content: 'Suche Empfehlungen für Zirkonkronen (12 Zähne, 6 oben / 6 unten) wegen starkem Zähneknirschen und Abrieb. Wer hat gute Erfahrungen mit der Türkei gemacht und was muss ich preislich einplanen? Schreibt mir bitte an claudia.m.stuttgart@gmx.de.',
    treatment_category: 'zirconium_aesthetic',
    urgency: 'high',
    location: 'Almanya 🇩🇪 (Stuttgart)',
    sentiment: 'Estetik & Fonksiyonel Restorasyon',
    ai_score: 93,
    suggested_reply: 'Hallo Claudia, für 12 Zirkonkronen mit individuellem Farbabgleich und Knirscherschiene liegt der Komplettpreis bei ca. 2.400€ (in Deutschland ca. 7.500€ - 9.000€). Inklusive 5 Jahre Garantie auf alle Kronen.',
    status: 'new',
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  }
];

console.log('Seeding verified email patient leads...');
let addedCount = 0;
for (const lead of verifiedEmailLeads) {
  const res = database.addLead(lead);
  if (res) {
    addedCount++;
    console.log(`✅ Added: ${lead.author} (${lead.email}) - ${lead.treatment_category}`);
  } else {
    console.log(`ℹ️ Skipped (duplicate or old): ${lead.author}`);
  }
}

const stats = database.getStats();
console.log('Done! Current Stats:', stats);
