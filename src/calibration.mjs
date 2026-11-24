/** Agreement against independently labeled binary outcomes. */
export function calibrate(examples){
 if(!Array.isArray(examples)||!examples.length||examples.length>10000)throw new Error('Invalid calibration examples');
 let tp=0,tn=0,fp=0,fn=0;const seen=new Set();
 for(const e of examples){
  if(!e||typeof e.id!=='string'||!e.id||seen.has(e.id)||typeof e.humanPass!=='boolean'||typeof e.judgePass!=='boolean')throw new Error('Invalid calibration label');
  seen.add(e.id);
  if(e.humanPass&&e.judgePass)tp++;else if(!e.humanPass&&!e.judgePass)tn++;else if(e.judgePass)fp++;else fn++;
 }
 const ratio=(a,b)=>b?a/b:null;
 return {schemaVersion:1,total:examples.length,tp,tn,fp,fn,agreement:(tp+tn)/examples.length,precision:ratio(tp,tp+fp),recall:ratio(tp,tp+fn),falsePositiveRate:ratio(fp,fp+tn)};
}
