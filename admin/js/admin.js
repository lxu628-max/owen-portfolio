/**
 * Owen Portfolio - Admin Dashboard
 * 后台管理逻辑
 */

// ============ 全局状态 ============
let token = localStorage.getItem('admin_token');
let currentPanel = 'news';
let uploadCallback = null; // 上传完成后的回调

// 各板块数据缓存
let newsData = [];
let academicData = [];
let sportsData = [];
let tibetData = [];
let clubsData = [];
let carouselData = [];

// ============ 初始化 ============
document.addEventListener('DOMContentLoaded', () => {
  if (!token) {
    window.location.href = '/admin/';
    return;
  }

  // 检查 token 有效性
  document.getElementById('adminUser').textContent = localStorage.getItem('admin_username') || 'Admin';

  // 退出登录
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    window.location.href = '/admin/';
  });

  // 侧边栏导航
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchPanel(link.dataset.panel);
    });
  });

  // 表单提交
  document.getElementById('aboutForm').addEventListener('submit', saveAbout);
  document.getElementById('settingsForm').addEventListener('submit', saveSettings);
  // 西藏 / 社团：关闭子页面新增，仅保留富文本 + 轮播（表单提交）
  if (document.getElementById('tibetForm')) document.getElementById('tibetForm').addEventListener('submit', saveTibet);
  if (document.getElementById('clubsForm')) document.getElementById('clubsForm').addEventListener('submit', saveClubs);
  // 体育主页面固定富文本
  if (document.getElementById('sportsMainForm')) document.getElementById('sportsMainForm').addEventListener('submit', saveSportsMain);

  // 初始化上传区域
  initUpload();

  // 加载当前面板数据
  loadPanelData('news');
});

// ============ API 请求封装 ============
async function api(url, options = {}) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/';
      return null;
    }
    return await res.json();
  } catch (err) {
    showToast('网络错误', 'error');
    return null;
  }
}

// ============ 面板切换 ============
function switchPanel(panel) {
  currentPanel = panel;

  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  const active = document.querySelector(`.sidebar-link[data-panel="${panel}"]`);
  if (active) active.classList.add('active');

  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  const panelEl = document.getElementById(`panel-${panel}`);
  if (panelEl) panelEl.classList.add('active');

  loadPanelData(panel);
}

async function loadPanelData(panel) {
  switch (panel) {
    case 'news': await loadNewsPanel(); break;
    case 'about': await loadAboutPanel(); break;
    case 'academic': await loadAcademicPanel(); break;
    case 'sports': await loadSportsPanel(); break;
    case 'tibet': await loadTibetPanel(); break;
    case 'clubs': await loadClubsPanel(); break;
    case 'stats': await loadStatsPanel(); break;
    case 'carousel': await loadCarouselPanel(); break;
    case 'settings': await loadSettingsPanel(); break;
  }
}

// ============ 首页动态 ============
async function loadNewsPanel() {
  const res = await fetch('/api/news');
  newsData = await res.json();
  renderNewsList();
}

function renderNewsList() {
  const list = document.getElementById('newsList');
  if (newsData.length === 0) {
    list.innerHTML = '<p style="color:var(--gray-500);text-align:center;padding:20px;">暂无动态条目，点击"添加动态"开始</p>';
    return;
  }
  list.innerHTML = newsData.map((item, index) => `
    <div class="list-item" data-index="${index}">
      <div class="list-item-header">
        <h4>${esc(item.title) || '新动态'}</h4>
        <div class="list-item-actions">
          <button class="btn btn-xs btn-outline" onclick="moveItem('news', ${index}, -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn btn-xs btn-outline" onclick="moveItem('news', ${index}, 1)" ${index === newsData.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn btn-xs btn-danger" onclick="deleteItem('news', ${index})">删除</button>
        </div>
      </div>
      <div class="form-group">
        <label>标题</label>
        <input type="text" value="${esc(item.title)}" onchange="newsData[${index}].title=this.value">
      </div>
      <div class="form-group">
        <label>描述</label>
        <textarea rows="2" onchange="newsData[${index}].description=this.value">${esc(item.description)}</textarea>
      </div>
      <div class="form-group">
        <label>日期</label>
        <input type="date" value="${item.date || ''}" onchange="newsData[${index}].date=this.value">
      </div>
    </div>
  `).join('');
}

