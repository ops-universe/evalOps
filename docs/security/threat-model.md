# Threat model

Untrusted case text is data, not instructions. No eval, shell execution, network or model calls. Reject unsupported metrics, empty expectations, duplicates and invalid thresholds. Trusted application code chooses the threshold, not an evaluated response. No claims of semantic correctness. Future risks include prompt injection, data leakage and judge manipulation; require explicit adapter permissions and evidence before enabling them. Dataset size limits and stronger schema validation are pending.
