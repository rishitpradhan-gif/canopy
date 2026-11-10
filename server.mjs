import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {analyze} from './dist/core.mjs';
import {challenge} from './dist/evidence.mjs';
const root=new URL('./dist/',import.meta.url);
export function createServer(){return http.createServer(async(req,res)=>{
  const send=(code,body,type='application/json')=>{res.writeHead(code,{'Content-Type':type,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(body);};
  const host=req.headers.host,expected=`127.0.0.1:${res.socket.localPort}`;
  if(host!==expected)return send(403,JSON.stringify({error:'Use the printed 127.0.0.1 address'}));
  if(req.headers.origin&&req.headers.origin!==`http://${expected}`)return send(403,JSON.stringify({error:'Cross-origin requests rejected'}));
  try{
    const path=new URL(req.url,`http://${host}`).pathname;
    if(req.method==='POST'&&['/api/analyze','/api/challenge'].includes(path)){
      if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']??''))return send(415,'{"error":"Use application/json"}');
      const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>10*1024*1024){send(413,'{"error":"10 MiB API limit; use CLI for larger data"}');return;}chunks.push(c);}
      const body=JSON.parse(Buffer.concat(chunks).toString()),fn=path==='/api/challenge'?challenge:analyze;return send(200,JSON.stringify(fn(body.dataset??body,body.settings??{})));
    }
    if(req.method!=='GET')return send(405,'{"error":"Method not allowed"}');
    const allow={'/':'index.html','/index.html':'index.html','/app.mjs':'app.mjs','/worker.mjs':'worker.mjs','/core.mjs':'core.mjs','/evidence.mjs':'evidence.mjs','/style.css':'style.css','/challenge.css':'challenge.css','/downloads/canopy-local.zip':'downloads/canopy-local.zip'};
    if(!allow[path])return send(404,'{"error":"Not found"}');
    const f=allow[path],type=f.endsWith('.html')?'text/html; charset=utf-8':f.endsWith('.mjs')?'text/javascript':f.endsWith('.css')?'text/css':'application/zip';
    send(200,await readFile(new URL(f,root)),type);
  }catch(e){send(400,JSON.stringify({error:e.message}));}
});}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const port=Number(process.env.PORT??4435);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('PORT must be 1024–65535');
  const server=createServer();server.listen(port,'127.0.0.1',()=>console.log(`Canopy: http://127.0.0.1:${port}`));server.on('error',e=>{console.error(e.message);process.exitCode=1;});
}
