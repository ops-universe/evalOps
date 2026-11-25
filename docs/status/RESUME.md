# Resume checkpoint
Last verified main SHA: 392c6c0199a31450b96267de778df0f8222bd841
Phase 6a PR #7 merged; exact-head CI https://github.com/ops-universe/evalOps/actions/runs/45461435398
Phase 6b branch feat/agent-cli-schema; CI pending at authoring time.
Verify: npm ci && npm test; node src/cli.mjs agent-run datasets/agent-synthetic.json; cd website-react && npm ci && npm run build.
Next: verify and merge eligible PR, then implement reusable CI gate and baseline management.
