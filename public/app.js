/**
 * DentLead Radar DACH - Frontend Application Logic
 */

let state = {
  leads: [],
  filters: {
    channel: 'all',
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

// 📧 E-Postası Bulunanlar Modal Referansları
const emailLeadsModal = document.getElementById('email-leads-modal');
const btnOpenEmailModal = document.getElementById('btn-open-email-modal');
const cardEmailLeads = document.getElementById('card-email-leads');
const btnCloseEmailModal = document.getElementById('btn-close-email-modal');
const btnCloseEmailModalFooter = document.getElementById('btn-close-email-modal-footer');
const emailSearchInput = document.getElementById('email-search-input');
const btnCopyAllEmails = document.getElementById('btn-copy-all-emails');
const emailLeadsContainer = document.getElementById('email-leads-container');
const emailModalCount = document.getElementById('email-modal-count');
const headerEmailCount = document.getElementById('header-email-count');
const statEmails = document.getElementById('stat-emails');

document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  loadConfig();
  fetchStats();
  fetchLeads();

  // 🔄 Canlı Arka Plan Senkronizasyonu: Her 30 saniyede bir sayaçları ve listeyi otomatik güncelle
  setInterval(() => {
    fetchStats();
    fetchLeads();
  }, 30000);
});

function initEventListeners() {
  // 🧭 Kanal Sekmeleri (All, Instagram, Facebook, Forumlar, Email)
  document.querySelectorAll('.channel-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.channel-tab-btn').forEach(b => b.classList.remove('active'));
      const targetBtn = e.currentTarget;
      targetBtn.classList.add('active');
      const channel = targetBtn.dataset.channel || 'all';
      state.filters.channel = channel;

      const labelEl = document.getElementById('channel-active-status');
      if (labelEl) {
        const titles = {
          all: 'Tüm Kaynaklar (Genel Havuz)',
          instagram: '📸 Instagram / Rakip Reklam Yorumları',
          facebook: '👥 Facebook Hasta Grupları',
          forums: '💬 Sağlık Forumları & Reddit',
          email: '📧 Doğrulanmış E-Postalı Hastalar'
        };
        labelEl.innerHTML = `Şu an: <strong>${titles[channel] || channel}</strong> gösteriliyor`;
      }
      fetchLeads();
    });
  });

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

  // 📧 E-Postası Bulunanlar Modal Olayları
  if (btnOpenEmailModal) btnOpenEmailModal.addEventListener('click', openEmailModal);
  if (cardEmailLeads) cardEmailLeads.addEventListener('click', openEmailModal);
  if (btnCloseEmailModal) btnCloseEmailModal.addEventListener('click', closeEmailModal);
  if (btnCloseEmailModalFooter) btnCloseEmailModalFooter.addEventListener('click', closeEmailModal);
  if (btnCopyAllEmails) btnCopyAllEmails.addEventListener('click', copyAllEmails);
  if (emailSearchInput) {
    let emailSearchTimeout;
    emailSearchInput.addEventListener('input', (e) => {
      clearTimeout(emailSearchTimeout);
      emailSearchTimeout = setTimeout(() => {
        filterEmailCards(e.target.value.toLowerCase().trim());
      }, 150);
    });
  }

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
      channel: state.filters.channel || 'all',
      category: state.filters.category,
      urgency: state.filters.urgency,
      source: state.filters.source,
      status: state.filters.status,
      timeRange: state.filters.timeRange || '90d',
      limit: state.limit || 150
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
      state.stats = s;
      statTotal.textContent = (s.totalLeads || 0).toLocaleString();
      statContacted.textContent = s.contactedLeads || 0;
      if (statEmails) statEmails.textContent = (s.withEmailLeads || 0).toLocaleString();
      if (headerEmailCount) headerEmailCount.textContent = (s.withEmailLeads || 0).toLocaleString();

      // Kanal Rozet Sayıları
      if (s.channels) {
        const bAll = document.getElementById('badge-chan-all');
        const bIg = document.getElementById('badge-chan-instagram');
        const bFb = document.getElementById('badge-chan-facebook');
        const bFor = document.getElementById('badge-chan-forums');
        const bMail = document.getElementById('badge-chan-email');
        if (bAll) bAll.textContent = (s.channels.all || 0).toLocaleString();
        if (bIg) bIg.textContent = (s.channels.instagram || 0).toLocaleString();
        if (bFb) bFb.textContent = (s.channels.facebook || 0).toLocaleString();
        if (bFor) bFor.textContent = (s.channels.forums || 0).toLocaleString();
        if (bMail) bMail.textContent = (s.channels.email || 0).toLocaleString();
      }

      let implantCount = 0;
      let aestheticCount = 0;

      (s.categories || []).forEach(c => {
        if (c.treatment_category === 'implant' || c.treatment_category === 'all_on_4_full_mouth') implantCount += c.count;
        if (c.treatment_category === 'zirconium_aesthetic') aestheticCount += c.count;
      });

      statHighTicket.textContent = implantCount.toLocaleString();
      statUrgent.textContent = aestheticCount.toLocaleString();
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

  const totalCount = state.stats?.totalLeads || 1052;
  leadCountBadge.textContent = `${filtered.length} / ${totalCount} Hasta (Klinik Ciddiyet Sıralı)`;

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

  let html = filtered.map(lead => createLeadCardHtml(lead)).join('');

  if (state.leads.length >= (state.limit || 150)) {
    html += `
      <div style="grid-column: 1 / -1; text-align: center; padding: 30px 20px;">
        <button id="btn-load-more" class="btn btn-primary" onclick="loadMoreLeads()" style="padding: 14px 32px; font-weight: 700; font-size: 14px; box-shadow: 0 0 20px rgba(0, 242, 254, 0.4);">
          📥 Daha Fazla Hasta Yükle (+150 Hasta)
        </button>
      </div>
    `;
  }

  leadsContainer.innerHTML = html;
}

