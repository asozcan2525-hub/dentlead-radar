require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const database = require('./core/database');
const scannerService = require('./scrapers/scannerService');
const telegramBot = require('./notifications/telegramBot');
const KEYWORD_MATRIX = require('./core/keywordMatrix');

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

// 1. Lead'leri Listele (Filtreleme Destekli)
app.get('/api/leads', (req, res) => {
  try {
    const filters = {
      category: req.query.category || 'all',
      urgency: req.query.urgency || 'all',
      status: req.query.status || 'all',
      source: req.query.source || 'all',
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0
    };
    const leads = database.getLeads(filters);
    res.json({ success: true, leads });
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
  res.json({ success: true, config });
});

// 6. Ayarları Güncelle
app.post('/api/config', (req, res) => {
  try {
    const newConfig = req.body;
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

// İlk çalıştırmada veritabanı boşsa örnek simülasyon lead'lerini yükle
const initialStats = database.getStats();
if (initialStats.totalLeads === 0) {
  console.log('📦 Veritabanı başlatılıyor, başlangıç verileri taranıyor...');
  scannerService.runFullScan({ includeSimulation: true }).then(() => {
    console.log('✅ Başlangıç verileri başarıyla yüklendi.');
  });
}

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║  🦷 DENTLEAD RADAR - DİŞ KLİNİĞİ MÜŞTERİ BULMA OTOMASYONU           ║
║  🚀 Web Yönetim Paneli: http://localhost:${PORT}                       ║
║  📡 Durum: Aktif ve Dinlemede                                       ║
╚══════════════════════════════════════════════════════════════════════╝
  `);
});
