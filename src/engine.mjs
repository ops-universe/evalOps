/** Deterministic string-output evaluation. No provider calls or code execution. */
/** @typedef {{id:string,expected:string,actual:string,metric:'exact'|'contains'}} EvalCase */
/** @param {EvalCase[]} cases @param {{minPassRate:number}} policy */
export function evaluate(cases,policy){
 if(!Array.isArray(cases)||cases.length===0)throw new Error('Nonempty dataset required');
 if(!policy||typeof policy.minPassRate!=='number'||!Number.isFinite(policy.minPassRate)||policy.minPassRate<0||policy.minPassRate>1)throw new Error('Invalid minimum pass rate');
 const ids=new Set();
 const results=cases.map(c=>{
  if(!c||typeof c.id!=='string'||!c.id.trim()||ids.has(c.id)||typeof c.expected!=='string'||!c.expected.length||typeof c.actual!=='string'||!['exact','contains'].includes(c.metric))throw new Error('Invalid or duplicate evaluation case');
  ids.add(c.id);
  const passed=c.metric==='exact'?c.actual===c.expected:c.actual.includes(c.expected);
  return {id:c.id,metric:c.metric,passed};
 });
 const passed=results.filter(r=>r.passed).length,total=results.length,passRate=passed/total;
 return {schemaVersion:1,total,passed,failed:total-passed,passRate,minPassRate:policy.minPassRate,gate:passRate>=policy.minPassRate?'pass':'fail',results};
}
