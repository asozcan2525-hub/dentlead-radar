/**
 * E-Posta Outreach Servisi
 * Gmail/Outlook web linkleri oluşturur ve kişiselleştirilmiş şablonlar üretir.
 */

const emailOutreachService = {

  /**
   * Tedavi kategorisine göre Almanca e-posta şablonu oluşturur
   */
  generateTemplate(lead, language = 'de') {
    const templates = this.getTemplates();
    const category = lead.treatment_category || 'general_checkup';
    const template = templates[category] || templates['general_checkup'];

    const patientName = this.extractName(lead.author || lead.email);
    const greeting = language === 'de' 
      ? `Sehr geehrte/r ${patientName}` 
      : `Dear ${patientName}`;

    const subject = language === 'de' ? template.subject_de : template.subject_en;
    const body = language === 'de' ? template.body_de : template.body_en;

    return {
      subject: subject,
      body: body.replace('{NAME}', patientName).replace('{GREETING}', greeting),
      greeting,
      patientName
    };
  },

  /**
   * Hasta adından isimlendirme çıkar
   */
  extractName(raw) {
    if (!raw) return 'Patient/in';
    const name = raw.split('@')[0]
      .replace(/[0-9_.-]+/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim();
    return name || 'Patient/in';
  },

  /**
   * Gmail web compose linki oluşturur
   */
  buildGmailLink(to, subject, body) {
    const params = new URLSearchParams({
      view: 'cm',
      fs: '1',
      to: to,
      su: subject,
      body: body
    });
    return `https://mail.google.com/mail/?${params.toString()}`;
  },

  /**
   * Outlook web compose linki oluşturur
   */
  buildOutlookLink(to, subject, body) {
    const params = new URLSearchParams({
      to: to,
      subject: subject,
      body: body
    });
    return `https://outlook.live.com/mail/0/deeplink/compose?${params.toString()}`;
  },

  /**
   * mailto: linki oluşturur (masaüstü mail client)
   */
  buildMailtoLink(to, subject, body) {
    return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  },

  /**
   * Lead için tüm outreach linklerini oluşturur
   */
  buildOutreachLinks(lead, language = 'de') {
    const template = this.generateTemplate(lead, language);
    return {
      gmail: this.buildGmailLink(lead.email, template.subject, template.body),
      outlook: this.buildOutlookLink(lead.email, template.subject, template.body),
      mailto: this.buildMailtoLink(lead.email, template.subject, template.body),
      template
    };
  },

  /**
   * Tedavi kategorilerine göre e-posta şablonları
   */
  getTemplates() {
    return {
      implant: {
        subject_de: 'Kostenlose Ersteinschätzung für Zahnimplantate — bis zu 70% günstiger',
        subject_en: 'Free Initial Assessment for Dental Implants — Save up to 70%',
        body_de: `{GREETING},

wir haben Ihre Anfrage bezüglich Zahnimplantaten gesehen und möchten Ihnen gerne weiterhelfen.

Unsere TÜV-zertifizierte Partnerklinik in Istanbul bietet Premium-Implantate (Straumann, Nobel Biocare, Bego) zu deutlich günstigeren Konditionen als in Deutschland/Österreich/Schweiz an:

✅ Einzelimplantat inkl. Krone: ab 690€ (statt 2.500€+)
✅ All-on-4 Komplettsanierung: ab 3.900€ (statt 12.000€+)
✅ Deutschsprachige Betreuung rund um die Uhr
✅ 10 Jahre Garantie auf alle Implantate
✅ Kostenloser Flughafentransfer & Hotelpaket

Für eine unverbindliche Ersteinschätzung senden Sie uns einfach Ihr OPG-Röntgenbild — wir erstellen Ihnen innerhalb von 24 Stunden einen detaillierten Behandlungsplan mit Kostenvoranschlag.

Auch die Einreichung bei Ihrer Krankenkasse (AOK, TK, Barmer etc.) unterstützen wir mit einem zweisprachigen Heil- und Kostenplan.

Mit freundlichen Grüßen
DentArt Istanbul International Clinic
Tel: +49 30 0000000 (Deutsches Büro)
Web: https://example-dental-tourism.com`,
        body_en: `{GREETING},

We noticed your inquiry about dental implants and would love to help.

Our certified partner clinic in Istanbul offers premium implants (Straumann, Nobel Biocare, Bego) at significantly lower prices:

✅ Single implant incl. crown: from €690 (instead of €2,500+)
✅ All-on-4 full-arch: from €3,900 (instead of €12,000+)
✅ English/German-speaking medical team
✅ 10-year warranty on all implants
✅ Complimentary airport transfer & hotel package

For a free assessment, simply send us your OPG x-ray — we'll provide a detailed treatment plan within 24 hours.

Best regards,
DentArt Istanbul International Clinic
Tel: +49 30 0000000
Web: https://example-dental-tourism.com`
      },

      zirconium_aesthetic: {
        subject_de: 'Unverbindliches Angebot: Zirkonkronen & Veneers — Premium-Qualität zum besten Preis',
        subject_en: 'Free Quote: Zirconia Crowns & Veneers — Premium Quality, Best Price',
        body_de: `{GREETING},

wir haben Ihr Interesse an ästhetischer Zahnbehandlung (Veneers / Zirkonkronen) gesehen.

In unserer Istanbuler Partnerklinik erhalten Sie:

✅ E-Max Veneers: ab 195€ pro Zahn (statt 800-1.400€)
✅ Zirkonkronen: ab 175€ pro Zahn (statt 600-1.000€)
✅ Hollywood Smile Komplett: ab 2.400€ (20 Zähne)
✅ Digitales Smile-Design mit Vorher-Nachher-Simulation
✅ CE-zertifizierte Materialien (Ivoclar Vivadent)

Senden Sie uns ein Foto Ihres Lächelns für eine kostenlose Smile-Design-Simulation!

Mit freundlichen Grüßen
DentArt Istanbul International Clinic`,
        body_en: `{GREETING},

We saw your interest in aesthetic dental treatments (veneers/zirconia crowns).

At our partner clinic in Istanbul, you can get:

✅ E-Max Veneers: from €195 per tooth (instead of €800-1,400)
✅ Zirconia Crowns: from €175 per tooth (instead of €600-1,000)
✅ Hollywood Smile Complete: from €2,400 (20 teeth)
✅ Digital Smile Design with before-after simulation
✅ CE-certified materials (Ivoclar Vivadent)

Send us a photo of your smile for a free Smile Design simulation!

Best regards,
DentArt Istanbul International Clinic`
      },

      orthodontics_invisalign: {
        subject_de: 'Unsichtbare Zahnkorrektur — Aligner-Behandlung zum Sparpreis',
        subject_en: 'Invisible Teeth Alignment — Clear Aligner Treatment at Best Price',
        body_de: `{GREETING},

wir haben Ihre Frage zu Zahnkorrekturen / Alignern gelesen und möchten Ihnen eine kostengünstige Alternative anbieten.

✅ Komplette Aligner-Behandlung: ab 1.900€ (statt 4.000-7.000€)
✅ 3D-Scan und digitaler Behandlungsplan
✅ Deutschsprachige kieferorthopädische Beratung
✅ Nachsorge-Koordination mit Ihrem Zahnarzt vor Ort

Senden Sie uns ein Foto Ihrer Zähne für eine kostenlose Ersteinschätzung!

Mit freundlichen Grüßen
DentArt Istanbul International Clinic`,
        body_en: `{GREETING},

We noticed your question about teeth alignment and would like to offer a cost-effective solution.

✅ Complete aligner treatment: from €1,900 (instead of €4,000-7,000)
✅ 3D scan and digital treatment plan
✅ English-speaking orthodontic consultation

Send us a photo of your teeth for a free initial assessment!

Best regards,
DentArt Istanbul International Clinic`
      },

      emergency_toothache: {
        subject_de: 'Schnelle Hilfe bei Zahnschmerzen — Notfall-Beratung',
        subject_en: 'Quick Help for Dental Pain — Emergency Consultation',
        body_de: `{GREETING},

wir haben gesehen, dass Sie unter akuten Zahnbeschwerden leiden. Wir können Ihnen schnell und unkompliziert helfen.

Unsere Klinik bietet:
✅ Kostenlose Online-Notfall-Beratung innerhalb von 2 Stunden
✅ Notfall-Termine auch am Wochenende
✅ Wurzelbehandlung: ab 120€ (statt 400-800€)
✅ Schmerzfreie Behandlung unter Sedierung möglich

Schildern Sie uns Ihre Situation und wir melden uns umgehend!

Mit freundlichen Grüßen
DentArt Istanbul International Clinic`,
        body_en: `{GREETING},

We noticed you're experiencing dental pain. We'd like to help quickly.

Our clinic offers:
✅ Free online emergency consultation within 2 hours
✅ Weekend emergency appointments
✅ Root canal treatment: from €120 (instead of €400-800)
✅ Pain-free treatment under sedation

Describe your situation and we'll respond promptly!

Best regards,
DentArt Istanbul International Clinic`
      },

      all_on_4_full_mouth: {
        subject_de: 'VIP All-on-4/6 Komplettsanierung — All-Inclusive Angebot',
        subject_en: 'VIP All-on-4/6 Full Mouth Restoration — All-Inclusive Package',
        body_de: `{GREETING},

Sie interessieren sich für eine Komplettsanierung (All-on-4 / All-on-6)? Wir bieten Ihnen ein VIP-All-Inclusive-Paket:

✅ All-on-4 pro Kiefer: ab 3.900€ (statt 12.000-18.000€)
✅ All-on-6 pro Kiefer: ab 4.500€ (statt 14.000-22.000€)
✅ Premium-Implantate (Straumann / Nobel Biocare)
✅ 5-Sterne-Hotel inklusive (5-7 Nächte)
✅ VIP-Flughafentransfer
✅ Deutschsprachiger Chefarzt
✅ 10 Jahre Garantie

Für ein individuelles Angebot senden Sie uns bitte Ihr OPG-Röntgenbild.

Mit freundlichen Grüßen
DentArt Istanbul International Clinic`,
        body_en: `{GREETING},

Interested in full mouth restoration (All-on-4/6)? We offer a VIP all-inclusive package:

✅ All-on-4 per jaw: from €3,900 (instead of €12,000-18,000)
✅ All-on-6 per jaw: from €4,500 (instead of €14,000-22,000)
✅ Premium implants (Straumann / Nobel Biocare)
✅ 5-star hotel included (5-7 nights)
✅ VIP airport transfer
✅ 10-year warranty

For a personalized quote, please send us your OPG x-ray.

Best regards,
DentArt Istanbul International Clinic`
      },

      root_canal: {
        subject_de: 'Wurzelbehandlung — Qualität zum fairen Preis',
        subject_en: 'Root Canal Treatment — Quality at Fair Price',
        body_de: `{GREETING},

wir haben Ihre Anfrage zur Wurzelbehandlung gelesen und möchten Ihnen helfen.

✅ Wurzelbehandlung: ab 120€ pro Zahn (statt 400-800€)
✅ Mikroskopgestützte Endodontie
✅ Schmerzfreie Behandlung garantiert
✅ Keramische Aufbaufüllung inklusive

Schreiben Sie uns für eine kostenlose Beratung!

Mit freundlichen Grüßen
DentArt Istanbul International Clinic`,
        body_en: `{GREETING},

We saw your question about root canal treatment and would like to help.

✅ Root canal: from €120 per tooth (instead of €400-800)
✅ Microscope-assisted endodontics
✅ Pain-free treatment guaranteed

Contact us for a free consultation!

Best regards,
DentArt Istanbul International Clinic`
      },

      wisdom_tooth: {
        subject_de: 'Weisheitszahn-OP — Schmerzfrei und günstig',
        subject_en: 'Wisdom Tooth Removal — Pain-free and Affordable',
        body_de: `{GREETING},

wir haben Ihre Frage zur Weisheitszahn-Behandlung gesehen.

✅ Weisheitszahn-Extraktion: ab 90€ (statt 200-500€)
✅ Operative Entfernung unter Sedierung möglich
✅ Sofortige Nachsorge inklusive

Schreiben Sie uns für einen schnellen Termin!

Mit freundlichen Grüßen
DentArt Istanbul International Clinic`,
        body_en: `{GREETING},

We noticed your question about wisdom teeth.

✅ Wisdom tooth extraction: from €90 (instead of €200-500)
✅ Surgical removal under sedation available
✅ Immediate aftercare included

Contact us for a quick appointment!

Best regards,
DentArt Istanbul International Clinic`
      },

      general_checkup: {
        subject_de: 'Kostenlose zahnärztliche Erstberatung — Qualität zum besten Preis',
        subject_en: 'Free Dental Consultation — Quality at Best Price',
        body_de: `{GREETING},

wir haben Ihre Anfrage zu zahnärztlicher Behandlung gesehen und möchten Ihnen gerne weiterhelfen.

Unsere Partnerklinik in Istanbul bietet ein breites Spektrum an Behandlungen zu fairen Preisen:

✅ Professionelle Zahnreinigung: ab 50€
✅ Füllungen (Komposit): ab 45€
✅ Kronen und Brücken: ab 175€
✅ Deutschsprachige Betreuung

Für eine kostenlose Erstberatung kontaktieren Sie uns einfach!

Mit freundlichen Grüßen
DentArt Istanbul International Clinic`,
        body_en: `{GREETING},

We noticed your dental inquiry and would like to help.

Our partner clinic in Istanbul offers a wide range of treatments at fair prices:

✅ Professional cleaning: from €50
✅ Fillings (composite): from €45
✅ Crowns and bridges: from €175
✅ English-speaking team

Contact us for a free consultation!

Best regards,
DentArt Istanbul International Clinic`
      }
    };
  }
};

module.exports = emailOutreachService;
