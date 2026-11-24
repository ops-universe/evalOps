import {judgeCase} from '../src/judge.mjs';
import {mockJudge} from '../src/adapters/mock.mjs';
const rubric={id:'support',version:1,criteria:[{id:'accuracy',description:'Correct information',weight:3},{id:'clarity',description:'Clear response',weight:1}]};
console.log(JSON.stringify(await judgeCase({id:'synthetic-001',expected:'Refund within 5 days',actual:'Refund processing takes up to five days.'},rubric,mockJudge([{id:'accuracy',score:1},{id:'clarity',score:.8}]),{enabled:true,minScore:.8,timeoutMs:1000}),null,2));
