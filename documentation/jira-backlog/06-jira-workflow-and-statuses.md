# Jira Workflow and Statuses

## Recommended Status Flow

1. **Backlog**
2. **Ready for Refinement**
3. **Refined**
4. **Ready for Sprint**
5. **In Progress**
6. **In Review**
7. **In QA**
8. **Done**

## Transition Rules

- `Backlog -> Ready for Refinement`
  - Trigger: candidate for near-term prioritization.
- `Refined -> Ready for Sprint`
  - Trigger: passes Definition of Ready.
- `In Progress -> In Review`
  - Trigger: implementation complete, tests pass locally.
- `In Review -> In QA`
  - Trigger: code review approved.
- `In QA -> Done`
  - Trigger: acceptance criteria verified.

## Blocked State Handling

- Use a `Blocked` label (or dedicated status, if preferred).
- Every blocked ticket must include:
  - blocker description,
  - owner,
  - expected unblock date.

## Jira Hygiene Standards

- Keep descriptions outcome-oriented and current.
- Link related issues (blocks/is blocked by/relates to).
- Update estimates when scope changes materially.
- Add comment on every meaningful status transition.

## SLA Suggestions (Internal)

- Review feedback: within 1 business day.
- QA handoff response: within 1 business day.
- Blocked ticket escalation: within 24 hours.
