import {analyze} from './core.mjs';
self.onmessage=({data})=>{try{self.postMessage({id:data.id,report:analyze(data.dataset,data.settings)});}catch(e){self.postMessage({id:data.id,error:e.message});}};
