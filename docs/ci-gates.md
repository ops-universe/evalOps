# Reusable CI gates
Use evalops.config.json to configure deterministic, RAG and agent suites. Paths are relative to the configuration directory, and path traversal and external symlink targets are rejected. Baselines are explicit, immutable-on-create JSON files; never regenerate candidate baselines automatically in a production regression job. Review and commit passing reports from a trusted revision. Example:
```sh
node src/cli.mjs baseline-create evalops.config.json --suite deterministic
node src/cli.mjs baseline-create evalops.config.json --suite rag
node src/cli.mjs baseline-create evalops.config.json --suite agent
node src/cli.mjs gate evalops.config.json --out gate.json --junit junit.xml
```
Gate exits 0 on success, 1 on regression or failed absolute threshold, 2 on invalid input/incompatible baseline or I/O error. JUnit is suite-level. Agent baselines must be fully passing and match expected trace suite; all current cases must pass. Deterministic and RAG comparisons reuse existing policies. Reports are not signed or proof of genuine external execution. In CI, use read-only checkout and independently trusted baseline/configuration from a protected revision; do not trust candidate changes to policies or baselines. The synthetic CI example tests mechanics, not independent regression against historical model output.
