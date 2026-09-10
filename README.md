# 🦷 DentLead Radar - Diş Kliniği Müşteri ve Hasta Yakalama Otomasyonu

İnternet üzerinde (X/Twitter, Reddit, Forumlar, Soru Siteleri) diş ağrısı çeken, implant veya estetik diş arayışında olan kişileri otomatik tespit eden, yapay zeka ile filtreleyip puanlayan ve kliniğinize anlık bildirim düşüren otomasyon sistemi.

---

## 🚀 Hızlı Başlangıç

Sistem şu anda çalışır durumdadır. Tarayıcınızdan aşağıdaki adrese gidebilirsiniz:

👉 **[http://localhost:3000](http://localhost:3000)**

Sistemi daha sonra tekrar başlatmak isterseniz proje dizininde şu komutu çalıştırmanız yeterlidir:
```bash
node src/server.js
```

---

## 📋 Tanımlayabileceğiniz Altyapılar

Detaylı rehber için lütfen **[ALTYAPI_VE_KURULUM_REHBERI.md](ALTYAPI_VE_KURULUM_REHBERI.md)** dosyasını inceleyin veya panelin sağ üstündeki **"⚙️ Altyapı Ayarları"** butonuna tıklayın.

Kullanabileceğiniz altyapılar:
1. **Telegram Bildirimleri**: Yeni ve acil bir hasta adayı çıktığında kliniğinizin grubuna/telefonuna sesli anlık bildirim düşer (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`).
2. **Yapay Zeka Niyet Motoru**: Gemini API veya OpenAI API tanımlanabilir.
3. **X (Twitter) Veri Akışı**: RapidAPI Twitter Scraper veya X Developer Bearer Token.
4. **Reddit & Forumlar**: r/Turkey, r/istanbul, r/askdentists ve açık Türkçe forumlar.
5. **Google SERP**: SerpApi ile Google tartışmaları ve soru portalları.

---

## 🛠️ Öne Çıkan Özellikler

- **AI Klinik Yanıt Üretici**: Her hasta için özel, empatik ve randevuya davet eden hazır yanıt taslağı üretir. "Kopyala" butonuyla anında yanıtlayabilirsiniz.
- **Canlı İstatistikler**: Toplam hasta sayısı, acil ağrı vakaları, yüksek bütçeli (implant/gülüş tasarımı) tedaviler.
- **Akıllı Filtreleme**: İmplant, Zirkonyum, Acil Diş Ağrısı, Şeffaf Plak, 20'lik Diş kategorilerine göre ayrıştırma.
- **Excel / CSV Dışa Aktarma**: Tüm verileri tek tıkla Excel formatında indirebilme.
