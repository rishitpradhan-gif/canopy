import {test} from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';import {createServer} from '../server.mjs';import {simulate} from '../dist/core.mjs';
test('local API analyzes the same capsule and enforces origin/type/host boundaries',async()=>{const s=createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${s.address().port}`;try{
  assert.equal((await fetch(url)).status,200);
  const response=await fetch(url+'/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(simulate())});assert.equal(response.status,200);assert.equal((await response.json()).summary.shared_windows,6);
  assert.equal((await fetch(url+'/api/analyze',{method:'POST',headers:{'Content-Type':'text/plain'},body:'{}'})).status,415);
  assert.equal((await fetch(url+'/api/analyze',{method:'POST',headers:{Origin:'https://example.com','Content-Type':'application/json'},body:'{}'})).status,403);
  const badHost=await new Promise((resolve,reject)=>{http.get(url,{headers:{Host:'example.com'}},r=>{r.resume();resolve(r.statusCode);}).on('error',reject);});assert.equal(badHost,403);
  assert.equal((await fetch(url+'/package.json')).status,404);
}finally{await new Promise(r=>s.close(r));}});
