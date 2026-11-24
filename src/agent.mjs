import {createHash} from 'node:crypto';
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(x);
const fail=()=>{throw new Error('Invalid agent evaluation input');};
function canonical(x,depth=0){
 if(depth>20)fail();
 if(x===null||typeof x==='boolean'||typeof x==='string'&&x.length<=20000||typeof x==='number'&&Number.isFinite(x))return x;
 if(Array.isArray(x)&&x.length<=1000)return x.map(v=>canonical(v,depth+1));
 if(x&&typeof x==='object'&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x))){
  const keys=Object.keys(x).sort();if(keys.length>1000||keys.some(k=>k.length>128||['__proto__','constructor','prototype'].includes(k)))fail();
  return Object.fromEntries(keys.map(k=>[k,canonical(x[k],depth+1)]));
 }
 fail();
}
const hash=x=>createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
function calls(xs){if(!Array.isArray(xs)||xs.length>1000)fail();return xs.map(x=>{if(!x||!id(x.tool)||!x.args||typeof x.args!=='object'||Array.isArray(x.args))fail();return {tool:x.tool,args:canonical(x.args)};});}
export function evaluateAgent(dataset){
 if(!dataset||dataset.schemaVersion!==1||typeof dataset.synthetic!=='boolean'||!Array.isArray(dataset.cases)||!dataset.cases.length||dataset.cases.length>1000)fail();
 const seen=new Set(),suite=[];
 const results=dataset.cases.map(c=>{
  if(!c||!id(c.id)||seen.has(c.id)||!Array.isArray(c.allowedTools)||c.allowedTools.length>1000||!c.allowedTools.every(id)||new Set(c.allowedTools).size!==c.allowedTools.length||typeof c.expectedCompleted!=='boolean'||typeof c.actualCompleted!=='boolean')fail();
  seen.add(c.id);
  const expected=calls(c.expected),actual=calls(c.actual),allowed=new Set(c.allowedTools);
  if(expected.some(x=>!allowed.has(x.tool)))fail();
  const unauthorized=actual.flatMap((x,i)=>allowed.has(x.tool)?[]:[{index:i,tool:x.tool}]);
  const length=Math.max(expected.length,actual.length);
  const equal=(a,b)=>a&&b&&a.tool===b.tool&&JSON.stringify(a.args)===JSON.stringify(b.args);
  let toolHits=0,argHits=0;
  for(let i=0;i<length;i++){if(expected[i]&&actual[i]&&expected[i].tool===actual[i].tool)toolHits++;if(equal(expected[i],actual[i]))argHits++;}
  const toolSelectionAccuracy=length?toolHits/length:1,argumentAccuracy=length?argHits/length:1;
  const sequenceExact=expected.length===actual.length&&toolHits===length,taskCompletion=c.expectedCompleted===c.actualCompleted;
  const passed=sequenceExact&&argumentAccuracy===1&&taskCompletion&&!unauthorized.length;
  suite.push({id:c.id,allowedTools:[...allowed].sort(),expected,expectedCompleted:c.expectedCompleted});
  return {id:c.id,toolSelectionAccuracy,argumentAccuracy,sequenceExact,taskCompletion,unauthorized,expectedTools:expected.map(x=>x.tool),actualTools:actual.map(x=>x.tool),passed};
 });
 const passed=results.filter(x=>x.passed).length;
 return {schemaVersion:1,evidenceVersion:1,evaluatorVersion:'0.1.0',kind:'agent',synthetic:dataset.synthetic,suiteSha256:hash(suite.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)),datasetSha256:hash(dataset),total:results.length,passed,gate:passed===results.length?'pass':'fail',results};
}
