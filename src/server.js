require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const database = require('./core/database');
const scannerService = require('./scrapers/scannerService');
const telegramBot = require('./notifications/telegramBot');
const KEYWORD_MATRIX = require('./core/keywordMatrix');
const emailOutreachService = require('./core/emailOutreachService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const CONFIG_PATH = path.join(__dirname, '../config.json');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('Config yüklenemedi:', err.message);
  }
  return {};
}

function saveConfig(newConfig) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf8');
}

// 7/24 Kesintisiz Çalışma İçin Canlılık Kontrolü (Health Ping)
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'DentLead Radar 7/24 Aktif', uptime: process.uptime() });
});

// 1. Lead'leri Listele (Filtreleme & 3 Ay Tazelik Destekli)
app.get('/api/leads', (req, res) => {
  try {
    const filters = {
      category: req.query.category || 'all',
      urgency: req.query.urgency || 'all',
      status: req.query.status || 'all',
      source: req.query.source || 'all',
      channel: req.query.channel || 'all',
      timeRange: req.query.timeRange || '90d',
      sortBy: req.query.sortBy || 'clinical',
      hasEmail: req.query.hasEmail === 'true',
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0
    };
    const leads = database.getLeads(filters);
    res.json({ success: true, leads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1.1 Sadece E-Postası Bulunan Lead'leri Getir (Özel Liste Penceresi İçin)
app.get('/api/leads/with-email', (req, res) => {
  try {
    const leads = database.getEmailLeads();
    res.json({ success: true, count: leads.length, leads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1.2 E-Posta Outreach Listesi — Son 3 ay, e-postası olan, hazır şablonlu
app.get('/api/leads/email-outreach', (req, res) => {
  try {
    const language = req.query.lang || 'de';
    const leads = database.getEmailLeads();
    
    // Her lead için outreach linklerini oluştur
    const enrichedLeads = leads.map(lead => {
      const outreach = emailOutreachService.buildOutreachLinks(lead, language);
      return {
        ...lead,
        outreach_links: {
          gmail: outreach.gmail,
          outlook: outreach.outlook,
          mailto: outreach.mailto
        },
        email_template: {
          subject: outreach.template.subject,
          body: outreach.template.body,
          patientName: outreach.template.patientName
        }
      };
    });

    res.json({ success: true, count: enrichedLeads.length, leads: enrichedLeads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1.3 Yeni E-Posta Lead Taraması Başlat (SerpApi ile)
app.post('/api/harvest-emails', async (req, res) => {
  try {
    // Harvest script'ini çalıştır ve sonuçları veritabanına ekle
    const harvester = require('../scripts/harvest_patient_emails');
    await harvester.run();

    // Sonuçları veritabanına işle
    const processor = require('../scripts/process_harvested_emails');

    const stats = database.getStats();
    res.json({
      success: true,
      message: 'E-posta taraması tamamlandı',
      withEmailLeads: stats.withEmailLeads
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Lead Durumunu Güncelle
app.post('/api/leads/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    database.updateLeadStatus(id, status);
    res.json({ success: true, message: 'Durum güncellendi' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Genel İstatistikler
app.get('/api/stats', (req, res) => {
  try {
    const stats = database.getStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Canlı Tarama Başlat
app.post('/api/scan', async (req, res) => {
  try {
    const includeSimulation = req.body.includeSimulation !== false;
    const result = await scannerService.runFullScan({ includeSimulation });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Ayarları Getir
app.get('/api/config', (req, res) => {
  const config = loadConfig();
  if (!config.api_keys) config.api_keys = {};
  if (process.env.GEMINI_API_KEY && !config.api_keys.gemini_api_key) {
    config.api_keys.gemini_api_key = process.env.GEMINI_API_KEY;
  }
  if (process.env.SERPAPI_KEY && !config.api_keys.serpapi_key) {
    config.api_keys.serpapi_key = process.env.SERPAPI_KEY;
  }
  if (process.env.RAPIDAPI_KEY && !config.api_keys.rapidapi_key) {
    config.api_keys.rapidapi_key = process.env.RAPIDAPI_KEY;
  }
  res.json({ success: true, config });
});

// 6. Ayarları Güncelle
app.post('/api/config', (req, res) => {
  try {
    const newConfig = req.body;
    if (newConfig.api_keys?.gemini_api_key) {
      process.env.GEMINI_API_KEY = newConfig.api_keys.gemini_api_key;
    }
    if (newConfig.api_keys?.serpapi_key) {
      process.env.SERPAPI_KEY = newConfig.api_keys.serpapi_key;
    }
    if (newConfig.api_keys?.rapidapi_key) {
      process.env.RAPIDAPI_KEY = newConfig.api_keys.rapidapi_key;
    }
    try {
      let envLines = [`PORT=${process.env.PORT || 3000}`];
      if (process.env.GEMINI_API_KEY) envLines.push(`GEMINI_API_KEY=${process.env.GEMINI_API_KEY}`);
      if (process.env.SERPAPI_KEY) envLines.push(`SERPAPI_KEY=${process.env.SERPAPI_KEY}`);
      if (process.env.RAPIDAPI_KEY) envLines.push(`RAPIDAPI_KEY=${process.env.RAPIDAPI_KEY}`);
      fs.writeFileSync(path.join(__dirname, '../.env'), envLines.join('\n') + '\n', 'utf8');
    } catch (_) {}
    saveConfig(newConfig);
    res.json({ success: true, message: 'Ayarlar başarıyla kaydedildi' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Telegram Bağlantısını Test Et
app.post('/api/test-telegram', async (req, res) => {
  try {
    const { token, chatId } = req.body;
    const result = await telegramBot.testConnection(token, chatId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Tedavi Kategorileri Listesi
app.get('/api/categories', (req, res) => {
  res.json({ success: true, categories: KEYWORD_MATRIX.categories });
});

// 9. CSV Dışa Aktarım
app.get('/api/export/csv', (req, res) => {
  try {
    const csvContent = database.exportCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=dental_leads.csv');
    // UTF-8 BOM ekleyelim ki Excel Türkçe karakterleri doğru açsın
    res.send('\uFEFF' + csvContent);
  } catch (err) {
    res.status(500).send('Dışa aktarım hatası: ' + err.message);
  }
});

// İlk çalıştırmada veritabanı boşsa 1.000+ hasta havuzunu otomatik yükle
const initialStats = database.getStats();
if (initialStats.totalLeads === 0) {
  console.log('📦 Veritabanı başlatılıyor, 1.000+ klinik hasta havuzu yükleniyor...');
  try {
    require('../scripts/seed_1000_patients');
    console.log('✅ 1.000+ hasta havuzu başarıyla yüklendi.');
  } catch (e) {
    console.error('Seed hatası:', e.message);
  }
}

// 🔄 10 DAKİKADA BİR KESİNTİSİZ ARKA PLAN TARAYICISI
const AUTO_SCAN_INTERVAL_MS = 10 * 60 * 1000; // 10 Dakika

async function runPeriodicScan() {
  const nowStr = new Date().toLocaleTimeString('tr-TR');
  console.log(`\n⏰ [${nowStr}] 10 Dakikalık Otomatik Hasta Arama Döngüsü Başlatıldı...`);
  try {
    const result = await scannerService.runFullScan({ includeSimulation: false });
    console.log(`✅ [Otomatik Tarama - ${nowStr}]: Tamamlandı. Taranan: ${result.totalDiscovered || 0}, Yeni Eklenen: ${result.newLeadsSaved || 0}`);
  } catch (err) {
    console.warn(`⚠️ [Otomatik Tarama Hatası]:`, err.message);
  }
}

const continuousPatientHunter = require('./scrapers/continuousPatientHunter');

function startAutoScanner() {
  console.log('🔄 [Otomatik Tarayıcı] 10 dakikada bir kesintisiz arka plan tarama motoru aktif edildi.');
  
  // 1. Genel döngü (10 saniye sonra ve 10 dakikada bir)
  setTimeout(runPeriodicScan, 10000);
  setInterval(runPeriodicScan, AUTO_SCAN_INTERVAL_MS);

  // 2. Durmaksızın Canlı Hasta Avcısı (Son 24 saat ve 7 gün öncelikli, 45 sn döngülü)
  setTimeout(() => {
    continuousPatientHunter.start();
  }, 15000);
}

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║  🦷 DENTLEAD RADAR - DİŞ KLİNİĞİ MÜŞTERİ BULMA OTOMASYONU           ║
║  🚀 Web Yönetim Paneli: http://localhost:${PORT}                       ║
║  🔄 Durmaksızın Canlı Hasta Arama Motoru: AKTİF (7/24)              ║
║  ⏱️ Öncelik Sıralaması: 1. Son 24 Saat, 2. Son 7 Gün, 3. Son 30 Gün  ║
║  🛡️ AI Denetim: Gemini 3.6 Flash (Sadece Gerçek Hasta Niyeti)        ║
╚══════════════════════════════════════════════════════════════════════╝
  `);
  
  // Otomatik tarama motorunu başlat
  startAutoScanner();
});
