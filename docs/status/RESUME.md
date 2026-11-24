# Resume checkpoint
Last verified main SHA: f40ef5fe4a5754ec7fc93ad1e4944331798399bf
Current phase: 5 (RAG).
Phase 4 evidence: https://github.com/ops-universe/evalOps/actions/runs/45454078122
Phase 5 branch: feat/rag-evaluation. PR/CI pending at authoring time.
Reproduce: npm ci && npm test; cd website-react && npm ci && npm run build.
Next: verify exact PR head CI, then add RAG CLI and baseline regression comparison before Phase 6. No known live-provider verification.
