import {open} from 'node:fs/promises';
import {constants} from 'node:fs';
export async function loadLocalJson(path){
 if(!path||path.startsWith('-'))throw new Error('Missing input path');
 const f=await open(path,constants.O_RDONLY|constants.O_NONBLOCK);
 try{const s=await f.stat();const limit=5*1024*1024;if(!s.isFile()||s.size>limit)throw new Error('Input must be a regular file at most 5 MiB');const buffer=Buffer.alloc(limit+1);let n=0;while(n<buffer.length){const {bytesRead}=await f.read(buffer,n,buffer.length-n,null);if(!bytesRead)break;n+=bytesRead;}if(n>limit)throw new Error('Input too large');return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buffer.subarray(0,n)));}finally{await f.close();}
}
