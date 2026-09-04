/**
 * Owen Portfolio - Main Server
 * Express + SQLite (better-sqlite3) + JWT 认证
 * 适配 Render 免费部署（无需绑信用卡）
 */

const express = require('express');
const Database = require('better-sqlite3');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const geoip = require('geoip-lite');

// ============ 配置 ============
const PORT = process.env.PORT || 3000;
// 安全相关配置集中管理；缺失关键密钥 / 密码时 config.js 会拒绝启动（不再写死默认值）
const { JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD, ALLOWED_ORIGIN, SESSION_EXPIRE } = require('./config');

// Supabase Storage 配置
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const SUPABASE_BUCKET = 'portfolio-images';

// 初始化 Supabase 客户端（仅在配置存在时）
let supabase = null;
let useSupabaseStorage = false;
if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    useSupabaseStorage = true;
    console.log('[Supabase] 已启用 Storage 持久化存储');
  } catch (err) {
    console.warn('[Supabase] 初始化失败，回退到本地存储:', err.message);
    useSupabaseStorage = false;
  }
} else {
  console.log('[Supabase] 未配置 SUPABASE_URL/SUPABASE_KEY，使用本地 uploads/ 存储');
}

// 确保 bucket 存在（异步初始化，public bucket）
async function ensureBucket() {
  if (!useSupabaseStorage || !supabase) return;
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) throw listError;
    const exists = buckets && buckets.some(b => b.name === SUPABASE_BUCKET);
    if (!exists) {
      const { error: createError } = await supabase.storage.createBucket(SUPABASE_BUCKET, {
        public: true
      });
      if (createError) throw createError;
      console.log(`[Supabase] 已创建 bucket: ${SUPABASE_BUCKET}`);
    } else {
      console.log(`[Supabase] bucket 已存在: ${SUPABASE_BUCKET}`);
    }
  } catch (err) {
    console.warn('[Supabase] bucket 检查/创建失败:', err.message);
  }
}

// SQLite 数据库路径
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'db', 'database.sqlite');

// 确保 db 目录存在
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

// 确保 uploads 目录存在
if (!fs.existsSync(path.join(__dirname, 'uploads'))) fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

