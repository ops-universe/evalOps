# evalOps

**Ship AI with evidence.**

Developer Preview · MIT · Local-first AI evaluation engineering.

evalOps aims to provide vendor-independent evaluation for LLM applications, RAG and agents. The deterministic core evaluates supplied string outputs offline. A separate explicitly opt-in judge API supports structured rubric scoring; no default model calls or tool execution.

## Quick start

Node.js 22+.

```sh
npm ci
npm test
npm run demo
```

The synthetic supplier-onboarding dataset includes one deliberately failing case. The demo reports 3/4 passing at a 75% threshold. This is demonstration data, not a customer benchmark.

## Architecture

Dataset → validation → deterministic metrics → aggregate → quality gate → evidence report.

See [architecture](docs/architecture/overview.md), [security](docs/security/threat-model.md) and [roadmap](ROADMAP.md).

Website: `cd website-react && npm ci && npm run dev`. Deployment is not yet configured. Project uses the registered royal-blue palette and pinned shared UI.

## Contribute and support

See CONTRIBUTING.md and SECURITY.md. [Ops Universe](https://github.com/ops-universe) · [Sponsor](https://github.com/sponsors/AnkitParekh007) · [Buy me a coffee](https://buymeacoffee.com/ankitparekh).

## CLI and evidence

```sh
node src/cli.mjs validate datasets/synthetic.json
node src/cli.mjs run datasets/synthetic.json --min-pass-rate 0.75 --out evidence.json
```

The CLI exits 0 on pass, 1 on failed gate, 2 on invalid input or I/O error. Existing reports are never overwritten. Versioned schemas live in `schemas/`; see [dataset and evidence contracts](docs/architecture/datasets-and-evidence.md). Reports include a reproducible dataset SHA-256, not a signed attestation. Do not publish sensitive IDs or hashes.

## Regression comparison

Additional deterministic metrics: `normalized-exact` (NFC, whitespace normalization and lowercase) and `json-equal` (parsed JSON structural equality, object key order ignored, array order preserved, depth limit 100). Invalid JSON fails; JavaScript number precision and duplicate JSON keys follow JSON.parse semantics. These are not semantic metrics.

```sh
node src/cli.mjs compare baseline.json current.json --out regression.json
```

Generate both evidence files with the updated evaluator. Comparison requires matching suite fingerprints (case IDs, metrics and expected text), validates evidence totals, detects per-case regressions even when aggregate scores are unchanged, and blocks on any regression, score drop or failed current absolute gate. The API supports explicit tolerances; CLI defaults are strict. Evidence is unsigned and must come from trusted runs. Old reports without a suite fingerprint must be regenerated.

## Optional model-assisted judging

Run the offline synthetic fixture: `node examples/judge-demo.mjs`. The fixture does not evaluate semantic quality. Use `judgeCase` with a trusted rubric, adapter and explicit policy. A configurable HTTPS Chat Completions adapter is provided, but no live provider compatibility is verified. External calls require both opt-in flags and transmit case text. See [judge architecture and calibration](docs/architecture/judge.md).
