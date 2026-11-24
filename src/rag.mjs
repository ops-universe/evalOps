import {createHash} from 'node:crypto';
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(x);
const ids=x=>Array.isArray(x)&&x.length<=1000&&x.every(id)&&new Set(x).size===x.length;
const rate=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=1;
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function retrievalMetrics(retrieved,relevant,k){
 if(!ids(retrieved)||!ids(relevant)||!relevant.length||!Number.isInteger(k)||k<1||k>1000)throw new Error('Invalid retrieval input');
 const truth=new Set(relevant),top=retrieved.slice(0,k),hits=top.filter(x=>truth.has(x)).length;
 const first=top.findIndex(x=>truth.has(x));
 const discount=i=>1/Math.log2(i+2);
 const dcg=top.reduce((s,x,i)=>s+(truth.has(x)?discount(i):0),0);
 const ideal=Array.from({length:Math.min(k,truth.size)},(_,i)=>discount(i)).reduce((a,b)=>a+b,0);
 return {precision:hits/k,recall:hits/truth.size,reciprocalRank:first<0?0:1/(first+1),ndcg:dcg/ideal,contextRelevance:top.length?hits/top.length:0};
}
export function verifyCitations(context,citations){
 if(!Array.isArray(context)||context.length>1000||!Array.isArray(citations)||!citations.length||citations.length>1000)throw new Error('Invalid citation input');
 const docs=new Map();
 for(const d of context){if(!d||!id(d.id)||docs.has(d.id)||typeof d.text!=='string'||d.text.length>20000)throw new Error('Invalid context');docs.set(d.id,d.text);}
 const results=citations.map(c=>{
  if(!c||!id(c.documentId)||typeof c.quote!=='string'||!c.quote.trim()||c.quote.length>20000)throw new Error('Invalid citation');
  return {documentId:c.documentId,verified:docs.has(c.documentId)&&docs.get(c.documentId).includes(c.quote)};
 });
 return {citationAccuracy:results.filter(x=>x.verified).length/results.length,results};
}
// Caller supplies a trusted, explicitly authorized semantic scorer. No implicit provider calls.
export async function assessGroundedness({answer,context},scorer){
 if(typeof answer!=='string'||!answer.trim()||answer.length>20000||!Array.isArray(context)||context.length>1000||!context.every(d=>d&&id(d.id)&&typeof d.text==='string'&&d.text.length<=20000)||typeof scorer!=='function')throw new Error('Invalid groundedness input');
 const result=await scorer({answer,context});
 if(!rate(result))throw new Error('Invalid groundedness score');
 return {groundedness:result};
}
export function evaluateRag(dataset,{k=5,minRecall=1,minCitationAccuracy=1}={}){
 if(!dataset||dataset.schemaVersion!==1||typeof dataset.synthetic!=='boolean'||!Array.isArray(dataset.cases)||!dataset.cases.length||dataset.cases.length>1000||!rate(minRecall)||!rate(minCitationAccuracy))throw new Error('Invalid RAG suite or policy');
 const seen=new Set(),suite=[];
 const results=dataset.cases.map(c=>{
  if(!c||!id(c.id)||seen.has(c.id))throw new Error('Invalid case ID');
  seen.add(c.id);
  const m=retrievalMetrics(c.retrieved,c.relevant,k);
  const citations=verifyCitations(c.context,c.citations);
  if(c.context.some(d=>!c.retrieved.slice(0,k).includes(d.id)))throw new Error('Context outside retrieved top K');
  suite.push({id:c.id,relevant:[...c.relevant].sort()});
  return {id:c.id,...m,...citations,passed:m.recall>=minRecall&&citations.citationAccuracy>=minCitationAccuracy};
 });
 const passed=results.filter(r=>r.passed).length;
 return {schemaVersion:1,kind:'rag',synthetic:dataset.synthetic,suiteSha256:hash({suite:suite.sort((a,b)=>a.id.localeCompare(b.id)),k,minRecall,minCitationAccuracy}),datasetSha256:hash(dataset),k,minRecall,minCitationAccuracy,passed,total:results.length,gate:passed===results.length?'pass':'fail',results};
}
