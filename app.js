'use strict';
Types.placeholder = c => { c.innerHTML = ''; c.append(el('div', { class: 'draft' }, 'Activities for this session will be added when the student guide is written.')); };
Store.load();

const view = $('#view'), tabs = $('#tabs');
const allActs = m => m.sessions.flatMap(s => s.acts.filter(a => a.type !== 'placeholder'));
const modPct = m => { const a = allActs(m); return a.length ? Math.round(100 * a.filter(x => Store.passed(x.id)).length / a.length) : 0; };
const sesDone = s => { const a = s.acts.filter(x => x.type !== 'placeholder'); return a.length > 0 && a.every(x => Store.passed(x.id)); };

function route() {
  const [m, s] = (location.hash.replace('#', '') || 'home').split('/');
  return { m, s };
}
function go(h) { location.hash = h; }

function renderTabs() {
  const r = route(); tabs.innerHTML = '';
  tabs.append(el('button', { role: 'tab', 'aria-selected': r.m === 'home', onclick: () => go('home') }, 'Home'));
  MODULES.forEach(m => tabs.append(el('button', { role: 'tab', 'aria-selected': r.m === m.id, onclick: () => go(m.id) }, m.title, el('span', { class: 'pct' }, modPct(m) + '%'))));
  $('#score').textContent = '★ ' + Store.points() + ' pts';
}

function renderHome() {
  view.innerHTML = '';
  view.append(el('section', { class: 'hero' },
    el('img', { class: 'lockup', src: 'assets/vaider-lockup.png', alt: 'VAIDER Lab: Veterinary AI in Diagnostic Imaging and Radiotherapy' }),
    el('h1', { class: 'title', html: 'Hit <span class="gold">and</span> Repair' }),
    el('div', { class: 'tag' }, 'Veterinary Radiobiology · learn it by doing'),
    el('p', { class: 'sub' }, 'Build survival curves, open a therapeutic window, steer a Bragg peak and work through clinical cases. One chapter per session, with games aimed at that session\'s key points.'),
    el('div', { class: 'go' }, el('button', { class: 'btn', onclick: () => go('m1') }, 'Start Module 1'), el('button', { class: 'btn ghost', onclick: () => go(nextMod()) }, 'Continue'))));
  view.append(el('div', { class: 'rule' }),
    el('div', { class: 'howto' },
      el('div', {}, el('b', {}, 'Pick a session'), 'Each module tab lists its sessions as chapters. Play them in any order.'),
      el('div', {}, el('b', {}, 'Play to clear'), 'Quizzes, sorting and matching are scored. Labs have challenges you unlock by setting the model correctly.'),
      el('div', {}, el('b', {}, 'Earn ticks'), 'Reach 70% of an activity\'s points to clear it. Replay any time to beat your best.')));
  const g = el('div', { class: 'grid', style: 'margin-top:16px' });
  MODULES.forEach((m, k) => {
    const a = allActs(m), p = a.filter(x => Store.passed(x.id)).length;
    g.append(el('div', { class: 'card link', onclick: () => go(m.id) }, el('h3', {}, el('span', { class: 'gold' }, 'Module ' + (k + 1)), m.sub), el('div', { class: 'hint', style: 'margin-top:6px' }, m.blurb), el('div', { class: 'bar' }, el('i', { style: `width:${modPct(m)}%` })), el('div', { class: 'hint' }, `${p} of ${a.length} activities cleared`), m.draft ? el('span', { class: 'pill' }, 'draft') : null));
  });
  view.append(g,
    el('p', { class: 'hint', style: 'margin-top:18px' }, 'Do the pre-reading first: these games reinforce the session guides, they do not replace them. Models are simplified and numbers are illustrative. Progress is saved in this browser only.'),
    el('p', { style: 'margin-top:12px' }, el('button', { class: 'btn ghost', onclick: () => { if (confirm('Reset all saved progress in this browser?')) { Store.reset(); route_(); } } }, 'Reset my progress')),
    el('div', { class: 'vfoot', html: 'A <b>VAIDER Lab</b> teaching resource · Veterinary AI in Diagnostic Imaging and Radiotherapy · Cornell University College of Veterinary Medicine · <a href="https://www.vaiderlab.org" target="_blank" rel="noopener">www.vaiderlab.org</a>' }));
}
function nextMod() { const m = MODULES.find(x => modPct(x) < 100); return m ? m.id : 'm1'; }

function renderModule(m, sid) {
  view.innerHTML = '';
  const ses = m.sessions.find(s => s.id === sid) || m.sessions[0];
  view.append(el('h1', {}, m.title + ' · ' + m.sub), el('p', { class: 'lead' }, m.blurb));
  if (m.draft) view.append(el('div', { class: 'draft' }, 'Draft: Module 4 has no student guides yet. These activities use the course outline and standard textbook concepts, and will be revised when the guides are written.'));
  const pills = el('div', { class: 'sessions', role: 'tablist' });
  m.sessions.forEach(s => pills.append(el('button', { role: 'tab', 'aria-selected': s.id === ses.id, 'data-s': s.id, onclick: () => go(m.id + '/' + s.id) }, 'Session ' + s.no + ' · ' + s.title, el('span', { class: 'st' }, sesDone(s) ? '✔' : ''))));
  view.append(pills);
  view.append(el('h2', {}, `Session ${ses.no}: ${ses.title}`), el('div', { class: 'takeaway', html: '<b>Key takeaway.</b> ' }));
  $('.takeaway', view).append(document.createTextNode(ses.take));
  ses.acts.forEach(a => {
    const box = el('div'), pill = el('span', { class: 'pill', 'data-id': a.id });
    view.append(el('div', { class: 'act' }, el('div', { class: 'card' }, el('h3', {}, a.title, pill), box)));
    updatePill(pill);
    (Types[a.type] || (() => box.append('Unknown activity type')))(box, a);
  });
}
function updatePill(p) {
  const s = Store.get(p.dataset.id); if (!s) { p.textContent = 'new'; p.className = 'pill'; return; }
  p.textContent = `best ${s.score}/${s.max}`; p.className = 'pill' + (s.score >= .7 * s.max ? ' done' : '');
}

function route_() {
  const r = route(); renderTabs();
  document.body.classList.toggle('home', r.m === 'home' || !MODULES.find(x => x.id === r.m));
  if (r.m === 'home' || !MODULES.find(x => x.id === r.m)) renderHome(); else renderModule(MODULES.find(x => x.id === r.m), r.s);
  window.scrollTo(0, 0);
}
window.onProgress = () => {
  renderTabs();
  document.querySelectorAll('.pill[data-id]').forEach(updatePill);
  const r = route(), m = MODULES.find(x => x.id === r.m);
  if (m) m.sessions.forEach(s => { const b = document.querySelector(`.sessions button[data-s="${s.id}"] .st`); if (b) b.textContent = sesDone(s) ? '✔' : ''; });
};
window.addEventListener('hashchange', route_);
route_();
