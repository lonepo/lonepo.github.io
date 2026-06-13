"""
3-Phase Grid-Connected Inverter Design Script
=============================================
This script designs a 3-phase inverter with LCL filter, current control,
PLL, and DC link capacitor. It uses the dq-frame control approach.

All assumptions and design choices are explicitly stated in comments.
The script performs automated verification of key constraints.
"""

import math

def design_inverter(P_rated, Vg_LL, f_g, f_sw, Vdc=None, ripple_percent=0.15,
                    L2_ratio=0.5, Cf_percent=0.05, damping_zeta=0.707,
                    current_loop_bandwidth_ratio=0.05, pll_bandwidth=30,
                    dc_ripple_voltage=10.0):
    """
    Design a 3-phase grid-connected inverter.

    Parameters
    ----------
    P_rated : float
        Rated active power [W]
    Vg_LL : float
        Grid line-to-line RMS voltage [V]
    f_g : float
        Grid frequency [Hz]
    f_sw : float
        Switching frequency [Hz]
    Vdc : float, optional
        DC link voltage. If None, it will be automatically set to sqrt(2)*Vg_LL*1.25
    ripple_percent : float
        Allowed current ripple as fraction of peak current (default 0.15)
    L2_ratio : float
        Ratio L2/L1 (default 0.5)
    Cf_percent : float
        Maximum reactive power absorbed by Cf as fraction of P_rated (default 0.05)
    damping_zeta : float
        Damping ratio for PLL (default 0.707)
    current_loop_bandwidth_ratio : float
        Current loop bandwidth as fraction of switching frequency (default 0.05)
    pll_bandwidth : float
        PLL natural frequency [rad/s] (default 30)
    dc_ripple_voltage : float
        Allowed DC voltage ripple (peak-to-peak) [V] (default 10)

    Returns
    -------
    dict
        Dictionary containing all design parameters and verification results
    """

    # =========================================================================
    # 1. BASE VALUES
    # =========================================================================
    # Assumption: Balanced three-phase system, unity power factor for design
    #             (the controller can adjust for non-unity PF later)
    Vph_rms = Vg_LL / math.sqrt(3)                    # Phase RMS voltage [V]
    Iph_rms = P_rated / (3 * Vph_rms)                 # Rated phase RMS current [A]
    Iph_peak = Iph_rms * math.sqrt(2)                 # Rated phase peak current [A]

    # Assumption: Choose DC link voltage with 25% margin above minimum required
    #             for overmodulation avoidance (typical design practice)
    Vdc_min = math.sqrt(2) * Vg_LL                    # Minimum needed for linear modulation
    if Vdc is None:
        Vdc = Vdc_min * 1.25
    else:
        if Vdc < Vdc_min:
            raise ValueError(f"Vdc must be at least {Vdc_min:.1f} V")

    # =========================================================================
    # 2. LCL FILTER DESIGN
    # =========================================================================
    # Assumption: We will use a third-order LCL filter with series damping resistor
    #             to attenuate switching harmonics.

    # 2.1 Inverter-side inductor L1
    #     Limit peak-to-peak current ripple to 'ripple_percent' of Iph_peak
    #     Using worst-case SVPWM ripple formula: ΔI_max = Vdc / (8 * f_sw * L1)
    delta_I_max = ripple_percent * Iph_peak
    L1_min = Vdc / (8 * f_sw * delta_I_max)           # Minimum L1 [H]
    L1 = L1_min * 1.1                                  # Add 10% margin (standard practice)
    # Actual ripple after choosing L1
    delta_I_actual = Vdc / (8 * f_sw * L1)

    # 2.2 Filter capacitor Cf
    #     Limit reactive power absorbed by Cf to 'Cf_percent' of rated power
    #     Cf absorbs Q = 3 * (Vph_rms)^2 * (2*pi*f_g) * Cf
    Cf_max = (Cf_percent * P_rated) / (3 * (Vph_rms**2) * 2 * math.pi * f_g)
    Cf = Cf_max * 0.8                                  # Choose 80% of max to be safe

    # 2.3 Grid-side inductor L2
    #     Assumption: "Strong grid" -> L2 smaller than L1. For weak grids, increase L2_ratio.
    L2 = L2_ratio * L1

    # 2.4 Resonance frequency
    #     f_res = (1/(2π)) * sqrt((L1+L2)/(L1*L2*Cf))
    L_parallel = (L1 * L2) / (L1 + L2)                  # Equivalent parallel inductance
    f_res = (1 / (2 * math.pi)) * math.sqrt((L1 + L2) / (L1 * L2 * Cf))

    # 2.5 Damping resistor Rd
    #     Place in series with Cf. Use: Rd = 1 / (3 * 2π * f_res * Cf)
    #     Assumption: This gives a damping ratio around 0.3-0.5 for most designs
    Rd = 1 / (3 * 2 * math.pi * f_res * Cf)

    # 2.6 Attenuation at switching frequency
    #     Attenuation = 1 / |1 - (f_sw/f_res)^2|
    attenuation_sw = 1 / abs(1 - (f_sw / f_res)**2)
    attenuation_dB = 20 * math.log10(attenuation_sw)

    # =========================================================================
    # 3. CURRENT CONTROL (dq-frame PI)
    # =========================================================================
    # Assumption: The plant for current control is approximated as
    #             G(s) = 1 / (L_tot * s + R_tot), where R_tot includes parasitic resistances.
    #             We neglect Cf dynamics for controller design (valid below f_res).

    L_tot = L1 + L2                                    # Total inductance [H]
    R_tot = 0.1                                         # Assumed parasitic resistance [Ohm]
    # Assumption: Parasitic resistance is 0.1 Ohm (typical for wires + inductor ESR).
    #             Could be measured or adjusted.

    # Choose current loop bandwidth: typically 5-10% of switching frequency
    alpha = 2 * math.pi * (current_loop_bandwidth_ratio * f_sw)   # [rad/s]

    # PI gains using symmetric optimum method (bandwidth alpha)
    Kp = alpha * L_tot
    Ki = alpha * R_tot

    # Cross-coupling decoupling term: omega * L_tot
    omega = 2 * math.pi * f_g
    decoupling_factor = omega * L_tot

    # =========================================================================
    # 4. SYNCHRONOUS REFERENCE FRAME PLL
    # =========================================================================
    # Assumption: Simple SRF-PLL with PI controller
    #             Phase error = v_q (grid voltage q-component)
    #             PI output is estimated frequency deviation
    omega_n = pll_bandwidth                              # Natural frequency [rad/s]
    Kp_pll = 2 * damping_zeta * omega_n
    Ki_pll = omega_n**2

    # =========================================================================
    # 5. DC LINK CAPACITOR (optional outer loop)
    # =========================================================================
    # Assumption: The DC capacitor is sized to limit voltage ripple at rated power
    #             to 'dc_ripple_voltage' (peak-to-peak) at grid frequency (double ripple).
    #             For a single-phase rectifier ripple is 2*f_g. For three-phase
    #             inverter, the ripple is 6*f_g, but we use 2*f_g as conservative.
    #             Formula: Cdc >= P_rated / (2*pi*f_g * Vdc * dVdc)
    Cdc = P_rated / (2 * math.pi * f_g * Vdc * dc_ripple_voltage)

    # Outer loop PI gains (optional) - bandwidth 1/10 of current loop
    # Assumption: Small-signal model: dVdc/dt = (3*Vg_d * id) / (2*Vdc*Cdc)
    Vg_d = math.sqrt(2) * Vph_rms                      # d-axis grid voltage (peak) [V]
    dc_plant_gain = (3 * Vg_d) / (2 * Vdc * Cdc)        # Gain of Gdc(s) = K/s
    # Choose outer loop crossover at alpha/10
    omega_outer = alpha / 10
    # Use PI: Kp_outer = omega_outer / dc_plant_gain, Ki_outer = omega_outer^2 * 0.1 (approx)
    Kp_dc = omega_outer / dc_plant_gain
    Ki_dc = 0.1 * (omega_outer**2)                      # Arbitrary, tune in simulation

    # =========================================================================
    # 6. VERIFICATION CHECKS
    # =========================================================================
    # Each check returns True if passes, False otherwise.

    checks = {}

    # Check 1: DC voltage margin
    checks['Vdc_margin'] = Vdc >= 1.2 * Vdc_min   # 20% margin recommended
    check1_msg = f"Vdc = {Vdc:.1f} V >= 1.2*Vdc_min = {1.2*Vdc_min:.1f} V"

    # Check 2: Resonance frequency constraints
    # Must satisfy: 10*f_g < f_res < 0.5*f_sw
    checks['resonance_lower'] = f_res > 10 * f_g
    checks['resonance_upper'] = f_res < 0.5 * f_sw
    check2_msg = f"f_res = {f_res:.1f} Hz: {10*f_g:.1f} < {f_res:.1f} < {0.5*f_sw:.1f} Hz"

    # Check 3: Current loop bandwidth relative to switching frequency
    # Should be < 0.1*f_sw to avoid switching noise
    checks['current_bandwidth'] = alpha < 0.1 * 2 * math.pi * f_sw
    check3_msg = f"Current loop BW = {alpha/(2*math.pi):.1f} Hz < 0.1*f_sw = {0.1*f_sw:.1f} Hz"

    # Check 4: PLL bandwidth relative to grid frequency
    # Should be > 2*f_g (fast enough) and < f_g/2? Actually PLL BW is typically 5-10% of f_g.
    # Here we just check it's > 2*f_g to avoid slow tracking.
    checks['pll_bandwidth'] = omega_n > 2 * 2 * math.pi * f_g
    check4_msg = f"PLL nat freq = {omega_n/(2*math.pi):.1f} Hz > 2*f_g = {2*f_g:.1f} Hz"

    # Check 5: Attenuation at switching frequency should be > 20 dB
    checks['attenuation'] = attenuation_dB > 20
    check5_msg = f"Switching attenuation = {attenuation_dB:.1f} dB > 20 dB"

    # Check 6: Damping resistor power rating (estimate)
    # Worst-case power in Rd at resonance (simplified)
    # Use: P_Rd_max = (Vg_LL^2) * Cf * 2*pi*f_res * (some factor)
    # Not a strict design limit but useful as a sanity check.
    Prd_est = (Vg_LL**2) * Cf * 2 * math.pi * f_res * 0.1   # Rough estimate
    checks['rd_power'] = Prd_est < 5.0                    # < 5 W is acceptable
    check6_msg = f"Estimated Rd power = {Prd_est:.2f} W (<5W is fine)"

    # =========================================================================
    # 7. COMPILE RESULTS
    # =========================================================================
    results = {
        'Inputs': {
            'P_rated': P_rated,
            'Vg_LL': Vg_LL,
            'f_g': f_g,
            'f_sw': f_sw,
            'Vdc': Vdc,
            'ripple_percent': ripple_percent,
            'L2_ratio': L2_ratio,
            'Cf_percent': Cf_percent,
            'current_loop_bandwidth_ratio': current_loop_bandwidth_ratio,
            'pll_bandwidth': pll_bandwidth,
            'dc_ripple_voltage': dc_ripple_voltage,
        },
        'Base values': {
            'Vph_rms': Vph_rms,
            'Iph_rms': Iph_rms,
            'Iph_peak': Iph_peak,
            'Vdc_min': Vdc_min,
        },
        'LCL filter': {
            'L1': L1 * 1000,           # mH
            'L2': L2 * 1000,
            'Cf': Cf * 1e6,            # uF
            'Rd': Rd,
            'f_res': f_res,
            'delta_I_actual': delta_I_actual,
            'attenuation_dB': attenuation_dB,
            'L_tot': L_tot * 1000,     # mH
        },
        'Current control': {
            'Kp': Kp,
            'Ki': Ki,
            'decoupling_factor': decoupling_factor,
            'current_bandwidth_hz': alpha / (2 * math.pi),
        },
        'PLL': {
            'Kp_pll': Kp_pll,
            'Ki_pll': Ki_pll,
            'omega_n_hz': omega_n / (2 * math.pi),
        },
        'DC link': {
            'Cdc': Cdc * 1000,        # mF
            'Kp_dc': Kp_dc,
            'Ki_dc': Ki_dc,
        },
        'Verification': {
            'checks': {
                'Vdc_margin': (check1_msg, checks['Vdc_margin']),
                'Resonance': (check2_msg, checks['resonance_lower'] and checks['resonance_upper']),
                'Current BW': (check3_msg, checks['current_bandwidth']),
                'PLL BW': (check4_msg, checks['pll_bandwidth']),
                'Attenuation': (check5_msg, checks['attenuation']),
                'Rd power': (check6_msg, checks['rd_power']),
            },
            'all_passed': all(checks.values())
        }
    }

    return results


