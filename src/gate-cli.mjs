import {realpath,writeFile} from 'node:fs/promises';
import {dirname,resolve,relative,isAbsolute,sep} from 'node:path';
import {loadLocalJson} from './local-json.mjs';
import {writeEvidence} from './evidence.mjs';
import {validateGateConfig,evaluateSuite,runGate,junitReport} from './gate.mjs';
function contained(root,path){
 if(typeof path!=='string'||isAbsolute(path)||path.split(/[\\/]/).includes('..'))throw new Error('Suite paths must be relative to configuration directory');
 const full=resolve(root,path),rel=relative(root,full);
 if(!rel||rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel))throw new Error('Suite path escapes configuration directory');
 return full;
}
export async function gateCommand(args){
 const [command,path,...rest]=args;
 if(!path||rest.length%2)throw new Error('Usage: gate CONFIG [--out FILE] [--junit FILE] | baseline-create CONFIG SUITE_ID');
 const baseline=command==='baseline-create';
 // Baseline creation has one explicit suite argument, handled separately below.
 if(baseline)throw new Error('Use baseline-create CONFIG --suite ID');
 const opts=new Map();
 for(let i=0;i<rest.length;i+=2){const [k,v]=rest.slice(i,i+2);if(!['--out','--junit'].includes(k)||opts.has(k)||!v||v.startsWith('-'))throw new Error('Invalid gate option');opts.set(k,v);}
 const file=await realpath(path),root=dirname(file),config=validateGateConfig(await loadLocalJson(file));
 const load=async p=>{const actual=await realpath(contained(root,p));contained(root,relative(root,actual));return loadLocalJson(actual);};
 const report=await runGate(config,load);
 if(opts.has('--out'))await writeEvidence(opts.get('--out'),report);
 if(opts.has('--junit'))await writeFile(opts.get('--junit'),junitReport(report),{flag:'wx',mode:0o600});
 console.log(JSON.stringify(report,null,2));return report.gate==='pass'?0:1;
}
export async function baselineCommand(args){
 const [,path,flag,suiteId]=args;
 if(args.length!==4||flag!=='--suite'||!path||!suiteId)throw new Error('Usage: baseline-create CONFIG --suite ID');
 const file=await realpath(path),root=dirname(file),config=validateGateConfig(await loadLocalJson(file)),s=config.suites.find(x=>x.id===suiteId);
 if(!s)throw new Error('Unknown suite');
 const input=await realpath(contained(root,s.dataset));contained(root,relative(root,input));
 const output=contained(root,s.baseline),parent=await realpath(dirname(output));
 if(parent!==root)contained(root,relative(root,parent));
 const report=evaluateSuite(s,await loadLocalJson(input));
 if(report.gate!=='pass')throw new Error('Cannot create failing baseline');
 await writeEvidence(resolve(parent,s.baseline.split(/[\\/]/).pop()),report);
 console.log(JSON.stringify({created:true,suite:s.id,datasetSha256:report.datasetSha256}));return 0;
}
