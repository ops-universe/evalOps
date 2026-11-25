import test from 'node:test';
import assert from 'node:assert/strict';
import {benchmark} from '../examples/enterprise/run.mjs';
test('synthetic enterprise benchmark passes positive and detects adversarial paths',async()=>{const r=await benchmark();assert.equal(r.gate,'pass');assert.equal(r.scenarios.length,3);for(const s of r.scenarios){assert.equal(s.expected.gate,'pass');assert.equal(s.adversarial.gate,'fail');}assert.equal(r.knowledgeRegression.gate,'fail');assert.deepEqual(r,await benchmark());});
