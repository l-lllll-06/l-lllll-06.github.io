'use strict';

// Margin notes on wide screens: each citation [n] and footnote mark gets its reference entry /
// footnote text in the left margin, level with the line it is cited on (notes that would
// overlap are pushed down). Below the width set in css/reading.css (`--sidenotes-min`)
// the notes are hidden and js/ref-preview.js shows its hover cards as before.
// The column is rendered by src/components/Post.astro for articles with citations or footnotes.
(() => {
  const column = document.querySelector('.has-sidenotes .sidenotes');
  const body = document.querySelector('.markdown-body');
  if (!column || !body) return;
  const root = document.documentElement;
  const wide = window.matchMedia('(min-width: 1200px)');
  const GAP = 10;

  // One note per citation (all its sources) or footnote mark.
  const marks = [...body.querySelectorAll('span.citation, sup.footnote-ref')]
    .filter(mark => !mark.closest('.physics-references, .footnotes'));
  const notes = [];
  for (const mark of marks) {
    const links = [...mark.querySelectorAll('a[href^="#"]')];
    const note = document.createElement('div');
    note.className = 'sidenote';
    for (const link of links) {
      const target = document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)));
      if (!target) continue;
      const clone = target.cloneNode(true);
      clone.removeAttribute('id');
      clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
      clone.querySelectorAll('.ref-backlinks, .footnote-backref').forEach(el => el.remove());
      const item = document.createElement('div');
      item.className = 'sidenote-item';
      if (target.matches('.csl-entry')) {
        item.append(...clone.childNodes);
      } else {
        // footnote: number + text
        const number = document.createElement('span');
        number.className = 'sidenote-number';
        number.textContent = link.textContent.replace(/[\[\]]/g, '');
        item.append(number, ...clone.childNodes);
      }
      note.append(item);
    }
    if (!note.childNodes.length) continue;
    column.append(note);
    notes.push({ mark, note });

    // Hovering either side highlights the pair.
    const on = () => { mark.classList.add('sidenote-hover'); note.classList.add('sidenote-hover'); };
    const off = () => { mark.classList.remove('sidenote-hover'); note.classList.remove('sidenote-hover'); };
    for (const el of [mark, note]) {
      el.addEventListener('mouseenter', on);
      el.addEventListener('mouseleave', off);
    }
  }
  if (!notes.length) return;

  let frame = 0;
  function layout() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const active = wide.matches;
      root.classList.toggle('sidenotes-on', active);
      if (!active) return;
      const base = column.getBoundingClientRect().top;
      let bottom = -Infinity;
      for (const { mark, note } of notes) {
        const top = Math.max(mark.getBoundingClientRect().top - base - 4, bottom + GAP);
        note.style.top = `${top}px`;
        bottom = top + note.offsetHeight;
      }
    });
  }

  layout();
  wide.addEventListener('change', layout);
  window.addEventListener('resize', layout);
  window.addEventListener('load', layout);
  if (document.fonts) document.fonts.ready.then(layout);
  if (window.ResizeObserver) new ResizeObserver(layout).observe(body);
})();
