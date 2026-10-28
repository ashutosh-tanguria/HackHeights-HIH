# Reliability Scoring & Metrics

OOSC computes reliability metrics across individual test runs and aggregate agent histories.

## Reliability Score Formula

$$\text{Reliability Score} = \begin{cases} \frac{\text{Passed Tests}}{\text{Total Tests}} \times 100 & \text{if Total Tests} > 0 \\ 0 & \text{otherwise} \end{cases}$$

## Aggregation Levels

1. **Test Run Level**: Score calculated from evaluation result (0–100%).
2. **Agent Level**: Cumulative reliability score across all executed runs for that agent.
3. **Global Level**: System-wide score across all active agents and historical test runs.