function addNewsItem() {
  newsData.push({ title: '', description: '', date: new Date().toISOString().split('T')[0], _action: 'add', sort_order: newsData.length + 1 });
  renderNewsList();
}

function deleteItem(type, index) {
  if (!confirm('确认删除此条目？')) return;
  const dataMap = { news: newsData, academic: academicData, sports: sportsData, tibet: tibetData, clubs: clubsData, carousel: carouselData };
  const data = dataMap[type];
  if (data[index].id) {
    data[index]._action = 'delete';
    data[index]._deleted = true;
  }
  data.splice(index, 1);
  const renderMap = { news: renderNewsList, academic: renderAcademicList, sports: renderSportsList, tibet: renderTibetList, clubs: renderClubsList, carousel: renderCarouselList };
  renderMap[type]();
}

function moveItem(type, index, dir) {
  const dataMap = { news: newsData, academic: academicData, sports: sportsData, tibet: tibetData, clubs: clubsData, carousel: carouselData };
  const data = dataMap[type];
  const newIndex = index + dir;
  if (newIndex < 0 || newIndex >= data.length) return;
  [data[index], data[newIndex]] = [data[newIndex], data[index]];
  const renderMap = { news: renderNewsList, academic: renderAcademicList, sports: renderSportsList, tibet: renderTibetList, clubs: renderClubsList, carousel: renderCarouselList };
  renderMap[type]();
}

async function saveNews() {
  const items = newsData
    .filter(d => !d._deleted)
    .map((d, i) => ({
      ...d,
      sort_order: i + 1,
      _action: d._action || (d.id ? 'update' : 'add')
    }));

  const res = await api('/api/admin/news', { method: 'PUT', body: { items } });
  if (res && res.success) {
    newsData = res.data;
    renderNewsList();
    showToast('动态已保存');
  }
}

// ============ 关于我 ============
async function loadAboutPanel() {
  const res = await fetch('/api/section/about');
  const section = await res.json();
  let data;
  try { data = typeof section.content === 'string' ? JSON.parse(section.content) : section.content; }
  catch { data = {}; }

  document.querySelectorAll('#aboutForm [data-field]').forEach(el => {
    el.value = data[el.dataset.field] || '';
  });
}

async function saveAbout(e) {
  e.preventDefault();
  const content = {};
  document.querySelectorAll('#aboutForm [data-field]').forEach(el => {
    content[el.dataset.field] = el.value;
  });

  const res = await api('/api/admin/section/about', { method: 'PUT', body: { title: '关于我', content } });
  if (res && res.success) {
    showToast('关于我内容已保存');
  }
}

// ============ 学术 ============
async function loadAcademicPanel() {
  const res = await fetch('/api/academic');
  // 需要获取完整数据（含details等）
  const detailPromises = res.map(item => fetch(`/api/academic/${item.id}`).then(r => r.json()));
  academicData = await Promise.all(detailPromises);
  renderAcademicList();
}

