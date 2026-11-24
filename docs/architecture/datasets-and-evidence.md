# Dataset and evidence contracts

Version 1 datasets accept 1–10,000 cases; local input files are capped at 5 MiB and output strings at 100,000 JavaScript UTF-16 code units. Identifiers are constrained ASCII and unique. Unknown fields and schema versions are rejected. JSON Schema documents the interchange shape; runtime validation additionally enforces unique IDs, byte limits and UTF-16 length. JSON Schema alone does not enforce all runtime invariants.

The CLI accepts the minimum pass rate explicitly, never from the dataset. It emits stable JSON, with a SHA-256 of normalized dataset content (case order preserved), evaluator version, results and gate decision. It is reproducible evidence, not a signed attestation, provenance proof or anonymization mechanism. Identifiers and hashes can expose or correlate sensitive information; use non-sensitive IDs and review before sharing.

Output files are exclusive-create, owner-only on supporting platforms. Existing reports are never overwritten. Exit 0 = pass or valid dataset; 1 = failed gate; 2 = invalid data, arguments or I/O error. A failed gate still produces evidence. Use only trusted local paths; there is no provider or network access. Evidence integrity signing, semantic scoring and baseline regression are future work.
