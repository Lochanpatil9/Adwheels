# /review — Run Code Reviewer
Triggers: code-reviewer agent
Use after: writing any new code
```
/review [file path or feature name]
```

---

# /debug — Run Debugger
Triggers: debugger agent
Use when: something is broken
```
/debug [describe the bug + error message]
```

---

# /test — Run Test Writer
Triggers: test-writer agent
Use after: completing a feature
```
/test [feature or file to write tests for]
```

---

# /audit — Run Security Auditor
Triggers: security-auditor agent
Use before: pushing auth/payment/DB changes to main
```
/audit [what changed]
```

---

# /ui — Run UI/UX Designer
Triggers: ui-ux-designer agent
Use for: any new UI component or page
```
/ui [describe the component/page needed]
```
