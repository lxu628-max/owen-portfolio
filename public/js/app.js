/**
 * Owen Portfolio - Frontend App
 * SPA 路由 + 数据加载 + 轮播图
 */

// ============ 全局状态 ============
let currentSection = 'home';
let settings = {};

// ============ 初始化 ============
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  initNavigation();
  initMobileNav();
  await loadHome();
});

// ============ 加载网站设置 ============
async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    settings = await res.json();
    // 更新页脚
    const footer = document.getElementById('footerText');
    if (footer && settings.footer_text) {
      footer.textContent = settings.footer_text;
    }
    // 更新联系邮箱
    const contactEmail = document.getElementById('contactEmail');
    if (contactEmail && settings.contact_email) {
      contactEmail.innerHTML = `📧 <a href="mailto:${settings.contact_email}" style="color:inherit;text-decoration:underline;">${settings.contact_email}</a>`;
    }
    // 更新网站名称（导航栏logo和浏览器标题）
    const navLogo = document.querySelector('.nav-logo');
    if (navLogo && settings.site_name) {
      navLogo.textContent = settings.site_name;
      document.title = `${settings.site_name} - Portfolio`;
    }
    // 更新首页 hero
    const heroTitle = document.querySelector('#heroText h1');
    const heroSub = document.querySelector('.hero-subtitle');
    const heroDesc = document.querySelector('.hero-desc');
    if (heroTitle && settings.hero_title) heroTitle.textContent = settings.hero_title;
    if (heroSub && settings.hero_subtitle) heroSub.textContent = settings.hero_subtitle;
    if (heroDesc && settings.hero_description) heroDesc.textContent = settings.hero_description;
  } catch (err) {
    console.error('加载设置失败:', err);
  }
}

// ============ 导航 ============
function initNavigation() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      switchSection(section);
    });
  });
  document.querySelector('.nav-logo').addEventListener('click', (e) => {
    e.preventDefault();
    switchSection('home');
  });
}

function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links = document.querySelector('.nav-links');
  toggle.addEventListener('click', () => {
    links.classList.toggle('show');
  });
}

