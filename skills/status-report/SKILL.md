---
name: status-report
description: >
  Post a structured status update to Slack with What I Did / What's Left /
  Security Status / What Needs Your Call — four sections, nothing else.
---

Gather the following before composing your reply:
1. **Tasks completed** since the last status report (check your memory or the task list)
2. **Tasks remaining** with rough estimates
3. **Any decision** that requires human input before proceeding
4. **Security status** — check the latest CI run result (HIGH/CRITICAL count, or "clean").
   If CI has not run yet, state: "CI pipeline not yet triggered."

Reply in exactly four labelled sections (bold headers):

**What I Did**
List completed tasks as bullet points. Include the model used if known.

**What's Left**
List remaining tasks with priority order. Flag blockers.

**Security Status**
One line: either "✅ Clean — no HIGH/CRITICAL findings" or "⚠️ X HIGH, Y CRITICAL findings — see <artifact link>".

**What Needs Your Call**
List any decisions you cannot make without human approval. If none, write "Nothing blocking — proceeding autonomously."

---
Post this to #sprint-main. Tag @Mehul if approval is needed.
