'use strict';
/* =========================================================
   COURSE CONTENT. Edit this file to change or add activities.
   Activity types: quiz, match, classify, sequence, gen, case, lab
   ========================================================= */
const Q = (q, opts, a, why) => ({ q, opts, a, why });
const M2 = k => M2Q[k];

/* ---------- generators ---------- */
const G = {};
G.plating = () => {
  const pe = pick([.4, .5, .6, .7]), ctrl = pick([100, 200, 400]), cc = Math.round(ctrl * pe), dose = pick([2, 4, 6, 8]);
  const plated = pick([200, 500, 2000, 5000, 10000]), col = Math.max(6, Math.round(plated * pe * Math.exp(-(.2 * dose + .03 * dose * dose))));
  const PE = cc / ctrl, SF = col / (plated * PE);
  return { prompt: `Control dishes: ${ctrl} cells plated gave ${cc} colonies. Dishes irradiated with ${dose} Gy: ${plated} cells plated gave ${col} colonies. What is the surviving fraction?`, answer: SF, tol: .05, show: fmt(SF, 4), explain: `Plating efficiency = ${cc}/${ctrl} = ${PE.toFixed(2)}. SF = colonies / (cells plated × PE) = ${col} / (${plated} × ${PE.toFixed(2)}) = ${fmt(SF, 4)}.` };
};
G.kinetics = () => {
  if (Math.random() < .5) {
    const tp = pick([3, 4, 5, 6, 8]), k = pick([2, 2.5, 4, 5]), td = tp * k, clf = 1 - 1 / k;
    return { prompt: `A canine tumour has a potential doubling time of ${tp} days and a measured volume doubling time of ${td} days. What is the cell-loss factor? (enter a fraction between 0 and 1)`, answer: clf, abs: .02, tol: 0, show: clf.toFixed(2), explain: `CLF = 1 − Tpot/Td = 1 − ${tp}/${td} = ${clf.toFixed(2)}: this fraction of newly produced cells never adds to net growth.` };
  }
  const td = pick([20, 30, 40, 60]), clf = pick([.5, .6, .75, .8]), tp = td * (1 - clf);
  return { prompt: `A tumour has a volume doubling time of ${td} days and a cell-loss factor of ${clf}. What is its potential doubling time (days)?`, answer: tp, tol: .03, unit: 'days', show: tp.toFixed(1) + ' days', explain: `Tpot = Td × (1 − CLF) = ${td} × ${(1 - clf).toFixed(2)} = ${tp.toFixed(1)} days.` };
};
G.bed = () => {
  const ab = pick([2, 3, 10]), n = pick([5, 8, 10, 15, 20, 25]), d = pick([2.5, 3, 4, 5, 6]);
  if (Math.random() < .55) {
    const bed = n * d * (1 + d / ab), eqd = bed / (1 + 2 / ab);
    return { prompt: `${n} fractions of ${d} Gy are delivered to a tissue with α/β = ${ab} Gy. What is the EQD2 (Gy)?`, answer: eqd, tol: .02, unit: 'Gy', show: eqd.toFixed(1) + ' Gy', explain: `BED = n·d·(1 + d/(α/β)) = ${n}×${d}×(1 + ${d}/${ab}) = ${bed.toFixed(1)} Gy; EQD2 = BED / (1 + 2/(α/β)) = ${eqd.toFixed(1)} Gy. This assumes complete repair between fractions and no proliferation.` };
  }
  const n2 = pick([3, 5, 8]), K = n * d * (d + ab), dn = (-ab + Math.sqrt(ab * ab + 4 * K / n2)) / 2;
  return { prompt: `A schedule of ${n} × ${d} Gy is to be replaced by ${n2} fractions with the same biological effect in a tissue with α/β = ${ab} Gy. What dose per fraction (Gy) is needed?`, answer: dn, tol: .02, unit: 'Gy', show: dn.toFixed(2) + ' Gy', explain: `Equal BED means n₂·d₂·(d₂ + α/β) = n₁·d₁·(d₁ + α/β) = ${K.toFixed(0)}. Solving d₂² + ${ab}·d₂ − ${(K / n2).toFixed(1)} = 0 gives d₂ = ${dn.toFixed(2)} Gy. Large doses per fraction make this extrapolation less reliable.` };
};
G.eud = () => {
  const v = pick([.5, .6, .75, .8]), d1 = pick([8, 10, 12, 15]), d2 = pick([30, 40, 45, 50]), a = pick([1, 2, 4]);
  const e = Math.pow(v * Math.pow(d1, a) + (1 - v) * Math.pow(d2, a), 1 / a);
  return { prompt: `An organ has ${Math.round(v * 100)}% of its volume at ${d1} Gy and ${Math.round((1 - v) * 100)}% at ${d2} Gy. Calculate the generalized EUD (Gy) for a = ${a}.`, answer: e, tol: .02, unit: 'Gy', show: e.toFixed(1) + ' Gy', explain: `gEUD = (Σ vᵢ·Dᵢ^a)^(1/a) = (${v}×${d1}^${a} + ${(1 - v).toFixed(2)}×${d2}^${a})^(1/${a}) = ${e.toFixed(1)} Gy. The mean dose is ${(v * d1 + (1 - v) * d2).toFixed(1)} Gy; a larger a weights the hot region more.` };
};
G.tcp = () => {
  const N = pick([1e6, 1e7, 1e8]), ns = pick([.05, .1, .3, .7, 1.5]), sf = ns / N, tcp = Math.exp(-ns);
  return { prompt: `A tumour contains ${N.toExponential(0).replace('e+', '×10<sup>') + '</sup>'} clonogens and the treatment gives a surviving fraction of ${sf.toExponential(1).replace('e-', '×10<sup>−') + '</sup>'}. Using the Poisson model, what is the TCP (%)?`, answer: tcp * 100, tol: .03, unit: '%', show: (tcp * 100).toFixed(0) + '%', explain: `Expected survivors = N × SF = ${ns}. TCP = exp(−${ns}) = ${tcp.toFixed(3)} (${(tcp * 100).toFixed(0)}%). Uncertainty in N and SF carries straight through to TCP.` };
};
G.bliss = () => {
  const rt = pick([.1, .2, .05]), dr = pick([.3, .5, .2]), exp = rt * dr;
  if (Math.random() < .4) return { prompt: `Radiotherapy alone leaves a surviving fraction of ${rt}; a drug alone leaves ${dr}. If the effects are independent, what combined surviving fraction is expected?`, answer: exp, tol: .03, show: fmt(exp, 4), explain: `Independent killing multiplies surviving fractions: ${rt} × ${dr} = ${fmt(exp, 4)}. This is the no-interaction expectation, not evidence of radiosensitization.` };
  const f = pick([.3, 1, 3.5]), obs = exp * f, ans = f < 1 ? 0 : f > 1 ? 2 : 1;
  return { type: 'choice', prompt: `RT alone gives SF = ${rt}; the drug alone gives SF = ${dr}. The combination gives SF = ${fmt(obs, 4)}. Relative to the independent-killing (product) expectation of ${fmt(exp, 4)}, this is:`, choices: ['Supra-additive (more kill than expected)', 'Additive (no interaction)', 'Subadditive (less kill than expected)'], answer: ans, show: ['supra-additive', 'additive', 'subadditive'][ans], explain: `Observed vs expected ${fmt(exp, 4)}: ${f < 1 ? 'lower SF means more kill' : f > 1 ? 'higher SF means less kill' : 'equal'}. Additivity depends on the no-interaction model you choose, and a tumour interaction alone does not prove a better therapeutic ratio.` };
};
G.retreat = () => {
  const mk = () => ({ n: pick([5, 8, 10, 15, 20, 25]), d: pick([2, 2.5, 3, 4, 5]) }), bedOf = c => c.n * c.d * (1 + c.d / 2);
  const c1 = mk(), c2 = mk(), mo = pick([3, 4, 6, 8, 12, 18]), b1 = bedOf(c1), b2 = bedOf(c2), cum = b1 + b2;
  const desc = `Course 1: ${c1.n} × ${c1.d} Gy. Course 2: ${c2.n} × ${c2.d} Gy, given ${mo} months later. Cervical/thoracic cord, α/β = 2 Gy.`;
  const calc = `BED₁ = ${c1.n}×${c1.d}×(1 + ${c1.d}/2) = ${b1.toFixed(1)}; BED₂ = ${b2.toFixed(1)}; cumulative = ${cum.toFixed(1)} Gy₂.`;
  if (Math.random() < .5) return { prompt: desc + ' What is the cumulative BED (Gy₂)?', answer: cum, tol: .02, unit: 'Gy₂', show: cum.toFixed(1) + ' Gy₂', explain: calc };
  const ok = mo >= 6 && b1 <= 98 && b2 <= 98 && cum <= 135.5;
  const why = [mo < 6 && 'interval under 6 months', b1 > 98 && 'course 1 BED above 98', b2 > 98 && 'course 2 BED above 98', cum > 135.5 && 'cumulative BED above 135.5'].filter(Boolean);
  return { type: 'choice', prompt: desc + ' Does this meet all of the lower-risk conditions from the human analysis (interval ≥ 6 months, each course BED ≤ 98 Gy₂, cumulative BED ≤ 135.5 Gy₂)?', choices: ['Yes, all three conditions are met', 'No, at least one condition is not met'], answer: ok ? 0 : 1, show: ok ? 'yes' : 'no', explain: calc + (ok ? ' All three conditions are satisfied.' : ' Violated: ' + why.join('; ') + '.') + ' These are human findings, not veterinary prescriptions.' };
};

