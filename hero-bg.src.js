import { background, swell, drift, halo, caustics, contour, ripple, mesh, interference, constellation, cascade, fluid, wordField } from 'asciify-engine/kit';

const host = document.getElementById('hero-bg');
if (host) {
  const presets = [drift, halo, caustics, contour, ripple, mesh, interference, constellation, cascade, fluid, swell, wordField];
  let i = Math.floor(Math.random() * presets.length);

  // Keep the field quiet right behind the hero text, buttons and portrait.
  let rects = [], dirty = true;
  const range = document.createRange();
  const read = () => {
    if (!dirty) return rects;
    dirty = false;
    rects = [...document.querySelectorAll('.hero h1, .hero .tag p')].flatMap(el => { range.selectNodeContents(el); return [...range.getClientRects()]; });
    rects.push(...[...document.querySelectorAll('.hero .links a, .hero .art')].map(el => el.getBoundingClientRect()));
    return rects;
  };
  const mark = () => { dirty = true; };
  addEventListener('scroll', mark, { passive: true, capture: true });
  addEventListener('resize', mark);
  new ResizeObserver(mark).observe(document.body);
  document.fonts?.addEventListener('loadingdone', mark);

  const bg = background(host, {
    preset: presets[i],
    clear: read, clearPadding: 6, clearSoftness: 30,
    palette: { light: '#A855F7', dark: '#E879F9' },
    opacity: 0.55,
    text: 'ROSHAN',
  });

  // Every 14s, cross-fade to a different preset.
  setInterval(() => {
    if (document.hidden) return;
    i = (i + 1 + Math.floor(Math.random() * (presets.length - 1))) % presets.length;
    bg.setPreset(presets[i]);
  }, 14000);
}
