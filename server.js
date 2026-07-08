/**
 * Owen Portfolio - Main Server
 * Express + SQLite + JWT 认证
 */

const express = require('express');
const Database = require('better-sqlite3');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// ============ 配置 ============
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'owen-portfolio-secret-key-2024';
const DB_PATH = path.join(__dirname, 'db', 'database.sqlite');

// 确保目录存在
if (!fs.existsSync(path.join(__dirname, 'db'))) fs.mkdirSync(path.join(__dirname, 'db'), { recursive: true });
if (!fs.existsSync(path.join(__dirname, 'uploads'))) fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

// ============ 数据库初始化 ============
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 创建所有表
function initDatabase() {
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
  `);

  // 创建默认管理员
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('admin', hash);
    console.log('[初始化] 默认管理员已创建: admin / admin123');
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

  const sectionInsert = db.prepare('INSERT OR IGNORE INTO sections (section_key, title, content) VALUES (?, ?, ?)');
  for (const s of defaultSections) {
    sectionInsert.run(s.key, s.title, s.content);
  }

  // 插入示例动态
  const newsCount = db.prepare('SELECT COUNT(*) as cnt FROM news_items').get().cnt;
  if (newsCount === 0) {
    const newsInsert = db.prepare('INSERT INTO news_items (title, description, date, sort_order) VALUES (?, ?, ?, ?)');
    newsInsert.run('ISS 游泳锦标赛', '代表学校参加 ISS 游泳锦标赛，获得200米自由泳银牌', '2024-11-15', 1);
    newsInsert.run('康莱德创新挑战赛', '团队项目进入区域决赛，聚焦可持续发展议题', '2024-10-20', 2);
    newsInsert.run('西藏教育项目', '完成第三期西藏远程教学计划，覆盖50名学生', '2024-09-01', 3);
    newsInsert.run('NVIDIA 深度学习证书', '完成 NVIDIA 深度学习基础课程并获得认证', '2024-08-15', 4);
    newsInsert.run('机器人社团招新', '作为核心成员组织新学期招新活动，吸引30+新成员', '2024-08-01', 5);
  }

  // 插入示例学术项目
  const academicCount = db.prepare('SELECT COUNT(*) as cnt FROM academic_projects').get().cnt;
  if (academicCount === 0) {
    const apInsert = db.prepare('INSERT INTO academic_projects (title, description, date, location, participants, details, achievements, image, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    apInsert.run('欧洲研究项目', '深入探索欧洲一体化进程及其对当代政治经济格局的影响', '2024-03-01', '上海', '个人项目', '通过文献研究和数据分析，完成了关于欧盟气候变化政策的研究报告', '获得 IB 欧洲与世界历史 高分评价', 'https://images.unsplash.com/photo-1499856871958-5b964473db7c?w=800', 1);
    apInsert.run('地理研究项目', '研究上海城市化进程中绿地空间变化及其对居民生活质量的影响', '2024-05-01', '上海', '2人小组', '使用 GIS 工具分析近十年卫星图像数据', '研究报告被选为年级优秀范例', 'https://images.unsplash.com/photo-1456428199391-a3b1cb5e9337?w=800', 2);
    apInsert.run('Conrad 挑战赛', '开发基于 AI 的校园垃圾分类解决方案', '2024-10-01', '线上', '5人团队', '设计并实现了图像识别原型系统', '进入区域决赛', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800', 3);
    apInsert.run('NVIDIA 深度学习', '完成 NVIDIA 深度学习基础课程', '2024-08-01', '线上', '个人', '系统学习神经网络、CNN、RNN 等核心概念并完成实践项目', '获得 NVIDIA 官方认证证书', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800', 4);
  }

  // 插入示例运动记录
  const sportsCount = db.prepare('SELECT COUNT(*) as cnt FROM sports_records').get().cnt;
  if (sportsCount === 0) {
    const spInsert = db.prepare('INSERT INTO sports_records (competition_name, event, result, date, location, description, progress, image, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    spInsert.run('ISS 游泳锦标赛', '200米自由泳', '银牌 (2:05.3)', '2024-11-15', '上海', '代表学校参加年度 ISS 校际游泳锦标赛', '从入学时的 2:30 提升到 2:05，持续进步', 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800', 1);
    spInsert.run('ISS 游泳锦标赛', '100米仰泳', '铜牌 (1:08.7)', '2024-11-15', '上海', '首次参加仰泳项目即获佳绩', '仰泳从零开始训练，一年内达到竞赛水平', 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800', 2);
    spInsert.run('校际友谊赛', '4x100米混合泳接力', '金牌', '2024-09-20', '上海', '作为仰泳棒次，助力团队夺冠', '团队配合默契，接力成绩创个人最好', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', 3);
    spInsert.run('学年末运动会', '100米自由泳', '金牌 (55.2)', '2024-06-01', '上海', '校内运动会100米自由泳冠军', '突破个人最佳成绩', 'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?w=800', 4);
  }

  // 插入示例西藏活动
  const tibetCount = db.prepare('SELECT COUNT(*) as cnt FROM tibet_activities').get().cnt;
  if (tibetCount === 0) {
    const tbInsert = db.prepare('INSERT INTO tibet_activities (title, description, date, impact, image, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    tbInsert.run('远程教学计划', '为西藏偏远地区中学生提供在线英语和科学辅导', '2024-03-01', '覆盖50名学生，累计授课100+小时', 'https://images.unsplash.com/photo-1497486751825-1233686f5d54?w=800', 1);
    tbInsert.run('物资募集行动', '组织校内募集活动，为藏区学校捐赠书籍和文具', '2024-06-01', '募集500+本书籍和200套文具', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800', 2);
    tbInsert.run('暑期实地考察', '前往西藏实地考察教育现状，建立长期合作基地', '2024-07-15', '与当地3所学校建立长期合作关系', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800', 3);
  }

  // 插入示例社团
  const clubsCount = db.prepare('SELECT COUNT(*) as cnt FROM club_activities').get().cnt;
  if (clubsCount === 0) {
    const clInsert = db.prepare('INSERT INTO club_activities (title, role, description, status, image, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    clInsert.run('机器人社团', '核心成员 / 技术负责人', '负责机器人编程和机械设计，参加 VEX 机器人大赛', '活跃', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800', 1);
    clInsert.run('科技创新社', '联合创始人', '创建校园科技创新平台，组织黑客松和创新工作坊', '活跃', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800', 2);
    clInsert.run('社区志愿服务', '志愿者', '定期参与社区服务活动，包括环保清洁和敬老院探访', '活跃', 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800', 3);
  }

  // 插入示例轮播图（使用 unsplash 占位图）
  const carouselCount = db.prepare('SELECT COUNT(*) as cnt FROM carousel_images').get().cnt;
  if (carouselCount === 0) {
    const ciInsert = db.prepare('INSERT INTO carousel_images (section_key, image_path, caption, sort_order) VALUES (?, ?, ?, ?)');
    // 首页轮播
    ciInsert.run('home', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200', '探索学术前沿', 1);
    ciInsert.run('home', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200', '泳池中不断突破', 2);
    ciInsert.run('home', 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=1200', '跨越山海，连接西藏', 3);
    // 关于我轮播
    ciInsert.run('about', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', '个人照片', 1);
    ciInsert.run('about', 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800', '校园生活', 2);
    // 学术轮播
    ciInsert.run('academic', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800', '学术研究', 1);
    ciInsert.run('academic', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800', '获奖证书', 2);
    // 体育轮播
    ciInsert.run('sports', 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800', '游泳比赛', 1);
    ciInsert.run('sports', 'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?w=800', '训练日常', 2);
    // 西藏轮播
    ciInsert.run('tibet', 'https://images.unsplash.com/photo-1497486751825-1233686f5d54?w=800', '西藏教育', 1);
    // 社团轮播
    ciInsert.run('clubs', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800', '机器人项目', 1);
  }

  // 插入默认网站设置
  const settingsCount = db.prepare('SELECT COUNT(*) as cnt FROM site_settings').get().cnt;
  if (settingsCount === 0) {
    const stInsert = db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)');
    stInsert.run('site_name', 'Owen\'s Portfolio');
    stInsert.run('hero_title', '你好，我是 Owen');
    stInsert.run('hero_subtitle', 'YCIS IB 学生 | 科技爱好者 | 竞技游泳运动员');
    stInsert.run('hero_description', '热爱探索科技前沿，在水中挑战极限，用教育连接远方。');
    stInsert.run('footer_text', '© 2024 Owen. All rights reserved.');
    stInsert.run('contact_email', 'owen@example.com');
  }

  console.log('[初始化] 数据库初始化完成');
}

// 初始化数据库
initDatabase();

// ============ Express 应用 ============
const app = express();

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('仅支持图片文件上传'));
  }
});

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
    const items = db.prepare('SELECT * FROM news_items ORDER BY sort_order ASC, date DESC LIMIT 5').all();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取板块内容
app.get('/api/section/:key', (req, res) => {
  try {
    const section = db.prepare('SELECT * FROM sections WHERE section_key = ?').get(req.params.key);
    if (!section) return res.status(404).json({ error: '板块不存在' });
    res.json(section);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 学术项目列表
app.get('/api/academic', (req, res) => {
  try {
    const items = db.prepare('SELECT id, title, description, date, location, image, sort_order FROM academic_projects ORDER BY sort_order ASC').all();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 学术项目详情
app.get('/api/academic/:id', (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM academic_projects WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: '项目不存在' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 运动记录列表
app.get('/api/sports', (req, res) => {
  try {
    const items = db.prepare('SELECT id, competition_name, event, result, date, location, image, sort_order FROM sports_records ORDER BY sort_order ASC').all();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 运动记录详情
app.get('/api/sports/:id', (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM sports_records WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: '记录不存在' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 西藏活动列表
app.get('/api/tibet', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM tibet_activities ORDER BY sort_order ASC').all();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 社团活动列表
app.get('/api/clubs', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM club_activities ORDER BY sort_order ASC').all();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取轮播图
app.get('/api/carousel/:section_key', (req, res) => {
  try {
    const images = db.prepare('SELECT * FROM carousel_images WHERE section_key = ? ORDER BY sort_order ASC').all(req.params.section_key);
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取网站设置
app.get('/api/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT key, value FROM site_settings').all();
    const obj = {};
    settings.forEach(s => obj[s.key] = s.value);
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ 管理 API（需认证）============

// 登录
app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 上传图片
app.post('/api/admin/upload', authMiddleware, upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '未选择文件' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 管理动态
app.put('/api/admin/news', authMiddleware, (req, res) => {
  try {
    const { items } = req.body; // { items: [{ id?, title, description, date, sort_order, _action: 'add'|'update'|'delete' }] }
    if (!Array.isArray(items)) return res.status(400).json({ error: '数据格式错误' });

    const txn = db.transaction(() => {
      for (const item of items) {
        if (item._action === 'delete' && item.id) {
          db.prepare('DELETE FROM news_items WHERE id = ?').run(item.id);
        } else if (item._action === 'add') {
          db.prepare('INSERT INTO news_items (title, description, date, sort_order) VALUES (?, ?, ?, ?)').run(
            item.title, item.description || '', item.date, item.sort_order || 0
          );
        } else if (item._action === 'update' && item.id) {
          db.prepare('UPDATE news_items SET title=?, description=?, date=?, sort_order=? WHERE id=?').run(
            item.title, item.description || '', item.date, item.sort_order || 0, item.id
          );
        }
      }
    });
    txn();

    const all = db.prepare('SELECT * FROM news_items ORDER BY sort_order ASC').all();
    res.json({ success: true, data: all });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新板块内容
app.put('/api/admin/section/:key', authMiddleware, (req, res) => {
  try {
    const { title, content } = req.body;
    const key = req.params.key;

    if (typeof content === 'object') {
      db.prepare('UPDATE sections SET title=?, content=?, updated_at=CURRENT_TIMESTAMP WHERE section_key=?').run(
        title || '', JSON.stringify(content), key
      );
    } else {
      db.prepare('UPDATE sections SET title=?, content=?, updated_at=CURRENT_TIMESTAMP WHERE section_key=?').run(
        title || '', content || '{}', key
      );
    }

    const section = db.prepare('SELECT * FROM sections WHERE section_key = ?').get(key);
    res.json({ success: true, data: section });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 管理学术项目
app.put('/api/admin/academic', authMiddleware, (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: '数据格式错误' });

    const txn = db.transaction(() => {
      for (const item of items) {
        if (item._action === 'delete' && item.id) {
          db.prepare('DELETE FROM academic_projects WHERE id = ?').run(item.id);
        } else if (item._action === 'add') {
          db.prepare('INSERT INTO academic_projects (title, description, date, location, participants, details, achievements, image, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
            item.title, item.description || '', item.date || '', item.location || '', item.participants || '', item.details || '', item.achievements || '', item.image || '', item.sort_order || 0
          );
        } else if (item._action === 'update' && item.id) {
          db.prepare('UPDATE academic_projects SET title=?, description=?, date=?, location=?, participants=?, details=?, achievements=?, image=?, sort_order=? WHERE id=?').run(
            item.title, item.description || '', item.date || '', item.location || '', item.participants || '', item.details || '', item.achievements || '', item.image || '', item.sort_order || 0, item.id
          );
        }
      }
    });
    txn();

    const all = db.prepare('SELECT * FROM academic_projects ORDER BY sort_order ASC').all();
    res.json({ success: true, data: all });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 管理运动记录
app.put('/api/admin/sports', authMiddleware, (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: '数据格式错误' });

    const txn = db.transaction(() => {
      for (const item of items) {
        if (item._action === 'delete' && item.id) {
          db.prepare('DELETE FROM sports_records WHERE id = ?').run(item.id);
        } else if (item._action === 'add') {
          db.prepare('INSERT INTO sports_records (competition_name, event, result, date, location, description, progress, image, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
            item.competition_name, item.event || '', item.result || '', item.date || '', item.location || '', item.description || '', item.progress || '', item.image || '', item.sort_order || 0
          );
        } else if (item._action === 'update' && item.id) {
          db.prepare('UPDATE sports_records SET competition_name=?, event=?, result=?, date=?, location=?, description=?, progress=?, image=?, sort_order=? WHERE id=?').run(
            item.competition_name, item.event || '', item.result || '', item.date || '', item.location || '', item.description || '', item.progress || '', item.image || '', item.sort_order || 0, item.id
          );
        }
      }
    });
    txn();

    const all = db.prepare('SELECT * FROM sports_records ORDER BY sort_order ASC').all();
    res.json({ success: true, data: all });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 管理西藏活动
app.put('/api/admin/tibet', authMiddleware, (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: '数据格式错误' });

    const txn = db.transaction(() => {
      for (const item of items) {
        if (item._action === 'delete' && item.id) {
          db.prepare('DELETE FROM tibet_activities WHERE id = ?').run(item.id);
        } else if (item._action === 'add') {
          db.prepare('INSERT INTO tibet_activities (title, description, date, impact, image, sort_order) VALUES (?, ?, ?, ?, ?, ?)').run(
            item.title, item.description || '', item.date || '', item.impact || '', item.image || '', item.sort_order || 0
          );
        } else if (item._action === 'update' && item.id) {
          db.prepare('UPDATE tibet_activities SET title=?, description=?, date=?, impact=?, image=?, sort_order=? WHERE id=?').run(
            item.title, item.description || '', item.date || '', item.impact || '', item.image || '', item.sort_order || 0, item.id
          );
        }
      }
    });
    txn();

    const all = db.prepare('SELECT * FROM tibet_activities ORDER BY sort_order ASC').all();
    res.json({ success: true, data: all });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 管理社团活动
app.put('/api/admin/clubs', authMiddleware, (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: '数据格式错误' });

    const txn = db.transaction(() => {
      for (const item of items) {
        if (item._action === 'delete' && item.id) {
          db.prepare('DELETE FROM club_activities WHERE id = ?').run(item.id);
        } else if (item._action === 'add') {
          db.prepare('INSERT INTO club_activities (title, role, description, status, image, sort_order) VALUES (?, ?, ?, ?, ?, ?)').run(
            item.title, item.role || '', item.description || '', item.status || '', item.image || '', item.sort_order || 0
          );
        } else if (item._action === 'update' && item.id) {
          db.prepare('UPDATE club_activities SET title=?, role=?, description=?, status=?, image=?, sort_order=? WHERE id=?').run(
            item.title, item.role || '', item.description || '', item.status || '', item.image || '', item.sort_order || 0, item.id
          );
        }
      }
    });
    txn();

    const all = db.prepare('SELECT * FROM club_activities ORDER BY sort_order ASC').all();
    res.json({ success: true, data: all });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 管理轮播图
app.put('/api/admin/carousel/:section_key', authMiddleware, (req, res) => {
  try {
    const { items } = req.body;
    const sectionKey = req.params.section_key;
    if (!Array.isArray(items)) return res.status(400).json({ error: '数据格式错误' });

    const txn = db.transaction(() => {
      for (const item of items) {
        if (item._action === 'delete' && item.id) {
          db.prepare('DELETE FROM carousel_images WHERE id = ?').run(item.id);
        } else if (item._action === 'add') {
          db.prepare('INSERT INTO carousel_images (section_key, image_path, caption, sort_order) VALUES (?, ?, ?, ?)').run(
            sectionKey, item.image_path, item.caption || '', item.sort_order || 0
          );
        } else if (item._action === 'update' && item.id) {
          db.prepare('UPDATE carousel_images SET image_path=?, caption=?, sort_order=? WHERE id=?').run(
            item.image_path, item.caption || '', item.sort_order || 0, item.id
          );
        }
      }
    });
    txn();

    const all = db.prepare('SELECT * FROM carousel_images WHERE section_key = ? ORDER BY sort_order ASC').all(sectionKey);
    res.json({ success: true, data: all });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 管理网站设置
app.put('/api/admin/settings', authMiddleware, (req, res) => {
  try {
    const { settings } = req.body; // { settings: { key: value, ... } }
    if (!settings || typeof settings !== 'object') return res.status(400).json({ error: '数据格式错误' });

    const txn = db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        const exists = db.prepare('SELECT id FROM site_settings WHERE key = ?').get(key);
        if (exists) {
          db.prepare('UPDATE site_settings SET value = ? WHERE key = ?').run(String(value), key);
        } else {
          db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)').run(key, String(value));
        }
      }
    });
    txn();

    const all = db.prepare('SELECT key, value FROM site_settings').all();
    const obj = {};
    all.forEach(s => obj[s.key] = s.value);
    res.json({ success: true, data: obj });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SPA fallback - 所有其他路由返回 index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/admin')) {
    return res.sendFile(path.join(__dirname, 'admin', 'index.html'));
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============ 启动服务器 ============
app.listen(PORT, () => {
  console.log(`\n🚀 Owen Portfolio 服务器已启动`);
  console.log(`📍 前端: http://localhost:${PORT}`);
  console.log(`🔧 后台: http://localhost:${PORT}/admin`);
  console.log(`👤 默认账号: admin / admin123\n`);
});
