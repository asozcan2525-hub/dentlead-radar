/**
 * Almanca & İngilizce Tarih Ayrıştırıcı ve 90 Gün (3 Ay) Tazelik Doğrulayıcı
 */

function parseRelativeDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const lower = dateStr.toLowerCase().trim();
  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  // 1. Yıllar (Kesinlikle 3 aydan eski -> Doğrudan RED!)
  if (lower.includes('jahr') || lower.includes('year') || lower.includes('2015') || lower.includes('2016') || lower.includes('2017') || lower.includes('2018') || lower.includes('2019') || lower.includes('2020') || lower.includes('2021') || lower.includes('2022') || lower.includes('2023') || lower.includes('2024') || lower.includes('2025')) {
    return { valid: false, reason: 'Yıl bazında eski (en az 1-7 yıl önce)' };
  }

  // 2. Saat / Dakika / Bugün
  if (lower.includes('stunde') || lower.includes('hour') || lower.includes('minute') || lower.includes('min') || lower.includes('gerade') || lower.includes('heute') || lower.includes('today')) {
    return { valid: true, date: new Date(now).toISOString() };
  }

  // 3. Gün (Tagen / Days)
  const tagMatch = lower.match(/(\d+)\s*(tag|day)/i);
  if (tagMatch) {
    const days = parseInt(tagMatch[1], 10);
    if (days > 90) return { valid: false, reason: `${days} gün önce (>90 gün)` };
    return { valid: true, date: new Date(now - days * 86400000).toISOString() };
  }

  // 4. Hafta (Wochen / Weeks)
  const wochMatch = lower.match(/(\d+)\s*(woche|week)/i);
  if (wochMatch) {
    const weeks = parseInt(wochMatch[1], 10);
    const days = weeks * 7;
    if (days > 90) return { valid: false, reason: `${weeks} hafta önce (>90 gün)` };
    return { valid: true, date: new Date(now - days * 86400000).toISOString() };
  }

  // 5. Ay (Monat / Month)
  const monatMatch = lower.match(/(\d+)\s*(monat|month)/i);
  if (monatMatch) {
    const months = parseInt(monatMatch[1], 10);
    if (months > 3) return { valid: false, reason: `${months} ay önce (>3 ay)` };
    return { valid: true, date: new Date(now - months * 30 * 86400000).toISOString() };
  }

  // 6. Takvim Tarihi: DD.MM.YYYY veya YYYY-MM-DD
  const dmyMatch = lower.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const targetDate = new Date(year, month, day);
    if (isNaN(targetDate.getTime())) return null;

    if (now - targetDate.getTime() > ninetyDaysMs) {
      return { valid: false, reason: `${dateStr} tarihi 90 günden eski` };
    }
    return { valid: true, date: targetDate.toISOString() };
  }

  // Standart ISO veya Date nesnesi kontrolü
  const parsedTime = Date.parse(dateStr);
  if (!isNaN(parsedTime)) {
    if (now - parsedTime > ninetyDaysMs) {
      return { valid: false, reason: 'ISO tarihi 90 günden eski' };
    }
    return { valid: true, date: new Date(parsedTime).toISOString() };
  }

  return null;
}

module.exports = {
  parseRelativeDate
};
