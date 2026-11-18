'use strict';
/* Interactive simulators. Each lab(c, act) fills container c. */
const Labs = {};
const COL = { t: '#b31b1b', n: '#1b5fb3', g: '#1f7a3d', k: '#888', o: '#c77700' };

/* ---- Session 3: linear-quadratic survival curve ---- */
Labs.survival = (c, act) => {
  let a = 0.2, b = 0.02;
  const host = el('div'), rd = el('div', { class: 'read' });
  const sa = slider('α (Gy⁻¹)', 0.02, 0.6, 0.01, a, v => v.toFixed(2), v => { a = v; draw(); });
  const sb = slider('β (Gy⁻²)', 0, 0.1, 0.002, b, v => v.toFixed(3), v => { b = v; draw(); });
  const SF = d => Math.exp(-(a * d + b * d * d));
  function draw() {
    plot(host, { xmin: 0, xmax: 12, ymin: 1e-4, ymax: 1, ylog: true, xticks: [0, 2, 4, 6, 8, 10, 12], yticks: [1, 1e-1, 1e-2, 1e-3, 1e-4], yfmt: v => v === 1 ? '1' : '1e' + Math.round(Math.log10(v)), xlabel: 'Dose (Gy)', ylabel: 'Surviving fraction',
      series: [{ f: SF, color: COL.t, label: 'your cell line' }, { f: d => Math.exp(-a * d), color: COL.k, dash: true, w: 1.5, label: 'linear (α) part only' }], points: [{ x: 2, y: SF(2), label: 'SF2' }] });
    const d10 = b > 0 ? (-a + Math.sqrt(a * a + 4 * b * Math.LN10)) / (2 * b) : Math.LN10 / a;
    readout(rd, [['α/β', b > 0 ? (a / b).toFixed(1) + ' Gy' : '∞'], ['SF at 2 Gy', fmt(SF(2), 3)], ['SF at 6 Gy', fmt(SF(6), 4)], ['Dose for SF = 0.1', d10.toFixed(1) + ' Gy']]);
  }
  c.append(el('p', { class: 'hint' }, 'Surviving fraction S = exp(−αD − βD²), plotted on a log axis. Move α and β and watch the shoulder appear and disappear. Set β = 0 to see a straight line.'), host, sa.node, sb.node, rd);
  draw();
  const state = () => ({ a, b, SF });
  challenges(c, act, [
    { text: 'Build a radioresistant line with SF2 between 0.55 and 0.65.', check: s => { const v = s.SF(2); return { ok: v > .55 && v < .65, msg: `SF2 = ${v.toFixed(2)}. ${v > .55 && v < .65 ? 'Good: a resistant line has a high SF2.' : 'Aim for 0.55–0.65.'}` }; } },
    { text: 'Build a line with α/β = 3 Gy (±0.5) and SF at 6 Gy between 0.035 and 0.065.', check: s => { const r = s.b > 0 ? s.a / s.b : 99, v = s.SF(6); const ok = Math.abs(r - 3) <= .5 && v > .035 && v < .065; return { ok, msg: `α/β = ${r.toFixed(1)}, SF6 = ${v.toFixed(3)}. ${ok ? 'A low α/β gives a strongly curved survival curve.' : 'Try α ≈ 0.17 and β ≈ 0.055.'}` }; } },
    { text: 'Make the curve straight on the log plot (no shoulder) with SF2 between 0.3 and 0.4.', check: s => { const v = s.SF(2); const ok = s.b <= 0.004 && v > .3 && v < .4; return { ok, msg: `β = ${s.b.toFixed(3)}, SF2 = ${v.toFixed(2)}. ${ok ? 'With β ≈ 0 the curve is purely exponential: no shoulder.' : 'Drop β to the minimum and tune α (≈ 0.5).'}` }; } }
  ], state);
};

