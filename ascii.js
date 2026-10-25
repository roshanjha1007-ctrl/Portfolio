/* ASCII portrait: Diffusion Reveal
 * - Default state: pure ASCII noise (n = 1).
 * - Denoises smoothly on hover / tap / scroll into view over ~1.6s (ease-in-out).
 * - Real photo cross-fades in as n drops below 0.5.
 * - On mouse leave, re-noises smoothly back to ASCII over ~1.2s.
 * - Interpolates every frame (never snaps on rapid enter/leave).
 * - Theme-aware (--ascii-bg, --ascii-ink, --ascii-acc) and prefers-reduced-motion support.
 */
(function() {
  'use strict';

  var art = document.getElementById('art'),
      cv = document.getElementById('cv'),
      hint = document.getElementById('hint');
  if (!art || !cv) return;

  var ctx = cv.getContext('2d');
  if (!ctx) return;

  var img = new Image();
  var RAMP = ' .,:;-=+*#%@';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  window.addEventListener('themechange', readThemeColors);

  // Only fall back to plain photo if image truly fails to load
  function fail(err) {
    console.error('Photo failed to load (falling back to plain img):', err);
    art.classList.add('fallback');
    if (hint) hint.style.display = 'none';
  }

  function hash(a, b) {
    var h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return h - Math.floor(h);
  }

  function size() {
    var r = art.getBoundingClientRect();
    W = r.width || 360;
    H = r.height || 450;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cw = W / COLS;
    ch = cw * 1.75;
    rows = Math.ceil(H / ch);

    var iw = img.naturalWidth || 640;
    var ih = img.naturalHeight || 800;
    SW = iw * 0.5;
    SH = SW * H / W;
    SX = iw * 0.25;
    SY = ih * 0.12;

    lum = [];
    cellThreshold = [];
    correctK = [];

    var pixelDataSuccess = false;
    try {
      var o = document.createElement('canvas');
      o.width = COLS;
      o.height = rows;
      var oc = o.getContext('2d');
      if (oc) {
        oc.drawImage(img, SX, SY, SW, SH, 0, 0, COLS, rows);
        var imgData = oc.getImageData(0, 0, COLS, rows);
        var d = imgData.data;
        var totalCells = COLS * rows;
        var raw = [];
        for (var i = 0; i < totalCells; i++) {
          raw.push((0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255);
        }

        var s = raw.slice().sort(function(a, b) { return a - b; });
        var lo = s[Math.floor(totalCells * 0.03)];
        var sp = Math.max(0.05, s[Math.floor(totalCells * 0.97)] - lo);
        for (var j = 0; j < totalCells; j++) {
          raw[j] = Math.min(1, Math.max(0, (raw[j] - lo) / sp));
        }

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
            cellThreshold.push(hash(x * 17.13, y * 31.97));
          }
        }
        pixelDataSuccess = true;
      }
    } catch (e) {
      // getImageData throws on file:// URLs due to CORS tainting
      console.warn('Cannot read canvas pixels directly (file:// origin). Using computed silhouette luminance ramp:', e);
    }

    // Fallback luminance ramp if getImageData was blocked by file:// CORS
    if (!pixelDataSuccess) {
      lum = [];
      cellThreshold = [];
      correctK = [];
      for (var fy = 0; fy < rows; fy++) {
        for (var fx = 0; fx < COLS; fx++) {
          var frx = (fx / COLS - 0.5) / 0.45;
          var fry = (fy / rows - 0.45) / 0.55;
          var dist = Math.hypot(frx, fry);
          var fv = Math.min(1, Math.max(0, 1.25 - dist * 0.85));
          var flVal = Math.min(1, Math.max(0, fv * (0.65 + hash(fx * 3.17, fy * 7.73) * 0.35)));
          lum.push(flVal);
          correctK.push(Math.round(flVal * (RAMP.length - 1)));
          cellThreshold.push(hash(fx * 17.13, fy * 31.97));
        }
      }
    }
  }

  // Diffusion state: 0 = pure noise (n = 1), 1 = fully revealed (n = 0)
  var progress = 0;
  var targetProgress = 0;
  var lastNow = 0;
  var scrollRevealTimer = null;

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
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

    if (reduceMotion) {
      // Simple smooth cross-fade without rapid ASCII noise loop
      ctx.globalAlpha = eased;
      ctx.drawImage(img, SX, SY, SW, SH, 0, 0, W, H);
      ctx.globalAlpha = 1.0;
      if (hint) hint.style.opacity = String(Math.max(0, 1 - progress * 1.5));
      requestAnimationFrame(render);
      return;
    }

    ctx.font = (ch * 0.9) + 'px "Courier New", monospace';
    ctx.textBaseline = 'top';

    var rampLen = RAMP.length;
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < COLS; x++) {
        var idx = y * COLS + x;
        var th = cellThreshold[idx] || 0.5;
        var l = lum[idx] || 0.5;
        var charIdx;

        // If current noise level is higher than this cell's threshold, it remains noisy
        if (n > th) {
          charIdx = Math.floor(Math.random() * rampLen);
        } else {
          charIdx = correctK[idx] || 0;
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

  var started = false;
  function startApp() {
    if (started) return;
    started = true;
    size();

    if (hint) {
      hint.textContent = 'Diffusion reveal · Hover or tap';
      hint.style.opacity = '1';
    }

    // Default state: pure ASCII noise
    progress = 0;
    targetProgress = 0;

    // 1. Mouse hover: smooth forward reveal
    art.addEventListener('mouseenter', function() {
      clearTimeout(scrollRevealTimer);
      targetProgress = 1;
    });

    // 2. Mouse leave: smooth reverse to ASCII
    art.addEventListener('mouseleave', function() {
      clearTimeout(scrollRevealTimer);
      targetProgress = 0;
    });

    // 3. Touch tap toggle
    art.addEventListener('pointerdown', function(e) {
      if (e.pointerType === 'touch') {
        clearTimeout(scrollRevealTimer);
        targetProgress = targetProgress > 0.5 ? 0 : 1;
      }
    });

    // 4. Scroll into view: only trigger when scrolled back into view after moving away
    var hasScrolledAway = false;
    window.addEventListener('scroll', function() {
      if (window.scrollY > 300) {
        hasScrolledAway = true;
      }
    }, { passive: true });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.4 && hasScrolledAway) {
            hasScrolledAway = false;
            targetProgress = 1;
            // Reveal briefly then smoothly ease back to ASCII noise
            clearTimeout(scrollRevealTimer);
            scrollRevealTimer = setTimeout(function() {
              targetProgress = 0;
            }, 2600);
          }
        });
      }, { threshold: [0.1, 0.4] });
      io.observe(art);
    }

    window.addEventListener('resize', function() {
      size();
    });

    requestAnimationFrame(render);
  }

  img.onload = startApp;
  img.onerror = function(err) {
    fail(err || new Error('Image photo.jpg failed to load'));
  };

  img.src = 'photo.jpg';
  if (img.complete && img.naturalWidth > 0) {
    startApp();
  }
})();
