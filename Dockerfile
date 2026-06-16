# Dùng NodeJS bản đầy đủ 
FROM node:18-bullseye

# Mở cổng 7860 cho UptimeRobot
EXPOSE 7860

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# ⚡ BÙA ÉP XÀI MẠNG IPv4 TRUYỀN THỐNG (CHỐNG ĐỨT KẾT NỐI TELEGRAM)
ENV NODE_OPTIONS="--dns-result-order=ipv4first"

# Lệnh chạy bot 
CMD ["npm", "start"]