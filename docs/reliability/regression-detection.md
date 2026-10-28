# Regression Detection

Regression detection compares an active evaluation run against a designated baseline run to identify behavioral degradation.

## Comparison Metrics

- **Score Delta**: $\Delta = \text{Score}_{\text{current}} - \text{Score}_{\text{baseline}}$
- **Regression Flag**: Flagged as `true` if $\Delta < 0$ or if $\text{New Failures} > 0$.
- **New Failures**: Failures present in the current run that did not exist in the baseline.
