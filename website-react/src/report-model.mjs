const rate=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=1;
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(x);
const hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const names=['precision','recall','reciprocalRank','ndcg','contextRelevance','citationAccuracy','toolSelectionAccuracy','argumentAccuracy'];
export function readReport(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>5*1024*1024)throw new Error('Report exceeds 5 MiB');
 const r=JSON.parse(text);
 if(r?.kind==='evaluation-gate'){
  if(r.schemaVersion!==1||!Array.isArray(r.suites)||!r.suites.length||r.suites.length>50||new Set(r.suites.map(s=>s?.id)).size!==r.suites.length)throw new Error('Invalid gate report');
  const suites=r.suites.map(s=>{if(!id(s.id)||!['pass','fail'].includes(s.gate))throw new Error('Invalid suite');const current=normalize(s.current);if(s.kind!==current.kind||s.gate==='pass'&&current.gate!=='pass')throw new Error('Inconsistent suite');return {...current,id:s.id,gate:s.gate};});
  if(r.gate!==(suites.every(s=>s.gate==='pass')?'pass':'fail'))throw new Error('Inconsistent gate');
  return {kind:'evaluation-gate',suites};
 }
 return {kind:'single',suites:[{...normalize(r),id:'evaluation'}]};
}
function normalize(r){
 const kind=r?.kind??'deterministic';
 if(!r||r.schemaVersion!==1||r.evidenceVersion!==1||r.evaluatorVersion!=='0.1.0'||!['deterministic','rag','agent'].includes(kind)||typeof r.synthetic!=='boolean'||!hash(r.suiteSha256)||!hash(r.datasetSha256)||!Array.isArray(r.results)||!r.results.length||r.results.length>10000)throw new Error('Invalid evaluation report');
 const required=kind==='rag'?names.slice(0,6):kind==='agent'?names.slice(6):[];
 const seen=new Set(),cases=r.results.map(c=>{
  if(!c||!id(c.id)||seen.has(c.id)||typeof c.passed!=='boolean'||!required.every(k=>rate(c[k])))throw new Error('Invalid case');
  seen.add(c.id);
  const metrics=Object.fromEntries(required.map(k=>[k,c[k]]));
  if(kind==='deterministic'){if(!['exact','contains','normalized-exact','json-equal'].includes(c.metric))throw new Error('Invalid metric');metrics[c.metric]=Number(c.passed);}
  const details=[];
  if(kind==='agent'){
   if(typeof c.sequenceExact!=='boolean'||typeof c.taskCompletion!=='boolean'||!Array.isArray(c.unauthorized)||c.unauthorized.length>1000||!c.unauthorized.every(u=>u&&id(u.tool)&&Number.isInteger(u.index)&&u.index>=0))throw new Error('Invalid agent details');
   details.push('Sequence: '+(c.sequenceExact?'match':'mismatch'),'Completion: '+(c.taskCompletion?'match':'mismatch'),...c.unauthorized.map(u=>'Unauthorized tool: '+u.tool+' at '+u.index));
   if(c.passed!==(c.sequenceExact&&c.taskCompletion&&c.argumentAccuracy===1&&!c.unauthorized.length))throw new Error('Inconsistent agent result');
  }
  if(kind==='rag'){
   if(!Array.isArray(c.results)||!c.results.length||c.results.length>1000||!c.results.every(x=>x&&id(x.documentId)&&typeof x.verified==='boolean'))throw new Error('Invalid citations');
   if(c.citationAccuracy!==c.results.filter(x=>x.verified).length/c.results.length||!rate(r.minRecall)||!rate(r.minCitationAccuracy)||c.passed!==(c.recall>=r.minRecall&&c.citationAccuracy>=r.minCitationAccuracy))throw new Error('Inconsistent RAG result');
   details.push(...c.results.filter(x=>!x.verified).map(x=>'Unverified citation: '+x.documentId));
  }
  return {id:c.id,passed:c.passed,metrics,details};
 });
 const passed=cases.filter(c=>c.passed).length;
 const threshold=kind==='deterministic'?r.minPassRate:1;
 if(!rate(threshold)||r.total!==cases.length||r.passed!==passed||r.gate!==(passed/cases.length>=threshold?'pass':'fail'))throw new Error('Inconsistent report totals');
 const averages={};
 for(const k of new Set(cases.flatMap(c=>Object.keys(c.metrics)))){const values=cases.filter(c=>Object.hasOwn(c.metrics,k)).map(c=>c.metrics[k]);averages[k]=values.reduce((a,b)=>a+b,0)/values.length;}
 return {kind,synthetic:r.synthetic,suiteSha256:r.suiteSha256,datasetSha256:r.datasetSha256,gate:r.gate,total:cases.length,passed,cases,averages};
}
export function compareViews(current,baseline){
 if(!current||!baseline||current.kind!==baseline.kind||current.synthetic!==baseline.synthetic||current.suiteSha256!==baseline.suiteSha256||current.total!==baseline.total)throw new Error('Incompatible baseline suite');
 const old=new Map(baseline.cases.map(c=>[c.id,c]));
 return current.cases.map(c=>{const b=old.get(c.id);if(!b||Object.keys(c.metrics).some(k=>!Object.hasOwn(b.metrics,k)))throw new Error('Incompatible case metrics');return {id:c.id,regressed:b.passed&&!c.passed,deltas:Object.fromEntries(Object.keys(c.metrics).map(k=>[k,c.metrics[k]-b.metrics[k]]))};});
}
