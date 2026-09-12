const redditScraper = require('./redditScraper');
const twitterScraper = require('./twitterScraper');
const forumScraper = require('./forumScraper');
const germanForumScraper = require('./germanForumScraper');
const googleSerpScraper = require('./googleSerpScraper');
const youtubeScraper = require('./youtubeScraper');
const facebookScraper = require('./facebookScraper');
const simulationFeed = require('./simulationFeed');
const aiAnalyzer = require('../core/aiAnalyzer');
const database = require('../core/database');
const telegramBot = require('../notifications/telegramBot');
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

const scannerService = {
  isScanning: false,

  /**
   * DACH ve uluslararası kaynakları tarar, niyet analizi yapar ve lead'leri kaydeder.
   */
  async runFullScan(options = { includeSimulation: true }) {
    if (this.isScanning) {
      return { status: 'already_running', message: 'Şu anda aktif bir tarama devam ediyor.' };
    }

    this.isScanning = true;
    console.log('🚀 [DentLead Radar DACH] Çok dilli sağlık turizmi tarayıcısı başlatıldı...');

    const config = getConfig();
    const minScore = config.scanner?.min_lead_score || 50;

    let totalDiscovered = 0;
    let newLeadsSaved = 0;
    let alertsSent = 0;

    try {
      // 1. Tüm veri toplayıcıları paralel çalıştır
      const [redditItems, twitterItems, germanForumItems, turkishForumItems, googleItems, youtubeItems, facebookItems] = await Promise.all([
        redditScraper.scan().catch(() => []),
        twitterScraper.scan().catch(() => []),
        germanForumScraper.scan().catch(() => []),
        forumScraper.scan().catch(() => []),
        googleSerpScraper.scan().catch(() => []),
        youtubeScraper.scan().catch(() => []),
        facebookScraper.scan().catch(() => [])
      ]);

      let allRawItems = [
        ...redditItems,
        ...twitterItems,
        ...germanForumItems,
        ...turkishForumItems,
        ...googleItems,
        ...youtubeItems,
        ...facebookItems
      ];

      totalDiscovered = allRawItems.length;

      // 2. Her gönderiyi incele ve AI Niyet Analizinden geçir (en taze 10 adayı tara)
      const candidateItems = allRawItems
        .filter(item => !database.isDuplicate(item.source, item.source_id))
        .slice(0, 10);

      for (const item of candidateItems) {
        const analysis = await aiAnalyzer.analyze(item.content, {
          author: item.author,
          location: item.location
        });

        if (analysis.is_lead && (analysis.ai_score || 0) >= minScore) {
          const leadRecord = {
            source: item.source,
            source_id: item.source_id,
            author: item.author,
            author_url: item.author_url,
            url: item.url,
            content: item.content,
            treatment_category: analysis.treatment_category,
            urgency: analysis.urgency,
            location: analysis.location,
            sentiment: analysis.sentiment,
            ai_score: analysis.ai_score,
            suggested_reply: analysis.suggested_reply,
            status: 'new',
            created_at: item.created_at || new Date().toISOString()
          };

          const savedLead = database.addLead(leadRecord);

          if (savedLead) {
            newLeadsSaved++;

            // Telegram bildirimi gönder
            if (config.notifications?.telegram?.enabled || process.env.TELEGRAM_BOT_TOKEN) {
              try {
                const tgRes = await telegramBot.sendLeadAlert(savedLead);
                if (tgRes.success) alertsSent++;
              } catch (e) {
                console.warn('Telegram bildirim hatası:', e.message);
              }
            }
          }
        }
      }

      database.logScan('dach_health_tourism_scan', newLeadsSaved);

      console.log(`✅ [DentLead Radar DACH] Tarama bitti. Taranan: ${totalDiscovered}, Yeni Lead: ${newLeadsSaved}, Gönderilen Bildirim: ${alertsSent}`);

      return {
        success: true,
        totalDiscovered,
        newLeadsSaved,
        alertsSent,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      console.error('Tarama sırasında hata:', err);
      return { success: false, error: err.message };
    } finally {
      this.isScanning = false;
    }
  }
};

module.exports = scannerService;
