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
        <h4>${esc(item.title) || '新项目'}</h4>
        <div class="list-item-actions">
          <button class="btn btn-xs btn-outline" onclick="moveItem('academic', ${index}, -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn btn-xs btn-outline" onclick="moveItem('academic', ${index}, 1)" ${index === academicData.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn btn-xs btn-danger" onclick="deleteItem('academic', ${index})">删除</button>
        </div>
      </div>
      <div class="form-group">
        <label>标题</label>
        <input type="text" value="${esc(item.title)}" onchange="academicData[${index}].title=this.value">
      </div>
      <div class="form-group">
        <label>描述</label>
        <textarea rows="2" onchange="academicData[${index}].description=this.value">${esc(item.description)}</textarea>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="form-group">
          <label>日期</label>
          <input type="date" value="${item.date || ''}" onchange="academicData[${index}].date=this.value">
        </div>
        <div class="form-group">
          <label>地点</label>
          <input type="text" value="${esc(item.location)}" onchange="academicData[${index}].location=this.value">
        </div>
      </div>
      <div class="form-group">
        <label>参与人员</label>
        <input type="text" value="${esc(item.participants)}" onchange="academicData[${index}].participants=this.value">
      </div>
      <div class="form-group">
        <label>详细内容</label>
        <textarea rows="3" onchange="academicData[${index}].details=this.value">${esc(item.details)}</textarea>
      </div>
      <div class="form-group">
        <label>成果</label>
        <textarea rows="2" onchange="academicData[${index}].achievements=this.value">${esc(item.achievements)}</textarea>
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
  academicData.push({ title: '', description: '', date: '', location: '', participants: '', details: '', achievements: '', image: '', _action: 'add', sort_order: academicData.length + 1 });
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
        <h4>${esc(item.competition_name) || '新记录'}</h4>
        <div class="list-item-actions">
          <button class="btn btn-xs btn-outline" onclick="moveItem('sports', ${index}, -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn btn-xs btn-outline" onclick="moveItem('sports', ${index}, 1)" ${index === sportsData.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn btn-xs btn-danger" onclick="deleteItem('sports', ${index})">删除</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="form-group">
          <label>比赛名称</label>
          <input type="text" value="${esc(item.competition_name)}" onchange="sportsData[${index}].competition_name=this.value">
        </div>
        <div class="form-group">
          <label>项目</label>
          <input type="text" value="${esc(item.event)}" onchange="sportsData[${index}].event=this.value">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="form-group">
          <label>成绩</label>
          <input type="text" value="${esc(item.result)}" onchange="sportsData[${index}].result=this.value">
        </div>
        <div class="form-group">
          <label>日期</label>
          <input type="date" value="${item.date || ''}" onchange="sportsData[${index}].date=this.value">
        </div>
      </div>
      <div class="form-group">
        <label>地点</label>
        <input type="text" value="${esc(item.location)}" onchange="sportsData[${index}].location=this.value">
      </div>
      <div class="form-group">
        <label>描述</label>
        <textarea rows="2" onchange="sportsData[${index}].description=this.value">${esc(item.description)}</textarea>
      </div>
      <div class="form-group">
        <label>成长轨迹</label>
        <textarea rows="2" onchange="sportsData[${index}].progress=this.value">${esc(item.progress)}</textarea>
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
  sportsData.push({ competition_name: '', event: '', result: '', date: '', location: '', description: '', progress: '', image: '', _action: 'add', sort_order: sportsData.length + 1 });
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

// ============ 西藏 ============
async function loadTibetPanel() {
  const res = await fetch('/api/tibet');
  tibetData = await res.json();
  renderTibetList();
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

async function saveTibet() {
  const items = tibetData.map((d, i) => ({
    ...d,
    sort_order: i + 1,
    _action: d._action || (d.id ? 'update' : 'add')
  }));

  const res = await api('/api/admin/tibet', { method: 'PUT', body: { items } });
  if (res && res.success) {
    tibetData = res.data;
    renderTibetList();
    showToast('西藏活动已保存');
  }
}

// ============ 社团 ============
async function loadClubsPanel() {
  const res = await fetch('/api/clubs');
  clubsData = await res.json();
  renderClubsList();
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

async function saveClubs() {
  const items = clubsData.map((d, i) => ({
    ...d,
    sort_order: i + 1,
    _action: d._action || (d.id ? 'update' : 'add')
  }));

  const res = await api('/api/admin/clubs', { method: 'PUT', body: { items } });
  if (res && res.success) {
    clubsData = res.data;
    renderClubsList();
    showToast('社团活动已保存');
  }
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
