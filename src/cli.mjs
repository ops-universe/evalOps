#!/usr/bin/env node
import {readFile,stat} from 'node:fs/promises';
import {compare} from './regression.mjs';
import {readDataset} from './dataset.mjs';
import {buildEvidence,writeEvidence} from './evidence.mjs';
const usage='Usage: evalops validate DATASET | evalops run DATASET --min-pass-rate NUMBER [--out FILE] | evalops compare BASELINE CURRENT [--out FILE]';
async function main(args){
 if(args[0]==='--help'&&args.length===1){console.log(usage);return 0;}
 if(args[0]==='compare'){
  const [,base,current,flag,out]=args;
  if(!base||!current||!(args.length===3||(args.length===5&&flag==='--out'&&out)))throw new Error(usage);
  async function load(path){const s=await stat(path);if(!s.isFile()||s.size>5*1024*1024)throw new Error('Evidence must be a regular file at most 5 MiB');return JSON.parse(await readFile(path,'utf8'));}
  const report=compare(await load(base),await load(current));
  if(out)await writeEvidence(out,report);
  console.log(JSON.stringify(report,null,2));return report.gate==='pass'?0:1;
 }
 const [command,path,...options]=args;
 if(!path||path.startsWith('-')||!['validate','run'].includes(command))throw new Error(usage);
 if(command==='validate'){
  if(options.length)throw new Error(usage);
  const d=await readDataset(path);console.log(JSON.stringify({valid:true,schemaVersion:d.schemaVersion,cases:d.cases.length}));return 0;
 }
 const parsed=new Map();
 if(options.length%2)throw new Error(usage);
 for(let i=0;i<options.length;i+=2){
  const k=options[i],v=options[i+1];
  if(!['--min-pass-rate','--out'].includes(k)||parsed.has(k)||!v||v.startsWith('--'))throw new Error(usage);
  parsed.set(k,v);
 }
 const threshold=parsed.get('--min-pass-rate');
 if(typeof threshold!=='string'||! /^(?:0(?:\.\d+)?|1(?:\.0+)?)$/.test(threshold))throw new Error('Required --min-pass-rate must be between 0 and 1');
 const d=await readDataset(path),report=buildEvidence(d,Number(threshold));
 if(parsed.has('--out'))await writeEvidence(parsed.get('--out'),report);
 console.log(JSON.stringify(report,null,2));
 return report.gate==='pass'?0:1;
}
try{process.exitCode=await main(process.argv.slice(2));}catch(e){console.error('evalOps: '+(e.code||e.message));process.exitCode=2;}
