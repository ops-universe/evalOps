import {readFile} from 'node:fs/promises';
import {evaluate} from './engine.mjs';
const dataset=JSON.parse(await readFile(new URL('../datasets/synthetic.json',import.meta.url),'utf8'));
console.log(JSON.stringify(evaluate(dataset.cases,{minPassRate:0.75}),null,2));
