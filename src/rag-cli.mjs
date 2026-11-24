import {open} from 'node:fs/promises';
import {evaluateRag} from './rag.mjs';
import {compareRag} from './rag-regression.mjs';
import {writeEvidence} from './evidence.mjs';
async function load(path){
 if(!path||path.startsWith('-'))throw new Error('Missing input path');
 const f=await open(path,'r');
 try{const s=await f.stat();const limit=5*1024*1024;if(!s.isFile()||s.size>limit)throw new Error('Input must be a regular file at most 5 MiB');const buffer=Buffer.alloc(limit+1);let n=0;while(n<buffer.length){const {bytesRead}=await f.read(buffer,n,buffer.length-n,null);if(!bytesRead)break;n+=bytesRead;}if(n>limit)throw new Error('Input too large');return JSON.parse(buffer.subarray(0,n).toString('utf8'));}finally{await f.close();}
}
export async function ragCommand(args){
 const [command,path,...rest]=args;
 const comparison=command==='rag-compare',current=comparison?rest.shift():null;
 const allowed=comparison?['--max-drop','--out']:['--k','--min-recall','--min-citation-accuracy','--out'];
 const opts=new Map();
 if(rest.length%2)throw new Error('Missing option value');
 for(let i=0;i<rest.length;i+=2){const [key,value]=rest.slice(i,i+2);if(!allowed.includes(key)||opts.has(key)||!value||value.startsWith('-'))throw new Error('Invalid option');opts.set(key,value);}
 const number=(key,fallback,integer=false)=>{if(!opts.has(key))return fallback;const s=opts.get(key);if(!(integer?/^[1-9][0-9]*$/:/^(?:0(?:\.\d+)?|1(?:\.0+)?)$/).test(s))throw new Error('Invalid numeric option');return Number(s);};
 const report=comparison?compareRag(await load(path),await load(current),{maxDrop:number('--max-drop',0)}):evaluateRag(await load(path),{k:number('--k',5,true),minRecall:number('--min-recall',1),minCitationAccuracy:number('--min-citation-accuracy',1)});
 if(opts.has('--out'))await writeEvidence(opts.get('--out'),report);
 console.log(JSON.stringify(report,null,2));return report.gate==='pass'?0:1;
}
