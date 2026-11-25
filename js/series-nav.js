'use strict';

// Opens the collection panel (#collection-panel, built by scripts/series.js) under the
// chip in the post header. The panel lives at the end of <body> so the banner's
// overflow:hidden cannot clip it; it is positioned in page coordinates.
// The panel is inserted just before </body>, after Fluid's custom scripts, so wait for the DOM.
const initCollectionNav = () => {
  const chip = document.querySelector('.collection-chip');
  const panel = document.getElementById('collection-panel');
  if (!chip || !panel) return;

  function place() {
    const r = chip.getBoundingClientRect();
    const margin = 8;
    panel.style.left = '0px';
    const width = panel.offsetWidth;
    let left = r.left + r.width / 2 - width / 2;
    left = Math.max(margin, Math.min(left, document.documentElement.clientWidth - width - margin));
    panel.style.left = `${left + window.scrollX}px`;
    panel.style.top = `${r.bottom + margin + window.scrollY}px`;
  }

  function open() {
    panel.hidden = false;
    chip.setAttribute('aria-expanded', 'true');
    place();
    const current = panel.querySelector('.series-current');
    if (current && current.scrollIntoView) current.scrollIntoView({ block: 'nearest' });
  }

  function close(focusChip) {
    panel.hidden = true;
    chip.setAttribute('aria-expanded', 'false');
    if (focusChip) chip.focus();
  }

  chip.addEventListener('click', event => {
    event.stopPropagation();
    if (panel.hidden) open(); else close();
  });
  document.addEventListener('click', event => {
    if (!panel.hidden && !panel.contains(event.target)) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) close(true);
  });
  window.addEventListener('resize', () => { if (!panel.hidden) place(); });
  // The banner moves with Fluid's parallax effect; keep the panel attached to the chip.
  window.addEventListener('scroll', () => { if (!panel.hidden) place(); }, { passive: true });
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCollectionNav);
else initCollectionNav();
