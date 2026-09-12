const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// Veritabanı klasörünün varlığını kontrol et
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'dental_leads.db');
const db = new DatabaseSync(dbPath);

// Tabloları başlat
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    source_id TEXT UNIQUE,
    author TEXT,
    author_url TEXT,
    url TEXT,
    content TEXT NOT NULL,
    treatment_category TEXT,
    urgency TEXT DEFAULT 'medium',
    location TEXT,
    sentiment TEXT,
    ai_score INTEGER DEFAULT 50,
    suggested_reply TEXT,
    status TEXT DEFAULT 'new',
    email TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS scan_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    leads_found INTEGER DEFAULT 0,
    scanned_at TEXT NOT NULL
  );
`);

// Migration: Var olan veritabanında email kolonu yoksa otomatik ekle
try {
  db.exec("ALTER TABLE leads ADD COLUMN email TEXT;");
} catch (e) {
  // Kolon zaten var
}

// Otomatik Başlangıç Verisi Tohumlama (Render / Yeni Sunucu Kurulumu İçin)
try {
  // Eski geçersiz forum ve kurgusal verileri temizle
  db.prepare("DELETE FROM leads WHERE source IN ('gutefrage', 'gutefrage.net')").run();

  const countRow = db.prepare("SELECT COUNT(*) as count FROM leads").get();
  if (!countRow || countRow.count === 0) {
    const seedPath = path.join(dataDir, 'verified_initial_leads.json');
    if (fs.existsSync(seedPath)) {
      const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      const insertStmt = db.prepare(`
        INSERT INTO leads (
          source, source_id, author, author_url, url, content, 
          treatment_category, urgency, location, sentiment, 
          ai_score, suggested_reply, status, email, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const lead of seedData) {
        insertStmt.run(
          lead.source || 'web',
          lead.source_id || `lead_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          lead.author || 'Anonim',
          lead.author_url || '',
          lead.url || '#',
          lead.content || '',
          lead.treatment_category || 'general_checkup',
          lead.urgency || 'medium',
          lead.location || 'Almanya 🇩🇪',
          lead.sentiment || 'neutral',
          lead.ai_score || 85,
          lead.suggested_reply || '',
          lead.status || 'new',
          lead.email || null,
          lead.created_at || new Date().toISOString()
        );
      }
      console.log(`🌱 [Database Auto-Seed]: ${seedData.length} adet doğrulanmış gerçek hasta Render/yeni ortama yüklendi.`);
    }
  }
} catch (seedErr) {
  console.warn('Auto-seed uyarısı:', seedErr.message);
}

const database = {
  // Post daha önce kaydedilmiş mi kontrol et
  isDuplicate(source, sourceId) {
    if (!sourceId) return false;
    const stmt = db.prepare('SELECT id FROM leads WHERE source = ? AND source_id = ?');
    const existing = stmt.all(source, sourceId);
    return existing.length > 0;
  },

  // Yeni lead ekle
  addLead(data) {
    if (data.source_id && this.isDuplicate(data.source, data.source_id)) {
      return null;
    }

    const createdAt = data.created_at || new Date().toISOString();

    // 🎯 SIKI TAZELİK KONTROLÜ (Maksimum 90 Gün / 3 Ay)
    // 3 aydan eski hiçbir forum veya sosyal medya gönderisi sisteme ALINMAZ!
    const postTime = new Date(createdAt).getTime();
    if (!isNaN(postTime)) {
      const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
      if (Date.now() - postTime > ninetyDaysMs) {
        // 90 günden eski olduğu için reddedildi
        return null;
      }
    }

    const stmt = db.prepare(`
      INSERT INTO leads (
        source, source_id, author, author_url, url, content, 
        treatment_category, urgency, location, sentiment, 
        ai_score, suggested_reply, status, email, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.source || 'web',
      data.source_id || `lead_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      data.author || 'Anonim',
      data.author_url || '',
      data.url || '#',
      data.content,
      data.treatment_category || 'general_checkup',
      data.urgency || 'medium',
      data.location || 'Bilinmiyor',
      data.sentiment || 'Nötr',
      data.ai_score || 70,
      data.suggested_reply || '',
      data.status || 'new',
      data.email || null,
      createdAt
    );

    return { id: result.lastInsertRowid, ...data, created_at: createdAt };
  },

  // Filtreli lead listesi getir (Tazelik filtresi destekli)
  getLeads(filters = {}) {
    let query = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    // Zaman filtresi: 7 gün, 30 gün veya varsayılan en fazla 90 gün (3 ay)
    let maxDays = 90;
    if (filters.timeRange === '7d') maxDays = 7;
    else if (filters.timeRange === '30d') maxDays = 30;
    else if (filters.timeRange === '90d' || !filters.timeRange) maxDays = 90;

    const minDateIso = new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000).toISOString();
    query += ' AND created_at >= ?';
    params.push(minDateIso);

    if (filters.category && filters.category !== 'all') {
      query += ' AND treatment_category = ?';
      params.push(filters.category);
    }
    if (filters.urgency && filters.urgency !== 'all') {
      query += ' AND urgency = ?';
      params.push(filters.urgency);
    }
    if (filters.status && filters.status !== 'all') {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.channel && filters.channel !== 'all') {
      if (filters.channel === 'instagram') {
        query += " AND source = 'instagram'";
      } else if (filters.channel === 'facebook') {
        query += " AND source = 'facebook'";
      } else if (filters.channel === 'forums') {
        query += " AND source IN ('reddit', 'gutefrage', 'gutefrage.net', 'tripadvisor')";
      } else if (filters.channel === 'email') {
        query += " AND email IS NOT NULL AND email != ''";
      }
    }

    if (filters.source && filters.source !== 'all') {
      query += ' AND source = ?';
      params.push(filters.source);
    }
    if (filters.hasEmail) {
      query += " AND email IS NOT NULL AND email != ''";
    }

    // Klinik Ciddiyet / Triyaj Sıralaması
    if (filters.sortBy === 'date') {
      query += ' ORDER BY created_at DESC';
    } else {
      // Varsayılan: En acil ve yüksek puanlı hastalar en başta
      query += ` ORDER BY 
        CASE urgency 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          ELSE 4 
        END ASC, 
        ai_score DESC, 
        created_at DESC`;
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(filters.limit || 100, filters.offset || 0);

    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  // Toplu Hızlı Lead Ekleme (Transaction ile yüksek performans)
  addLeadsBatch(leadsList) {
    db.exec('BEGIN TRANSACTION');
    const stmt = db.prepare(`
      INSERT INTO leads (
        source, source_id, author, author_url, url, content, 
        treatment_category, urgency, location, sentiment, 
        ai_score, suggested_reply, status, email, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let inserted = 0;
    try {
      for (const data of leadsList) {
        if (data.source_id && this.isDuplicate(data.source, data.source_id)) {
          continue;
        }
        stmt.run(
          data.source || 'web',
          data.source_id || `lead_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          data.author || 'Anonim',
          data.author_url || '',
          data.url || '#',
          data.content,
          data.treatment_category || 'general_checkup',
          data.urgency || 'medium',
          data.location || 'Almanya 🇩🇪',
          data.sentiment || 'Nötr',
          data.ai_score || 70,
          data.suggested_reply || '',
          data.status || 'new',
          data.email || null,
          data.created_at || new Date().toISOString()
        );
        inserted++;
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    return inserted;
  },

  // Sadece e-postası bulunan lead'leri getir
  getEmailLeads() {
    const stmt = db.prepare("SELECT * FROM leads WHERE email IS NOT NULL AND email != '' ORDER BY created_at DESC");
    return stmt.all();
  },

  // 90 günden eski kalıntıları temizle
  purgeOldLeads(days = 90) {
    const minDateIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const stmt = db.prepare('DELETE FROM leads WHERE created_at < ?');
    return stmt.run(minDateIso);
  },

  // Lead durumunu güncelle (new, contacted, appointment, ignored)
  updateLeadStatus(id, status) {
    const stmt = db.prepare('UPDATE leads SET status = ? WHERE id = ?');
    stmt.run(status, id);
    return true;
  },

  // Dashboard istatistikleri
  getStats() {
    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM leads');
    const total = totalStmt.all()[0]?.count || 0;

    const urgentStmt = db.prepare("SELECT COUNT(*) as count FROM leads WHERE urgency IN ('critical', 'high')");
    const urgent = urgentStmt.all()[0]?.count || 0;

    const contactedStmt = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status IN ('contacted', 'appointment')");
    const contacted = contactedStmt.all()[0]?.count || 0;

    const emailStmt = db.prepare("SELECT COUNT(*) as count FROM leads WHERE email IS NOT NULL AND email != ''");
    const withEmail = emailStmt.all()[0]?.count || 0;

    const categoriesStmt = db.prepare('SELECT treatment_category, COUNT(*) as count FROM leads GROUP BY treatment_category');
    const categories = categoriesStmt.all();

    const sourcesStmt = db.prepare('SELECT source, COUNT(*) as count FROM leads GROUP BY source');
    const sources = sourcesStmt.all();

    const instagramStmt = db.prepare("SELECT COUNT(*) as count FROM leads WHERE source = 'instagram'");
    const instagramCount = instagramStmt.all()[0]?.count || 0;

    const facebookStmt = db.prepare("SELECT COUNT(*) as count FROM leads WHERE source = 'facebook'");
    const facebookCount = facebookStmt.all()[0]?.count || 0;

    const forumsStmt = db.prepare("SELECT COUNT(*) as count FROM leads WHERE source IN ('reddit', 'gutefrage', 'gutefrage.net', 'tripadvisor')");
    const forumsCount = forumsStmt.all()[0]?.count || 0;

    return {
      totalLeads: total,
      urgentLeads: urgent,
      contactedLeads: contacted,
      withEmailLeads: withEmail,
      categories,
      sources,
      channels: {
        all: total,
        instagram: instagramCount,
        facebook: facebookCount,
        forums: forumsCount,
        email: withEmail
      }
    };
  },

  // Tarama kaydı tut
  logScan(source, leadsFound) {
    const stmt = db.prepare('INSERT INTO scan_logs (source, leads_found, scanned_at) VALUES (?, ?, ?)');
    stmt.run(source, leadsFound, new Date().toISOString());
  },

  // Tüm lead'leri CSV formatında döndür
  exportCsv() {
    const leads = this.getLeads({ limit: 10000 });
    const headers = ['ID', 'Tarih', 'Kaynak', 'Kullanıcı', 'E-Posta', 'Konum', 'Tedavi', 'Aciliyet', 'Skor', 'Durum', 'Link', 'Mesaj', 'AI Yanıt Önerisi'];
    
    const rows = leads.map(l => [
      l.id,
      `"${l.created_at}"`,
      `"${l.source}"`,
      `"${l.author}"`,
      `"${l.email || ''}"`,
      `"${l.location}"`,
      `"${l.treatment_category}"`,
      `"${l.urgency}"`,
      l.ai_score,
      `"${l.status}"`,
      `"${l.url}"`,
      `"${(l.content || '').replace(/"/g, '""')}"`,
      `"${(l.suggested_reply || '').replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
};

module.exports = database;
