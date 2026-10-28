// 첫 화면 선물 찾기. window.GIFTS(assets/gifts.js)와 window.GiftMatch(assets/match.js)를 쓴다.
(function () {
  var M = window.GiftMatch;
  var gifts = window.GIFTS || [];
  var form = document.getElementById('finder');
  if (!form) return;

  var KEYS = { relation: 'r', gender: 'g', age: 'a', price: 'p', occasion: 'o' };
  var state = { relation: '', gender: '', age: '', price: '', occasion: defaultOccasion() };

  function defaultOccasion() {
    var now = new Date();
    var m = now.getMonth() + 1, d = now.getDate();
    if ((m === 10 && d >= 20) || (m === 11 && d <= 11)) return 'pepero';
    if ((m === 11 && d > 11) || (m === 12 && d <= 25)) return 'christmas';
    return 'a';
  }

  // 주소의 조건 읽기 (공유 링크)
  var params = new URLSearchParams(location.search);
  Object.keys(KEYS).forEach(function (k) {
    var v = params.get(KEYS[k]);
    if (v !== null) state[k] = v;
  });

  function syncChips() {
    form.querySelectorAll('.chips').forEach(function (group) {
      var key = group.dataset.key;
      group.querySelectorAll('.chip').forEach(function (c) {
        c.setAttribute('aria-pressed', String(c.dataset.value === state[key]));
      });
    });
  }

  form.addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    var key = chip.parentElement.dataset.key;
    state[key] = state[key] === chip.dataset.value && key !== 'occasion' ? '' : chip.dataset.value;
    syncChips();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    render(true);
  });

  var out = document.getElementById('results');
  var title = document.getElementById('results-title');
  var grid = document.getElementById('results-grid');

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function card(g, i) {
    var ph = g.image
      ? '<div class="ph"><img src="' + esc(g.thumb || g.image) + '" alt="' + esc(g.name) + '" loading="lazy" width="480" height="360"></div>'
      : '<div class="ph emoji" aria-hidden="true">' + g.emoji + '</div>';
    return '<article class="card" style="animation-delay:' + (i * 40) + 'ms">' +
      (i < 3 ? '<span class="rank">추천 ' + (i + 1) + '</span>' : '') + ph +
      '<div class="body"><div class="tags"><span class="tag">' + esc(M.LABELS.price[g.price]) + '</span><span class="tag">' +
      esc(M.LABELS.category[g.category] || '') + '</span></div>' +
      '<h3>' + esc(g.name) + '</h3><p>' + esc(g.why) + '</p>' +
      '<a class="buy" href="' + esc(M.linkOf(g)) + '" target="_blank" rel="sponsored noopener">쿠팡에서 가격 보기</a></div></article>';
  }

  function headline() {
    var parts = [];
    if (state.relation) parts.push(M.LABELS.relation[state.relation]);
    if (state.age) parts.push(M.LABELS.age[state.age]);
    if (state.gender) parts.push(state.gender === 'm' ? '남성' : '여성');
    var who = parts.length ? parts.join(' · ') + '에게 ' : '';
    var when = state.occasion && state.occasion !== 'a' ? M.LABELS.occasion[state.occasion] + ' ' : '';
    var budget = state.price ? ' (' + M.LABELS.price[state.price] + ')' : '';
    return who + '줄 ' + when + '선물' + budget;
  }

  function render(scroll) {
    var list = M.recommend(gifts, state, 12);
    out.hidden = false;
    title.textContent = headline();
    grid.innerHTML = list.length
      ? list.map(card).join('')
      : '<p class="empty">조건에 맞는 선물이 없어요. 예산이나 나이를 "상관없음"으로 바꿔 보세요.</p>';

    var q = new URLSearchParams();
    Object.keys(KEYS).forEach(function (k) { if (state[k]) q.set(KEYS[k], state[k]); });
    history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + '#results');
    if (scroll) out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  var share = document.getElementById('share');
  if (share) {
    share.addEventListener('click', function () {
      var url = location.href;
      if (navigator.share) {
        navigator.share({ title: document.title, text: headline() + ' 추천 목록', url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () { toast('링크를 복사했어요'); });
      }
    });
  }

  function toast(msg) {
    var t = document.querySelector('.toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 1800);
  }

  syncChips();
  if (location.search) render(false);
})();
