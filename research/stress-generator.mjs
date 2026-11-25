// Deliberately independent of dist/core.mjs and its simulator/PRNG.
export const STRESS_CASES=['nonlinear-null','lagged-workload','shared-event','correlated-drift','dropout-event'];
export function stressRecording({scenario='shared-event',seed=1001}={}){
  if(!STRESS_CASES.includes(scenario)||!Number.isSafeInteger(seed)||seed<1||seed>0xffffffff)throw Error('Invalid stress fixture configuration');
  let state=seed>>>0;
  const uniform=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return ((state>>>0)+.5)/4294967296;};
  const normal=()=>Math.sqrt(-2*Math.log(uniform()))*Math.cos(2*Math.PI*uniform());
  const samples=[],latent=[];const noise=Array(12).fill(0),response=Array(12).fill(0),eventResponse=Array(12).fill(0);
  for(let f=0;f<180;f++)for(let d=0;d<12;d++){
    const t=f*5,group=d%3,device=`S${String(d+1).padStart(3,'0')}`;
    let activity=.48+.25*Math.sin(t/23+d*.7)+.08*Math.sin(t/7+d);
    if(scenario==='lagged-workload'&&t>=300&&t<450)activity=.85;
    if(scenario==='lagged-workload'&&t>=450&&t<570)activity=.18;
    activity=Math.max(.05,Math.min(.95,activity));
    const target=18*activity+38*activity*activity;
    if(f===0)response[d]=target; // Avoid an artificial all-device startup transient in the baseline.
    response[d]+= (target-response[d])*(1-Math.exp(-5/(18+d%4*4)));
    noise[d]=.8*noise[d]+normal()*1.1;
    const physical=['shared-event','dropout-event'].includes(scenario)&&group===0&&t>=300&&t<480;
    eventResponse[d]+=((physical?20:0)-eventResponse[d])*(1-Math.exp(-5/(20+d%4*5)));
    const drift=scenario==='correlated-drift'&&t>=300&&t<480?18:0;
    const row={device,seq:f,t_s:t,x_m:group*100+10+(d%4)*4,y_m:10+Math.floor(d/3)*5,hr_bpm:68+d%5+response[d]+noise[d]+eventResponse[d]+drift,activity,ambient_c:23+(physical?4:0)+normal()*.15,quality:.95};
    // Ground truth is constructed before packet loss, never from detector output.
    latent.push({device,t_s:t,cell:[group*2,0],physical_signal:eventResponse[d]>=8});
    if(scenario==='dropout-event'&&group===0&&t>=300&&t<540&&uniform()<.65)continue;
    samples.push(row);
  }
  return {schema:'canopy/1',name:`Independent stress: ${scenario}, seed ${seed}`,provenance:{kind:'synthetic',generator:'independent-stress/1',scenario,seed,assumptions:{nonlinear_activity:'18u + 38u²',workload_time_constant_s:'18–30',event_time_constant_s:'20–35',noise:'AR(1), coefficient 0.8, Gaussian innovations SD 1.1 bpm',sample_interval_s:5},latent},samples};
}

export function physicalWindowTruth(dataset){
  const groups=new Map();
  for(const r of dataset.provenance.latent){if(r.t_s<120)continue;const start=120+Math.floor((r.t_s-120)/30)*30,key=`${start}:${r.cell.join(',')}`;
    if(!groups.has(key))groups.set(key,{start_s:start,cell:r.cell,devices:new Map()});const g=groups.get(key);if(!g.devices.has(r.device))g.devices.set(r.device,[]);g.devices.get(r.device).push(r.physical_signal);
  }
  return [...groups.values()].filter(g=>{const v=[...g.devices.values()];return v.filter(rs=>rs.filter(Boolean).length/rs.length>=.5).length/v.length>=.6;}).map(g=>({start_s:g.start_s,cell:g.cell}));
}
