import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../src/cli.mjs', import.meta.url));
const example = new URL('../datasets/synthetic.json', import.meta.url);

test('onboarding CLI writes evidence and blocks a regressed run', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'evalops-onboarding-'));
  t.after(() => rm(dir, { recursive: true, force: true }));

  function run(expectedStatus, ...args) {
    const result = spawnSync(process.execPath, [cli, ...args], { cwd: dir, encoding: 'utf8' });
    assert.ifError(result.error);
    assert.equal(result.status, expectedStatus, result.stderr);
  }

  const dataset = JSON.parse(await readFile(example, 'utf8'));
  await writeFile(join(dir, 'dataset.json'), JSON.stringify(dataset));
  run(0, 'validate', 'dataset.json');
  run(0, 'run', 'dataset.json', '--min-pass-rate', '0.75', '--out', 'baseline.json');
  run(0, 'compare', 'baseline.json', 'baseline.json', '--out', 'passing.json');

  const changed = dataset.cases.find(item => item.metric === 'exact' && item.actual === item.expected);
  changed.actual = 'deliberately different';
  await writeFile(join(dir, 'dataset.json'), JSON.stringify(dataset));
  run(1, 'run', 'dataset.json', '--min-pass-rate', '0.75', '--out', 'current.json');
  run(1, 'compare', 'baseline.json', 'current.json', '--out', 'failing.json');

  const readReport = async name => JSON.parse(await readFile(join(dir, name), 'utf8'));
  assert.equal((await readReport('baseline.json')).gate, 'pass');
  assert.equal((await readReport('current.json')).gate, 'fail');
  assert.equal((await readReport('passing.json')).gate, 'pass');
  const failing = await readReport('failing.json');
  assert.equal(failing.gate, 'fail');
  assert.deepEqual(failing.regressions, [changed.id]);
});
