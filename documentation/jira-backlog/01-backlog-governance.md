# Backlog Governance

## Purpose

Establish a predictable and transparent process for maintaining a healthy Jira backlog that supports delivery outcomes.

## Ownership

- **Product Owner**: Prioritization authority and scope decisions.
- **Engineering Lead**: Technical feasibility, sequencing, and risk input.
- **Delivery Team**: Story clarification, estimation, and implementation feedback.

## Backlog Layers

- **Now**: Ready items for the next 1-2 sprints.
- **Next**: Refined and estimated candidates for upcoming sprints.
- **Later**: Unrefined ideas and strategic opportunities.

## Backlog Quality Gates

An item can move to **Now** only if all are true:

- Clear problem statement and expected outcome.
- Value articulation (user/business impact).
- Acceptance criteria defined.
- Dependencies identified.
- Size estimated by the team.
- No blocking ambiguity remains.

## Cadence

- **Weekly**: Backlog refinement (60-90 min).
- **Per Sprint**: Sprint planning and commitment.
- **Monthly**: Prioritization reset against strategic goals.
- **Quarterly**: Epic audit and roadmap alignment.

## Ticket Naming Standards

- **Epic**: `[Domain] Outcome-oriented title`
- **Story**: `[User/Capability] Action + Value`
- **Task**: Verb-led technical action
- **Bug**: `Observed issue + impact`

## Required Jira Fields (Minimum)

- Summary
- Description
- Issue Type
- Priority
- Estimate (story points or time)
- Acceptance Criteria
- Assignee (when scheduled)
- Labels / Component
- Target Sprint or Release

## Definition of Ready (DoR)

- User value is explicit.
- Scope is bounded.
- Acceptance criteria are testable.
- UX/API/technical constraints are noted.
- Item is estimable and estimated.

## Definition of Done (DoD)

- Code complete and peer-reviewed.
- Tests added/updated and passing.
- No critical bugs introduced.
- Documentation updated where needed.
- Acceptance criteria validated.
- Deployed to agreed environment.