async function switchSection(section) {
  currentSection = section;

  // 更新导航高亮
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.nav-link[data-section="${section}"]`);
  if (activeLink) activeLink.classList.add('active');

  // 切换页面
  document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(`page-${section}`);
  if (page) page.classList.add('active');

  // 关闭移动导航
  document.querySelector('.nav-links').classList.remove('show');

  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 加载板块数据
  switch (section) {
    case 'home': await loadHome(); break;
    case 'about': await loadAbout(); break;
    case 'sports': await loadSports(); break;
    case 'academic': await loadAcademic(); break;
    case 'tibet': await loadTibet(); break;
    case 'clubs': await loadClubs(); break;
  }
}

// ============ 首页 ============
async function loadHome() {
  // 加载新闻
  try {
    const res = await fetch('/api/news');
    const news = await res.json();
    renderNews(news);
  } catch (err) {
    console.error('加载新闻失败:', err);
  }
  // 加载轮播图
  await loadCarousel('homeCarousel', 'home');
}

function renderNews(news) {
  const list = document.getElementById('newsList');
  if (!list) return;
  list.innerHTML = news.map(item => `
    <div class="news-item">
      <div class="news-item-title">${esc(item.title)}</div>
      <div class="news-item-desc">${esc(item.description)}</div>
      <div class="news-item-date">${formatDate(item.date)}</div>
    </div>
  `).join('');
}

// ============ 关于我 ============
async function loadAbout() {
  try {
    const [sectionRes, carouselLoaded] = await Promise.all([
      fetch('/api/section/about'),
      loadCarousel('aboutCarousel', 'about')
    ]);
    const section = await sectionRes.json();
    renderAbout(section);
  } catch (err) {
    console.error('加载关于我失败:', err);
  }
}

function renderAbout(section) {
  const content = document.getElementById('aboutContent');
  if (!content) return;

  let data;
  try {
    data = typeof section.content === 'string' ? JSON.parse(section.content) : section.content;
  } catch { data = {}; }

  const fields = [
    { key: 'background', label: '个人背景' },
    { key: 'goals', label: '申请目标' },
    { key: 'majors', label: '专业方向' },
    { key: 'leadership', label: '学生领导参与' },
    { key: 'traits', label: '个人特质' }
  ];

  content.innerHTML = fields.map(f => `
    <div class="about-card">
      <h3>${f.label}</h3>
      <p>${esc(data[f.key] || '暂无内容')}</p>
    </div>
  `).join('');
}

// ============ 体育 ============
async function loadSports() {
  try {
    const [recordsRes, sectionRes] = await Promise.all([
      fetch('/api/sports'),
      fetch('/api/section/sports')
    ]);
    const records = await recordsRes.json();
    const section = await sectionRes.json();

    renderSports(records, section);
    await loadCarousel('sportsCarousel', 'sports');
  } catch (err) {
    console.error('加载体育数据失败:', err);
  }
}

function renderSports(records, section) {
  const content = document.getElementById('sportsContent');
  if (!content) return;

  let data;
  try {
    data = typeof section.content === 'string' ? JSON.parse(section.content) : section.content;
  } catch { data = {}; }

  // 右侧第一块：简短介绍（固定富文本）
  const introHtml = (data.intro || '') ? `
    <div class="sports-block">
      <h3>简短介绍</h3>
      <p class="rich-text">${esc(data.intro)}</p>
    </div>` : '';

  // 右侧第二块：竞赛名称列表（仅展示名称，点击跳转子页面）
  const listHtml = records.length ? `
    <div class="sports-block">
      <h3>竞赛记录</h3>
      <ul class="sports-name-list">
        ${records.map(r => `
          <li class="sports-name-item" onclick="showSportsDetail(${r.id})">
            <span>${esc(r.competition_name)}</span>
            <span class="arrow">›</span>
          </li>`).join('')}
      </ul>
    </div>` : `<div class="sports-block"><h3>竞赛记录</h3><p class="empty-tip">暂无竞赛，可在后台「体育竞技」添加</p></div>`;

  // 右侧第三/四块：成长轨迹（固定富文本）
  const growthHtml = (data.growth_track || '') ? `
    <div class="sports-block">
      <h3>成长轨迹</h3>
      <p class="rich-text">${esc(data.growth_track)}</p>
    </div>` : '';

  content.innerHTML = `${introHtml}${listHtml}${growthHtml}`;
}

async function showSportsDetail(id) {
  try {
    const res = await fetch(`/api/sports/${id}`);
    const item = await res.json();

    const detailContent = document.getElementById('sportsDetailContent');
    detailContent.innerHTML = `
      <h2>${esc(item.competition_name)}</h2>
      ${item.image ? `<img src="${item.image}" alt="" class="detail-hero">` : ''}
      <table class="detail-table">
        <tbody>
          <tr><th>竞赛名称</th><td>${esc(item.competition_name)}</td></tr>
          <tr><th>日期与地点</th><td>${esc(item.competition_date_location)}</td></tr>
          <tr><th>比赛成绩</th><td class="rich-text">${esc(item.performance_results)}</td></tr>
          <tr><th>技术进步与复盘</th><td class="rich-text">${esc(item.technical_progress)}</td></tr>
        </tbody>
      </table>
    `;

    document.getElementById('sportsDetail').classList.add('show');
  } catch (err) {
    console.error('加载详情失败:', err);
  }
}

// ============ 学术 ============
async function loadAcademic() {
  try {
    const [projectsRes, sectionRes] = await Promise.all([
      fetch('/api/academic'),
      fetch('/api/section/academic')
    ]);
    const projects = await projectsRes.json();
    const section = await sectionRes.json();

    renderAcademic(projects, section);
    await loadCarousel('academicCarousel', 'academic');
  } catch (err) {
    console.error('加载学术数据失败:', err);
  }
}

function renderAcademic(projects, section) {
  const content = document.getElementById('academicContent');
  if (!content) return;

  let data;
  try {
    data = typeof section.content === 'string' ? JSON.parse(section.content) : section.content;
  } catch { data = {}; }

    content.innerHTML = `
    <div style="margin-bottom:20px;">
      <p style="color:var(--gray-700);line-height:1.7;">${esc(data.intro || '')}</p>
      <p style="color:var(--gray-600);margin-top:8px;font-size:0.9rem;">${esc(data.courses || '')}</p>
    </div>
    <h3 style="font-size:1.1rem;color:var(--primary);margin-bottom:12px;">学术成果</h3>
    ${projects.length ? projects.map(p => `
      <div class="academic-card" onclick="showAcademicDetail(${p.id})">
        <h3>${esc(p.competition_name)}</h3>
        <p>${esc(p.intro)}</p>
      </div>
    `).join('') : '<p class="empty-tip">暂无学术成果，可在后台「学术成果」添加子页面</p>'}
  `;
}

async function showAcademicDetail(id) {
  try {
    const res = await fetch(`/api/academic/${id}`);
    const item = await res.json();

    const detailContent = document.getElementById('academicDetailContent');
    detailContent.innerHTML = `
      <h2>${esc(item.competition_name)}</h2>
      ${item.image ? `<img src="${item.image}" alt="" class="detail-hero">` : ''}
      <table class="detail-table">
        <tbody>
          <tr><th>比赛名称</th><td>${esc(item.competition_name)}</td></tr>
          <tr><th>比赛介绍</th><td class="rich-text">${esc(item.intro)}</td></tr>
          <tr><th>个人参赛与成果</th><td class="rich-text">${esc(item.achievement)}</td></tr>
          <tr><th>参赛感悟</th><td class="rich-text">${esc(item.reflection)}</td></tr>
        </tbody>
      </table>
    `;

    document.getElementById('academicDetail').classList.add('show');
  } catch (err) {
    console.error('加载详情失败:', err);
  }
}

// ============ 西藏 ============
async function loadTibet() {
  try {
    const sectionRes = await fetch('/api/section/tibet');
    const section = await sectionRes.json();

    renderTibet(section);
    await loadCarousel('tibetCarousel', 'tibet');
  } catch (err) {
    console.error('加载西藏数据失败:', err);
  }
}

function renderTibet(section) {
  const intro = document.getElementById('tibetIntro');
  if (!intro) return;

  let data;
  try {
    data = typeof section.content === 'string' ? JSON.parse(section.content) : section.content;
  } catch { data = {}; }

  intro.innerHTML = `
    <h2>${esc(section.title || '西藏纪实')}</h2>
    <p>${esc(data.intro || '')}</p>
    ${data.mission ? `<p style="margin-top:8px;">${esc(data.mission)}</p>` : ''}
  `;
}

async function showTibetDetail(id) {
  try {
    const res = await fetch('/api/tibet/' + id);
    const item = await res.json();
    const content = document.getElementById('tibetDetailContent');
    content.innerHTML = `
      <h2>${esc(item.title)}</h2>
      <div class="detail-meta">
        <span>${formatDate(item.date)}</span>
      </div>
      ${item.image ? '<img src="' + item.image + '" alt="" style="width:100%;border-radius:var(--radius-md);margin-bottom:20px;max-height:300px;object-fit:cover;">' : ''}
      <div class="detail-section">
        <h4>活动描述</h4>
        <p>${esc(item.description)}</p>
      </div>
      ${item.impact ? '<div class="detail-section"><h4>影响与成果</h4><p>' + esc(item.impact) + '</p></div>' : ''}
    `;
    document.getElementById('tibetDetail').classList.add('show');
  } catch (err) {
    console.error('加载西藏详情失败:', err);
  }
}

async function showClubsDetail(id) {
  try {
    const res = await fetch('/api/clubs/' + id);
    const item = await res.json();
    const content = document.getElementById('clubsDetailContent');
    content.innerHTML = `
      <h2>${esc(item.title)}</h2>
      <div class="detail-meta">
        <span>${esc(item.role)}</span>
        <span class="club-status ${item.status === '活跃' ? 'status-active' : 'status-inactive'}">${esc(item.status)}</span>
      </div>
      ${item.image ? '<img src="' + item.image + '" alt="" style="width:100%;border-radius:var(--radius-md);margin-bottom:20px;max-height:300px;object-fit:cover;">' : ''}
      <div class="detail-section">
        <h4>社团描述</h4>
        <p>${esc(item.description)}</p>
      </div>
    `;
    document.getElementById('clubsDetail').classList.add('show');
  } catch (err) {
    console.error('加载社团详情失败:', err);
  }
}

// ============ 社团 ============
async function loadClubs() {
  try {
    const sectionRes = await fetch('/api/section/clubs');
    const section = await sectionRes.json();

    renderClubs(section);
    await loadCarousel('clubsCarousel', 'clubs');
  } catch (err) {
    console.error('加载社团数据失败:', err);
  }
}

function renderClubs(section) {
  const content = document.getElementById('clubsContent');
  if (!content) return;

  let data;
  try {
    data = typeof section.content === 'string' ? JSON.parse(section.content) : section.content;
  } catch { data = {}; }

  content.innerHTML = `
    <p style="color:var(--gray-700);line-height:1.7;">${esc(data.intro || '')}</p>
    ${data.highlights ? `<p style="color:var(--gray-600);margin-top:8px;font-size:0.9rem;">${esc(data.highlights)}</p>` : ''}
  `;
}

// ============ 轮播图组件 ============
async function loadCarousel(containerId, sectionKey) {
  try {
    const res = await fetch(`/api/carousel/${sectionKey}`);
    const images = await res.json();
    initCarousel(containerId, images);
  } catch (err) {
    console.error(`加载轮播图失败 (${sectionKey}):`, err);
  }
}

function initCarousel(containerId, images) {
  const container = document.getElementById(containerId);
  if (!container || images.length === 0) return;

  const track = container.querySelector('.carousel-track');
  const dotsContainer = container.querySelector('.carousel-dots');

  track.innerHTML = images.map(img => `
    <img src="${img.image_path}" alt="${esc(img.caption || '')}">
  `).join('');

  dotsContainer.innerHTML = images.map((_, i) => `
    <button class="carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></button>
  `).join('');

  let currentIndex = 0;
  const total = images.length;

  function goTo(index) {
    currentIndex = (index + total) % total;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  container.querySelector('.carousel-prev').onclick = () => goTo(currentIndex - 1);
  container.querySelector('.carousel-next').onclick = () => goTo(currentIndex + 1);

  dotsContainer.querySelectorAll('.carousel-dot').forEach(dot => {
    dot.onclick = () => goTo(parseInt(dot.dataset.index));
  });

  // 自动播放
  const interval = setInterval(() => goTo(currentIndex + 1), 5000);

  // 鼠标悬停暂停
  container.addEventListener('mouseenter', () => clearInterval(interval));
  container.addEventListener('mouseleave', () => {
    clearInterval(interval);
    const autoInterval = setInterval(() => goTo(currentIndex + 1), 5000);
    container._autoInterval = autoInterval;
  });
}

// ============ 详情弹窗关闭 ============
document.getElementById('sportsDetailClose')?.addEventListener('click', () => {
  document.getElementById('sportsDetail').classList.remove('show');
});
document.getElementById('academicDetailClose')?.addEventListener('click', () => {
  document.getElementById('academicDetail').classList.remove('show');
});

// 点击背景关闭
document.getElementById('sportsDetail')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove('show');
});
document.getElementById('academicDetail')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove('show');
});

document.getElementById('tibetDetailClose')?.addEventListener('click', () => {
  document.getElementById('tibetDetail').classList.remove('show');
});
document.getElementById('clubsDetailClose')?.addEventListener('click', () => {
  document.getElementById('clubsDetail').classList.remove('show');
});
document.getElementById('tibetDetail')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove('show');
});
document.getElementById('clubsDetail')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove('show');
});

// ============ 工具函数 ============
function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}
