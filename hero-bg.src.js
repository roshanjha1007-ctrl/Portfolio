import { background, swell } from 'asciify-engine/kit';

const host = document.getElementById('hero-bg');
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (host && !reduceMotion) {
  // Keep the waves quiet right behind the hero text, buttons and portrait.
  let rects = [], dirty = true;
  const range = document.createRange();
  const read = () => {
    if (!dirty) return rects;
    dirty = false;
    rects = [...document.querySelectorAll('.hero h1, .hero .tag p')].flatMap(el => { range.selectNodeContents(el); return [...range.getClientRects()]; });
    rects.push(...[...document.querySelectorAll('.hero .links a, .hero-actions > *, #portrait-backdrop')].map(el => el.getBoundingClientRect()));
    return rects;
  };
  let markTimer = null;
  const mark = () => {
    if (!markTimer) {
      markTimer = setTimeout(() => {
        dirty = true;
        markTimer = null;
      }, 150);
    }
  };
  addEventListener('scroll', mark, { passive: true, capture: true });
  addEventListener('resize', mark);
  new ResizeObserver(mark).observe(document.body);
  document.fonts?.addEventListener('loadingdone', mark);

  let bg = background(host, {
    preset: swell,
    mark: 'glyph',            // characters instead of dots
    clear: read, clearPadding: 6, clearSoftness: 30,
    palette: { light: '#A855F7', dark: '#E879F9' },
    opacity: 0.34,
  });

  const syncTheme = () => {
    bg?.destroy();
    bg = background(host, {
      preset: swell,
      mark: 'glyph',
      clear: read, clearPadding: 6, clearSoftness: 30,
      palette: { light: '#A855F7', dark: '#E879F9' },
      opacity: 0.34,
    });
  };

  window.addEventListener('themechange', syncTheme);
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener?.('change', syncTheme);
}
