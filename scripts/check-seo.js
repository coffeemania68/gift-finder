// 페이지별 제목·설명 길이와 구조화 데이터(JSON-LD) 검사. 실행: node scripts/check-seo.js
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const files = ['index.html', ...require('./pages.js').map((p) => p.slug + '/index.html')];
let problems = 0;
for (const f of files) {
  const h = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const title = (h.match(/<title>([^<]+)/) || [])[1] || '';
  const desc = (h.match(/name="description" content="([^"]+)/) || [])[1] || '';
  const canon = (h.match(/rel="canonical" href="([^"]+)/) || [])[1] || '';
  const h1 = (h.match(/<h1>/g) || []).length;
  let types = [];
  try {
    types = [...h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1])['@type']);
  } catch (e) {
    problems++;
    console.log('JSON-LD 오류', f, e.message);
  }
  if (!title || !desc || !canon || h1 !== 1) problems++;
  console.log(`${f.padEnd(34)} 제목 ${title.length}자 · 설명 ${desc.length}자 · h1 ${h1}개 · ${types.join(', ')}`);
}
console.log(`문제 ${problems}개`);
process.exitCode = problems ? 1 : 0;
