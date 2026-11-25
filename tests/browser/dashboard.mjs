import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {evaluateAgent} from '../../src/agent.mjs';
const dir=await mkdtemp(join(tmpdir(),'evalops-browser-'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browser,server,ws,launchError;let browserLog='';
async function until(fn,label='interaction',ms=10000){const end=Date.now()+ms;let last;while(Date.now()<end){if(launchError)throw launchError;if(browser&&(browser.exitCode!==null||browser.signalCode!==null))throw new Error('Chrome exited: '+browserLog);try{const v=await fn();if(v)return v;}catch(e){last=e;}await sleep(100);}throw new Error('Browser timeout: '+label+'; '+(last?.message??'condition not satisfied')+'; '+browserLog);}
try{
 const d=JSON.parse(await readFile('datasets/agent-synthetic.json','utf8'));
 const baseline=join(dir,'baseline.json'),current=join(dir,'current.json'),invalid=join(dir,'invalid.json');
 await writeFile(baseline,JSON.stringify(evaluateAgent(d)));d.cases[0].actual.push({tool:'write',args:{}});await writeFile(current,JSON.stringify(evaluateAgent(d)));await writeFile(invalid,'not json');
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{cwd:resolve('website-react'),stdio:'inherit'});
 await until(async()=>(await fetch('http://127.0.0.1:4173')).ok);
 browser=spawn(process.env.CHROME_BIN||'google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1','--user-data-dir='+join(dir,'profile'),'about:blank'],{stdio:['ignore','ignore','pipe']});
 browser.on('error',e=>{launchError=e;});browser.stderr.on('data',chunk=>{browserLog=(browserLog+chunk.toString()).slice(-4000);});
 const port=await until(async()=>{const s=await readFile(join(dir,'profile','DevToolsActivePort'),'utf8');const p=Number(s.split('\n')[0]);return Number.isInteger(p)&&p>0&&p<=65535?p:null;},'Chrome debugging port',30000);
 const target=await until(async()=>(await (await fetch('http://127.0.0.1:'+port+'/json/list',{signal:AbortSignal.timeout(2000)})).json()).find(x=>x.type==='page'),'Chrome debugging target',15000);
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((ok,bad)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',bad,{once:true});});
 let seq=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const evalJs=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error('Browser evaluation failed');return r.result.value;};
 await send('Page.navigate',{url:'http://127.0.0.1:4173/#dashboard'});
 await until(()=>evalJs("!!document.querySelector('#dashboard input[type=file]')"));
 async function upload(index,path){const {root}=await send('DOM.getDocument');const {nodeIds}=await send('DOM.querySelectorAll',{nodeId:root.nodeId,selector:'#dashboard input[type=file]'});await send('DOM.setFileInputFiles',{nodeId:nodeIds[index],files:[path]});}
 await upload(0,current);await until(()=>evalJs("document.querySelector('#dashboard [role=status]')?.textContent.includes('FAIL')"));
 await upload(1,baseline);await until(()=>evalJs("document.querySelector('#dashboard tbody')?.textContent.includes('pp')"));
 await evalJs("document.querySelector('#dashboard input[type=checkbox]').click()");await until(()=>evalJs("document.querySelectorAll('#dashboard tbody tr').length===1"));
 assert.equal(await evalJs("document.querySelector('#dashboard tbody').textContent.includes('Unauthorized tool: write')"),true);
 await evalJs("const s=document.querySelectorAll('#dashboard select')[1];s.value='argumentAccuracy';s.dispatchEvent(new Event('change',{bubbles:true}));");await until(()=>evalJs("document.querySelector('#dashboard .case-chart meter')?.value<1"));
 await send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:dir});
 await evalJs("[...document.querySelectorAll('#dashboard button')].find(b=>b.textContent==='Export selected view').click()");
 const exported=await until(async()=>JSON.parse(await readFile(join(dir,'evalops-dashboard-view.json'),'utf8')));
 assert.equal(exported.suite.gate,'fail');assert.equal(exported.comparison[0].regressed,true);
 await upload(0,invalid);await until(()=>evalJs("!!document.querySelector('#dashboard [role=alert]')&&!document.querySelector('#dashboard tbody')"));
 console.log('Browser dashboard interactions passed');
}finally{ws?.close();browser?.kill();server?.kill();await sleep(500);await rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
