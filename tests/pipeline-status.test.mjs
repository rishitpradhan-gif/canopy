import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {trackedRun} from '../scripts/tracked-run.mjs';
async function fixture(t){const dir=await mkdtemp(join(tmpdir(),'canopy-run-'));t.after(()=>rm(dir,{recursive:true,force:true}));return {dir,statusPath:join(dir,'status.json')};}
test('failed run replaces stale success and remains archived after recovery',async t=>{
 const {dir,statusPath}=await fixture(t);await writeFile(statusPath,JSON.stringify({status:'passed'}));
 const failed=await trackedRun(process.execPath,['-e',"console.error('deliberate regression');process.exit(7)"],{statusPath});
 assert.equal(failed.status,'failed');assert.equal(failed.exit_code,7);assert.match(failed.stderr,/deliberate regression/);
 assert.equal(JSON.parse(await readFile(statusPath)).id,failed.id);
 const passed=await trackedRun(process.execPath,['-e',"console.log('recovered')"],{statusPath});assert.equal(passed.status,'passed');
 assert.equal(JSON.parse(await readFile(statusPath)).id,passed.id);
 const files=await readdir(join(dir,'pipeline-failures'));assert.deepEqual(files,[`${failed.id}.json`]);
 assert.deepEqual(JSON.parse(await readFile(join(dir,'pipeline-failures',files[0]))),failed);
});
test('launch failure is recorded without treating missing output as success',async t=>{
 const {dir,statusPath}=await fixture(t);const result=await trackedRun(join(dir,'missing-executable'),[],{statusPath});
 assert.equal(result.status,'failed');assert.equal(result.error.code,'ENOENT');assert.equal(result.exit_code,null);
});
test('timeout fails and preserves execution error',async t=>{
 const {statusPath}=await fixture(t);const result=await trackedRun(process.execPath,['-e','setInterval(()=>{},1000)'],{statusPath,timeout:100});
 assert.equal(result.status,'failed');assert.equal(result.error.code,'ETIMEDOUT');assert.equal(result.signal,'SIGTERM');
});
test('running status is persisted before starting the evaluated process',async t=>{
 const {statusPath}=await fixture(t);
 const result=await trackedRun(process.execPath,['-e',`const s=JSON.parse(require('fs').readFileSync(process.argv[1]));if(s.status!=='running')process.exit(9);`,statusPath],{statusPath});
 assert.equal(result.status,'passed');
});
