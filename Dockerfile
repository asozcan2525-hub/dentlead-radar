FROM node:24-slim

WORKDIR /app

# Bağımlılıkları kopyala ve yükle
COPY package*.json ./
RUN npm install --production

# Proje dosyalarını kopyala
COPY . .

# Port
EXPOSE 3000
ENV PORT=3000

# Çalıştır
CMD ["node", "src/server.js"]
