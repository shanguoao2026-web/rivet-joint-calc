# rivet-joint-calc

Build a small TypeScript Node CLI (Node 18+, no runtime deps; devDeps typescript + @types/node only; tests with node:test) that checks the strength of a riveted lap/butt joint per pitch length.

Inputs: --dia <mm> rivet hole diameter (required, >0), --thick <mm> plate thickness (required, >0), --pitch <mm> (required, > dia), --rivets n (integer ≥1 rivets per pitch length, default 1), --shear single|double (default single), --tau <MPa> allowable rivet shear (default 80), --bearing <MPa> allowable crushing/bearing (default 160), --tension <MPa> allowable plate tension (default 100), --load <N> (optional applied load per pitch), --json, --help.
Formulas:
- Shear strength Ps = n · s · (π/4) · d² · τ, s = 1 single or 2 double.
- Bearing (crushing) strength Pb = n · d · t · σb.
- Tearing strength Pt = (p − d) · t · σt.
- Solid plate strength P0 = p · t · σt.
- Joint strength = min(Ps, Pb, Pt), print governing mode; efficiency % = min / P0 · 100.
- With --load: safety factor = joint strength / load; status OK if ≥ 1 else FAIL (warning to stderr, exit 0).
- Validate finite numbers / integers; errors to stderr with exit 1 (dia ≤0, pitch ≤ dia, rivets <1 or non-integer, bad shear mode).
- Table output by default, README with examples and stated simplifications, MIT LICENSE (author shanguoao2026-web), .gitignore with node_modules/ dist/ *.log .npm-cache/.
- package.json "bin" must point to the built CLI. npm test must build and pass. No secrets, no personal info.

Check values (must be in tests), d10 t8 p40 defaults:
- single, n1 → Ps 6283.19 N, Pb 12800.00, Pt 24000.00, P0 32000.00, governing shear, efficiency 19.63 %.
- double, n1 → Ps 12566.37, governing shear, efficiency 39.27 %.
- single, n2 → Ps 12566.37, Pb 25600.00, Pt 24000.00, governing shear, 39.27 %.
- load 5000 single n1 → SF 1.257 OK; load 8000 → SF 0.785 FAIL (exit 0).
- pitch 10 (=dia), dia 0, rivets 0, shear triple → exit 1.
