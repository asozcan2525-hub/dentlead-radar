/**
 * DentLead Radar DACH - Frontend Application Logic
 */

let state = {
  leads: [],
  filters: {
    category: 'all',
    urgency: 'all',
    source: 'all',
    status: 'all',
    location: 'all',
    timeRange: '90d',
    search: ''
  },
  stats: {},
  config: {}
};

// DOM Referansları
const leadsContainer = document.getElementById('leads-container');
const statTotal = document.getElementById('stat-total');
const statUrgent = document.getElementById('stat-urgent');
const statHighTicket = document.getElementById('stat-high-ticket');
const statContacted = document.getElementById('stat-contacted');
const leadCountBadge = document.getElementById('lead-count-badge');
const searchInput = document.getElementById('search-input');
const filterLocation = document.getElementById('filter-location');
const filterSource = document.getElementById('filter-source');
const filterStatus = document.getElementById('filter-status');
const filterTime = document.getElementById('filter-time');
const btnTriggerScan = document.getElementById('btn-trigger-scan');
const scanIcon = document.getElementById('scan-icon');
const scanBtnText = document.getElementById('scan-btn-text');
const btnExportCsv = document.getElementById('btn-export-csv');

// Modal Referansları
const settingsModal = document.getElementById('settings-modal');
const btnOpenSettings = document.getElementById('btn-open-settings');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelSettings = document.getElementById('btn-cancel-settings');
const btnSaveSettings = document.getElementById('btn-save-settings');
const btnTestTelegram = document.getElementById('btn-test-telegram');

document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  loadConfig();
  fetchStats();
  fetchLeads();
});

function initEventListeners() {
  // Kategori Filtre Pill'leri
  document.querySelectorAll('#category-filter-pills .pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      document.querySelectorAll('#category-filter-pills .pill').forEach(p => p.classList.remove('active'));
      e.currentTarget.classList.add('active');
      state.filters.category = e.currentTarget.dataset.category;
      fetchLeads();
    });
  });

  // Lokasyon (Ülke) Filtresi
  if (filterLocation) {
    filterLocation.addEventListener('change', (e) => {
      state.filters.location = e.target.value;
      renderLeads();
    });
  }

  // Dropdown Filtreler
  if (filterSource) {
    filterSource.addEventListener('change', (e) => {
      state.filters.source = e.target.value;
      fetchLeads();
    });
  }

  if (filterStatus) {
    filterStatus.addEventListener('change', (e) => {
      state.filters.status = e.target.value;
      fetchLeads();
    });
  }

  // 🎯 Son 3 Ay Tazelik Filtresi
  if (filterTime) {
    filterTime.addEventListener('change', (e) => {
      state.filters.timeRange = e.target.value;
      fetchLeads();
    });
  }

  // Arama Girişi
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.filters.search = e.target.value.toLowerCase().trim();
      renderLeads();
    }, 250);
  });

  // Canlı Tarama Butonu
  btnTriggerScan.addEventListener('click', () => {
    triggerScan();
  });

  // CSV İndirme Butonu
  btnExportCsv.addEventListener('click', () => {
    window.location.href = '/api/export/csv';
    showToast('DACH hasta listesi CSV olarak indiriliyor...', 'success');
  });

  // Modal Kontrolleri
  btnOpenSettings.addEventListener('click', openSettings);
  btnCloseModal.addEventListener('click', closeSettings);
  btnCancelSettings.addEventListener('click', closeSettings);
  btnSaveSettings.addEventListener('click', saveSettings);
  btnTestTelegram.addEventListener('click', testTelegram);

  // Tab Geçişleri
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const targetPane = document.getElementById(e.currentTarget.dataset.tab);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

