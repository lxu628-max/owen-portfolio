# Owen 作品集网站迁移到 Render 指南

## 迁移内容

已完成以下修改：
1. **数据库**：SQLite → PostgreSQL（Render 免费提供）
2. **server.js**：替换 `better-sqlite3` 为 `pg`，所有 SQL 改为 PostgreSQL 语法
3. **package.json**：移除 `better-sqlite3`，添加 `pg`
4. **render.yaml**：Render 自动部署配置
5. **.gitignore**：排除 node_modules、db、uploads

## 部署步骤

### 第一步：推送代码到 GitHub

1. 将修改后的项目文件推送到你的 GitHub 仓库：
   ```
   https://github.com/lxu628-max/owen-portfolio
   ```

2. 如果本地有代码，执行：
   ```bash
   cd owen-portfolio
   git add .
   git commit -m "迁移到 Render + PostgreSQL"
   git push origin main
   ```

### 第二步：在 Render 创建新项目

1. 打开 https://render.com 登录账号
2. 点击右上角 **"New +"** → **"Web Service"**
3. 选择 **"Connect a repository"**
4. 选择 `lxu628-max/owen-portfolio` 仓库
5. 点击 **"Connect"**

### 第三步：配置部署

Render 会自动检测 `render.yaml` 配置，你应该看到：
- **Name**: owen-portfolio
- **Plan**: Free
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`

还需要配置数据库：
1. 在 Render 控制台，点击 **"New +"** → **"PostgreSQL"**
2. 选择 **Free** 计划
3. 数据库名称：`owen-postgres`
4. 创建后，复制 **Internal Database URL**

### 第四步：绑定数据库

1. 回到 Web Service 设置页面
2. 点击 **"Environment"** 标签
3. 添加环境变量：
   - **Key**: `DATABASE_URL`
   - **Value**: 粘贴刚才复制的 Internal Database URL
4. 添加环境变量：
   - **Key**: `JWT_SECRET`
   - **Value**: 随意输入一个随机字符串（如 `owen-secret-2026`）
5. 点击 **"Save Changes"**

### 第五步：部署

1. 点击 **"Manual Deploy"** → **"Deploy latest commit"**
2. 等待 2-3 分钟部署完成
3. 部署成功后，访问你的网站：`https://owen-portfolio.onrender.com`（具体域名以 Render 分配为准）

### 第六步：验证

1. 访问前端首页，确认页面正常显示
2. 访问 `/admin`，使用 `admin / admin123` 登录
3. 测试后台管理功能是否正常

## 注意事项

### Render 免费版限制
- **服务休眠**：15 分钟无访问后服务休眠，下次访问需等待 30-60 秒唤醒
- **数据库**：PostgreSQL 免费版有 90 天限制，之后需要删除重建（数据会丢失）
- **带宽**：100GB/月

### 图片上传
- 上传的图片存储在服务器的 `/uploads` 目录
- **重要**：Render 免费版服务重启后上传的图片会丢失
- 建议：使用外部图床（如 Cloudinary、Imgur）存储图片

### 数据备份
- 定期从后台导出数据
- 重要内容建议本地备份

## 常见问题

### Q: 为什么数据库 90 天后会失效？
A: Render 免费 PostgreSQL 限制 90 天使用。到期后需要删除旧数据库并创建新的，数据会重置。

### Q: 如何避免服务休眠？
A: 可以使用免费监控服务（如 UptimeRobot）每 5 分钟访问一次网站，保持服务活跃。

### Q: 能否绑定自定义域名？
A: Render 免费版不支持自定义域名。如需绑定 aboutowen.cn，需要升级付费计划。

## 回滚方案

如果迁移失败，原项目文件已备份在工作目录：
```
/Coze/Drive/路克/所有对话/主对话/owen-portfolio.tar.gz
```

可以重新部署到 Railway 或其他平台。
