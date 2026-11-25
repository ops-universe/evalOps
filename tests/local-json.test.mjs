import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {loadLocalJson} from '../src/local-json.mjs';
import {readDataset} from '../src/dataset.mjs';
test('reject malformed UTF-8, oversized data and nonregular input',async()=>{const dir=await mkdtemp(join(tmpdir(),'evalops-input-'));try{const p=join(dir,'input.json');await writeFile(p,Buffer.from([34,255,34]));await assert.rejects(loadLocalJson(p));await assert.rejects(readDataset(p));await writeFile(p,Buffer.alloc(5*1024*1024+1));await assert.rejects(loadLocalJson(p));await assert.rejects(loadLocalJson(dir));if(process.platform!=='win32'){const fifo=join(dir,'fifo');assert.equal(spawnSync('mkfifo',[fifo]).status,0);await assert.rejects(loadLocalJson(fifo));await assert.rejects(readDataset(fifo));}}finally{await rm(dir,{recursive:true,force:true});}});
