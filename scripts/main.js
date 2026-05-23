// ============================================
// MAIN.JS — Gautam Portfolio
// Handles: theme toggle, nav scroll, GSAP
// animations, circuit canvas, hamburger menu
// ============================================

// ---- Register GSAP plugins ----
gsap.registerPlugin(ScrollTrigger);

// ============================================
// THEME TOGGLE
// ============================================
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

themeToggle?.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

// ============================================
// NAV — blur on scroll + active section
// ============================================
const nav = document.getElementById('nav');

window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
}, { passive: true });

// Active nav link via IntersectionObserver
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${entry.target.id}`) {
          link.classList.add('active');
        }
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => sectionObserver.observe(s));

// ============================================
// HAMBURGER MENU (mobile)
// ============================================
const hamburger = document.getElementById('hamburger');
const navLinksContainer = document.getElementById('nav-links');

hamburger?.addEventListener('click', () => {
  navLinksContainer.classList.toggle('open');
});

navLinksContainer?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinksContainer.classList.remove('open'));
});

// ============================================
// CIRCUIT CANVAS ANIMATION
// Draws animated circuit trace lines
// Only runs on pages that have #circuit-canvas
// ============================================
(function initCircuit() {
  const canvas = document.getElementById('circuit-canvas');
  if (!canvas) return; // safe exit on blog/other pages
  const ctx = canvas.getContext('2d');

  let W, H, nodes, animFrame;
  const GRID = 60;
  const MAX_LINES = 28;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    init();
  }

  function randColor() {
    const colors = ['#3ddc84', '#4da6ff', '#ff8c42'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function snapToGrid(v) { return Math.round(v / GRID) * GRID; }

  function init() {
    nodes = [];
    for (let i = 0; i < MAX_LINES; i++) {
      nodes.push(createLine());
    }
  }

  function createLine() {
    const color = randColor();
    const x = snapToGrid(Math.random() * W);
    const y = snapToGrid(Math.random() * H);
    const len = (2 + Math.floor(Math.random() * 6)) * GRID;
    const dir = Math.random() < 0.5 ? 'h' : 'v';
    const speed = 0.4 + Math.random() * 0.8;
    return {
      x, y, len, dir, color, speed,
      progress: 0,
      delay: Math.random() * 120,
      dot: Math.random() < 0.4,
      alpha: 0.3 + Math.random() * 0.4,
    };
  }

  function draw(ts) {
    ctx.clearRect(0, 0, W, H);

    nodes.forEach(n => {
      if (n.delay > 0) { n.delay--; return; }
      n.progress = Math.min(n.progress + n.speed, n.len);

      const drawn = n.progress;
      ctx.save();
      ctx.globalAlpha = n.alpha;
      ctx.strokeStyle = n.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (n.dir === 'h') {
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(n.x + drawn, n.y);
      } else {
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(n.x, n.y + drawn);
      }
      ctx.stroke();

      // Dot at end
      if (n.dot && n.progress > GRID) {
        const ex = n.dir === 'h' ? n.x + drawn : n.x;
        const ey = n.dir === 'h' ? n.y : n.y + drawn;
        ctx.beginPath();
        ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();
      }

      ctx.restore();

      // Reset when done
      if (n.progress >= n.len) {
        Object.assign(n, createLine());
      }
    });

    animFrame = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  requestAnimationFrame(draw);
})();

// ============================================
// HERO ENTRANCE ANIMATION
// ============================================

// Check for reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Set initial states BEFORE defining the timeline (prevents 1-frame flash)
gsap.set('#hero-eyebrow, #hero-name, #hero-tagline, #hero-status, #hero-cta', {
  opacity: prefersReducedMotion ? 1 : 0,
  y: prefersReducedMotion ? 0 : 30,
});

if (!prefersReducedMotion) {
  const heroTl = gsap.timeline({ delay: 0.2 });
  heroTl
    .to('#hero-eyebrow', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
    .to('#hero-name',    { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.3')
    .to('#hero-tagline', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3')
    .to('#hero-status',  { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.2')
    .to('#hero-cta',     { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.2');
}

// ============================================
// SCROLL REVEAL — Section titles & text
// ============================================
gsap.utils.toArray('.reveal-up').forEach(el => {
  if (prefersReducedMotion) {
    gsap.set(el, { opacity: 1, y: 0 });
    return;
  }
  gsap.to(el, {
    scrollTrigger: {
      trigger: el,
      start: 'top 88%',
      toggleActions: 'play none none none',
    },
    opacity: 1,
    y: 0,
    duration: 0.75,
    ease: 'power3.out',
  });
});

// ============================================
// SCROLL REVEAL — Cards (staggered per group)
// Fixed: use WeakMap to key groups by DOM node
// ============================================
const cardGroupMap = new Map();
document.querySelectorAll('.reveal-card').forEach(card => {
  const parent = card.parentElement;
  if (!cardGroupMap.has(parent)) cardGroupMap.set(parent, []);
  cardGroupMap.get(parent).push(card);
});

cardGroupMap.forEach((group, parent) => {
  if (!group.length) return;
  if (prefersReducedMotion) {
    gsap.set(group, { opacity: 1, y: 0 });
    return;
  }
  gsap.to(group, {
    scrollTrigger: {
      trigger: parent,
      start: 'top 82%',
      toggleActions: 'play none none none',
    },
    opacity: 1,
    y: 0,
    duration: 0.7,
    stagger: 0.12,
    ease: 'power3.out',
  });
});

// ============================================
// SCROLL REVEAL — Timeline
// ============================================
const timelineEl = document.querySelector('.timeline');
const timelineItems = document.querySelectorAll('.reveal-timeline');

if (timelineEl && timelineItems.length) {
  if (prefersReducedMotion) {
    timelineEl.classList.add('animated');
    gsap.set(timelineItems, { opacity: 1, x: 0 });
  } else {
    ScrollTrigger.create({
      trigger: timelineEl,
      start: 'top 75%',
      onEnter: () => timelineEl.classList.add('animated'),
    });
    gsap.to(timelineItems, {
      scrollTrigger: {
        trigger: timelineEl,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
      opacity: 1,
      x: 0,
      duration: 0.65,
      stagger: 0.18,
      ease: 'power3.out',
    });
  }
}

// ============================================
// SKILL CHIPS — wave cascade reveal
// ============================================
document.querySelectorAll('.skill-group').forEach((group, gi) => {
  const chips = group.querySelectorAll('.skill-chip');
  if (prefersReducedMotion) {
    gsap.set(chips, { opacity: 1, y: 0 });
    return;
  }
  gsap.set(chips, { opacity: 0, y: 20 });
  gsap.to(chips, {
    scrollTrigger: {
      trigger: group,
      start: 'top 85%',
      toggleActions: 'play none none none',
    },
    opacity: 1,
    y: 0,
    duration: 0.5,
    stagger: 0.06,
    ease: 'power2.out',
    delay: gi * 0.1,
  });
});

// ============================================
// TRAIT CHIPS (About section)
// ============================================
const traitChips = document.querySelectorAll('.trait-chip');
if (traitChips.length) {
  if (prefersReducedMotion) {
    gsap.set(traitChips, { opacity: 1, scale: 1 });
  } else {
    gsap.set(traitChips, { opacity: 0, scale: 0.85 });
    gsap.to(traitChips, {
      scrollTrigger: {
        trigger: '.about-chips',
        start: 'top 85%',
      },
      opacity: 1,
      scale: 1,
      duration: 0.45,
      stagger: 0.08,
      ease: 'back.out(1.7)',
    });
  }
}

// ============================================
// SMOOTH SCROLL for anchor links
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
