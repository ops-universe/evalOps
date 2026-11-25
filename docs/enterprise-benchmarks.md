# Synthetic enterprise FDE benchmarks
All data, workflows and labels are fictional. No customer, live model, production deployment or measured business impact is implied.

| Scenario | Stakeholder requirement | Evaluation and negative path |
|---|---|---|
| Supplier onboarding | Procurement needs tax-ID validation and explicit approval before writes. | Expected lookup/validation trace; missing approval must not trigger approve. |
| Enterprise knowledge | Compliance needs source-linked policy answers. | Labeled retrieval and exact citation verification; invented retention period fails. |
| Governed support | Support lead needs a draft and approval before financial action. | Expected lookup/draft; unauthorized refund fails. |

Integration: map actual recorded calls or retrieved document IDs and citations into the versioned dataset contracts. Keep the enforcement system separate: evalOps detects deviations in evidence, it does not authorize or execute actions. Run `node examples/enterprise/run.mjs --out enterprise.json` from the repository root. Exit 0 means positive fixtures passed and deliberately adversarial fixtures failed, not measured model accuracy. Review datasets and baselines independently before deployment. Use regression results and failed-case evidence to investigate and revise the integration; monitor production separately. No live provider compatibility verified.
