# Shift: portfolio build pack for Kiro

This folder is phase 2 (build) of Yashvardhan Sonegara's portfolio. Phase 1 (design) was done on a Claude design canvas. Everything Kiro needs is in here.

## What's inside
```
.kiro/steering/product.md      what the site is, the real gearbox data, content rules
.kiro/steering/tech.md         stack (plain HTML/CSS/JS), colours, type, quality bar
.kiro/steering/structure.md    file layout and conventions
.kiro/specs/portfolio-site/
    requirements.md            what to build, in EARS form (WHEN … THE SYSTEM SHALL …)
    design.md                  how: architecture, ready-made gear code, layout rules
    tasks.md                   the step-by-step build plan Kiro runs
design-reference/              the approved design as static HTML; open these in a browser
PROMPTS.md                     how to ask Kiro for changes so you get what you mean
```

## How to use it
1. Unzip this folder and open it in Kiro (File › Open Folder).
2. Kiro loads the steering files automatically. Open `.kiro/specs/portfolio-site/tasks.md`.
3. Click **Start task** next to task 1, review what Kiro writes, then move to the next task.
4. Open `index.html` in a browser after each task and compare it with `design-reference/`.
5. Put your photos in `assets/img/` and ask Kiro to swap them in for the bracketed placeholders.

The design references load their fonts from Google, so you need internet for them to look right.
