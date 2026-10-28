// 선물 추천 점수 계산. 브라우저(window.GiftMatch)와 빌드 스크립트(require) 양쪽에서 쓴다.
(function (root) {
  var PRICE_ORDER = ['1m', '3m', '5m', '10m', '20m', 'under50', 'over50'];

  var LABELS = {
    price: { '1m': '1만원대', '3m': '3만원대', '5m': '5만원대', '10m': '10만원대', '20m': '20만원대', under50: '30~50만원', over50: '50만원 이상' },
    relation: { s: '연인', p: '부모님·어르신', r: '친구', w: '직장동료', k: '아이·학생', c: '선생님·거래처' },
    age: { b: '아기(0~3세)', k: '어린이(4~13세)', t: '10대', y: '20대', d: '30~40대', s: '50대 이상' },
    occasion: { pepero: '빼빼로데이', christmas: '크리스마스', a: '생일·기념일' },
    category: { digital: '디지털', health: '건강', pet: '반려동물', fashion: '패션', beauty: '뷰티', living: '리빙', food: '먹거리', kids: '키즈' }
  };

  function has(field, value) {
    if (field === undefined || field === 'a') return true;
    return Array.isArray(field) ? field.indexOf(value) !== -1 : field === value;
  }

  function priceGap(a, b) {
    return Math.abs(PRICE_ORDER.indexOf(a) - PRICE_ORDER.indexOf(b));
  }

  // q: { relation, gender('m'|'f'|''), age, price, occasion }  빈 값은 "상관없음"
  function score(g, q) {
    if (q.gender && g.gender !== 'a' && g.gender !== q.gender) return -1;
    if (q.price && priceGap(g.price, q.price) > 1) return -1;
    if (q.age && !has(g.age, q.age)) return -1;
    if (q.occasion === 'pepero' && g.occasion.indexOf('pepero') === -1 && g.price !== '1m' && g.price !== '3m') return -1;
    // 빼빼로데이 전용 상품(빼빼로 세트 등)은 다른 날 추천에서 뺀다
    if (q.occasion && q.occasion !== 'pepero' && g.occasion.length === 1 && g.occasion[0] === 'pepero') return -1;

    if (q.relation && !has(g.relation, q.relation)) return -1;

    var s = 0;
    if (q.relation) s += 5;
    if (q.price) s += g.price === q.price ? 5 : 1;
    if (q.age && Array.isArray(g.age)) s += 2;
    if (q.gender && g.gender === q.gender) s += 1;
    if (q.occasion) {
      if (g.occasion.indexOf(q.occasion) !== -1) s += 4;
      else if (q.occasion === 'a' && g.occasion.indexOf('a') !== -1) s += 4;
    }
    if (g.season === 'summer' && q.occasion !== 'a') s -= 6;
    // 반려동물 용품은 받는 사람이 반려인일 때만 의미가 있어서 일반 추천에서는 뒤로 민다
    if (g.category === 'pet') s -= 6;
    return s;
  }

  // 점수 순으로 고르되, 같은 분야가 몰리지 않게 이미 뽑힌 분야는 조금씩 감점한다
  function diversify(items, limit) {
    var pool = items.slice();
    var picked = [];
    var count = {};
    while (pool.length && picked.length < limit) {
      var best = 0;
      var bestVal = -Infinity;
      for (var i = 0; i < pool.length; i++) {
        var v = pool[i].s - 1.5 * (count[pool[i].g.category] || 0);
        if (v > bestVal) { bestVal = v; best = i; }
      }
      var x = pool.splice(best, 1)[0];
      count[x.g.category] = (count[x.g.category] || 0) + 1;
      picked.push(x.g);
    }
    return picked;
  }

  function recommend(gifts, q, limit) {
    limit = limit || 12;
    var ranked = gifts
      .map(function (g) { return { g: g, s: score(g, q) }; })
      .filter(function (x) { return x.s >= 0; })
      .sort(function (a, b) { return b.s - a.s || b.g.id - a.g.id; });
    if (ranked.length < 3) {
      // 조건이 너무 좁으면 예산 → 나이 순서로 풀고 다시 찾는다
      if (q.price) return recommend(gifts, Object.assign({}, q, { price: '' }), limit);
      // 나이는 안 맞으면 엉뚱한 추천(아기에게 헤드폰)이 되므로 하나도 없을 때만 푼다
      if (q.age && ranked.length === 0) return recommend(gifts, Object.assign({}, q, { age: '' }), limit);
    }
    return diversify(ranked, limit);
  }

  // 가이드 페이지용: 직접 고른 순서(picks)를 먼저 두고, 남는 자리는 추천으로 채운다
  function curated(gifts, picks, q, limit) {
    var byId = {};
    gifts.forEach(function (g) { byId[g.id] = g; });
    var list = (picks || []).map(function (id) { return byId[id]; }).filter(Boolean);
    if (list.length < limit) {
      recommend(gifts, q, limit + list.length).forEach(function (g) {
        if (list.length < limit && list.indexOf(g) === -1) list.push(g);
      });
    }
    return list.slice(0, limit);
  }

  function linkOf(g) {
    if (g.link) return g.link;
    return 'https://www.coupang.com/np/search?q=' + encodeURIComponent(g.q || g.name);
  }

  var api = { PRICE_ORDER: PRICE_ORDER, LABELS: LABELS, has: has, score: score, recommend: recommend, curated: curated, linkOf: linkOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GiftMatch = api;
})(this);
