# Test at larger scale without confusing scale with validity

## Shipped software checks

Core tests exercise shared events, workload changes, individual drift, correlated drift, packet loss, duplicate conflicts, malformed data, clock resets, activity extrapolation, and deterministic replay. API tests cover request boundaries. Chrome tests exercise the actual replay and import/export workflow. The full synthetic benchmark runs 700 recordings and scale probes up to 500,000 samples. See the committed JSON outputs.

## Next: broaden the synthetic model

Separate generator and detector assumptions. Add nonlinear and delayed activity responses, autocorrelated noise, temperature/HR response delays, uneven sampling, independent vs common-mode sensor faults, baseline contamination, cell-boundary sweeps, and asynchronous clocks. Hold out seeds and parameter ranges. Score event windows with prespecified spatial/temporal tolerances; report missed events, false alarms per device-hour, time to first completed-window detection, coverage, and worst-case subgroups. A seed sweep of the current narrow generator is not an independent test set.

## Then: instrument replay and bench tests

Choose one actual wearable/export format and one independent ambient sensor. Document units, timestamp origin, missingness, and quality semantics. Test a recording adapter against saved exports before live collection. Bench-test timestamp drift, packet retransmission, disconnect/reconnect, duplicate conflicts, and long-duration storage. Use environmental reference readings; do not infer that body-worn temperature equals ambient or core temperature.

Capture known electronic offsets on test signals. Compare shared-location events with synchronized device faults. The current engine must be allowed to abstain when those explanations cannot be separated. Add SQLite/columnar storage and bounded streaming ingestion before claiming long-lived production service.

## Finally: appropriately supervised human research

Begin with ordinary, non-hazardous conditions and informed consent, data minimization, pseudonyms, restricted access, and a defined retention/deletion process. Obtain applicable institutional review and qualified scientific guidance before physiological research. Do not induce heat strain or use this prototype to make health, employment, readiness, or operational safety decisions.

Prespecify the analysis and ground truth; hold out participants and sessions. Compare against simple baselines and an environmental-sensor-only model. Evaluate generalization, uncertainty, subgroup coverage, and failure-to-detect behavior. Hardware validation, clinical validity, network-scale reliability, and useful product differentiation each require separate evidence.
