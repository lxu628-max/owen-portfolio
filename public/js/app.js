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

  content.innerHTML = `
    <div style="margin-bottom:20px;">
      <p style="color:var(--gray-700);line-height:1.7;">${esc(data.intro || '')}</p>
      <p style="color:var(--gray-600);margin-top:8px;font-size:0.9rem;">${esc(data.highlights || '')}</p>
    </div>
    <table class="sports-table">
      <thead>
        <tr>
          <th>比赛</th>
          <th>项目</th>
          <th>成绩</th>
          <th>日期</th>
        </tr>
      </thead>
      <tbody>
        ${records.map(r => `
          <tr onclick="showSportsDetail(${r.id})">
            <td>${esc(r.competition_name)}</td>
            <td>${esc(r.event)}</td>
            <td><span class="result-badge ${getResultClass(r.result)}">${esc(r.result)}</span></td>
            <td>${formatDate(r.date)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${records[0] && records[0].progress ? `
      <div class="progress-text">
        <strong>成长轨迹：</strong>${esc(records[0].progress)}
      </div>
    ` : ''}
  `;
}

function getResultClass(result) {
  if (!result) return '';
  if (result.includes('金')) return 'result-gold';
  if (result.includes('银')) return 'result-silver';
  if (result.includes('铜')) return 'result-bronze';
  return '';
}

async function showSportsDetail(id) {
  try {
    const res = await fetch(`/api/sports/${id}`);
    const item = await res.json();

    const detailContent = document.getElementById('sportsDetailContent');
    detailContent.innerHTML = `
      <h2>${esc(item.competition_name)}</h2>
      <div class="detail-meta">
        <span>📅 ${formatDate(item.date)}</span>
        <span>📍 ${esc(item.location)}</span>
        <span>🏊 ${esc(item.event)}</span>
        <span class="result-badge ${getResultClass(item.result)}">${esc(item.result)}</span>
      </div>
      ${item.image ? `<img src="${item.image}" alt="" style="width:100%;border-radius:var(--radius-md);margin-bottom:20px;max-height:300px;object-fit:cover;">` : ''}
      <div class="detail-section">
        <h4>比赛描述</h4>
        <p>${esc(item.description)}</p>
      </div>
      ${item.progress ? `
        <div class="detail-section">
          <h4>成长轨迹</h4>
          <p>${esc(item.progress)}</p>
        </div>
      ` : ''}
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
    <h3 style="font-size:1.1rem;color:var(--primary);margin-bottom:12px;">学术项目</h3>
    ${projects.map(p => `
      <div class="academic-card" onclick="showAcademicDetail(${p.id})">
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.description)}</p>
        <div class="card-meta">
          <span>📅 ${formatDate(p.date)}</span>
          <span>📍 ${esc(p.location)}</span>
        </div>
      </div>
    `).join('')}
  `;
}

async function showAcademicDetail(id) {
  try {
    const res = await fetch(`/api/academic/${id}`);
    const item = await res.json();

    const detailContent = document.getElementById('academicDetailContent');
    detailContent.innerHTML = `
      <h2>${esc(item.title)}</h2>
      <div class="detail-meta">
        <span>📅 ${formatDate(item.date)}</span>
        <span>📍 ${esc(item.location)}</span>
        <span>👥 ${esc(item.participants)}</span>
      </div>
      ${item.image ? `<img src="${item.image}" alt="" style="width:100%;border-radius:var(--radius-md);margin-bottom:20px;max-height:300px;object-fit:cover;">` : ''}
      <div class="detail-section">
        <h4>项目描述</h4>
        <p>${esc(item.description)}</p>
      </div>
      ${item.details ? `
        <div class="detail-section">
          <h4>详细内容</h4>
          <p>${esc(item.details)}</p>
        </div>
      ` : ''}
      ${item.achievements ? `
        <div class="detail-section">
          <h4>成果</h4>
          <p>${esc(item.achievements)}</p>
        </div>
      ` : ''}
    `;

    document.getElementById('academicDetail').classList.add('show');
  } catch (err) {
    console.error('加载详情失败:', err);
  }
}

// ============ 西藏 ============
async function loadTibet() {
  try {
    const [activitiesRes, sectionRes] = await Promise.all([
      fetch('/api/tibet'),
      fetch('/api/section/tibet')
    ]);
    const activities = await activitiesRes.json();
    const section = await sectionRes.json();

    renderTibet(activities, section);
    await loadCarousel('tibetCarousel', 'tibet');
  } catch (err) {
    console.error('加载西藏数据失败:', err);
  }
}

function renderTibet(activities, section) {
  const intro = document.getElementById('tibetIntro');
  const timeline = document.getElementById('tibetTimeline');
  if (!intro || !timeline) return;

  let data;
  try {
    data = typeof section.content === 'string' ? JSON.parse(section.content) : section.content;
  } catch { data = {}; }

  intro.innerHTML = `
    <h2>${esc(section.title || '西藏项目')}</h2>
    <p>${esc(data.intro || '')}</p>
    <p style="margin-top:8px;">${esc(data.mission || '')}</p>
  `;

  timeline.innerHTML = activities.map(a => `
    <div class="timeline-item">
      <div class="timeline-date">${formatDate(a.date)}</div>
      <h3>${esc(a.title)}</h3>
      <p>${esc(a.description)}</p>
      <div class="timeline-impact">📊 ${esc(a.impact)}</div>
    </div>
  `).join('');
}

// ============ 社团 ============
async function loadClubs() {
  try {
    const [clubsRes, sectionRes] = await Promise.all([
      fetch('/api/clubs'),
      fetch('/api/section/clubs')
    ]);
    const clubs = await clubsRes.json();
    const section = await sectionRes.json();

    renderClubs(clubs, section);
    await loadCarousel('clubsCarousel', 'clubs');
  } catch (err) {
    console.error('加载社团数据失败:', err);
  }
}

function renderClubs(clubs, section) {
  const content = document.getElementById('clubsContent');
  if (!content) return;

  let data;
  try {
    data = typeof section.content === 'string' ? JSON.parse(section.content) : section.content;
  } catch { data = {}; }

  content.innerHTML = `
    <div style="margin-bottom:20px;">
      <p style="color:var(--gray-700);line-height:1.7;">${esc(data.intro || '')}</p>
      <p style="color:var(--gray-600);margin-top:8px;font-size:0.9rem;">${esc(data.highlights || '')}</p>
    </div>
    ${clubs.map(c => `
      <div class="club-card">
        <h3>${esc(c.title)}</h3>
        <div class="club-role">${esc(c.role)}</div>
        <p>${esc(c.description)}</p>
        <span class="club-status ${c.status === '活跃' ? 'status-active' : 'status-inactive'}">${esc(c.status)}</span>
      </div>
    `).join('')}
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
