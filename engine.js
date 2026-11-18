'use strict';
/* ---------- tiny helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
function el(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const c of kids.flat()) { if (c == null || c === false) continue; e.append(c.nodeType ? c : document.createTextNode(c)); }
  return e;
}
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const fmt = (x, d = 2) => (Math.abs(x) >= 1e4 || (Math.abs(x) < 1e-2 && x !== 0)) ? x.toExponential(1) : (+x.toFixed(d)).toString();

/* ---------- progress store (localStorage is optional) ---------- */
const Store = {
  key: 'hit-and-repair-v1', data: { done: {} },
  load() { try { const s = localStorage.getItem(this.key); if (s) this.data = JSON.parse(s); } catch (e) {} },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) {} },
  record(id, score, max) {
    const p = this.data.done[id];
    if (!p || score > p.score) this.data.done[id] = { score, max };
    this.save(); if (window.onProgress) window.onProgress();
  },
  get(id) { return this.data.done[id]; },
  passed(id) { const p = this.data.done[id]; return !!p && p.score >= 0.7 * p.max; },
  points() { return Object.values(this.data.done).reduce((s, p) => s + p.score, 0); },
  reset() { this.data = { done: {} }; this.save(); if (window.onProgress) window.onProgress(); }
};

/* ---------- result panel ---------- */
function finish(c, act, score, max, retry, extra) {
  Store.record(act.id, score, max);
  const frac = max ? score / max : 0;
  const stars = frac >= 0.9 ? 3 : frac >= 0.7 ? 2 : frac >= 0.4 ? 1 : 0;
  c.innerHTML = '';
  c.append(el('div', { class: 'result' },
    el('div', { class: 'stars' }, '★'.repeat(stars) + '☆'.repeat(3 - stars)),
    el('div', { class: 'big' }, `${score} / ${max}`),
    el('p', {}, frac >= 0.7 ? 'Activity cleared. Your best score is saved.' : 'Not cleared yet: you need 70% to clear this one. Have another go.'),
    extra || null,
    el('button', { class: 'btn', onclick: retry }, 'Play again')));
}

