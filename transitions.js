/**
 * Portfolio Interactive System
 * 1. Dark Mode Management
 * 2. React Bits: TechText (hero h1)
 * 3. React Bits: TextLoop (marquee ticker)
 * 4. React Bits: ParticleText (contact email)
 * 5. React Bits: VariableProximity (headings, paragraphs, section titles)
 * 6. React Bits: TargetCursor (reticle locking cursor)
 * 7. Scroll Parallax, Dynamic Speed Skew & High Motion Blur Engine
 */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  /* ============================================================
     1. DARK MODE MANAGER
     ============================================================ */
  function initTheme() {
    var toggleBtn = document.getElementById('theme-toggle');
    function getPreferredTheme() {
      var saved = localStorage.getItem('theme');
      if (saved) return saved;
      return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }

    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem('theme', theme); } catch (e) {}
      window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
    }

    var currentTheme = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    applyTheme(currentTheme);

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        var active = document.documentElement.getAttribute('data-theme');
        var next = (active === 'dark') ? 'light' : 'dark';
        applyTheme(next);
      });
    }

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        if (!localStorage.getItem('theme')) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  /* ============================================================
     2. REACT BITS: TechText (Hero H1)
     ============================================================ */
  function initTechText() {
    var el = document.querySelector('.tech-text');
    if (!el) return;

    var rawText = el.getAttribute('data-text') || el.textContent.trim();
    var fullText = rawText.replace(/\s+/g, ' ').trim();
    el.setAttribute('aria-label', fullText);
    el.textContent = '';

    var words = fullText.split(' ');
    var spanList = [];
    var GLYPHS = '!<>-_\\/[]{}—=+*^?#________0101XYZ';

    for (var w = 0; w < words.length; w++) {
      var wordStr = words[w];
      var wordSpan = document.createElement('span');
      wordSpan.className = 'word';

      for (var c = 0; c < wordStr.length; c++) {
        var ch = wordStr[c];
        var span = document.createElement('span');
        span.className = 'tech-char';
        span.textContent = ch;
        span.dataset.orig = ch;
        span.setAttribute('aria-hidden', 'true');
        wordSpan.appendChild(span);
        spanList.push(span);

        // Interactive letter hover glitch & spring
        (function (s, origChar) {
          var timeout = null;
          s.addEventListener('mouseenter', function () {
            if (reduceMotion) return;
            var count = 0;
            clearInterval(timeout);
            timeout = setInterval(function () {
              if (count < 3) {
                s.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
                count++;
              } else {
                s.textContent = origChar;
                clearInterval(timeout);
              }
            }, 45);
          });
        })(span, ch);
      }

      el.appendChild(wordSpan);

      // Between words: single space, kept on one single line
      if (w < words.length - 1) {
        el.appendChild(document.createTextNode(' '));
      }
    }

    // Entrance decoding scramble
    if (!reduceMotion) {
      var t0 = performance.now();
      var dur = 950;
      function scrambleStep(now) {
        var elapsed = now - t0;
        var progress = Math.min(1, elapsed / dur);
        var resolvedCount = Math.floor(progress * spanList.length);

        for (var k = 0; k < spanList.length; k++) {
          if (k < resolvedCount) {
            spanList[k].textContent = spanList[k].dataset.orig;
          } else {
            spanList[k].textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
        }
        if (progress < 1) {
          requestAnimationFrame(scrambleStep);
        } else {
          for (var j = 0; j < spanList.length; j++) {
            spanList[j].textContent = spanList[j].dataset.orig;
          }
        }
      }
      requestAnimationFrame(scrambleStep);
    }
  }

  /* ============================================================
     3. REACT BITS: TextLoop (Scrolling marquee strip)
     ============================================================ */
  var textLoopState = {
    x: 0,
    baseSpeed: 1.1,
    hoverMultiplier: 1.0,
    trackEl: null,
    halfWidth: 0
  };

  function initTextLoop() {
    var container = document.getElementById('text-loop');
    if (!container) return;

    var track = container.querySelector('.text-loop-track');
    var contents = container.querySelectorAll('.text-loop-content');
    if (!track || contents.length < 2) return;

    textLoopState.trackEl = track;
    textLoopState.halfWidth = contents[0].offsetWidth || (container.scrollWidth / 2);

    container.addEventListener('mouseenter', function () {
      textLoopState.hoverMultiplier = 0.25;
    });
    container.addEventListener('mouseleave', function () {
      textLoopState.hoverMultiplier = 1.0;
    });

    window.addEventListener('resize', function () {
      if (contents[0]) {
        textLoopState.halfWidth = contents[0].offsetWidth;
      }
    });
  }

  /* ============================================================
     4. REACT BITS: ParticleText (Contact Section)
     ============================================================ */
  function initParticleText() {
    var wrap = document.getElementById('particle-text-wrap');
    var canvas = document.getElementById('particle-canvas');
    if (!wrap || !canvas) return;

    var ctx = canvas.getContext('2d');
    var text = 'roshanjha1007@gmail.com';
    var particles = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = 0, ch = 0;
    var mouse = { x: -9999, y: -9999, isHover: false };

    function getColors() {
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      var cs = getComputedStyle(document.documentElement);
      var accent = cs.getPropertyValue('--accent').trim() || (isDark ? '#D946EF' : '#8B2FC9');
      var ink = cs.getPropertyValue('--ink').trim() || (isDark ? '#F7EAF8' : '#160D24');
      return { accent: accent, ink: ink };
    }

    function createParticles() {
      var rect = wrap.getBoundingClientRect();
      cw = rect.width;
      ch = rect.height;
      if (!cw || !ch) return;

      canvas.width = cw * dpr;
      canvas.height = ch * dpr;

      var off = document.createElement('canvas');
      off.width = cw;
      off.height = ch;
      var octx = off.getContext('2d');

      var fontSize = Math.max(18, Math.min(36, cw * 0.058));
      octx.font = '700 ' + fontSize + 'px "Bricolage Grotesque", "Roboto Flex", sans-serif';
      octx.textAlign = 'left';
      octx.textBaseline = 'middle';
      octx.fillStyle = '#FFFFFF';
      octx.fillText(text, 0, ch / 2);

      var imgData = octx.getImageData(0, 0, cw, ch).data;
      var step = 3; // particle grid density
      particles = [];
      var cols = getColors();

      for (var y = 0; y < ch; y += step) {
        for (var x = 0; x < cw; x += step) {
          var alpha = imgData[(y * cw + x) * 4 + 3];
          if (alpha > 128) {
            var ratio = x / cw;
            particles.push({
              ox: x,
              oy: y,
              x: x + (Math.random() - 0.5) * 8,
              y: y + (Math.random() - 0.5) * 8,
              vx: 0,
              vy: 0,
              size: (Math.random() * 0.7 + 1.3),
              color: ratio > 0.4 ? cols.accent : cols.ink
            });
          }
        }
      }
    }

    createParticles();
    window.addEventListener('resize', createParticles);
    window.addEventListener('themechange', createParticles);

    // Mouse proximity repulsion
    canvas.addEventListener('mousemove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.isHover = true;
    });

    canvas.addEventListener('mouseleave', function () {
      mouse.x = -9999;
      mouse.y = -9999;
      mouse.isHover = false;
    });

    // Click explosion + open mailto
    canvas.addEventListener('click', function (e) {
      var r = canvas.getBoundingClientRect();
      var clickX = e.clientX - r.left;
      var clickY = e.clientY - r.top;

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var dx = p.x - clickX;
        var dy = p.y - clickY;
        var dist = Math.hypot(dx, dy) || 1;
        var force = Math.max(4, 30 - dist * 0.15);
        var angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.5;
        p.vx += Math.cos(angle) * force;
        p.vy += Math.sin(angle) * force;
      }

      setTimeout(function () {
        window.location.href = 'mailto:' + text;
      }, 250);
    });

    // Touch tap support
    canvas.addEventListener('touchstart', function (e) {
      if (e.touches.length > 0) {
        var r = canvas.getBoundingClientRect();
        var touchX = e.touches[0].clientX - r.left;
        var touchY = e.touches[0].clientY - r.top;
        for (var i = 0; i < particles.length; i++) {
          var p = particles[i];
          var dx = p.x - touchX;
          var dy = p.y - touchY;
          var dist = Math.hypot(dx, dy) || 1;
          if (dist < 100) {
            p.vx += (dx / dist) * 12;
            p.vy += (dy / dist) * 12;
          }
        }
      }
    }, { passive: true });

    function renderParticles(time) {
      if (!ctx || particles.length === 0) {
        requestAnimationFrame(renderParticles);
        return;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);

      var radius = 75;
      var idleWave = Math.sin(time * 0.002) * 0.4;

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];

        if (mouse.isHover) {
          var dx = p.x - mouse.x;
          var dy = p.y - mouse.y;
          var dist = Math.hypot(dx, dy);
          if (dist < radius) {
            var force = (1 - dist / radius) * 4.5;
            var angle = Math.atan2(dy, dx);
            p.vx += Math.cos(angle) * force;
            p.vy += Math.sin(angle) * force;
          }
        }

        // Spring return to origin
        var targetY = p.oy + idleWave;
        p.vx += (p.ox - p.x) * 0.075;
        p.vy += (targetY - p.y) * 0.075;

        // Damping
        p.vx *= 0.85;
        p.vy *= 0.85;

        p.x += p.vx;
        p.y += p.vy;

        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      requestAnimationFrame(renderParticles);
    }

    requestAnimationFrame(renderParticles);
  }

  /* ============================================================
     5. REACT BITS: VariableProximity
     ============================================================ */
  function initVariableProximity() {
    if (isTouch) return; // Fallback gracefully on touch devices

    var targets = document.querySelectorAll('.about p, .tag p, #projects p, #highlights dd, #highlights dt, .row small, section h2');
    var words = [];

    targets.forEach(function (el) {
      var isHeading = /^H[1-6]$/i.test(el.tagName);
      var baseWeight = isHeading ? 700 : 400;
      var text = el.textContent;
      if (!text || el.children.length > 0) return;

      var tokenRegex = /(\S+|\s+)/g;
      var match;
      var frag = document.createDocumentFragment();

      while ((match = tokenRegex.exec(text)) !== null) {
        var token = match[0];
        if (/^\s+$/.test(token)) {
          frag.appendChild(document.createTextNode(token));
        } else {
          var span = document.createElement('span');
          span.className = 'vp-word';
          span.textContent = token;
          span.dataset.baseWeight = baseWeight;
          frag.appendChild(span);
          words.push({
            el: span,
            baseWeight: baseWeight,
            cx: 0,
            cy: 0,
            active: false
          });
        }
      }
      el.textContent = '';
      el.appendChild(frag);
    });

    var mouse = { x: -9999, y: -9999 };
    var radius = 100;
    var ticking = false;

    function measureWordCenters() {
      for (var i = 0; i < words.length; i++) {
        var rect = words[i].el.getBoundingClientRect();
        words[i].cx = rect.left + rect.width / 2;
        words[i].cy = rect.top + rect.height / 2;
      }
    }

    window.addEventListener('resize', measureWordCenters);
    window.addEventListener('scroll', measureWordCenters, { passive: true });
    setTimeout(measureWordCenters, 300);

    window.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateVariableProximity);
      }
    }, { passive: true });

    function updateVariableProximity() {
      ticking = false;
      var rSq = radius * radius;

      for (var i = 0; i < words.length; i++) {
        var item = words[i];
        var dx = item.cx - mouse.x;
        var dy = item.cy - mouse.y;
        var distSq = dx * dx + dy * dy;

        if (distSq < rSq) {
          var dist = Math.sqrt(distSq);
          var factor = 1 - (dist / radius);
          var smooth = factor * factor * (3 - 2 * factor); // smoothstep
          var wght = Math.round(item.baseWeight + (950 - item.baseWeight) * smooth);
          item.el.style.fontVariationSettings = "'wght' " + wght;
          item.active = true;
        } else if (item.active) {
          item.el.style.fontVariationSettings = "'wght' " + item.baseWeight;
          item.active = false;
        }
      }
    }
  }

  /* ============================================================
     6. REACT BITS: TargetCursor
     ============================================================ */
  function initTargetCursor() {
    if (isTouch) return;

    var cursor = document.getElementById('target-cursor');
    if (!cursor) return;

    var targetX = window.innerWidth / 2;
    var targetY = window.innerHeight / 2;
    var currX = targetX;
    var currY = targetY;
    var currW = 28;
    var currH = 28;
    var lockedEl = null;

    window.addEventListener('mousemove', function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
    }, { passive: true });

    window.addEventListener('mousedown', function () {
      cursor.classList.add('down');
    });
    window.addEventListener('mouseup', function () {
      cursor.classList.remove('down');
    });

    function setupTargets() {
      var targets = document.querySelectorAll('a, button, #art, .row, .theme-toggle, #particle-canvas, .bento-card, .tilt-card, .shape-btn');
      targets.forEach(function (el) {
        el.addEventListener('mouseenter', function () {
          lockedEl = el;
          cursor.classList.add('locked');
        });
        el.addEventListener('mouseleave', function () {
          if (lockedEl === el) {
            lockedEl = null;
            cursor.classList.remove('locked');
          }
        });
      });
    }

    setupTargets();

    function updateCursor() {
      if (lockedEl) {
        var rect = lockedEl.getBoundingClientRect();
        var padding = 8;
        var destX = rect.left + rect.width / 2;
        var destY = rect.top + rect.height / 2;
        var destW = rect.width + padding * 2;
        var destH = rect.height + padding * 2;

        currX += (destX - currX) * 0.22;
        currY += (destY - currY) * 0.22;
        currW += (destW - currW) * 0.22;
        currH += (destH - currH) * 0.22;

        cursor.style.transform = 'translate(' + (currX - currW / 2) + 'px, ' + (currY - currH / 2) + 'px)';
        cursor.style.width = currW + 'px';
        cursor.style.height = currH + 'px';
      } else {
        currX += (targetX - currX) * 0.28;
        currY += (targetY - currY) * 0.28;
        currW += (28 - currW) * 0.22;
        currH += (28 - currH) * 0.22;

        cursor.style.transform = 'translate(' + (currX - currW / 2) + 'px, ' + (currY - currH / 2) + 'px)';
        cursor.style.width = currW + 'px';
        cursor.style.height = currH + 'px';
      }

      requestAnimationFrame(updateCursor);
    }

    requestAnimationFrame(updateCursor);
  }

  /* ============================================================
     7. SCROLL ANIMATIONS: Parallax, Dynamic Speed & Motion Blur
     ============================================================ */
  function initScrollSystem() {
    var heroText = document.querySelector('.hero > div:first-child');
    var art = document.getElementById('art');
    var heroBg = document.getElementById('hero-bg');
    var sectionTitles = document.querySelectorAll('section h2');
    var cards = document.querySelectorAll('.row');
    var sections = document.querySelectorAll('section');

    // Section Entrance Reveal (fade, translate, blur-to-sharp)
    sections.forEach(function (sec) {
      sec.classList.add('scroll-reveal');
    });

    if ('IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

      sections.forEach(function (sec) {
        revealObserver.observe(sec);
      });
    } else {
      sections.forEach(function (sec) {
        sec.classList.add('revealed');
      });
    }

    if (reduceMotion) return;

    var lastScrollY = window.scrollY || window.pageYOffset;
    var smoothVelocity = 0;

    function renderScrollLoop() {
      var currentScrollY = window.scrollY || window.pageYOffset;
      var rawVelocity = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      // Exponential moving average for velocity
      smoothVelocity += (rawVelocity - smoothVelocity) * 0.16;
      if (Math.abs(smoothVelocity) < 0.05) smoothVelocity = 0;

      // 1. High Motion Blur: proportional to velocity, clamped 0 - 12px
      var blurPx = Math.min(12, Math.abs(smoothVelocity) * 0.32);

      // 2. Dynamic Speed Skew & Stretch
      var skewY = Math.max(-3.5, Math.min(3.5, smoothVelocity * 0.06));
      var stretchY = 1 + Math.min(0.04, Math.abs(smoothVelocity) * 0.001);

      // Apply blur to moving layers
      var blurFilter = blurPx > 0.2 ? 'blur(' + blurPx.toFixed(1) + 'px)' : 'none';

      // 3. Parallax Layer: Hero text
      if (heroText) {
        var heroTextOffset = -currentScrollY * 0.42;
        var heroTextOpacity = Math.max(0, 1 - currentScrollY * 0.0022);
        heroText.style.transform = 'translate3d(0, ' + heroTextOffset.toFixed(1) + 'px, 0) skewY(' + (skewY * 0.4).toFixed(2) + 'deg)';
        heroText.style.opacity = heroTextOpacity.toFixed(2);
        heroText.style.filter = blurFilter;
      }

      // 4. Parallax Layer: Portrait (moves slower than text, scales & rotates with velocity, drifts into next section)
      if (art) {
        var artOffset = currentScrollY * 0.28;
        var scrollProgress = Math.min(1, currentScrollY / (window.innerHeight * 0.8));
        var rotateDeg = Math.max(-2.5, Math.min(2.5, smoothVelocity * 0.035));
        var scale = Math.max(0.82, 1 - scrollProgress * 0.14) * (1 + Math.min(0.03, Math.abs(smoothVelocity) * 0.0008));
        var mildBlur = Math.min(5, Math.abs(smoothVelocity) * 0.16);
        var artFilter = mildBlur > 0.2 ? 'blur(' + mildBlur.toFixed(1) + 'px)' : 'none';

        art.style.transform = 'translate3d(0, ' + artOffset.toFixed(1) + 'px, 0) scale(' + scale.toFixed(3) + ') rotate(' + rotateDeg.toFixed(2) + 'deg)';
        art.style.filter = artFilter;
      }

      // 5. Parallax Layer: Waves background
      if (heroBg) {
        var bgOffset = currentScrollY * 0.22;
        heroBg.style.transform = 'translate3d(0, ' + bgOffset.toFixed(1) + 'px, 0)';
      }

      // 6. Parallax Layer: Section Titles
      sectionTitles.forEach(function (title) {
        var rect = title.getBoundingClientRect();
        var centerOffset = (window.innerHeight / 2 - (rect.top + rect.height / 2)) * 0.08;
        title.style.transform = 'translate3d(0, ' + centerOffset.toFixed(1) + 'px, 0) skewY(' + (skewY * 0.2).toFixed(2) + 'deg)';
        title.style.filter = blurFilter;
      });

      // 7. Parallax Layer: Cards & Rows
      cards.forEach(function (card, index) {
        var factor = (index % 2 === 0 ? 0.05 : -0.05);
        var r = card.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          var offset = (window.innerHeight / 2 - (r.top + r.height / 2)) * factor;
          card.style.transform = 'translate3d(0, ' + offset.toFixed(1) + 'px, 0)';
        }
      });

      // 8. TextLoop velocity boosting
      if (textLoopState.trackEl && textLoopState.halfWidth > 0) {
        var effectiveSpeed = (textLoopState.baseSpeed + Math.abs(smoothVelocity) * 0.42) * textLoopState.hoverMultiplier;
        textLoopState.x -= effectiveSpeed;
        if (Math.abs(textLoopState.x) >= textLoopState.halfWidth) {
          textLoopState.x += textLoopState.halfWidth;
        }
        textLoopState.trackEl.style.transform = 'translate3d(' + textLoopState.x.toFixed(1) + 'px, 0, 0)';
      }

      requestAnimationFrame(renderScrollLoop);
    }

    requestAnimationFrame(renderScrollLoop);
  }

  /* ============================================================
     8. SHAPE SWITCHER & SCROLL MORPH (Arch -> Circle)
     ============================================================ */
  function initShapeSwitcher() {
    var backdrop = document.getElementById('portrait-backdrop');
    var buttons = document.querySelectorAll('.shape-btn');
    if (!backdrop || buttons.length === 0) return;

    var manualShape = null;

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var shape = btn.getAttribute('data-shape');
        manualShape = shape;
        setShape(shape);
      });
    });

    function setShape(shape) {
      backdrop.className = 'portrait-backdrop shape-' + shape;
      buttons.forEach(function (b) {
        if (b.getAttribute('data-shape') === shape) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
    }

    // Scroll morph: arch -> circle when scrolling down if user has not picked a shape
    window.addEventListener('scroll', function () {
      if (manualShape || reduceMotion) return;
      var scrollY = window.scrollY || window.pageYOffset;
      if (scrollY > 100) {
        if (!backdrop.classList.contains('shape-circle')) {
          setShape('circle');
        }
      } else {
        if (!backdrop.classList.contains('shape-arch')) {
          setShape('arch');
        }
      }
    }, { passive: true });
  }

  /* ============================================================
     9. MAGNETIC BUTTONS (Motion Primitives)
     ============================================================ */
  function initMagneticButtons() {
    if (isTouch || reduceMotion) return;

    var magnets = document.querySelectorAll('.magnetic, .links a, .btn-demo, .btn-github, .shape-btn');
    var radius = 60;

    magnets.forEach(function (el) {
      var ticking = false;

      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var centerX = rect.left + rect.width / 2;
        var centerY = rect.top + rect.height / 2;

        var dx = e.clientX - centerX;
        var dy = e.clientY - centerY;
        var dist = Math.hypot(dx, dy);

        if (dist < radius) {
          var pullX = dx * 0.32;
          var pullY = dy * 0.32;
          el.style.transform = 'translate3d(' + pullX.toFixed(1) + 'px, ' + pullY.toFixed(1) + 'px, 0)';
        }
      });

      el.addEventListener('mouseleave', function () {
        el.style.transform = 'translate3d(0, 0, 0)';
      });
    });
  }

  /* ============================================================
     10. PROGRESSIVE BLUR (Motion Primitives)
     ============================================================ */
  function initProgressiveBlur() {
    var blurEl = document.querySelector('.progressive-blur');
    if (!blurEl || reduceMotion) return;

    window.addEventListener('scroll', function () {
      var scrollY = window.scrollY || window.pageYOffset;
      var heroHeight = (document.querySelector('.hero') && document.querySelector('.hero').offsetHeight) || 600;
      var opacity = Math.max(0, Math.min(1, 1 - scrollY / (heroHeight * 0.9)));
      blurEl.style.opacity = opacity.toFixed(2);
    }, { passive: true });
  }

  /* ============================================================
     11. ACETERNITY INFINITE MOVING CARDS & 3D TILT (Highlights)
     ============================================================ */
  function initInfiniteHighlights() {
    var wrap = document.getElementById('infinite-cards-wrap');
    if (!wrap) return;

    var section = document.getElementById('highlights');
    var toggleBtn = document.getElementById('toggle-highlights-view');
    var tabBtns = document.querySelectorAll('.highlight-tab');
    var track = wrap.querySelector('.infinite-cards-track');
    var cards = wrap.querySelectorAll('.tilt-card');
    if (!track || cards.length === 0) return;

    var posX = 0;
    var speed = 0.65;
    var isPaused = false;
    var isGrid = false;
    var currentFilter = 'all';
    var halfWidth = track.scrollWidth / 2;

    wrap.addEventListener('mouseenter', function () { isPaused = true; });
    wrap.addEventListener('mouseleave', function () { isPaused = false; });

    // 3D Card Tilt (Aceternity style)
    if (!isTouch && !reduceMotion) {
      cards.forEach(function (card) {
        var inner = card.querySelector('.tilt-card-inner');
        if (!inner) return;

        card.addEventListener('mousemove', function (e) {
          var rect = card.getBoundingClientRect();
          var x = e.clientX - rect.left;
          var y = e.clientY - rect.top;
          var centerX = rect.width / 2;
          var centerY = rect.height / 2;

          var rotateX = ((y - centerY) / centerY) * -12;
          var rotateY = ((x - centerX) / centerX) * 12;

          inner.style.transform = 'perspective(800px) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg) scale3d(1.02, 1.02, 1.02)';
        });

        card.addEventListener('mouseleave', function () {
          inner.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
      });
    }

    function applyFilter(filter) {
      currentFilter = filter;
      tabBtns.forEach(function (btn) {
        var match = btn.dataset.category === filter;
        btn.classList.toggle('active', match);
        btn.setAttribute('aria-selected', match ? 'true' : 'false');
      });

      cards.forEach(function (card) {
        var isDuplicate = card.getAttribute('aria-hidden') === 'true';
        if (isGrid && isDuplicate) {
          card.style.display = 'none';
          return;
        }
        var cat = card.dataset.category;
        var show = (filter === 'all' || cat === filter);
        card.style.display = show ? '' : 'none';
      });

      halfWidth = track.scrollWidth / 2;
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        isGrid = !isGrid;
        if (section) section.classList.toggle('view-grid', isGrid);
        toggleBtn.classList.toggle('active', isGrid);
        toggleBtn.setAttribute('aria-pressed', isGrid ? 'true' : 'false');
        toggleBtn.setAttribute('aria-label', isGrid ? 'Show tabs view' : 'Show all highlights');
        toggleBtn.setAttribute('title', isGrid ? 'Show tabs view' : 'Show all highlights');

        if (isGrid) {
          // In grid mode, display ALL highlights together in a clean responsive grid
          applyFilter('all');
          track.style.transform = '';
        } else {
          // Returning to tabbed / carousel view
          applyFilter(currentFilter);
          posX = 0;
          halfWidth = track.scrollWidth / 2;
        }
      });
    }

    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.dataset.category;
        if (isGrid) {
          isGrid = false;
          if (section) section.classList.remove('view-grid');
          if (toggleBtn) {
            toggleBtn.classList.remove('active');
            toggleBtn.setAttribute('aria-pressed', 'false');
            toggleBtn.setAttribute('aria-label', 'Show all highlights');
            toggleBtn.setAttribute('title', 'Show all highlights');
          }
          posX = 0;
        }
        applyFilter(cat);
      });
    });

    if (reduceMotion) return;

    function loopTrack() {
      if (!isPaused && !isGrid) {
        posX -= speed;
        if (Math.abs(posX) >= halfWidth) {
          posX = 0;
        }
        track.style.transform = 'translate3d(' + posX.toFixed(1) + 'px, 0, 0)';
      }
      requestAnimationFrame(loopTrack);
    }

    window.addEventListener('resize', function () {
      halfWidth = track.scrollWidth / 2;
    });

    requestAnimationFrame(loopTrack);
  }

  /* ============================================================
     12. ASCIIFY TOAST NOTIFICATION (Email click-to-copy)
     ============================================================ */
  function initEmailToast() {
    var emailLinks = document.querySelectorAll('a[href^="mailto:roshanjha1007@gmail.com"], #particle-canvas');
    var toast = document.createElement('div');
    toast.className = 'asciify-toast';
    toast.innerHTML = '<span class="toast-icon">✦</span><span>[COPIED] roshanjha1007@gmail.com</span>';
    document.body.appendChild(toast);

    var toastTimer = null;

    emailLinks.forEach(function (el) {
      el.addEventListener('click', function (e) {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText('roshanjha1007@gmail.com');
          }
        } catch (err) {}

        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
          toast.classList.remove('show');
        }, 2600);
      });
    });
  }

  /* ============================================================
     INITIALIZE ON DOM READY
     ============================================================ */
  function onReady() {
    initTheme();
    initTechText();
    initTextLoop();
    initParticleText();
    initVariableProximity();
    initTargetCursor();
    initScrollSystem();
    initShapeSwitcher();
    initMagneticButtons();
    initProgressiveBlur();
    initInfiniteHighlights();
    initEmailToast();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
