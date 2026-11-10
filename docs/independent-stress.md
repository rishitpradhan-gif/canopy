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

Per-recording counts, eligibility fractions, packet losses, settings, source hashes, and limitations are in `independent-stress-results.json`. Eligibility fractions are only among reported windows: entirely missing windows do not appear in that denominator. They must not be presented as overall observation coverage or abstention quality.

## Reproduce

```sh
node --test tests/stress.test.mjs
node scripts/stress-evaluate.mjs
npm run automate
```

The diagnostic suite records failures without tuning the detector or setting a performance pass threshold. Existing clean-fixture regression gates remain in force. Next: review the generator/truth contract, then prespecify coverage-aware event metrics and hold out new parameters before testing detector changes. No hardware, clinical, causal, or field validation was performed.

Validation: all 23 core/API/challenge/generator tests passed; all existing 1,260 sensitivity analyses passed their software regression gates; the 100 new diagnostic recordings completed with the shortcomings above retained. Browser checks and a hosted deployment are unnecessary for this evaluation-only branch; runtime/UI files were not changed.
