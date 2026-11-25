# Out-of-model stress evaluation: review candidate

This research branch changes evaluation only. The production detector, browser interface, and private hosted preview are unchanged. No new release is promoted from this work.

## What is different

`research/stress-generator.mjs` does not import the detector, its simulator, or its PRNG. It uses a separate xorshift generator, a quadratic activity-to-response relationship, device-specific first-order response delays, and AR(1) noise with Gaussian innovations. Five cases cover nonlinear ordinary behavior, synchronized lagged workload, a shared injected contribution, correlated instrument drift, and a shared event with packet loss.

This is independently implemented generator code, **not independent third-party scientific validation**. The selected dynamics and parameters are invented stress conditions, not a validated physiological model. The generator and evaluator were authored by the same development agent as the detector.

The activity-response state starts at its initial target to avoid an artificial all-device startup transient contaminating the baseline. The AR noise and event-response states start at zero. No detector parameter was tuned against the stress outcomes.

Ground truth is computed from the counterfactual event component before packet loss. A test verifies that removing all provenance leaves detector results unchanged. A truth-positive default cell/window requires event contribution of at least 8 bpm for at least half the full latent readings of at least 60% of the four assigned devices. Matching is exact at the default 30-second and 50-metre resolution. This definition is an engineering label, not a health threshold.

## Results across seeds 1001–1020

The unchanged detector recovered 75 of 140 constructed shared-event windows, missing 65. With packet loss it recovered 59 of 140 and missed 81. These counts use the specific synthetic truth/matching definition above, not real-world sensitivity estimates.

The nonlinear-null case produced no shared flags in twenty recordings. Synchronized lagged workload produced twelve flags across nine recordings without any injected physical contribution. Coordinated instrument drift produced 229 flags across all twenty recordings, despite no physical-event truth.

Canopy reports shared measurement changes, not environmental causes. These nuisance flags are **not proof that the program incorrectly claimed causation**. They demonstrate that interpreting a shared flag as a physical environmental event would be unsupported, and that clean linear-generator scores do not generalize to these invented dynamics.

Per-recording counts, packet losses, settings, source hashes, and limitations are in `independent-stress-results.json` (schema version 3). The legacy `eligible_fraction_among_reported` omits entirely missing windows and must not be presented as overall coverage. The new `coverage` object uses an externally specified expected domain instead, as described below.

## Reproduce

```sh
node --test tests/stress.test.mjs
node scripts/stress-evaluate.mjs
npm run automate
```

The diagnostic suite records failures without tuning the detector or setting a performance pass threshold. Existing clean-fixture regression gates remain in force. Next: review the generator/truth contract, then prespecify coverage-aware event metrics and hold out new parameters before testing detector changes. No hardware, clinical, causal, or field validation was performed.

Validation: all 41 core/API/challenge/generator/coverage/matching tests passed; all existing 1,260 sensitivity analyses passed their software regression gates; the 100 new diagnostic recordings completed with the shortcomings above retained. Browser checks and a hosted deployment are unnecessary for this evaluation-only branch; runtime/UI files were not changed.

## Expected-domain coverage accounting

`research/coverage.mjs` builds its denominator from the generator's complete pre-loss device/time/cell schedule, never from packets that arrived. It distinguishes eligible flagged, eligible unflagged, insufficient-evidence, and unreported cell/windows. Empty or no-positive denominators yield null rates, not reassuring zeros. Mismatched cell sizes, duplicate slots, and report/truth windows outside the declared domain reject rather than silently changing the denominator.

For the 140 constructed shared-event truth windows, 100 had the minimum number of eligible devices: 75 were flagged and 25 were eligible but unflagged. The other 40 lacked sufficient eligible evidence. Under packet loss, 75 truth windows were eligible: 59 were flagged, 16 were eligible but unflagged, and 65 lacked sufficient eligible evidence. No wholly unreported windows occurred in this particular seed cohort; a separate silent-cell test verifies that those windows still count when present.

Event coverage is eligible truth windows divided by all truth windows. Unconditional event recall uses all truth windows; eligible-only recall uses only eligible truth windows. Their denominators must remain visible. A missing or ineligible window is not called normal, and this research-only state accounting does not change the production detector.

This denominator is possible because the simulation provides a known schedule. A real deployment would need a separately justified enrollment/observation schedule and geometry; received packets cannot reveal every absent cell or device. The evaluator does not invent that information or claim calibrated abstention, physiological validity, or safe conditions.

## Coverage input hardening — November 13, 2026

The evaluator now rejects a reported eligible-device count larger than the distinct devices scheduled in that cell/window. Multiple expected readings from one device do not increase this upper bound. It also rejects truthy nonboolean detection values (including the string `false`), invalid window widths/quorum settings, malformed coordinates, and empty enrollment identities. Previously, structurally inconsistent reports could produce plausible coverage rates instead of failing explicitly. Four adversarial regression tests preserve these counterexamples.

This is evaluation input validation, not authentication of the schedule, proof of packet identity, or validation of clinical eligibility. A forged but internally consistent input remains possible. Rerunning the full synthetic pipeline leaves all per-recording numerical outcomes unchanged; the 65/81 missed shared-event windows and nuisance flags above remain in the diagnostic report. No detector, API, browser, downloadable runtime, or hosted-preview change is included.

## One-to-one tolerance diagnostics — November 14, 2026

`research/window-matching.mjs` adds maximum-cardinality bipartite matching between supplied flagged and truth-positive cell/windows. Each window is used at most once. Compatibility requires both absolute start-time displacement within the configured seconds and Euclidean grid-cell-center displacement within the configured metres. Defaults are exact matching. This is window matching, not aggregation into event episodes. Ties are deterministic under sorted coordinates; assignments are not optimized for minimum distance. Inputs reject duplicate/malformed windows, invalid tolerances, and arrays over 1,000 windows per side.

The augmenting-path implementation is checked against an independently written exhaustive assignment oracle on all 256 subset pairs of a four-cell grid. An adversarial two-flag geometry requires reassignment to avoid a greedy undercount. Tests also verify unique use of windows, inclusive spatial/temporal boundaries, original input indexes, permutation-invariant cardinality, empty-denominator nulls, and exact-metric parity across all five stress scenario types.

The report retains the original strict metrics and coverage unchanged, adding `flagged_windows`, `expected_truth_windows`, and three `tolerance_diagnostics` entries per recording. Settings are (0 seconds, 0 metres), (30 seconds, 0 metres), and (30 seconds, 50 metres), using the original 50-metre grid. Source hashes include the matcher. These are **post-hoc diagnostic sensitivities on already examined recordings**, not held-out estimates, a new detector, or an acceptance threshold. A separately prespecified hold-out cohort is still required before comparing alternatives.

Across this synthetic cohort, every tested setting yields the same 75 matches / 65 misses for the shared-event case and 59 matches / 81 misses with packet loss. The tested allowances recover no additional truth windows. Existing nuisance flags remain: 12 under lagged workload and 229 under correlated instrument drift. No detector parameters or production files changed. These findings do not identify the causes of missed or flagged physical events.

Coverage continues to describe eligibility at the original exact cell/window. Tolerant matches do not retroactively make a truth window eligible, change missing-data accounting, or establish physical localization accuracy. Adding allowable match edges can mechanically increase matched counts even with an unchanged detector; the exact baseline must stay visible. No hardware, clinical, causal, or field validation was performed. Browser checks and hosted/download updates are not applicable to this evaluation-only addition.
