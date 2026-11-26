# Changelog

## Unreleased

Initial deterministic evaluator, synthetic dataset, governance and branded website starter.

Added bounded version 1 dataset validation, CLI quality gates, deterministic evidence hashes and exclusive report output.

Added opt-in rubric judging, mock and configurable Chat Completions adapters, timeout/error controls and human-label calibration metrics.

Added RAG retrieval ranking metrics, exact citation quote verification, explicit groundedness scorer interface and synthetic evidence gates.

Added local RAG CLI, versioned reports and per-case metric regression comparison with blocking exit codes.

Added deterministic offline agent trace evaluation with exact tool sequence and argument comparisons, completion expectations and unauthorized-tool detection.

Added agent-run and agent-validate CLI commands, versioned agent dataset schema, shared bounded JSON loader and CLI integration tests.

Added reusable multi-suite CI gate, explicit exclusive baseline creation, regression policies, JSON and JUnit reports, bounded relative input paths and synthetic CI integration.

Added local browser dashboard for evaluation evidence, metric charts, baseline comparison, failed-case filtering and selected view export.

Added three synthetic enterprise scenarios with reproducible positive and negative evidence, Chromium dashboard interaction checks and nonblocking local file opens.

Hardened Chromium startup with an isolated dynamic debugging port and diagnostic timeouts; extended bounded nonblocking UTF-8 JSON input handling to legacy CLI paths.

Hardened RAG structural validation and groundedness deadlines, rejected changed regression policies, and documented verified browser and enterprise acceptance and residual security limitations.

Corrected the absolute-gate regression fixture to compare identical thresholds while permitting the observed regression through tolerance checks; added bidirectional threshold-mismatch rejection coverage.

Engineering acceptance: PR #12 merged after 75/75 tests, both dependency audits, Chromium interactions, enterprise benchmarks and multi-suite gates passed on the exact head. Historical checkpoint: post-merge verification was outstanding when originally recorded; see the verified Wave 1 checkpoint below. No release or live provider compatibility claim.

## Wave 1 re-verification — 2026-11-26

Audited main: e8b5e1954a44b4bb23b855f77b687463f887a3f6. The original implementation checkpoint c50f72f672eab0b968a5b09606b19fbd4b9256e8 is an ancestor (5 commits ahead, 0 behind); intervening changes are documentation and static website infrastructure, not evaluator runtime or core test changes. Actual push-triggered [Core CI 45664302113](https://github.com/ops-universe/evalOps/actions/runs/45664302113) passed: 75 core tests, 0 failures/skips (job 139382153143), synthetic enterprise benchmark, multi-suite baseline/gate exercise, failing-gate exit check, website audit/build and browser dashboard interactions (job 139382152571). [Pages 45664302395](https://github.com/ops-universe/evalOps/actions/runs/45664302395) passed build, deploy and all three public documentation routes. Root and website audits reported zero vulnerabilities in the observed logs. Scope remains offline synthetic evidence, trusted local roots and injected adapters, unsigned reports, cooperative cancellation and no verified live-provider compatibility or runtime authorization. This is not release authorization.

Open contributor [PR #20](https://github.com/ops-universe/evalOps/pull/20), head 12387b909a81577c7da63854bdfc68684e62894e, is an additional onboarding regression test for #16. Its two PR workflows returned action_required with no jobs/checks; do not merge or claim the contributor test passed until authorized workflow approval and exact-head results exist. Main's existing test baseline passed independently. Final repository closeout remains pending this documentation reconciliation and resolution of the open PR gate. No new feature work or release is authorized.
