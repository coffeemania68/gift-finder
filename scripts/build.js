// 정적 페이지 생성기. 실행: node scripts/build.js
// 입력: data/gifts.json, scripts/pages.js  →  출력: index.html, 가이드 폴더들/index.html, assets/gifts.js, sitemap.xml
const fs = require('fs');
const path = require('path');
const M = require('../assets/match.js');
const pages = require('./pages.js');

const ROOT = path.join(__dirname, '..');
const BASE = 'https://coffeemania68.github.io/gift-finder/';
const TODAY = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }); // YYYY-MM-DD, 한국 날짜
const FONT = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
const DISCLOSURE = '이 페이지는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.';
// 구글 서치콘솔 HTML 태그 인증값. 받으면 여기에 넣고 다시 빌드한다.
const GOOGLE_VERIFY = '';

const gifts = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/gifts.json'), 'utf8'));
// 기존 images/products 사진은 실제 상품 사진이 아니라서(반려동물 연출 사진) 카드에는 쓰지 않는다.
// 실제 상품 사진을 쓰려면 쿠팡 파트너스에서 받은 이미지 주소를 "image"에 넣고 아래 줄을 지운다.
gifts.forEach((g) => { delete g.image; });

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const write = (rel, text) => {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};

function head({ title, desc, url, prefix, theme, jsonld }) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow,max-image-preview:large">
${GOOGLE_VERIFY ? `<meta name="google-site-verification" content="${GOOGLE_VERIFY}">\n` : ''}<meta property="og:type" content="website">
<meta property="og:site_name" content="선물고민 끝">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${BASE}images/og-${theme === 'pepero' ? 'pepero' : 'christmas'}.png">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${theme === 'pepero' ? '#1a0f0a' : '#0b1712'}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎁</text></svg>">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="${FONT}">
<link rel="stylesheet" href="${prefix}assets/style.css?v=${TODAY}">
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
</head>`;
}

function topbar(prefix, current) {
  const links = [['', '선물 찾기'], ...pages.filter((p) => p.nav).map((p) => [p.slug + '/', p.nav])];
  return `<div class="disclosure">${DISCLOSURE}</div>
<header class="top"><div class="wrap">
  <a class="logo" href="${prefix}">🎁 <span>선물고민 <b>끝</b></span></a>
  <nav aria-label="가이드">${links.map(([href, label]) => `<a href="${prefix}${href}"${href === current ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
</div></header>`;
}

function footer(prefix) {
  return `<footer class="foot"><div class="wrap">
  <p>${DISCLOSURE}</p>
  <p>가격과 재고는 쿠팡에서 수시로 바뀝니다. 구매 전에 상품 페이지에서 최종 가격을 확인하세요.</p>
  <p>문의: <a href="mailto:yourmoments@gmail.com">yourmoments@gmail.com</a> · 마지막 업데이트 ${TODAY}</p>
</div></footer>
<div class="toast" role="status"></div>`;
}

function card(g, i, prefix) {
  const ph = g.image
    ? `<div class="ph"><img src="${prefix}${esc(g.thumb || g.image)}" alt="${esc(g.name)}" loading="lazy" width="480" height="360"></div>`
    : `<div class="ph emoji" aria-hidden="true">${g.emoji}</div>`;
  return `<article class="card" style="animation-delay:${i * 40}ms">${i < 3 ? `<span class="rank">추천 ${i + 1}</span>` : ''}${ph}
<div class="body"><div class="tags"><span class="tag">${esc(M.LABELS.price[g.price])}</span><span class="tag">${esc(M.LABELS.category[g.category] || '')}</span></div>
<h3>${esc(g.name)}</h3><p>${esc(g.why)}</p>
<a class="buy" href="${esc(M.linkOf(g))}" target="_blank" rel="sponsored noopener">쿠팡에서 가격 보기</a></div></article>`;
}

const DDAY_SCRIPT = `<script>
(function(){var el=document.querySelectorAll('[data-dday]');var t=new Date();t.setHours(0,0,0,0);
el.forEach(function(e){var d=new Date(e.dataset.dday+'T00:00:00');var n=Math.round((d-t)/864e5);
e.textContent=n>0?'D-'+n:n===0?'D-DAY':'지났어요';});})();
</script>`;

function sparkles(n) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const left = ((i * 37) % 100).toFixed(0);
    const dur = 6 + ((i * 7) % 8);
    const delay = (i * 1.3) % 8;
    s += `<i style="left:${left}%;animation-duration:${dur}s;animation-delay:-${delay.toFixed(1)}s"></i>`;
  }
  return `<div class="sparkles" aria-hidden="true">${s}</div>`;
}

