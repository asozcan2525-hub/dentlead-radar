# 🔑 Bütün Platformlar İçin API Alma ve Tanımlama Rehberi

Tüm platformlardan (Reddit, X/Twitter, Google/Forumlar, YouTube) **dakikası dakikasına canlı hasta adaylarını** çekebilmemiz için gereken API anahtarlarının nereden ve nasıl alınacağı aşağıda adım adım listelenmiştir:

---

## 1. Reddit API (Ücretsiz - r/FragReddit, r/Austria, r/de)

Reddit'teki Almanların Türkiye diş tedavisi sorularını çekmek için:
1. **[reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)** sayfasına gidin (Reddit hesabınız açık olsun).
2. Sayfanın en altındaki **"are you a developer? create an app..."** butonuna tıklayın.
3. Formu şu şekilde doldurun:
   - **name**: `DentLeadRadar`
   - Seçeneklerden **"script"** kutucuğunu işaretleyin.
   - **redirect uri**: `http://localhost:8080` yazın.
4. **"create app"** butonuna basın.
5. Size verilen şu 2 bilgiyi kopyalayın:
   - **Client ID**: Uygulama adının altındaki rastgele harf/sayılar (Örn: `k8dJ12mN99a...`)
   - **Client Secret**: `secret` yazısının karşısındaki uzun kod.

---

## 2. X (Twitter) Scraper API (RapidAPI - En Hızlı & Kolayı)

X/Twitter'daki güncel Almanca diş ağrısı ve implant tweetlerini çekmek için:
1. **[RapidAPI.com](https://rapidapi.com/)** sitesine ücretsiz üye olun.
2. Arama çubuğuna **"Twitter 154"** veya **"Twitter Scraper Fast"** yazın (veya [bu linke](https://rapidapi.com/alexanderxbx/api/twitter154) gidin).
3. **"Subscribe to Test"** diyerek ücretsiz test paketini seçin.
4. Sağ taraftaki kod kutucuğunda görünen **`X-RapidAPI-Key`** değerini kopyalayın.

---

## 3. Google Arama & Forumlar (SerpApi - Gutefrage.net & Sağlık Forumları)

Gutefrage.net ve Alman sağlık forumlarındaki en güncel soru başlıklarını çekmek için:
1. **[SerpApi.com](https://serpapi.com/)** sitesine gidin ve ücretsiz kayıt olun (Her ay 100 ücretsiz arama verir).
2. Kayıt olduktan sonra ana sayfadaki **"Your API Key"** kutucuğundaki anahtarı kopyalayın.

---

## 4. YouTube Data API v3 (Hasta Yorumları İçin - Ücretsiz)

"Zähne in der Türkei" videolarının altındaki soru soran Alman hastaları çekmek için:
1. **[console.cloud.google.com](https://console.cloud.google.com/)** adresine gidin.
2. Yeni bir proje oluşturun ve **"APIs & Services" > "Library"** menüsüne girin.
3. **"YouTube Data API v3"** aratıp **"Enable" (Etkinleştir)** butonuna basın.
4. **"Credentials" (Kimlik Bilgileri) > "Create Credentials" > "API Key"** diyerek anahtarı kopyalayın.

---

## 5. Google Gemini AI API (Yapay Zeka Niyet Filtresi - Ücretsiz)

Toplanan metinleri niyetine göre puanlamak ve Almanca yanıt üretmek için:
1. **[aistudio.google.com](https://aistudio.google.com/)** adresine Google hesabınızla girin.
2. Sol üstteki **"Get API Key"** butonuna tıklayın.
3. **"Create API key"** diyerek aldığınız anahtarı kopyalayın.

---

## 6. Telegram Bildirim Botu (Opsiyonel - Cep Telefonuna Bildirim)

Sıcak bir hasta düştüğünde telefonunuza anında bildirim gelmesi için:
1. Telegram uygulamasında **`@BotFather`** ile bir sohbet başlatın.
2. `/newbot` yazın ve sizden istediği bot adını girin -> Size bir **Bot Token** verecektir.
3. Telegram'da **`@userinfobot`**'a mesaj atarak kendi **Chat ID** numaranızı öğrenin.

---

## 🚀 Anahtarları Nereye Gireceksiniz?

Anahtarları aldıkça iki yöntemle sisteme aktarabilirsiniz:

- **Yöntem 1 (En Kolayı)**: [http://localhost:3000](http://localhost:3000) adresine gidip sağ üstteki **"⚙️ Altyapı Ayarları"** butonuna tıklayıp ilgili kutulara yapıştırın ve "Kaydet"e basın.
- **Yöntem 2**: Proje klasörünüzdeki [`config.json`](config.json) dosyasını açıp ilgili alanlara yapıştırın.
- **Yöntem 3**: Doğrudan bana sohbet üzerinden yazın, ben sizin yerinize anında sisteme kaydedip canlı taramayı tetikleyeyim.
