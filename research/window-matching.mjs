// Research-only cell/window matching. This does not group windows into episodes.
// Each flag and truth window participates in at most one maximum-cardinality match.
const ratio=(a,b)=>b?a/b:null;
function validate(xs,name){
  if(!Array.isArray(xs)||xs.length>1000)throw Error(`${name} must contain at most 1000 windows`);
  const seen=new Set();
  return Array.from(xs,(w,index)=>{
    if(!w||!Number.isFinite(w.start_s)||!Array.isArray(w.cell)||w.cell.length!==2||!w.cell.every(Number.isSafeInteger))throw Error(`Invalid ${name} window`);
    const key=JSON.stringify([w.start_s,...w.cell]);if(seen.has(key))throw Error(`Duplicate ${name} window`);seen.add(key);
    return {start_s:w.start_s,cell:[...w.cell],index};
  }).sort((a,b)=>a.start_s-b.start_s||a.cell[0]-b.cell[0]||a.cell[1]-b.cell[1]);
}
export function matchWindows(detected,truth,{time_tolerance_s=0,space_tolerance_m=0,cell_m=50}={}){
  if(!Number.isFinite(time_tolerance_s)||time_tolerance_s<0||!Number.isFinite(space_tolerance_m)||space_tolerance_m<0||!Number.isFinite(cell_m)||cell_m<=0)throw Error('Invalid matching tolerances or cell size');
  const flags=validate(detected,'detected'),events=validate(truth,'truth');
  const adjacency=flags.map(d=>events.flatMap((t,i)=>Math.abs(d.start_s-t.start_s)<=time_tolerance_s&&Math.hypot(d.cell[0]-t.cell[0],d.cell[1]-t.cell[1])*cell_m<=space_tolerance_m?[i]:[]));
  const owner=new Int32Array(events.length).fill(-1);
  function assign(i,visited){for(const j of adjacency[i]){if(visited[j])continue;visited[j]=1;if(owner[j]===-1||assign(owner[j],visited)){owner[j]=i;return true;}}return false;}
  for(let i=0;i<flags.length;i++)assign(i,new Uint8Array(events.length));
  const matches=[];for(let j=0;j<owner.length;j++)if(owner[j]!==-1){const d=flags[owner[j]],t=events[j];matches.push({detected_index:d.index,truth_index:t.index,time_offset_s:d.start_s-t.start_s,cell_center_distance_m:Math.hypot(d.cell[0]-t.cell[0],d.cell[1]-t.cell[1])*cell_m});}
  matches.sort((a,b)=>a.detected_index-b.detected_index);
  const tp=matches.length,fp=flags.length-tp,fn=events.length-tp,precision=ratio(tp,flags.length),recall=ratio(tp,events.length);
  return {schema:'canopy-window-matching/1',settings:{time_tolerance_s,space_tolerance_m,cell_m},detected_windows:flags.length,truth_windows:events.length,tp,fp,fn,precision,recall,f1:precision===null||recall===null?null:precision+recall?2*precision*recall/(precision+recall):0,matches,limitation:'Maximum-cardinality one-to-one matching of supplied cell/windows. Ties are deterministic, not minimum-distance assignments. Spatial distance is between grid-cell centers, not physical event localization error. Tolerance is not detector improvement, episode recall, or causal/clinical validation.'};
}
