// Keyon's AI Frontier — renderer
const SECTIONS = [
  { id: 'hot',       icon: '▲', name: '全球热榜',   kind: 'hot' },
  { id: 'keyon',     icon: '→', name: 'Keyon 关联', kind: 'keyon' },
  { id: 'oss',       icon: '◎', name: '开源热项',   kind: 'list' },
  { id: 'voices',    icon: '◆', name: '大佬说',     kind: 'list' },
  { id: 'industry',  icon: '○', name: '行业动态',   kind: 'list' },
  { id: 'research',  icon: '◇', name: '前沿研究',   kind: 'list' },
  { id: 'china',     icon: '◉', name: '国内速递',   kind: 'list' },
  { id: 'archive',   icon: '⌖', name: '最近 7 日',  kind: 'anchor' },
];

const TAG_COLOR = {
  '开源':'blue','研究':'violet','行业':'amber','观点':'rose','国内':'cyan','工程':'emerald',
  'A2A协作':'violet','Agent自进化':'emerald','Agentic架构':'amber','Harness工程':'rose',
  'LLM':'stone','多模态':'cyan','RAG':'stone','评测':'stone','安全':'stone','工具调用':'stone',
};

const state = { current: null, manifest: null, today: null };

function fmtDate(d) {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function zhDate(s) {
  const d = new Date(s + 'T00:00:00');
  const wk = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][d.getDay()];
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ${wk}`;
}

async function loadManifest() {
  const res = await fetch('./data/manifest.json', {cache:'no-store'});
  return res.json();
}
async function loadDay(date) {
  const res = await fetch(`./data/daily/${date}.json`, {cache:'no-store'});
  if (!res.ok) throw new Error('no data for ' + date);
  return res.json();
}

function renderSidenav(data) {
  const nav = document.getElementById('sidenav');
  const mob = document.getElementById('mobile-tabs');
  nav.innerHTML = ''; mob.innerHTML = '';
  SECTIONS.forEach((s, i) => {
    const cnt = countOf(data, s);
    // sidenav
    const btn = document.createElement('a');
    btn.href = '#' + s.id;
    btn.className = 'w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 text-left group text-[#5A5A56] hover:bg-[#F0EFE8] hover:text-[#1A1A18]';
    btn.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-[12px] leading-none opacity-40">${s.icon}</span>
        <span class="text-[12px] font-medium">${s.name}</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="text-[10px] font-mono text-[#9A9A94]">${cnt}</span>
        <kbd class="text-[9px] border rounded px-1 hidden group-hover:inline border-[#E8E8E4] text-[#9A9A94]">${i+1}</kbd>
      </div>`;
    nav.appendChild(btn);
    // mobile
    const mb = document.createElement('a');
    mb.href = '#' + s.id;
    mb.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150 shrink-0 text-[#5A5A56] hover:bg-[#F0EFE8]';
    mb.innerHTML = `${s.name}<span class="text-[10px] opacity-60">${cnt}</span>`;
    mob.appendChild(mb);
  });
}
function countOf(data, s) {
  if (s.kind === 'hot') return (data.hot||[]).length;
  if (s.kind === 'keyon') return (data.keyon||[]).reduce((a,c)=>a+(c.items||[]).length,0);
  if (s.kind === 'list') return (data[s.id]||[]).length;
  if (s.kind === 'anchor') return state.manifest ? state.manifest.dates.length : 7;
  return 0;
}

function renderInsight(d) {
  const box = document.getElementById('insight');
  if (!d.insight) { box.style.display='none'; return; }
  box.style.display='';
  box.innerHTML = `
    <div class="flex items-center gap-2 mb-3">
      <div class="w-5 h-5 rounded-lg bg-amber-400 flex items-center justify-center"><span class="text-[9px] font-bold text-white">✦</span></div>
      <span class="text-[13px] font-semibold text-[#1A1A18]">今日洞见</span>
      <span class="text-[11px] text-[#9A9A94] ml-1">· by ${d.insight.author || 'Claude'}</span>
    </div>
    <div class="insight text-[14px] text-[#5A5A56] leading-[1.85]">${d.insight.html}</div>`;
}

function renderSections(d) {
  const root = document.getElementById('sections');
  root.innerHTML = '';
  root.appendChild(secHot(d));
  root.appendChild(secKeyon(d));
  ['oss','voices','industry','research','china'].forEach(k => root.appendChild(secList(k, d)));
}