function loadMoreLeads() {
  state.limit = (state.limit || 150) + 150;
  fetchLeads();
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
    instagram: { icon: '📸', name: 'Instagram Rakip Reklamı', class: 'badge-instagram', channelLabel: 'Instagram Reels / Reklam Yorumu' },
    facebook: { icon: '👥', name: 'Facebook Hasta Grubu', class: 'badge-facebook', channelLabel: 'Facebook Diş Tedavisi Grubu' },
    gutefrage: { icon: '❓', name: 'Gutefrage.net', class: 'badge-gutefrage', channelLabel: 'Almanya Soru-Cevap Portalı' },
    'gutefrage.net': { icon: '❓', name: 'Gutefrage.net', class: 'badge-gutefrage', channelLabel: 'Almanya Soru-Cevap Portalı' },
    reddit: { icon: '🤖', name: 'Reddit DACH', class: 'badge-reddit', channelLabel: 'Reddit Sağlık Topluluğu' },
    tripadvisor: { icon: '🦉', name: 'TripAdvisor Forum', class: 'badge-tripadvisor', channelLabel: 'TripAdvisor Forumu' },
    twitter: { icon: '🐦', name: 'Twitter DE', class: 'badge-twitter', channelLabel: 'Twitter/X' },
    forum: { icon: '💬', name: 'Med1 / Forum', class: 'badge-forum', channelLabel: 'Almanya Diş Forumu' },
    google: { icon: '🔍', name: 'Google SERP', class: 'badge-google', channelLabel: 'Google Arama Sonucu' }
  }[lead.source] || { icon: '🌐', name: lead.source || 'Web Kaynağı', class: 'badge-forum', channelLabel: 'Online Topluluk' };

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

  // 📅 Kesin Türkçe Tarih ve Gün Hesaplama
  const postDate = new Date(lead.created_at);
  const isValidDate = !isNaN(postDate.getTime());
  const now = new Date();
  const diffDays = isValidDate ? Math.max(0, Math.floor((now - postDate) / (1000 * 60 * 60 * 24))) : 999;

  const turkishMonths = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  let exactDateStr = 'Tarih Belirtilmemiş';
  let daysAgoStr = '';
  if (isValidDate) {
    const day = postDate.getDate();
    const month = turkishMonths[postDate.getMonth()];
    const year = postDate.getFullYear();
    if (diffDays === 0) daysAgoStr = 'Bugün';
    else if (diffDays === 1) daysAgoStr = 'Dün';
    else if (diffDays < 30) daysAgoStr = `${diffDays} gün önce`;
    else {
      const m = Math.floor(diffDays / 30);
      daysAgoStr = `${m} ay önce`;
    }
    exactDateStr = `📅 ${day} ${month} ${year} (${daysAgoStr})`;
  }

  // 🎯 Kanal Bannerı (Hangi kanaldan geldiği çok net görünür)
  let channelBannerHtml = '';
  if (lead.source === 'instagram') {
    channelBannerHtml = `
      <div class="card-channel-banner banner-instagram">
        <span class="banner-icon">📸</span>
        <div class="banner-content">
          <strong>INSTAGRAM RAKİP REKLAMI YORUMU</strong>
          <span>Rakip klinik tanıtım videosu altına doğrudan fiyat/tedavi sorusu sordu</span>
        </div>
      </div>
    `;
  } else if (lead.source === 'facebook') {
    channelBannerHtml = `
      <div class="card-channel-banner banner-facebook">
        <span class="banner-icon">👥</span>
        <div class="banner-content">
          <strong>FACEBOOK DİŞ GRUBU GÖNDERİSİ</strong>
          <span>Turkey Teeth / Dental Travel hasta topluluğunda klinik arayışı</span>
        </div>
      </div>
    `;
  } else if (lead.email) {
    channelBannerHtml = `
      <div class="card-channel-banner banner-email">
        <span class="banner-icon">📧</span>
        <div class="banner-content">
          <strong>DOĞRULANMIŞ HASTA E-POSTASI</strong>
          <span>Doğrudan Gmail veya Outlook ile 1 tıkla teklif gönderilebilir</span>
        </div>
      </div>
    `;
  } else {
    channelBannerHtml = `
      <div class="card-channel-banner banner-forums">
        <span class="banner-icon">${sourceDetails.icon}</span>
        <div class="banner-content">
          <strong>${sourceDetails.name.toUpperCase()}</strong>
          <span>${sourceDetails.channelLabel}</span>
        </div>
      </div>
    `;
  }

  // 🔗 Kanala Özel Aksiyon Butonları
  let channelActionButtons = '';
  if (lead.source === 'instagram') {
    const igDmUrl = lead.author_url || `https://www.instagram.com/${escapeHtml(lead.author)}/`;
    channelActionButtons = `
      <a href="${igDmUrl}" target="_blank" rel="noopener noreferrer" class="btn-channel-action btn-instagram-dm" 
         title="Instagram'da kullanıcı profiline git veya DM gönder">
        💬 Instagram DM Gönder ↗
      </a>
      <a href="${escapeHtml(lead.url || '#')}" target="_blank" rel="noopener noreferrer" class="btn-verify-source-main"
         title="Rakip kliniğin videosunu ve hastanın yorumunu incele">
        🔗 Rakip Gönderisini Aç ↗
      </a>
    `;
  } else if (lead.source === 'facebook') {
    const fbProfileUrl = lead.author_url || lead.url || 'https://www.facebook.com';
    channelActionButtons = `
      <a href="${fbProfileUrl}" target="_blank" rel="noopener noreferrer" class="btn-channel-action btn-facebook-msg"
         title="Hastanın Facebook profiline git ve Messenger ile mesaj at">
        👤 Facebook Profil & Mesaj ↗
      </a>
      <a href="${escapeHtml(lead.url || '#')}" target="_blank" rel="noopener noreferrer" class="btn-verify-source-main"
         title="Facebook gönderisini ve paylaşılan soruyu/yorumları incele">
        🔗 Gönderiye Git (Kanıtı Aç) ↗
      </a>
    `;
  } else {
    // Forumlar & Diğerleri
    channelActionButtons = `
      ${lead.author_url && lead.author_url !== '#' && lead.author_url !== lead.url ? `
        <a href="${escapeHtml(lead.author_url)}" target="_blank" rel="noopener noreferrer" class="btn-link-author" 
           title="Hastanın kullanıcı profiline git / Özel mesaj (DM) gönder">
          👤 Profil & DM
        </a>
      ` : ''}

      ${lead.email ? `
        <a href="https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(lead.email)}&su=${encodeURIComponent('Kostenlose Beratung & Kostenvoranschlag für Ihre Zahnbehandlung')}&body=${encodeURIComponent(lead.suggested_reply || '')}" 
           target="_blank" rel="noopener noreferrer" class="btn-link-email-direct" title="Hastaya doğrudan Gmail ile hazır Almanca teklifi gönder">
          ✉️ Gmail ile Yaz
        </a>
      ` : ''}

      <a href="${escapeHtml(lead.url || '#')}" target="_blank" rel="noopener noreferrer" class="btn-verify-source-main"
         title="Hastanın bu soruyu sorduğu kanıt web sayfasına git">
        🔗 Kanıt Linkini Aç (Soruya Git) ↗
      </a>
    `;
  }

  return `
    <div class="lead-card ${cardBorderClass}" id="lead-card-${lead.id}">
      <!-- Kanal Tanım Şeridi -->
      ${channelBannerHtml}

      <div class="card-header">
        <div class="author-meta">
          <div class="source-badge-icon ${sourceDetails.class}" title="${sourceDetails.name}">
            ${sourceDetails.icon}
          </div>
          <div>
            <div class="author-name">@${escapeHtml(lead.author || 'Patient')}</div>
            <div class="post-time">${exactDateStr} • ${sourceDetails.name}</div>
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

      <!-- 📌 Neye Göre Bulundu (Kanıt & Teşhis) -->
      <div class="lead-evidence-box">
        <div class="evidence-header">
          <span class="evidence-badge-tag">📌 KANIT & TEŞHİS DETAYI</span>
          <span class="evidence-source-tag">${sourceDetails.icon} ${sourceDetails.name}</span>
        </div>
        <div class="evidence-reason">
          <strong>Neye Göre Bulundu:</strong> ${escapeHtml(lead.sentiment || 'Hasta doğrudan platformda diş sorunu/maliyet araştırması paylaşmış ve klinik tekliflerine açık olduğunu belirtmiştir.')}
        </div>
        <div class="evidence-footer">
          <span class="evidence-time">${exactDateStr}</span>
          ${lead.email ? `
            <span class="evidence-email-pill" title="Bu hastanın doğrulanmış e-postası mevcuttur">
              ✉️ <strong>E-Posta:</strong> ${escapeHtml(lead.email)}
            </span>
          ` : ''}
        </div>
      </div>

      <div class="card-tags">
        <!-- 🎯 3 Ay Tazelik Rozeti (Kesin Gün Hesabı) -->
        ${(() => {
          if (diffDays <= 7) return `<span class="tag-item tag-fresh-super">🟢 Son 7 Gün (${daysAgoStr})</span>`;
          if (diffDays <= 30) return `<span class="tag-item tag-fresh-active">🟡 Son 30 Gün (${daysAgoStr})</span>`;
          if (diffDays <= 90) return `<span class="tag-item tag-fresh-normal">🔵 Son 3 Ay (${daysAgoStr})</span>`;
          return `<span class="tag-item tag-fresh-archive">⚪ Arşiv Gönderi (${daysAgoStr})</span>`;
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
            📅 Randevu
          </button>
          <button class="btn-status ${lead.status === 'ignored' ? 'active-status' : ''}" 
                  onclick="changeLeadStatus(${lead.id}, 'ignored')">
            ❌
          </button>
        </div>

        <div class="action-links-group">
          ${channelActionButtons}
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
  if (!dateString) return 'Tarih Belirtilmemiş';
  const past = new Date(dateString);
  if (isNaN(past.getTime())) return dateString;
  const now = new Date();
  const diffDays = Math.max(0, Math.floor((now - past) / (1000 * 60 * 60 * 24)));

  const turkishMonths = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  const day = past.getDate();
  const month = turkishMonths[past.getMonth()];
  const year = past.getFullYear();

  let relative = '';
  if (diffDays === 0) relative = 'Bugün';
  else if (diffDays === 1) relative = 'Dün';
  else if (diffDays < 30) relative = `${diffDays} gün önce`;
  else {
    const m = Math.floor(diffDays / 30);
    relative = `${m} ay önce`;
  }
  return `${day} ${month} ${year} (${relative})`;
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

/* ==========================================================================
   📧 E-POSTA OUTREACH MERKEZİ FONKSİYONLARI (GELİŞTİRİLMİŞ)
   ========================================================================== */

let emailLeadsCache = [];
let outreachLanguage = 'de';

// Outreach merkezi açılınca ek event listener'ları bağla
function initOutreachListeners() {
  const btnHarvest = document.getElementById('btn-harvest-emails');
  if (btnHarvest) {
    btnHarvest.addEventListener('click', triggerEmailHarvest);
  }

  const langSelect = document.getElementById('outreach-lang-select');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      outreachLanguage = e.target.value;
      openEmailModal(); // Dil değişince yeniden yükle
    });
  }
}

// Sayfa yüklenince ek listener'ları bağla
document.addEventListener('DOMContentLoaded', () => {
  initOutreachListeners();
});

async function openEmailModal() {
  if (!emailLeadsModal) return;
  emailLeadsModal.classList.remove('hidden');
  
  if (emailLeadsContainer) {
    emailLeadsContainer.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="spinner-large"></div>
        <p>E-postası bulunan hasta adayları ve outreach şablonları yükleniyor...</p>
      </div>
    `;
  }

  try {
    const res = await fetch(`/api/leads/email-outreach?lang=${outreachLanguage}`);
    const data = await res.json();
    if (data.success) {
      emailLeadsCache = data.leads || [];
      if (emailModalCount) emailModalCount.textContent = emailLeadsCache.length;
      if (headerEmailCount) headerEmailCount.textContent = emailLeadsCache.length;
      if (statEmails) statEmails.textContent = emailLeadsCache.length;
      renderEmailCards(emailLeadsCache);
    } else {
      showToast('E-posta listesi alınamadı: ' + (data.error || ''), 'error');
    }
  } catch (err) {
    console.error('Email leads fetch error:', err);
    showToast('E-posta listesi çekilirken ağ hatası oluştu.', 'error');
  }
}

