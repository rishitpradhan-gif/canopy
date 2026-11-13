// Evaluation-only: requires an externally specified observation domain.
// A recording cannot reveal all the cells/windows that disappeared completely.
const key=w=>`${w.start_s}:${w.cell.join(',')}`;
const ratio=(a,b)=>b?a/b:null;
export function expectedCoverage(report,slots,truth,{cell_m=50}={}){
  if(!report||!report.settings||!report.baseline||!Array.isArray(report.windows))throw Error('Invalid analysis report');
  if(!Number.isFinite(cell_m)||cell_m<=0||!Number.isFinite(report.baseline.end_s)||!Number.isFinite(report.settings.window_s)||report.settings.window_s<=0||!Number.isSafeInteger(report.settings.min_peers)||report.settings.min_peers<1)throw Error('Invalid coverage settings');
  if(report.settings.cell_m!==cell_m)throw Error('Expected-domain cell size does not match analysis');
  if(!Array.isArray(slots)||!Array.isArray(truth))throw Error('Expected slots and truth must be arrays');
  const domain=new Map(),devices=new Map(),seen=new Set(),end=report.baseline.end_s,width=report.settings.window_s;
  for(const s of slots){
    if(!s||typeof s.device!=='string'||!s.device.length||!Number.isFinite(s.t_s)||!Array.isArray(s.cell)||s.cell.length!==2||!s.cell.every(Number.isSafeInteger))throw Error('Invalid expected slot');
    const id=`${s.device}:${s.t_s}`;if(seen.has(id))throw Error('Duplicate expected device/time slot');seen.add(id);
    if(s.t_s<end)continue;const w={start_s:end+Math.floor((s.t_s-end)/width)*width,cell:s.cell};const k=key(w);domain.set(k,w);if(!devices.has(k))devices.set(k,new Set());devices.get(k).add(s.device);
  }
  const validateWindow=w=>{if(!w||!Number.isFinite(w.start_s)||!Array.isArray(w.cell)||w.cell.length!==2||!w.cell.every(Number.isSafeInteger))throw Error('Invalid cell/window coordinates');};
  const observed=new Map();for(const w of report.windows){validateWindow(w);const k=key(w);if(!domain.has(k))throw Error('Reported window outside expected domain');if(observed.has(k))throw Error('Duplicate reported window');if(!Number.isSafeInteger(w.eligible)||w.eligible<0)throw Error('Invalid eligible-device count');if(w.eligible>devices.get(k).size)throw Error('Eligible-device count exceeds scheduled distinct devices');if(typeof w.detected!=='boolean')throw Error('Detection state must be boolean');observed.set(k,w);}
  const positives=new Set();for(const w of truth){validateWindow(w);const k=key(w);if(!domain.has(k))throw Error('Truth window outside expected domain');if(positives.has(k))throw Error('Duplicate truth window');positives.add(k);}
  const states=[...domain].map(([k,w])=>{const r=observed.get(k),eligible=!!r&&r.eligible>=report.settings.min_peers;if(r?.detected&&!eligible)throw Error('Flagged window lacks minimum eligible devices');return {...w,truth_positive:positives.has(k),state:!r?'unreported':!eligible?'insufficient-evidence':r.detected?'flagged':'unflagged-eligible'};});
  const eligible=s=>['flagged','unflagged-eligible'].includes(s.state),events=states.filter(s=>s.truth_positive),eventEligible=events.filter(eligible),tp=events.filter(s=>s.state==='flagged').length;
  const eligibleCount=states.filter(eligible).length,unreported=states.filter(s=>s.state==='unreported').length;
  return {schema:'canopy-expected-coverage/1',expected_windows:states.length,reported_windows:observed.size,eligible_windows:eligibleCount,insufficient_reported_windows:states.filter(s=>s.state==='insufficient-evidence').length,unreported_windows:unreported,abstained_windows:states.length-eligibleCount,eligible_fraction_expected:ratio(eligibleCount,states.length),truth_windows:events.length,eligible_truth_windows:eventEligible.length,event_coverage:ratio(eventEligible.length,events.length),event_recall_all:ratio(tp,events.length),event_recall_given_eligible:ratio(tp,eventEligible.length),missed_while_eligible:eventEligible.length-tp,event_windows_without_eligible_evidence:events.length-eventEligible.length,states,limitation:'Coverage is conditional on supplied expected slots and cell/time alignment. It is not inferred from received packets, and is not a clinical abstention guarantee.'};
}
