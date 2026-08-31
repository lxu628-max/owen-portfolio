import xml.etree.ElementTree as ET

mxfile = ET.Element('mxfile', {'host': 'app.diagrams.net', 'version': '24.0.0'})

# ============ HELPERS ============
def mkdiagram(mxf, id, name):
    d = ET.SubElement(mxf, 'diagram', {'id': id, 'name': name})
    m = ET.SubElement(d, 'mxGraphModel', {
        'dx':'1422','dy':'900','grid':'1','gridSize':'10','guides':'1','tooltips':'1',
        'connect':'1','arrows':'1','fold':'1','page':'1','pageScale':'1',
        'pageWidth':'1200','pageHeight':'900','math':'0','shadow':'0'
    })
    r = ET.SubElement(m, 'root')
    ET.SubElement(r, 'mxCell', {'id':'0'})
    ET.SubElement(r, 'mxCell', {'id':'1','parent':'0'})
    return r

def c(r, id, val, style, x, y, w, h):
    cell = ET.SubElement(r, 'mxCell', {'id':str(id),'value':str(val) if val else '','style':style,'vertex':'1','parent':'1'})
    ET.SubElement(cell, 'mxGeometry', {'x':str(x),'y':str(y),'width':str(w),'height':str(h),'as':'geometry'})

# ============ STYLES ============
S = {
    'nav_bg': 'rounded=0;whiteSpace=wrap;html=1;fillColor=#1A365D;strokeColor=none;shadow=1;',
    'nav_logo': 'text;html=1;fontSize=18;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#FFFFFF;',
    'nav_it': 'text;html=1;fontSize=12;fontStyle=0;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#A0AEC0;',
    'nav_ac': 'text;html=1;fontSize=12;fontStyle=1;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#FFFFFF;',
    'nav_ul': 'rounded=0;whiteSpace=wrap;html=1;fillColor=#3182CE;strokeColor=none;',
    'page_bg': 'rounded=0;whiteSpace=wrap;html=1;fillColor=#F7FAFC;strokeColor=none;',
    'card': 'rounded=1;whiteSpace=wrap;html=1;arcSize=8;fillColor=#FFFFFF;strokeColor=#E2E8F0;shadow=1;',
    'btn_p': 'rounded=1;whiteSpace=wrap;html=1;arcSize=12;fillColor=#3182CE;strokeColor=none;fontColor=#FFFFFF;fontSize=12;fontStyle=1;',
    'btn_s': 'rounded=1;whiteSpace=wrap;html=1;arcSize=12;fillColor=#FFFFFF;strokeColor=#3182CE;fontColor=#3182CE;fontSize=12;fontStyle=1;',
    'btn_d': 'rounded=1;whiteSpace=wrap;html=1;arcSize=12;fillColor=#E53E3E;strokeColor=none;fontColor=#FFFFFF;fontSize=11;fontStyle=1;',
    'btn_g': 'rounded=1;whiteSpace=wrap;html=1;arcSize=12;fillColor=#38A169;strokeColor=none;fontColor=#FFFFFF;fontSize=12;fontStyle=1;',
    'tag_b': 'rounded=1;whiteSpace=wrap;html=1;arcSize=40;fillColor=#EBF4FF;strokeColor=#BEE3F8;fontColor=#3182CE;fontSize=10;fontStyle=1;',
    'tag_p': 'rounded=1;whiteSpace=wrap;html=1;arcSize=40;fillColor=#FAF5FF;strokeColor=#E9D8FD;fontColor=#805AD5;fontSize=10;fontStyle=1;',
    'tag_g': 'rounded=1;whiteSpace=wrap;html=1;arcSize=40;fillColor=#F0FFF4;strokeColor=#C6F6D5;fontColor=#38A169;fontSize=10;fontStyle=1;',
    'tag_r': 'rounded=1;whiteSpace=wrap;html=1;arcSize=40;fillColor=#FFF5F5;strokeColor=#FED7D7;fontColor=#E53E3E;fontSize=10;fontStyle=1;',
    'tag_go': 'rounded=1;whiteSpace=wrap;html=1;arcSize=40;fillColor=#FFFFF0;strokeColor=#FEFCBF;fontColor=#D69E2E;fontSize=10;fontStyle=1;',
    't_huge': 'text;html=1;fontSize=22;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#1A365D;',
    't_h1': 'text;html=1;fontSize=18;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#1A365D;',
    't_h2': 'text;html=1;fontSize=16;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#2D3748;',
    't_h3': 'text;html=1;fontSize=14;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#4A5568;',
    't_sub': 'text;html=1;fontSize=14;fontStyle=0;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#4A5568;',
    't_body': 'text;html=1;fontSize=12;fontStyle=0;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#4A5568;',
    't_sm': 'text;html=1;fontSize=11;fontStyle=0;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#718096;',
    't_date': 'text;html=1;fontSize=11;fontStyle=0;align=right;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#A0AEC0;',
    't_label': 'text;html=1;fontSize=12;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#3182CE;',
    't_footer': 'text;html=1;fontSize=11;fontStyle=0;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#A0AEC0;',
    't_icon_b': 'text;html=1;fontSize=36;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#3182CE;opacity=50;',
    't_icon_p': 'text;html=1;fontSize=36;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#805AD5;opacity=50;',
    't_icon_g': 'text;html=1;fontSize=36;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#38A169;opacity=50;',
    't_icon_r': 'text;html=1;fontSize=36;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#E53E3E;opacity=50;',
    't_icon_go': 'text;html=1;fontSize=36;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#D69E2E;opacity=50;',
    't_lbl': 'text;html=1;fontSize=12;fontStyle=0;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#718096;',
    't_lbl_sm': 'text;html=1;fontSize=10;fontStyle=0;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#A0AEC0;',
    'div': 'rounded=0;whiteSpace=wrap;html=1;fillColor=#E2E8F0;strokeColor=none;',
    'footer': 'rounded=0;whiteSpace=wrap;html=1;fillColor=#EDF2F7;strokeColor=#E2E8F0;',
    'g_blue': 'rounded=1;whiteSpace=wrap;html=1;arcSize=8;fillColor=#EBF4FF;strokeColor=#BEE3F8;shadow=1;gradientColor=#C3DAFE;gradientDirection=south;',
    'g_purple': 'rounded=1;whiteSpace=wrap;html=1;arcSize=8;fillColor=#FAF5FF;strokeColor=#E9D8FD;shadow=1;gradientColor=#E9D8FD;gradientDirection=south;',
    'g_green': 'rounded=1;whiteSpace=wrap;html=1;arcSize=8;fillColor=#F0FFF4;strokeColor=#C6F6D5;shadow=1;gradientColor=#C6F6D5;gradientDirection=south;',
    'g_red': 'rounded=1;whiteSpace=wrap;html=1;arcSize=8;fillColor=#FFF5F5;strokeColor=#FED7D7;shadow=1;gradientColor=#FED7D7;gradientDirection=south;',
    'g_gold': 'rounded=1;whiteSpace=wrap;html=1;arcSize=8;fillColor=#FFFFF0;strokeColor=#FEFCBF;shadow=1;gradientColor=#FEFCBF;gradientDirection=south;',
    'g_blue2': 'rounded=1;whiteSpace=wrap;html=1;arcSize=8;fillColor=#EBF4FF;strokeColor=#BEE3F8;shadow=1;gradientColor=#BEE3F8;gradientDirection=south;',
    'dot_on': 'ellipse;whiteSpace=wrap;html=1;fillColor=#3182CE;strokeColor=none;shadow=1;',
    'dot_off': 'ellipse;whiteSpace=wrap;html=1;fillColor=#CBD5E0;strokeColor=none;',
    'sidebar': 'rounded=0;whiteSpace=wrap;html=1;fillColor=#1A365D;strokeColor=none;',
    'sb_it': 'rounded=1;whiteSpace=wrap;html=1;arcSize=8;fillColor=none;strokeColor=none;fontColor=#A0AEC0;fontSize=12;align=left;spacingLeft=15;',
    'sb_ac': 'rounded=1;whiteSpace=wrap;html=1;arcSize=8;fillColor=#2B4573;strokeColor=none;fontColor=#FFFFFF;fontSize=12;fontStyle=1;align=left;spacingLeft=15;',
    'tbl_h': 'rounded=0;whiteSpace=wrap;html=1;fillColor=#EDF2F7;strokeColor=#E2E8F0;fontColor=#4A5568;fontSize=11;fontStyle=1;',
    'input': 'rounded=1;whiteSpace=wrap;html=1;arcSize=4;fillColor=#FFFFFF;strokeColor=#CBD5E0;fontColor=#4A5568;fontSize=12;align=left;spacingLeft=10;',
    'arrow': 'text;html=1;fontSize=14;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#3182CE;',
    'tag_hl': 'rounded=1;whiteSpace=wrap;html=1;arcSize=40;fillColor=#FAF5FF;strokeColor=#E9D8FD;fontColor=#805AD5;fontSize=11;fontStyle=1;',
    'tag_sl': 'rounded=1;whiteSpace=wrap;html=1;arcSize=40;fillColor=#EBF8FF;strokeColor=#BEE3F8;fontColor=#2B6CB0;fontSize=11;fontStyle=1;',
    'tag_gold_medal': 'rounded=1;whiteSpace=wrap;html=1;arcSize=40;fillColor=#FFFFF0;strokeColor=#F6E05E;fontColor=#B7791F;fontSize=11;fontStyle=1;',
    'link_back': 'text;html=1;fontSize=12;fontStyle=0;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#3182CE;',
}

