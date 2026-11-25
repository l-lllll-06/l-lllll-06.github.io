'use strict';

// Table of contents on phones and tablets (narrower than the desktop sidebar breakpoint):
// a round button in the bottom-right corner, shown once the reader has scrolled past the
// banner, opens a sheet with the article's headings; the current section is highlighted.
// Markup: src/components/Post.astro (#toc-fab, #toc-sheet). Styles: css/reading.css.
(() => {
  const fab = document.getElementById('toc-fab');
  const sheet = document.getElementById('toc-sheet');
  if (!fab || !sheet) return;
  const links = [...sheet.querySelectorAll('a[href^="#"]')];
  const targets = links.map(a => document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))));
  const board = document.getElementById('board');

  function open() {
    sheet.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('toc-sheet-open');
    highlight();
    const current = sheet.querySelector('.is-current');
    if (current) current.scrollIntoView({ block: 'center' });
    sheet.querySelector('.toc-sheet-close').focus({ preventScroll: true });
  }

  function close(focusButton) {
    sheet.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('toc-sheet-open');
    if (focusButton) fab.focus({ preventScroll: true });
  }

  // The section being read: the last heading above the top fifth of the screen.
  function highlight() {
    const line = window.innerHeight * 0.2;
    let index = -1;
    targets.forEach((el, i) => { if (el && el.getBoundingClientRect().top <= line) index = i; });
    links.forEach((a, i) => a.parentElement.classList.toggle('is-current', i === index));
  }

  function toggleButton() {
    // Shown once the article reaches the navigation bar (i.e. the banner has scrolled away).
    const past = board ? board.getBoundingClientRect().top < 80 : true;
    fab.classList.toggle('is-visible', past);
  }

  fab.addEventListener('click', () => (sheet.hidden ? open() : close()));
  sheet.querySelector('.toc-sheet-close').addEventListener('click', () => close(true));
  links.forEach(a => a.addEventListener('click', () => close()));
  // Tap outside the sheet (on the dimmed page) closes it.
  document.addEventListener('click', event => {
    if (!sheet.hidden && !sheet.contains(event.target) && !fab.contains(event.target)) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !sheet.hidden) close(true);
  });
  window.addEventListener('scroll', () => { toggleButton(); if (!sheet.hidden) highlight(); }, { passive: true });
  toggleButton();
})();
