(function(){
  // In-memory stand-in for window.claude.use('db'), seeded with made-up data. Writes apply and notify subscribers.
  const SEED = window.__SEED, DOCS = {};
  DOCS['profile/main'] = SEED.profile;
  if (SEED.voice) DOCS['settings/voice'] = SEED.voice;
  for (const it of SEED.interviews) DOCS['interviews/' + it.id] = it.data;
  const copy = v => v === undefined ? v : JSON.parse(JSON.stringify(v));
  const docSubs = {}, colSubs = [];
  const snapDoc = p => ({exists: !!DOCS[p], id: p.split('/')[1], data: () => copy(DOCS[p])});
  const snapCol = () => ({docs: Object.keys(DOCS).filter(k => k.startsWith('interviews/')).map(k => ({id: k.slice(11), data: () => copy(DOCS[k])}))});
  const emit = p => { (docSubs[p] || []).forEach(cb => cb(snapDoc(p))); if (p.startsWith('interviews/')) colSubs.forEach(cb => cb(snapCol())); };
  const merge = (a, b) => { for (const k in b) { const v = b[k]; if (v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) merge(a[k], v); else a[k] = v; } return a; };
  const db = {
    doc: p => ({
      onSnapshot: cb => { (docSubs[p] = docSubs[p] || []).push(cb); setTimeout(() => cb(snapDoc(p)), 0); return () => {}; },
      set: d => { DOCS[p] = copy(d); setTimeout(() => emit(p), 0); return Promise.resolve(); },
      update: d => { DOCS[p] = merge(DOCS[p] || {}, copy(d)); setTimeout(() => emit(p), 0); return Promise.resolve(); },
      delete: () => { delete DOCS[p]; setTimeout(() => emit(p), 0); return Promise.resolve(); }
    }),
    collection: () => ({ onSnapshot: cb => { colSubs.push(cb); setTimeout(() => cb(snapCol()), 0); return () => {}; } })
  };
  const sample = async () => ({text: '', truncated: false});
  window.claude = { use: async n => n === 'db' ? db : n === 'sample' ? sample : null };
  document.documentElement.setAttribute('data-theme', 'light');
})();
