export const VERSION = '0.2.0';
export const DEFAULTS = Object.freeze({baseline_s:120, window_s:30, cell_m:50, z_threshold:3, quorum:0.6, min_peers:3, quality_min:0.7});
export const mean = a => a.reduce((s,x)=>s+x,0)/a.length;
export function median(a){if(!a.length)return 0;const s=[...a].sort((a,b)=>a-b),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;}
const finite = x => typeof x==='number' && Number.isFinite(x);
function options(input={}){
  const o={...DEFAULTS,...input};
  for(const k of Object.keys(input))if(!(k in DEFAULTS))throw Error(`Unknown setting: ${k}`);
  for(const [k,v] of Object.entries(o))if(!finite(v))throw Error(`Invalid setting: ${k}`);
  if(o.baseline_s<30||o.baseline_s>3600||o.window_s<5||o.window_s>300||o.cell_m<5||o.cell_m>1000||o.z_threshold<1||o.z_threshold>10||o.quorum<0.5||o.quorum>1||!Number.isInteger(o.min_peers)||o.min_peers<3||o.min_peers>100||o.quality_min<0||o.quality_min>1)throw Error('Settings outside supported bounds');
  return o;
}
export function validateDataset(input){
  if(!input||input.schema!=='canopy/1'||!Array.isArray(input.samples)||!input.samples.length||input.samples.length>500000)throw Error('Expected canopy/1 with 1–500,000 samples');
  const rows=[],seen=new Map(),devices=new Set();let duplicates=0,out_of_order=0;const last=new Map();
  for(let i=0;i<input.samples.length;i++){
    const r=input.samples[i];
    if(!r||typeof r.device!=='string'||!/^[-\w]{1,40}$/.test(r.device))throw Error(`Sample ${i}: invalid device`);
    for(const k of ['seq','t_s','x_m','y_m','hr_bpm','activity','ambient_c','quality'])if(!finite(r[k]))throw Error(`Sample ${i}: ${k} must be finite`);
    if(!Number.isSafeInteger(r.seq)||r.seq<0||r.t_s<0||r.t_s>1e9||Math.abs(r.x_m)>1e6||Math.abs(r.y_m)>1e6||r.hr_bpm<20||r.hr_bpm>260||r.activity<0||r.activity>1||r.quality<0||r.quality>1||r.ambient_c< -50||r.ambient_c>80)throw Error(`Sample ${i}: value outside schema bounds`);
    const clean=Object.fromEntries(['device','seq','t_s','x_m','y_m','hr_bpm','activity','ambient_c','quality'].map(k=>[k,r[k]]));
    const key=`${r.device}:${r.seq}`,signature=JSON.stringify(clean);
    if(seen.has(key)){if(seen.get(key)!==signature)throw Error(`Conflicting packet ${key}`);duplicates++;continue;}
    seen.set(key,signature);devices.add(r.device);
    if(r.seq<(last.get(r.device)??-1))out_of_order++;last.set(r.device,r.seq);rows.push(clean);
  }
  if(devices.size>1000)throw Error('At most 1,000 devices supported per capsule');
  rows.sort((a,b)=>a.t_s-b.t_s||a.device.localeCompare(b.device)||a.seq-b.seq);
  const per=new Map();for(const r of rows){if(!per.has(r.device))per.set(r.device,[]);per.get(r.device).push(r);}
  let missing_packets=0;
  for(const [id,list] of per){list.sort((a,b)=>a.seq-b.seq);for(let i=1;i<list.length;i++){if(list[i].t_s<list[i-1].t_s)throw Error(`Clock reset for ${id}: split into separate sessions`);missing_packets+=list[i].seq-list[i-1].seq-1;}}
  return {rows,quality:{devices:devices.size,accepted:rows.length,duplicates,out_of_order,missing_packets}};
}
function fit(rows){
  const x=mean(rows.map(r=>r.activity)),y=mean(rows.map(r=>r.hr_bpm));let xx=0,xy=0;
  for(const r of rows){xx+=(r.activity-x)**2;xy+=(r.activity-x)*(r.hr_bpm-y);}
  const slope=xx>1e-8?xy/xx:0,intercept=y-slope*x;
  const residuals=rows.map(r=>r.hr_bpm-intercept-slope*r.activity),center=median(residuals),scale=Math.max(3,1.4826*median(residuals.map(r=>Math.abs(r-center))));
  let min_activity=Infinity,max_activity=-Infinity;for(const r of rows){min_activity=Math.min(min_activity,r.activity);max_activity=Math.max(max_activity,r.activity);}
  return {intercept:intercept+center,slope,scale,ambient_c:mean(rows.map(r=>r.ambient_c)),min_activity,max_activity,samples:rows.length};
}
export function analyze(input, settings={}){
  const o=options(settings),{rows,quality}=validateDataset(input),start=rows[0].t_s,baseline_end=start+o.baseline_s;
  const training=new Map();for(const r of rows)if(r.t_s<baseline_end&&r.quality>=o.quality_min){if(!training.has(r.device))training.set(r.device,[]);training.get(r.device).push(r);}
  const models=Object.create(null),excluded=[];const ids=new Set(rows.map(r=>r.device));
  for(const id of ids){const t=training.get(id)??[];if(t.length<12||t.at(-1).t_s-t[0].t_s<o.baseline_s*0.6){excluded.push(id);continue;}models[id]=fit(t);}
  const buckets=new Map();let low_quality=0,extrapolated=0;
  for(const r of rows){if(r.t_s<baseline_end)continue;if(r.quality<o.quality_min){low_quality++;continue;}const m=models[r.device];if(!m)continue;
    const unsupported=r.activity<m.min_activity-0.05||r.activity>m.max_activity+0.05;
    if(unsupported)extrapolated++;
    const w=Math.floor((r.t_s-baseline_end)/o.window_s),cx=Math.floor(r.x_m/o.cell_m),cy=Math.floor(r.y_m/o.cell_m),key=`${w}:${cx}:${cy}`;
    if(!buckets.has(key))buckets.set(key,{window:w,cell:[cx,cy],peers:new Map()});const b=buckets.get(key);
    if(!b.peers.has(r.device))b.peers.set(r.device,[]);
    b.peers.get(r.device).push({z:(r.hr_bpm-m.intercept-m.slope*r.activity)/m.scale,ambient:r.ambient_c-m.ambient_c,unsupported});
  }
  const windows=[],individual=[];
  for(const b of buckets.values()){
    const peers=[...b.peers].map(([device,rs])=>({device,z:median(rs.map(r=>r.z)),ambient_delta_c:median(rs.map(r=>r.ambient)),samples:rs.length,eligible:rs.length>=2&&!rs.some(r=>r.unsupported)}));
    const eligible=peers.filter(p=>p.eligible),votes=eligible.filter(p=>p.z>=o.z_threshold),n=eligible.length,k=votes.length;
    const detected=n>=o.min_peers&&k/n>=o.quorum;
    const leave_one_out=eligible.map(p=>({removed:p.device,detected:n-1>=o.min_peers&&(k-(p.z>=o.z_threshold?1:0))/(n-1)>=o.quorum}));
    const robust=detected&&leave_one_out.every(t=>t.detected);
    const entry={start_s:baseline_end+b.window*o.window_s,end_s:baseline_end+(b.window+1)*o.window_s,cell:b.cell,eligible:n,votes:k,detected,robust,ambient_delta_c:n?median(eligible.map(p=>p.ambient_delta_c)):null,peers,leave_one_out};
    windows.push(entry);
    if(!detected)for(const p of votes)individual.push({device:p.device,start_s:entry.start_s,cell:b.cell,z:p.z});
  }
  windows.sort((a,b)=>a.start_s-b.start_s||a.cell[0]-b.cell[0]||a.cell[1]-b.cell[1]);
  return {schema:'canopy-report/1',engine:VERSION,settings:o,baseline:{start_s:start,end_s:baseline_end,models,excluded},quality:{...quality,low_quality,extrapolated},windows,individual,summary:{shared_windows:windows.filter(w=>w.detected).length,robust_windows:windows.filter(w=>w.robust).length,individual_flags:individual.length},limitations:['Association is not causation. Shared device drift or a confounder can imitate an environmental event.','Baseline must represent normal activity. Out-of-range activity is excluded from voting.','Cells and time bins are fixed; boundary effects and missing data can hide events.','No medical diagnosis, core-temperature estimate, readiness score, or validated health threshold.']};
}
export const SCENARIOS=['shared','workload','sensor','dropout','drift','boundary','null'];
export function simulate({scenario='shared',seed=7,devices=12,frames=120,dt_s=5}={}){
  if(!SCENARIOS.includes(scenario)||!Number.isSafeInteger(seed)||!Number.isInteger(devices)||devices<4||devices>1000||!Number.isInteger(frames)||frames<60||frames>2000||devices*frames>500000||!finite(dt_s)||dt_s<1||dt_s>10)throw Error('Invalid simulation configuration');
  let state=seed>>>0;const rand=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
  const samples=[],truth=[];const onset=Math.max(180,Math.ceil(frames*dt_s*0.45/30)*30),end=Math.min(frames*dt_s,onset+180);
  for(let f=0;f<frames;f++)for(let d=0;d<devices;d++){
    const t=f*dt_s,event=t>=onset&&t<end,group=d%3,activity=0.48+0.3*Math.sin(f*0.18+d*0.6),noise=(rand()+rand()+rand()-1.5)*2.8;
    let a=activity,delta=0,ambient=23+(rand()-0.5)*0.8,quality=0.96,x=group*75+15+(d%4)*4,y=15+(d%3)*5;
    if(scenario==='workload'&&event)a=Math.min(0.77,activity+0.25);
    if(scenario==='shared'&&event&&group===0){delta=19;ambient+=5;}
    if(scenario==='sensor'&&event&&d===0)delta=25;
    if(scenario==='drift'&&event){delta=19;} // Deliberate identifiability counterexample.
    if(scenario==='boundary'&&event&&group===0){delta=19;ambient+=5;x=d%2?49:51;}
    if(scenario==='dropout'&&event&&group===0&&f%4!==0)continue;
    if(scenario==='dropout'&&d===1&&event)quality=0.2;
    const hr_bpm=66+(d%7)*1.5+45*a+delta+noise;
    samples.push({device:`W${String(d+1).padStart(3,'0')}`,seq:f,t_s:t,x_m:x,y_m:y,hr_bpm,activity:a,ambient_c:ambient,quality});
  }
  if(scenario==='shared')for(let t=onset;t<end;t+=30)truth.push({start_s:t,cell:[0,0]});
  return {schema:'canopy/1',name:`${scenario} · seed ${seed}`,provenance:{kind:'synthetic',scenario,seed,devices,frames,dt_s,truth},samples};
}
export function evaluate(report,truth){
  const actual=new Set(truth.map(t=>`${t.start_s}:${t.cell.join(',')}`)),pred=new Set(report.windows.filter(w=>w.detected).map(w=>`${w.start_s}:${w.cell.join(',')}`));
  let tp=0;for(const k of pred)if(actual.has(k))tp++;const fp=pred.size-tp,fn=actual.size-tp;
  return {tp,fp,fn,precision:pred.size?tp/pred.size:null,recall:actual.size?tp/actual.size:null};
}
