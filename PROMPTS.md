# How to ask Kiro for changes

A good request names **what** (the element), **when** (the state or screen size) and **how** (the change, with a number). Vague requests get vague results.

| Vague | Good |
|---|---|
| "Make the button better" | "On hover, make the orange 'Shift into 2nd' button 12% brighter using `filter: brightness(1.12)`. Don't change its text colour." |
| "Fix the iPad" | "At 820px wide, the gear viewport and the shifter stack. Keep them side by side: both are flex items, so add `box-sizing: border-box`." |
| "The OK button should change colour" | "When the OK button is clicked, change its background from `--raised` to `--ignition` and keep it that way. Use `aria-pressed="true"` to mark it and style that state in CSS." |
| "Gears look weird" | "In 2nd gear the teeth overlap after a few seconds. Check that the drive gear's duration is `60 / (53 × 24 / 16)` s and the output's is `60 / 53` s, and that both restart together on every shift." |

## Words worth knowing

- **State:** how an element looks right now. Common ones:
  - *hover*: the pointer is over it
  - *active / pressed*: being clicked
  - *focus*: selected with the keyboard
  - *selected / current*: e.g. the engaged gear knob
  - *disabled*: can't be used
- **`aria-pressed`, `aria-label`:** attributes that tell screen readers a button's state and name. Styling `[aria-pressed="true"]` keeps the look and the meaning in sync.
- **Breakpoint:** the screen width where the layout changes. This site uses one at 600px (phone). Everything else is fluid.
- **Fluid / `clamp(min, preferred, max)`:** a size that grows with the screen between two limits, e.g. `clamp(40px, 9vw, 120px)`.
- **Flexbox / Grid, `gap`, `flex-wrap`, `auto-fit`:** the layout tools. "Three across on iPad, one per row on phone" is `repeat(auto-fit, minmax(220px, 1fr))`.
- **`box-sizing: border-box`:** padding counts inside the width. Without it, things that should fit side by side wrap.
- **Overflow / horizontal scroll:** content wider than the screen. Ask Kiro to "check for page-level horizontal scroll at 390px".
- **Contrast ratio:** text against its background. 4.5:1 is the minimum for body text.
- **Transition / animation / easing:** how a change moves. E.g. "needle moves over 0.7s with a slight overshoot, `cubic-bezier(.3,1.35,.5,1)`".
- **`prefers-reduced-motion`:** the visitor's setting to reduce animation. Respect it.
- **Design token:** a named colour or size like `--ignition`. Ask for changes by token so the whole site stays consistent.

## Prompts to start with

1. "Read the steering files and the spec in `.kiro/specs/portfolio-site`, then run task 1."
2. "Run tasks 2.1 to 2.5. Match `design-reference/home-neutral.html` exactly and copy its text verbatim."
3. "Run task 3 using the gear code in `design.md`, then show me 4th gear."
4. "Open the page at 820px and 390px wide and list anything that differs from the design references."
5. "Replace `[PHOTO: THE GEARBOX]` with `assets/img/gearbox.jpg`, cropped to 4:3 with `object-fit: cover`, with alt text 'My 3D-printed four-speed gearbox with its motor'."

## When something breaks
Tell Kiro **what you did, what you expected and what happened**, with the screen width. For example: "At 390px, tapping 3 updates the readouts, but the panel still shows 2nd gear. Expected: the 3rd gear panel."
