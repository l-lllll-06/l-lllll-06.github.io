'use strict';

(() => {
  const background = document.querySelector('#web_bg');
  const banner = document.querySelector('#banner');
  if (!background || !banner) return;
  const image = banner.style.backgroundImage || getComputedStyle(banner).backgroundImage;
  if (!image || image === 'none') return;

  background.style.setProperty('--blog-background-image', image);
  background.classList.add('blog-background-ready');
  banner.style.backgroundImage = 'none';
  const mask = banner.querySelector('.mask');
  if (mask) mask.style.backgroundColor = 'transparent';
})();
