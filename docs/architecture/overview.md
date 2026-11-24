# Architecture

The engine accepts explicit cases and a trusted caller-supplied threshold. It validates all inputs, evaluates literal string metrics, aggregates pass counts and emits a deterministic versioned report. No network, provider keys, dynamic execution or persistence. Reports omit raw outputs but identifiers may still contain sensitive data; use synthetic identifiers. Exact and contains are intentionally limited and do not measure correctness in general. Future provider adapters must remain outside the deterministic core.