// 1. Lead'leri API'den Çek
async function fetchLeads() {
  try {
    const params = new URLSearchParams({
      category: state.filters.category,
      urgency: state.filters.urgency,
      source: state.filters.source,
      status: state.filters.status,
      timeRange: state.filters.timeRange || '90d'
    });

    const res = await fetch(`/api/leads?${params.toString()}`);
    const data = await res.json();

    if (data.success) {
      state.leads = data.leads || [];
      renderLeads();
    }
  } catch (err) {
    console.error('Lead çekme hatası:', err);
    showToast('Hasta adayları yüklenirken hata oluştu.', 'error');
  }
}

// 2. İstatistikleri API'den Çek
async function fetchStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();

    if (data.success && data.stats) {
      const s = data.stats;
      statTotal.textContent = s.totalLeads || 0;
      statContacted.textContent = s.contactedLeads || 0;

      let implantCount = 0;
      let aestheticCount = 0;

      (s.categories || []).forEach(c => {
        if (c.treatment_category === 'implant') implantCount += c.count;
        if (c.treatment_category === 'zirconium_aesthetic') aestheticCount += c.count;
      });

      statHighTicket.textContent = implantCount;
      statUrgent.textContent = aestheticCount;
    }
  } catch (err) {
    console.error('İstatistik hatası:', err);
  }
}

