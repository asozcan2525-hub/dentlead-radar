/**
 * Diş Kliniği Müşteri Radarı - DACH (Almanya, Avusturya, İsviçre) ve Global Niyet Matrisi
 * Almanca ve uluslararası sağlık turizmi aramaları için optimize edilmiştir.
 */

const KEYWORD_MATRIX = {
  // Tedavi Kategorileri (Almanca + Türkçe + İngilizce)
  categories: {
    implant: {
      name: "İmplant & All-on-4 / Zahnimplantate",
      value_level: "high", // 2.000€ - 8.000€ arası yüksek ciro
      keywords: [
        // Almanca
        "zahnimplantat", "zahnimplantate", "implantate türkei", "implantat kosten", 
        "all on 4 türkei", "all-on-4", "all on 6", "zahnersatz türkei", "zahnersatz ausland", 
        "knochenaufbau", "sinuslift", "feste dritte zähne", "zähne türkei erfahrungen",
        "heil- und kostenplan zahnersatz", "zahnklinik istanbul implantat",
        // İngilizce & Türkçe
        "dental implants turkey", "all on 4 turkey", "teeth in turkey", 
        "implant", "vidalı diş", "all on 4"
      ]
    },
    zirconium_aesthetic: {
      name: "Zirkonyum & Gülüş / Veneers & Zirkonkronen",
      value_level: "high",
      keywords: [
        // Almanca
        "veneers türkei", "zirkon kronen", "zirkonkronen", "hollywood smile türkei", 
        "zahnkronen kosten", "bleaching türkei", "ästhetische zahnheilkunde", 
        "zahnverblendung", "lumineers", "lächeln verschönern", "zahnüberkronung",
        // İngilizce & Türkçe
        "veneers turkey", "hollywood smile istanbul", "zirkonyum", "gülüş tasarımı"
      ]
    },
    orthodontics_invisalign: {
      name: "Şeffaf Plak / Zahnspange & Aligner",
      value_level: "high",
      keywords: [
        // Almanca
        "zahnspange erwachsene", "invisalign kosten", "unsichtbare zahnspange", 
        "aligner erfahrungen", "zahnkorrektur", "drsmile", "schiefe zähne",
        // Türkçe & İngilizce
        "şeffaf plak", "invisalign", "clear aligners"
      ]
    },
    toothache_emergency: {
      name: "Acil Diş Ağrısı / Zahnschmerzen & Notfall",
      value_level: "urgent",
      keywords: [
        // Almanca
        "zahnschmerzen", "starke zahnschmerzen", "zahnfleischentzündung", 
        "zahnarzt notdienst", "zahn abgebrochen", "dicke backe", "wurzelbehandlung schmerzen",
        // Türkçe & İngilizce
        "dişim ağrıyor", "diş ağrısı", "severe toothache", "emergency dentist"
      ]
    },
    root_canal: {
      name: "Kanal Tedavisi / Wurzelbehandlung",
      value_level: "medium",
      keywords: [
        // Almanca
        "wurzelbehandlung", "wurzelspitzenresektion", "endodontie", "nervbehandlung zahn",
        // Türkçe & İngilizce
        "kanal tedavisi", "root canal"
      ]
    },
    wisdom_tooth: {
      name: "20'lik Diş / Weisheitszähne",
      value_level: "medium",
      keywords: [
        // Almanca
        "weisheitszahn", "weisheitszähne op", "weisheitszahn gezogen", "retinierter zahn",
        // Türkçe & İngilizce
        "20lik diş", "yirmilik diş", "wisdom teeth"
      ]
    },
    general_checkup: {
      name: "Genel Diş / Zahnreinigung & Füllung",
      value_level: "standard",
      keywords: [
        // Almanca
        "zahnarzt empfehlung", "professionelle zahnreinigung", "karies behandlung", 
        "zahnfüllung herausgefallen", "parodontose", "zahnarztphobie", "angstpatient zahnarzt",
        // Türkçe & İngilizce
        "diş hekimi", "dişçi tavsiye", "dentist recommendation"
      ]
    }
  },

  // Almanca ve Sağlık Turizmi Niyet İfadeleri (Intent Triggers)
  intent_triggers: [
    // Almanca
    "wer hat erfahrung mit", "erfahrungen gesucht", "kann jemand eine zahnklinik empfehlen", 
    "lohnt sich das", "kostenvergleich", "heil- und kostenplan", "krankenkasse zahnersatz", 
    "zahnbehandlung im ausland", "gute zahnklinik in istanbul", "zahnarzt in der türkei", 
    "was kostet", "kostenvoranschlag", "zuschuss krankenkasse", "angebot erhalten",
    // Türkçe & İngilizce
    "türkei erfahrungen", "turkey teeth reviews", "clinic recommendations", "how much does it cost"
  ],

  // Yanlış Pozitifleri Eleme Listesi (Mecazlar, Deyimler, Hayvanlar)
  negative_filters: [
    // Almanca
    "zahn der zeit", "haare auf den zähnen", "auf den zahn fühlen", "zahnfee", 
    "zahnrad", "katzenzahn", "hundezahn", "einen zahn zulegen", "zahnlos",
    // Türkçe & İngilizce
    "diş bilemek", "dişe dokunur", "diş perisi", "vampire teeth"
  ],

  // Hedef Ülke ve Şehirler (DACH Bölgesi Öncelikli)
  locations: {
    "Almanya (DE)": [
      "deutschland", "berlin", "münchen", "hamburg", "köln", "frankfurt", 
      "stuttgart", "düsseldorf", "leipzig", "dortmund", "essen", "bremen", 
      "hannover", "nürnberg", "duisburg", "bonn"
    ],
    "Avusturya (AT)": [
      "österreich", "austria", "wien", "graz", "linz", "salzburg", "innsbruck", "klagenfurt"
    ],
    "İsviçre (CH)": [
      "schweiz", "switzerland", "zürich", "basel", "bern", "luzern", "st. gallen"
    ],
    "Sağlık Turizmi (Global)": [
      "turkey teeth", "dental tourism", "istanbul dentist", "antalya dentist", "uk to turkey"
    ],
    "Türkiye (Yerel)": [
      "istanbul", "ankara", "izmir", "antalya", "bursa"
    ]
  }
};

module.exports = KEYWORD_MATRIX;