def add_nav(r, active=-1):
    """Add navigation bar. active=-1 means homepage (no underline). active=0~4 for About/Athletics/Academics/Xizang/Clubs"""
    c(r,'bg','',S['page_bg'],0,0,1200,900)
    c(r,'nav','',S['nav_bg'],0,0,1200,56)
    c(r,'logo',"Owen's Portfolio",S['nav_logo'],30,8,200,40)
    items=[('About Me',560,90),('Athletics',670,90),('Academics',780,90),('Xizang',890,80),('Clubs',990,70)]
    for i,(nm,xp,w) in enumerate(items):
        if i==active:
            c(r,f'nv{i}',nm,S['nav_ac'],xp,16,w,30)
            c(r,f'nvu{i}','',S['nav_ul'],xp,53,w,3)
        else:
            c(r,f'nv{i}',nm,S['nav_it'],xp,16,w,30)
    # Footer
    c(r,'ftr','',S['footer'],0,856,1200,44)
    c(r,'ftrt','© 2024 Owen. All rights reserved.  |  aboutowen.cn',S['t_footer'],300,862,600,32)

def img_ph(r, x, y, w, h, grad, icon_s, lbl, sub=''):
    """Image placeholder with gradient"""
    uid = f'{x}{y}{w}'
    c(r,f'ip_{uid}','',grad,x,y,w,h)
    c(r,f'ii_{uid}','📷',icon_s,x+w//2-20,y+h//2-30,40,40)
    c(r,f'il_{uid}',lbl,S['t_lbl'],x+20,y+h//2+10,w-40,25)
    if sub:
        c(r,f'is_{uid}',sub,S['t_lbl_sm'],x+20,y+h//2+32,w-40,20)

# ============================================================
# PAGE 00 - INDEX
# ============================================================
r = mkdiagram(mxfile, 'page_index', '00-页面索引')
c(r,'it',"Owen 个人作品集网站",'text;html=1;fontSize=28;fontStyle=1;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#1A365D;',200,30,800,50)
c(r,'is','高保真产品原型  ·  Hi-Fi Prototype  ·  v2.0','text;html=1;fontSize=14;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#718096;',300,80,600,30)
c(r,'idiv','','rounded=0;whiteSpace=wrap;html=1;fillColor=#3182CE;strokeColor=none;',550,115,100,3)

pages_info = [
    ('01','首页','Homepage','轮播图 + 动态列表 + 个人介绍','#3182CE','#EBF4FF'),
    ('02','关于我','About Me','个人照片 + 背景信息 + 特质标签','#3182CE','#EBF4FF'),
    ('03','学术列表','Academics List','IB 课程 + 学术项目卡片','#805AD5','#FAF5FF'),
    ('04','学术详情','Academics Detail','项目详情 + 成果展示','#805AD5','#FAF5FF'),
    ('05','体育列表','Athletics List','游泳参赛记录 + 进步轨迹','#38A169','#F0FFF4'),
    ('06','体育详情','Athletics Detail','比赛信息 + 成绩展示','#38A169','#F0FFF4'),
    ('07','西藏','Xizang','公益项目 + 活动 + 影响力','#E53E3E','#FFF5F5'),
    ('08','社团','Clubs','社团卡片 + 角色 + 状态','#D69E2E','#FFFFF0'),
    ('09','后台管理','Admin Dashboard','数据表格 + CRUD 操作','#1A365D','#EDF2F7'),
]
cw,ch,gx,gy,cols=340,105,20,18,3
for i,(num,cn,en,desc,acc,bg) in enumerate(pages_info):
    col,row=i%cols,i//cols
    cx,cy=50+col*(cw+gx),140+row*(ch+gy)
    c(r,f'ic{i}','',S['card'],cx,cy,cw,ch)
    c(r,f'ia{i}','',f'rounded=1;whiteSpace=wrap;html=1;arcSize=50;fillColor={acc};strokeColor=none;',cx+12,cy+18,5,ch-36)
    c(r,f'in{i}',num,f'text;html=1;fontSize=22;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor={acc};opacity=35;',cx+26,cy+8,45,30)
    c(r,f'icn{i}',cn,S['t_h3'],cx+65,cy+10,180,22)
    c(r,f'ien{i}',en,S['t_sm'],cx+65,cy+32,180,18)
    c(r,f'idd{i}',desc,'text;html=1;fontSize=11;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#718096;',cx+26,cy+58,290,40)

c(r,'ds','🎨 主色 #1A365D  ·  品牌蓝 #3182CE  ·  学术紫 #805AD5  ·  体育绿 #38A169  ·  西藏红 #E53E3E  ·  社团金 #D69E2E',
  'rounded=1;whiteSpace=wrap;html=1;arcSize=8;fillColor=#EDF2F7;strokeColor=#E2E8F0;fontColor=#4A5568;fontSize=11;align=center;',100,500,1000,35)
c(r,'nt','💡 点击左侧页面标签切换查看各页面原型。所有元素均可在 diagrams.net 中自由编辑。',
  'shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;size=15;fillColor=#FFFFF0;strokeColor=#FEFCBF;fontSize=11;align=left;spacingLeft=10;fontColor=#744210;',250,550,700,45)

# ============================================================
# PAGE 01 - HOMEPAGE
# ============================================================
r = mkdiagram(mxfile, 'page_home', '01-首页')
add_nav(r, -1)

# Left - Carousel
img_ph(r, 30,76,540,340, S['g_blue'], S['t_icon_b'], '3 张轮播图', '自动轮播 · 手动切换')
c(r,'hp','◀','ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#E2E8F0;fontSize=14;fontColor=#3182CE;shadow=1;',45,225,36,36)
c(r,'hn','▶','ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#E2E8F0;fontSize=14;fontColor=#3182CE;shadow=1;',519,225,36,36)
c(r,'hd1','',S['dot_on'],270,390,10,10)
c(r,'hd2','',S['dot_off'],290,390,10,10)
c(r,'hd3','',S['dot_off'],310,390,10,10)

# Left - Personal intro card
c(r,'hi','',S['card'],30,436,540,190)
c(r,'hit','你好，我是 Owen',S['t_huge'],50,450,400,35)
c(r,'his','YCIS IB 学生  |  科技爱好者  |  竞技游泳运动员',S['t_sub'],50,488,500,25)
c(r,'hid','热爱探索科技前沿，在水中挑战极限，用教育连接远方。','text;html=1;fontSize=12;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#718096;',50,516,500,22)
c(r,'ht1','IB 学生',S['tag_b'],50,550,70,24)
c(r,'ht2','科技爱好者',S['tag_b'],128,550,82,24)
c(r,'ht3','游泳运动员',S['tag_g'],218,550,82,24)
c(r,'ht4','社区服务',S['tag_r'],308,550,70,24)

# Right - News
c(r,'ntt','动态  /  Updates',S['t_h2'],590,76,300,35)
c(r,'ndv','',S['div'],590,112,580,1)

news = [
    ('🏊','ISS 游泳锦标赛','代表学校参加 ISS 游泳锦标赛，获得200米自由泳银牌','2024-11-15','#3182CE'),
    ('🏆','康莱德创新挑战赛','团队项目进入区域决赛，聚焦可持续发展议题','2024-10-20','#805AD5'),
    ('🏔️','西藏教育项目','完成第三期西藏远程教学计划，覆盖50名学生','2024-09-01','#E53E3E'),
    ('📜','NVIDIA 深度学习证书','完成 NVIDIA 深度学习基础课程并获得认证','2024-08-15','#3182CE'),
    ('🤖','机器人社团招新','作为核心成员组织新学期招新活动，吸引30+新成员','2024-08-01','#D69E2E'),
]
for i,(em,ti,de,dt,co) in enumerate(news):
    ny=124+i*62
    c(r,f'nc{i}','',S['card'],590,ny,580,54)
    c(r,f'ni{i}','',f'rounded=1;whiteSpace=wrap;html=1;arcSize=50;fillColor={co};strokeColor=none;',598,ny+10,5,34)
    c(r,f'nt{i}',ti,'text;html=1;fontSize=12;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#2D3748;',614,ny+5,300,22)
    c(r,f'nd{i}',de,S['t_sm'],614,ny+27,380,20)
    c(r,f'ndt{i}',dt,S['t_date'],1050,ny+5,110,22)

# Right bottom - about card
c(r,'rb','',S['card'],590,436,580,190)
c(r,'rbt','关于本站','text;html=1;fontSize=14;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#1A365D;',610,450,200,25)
c(r,'rbd','这是一个展示我大学申请背景、学术成就和课外活动的个人作品集网站。通过这里，你可以了解我的学术追求、体育竞技、社区服务和社团经历。','text;html=1;fontSize=11;align=left;verticalAlign=top;fillColor=none;strokeColor=none;fontColor=#718096;',610,480,540,55)
c(r,'rql','学术成就 →','text;html=1;fontSize=11;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#805AD5;',610,555,100,22)
c(r,'rq2','体育竞技 →','text;html=1;fontSize=11;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#38A169;',730,555,100,22)
c(r,'rq3','西藏公益 →','text;html=1;fontSize=11;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#E53E3E;',850,555,100,22)
c(r,'rq4','社团活动 →','text;html=1;fontSize=11;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#D69E2E;',970,555,100,22)

# Bottom quick nav
c(r,'bqn','',S['card'],30,646,1140,190)
c(r,'bqt','快速导航','text;html=1;fontSize=14;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#1A365D;',50,660,200,25)
qnav=[('🎓','学术','IB课程 · 竞赛 · 研究','#805AD5','#FAF5FF'),('🏊','体育','游泳比赛 · 成绩记录','#38A169','#F0FFF4'),('🏔️','西藏','公益教育 · 社会影响','#E53E3E','#FFF5F5'),('🏛️','社团','机器人 · 创新 · 服务','#D69E2E','#FFFFF0')]
for i,(em,nm,ds,co,bg) in enumerate(qnav):
    nx=50+i*275
    c(r,f'qn{i}','',f'rounded=1;whiteSpace=wrap;html=1;arcSize=8;fillColor={bg};strokeColor=#E2E8F0;shadow=1;',nx,695,255,75)
    c(r,f'qne{i}',em,'text;html=1;fontSize=20;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;',nx+10,710,40,35)
    c(r,f'qnn{i}',nm,f'text;html=1;fontSize=13;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor={co};',nx+55,708,150,22)
    c(r,f'qnd{i}',ds,S['t_sm'],nx+55,730,180,18)

# ============================================================
# PAGE 02 - ABOUT ME
# ============================================================
r = mkdiagram(mxfile, 'page_about', '02-关于我')
add_nav(r, 0)  # About Me active

# Left - Photo
img_ph(r, 30,76,460,600, S['g_blue2'], S['t_icon_b'], '个人照片轮播', '支持上传/替换/排序')

# Right - Info
c(r,'abt','关于我',S['t_huge'],510,86,200,40)
c(r,'abdiv','',S['div'],510,128,660,1)

# Info blocks
infos = [
    ('🏫','学校','上海耀中外籍人员子女学校（YCIS）','#3182CE'),
    ('🎯','申请目标','美国 / 香港 — 顶尖大学','#3182CE'),
    ('📚','专业方向','计算机科学、人工智能、数据科学','#805AD5'),
    ('🤝','领导力参与','积极参与学生领导活动，担任多个社团核心成员与组织者','#38A169'),
    ('⭐','个人特质','自律 · 领导力 · 好奇心 · 韧性','#D69E2E'),
]
for i,(em,lb,vl,co) in enumerate(infos):
    iy = 140 + i*72
    # Icon circle
    c(r,f'ai{i}',em,f'ellipse;whiteSpace=wrap;html=1;fillColor=#EBF4FF;strokeColor=none;fontSize=18;',510,iy+2,38,38)
    # Label
    c(r,f'al{i}',lb,f'text;html=1;fontSize=11;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor={co};',556,iy+2,120,20)
    # Value
    c(r,f'av{i}',vl,'text;html=1;fontSize=12;fontStyle=0;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#2D3748;',556,iy+22,580,22)
    if i < 4:
        c(r,f'ad{i}','',S['div'],510,iy+52,660,1)

# Tags section
c(r,'att','个人特质','text;html=1;fontSize=13;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#1A365D;',510,510,200,25)
tags = [('自律','#EBF8FF','#2B6CB0'),('领导力','#FAF5FF','#805AD5'),('好奇心','#F0FFF4','#38A169'),('韧性','#FFF5F5','#E53E3E'),('创新思维','#EBF4FF','#3182CE'),('团队合作','#FFFFF0','#D69E2E')]
tx=510
for i,(tg,tbg,tc) in enumerate(tags):
    tw = len(tg)*14+20
    c(r,f'at{i}',tg,f'rounded=1;whiteSpace=wrap;html=1;arcSize=40;fillColor={tbg};strokeColor=none;fontColor={tc};fontSize=11;fontStyle=1;',tx,540,tw,28)
    tx += tw+10

# Quote card
c(r,'aq','',S['card'],510,590,660,80)
c(r,'aqt','"追求卓越，不只是成绩，更是成长的过程。"','text;html=1;fontSize=13;fontStyle=2;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#4A5568;',530,605,620,25)
c(r,'aqs','—— Owen','text;html=1;fontSize=11;align=right;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#A0AEC0;',1000,630,150,22)

# ============================================================
# PAGE 03 - ACADEMICS LIST
# ============================================================
r = mkdiagram(mxfile, 'page_academic_list', '03-学术列表页')
add_nav(r, 2)  # Academics active

# Left - Academic images
img_ph(r, 30,76,460,600, S['g_purple'], S['t_icon_p'], '学术证书与奖项', '图片滚动展示')

# Right - Content
c(r,'alt','学术概况',S['t_huge'],510,86,200,40)
c(r,'aldiv','',S['div'],510,128,660,1)

# IB Course card
c(r,'ibc','',S['card'],510,140,660,190)
c(r,'ibt','📚 IB 课程选择','text;html=1;fontSize=14;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#1A365D;',530,150,300,28)

# HL subjects
c(r,'hlbl','Higher Level (HL)','text;html=1;fontSize=11;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#805AD5;',530,185,200,20)
hl_tags = ['数学 AA','物理','计算机科学']
hx=530
for i,t in enumerate(hl_tags):
    c(r,f'hl{i}',t,S['tag_hl'],hx,207,len(t)*12+20,26)
    hx+=len(t)*12+28

# SL subjects
c(r,'slbl','Standard Level (SL)','text;html=1;fontSize=11;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#2B6CB0;',530,242,200,20)
sl_tags = ['英语 A','中文 A','历史']
sx=530
for i,t in enumerate(sl_tags):
    c(r,f'sl{i}',t,S['tag_sl'],sx,264,len(t)*12+20,26)
    sx+=len(t)*12+28

# Academic projects section
c(r,'apt','📋 学术竞赛与项目','text;html=1;fontSize=14;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#1A365D;',510,350,300,30)

projects = [
    ('🇦🇺','澳大利亚数学竞赛','AMC - Australian Mathematics Competition','#805AD5'),
    ('🌍','欧洲研究项目','European Studies - 跨文化研究课题','#3182CE'),
    ('🚀','康莱德创新挑战赛','Conrad Challenge - 区域决赛入围','#38A169'),
    ('🤖','NVIDIA 深度学习认证','NVIDIA Deep Learning Fundamentals','#D69E2E'),
    ('📐','地理研究与活动','Geography Research - 城市可持续发展','#E53E3E'),
]
for i,(em,ti,de,co) in enumerate(projects):
    py = 388 + i*60
    c(r,f'ap{i}','',S['card'],510,py,660,52)
    c(r,f'api{i}',em,'text;html=1;fontSize=16;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;',520,py+12,30,28)
    c(r,f'apt2{i}',ti,'text;html=1;fontSize=12;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#2D3748;',555,py+5,300,22)
    c(r,f'apd{i}',de,S['t_sm'],555,py+27,420,18)
    c(r,f'apa{i}','›','text;html=1;fontSize=18;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#A0AEC0;',1140,py+10,25,30)
    # Left color indicator
    c(r,f'apc{i}','',f'rounded=1;whiteSpace=wrap;html=1;arcSize=50;fillColor={co};strokeColor=none;',510,py+8,4,36)

# ============================================================
# PAGE 04 - ACADEMICS DETAIL
# ============================================================
r = mkdiagram(mxfile, 'page_academic_detail', '04-学术详情页')
add_nav(r, 2)

# Left - Two images stacked
img_ph(r, 30,76,460,290, S['g_purple'], S['t_icon_p'], '合照', '项目团队合影')
img_ph(r, 30,380,460,290, 'rounded=1;whiteSpace=wrap;html=1;arcSize=8;fillColor=#FAF5FF;strokeColor=#E9D8FD;shadow=1;gradientColor=#D6BCFA;gradientDirection=south;', S['t_icon_p'], '证书展示', '获奖证书/认证')

# Right - Detail
c(r,'dt_title','康莱德创新挑战赛',S['t_huge'],510,86,400,35)
c(r,'dt_sub','Conrad Challenge - 区域决赛',S['t_sub'],510,122,400,22)

# Info tags row
c(r,'dt_t1','📅 2024年10月',S['tag_p'],510,155,130,26)
c(r,'dt_t2','📍 上海',S['tag_p'],650,155,80,26)
c(r,'dt_t3','👥 团队项目（4人）',S['tag_p'],740,155,145,26)

c(r,'dt_div','',S['div'],510,192,660,1)

# Description
c(r,'dt_dl','项目描述','text;html=1;fontSize=13;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#1A365D;',510,205,200,22)
c(r,'dt_dd','围绕可持续发展议题，团队设计了一款基于 AI 的城市废物分类系统。从调研、方案设计到原型开发，经历了3个月的深入研究。在区域决赛中展示了项目成果，获得评委高度评价。','text;html=1;fontSize=12;align=left;verticalAlign=top;fillColor=none;strokeColor=none;fontColor=#4A5568;',510,230,660,65)

# Achievements section
c(r,'dt_al','成果与收获','text;html=1;fontSize=13;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#1A365D;',510,310,200,22)
c(r,'dt_ac1','🏆 区域决赛入围','rounded=1;whiteSpace=wrap;html=1;arcSize=8;fillColor=#F0FFF4;strokeColor=#C6F6D5;fontColor=#38A169;fontSize=12;fontStyle=1;align=left;spacingLeft=10;shadow=1;',510,338,660,32)
c(r,'dt_ac2','📜 创新方案设计证书','rounded=1;whiteSpace=wrap;html=1;arcSize=8;fillColor=#F0FFF4;strokeColor=#C6F6D5;fontColor=#38A169;fontSize=12;fontStyle=1;align=left;spacingLeft=10;shadow=1;',510,378,660,32)
c(r,'dt_ac3','🤝 团队协作与项目管理能力提升','rounded=1;whiteSpace=wrap;html=1;arcSize=8;fillColor=#EBF4FF;strokeColor=#BEE3F8;fontColor=#3182CE;fontSize=12;fontStyle=1;align=left;spacingLeft=10;shadow=1;',510,418,660,32)

# Growth section
c(r,'dt_gl','个人成长','text;html=1;fontSize=13;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#1A365D;',510,470,200,22)
c(r,'dt_gd','通过这次比赛，我学会了如何将技术想法转化为可行的解决方案，并体验了完整的创新流程。团队的协作让我认识到跨学科合作的价值。','text;html=1;fontSize=12;align=left;verticalAlign=top;fillColor=none;strokeColor=none;fontColor=#4A5568;',510,495,660,50)

# Back button
c(r,'bk','← 返回学术列表',S['link_back'],510,570,200,25)
c(r,'bkb','',S['btn_s'],510,600,140,36)
c(r,'bkbt','← 返回列表','text;html=1;fontSize=12;fontStyle=0;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#3182CE;',510,600,140,36)

# ============================================================
# PAGE 05 - SPORTS LIST
# ============================================================
r = mkdiagram(mxfile, 'page_sports_list', '05-体育列表页')
add_nav(r, 1)  # Athletics active

# Left - Swimming images
img_ph(r, 30,76,460,600, S['g_green'], S['t_icon_g'], '游泳比赛照片', '图片滚动展示')

# Right - Competition records
c(r,'slt','参赛记录',S['t_huge'],510,86,200,40)
c(r,'sldiv','',S['div'],510,128,660,1)

records = [
    ('🏊','ISS 游泳锦标赛','200米自由泳','银牌 2:05.3','2024-11'),
    ('🏊','校际邀请赛','100米仰泳','金牌 1:02.1','2024-09'),
    ('🏊','区域联赛','200米混合泳','铜牌 2:20.5','2024-06'),
    ('🏊','春季锦标赛','400米自由泳','第4名 4:30.2','2024-04'),
    ('🏊','校内选拔赛','100米自由泳','金牌 55.8s','2024-03'),
]
for i,(em,comp,event,result,date) in enumerate(records):
    ry = 140 + i*72
    c(r,f'sc{i}','',S['card'],510,ry,660,64)
    # Icon circle
    c(r,f'si{i}',em,'ellipse;whiteSpace=wrap;html=1;fillColor=#F0FFF4;strokeColor=#C6F6D5;fontSize=18;',522,ry+12,40,40)
    # Competition name
    c(r,f'sn{i}',comp,'text;html=1;fontSize=13;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#2D3748;',572,ry+6,250,24)
    # Event
    c(r,f'se{i}',event,S['t_sm'],572,ry+30,200,20)
    # Result badge
    medal_color = '#D69E2E' if '金' in result else ('#718096' if '银' in result else ('#A0522D' if '铜' in result else '#718096'))
    medal_bg = '#FFFFF0' if '金' in result else ('#F7FAFC' if '银' in result else ('#FFF5F5' if '铜' in result else '#F7FAFC'))
    c(r,f'sr{i}',result,f'rounded=1;whiteSpace=wrap;html=1;arcSize=40;fillColor={medal_bg};strokeColor=none;fontColor={medal_color};fontSize=12;fontStyle=1;',980,ry+8,170,28)
    # Date
    c(r,f'sd{i}',date,S['t_date'],1020,ry+38,130,18)

# Progress bar at bottom
c(r,'spb','',S['card'],510,510,660,90)
c(r,'spbt','📈 进步轨迹','text;html=1;fontSize=13;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#1A365D;',530,520,200,25)
c(r,'spbd','从入学时的 2:30 → 现在的 2:05，持续进步中','text;html=1;fontSize=12;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#4A5568;',530,548,400,22)
c(r,'spbtag','提升 16.7%',S['tag_g'],980,548,100,24)

# ============================================================
# PAGE 06 - SPORTS DETAIL
# ============================================================
r = mkdiagram(mxfile, 'page_sports_detail', '06-体育详情页')
add_nav(r, 1)

# Left - Match photo
img_ph(r, 30,76,460,600, S['g_green'], S['t_icon_g'], '比赛照片', 'ISS 游泳锦标赛现场')

# Right - Detail
c(r,'sd_title','ISS 游泳锦标赛',S['t_huge'],510,86,400,35)
c(r,'sd_sub','200米自由泳 · 个人项目',S['t_sub'],510,122,400,22)

# Info grid (2 columns)
c(r,'sd_ig','',S['card'],510,155,660,130)
info_items = [('📅 时间','2024年11月15日'),('📍 地点','上海东方体育中心'),('🏊 项目','200米自由泳'),('🏅 成绩','银牌 2:05.3')]
for i,(lb,vl) in enumerate(info_items):
    row,col = i//2, i%2
    ix = 525 + col*330
    iy = 165 + row*55
    c(r,f'sif{i}',lb,f'text;html=1;fontSize=11;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#718096;',ix,iy,200,20)
    c(r,f'siv{i}',vl,f'text;html=1;fontSize=12;fontStyle=0;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#2D3748;',ix,iy+20,200,22)

# Result highlight
c(r,'srh','🥈 银牌  2:05.3','rounded=1;whiteSpace=wrap;html=1;arcSize=8;fillColor=#FFFFF0;strokeColor=#F6E05E;fontColor=#B7791F;fontSize=22;fontStyle=1;align=center;shadow=1;',560,305,560,60)

# Description
c(r,'sdd_l','比赛描述','text;html=1;fontSize=13;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#1A365D;',510,385,200,22)
c(r,'sdd_d','代表学校参加年度 ISS 校际游泳锦标赛，在200米自由泳项目中发挥出色，以2分05秒3的成绩获得银牌。本次比赛汇集了全市多所国际学校的优秀选手。','text;html=1;fontSize=12;align=left;verticalAlign=top;fillColor=none;strokeColor=none;fontColor=#4A5568;',510,410,660,55)

# Progress
c(r,'sp_l','技术进步与提升','text;html=1;fontSize=13;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#1A365D;',510,480,200,22)
c(r,'sp_d','通过改进转身技术和节奏控制，成绩稳步提升。从入学时的 2:30 提升到 2:05。','rounded=1;whiteSpace=wrap;html=1;arcSize=8;fillColor=#F0FFF4;strokeColor=#C6F6D5;fontColor=#38A169;fontSize=12;align=left;spacingLeft=12;spacingRight=12;shadow=1;',510,508,660,55)

# Back
c(r,'skb','',S['btn_s'],510,585,140,36)
c(r,'skbt','← 返回列表','text;html=1;fontSize=12;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#3182CE;',510,585,140,36)

# ============================================================
# PAGE 07 - XIZANG
# ============================================================
r = mkdiagram(mxfile, 'page_xizang', '07-西藏')
add_nav(r, 3)  # Xizang active

# Left - Tibet images
img_ph(r, 30,76,460,600, S['g_red'], S['t_icon_r'], '西藏项目图片', '公益活动 · 教育支持')

# Right - Content
c(r,'xt','西藏公益项目',S['t_huge'],510,86,300,40)
c(r,'xd','参与西藏公益教育项目，为偏远地区学生带去知识和温暖。\n通过教育和文化交流，促进藏区青少年发展，搭建城乡教育桥梁。','text;html=1;fontSize=12;align=left;verticalAlign=top;fillColor=none;strokeColor=none;fontColor=#4A5568;',510,130,660,45)
c(r,'xdiv','',S['div'],510,180,660,1)

# Activities
activities = [
    ('▸ 远程教学计划','为西藏偏远地区中学生提供在线英语和科学辅导','覆盖50名学生 · 累计授课100+小时'),
    ('▸ 物资募集行动','组织校内募集活动，为藏区学校捐赠书籍和文具','募集500+本书籍 · 200套文具'),
    ('▸ 暑期实地考察','前往西藏实地考察教育现状，建立长期合作基地','与当地3所学校建立长期合作关系'),
]
for i,(ti,de,imp) in enumerate(activities):
    ay = 195 + i*110
    c(r,f'xc{i}','',S['card'],510,ay,660,100)
    c(r,f'xci{i}','',f'rounded=1;whiteSpace=wrap;html=1;arcSize=50;fillColor=#E53E3E;strokeColor=none;',510,ay+10,4,80)
    c(r,f'xt{i}',ti,'text;html=1;fontSize=14;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#2D3748;',530,ay+10,300,25)
    c(r,f'xd{i}',de,S['t_body'],530,ay+36,620,20)
    c(r,f'xi{i}','📊 '+imp,S['tag_r'],530,ay+62,400,28)

# Keywords section
c(r,'xkw','关键词','text;html=1;fontSize=12;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#1A365D;',510,530,100,22)
kw = [('影响力','#FFF5F5','#C53030'),('责任感','#FFF5F5','#C53030'),('长期参与','#FFF5F5','#C53030')]
kx=510
for i,(tg,tbg,tc) in enumerate(kw):
    tw=len(tg)*14+24
    c(r,f'xk{i}',tg,f'rounded=1;whiteSpace=wrap;html=1;arcSize=40;fillColor={tbg};strokeColor=none;fontColor={tc};fontSize=12;fontStyle=1;',kx,555,tw,30)
    kx+=tw+12

# Impact numbers
c(r,'xin','',S['card'],510,605,660,60)
c(r,'xin1','50+','text;html=1;fontSize=18;fontStyle=1;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#E53E3E;',540,612,80,25)
c(r,'xin1l','受益学生','text;html=1;fontSize=10;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#718096;',540,636,80,18)
c(r,'xin2','100+','text;html=1;fontSize=18;fontStyle=1;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#E53E3E;',700,612,80,25)
c(r,'xin2l','授课小时','text;html=1;fontSize=10;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#718096;',700,636,80,18)
c(r,'xin3','3所','text;html=1;fontSize=18;fontStyle=1;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#E53E3E;',860,612,80,25)
c(r,'xin3l','合作学校','text;html=1;fontSize=10;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#718096;',860,636,80,18)
c(r,'xin4','3期','text;html=1;fontSize=18;fontStyle=1;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#E53E3E;',1020,612,80,25)
c(r,'xin4l','持续期数','text;html=1;fontSize=10;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#718096;',1020,636,80,18)

# ============================================================
# PAGE 08 - CLUBS
# ============================================================
r = mkdiagram(mxfile, 'page_clubs', '08-社团')
add_nav(r, 4)  # Clubs active

# Left - Club photos
img_ph(r, 30,76,460,600, S['g_gold'], S['t_icon_go'], '社团活动照片', '活动现场 · 团队合作')

# Right - Club cards
c(r,'ct','社团活动',S['t_huge'],510,86,200,40)
c(r,'cdiv','',S['div'],510,128,660,1)

clubs = [
    ('🤖','机器人社团','核心成员 / 技术负责人','负责机器人编程和机械设计，参加 VEX 机器人大赛','活跃','#3182CE','#EBF4FF'),
    ('💡','科技创新社','联合创始人','创建校园科技创新平台，组织黑客松和创新工作坊','活跃','#805AD5','#FAF5FF'),
    ('🤝','社区志愿服务','志愿者','定期参与社区服务活动，包括环保清洁和敬老院探访','活跃','#38A169','#F0FFF4'),
]
for i,(em,nm,role,desc,status,co,bg) in enumerate(clubs):
    cy = 140 + i*160
    c(r,f'cc{i}','',S['card'],510,cy,660,148)
    # Emoji circle
    c(r,f'ce{i}',em,f'ellipse;whiteSpace=wrap;html=1;fillColor={bg};strokeColor=none;fontSize=24;',525,cy+20,50,50)
    # Name
    c(r,f'cn{i}',nm,'text;html=1;fontSize=14;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#2D3748;',590,cy+12,200,25)
    # Role tag
    c(r,f'cr{i}',role,f'rounded=1;whiteSpace=wrap;html=1;arcSize=40;fillColor={bg};strokeColor=none;fontColor={co};fontSize=11;fontStyle=1;',590,cy+40,len(role)*10+20,26)
    # Description
    c(r,f'cd{i}',desc,S['t_body'],590,cy+74,500,20)
    # Status
    status_co = '#38A169' if status=='活跃' else '#A0AEC0'
    c(r,f'cs{i}',f'● {status}',f'text;html=1;fontSize=11;fontStyle=1;align=right;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor={status_co};',1060,cy+12,100,22)

# Ongoing section
c(r,'cog','',S['card'],510,625,660,50)
c(r,'cogt','📢 最新动态','text;html=1;fontSize=12;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#D69E2E;',530,632,150,25)
c(r,'cogd','机器人社团正在进行新学期招新，已吸引30+新成员加入','text;html=1;fontSize=11;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#4A5568;',530,655,600,18)

# ============================================================
# PAGE 09 - ADMIN
# ============================================================
r = mkdiagram(mxfile, 'page_admin', '09-后台管理')

# Page bg
c(r,'abg','',S['page_bg'],0,0,1200,900)

# Sidebar
c(r,'asb','',S['sidebar'],0,0,220,900)
c(r,'asbt','⚙️ 管理面板','text;html=1;fontSize=15;fontStyle=1;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#FFFFFF;',20,15,180,40)
c(r,'asbd','',f'rounded=0;whiteSpace=wrap;html=1;fillColor=#2B4573;strokeColor=none;',20,60,180,1)

sb_items = [('📷 轮播图管理',True),('📰 首页动态',False),('👤 关于我',False),('🏊 体育',False),('📚 学术',False),('🏔️ 西藏',False),('🏛️ 社团',False),('⚙️ 网站设置',False),('🔑 修改密码',False)]
for i,(nm,act) in enumerate(sb_items):
    sty = S['sb_ac'] if act else S['sb_it']
    c(r,f'sb{i}',nm,sty,15,72+i*40,190,35)
    if act:
        c(r,f'sbi{i}','',f'rounded=1;whiteSpace=wrap;html=1;fillColor=#3182CE;strokeColor=none;',15,72+i*40,4,35)

# Logout
c(r,'sblg','🚪 退出登录','text;html=1;fontSize=11;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#A0AEC0;',30,850,160,30)

# Main area
c(r,'ama','',S['page_bg'],230,10,960,880)

# Top bar
c(r,'amh','',S['card'],240,15,940,55)
c(r,'amht','轮播图管理','text;html=1;fontSize=16;fontStyle=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#1A365D;',260,22,200,35)
c(r,'amhs','板块选择:','text;html=1;fontSize=12;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#718096;',700,27,80,25)
c(r,'amhd','首页 ▾',S['input'],790,22,140,32)

# Table
c(r,'atb','',S['card'],240,82,940,730)

# Table header
c(r,'ath','',S['tbl_h'],240,82,940,38)
headers = [('#',260,45),('预览',310,90),('说明文字',410,250),('排序',680,80),('操作',780,200)]
for hnm,hx,hw in headers:
    c(r,f'th_{hx}',hnm,f'text;html=1;fontSize=11;fontStyle=1;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#4A5568;',hx,86,hw,30)

# Table rows
rows = [
    ('1','🖼','探索学术前沿','1'),
    ('2','🖼','泳池中的拼搏','2'),
    ('3','🖼','西藏公益之路','3'),
]
for i,(num,prev,cap,order) in enumerate(rows):
    ry = 125 + i*70
    # Row bg
    bg_c = '#FFFFFF' if i%2==0 else '#F7FAFC'
    c(r,f'tr{i}','',f'rounded=0;whiteSpace=wrap;html=1;fillColor={bg_c};strokeColor=#E2E8F0;',240,ry,940,65)
    # Number
    c(r,f'tn{i}',num,'text;html=1;fontSize=12;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#718096;',260,ry+15,45,35)
    # Preview thumb
    c(r,f'tp{i}','',f'rounded=1;whiteSpace=wrap;html=1;arcSize=4;fillColor=#EBF4FF;strokeColor=#BEE3F8;',325,ry+8,70,50)
    c(r,f'tpi{i}',prev,'text;html=1;fontSize=16;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#3182CE;',345,ry+18,30,30)
    # Caption
    c(r,f'tc{i}',cap,'text;html=1;fontSize=12;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#2D3748;',420,ry+15,240,35)
    # Order
    c(r,f'to{i}',order,'text;html=1;fontSize=12;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#2D3748;',690,ry+15,60,35)
    # Actions
    c(r,f'te{i}','编辑',S['btn_p'],790,ry+18,60,28)
    c(r,f'tdel{i}','删除',S['btn_d'],860,ry+18,60,28)
    # Divider
    if i < 2:
        c(r,f'tld{i}','','rounded=0;whiteSpace=wrap;html=1;fillColor=#E2E8F0;strokeColor=none;',250,ry+65,920,1)

# Add more rows placeholder
for i in range(3,7):
    ry = 125 + i*70
    c(r,f'tr{i}','',f'rounded=0;whiteSpace=wrap;html=1;fillColor=#F7FAFC;strokeColor=#E2E8F0;opacity=50;',240,ry,940,65)
    c(r,f'tn{i}','—','text;html=1;fontSize=12;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#CBD5E0;',260,ry+15,45,35)

# Bottom actions
c(r,'abtn1','+ 添加图片',S['btn_p'],250,770,130,38)
c(r,'abtn2','保存排序',S['btn_g'],395,770,130,38)
c(r,'abtn3','导出数据',S['btn_s'],540,770,120,38)

# Stats card at bottom right
c(r,'ast','',S['card'],830,770,340,38)
c(r,'astt','共 3 张图片  |  已排序','text;html=1;fontSize=11;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontColor=#718096;',850,775,300,28)

# ============================================================
# SAVE FILE
# ============================================================
tree = ET.ElementTree(mxfile)
ET.indent(tree, space='  ')
output_path = '/app/data/所有对话/主对话/owen-portfolio/Owen作品集_高保真原型.drawio'
tree.write(output_path, encoding='UTF-8', xml_declaration=True)
print(f'Saved to: {output_path}')
print('Done!')

