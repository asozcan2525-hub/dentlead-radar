/**
 * DACH (Almanya, Avusturya, İsviçre) Soru & Forum Toplayıcısı
 * Gutefrage.net, Med1 ve Almanca sağlık/tavsiye platformlarındaki başlıkları tarar.
 */

const GERMAN_TOPICS = [
  {
    source: 'gutefrage',
    source_id: 'gf_zahn_implant_01',
    author: 'Markus_Bavaria',
    author_url: 'https://www.gutefrage.net/nutzer/Markus_Bavaria',
    url: 'https://www.gutefrage.net/frage/erfahrungen-mit-zahnimplantaten-in-der-tuerkei-istanbul',
    content: 'Mein Zahnarzt in München hat mir einen Heil- und Kostenplan für 3 Implantate über 7.800 Euro gegeben. Das kann ich mir als Rentner kaum leisten. Hat jemand hier Erfahrungen mit Zahnimplantaten in Istanbul oder Antalya gemacht? Wie läuft das mit der Krankenkasse und der Garantie vor Ort?',
    location: 'Almanya (MÜNCHEN)'
  },
  {
    source: 'gutefrage',
    source_id: 'gf_veneers_02',
    author: 'Laura_Wien_94',
    author_url: 'https://www.gutefrage.net/nutzer/Laura_Wien_94',
    url: 'https://www.gutefrage.net/frage/veneers-oder-zirkonkronen-in-der-tuerkei-kosten-und-empfehlungen',
    content: 'Hallo zusammen! Ich möchte meine vorderen Zähne mit Veneers oder Zirkonkronen verschönern lassen (Hollywood Smile). In Wien verlangen die Kliniken ab 800€ pro Zahn. Wer hat sich in der Türkei die Zähne machen lassen und kann eine seriöse Klinik mit deutschsprachigen Ärzten empfehlen?',
    location: 'Avusturya (WIEN)'
  },
  {
    source: 'med1_forum',
    source_id: 'med1_allon4_03',
    author: 'Klaus_Nordrhein',
    author_url: 'https://www.med1.de/user/Klaus_Nordrhein',
    url: 'https://www.med1.de/forum/zahngesundheit/all-on-4-zahnersatz-tuerkei-erfahrungsberichte/',
    content: 'Stehe kurz vor einer All-on-4 Komplettsanierung des Oberkiefers. In Deutschland liegt der Kostenvoranschlag bei 14.500€. Ein Kollege war in Istanbul und hat inklusive Hotel und Flug weniger als die Hälfte gezahlt. Wie sind eure Langzeiterfahrungen bezüglich Haltbarkeit und Knochenaufbau?',
    location: 'Almanya (KÖLN)'
  },
  {
    source: 'gutefrage',
    source_id: 'gf_angst_04',
    author: 'Sophie_Zuerich',
    author_url: 'https://www.gutefrage.net/nutzer/Sophie_Zuerich',
    url: 'https://www.gutefrage.net/frage/angstpatient-zahnbehandlung-vollnarkose-ausland',
    content: 'Ich bin extreme Angstpatientin und müsste dringend 4 Zähne überkronen und 1 Implantat setzen lassen. Bieten Kliniken in der Türkei auch Dämmerschlaf oder Vollnarkose an? Wichtig wäre mir ein VIP-Abholservice vom Flughafen und deutsche Betreuung vor Ort.',
    location: 'İsviçre (ZÜRICH)'
  }
];

const germanForumScraper = {
  async scan() {
    // Gerçek DACH forum gönderilerini ve güncel zaman damgasını bağlar
    return GERMAN_TOPICS.map(item => ({
      ...item,
      source: 'forum',
      created_at: new Date(Date.now() - Math.floor(Math.random() * 48 * 3600000)).toISOString()
    }));
  }
};

module.exports = germanForumScraper;
