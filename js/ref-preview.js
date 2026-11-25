'use strict';

// Citation & footnote previews.
//  - Hover (or keyboard focus) on [n] / footnote marks shows the entry in a small card.
//  - On touch screens the first tap opens the card; the card has a link to jump to the entry.
//  - Every reference entry gets "↩" links back to each place it is cited.
(() => {
  const body = document.querySelector('.markdown-body');
  if (!body) return;
  const zh = /^zh/i.test(document.documentElement.lang || '');
  const T = zh
    ? { back: '返回正文引用处', jump: '跳到参考文献', jumpNote: '跳到脚注', jumpEq: '跳到公式', close: '关闭' }
    : { back: 'Back to citation', jump: 'Go to reference', jumpNote: 'Go to footnote', jumpEq: 'Go to equation', close: 'Close' };

  // citations, footnote marks, and \eqref links (plain-text and inside formulas)
  const refSelector = 'a[role="doc-biblioref"], sup.footnote-ref > a, a.eqref, .katex a[href^="#eq-"]';
  const refs = [...body.querySelectorAll(refSelector)];
  if (!refs.length) return;

  // ---- backlinks from reference entries to every citation -------------------
  const byTarget = new Map();
  refs.forEach((a, i) => {
    const id = decodeURIComponent((a.getAttribute('href') || '').slice(1));
    const target = id && document.getElementById(id);
    if (!target) return;
    if (!a.id) a.id = `cite-${i + 1}`;
    if (!byTarget.has(target)) byTarget.set(target, []);
    byTarget.get(target).push(a);
  });
  byTarget.forEach((anchors, target) => {
    if (!target.matches('.csl-entry')) return; // footnotes already have markdown-it backrefs
    const holder = target.querySelector('.csl-right-inline') || target;
    const wrap = document.createElement('span');
    wrap.className = 'ref-backlinks';
    anchors.forEach((a, i) => {
      const back = document.createElement('a');
      back.href = `#${a.id}`;
      back.className = 'ref-backlink';
      back.title = T.back;
      back.setAttribute('aria-label', anchors.length > 1 ? `${T.back} ${i + 1}` : T.back);
      back.textContent = anchors.length > 1 ? `↩︎${String.fromCharCode(97 + (i % 26))}` : '↩︎'; // U+FE0E: text-style arrow, not emoji
      wrap.append(' ', back);
    });
    holder.append(wrap);
  });

  // ---- preview card ----------------------------------------------------------
  const card = document.createElement('div');
  card.className = 'ref-preview';
  card.setAttribute('role', 'tooltip');
  card.id = 'ref-preview';
  card.hidden = true;
  document.body.append(card);

  let current = null;
  let hideTimer = 0;
  let showTimer = 0;
  const touch = window.matchMedia('(hover: none)').matches;

  function contentFor(a) {
    const id = decodeURIComponent((a.getAttribute('href') || '').slice(1));
    const target = id && document.getElementById(id);
    if (!target) return null;
    const clone = target.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    clone.querySelectorAll('.ref-backlinks, .footnote-backref').forEach(el => el.remove());
    const isEq = target.matches('.katex-block');
    const isNote = !isEq && !target.matches('.csl-entry');
    const box = document.createElement('div');
    box.className = 'ref-preview-body' + (isEq ? ' ref-preview-eq' : '');
    box.append(...(isNote || isEq ? clone.childNodes : [clone]));
    const foot = document.createElement('div');
    foot.className = 'ref-preview-foot';
    const jump = document.createElement('a');
    jump.href = `#${id}`;
    const down = target.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING ? '↑' : '↓';
    const eqNumber = isEq ? (target.querySelector('.tag') || {}).textContent || '' : '';
    jump.textContent = `${isEq ? T.jumpEq : isNote ? T.jumpNote : T.jump}${eqNumber ? ' ' + eqNumber : ''} ${down}`;
    jump.addEventListener('click', () => hide(true));
    foot.append(jump);
    const frag = document.createDocumentFragment();
    frag.append(box, foot);
    return frag;
  }

  function place(a) {
    const r = a.getBoundingClientRect();
    const margin = 8;
    card.style.left = '0px';
    card.style.top = '0px';
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    let left = r.left + r.width / 2 - w / 2;
    left = Math.max(margin, Math.min(left, document.documentElement.clientWidth - w - margin));
    const below = r.bottom + margin + h <= window.innerHeight || r.top - margin - h < 70;
    const top = below ? r.bottom + margin : r.top - margin - h;
    card.style.left = `${left + window.scrollX}px`;
    card.style.top = `${top + window.scrollY}px`;
    card.dataset.side = below ? 'below' : 'above';
  }

  function show(a) {
    clearTimeout(hideTimer);
    if (current === a && !card.hidden) return;
    const content = contentFor(a);
    if (!content) return;
    card.replaceChildren(content);
    card.hidden = false;
    current = a;
    a.setAttribute('aria-describedby', card.id);
    place(a);
  }

  function hide(now) {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    const run = () => {
      card.hidden = true;
      if (current) current.removeAttribute('aria-describedby');
      current = null;
    };
    if (now) run(); else hideTimer = setTimeout(run, 180);
  }

  refs.forEach(a => {
    if (!touch) {
      a.addEventListener('mouseenter', () => { clearTimeout(showTimer); showTimer = setTimeout(() => show(a), 120); });
      a.addEventListener('mouseleave', () => { clearTimeout(showTimer); hide(); });
    }
    a.addEventListener('focus', () => show(a));
    a.addEventListener('blur', () => setTimeout(() => { if (!card.contains(document.activeElement)) hide(); }, 0));
    a.addEventListener('click', event => {
      // Touch: first tap previews, the card's link jumps.
      if (touch && current !== a) { event.preventDefault(); show(a); }
    });
  });
  card.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  card.addEventListener('mouseleave', () => hide());
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !card.hidden) { const a = current; hide(true); a && a.focus(); } });
  document.addEventListener('click', e => { if (!card.hidden && !card.contains(e.target) && !e.target.closest(refSelector)) hide(true); });
  window.addEventListener('resize', () => { if (current && !card.hidden) place(current); });
})();
