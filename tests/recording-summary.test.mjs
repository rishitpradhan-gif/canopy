import test from 'node:test';import assert from 'node:assert/strict';import {summarizeRecordings} from '../research/recording-summary.mjs';
test('macro recall gives each event recording equal weight while pooled recall weights windows',()=>{
 const r=summarizeRecordings([{seed:1,tp:1,fp:0,fn:0},{seed:2,tp:0,fp:2,fn:9},{seed:3,tp:0,fp:1,fn:0}]);
 assert.equal(r.pooled_window_recall,.1);assert.equal(r.macro_recording_recall,.5);assert.equal(r.event_recordings,2);assert.equal(r.no_event_recordings,1);assert.equal(r.recordings_with_false_flags,2);
 assert.deepEqual(r.false_flags_per_recording,{median:1,p95:2,max:2});assert.equal(r.worst_recordings[0].seed,2);
});
test('empty and no-event cohorts keep recall undefined; tails and rankings are deterministic',()=>{
 const empty=summarizeRecordings([]);assert.equal(empty.macro_recording_recall,null);assert.equal(empty.pooled_window_recall,null);assert.equal(empty.false_flags_per_recording.p95,null);
 const xs=Array.from({length:20},(_,i)=>({seed:i,tp:0,fp:i,fn:0}));const r=summarizeRecordings(xs);assert.deepEqual(r.false_flags_per_recording,{median:9,p95:18,max:19});assert.equal(r.macro_recording_recall,null);assert.deepEqual(r,summarizeRecordings([...xs].reverse()));assert.equal(r.worst_recordings.length,5);
 assert.deepEqual(summarizeRecordings([{seed:3,tp:0,fp:1,fn:2},{seed:1,tp:0,fp:1,fn:2},{seed:2,tp:0,fp:1,fn:3}]).worst_recordings.map(r=>r.seed),[2,1,3]);
});
test('malformed counts and duplicate seeds cannot silently distort recording diagnostics',()=>{
 for(const xs of [[{seed:1,tp:0,fp:-1,fn:0}],[{seed:1,tp:0,fp:NaN,fn:0}],Array(1),[{seed:1,tp:0,fp:0,fn:0},{seed:1,tp:1,fp:0,fn:0}]])assert.throws(()=>summarizeRecordings(xs),/Invalid/);
});