const ddays = (prefix) => `<div class="dday">
  <a href="${prefix}pepero-day/">🍫 빼빼로데이 11.11 <strong data-dday="2026-11-11"></strong></a>
  <a href="${prefix}christmas/">🎄 크리스마스 12.25 <strong data-dday="2026-12-25"></strong></a>
</div>`;

function guideLinks(slugs, prefix) {
  return `<div class="guides">${slugs
    .map((s) => pages.find((p) => p.slug === s))
    .map((p) => `<a href="${prefix}${p.slug}/"><b>${strip(p.h1)}</b><span>${esc(p.desc.slice(0, 48))}…</span></a>`)
    .join('')}</div>`;
}

// ---------- 가이드 페이지 ----------
const missing = new Set();

pages.forEach((p) => {
  const depth = p.slug.split('/').length;
  const prefix = '../'.repeat(depth);
  const url = BASE + p.slug + '/';
  const list = M.curated(gifts, p.picks, p.query, p.limit);
  (p.picks || []).forEach((id) => { if (!gifts.some((g) => g.id === id)) throw new Error(`${p.slug}: picks에 없는 상품 id ${id}`); });
  list.forEach((g) => { if (!g.link) missing.add(g.id + ' ' + g.name); });

  const crumbs = [{ name: '선물고민 끝', url: BASE }];
  const parts = p.slug.split('/');
  if (parts.length > 1) {
    const parent = pages.find((x) => x.slug === parts[0]);
    crumbs.push({ name: strip(parent.h1), url: BASE + parent.slug + '/' });
  }
  crumbs.push({ name: strip(p.h1), url });

  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })) },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: strip(p.h1), itemListElement: list.map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: g.name })) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }
  ];

  const finderLink = `${prefix}?${new URLSearchParams(Object.entries({ r: p.query.relation, g: p.query.gender, a: p.query.age, p: p.query.price, o: p.query.occasion }).filter(([, v]) => v)).toString()}#results`;

  const html = `${head({ title: p.title, desc: p.desc, url, prefix, theme: p.theme, jsonld })}
<body class="theme-${p.theme}">
${topbar(prefix, p.slug + '/')}
<main>
<section class="hero">${sparkles(18)}<div class="wrap">
  <nav class="crumbs" aria-label="경로">${crumbs.map((c, i) => (i < crumbs.length - 1 ? `<a href="${prefix}${c.url.slice(BASE.length)}">${esc(c.name)}</a> › ` : esc(c.name))).join('')}</nav>
  <p style="margin-top:18px"><span class="eyebrow">${p.eyebrow}</span></p>
  <h1>${p.h1}</h1>
  <p class="lead">${esc(p.lead)}</p>
  ${ddays(prefix)}
</div></section>

<section class="section"><div class="wrap">
  <h2 class="sec-title">추천 선물 ${list.length}가지</h2>
  <p class="sec-sub">위에서부터 많이 고르는 순서예요. 버튼을 누르면 쿠팡에서 현재 가격을 볼 수 있어요.</p>
  <div class="grid">${list.map((g, i) => card(g, i, prefix)).join('\n')}</div>
  <p style="text-align:center;margin-top:24px"><a class="btn ghost" href="${finderLink}">조건 바꿔서 더 찾기 →</a></p>
</div></section>

<section class="section"><div class="wrap article">
  ${p.sections.map((s) => `<h2>${esc(s.h)}</h2><p>${esc(s.p)}</p>`).join('\n  ')}
  <h2>고를 때 팁</h2>
  <ul class="tips">${p.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
  <h2>자주 묻는 질문</h2>
  <div class="faq">${p.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>
</div></section>

<section class="section"><div class="wrap">
  <h2 class="sec-title">다른 선물 가이드</h2>
  <p class="sec-sub">받는 사람이 다르면 여기서 골라 보세요.</p>
  ${guideLinks(p.related, prefix)}
  <div class="cta"><h2>30초 만에 맞춤 추천 받기</h2><p>누구에게, 몇 살, 예산만 고르면 바로 골라 드려요.</p><a class="btn" href="${prefix}">🎁 선물 찾기 시작</a></div>
</div></section>
</main>
${footer(prefix)}
${DDAY_SCRIPT}
</body>
</html>
`;
  write(p.slug + '/index.html', html);
});

// ---------- 첫 화면 (선물 찾기 앱) ----------
const chips = (key, items) => `<div class="chips" data-key="${key}">${items.map(([v, label]) => `<button type="button" class="chip" data-value="${v}" aria-pressed="false">${label}</button>`).join('')}</div>`;

