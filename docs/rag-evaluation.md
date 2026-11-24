# RAG evaluation
Use evaluateRag(dataset, {k, minRecall, minCitationAccuracy}) from src/rag.mjs.
Precision uses denominator K, recall uses labeled relevant IDs, reciprocal rank and binary nDCG are truncated at K. Context relevance is the fraction of returned top-K IDs labeled relevant. Duplicate IDs and empty ground truth are rejected. Citation verification checks exact nonempty quote containment in supplied top-K documents, not semantic entailment or completeness. The explicit groundedness scorer interface is a trusted caller-supplied function; it makes no implicit network calls and is not included in deterministic gates. Reports omit document text and quotes and include hashes for reproducibility, not authenticity. Absolute gates are per-case recall and citation accuracy. Baseline comparison and CLI remain pending.

## Alternatives
- https://www.promptfoo.dev/docs/guides/evaluate-rag/ — assertions and regression.
- https://deepeval.com/docs/metrics-contextual-precision — judge-based context ranking.
- https://docs.ragas.io/en/latest/concepts/metrics/available_metrics/ — retrieval and faithfulness.
- https://mlflow.org/docs/latest/genai/eval-monitor/scorers/llm-judge/rag/ — trace-based judges.
Decision: dependency-free Node metrics on labeled IDs, with explicitly injected semantic scoring rather than mandatory models. This is a smaller scope than those frameworks.