// 初始化 SQLite 数据库
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============ 数据库初始化 ============
function initDatabase() {
  // 创建所有表
  db.exec(`
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 板块内容表
    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_key TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '{}',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 首页动态
    CREATE TABLE IF NOT EXISTS news_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      date TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 学术项目
    CREATE TABLE IF NOT EXISTS academic_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      date TEXT DEFAULT '',
      location TEXT DEFAULT '',
      participants TEXT DEFAULT '',
      details TEXT DEFAULT '',
      achievements TEXT DEFAULT '',
      image TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    );

    -- 运动记录
    CREATE TABLE IF NOT EXISTS sports_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competition_name TEXT NOT NULL,
      event TEXT DEFAULT '',
      result TEXT DEFAULT '',
      date TEXT DEFAULT '',
      location TEXT DEFAULT '',
      description TEXT DEFAULT '',
      progress TEXT DEFAULT '',
      image TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    );

    -- 西藏活动
    CREATE TABLE IF NOT EXISTS tibet_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      date TEXT DEFAULT '',
      impact TEXT DEFAULT '',
      image TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    );

    -- 社团活动
    CREATE TABLE IF NOT EXISTS club_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      role TEXT DEFAULT '',
      description TEXT DEFAULT '',
      status TEXT DEFAULT '',
      image TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    );

    -- 轮播图
    CREATE TABLE IF NOT EXISTS carousel_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_key TEXT NOT NULL,
      image_path TEXT NOT NULL,
      caption TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    );

    -- 网站设置
    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT DEFAULT ''
    );

    -- 访问统计
    CREATE TABLE IF NOT EXISTS page_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_path TEXT NOT NULL,
      page_name TEXT NOT NULL DEFAULT '',
      visitor_ip TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      city TEXT DEFAULT '',
      region TEXT DEFAULT '',
      country TEXT DEFAULT '',
      view_type TEXT DEFAULT 'frontend',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
    CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);
  `);

  // 创建默认管理员（用户名 / 密码来自环境变量，禁止默认弱密码）
  const admin = db.prepare('SELECT id FROM users WHERE username = ?').get(ADMIN_USERNAME);
  if (!admin) {
    const hash = bcrypt.hashSync(ADMIN_PASSWORD, 12);
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(ADMIN_USERNAME, hash);
    console.log(`[初始化] 默认管理员已创建: ${ADMIN_USERNAME}（初始密码来自环境变量 ADMIN_PASSWORD）`);
  }

  // 插入默认板块
  const defaultSections = [
    { key: 'about', title: '关于我', content: JSON.stringify({
      background: '我是一名就读于 YCIS（上海耀中外籍人员子女学校）的 IB 学生，正在准备申请海外顶尖大学。',
      goals: '目标院校：美国/英国顶尖大学，主修计算机科学或工程方向',
      majors: '专业方向：计算机科学、人工智能、数据科学',
      leadership: '积极参与学生领导活动，担任多个社团核心成员与组织者',
      traits: '热爱探索、跨文化背景、对科技与人文均有浓厚兴趣'
    })},
    { key: 'sports', title: '体育竞技', content: JSON.stringify({
      intro: '游泳是我坚持多年的竞技运动，在多项校际和区域比赛中取得优异成绩。',
      highlights: '代表学校参加 ISS 游泳锦标赛，多次获得个人及接力项目奖牌'
    })},
    { key: 'academic', title: '学术成就', content: JSON.stringify({
      intro: 'IB 课程体系下，我在多个学科领域积极探索，参与了丰富的学术竞赛和研究项目。',
      courses: 'IB HL: 数学AA、物理、计算机科学 | IB SL: 英语、中文、经济学'
    })},
    { key: 'tibet', title: '西藏项目', content: JSON.stringify({
      intro: '参与西藏公益教育项目，为偏远地区学生带去知识和温暖。',
      mission: '通过教育和文化交流，促进藏区青少年发展，搭建城乡教育桥梁'
    })},
    { key: 'clubs', title: '社团活动', content: JSON.stringify({
      intro: '积极参与和创建多个学生社团，涵盖科技、创新和社区服务领域。',
      highlights: '机器人社团核心成员、创新项目负责人、社区志愿者'
    })}
  ];

  const insertSection = db.prepare('INSERT OR IGNORE INTO sections (section_key, title, content) VALUES (?, ?, ?)');
  for (const s of defaultSections) {
    insertSection.run(s.key, s.title, s.content);
  }

  // 插入示例数据
  const newsCount = db.prepare('SELECT COUNT(*) as cnt FROM news_items').get();
  if (newsCount.cnt === 0) {
    const insertNews = db.prepare('INSERT INTO news_items (title, description, date, sort_order) VALUES (?, ?, ?, ?)');
    insertNews.run('ISS 游泳锦标赛', '代表学校参加 ISS 游泳锦标赛，获得200米自由泳银牌', '2024-11-15', 1);
    insertNews.run('康莱德创新挑战赛', '团队项目进入区域决赛，聚焦可持续发展议题', '2024-10-20', 2);
    insertNews.run('西藏教育项目', '完成第三期西藏远程教学计划，覆盖50名学生', '2024-09-01', 3);
    insertNews.run('NVIDIA 深度学习证书', '完成 NVIDIA 深度学习基础课程并获得认证', '2024-08-15', 4);
    insertNews.run('机器人社团招新', '作为核心成员组织新学期招新活动，吸引30+新成员', '2024-08-01', 5);
  }

  // 插入示例学术项目
  const academicCount = db.prepare('SELECT COUNT(*) as cnt FROM academic_projects').get();
  if (academicCount.cnt === 0) {
    const insertAcademic = db.prepare('INSERT INTO academic_projects (title, description, date, location, participants, details, achievements, image, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertAcademic.run('欧洲研究项目', '深入探索欧洲一体化进程及其对当代政治经济格局的影响', '2024-03-01', '上海', '个人项目', '通过文献研究和数据分析，完成了关于欧盟气候变化政策的研究报告', '获得 IB 欧洲与世界历史 高分评价', 'https://images.unsplash.com/photo-1499856871958-5b964473db7c?w=800', 1);
    insertAcademic.run('地理研究项目', '研究上海城市化进程中绿地空间变化及其对居民生活质量的影响', '2024-05-01', '上海', '2人小组', '使用 GIS 工具分析近十年卫星图像数据', '研究报告被选为年级优秀范例', 'https://images.unsplash.com/photo-1456428199391-a3b1cb5e9337?w=800', 2);
    insertAcademic.run('Conrad 挑战赛', '开发基于 AI 的校园垃圾分类解决方案', '2024-10-01', '线上', '5人团队', '设计并实现了图像识别原型系统', '进入区域决赛', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800', 3);
    insertAcademic.run('NVIDIA 深度学习', '完成 NVIDIA 深度学习基础课程', '2024-08-01', '线上', '个人', '系统学习神经网络、CNN、RNN 等核心概念并完成实践项目', '获得 NVIDIA 官方认证证书', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800', 4);
  }

  // 插入示例运动记录
  const sportsCount = db.prepare('SELECT COUNT(*) as cnt FROM sports_records').get();
  if (sportsCount.cnt === 0) {
    const insertSports = db.prepare('INSERT INTO sports_records (competition_name, event, result, date, location, description, progress, image, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertSports.run('ISS 游泳锦标赛', '200米自由泳', '银牌 (2:05.3)', '2024-11-15', '上海', '代表学校参加年度 ISS 校际游泳锦标赛', '从入学时的 2:30 提升到 2:05，持续进步', 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800', 1);
    insertSports.run('ISS 游泳锦标赛', '100米仰泳', '铜牌 (1:08.7)', '2024-11-15', '上海', '首次参加仰泳项目即获佳绩', '仰泳从零开始训练，一年内达到竞赛水平', 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800', 2);
    insertSports.run('校际友谊赛', '4x100米混合泳接力', '金牌', '2024-09-20', '上海', '作为仰泳棒次，助力团队夺冠', '团队配合默契，接力成绩创个人最好', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', 3);
    insertSports.run('学年末运动会', '100米自由泳', '金牌 (55.2)', '2024-06-01', '上海', '校内运动会100米自由泳冠军', '突破个人最佳成绩', 'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?w=800', 4);
  }

  // 插入示例西藏活动
  const tibetCount = db.prepare('SELECT COUNT(*) as cnt FROM tibet_activities').get();
  if (tibetCount.cnt === 0) {
    const insertTibet = db.prepare('INSERT INTO tibet_activities (title, description, date, impact, image, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    insertTibet.run('远程教学计划', '为西藏偏远地区中学生提供在线英语和科学辅导', '2024-03-01', '覆盖50名学生，累计授课100+小时', 'https://images.unsplash.com/photo-1497486751825-1233686f5d54?w=800', 1);
    insertTibet.run('物资募集行动', '组织校内募集活动，为藏区学校捐赠书籍和文具', '2024-06-01', '募集500+本书籍和200套文具', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800', 2);
    insertTibet.run('暑期实地考察', '前往西藏实地考察教育现状，建立长期合作基地', '2024-07-15', '与当地3所学校建立长期合作关系', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800', 3);
  }

  // 插入示例社团
  const clubsCount = db.prepare('SELECT COUNT(*) as cnt FROM club_activities').get();
  if (clubsCount.cnt === 0) {
    const insertClub = db.prepare('INSERT INTO club_activities (title, role, description, status, image, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    insertClub.run('机器人社团', '核心成员 / 技术负责人', '负责机器人编程和机械设计，参加 VEX 机器人大赛', '活跃', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800', 1);
    insertClub.run('科技创新社', '联合创始人', '创建校园科技创新平台，组织黑客松和创新工作坊', '活跃', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800', 2);
    insertClub.run('社区志愿服务', '志愿者', '定期参与社区服务活动，包括环保清洁和敬老院探访', '活跃', 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800', 3);
  }

  // 插入示例轮播图
  const carouselCount = db.prepare('SELECT COUNT(*) as cnt FROM carousel_images').get();
  if (carouselCount.cnt === 0) {
    const carouselData = [
      ['home', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200', '探索学术前沿', 1],
      ['home', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200', '泳池中不断突破', 2],
      ['home', 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=1200', '跨越山海，连接西藏', 3],
      ['about', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', '个人照片', 1],
      ['about', 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800', '校园生活', 2],
      ['academic', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800', '学术研究', 1],
      ['academic', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800', '获奖证书', 2],
      ['sports', 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800', '游泳比赛', 1],
      ['sports', 'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?w=800', '训练日常', 2],
      ['tibet', 'https://images.unsplash.com/photo-1497486751825-1233686f5d54?w=800', '西藏教育', 1],
      ['clubs', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800', '机器人项目', 1]
    ];
    const insertCarousel = db.prepare('INSERT INTO carousel_images (section_key, image_path, caption, sort_order) VALUES (?, ?, ?, ?)');
    for (const item of carouselData) {
      insertCarousel.run(...item);
    }
  }

  // 插入默认网站设置
  const settingsCount = db.prepare('SELECT COUNT(*) as cnt FROM site_settings').get();
  if (settingsCount.cnt === 0) {
    const settings = [
      ['site_name', "Owen's Portfolio"],
      ['hero_title', '你好，我是 Owen'],
      ['hero_subtitle', 'YCIS IB 学生 | 科技爱好者 | 竞技游泳运动员'],
      ['hero_description', '热爱探索科技前沿，在水中挑战极限，用教育连接远方。'],
      ['footer_text', '© 2024 Owen. All rights reserved.'],
      ['contact_email', 'owen@example.com']
    ];
    const insertSetting = db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)');
    for (const [key, value] of settings) {
      insertSetting.run(key, value);
    }
  }

  console.log('[初始化] 数据库初始化完成');
}

// ============ Express 应用 ============
const app = express();

// 中间件
// 安全头：防点击劫持 / 窃听等（CSP 暂关闭以免破坏既有内联脚本，后续可细化）
app.use(helmet({ contentSecurityPolicy: false }));
// 后台禁止被 iframe 嵌套（防点击劫持拿后台）
app.use('/admin', (req, res, next) => { res.setHeader('X-Frame-Options', 'DENY'); next(); });

// CORS：生产环境用 ALLOWED_ORIGIN 限制来源；未配置时放开（仅本地开发，并给出告警）
const corsOptions = ALLOWED_ORIGIN
  ? { origin: ALLOWED_ORIGIN.split(',').map(s => s.trim()), credentials: true }
  : { origin: true };
if (!ALLOWED_ORIGIN) {
  console.warn('[安全] ALLOWED_ORIGIN 未设置，CORS 已放开（生产环境请配置为你的域名）');
}
app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 登录限流：15 分钟内同一 IP 最多 10 次，防弱密码暴破
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '登录尝试过于频繁，请 15 分钟后再试' }
});

// ============ 访问追踪中间件 ============
const pageNameMap = {
  '/': '首页',
  '/home': '首页',
  '/about': '关于我',
  '/sports': '体育竞技',
  '/academic': '学术成就',
  '/tibet': '西藏项目',
  '/clubs': '社团活动',
  '/admin/': '后台首页',
  '/admin/dashboard.html': '后台管理面板',
  '/admin/index.html': '后台登录页'
};

app.use((req, res, next) => {
  // 跳过静态资源和API请求
  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot|map)$/)) return next();
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();

  const pagePath = req.path;
  const pageName = pageNameMap[pagePath] || (pagePath.startsWith('/admin') ? '后台页面' : '前台页面');
  const viewType = pagePath.startsWith('/admin') ? 'admin' : 'frontend';
  const ip = req.ip || req.connection.remoteAddress || '';
  const ua = req.get('User-Agent') || '';

  try {
    let cleanIp = ip.replace('::ffff:', '');
    let city = '', region = '', country = '';
    if (cleanIp && cleanIp !== '::1' && cleanIp !== '127.0.0.1') {
      const geo = geoip.lookup(cleanIp);
      if (geo) { city = geo.city || ''; region = geo.region || ''; country = geo.country || ''; }
    } else if (cleanIp === '::1' || cleanIp === '127.0.0.1') {
      city = '本地'; country = '中国';
    }
    db.prepare('INSERT INTO page_views (page_path, page_name, visitor_ip, user_agent, view_type, city, region, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      pagePath, pageName, ip, ua, viewType, city, region, country);
  } catch(e) { /* silent */ }
  next();
});


// 静态文件
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    // 注意：明确禁止 svg —— SVG 可内嵌脚本，上传后同源返回会被浏览器执行，造成存储型 XSS 进而窃取后台 token
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('仅支持 jpeg/jpg/png/gif/webp 图片上传'));
  }
});

// 上传图片到 Supabase Storage
async function uploadImageToSupabase(filePath, filename) {
  if (!useSupabaseStorage || !supabase) {
    throw new Error('Supabase Storage 未配置');
  }
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filename).toLowerCase();
  let contentType = 'application/octet-stream';
  if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  else if (ext === '.png') contentType = 'image/png';
  else if (ext === '.gif') contentType = 'image/gif';
  else if (ext === '.webp') contentType = 'image/webp';
  else if (ext === '.svg') contentType = 'image/svg+xml';

  const { error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(filename, fileBuffer, {
      contentType,
      upsert: false
    });
  if (error) throw error;

  const publicUrl = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${SUPABASE_BUCKET}/${filename}`;
  return publicUrl;
}

// 从 Supabase Storage 删除图片
async function deleteImageFromSupabase(imageUrl) {
  if (!useSupabaseStorage || !supabase || !imageUrl) return;
  // 从 URL 中提取文件名
  const prefix = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${SUPABASE_BUCKET}/`;
  if (!imageUrl.startsWith(prefix)) return; // 不是 Supabase 上的图片，跳过
  const fileName = imageUrl.substring(prefix.length);
  if (!fileName) return;
  try {
    await supabase.storage.from(SUPABASE_BUCKET).remove([fileName]);
  } catch (err) {
    console.warn('[Supabase] 删除图片失败:', err.message);
  }
}

// ============ 认证中间件 ============
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权访问' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token 无效或已过期' });
  }
}

// ============ 公开 API ============

// 获取首页动态

app.get('/api/news', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM news_items ORDER BY sort_order ASC, date DESC LIMIT 5').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取板块内容
app.get('/api/section/:key', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM sections WHERE section_key = ?').get(req.params.key);
    if (!row) return res.status(404).json({ error: '板块不存在' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 学术项目列表
app.get('/api/academic', (req, res) => {
  try {
    const rows = db.prepare('SELECT id, title, description, date, location, image, sort_order FROM academic_projects ORDER BY sort_order ASC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 学术项目详情
app.get('/api/academic/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM academic_projects WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: '项目不存在' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 运动记录列表
app.get('/api/sports', (req, res) => {
  try {
    const rows = db.prepare('SELECT id, competition_name, event, result, date, location, image, sort_order FROM sports_records ORDER BY sort_order ASC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 运动记录详情
app.get('/api/sports/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM sports_records WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: '记录不存在' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 西藏活动列表
app.get('/api/tibet', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM tibet_activities ORDER BY sort_order ASC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 社团活动列表
app.get('/api/clubs', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM club_activities ORDER BY sort_order ASC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 西藏活动详情
app.get('/api/tibet/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM tibet_activities WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: '活动不存在' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 社团活动详情
app.get('/api/clubs/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM club_activities WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: '活动不存在' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取轮播图
app.get('/api/carousel/:section_key', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM carousel_images WHERE section_key = ? ORDER BY sort_order ASC').all(req.params.section_key);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取网站设置
app.get('/api/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM site_settings').all();
    const obj = {};
    rows.forEach(s => obj[s.key] = s.value);
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============ 管理 API（需认证）============

// 登录
app.post('/api/admin/login', loginRateLimit, (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: SESSION_EXPIRE });
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 修改密码
app.post('/api/admin/change-password', authMiddleware, (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '请填写原密码和新密码' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码至少6个字符' });
    }
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
      return res.status(401).json({ error: '原密码错误' });
    }
    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);
    res.json({ message: '密码修改成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 上传图片
app.post('/api/admin/upload', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '未选择文件' });
    const localPath = req.file.path;
    const filename = req.file.filename;

    // 优先上传到 Supabase Storage
    if (useSupabaseStorage && supabase) {
      try {
        const url = await uploadImageToSupabase(localPath, filename);
        // 上传成功后删除本地临时文件
        try { fs.unlinkSync(localPath); } catch (e) { /* 忽略 */ }
        return res.json({ url, filename });
      } catch (supabaseErr) {
        console.warn('[Supabase] 上传失败，使用本地存储回退:', supabaseErr.message);
        // 回退到本地存储
        const url = `/uploads/${filename}`;
        return res.json({ url, filename });
      }
    }

    // 本地存储模式
    const url = `/uploads/${filename}`;
    res.json({ url, filename });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 管理动态
app.put('/api/admin/news', authMiddleware, (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: '数据格式错误' });

    const transaction = db.transaction((items) => {
      for (const item of items) {
        if (item._action === 'delete' && item.id) {
          db.prepare('DELETE FROM news_items WHERE id = ?').run(item.id);
        } else if (item._action === 'add') {
          db.prepare('INSERT INTO news_items (title, description, date, sort_order) VALUES (?, ?, ?, ?)').run(
            item.title, item.description || '', item.date, item.sort_order || 0);
        } else if (item._action === 'update' && item.id) {
          db.prepare('UPDATE news_items SET title=?, description=?, date=?, sort_order=? WHERE id=?').run(
            item.title, item.description || '', item.date, item.sort_order || 0, item.id);
        }
      }
    });
    transaction(items);

    const rows = db.prepare('SELECT * FROM news_items ORDER BY sort_order ASC').all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新板块内容
app.put('/api/admin/section/:key', authMiddleware, (req, res) => {
  try {
    const { title, content } = req.body;
    const key = req.params.key;
    const contentStr = typeof content === 'object' ? JSON.stringify(content) : (content || '{}');
    
    db.prepare('UPDATE sections SET title=?, content=?, updated_at=CURRENT_TIMESTAMP WHERE section_key=?').run(
      title || '', contentStr, key);

    const row = db.prepare('SELECT * FROM sections WHERE section_key = ?').get(key);
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 管理学术项目
app.put('/api/admin/academic', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: '数据格式错误' });

    const transaction = db.transaction((items) => {
      for (const item of items) {
        if (item._action === 'delete' && item.id) {
          // 先查询旧图片 URL 以便同步删除
          const old = db.prepare('SELECT image FROM academic_projects WHERE id = ?').get(item.id);
          if (old && old.image && useSupabaseStorage) {
            // 异步删除，不阻塞事务
            deleteImageFromSupabase(old.image).catch(() => {});
          }
          db.prepare('DELETE FROM academic_projects WHERE id = ?').run(item.id);
        } else if (item._action === 'add') {
          db.prepare('INSERT INTO academic_projects (title, description, date, location, participants, details, achievements, image, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
            item.title, item.description || '', item.date || '', item.location || '', item.participants || '', item.details || '', item.achievements || '', item.image || '', item.sort_order || 0);
        } else if (item._action === 'update' && item.id) {
          // 检查图片是否变更，若变更则删除旧图
          const old = db.prepare('SELECT image FROM academic_projects WHERE id = ?').get(item.id);
          if (old && old.image && item.image && old.image !== item.image && useSupabaseStorage) {
            deleteImageFromSupabase(old.image).catch(() => {});
          }
          db.prepare('UPDATE academic_projects SET title=?, description=?, date=?, location=?, participants=?, details=?, achievements=?, image=?, sort_order=? WHERE id=?').run(
            item.title, item.description || '', item.date || '', item.location || '', item.participants || '', item.details || '', item.achievements || '', item.image || '', item.sort_order || 0, item.id);
        }
      }
    });
    transaction(items);

    const rows = db.prepare('SELECT * FROM academic_projects ORDER BY sort_order ASC').all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 管理运动记录
app.put('/api/admin/sports', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: '数据格式错误' });

    const transaction = db.transaction((items) => {
      for (const item of items) {
        if (item._action === 'delete' && item.id) {
          const old = db.prepare('SELECT image FROM sports_records WHERE id = ?').get(item.id);
          if (old && old.image && useSupabaseStorage) {
            deleteImageFromSupabase(old.image).catch(() => {});
          }
          db.prepare('DELETE FROM sports_records WHERE id = ?').run(item.id);
        } else if (item._action === 'add') {
          db.prepare('INSERT INTO sports_records (competition_name, event, result, date, location, description, progress, image, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
            item.competition_name, item.event || '', item.result || '', item.date || '', item.location || '', item.description || '', item.progress || '', item.image || '', item.sort_order || 0);
        } else if (item._action === 'update' && item.id) {
          const old = db.prepare('SELECT image FROM sports_records WHERE id = ?').get(item.id);
          if (old && old.image && item.image && old.image !== item.image && useSupabaseStorage) {
            deleteImageFromSupabase(old.image).catch(() => {});
          }
          db.prepare('UPDATE sports_records SET competition_name=?, event=?, result=?, date=?, location=?, description=?, progress=?, image=?, sort_order=? WHERE id=?').run(
            item.competition_name, item.event || '', item.result || '', item.date || '', item.location || '', item.description || '', item.progress || '', item.image || '', item.sort_order || 0, item.id);
        }
      }
    });
    transaction(items);

    const rows = db.prepare('SELECT * FROM sports_records ORDER BY sort_order ASC').all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 管理西藏活动
app.put('/api/admin/tibet', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: '数据格式错误' });

    const transaction = db.transaction((items) => {
      for (const item of items) {
        if (item._action === 'delete' && item.id) {
          const old = db.prepare('SELECT image FROM tibet_activities WHERE id = ?').get(item.id);
          if (old && old.image && useSupabaseStorage) {
            deleteImageFromSupabase(old.image).catch(() => {});
          }
          db.prepare('DELETE FROM tibet_activities WHERE id = ?').run(item.id);
        } else if (item._action === 'add') {
          db.prepare('INSERT INTO tibet_activities (title, description, date, impact, image, sort_order) VALUES (?, ?, ?, ?, ?, ?)').run(
            item.title, item.description || '', item.date || '', item.impact || '', item.image || '', item.sort_order || 0);
        } else if (item._action === 'update' && item.id) {
          const old = db.prepare('SELECT image FROM tibet_activities WHERE id = ?').get(item.id);
          if (old && old.image && item.image && old.image !== item.image && useSupabaseStorage) {
            deleteImageFromSupabase(old.image).catch(() => {});
          }
          db.prepare('UPDATE tibet_activities SET title=?, description=?, date=?, impact=?, image=?, sort_order=? WHERE id=?').run(
            item.title, item.description || '', item.date || '', item.impact || '', item.image || '', item.sort_order || 0, item.id);
        }
      }
    });
    transaction(items);

    const rows = db.prepare('SELECT * FROM tibet_activities ORDER BY sort_order ASC').all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 管理社团活动
app.put('/api/admin/clubs', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: '数据格式错误' });

    const transaction = db.transaction((items) => {
      for (const item of items) {
        if (item._action === 'delete' && item.id) {
          const old = db.prepare('SELECT image FROM club_activities WHERE id = ?').get(item.id);
          if (old && old.image && useSupabaseStorage) {
            deleteImageFromSupabase(old.image).catch(() => {});
          }
          db.prepare('DELETE FROM club_activities WHERE id = ?').run(item.id);
        } else if (item._action === 'add') {
          db.prepare('INSERT INTO club_activities (title, role, description, status, image, sort_order) VALUES (?, ?, ?, ?, ?, ?)').run(
            item.title, item.role || '', item.description || '', item.status || '', item.image || '', item.sort_order || 0);
        } else if (item._action === 'update' && item.id) {
          const old = db.prepare('SELECT image FROM club_activities WHERE id = ?').get(item.id);
          if (old && old.image && item.image && old.image !== item.image && useSupabaseStorage) {
            deleteImageFromSupabase(old.image).catch(() => {});
          }
          db.prepare('UPDATE club_activities SET title=?, role=?, description=?, status=?, image=?, sort_order=? WHERE id=?').run(
            item.title, item.role || '', item.description || '', item.status || '', item.image || '', item.sort_order || 0, item.id);
        }
      }
    });
    transaction(items);

    const rows = db.prepare('SELECT * FROM club_activities ORDER BY sort_order ASC').all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 管理轮播图
app.put('/api/admin/carousel/:section_key', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    const sectionKey = req.params.section_key;
    if (!Array.isArray(items)) return res.status(400).json({ error: '数据格式错误' });

    const transaction = db.transaction((items) => {
      for (const item of items) {
        if (item._action === 'delete' && item.id) {
          const old = db.prepare('SELECT image_path FROM carousel_images WHERE id = ?').get(item.id);
          if (old && old.image_path && useSupabaseStorage) {
            deleteImageFromSupabase(old.image_path).catch(() => {});
          }
          db.prepare('DELETE FROM carousel_images WHERE id = ?').run(item.id);
        } else if (item._action === 'add') {
          db.prepare('INSERT INTO carousel_images (section_key, image_path, caption, sort_order) VALUES (?, ?, ?, ?)').run(
            sectionKey, item.image_path, item.caption || '', item.sort_order || 0);
        } else if (item._action === 'update' && item.id) {
          const old = db.prepare('SELECT image_path FROM carousel_images WHERE id = ?').get(item.id);
          if (old && old.image_path && item.image_path && old.image_path !== item.image_path && useSupabaseStorage) {
            deleteImageFromSupabase(old.image_path).catch(() => {});
          }
          db.prepare('UPDATE carousel_images SET image_path=?, caption=?, sort_order=? WHERE id=?').run(
            item.image_path, item.caption || '', item.sort_order || 0, item.id);
        }
      }
    });
    transaction(items);

    const rows = db.prepare('SELECT * FROM carousel_images WHERE section_key = ? ORDER BY sort_order ASC').all(sectionKey);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 管理网站设置
app.put('/api/admin/settings', authMiddleware, (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') return res.status(400).json({ error: '数据格式错误' });

    const transaction = db.transaction((settings) => {
      for (const [key, value] of Object.entries(settings)) {
        const existing = db.prepare('SELECT id FROM site_settings WHERE key = ?').get(key);
        if (existing) {
          db.prepare('UPDATE site_settings SET value = ? WHERE key = ?').run(String(value), key);
        } else {
          db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)').run(key, String(value));
        }
      }
    });
    transaction(settings);

    const rows = db.prepare('SELECT key, value FROM site_settings').all();
    const obj = {};
    rows.forEach(s => obj[s.key] = s.value);
    res.json({ success: true, data: obj });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});


// ============ 访问统计 API ============
app.get('/api/admin/stats', authMiddleware, (req, res) => {
  try {
    // 总访问量
    const totalViews = db.prepare('SELECT COUNT(*) as cnt FROM page_views').get().cnt;
    
    // 今日访问量
    const todayViews = db.prepare("SELECT COUNT(*) as cnt FROM page_views WHERE date(created_at) = date('now')").get().cnt;
    
    // 前台 vs 后台
    const frontendTotal = db.prepare("SELECT COUNT(*) as cnt FROM page_views WHERE view_type = 'frontend'").get().cnt;
    const adminTotal = db.prepare("SELECT COUNT(*) as cnt FROM page_views WHERE view_type = 'admin'").get().cnt;
    
    // 近7天每日统计
    const dailyStats = db.prepare(`
      SELECT date(created_at) as date, 
             COUNT(*) as total,
             SUM(CASE WHEN view_type = 'frontend' THEN 1 ELSE 0 END) as frontend,
             SUM(CASE WHEN view_type = 'admin' THEN 1 ELSE 0 END) as admin
      FROM page_views 
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY date(created_at) 
      ORDER BY date ASC
    `).all();
    
    // 各页面访问量排行
    const pageStats = db.prepare(`
      SELECT page_path, page_name, view_type, COUNT(*) as views
      FROM page_views
      GROUP BY page_path, page_name, view_type
      ORDER BY views DESC
      LIMIT 20
    `).all();
    
    // 最近20条访问记录
    const recentViews = db.prepare(`
      SELECT page_path, page_name, visitor_ip, city, region, country, view_type, created_at
      FROM page_views
      ORDER BY created_at DESC
      LIMIT 20
    `).all();
    
    // 本周 vs 上周对比
    const thisWeek = db.prepare(`
      SELECT COUNT(*) as cnt FROM page_views 
      WHERE created_at >= datetime('now', 'weekday 0', '-7 days')
    `).get().cnt;
    const lastWeek = db.prepare(`
      SELECT COUNT(*) as cnt FROM page_views 
      WHERE created_at >= datetime('now', 'weekday 0', '-14 days')
      AND created_at < datetime('now', 'weekday 0', '-7 days')
    `).get().cnt;
    
    res.json({
      success: true,
      data: {
        totalViews,
        todayViews,
        frontendTotal,
        adminTotal,
        dailyStats,
        pageStats,
        recentViews,
        thisWeek,
        lastWeek
      }
    });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// SPA fallback - 所有其他路由返回 index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/admin')) {
    return res.sendFile(path.join(__dirname, 'admin', 'index.html'));
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============ 统一错误处理（不向客户端泄露内部信息）============
// 放在所有路由之后。multer 的文件过滤/大小错误转 400；其余统一 500 且不回显 err.message
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const msg = err && err.message ? err.message : '';
  if (err instanceof multer.MulterError || /仅支持|文件|上传/.test(msg)) {
    return res.status(400).json({ error: msg || '文件上传被拒绝' });
  }
  console.error('[未处理错误]', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// ============ 启动服务器 ============
async function start() {
  try {
    initDatabase();
    // 确保 Supabase bucket 存在（异步，不阻塞启动）
    if (useSupabaseStorage) {
      ensureBucket();
    }
    app.listen(PORT, () => {
      console.log(`\n🚀 Owen Portfolio 服务器已启动`);
      console.log(`📍 前端: http://localhost:${PORT}`);
      console.log(`🔧 后台: http://localhost:${PORT}/admin`);
      console.log(`👤 后台账号: ${ADMIN_USERNAME}（初始密码见环境变量 ADMIN_PASSWORD）\n`);
    });
  } catch (err) {
    console.error('启动失败:', err);
    process.exit(1);
  }
}

start();

