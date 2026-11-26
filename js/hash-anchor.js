'use strict';

// Arriving at "page/#anchor" (e.g. a cross-article \eqref link): the browser jumps to the
// anchor before images, fonts and formulas have loaded, and the page then grows above it.
// Scroll to the anchor again once the page has settled, leaving room for the navbar.
(() => {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  let userScrolled = false;
  const stop = () => { userScrolled = true; };
  ['wheel', 'touchstart', 'keydown'].forEach(type => window.addEventListener(type, stop, { once: true, passive: true }));

  function settle() {
    const target = document.getElementById(id);
    if (!target || userScrolled) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
  }
  const run = () => {
    settle();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(settle, 50));
    setTimeout(settle, 600); // lazily loaded images
  };
  if (document.readyState === 'complete') run(); else window.addEventListener('load', run, { once: true });
})();
