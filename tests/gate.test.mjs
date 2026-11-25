import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {validateGateConfig,runGate,evaluateSuite,junitReport} from '../src/gate.mjs';
const config=JSON.parse(await readFile('evalops.config.json','utf8'));
const data=new Map();
for(const s of config.suites){const d=JSON.parse(await readFile(s.dataset,'utf8'));data.set(s.dataset,d);data.set(s.baseline,evaluateSuite(s,d));}
test('all evaluator types pass and report JUnit',async()=>{const r=await runGate(config,p=>data.get(p));assert.equal(r.gate,'pass');assert.match(junitReport(r),/tests="3" failures="0"/);});
test('agent unauthorized call fails gate',async()=>{const d=new Map(data),s=config.suites[2],fixture=structuredClone(d.get(s.dataset));fixture.cases[0].actual.push({tool:'write',args:{}});d.set(s.dataset,fixture);const r=await runGate(config,p=>d.get(p));assert.equal(r.gate,'fail');assert.match(junitReport(r),/failures="1"/);});
test('bad config and incompatible baseline rejected',async()=>{assert.throws(()=>validateGateConfig({...config,suites:[config.suites[0],config.suites[0]]}));const d=new Map(data);d.set(config.suites[2].baseline,{...d.get(config.suites[2].baseline),suiteSha256:'x'});await assert.rejects(runGate(config,p=>d.get(p)));});
test('CLI baseline creation, no overwrite, gate report and traversal rejection',async()=>{const dir=await mkdtemp(join(tmpdir(),'evalops-gate-'));try{await mkdir(join(dir,'datasets'));await mkdir(join(dir,'baselines'));const cfg=join(dir,'config.json');const c={schemaVersion:1,suites:[config.suites[2]]};await writeFile(cfg,JSON.stringify(c));await writeFile(join(dir,c.suites[0].dataset),JSON.stringify(data.get(c.suites[0].dataset)));const run=(...args)=>spawnSync(process.execPath,['src/cli.mjs',...args],{encoding:'utf8'});assert.equal(run('baseline-create',cfg,'--suite','agent').status,0);assert.equal(run('baseline-create',cfg,'--suite','agent').status,2);assert.equal(run('gate',cfg,'--out',join(dir,'report.json'),'--junit',join(dir,'junit.xml')).status,0);c.suites[0]={...c.suites[0],dataset:'../escape.json'};await writeFile(cfg,JSON.stringify(c));assert.equal(run('gate',cfg).status,2);}finally{await rm(dir,{recursive:true,force:true});}});
