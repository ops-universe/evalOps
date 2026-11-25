import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {evaluateAgent} from '../../src/agent.mjs';
import {evaluateRag} from '../../src/rag.mjs';
import {compareRag} from '../../src/rag-regression.mjs';
import {writeEvidence} from '../../src/evidence.mjs';
const load=async name=>JSON.parse(await readFile(new URL('../../datasets/enterprise/'+name+'.json',import.meta.url),'utf8'));
export async function benchmark(){
 const supplier=await load('supplier'),knowledge=await load('knowledge'),support=await load('support');
 const good=[evaluateAgent(supplier),evaluateRag(knowledge),evaluateAgent(support)];
 supplier.cases[1].actual.push({tool:'approve',args:{supplierId:'SYN-002'}});
 knowledge.cases[0].citations[0].quote='900 days';
 support.cases[1].actual.push({tool:'refund',args:{ticket:'SYN-102'}});
 const bad=[evaluateAgent(supplier),evaluateRag(knowledge),evaluateAgent(support)];
 const comparison=compareRag(good[1],bad[1]);
 return {schemaVersion:1,kind:'enterprise-benchmark',synthetic:true,gate:good.every(r=>r.gate==='pass')&&bad.every(r=>r.gate==='fail')&&comparison.gate==='fail'?'pass':'fail',scenarios:['supplier-onboarding','enterprise-knowledge','governed-support'].map((id,i)=>({id,expected:good[i],adversarial:bad[i]})),knowledgeRegression:comparison};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const report=await benchmark();const args=process.argv.slice(2);if(args.length){if(args.length!==2||args[0]!=='--out')throw new Error('Usage: run.mjs [--out FILE]');await writeEvidence(args[1],report);}console.log(JSON.stringify(report,null,2));process.exitCode=report.gate==='pass'?0:1;}catch(e){console.error(e.message);process.exitCode=2;}
}