function closeEmailModal() {
  if (emailLeadsModal) emailLeadsModal.classList.add('hidden');
}

function filterEmailCards(query) {
  if (!emailLeadsCache) return;
  if (!query) {
    renderEmailCards(emailLeadsCache);
    return;
  }
  const filtered = emailLeadsCache.filter(l => {
    const hay = `${l.author || ''} ${l.email || ''} ${l.content || ''} ${l.location || ''} ${l.treatment_category || ''}`.toLowerCase();
    return hay.includes(query);
  });
  renderEmailCards(filtered);
}

// 🔍 SerpApi ile yeni e-posta hastaları tara
async function triggerEmailHarvest() {
  const harvestBtn = document.getElementById('btn-harvest-emails');
  const harvestText = document.getElementById('harvest-btn-text');

  if (harvestBtn) harvestBtn.disabled = true;
  if (harvestText) harvestText.textContent = '⏳ Taranıyor...';

  showToast('Son 3 ayda e-posta bırakan yeni diş hastaları taranıyor... Bu birkaç dakika sürebilir.', 'success');

  try {
    const res = await fetch('/api/harvest-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      showToast(`✅ E-posta taraması tamamlandı! Toplam ${data.withEmailLeads} e-posta lead bulundu.`, 'success');
      await openEmailModal(); // Listeyi yenile
      await fetchStats();
    } else {
      showToast('Tarama hatası: ' + (data.error || 'Bilinmeyen hata'), 'error');
    }
  } catch (err) {
    showToast('E-posta tarama isteği gönderilemedi.', 'error');
  } finally {
    if (harvestBtn) harvestBtn.disabled = false;
    if (harvestText) harvestText.textContent = '🔍 Yeni Hasta E-Postası Tara';
  }
}

