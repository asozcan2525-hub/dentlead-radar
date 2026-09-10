# ☁️ 7/24 Kesintisiz & %100 Ücretsiz Bulut Kurulum Rehberi

Bilgisayarınız kapalıyken bile sistemin sürekli çalışması, yeni hasta adaylarını yakalayıp telefonunuza bildirmesi ve her yerden erişebileceğiniz bir web paneline (`https://...`) sahip olmanız için **en iyi ücretsiz çözüm** şudur:

### 🏆 Kazanan Çözüm: **Render.com (Frankfurt / Almanya Sunucusu) + UptimeRobot**

- **Maliyet**: **0 TL / 0$ (Tamamen Ücretsiz)**
- **Lokasyon**: **Frankfurt (Almanya)** — Alman sitelerini yerel IP ile tarar, bot engellerini aşar!
- **Erişim**: Cep telefonunuzdan dahi tek tıkla girebileceğiniz `https://dentlead-radar.onrender.com` linki.
- **7/24 Kesintisiz**: `/ping` sinyali sayesinde bilgisayarınız kapalıyken bile asla kapanmaz.

---

## 3 Adımda Kolay Kurulum:

### Adım 1: Kodları Ücretsiz GitHub'a Yükleyin (2 Dakika)
1. **[github.com](https://github.com/)** adresine girip ücretsiz bir hesap açın (varsa giriş yapın).
2. Sağ üstteki **"+"** ikonuna basıp **"New repository"** deyin.
3. Adını `dentlead-radar` koyup **"Create repository"** butonuna basın.
4. Açılan sayfada **"uploading an existing file"** seçeneğine tıklayın.
5. Masaüstündeki bu projenin tüm dosyalarını sürükleyip bırakın ve **"Commit changes"** deyin.

---

### Adım 2: Render.com'da 1 Tıkla Yayına Alın (1 Dakika)
1. **[render.com](https://render.com/)** sitesine gidin ve **"Sign in with GitHub"** diyerek ücretsiz giriş yapın.
2. Sağ üstteki **"New +"** butonuna basıp **"Web Service"** seçin.
3. Az önce oluşturduğunuz `dentlead-radar` reposunu seçin ve **"Connect"** deyin.
4. Karşınıza gelen ekranda:
   - **Region**: Mutlaka **`Frankfurt (EU Central)`** seçin (Almanya sunucusu olması için).
   - **Plan Type**: **`Free`** seçin.
5. En alttaki **"Create Web Service"** butonuna basın!
6. **Tebrikler!** 1-2 dakika içinde size kalıcı bir link verecektir (Örn: `https://dentlead-radar.onrender.com`).

---

### Adım 3: Sistemin Asla Uyumaması İçin (7/24 Canlı Tutma)
Render'ın ücretsiz sunucuları 15 dakika ziyaret edilmezse uykuya geçer. Bunu engellemek ve **hiçbir zaman kapanmamasını sağlamak** için:
1. **[uptimerobot.com](https://uptimerobot.com/)** sitesine gidin (Tamamen ücretsizdir).
2. **"Add New Monitor"** deyin:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `DentLead Pinger`
   - **URL**: `https://dentlead-radar.onrender.com/ping` *(Render'ın size verdiği linkin sonuna `/ping` ekleyin)*
   - **Monitoring Interval**: `5 minutes`
3. **"Create Monitor"** butonuna basın.

🎉 **Artık sistem 7 gün 24 saat bilgisayarınız kapalı olsa dahi uyanık kalacak, DACH hastalarını tarayacak ve telefonunuza bildirim atacaktır!**