def print_design(results):
    """Pretty print the design results."""
    print("\n" + "="*70)
    print("3-PHASE GRID-CONNECTED INVERTER DESIGN")
    print("="*70)

    print("\n=== INPUTS ===")
    for k, v in results['Inputs'].items():
        print(f"{k:20s} : {v}")

    print("\n=== BASE VALUES ===")
    for k, v in results['Base values'].items():
        print(f"{k:20s} : {v:.3f}")

    print("\n=== LCL FILTER ===")
    for k, v in results['LCL filter'].items():
        if k in ['L1', 'L2', 'L_tot']:
            print(f"{k:20s} : {v:.3f} mH")
        elif k == 'Cf':
            print(f"{k:20s} : {v:.3f} µF")
        elif k == 'f_res':
            print(f"{k:20s} : {v:.1f} Hz")
        elif k == 'attenuation_dB':
            print(f"{k:20s} : {v:.1f} dB")
        else:
            print(f"{k:20s} : {v:.4f}")

    print("\n=== CURRENT CONTROL (dq-frame PI) ===")
    for k, v in results['Current control'].items():
        print(f"{k:20s} : {v:.4f}")

    print("\n=== PLL (SRF-PLL) ===")
    for k, v in results['PLL'].items():
        print(f"{k:20s} : {v:.4f}")

    print("\n=== DC LINK ===")
    for k, v in results['DC link'].items():
        if k == 'Cdc':
            print(f"{k:20s} : {v:.3f} mF")
        else:
            print(f"{k:20s} : {v:.4f}")

    print("\n=== VERIFICATION CHECKS ===")
    for name, (msg, passed) in results['Verification']['checks'].items():
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{name:15s} : {status}   ({msg})")
    print("\nOverall design:", "PASS" if results['Verification']['all_passed'] else "FAIL")
    print("="*70)


# =============================================================================
# EXAMPLE USAGE
# =============================================================================
if __name__ == "__main__":
    # Example: 10 kW, 400V, 50Hz, 10kHz switching
    design = design_inverter(
        P_rated=10000,
        Vg_LL=400,
        f_g=50,
        f_sw=10000,
        Vdc=None          # automatically calculated
    )
    print_design(design)

    # You can change the inputs to design for any rating, e.g.:
    # design = design_inverter(P_rated=5000, Vg_LL=208, f_g=60, f_sw=20000)