/* ---- Session 4: LET vs RBE ---- */
Labs.letrbe = (c, act) => {
  const RBE = L => 1 + 3 * Math.exp(-Math.pow(Math.log(L / 100), 2) / (2 * 0.9 * 0.9));
  let x = 0.3; const L = () => Math.pow(10, x);
  const host = el('div'), rd = el('div', { class: 'read' });
  const sl = slider('log₁₀ LET', -0.5, 3, 0.02, x, v => Math.pow(10, v).toFixed(v < 1 ? 1 : 0) + ' keV/µm', v => { x = v; draw(); });
  function draw() {
    plot(host, { xmin: 0.3, xmax: 1000, ymin: 0.8, ymax: 4.4, xlog: true, xticks: [1, 10, 100, 1000], yticks: [1, 2, 3, 4], xlabel: 'LET (keV/µm), log scale', ylabel: 'RBE (schematic)', series: [{ f: RBE, color: COL.t }], points: [{ x: L(), y: RBE(L()), label: 'RBE ' + RBE(L()).toFixed(2) }], vlines: [{ x: 2, color: COL.k, label: 'x-rays ≈ 2' }] });
    const l = L(); readout(rd, [['LET', l.toFixed(1) + ' keV/µm'], ['Schematic RBE', RBE(l).toFixed(2)], ['Region', l < 10 ? 'sparsely ionizing' : l < 70 ? 'rising' : l < 150 ? 'peak' : 'overkill']]);
  }
  c.append(el('p', { class: 'hint' }, 'The curve is a schematic of the shape described in the course (RBE rises with LET, peaks near 100 keV/µm, then falls from overkill), not measured data. Drag the slider along it.'), host, sl.node, rd);
  draw();
  challenges(c, act, [
    { text: 'Find the LET with the highest RBE.', check: () => { const l = L(); return { ok: l > 70 && l < 140, msg: l > 70 && l < 140 ? `Yes, ${l.toFixed(0)} keV/µm is at the peak: ionization density is high without wasting energy.` : `${l.toFixed(0)} keV/µm is not at the peak (near 100 keV/µm).` }; } },
    { text: 'Find a LET above the peak where RBE has fallen back to about 2 (1.8–2.2).', check: () => { const l = L(), r = RBE(l); const ok = l > 120 && r > 1.8 && r < 2.2; return { ok, msg: ok ? 'This is overkill: extra energy is deposited in cells that were already inactivated.' : `RBE is ${r.toFixed(2)} at ${l.toFixed(0)} keV/µm. Move to the high-LET side of the peak.` }; } }
  ], () => ({}));
};

