import {createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {validateDataset} from './dataset.mjs';
import {evaluate} from './engine.mjs';
export function buildEvidence(dataset,minPassRate){
 const d=validateDataset(dataset);
 const normalized={schemaVersion:d.schemaVersion,synthetic:d.synthetic,cases:d.cases.map(({id,expected,actual,metric})=>({id,expected,actual,metric}))};
 const datasetSha256=createHash('sha256').update(JSON.stringify(normalized),'utf8').digest('hex');
 return {evidenceVersion:1,evaluatorVersion:'0.1.0',datasetSha256,synthetic:d.synthetic,...evaluate(normalized.cases,{minPassRate})};
}
export async function writeEvidence(path,report){
 await writeFile(path,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
}
