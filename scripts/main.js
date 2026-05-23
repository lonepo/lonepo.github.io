// ============================================
// MAIN.JS — Gautam Portfolio
// Handles: Lenis smooth scroll, GSAP animations,
// Splitting.js hero, magnetic cursor, horizontal
// project reel, scroll progress bar, page transitions
// ============================================

gsap.registerPlugin(ScrollTrigger);

// ============================================
// REDUCED MOTION CHECK
// ============================================
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ============================================
// LENIS — Smooth Scroll
// ============================================
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});

// Connect Lenis to GSAP ticker for ScrollTrigger sync
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

lenis.on('scroll', ScrollTrigger.update);

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
// SCROLL PROGRESS BAR
// ============================================
const scrollProgress = document.getElementById('scrollProgress');
if (scrollProgress) {
  lenis.on('scroll', ({ progress }) => {
    scrollProgress.style.width = `${progress * 100}%`;
  });
}

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
// CUSTOM MAGNETIC CURSOR
// ============================================
const cursorDot = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');

if (cursorDot && cursorRing && window.matchMedia('(hover: hover)').matches) {
  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;
  const magneticEls = document.querySelectorAll(
    '.btn, .nav-link, .project-card, .contact-link, .blog-card, .skill-chip, .trait-chip, .theme-toggle'
  );

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    gsap.to(cursorDot, {
      x: mouseX,
      y: mouseY,
      duration: 0.12,
      ease: 'power3.out',
    });
  });

  // Lag the ring for a trailing feel
  (function animateRing() {
    ringX += (mouseX - ringX) * 0.1;
    ringY += (mouseY - ringY) * 0.1;
    gsap.set(cursorRing, { x: ringX, y: ringY });
    requestAnimationFrame(animateRing);
  })();

  // Hover state — magnetic pull toward element center
  magneticEls.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursorDot.classList.add('hovering');
      cursorRing.classList.add('hovering');
    });
    el.addEventListener('mouseleave', () => {
      cursorDot.classList.remove('hovering');
      cursorRing.classList.remove('hovering');
    });
  });

  document.addEventListener('mouseleave', () => {
    gsap.to([cursorDot, cursorRing], { opacity: 0, duration: 0.3 });
  });
  document.addEventListener('mouseenter', () => {
    gsap.to([cursorDot, cursorRing], { opacity: 1, duration: 0.3 });
  });
}