const homeTitle = '선물 추천 | 빼빼로데이·크리스마스 선물 30초 만에 고르기 - 선물고민 끝';
const homeDesc = '누구에게, 몇 살, 예산만 고르면 어울리는 선물을 바로 추천합니다. 2026 빼빼로데이·크리스마스 선물, 연인·부모님·친구·직장동료·아이 선물까지.';
const homeJsonld = [
  { '@context': 'https://schema.org', '@type': 'WebSite', name: '선물고민 끝', url: BASE, inLanguage: 'ko' },
  { '@context': 'https://schema.org', '@type': 'WebApplication', name: '선물고민 끝 - 선물 추천', url: BASE, applicationCategory: 'LifestyleApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' } }
];

const home = `${head({ title: homeTitle, desc: homeDesc, url: BASE, prefix: '', theme: 'christmas', jsonld: homeJsonld })}
<body class="theme-christmas">
${topbar('', '')}
<main>
<section class="hero">${sparkles(24)}<div class="wrap">
  <span class="eyebrow">🎁 2026 연말 선물 시즌</span>
  <h1>선물 고민,<br><em>30초면 끝</em></h1>
  <p class="lead">누구에게 주는지, 몇 살인지, 예산이 얼마인지만 골라 주세요. 어울리는 선물을 순서대로 추천해 드려요.</p>
  ${ddays('')}
</div></section>

<section class="wrap">
<form id="finder" class="finder" aria-label="선물 조건 고르기">
  <div class="q"><h2><span>01</span> 무슨 날인가요?</h2>${chips('occasion', [['pepero', '🍫 빼빼로데이'], ['christmas', '🎄 크리스마스'], ['a', '🎂 생일·기념일']])}</div>
  <div class="q"><h2><span>02</span> 누구에게 주나요?</h2>${chips('relation', [['s', '💝 연인'], ['p', '🧡 부모님·어르신'], ['r', '🤝 친구'], ['w', '🏢 직장동료'], ['k', '🧸 아이·학생'], ['c', '🙏 선생님·거래처']])}</div>
  <div class="q"><h2><span>03</span> 성별 <small>(선택)</small></h2>${chips('gender', [['f', '여성'], ['m', '남성']])}</div>
  <div class="q"><h2><span>04</span> 나이 <small>(선택)</small></h2>${chips('age', Object.entries(M.LABELS.age))}</div>
  <div class="q"><h2><span>05</span> 예산 <small>(선택)</small></h2>${chips('price', Object.entries(M.LABELS.price))}</div>
  <button class="btn block" type="submit">✨ 선물 추천 받기</button>
</form>
</section>

<section id="results" class="section" hidden><div class="wrap">
  <h2 class="sec-title" id="results-title">추천 선물</h2>
  <p class="sec-sub">위에서부터 조건에 잘 맞는 순서예요. <button type="button" id="share" class="chip" style="min-height:0;padding:4px 12px;font-size:13px">🔗 이 목록 공유하기</button></p>
  <div class="grid" id="results-grid"></div>
</div></section>

<section class="section"><div class="wrap">
  <h2 class="sec-title">상황별 선물 가이드</h2>
  <p class="sec-sub">많이 찾는 선물 고민을 받는 사람별로 정리했어요.</p>
  ${guideLinks(pages.map((p) => p.slug), '')}
</div></section>
</main>
${footer('')}
<script src="assets/match.js?v=${TODAY}"></script>
<script src="assets/gifts.js?v=${TODAY}"></script>
<script src="assets/app.js?v=${TODAY}"></script>
${DDAY_SCRIPT}
</body>
</html>
`;
write('index.html', home);
write('assets/gifts.js', '// 자동 생성 파일 (data/gifts.json → node scripts/build.js). 직접 고치지 마세요.\nwindow.GIFTS = ' + JSON.stringify(gifts) + ';\n');

// ---------- sitemap ----------
const urls = [BASE, ...pages.map((p) => BASE + p.slug + '/')];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${u}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}
</urlset>
`);

// ---------- 결과 ----------
console.log(`페이지 ${pages.length + 1}개 생성 (${urls.length}개 URL, sitemap.xml)`);
const allMissing = gifts.filter((g) => !g.link);
console.log(`\n쿠팡 파트너스 링크가 비어 있는 상품: ${allMissing.length}개 (가이드 페이지 노출 ${missing.size}개)`);
console.log('→ 링크가 없으면 쿠팡 검색 페이지로 연결되며 수수료가 붙지 않습니다. data/gifts.json의 "link"를 채우세요.');
allMissing.forEach((g) => console.log(`   #${g.id} ${g.name}  (검색어: ${g.q || g.name})`));
