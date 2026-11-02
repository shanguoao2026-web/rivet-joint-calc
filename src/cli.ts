#!/usr/bin/env node
import { calculate, Inputs } from './joint';

const help = `Usage: rivet-joint-calc --dia <mm> --thick <mm> --pitch <mm> [options]

Strength of a riveted lap/butt joint per pitch length (N, mm, MPa).
  --dia <mm>               Hole diameter, required, > 0
  --thick <mm>             Plate thickness, required, > 0
  --pitch <mm>             Pitch, required, > dia
  --rivets <n>             Rivets per pitch, integer >= 1 (default 1)
  --shear single|double    Shear planes (default single)
  --tau <MPa>              Allowable rivet shear (default 80)
  --bearing <MPa>          Allowable bearing stress (default 160)
  --tension <MPa>          Allowable plate tension (default 100)
  --load <N>              Positive applied load per pitch (optional)
  --json                  Print JSON with full precision
  --help                  Show this help
All numeric inputs must be finite and positive.
`;

try {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    process.stdout.write(help);
  } else {
    const options: Record<string, number | string> = { rivets: 1, shear: 'single', tau: 80, bearing: 160, tension: 100 };
    const numeric = new Set(['dia', 'thick', 'pitch', 'rivets', 'tau', 'bearing', 'tension', 'load']);
    const seen = new Set<string>();
    let json = false;
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (seen.has(arg)) throw new Error(`duplicate option: ${arg}`);
      seen.add(arg);
      if (arg === '--json') { json = true; continue; }
      const key = arg.slice(2);
      if (!arg.startsWith('--') || (!numeric.has(key) && key !== 'shear')) throw new Error(`unknown option: ${arg}`);
      const raw = args[++i];
      if (raw === undefined || raw.startsWith('--') || raw.trim() === '') throw new Error(`missing value for ${arg}`);
      if (key === 'shear') options[key] = raw;
      else {
        if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)) throw new Error(`${key} must be a finite number`);
        options[key] = Number(raw);
      }
    }
    for (const key of ['dia', 'thick', 'pitch']) if (options[key] === undefined) throw new Error(`--${key} is required`);
    const result = calculate(options as unknown as Inputs);
    if (json) console.log(JSON.stringify(result, null, 2));
    else {
      const rows = [
        ['Shear strength', `${result.shear.toFixed(2)} N`],
        ['Bearing strength', `${result.bearing.toFixed(2)} N`],
        ['Tearing strength', `${result.tearing.toFixed(2)} N`],
        ['Solid plate strength', `${result.solidPlate.toFixed(2)} N`],
        ['Joint strength', `${result.joint.toFixed(2)} N`],
        ['Governing mode', result.governing.join(', ')],
        ['Efficiency', `${result.efficiency.toFixed(2)} %`],
      ];
      if (result.safetyFactor !== undefined) rows.push(['Safety factor', result.safetyFactor.toFixed(3)], ['Status', result.status!]);
      console.log(rows.map(([label, value]) => `${label.padEnd(22)} | ${value}`).join('\n'));
    }
    if (result.status === 'FAIL') console.error('Warning: applied load exceeds joint strength (FAIL).');
  }
} catch (error) {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
