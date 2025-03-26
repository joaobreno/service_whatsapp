FROM node:22-slim

# Instala dependências necessárias para o Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    libgbm1 \
    libnss3 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "start"] 