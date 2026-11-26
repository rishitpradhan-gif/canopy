# Canopy autonomous development checkpoint

Current direction: an evidence compiler for shared wearable-network findings. The product should expose sensitivity, confounding, and needed measurements, not convert physiological anomalies into confident causal or health claims.

The owner requested a daily development run. A native app heartbeat named **Develop Canopy** is active for 9 AM in the owner's Pacific timezone. This file is a project checkpoint, not the scheduler. The app's automation controls own the schedule. Runs depend on the app's execution environment and permissions; no uninterrupted external compute service is provisioned.

## Automation to run first

```sh
npm run automate
```

On this review branch this discovers all test modules (51 tests currently), runs 140 seeded recordings × nine analyses, then writes a separate 100-recording nonlinear stress evaluation. Reports include source hashes, settings, seeds, outcomes, and explicit clean-fixture regression gates. Failed gates must block release; preserve the failure report. The stress results are diagnostic, without a performance pass threshold. Run the Chrome test when browser-facing behavior changes. A preview on port 4435 is needed for that test; stop owned previews afterward.

The optional scientific environment can be recreated with Python 3.12+ in a disposable environment, installing `research/requirements-lock.txt`, then running `python research/compare.py`. Do not add those packages to the zero-dependency runtime. Four library stacks are exercised, not external language models. `docs/stack-comparison.json` describes the incompatible objectives and limits of their exploratory scores.

## Next bounded work

1. Review `research/stress-generator.mjs` and `docs/independent-stress.md`: a separate nonlinear/lagged/AR-noise generator and 100-recording evaluation now expose missed events and nuisance flags. Preserve these cases before testing detector changes. This scientific change is on a review branch and has not been deployed. The older sensitivity suite retains the original narrow generator.
2. The expected-domain coverage evaluator now rejects impossible eligibility counts above distinct scheduled devices, nonboolean detection states, malformed coordinates, and invalid settings. This checks structural consistency, not the authenticity of a supplied schedule. Review the expected-domain coverage evaluator in research/coverage.mjs. It now retains completely silent cells in the denominator and partitions misses into insufficient eligible evidence versus eligible-but-unflagged events. See docs/independent-stress.md. Research-only one-to-one spatial/temporal window matching is now available in research/window-matching.mjs, with post-hoc diagnostic sensitivities retained separately from unchanged exact metrics. Next prespecify a genuinely held-out cohort and metrics before comparing group-level alternatives; current Python metrics remain pointwise, not a Canopy leaderboard.
3. Test an overlapping-neighborhood alternative on held-out cell-boundary cases without weakening false-alarm checks.
4. Add a device-export adapter only after the owner identifies an actual device/data format. No physical hardware is connected yet.
5. Design an experiment-selection feature that states which independent measurement could distinguish competing explanations. Do not claim causal identification from quorum or sensitivity stability.

Source repo: rishitpradhan-gif/canopy. Hosted preview retains owner-only sharing. Prepare supported Sites source workflow before source edits, package tested state, and deploy the matching commit. Prefer a review branch for scientific/architectural changes. Do not publish personal data, start human studies, call paid APIs, or alter permissions. Keep a clear distinction between completed software, simulation findings, documentation review, and unvalidated research hypotheses.

## 2026-11-15 validation hardening

Coverage previously accepted sparse two-coordinate arrays because `Array.every` skips holes. Matching malformed schedule/report/truth cells could therefore produce plausible coverage. Finite timestamps and widths could also overflow window arithmetic and emit nonfinite window starts. Both cases were reproduced with failing regression tests before the fix; the fixtures remain in `tests/coverage.test.mjs`. Required coordinates are now checked explicitly and nonfinite derived window starts reject. This is evaluator input validation, not schedule authentication or a detector performance improvement. Existing synthetic failures remain retained. Browser/runtime assets are unchanged; no preview deployment is needed for this research-only change.

## 2026-11-16 pipeline execution status

`npm run automate` now writes `docs/pipeline-status.json` as running before launching the existing evaluation pipeline, then atomically replaces it with passed or failed. Check this status before interpreting older scientific reports: those reports can remain from an earlier successful invocation when a new run fails. Failure output, exit code, signal, and launch/timeout errors are retained in individually named `docs/pipeline-failures/*.json` files, even after recovery. These local diagnostic archives are gitignored because future error output may contain local paths or data; review before sharing. The latest status is checked in for this synthetic run.

The runner requests termination after ten minutes and limits output capture to 4 MiB per stream; overflow fails the run. Forced wrapper termination can leave status running, which is explicitly not success. Run one pipeline at a time per checkout; the latest-status path is not a concurrent-run coordinator. Tests execute deliberate nonzero exits, missing commands, timeout, and recovery in temporary directories. This adds execution reliability, not new detector evidence. No browser assets changed and no preview deployment is required.

## 2026-11-17 release diagnostic isolation