/* ---------- content ---------- */
const MODULES = [
{ id: 'm1', title: 'Module 1', sub: 'Basic Radiobiology', blurb: 'How radiation damages cells, how cells die and are counted, how radiation quality changes biology, and what happens before birth.',
  sessions: [
  { id: 's1', no: '1', title: 'Damage & the DNA damage response', take: 'Radiation damage unfolds from femtoseconds (physics) to years (biology). Double-strand breaks are sensed, flagged by γH2AX, held at checkpoints, and repaired by NHEJ or HR, or the cell dies or arrests.', acts: [
    { id: 'm1s1a', type: 'sequence', title: 'Time scales of radiation damage', steps: ['Physical stage (~10⁻¹⁵ s): energy is absorbed; atoms ionized and excited', 'Physico-chemical stage (~10⁻¹² s): ion-radical reactions produce free radicals', 'Chemical stage (~10⁻⁶ s to seconds): radicals diffuse and react with DNA (indirect action)', 'Early biological stage (minutes to hours): damage sensing, checkpoints, repair', 'Late biological stage (hours to years): cell death, tissue effects, cancer'], after: 'Most low-LET damage is indirect: radicals, mainly from water, attack DNA. Cancer appears only years later.' },
    { id: 'm1s1b', type: 'sequence', title: 'Response to a double-strand break', steps: ['A double-strand break forms in DNA', 'Sensors (e.g. MRN complex, ATM) detect the break', 'H2AX is phosphorylated (γH2AX) and foci form around the break', 'Checkpoint signalling halts cell-cycle progression', 'Repair by non-homologous end joining or homologous recombination', 'The cell resumes cycling, or dies/arrests permanently if repair fails'] },
    { id: 'm1s1c', type: 'classify', title: 'NHEJ or homologous recombination?', buckets: ['NHEJ', 'Homologous recombination'], items: [
      { t: 'Active throughout the cell cycle, including G1', b: 0, why: 'NHEJ needs no template, so it works in G1.' },
      { t: 'Uses a sister chromatid as the template', b: 1, why: 'HR copies undamaged homologous sequence, mainly from the sister chromatid.' },
      { t: 'Can be error-prone: bases may be lost or added at the junction', b: 0, why: 'Direct end joining can leave small deletions or insertions.' },
      { t: 'Most active in S and G2 phases', b: 1, why: 'The sister chromatid is only available after replication.' },
      { t: 'Joins the broken ends directly', b: 0, why: 'That is the defining feature of end joining.' },
      { t: 'High-fidelity repair', b: 1, why: 'A template restores the original sequence.' }] },
    { id: 'm1s1d', type: 'quiz', title: 'Check your understanding', questions: [
      Q('For low-LET radiation such as x-rays, most DNA damage arises through:', ['Direct ionization of the DNA molecule only', 'Indirect action: free radicals formed mainly from water attack DNA', 'Thermal denaturation of chromatin', 'Absorption of photons by the nuclear membrane'], 1, 'Indirect action dominates for sparsely ionizing radiation. High-LET radiation relies more on direct action.'),
      Q('Which type of DNA lesion is considered most important for radiation cell killing?', ['Single-base modification', 'DNA–protein cross-link', 'Double-strand break', 'Single-strand break'], 2, 'Single-strand breaks and base damage are repaired efficiently; unrepaired or misrepaired double-strand breaks lead to chromosome aberrations and loss of reproductive capacity.'),
      Q('What is the main purpose of a cell-cycle checkpoint after irradiation?', ['To kill the cell quickly', 'To give time for repair before replication or mitosis', 'To increase the dose to the nucleus', 'To trigger necrosis'], 1, 'Checkpoints delay progression so damage can be repaired; if repair fails, the cell may die or arrest.')] }
  ] },
  { id: 's2', no: '2', title: 'Cell death after irradiation', take: 'Cells die in several ways: apoptosis, autophagy, necrosis, senescence and mitotic catastrophe. Many solid-tumour cells die after attempting division; some cell types die quickly in interphase.', acts: [
    { id: 'm1s2a', type: 'match', title: 'Match the mode of cell death', pairs: [['Apoptosis', 'Programmed death: cell shrinkage, chromatin condensation, caspase activation'], ['Autophagy', 'The cell digests its own components'], ['Necrosis', 'Swelling and rupture of the cell membrane'], ['Senescence', 'Permanent growth arrest in a cell that remains metabolically active'], ['Mitotic catastrophe', 'Death during or after an aberrant mitosis']] },
    { id: 'm1s2b', type: 'quiz', title: 'Check your understanding', questions: [
      Q('After therapeutic doses, many epithelial tumour cells lose reproductive integrity mainly by:', ['Instant necrosis', 'Dying after attempting division (mitotic catastrophe)', 'Autophagy only', 'Senescence in all cases'], 1, 'Chromosome damage often only becomes lethal when the cell tries to divide, so cells may complete a few divisions before dying.'),
      Q('Which cell type is the classic example of rapid interphase (pre-mitotic) apoptosis after irradiation?', ['Neurons', 'Lymphocytes', 'Hepatocytes', 'Osteocytes'], 1, 'Lymphocytes and some other cell types undergo rapid apoptosis even without dividing.'),
      Q('The bystander effect refers to:', ['Damage only in cells directly traversed by radiation', 'Responses in cells that were not directly irradiated, via signals from irradiated cells', 'Radiosensitization by oxygen', 'Repair of DNA by neighbouring cells'], 1, 'Signalling from irradiated cells can alter the fate of unirradiated neighbours.')] }
  ] },
  { id: 's3', no: '3', title: 'Quantifying cell survival', take: 'Only clonogenic survival (the ability to form a colony) measures reproductive death. Survival curves are plotted semilogarithmically; the LQ model fits well at conventional doses, but a good fit does not prove the biology behind the model.', acts: [
    { id: 'm1s3a', type: 'lab', lab: 'survival', title: 'Survival-curve lab: build a curve' },
    { id: 'm1s3b', type: 'gen', make: G.plating, rounds: 4, title: 'Clonogenic assay arithmetic' },
    { id: 'm1s3c', type: 'quiz', title: 'Check your understanding', questions: [
      Q('Why are clonogenic assays preferred to short-term viability assays for radiation survival?', ['They are faster', 'They measure sustained reproductive capacity, which is what matters for tumour recurrence', 'They measure metabolic activity only', 'They need no controls'], 1, 'A cell can be metabolically active yet unable to divide. Recurrence depends on cells that keep proliferating.'),
      Q('Why is surviving fraction plotted on a logarithmic axis?', ['Because survival is always exponential', 'Because cell kill spans several orders of magnitude and equal log steps correspond to equal fractional kill', 'To hide the shoulder', 'Because plating efficiency is logarithmic'], 1, 'Surviving fractions may span 6 orders of magnitude; a log axis shows the shape of the curve over that range.'),
      Q('Two different mathematical models fit the same survival data equally well. What can you conclude?', ['Both models are biologically correct', 'The data cannot support any model', 'A good fit does not by itself validate the biological assumptions of a model', 'The data must be wrong'], 2, 'Models are descriptions. Different mechanisms can produce similar curves.')] }
  ] },
  { id: 's4', no: '4', title: 'LET and RBE', take: 'LET describes energy deposited per unit track length. RBE compares doses for the same endpoint and varies with LET, dose, fractionation, dose rate, tissue and endpoint. It peaks near ~100 keV/µm and falls from overkill. The Bragg peak is a physical advantage, not a biological one.', acts: [
    { id: 'm1s4a', type: 'lab', lab: 'letrbe', title: 'LET and RBE: find the peak' },
    { id: 'm1s4b', type: 'classify', title: 'Physical or biological advantage?', buckets: ['Physical (dose distribution)', 'Biological (LET-related)'], items: [
      { t: 'Bragg peak at a selected depth', b: 0, why: 'Depth-dose shape is physics.' },
      { t: 'Less dependence on oxygenation', b: 1, why: 'Dense ionization makes damage less oxygen dependent.' },
      { t: 'Little dose beyond the target', b: 0, why: 'This is a distal fall-off property of charged particles.' },
      { t: 'Steeper survival curve with a smaller shoulder', b: 1, why: 'More clustered DNA damage reduces repair capacity.' },
      { t: 'Reduced influence of cell-cycle position', b: 1, why: 'High-LET radiation kills cells more uniformly across the cycle.' },
      { t: 'Sharp lateral and distal dose fall-off', b: 0, why: 'Conformality is a physical advantage.' }] },
    { id: 'm1s4c', type: 'quiz', title: 'Check your understanding', questions: [
      Q('RBE is defined as:', ['The ratio of test dose to reference dose', 'The ratio of reference-radiation dose to test-radiation dose giving the same defined effect', 'LET divided by dose', 'The ratio of absorbed dose to dose equivalent'], 1, 'A beam with RBE 3 needs one third of the reference dose to produce the same effect.'),
      Q('Why does RBE fall at very high LET?', ['Cells repair more', 'Overkill: energy is deposited in cells that are already inactivated', 'Oxygen enhancement increases', 'The beam stops'], 1, 'Beyond about 100 keV/µm, extra ionization per track does not add useful damage.'),
      Q('Which must be specified when quoting an RBE?', ['The reference radiation only', 'Reference radiation, biological endpoint, dose level and experimental conditions', 'The beam energy only', 'Nothing: RBE is a constant of the beam'], 1, 'RBE is not a fixed property of a beam: it depends on dose, fractionation, dose rate, tissue and endpoint.')] }
  ] },
  { id: 's5', no: '5', title: 'Fetal irradiation & hereditary effects', take: 'Prenatal effects depend strongly on developmental stage: preimplantation loss, malformation in organogenesis, and growth or CNS effects in the fetal period. Infertility is not heritable disease; hereditary risk is estimated from animal mutation data plus human baseline frequencies.', acts: [
    { id: 'm1s5a', type: 'classify', title: 'Stage of pregnancy and expected outcome', buckets: ['Preimplantation', 'Organogenesis', 'Fetal period'], items: [
      { t: 'Embryo is lost, or survives without malformation (all-or-none)', b: 0, why: 'Cells are still largely totipotent; damaged embryos usually fail to implant.' },
      { t: 'Greatest risk of gross congenital malformations', b: 1, why: 'Organs are forming and are vulnerable to deterministic damage.' },
      { t: 'Growth restriction and central nervous system effects dominate', b: 2, why: 'The organs are formed; growth and brain development are the concern.' },
      { t: 'Irradiation in the first days after conception', b: 0, why: 'This is the preimplantation window.' },
      { t: 'Irradiation during the period when the major organs differentiate', b: 1, why: 'Organogenesis: the highest malformation risk.' },
      { t: 'Irradiation late in gestation', b: 2, why: 'The fetal period: functional and growth effects, plus the question of childhood cancer risk.' }] },
    { id: 'm1s5b', type: 'classify', title: 'Hereditary disease categories', buckets: ['Mendelian', 'Chromosomal', 'Multifactorial'], items: [
      { t: 'Huntington disease (autosomal dominant)', b: 0, why: 'A single-gene condition.' },
      { t: 'Down syndrome (trisomy 21)', b: 1, why: 'A numerical chromosome abnormality.' },
      { t: 'Type 2 diabetes or congenital heart disease', b: 2, why: 'Several genes plus environment.' },
      { t: 'Haemophilia A (X-linked recessive)', b: 0, why: 'A single-gene condition with X-linked inheritance.' },
      { t: 'Turner syndrome (45,X)', b: 1, why: 'A chromosome-number abnormality.' }] },
    { id: 'm1s5c', type: 'case', title: 'Case: unintended abdominal exposure', debrief: 'Defensible risk communication names the stage and dose, gives a range with uncertainty, and is open about where human data stop applying.', steps: [
      { text: 'A pregnant dog received an unintended abdominal exposure during a procedure. What do you need first?', choices: [
        { t: 'Gestational stage and an estimate of the absorbed dose to the conceptuses, with its uncertainty', pts: 10, fb: 'Correct: outcome depends on stage and dose.' },
        { t: 'Whether the owner wants to continue the pregnancy', pts: 3, fb: 'Important later, but it does not tell you the risk.' },
        { t: 'The breed average litter size', pts: 0, fb: 'Not what determines radiation risk.' }] },
      { text: 'The exposure occurred during organogenesis and the dose estimate is uncertain. What is the most defensible statement?', choices: [
        { t: 'Risk depends on stage and dose; give a qualitative range, state the uncertainty, and plan follow-up', pts: 10, fb: 'Good: honest, stage-specific, and follow-up oriented.' },
        { t: 'There is no risk at any dose', pts: 0, fb: 'Organogenesis is the period of highest malformation risk.' },
        { t: 'Malformations are certain', pts: 0, fb: 'Effects are dose dependent; low doses may carry no detectable effect.' }] },
      { text: 'Where does human guidance become unreliable for this dog?', choices: [
        { t: 'Species-specific developmental timing, gestation length and litter effects; the dog data are largely historical beagle studies', pts: 10, fb: 'Right: translate with caution.' },
        { t: 'It never does: human guidance applies directly', pts: 0, fb: 'Developmental timing and doses studied differ between species.' },
        { t: 'Only when the dog is large', pts: 0, fb: 'Size is not the main issue.' }] }] },
    { id: 'm1s5d', type: 'quiz', title: 'Check your understanding', questions: [
      Q('The doubling dose is the dose that:', ['Doubles the cell survival', 'Induces as many mutations as occur spontaneously in a generation', 'Doubles the RBE', 'Kills half of the germ cells'], 1, 'It is used to scale radiation-induced mutation to baseline disease frequency when estimating hereditary risk.'),
      Q('Which statement is correct?', ['Infertility after gonadal irradiation means heritable disease risk is high', 'Infertility and heritable disease are distinct outcomes', 'Heritable risk can only be measured directly in humans', 'Male and female germ cells have the same stage-specific sensitivity'], 1, 'Gonadal injury can sterilize without mutation, and surviving germ cells can carry mutations. Male and female germ cells differ in developmental sequence and sensitivity.')] }
  ] }
] },

{ id: 'm2', title: 'Module 2', sub: 'Therapy Radiobiology I', blurb: 'Dose-response, tumour kinetics, fractionation and the LQ model, modified fractionation, dose rate and normal-tissue side effects.',
  sessions: [
  { id: 's6', no: '6', title: 'Dose-response relationships', take: 'Dose-response curves are incidence-based and sigmoid. D50 sets position, γ sets steepness. The therapeutic window is the separation between tumour-control and complication curves. NTCP and TCP are model-based population predictions, and veterinary validation is limited.', acts: [
    { id: 'm2s6a', type: 'lab', lab: 'doseresp', title: 'Therapeutic window lab' },
    { id: 'm2s6b', type: 'gen', make: G.tcp, rounds: 3, title: 'Poisson TCP' },
    { id: 'm2s6c', type: 'quiz', title: 'Check your understanding', questions: M2('S6') }
  ] },
  { id: 's7', no: '7', title: 'Tumour growth & response', take: 'Net tumour growth is cell production minus cell loss. Regression (radioresponsiveness) is not control (radiocurability). Larger tumours are harder to cure.', acts: [
    { id: 'm2s7a', type: 'gen', make: G.kinetics, rounds: 4, title: 'Doubling times and cell loss' },
    { id: 'm2s7b', type: 'classify', title: 'Responsive or curable?', buckets: ['Radioresponsiveness (regression)', 'Radiocurability (local control)'], items: [
      { t: 'The tumour shrinks by 80% within two weeks', b: 0, why: 'Shrinkage speed reflects bulk-cell loss, not clonogen eradication.' },
      { t: 'No local progression two years after treatment', b: 1, why: 'Durable control means all clonogens were sterilized.' },
      { t: 'Time to maximal regression', b: 0, why: 'A response kinetic.' },
      { t: 'The tumour never regrows in the treated field', b: 1, why: 'This is local control.' },
      { t: 'Tumour regresses, then regrows six months later', b: 0, why: 'Responsive but not cured: surviving clonogens persisted.' }] },
    { id: 'm2s7c', type: 'quiz', title: 'Check your understanding', questions: M2('S7') }
  ] },
  { id: 's8', no: '8', title: 'Fractionation & the LQ approach', take: 'Late-responding tissues are more sensitive to dose per fraction (low α/β). BED and EQD2 are comparison tools, not clinical decisions; at large doses per fraction LQ becomes uncertain, which matters for veterinary SBRT.', acts: [
    { id: 'm2s8a', type: 'gen', make: G.bed, rounds: 4, title: 'BED, EQD2 and isoeffect' },
    { id: 'm2s8b', type: 'classify', title: 'Early- or late-responding?', buckets: ['Early-responding / most tumours (high α/β ≈ 10 Gy)', 'Late-responding (low α/β ≈ 2–4 Gy)'], items: [
      { t: 'Strongly dependent on dose per fraction', b: 1, why: 'Low α/β means a pronounced β component.' },
      { t: 'Skin and mucosal acute reactions', b: 0, why: 'Rapidly renewing tissues have a high α/β.' },
      { t: 'Spared by smaller doses per fraction', b: 1, why: 'Hyperfractionation spares late tissue.' },
      { t: 'Spinal cord and fibrosis', b: 1, why: 'Late effects with low α/β.' },
      { t: 'Response changes only modestly with fraction size', b: 0, why: 'High α/β behaves nearly linearly in dose.' },
      { t: 'Most tumours are assumed to behave this way', b: 0, why: 'A common working assumption, though it is uncertain for individual tumour types.' }] },
    { id: 'm2s8c', type: 'classify', title: 'The four Rs', buckets: ['Repair', 'Redistribution', 'Reoxygenation', 'Repopulation'], items: [
      { t: 'Sublethal damage is fixed between fractions, sparing late tissue', b: 0, why: 'Repair of sublethal damage.' },
      { t: 'Surviving cells move into a more radiosensitive phase of the cycle', b: 1, why: 'Cell-cycle redistribution.' },
      { t: 'Hypoxic cells regain oxygen as tumour cells die and perfusion improves', b: 2, why: 'Reoxygenation.' },
      { t: 'Accelerated regrowth of surviving clonogens after a lag period', b: 3, why: 'Repopulation.' },
      { t: 'Makes later fractions more effective by changing the oxygen status of survivors', b: 2, why: 'Reoxygenation.' },
      { t: 'Prolonging overall treatment time loses tumour control through this process', b: 3, why: 'Repopulation.' }] },
    { id: 'm2s8d', type: 'quiz', title: 'Check your understanding', questions: M2('S8') }
  ] },
  { id: 's9', no: '9', title: 'Modified fractionation & time', take: 'Hyperfractionation spares late tissue; hypofractionation endangers it unless spatial sparing is sufficient; acceleration limits tumour repopulation at the price of more acute toxicity.', acts: [
    { id: 'm2s9a', type: 'match', title: 'Match the schedule to its rationale', pairs: [['Hyperfractionation', 'Smaller dose per fraction, more fractions: spares late tissue, allows higher total dose'], ['Hypofractionation', 'Larger dose per fraction: hazardous for late tissue unless spatially spared'], ['Acceleration', 'Shorter overall time to limit repopulation; more acute toxicity'], ['CHART', 'Three fractions daily with no weekend gap; acute mucosal reactions are the predictable trade-off'], ['Treatment prolongation', 'Allows acute recovery but gives surviving tumour cells time to repopulate']] },
    { id: 'm2s9b', type: 'case', title: 'Case: missed fractions', debrief: 'There is no single rule. Weigh tumour kinetics, remaining dose, acute-toxicity severity and late-tissue constraints before choosing to extend, compensate or stop.', steps: [
      { text: 'A dog with an oral tumour completes 8 of 20 daily fractions, then misses 5 days because of mucositis and anaesthesia concerns. What do you do first?', choices: [
        { t: 'Review tumour type and kinetics, remaining dose, acute-toxicity severity and elapsed time before deciding', pts: 10, fb: 'Correct: the decision depends on several variables.' },
        { t: 'Resume as originally planned and ignore the gap', pts: 3, fb: 'Possible, but repopulation during the gap may erode control.' },
        { t: 'Double the next fractions to catch up', pts: 0, fb: 'This can sharply increase late-effect risk and acute toxicity.' }] },
      { text: 'Mucositis is severe and the tumour is a fast-growing carcinoma. What is the best approach?', choices: [
        { t: 'Manage toxicity, resume as soon as safe, and consider compensating with BED-based calculations while respecting late-tissue constraints', pts: 10, fb: 'Good: time-compensation must be balanced against normal-tissue limits.' },
        { t: 'Stop treatment permanently without review', pts: 3, fb: 'May be right in some cases, but it forfeits any chance of control without assessing alternatives.' },
        { t: 'Raise the dose per fraction substantially without checking late risk', pts: 0, fb: 'Late-responding tissues are most sensitive to dose per fraction.' }] },
      { text: 'What evidence would best support accelerated repopulation in a specific canine tumour type?', choices: [
        { t: 'Time-dose outcome analyses in a sufficiently large, well-characterized cohort, ideally prospective', pts: 10, fb: 'Yes: consistent evidence is needed, not anecdotes.' },
        { t: 'A single dog that regrew after a gap', pts: 0, fb: 'One case cannot separate repopulation from chance or biology.' },
        { t: 'Human head-and-neck data', pts: 3, fb: 'Suggestive context but not proof for dogs.' }] }] },
    { id: 'm2s9c', type: 'quiz', title: 'Check your understanding', questions: M2('S9') }
  ] },
  { id: 's10', no: '10', title: 'Dose rate & brachytherapy', take: 'Damage is repaired during exposure, so dose rate matters. The protraction factor g (0–1) scales the quadratic term. Brachytherapy succeeds partly through steep inverse-square dose gradients.', acts: [
    { id: 'm2s10a', type: 'lab', lab: 'gfactor', title: 'Protraction factor g lab' },
    { id: 'm2s10b', type: 'quiz', title: 'Check your understanding', questions: M2('S10') }
  ] },
  { id: 's11', no: '11', title: 'Normal-tissue side effects', take: 'Acute, late and consequential late effects are biologically related but not interchangeable. Tolerance depends on tissue architecture and stem-cell compartments; veterinary toxicity has extra modifiers (grooming, trauma, owner care).', acts: [
    { id: 'm2s11a', type: 'classify', title: 'Acute, late or consequential late?', buckets: ['Acute', 'Late', 'Consequential late'], items: [
      { t: 'Moist desquamation of the skin within weeks', b: 0, why: 'Rapidly renewing epithelium: acute.' },
      { t: 'Dermal fibrosis months to years later', b: 1, why: 'Stromal and vascular remodelling: late.' },
      { t: 'A chronic ulcer after a severe mucosal reaction fails to heal', b: 2, why: 'Severe acute injury propagates into persistent morbidity.' },
      { t: 'Telangiectasia', b: 1, why: 'Vascular late effect.' },
      { t: 'Oral mucositis in the second week of treatment', b: 0, why: 'Acute epithelial reaction.' },
      { t: 'Stricture after severe acute mucosal denudation', b: 2, why: 'Consequential late effect.' },
      { t: 'Radiation myelopathy months after treatment', b: 1, why: 'A late, serial-type effect.' }] },
    { id: 'm2s11b', type: 'quiz', title: 'Check your understanding', questions: M2('S11') }
  ] }
] },

{ id: 'm3', title: 'Module 3', sub: 'Therapy Radiobiology II', blurb: 'Normal-tissue tolerance, radiobiological modelling, chemoradiation, hadrons and alpha therapy, retreatment and second cancers, whole-body exposure.',
  sessions: [
  { id: 's12', no: '12', title: 'Tolerances & dose inhomogeneity', take: 'A tolerance is conditional on endpoint, volume, schedule and follow-up. A DVH discards spatial location. Serial and parallel organ models are useful but not absolute. Human QUANTEC values need veterinary justification.', acts: [
    { id: 'm3s12a', type: 'classify', title: 'Serial-like or parallel-like?', buckets: ['Serial-like', 'Parallel-like'], items: [
      { t: 'Spinal cord', b: 0, why: 'Injury to one critical segment can cause loss of function.' },
      { t: 'Lung', b: 1, why: 'Functional reserve: sparing enough volume preserves function.' },
      { t: 'Liver', b: 1, why: 'A large reserve of functional subunits.' },
      { t: 'Optic nerve', b: 0, why: 'A serial structure: damage to one segment can disrupt function.' },
      { t: 'Function lost if one critical segment is damaged', b: 0, why: 'Defines serial behaviour.' },
      { t: 'Tolerates partial-volume irradiation if enough tissue is spared', b: 1, why: 'Defines parallel behaviour.' }] },
    { id: 'm3s12b', type: 'match', title: 'DVH vocabulary', pairs: [['V20 Gy', 'Volume receiving at least 20 Gy (state whether relative % or absolute cm³)'], ['D0.1 cm³', 'Dose to the hottest 0.1 cm³ of the structure'], ['Mean dose', 'Volume-weighted average; cannot reveal a hot spot'], ['DVH', 'Records dose and volume but discards spatial location'], ['Tolerance', 'Conditional on endpoint, volume, schedule and follow-up']] },
    { id: 'm3s12c', type: 'quiz', title: 'Check your understanding', questions: [
      Q('Two plans have identical DVHs for a normal organ. What can you say?', ['Their NTCP must be identical', 'Their DVHs match, but they may place dose in different functional regions, so risk is not guaranteed equal', 'One plan must be wrong', 'They have equal mean dose only'], 1, 'A DVH discards where the dose lies. Equal DVHs support "no difference under the model", not "no difference".'),
      Q('The dose per fraction at an organ voxel differs from the prescribed tumour fraction dose. For biological conversion you should:', ['Use the prescribed fraction dose', 'Use the local dose per fraction at that voxel', 'Average the whole plan dose first', 'Ignore fractionation'], 1, 'Local dose history drives local biology; conversion is nonlinear.')] }
  ] },
  { id: 's13', no: '13', title: 'Radiobiological modelling & plan evaluation', take: 'Convert each voxel with its own fraction dose before summarizing. gEUD (a = 1 gives mean dose; large a weights hot spots) and LKB reduce a DVH to a number. Rankings by TCP, NTCP or gEUD depend on parameters: test whether plausible changes reverse them.', acts: [
    { id: 'm3s13a', type: 'lab', lab: 'lkb', title: 'Plan evaluation lab: same mean dose, different risk' },
    { id: 'm3s13b', type: 'gen', make: G.eud, rounds: 3, title: 'Generalized EUD' },
    { id: 'm3s13c', type: 'quiz', title: 'Check your understanding', questions: [
      Q('Why convert each DVH bin using its own fraction dose rather than averaging physical dose first?', ['Because averaging is not allowed', 'Because the biological conversion (BED/EQD2) is nonlinear in dose', 'Because DVH bins must be equal in size', 'Because α/β cancels out'], 1, 'Averaging first can change the result because BED depends on dose per fraction nonlinearly.'),
      Q('In the LKB model, n is:', ['The number of fractions', 'The volume-effect parameter', 'The slope', 'The prescription dose'], 1, 'Do not confuse LKB n with the number of treatment fractions. m is the slope and TD50 locates the curve.'),
      Q('gEUD with a = 1 equals:', ['The maximum dose', 'The mean dose', 'The median dose', 'The minimum dose'], 1, 'At a = 1 gEUD is the volume-weighted mean dose; large positive a approaches the maximum.')] }
  ] },
  { id: 's14', no: '14', title: 'Chemotherapy & radiation', take: 'Combined-treatment mechanisms: spatial cooperation, independent cell killing, and cellular/molecular interaction. Additivity depends on the chosen no-interaction expectation; a tumour interaction alone does not establish a better therapeutic ratio.', acts: [
    { id: 'm3s14a', type: 'classify', title: 'Which interaction category?', buckets: ['Spatial cooperation', 'Independent cell killing', 'Cellular/molecular interaction'], items: [
      { t: 'The drug treats micrometastases while RT treats the primary tumour', b: 0, why: 'Different disease compartments.' },
      { t: 'Both agents kill tumour cells independently, with non-overlapping toxicities', b: 1, why: 'Effects are combined without interaction in the cell.' },
      { t: 'The drug inhibits repair of radiation damage in the same cells', b: 2, why: 'One treatment alters the response to the other.' },
      { t: 'The drug holds cells in a radiosensitive phase before radiation', b: 2, why: 'Redistribution: a cellular interaction.' },
      { t: 'Systemic therapy for distant disease plus local RT for a bulky primary', b: 0, why: 'Different anatomical sites.' },
      { t: 'Surviving fractions simply multiply', b: 1, why: 'The product (Bliss) expectation for independent killing.' }] },
    { id: 'm3s14b', type: 'gen', make: G.bliss, rounds: 4, title: 'Independent killing and additivity' },
    { id: 'm3s14c', type: 'lab', lab: 'tr', title: 'Therapeutic ratio lab' },
    { id: 'm3s14d', type: 'classify', title: 'Which drug class?', buckets: ['Antimetabolite', 'Alkylating agent', 'Topoisomerase inhibitor', 'Antimicrotubule agent'], items: [
      { t: 'Gemcitabine', b: 0, why: 'Interferes with nucleotide metabolism and DNA synthesis.' },
      { t: 'Cyclophosphamide', b: 1, why: 'Damages DNA by alkylation.' },
      { t: 'Doxorubicin', b: 2, why: 'A topoisomerase-II inhibitor (also an anthracycline antibiotic; the categories overlap).' },
      { t: 'Vincristine', b: 3, why: 'Disrupts microtubule function.' },
      { t: 'Fluorouracil', b: 0, why: 'An antimetabolite.' },
      { t: 'Paclitaxel', b: 3, why: 'Stabilizes microtubules.' }] },
    { id: 'm3s14e', type: 'quiz', title: 'Check your understanding', questions: [
      Q('In the randomized UKCCCR anal-cancer trial, adding fluorouracil and mitomycin to RT:', ['Cured all patients', 'Reduced local failure but increased early morbidity, without a significant overall-survival advantage at first report', 'Increased local failure', 'Eliminated toxicity'], 1, 'Evidence for benefit and for cost both matter.'),
      Q('A veterinary series of cisplatin plus RT in dogs with nasal tumours used historical controls. What does it support?', ['Proof of survival benefit', 'A reason to investigate further; it cannot establish a general benefit', 'That cisplatin is harmful', 'Nothing at all'], 1, 'Small uncontrolled series are hypothesis generating; the comparator matters.'),
      Q('More apoptosis at one time point after chemoradiation proves:', ['Greater durable clonogenic control', 'Nothing by itself: apoptosis is one endpoint and durable control must be shown', 'That the drug is a radiosensitizer', 'That repopulation is blocked'], 1, 'Cell-cycle redistribution, reduced repopulation and increased kill are different mechanisms.')] }
  ] },
  { id: 's15', no: '15', title: 'Hadrons & targeted alpha therapy', take: 'Beam range and biological effectiveness are separate concepts. Protons are usually modelled with a constant RBE of 1.1 although actual RBE varies. Targeted alpha therapy delivers short-range, dense energy but depends on targeting and biodistribution.', acts: [
    { id: 'm3s15a', type: 'lab', lab: 'bragg', title: 'Bragg peak lab' },
    { id: 'm3s15b', type: 'classify', title: 'Range or effectiveness?', buckets: ['Beam range (physical)', 'Biological effectiveness'], items: [
      { t: 'Energy selection sets the stopping depth', b: 0, why: 'A physics property.' },
      { t: 'A constant RBE of 1.1 assumed for protons', b: 1, why: 'A biological weighting; true RBE varies with LET, dose, tissue and endpoint.' },
      { t: 'Distal fragmentation tail of a carbon beam', b: 0, why: 'A physical dose contribution.' },
      { t: 'Higher LET in the target with reduced oxygen dependence', b: 1, why: 'A biological advantage.' },
      { t: 'Local RBE rising near the distal edge', b: 1, why: 'LET and effectiveness rise near the end of range.' },
      { t: 'The Bragg peak at a selected depth', b: 0, why: 'A depth-dose property.' }] },
    { id: 'm3s15c', type: 'match', title: 'Evidence and concepts', pairs: [['Canine osteosarcoma / GD2', 'Alpha-therapy proof-of-concept evidence'], ['Canine oral melanoma / CSPG4', 'Target-directed vaccine evidence, not established TAT efficacy'], ['CD20-positive lymphoma', 'Preclinical alpha-radioimmunotherapy in a mouse xenograft, no canine clinical trial'], ['Cross-fire', 'Dose to nearby cells from a targeted radionuclide, distinct from bystander signalling'], ['Heterogeneous antigen expression', 'A reason targeted therapy can fail to reach all tumour cells']] },
    { id: 'm3s15d', type: 'quiz', title: 'Check your understanding', questions: [
      Q('Carbon-ion beams are attractive for resistant disease mainly because they:', ['Cost less than protons', 'Combine a Bragg peak with higher LET and reduced oxygen dependence in the target', 'Have no dose beyond the target', 'Have RBE = 1'], 1, 'This is a rationale for resistant disease, not proof of superiority for every tumour, and facilities are demanding.')] }
  ] },
  { id: 's16', no: '16', title: 'Retreatment & second cancers', take: 'Retreatment assessment needs the previous plan, local dose and fraction size, overlap, interval, prior toxicity and the intended endpoint; a summed physical dose is inadequate. A tumour after RT is not automatically caused by RT.', acts: [
    { id: 'm3s16a', type: 'gen', make: G.retreat, rounds: 4, title: 'Retreatment BED check (human spinal-cord study)' },
    { id: 'm3s16b', type: 'case', title: 'Case: re-irradiation near the spinal cord', debrief: 'Retreatment relies on BED reasoning and human data that are not veterinary prescriptions. Document the assumptions and uncertainty.', steps: [
      { text: 'A dog with a recurrent tumour near the cervical cord was treated 14 months ago (5 × 4 Gy to the cord). What do you need first?', choices: [
        { t: 'The previous plan (local dose and fraction size to the cord), overlap, interval, prior toxicity and the intended endpoint', pts: 10, fb: 'Correct: local dose history matters.' },
        { t: 'Only the total physical dose of the first course', pts: 0, fb: 'A summed physical dose ignores fractionation differences.' },
        { t: 'The owner\'s preferred number of visits', pts: 0, fb: 'Not a radiobiological input.' }] },
      { text: 'Plan: 10 × 3 Gy to the same cord segment. With α/β = 2 Gy, the first course has BED 60 Gy₂ and the second 75 Gy₂. What is the best summary?', choices: [
        { t: 'Cumulative BED 135 Gy₂ is at the edge of the human lower-risk limit (135.5); interval is acceptable, but this is human data with assumed α/β, so uncertainty is large', pts: 10, fb: 'Correct: near the limit with large uncertainty.' },
        { t: 'The physical doses sum to 50 Gy, which is safe', pts: 0, fb: 'Physical dose alone is inadequate with different fraction sizes.' },
        { t: 'The human limit guarantees safety in dogs', pts: 0, fb: 'Human data do not establish veterinary risk.' }] },
      { text: 'How should the risk be communicated?', choices: [
        { t: 'State it is an estimate from human data, describe the myelopathy risk and alternatives, and plan follow-up', pts: 10, fb: 'Good: transparent about uncertainty.' },
        { t: 'Promise there is no risk of myelopathy', pts: 0, fb: 'Not supportable.' },
        { t: 'Present the BED limit as a veterinary prescription', pts: 0, fb: 'The study conditions are not veterinary prescriptions.' }] }] },
    { id: 'm3s16c', type: 'classify', title: 'Second cancer: supported or overstated?', buckets: ['Supported', 'Overstated'], items: [
      { t: 'A tumour appearing after RT is automatically caused by RT', b: 1, why: 'Inherited susceptibility, shared exposures and ageing also contribute.' },
      { t: 'About 5% of contralateral breast cancers in an irradiated cohort were attributable to RT', b: 0, why: 'An attributable fraction of cases, estimated in a cohort.' },
      { t: 'A 5% attributable fraction means each survivor has a 5% chance of a second cancer', b: 1, why: 'It is a fraction of second cancers, not an individual probability.' },
      { t: 'Shared exposures such as smoking or HPV can contribute to second cancers', b: 0, why: 'Association and individual attribution are different questions.' },
      { t: 'Human risk coefficients establish the veterinary second-cancer risk', b: 1, why: 'Human coefficients do not establish veterinary risk.' },
      { t: 'Age, dose distribution and competing mortality affect interpretation of risk', b: 0, why: 'All affect risk estimates.' }] },
    { id: 'm3s16d', type: 'quiz', title: 'Check your understanding', questions: [
      Q('In the mouse kidney retreatment experiment, what happened to retreatment tolerance over the intervals tested?', ['It fully recovered at 2 weeks', 'Functional damage progressed and retreatment tolerance decreased, with no recovery demonstrated', 'It increased', 'It was unchanged'], 1, 'Late-organ recovery is tissue dependent and cannot be transferred universally.')] }
  ] },
  { id: 's17', no: '17', title: 'Total-body irradiation & carcinogenesis', take: 'Acute radiation syndromes follow substantial whole-body exposure over a short time; fractionated therapeutic TBI differs. LD50 values must state species, observation period, radiation quality, dose rate, volume and supportive care. Tissue reactions have thresholds; cancer risk is stochastic.', acts: [
    { id: 'm3s17a', type: 'match', title: 'Syndromes and definitions', pairs: [['Hematopoietic syndrome', 'Roughly 0.7–10 Gy: marrow injury, infection and bleeding'], ['Gastrointestinal syndrome', 'Above about 10 Gy: severe barrier and fluid loss'], ['Cardiovascular/CNS syndrome', 'Above about 50 Gy: rapid neurologic and circulatory deterioration'], ['Prodrome', 'Early nausea, vomiting or diarrhea before a latent interval'], ['LD50', 'Meaningful only with species, time, radiation quality, dose rate, volume and care specified']] },
    { id: 'm3s17b', type: 'classify', title: 'Tissue reaction or stochastic effect?', buckets: ['Tissue reaction (deterministic)', 'Stochastic'], items: [
      { t: 'Dose affects the probability, not the severity, of the effect', b: 1, why: 'The hallmark of a stochastic effect.' },
      { t: 'A practical threshold dose; severity rises above it', b: 0, why: 'Tissue reactions have thresholds.' },
      { t: 'Radiation-induced second cancer', b: 1, why: 'Dose affects the probability, not the severity of the cancer.' },
      { t: 'Hematopoietic syndrome', b: 0, why: 'A tissue reaction after substantial dose.' },
      { t: 'Skin fibrosis', b: 0, why: 'A tissue reaction.' },
      { t: 'Heritable effects', b: 1, why: 'Stochastic.' }] },
    { id: 'm3s17c', type: 'quiz', title: 'Check your understanding', questions: [
      Q('Which statement about LD50 is correct?', ['Human LD50/60 values are universal animal constants', 'It is only meaningful when species, observation period, radiation quality, dose rate, exposed volume and supportive care are specified', 'It is independent of supportive care', 'It equals the TD50'], 1, 'Human values are not universal animal constants.'),
      Q('Higher doses do not guarantee elimination of all future cancer risk because:', ['Cell killing always removes risk', 'Models combining mutation, cell killing and repopulation can explain persistent second-cancer risk after fractionated RT', 'Cancers need no mutation', 'Dose is irrelevant'], 1, 'Surviving, mutated cells can regrow.')] }
  ] }
] },

{ id: 'm4', title: 'Module 4', sub: 'Advanced Radiobiology', draft: true, blurb: 'Oxygen, hypoxia and the tumour microenvironment, and molecularly targeted radiotherapy.',
  sessions: [
  { id: 's18', no: '18', title: 'Oxygen effect & fractionated RT', take: 'Hypoxic cells need about three times the dose of well-oxygenated cells. Reoxygenation between fractions is one reason fractionation works.', acts: [
    { id: 'm4s18a', type: 'lab', lab: 'oer', title: 'Oxygen enhancement lab' },
    { id: 'm4s18b', type: 'lab', lab: 'reox', title: 'Reoxygenation and fractionation' }
  ] },
  { id: 's19', no: '19', title: 'Tumour microenvironment & hypoxia response', take: 'Chronic hypoxia is diffusion limited; acute (perfusion-limited) hypoxia fluctuates with blood flow. Hypoxia stabilizes HIF-1α and changes gene expression.', acts: [
    { id: 'm4s19a', type: 'classify', title: 'Chronic or acute hypoxia?', buckets: ['Chronic (diffusion-limited)', 'Acute (perfusion-limited)'], items: [
      { t: 'Cells lie beyond the diffusion distance of oxygen from a vessel (roughly 100–200 µm)', b: 0, why: 'The classic diffusion limit.' },
      { t: 'Caused by transient closure or fluctuation of blood flow in a vessel', b: 1, why: 'Perfusion-limited.' },
      { t: 'Hypoxia that fluctuates over minutes to hours', b: 1, why: 'Acute hypoxia varies with flow.' },
      { t: 'Often found at the edge of a necrotic region', b: 0, why: 'Cells at the limit of the diffusion zone.' }] },
    { id: 'm4s19b', type: 'quiz', title: 'Check your understanding', questions: [
      Q('Under hypoxia, HIF-1α:', ['Is rapidly degraded', 'Is stabilized and drives expression of hypoxia-response genes (e.g. glycolysis, VEGF)', 'Is irrelevant to tumours', 'Increases oxygen supply directly'], 1, 'Stabilization allows HIF-1 to turn on adaptive gene programmes.')] }
  ] },
  { id: 's20', no: '20', title: 'Molecular targeting & guided RT', take: 'This session has no student guide yet. Activities will be added when its content is written.', acts: [
    { id: 'm4s20a', type: 'placeholder', title: 'Coming soon' }
  ] }
] }
];
