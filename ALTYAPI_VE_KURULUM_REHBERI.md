# 🦷 Diş Kliniği Müşteri / Hasta Radarı - Altyapı ve Kurulum Rehberi

Bu rehber, internet üzerinde diş problemi yaşayan, hekim tavsiyesi arayan veya estetik diş tedavisi araştıran kişileri yakalamak için sisteme tanımlayabileceğiniz altyapıları listeler.

---

## 📋 Tanımlayabileceğiniz Altyapılar ve Kaynaklar

Sistem **modüler** olarak tasarlanmıştır. Aşağıdaki altyapılardan elinizde olanları tanımlayabilir, olmayanları daha sonra ekleyebilirsiniz. **Hiçbir API anahtarı olmasa dahi sistem açık web kaynakları ve simülasyon modülüyle anında çalışabilmektedir.**

---

### 1. Sosyal Medya ve Tarama Altyapıları (Data Ingestion)

#### A. X (Twitter) Veri Akışı
İnsanların "Dişim çok ağrıyor", "Kadıköy'de implant yapan hekim önerisi", "Zirkonyum yaptıran var mı?" gibi anlık cümleler kurduğu en sıcak mecradır.
* **Seçenek 1 (Tavsiye Edilen - En Hızlı): RapidAPI Twitter Scraper API**
  - **Nereden Alınır**: [RapidAPI](https://rapidapi.com/) üzerinden "Twitter Search" veya "Twitter Scraper" API.
  - **Ne Gerektirir**: Tek bir `RAPIDAPI_KEY`. Ücretsiz deneme paketleri mevcuttur.
* **Seçenek 2: Resmi X (Twitter) Developer API v2**
  - **Nereden Alınır**: [developer.x.com](https://developer.x.com/)
  - **Ne Gerektirir**: `TWITTER_BEARER_TOKEN` (Basic veya Pro tier).
* **Seçenek 3: Açık Arama / Nitter / Web Search**
  - API gerektirmez, doğrudan arama sorgularıyla açık web üzerinden veri çeker.

#### B. Reddit API (Ücretsiz ve Çok Kolay)
* **Kullanım Alanı**: `r/Turkey`, `r/istanbul`, `r/ankara`, `r/askdentists` gibi topluluklarda diş sağlığıyla ilgili açılan yardım ve tavsiye başlıkları.
* **Nereden Alınır**: [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps) adresinden "script" tipi bir uygulama oluşturulur (1 dakikalık işlem, ücretsizdir).
* **Ne Gerektirir**:
  - `REDDIT_CLIENT_ID`
  - `REDDIT_CLIENT_SECRET`
  - `REDDIT_USER_AGENT`

#### C. Forumlar ve Soru Siteleri (Ekşi Sözlük, KızlarSoruyor, vb.)
* Yerel forumlar ve soru-cevap sitelerindeki yeni başlıkları ve yorumları tarar.
* Ek bir API anahtarı gerektirmez, sistemin dahili web toplayıcısı tarafından otomatik taranır.

#### D. Google Search / Soru Portalları (Google SERP)
* **Nereden Alınır**: [SerpApi](https://serpapi.com/) veya [Google Custom Search](https://programmablesearchengine.google.com/)
* **Ne Gerektirir**: `SERPAPI_KEY` veya `GOOGLE_SEARCH_API_KEY` + `GOOGLE_CSE_ID`.
* **Kullanım Alanı**: Son 24 saatte Google'a düşen hasta soruları ve yerel sağlık portalı tartışmaları.

---

### 2. Yapay Zeka (AI Niyet & Filtreleme Altyapısı)

Toplanan metinlerin gerçek bir hasta mı yoksa mecazi bir ifade mi ("diş bilemek", "dişe dokunur" vb.) olduğunu ayırt eder, tedaviyi etiketler ve kliniğiniz adına nazik bir yanıt taslağı üretir.

* **Seçenek 1 (Tavsiye Edilen - Çok Hızlı & Ücretsiz Kotası Var): Google Gemini API**
  - **Nereden Alınır**: [Google AI Studio](https://aistudio.google.com/) (Ücretsiz API Key alınabilir).
  - **Ne Gerektirir**: `GEMINI_API_KEY`
* **Seçenek 2: OpenAI API**
  - **Nereden Alınır**: [platform.openai.com](https://platform.openai.com/)
  - **Ne Gerektirir**: `OPENAI_API_KEY` (gpt-4o-mini ile son derece düşük maliyetli).
* **Seçenek 3: Dahili Akıllı Kural Motoru (Offline Fallback)**
  - Herhangi bir AI anahtarı girilmese bile sistemimiz kural bazlı semantik analizle çalışmaya devam eder.

---

### 3. Bildirim ve CRM Altyapıları (Lead'ler Nereye Düşsün?)

#### A. Telegram Botu (En Pratik & Anlık Cep Telefonu Bildirimi)
Yeni bir hasta adayı tespit edildiğinde kliniğin telefonuna veya WhatsApp gibi Telegram grubuna anında sesli bildirim düşer.
* **Nasıl Kurulur**:
  1. Telegram'da `@BotFather` ile konuşup `/newbot` diyerek bir bot oluşturun -> Size bir `BOT_TOKEN` verir.
  2. Botu kliniğinizin grubuna ekleyin veya bota mesaj atın.
  3. `@userinfobot` veya `@RawDataBot` ile `CHAT_ID`'nizi öğrenin.
* **Ne Gerektirir**:
  - `TELEGRAM_BOT_TOKEN`
  - `TELEGRAM_CHAT_ID`

#### B. Google Sheets / Excel Senkronizasyonu
* Toplanan tüm lead'ler otomatik olarak CSV olarak dışa aktarılabilir veya Google Apps Script Webhook URL'si tanımlanarak canlı Google Sheets tablosuna yazdırılabilir.
* **Ne Gerektirir**: `GOOGLE_SHEETS_WEBHOOK_URL`

#### C. Özel Web Yönetim Paneli (DentLead Radar Dashboard)
* Sistemle birlikte gelen modern arayüz sayesinde hiçbir ek araç kurmadan tarayıcınızdan (`http://localhost:3000`) tüm hastaları görebilir, filtreleyebilir ve tek tıkla mesaj taslağını kopyalayabilirsiniz.

---

## 🚀 Ayarları Nasıl Tanımlayacaksınız?

İki kolay yönteminiz var:

1. **Yöntem 1 (Arayüzden - En Kolayı)**:
   - Sistemi çalıştırdıktan sonra tarayıcıda açılan panelin sağ üstündeki **"⚙️ Altyapı Ayarları"** butonuna tıklayın.
   - Sahip olduğunuz anahtarları (Telegram, Gemini/OpenAI, Twitter vb.) kutucuklara yapıştırıp "Kaydet"e basın.

2. **Yöntem 2 (Dosyadan)**:
   - Proje ana dizinindeki `config.json` dosyasını açıp ilgili alanları doldurun.
