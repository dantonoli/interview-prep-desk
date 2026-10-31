(function(){
  // In-memory stand-in for window.claude.use('db'), seeded with made-up data. Writes apply and notify subscribers.
  // window.__SAMPLE (optional) answers sample.json calls by pack part: an answer object, or a failure {code, message, text?}
  // whose text streams before the call rejects, as the runtime does with invalid_json. window.__saved records what downloads.save got.
  const SEED = window.__SEED, DOCS = {};
  DOCS['profile/main'] = SEED.profile;
  if (SEED.voice) DOCS['settings/voice'] = SEED.voice;
  for (const it of SEED.interviews) DOCS['interviews/' + it.id] = it.data;
  for (const j of SEED.jobs || []) DOCS['jobs/' + j.id] = j.data;
  // The viewer is u_example, so the private application answers live at data/users/u_example/applicant.
  if (SEED.answers) DOCS['data/users/u_example/applicant'] = SEED.answers;
  const copy = v => v === undefined ? v : JSON.parse(JSON.stringify(v));
  const docSubs = {}, colSubs = {};
  const snapDoc = p => ({exists: !!DOCS[p], id: p.split('/')[1], data: () => copy(DOCS[p])});
  const snapCol = c => ({docs: Object.keys(DOCS).filter(k => k.startsWith(c + '/')).map(k => ({id: k.slice(c.length + 1), data: () => copy(DOCS[k])}))});
  const emit = p => { const c = p.split('/')[0]; (docSubs[p] || []).forEach(cb => cb(snapDoc(p))); (colSubs[c] || []).forEach(cb => cb(snapCol(c))); };
  const merge = (a, b) => { for (const k in b) { const v = b[k]; if (v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) merge(a[k], v); else a[k] = v; } return a; };
  const db = {
    doc: p => ({
      onSnapshot: cb => { (docSubs[p] = docSubs[p] || []).push(cb); setTimeout(() => cb(snapDoc(p)), 0); return () => {}; },
      set: d => { DOCS[p] = copy(d); setTimeout(() => emit(p), 0); return Promise.resolve(); },
      update: d => { DOCS[p] = merge(DOCS[p] || {}, copy(d)); setTimeout(() => emit(p), 0); return Promise.resolve(); },
      delete: () => { delete DOCS[p]; setTimeout(() => emit(p), 0); return Promise.resolve(); }
    }),
    collection: c => ({ onSnapshot: cb => { (colSubs[c] = colSubs[c] || []).push(cb); setTimeout(() => cb(snapCol(c)), 0); return () => {}; } })
  };
  const PARTS = [['analysis', 'employer really needs'], ['cv', 'Tailor the candidate'], ['letters', 'application texts'], ['review', 'screening applications']];
  const sample = async () => ({text: '', truncated: false});
  sample.json = (input, opts = {}) => new Promise((res, rej) => {
    const part = (PARTS.find(([, m]) => String(input).includes(m)) || [])[0], answer = (window.__SAMPLE || {})[part];
    window.__prompts = (window.__prompts || []).concat({part, input: String(input)});
    if (!answer) return rej({code: 'upstream_error', message: 'no stub answer'});
    const text = answer.code ? answer.text || '' : JSON.stringify(answer), t1 = setTimeout(() => text && opts.onText && opts.onText({text: text.slice(0, 40), delta: text.slice(0, 40)}), 60);
    const t2 = setTimeout(() => { text && opts.onText && opts.onText({text, delta: text.slice(40)}); answer.code ? rej(copy(answer)) : res(copy(answer)); }, window.__SAMPLE_MS || 300);
    if (opts.signal) opts.signal.addEventListener('abort', () => { clearTimeout(t1); clearTimeout(t2); rej({code: 'cancelled', message: 'aborted'}); });
  });
  const downloads = { save: async ({filename, data}) => { const bytes = new Uint8Array(await new Response(data).arrayBuffer()); window.__saved = (window.__saved || []).concat({filename, bytes: Array.from(bytes)}); return {status: 'saved'}; } };
  window.__db = DOCS;
  const user = { id: async () => 'u_example', isOwner: async () => true, canEdit: async () => true, can: async () => true };
  window.claude = { use: async n => n === 'db' ? db : n === 'sample' ? sample : n === 'downloads' ? downloads : n === 'user' ? user : null };
  document.documentElement.setAttribute('data-theme', 'light');
})();
