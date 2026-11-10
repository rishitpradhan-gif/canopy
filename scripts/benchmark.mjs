import {performance} from 'node:perf_hooks';import os from 'node:os';import {mkdir,writeFile} from 'node:fs/promises';
import {analyze,simulate,evaluate,VERSION} from '../dist/core.mjs';
const full=process.argv.includes('--full'),seeds=full?100:20,results=[];
for(const scenario of ['shared','workload','sensor','null','dropout','boundary','drift']){
  let tp=0,fp=0,fn=0,flagged=0;const times=[];
  for(let seed=1;seed<=seeds;seed++){const d=simulate({scenario,seed}),t=performance.now(),r=analyze(d);times.push(performance.now()-t);const m=evaluate(r,d.provenance.truth);tp+=m.tp;fp+=m.fp;fn+=m.fn;flagged+=r.summary.shared_windows;}
  times.sort((a,b)=>a-b);results.push({scenario,seeds,tp:scenario==='boundary'?null:tp,fp:scenario==='boundary'?null:fp,fn:scenario==='boundary'?null:fn,flagged_windows:flagged,median_ms:times[Math.floor(times.length/2)],p95_ms:times[Math.min(times.length-1,Math.floor(times.length*.95))],interpretation:scenario==='drift'?'Adversarial confounder: expected false environmental attribution if shared changes are incorrectly treated as causal.':scenario==='boundary'?'Boundary stress: true injected changes are split across cells; no scored ground truth.':scenario==='dropout'?'Transport stress; no injected physiological event.':'Scored synthetic temporal-cell windows.'});
}
const scales=[];for(const devices of (full?[12,100,500,1000]:[12,100,500])){const d=simulate({devices,frames:full?500:120}),t=performance.now(),r=analyze(d);scales.push({devices,samples:d.samples.length,elapsed_ms:performance.now()-t,heap_used_mb:process.memoryUsage().heapUsed/1048576,shared_windows:r.summary.shared_windows});}
const out={engine:VERSION,created_at:new Date().toISOString(),node:process.version,platform:`${os.platform()} ${os.arch()}`,cpu:os.cpus()[0]?.model,full,results,scales,scope:'Single-process synthetic benchmark. Heap is process snapshot, not isolated peak. No physical-device, BLE, clinical, or distributed-ingestion validation.'};
await mkdir('docs',{recursive:true});await writeFile(`docs/benchmark${full?'-full':''}.json`,JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2));
