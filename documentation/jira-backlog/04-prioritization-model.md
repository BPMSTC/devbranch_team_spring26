# Prioritization Model

Use a lightweight **WSJF-inspired score** to rank backlog items consistently.

## Scoring Formula

`Priority Score = (Business Value + Time Criticality + Risk Reduction) / Job Size`

## Score Definitions

### Benefit Factors (1-5 each)

- **Business Value**: Revenue, retention, compliance, or strategic impact.
- **Time Criticality**: Urgency due to deadlines, market timing, or incidents.
- **Risk Reduction**: Reduces future incidents/tech risk or unlocks opportunities.

### Job Size (1, 2, 3, 5, 8, 13)

- Team-estimated relative effort.

## Prioritization Tiers

- **Tier 1 (Top Priority)**: Score >= 2.0
- **Tier 2 (Important)**: Score 1.2-1.99
- **Tier 3 (Planned)**: Score 0.7-1.19
- **Tier 4 (Backlog)**: Score < 0.7

## Tie-Breaker Rules

When scores are close, prioritize by:

1. Compliance/security commitments
2. Customer-facing impact
3. Dependency unblock potential
4. Lower delivery risk

## Review Cadence

- Re-score major items monthly.
- Re-score immediately after major incident, policy change, or strategy shift.

## Jira Implementation Tips

- Add custom numeric fields for each factor.
- Auto-calculate in automation (or maintain manually).
- Display score on backlog board for transparent ordering.
