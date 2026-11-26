'use strict';

// Collection reading progress, kept only in this browser (localStorage "blog-read").
// An article counts as read once the reader has scrolled to (or past) its end (either
// language version: the key is the article folder). Lists mark read articles with [data-read-key] → .is-read,
// and [data-read-progress="<keys>"] shows "已读 2 / 3" / "2 of 3 read".
(() => {
  const STORE = 'blog-read';
  const zh = /^zh/i.test(document.documentElement.lang || '');
  const label = (n, total) => (zh ? `已读 ${n} / ${total}` : `${n} of ${total} read`);

  const load = () => {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; }
  };
  const save = read => {
    try { localStorage.setItem(STORE, JSON.stringify(read)); } catch (e) { /* private mode */ }
  };

  function decorate() {
    const read = load();
    document.querySelectorAll('[data-read-key]').forEach(el => {
      if (el.matches('article')) return;
      const done = Boolean(read[el.dataset.readKey]);
      el.classList.toggle('is-read', done);
      if (done) el.title = zh ? '已读' : 'Read'; else el.removeAttribute('title');
    });
    document.querySelectorAll('[data-read-progress]').forEach(el => {
      const keys = el.dataset.readProgress.split(/\s+/).filter(Boolean);
      const n = keys.filter(k => read[k]).length;
      el.hidden = false;
      el.textContent = label(n, keys.length);
      el.classList.toggle('is-complete', n === keys.length);
    });
  }

  // Checked on every scroll (not an IntersectionObserver), so jumping past the end with
  // the End key, the contents or a fast fling still counts.
  function watchArticle() {
    const article = document.querySelector('article[data-read-key]');
    const body = article && article.querySelector('.markdown-body');
    if (!body) return;
    const key = article.dataset.readKey;
    if (load()[key]) return;
    const check = () => {
      if (body.getBoundingClientRect().bottom > window.innerHeight || window.innerHeight === 0) return;
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
      const read = load();
      read[key] = Date.now();
      save(read);
      decorate();
    };
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    check();
  }

  const init = () => { decorate(); watchArticle(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  // Another tab finished an article.
  window.addEventListener('storage', e => { if (e.key === STORE) decorate(); });
})();
