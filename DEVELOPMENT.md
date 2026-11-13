# Canopy autonomous development checkpoint

Current direction: an evidence compiler for shared wearable-network findings. The product should expose sensitivity, confounding, and needed measurements, not convert physiological anomalies into confident causal or health claims.

The owner requested a daily development run. A native app heartbeat named **Develop Canopy** is active for 9 AM in the owner's Pacific timezone. This file is a project checkpoint, not the scheduler. The app's automation controls own the schedule. Runs depend on the app's execution environment and permissions; no uninterrupted external compute service is provisioned.

## Automation to run first

```sh
npm run automate
```

On this review branch this discovers all test modules (33 tests currently), runs 140 seeded recordings × nine analyses, then writes a separate 100-recording nonlinear stress evaluation. Reports include source hashes, settings, seeds, outcomes, and explicit clean-fixture regression gates. Failed gates must block release; preserve the failure report. The stress results are diagnostic, without a performance pass threshold. Run the Chrome test when browser-facing behavior changes. A preview on port 4435 is needed for that test; stop owned previews afterward.

The optional scientific environment can be recreated with Python 3.12+ in a disposable environment, installing `research/requirements-lock.txt`, then running `python research/compare.py`. Do not add those packages to the zero-dependency runtime. Four library stacks are exercised, not external language models. `docs/stack-comparison.json` describes the incompatible objectives and limits of their exploratory scores.

## Next bounded work

1. Review `research/stress-generator.mjs` and `docs/independent-stress.md`: a separate nonlinear/lagged/AR-noise generator and 100-recording evaluation now expose missed events and nuisance flags. Preserve these cases before testing detector changes. This scientific change is on a review branch and has not been deployed. The older sensitivity suite retains the original narrow generator.
2. The expected-domain coverage evaluator now rejects impossible eligibility counts above distinct scheduled devices, nonboolean detection states, malformed coordinates, and invalid settings. This checks structural consistency, not the authenticity of a supplied schedule. Review the expected-domain coverage evaluator in research/coverage.mjs. It now retains completely silent cells in the denominator and partitions misses into insufficient eligible evidence versus eligible-but-unflagged events. See docs/independent-stress.md. Next define spatial/temporal tolerance matching and hold-out metrics before comparing group-level alternatives; current Python metrics remain pointwise, not a Canopy leaderboard.
3. Test an overlapping-neighborhood alternative on held-out cell-boundary cases without weakening false-alarm checks.
4. Add a device-export adapter only after the owner identifies an actual device/data format. No physical hardware is connected yet.
5. Design an experiment-selection feature that states which independent measurement could distinguish competing explanations. Do not claim causal identification from quorum or sensitivity stability.

Source repo: rishitpradhan-gif/canopy. Hosted preview retains owner-only sharing. Prepare supported Sites source workflow before source edits, package tested state, and deploy the matching commit. Prefer a review branch for scientific/architectural changes. Do not publish personal data, start human studies, call paid APIs, or alter permissions. Keep a clear distinction between completed software, simulation findings, documentation review, and unvalidated research hypotheses.
