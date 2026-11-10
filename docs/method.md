# Transparent baseline and two elementary results

Canopy uses standard ingredients. The statements below describe this implementation; they are not claims of research novelty.

## Detector

Fit ordinary least squares `h = a + b u` separately for each device from the initial baseline: heart rate `h`, normalized activity `u`. Shift the fitted intercept by the median baseline residual. Set residual scale `s = max(3 bpm, 1.4826 × MAD)`. If baseline activity has no variance, slope is zero. OLS itself is not robust to contaminated baseline data.

Post-baseline readings with low quality or no supported model cannot vote. A device-window is also ineligible if activity extends outside its observed baseline range plus 0.05, or it has fewer than two readings in that cell/window. This is conservative but is not a calibrated uncertainty model.

Within fixed 50 m cells and non-overlapping 30-second windows, compute the median residual `(h-a-bu)/s` per device. Each eligible device casts one binary vote if its residual is at least 3. A flag requires `n >= m=3` eligible peers and `k/n >= q=0.6` positive votes. Therefore an ordinary flag can involve two positive votes among three eligible peers. It is never a p-value or confidence level.

Ambient temperature is reported as contextual change from each device's baseline. It does not gate the decision and does not identify the cause. The report's term `robust` means only that the binary flag survives removal of every individual eligible device under this fixed rule.

## Proposition 1: exact single-device-removal criterion

For a detected window with `n` eligible devices, `k > 0` positive votes, minimum `m`, and quorum `q`, the flag survives every single-device removal if and only if

\[
n-1 \ge m, \qquad k-1 \ge q(n-1).
\]

**Proof.** Removing a positive voter leaves `n-1` devices and `k-1` votes. Thus both inequalities are necessary. Removing a negative voter leaves `n-1` devices and `k` votes, which is at least `k-1`. If the inequalities hold, removal of either type meets both the minimum and quorum. This proves sufficiency. ∎

The implementation enumerates removals to retain an inspectable witness list. Four positive votes among four eligible devices survive any single removal at defaults. Three positive votes among three do not, because only two eligible devices remain. This guarantee says nothing about correlated failures or the truth of a causal attribution.

## Proposition 2: common-mode changes are not identified by residual agreement

Suppose residual observations follow `r_i(t) = e(t) + d_i(t)`, with environmental contribution `e` and device/person contribution `d_i`, with no restrictions on those components. For any function `c(t)`, define `e'(t)=e(t)+c(t)` and `d'_i(t)=d_i(t)-c(t)`. Then `e'(t)+d'_i(t)=r_i(t)` for every device and time.

**Proof.** Substitute the definitions; `c(t)` cancels. Hence the same residual observations admit different environmental contributions. No function of those residual observations alone can distinguish all such decompositions. ∎

This is a standard identifiability observation, not a novel impossibility theorem. Independent, trusted environmental measurements and a specified error/causal model may add identifying assumptions; Canopy does not establish them. Leave-one-out agreement is not proof of independent sensors, physiological strain, or environmental causation.

## Important implementation limits

- The baseline must be representative and clean. Linear activity adjustment omits lag, acclimatization, fitness, medication, humidity, and many other covariates.
- Fixed cells/windows create boundary and sampling-density effects. Two readings are not a duration-coverage guarantee, and shared clock errors can align unrelated changes.
- Report windows are retrospective. Replay displays only the last completed window; the full individual trace shows the full recording.
- There is no hypothesis-test calibration, multiple-testing correction, confidence interval, matched-control inference, or clinical threshold.
- Runtime is dominated by sorting, approximately `O(N log N)`; input, duplicate keys, and grouped samples are held in memory. It is not a streamed or distributed engine.
