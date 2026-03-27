# /orchestrate — AdWheels Task Command

## Usage
```
/orchestrate [describe your task]
```

## What happens when you run this
The Orchestrator agent will:
1. **Bootstrap** — Read `CLAUDE.md` + all 5 agent files first (one time, upfront)
2. **Confirm** — Print "✅ Bootstrap complete" before touching the task
3. **Understand** — Parse the task with full project context already loaded
4. **Plan** — Break into sub-tasks
5. **Delegate** — Assign to the right agents in order
6. **Return** — Full plan + output from each agent

## Examples
```
/orchestrate Build the in-app notification bell with unread count for advertiser dashboard
/orchestrate Add WhatsApp notification when a driver is assigned to a campaign
/orchestrate Fix the bug where campaigns stuck in paid status aren't going active
/orchestrate Add campaign renewal feature for expired campaigns
/orchestrate Build admin revenue analytics page
/orchestrate Add driver rating system after campaign completes
```

## Agent Order (default)
1. ui-ux-designer (if frontend work)
2. code-reviewer (always after code)
3. security-auditor (if auth/payment/DB touched)
4. test-writer (after feature complete)
5. debugger (if something breaks)

## Why bootstrap matters
By reading all files upfront, Opus has:
- Full DB schema in context
- All design system tokens memorized
- All strict rules loaded (pricing locked, no CSS files, etc.)
- Every agent's checklist ready to apply
...so it never needs to ask clarifying questions about the project.

