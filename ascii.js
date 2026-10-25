/* ASCII portrait: Diffusion Reveal
 * Noise level n transitions from 1 (pure ASCII noise) to 0 (converged ASCII -> real photo cross-fade).
 * Easing: ease-in-out (~1.6s forward, ~1.2s back). Respects prefers-reduced-motion and theme.
 */
(function() {
  var art = document.getElementById('art'),
      cv = document.getElementById('cv'),
      hint = document.getElementById('hint');
  if (!art || !cv) return;

  var ctx = cv.getContext('2d'),
      img = new Image(),
      RAMP = ' .,:;-=+*#%@';

  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COLS = 84, W = 0, H = 0, cw = 0, ch = 0, rows = 0;
  var lum = [], cellThreshold = [], correctK = [];
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var SX = 0, SY = 0, SW = 1, SH = 1;

  // Theme colors
  var BG = '#FF9FC8', INK = '#3B0764', ACC = '#6D28D9';
  function readThemeColors() {
    var cs = getComputedStyle(document.documentElement);
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    var bg = cs.getPropertyValue('--ascii-bg').trim();
    var ink = cs.getPropertyValue('--ascii-ink').trim();
    var acc = cs.getPropertyValue('--ascii-acc').trim();

    BG = bg || (isDark ? '#140D24' : '#FF9FC8');
    INK = ink || (isDark ? '#F7EAF8' : '#3B0764');
    ACC = acc || (isDark ? '#D946EF' : '#6D28D9');
  }
  readThemeColors();
  window.addEventListener('themechange', function() {
    readThemeColors();
    if (reduceMotion) drawDirectPhoto();
  });

  function fail() {
    art.classList.add('fallback');
    if (hint) hint.style.display = 'none';
  }

  function hash(a, b) {
    var h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return h - Math.floor(h);
  }

  function size() {
    var r = art.getBoundingClientRect();
    W = r.width;
    H = r.height;
    if (W === 0 || H === 0) return;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cw = W / COLS;
    ch = cw * 1.75;
    rows = Math.ceil(H / ch);

    var iw = img.naturalWidth, ih = img.naturalHeight;
    SW = iw * 0.5;
    SH = SW * H / W;
    SX = iw * 0.25;
    SY = ih * 0.12;

    var o = document.createElement('canvas');
    o.width = COLS;
    o.height = rows;
    var oc = o.getContext('2d');
    oc.drawImage(img, SX, SY, SW, SH, 0, 0, COLS, rows);

    var d = oc.getImageData(0, 0, COLS, rows).data;
    var totalCells = COLS * rows;
    var raw = [];
    for (var i = 0; i < totalCells; i++) {
      raw.push((0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255);
    }

    var s = raw.slice().sort(function(a, b) { return a - b; });
    var lo = s[Math.floor(totalCells * 0.03)];
    var sp = Math.max(0.05, s[Math.floor(totalCells * 0.97)] - lo);
    for (var i = 0; i < totalCells; i++) {
      raw[i] = Math.min(1, Math.max(0, (raw[i] - lo) / sp));
    }

    lum = [];
    cellThreshold = [];
    correctK = [];

    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < COLS; x++) {
        var a = 0, c = 0;
        for (var b = -2; b <= 2; b++) {
          for (var k = -2; k <= 2; k++) {
            var yy = y + b, xx = x + k;
            if (yy >= 0 && yy < rows && xx >= 0 && xx < COLS) {
              a += raw[yy * COLS + xx];
              c++;
            }
          }
        }
        var v = raw[y * COLS + x];
        var rx = (x / COLS - 0.5) / 0.5;
        var ry = (y / rows - 0.5) / 0.58;
        var vg = Math.min(1, Math.max(0, 1.35 - 1.25 * Math.hypot(rx, ry)));
        var lVal = Math.min(1, Math.max(0, (v + 0.8 * (v - a / c)) * vg * 1.3));
        lum.push(lVal);
        correctK.push(Math.round(lVal * (RAMP.length - 1)));
        // Per-cell fixed threshold for diffusion reveal
        cellThreshold.push(hash(x * 17.13, y * 31.97));
      }
    }
  }

  // Diffusion state: 0 = pure noise, 1 = fully revealed
  var progress = 0;
  var targetProgress = 0;
  var lastNow = 0;
  var isHovered = false;
  var isTapped = false;
  var inViewport = false;

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function drawDirectPhoto() {
    if (!W || !H) size();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(img, SX, SY, SW, SH, 0, 0, W, H);
    if (hint) hint.style.opacity = '0';
  }

  function updateTarget() {
    targetProgress = (isHovered || isTapped || inViewport) ? 1 : 0;
  }

  function render(now) {
    if (!lastNow) lastNow = now;
    var dt = Math.min((now - lastNow) / 1000, 0.1);
    lastNow = now;

    // Smooth lerp: ~1.6s forward, ~1.2s back
    if (targetProgress > progress) {
      progress = Math.min(targetProgress, progress + dt / 1.6);
    } else if (targetProgress < progress) {
      progress = Math.max(targetProgress, progress - dt / 1.2);
    }

    var eased = easeInOut(progress);
    var n = 1 - eased; // noise level from 1 (pure noise) down to 0 (fully converged)
    var jitterProb = n * 0.35; // per-frame jitter shrinks with n

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    ctx.font = (ch * 0.9) + 'px "Courier New", monospace';
    ctx.textBaseline = 'top';

    var rampLen = RAMP.length;
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < COLS; x++) {
        var idx = y * COLS + x;
        var th = cellThreshold[idx];
        var l = lum[idx];
        var charIdx;

        // If current noise level is higher than this cell's threshold, it remains noisy
        if (n > th) {
          charIdx = Math.floor(Math.random() * rampLen);
        } else {
          charIdx = correctK[idx];
          // Small per-frame jitter that shrinks to 0 as n approaches 0
          if (jitterProb > 0.001 && Math.random() < jitterProb) {
            charIdx = Math.max(0, Math.min(rampLen - 1, charIdx + (Math.random() < 0.5 ? -1 : 1)));
          }
        }

        var chChar = RAMP[charIdx];
        if (chChar === ' ') continue;

        ctx.fillStyle = l > 0.55 ? INK : ACC;
        ctx.fillText(chChar, x * cw, y * ch);
      }
    }

    // Photo cross-fade: as n drops below 0.5, real photo cross-fades in from the ASCII layer
    if (n < 0.5) {
      var photoAlpha = Math.max(0, Math.min(1, (0.5 - n) / 0.5));
      ctx.save();
      ctx.globalAlpha = photoAlpha;
      ctx.drawImage(img, SX, SY, SW, SH, 0, 0, W, H);
      ctx.restore();
    }

    // Update hint opacity
    if (hint) {
      hint.style.opacity = String(Math.max(0, 1 - progress * 1.5));
    }

    requestAnimationFrame(render);
  }

  img.onload = function() {
    try {
      size();
      ctx.getImageData(0, 0, 1, 1);
    } catch(e) {
      return fail();
    }

    if (hint) hint.textContent = 'Diffusion reveal · Hover or tap';

    if (reduceMotion) {
      drawDirectPhoto();
      return;
    }

    // Hover interactions
    art.addEventListener('pointerenter', function() {
      isHovered = true;
      updateTarget();
    });
    art.addEventListener('pointerleave', function() {
      isHovered = false;
      isTapped = false;
      updateTarget();
    });

    // Touch tap toggle
    art.addEventListener('pointerdown', function(e) {
      if (e.pointerType === 'touch') {
        isTapped = !isTapped;
        updateTarget();
      }
    });

    // Scroll into view auto-reveal
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          inViewport = entry.isIntersecting && entry.intersectionRatio > 0.35;
          updateTarget();
        });
      }, { threshold: [0.1, 0.35, 0.7] });
      io.observe(art);
    }

    window.addEventListener('resize', function() {
      size();
    });

    requestAnimationFrame(render);
  };

  img.onerror = fail;
  img.src = 'photo.jpg';
})();
