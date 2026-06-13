/**
 * PLL Blog — Main Orchestrator
 * ScrollTrigger setup, KaTeX init, theme observer,
 * canvas resize handling, animation lifecycle.
 */

document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  /* ── Theme Toggle ── */
  document.getElementById('themeToggle')?.addEventListener('click', () => {
    const h = document.documentElement;
    const next = h.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    h.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });

  /* ── Hamburger ── */
  const ham = document.getElementById('hamburger');
  const nl = document.getElementById('nav-links');
  ham?.addEventListener('click', () => nl.classList.toggle('open'));

  /* ── KaTeX Auto-Render ── */
  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
      ],
      throwOnError: false,
    });
  }

  /* ── Prose reveal animations ── */
  gsap.utils.toArray('.pll-section .prose, .pll-section h2, .pll-section .pll-section-label').forEach(el => {
    gsap.from(el, {
      opacity: 0,
      y: 30,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
    });
  });

  /* ── Canvas wrap reveal ── */
  gsap.utils.toArray('.canvas-wrap, .diagram-wrap, .calc-container').forEach(el => {
    gsap.from(el, {
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 80%',
        once: true,
      },
    });
  });

  /* ═══════════════════════════════════════════
     Animation Instances
  ═══════════════════════════════════════════ */
  const { GridWaveform, SPWMWaveform, ClarkeTransform, ParkPLL } = window.PLLAnimations;

  // 1. Grid Waveform
  const gridAnim = new GridWaveform('canvasGrid');
  gridAnim.init();
  ScrollTrigger.create({
    trigger: '#canvasGrid',
    start: 'top 90%',
    end: 'bottom 10%',
    onEnter: () => gridAnim.start(),
    onLeave: () => gridAnim.stop(),
    onEnterBack: () => gridAnim.start(),
    onLeaveBack: () => gridAnim.stop(),
  });

  // 2. SPWM Waveform
  const spwmAnim = new SPWMWaveform('canvasSPWM');
  spwmAnim.init();
  ScrollTrigger.create({
    trigger: '#canvasSPWM',
    start: 'top 90%',
    end: 'bottom 10%',
    onEnter: () => spwmAnim.start(),
    onLeave: () => spwmAnim.stop(),
    onEnterBack: () => spwmAnim.start(),
    onLeaveBack: () => spwmAnim.stop(),
  });

  // 3. Clarke Transform
  const clarkeAnim = new ClarkeTransform('canvasClarkeABC', 'canvasClarkeAB');
  clarkeAnim.init();
  ScrollTrigger.create({
    trigger: '#canvasClarkeABC',
    start: 'top 90%',
    end: 'bottom 10%',
    onEnter: () => clarkeAnim.start(),
    onLeave: () => clarkeAnim.stop(),
    onEnterBack: () => clarkeAnim.start(),
    onLeaveBack: () => clarkeAnim.stop(),
  });

  // 4. Park PLL
  const parkAnim = new ParkPLL('canvasPLL', 'canvasError');
  parkAnim.init();
  ScrollTrigger.create({
    trigger: '#canvasPLL',
    start: 'top 90%',
    end: 'bottom 10%',
    onEnter: () => parkAnim.start(),
    onLeave: () => parkAnim.stop(),
    onEnterBack: () => parkAnim.start(),
    onLeaveBack: () => parkAnim.stop(),
  });

  // PLL button
  const pllBtn = document.getElementById('pllStartBtn');
  if (pllBtn) {
    pllBtn.addEventListener('click', () => {
      if (parkAnim.pllStarted) {
        parkAnim.resetPLL();
        pllBtn.textContent = 'Start PLL';
        pllBtn.classList.remove('running');
      } else {
        parkAnim.startPLL();
        pllBtn.textContent = 'Reset PLL';
        pllBtn.classList.add('running');
      }
    });
  }

  // Damping slider
  const dampSlider = document.getElementById('dampingSlider');
  const dampValue = document.getElementById('dampingValue');
  if (dampSlider) {
    dampSlider.addEventListener('input', () => {
      const z = parseFloat(dampSlider.value);
      parkAnim.setDamping(z);
      if (dampValue) dampValue.textContent = z.toFixed(2);
    });
  }

  /* ── Block Diagram ── */
  if (window.PLLDiagram) {
    window.PLLDiagram.init();
  }

  /* ── Calculator ── */
  if (window.PLLCalculator) {
    window.PLLCalculator.init();
  }

  /* ── Canvas Resize Handler ── */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      gridAnim.resize(); gridAnim.draw();
      spwmAnim.resize(); spwmAnim.draw();
      clarkeAnim.resize(); clarkeAnim.draw();
      parkAnim.resize(); parkAnim.draw();
    }, 200);
  });

  /* ── Theme Change Observer ── */
  const observer = new MutationObserver(() => {
    // Redraw canvases to pick up new colors
    gridAnim.draw();
    spwmAnim.draw();
    clarkeAnim.draw();
    parkAnim.draw();
    // Re-init diagram with new colors
    if (window.PLLDiagram) window.PLLDiagram.init();
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  /* ── Reduced Motion ── */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Draw static frames, don't animate
    gridAnim.draw();
    spwmAnim.draw();
    clarkeAnim.draw();
    parkAnim.draw();
  }
});
