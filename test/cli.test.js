const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { calculate } = require('../dist/joint');
const base = ['--dia', '10', '--thick', '8', '--pitch', '40'];
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const run = args => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rivet-test-'));
  const out = path.join(dir, 'stdout');
  const err = path.join(dir, 'stderr');
  const stdout = fs.openSync(out, 'w');
  const stderr = fs.openSync(err, 'w');
  try {
    const result = spawnSync(process.execPath, ['dist/cli.js', ...args], { stdio: ['ignore', stdout, stderr] });
    if (result.error) throw result.error;
    return { status: result.status, stdout: fs.readFileSync(out, 'utf8'), stderr: fs.readFileSync(err, 'utf8') };
  } finally {
    fs.closeSync(stdout); fs.closeSync(stderr);
    fs.rmSync(dir, { recursive: true, force: true });
  }
};
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.005, `${actual} != ${expected}`);

for (const [name, extra, ps, pb, efficiency] of [
  ['single', [], 6283.19, 12800, 19.63],
  ['double', ['--shear', 'double'], 12566.37, 12800, 39.27],
  ['two rivets', ['--rivets', '2'], 12566.37, 25600, 39.27],
]) test(name, () => {
  const output = run([...base, ...extra, '--json']);
  assert.equal(output.status, 0); assert.equal(output.stderr, '');
  const r = JSON.parse(output.stdout);
  close(r.shear, ps); close(r.bearing, pb); close(r.tearing, 24000); close(r.solidPlate, 32000);
  close(r.joint, ps); close(r.efficiency, efficiency); assert.deepEqual(r.governing, ['shear']);
});
for (const [load, sf, status] of [[5000, '1.257', 'OK'], [8000, '0.785', 'FAIL']]) test(`load ${load}`, () => {
  const r = run([...base, '--load', String(load)]);
  assert.equal(r.status, 0); assert.match(r.stdout, new RegExp(sf)); assert.match(r.stdout, new RegExp(status));
  assert.equal(r.stderr.includes('Warning:'), status === 'FAIL');
  const json = JSON.parse(run([...base, '--load', String(load), '--json']).stdout);
  assert.equal(json.safetyFactor.toFixed(3), sf); assert.equal(json.status, status);
});
for (const args of [
  ['--dia', '10', '--thick', '8', '--pitch', '10'],
  ['--dia', '0', '--thick', '8', '--pitch', '40'],
  ...[['--rivets', '0'], ['--rivets', '1.5'], ['--shear', 'triple'], ['--thick', '-1'], ['--tau', 'Infinity'], ['--load', '0'], ['--bearing', 'NaN'], ['--tension', '0'], ['--unknown'], ['--load'], ['--load', '1e999'], ['--load', 'abc']].map(extra => [...base.filter((_, i) => !extra.includes(base[i - (i % 2)])), ...extra]),
  [], ['--dia', '10'],
]) test(`reject ${args.join(' ') || 'missing inputs'}`, () => {
  const r = run(args); assert.equal(r.status, 1); assert.match(r.stderr, /Error:/); assert.equal(r.stdout, '');
});
test('help and table', () => {
  assert.match(run(['--help']).stdout, /Usage:/);
  const r = run(base); assert.equal(r.status, 0); assert.match(r.stdout, /6283\.19 N/); assert.match(r.stdout, /19\.63 %/);
});
test('other governing modes and ties', () => {
  const input = { dia: 10, thick: 8, pitch: 40, rivets: 1, shear: 'single', tau: 80, bearing: 160, tension: 100 };
  assert.deepEqual(calculate({ ...input, bearing: 1 }).governing, ['bearing']);
  assert.deepEqual(calculate({ ...input, pitch: 11 }).governing, ['tearing']);
  assert.deepEqual(calculate({ ...input, bearing: 300, tau: 1000 }).governing, ['bearing', 'tearing']);
});