A synthetic packaging regression reproduced that the archive builder recursively included gitignored `docs/pipeline-failures/` files and the latest pipeline status. Those execution logs can contain local paths or future user data even though the scientific reports are synthetic. The builder now excludes failure archives, pipeline execution status, hidden files and Python bytecode; the archive verifier independently rejects local diagnostics and hidden entries. Seeded scientific reports and executable tests remain included. The retained packaging regression uses a temporary directory with synthetic marker files, not personal data. This prevents a future diagnostic disclosure; no real user-data leak was demonstrated.

The core detector and browser assets are unchanged. Validation passed: all 48 core/API/research/packaging tests, 140 seeded recordings × nine analyses, the separate 100-recording stress evaluation, and extracted-toolkit CLI/challenge/server checks. The existing synthetic misses and nuisance flags are unchanged. No hosted deployment is required for this review-branch packaging change; owner-only sharing remains unchanged.

## 2026-11-19 symbolic-link release isolation

A retained synthetic regression reproduced a bypass of diagnostic exclusions: a regular-looking symlink in docs could point to an excluded pipeline failure file, and ZipFile.write followed it. The package builder now excludes symlinks and paths under symlinked ancestors. Required root files must be regular, nonsymlink inputs; that check occurs before opening the output archive, so invalid required inputs preserve the existing download. Tests include an aliased diagnostic, an aliased directory and a symlinked required README. Only synthetic marker files were used; no actual disclosure was demonstrated.

The detector and browser interface are unchanged. Existing nonlinear misses and correlated-drift flags remain diagnostic failures, not physical validation. The local toolkit was rebuilt and checked after the core/API/evaluation pipeline. No hosted preview or sharing change is appropriate for this packaging-only review-branch improvement.

## 2026-11-20 interrupted release rebuilds

The archive builder now writes to a temporary sibling and replaces the download only after the ZIP closes successfully. A retained regression injects an OSError on the second archive entry after one entry has already been written; the previous archive and checksum survive unchanged and the temporary file is removed. This covers ordinary build exceptions, not power-loss durability or an atomic transaction across the archive and separate checksum file. The checksum is still written after archive replacement; consumers must verify it and retry a mismatched pair during a rebuild.

Validation: the 48 core/API/research/packaging tests and 140 seeded recordings × nine analyses passed, with the separate 100-recording nonlinear stress report retaining its missed events and nuisance flags. Detector and browser files are unchanged; no browser rerun or hosted preview update is needed. This is release reliability work, not biological or field validation.


## 2026-11-24 sparse matching-coordinate rejection

A retained failing regression reproduced that the research-only window matcher accepted sparse two-coordinate arrays: Array.every skips holes. A malformed detected or truth cell could then be reported as an ordinary unmatched window, silently affecting FP/FN counts instead of rejecting an invalid evaluation input. Both required coordinates are now checked explicitly. Tests retain empty sparse cells and missing-first/missing-second coordinates on each matching side. This is the corresponding matcher fix to the earlier coverage-validator hardening, not a detector change or improved sensitivity claim.

Validation: all 49 core/API/research/packaging tests, 140 seeded recordings × nine analyses and the separate 100-recording nonlinear stress evaluation passed their existing execution/regression gates. Previously observed misses and nuisance flags remain retained; the stress evaluation remains diagnostic without a performance threshold. The downloadable toolkit was rebuilt and verified. Browser and detector assets are unchanged, so no browser rerun, hosted preview deployment or sharing change is needed. All recordings are synthetic; no physical-device, clinical or causal validation was performed.


## 2026-11-25 verification-source provenance

The pipeline report previously recorded `tests_passed` without identifying the test sources that produced that claim. Its source manifest now hashes every discovered test module, the stress generator/evaluators, package metadata, and the execution/reporting scripts in addition to detector/evidence sources. A separate `verification` object lists the discovered test paths and file count. Hash keys are sorted and duplicates removed; a missing source fails rather than producing an incomplete manifest. The retained regression checks exact bytes, stable ordering, changed assertion content, unchanged neighboring files, and missing inputs.

These are hashes of checkout files when the manifest is collected, not a signed execution attestation, immutable checkout snapshot or complete environment lock. Do not edit sources during a run. The generated reports still distinguish passed clean-fixture gates from diagnostic nonlinear failures. This adds traceability, not detector performance or physical validation. No browser assets changed; the existing private preview needs no update. Rebuild and verify the download after the pipeline so the new helper and tests are available for replay.


## 2026-11-26 evaluation source-drift guard

Verification-source hashes are now captured before tests and evaluation, then compared before writing the sensitivity report and after the separate stress run. Persistent changes or removal of a recorded source fail the pipeline rather than silently labeling replacement code as the code that passed. A retained temporary-file regression checks an unchanged source, changed assertions and deletion. This guards recorded source files only: it is not an immutable filesystem snapshot, a signature, or detection of transient edits restored between checks. Do not edit the checkout while running evaluations. Reports written before a late failure may remain; `docs/pipeline-status.json` remains the authority on overall execution success.

No detector or browser code changed. Existing nonlinear misses and nuisance flags remain diagnostic simulation findings, not physical validation. No hosted preview or sharing update is appropriate for this execution-integrity change. The prior local provenance commit was preserved after its stalled push; any delivery retry must be bounded and must not claim success without confirmation.
