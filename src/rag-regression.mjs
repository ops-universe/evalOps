const metrics=['precision','recall','reciprocalRank','ndcg','contextRelevance','citationAccuracy'];
const rate=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=1;
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(x);
function validate(r){
 if(!r||r.kind!=='rag'||r.schemaVersion!==1||r.evidenceVersion!==1||r.evaluatorVersion!=='0.1.0'||typeof r.synthetic!=='boolean'||!Number.isInteger(r.k)||r.k<1||r.k>1000||!rate(r.minRecall)||!rate(r.minCitationAccuracy)||!Array.isArray(r.results)||!r.results.length||r.results.length>1000||![r.suiteSha256,r.datasetSha256].every(x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x)))throw new Error('Invalid RAG evidence');
 const map=new Map();
 for(const c of r.results){
  if(!c||!id(c.id)||map.has(c.id)||!metrics.every(m=>rate(c[m]))||!Array.isArray(c.results)||!c.results.length||c.results.length>1000||!c.results.every(x=>x&&id(x.documentId)&&typeof x.verified==='boolean')||c.citationAccuracy!==c.results.filter(x=>x.verified).length/c.results.length||c.passed!==(c.recall>=r.minRecall&&c.citationAccuracy>=r.minCitationAccuracy))throw new Error('Invalid RAG evidence case');
  map.set(c.id,c);
 }
 const passed=r.results.filter(c=>c.passed).length;
 if(r.total!==map.size||r.passed!==passed||r.gate!==(passed===map.size?'pass':'fail'))throw new Error('Inconsistent RAG evidence');
 return map;
}
export function compareRag(baseline,current,{maxDrop=0}={}){
 if(!rate(maxDrop))throw new Error('Invalid max drop');
 const b=validate(baseline),c=validate(current);
 if(baseline.suiteSha256!==current.suiteSha256||baseline.synthetic!==current.synthetic||baseline.k!==current.k||baseline.minRecall!==current.minRecall||baseline.minCitationAccuracy!==current.minCitationAccuracy||b.size!==c.size)throw new Error('Incompatible RAG suites');
 const regressions=[],deltas={};
 for(const m of metrics)deltas[m]=0;
 for(const [id,old] of b){const now=c.get(id);if(!now)throw new Error('Incompatible RAG cases');
  for(const m of metrics){const delta=now[m]-old[m];deltas[m]+=delta/b.size;if(delta < -maxDrop)regressions.push({id,metric:m,delta});}
  if(old.passed&&!now.passed)regressions.push({id,metric:'case-gate',delta:-1});
 }
 return {schemaVersion:1,kind:'rag-comparison',suiteSha256:current.suiteSha256,baselineDatasetSha256:baseline.datasetSha256,currentDatasetSha256:current.datasetSha256,maxDrop,meanDeltas:deltas,regressions,gate:current.gate==='pass'&&!regressions.length?'pass':'fail'};
}
