# 선물고민 끝 (gift-finder)

받는 사람·나이·예산을 고르면 선물을 추천하는 정적 사이트. GitHub Pages: https://coffeemania68.github.io/gift-finder/

## 고치는 법
상품 이름·쿠팡 링크는 스레드 자동발행 앱(localhost:8787)의 **🎁 내 사이트 상품** 화면에서 쿠팡 검색으로 바로 넣는 게 제일 쉽다.
`data/` 파일이 바뀌면 `.github/workflows/build.yml`이 빌드까지 해서 올린다 (2~3분). GitHub 웹에서 직접 고쳐도 똑같다.

1. 상품: `data/gifts.json`
   - `link`: 쿠팡 파트너스 링크 (`https://link.coupang.com/a/...`). **비어 있으면 쿠팡 검색 페이지로 연결되고 수수료가 붙지 않는다.**
   - `q`: 쿠팡 파트너스에서 링크를 만들 때 검색할 상품명
   - `relation`: s 연인 / p 부모님 / r 친구 / w 직장동료 / k 아이 / c 선생님·거래처
   - `age`: b 아기 / k 어린이 / t 10대 / y 20대 / d 30~40대 / s 50대+ (`"a"` = 전체)
   - `occasion`: pepero / christmas / a(생일·기념일)
2. 가이드 글: `scripts/pages.js` (제목, 설명, 본문, FAQ, `picks` = 노출 순서)
3. 빌드: `node scripts/build.js` → `index.html`, 가이드 폴더, `assets/gifts.js`, `sitemap.xml` 다시 생성. 링크 없는 상품 목록도 출력한다.
4. 커밋·푸시하면 Pages에 반영된다.

## 파일
- `assets/match.js` 추천 점수 계산 (브라우저·빌드 공용)
- `assets/app.js` 첫 화면 선물 찾기
- `assets/style.css` 디자인
- `scripts/og.html` 공유 미리보기 이미지 원본 (`images/og-*.png`)
- `results.html` 옛 주소 → 첫 화면으로 이동