function renderAcademicList() {
  const list = document.getElementById('academicList');
  if (academicData.length === 0) {
    list.innerHTML = '<p style="color:var(--gray-500);text-align:center;padding:20px;">暂无学术项目</p>';
    return;
  }
  list.innerHTML = academicData.map((item, index) => `
    <div class="list-item" data-index="${index}">
      <div class="list-item-header">
        <h4>${esc(item.competition_name) || '新项目'}</h4>
        <div class="list-item-actions">
          <button class="btn btn-xs btn-outline" onclick="moveItem('academic', ${index}, -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn btn-xs btn-outline" onclick="moveItem('academic', ${index}, 1)" ${index === academicData.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn btn-xs btn-danger" onclick="deleteItem('academic', ${index})">删除</button>
        </div>
      </div>
      <div class="form-group">
        <label>比赛名称 *</label>
        <input type="text" value="${esc(item.competition_name)}" onchange="academicData[${index}].competition_name=this.value" placeholder="如：2024 国际数学建模挑战赛">
      </div>
      <div class="form-group">
        <label>比赛介绍 *</label>
        <textarea rows="3" onchange="academicData[${index}].intro=this.value" placeholder="赛事背景、参赛规模等">${esc(item.intro)}</textarea>
      </div>
      <div class="form-group">
        <label>个人参赛与成果 *</label>
        <textarea rows="3" onchange="academicData[${index}].achievement=this.value" placeholder="担任角色、具体产出、获奖情况">${esc(item.achievement)}</textarea>
      </div>
      <div class="form-group">
        <label>参赛感悟 *</label>
        <textarea rows="3" onchange="academicData[${index}].reflection=this.value" placeholder="收获与成长">${esc(item.reflection)}</textarea>
      </div>
      <div class="form-group">
        <label>图片</label>
        <div style="display:flex;align-items:center;gap:10px;">
          <input type="text" value="${esc(item.image)}" onchange="academicData[${index}].image=this.value" style="flex:1" placeholder="图片URL或路径">
          <button class="btn btn-xs btn-primary" onclick="openUpload(url => { academicData[${index}].image=url; academicData[${index}]._imgEl=this.parentElement.querySelector('.thumb-preview'); if(academicData[${index}]._imgEl){academicData[${index}]._imgEl.src=url} })">上传</button>
        </div>
        ${item.image ? `<img src="${item.image}" class="thumb-preview" alt="">` : ''}
      </div>
    </div>
  `).join('');
}

function addAcademicItem() {
  academicData.push({ competition_name: '', intro: '', achievement: '', reflection: '', image: '', _action: 'add', sort_order: academicData.length + 1 });
  renderAcademicList();
}

async function saveAcademic() {
  const items = academicData.map((d, i) => ({
    ...d,
    sort_order: i + 1,
    _action: d._action || (d.id ? 'update' : 'add')
  }));

  const res = await api('/api/admin/academic', { method: 'PUT', body: { items } });
  if (res && res.success) {
    academicData = res.data;
    renderAcademicList();
    showToast('学术项目已保存');
  }
}

// ============ 体育 ============
async function loadSportsPanel() {
  const res = await fetch('/api/sports');
  const detailPromises = res.map(item => fetch(`/api/sports/${item.id}`).then(r => r.json()));
  sportsData = await Promise.all(detailPromises);
  renderSportsList();
  // 主页面固定富文本（简短介绍 / 成长轨迹）
  try {
    const sres = await fetch('/api/section/sports');
    const section = await sres.json();
    let data;
    try { data = typeof section.content === 'string' ? JSON.parse(section.content) : section.content; } catch { data = {}; }
    document.querySelectorAll('#sportsMainForm [data-field]').forEach(el => { el.value = data[el.dataset.field] || ''; });
  } catch (e) { /* ignore */ }
}

async function saveSportsMain(e) {
  e.preventDefault();
  const content = {};
  document.querySelectorAll('#sportsMainForm [data-field]').forEach(el => { content[el.dataset.field] = el.value; });
  const res = await api('/api/admin/section/sports', { method: 'PUT', body: { title: '体育竞技', content } });
  if (res && res.success) showToast('体育主页面内容已保存');
}

