import {analyze} from './core.mjs';
import {challenge} from './evidence.mjs';
self.onmessage=({data})=>{try{self.postMessage(data.action==='challenge'?{id:data.id,challenge:challenge(data.dataset,data.settings)}:{id:data.id,report:analyze(data.dataset,data.settings)});}catch(e){self.postMessage({id:data.id,error:e.message});}};
