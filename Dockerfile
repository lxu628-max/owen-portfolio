# Owen Portfolio 运行镜像（备选：阿里云容器服务 SAE / ACK / 函数计算自定义运行时）
FROM node:18-alpine

WORKDIR /app

# 安装原生编译依赖（better-sqlite3 需要）
RUN apk add --no-cache python3 make g++

COPY package.json ./
RUN npm install --production

COPY . .

# 运行时通过环境变量注入密钥（务必在阿里云控制台配置，勿写进镜像）
ENV PORT=3000
EXPOSE 3000

# 生产建议用持久化卷挂载 /app/db 与 /app/uploads
CMD ["node", "server.js"]