function renderSportsList() {
  const list = document.getElementById('sportsList');
  if (sportsData.length === 0) {
    list.innerHTML = '<p style="color:var(--gray-500);text-align:center;padding:20px;">暂无运动记录</p>';
    return;
  }
  list.innerHTML = sportsData.map((item, index) => `
    <div class="list-item" data-index="${index}">
      <div class="list-item-header">
        <h4>${esc(item.competition_name) || '新竞赛'}</h4>
        <div class="list-item-actions">
          <button class="btn btn-xs btn-outline" onclick="moveItem('sports', ${index}, -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn btn-xs btn-outline" onclick="moveItem('sports', ${index}, 1)" ${index === sportsData.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn btn-xs btn-danger" onclick="deleteItem('sports', ${index})">删除</button>
        </div>
      </div>
      <div class="form-group">
        <label>竞赛名称 *</label>
        <input type="text" value="${esc(item.competition_name)}" onchange="sportsData[${index}].competition_name=this.value" placeholder="如：2024 上海市中小学生游泳锦标赛">
      </div>
      <div class="form-group">
        <label>日期与地点 *</label>
        <input type="text" value="${esc(item.competition_date_location)}" onchange="sportsData[${index}].competition_date_location=this.value" placeholder="如：2024-08-15 上海东方体育中心">
      </div>
      <div class="form-group">
        <label>比赛成绩（富文本）*</label>
        <textarea rows="3" onchange="sportsData[${index}].performance_results=this.value" placeholder="成绩、获奖情况等核心数据">${esc(item.performance_results)}</textarea>
      </div>
      <div class="form-group">
        <label>技术进步与复盘（富文本）*</label>
        <textarea rows="3" onchange="sportsData[${index}].technical_progress=this.value" placeholder="技术总结、不足改进、成长复盘">${esc(item.technical_progress)}</textarea>
      </div>
      <div class="form-group">
        <label>图片</label>
        <div style="display:flex;align-items:center;gap:10px;">
          <input type="text" value="${esc(item.image)}" onchange="sportsData[${index}].image=this.value" style="flex:1">
          <button class="btn btn-xs btn-primary" onclick="openUpload(url => { sportsData[${index}].image=url })">上传</button>
        </div>
        ${item.image ? `<img src="${item.image}" class="thumb-preview" alt="">` : ''}
      </div>
    </div>
  `).join('');
}

function addSportsItem() {
  sportsData.push({ competition_name: '', competition_date_location: '', performance_results: '', technical_progress: '', image: '', _action: 'add', sort_order: sportsData.length + 1 });
  renderSportsList();
}

async function saveSports() {
  const items = sportsData.map((d, i) => ({
    ...d,
    sort_order: i + 1,
    _action: d._action || (d.id ? 'update' : 'add')
  }));

  const res = await api('/api/admin/sports', { method: 'PUT', body: { items } });
  if (res && res.success) {
    sportsData = res.data;
    renderSportsList();
    showToast('运动记录已保存');
  }
}

// ============ 西藏（关闭子页面新增，仅富文本 + 轮播） ============
async function loadTibetPanel() {
  const res = await fetch('/api/section/tibet');
  const section = await res.json();
  let data;
  try { data = typeof section.content === 'string' ? JSON.parse(section.content) : section.content; } catch { data = {}; }
  document.querySelectorAll('#tibetForm [data-field]').forEach(el => { el.value = data[el.dataset.field] || ''; });
}

function renderTibetList() {
  const list = document.getElementById('tibetList');
  if (tibetData.length === 0) {
    list.innerHTML = '<p style="color:var(--gray-500);text-align:center;padding:20px;">暂无西藏活动</p>';
    return;
  }
  list.innerHTML = tibetData.map((item, index) => `
    <div class="list-item" data-index="${index}">
      <div class="list-item-header">
        <h4>${esc(item.title) || '新活动'}</h4>
        <div class="list-item-actions">
          <button class="btn btn-xs btn-outline" onclick="moveItem('tibet', ${index}, -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn btn-xs btn-outline" onclick="moveItem('tibet', ${index}, 1)" ${index === tibetData.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn btn-xs btn-danger" onclick="deleteItem('tibet', ${index})">删除</button>
        </div>
      </div>
      <div class="form-group">
        <label>标题</label>
        <input type="text" value="${esc(item.title)}" onchange="tibetData[${index}].title=this.value">
      </div>
      <div class="form-group">
        <label>描述</label>
        <textarea rows="2" onchange="tibetData[${index}].description=this.value">${esc(item.description)}</textarea>
      </div>
      <div class="form-group">
        <label>日期</label>
        <input type="date" value="${item.date || ''}" onchange="tibetData[${index}].date=this.value">
      </div>
      <div class="form-group">
        <label>影响/成果</label>
        <textarea rows="2" onchange="tibetData[${index}].impact=this.value">${esc(item.impact)}</textarea>
      </div>
      <div class="form-group">
        <label>图片</label>
        <div style="display:flex;align-items:center;gap:10px;">
          <input type="text" value="${esc(item.image)}" onchange="tibetData[${index}].image=this.value" style="flex:1">
          <button class="btn btn-xs btn-primary" onclick="openUpload(url => { tibetData[${index}].image=url })">上传</button>
        </div>
        ${item.image ? `<img src="${item.image}" class="thumb-preview" alt="">` : ''}
      </div>
    </div>
  `).join('');
}

