import {metrics} from './metrics.mjs';
function validate(r){
 if(!r||r.evidenceVersion!==1||r.schemaVersion!==1||r.evaluatorVersion!=='0.1.0'||typeof r.synthetic!=='boolean'||! /^[a-f0-9]{64}$/.test(r.suiteSha256||'')||! /^[a-f0-9]{64}$/.test(r.datasetSha256||'')||!Array.isArray(r.results)||!r.results.length||r.results.length>10000)throw new Error('Invalid comparison evidence');
 const map=new Map();
 for(const c of r.results){
  if(!c||typeof c.id!=='string'||! /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(c.id)||map.has(c.id)||!metrics.includes(c.metric)||typeof c.passed!=='boolean')throw new Error('Invalid evidence case');
  map.set(c.id,c);
 }
 const passed=r.results.filter(c=>c.passed).length;
 if(r.total!==map.size||r.passed!==passed||r.failed!==map.size-passed||r.passRate!==passed/map.size||typeof r.minPassRate!=='number'||!Number.isFinite(r.minPassRate)||r.minPassRate<0||r.minPassRate>1||r.gate!==(r.passRate>=r.minPassRate?'pass':'fail'))throw new Error('Inconsistent evidence totals');
 return map;
}
export function compare(baseline,current,{maxDrop=0,maxRegressions=0}={}){
 if(typeof maxDrop!=='number'||!Number.isFinite(maxDrop)||maxDrop<0||maxDrop>1||!Number.isInteger(maxRegressions)||maxRegressions<0)throw new Error('Invalid regression policy');
 const b=validate(baseline),c=validate(current);
 if(baseline.suiteSha256!==current.suiteSha256||baseline.synthetic!==current.synthetic||b.size!==c.size)throw new Error('Incompatible evaluation suites');
 const regressions=[],improvements=[];
 for(const [id,old] of b){const now=c.get(id);if(!now||old.metric!==now.metric)throw new Error('Incompatible evaluation cases');if(old.passed&&!now.passed)regressions.push(id);if(!old.passed&&now.passed)improvements.push(id);}
 const delta=(current.passed-baseline.passed)/b.size;
 return {schemaVersion:1,suiteSha256:current.suiteSha256,baselineDatasetSha256:baseline.datasetSha256,currentDatasetSha256:current.datasetSha256,baselinePassRate:baseline.passRate,currentPassRate:current.passRate,delta,regressions:regressions.sort(),improvements:improvements.sort(),maxDrop,maxRegressions,gate:delta>=-maxDrop&&regressions.length<=maxRegressions&&current.gate==='pass'?'pass':'fail'};
}
