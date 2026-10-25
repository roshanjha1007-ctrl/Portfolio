#!/usr/bin/env bash
# Adds the Asciify hero background (GPU ASCII field) to this site and rebuilds it on every run.
set -e
cd "$(dirname "$0")"
[ -f index.html ] || { echo "index.html nahi mili. Is script ko site folder ke andar rakho."; exit 1; }
command -v npm >/dev/null || { echo "Node.js nahi mila. https://nodejs.org se LTS install karo, phir script dobara chalao."; exit 1; }

# 1. Source (written once; edit this file and re-run the script to rebuild)
if [ ! -f hero-bg.src.js ]; then
cat > hero-bg.src.js <<'EOF'
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
EOF
fi

# 2. Bundle into one small file, in a temp folder (no node_modules in the repo)
TMP="$(mktemp -d)"
cp hero-bg.src.js "$TMP/"
( cd "$TMP" && npm init -y >/dev/null 2>&1 \
  && npm i asciify-engine@4.32.8 esbuild --silent --no-audit --no-fund \
  && npx esbuild hero-bg.src.js --bundle --minify --format=esm --target=es2020 --outfile=hero-bg.js --log-level=warning )
cp "$TMP/hero-bg.js" hero-bg.js
rm -rf "$TMP"

# 3. Styles
cat > hero-bg.css <<'EOF'
/* Asciify field stays inside the hero and behind its content. */
#hero-bg{position:absolute;inset:0;height:100%;z-index:-1;pointer-events:none}
EOF

# 4. Wire it into index.html (safe to run twice)
grep -q 'id="hero-bg"' index.html || perl -pi -e 's#<body>#<body>\n<div id="hero-bg" aria-hidden="true"></div>#' index.html
grep -q hero-bg.css index.html || perl -pi -e 's#</head>#<link rel="stylesheet" href="hero-bg.css">\n</head>#' index.html
grep -q hero-bg.js index.html || perl -pi -e 's#</body>#<script type="module" src="hero-bg.js"></script>\n</body>#' index.html

echo "hero-bg.js size: $(du -h hero-bg.js | cut -f1)"
echo "index.html references: $(grep -c 'hero-bg' index.html) (3 hona chahiye)"

# This script only builds local assets. Review and commit the result separately.