/* ---------- SVG plot helper ---------- */
function plot(host, o) {
  const W = 600, H = 340, L = 56, R = 14, B = 44;
  const labs = (o.series || []).filter(se => se.label);
  const rowsL = []; { let cur = [], w = 0; for (const se of labs) { const iw = se.label.length * 6.6 + 40; if (w + iw > W - L - R && cur.length) { rowsL.push(cur); cur = []; w = 0; } cur.push(se); w += iw; } if (cur.length) rowsL.push(cur); }
  const T = 12 + rowsL.length * 17;
  const xl = o.xlog, yl = o.ylog;
  const fx = x => xl ? Math.log10(x) : x, fy = y => yl ? Math.log10(Math.max(y, 1e-300)) : y;
  const x0 = fx(o.xmin), x1 = fx(o.xmax), y0 = fy(o.ymin), y1 = fy(o.ymax);
  const X = x => L + (fx(x) - x0) / (x1 - x0) * (W - L - R);
  const Y = y => T + (1 - (fy(y) - y0) / (y1 - y0)) * (H - T - B);
  let s = `<svg class="plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.label || 'plot'}">`;
  const xt = o.xticks || [], yt = o.yticks || [];
  for (const t of xt) s += `<line class="gr" x1="${X(t)}" x2="${X(t)}" y1="${T}" y2="${H - B}"/><text x="${X(t)}" y="${H - B + 16}" text-anchor="middle">${o.xfmt ? o.xfmt(t) : t}</text>`;
  for (const t of yt) s += `<line class="gr" y1="${Y(t)}" y2="${Y(t)}" x1="${L}" x2="${W - R}"/><text x="${L - 6}" y="${Y(t) + 4}" text-anchor="end">${o.yfmt ? o.yfmt(t) : t}</text>`;
  s += `<line class="ax" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/><line class="ax" x1="${L}" x2="${L}" y1="${T}" y2="${H - B}"/>`;
  s += `<text x="${(L + W - R) / 2}" y="${H - 6}" text-anchor="middle">${o.xlabel || ''}</text>`;
  s += `<text transform="translate(14 ${(T + H - B) / 2}) rotate(-90)" text-anchor="middle">${o.ylabel || ''}</text>`;
  for (const a of (o.bands || [])) s += `<rect x="${X(a.x0)}" y="${T}" width="${Math.max(0, X(a.x1) - X(a.x0))}" height="${H - T - B}" fill="${a.color || '#b31b1b'}" opacity="${a.op || .15}"/>${a.label ? `<text x="${(X(a.x0) + X(a.x1)) / 2}" y="${T + 14}" text-anchor="middle">${a.label}</text>` : ''}`;
  for (const se of (o.series || [])) {
    const N = 240, pts = [];
    for (let i = 0; i <= N; i++) {
      const x = xl ? Math.pow(10, x0 + (x1 - x0) * i / N) : o.xmin + (o.xmax - o.xmin) * i / N;
      let y = se.f(x); if (!isFinite(y)) continue;
      if (yl && y < o.ymin) y = o.ymin;
      pts.push(`${X(x).toFixed(1)},${Y(Math.min(Math.max(y, o.ymin), o.ymax)).toFixed(1)}`);
    }
    s += `<polyline fill="none" stroke="${se.color}" stroke-width="${se.w || 2.5}" ${se.dash ? 'stroke-dasharray="6 4"' : ''} points="${pts.join(' ')}"/>`;
  }
  rowsL.forEach((row, ri) => { let x = L; row.forEach(se => { const y = 14 + ri * 17; s += `<line x1="${x}" x2="${x + 22}" y1="${y - 4}" y2="${y - 4}" stroke="${se.color}" stroke-width="3" ${se.dash ? 'stroke-dasharray="5 3"' : ''}/><text x="${x + 27}" y="${y}">${se.label}</text>`; x += se.label.length * 6.6 + 40; }); });
  for (const v of (o.vlines || [])) s += `<line x1="${X(v.x)}" x2="${X(v.x)}" y1="${T}" y2="${H - B}" stroke="${v.color || '#888'}" stroke-dasharray="4 3"/>${v.label ? `<text x="${X(v.x) + 4}" y="${T + 26}" fill="${v.color || '#888'}" style="fill:${v.color || '#888'}">${v.label}</text>` : ''}`;
  for (const p of (o.points || [])) s += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="5" fill="${p.color || '#b31b1b'}"/>${p.label ? `<text x="${X(p.x) + 8}" y="${Y(p.y) - 8}">${p.label}</text>` : ''}`;
  host.innerHTML = s + '</svg>';
}

/* ---------- slider helper ---------- */
function slider(label, min, max, step, val, f, onChange) {
  const out = el('output', {}, f(val));
  const inp = el('input', { type: 'range', min, max, step, value: val, 'aria-label': label });
  inp.addEventListener('input', () => { out.textContent = f(+inp.value); onChange(+inp.value); });
  return { node: el('div', { class: 'sl' }, el('span', {}, label), inp, out), get: () => +inp.value, set: v => { inp.value = v; out.textContent = f(+v); } };
}
const readout = (host, items) => { host.innerHTML = ''; items.forEach(([k, v]) => host.append(el('div', {}, k, el('b', {}, v)))); };

/* ---------- challenge list for labs ---------- */
function challenges(c, act, list, getState) {
  const box = el('div', { class: 'chal' });
  const done = list.map(() => false);
  const rows = list.map((ch, i) => {
    const btn = el('button', { class: 'btn ghost', onclick: () => {
      if (done[i]) return;
      const res = ch.check(getState());
      msg.className = 'fb ' + (res.ok ? 'ok' : 'bad'); msg.textContent = res.msg;
      if (res.ok) { done[i] = true; row.classList.add('ok'); btn.textContent = '✔ Done'; btn.disabled = true; sync(); }
    } }, 'Check');
    const row = el('div', { class: 'c' }, el('span', {}, `${i + 1}. ${ch.text}`), btn);
    return row;
  });
  const msg = el('div', { class: 'fb info' }, 'Set the controls, then press Check on a challenge.');
  const prev = Store.get(act.id);
  function sync() {
    const n = done.filter(Boolean).length;
    Store.record(act.id, n * 10, list.length * 10);
  }
  rows.forEach(r => box.append(r));
  c.append(el('h3', {}, 'Challenges'), box, msg);
}

/* ---------- activity types ---------- */
const Types = {};

Types.quiz = (c, act) => {
  const qs = shuffle(act.questions); let i = 0, score = 0;
  const show = () => {
    c.innerHTML = '';
    if (i >= qs.length) return finish(c, act, score, qs.length * 10, () => Types.quiz(c, act));
    const q = qs[i], order = shuffle(q.opts.map((t, k) => ({ t, k })));
    const fb = el('div'); const nxt = el('button', { class: 'btn', style: 'display:none', onclick: () => { i++; show(); } }, i === qs.length - 1 ? 'Finish' : 'Next');
    const opts = el('div', { class: 'opts' });
    order.forEach(o => {
      const b = el('button', { class: 'opt', onclick: () => {
        const ok = o.k === q.a; if (ok) score += 10;
        [...opts.children].forEach((bb, idx) => { bb.disabled = true; if (order[idx].k === q.a) bb.classList.add('ok'); });
        if (!ok) b.classList.add('bad');
        fb.className = 'fb ' + (ok ? 'ok' : 'bad'); fb.textContent = (ok ? 'Correct. ' : 'Not quite. ') + (q.why || '');
        nxt.style.display = '';
      } }, o.t);
      opts.append(b);
    });
    c.append(el('div', { class: 'meta' }, `Question ${i + 1} of ${qs.length}`), el('p', {}, q.q), opts, fb, nxt);
  };
  show();
};

Types.match = (c, act) => {
  const pairs = act.pairs; let sel = null, wrong = 0, got = 0;
  c.innerHTML = '';
  const left = el('div', { class: 'opts' }), right = el('div', { class: 'opts' });
  const L = pairs.map((p, i) => el('button', { class: 'chip', 'data-i': i, onclick: ev => { if (ev.currentTarget.classList.contains('done')) return; L.forEach(x => x.classList.remove('sel')); sel = i; ev.currentTarget.classList.add('sel'); } }, p[0]));
  const Rr = shuffle(pairs.map((p, i) => ({ t: p[1], i }))).map(o => el('button', { class: 'chip', onclick: ev => {
    const b = ev.currentTarget; if (b.classList.contains('done') || sel == null) return;
    if (o.i === sel) { b.classList.add('done'); L[sel].classList.remove('sel'); L[sel].classList.add('done'); sel = null; got++; if (got === pairs.length) setTimeout(() => finish(c, act, Math.max(0, pairs.length * 10 - wrong * 3), pairs.length * 10, () => Types.match(c, act)), 500); }
    else { wrong++; b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 300); st.textContent = `Misses: ${wrong}`; }
  } }, o.t));
  L.forEach(x => left.append(x)); Rr.forEach(x => right.append(x));
  const st = el('div', { class: 'hint' }, 'Click an item on the left, then its partner on the right. Misses: 0');
  c.append(st, el('div', { class: 'cols' }, left, right));
};

Types.classify = (c, act) => {
  const items = shuffle(act.items); let i = 0, score = 0;
  const show = () => {
    c.innerHTML = '';
    if (i >= items.length) return finish(c, act, score, items.length * 10, () => Types.classify(c, act));
    const it = items[i], fb = el('div'), nxt = el('button', { class: 'btn', style: 'display:none', onclick: () => { i++; show(); } }, i === items.length - 1 ? 'Finish' : 'Next');
    const bk = el('div', { class: 'buckets' });
    act.buckets.forEach((b, k) => bk.append(el('button', { class: 'btn ghost', onclick: () => {
      const ok = k === it.b; if (ok) score += 10;
      [...bk.children].forEach(x => x.disabled = true);
      fb.className = 'fb ' + (ok ? 'ok' : 'bad'); fb.textContent = (ok ? 'Correct. ' : `Not quite: this belongs under "${act.buckets[it.b]}". `) + (it.why || '');
      nxt.style.display = '';
    } }, b)));
    c.append(el('div', { class: 'meta' }, `${act.prompt || 'Where does this belong?'}  (${i + 1} of ${items.length})`), el('div', { class: 'bigcard' }, it.t), bk, fb, nxt);
  };
  show();
};

Types.sequence = (c, act) => {
  let order, selI = null, tries = 0;
  const correct = act.steps;
  const start = () => { do { order = shuffle(correct); } while (order.every((s, k) => s === correct[k])); tries = 0; selI = null; draw(); };
  const draw = (marks) => {
    c.innerHTML = '';
    const list = el('div', { class: 'seq' });
    order.forEach((s, k) => list.append(el('button', { class: 'chip' + (selI === k ? ' sel' : '') + (marks ? (marks[k] ? ' done' : ' shake') : ''), onclick: () => {
      if (selI == null) selI = k; else { [order[selI], order[k]] = [order[k], order[selI]]; selI = null; }
      draw();
    } }, s)));
    const fb = el('div', { class: 'fb info' }, act.prompt || 'Put the steps in order: click one step, then click another to swap them.');
    const chk = el('button', { class: 'btn', onclick: () => {
      tries++; const marks = order.map((s, k) => s === correct[k]); const n = marks.filter(Boolean).length;
      if (n === correct.length) { const sc = Math.max(10, 30 - (tries - 1) * 10); finish(c, act, sc, 30, start, act.after ? el('div', { class: 'fb info' }, act.after) : null); }
      else { draw(marks); fb.className = 'fb bad'; $('.fb', c).textContent = `${n} of ${correct.length} steps are in the right place (green). Swap the others and check again.`; $('.fb', c).className = 'fb bad'; }
    } }, 'Check order');
    c.append(list, fb, chk);
  };
  start();
};

Types.gen = (c, act) => {
  const N = act.rounds || 4; let i = 0, score = 0;
  const show = () => {
    c.innerHTML = '';
    if (i >= N) return finish(c, act, score, N * 10, () => Types.gen(c, act));
    const p = act.make(), fb = el('div'); let answered = false;
    const nxt = el('button', { class: 'btn', style: 'display:none', onclick: () => { i++; show(); } }, i === N - 1 ? 'Finish' : 'Next');
    const reveal = ok => { answered = true; if (ok) score += 10; fb.className = 'fb ' + (ok ? 'ok' : 'bad'); fb.innerHTML = (ok ? 'Correct. ' : `Not quite. Answer: <b>${p.show}</b>. `) + p.explain; nxt.style.display = ''; };
    c.append(el('div', { class: 'meta' }, `Problem ${i + 1} of ${N}`), el('p', { html: p.prompt }));
    if (p.type === 'choice') {
      const opts = el('div', { class: 'opts' });
      p.choices.forEach((t, k) => opts.append(el('button', { class: 'opt', onclick: () => { [...opts.children].forEach((b, kk) => { b.disabled = true; if (kk === p.answer) b.classList.add('ok'); }); if (k !== p.answer) opts.children[k].classList.add('bad'); reveal(k === p.answer); } }, t)));
      c.append(opts);
    } else {
      const inp = el('input', { type: 'number', step: 'any', inputmode: 'decimal', 'aria-label': 'answer' });
      const go = () => { if (answered || inp.value === '') return; const v = parseFloat(inp.value); const tol = p.tol != null ? p.tol : 0.03; const ok = Math.abs(v - p.answer) <= Math.max(tol * Math.abs(p.answer), p.abs || 0); inp.disabled = true; btn.disabled = true; reveal(ok); };
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      const btn = el('button', { class: 'btn', onclick: go }, 'Check');
      c.append(el('div', { class: 'row' }, inp, p.unit ? el('span', {}, p.unit) : null, btn));
    }
    c.append(fb, nxt);
  };
  show();
};

Types.case = (c, act) => {
  let i = 0, score = 0;
  const show = () => {
    c.innerHTML = '';
    if (i >= act.steps.length) return finish(c, act, score, act.steps.length * 10, () => Types.case(c, act), el('p', { class: 'hint' }, act.debrief || ''));
    const s = act.steps[i], fb = el('div'); const nxt = el('button', { class: 'btn', style: 'display:none', onclick: () => { i++; show(); } }, i === act.steps.length - 1 ? 'Debrief' : 'Continue');
    const opts = el('div', { class: 'opts' });
    s.choices.forEach(ch => opts.append(el('button', { class: 'opt', onclick: ev => {
      [...opts.children].forEach(b => b.disabled = true); score += ch.pts;
      ev.currentTarget.classList.add(ch.pts >= 10 ? 'ok' : ch.pts > 0 ? 'ok' : 'bad');
      fb.className = 'fb ' + (ch.pts >= 10 ? 'ok' : ch.pts > 0 ? 'info' : 'bad'); fb.textContent = ch.fb; nxt.style.display = '';
    } }, ch.t)));
    c.append(el('div', { class: 'meta' }, `${act.title}: step ${i + 1} of ${act.steps.length}`), el('p', { html: s.text }), opts, fb, nxt);
  };
  show();
};

Types.lab = (c, act) => { c.innerHTML = ''; Labs[act.lab](c, act); };

/* normal CDF */
const Phi = z => { const t = 1 / (1 + 0.2316419 * Math.abs(z)); const d = 0.3989423 * Math.exp(-z * z / 2); let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; };