function addTibetItem() {
  tibetData.push({ title: '', description: '', date: '', impact: '', image: '', _action: 'add', sort_order: tibetData.length + 1 });
  renderTibetList();
}

async function saveTibet(e) {
  e.preventDefault();
  const content = {};
  document.querySelectorAll('#tibetForm [data-field]').forEach(el => { content[el.dataset.field] = el.value; });
  const res = await api('/api/admin/section/tibet', { method: 'PUT', body: { title: '西藏纪实', content } });
  if (res && res.success) showToast('西藏内容已保存');
}

// ============ 社团（关闭子页面新增，仅富文本 + 轮播） ============
async function loadClubsPanel() {
  const res = await fetch('/api/section/clubs');
  const section = await res.json();
  let data;
  try { data = typeof section.content === 'string' ? JSON.parse(section.content) : section.content; } catch { data = {}; }
  document.querySelectorAll('#clubsForm [data-field]').forEach(el => { el.value = data[el.dataset.field] || ''; });
}

function renderClubsList() {
  const list = document.getElementById('clubsList');
  if (clubsData.length === 0) {
    list.innerHTML = '<p style="color:var(--gray-500);text-align:center;padding:20px;">暂无社团活动</p>';
    return;
  }
  list.innerHTML = clubsData.map((item, index) => `
    <div class="list-item" data-index="${index}">
      <div class="list-item-header">
        <h4>${esc(item.title) || '新社团'}</h4>
        <div class="list-item-actions">
          <button class="btn btn-xs btn-outline" onclick="moveItem('clubs', ${index}, -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn btn-xs btn-outline" onclick="moveItem('clubs', ${index}, 1)" ${index === clubsData.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn btn-xs btn-danger" onclick="deleteItem('clubs', ${index})">删除</button>
        </div>
      </div>
      <div class="form-group">
        <label>名称</label>
        <input type="text" value="${esc(item.title)}" onchange="clubsData[${index}].title=this.value">
      </div>
      <div class="form-group">
        <label>角色/职位</label>
        <input type="text" value="${esc(item.role)}" onchange="clubsData[${index}].role=this.value">
      </div>
      <div class="form-group">
        <label>描述</label>
        <textarea rows="2" onchange="clubsData[${index}].description=this.value">${esc(item.description)}</textarea>
      </div>
      <div class="form-group">
        <label>状态</label>
        <select onchange="clubsData[${index}].status=this.value">
          <option value="活跃" ${item.status === '活跃' ? 'selected' : ''}>活跃</option>
          <option value="已结束" ${item.status === '已结束' ? 'selected' : ''}>已结束</option>
        </select>
      </div>
      <div class="form-group">
        <label>图片</label>
        <div style="display:flex;align-items:center;gap:10px;">
          <input type="text" value="${esc(item.image)}" onchange="clubsData[${index}].image=this.value" style="flex:1">
          <button class="btn btn-xs btn-primary" onclick="openUpload(url => { clubsData[${index}].image=url })">上传</button>
        </div>
        ${item.image ? `<img src="${item.image}" class="thumb-preview" alt="">` : ''}
      </div>
    </div>
  `).join('');
}

