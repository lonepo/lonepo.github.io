/**
 * PLL Design Calculator — JS port of pll.py
 * Computes LCL filter, current control, PLL gains, DC link sizing
 * with verification checks for 3-phase grid-connected inverter design.
 */

/* ── Core Calculation Engine ── */
function designInverter(params) {
  const {
    P_rated,
    Vg_LL,
    f_g,
    f_sw,
    Vdc: Vdc_input = null,
    ripple_percent = 0.15,
    L2_ratio = 0.5,
    Cf_percent = 0.05,
    current_loop_bandwidth_ratio = 0.05,
    pll_bandwidth = 30,
    dc_ripple_voltage = 10.0,
    damping_zeta = 0.707,
  } = params;

  const PI2 = 2 * Math.PI;

  // 1. BASE VALUES
  const Vph_rms = Vg_LL / Math.sqrt(3);
  const Iph_rms = P_rated / (3 * Vph_rms);
  const Iph_peak = Iph_rms * Math.sqrt(2);
  const Vdc_min = Math.sqrt(2) * Vg_LL;
  let Vdc = Vdc_input !== null ? Vdc_input : Vdc_min * 1.25;

  if (Vdc < Vdc_min) {
    return { error: `Vdc must be at least ${Vdc_min.toFixed(1)} V` };
  }

  // 2. LCL FILTER
  const delta_I_max = ripple_percent * Iph_peak;
  const L1_min = Vdc / (8 * f_sw * delta_I_max);
  const L1 = L1_min * 1.1;
  const delta_I_actual = Vdc / (8 * f_sw * L1);

  const Cf_max = (Cf_percent * P_rated) / (3 * Vph_rms ** 2 * PI2 * f_g);
  const Cf = Cf_max * 0.8;

  const L2 = L2_ratio * L1;
  const f_res = (1 / PI2) * Math.sqrt((L1 + L2) / (L1 * L2 * Cf));
  const Rd = 1 / (3 * PI2 * f_res * Cf);

  const attenuation_sw = 1 / Math.abs(1 - (f_sw / f_res) ** 2);
  const attenuation_dB = 20 * Math.log10(attenuation_sw);

  // 3. CURRENT CONTROL (dq-frame PI)
  const L_tot = L1 + L2;
  const R_tot = 0.1;
  const alpha = PI2 * current_loop_bandwidth_ratio * f_sw;
  const Kp = alpha * L_tot;
  const Ki = alpha * R_tot;
  const omega = PI2 * f_g;
  const decoupling_factor = omega * L_tot;

  // 4. SRF-PLL
  const omega_n = pll_bandwidth;
  const Kp_pll = 2 * damping_zeta * omega_n;
  const Ki_pll = omega_n ** 2;

  // 5. DC LINK CAPACITOR
  const Cdc = P_rated / (PI2 * f_g * Vdc * dc_ripple_voltage);
  const Vg_d = Math.sqrt(2) * Vph_rms;
  const dc_plant_gain = (3 * Vg_d) / (2 * Vdc * Cdc);
  const omega_outer = alpha / 10;
  const Kp_dc = omega_outer / dc_plant_gain;
  const Ki_dc = 0.1 * omega_outer ** 2;

  // 6. VERIFICATION
  const checks = {};

  checks.Vdc_margin = {
    pass: Vdc >= 1.2 * Vdc_min,
    msg: `Vdc = ${Vdc.toFixed(1)} V ≥ 1.2×Vdc_min = ${(1.2 * Vdc_min).toFixed(1)} V`,
  };

  checks.resonance = {
    pass: f_res > 10 * f_g && f_res < 0.5 * f_sw,
    msg: `f_res = ${f_res.toFixed(1)} Hz : ${(10 * f_g).toFixed(0)} < ${f_res.toFixed(1)} < ${(0.5 * f_sw).toFixed(0)} Hz`,
  };

  checks.current_bw = {
    pass: alpha < 0.1 * PI2 * f_sw,
    msg: `Current BW = ${(alpha / PI2).toFixed(1)} Hz < 0.1×f_sw = ${(0.1 * f_sw).toFixed(1)} Hz`,
  };

  checks.pll_bw = {
    pass: omega_n > 2 * PI2 * f_g,
    msg: `PLL ωₙ = ${(omega_n / PI2).toFixed(1)} Hz > 2×f_g = ${(2 * f_g).toFixed(1)} Hz`,
  };

  checks.attenuation = {
    pass: attenuation_dB > 20,
    msg: `Attenuation = ${attenuation_dB.toFixed(1)} dB > 20 dB`,
  };

  const Prd_est = Vg_LL ** 2 * Cf * PI2 * f_res * 0.1;
  checks.rd_power = {
    pass: Prd_est < 5.0,
    msg: `Rd power ≈ ${Prd_est.toFixed(2)} W (< 5W ok)`,
  };

  const all_passed = Object.values(checks).every((c) => c.pass);

  return {
    base: { Vph_rms, Iph_rms, Iph_peak, Vdc_min, Vdc },
    lcl: {
      L1: L1 * 1000,
      L2: L2 * 1000,
      Cf: Cf * 1e6,
      Rd,
      f_res,
      delta_I_actual,
      attenuation_dB,
      L_tot: L_tot * 1000,
    },
    current: {
      Kp,
      Ki,
      decoupling_factor,
      bandwidth_hz: alpha / PI2,
    },
    pll: {
      Kp_pll,
      Ki_pll,
      omega_n_hz: omega_n / PI2,
    },
    dc: {
      Cdc: Cdc * 1000,
      Kp_dc,
      Ki_dc,
    },
    checks,
    all_passed,
  };
}