/* ---- Session 6: dose response & therapeutic window ---- */
Labs.doseresp = (c, act) => {
  let tD = 60, tG = 2, nD = 85, nG = 3, D = 60;
  const P = (d, d50, g) => 1 / (1 + Math.pow(d50 / Math.max(d, 1e-6), 4 * g));
  const inv = (p, d50, g) => d50 * Math.pow(p / (1 - p), 1 / (4 * g));
  const host = el('div'), rd = el('div', { class: 'read' });
  const s = [slider('Tumour TCD50 (Gy)', 40, 90, 1, tD, v => v, v => { tD = v; draw(); }), slider('Tumour γ', 1, 4, .1, tG, v => v.toFixed(1), v => { tG = v; draw(); }),
    slider('Normal tissue TD50 (Gy)', 50, 120, 1, nD, v => v, v => { nD = v; draw(); }), slider('Normal tissue γ', 1, 5, .1, nG, v => v.toFixed(1), v => { nG = v; draw(); }),
    slider('Prescribed dose (Gy)', 20, 120, 1, D, v => v, v => { D = v; draw(); })];
  const uncomp = d => P(d, tD, tG) * (1 - P(d, nD, nG));
  function best() { let bd = 20, bv = 0; for (let d = 20; d <= 120; d += .25) { const v = uncomp(d); if (v > bv) { bv = v; bd = d; } } return bd; }
  function draw() {
    plot(host, { xmin: 20, xmax: 120, ymin: 0, ymax: 1, xticks: [20, 40, 60, 80, 100, 120], yticks: [0, .25, .5, .75, 1], yfmt: v => (v * 100) + '%', xlabel: 'Dose (Gy)', ylabel: 'Probability',
      series: [{ f: d => P(d, tD, tG), color: COL.t, label: 'TCP (tumour control)' }, { f: d => P(d, nD, nG), color: COL.n, label: 'NTCP (complication)' }, { f: uncomp, color: COL.g, dash: true, label: 'Control without complication' }], vlines: [{ x: D, color: COL.k }] });
    const lo = inv(.9, tD, tG), hi = inv(.1, nD, nG);
    readout(rd, [['TCP at dose', (P(D, tD, tG) * 100).toFixed(0) + '%'], ['NTCP at dose', (P(D, nD, nG) * 100).toFixed(0) + '%'], ['Dose for 90% TCP', lo.toFixed(0) + ' Gy'], ['Dose for 10% NTCP', hi.toFixed(0) + ' Gy'], ['Window', lo < hi ? 'open (' + (hi - lo).toFixed(0) + ' Gy)' : 'closed']]);
  }
  c.append(el('p', { class: 'hint' }, 'Sigmoid dose-response with P = 1/(1 + (D50/D)^(4γ)). D50 sets position, γ sets steepness. The window is open when the dose giving 90% control is lower than the dose giving 10% complications.'), host, ...s.map(x => x.node), rd);
  draw();
  challenges(c, act, [
    { text: 'Set the prescribed dose to maximize control without complication (green curve peak), within ±3 Gy.', check: () => { const b = best(); const ok = Math.abs(D - b) <= 3; return { ok, msg: ok ? `The optimum is about ${b.toFixed(0)} Gy. Beyond it, extra control costs more complications.` : `Your dose is ${D} Gy; the green curve peaks near ${b.toFixed(0)} Gy... find the peak.` }; } },
    { text: 'Open the window (90% TCP dose below 10% NTCP dose) by changing only the normal-tissue parameters.', check: () => { const lo = inv(.9, tD, tG), hi = inv(.1, nD, nG); const ok = lo < hi && tD === 60 && tG === 2; return { ok, msg: ok ? 'Sparing normal tissue (higher TD50, steeper response) opens the window without touching the tumour.' : tD !== 60 || tG !== 2 ? 'Reset the tumour sliders to TCD50 = 60 Gy and γ = 2, then change only the normal tissue.' : 'The window is still closed. Try raising normal-tissue TD50.' }; } },
    { text: 'Close the window again by changing only the tumour: make it resistant (TCD50 ≥ 75 Gy) while normal tissue stays at TD50 = 85, γ = 3.', check: () => { const lo = inv(.9, tD, tG), hi = inv(.1, nD, nG); const ok = tD >= 75 && nD === 85 && nG === 3 && lo > hi; return { ok, msg: ok ? 'A resistant tumour pushes control to doses the normal tissue cannot tolerate.' : 'Set normal tissue back to TD50 = 85, γ = 3 and raise tumour TCD50 to at least 75 Gy.' }; } }
  ], () => ({}));
};

