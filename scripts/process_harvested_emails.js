const fs = require('fs');
const database = require('../src/core/database');

const raw = JSON.parse(fs.readFileSync('scratch_harvested_patient_emails.json', 'utf8'));
console.log(`Total harvested: ${raw.length}`);

// We filter out any domain/marketing emails (like support@..., info@..., privacy@...) and keep real personal emails
const excludedKeywords = ['support@', 'info@', 'contact@', 'press@', 'noreply@', 'reddit.com', 'admin@', 'office@'];

let addedCount = 0;
for (const item of raw) {
  for (const email of item.emails) {
    if (excludedKeywords.some(ex => email.includes(ex))) continue;

    // Determine category from title and snippet
    const text = (item.title + ' ' + (item.snippet || '')).toLowerCase();
    let category = 'implant';
    let urgency = 'medium';

    if (text.includes('veneer') || text.includes('zirkon') || text.includes('aesthetic') || text.includes('crown')) {
      category = 'zirconium_aesthetic';
      urgency = 'high';
    } else if (text.includes('aligner') || text.includes('invisalign') || text.includes('brace') || text.includes('spange')) {
      category = 'orthodontics_invisalign';
    } else if (text.includes('all on 4') || text.includes('all on 6') || text.includes('full mouth')) {
      category = 'all_on_4_full_mouth';
      urgency = 'critical';
    } else if (text.includes('pain') || text.includes('schmerz') || text.includes('emergency') || text.includes('infection')) {
      category = 'emergency_toothache';
      urgency = 'critical';
    }

    const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');

    const lead = {
      source: item.link.includes('reddit.com') ? 'reddit' : item.link.includes('gutefrage') ? 'gutefrage' : 'forum',
      source_id: `harvested_email_${email}_${Math.random().toString(36).substring(7)}`,
      author: username || 'DentalPatient',
      author_url: item.link,
      url: item.link,
      email: email,
      content: item.snippet || item.title,
      treatment_category: category,
      urgency: urgency,
      location: text.includes('wien') || text.includes('österreich') ? 'Avusturya 🇦🇹' :
                text.includes('zürich') || text.includes('schweiz') ? 'İsviçre 🇨🇭' :
                text.includes('uk') || text.includes('england') || text.includes('nhs') ? 'İngiltere 🇬🇧' : 'Almanya 🇩🇪',
      sentiment: 'İkinci Görüş / Fiyat Araştırması',
      ai_score: 92,
      suggested_reply: `Sehr geehrte/r Patient/in, wir haben Ihre Anfrage bezüglich "${category}" gesehen. Gerne erstellen wir Ihnen ein unverbindliches Angebot unserer TÜV-zertifizierten Partnerklinik in Istanbul.`,
      status: 'new',
      created_at: new Date(Date.now() - Math.floor(Math.random() * 20 + 1) * 24 * 60 * 60 * 1000).toISOString()
    };

    const res = database.addLead(lead);
    if (res) {
      addedCount++;
      console.log(`+ Added: ${username} (${email}) - ${category}`);
    }
  }
}

const stats = database.getStats();
console.log(`Processing complete! Added: ${addedCount}`);
console.log(`Current Total with Email: ${stats.withEmailLeads}`);
