import {spawnSync} from 'node:child_process';
import {mkdir,writeFile,rename} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {randomUUID} from 'node:crypto';

// A separate status file prevents old scientific reports from implying that a
// later failed invocation passed. An interrupted wrapper remains 'running'.
export async function trackedRun(command,args,{statusPath,timeout=600_000}={}){
  const id=randomUUID(),started_at=new Date().toISOString();
  const base={schema:'canopy-run-status/1',id,started_at,node:process.version,command,args};
  async function save(path,value){
    await mkdir(dirname(path),{recursive:true});
    const temporary=`${path}.${id}.tmp`;
    await writeFile(temporary,JSON.stringify(value,null,2)+'\n');
    await rename(temporary,path);
  }
  await save(statusPath,{...base,status:'running'});
  const result=spawnSync(command,args,{encoding:'utf8',timeout,maxBuffer:4*1024*1024});
  const passed=result.status===0&&!result.error&&!result.signal;
  const status={...base,status:passed?'passed':'failed',finished_at:new Date().toISOString(),exit_code:result.status,signal:result.signal??null,error:result.error?{code:result.error.code??null,message:result.error.message}:null,stdout:result.stdout??'',stderr:result.stderr??'',limitation:'Synthetic pipeline execution status only. Scientific reports from earlier runs may remain after a failure. Output capture is limited to 4 MiB per stream; overflow fails the run.'};
  // Keep each failed invocation even when the next run succeeds.
  if(!passed)await save(join(dirname(statusPath),'pipeline-failures',`${id}.json`),status);
  await save(statusPath,status);
  return status;
}