function sectionHeader(icon, name, subtitle) {
  const div = document.createElement('div');
  div.className = 'flex items-center gap-3 mb-5';
  div.innerHTML = `
    <span class="text-[15px] leading-none text-[#9A9A94]">${icon}</span>
    <h2 class="text-[15px] font-semibold text-[#1A1A18] tracking-tight shrink-0">${name}</h2>
    <div class="flex-1 h-[1px] bg-[#EFEFEC]"></div>
    ${subtitle ? `<span class="text-[11px] text-[#9A9A94] shrink-0 bg-[#F5F5F2] border border-[#EFEFEC] px-2 py-0.5 rounded-full">${subtitle}</span>` : ''}`;
  return div;
}

function tagPill(t) {
  const c = TAG_COLOR[t] || 'stone';
  return `<span class="tag tag-${c}">${t}</span>`;
}

function secHot(d) {
  const sec = document.createElement('section');
  sec.id = 'hot'; sec.className = 'scroll-mt-28 mb-10';
  sec.appendChild(sectionHeader('▲','全球热榜','按影响力排序'));
  const grid = document.createElement('div');
  grid.className = 'grid gap-4 sm:grid-cols-2';
  (d.hot||[]).forEach((it, idx) => {
    const rankColor = idx===0?'text-amber-500':idx===1?'text-stone-400':idx===2?'text-orange-400':'text-stone-300';
    const card = document.createElement('div');
    card.className = 'card group relative';
    const pct = Math.round(((it.score||5)/10)*100);
    card.innerHTML = `
      <div class="p-5">
        <div class="flex items-center gap-2 mb-2.5">
          <span class="text-[20px] font-bold font-mono shrink-0 leading-none tabular-nums ${rankColor}">${String(idx+1).padStart(2,'0')}</span>
          <div class="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">${(it.tags||[]).map(tagPill).join('')}</div>
          <div class="flex items-center gap-1.5 shrink-0" title="重要度 ${it.score||'-'}/10">
            <div class="w-14 h-1 rounded-full bg-stone-100 overflow-hidden"><div class="h-full bg-rose-400" style="width:${pct}%"></div></div>
            <span class="text-[10px] font-mono text-[#9A9A94]">${it.score||'-'}</span>
          </div>
        </div>
        <a href="${it.url}" target="_blank" rel="noopener noreferrer" class="block text-[15px] font-semibold text-[#1A1A18] hover:text-blue-600 transition-colors leading-snug mb-2">${it.title}</a>
        <p class="text-[13px] text-[#5A5A56] leading-relaxed mb-3">${it.summary||''}</p>
        ${it.keyon ? `<div class="rounded-xl bg-emerald-50/60 border border-emerald-100 px-3 py-2 mb-3"><p class="text-[12px] text-emerald-700 leading-relaxed">→ ${it.keyon}</p></div>`:''}
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-[11px] text-[#9A9A94]">${it.source||''}</span>
            ${(it.badges||[]).map(b=>`<span class="text-[10px] px-2 py-0.5 bg-[#F5F5F2] border border-[#EFEFEC] rounded text-[#5A5A56] font-mono">${b}</span>`).join('')}
          </div>
          <a href="${it.url}" target="_blank" rel="noopener noreferrer" class="text-[11px] text-blue-500 hover:text-blue-700">原文 ↗</a>
        </div>
      </div>`;
    grid.appendChild(card);
  });
  sec.appendChild(grid);
  return sec;
}

function secKeyon(d) {
  const sec = document.createElement('section');
  sec.id = 'keyon'; sec.className = 'scroll-mt-28 mb-10';
  sec.appendChild(sectionHeader('→','Keyon 关联','结合 agent 自进化 / A2A / agentic 架构 / harness 工程'));
  const grid = document.createElement('div');
  grid.className = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4';
  (d.keyon||[]).forEach(col => {
    const c = document.createElement('div');
    c.className = 'card p-4';
    c.innerHTML = `
      <div class="flex items-center gap-2 mb-3 pb-2.5 border-b border-[#EFEFEC]">
        <span class="dot dot-${col.color||'emerald'}"></span>
        <span class="text-[13px] font-semibold text-[#1A1A18]">${col.topic}</span>
        <span class="text-[11px] text-[#9A9A94] ml-auto">${(col.items||[]).length}</span>
      </div>
      <div class="flex flex-col gap-3">
        ${(col.items||[]).map(it => `
          <div>
            <a href="${it.url}" target="_blank" rel="noopener noreferrer" class="block text-[13px] font-medium text-[#1A1A18] hover:text-blue-600 leading-snug mb-1 transition-colors">${it.title}</a>
            <p class="text-[12px] text-emerald-600 leading-relaxed">→ ${it.comment}</p>
            <p class="text-[11px] text-[#9A9A94] mt-1">${it.source||''}</p>
          </div>`).join('')}
      </div>`;
    grid.appendChild(c);
  });
  sec.appendChild(grid);
  return sec;
}