function addClubItem() {
  clubsData.push({ title: '', role: '', description: '', status: '活跃', image: '', _action: 'add', sort_order: clubsData.length + 1 });
  renderClubsList();
}

async function saveClubs(e) {
  e.preventDefault();
  const content = {};
  document.querySelectorAll('#clubsForm [data-field]').forEach(el => { content[el.dataset.field] = el.value; });
  const res = await api('/api/admin/section/clubs', { method: 'PUT', body: { title: '社团活动', content } });
  if (res && res.success) showToast('社团内容已保存');
}

// ============ 轮播图 ============
async function loadCarouselPanel() {
  const section = document.getElementById('carouselSection').value;
  const res = await fetch(`/api/carousel/${section}`);
  carouselData = await res.json();
  renderCarouselList();
}

function renderCarouselList() {
  const list = document.getElementById('carouselList');
  if (carouselData.length === 0) {
    list.innerHTML = '<p style="color:var(--gray-500);text-align:center;padding:20px;">暂无轮播图</p>';
    return;
  }
  list.innerHTML = carouselData.map((item, index) => `
    <div class="list-item" data-index="${index}">
      <div class="list-item-header">
        <h4>图片 ${index + 1}</h4>
        <div class="list-item-actions">
          <button class="btn btn-xs btn-outline" onclick="moveItem('carousel', ${index}, -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn btn-xs btn-outline" onclick="moveItem('carousel', ${index}, 1)" ${index === carouselData.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn btn-xs btn-danger" onclick="deleteItem('carousel', ${index})">删除</button>
        </div>
      </div>
      <div class="form-group">
        <label>图片路径/URL</label>
        <div style="display:flex;align-items:center;gap:10px;">
          <input type="text" value="${esc(item.image_path)}" onchange="carouselData[${index}].image_path=this.value; this.parentElement.nextElementSibling.querySelector('img').src=this.value" style="flex:1">
          <button class="btn btn-xs btn-primary" onclick="openUpload(url => { carouselData[${index}].image_path=url; const img=this.closest('.list-item').querySelector('.thumb-preview'); if(img)img.src=url })">上传</button>
        </div>
        ${item.image_path ? `<img src="${item.image_path}" class="thumb-preview" alt="">` : ''}
      </div>
      <div class="form-group">
        <label>说明文字</label>
        <input type="text" value="${esc(item.caption)}" onchange="carouselData[${index}].caption=this.value">
      </div>
    </div>
  `).join('');
}

function addCarouselItem() {
  carouselData.push({ image_path: '', caption: '', _action: 'add', sort_order: carouselData.length + 1 });
  renderCarouselList();
}

async function saveCarousel() {
  const section = document.getElementById('carouselSection').value;
  const items = carouselData.map((d, i) => ({
    image_path: d.image_path,
    caption: d.caption,
    sort_order: i + 1,
    _action: d._action || (d.id ? 'update' : 'add'),
    id: d.id
  }));

  const res = await api(`/api/admin/carousel/${section}`, { method: 'PUT', body: { items } });
  if (res && res.success) {
    carouselData = res.data;
    renderCarouselList();
    showToast('轮播图已保存');
  }
}

// ============ 网站设置 ============
async function loadSettingsPanel() {
  const res = await fetch('/api/settings');
  const settings = await res.json();

  document.querySelectorAll('#settingsForm [data-key]').forEach(el => {
    el.value = settings[el.dataset.key] || '';
  });
}

async function saveSettings(e) {
  e.preventDefault();
  const settings = {};
  document.querySelectorAll('#settingsForm [data-key]').forEach(el => {
    settings[el.dataset.key] = el.value;
  });

  const res = await api('/api/admin/settings', { method: 'PUT', body: { settings } });
  if (res && res.success) {
    showToast('网站设置已保存');
  }
}