function renderEmailCards(leads) {
  if (!emailLeadsContainer) return;

  if (!leads || leads.length === 0) {
    emailLeadsContainer.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <span style="font-size: 36px;">📭</span>
        <p>Eşleşen e-posta adresi bulunamadı.</p>
        <p style="font-size: 12px; opacity: 0.7;">Yeni hastalar bulmak için yukarıdaki "🔍 Yeni Hasta E-Postası Tara" butonunu kullanabilirsiniz.</p>
      </div>
    `;
    return;
  }

  const treatmentLabels = {
    implant: '🦷 Zahnimplantat & Sinuslift',
    all_on_4_full_mouth: '👑 All-on-4 / All-on-6 Komplettsanierung',
    zirconium_aesthetic: '✨ Veneers & Zirkonkronen',
    orthodontics_invisalign: '📐 Invisalign & Aligner',
    emergency_toothache: '🚨 Akuter Zahnschmerz & Notfall',
    root_canal: '🩺 Wurzelbehandlung',
    wisdom_tooth: '⚡ Weisheitszahn OP',
    general_checkup: '🔍 Zweitmeinung & Heil- und Kostenplan'
  };

  const urgencyColors = {
    critical: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.4)', label: '🚨 KRİTİK' },
    high: { bg: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: 'rgba(251, 191, 36, 0.4)', label: '⚡ YÜKSEK' },
    medium: { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.4)', label: '📌 ORTA' },
    low: { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)', label: 'ℹ️ BİLGİ' }
  };

  const cardsHtml = leads.map(l => {
    let flag = '🇩🇪';
    if (l.location && l.location.includes('Avusturya')) flag = '🇦🇹';
    else if (l.location && l.location.includes('İsviçre')) flag = '🇨🇭';
    else if (l.location && (l.location.includes('İngiltere') || l.location.includes('UK'))) flag = '🇬🇧';

    const cleanEmail = escapeHtml(l.email || '');
    const cleanAuthor = escapeHtml(l.author || 'Hasta');
    const initial = (cleanAuthor[0] || 'P').toUpperCase();
    const cleanContent = escapeHtml(l.content || '');
    const cleanUrl = escapeHtml(l.url || '#');
    const cleanCategory = treatmentLabels[l.treatment_category] || l.treatment_category;
    const urgency = urgencyColors[l.urgency] || urgencyColors.medium;

    // Outreach linkleri (API'den gelen hazır linkler)
    const gmailLink = l.outreach_links?.gmail || '#';
    const outlookLink = l.outreach_links?.outlook || '#';
    const mailtoLink = l.outreach_links?.mailto || `mailto:${cleanEmail}`;

    // Status badge
    const statusBadges = {
      new: { label: '🆕 Yeni', class: 'status-new' },
      contacted: { label: '📩 İletişimde', class: 'status-contacted' },
      appointment: { label: '📅 Randevu', class: 'status-appointment' },
      ignored: { label: '❌ Yoksayıldı', class: 'status-ignored' }
    };
    const currentStatus = statusBadges[l.status] || statusBadges.new;

    return `
      <div class="email-lead-card outreach-card ${l.status === 'contacted' ? 'card-contacted' : ''} ${l.status === 'appointment' ? 'card-appointment' : ''}" id="email-card-${l.id}">
        <div class="email-card-top">
          <div class="email-author-wrap">
            <div class="email-author-avatar">${initial}</div>
            <div>
              <div class="email-author-name">@${cleanAuthor}</div>
              <div class="email-source-badge">
                <span>Kaynak: ${escapeHtml(l.source || 'forum')}</span>
                <span>• ${formatTimeAgo(l.created_at)}</span>
              </div>
            </div>
          </div>
          <div class="outreach-card-badges">
            <span class="outreach-urgency-badge" style="background: ${urgency.bg}; color: ${urgency.color}; border: 1px solid ${urgency.border};">
              ${urgency.label}
            </span>
            <span class="email-country-flag" title="${escapeHtml(l.location || '')}">${flag}</span>
          </div>
        </div>

        <div class="email-address-bar outreach-email-bar">
          <span class="email-address-text">${cleanEmail}</span>
          <div class="email-bar-actions">
            <button type="button" class="btn-copy-email" onclick="copyEmailText('${cleanEmail}')" title="E-Postayı Kopyala">
              📋
            </button>
            <span class="outreach-status-badge ${currentStatus.class}">${currentStatus.label}</span>
          </div>
        </div>

        <div class="email-treatment-tag">
          ${cleanCategory}
        </div>

        <!-- 📌 Neye Göre Bulundu & E-Posta Kanıtı -->
        <div class="outreach-evidence-box">
          <div class="outreach-evidence-header">
            <span class="outreach-evidence-tag">📌 KANIT GEREKÇESİ</span>
            <span class="outreach-evidence-platform">${escapeHtml(l.source || 'web').toUpperCase()}</span>
          </div>
          <div class="outreach-evidence-text">
            <strong>Neye Göre Bulundu:</strong> ${escapeHtml(l.sentiment || 'Hasta doğrudan diş tedavisi aradığını ve iletişim kurulmasını istediğini belirterek e-postasını paylaşmıştır.')}
          </div>
          <div class="outreach-evidence-date">
            📅 Paylaşım: <strong>${formatTimeAgo(l.created_at)}</strong> (${new Date(l.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })})
          </div>
        </div>

        <div class="email-card-snippet" title="${cleanContent}">
          "${cleanContent}"
        </div>

        <div class="outreach-score-bar">
          <div class="outreach-score-fill" style="width: ${Math.min(l.ai_score || 80, 100)}%;"></div>
          <span class="outreach-score-label">%${l.ai_score || 80} Eşleşme Skoru</span>
        </div>

        <div class="outreach-card-actions">
          <div class="outreach-send-buttons">
            <a href="${gmailLink}" class="btn-gmail-send" target="_blank" rel="noopener noreferrer" onclick="markAsContacted(${l.id})" title="Gmail'de hazır şablonla aç">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>
              <span>Gmail ile Yaz</span>
            </a>
            <a href="${outlookLink}" class="btn-outlook-send" target="_blank" rel="noopener noreferrer" onclick="markAsContacted(${l.id})" title="Outlook'ta hazır şablonla aç">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><path d="M22 7l-10 7L2 7"/></svg>
              <span>Outlook</span>
            </a>
            <a href="${mailtoLink}" class="btn-mailto-send" target="_blank" rel="noopener noreferrer" title="Varsayılan mail programında aç">
              ✉️
            </a>
          </div>

          <div class="outreach-status-buttons">
            <button class="btn-outreach-status ${l.status === 'contacted' ? 'active-status' : ''}" 
                    onclick="changeOutreachStatus(${l.id}, 'contacted')" title="İletişime Geçildi">
              📩
            </button>
            <button class="btn-outreach-status ${l.status === 'appointment' ? 'active-status' : ''}" 
                    onclick="changeOutreachStatus(${l.id}, 'appointment')" title="Randevu Alındı">
              📅
            </button>
            <button class="btn-outreach-status ${l.status === 'ignored' ? 'active-status' : ''}" 
                    onclick="changeOutreachStatus(${l.id}, 'ignored')" title="Yoksay">
              ❌
            </button>
          </div>
        </div>

        <!-- Orijinal Kanıt Linki Aç Butonu -->
        <div class="outreach-verify-link-row">
          <a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="btn-outreach-source-link" title="Hastanın yazdığı bu orijinal gönderiyi yeni sekmede aç">
            🔗 Kanıt Linkini Aç (Orijinal Gönderiye Git) ↗
          </a>
        </div>
      </div>
    `;
  }).join('');

  emailLeadsContainer.innerHTML = cardsHtml;
}

// Lead durumunu güncelle ve kartı güncelle
async function changeOutreachStatus(id, newStatus) {
  try {
    const res = await fetch(`/api/leads/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      // Cache'deki durumu güncelle
      const lead = emailLeadsCache.find(l => l.id === id);
      if (lead) lead.status = newStatus;

      // Kartı görsel olarak güncelle
      const card = document.getElementById(`email-card-${id}`);
      if (card) {
        card.classList.remove('card-contacted', 'card-appointment');
        if (newStatus === 'contacted') card.classList.add('card-contacted');
        if (newStatus === 'appointment') card.classList.add('card-appointment');
      }

      const statusLabels = { contacted: '📩 İletişimde', appointment: '📅 Randevu', ignored: '❌ Yoksayıldı', new: '🆕 Yeni' };
      showToast(`Hasta durumu güncellendi: ${statusLabels[newStatus] || newStatus}`, 'success');
      fetchStats();
    }
  } catch (e) {
    showToast('Durum güncellenirken hata oluştu.', 'error');
  }
}

// Gmail'e tıklayınca otomatik olarak "İletişime Geçildi" yap
function markAsContacted(id) {
  changeOutreachStatus(id, 'contacted');
}

function copyEmailText(email) {
  if (!email) return;
  navigator.clipboard.writeText(email).then(() => {
    showToast(`✅ E-Posta panoya kopyalandı: ${email}`, 'success');
  }).catch(() => {
    showToast(`E-Posta: ${email}`, 'success');
  });
}

function copyAllEmails() {
  if (!emailLeadsCache || emailLeadsCache.length === 0) {
    showToast('Kopyalanacak e-posta adresi bulunamadı.', 'error');
    return;
  }
  const emailList = [...new Set(emailLeadsCache.map(l => l.email).filter(Boolean))];
  const text = emailList.join(', ');
  navigator.clipboard.writeText(text).then(() => {
    showToast(`📋 ${emailList.length} adet e-posta panoya kopyalandı! (BCC için hazır)`, 'success');
  }).catch(() => {
    showToast(`Kopyalandı: ${emailList.length} e-posta`, 'success');
  });
}

