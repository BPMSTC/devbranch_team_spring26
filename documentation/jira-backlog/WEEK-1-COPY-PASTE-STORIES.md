# Week 1 Jira Stories – Copy & Paste Ready

---

## Story 1: Dialog Replay and Backward Navigation
**Points:** 3 | **Done**

**Summary:** [Dialog] Players can replay from start or go back one beat

As a **player**, I want to **replay/rewind dialog** so that **I can re-read missed information**.

**Acceptance Criteria:**
- [ ] Previous button moves back one beat
- [ ] Previous button disabled at beat 0
- [ ] Replay button returns to first beat
- [ ] No state corruption on replay

**Technical:** Added `previousBeat()` and `replayDialog()` to `ScriptedSceneComponent`

**Test:** Manual nav test; verify button states at edges

---

## Story 2: Keyboard and Touch Gesture Navigation
**Points:** 5 | **Done**

**Summary:** [Dialog] Players navigate using keyboard shortcuts and touch swipes

As a **player on desktop or mobile**, I want to **control dialogs via keyboard and swipes** so that **I can navigate without clicking**.

**Acceptance Criteria:**
- [ ] Arrow Left/Right, Space, Enter navigate beats
- [ ] R replays from start; Esc skips scene
- [ ] Swipe left = next, swipe right = previous
- [ ] 40px minimum swipe distance (avoids accidental triggers)
- [ ] Vertical swipes don't trigger navigation
- [ ] Help text documents all controls

**Technical:** Keyboard listeners (@HostListener), touch handlers on scene-content

**Test:** Desktop shortcuts; mobile swipes on real device

---

## Story 3: Fixed-Position Dialog Buttons
**Points:** 3 | **Done**

**Summary:** [UI] Dialog action buttons stay fixed while content changes

As a **player**, I want **dialog buttons to stay in one spot** so that **I don't hunt for them as text changes** (like a slideshow).

**Acceptance Criteria:**
- [ ] Buttons fixed at screen bottom across all beats
- [ ] Dialog text flexes; buttons don't move
- [ ] Centered horizontally with consistent vertical position
- [ ] No overlap between text and buttons (all viewports)
- [ ] Responsive on mobile (≤768px) and desktop (1920px)

**Technical:** Flexbox layout with absolute positioning; tested at 375px, 768px, 1920px

**Test:** Navigate beats; resize viewport; manual mobile test

---

## Task: Jira Backlog Documentation
**Points:** 5 | **Done**

**Summary:** [Process] Establish Jira governance templates and standards

**Deliverables:** 8 markdown files in `documentation/jira-backlog/`
- README.md (index & orientation)
- 01-backlog-governance.md (ownership, DoR/DoD, cadence)
- 02-epic-template.md (business value, scope)
- 03-user-story-template.md (AC, test plan)
- 04-prioritization-model.md (WSJF scoring)
- 05-sprint-planning-and-capacity.md (capacity model)
- 06-jira-workflow-and-statuses.md (status transitions)
- 07-release-readiness-checklist.md (launch checklist)

**Outcome:** Team has single source of truth for Jira standards + templates for onboarding

---

## Week 1 Summary
| Item | Points | Status |
|------|--------|--------|
| Dialog Replay & Backward Nav | 3 | ✅ |
| Keyboard & Touch Gestures | 5 | ✅ |
| Fixed-Position Buttons | 3 | ✅ |
| Jira Documentation | 5 | ✅ |
| **Total** | **16** | **✅ Complete** |

**Results:** 4 items, 0 blockers, 0 bugs

**Next:** Deploy to staging → get team feedback → refine templates