/* ---- Session 10: protraction factor g ---- */
Labs.gfactor = (c, act) => {
  let th = 1.5, lt = 0, d = 10;
  const gf = (T, h) => { const m = Math.LN2 / h, x = m * T; return x < 1e-6 ? 1 : 2 / (x * x) * (x - 1 + Math.exp(-x)); };
  const host = el('div'), rd = el('div', { class: 'read' });
  const s1 = slider('Repair half-time (h)', .25, 4, .05, th, v => v.toFixed(2), v => { th = v; draw(); });
  const s2 = slider('Exposure time', -2.5, 2.5, .05, lt, v => { const T = Math.pow(10, v); return T < 1 ? (T * 60).toFixed(0) + ' min' : T.toFixed(1) + ' h'; }, v => { lt = v; draw(); });
  const s3 = slider('Dose (Gy)', 2, 20, 1, d, v => v, v => { d = v; draw(); });
  const T = () => Math.pow(10, lt);
  function draw() {
    const ab = 3, g = gf(T(), th), bed1 = d * (1 + d / ab), bedg = d * (1 + g * d / ab);
    plot(host, { xmin: 0.003, xmax: 316, ymin: 0, ymax: 1, xlog: true, xticks: [.01, .1, 1, 10, 100], xfmt: v => v < 1 ? v : v, yticks: [0, .25, .5, .75, 1], xlabel: 'Exposure time (h), log scale', ylabel: 'Protraction factor g', series: [{ f: t => gf(t, th), color: COL.t }], points: [{ x: T(), y: g, label: 'g = ' + g.toFixed(2) }] });
    readout(rd, [['g', g.toFixed(2)], ['BED if instantaneous (α/β = 3)', bed1.toFixed(0) + ' Gy₃'], ['BED with this protraction', bedg.toFixed(0) + ' Gy₃'], ['Reduction in BED', ((1 - bedg / bed1) * 100).toFixed(0) + '%']]);
  }
  c.append(el('p', { class: 'hint' }, 'For one continuous exposure, g = 2/(μT)²·(μT − 1 + e^(−μT)) with μ = ln2 / repair half-time. g multiplies the quadratic term: BED = D(1 + g·D/(α/β)). HDR sessions last minutes (g near 1); LDR implants last days (g small).'), host, s1.node, s2.node, s3.node, rd);
  draw();
  challenges(c, act, [
    { text: 'Show that an HDR-like exposure barely changes the BED: choose an exposure time under 15 minutes, so g > 0.9.', check: () => { const g = gf(T(), th); return { ok: g > .9, msg: `g = ${g.toFixed(2)}. ${g > .9 ? 'Little repair occurs during a short exposure.' : 'Shorten the exposure.'}` }; } },
    { text: 'Find an exposure where g is between 0.1 and 0.3 (substantial repair during delivery).', check: () => { const g = gf(T(), th); const ok = g > .1 && g < .3; return { ok, msg: `g = ${g.toFixed(2)}. ${ok ? 'This is the LDR regime: repair spares late-responding tissue.' : 'Lengthen the exposure to many hours.'}` }; } },
    { text: 'With exposure fixed near 6 h, find a repair half-time that gives g ≈ 0.5 (0.45–0.55).', check: () => { const T6 = 6, g = gf(T6, th); const ok = g > .45 && g < .55 && Math.abs(T() - 6) < 1; return { ok, msg: ok ? 'Slow repair (long half-time) leaves g higher: less sparing.' : `Set exposure ≈ 6 h first (now ${T().toFixed(1)} h). g at 6 h with this half-time = ${gf(6, th).toFixed(2)}.` }; } }
  ], () => ({}));
};

