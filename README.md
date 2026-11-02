# rivet-joint-calc

A TypeScript CLI for riveted lap/butt joint strength per pitch length. Requires Node.js 18+ and has no runtime dependencies.

```sh
npm install
npm test
node dist/cli.js --dia 10 --thick 8 --pitch 40
node dist/cli.js --dia 10 --thick 8 --pitch 40 --shear double --json
node dist/cli.js --dia 10 --thick 8 --pitch 40 --rivets 2
node dist/cli.js --dia 10 --thick 8 --pitch 40 --load 8000
```

`npm test` builds TypeScript and runs the Node test runner. Use `npm run build` to build separately. The package executable `rivet-joint-calc` points to `dist/cli.js`; run `node dist/cli.js --help` for all flags.

Diameter, thickness and pitch are required in mm; pitch must exceed diameter. Rivets per pitch defaults to 1 (positive integer), shear mode to `single`, allowable shear to 80 MPa, allowable bearing to 160 MPa, and allowable tension to 100 MPa. All numeric inputs must be finite and positive. Optional applied load is in N per pitch. Decimal and scientific notation are accepted. Duplicate and unknown options are rejected.

For diameter d, thickness t, pitch p, rivet count n, shear plane count s (1 or 2), and allowable stresses τ, σb, σt:

- Shear: Ps = n × s × (π/4) × d² × τ
- Bearing: Pb = n × d × t × σb
- Tearing: Pt = (p − d) × t × σt
- Solid plate: P0 = p × t × σt
- Joint strength: min(Ps, Pb, Pt)
- Efficiency: joint strength / P0 × 100%

All tied governing modes are reported. With load, safety factor is joint strength / load; a factor ≥ 1 is OK. FAIL prints a warning to stderr but exits 0. Invalid inputs exit 1 with an error on stderr. Table strengths use two decimals and safety factors three; JSON reports unrounded numbers and a `governing` array, with `safetyFactor` and `status` only when load is supplied.

For d=10, t=8, p=40 and defaults, strengths are 6283.19 N shear, 12800.00 N bearing, 24000.00 N tearing and 32000.00 N solid plate; efficiency is 19.63%. Double shear or two rivets gives 12566.37 N joint strength and 39.27% efficiency. Loads of 5000 and 8000 N give safety factors of 1.257 OK and 0.785 FAIL respectively.

Simplifications: uniform load sharing, ideal single/double shear, and the supplied hole diameter used for both shear area and bearing. Tearing uses one hole deduction per pitch regardless of rivet count or layout. This model omits stagger, multiple net sections, edge tear-out, block shear, bending, fatigue, eccentricity, friction, installation effects, and code-specific factors. Allowable stresses are user inputs; this is a simplified strength calculation, not a complete joint design or certification.

MIT licensed; see LICENSE.