// ============================================
// CIRCUIT CANVAS ANIMATION
// ============================================
(function initCircuit() {
  const canvas = document.getElementById('circuit-canvas');
  if (!canvas) return;
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

  function draw() {
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

      if (n.dot && n.progress > GRID) {
        const ex = n.dir === 'h' ? n.x + drawn : n.x;
        const ey = n.dir === 'h' ? n.y : n.y + drawn;
        ctx.beginPath();
        ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();
      }

      ctx.restore();

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
// HERO — Cinematic Letter-by-Letter Reveal
// (Splitting.js breaks "Gautam" into .char spans)
// ============================================
if (typeof Splitting !== 'undefined') {
  Splitting(); // splits all [data-splitting] elements
}

const heroName = document.getElementById('hero-name');
const heroChars = heroName?.querySelectorAll('.char');

// Set initial states
gsap.set('#hero-eyebrow, #hero-tagline, #hero-status, #hero-cta', {
  opacity: prefersReducedMotion ? 1 : 0,
  y: prefersReducedMotion ? 0 : 30,
});

if (heroChars?.length) {
  gsap.set(heroChars, {
    opacity: prefersReducedMotion ? 1 : 0,
    y: prefersReducedMotion ? 0 : 80,
    rotateX: prefersReducedMotion ? 0 : -90,
    transformOrigin: '50% 100%',
    filter: prefersReducedMotion ? 'none' : 'blur(8px)',
  });
}

if (!prefersReducedMotion) {
  const heroTl = gsap.timeline({ delay: 0.15 });

  heroTl
    .to('#hero-eyebrow', {
      opacity: 1, y: 0, duration: 0.6, ease: 'power3.out'
    })
    .to(heroChars, {
      opacity: 1,
      y: 0,
      rotateX: 0,
      filter: 'blur(0px)',
      duration: 0.7,
      stagger: { each: 0.07, ease: 'power2.out' },
      ease: 'back.out(1.4)',
    }, '-=0.2')
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
  gsap.fromTo(el,
    { opacity: 0, y: 40 },
    {
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
      opacity: 1,
      y: 0,
      duration: 0.75,
      ease: 'power3.out',
    }
  );
});

// ============================================
// SCROLL REVEAL — Cards (staggered per group)
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
  gsap.fromTo(group,
    { opacity: 0, y: 50 },
    {
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
    }
  );
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
    gsap.fromTo(timelineItems,
      { opacity: 0, x: -30 },
      {
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
      }
    );
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
// HORIZONTAL SCROLL REEL — Projects
// Pins the reel section and moves cards left
// ============================================
(function initHorizontalReel() {
  const track = document.getElementById('projectsTrack');
  const wrapper = document.getElementById('projectsReel');
  const section = document.getElementById('projects');
  if (!track || !wrapper || !section || prefersReducedMotion) return;

  const isDesktop = () => window.innerWidth > 768;

  function buildReel() {
    ScrollTrigger.getAll()
      .filter(st => st.vars?.id === 'projects-reel')
      .forEach(st => st.kill());

    if (!isDesktop()) {
      gsap.set(track, { x: 0 });
      return;
    }

    const totalWidth = track.scrollWidth;
    const viewportWidth = window.innerWidth;
    const scrollDistance = totalWidth - viewportWidth + 80;

    gsap.to(track, {
      x: -scrollDistance,
      ease: 'none',
      scrollTrigger: {
        id: 'projects-reel',
        trigger: section,        // pin whole section — starts when heading hits top
        pin: true,
        scrub: 1,
        start: 'top top',
        end: () => `+=${scrollDistance}`,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
  }

  buildReel();
  window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
    buildReel();
  }, { passive: true });

  // Show reel hint
  const reelHint = document.querySelector('.reel-hint');
  if (reelHint) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 80%',
      onEnter: () => reelHint.classList.add('visible'),
    });
  }

  // Mobile fallback stagger
  const projectCards = document.querySelectorAll('.project-card');
  if (!isDesktop() && projectCards.length) {
    gsap.set(projectCards, { opacity: 0, y: 40 });
    gsap.to(projectCards, {
      scrollTrigger: { trigger: wrapper, start: 'top 80%' },
      opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out',
    });
  }
})();

// ============================================
// SMOOTH SCROLL for anchor links
// (Works with Lenis)
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -80, duration: 1.2 });
  });
});

// ============================================
// PAGE TRANSITION — exit animation on navigate
// ============================================
const pageTransitionEl = document.getElementById('pageTransition');

function triggerPageExit(href) {
  if (!pageTransitionEl) { window.location.href = href; return; }

  gsap.to(pageTransitionEl, {
    scaleY: 1,
    duration: 0.55,
    ease: 'power4.inOut',
    transformOrigin: 'bottom',
    onComplete: () => { window.location.href = href; },
  });
}

// Intercept all same-origin non-anchor link clicks
document.querySelectorAll('a:not([href^="#"]):not([target="_blank"]):not([href^="mailto"])').forEach(link => {
  const href = link.getAttribute('href');
  if (!href || href.startsWith('http') || href.startsWith('//')) return;

  link.addEventListener('click', e => {
    e.preventDefault();
    triggerPageExit(href);
  });
});

// Reveal page on enter (in case browser back button returns here)
window.addEventListener('pageshow', () => {
  if (pageTransitionEl) {
    gsap.set(pageTransitionEl, { scaleY: 0, transformOrigin: 'top' });
  }
});