// ============ 图片上传 ============
function initUpload() {
  const area = document.getElementById('uploadArea');
  const input = document.getElementById('uploadInput');

  area.addEventListener('click', () => input.click());

  area.addEventListener('dragover', (e) => {
    e.preventDefault();
    area.classList.add('dragover');
  });

  area.addEventListener('dragleave', () => {
    area.classList.remove('dragover');
  });

  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      showPreview(file);
    }
  });

  input.addEventListener('change', () => {
    if (input.files[0]) showPreview(input.files[0]);
  });
}

function showPreview(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('previewImg').src = e.target.result;
    document.getElementById('uploadPreview').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

let selectedFile = null;

function openUpload(callback) {
  uploadCallback = callback;
  document.getElementById('uploadPreview').style.display = 'none';
  document.getElementById('uploadInput').value = '';
  document.getElementById('uploadModal').classList.add('show');
}

function closeUploadModal() {
  document.getElementById('uploadModal').classList.remove('show');
  uploadCallback = null;
}

async function doUpload() {
  const input = document.getElementById('uploadInput');
  const previewImg = document.getElementById('previewImg');

  let file = null;
  if (input.files[0]) {
    file = input.files[0];
  } else if (previewImg.src && previewImg.src.startsWith('data:')) {
    // 从 data URL 转 File (拖拽上传的情况)
    const res = await fetch(previewImg.src);
    const blob = await res.blob();
    file = new File([blob], 'upload.png', { type: blob.type });
  }

  if (!file) {
    showToast('请先选择图片', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      if (uploadCallback) uploadCallback(data.url);
      closeUploadModal();
      showToast('图片上传成功');
    } else {
      const err = await res.json();
      showToast(err.error || '上传失败', 'error');
    }
  } catch (err) {
    showToast('上传失败', 'error');
  }
}

// ============ 修改密码 ============
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const oldPw = document.getElementById('oldPassword').value;
  const newPw = document.getElementById('newPassword').value;
  const confirmPw = document.getElementById('confirmPassword').value;

  if (!oldPw || !newPw) {
    showToast('请填写原密码和新密码', 'error');
    return;
  }
  if (newPw.length < 6) {
    showToast('新密码至少6个字符', 'error');
    return;
  }
  if (newPw !== confirmPw) {
    showToast('两次输入的新密码不一致', 'error');
    return;
  }

  try {
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw })
    });
    const data = await res.json();
    if (res.ok) {
      showToast('密码修改成功！');
      document.getElementById('passwordForm').reset();
    } else {
      showToast(data.error || '修改失败', 'error');
    }
  } catch (err) {
    showToast('修改失败', 'error');
  }
});

// ============ 工具函数 ============
function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}



// ============ 访问统计 ============
async function loadStatsPanel() {
  const res = await api('/api/admin/stats');
  if (!res || !res.success) return;
  const d = res.data;

  // 概览卡片
  document.getElementById('statTotal').textContent = d.totalViews.toLocaleString();
  document.getElementById('statToday').textContent = d.todayViews.toLocaleString();
  document.getElementById('statFrontend').textContent = d.frontendTotal.toLocaleString();
  document.getElementById('statAdmin').textContent = d.adminTotal.toLocaleString();
  
  const weekChange = d.lastWeek > 0 
    ? ((d.thisWeek - d.lastWeek) / d.lastWeek * 100).toFixed(1) + '%'
    : (d.thisWeek > 0 ? '↑ 新增' : '-');
  const weekEl = document.getElementById('statWeekChange');
  weekEl.textContent = typeof weekChange === 'string' && weekChange.includes('-') ? weekChange 
    : (weekChange.startsWith('-') ? weekChange : '+' + weekChange);
  weekEl.style.color = weekChange.startsWith('-') ? '#e74c3c' : '#27ae60';

  // 近7天趋势图（纯CSS柱状图）
  renderDailyChart(d.dailyStats);

  // 页面排行表
  const pageBody = document.getElementById('pageStatsBody');
  pageBody.innerHTML = d.pageStats.map(p => `
    <tr>
      <td>${esc(p.page_name) || '-'}</td>
      <td><code>${esc(p.page_path)}</code></td>
      <td><span class="badge ${p.view_type === 'admin' ? 'badge-admin' : 'badge-frontend'}">${p.view_type === 'admin' ? '后台' : '前台'}</span></td>
      <td><strong>${p.views}</strong></td>
    </tr>
  `).join('');

  // 最近访问记录（改为独立分页加载）
  loadViewsPage(1);
}

