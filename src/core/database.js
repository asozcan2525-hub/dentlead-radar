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
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS scan_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    leads_found INTEGER DEFAULT 0,
    scanned_at TEXT NOT NULL
  );
`);

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

    const stmt = db.prepare(`
      INSERT INTO leads (
        source, source_id, author, author_url, url, content, 
        treatment_category, urgency, location, sentiment, 
        ai_score, suggested_reply, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const createdAt = data.created_at || new Date().toISOString();
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
      createdAt
    );

    return { id: result.lastInsertRowid, ...data, created_at: createdAt };
  },

  // Filtreli lead listesi getir
  getLeads(filters = {}) {
    let query = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

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
    if (filters.source && filters.source !== 'all') {
      query += ' AND source = ?';
      params.push(filters.source);
    }

    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(filters.limit || 100, filters.offset || 0);

    const stmt = db.prepare(query);
    return stmt.all(...params);
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

    const categoriesStmt = db.prepare('SELECT treatment_category, COUNT(*) as count FROM leads GROUP BY treatment_category');
    const categories = categoriesStmt.all();

    const sourcesStmt = db.prepare('SELECT source, COUNT(*) as count FROM leads GROUP BY source');
    const sources = sourcesStmt.all();

    return {
      totalLeads: total,
      urgentLeads: urgent,
      contactedLeads: contacted,
      categories,
      sources
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
    const headers = ['ID', 'Tarih', 'Kaynak', 'Kullanıcı', 'Konum', 'Tedavi', 'Aciliyet', 'Skor', 'Durum', 'Link', 'Mesaj', 'AI Yanıt Önerisi'];
    
    const rows = leads.map(l => [
      l.id,
      `"${l.created_at}"`,
      `"${l.source}"`,
      `"${l.author}"`,
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
