const KEYWORD_MATRIX = require('./keywordMatrix');
const fs = require('fs');
const path = require('path');

function getConfig() {
  try {
    const configPath = path.join(__dirname, '../../config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err) {
    console.error('Config okuma hatası:', err.message);
  }
  return {};
}

// Metnin dilini tespit et (Almanca / Türkçe / İngilizce)
function detectLanguage(text) {
  const lower = (text || '').toLowerCase();
  const germanSignals = ['ich', 'und', 'der', 'die', 'das', 'nicht', 'mit', 'eine', 'einen', 'zahn', 'zähne', 'kosten', 'erfahrungen', 'türkei', 'behandlung', 'mein', 'habe', 'auch'];
  let germanCount = 0;
  for (const sig of germanSignals) {
    if (new RegExp(`\\b${sig}\\b`, 'i').test(lower)) germanCount++;
  }

  if (germanCount >= 2 || lower.includes('zahnimplantat') || lower.includes('zahnersatz') || lower.includes('heil- und kostenplan')) {
    return 'de';
  }
  return 'tr';
}

const aiAnalyzer = {
  /**
   * Metni analiz eder, DACH veya yerel hasta niyetini belirler ve lead kartı üretir.
   */
  async analyze(text, metadata = {}) {
    const lowerText = (text || '').toLowerCase();
    const lang = detectLanguage(text);

    // 0. Katı Tarih ve Tazelik Kontrolü (En fazla 90 Gün / 3 Ay)
    const freshnessCheck = this.checkFreshness(text, metadata);
    if (!freshnessCheck.isFresh) {
      return { is_lead: false, reason: freshnessCheck.reason };
    }

    // 1. Negatif Filtre Kontrolü (Deyimler, Hayvanlar)
    for (const neg of KEYWORD_MATRIX.negative_filters) {
      if (lowerText.includes(neg)) {
        return { is_lead: false, reason: `Negatif filtreye takıldı: "${neg}"` };
      }
    }

    // 2. Tedavi ve Kategori Tespiti
    let detectedCategory = null;
    let matchedKeywords = [];

    for (const [catKey, catData] of Object.entries(KEYWORD_MATRIX.categories)) {
      for (const kw of catData.keywords) {
        if (lowerText.includes(kw)) {
          detectedCategory = catKey;
          matchedKeywords.push(kw);
          break;
        }
      }
      if (detectedCategory) break;
    }

    // Niyet İfadeleri (Intent Triggers)
    let hasIntentTrigger = false;
    for (const trigger of KEYWORD_MATRIX.intent_triggers) {
      if (lowerText.includes(trigger)) {
        hasIntentTrigger = true;
        matchedKeywords.push(trigger);
        break;
      }
    }

    // Diş sağlığıyla hiçbir alakası yoksa lead değildir
    const hasDentalRoot = lowerText.includes('zahn') || lowerText.includes('zähne') || 
                          lowerText.includes('diş') || lowerText.includes('dental') || 
                          lowerText.includes('teeth') || lowerText.includes('implant');

    if (!detectedCategory && !hasDentalRoot) {
      return { is_lead: false, reason: 'Diş sağlığıyla ilgili anahtar kelime bulunamadı.' };
    }

    if (!detectedCategory) {
      detectedCategory = 'implant'; // DACH arayışlarında varsayılan yüksek değerli tedavi
    }

    // 3. Lokasyon / Ülke Tespiti (Almanya / Avusturya / İsviçre / Türkiye)
    let detectedLocation = metadata.location || 'Almanya (DE)';
    for (const [locName, keywords] of Object.entries(KEYWORD_MATRIX.locations)) {
      for (const kw of keywords) {
        if (lowerText.includes(kw)) {
          detectedLocation = locName.includes('Almanya') ? `Almanya (${kw.toUpperCase()})` :
                             locName.includes('Avusturya') ? `Avusturya (${kw.toUpperCase()})` :
                             locName.includes('İsviçre') ? `İsviçre (${kw.toUpperCase()})` : locName;
          break;
        }
      }
      if (detectedLocation !== 'Almanya (DE)' && detectedLocation !== (metadata.location || 'Almanya (DE)')) break;
    }

    // 4. Aciliyet ve Skorlama
    let urgency = 'medium';
    let aiScore = 75;

    if (
      lowerText.includes('zahnschmerzen') || 
      lowerText.includes('notfall') || 
      lowerText.includes('çok ağrıyor') || 
      lowerText.includes('abgebrochen') ||
      detectedCategory === 'toothache_emergency'
    ) {
      urgency = 'critical';
      aiScore = 95;
    } else if (
      detectedCategory === 'implant' || 
      detectedCategory === 'zirconium_aesthetic' || 
      lowerText.includes('heil- und kostenplan') || 
      lowerText.includes('erfahrungen') || 
      hasIntentTrigger
    ) {
      urgency = 'high';
      aiScore = 90; // Sağlık turizmi implant/zirkonyum hastaları en yüksek puanlıdır
    }

    // 5. Harici LLM Kontrolü (Gemini veya OpenAI API tanımlıysa)
    const config = getConfig();
    const geminiKey = process.env.GEMINI_API_KEY || config.api_keys?.gemini_api_key;
    const openAiKey = process.env.OPENAI_API_KEY || config.api_keys?.openai_api_key;

    if (geminiKey) {
      try {
        const llmResult = await this.callGemini(geminiKey, text, detectedCategory, urgency, detectedLocation, lang, metadata);
        if (llmResult) {
          if (llmResult.is_lead === false) {
            return { is_lead: false, reason: llmResult.reject_reason || 'AI Tarih/Tazelik Filtresine takıldı (90 günden eski veya arşivlenmiş).' };
          }
          return {
            is_lead: true,
            treatment_category: llmResult.treatment_category || detectedCategory,
            urgency: llmResult.urgency || urgency,
            location: llmResult.location || detectedLocation,
            sentiment: llmResult.patient_intent_summary || llmResult.sentiment || (lang === 'de' ? 'Interesse an Zahnbehandlung Türkei' : 'Hasta Arayışı'),
            ai_score: llmResult.ai_score || aiScore,
            suggested_reply: llmResult.suggested_reply,
            matched_keywords: matchedKeywords
          };
        }
      } catch (e) {
        console.warn('Gemini API çağrısı uyarısı:', e.message);
      }
    }

    // 6. Akıllı Yerel Yanıt Üretici (Almanca & Türkçe Destekli)
    const suggestedReply = this.generateLocalReply(detectedCategory, urgency, metadata.author, lang);

    return {
      is_lead: true,
      treatment_category: detectedCategory,
      urgency: urgency,
      location: detectedLocation,
      sentiment: lang === 'de' ? 'Kostenvergleich & Kliniksuche (DACH)' : (urgency === 'critical' ? 'Acil Ağrı' : 'Fiyat & Hekim Arayışı'),
      ai_score: aiScore,
      suggested_reply: suggestedReply,
      matched_keywords: matchedKeywords
    };
  },

  /**
   * Almanca veya Türkçe profesyonel klinik yanıt taslağı üretir.
   */
  generateLocalReply(category, urgency, author, lang = 'de') {
    const authorHandle = author ? `@${author}` : '';

    if (lang === 'de') {
      // Kusursuz, güven verici Almanca klinik yanıtları
      switch (category) {
        case 'implant':
          return `Guten Tag ${authorHandle}, viele Grüße aus Istanbul! Gerne prüfen unsere deutschsprachigen Chefärzte Ihren deutschen Heil- und Kostenplan kostenlos und unverbindlich. In unserer modernen, zertifizierten Zahnklinik verwenden wir ausschließlich weltweite Premium-Implantate (wie Straumann) zu ca. 60-70% geringeren Gesamtkosten. Unser All-Inclusive-Paket beinhaltet deutschsprachige Betreuung, VIP-Flughafentransfer und 4/5-Sterne-Hotel. Senden Sie uns gerne eine Nachricht für eine unverbindliche 3D-Röntgenauswertung!`;

        case 'zirconium_aesthetic':
          return `Hallo ${authorHandle}! Für ein natürliches Hollywood Smile mit Zirkonkronen oder E-Max Veneers sind Sie in unserer Klinik in den besten Händen. Unsere ästhetischen Zahnmediziner arbeiten mit modernster digitaler Smile-Design-Technologie (CAD/CAM). Der gesamte Aufenthalt dauert in der Regel nur 5 bis 6 Tage – inklusive Hotelunterkunft und persönlicher Betreuung auf Deutsch. Schreiben Sie uns gerne direkt an, um Vorher-Nachher-Ergebnisse und ein persönliches Angebot zu erhalten!`;

        case 'orthodontics_invisalign':
          return `Guten Tag ${authorHandle}! Eine unauffällige Zahnkorrektur mit transparenten Alignern bieten wir auf höchstem Niveau. Nach einem präzisen 3D-Intraoralscan erhalten Sie Ihre maßgefertigten Schienen bequem für die gesamte Behandlungsdauer mit nach Hause. Gerne beraten wir Sie unverbindlich auf Deutsch!`;

        case 'toothache_emergency':
          return `Guten Tag ${authorHandle}, akute Zahnschmerzen und Entzündungen sollten dringend fachärztlich untersucht werden, um den Zahn zu erhalten. Sollten Sie sich derzeit in der Türkei aufhalten oder zeitnah anreisen, steht Ihnen unser Notdienst für eine sofortige, schmerzfreie Behandlung jederzeit zur Verfügung. Gute Besserung!`;

        default:
          return `Guten Tag ${authorHandle}, bei Fragen zu professionellen Zahnbehandlungen, Implantaten oder ästhetischer Zahnkorrektur in Istanbul steht Ihnen unser deutschsprachiges Team jederzeit beratend zur Seite. Gerne erstellen wir Ihnen ein unverbindliches Angebot auf Basis Ihres Röntgenbildes. Herzliche Grüße!`;
      }
    }

    // Türkçe Yanıtlar
    const nameGreeting = author ? `Merhaba @${author}` : 'Merhaba';
    if (category === 'implant') {
      return `${nameGreeting}, merhabalar. İmplant ve All-on-4 tedavilerinde kliniğimizde 3D tomografi ile ücretsiz ön planlama sunuyoruz. Yurt dışından gelen hastalarımız için havalimanı transferi ve konaklama dahil VIP paketlerimiz mevcuttur. Detaylı bilgi için bize ulaşabilirsiniz.`;
    }
    return `${nameGreeting}, çok geçmiş olsun. Diş sağlığınızla ilgili tüm sorularınız için uzman hekim kadromuzla yanınızdayız. Size yardımcı olmaktan memnuniyet duyarız.`;
  },

  /**
   * 📅 Katı Tarih ve Tazelik Denetçisi (En fazla 90 gün / 3 ay)
   * Eski arşiv, silinmiş kullanıcı ve 1+ yıllık gönderileri kesin olarak eler.
   */
  checkFreshness(text, metadata = {}) {
    const combined = `${text || ''} ${metadata.author || ''} ${metadata.url || ''} ${metadata.snippet || ''} ${metadata.date || ''}`.toLowerCase();

    // 1. Arşivlenmiş ve Silinmiş Gönderi Belirteçleri
    if (
      combined.includes('arşivlenmiş') ||
      combined.includes('archiviert') ||
      combined.includes('archived') ||
      combined.includes('[silindi]') ||
      combined.includes('[deleted]') ||
      combined.includes('[removed]')
    ) {
      return { isFresh: false, reason: 'Gönderi arşivlenmiş veya silinmiş hesap.' };
    }

    // 2. Yıllar Öncesi Zaman İfadeleri (1+ yıl önce, 2 yıl önce, 4 yıl önce vb.)
    const oldTimeRegex = /(?:(\d+)\s*(?:yıl|yil|sene)\s*önce)|(?:vor\s*(\d+)\s*jahren?)|(?:(\d+)\s*years?\s*ago)|(?:(\d+)\s*yrs?\s*ago)/i;
    const matchOld = combined.match(oldTimeRegex);
    if (matchOld) {
      return { isFresh: false, reason: `Eski tarih tespit edildi: "${matchOld[0]}" (90 günden eski)` };
    }

    // 3. 2025 ve Öncesi Yıl Tespiti (2020, 2021, 2022, 2023, 2024, 2025)
    const oldYearRegex = /\b(201\d|202[0-5])\b/;
    const matchYear = combined.match(oldYearRegex);
    if (matchYear) {
      return { isFresh: false, reason: `Eski yıl tespit edildi: ${matchYear[0]} (Geçerli aralık: 2026)` };
    }

    // 4. Metadata İçindeki created_at / date Kontrolü
    const dateToCheck = metadata.created_at || metadata.date;
    if (dateToCheck) {
      const parsedDate = new Date(dateToCheck);
      if (!isNaN(parsedDate.getTime())) {
        const diffDays = (Date.now() - parsedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 90) {
          return { isFresh: false, reason: `Gönderi tarihi ${Math.round(diffDays)} gün öncesine ait (Maksimum 90 gün)` };
        }
      }
    }

    return { isFresh: true };
  },

  /**
   * Gemini API ile DACH Sağlık Turizmi ve Tarih Analizi
   */
  async callGemini(apiKey, text, category, urgency, location, lang, metadata = {}) {
    const models = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];
    const prompt = `Du bist ein erfahrener zahnmedizinischer Chef-Berater für internationalen Gesundheitstourismus (Türkei / Istanbul).
Deine wichtigste Aufgabe ist es, den folgenden Text aus Social Media / Foren tiefgehend auf ECHTE PATIENTEN-ABSICHT (GENUINE PATIENT INTENT) und AKTUALITÄT zu prüfen.

WICHTIGSTE REGEL: Wir suchen ausschließlich ECHTE MENSCHEN, DIE PERSÖNLICH FÜR SICH SELBST (oder einen direkten Angehörigen wie Mutter/Vater) EINE ZAHNBEHANDLUNG SUCHEN!

STRIKTE AUSSCHLUSSKRITERIEN (Sofort mit {"is_lead": false, "reject_reason": "..."} ablehnen):
1. KLINIK-WERBUNG / MARKETING: Der Verfasser ist eine Zahnklinik, ein Vermittler, Promoter oder Arzt, der eigene Dienste anbietet (z.B. "DM us", "We offer", "Book your Hollywood Smile", "Unsere Praxis", "Vorher-Nachher"). -> reject_reason: "clinic_advertisement_or_promoter"
2. KEIN BEHANDLUNGSBEDARF: Allgemeine Hygiene-Tipps, Diät-Tipps, Smalltalk, Witze oder rein akademische Diskussionen ohne persönliche Behandlungsabsicht. -> reject_reason: "not_a_patient_inquiry"
3. VERALTET / ARCHIVIERT: Älter als 90 Tage (z.B. aus 2021-2024, vor 1-4 Jahren), archiviert, gesperrt oder gelöscht. -> reject_reason: "older_than_90_days_or_archived"

ZULASSUNGSKRITERIEN (NUR DANN {"is_lead": true}):
- Eine echte Person beschreibt ein persönliches Zahnproblem (Zahnschmerzen, fehlende Zähne, Zähneknirschen, schiefe/verfärbte Zähne, abgebrochener Zahn, gescheiterte Wurzelbehandlung).
- ODER stellt Fragen zu Behandlungen/Kosten/Kliniken (z.B. "Was kostet All-on-4 in Istanbul?", "Welche Klinik könnt ihr empfehlen?", "Wie viel habt ihr für eure Zirkonkronen bezahlt?", "Brauche Knochenaufbau, wer hat Erfahrungen?").
- ODER vergleicht einen teuren Kostenvoranschlag aus Deutschland/Österreich/Schweiz/UK mit einer Behandlung im Ausland.

Antworte AUSSCHLIESSLICH im folgenden JSON-Format (kein Markdown, keine Backticks):
{
  "is_lead": true,
  "patient_intent_summary": "Prägnante Zusammenfassung auf Türkisch/Deutsch, was der Patient konkret für sich selbst sucht.",
  "treatment_category": "implant",
  "urgency": "high",
  "location": "Erkannter Wohnort / Land des Patienten",
  "ai_score": 92,
  "suggested_reply": "Eine empathische, hochprofessionelle Antwort als Chefarzt auf Deutsch oder Englisch (passend zur Sprache des Patienten), die genau auf sein geschildertes Problem eingeht, TÜV-geprüfte Qualität und kostenlose Vorab-Röntgenprüfung anbietet (3-4 Sätze)."
}

FALLS KEIN ECHTER PATIENT ODER ABGELEHNT:
{
  "is_lead": false,
  "reject_reason": "Kurze präzise Begründung (z.B. clinic_advertisement_or_promoter, not_a_patient_inquiry, older_than_90_days)"
}

TEXT ZUR ANALYSE:
"${(text || '').replace(/"/g, '\\"')}"`;

    for (const model of models) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        const rawAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const match = rawAnswer.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          return parsed;
        }
      } catch (err) {
        // Sonraki modele geç
      }
    }
    return null;
  }
};

module.exports = aiAnalyzer;