// 3. Lead Kartlarını Render Et
function renderLeads() {
  const query = state.filters.search;
  const locFilter = state.filters.location;
  let filtered = state.leads;

  // Ülke Filtresi
  if (locFilter && locFilter !== 'all') {
    filtered = filtered.filter(lead => (lead.location && lead.location.includes(locFilter)));
  }

  // Arama Filtresi
  if (query) {
    filtered = filtered.filter(lead => 
      (lead.content && lead.content.toLowerCase().includes(query)) ||
      (lead.location && lead.location.toLowerCase().includes(query)) ||
      (lead.author && lead.author.toLowerCase().includes(query)) ||
      (lead.treatment_category && lead.treatment_category.toLowerCase().includes(query))
    );
  }

  leadCountBadge.textContent = `${filtered.length} Fırsat`;

  if (filtered.length === 0) {
    leadsContainer.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="8"/><line x1="11" y1="11" x2="11" y2="14"/></svg>
        <p>Seçili kriterlere uygun DACH hasta adayı bulunamadı.</p>
        <button class="btn btn-secondary btn-sm" onclick="resetFilters()">Filtreleri Sıfırla</button>
      </div>
    `;
    return;
  }

  leadsContainer.innerHTML = filtered.map(lead => createLeadCardHtml(lead)).join('');
}

// Lead Kartı HTML Üretici
function createLeadCardHtml(lead) {
  const urgencyClass = `urgency-${lead.urgency || 'medium'}`;
  const cardBorderClass = `card-${lead.urgency || 'medium'}`;

  const urgencyLabels = {
    critical: '🚨 KRİTİK ACİL',
    high: '⚡ YÜKSEK (DACH)',
    medium: '📌 ORTA',
    low: 'ℹ️ BİLGİ'
  };

  const sourceDetails = {
    gutefrage: { icon: '❓', name: 'Gutefrage.net', class: 'badge-gutefrage' },
    reddit: { icon: '🤖', name: 'Reddit DACH', class: 'badge-reddit' },
    twitter: { icon: '🐦', name: 'Twitter DE', class: 'badge-twitter' },
    forum: { icon: '💬', name: 'Med1 / Forum', class: 'badge-forum' },
    google: { icon: '🔍', name: 'Google SERP', class: 'badge-google' }
  }[lead.source] || { icon: '🌐', name: lead.source, class: 'badge-forum' };

  const treatmentNames = {
    implant: '🦷 Zahnimplantate / All-on-4',
    zirconium_aesthetic: '✨ Veneers & Zirkonkronen',
    orthodontics_invisalign: '📐 Aligner & Zahnspange',
    toothache_emergency: '🚨 Zahnschmerzen / Notfall',
    wisdom_tooth: '⚡ Weisheitszahn OP',
    root_canal: '🩺 Wurzelbehandlung',
    general_checkup: '🦷 Zahnbehandlung Ausland'
  };

  // Ülke Bayrağı
  let flag = '🇩🇪';
  if (lead.location && lead.location.includes('Avusturya')) flag = '🇦🇹';
  else if (lead.location && lead.location.includes('İsviçre')) flag = '🇨🇭';

  return `
    <div class="lead-card ${cardBorderClass}" id="lead-card-${lead.id}">
      <div class="card-header">
        <div class="author-meta">
          <div class="source-badge-icon ${sourceDetails.class}" title="${sourceDetails.name}">
            ${sourceDetails.icon}
          </div>
          <div>
            <div class="author-name">@${escapeHtml(lead.author || 'Patient')}</div>
            <div class="post-time">${formatTimeAgo(lead.created_at)} • ${sourceDetails.name}</div>
          </div>
        </div>

        <div class="card-badges">
          <span class="urgency-badge ${urgencyClass}">
            ${urgencyLabels[lead.urgency] || 'ÖNCELİK'}
          </span>
          <span class="score-badge" title="AI Niyet Skoru">
            %${lead.ai_score || 85} Eşleşme
          </span>
        </div>
      </div>

      <div class="card-content">
        "${escapeHtml(lead.content)}"
      </div>

      <div class="card-tags">
        <!-- 🎯 3 Ay Tazelik Rozeti -->
        ${(() => {
          const postTime = new Date(lead.created_at).getTime();
          const diffDays = Math.max(0, Math.floor((Date.now() - postTime) / (1000 * 60 * 60 * 24)));
          if (diffDays <= 7) return `<span class="tag-item" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">🟢 Son 7 Gün (Çok Sıcak)</span>`;
          if (diffDays <= 30) return `<span class="tag-item" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);">🟡 Son 30 Gün (Aktif)</span>`;
          return `<span class="tag-item" style="background: rgba(14, 165, 233, 0.15); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.3);">🔵 Son 3 Ay (Güncel)</span>`;
        })()}
        <span class="tag-item tag-treatment">
          ${treatmentNames[lead.treatment_category] || lead.treatment_category}
        </span>
        <span class="tag-item tag-location">
          ${flag} ${escapeHtml(lead.location || 'Almanya')}
        </span>
        ${lead.treatment_category === 'implant' || lead.treatment_category === 'zirconium_aesthetic' ? 
          `<span class="tag-item tag-savings">💶 ~%65 Tasarruf Potansiyeli</span>` : ''}
      </div>

      <!-- AI Almanca Yanıt Kutusu -->
      <div class="ai-reply-box">
        <div class="ai-reply-header">
          <span>💡 AI Klinik Yanıt Taslağı (Deutsch)</span>
          <button class="btn-copy-reply" onclick="copyReplyText(${lead.id})">
            📋 Kopyala
          </button>
        </div>
        <div class="ai-reply-text" id="reply-text-${lead.id}">
          ${escapeHtml(lead.suggested_reply || 'Vorbereitung einer professionellen Antwort...')}
        </div>
      </div>

      <!-- Kart Aksiyonları -->
      <div class="card-actions">
        <div class="action-status-group">
          <button class="btn-status ${lead.status === 'contacted' ? 'active-status' : ''}" 
                  onclick="changeLeadStatus(${lead.id}, 'contacted')">
            📩 İletişime Geçildi
          </button>
          <button class="btn-status ${lead.status === 'appointment' ? 'active-status' : ''}" 
                  onclick="changeLeadStatus(${lead.id}, 'appointment')">
            📅 Randevu / Rezervasyon
          </button>
          <button class="btn-status ${lead.status === 'ignored' ? 'active-status' : ''}" 
                  onclick="changeLeadStatus(${lead.id}, 'ignored')">
            ❌
          </button>
        </div>

        <div class="action-links-group" style="display: flex; gap: 8px; align-items: center;">
          ${lead.author_url && lead.author_url !== '#' && lead.author_url !== lead.url ? `
            <a href="${escapeHtml(lead.author_url)}" target="_blank" rel="noopener noreferrer" class="btn-link-author" 
               style="display: inline-flex; align-items: center; gap: 5px; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; color: #38bdf8; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); text-decoration: none; transition: all 0.2s;"
               title="Hastanın kullanıcı profiline git / Özel mesaj (DM) gönder">
              👤 Profili & DM
            </a>
          ` : ''}

          <a href="${escapeHtml(lead.url || '#')}" target="_blank" rel="noopener noreferrer" class="btn-link-out"
             style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; text-decoration: none;"
             title="Orijinal soru başlığına git ve hazırlanan Almanca klinik teklifini yapıştır">
            💬 Soruya Git & Yanıtla &rarr;
          </a>
        </div>
      </div>
    </div>
  `;
}

// 4. Canlı DACH Tarama Tetikle (Gerçek Kaynaklar)
async function triggerScan() {
  scanIcon.classList.add('spinning');
  scanBtnText.textContent = 'DACH Taranıyor...';
  btnTriggerScan.disabled = true;

  try {
    showToast('Almanya, Avusturya ve İsviçre platformları taranıyor...', 'success');

    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ includeSimulation: false })
    });

    const data = await res.json();

    if (data.success) {
      showToast(`Tarama tamamlandı! ${data.newLeadsSaved} yeni DACH hasta adayı bulundu.`, 'success');
      await fetchStats();
      await fetchLeads();
    } else {
      showToast(data.message || 'Tarama tamamlandı.', 'success');
    }
  } catch (err) {
    showToast('Tarama servisiyle bağlantı kurulamadı.', 'error');
  } finally {
    scanIcon.classList.remove('spinning');
    scanBtnText.textContent = 'DACH Tara';
    btnTriggerScan.disabled = false;
  }
}

// 5. Almanca Yanıt Taslağını Kopyala
function copyReplyText(id) {
  const elem = document.getElementById(`reply-text-${id}`);
  if (elem) {
    const text = elem.innerText.trim();
    navigator.clipboard.writeText(text).then(() => {
      showToast('Almanca klinik yanıt taslağı panoya kopyalandı!', 'success');
    }).catch(() => {
      showToast('Kopyalama başarısız oldu.', 'error');
    });
  }
}

// 6. Lead Durumunu Değiştir
async function changeLeadStatus(id, newStatus) {
  try {
    const res = await fetch(`/api/leads/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Hasta durumu güncellendi.', 'success');
      fetchStats();
      fetchLeads();
    }
  } catch (e) {
    showToast('Durum güncellenirken hata oluştu.', 'error');
  }
}

