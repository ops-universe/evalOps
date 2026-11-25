import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const run=(...args)=>spawnSync(process.execPath,['src/cli.mjs',...args],{encoding:'utf8'});
test('agent CLI validates, exports, rejects overwrite and blocks unauthorized tools',async()=>{const dir=await mkdtemp(join(tmpdir(),'evalops-agent-'));try{const input='datasets/agent-synthetic.json',out=join(dir,'out.json'),bad=join(dir,'bad.json');assert.equal(run('agent-validate',input).status,0);assert.equal(run('agent-run',input,'--out',out).status,0);assert.equal(JSON.parse(await readFile(out,'utf8')).kind,'agent');assert.equal(run('agent-run',input,'--out',out).status,2);const d=JSON.parse(await readFile(input,'utf8'));d.cases[0].actual.push({tool:'write',args:{}});await writeFile(bad,JSON.stringify(d));assert.equal(run('agent-run',bad).status,1);d.cases[0].unknown=true;await writeFile(bad,JSON.stringify(d));assert.equal(run('agent-validate',bad).status,2);assert.equal(run('agent-run',input,'--bogus','x').status,2);}finally{await rm(dir,{recursive:true,force:true});}});
