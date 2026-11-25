import {loadLocalJson} from './local-json.mjs';
import {evaluateAgent} from './agent.mjs';
import {writeEvidence} from './evidence.mjs';
export async function agentCommand(args){
 const [command,path,flag,out]=args;
 if(!path||!(args.length===2||(command==='agent-run'&&args.length===4&&flag==='--out'&&out&&!out.startsWith('-'))))throw new Error('Usage: agent-validate DATASET | agent-run DATASET [--out FILE]');
 const report=evaluateAgent(await loadLocalJson(path));
 if(command==='agent-validate'){console.log(JSON.stringify({valid:true,schemaVersion:1,cases:report.total}));return 0;}
 if(out)await writeEvidence(out,report);
 console.log(JSON.stringify(report,null,2));return report.gate==='pass'?0:1;
}
