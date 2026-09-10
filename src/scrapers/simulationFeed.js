/**
 * DACH (Almanya, Avusturya, İsviçre) Sağlık Turizmi Hasta Adayı Veri Akışı
 * Alman, Avusturyalı ve İsviçreli hastaların gerçekçi arayış senaryoları.
 */

const DACH_SAMPLE_LEADS = [
  {
    source: 'gutefrage',
    author: 'Markus_Muenchen',
    author_url: 'https://www.gutefrage.net/nutzer/Markus_Muenchen',
    url: 'https://www.gutefrage.net/frage/erfahrungen-zahnimplantate-tuerkei-istanbul',
    content: 'Mein Zahnarzt in München verlangt für 3 Zahnimplantate laut Heil- und Kostenplan knapp 8.200€. Das übernimmt meine Krankenkasse nur zu einem Bruchteil. Hat jemand hier Erfahrungen mit Zahnkliniken in Istanbul? Gibt es dort deutschsprachige Ärzte und wie sieht es mit der Garantie aus?',
    location: 'Almanya (MÜNCHEN)'
  },
  {
    source: 'reddit',
    author: 'Stefan_Wien_AT',
    author_url: 'https://reddit.com/user/Stefan_Wien_AT',
    url: 'https://reddit.com/r/Austria/comments/zahnersatz_ausland_erfahrungen',
    content: 'Servus! Bei mir steht eine Komplettsanierung des Oberkiefers mit All-on-4 an. In Wien liegt der Kostenvoranschlag bei über 15.000€. Viele Bekannte raten mir zu einer Behandlung in der Türkei (inkl. Hotel und VIP-Transfer). Hat hier jemand konkrete Empfehlungen für seriöse Kliniken mit TÜV-Zertifizierung?',
    location: 'Avusturya (WIEN)'
  },
  {
    source: 'twitter',
    author: 'sarah_berlin',
    author_url: 'https://x.com/sarah_berlin',
    url: 'https://x.com/sarah_berlin/status/183300998812',
    content: 'Ich will mir endlich Veneers / Zirkonkronen für ein schönes Lächeln (Hollywood Smile) machen lassen. In Deutschland unbezahlbar. Wer war schon in Istanbul für ästhetische Zahnbehandlung und kann berichten? #Zahnarzt #Veneers #ZähneTürkei',
    location: 'Almanya (BERLIN)'
  },
  {
    source: 'forum',
    author: 'Lukas_Finanzen',
    author_url: 'https://reddit.com/r/Finanzen',
    url: 'https://reddit.com/r/Finanzen/comments/zahnersatz_kosten_senken_tuerkei',
    content: 'Finanzen-Frage: Zahnersatz und Implantate. Die gesetzliche Krankenkasse zahlt ja den Festzuschuss auch bei Behandlungen in der Türkei, wenn man vorher den Heil- und Kostenplan einreicht. Wer hat das schon durchgezogen und wie hoch war eure tatsächliche Ersparnis im Vergleich zu deutschen Zahnärzten?',
    location: 'Almanya (FRANKFURT)'
  },
  {
    source: 'gutefrage',
    author: 'Claudia_Zuerich',
    author_url: 'https://www.gutefrage.net/nutzer/Claudia_Zuerich',
    url: 'https://www.gutefrage.net/frage/angstpatient-zahnbehandlung-istanbul-vollnarkose',
    content: 'Grüezi! Ich bin extreme Angstpatientin und brauche 2 Implantate und 4 Kronen. In der Schweiz sind die Preise astronomisch. Gibt es in Istanbul renommierte Zahnkliniken, die Behandlungen im Dämmerschlaf anbieten und deutschsprachige Betreuung von der Ankunft bis zum Abflug garantieren?',
    location: 'İsviçre (ZÜRICH)'
  },
  {
    source: 'twitter',
    author: 'michael_hamburg',
    author_url: 'https://x.com/michael_hamburg',
    url: 'https://x.com/michael_hamburg/status/183300998815',
    content: 'Gestern beim Essen Zahn abgebrochen, Wurzel entzündet. Wurzelbehandlung oder direkt Implantat? Wenn ich mir die deutschen Zuzahlungen ansehe, buche ich direkt Flug nach Istanbul. Empfehlungen für gute Chirurgen gesucht!',
    location: 'Almanya (HAMBURG)'
  },
  {
    source: 'forum',
    author: 'anna_graz',
    author_url: 'https://forum.med1.de',
    url: 'https://forum.med1.de/zahnbehandlung-tuerkei-vorher-nachher',
    content: 'Hallo ihr Lieben, suche Erfahrungsberichte zu Zirkon-Kronen in Istanbul. Wie viele Tage Aufenthalt muss man für 10-12 Kronen einplanen? Werden die provisorischen Zähne direkt am ersten Tag eingesetzt?',
    location: 'Avusturya (GRAZ)'
  },
  {
    source: 'reddit',
    author: 'expat_koeln',
    author_url: 'https://reddit.com/r/FragReddit',
    url: 'https://reddit.com/r/FragReddit/comments/zahnimplantate_türkei_erfahrungen',
    content: 'FragReddit: Wer von euch hat sich Implantate in der Türkei machen lassen? Worauf sollte man bei den Implantat-Marken (Straumann, Nobel Biocare etc.) achten? Gibt es Kliniken, die Röntgenbilder vorab kostenlos auswerten?',
    location: 'Almanya (KÖLN)'
  }
];

const simulationFeed = {
  getSample(index = null) {
    if (index !== null && DACH_SAMPLE_LEADS[index]) {
      return { ...DACH_SAMPLE_LEADS[index], timestamp: new Date().toISOString() };
    }
    const randomIndex = Math.floor(Math.random() * DACH_SAMPLE_LEADS.length);
    return { ...DACH_SAMPLE_LEADS[randomIndex], timestamp: new Date().toISOString() };
  },

  getAllSamples() {
    return DACH_SAMPLE_LEADS.map(lead => ({
      ...lead,
      source_id: `dach_lead_${lead.source}_${Math.random().toString(36).substring(5)}`,
      created_at: new Date(Date.now() - Math.floor(Math.random() * 48 * 3600000)).toISOString()
    }));
  }
};

module.exports = simulationFeed;
