"""Exploratory comparisons on synthetic point anomalies, not group-event rankings."""
from pathlib import Path
import subprocess, json, time, importlib.metadata, platform
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM
from pyod.models.ecod import ECOD
from river.anomaly import HalfSpaceTrees
import ruptures as rpt

root=Path(__file__).resolve().parents[1]
js="""import {simulate,analyze} from './dist/core.mjs';
const out=[];for(const scenario of ['shared','workload','sensor','null','drift'])for(const seed of [201,202,203]){const d=simulate({scenario,seed});out.push({dataset:d,models:analyze(d).baseline.models});}console.log(JSON.stringify(out));"""
fixtures=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=root))
results=[];breakpoints=[]
for f in fixtures:
    d=f['dataset'];rows=d['samples'];scenario=d['provenance']['scenario'];seed=d['provenance']['seed']
    z=np.array([(r['hr_bpm']-f['models'][r['device']]['intercept']-f['models'][r['device']]['slope']*r['activity'])/f['models'][r['device']]['scale'] for r in rows])
    X=np.array([[v,r['activity']] for v,r in zip(z,rows)])
    baseline=np.array([r['t_s']<120 for r in rows]);test=~baseline
    # This controlled generator has an injected offset at 270 <= t < 450.
    truth=np.array([270<=r['t_s']<450 and (scenario=='drift' or (scenario=='shared' and (int(r['device'][1:])-1)%3==0) or (scenario=='sensor' and r['device']=='W001')) for r in rows])
    methods=[('residual-threshold',None),('sklearn-IsolationForest',IsolationForest(n_estimators=100,contamination=.05,random_state=7,n_jobs=1)),('sklearn-OneClassSVM',OneClassSVM(nu=.05,gamma='scale')),('PyOD-ECOD',ECOD(contamination=.05))]
    for name,model in methods:
        started=time.perf_counter()
        if model is None:pred=z>=3
        elif name=='PyOD-ECOD':model.fit(X[baseline]);pred=model.predict(X).astype(bool)
        else:model.fit(X[baseline]);pred=model.predict(X)==-1
        tp=int(np.sum(pred&truth&test));fp=int(np.sum(pred&~truth&test));fn=int(np.sum(~pred&truth&test))
        results.append(dict(scenario=scenario,seed=seed,method=name,tp=tp,fp=fp,fn=fn,elapsed_ms=(time.perf_counter()-started)*1000))
    started=time.perf_counter();hst=HalfSpaceTrees(n_trees=10,height=4,window_size=64,seed=7)
    features=[{'residual':float(np.clip((v+10)/20,0,1)),'activity':r['activity']} for v,r in zip(z,rows)]
    for feature,is_base in zip(features,baseline):
        if is_base:hst.learn_one(feature)
    scores=np.array([hst.score_one(x) for x in features]);threshold=float(np.quantile(scores[baseline],.95));pred=scores>threshold
    results.append(dict(scenario=scenario,seed=seed,method='River-HalfSpaceTrees-frozen',tp=int(np.sum(pred&truth&test)),fp=int(np.sum(pred&~truth&test)),fn=int(np.sum(~pred&truth&test)),elapsed_ms=(time.perf_counter()-started)*1000,baseline_score_threshold=threshold))
    times=sorted(set(r['t_s'] for r in rows));aggregate=np.array([np.mean([v for v,r in zip(z,rows) if r['t_s']==t]) for t in times]).reshape(-1,1)
    indices=rpt.Binseg(model='l2',min_size=3,jump=1).fit(aggregate).predict(n_bkps=2)
    breakpoints.append(dict(scenario=scenario,seed=seed,method='ruptures-Binseg-offline',forced_internal_breakpoints=2,segment_end_s=[times[min(i,len(times)-1)] for i in indices[:-1]],warning='Uses the full future recording and a forced count of two; not an online or directly comparable detector.'))
output=dict(schema='canopy-stack-review/1',created_at=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),python=platform.python_version(),versions={k:importlib.metadata.version(k) for k in ['numpy','scikit-learn','pyod','river','ruptures']},recordings=len(fixtures),results=results,offline_segmentation=breakpoints,scope='Exploratory synthetic point-anomaly comparison, not a fair ranking of group-event detectors. Residual features reuse each device baseline. Thresholds use baseline training data, not an independent calibration set; this is optimistic. Bidirectional anomaly methods and the one-sided residual rule have different objectives. Generator is linear and simple. No tuning on test labels. No causal or clinical validity, real-device data, or external language-model consultation.')
(root/'docs/stack-comparison.json').write_text(json.dumps(output,indent=2)+'\n')
print(json.dumps({'recordings':len(fixtures),'point_detector_runs':len(results),'offline_segmentations':len(breakpoints),'versions':output['versions'],'output':'docs/stack-comparison.json'},indent=2))
