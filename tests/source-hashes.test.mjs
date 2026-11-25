import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {sourceHashes} from '../scripts/source-hashes.mjs';
test('verification manifest hashes exact source bytes in stable path order',async t=>{
 const root=await mkdtemp(join(tmpdir(),'canopy-manifest-'));t.after(()=>rm(root,{recursive:true,force:true}));
 await writeFile(join(root,'a.mjs'),'assert(true);\n');await writeFile(join(root,'b.mjs'),'second\r\n');
 const before=await sourceHashes(['b.mjs','a.mjs','a.mjs'],{root});assert.deepEqual(Object.keys(before),['a.mjs','b.mjs']);assert.equal(before['a.mjs'],createHash('sha256').update('assert(true);\n').digest('hex'));
 await writeFile(join(root,'a.mjs'),'assert(false);\n');const after=await sourceHashes(['a.mjs','b.mjs'],{root});assert.notEqual(before['a.mjs'],after['a.mjs']);assert.equal(before['b.mjs'],after['b.mjs']);
 await assert.rejects(sourceHashes(['missing.mjs'],{root}),{code:'ENOENT'});
});