/* ---- Session 13: gEUD / LKB plan comparison ---- */
Labs.lkb = (c, act) => {
  let n = 0.2, m = 0.15, td = 30;
  const A = [[1, 20]], B = [[.75, 12], [.25, 44]];
  const eud = (dv, nn) => { const a = 1 / nn; return Math.pow(dv.reduce((s, [v, d]) => s + v * Math.pow(d, a), 0), 1 / a); };
  const ntcp = dv => Phi((eud(dv, n) - td) / (m * td));
  const mean = dv => dv.reduce((s, [v, d]) => s + v * d, 0);
  const host = el('div'), rd = el('div', { class: 'read' });
  const s = [slider('Volume parameter n', .05, 2, .01, n, v => v.toFixed(2), v => { n = v; draw(); }), slider('Slope m', .05, .6, .01, m, v => v.toFixed(2), v => { m = v; draw(); }), slider('TD50 (Gy)', 15, 60, 1, td, v => v, v => { td = v; draw(); })];
  function draw() {
    const ea = eud(A, n), eb = eud(B, n), na = ntcp(A), nb = ntcp(B);
    plot(host, { xmin: 0, xmax: 60, ymin: 0, ymax: 1, xticks: [0, 10, 20, 30, 40, 50, 60], yticks: [0, .25, .5, .75, 1], yfmt: v => v * 100 + '%', xlabel: 'Generalized EUD (Gy)', ylabel: 'NTCP', series: [{ f: e => Phi((e - td) / (m * td)), color: COL.k, w: 1.5 }], points: [{ x: ea, y: na, color: COL.n, label: 'Plan A' }, { x: eb, y: nb, color: COL.t, label: 'Plan B' }] });
    readout(rd, [['Plan A: 100% of organ at 20 Gy', 'mean 20 Gy'], ['Plan B: 75% at 12 Gy, 25% at 44 Gy', 'mean ' + mean(B).toFixed(0) + ' Gy'], ['EUD A / B', ea.toFixed(1) + ' / ' + eb.toFixed(1) + ' Gy'], ['NTCP A', (na * 100).toFixed(1) + '%'], ['NTCP B', (nb * 100).toFixed(1) + '%']]);
  }
  c.append(el('p', { class: 'hint' }, 'Two plans deliver the same mean dose to an organ. LKB reduces each DVH to a gEUD = (Σ vᵢ Dᵢ^a)^(1/a) with a = 1/n, then NTCP = Φ((EUD − TD50)/(m·TD50)). Here n is the volume parameter, not the number of fractions.'), host, ...s.map(x => x.node), rd);
  draw();
  challenges(c, act, [
    { text: 'Make Plan A and Plan B give nearly the same NTCP (within 2 percentage points).', check: () => { const d = Math.abs(ntcp(A) - ntcp(B)); return { ok: d < .02, msg: d < .02 ? 'At n = 1 (parallel-like), gEUD equals mean dose, so equal mean dose means equal NTCP.' : `They differ by ${(d * 100).toFixed(0)} points. Increase n toward 1.` }; } },
    { text: 'Make Plan B at least 30 points worse than Plan A (serial-like organ, small n).', check: () => { const d = ntcp(B) - ntcp(A); return { ok: d > .3, msg: d > .3 ? 'With small n the hot spot dominates: equal mean dose hides a much worse plan.' : `Difference is ${(d * 100).toFixed(0)} points. Lower n and set TD50 so Plan B sits on the steep part of the curve.` }; } },
    { text: 'Find parameters where Plan B has a lower NTCP than Plan A (ranking reversal).', check: () => { const d = ntcp(A) - ntcp(B); return { ok: d > .005, msg: d > .005 ? 'For n > 1 (a < 1) the cold regions dominate, so the ranking reverses. Rankings are conditional on model parameters.' : 'Try n above 1 with TD50 near 20 Gy.' }; } }
  ], () => ({}));
};

/* ---- Session 14: therapeutic ratio / enhancement ---- */
Labs.tr = (c, act) => {
  let dt = 1.3, dn = 1.3; const tD = 60, tG = 2, nD = 85, nG = 3;
  const P = (d, d50, g) => 1 / (1 + Math.pow(d50 / Math.max(d, 1e-6), 4 * g));
  const host = el('div'), rd = el('div', { class: 'read' });
  const s1 = slider('Tumour dose-modifying factor', 1, 2, .05, dt, v => v.toFixed(2), v => { dt = v; draw(); });
  const s2 = slider('Normal-tissue dose-modifying factor', 1, 2, .05, dn, v => v.toFixed(2), v => { dn = v; draw(); });
  function draw() {
    plot(host, { xmin: 20, xmax: 110, ymin: 0, ymax: 1, xticks: [20, 40, 60, 80, 100], yticks: [0, .25, .5, .75, 1], yfmt: v => v * 100 + '%', xlabel: 'Dose (Gy)', ylabel: 'Probability',
      series: [{ f: d => P(d, tD, tG), color: COL.t, dash: true, w: 1.5, label: 'Tumour, RT alone' }, { f: d => P(d, nD, nG), color: COL.n, dash: true, w: 1.5, label: 'Normal, RT alone' }, { f: d => P(d * dt, tD, tG), color: COL.t, label: 'Tumour, RT + drug' }, { f: d => P(d * dn, nD, nG), color: COL.n, label: 'Normal, RT + drug' }] });
    readout(rd, [['TR alone (D50 normal / D50 tumour)', (nD / tD).toFixed(2)], ['TR with drug', ((nD / dn) / (tD / dt)).toFixed(2)], ['Therapeutic enhancement ratio (DMF tumour / DMF normal)', (dt / dn).toFixed(2)]]);
  }
  c.append(el('p', { class: 'hint' }, 'A dose-modifying factor (DMF) divides the dose needed for a given effect. The drug moves each curve left by its own DMF. Gain requires the tumour to be sensitized more than the dose-limiting normal tissue: TER = DMF(tumour) / DMF(normal).'), host, s1.node, s2.node, rd);
  draw();
  challenges(c, act, [
    { text: 'Show a drug that gives no therapeutic gain even though tumour control rises: tumour DMF ≥ 1.3 and TER between 0.97 and 1.03.', check: () => { const t = dt / dn; const ok = dt >= 1.3 && t > .97 && t < 1.03; return { ok, msg: ok ? 'More tumour kill, but the normal tissue shifted by the same factor, so the ratio is unchanged.' : `TER = ${t.toFixed(2)}, tumour DMF = ${dt.toFixed(2)}.` }; } },
    { text: 'Create a true therapeutic gain: TER ≥ 1.2 while the normal tissue is still sensitized (DMF ≥ 1.1).', check: () => { const t = dt / dn; const ok = t >= 1.2 && dn >= 1.1; return { ok, msg: ok ? 'This is a gain even with some added normal-tissue toxicity: the tumour benefit outpaces it.' : `TER = ${t.toFixed(2)}, normal DMF = ${dn.toFixed(2)}.` }; } },
    { text: 'Create a harmful combination: TER ≤ 0.9 (normal tissue sensitized more than tumour).', check: () => { const t = dt / dn; return { ok: t <= .9, msg: t <= .9 ? 'The window narrows: a drug can be active against the tumour yet worsen the therapeutic ratio.' : `TER = ${t.toFixed(2)}.` }; } }
  ], () => ({}));
};

