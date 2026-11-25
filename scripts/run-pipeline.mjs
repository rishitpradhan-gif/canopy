import {trackedRun} from './tracked-run.mjs';
const result=await trackedRun(process.execPath,['scripts/autopilot.mjs'],{statusPath:'docs/pipeline-status.json'});
process.stdout.write(result.stdout);process.stderr.write(result.stderr);
if(result.error)console.error(result.error.message);
process.exitCode=result.status==='passed'?0:1;
