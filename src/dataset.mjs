import {metrics} from './metrics.mjs';
import {open} from 'node:fs/promises';
export const limits=Object.freeze({fileBytes:5*1024*1024,cases:10000,text:100000,id:128});
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const keys=(v,allowed)=>Object.keys(v).every(k=>allowed.includes(k));
export function validateDataset(d){
 if(!record(d)||!keys(d,['schemaVersion','synthetic','cases'])||d.schemaVersion!==1||typeof d.synthetic!=='boolean'||!Array.isArray(d.cases)||d.cases.length<1||d.cases.length>limits.cases)throw new Error('Invalid version 1 dataset');
 const seen=new Set();
 for(const c of d.cases){
  if(!record(c)||!keys(c,['id','expected','actual','metric'])||typeof c.id!=='string'||! /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(c.id)||seen.has(c.id)||typeof c.expected!=='string'||!c.expected.length||c.expected.length>limits.text||typeof c.actual!=='string'||c.actual.length>limits.text||!metrics.includes(c.metric))throw new Error('Invalid or duplicate dataset case');
  seen.add(c.id);
 }
 return d;
}
export async function readDataset(path){
 const handle=await open(path,'r');
 try{
  const stat=await handle.stat();if(!stat.isFile()||stat.size>limits.fileBytes)throw new Error('Dataset must be a regular file of at most 5 MiB');
  const buffer=Buffer.alloc(limits.fileBytes+1);let size=0;
  while(size<buffer.length){const {bytesRead}=await handle.read(buffer,size,buffer.length-size,null);if(bytesRead===0)break;size+=bytesRead;}
  if(size>limits.fileBytes)throw new Error('Dataset exceeds 5 MiB');
  let value;try{value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buffer.subarray(0,size)));}catch{throw new Error('Dataset must be valid UTF-8 JSON');}
  return validateDataset(value);
 }finally{await handle.close();}
}
