import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,mkdir,writeFile,copyFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {spawnSync} from 'node:child_process';
test('release package excludes local diagnostics and hidden files while retaining reproducible evidence',async t=>{
 const root=await mkdtemp(join(tmpdir(),'canopy-package-'));t.after(()=>rm(root,{recursive:true,force:true}));
 for(const dir of ['scripts','dist','docs/pipeline-failures','tests','research'])await mkdir(join(root,dir),{recursive:true});
 for(const name of ['package.json','server.mjs','cli.mjs','README.md','DEVELOPMENT.md','LICENSE','dist/index.html','docs/benchmark-full.json','docs/pipeline-status.json','docs/pipeline-failures/local.json','research/.env.local'])await writeFile(join(root,name),'fixture');
 await copyFile(new URL('../scripts/package.py',import.meta.url),join(root,'scripts/package.py'));
 const run=spawnSync('python3',[join(root,'scripts/package.py')],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);
 const listing=spawnSync('python3',['-c','import json,sys,zipfile;print(json.dumps(zipfile.ZipFile(sys.argv[1]).namelist()))',join(root,'dist/downloads/canopy-local.zip')],{encoding:'utf8'});assert.equal(listing.status,0,listing.stderr);const names=JSON.parse(listing.stdout);
 assert(names.includes('canopy/docs/benchmark-full.json'));assert(names.includes('canopy/dist/index.html'));assert(!names.includes('canopy/docs/pipeline-status.json'));assert(!names.some(n=>n.includes('pipeline-failures')));assert(!names.some(n=>n.includes('.env')));
});