// 7. Ayarları Getir ve Doldur
async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    if (data.success && data.config) {
      state.config = data.config;
      populateSettingsForm(data.config);
    }
  } catch (e) {
    console.error('Config alınamadı:', e);
  }
}

function populateSettingsForm(cfg) {
  document.getElementById('cfg-clinic-name').value = cfg.clinic?.name || '';
  document.getElementById('cfg-target-cities').value = (cfg.targeting?.target_cities || []).join(', ');
  document.getElementById('cfg-health-tourism').checked = !!cfg.targeting?.health_tourism;

  document.getElementById('cfg-gemini-key').value = cfg.api_keys?.gemini_api_key || '';
  document.getElementById('cfg-openai-key').value = cfg.api_keys?.openai_api_key || '';

  document.getElementById('cfg-telegram-enabled').checked = !!cfg.notifications?.telegram?.enabled;
  document.getElementById('cfg-telegram-token').value = cfg.notifications?.telegram?.bot_token || '';
  document.getElementById('cfg-telegram-chatid').value = cfg.notifications?.telegram?.chat_id || '';

  document.getElementById('cfg-rapidapi-key').value = cfg.api_keys?.rapidapi_key || '';
  document.getElementById('cfg-twitter-token').value = cfg.api_keys?.twitter_bearer_token || '';
  document.getElementById('cfg-serpapi-key').value = cfg.api_keys?.serpapi_key || '';
  document.getElementById('cfg-youtube-key').value = cfg.api_keys?.youtube_api_key || '';
}