/* ── DOM: Calculator UI ── */
function initCalculator() {
  const container = document.getElementById('calcContainer');
  if (!container) return;

  let debounceTimer = null;

  // Gather input elements
  const inputs = {
    P_rated: document.getElementById('calc-P'),
    Vg_LL: document.getElementById('calc-V'),
    f_g: document.getElementById('calc-fg'),
    f_sw: document.getElementById('calc-fsw'),
    // Advanced
    Vdc: document.getElementById('calc-Vdc'),
    ripple_percent: document.getElementById('calc-ripple'),
    L2_ratio: document.getElementById('calc-L2ratio'),
    Cf_percent: document.getElementById('calc-Cf'),
    current_loop_bandwidth_ratio: document.getElementById('calc-bw'),
    pll_bandwidth: document.getElementById('calc-pllbw'),
    dc_ripple_voltage: document.getElementById('calc-dcripple'),
  };

  // Advanced toggle
  const advToggle = document.getElementById('calcAdvToggle');
  const advPanel = document.getElementById('calcAdvanced');
  if (advToggle && advPanel) {
    advToggle.addEventListener('click', () => {
      advToggle.classList.toggle('open');
      advPanel.classList.toggle('open');
    });
  }

  // Collect values from inputs
  function getParams() {
    const p = {};
    for (const [key, el] of Object.entries(inputs)) {
      if (!el) continue;
      const v = parseFloat(el.value);
      if (!isNaN(v) && v > 0) p[key] = v;
    }
    // Handle Vdc: if empty or 0, let it auto-calculate
    if (!p.Vdc || p.Vdc <= 0) p.Vdc = null;
    return p;
  }

  function renderResults(r) {
    const resultsEl = document.getElementById('calcResults');
    if (!resultsEl) return;

    if (r.error) {
      resultsEl.innerHTML = `<div class="calc-card"><p style="color:#ff4d6a">${r.error}</p></div>`;
      return;
    }

    resultsEl.innerHTML = `
      ${buildCard('Base Values', [
        ['V_ph (RMS)', `${r.base.Vph_rms.toFixed(2)} V`],
        ['I_ph (RMS)', `${r.base.Iph_rms.toFixed(2)} A`],
        ['I_ph (peak)', `${r.base.Iph_peak.toFixed(2)} A`],
        ['V_dc', `${r.base.Vdc.toFixed(1)} V`],
        ['V_dc (min)', `${r.base.Vdc_min.toFixed(1)} V`],
      ])}
      ${buildCard('LCL Filter', [
        ['L₁', `${r.lcl.L1.toFixed(3)} mH`],
        ['L₂', `${r.lcl.L2.toFixed(3)} mH`],
        ['L_total', `${r.lcl.L_tot.toFixed(3)} mH`],
        ['C_f', `${r.lcl.Cf.toFixed(3)} µF`],
        ['R_d', `${r.lcl.Rd.toFixed(3)} Ω`],
        ['f_res', `${r.lcl.f_res.toFixed(1)} Hz`],
        ['ΔI_actual', `${r.lcl.delta_I_actual.toFixed(3)} A`],
        ['Attn @ f_sw', `${r.lcl.attenuation_dB.toFixed(1)} dB`],
      ])}
      ${buildCard('Current Control', [
        ['Kp', `${r.current.Kp.toFixed(4)}`],
        ['Ki', `${r.current.Ki.toFixed(4)}`],
        ['Decoupling', `${r.current.decoupling_factor.toFixed(4)}`],
        ['Bandwidth', `${r.current.bandwidth_hz.toFixed(1)} Hz`],
      ])}
      ${buildCard('PLL (SRF)', [
        ['Kp_pll', `${r.pll.Kp_pll.toFixed(4)}`],
        ['Ki_pll', `${r.pll.Ki_pll.toFixed(2)}`],
        ['ωₙ', `${r.pll.omega_n_hz.toFixed(2)} Hz`],
      ])}
      ${buildCard('DC Link', [
        ['C_dc', `${r.dc.Cdc.toFixed(3)} mF`],
        ['Kp_dc', `${r.dc.Kp_dc.toFixed(4)}`],
        ['Ki_dc', `${r.dc.Ki_dc.toFixed(4)}`],
      ])}
    `;

    renderChecks(r.checks, r.all_passed);
  }

  function buildCard(title, rows) {
    return `
      <div class="calc-card">
        <div class="calc-card-title">${title}</div>
        ${rows
          .map(
            ([label, value]) => `
          <div class="calc-row">
            <span class="calc-row-label">${label}</span>
            <span class="calc-row-value">${value}</span>
          </div>`
          )
          .join('')}
      </div>`;
  }

  function renderChecks(checks, allPassed) {
    const el = document.getElementById('calcChecks');
    if (!el) return;

    el.innerHTML = `
      <h3>Verification ${allPassed ? '— All Passed ✓' : '— Issues Found'}</h3>
      ${Object.entries(checks)
        .map(
          ([, c]) => `
        <div class="check-item">
          <span class="check-badge ${c.pass ? 'pass' : 'fail'}">${c.pass ? '✓' : '✗'}</span>
          <span class="check-msg">${c.msg}</span>
        </div>`
        )
        .join('')}
    `;
  }

  function calculate() {
    const params = getParams();
    if (!params.P_rated || !params.Vg_LL || !params.f_g || !params.f_sw) return;
    const results = designInverter(params);
    renderResults(results);
  }

  // Bind inputs
  for (const el of Object.values(inputs)) {
    if (!el) continue;
    el.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(calculate, 300);
    });
  }

  // Initial calculation with defaults
  calculate();
}

// Export for use in pll-main.js
window.PLLCalculator = { init: initCalculator, designInverter };
