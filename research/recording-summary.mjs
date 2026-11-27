// Descriptive synthetic-recording diagnostics, not confidence intervals.
const ratio=(a,b)=>b?a/b:null;
export function summarizeRecordings(records){
  if(!Array.isArray(records))throw Error('Recordings must be an array');
  const seen=new Set();
  for(const r of records){
    if(!r||!Number.isSafeInteger(r.seed)||seen.has(r.seed)||!['tp','fp','fn'].every(k=>Number.isSafeInteger(r[k])&&r[k]>=0))throw Error('Invalid or duplicate recording');
    seen.add(r.seed);
  }
  const fp=records.map(r=>r.fp).sort((a,b)=>a-b);
  const quantile=p=>fp.length?fp[Math.max(0,Math.ceil(p*fp.length)-1)]:null;
  const events=records.filter(r=>r.tp+r.fn>0);
  const tp=records.reduce((s,r)=>s+r.tp,0),fn=records.reduce((s,r)=>s+r.fn,0);
  return {recordings:records.length,event_recordings:events.length,no_event_recordings:records.length-events.length,
    pooled_window_recall:ratio(tp,tp+fn),macro_recording_recall:events.length?events.reduce((s,r)=>s+r.tp/(r.tp+r.fn),0)/events.length:null,
    recordings_with_false_flags:records.filter(r=>r.fp>0).length,
    false_flags_per_recording:{median:quantile(.5),p95:quantile(.95),max:fp.length?fp[fp.length-1]:null},
    worst_recordings:[...records].sort((a,b)=>b.fp-a.fp||b.fn-a.fn||a.seed-b.seed).slice(0,5).map(({seed,tp,fp,fn})=>({seed,tp,fp,fn})),
    limitation:'Descriptive summaries of supplied synthetic recordings. Quantiles use nearest rank; macro recall excludes recordings with no constructed truth windows. Pooled recall weights windows, macro recall weights event-containing recordings equally. Worst cases sort by false flags, then misses, then seed. These are not confidence intervals, held-out performance or physical validation.'};
}
