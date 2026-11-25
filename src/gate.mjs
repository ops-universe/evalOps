import {buildEvidence} from './evidence.mjs';
import {evaluateRag} from './rag.mjs';
import {evaluateAgent} from './agent.mjs';
import {compare} from './regression.mjs';
import {compareRag} from './rag-regression.mjs';
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(x);
const rate=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=1;
const keys=(x,allowed)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).every(k=>allowed.includes(k));
export function validateGateConfig(config){
 if(!keys(config,['schemaVersion','suites'])||config.schemaVersion!==1||!Array.isArray(config.suites)||!config.suites.length||config.suites.length>50)throw new Error('Invalid gate configuration');
 const seen=new Set();
 for(const s of config.suites){
  if(!keys(s,['id','kind','dataset','baseline','policy'])||!id(s.id)||seen.has(s.id)||!['deterministic','rag','agent'].includes(s.kind)||typeof s.dataset!=='string'||!s.dataset.length||s.dataset.length>512||typeof s.baseline!=='string'||!s.baseline.length||s.baseline.length>512)throw new Error('Invalid gate suite');
  seen.add(s.id);
  const p=s.policy;
  if(s.kind==='deterministic'&&(!keys(p,['minPassRate','maxDrop','maxRegressions'])||!rate(p.minPassRate)||!rate(p.maxDrop)||!Number.isInteger(p.maxRegressions)||p.maxRegressions<0))throw new Error('Invalid deterministic policy');
  if(s.kind==='rag'&&(!keys(p,['k','minRecall','minCitationAccuracy','maxDrop'])||!Number.isInteger(p.k)||p.k<1||p.k>1000||![p.minRecall,p.minCitationAccuracy,p.maxDrop].every(rate)))throw new Error('Invalid RAG policy');
  if(s.kind==='agent'&&(!keys(p,[])||Object.keys(p).length))throw new Error('Agent policy must be empty; all cases must pass');
 }
 return config;
}
export function evaluateSuite(s,d){
 return s.kind==='deterministic'?buildEvidence(d,s.policy.minPassRate):s.kind==='rag'?evaluateRag(d,s.policy):evaluateAgent(d);
}
function agentComparison(b,c){
 if(!b||b.kind!=='agent'||b.schemaVersion!==1||b.evidenceVersion!==1||b.evaluatorVersion!==c.evaluatorVersion||b.suiteSha256!==c.suiteSha256||b.synthetic!==c.synthetic||typeof b.datasetSha256!=='string'||!/^[a-f0-9]{64}$/.test(b.datasetSha256)||!Array.isArray(b.results)||b.results.length!==c.results.length||b.total!==c.total||b.gate!=='pass'||b.passed!==b.total)throw new Error('Invalid or incompatible agent baseline');
 const map=new Map(b.results.map(x=>[x?.id,x]));
 if(map.size!==c.total||c.results.some(x=>{const old=map.get(x.id);return !old||old.passed!==true||old.sequenceExact!==true||old.taskCompletion!==true||old.toolSelectionAccuracy!==1||old.argumentAccuracy!==1||!Array.isArray(old.unauthorized)||old.unauthorized.length||!Array.isArray(old.expectedTools)||!Array.isArray(old.actualTools)||JSON.stringify(old.expectedTools)!==JSON.stringify(old.actualTools)||JSON.stringify(old.expectedTools)!==JSON.stringify(x.expectedTools);}))throw new Error('Invalid agent baseline cases');
 return {gate:c.gate,regressions:c.results.filter(x=>!x.passed).map(x=>x.id)};
}
export function compareSuite(s,b,c){
 if(b?.gate!=='pass')throw new Error('Baseline must have passed');
 if(s.kind==='deterministic'){if(b.minPassRate!==c.minPassRate)throw new Error('Baseline policy changed');return compare(b,c,s.policy);}
 return s.kind==='rag'?compareRag(b,c,s.policy):agentComparison(b,c);
}
export async function runGate(config,load){
 validateGateConfig(config);
 const suites=[];
 for(const s of config.suites){
  const current=evaluateSuite(s,await load(s.dataset));
  const comparison=compareSuite(s,await load(s.baseline),current);
  suites.push({id:s.id,kind:s.kind,gate:comparison.gate,current,comparison});
 }
 return {schemaVersion:1,kind:'evaluation-gate',gate:suites.every(s=>s.gate==='pass')?'pass':'fail',suites};
}
const xml=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[x]));
export function junitReport(report){
 const failures=report.suites.filter(s=>s.gate==='fail').length;
 return '<?xml version="1.0" encoding="UTF-8"?>\n<testsuite name="evalOps" tests="'+report.suites.length+'" failures="'+failures+'">'+report.suites.map(s=>'<testcase classname="evalOps" name="'+xml(s.id)+'">'+(s.gate==='fail'?'<failure message="Evaluation regression or absolute gate failed"/>':'')+'</testcase>').join('')+'</testsuite>\n';
}
