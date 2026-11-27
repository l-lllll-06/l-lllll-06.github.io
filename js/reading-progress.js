'use strict';

// Collection reading progress, kept only in this browser (localStorage "blog-read").
// An article counts as read once the reader has scrolled to (or past) its end (either
// language version: the key is the article folder). Lists mark read articles with [data-read-key] → .is-read,
// and [data-read-progress="<keys>"] shows "已读 2 / 3" / "2 of 3 read". The article opened last is
// kept too (localStorage "blog-last") for the home page's "继续阅读" button.
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

  // The article opened last (localStorage "blog-last"), for the home page's "继续阅读" button.
  const LAST = 'blog-last';
  const loadLast = () => {
    try { return JSON.parse(localStorage.getItem(LAST)) || null; } catch (e) { return null; }
  };

  // Home page: [data-continue] lists the articles in reading order ({ key, short, title, path }).
  // Its first link becomes "继续阅读：<last opened, unfinished article>", else the first unread
  // article once something has been read, else "重温：<first article>" when everything is read.
  // On a first visit it keeps its server-rendered text ("从力学-1 开始").
  function updateContinue() {
    document.querySelectorAll('[data-continue]').forEach(box => {
      const link = box.querySelector('a');
      let list = [];
      try { list = JSON.parse(box.dataset.continue); } catch (e) { return; }
      if (!link || !list.length) return;
      const read = load();
      const last = loadLast();
      const anyRead = list.some(item => read[item.key]);
      let target = null;
      let kind = 'continue';
      if (last && !read[last.key]) target = list.find(item => item.key === last.key) || null;
      if (!target && anyRead) target = list.find(item => !read[item.key]) || null;
      if (!target && anyRead) { target = list[0]; kind = 'again'; }
      if (!target) return;
      link.href = target.path;
      link.title = target.title;
      link.textContent = kind === 'again'
        ? (zh ? `重温：${target.short}` : `Read again: ${target.short}`)
        : (zh ? `继续阅读：${target.short}` : `Continue: ${target.short}`);
    });
  }

  // Checked on every scroll (not an IntersectionObserver), so jumping past the end with
  // the End key, the contents or a fast fling still counts.
  function watchArticle() {
    const article = document.querySelector('article[data-read-key]');
    const body = article && article.querySelector('.markdown-body');
    if (!body) return;
    const key = article.dataset.readKey;
    try { localStorage.setItem(LAST, JSON.stringify({ key, time: Date.now() })); } catch (e) { /* private mode */ }
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

  const init = () => { decorate(); watchArticle(); updateContinue(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  // Another tab finished an article.
  window.addEventListener('storage', e => {
    if (e.key === STORE) decorate();
    if (e.key === STORE || e.key === LAST) updateContinue();
  });
})();
