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
        const llmResult = await this.callGemini(geminiKey, text, detectedCategory, urgency, detectedLocation, lang);
        if (llmResult) {
          return {
            is_lead: true,
            treatment_category: llmResult.treatment_category || detectedCategory,
            urgency: llmResult.urgency || urgency,
            location: llmResult.location || detectedLocation,
            sentiment: llmResult.sentiment || (lang === 'de' ? 'Interesse an Zahnbehandlung Türkei' : 'Hasta Arayışı'),
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
   * Gemini API ile DACH Sağlık Turizmi Analizi
   */
  async callGemini(apiKey, text, category, urgency, location, lang) {
    // Gemini Flash en son sürüm (gemini-flash-latest / gemini-3.6-flash)
    const models = ['gemini-flash-latest', 'gemini-3.6-flash'];
    const prompt = `Du bist ein erfahrener zahnmedizinischer Patientenberater für Gesundheitstourismus in einer renommierten Zahnklinik in Istanbul.
Analysiere folgenden Text aus einem deutschen Forum / Social Media:

TEXT: "${text.replace(/"/g, '\\"')}"

Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt (kein Markdown, kein weiterer Text):
{
  "is_lead": true,
  "treatment_category": "implant",
  "urgency": "high",
  "location": "Almanya / Avusturya / Schweiz Stadt oder Land",
  "sentiment": "Interesse an Zahnbehandlung Ausland / Kostenvergleich",
  "ai_score": 90,
  "suggested_reply": "Eine hochprofessionelle, vertrauensbildende Antwort auf Deutsch (3-4 Sätze)."
}`;

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
          const errBody = await response.text();
          console.warn(`Gemini (${model}) başarısız: HTTP ${response.status} - ${errBody.slice(0, 100)}`);
          continue;
        }

        const data = await response.json();
        const rawAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const match = rawAnswer.match(/\{[\s\S]*\}/);
        if (match) {
          return JSON.parse(match[0]);
        }
      } catch (err) {
        console.warn(`Gemini (${model}) çağrısında hata:`, err.message);
      }
    }
    return null;
  }
};

module.exports = aiAnalyzer;
