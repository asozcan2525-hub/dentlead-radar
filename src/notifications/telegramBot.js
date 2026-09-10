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

const telegramBot = {
  /**
   * Yeni tespit edilen potansiyel hastayı Telegram'a anlık bildirim olarak gönderir.
   */
  async sendLeadAlert(lead) {
    const config = getConfig();
    const token = process.env.TELEGRAM_BOT_TOKEN || config.notifications?.telegram?.bot_token;
    const chatId = process.env.TELEGRAM_CHAT_ID || config.notifications?.telegram?.chat_id;

    if (!token || !chatId) {
      // Telegram yapılandırılmamışsa sessizce geç
      return { success: false, reason: 'Telegram token veya chatId eksik.' };
    }

    const urgencyEmoji = {
      critical: '🚨 KRİTİK ACİL',
      high: '⚡ YÜKSEK ÖNCELİK',
      medium: '📌 ORTA',
      low: 'ℹ️ BİLGİ'
    }[lead.urgency] || '📌 YENİ LEAD';

    const sourceIcons = {
      twitter: '🐦 X (Twitter)',
      reddit: '🤖 Reddit',
      forum: '💬 Forum & Topluluk',
      google: '🔍 Google Arama'
    }[lead.source] || `🌐 ${lead.source}`;

    const text = `
🦷 <b>YENİ DİŞ HASTASI ADAYI BULUNDU!</b>
────────────────────
<b>Öncelik:</b> ${urgencyEmoji} (Skor: ${lead.ai_score}/100)
<b>Kaynak:</b> ${sourceIcons}
<b>Kullanıcı:</b> @${lead.author || 'Anonim'}
<b>Lokasyon:</b> 📍 ${lead.location || 'Bilinmiyor'}
<b>Tedavi:</b> 🩺 ${lead.treatment_category?.toUpperCase()}

<b>💬 Hasta Mesajı:</b>
<i>"${lead.content}"</i>

<b>💡 AI Klinik Yanıt Taslağı:</b>
<blockquote>${lead.suggested_reply}</blockquote>

🔗 <a href="${lead.url}">Orijinal Gönderiye Git / Yanıtla</a>
────────────────────
<i>DentLead Radar Otomasyonu</i>
    `.trim();

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
          disable_web_page_preview: false
        })
      });

      const resData = await response.json();
      if (!resData.ok) {
        throw new Error(resData.description || 'Telegram API error');
      }
      return { success: true };
    } catch (error) {
      console.error('Telegram bildirim hatası:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Telegram bağlantı testi
   */
  async testConnection(customToken, customChatId) {
    const config = getConfig();
    const token = customToken || process.env.TELEGRAM_BOT_TOKEN || config.notifications?.telegram?.bot_token;
    const chatId = customChatId || process.env.TELEGRAM_CHAT_ID || config.notifications?.telegram?.chat_id;

    if (!token || !chatId) {
      return { success: false, message: 'Lütfen Telegram Bot Token ve Chat ID giriniz.' };
    }

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '✅ <b>Tebrikler!</b>\n\nDiş Kliniği Müşteri Radarı (DentLead) Telegram bildirim kanalına başarıyla bağlandı. Yeni hasta adayları tespit edildiğinde anlık olarak buraya düşecek.',
          parse_mode: 'HTML'
        })
      });

      const resData = await response.json();
      if (!resData.ok) {
        return { success: false, message: resData.description || 'Telegram doğrulanamadı.' };
      }
      return { success: true, message: 'Telegram test mesajı başarıyla iletildi!' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }
};

module.exports = telegramBot;
