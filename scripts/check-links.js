// 내부 링크 검사. 실행: node scripts/check-links.js
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const files = ['index.html', ...require('./pages.js').map((p) => p.slug + '/index.html')];
let bad = 0;
let n = 0;
for (const f of files) {
  const h = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const title = (h.match(/<title>([^<]+)/) || [])[1];
  for (const m of h.matchAll(/(?:href|src)="([^"]+)"/g)) {
    let u = m[1];
    if (/^(https?:|mailto:|data:)/.test(u)) continue;
    u = u.split(/[?#]/)[0];
    let p = path.join(ROOT, path.dirname(f), u);
    if (u === '' || u.endsWith('/') || /(^|\/)\.\.?$/.test(u)) p = path.join(p, 'index.html');
    n++;
    if (!fs.existsSync(p)) { bad++; console.log('BAD', f, m[1]); }
  }
  console.log(f.padEnd(34), title);
}
console.log(`내부 링크 ${n}개, 깨진 링크 ${bad}개`);
process.exitCode = bad ? 1 : 0;
