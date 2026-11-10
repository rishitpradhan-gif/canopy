# Canopy recording protocol, version 1

One JSON object with `schema: "canopy/1"`, optional descriptive metadata, and a nonempty `samples` array. Unknown sample fields are ignored. Required fields:

- `device`: pseudonymous identifier, 1–40 ASCII word/hyphen characters. At most 1,000 distinct devices.
- `seq`: nonnegative safe integer. Increments per device. Sequence gaps are counted between observed sequence numbers; initial/trailing losses cannot be inferred.
- `t_s`: seconds since session origin, 0–1e9. Must not decrease as a device's sequence increases. Separate sessions after device clock resets.
- `x_m`, `y_m`: local Cartesian coordinates in metres, each within ±1e6. All devices must share an origin and clock; Canopy does not synchronize them for you.
- `hr_bpm`: finite number in [20,260]. These are schema bounds, not healthy ranges.
- `activity`: normalized measured activity in [0,1]. Choose a consistent derivation for your device; no conversion from acceleration is included.
- `ambient_c`: measured ambient temperature in [-50,80] °C. Do not substitute estimated core temperature.
- `quality`: device-specific quality indicator in [0,1]. The current cutoff is a heuristic; it is not vendor-calibrated.

```json
{"schema":"canopy/1","samples":[{"device":"W001","seq":0,"t_s":0,"x_m":10,"y_m":15,"hr_bpm":87.2,"activity":0.48,"ambient_c":23.1,"quality":0.96}]}
```

This single-sample illustration passes basic schema validation but cannot support baseline fitting or an event decision. A representative 120-second baseline with at least 12 high-quality packets spanning at least 72 seconds is needed per device at defaults. Each device must contribute at least two supported samples to a decision window.

Exact duplicate `(device,seq)` packets are ignored and counted. Conflicting duplicates, non-finite values, invalid bounds, and backward device clocks reject the entire recording. Imported arrival order can differ from sequence order and is counted. A sequence number is treated as an identity, not a transport acknowledgement.

An experiment capsule is `{"schema":"canopy-capsule/1","dataset":...,"settings":...,"report":...}`. The report includes algorithm version and quality counters. Import recomputes it. A capsule has no signature, tamper-evident ledger, or clinical provenance. Metadata including `provenance.kind` is self-declared. Preserve original files separately for research audit requirements.
