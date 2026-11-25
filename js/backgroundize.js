'use strict';

// Moves the post/page banner image to the fixed full-page background (#web_bg).
// The banner's own inline background-image is left untouched, because Fluid reads it
// (events.js registerImageLoadedEvent parses url(...) from it); the banner is hidden
// with a class instead (see css/mobile-background.css: #banner.blog-banner-moved).
(() => {
  const background = document.querySelector('#web_bg');
  const banner = document.querySelector('#banner');
  if (!background || !banner) return;
  const image = banner.style.backgroundImage || getComputedStyle(banner).backgroundImage;
  if (!image || image === 'none') return;

  background.style.setProperty('--blog-background-image', image);
  background.classList.add('blog-background-ready');
  banner.classList.add('blog-banner-moved');
  const mask = banner.querySelector('.mask');
  if (mask) mask.style.backgroundColor = 'transparent';
})();