const SEC_META = {
  oss:      {icon:'◎', name:'开源热项'},
  voices:   {icon:'◆', name:'大佬说'},
  industry: {icon:'○', name:'行业动态'},
  research: {icon:'◇', name:'前沿研究'},
  china:    {icon:'◉', name:'国内速递'},
};
function secList(key, d) {
  const meta = SEC_META[key];
  const sec = document.createElement('section');
  sec.id = key; sec.className = 'scroll-mt-28 mb-10';
  sec.appendChild(sectionHeader(meta.icon, meta.name));
  const list = document.createElement('div');
  list.className = 'grid gap-3 sm:grid-cols-2';
  (d[key]||[]).forEach(it => {
    const card = document.createElement('div');
    card.className = 'card p-4';
    card.innerHTML = `
      <div class="flex items-center gap-1.5 flex-wrap mb-2">${(it.tags||[]).map(tagPill).join('')}</div>
      <a href="${it.url}" target="_blank" rel="noopener noreferrer" class="block text-[14px] font-semibold text-[#1A1A18] hover:text-blue-600 leading-snug mb-1.5 transition-colors">${it.title}</a>
      <p class="text-[12.5px] text-[#5A5A56] leading-relaxed mb-2">${it.summary||''}</p>
      <div class="flex items-center justify-between">
        <span class="text-[11px] text-[#9A9A94]">${it.source||''}</span>
        <a href="${it.url}" target="_blank" rel="noopener noreferrer" class="text-[11px] text-blue-500 hover:text-blue-700">原文 ↗</a>
      </div>`;
    list.appendChild(card);
  });
  sec.appendChild(list);
  return sec;
}

function renderArchive() {
  const wrap = document.getElementById('archive-tabs');
  wrap.innerHTML = '';
  (state.manifest.dates||[]).forEach(entry => {
    const pill = document.createElement('button');
    pill.className = 'archive-pill' + (entry.date === state.current ? ' active':'');
    const d = new Date(entry.date+'T00:00:00');
    const wk = ['日','一','二','三','四','五','六'][d.getDay()];
    pill.innerHTML = `<span>${d.getMonth()+1}/${d.getDate()} 周${wk}</span><span class="cnt">${entry.count||''}</span>`;
    pill.onclick = () => switchDate(entry.date);
    wrap.appendChild(pill);
  });
}

async function switchDate(date) {
  try {
    const data = await loadDay(date);
    state.current = date; state.today = data;
    document.getElementById('hdr-date').textContent = zhDate(date);
    document.getElementById('sub-meta').textContent = `${zhDate(date)} · 共 ${total(data)} 条`;
    renderArchive();
    renderSidenav(data);
    renderInsight(data);
    renderSections(data);
    applyFilter('');
  } catch(e) {
    console.error(e);
  }
}
function total(d) {
  return (d.hot||[]).length + (d.keyon||[]).reduce((a,c)=>a+(c.items||[]).length,0) +
    ['oss','voices','industry','research','china'].reduce((a,k)=>a+(d[k]||[]).length,0);
}

function applyFilter(q) {
  q = (q||'').trim().toLowerCase();
  const cards = document.querySelectorAll('#sections .card');
  cards.forEach(c => {
    const t = c.textContent.toLowerCase();
    c.style.display = !q || t.includes(q) ? '' : 'none';
  });
}

document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') {
    if (e.key === 'Escape') { e.target.value=''; applyFilter(''); e.target.blur(); }
    return;
  }
  if (e.key === '/') { e.preventDefault(); document.getElementById('search-input').focus(); }
  else if (e.key === 'j') window.scrollBy({top:200, behavior:'smooth'});
  else if (e.key === 'k') window.scrollBy({top:-200, behavior:'smooth'});
  else if (/^[1-8]$/.test(e.key)) {
    const s = SECTIONS[parseInt(e.key,10)-1];
    if (s) { const el = document.getElementById(s.id); if (el) el.scrollIntoView({behavior:'smooth', block:'start'}); }
  }
});
document.getElementById('search-input').addEventListener('input', e => applyFilter(e.target.value));

(async function init() {
  document.getElementById('year').textContent = new Date().getFullYear();
  state.manifest = await loadManifest();
  const today = state.manifest.dates[0]?.date || fmtDate(new Date());
  await switchDate(today);
})();