/* ---- Session 15: Bragg peak targeting ---- */
Labs.bragg = (c, act) => {
  let E = 100, zt = 8;
  const rangeCm = e => 0.0022 * Math.pow(e, 1.77);
  const bragg = (z, R) => { const pk = Math.pow(0.4, -0.435); const v = z <= R ? Math.pow(R - z + 0.4, -0.435) : pk * Math.exp(-Math.pow(z - R, 2) / (2 * 0.2 * 0.2)); return v / pk; };
  const photon = z => z < 1.5 ? 0.4 + 0.6 * z / 1.5 : Math.exp(-0.0475 * (z - 1.5));
  const host = el('div'), rd = el('div', { class: 'read' });
  const sl = slider('Proton energy (MeV)', 40, 200, 1, E, v => v, v => { E = v; draw(); });
  const nb = el('button', { class: 'btn ghost', onclick: () => { zt = Math.round(rnd(4, 16) * 2) / 2; draw(); } }, 'New target depth');
  function draw() {
    const R = rangeCm(E);
    plot(host, { xmin: 0, xmax: 28, ymin: 0, ymax: 1.1, xticks: [0, 5, 10, 15, 20, 25], yticks: [0, .5, 1], yfmt: v => v * 100 + '%', xlabel: 'Depth in water (cm)', ylabel: 'Relative dose', bands: [{ x0: zt, x1: zt + 2, label: 'target' }],
      series: [{ f: z => bragg(z, R), color: COL.t, label: 'Proton beam (single energy)' }, { f: photon, color: COL.k, dash: true, label: '6 MV photons' }] });
    readout(rd, [['Range R', R.toFixed(1) + ' cm'], ['Target', zt + '–' + (zt + 2) + ' cm'], ['Entrance dose', (bragg(0, R) * 100).toFixed(0) + '% of peak'], ['Dose 3 cm beyond the peak', (bragg(R + 3, R) * 100).toFixed(0) + '%'], ['Photon dose 3 cm beyond the target', (photon(zt + 5) * 100).toFixed(0) + '%']]);
  }
  c.append(el('p', { class: 'hint' }, 'Approximate proton range: R ≈ 0.0022·E^1.77 cm in water. A single pristine peak is narrower than a real target (clinical fields spread the peak), so here you only place the peak at the distal edge of a 2 cm slab. This shows physical dose placement; it says nothing about RBE (clinically assumed ≈ 1.1).'), host, sl.node, el('div', { class: 'row' }, nb), rd);
  draw();
  challenges(c, act, [
    { text: 'Place the Bragg peak within ±0.5 cm of the distal edge of the target.', check: () => { const R = rangeCm(E), ok = Math.abs(R - (zt + 2)) <= .5; return { ok, msg: ok ? `Range ${R.toFixed(1)} cm lands on the distal edge. Tissue beyond receives almost no dose, unlike photons.` : `Range ${R.toFixed(1)} cm; distal edge is at ${zt + 2} cm.` }; } },
    { text: 'Press "New target depth", then place the peak on the new distal edge (±0.5 cm).', check: () => { const R = rangeCm(E), ok = zt !== 8 && Math.abs(R - (zt + 2)) <= .5; return { ok, msg: ok ? 'Done. Beam range is a physics choice; biological effectiveness is a separate question.' : zt === 8 ? 'Press "New target depth" first (the new depth must differ from 8 cm).' : `Range ${R.toFixed(1)} cm; distal edge is at ${zt + 2} cm.` }; } }
  ], () => ({}));
};