// 8. Ayarları Kaydet
async function saveSettings() {
  const updatedConfig = {
    ...state.config,
    clinic: {
      ...state.config.clinic,
      name: document.getElementById('cfg-clinic-name').value.trim()
    },
    targeting: {
      ...state.config.targeting,
      target_cities: document.getElementById('cfg-target-cities').value.split(',').map(s => s.trim()).filter(Boolean),
      health_tourism: document.getElementById('cfg-health-tourism').checked
    },
    api_keys: {
      ...state.config.api_keys,
      gemini_api_key: document.getElementById('cfg-gemini-key').value.trim(),
      openai_api_key: document.getElementById('cfg-openai-key').value.trim(),
      rapidapi_key: document.getElementById('cfg-rapidapi-key').value.trim(),
      twitter_bearer_token: document.getElementById('cfg-twitter-token').value.trim(),
      serpapi_key: document.getElementById('cfg-serpapi-key').value.trim(),
      youtube_api_key: document.getElementById('cfg-youtube-key').value.trim()
    },
    notifications: {
      ...state.config.notifications,
      telegram: {
        enabled: document.getElementById('cfg-telegram-enabled').checked,
        bot_token: document.getElementById('cfg-telegram-token').value.trim(),
        chat_id: document.getElementById('cfg-telegram-chatid').value.trim()
      }
    }
  };

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedConfig)
    });
    const data = await res.json();
    if (data.success) {
      showToast('DACH ayarları başarıyla kaydedildi!', 'success');
      state.config = updatedConfig;
      closeSettings();
    }
  } catch (e) {
    showToast('Ayarlar kaydedilirken hata oluştu.', 'error');
  }
}

// 9. Telegram Bağlantısını Test Et
async function testTelegram() {
  const token = document.getElementById('cfg-telegram-token').value.trim();
  const chatId = document.getElementById('cfg-telegram-chatid').value.trim();

  if (!token || !chatId) {
    showToast('Lütfen Telegram Bot Token ve Chat ID giriniz.', 'error');
    return;
  }

  showToast('Telegram test bildirimi gönderiliyor...', 'success');

  try {
    const res = await fetch('/api/test-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, chatId })
    });
    const data = await res.json();
    if (data.success) {
      showToast('✅ ' + data.message, 'success');
    } else {
      showToast('❌ ' + (data.message || 'Telegram testi başarısız.'), 'error');
    }
  } catch (e) {
    showToast('Telegram test isteği gönderilemedi.', 'error');
  }
}

function openSettings() {
  settingsModal.classList.remove('hidden');
}

function closeSettings() {
  settingsModal.classList.add('hidden');
}

function resetFilters() {
  state.filters = { category: 'all', urgency: 'all', source: 'all', status: 'all', location: 'all', search: '' };
  searchInput.value = '';
  if (filterLocation) filterLocation.value = 'all';
  if (filterSource) filterSource.value = 'all';
  if (filterStatus) filterStatus.value = 'all';
  if (filterTime) filterTime.value = '90d';
  document.querySelectorAll('#category-filter-pills .pill').forEach(p => p.classList.remove('active'));
  document.querySelector('#category-filter-pills .pill[data-category="all"]').classList.add('active');
  fetchLeads();
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function formatTimeAgo(dateString) {
  if (!dateString) return 'Gerade eben';
  const now = new Date();
  const past = new Date(dateString);
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return 'Gerade eben';
  if (diffSec < 3600) return `vor ${Math.floor(diffSec / 60)} Min.`;
  if (diffSec < 86400) return `vor ${Math.floor(diffSec / 3600)} Std.`;
  return `vor ${Math.floor(diffSec / 86400)} Tagen`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
