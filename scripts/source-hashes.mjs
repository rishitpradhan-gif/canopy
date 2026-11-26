import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

// Preserve the exact verification sources, not just a boolean test outcome.
export async function sourceHashes(files,{root=process.cwd()}={}){
  const hashes={};
  for(const file of [...new Set(files)].sort()){
    hashes[file]=createHash('sha256').update(await readFile(resolve(root,file))).digest('hex');
  }
  return hashes;
}

// Detect persistent checkout drift across a run; this is not a signed snapshot.
export async function verifySourceHashes(expected,options){
  const current=await sourceHashes(Object.keys(expected),options);
  for(const file of Object.keys(expected)){
    if(current[file]!==expected[file])throw Error(`Source changed during evaluation: ${file}`);
  }
}
