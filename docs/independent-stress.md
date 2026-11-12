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

Per-recording counts, packet losses, settings, source hashes, and limitations are in `independent-stress-results.json` (schema version 2). The legacy `eligible_fraction_among_reported` omits entirely missing windows and must not be presented as overall coverage. The new `coverage` object uses an externally specified expected domain instead, as described below.

## Reproduce

```sh
node --test tests/stress.test.mjs
node scripts/stress-evaluate.mjs
npm run automate
```

The diagnostic suite records failures without tuning the detector or setting a performance pass threshold. Existing clean-fixture regression gates remain in force. Next: review the generator/truth contract, then prespecify coverage-aware event metrics and hold out new parameters before testing detector changes. No hardware, clinical, causal, or field validation was performed.

Validation: all 29 core/API/challenge/generator/coverage tests passed; all existing 1,260 sensitivity analyses passed their software regression gates; the 100 new diagnostic recordings completed with the shortcomings above retained. Browser checks and a hosted deployment are unnecessary for this evaluation-only branch; runtime/UI files were not changed.

## Expected-domain coverage accounting

`research/coverage.mjs` builds its denominator from the generator's complete pre-loss device/time/cell schedule, never from packets that arrived. It distinguishes eligible flagged, eligible unflagged, insufficient-evidence, and unreported cell/windows. Empty or no-positive denominators yield null rates, not reassuring zeros. Mismatched cell sizes, duplicate slots, and report/truth windows outside the declared domain reject rather than silently changing the denominator.

For the 140 constructed shared-event truth windows, 100 had the minimum number of eligible devices: 75 were flagged and 25 were eligible but unflagged. The other 40 lacked sufficient eligible evidence. Under packet loss, 75 truth windows were eligible: 59 were flagged, 16 were eligible but unflagged, and 65 lacked sufficient eligible evidence. No wholly unreported windows occurred in this particular seed cohort; a separate silent-cell test verifies that those windows still count when present.

Event coverage is eligible truth windows divided by all truth windows. Unconditional event recall uses all truth windows; eligible-only recall uses only eligible truth windows. Their denominators must remain visible. A missing or ineligible window is not called normal, and this research-only state accounting does not change the production detector.

This denominator is possible because the simulation provides a known schedule. A real deployment would need a separately justified enrollment/observation schedule and geometry; received packets cannot reveal every absent cell or device. The evaluator does not invent that information or claim calibrated abstention, physiological validity, or safe conditions.