// ============ 最近访问记录分页 ============
let currentViewsPage = 1;
let currentViewsKeyword = '';

// 渲染单行
function viewsRowHtml(v) {
  return `
    <tr>
      <td>${esc(v.page_name) || '-'}</td>
      <td><code>${esc(v.page_path)}</code></td>
      <td><span class="badge ${v.view_type === 'admin' ? 'badge-admin' : 'badge-frontend'}">${v.view_type === 'admin' ? '后台' : '前台'}</span></td>
      <td>${esc(v.visitor_ip || '-')}</td>
      <td>${esc(v.location || '-')}</td>
      <td>${formatTime(v.created_at)}</td>
    </tr>`;
}

// 加载指定页
async function loadViewsPage(page) {
  const pageSize = parseInt(document.getElementById('viewsPageSize')?.value, 10) || 20;
  const kw = (document.getElementById('viewsKeyword')?.value || '').trim();
  currentViewsKeyword = kw;
  const q = new URLSearchParams({ page, pageSize, keyword: kw });
  const res = await api('/api/admin/views?' + q.toString());
  if (!res || !res.success) return;
  const d = res.data;

  currentViewsPage = d.page;

  const body = document.getElementById('recentViewsBody');
  body.innerHTML = d.views.length
    ? d.views.map(viewsRowHtml).join('')
    : '<tr><td colspan="6" style="text-align:center;color:var(--gray-500);padding:20px;">暂无访问记录</td></tr>';

  // 分页信息
  const pag = document.getElementById('viewsPagination');
  if (d.totalPages > 1) {
    pag.style.display = 'flex';
  } else {
    pag.style.display = 'none';
  }
  document.getElementById('viewsPageInfo').textContent = `共 ${d.total.toLocaleString()} 条 · 第 ${d.page}/${d.totalPages} 页`;
  document.getElementById('viewsPrev').disabled = d.page <= 1;
  document.getElementById('viewsNext').disabled = d.page >= d.totalPages;
}

// 每页条数改变时回到第 1 页
function changeViewsPageSize() {
  loadViewsPage(1);
}

function renderDailyChart(dailyStats) {
  const chart = document.getElementById('statsChart');
  if (!dailyStats || dailyStats.length === 0) {
    chart.innerHTML = '<p style="color:var(--gray-500);text-align:center;padding:20px;">暂无数据</p>';
    return;
  }
  
  const maxVal = Math.max(...dailyStats.map(d => d.total), 1);
  chart.innerHTML = '<div class="chart-bars">' + dailyStats.map(d => {
    const heightPct = (d.total / maxVal * 100).toFixed(1);
    const frontendPct = d.total > 0 ? (d.frontend / d.total * 100).toFixed(0) : 0;
    const dateLabel = d.date.slice(5); // MM-DD
    return `
      <div class="chart-bar-col">
        <div class="chart-bar-value">${d.total}</div>
        <div class="chart-bar" style="height:${heightPct}%">
          <div class="chart-bar-frontend" style="height:${frontendPct}%"></div>
        </div>
        <div class="chart-bar-label">${dateLabel}</div>
      </div>
    `;
  }).join('') + '</div><div class="chart-legend"><span class="legend-frontend">■ 前台</span><span class="legend-admin">■ 后台</span></div>';
}

function formatTime(dt) {
  if (!dt) return '-';
  const d = new Date(dt + 'Z');
  const now = new Date();
  const diff = (now - d) / 1000 / 60; // minutes
  if (diff < 1) return '刚刚';
  if (diff < 60) return Math.floor(diff) + '分钟前';
  if (diff < 1440) return Math.floor(diff / 60) + '小时前';
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}
