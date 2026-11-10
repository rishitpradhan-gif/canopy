# Analysis-stack review and execution record

Reviewed November 9, 2026. “Consultation” here means primary-documentation review plus actual local execution where stated. No external LLM providers, model councils, paid APIs, or independent AI-agent reviews were used.

## Executed locally

- [scikit-learn](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html): Isolation Forest and one-class SVM. These supply general point-anomaly baselines, not evidence of a shared environmental cause.
- [PyOD](https://pyod.readthedocs.io/en/latest/): ECOD as a distribution-based point-anomaly baseline.
- [River](https://riverml.xyz/latest/api/anomaly/HalfSpaceTrees/): half-space trees trained on baseline and frozen during testing. River specifically cautions that this method struggles with anomalies packed into windows, which matters for persistent events.
- [ruptures](https://centre-borelli.github.io/ruptures-docs/): offline binary segmentation on an aggregate residual trace, with two breakpoints forced. It uses the full recording and is not an online detector.

`research/compare.py` runs five point rules (including Canopy's simple residual threshold) and one offline segmentation approach across 15 synthetic recordings with seeds 201–203. Versions, raw counts, settings, and limitations are in `docs/stack-comparison.json`; exact installed packages are recorded in `research/requirements-lock.txt`. These exploratory counts do not establish superiority: point-vs-group tasks, one-vs-two-sided anomalies, frozen models, and reused training/calibration data differ. No numerical leaderboard is presented.

## Reviewed for later work, not executed or integrated

- [DoWhy](https://www.pywhy.org/dowhy/v0.11/user_guide/intro.html): explicit causal assumptions, identification, and refutation. Candidate only after an appropriate causal model and measurements exist; an anomaly ensemble cannot substitute for identification.
- [MLflow](https://www.mlflow.org/docs/latest/tracking/): experiment/run tracking. Current compact reports use source hashes and reproducible seeds; a separate tracking service is not yet necessary.
- [Evidently](https://docs-old.evidentlyai.com/presets/data-drift): reference/current distribution drift reporting. The reviewed documentation is an older version; no current API integration or executed comparison is claimed.

These bring the reviewed scope to seven stacks, with four actually exercised. The distinction matters: reading a library's documentation is not evidence that it was run or that its methods improve Canopy.

## Production decision

Model disagreement can identify questions to investigate, but averaging several anomaly models cannot resolve a shared confounder. Canopy currently retains its transparent baseline and reports how its conclusions vary under prespecified choices. Adding a model to production requires a defined task, hold-out evaluation, failure analysis, and an improvement beyond complexity alone.

The intended product distinction is a recomputable evidence packet: which devices voted, which inputs were excluded, which assumptions matter, which perturbations break the conclusion, and which explanations remain unresolved. This is a product hypothesis, not a claim of algorithmic novelty or market exclusivity.
