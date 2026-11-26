# Roadmap
- Phase 1: deterministic engine, governance and website starter (implemented).
- Phase 2: versioned datasets, CLI and evidence (implemented).
- Phase 3: extra metrics and regression comparison (implemented).
- Phase 4: opt-in judging and calibration (merged; live providers unverified).
- Phase 5: RAG evaluation (merged; PRs #5 and #6, exact-head CI passed).
- Phase 6: agent trace evaluation (PRs #7 and #8 merged; exact-head CI passed).
- Phase 7: CI/CD gates and baseline management (PR #9 merged; exact-head CI passed).
- Phase 8: local dashboard (merged; browser acceptance passed in PR #11 and post-merge CI).
- Phase 9: synthetic enterprise FDE examples (PR #11 merged; benchmark CI passed).
- Phase 10: functional and security hardening (PR #12 merged; all exact-head checks passed, 75/75 tests). Historical checkpoint: post-merge verification was outstanding when originally recorded; see the verified Wave 1 checkpoint below. Public release and Developer Preview launch deferred.

## Wave 1 re-verification — 2026-11-26

Audited main: e8b5e1954a44b4bb23b855f77b687463f887a3f6. The original implementation checkpoint c50f72f672eab0b968a5b09606b19fbd4b9256e8 is an ancestor (5 commits ahead, 0 behind); intervening changes are documentation and static website infrastructure, not evaluator runtime or core test changes. Actual push-triggered [Core CI 45664302113](https://github.com/ops-universe/evalOps/actions/runs/45664302113) passed: 75 core tests, 0 failures/skips (job 139382153143), synthetic enterprise benchmark, multi-suite baseline/gate exercise, failing-gate exit check, website audit/build and browser dashboard interactions (job 139382152571). [Pages 45664302395](https://github.com/ops-universe/evalOps/actions/runs/45664302395) passed build, deploy and all three public documentation routes. Root and website audits reported zero vulnerabilities in the observed logs. Scope remains offline synthetic evidence, trusted local roots and injected adapters, unsigned reports, cooperative cancellation and no verified live-provider compatibility or runtime authorization. This is not release authorization.

Open contributor [PR #20](https://github.com/ops-universe/evalOps/pull/20), head 12387b909a81577c7da63854bdfc68684e62894e, is an additional onboarding regression test for #16. Its two PR workflows returned action_required with no jobs/checks; do not merge or claim the contributor test passed until authorized workflow approval and exact-head results exist. Main's existing test baseline passed independently. Final repository closeout remains pending this documentation reconciliation and resolution of the open PR gate. No new feature work or release is authorized.