/* ---- Session 4/17 style numeric lab not needed: Module 4 labs ---- */
Labs.oer = (c, act) => {
  let lp = 1, d = 2; const M = 3, K = 3, a = 0.3, b = 0.03;
  const f = p => (M * p + K) / (M * (p + K));
  const host = el('div'), rd = el('div', { class: 'read' });
  const s1 = slider('Tissue pO₂', -1, 2, .05, lp, v => Math.pow(10, v).toFixed(v < 1 ? 1 : 0) + ' mmHg', v => { lp = v; draw(); });
  const s2 = slider('Dose (Gy)', 1, 12, .5, d, v => v, v => { d = v; draw(); });
  const P = () => Math.pow(10, lp);
  const SF = (D, ff) => Math.exp(-(a * ff * D + b * ff * ff * D * D));
  function draw() {
    const ff = f(P());
    plot(host, { xmin: 0, xmax: 20, ymin: 1e-5, ymax: 1, ylog: true, xticks: [0, 5, 10, 15, 20], yticks: [1, 1e-1, 1e-2, 1e-3, 1e-4, 1e-5], yfmt: v => v === 1 ? '1' : '1e' + Math.round(Math.log10(v)), xlabel: 'Dose (Gy)', ylabel: 'Surviving fraction (illustrative)',
      series: [{ f: D => SF(D, 1), color: COL.n, label: 'well oxygenated' }, { f: D => SF(D, f(0)), color: COL.k, dash: true, label: 'anoxic' }, { f: D => SF(D, ff), color: COL.t, label: 'this pO₂' }], points: [{ x: d, y: SF(d, ff), color: COL.t }] });
    readout(rd, [['Relative sensitivity', ff.toFixed(2)], ['OER at this pO₂', (1 / ff).toFixed(2)], ['Dose giving the same effect as ' + d + ' Gy oxic', (d / ff).toFixed(1) + ' Gy'], ['SF at dose', fmt(SF(d, ff), 3)]]);
  }
  c.append(el('p', { class: 'hint' }, 'Illustrative model: dose is scaled by a sensitivity factor f(p) = (m·p + K) / (m·(p + K)), with maximum OER m = 3 and K = 3 mmHg (half-maximal effect). Real curves vary with tissue, radiation quality and dose.'), host, s1.node, s2.node, rd);
  draw();
  challenges(c, act, [
    { text: 'Find the pO₂ at which sensitivity is halfway between anoxic and oxic (about K): choose 2–4.5 mmHg.', check: () => { const p = P(); const ok = p >= 2 && p <= 4.5; return { ok, msg: ok ? 'Sensitivity changes most steeply at low pO₂, which is why mildly hypoxic cells matter.' : `pO₂ is ${p.toFixed(1)} mmHg.` }; } },
    { text: 'Show how much extra dose anoxic cells need: set pO₂ to the minimum and dose to 2 Gy.', check: () => { const ok = P() < 0.15 && d === 2; return { ok, msg: ok ? `Anoxic cells need about ${(2 / f(P())).toFixed(1)} Gy to match a 2 Gy oxic effect: roughly OER (≈3) times more.` : 'Set pO₂ to its minimum (≈0.1 mmHg) and dose to 2 Gy.' }; } }
  ], () => ({}));
};

