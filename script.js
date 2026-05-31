/* ============================================================
   PORTFOLIO — UI/UX Designer
   script.js

   1. Custom Cursor
   2. Nav Scroll Effect
   3. Scroll Reveal
   4. Language Toggle
============================================================ */

/* ---------------------------------------------------------
   1. Custom Cursor
--------------------------------------------------------- */
const cur  = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');

let mx = 0, my = 0;   // mouse position (instant)
let rx = 0, ry = 0;   // ring position (lagged)

document.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;
});

// Enlarge ring on hoverable elements
document.querySelectorAll('a, button, .project-card, .service-item, .tool-pill').forEach(el => {
  el.addEventListener('mouseenter', () => ring.classList.add('hover'));
  el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
});

// Smooth ring follow loop
(function loop() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  cur.style.left  = mx + 'px';
  cur.style.top   = my + 'px';
  ring.style.left = rx + 'px';
  ring.style.top  = ry + 'px';
  requestAnimationFrame(loop);
})();

/* ---------------------------------------------------------
   2. Nav Scroll Effect
--------------------------------------------------------- */
const nav = document.getElementById('nav');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
});

/* ---------------------------------------------------------
   3. Scroll Reveal
--------------------------------------------------------- */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

// Stagger siblings with a small delay
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 0.1 + 's';
  observer.observe(el);
});

/* ---------------------------------------------------------
   4. Language Toggle
--------------------------------------------------------- */
const btnEn = document.getElementById('btnEn');
const btnZh = document.getElementById('btnZh');

/**
 * Apply the chosen language across all [data-zh] / [data-en] elements.
 * Uses innerHTML for elements that may contain tags like <br> or <em>.
 * @param {'en'|'zh'} l
 */
function applyLang(l) {
  // Toggle button states
  btnEn.classList.toggle('active', l === 'en');
  btnZh.classList.toggle('active', l === 'zh');

  // Update <html lang="">
  document.documentElement.lang = l === 'zh' ? 'zh' : 'en';

  // Swap all labelled text nodes
  document.querySelectorAll('[data-zh][data-en]').forEach(el => {
    const val = el.getAttribute('data-' + l);
    if (!val) return;

    const richTags = ['SPAN', 'P', 'H1', 'H2', 'H3', 'A', 'DIV'];
    if (richTags.includes(el.tagName)) {
      el.innerHTML = val;
    } else {
      el.textContent = val;
    }
  });
}

btnEn.addEventListener('click', () => applyLang('en'));
btnZh.addEventListener('click', () => applyLang('zh'));

// Default language on page load
applyLang('en');

/* ---------------------------------------------------------
   5. Interactive Dot Field
   A grid of dots with spring physics — dots are repelled by
   the cursor and snap back elastically when it moves away.
   Dots near the cursor glow gold; resting dots are dim cream.
   Canvas auto-fills the hero-right column and rebuilds on resize.
--------------------------------------------------------- */
(function () {
  const canvas = document.getElementById('dotField');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  let W, H, dots;
  let mx = -9999, my = -9999;
  let rafId;

  /* --- Build dot grid for current canvas size --- */
  function buildDots(w, h) {
    const COLS = Math.round(w / 18);
    const ROWS = Math.round(h / 18);
    const gx = w / (COLS + 1);
    const gy = h / (ROWS + 1);
    const arr = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ox = (c + 1) * gx;
        const oy = (r + 1) * gy;
        arr.push({ ox, oy, x: ox, y: oy, vx: 0, vy: 0,
          radius: 1.2 + Math.random() * 0.8 });
      }
    }
    return arr;
  }

  /* --- Resize: measure parent, update canvas resolution --- */
  function resize() {
    const parent = canvas.parentElement;
    W = parent.clientWidth;
    H = parent.clientHeight;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(DPR, DPR);
    dots = buildDots(W, H);
  }

  /* --- Physics constants --- */
  const REPEL_RADIUS = 90;
  const REPEL_FORCE  = 220;
  const SPRING       = 0.10;
  const DAMPING      = 0.72;

  /* --- Colour: cream at rest → gold when pushed --- */
  function dotColor(dist) {
    const t = Math.max(0, 1 - dist / REPEL_RADIUS);
    const r = Math.round(122 + t * (201 - 122));
    const g = Math.round(118 + t * (169 - 118));
    const b = Math.round(104 + t * (110 - 104));
    const a = 0.58 + t * 0.72;
    return `rgba(${r},${g},${b},${a})`;
  }

  /* --- Animation loop --- */
  function tick() {
    ctx.clearRect(0, 0, W, H);
    for (const d of dots) {
      const dx   = d.x - mx;
      const dy   = d.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < REPEL_RADIUS && dist > 0) {
        const f = (1 - dist / REPEL_RADIUS) * REPEL_FORCE;
        d.vx += (dx / dist) * f * 0.05;
        d.vy += (dy / dist) * f * 0.05;
      }

      d.vx += (d.ox - d.x) * SPRING;
      d.vy += (d.oy - d.y) * SPRING;
      d.vx *= DAMPING;
      d.vy *= DAMPING;
      d.x  += d.vx;
      d.y  += d.vy;

      const dd = Math.sqrt((d.x - mx) ** 2 + (d.y - my) ** 2);
      const t  = Math.max(0, 1 - dd / REPEL_RADIUS);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius + t * 2, 0, Math.PI * 2);
      ctx.fillStyle = dotColor(dd);
      ctx.fill();
    }
    rafId = requestAnimationFrame(tick);
  }

  /* --- Mouse tracking relative to canvas --- */
  window.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
  });

  /* --- Init & respond to resize --- */
  resize();
  tick();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cancelAnimationFrame(rafId);
      resize();
      tick();
    }, 100);
  });
})();
