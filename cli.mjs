#!/usr/bin/env node
import {readFile,writeFile,stat} from 'node:fs/promises';
import {analyze,simulate} from './dist/core.mjs';
const [cmd,arg,...args]=process.argv.slice(2);
const value=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
try{
  let result;
  if(cmd==='simulate')result=simulate({scenario:arg??'shared',seed:Number(value('--seed',7)),devices:Number(value('--devices',12))});
  else if(cmd==='analyze'&&arg){if((await stat(arg)).size>100*1024*1024)throw Error('Input exceeds 100 MiB');const parsed=JSON.parse(await readFile(arg,'utf8'));result=parsed.schema==='canopy-capsule/1'?analyze(parsed.dataset,parsed.settings??{}):analyze(parsed);}
  else throw Error('Usage: node cli.mjs simulate shared [--seed 7] [--devices 12] [--out data.json]\n       node cli.mjs analyze data.json [--out report.json]');
  const out=value('--out',null),json=JSON.stringify(result,null,2)+'\n';if(out)await writeFile(out,json);else process.stdout.write(json);
}catch(e){console.error(e.message);process.exitCode=1;}