Labs.reox = (c, act) => {
  let n = 20, hyp = 20, re = false; const a = .3, b = .03, d = 2, f = 1 / 3;
  const sa = Math.exp(-(a * d + b * d * d)), sh = Math.exp(-(a * f * d + b * f * f * d * d));
  const host = el('div'), rd = el('div', { class: 'read' });
  const s1 = slider('Number of 2 Gy fractions', 1, 40, 1, n, v => v, v => { n = v; draw(); });
  const s2 = slider('Initial hypoxic fraction (%)', 0, 50, 1, hyp, v => v, v => { hyp = v; draw(); });
  const cb = el('input', { type: 'checkbox' }); cb.addEventListener('change', () => { re = cb.checked; draw(); });
  const curve = (k, withRe) => { const h = hyp / 100; if (withRe) return Math.pow((1 - h) * sa + h * sh, k); return (1 - h) * Math.pow(sa, k) + h * Math.pow(sh, k); };
  function draw() {
    plot(host, { xmin: 0, xmax: 40, ymin: 1e-12, ymax: 1, ylog: true, xticks: [0, 10, 20, 30, 40], yticks: [1, 1e-3, 1e-6, 1e-9, 1e-12], yfmt: v => v === 1 ? '1' : '1e' + Math.round(Math.log10(v)), xlabel: 'Number of 2 Gy fractions', ylabel: 'Tumour surviving fraction',
      series: [{ f: k => curve(k, false), color: COL.t, label: 'no reoxygenation' }, { f: k => curve(k, true), color: COL.g, label: 'full reoxygenation' }], points: [{ x: n, y: curve(n, re), color: COL.k }] });
    readout(rd, [['SF without reoxygenation', fmt(curve(n, false), 2)], ['SF with full reoxygenation', fmt(curve(n, true), 2)], ['Gain from reoxygenation', fmt(curve(n, false) / curve(n, true), 1) + ' × lower SF']]);
  }
  c.append(el('p', { class: 'hint' }, 'Illustrative: oxic cells α = 0.3, β = 0.03 (SF2 ≈ ' + sa.toFixed(2) + '); hypoxic cells receive one-third of the effective dose (SF2 ≈ ' + sh.toFixed(2) + '). Without reoxygenation the hypoxic cells survive and come to dominate. With full reoxygenation, survivors are redistributed to the initial oxic/hypoxic mix before each fraction.'), host, s1.node, s2.node, rd);
  draw();
  challenges(c, act, [
    { text: 'Find the number of fractions where the no-reoxygenation curve reaches SF ≈ 10⁻³ (within ±2 fractions) at 20% hypoxia.', check: () => { let k = 0; for (let i = 1; i <= 40; i++) if (curve(i, false) <= 1e-3) { k = i; break; } const ok = hyp === 20 && k > 0 && Math.abs(n - k) <= 2; return { ok, msg: ok ? 'The tail flattens: surviving hypoxic cells limit cure unless they reoxygenate.' : hyp !== 20 ? 'Set hypoxic fraction to 20%.' : `That curve reaches 10⁻³ near ${k || '>40'} fractions.` }; } },
    { text: 'Find the number of fractions with full reoxygenation to reach 10⁻³ (±2) at 20% hypoxia.', check: () => { let k = 0; for (let i = 1; i <= 40; i++) if (curve(i, true) <= 1e-3) { k = i; break; } const ok = hyp === 20 && k > 0 && Math.abs(n - k) <= 2; return { ok, msg: ok ? 'Reoxygenation between fractions keeps converting hypoxic cells into radiosensitive ones.' : hyp !== 20 ? 'Set hypoxic fraction to 20%.' : `That curve reaches 10⁻³ near ${k} fractions.` }; } }
  ], () => ({}));
};
