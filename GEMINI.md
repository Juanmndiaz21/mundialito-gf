<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read `antislop.md` (core) and then the skill for the task:
- UI / visual: `skills/antislop-ui/SKILL.md`
- Copy & text: `skills/antislop-copywriting/SKILL.md`
- People: `skills/antislop-human/SKILL.md`
- Mobile / responsive: `skills/antislop-layoutmobile/SKILL.md`
- Code comments: `skills/antislop-code/SKILL.md`
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update antislop later: download `antislop.md` again, or run `npx antislop-ai --update` if it was installed as skill folders.
<!-- antislop:end -->

## 20 UX Laws (Core Principles)
Apply these 20 fundamental UX laws across all UI components, views, workflows, and interactions:

1. **Aesthetic-Usability Effect**: Maintain high visual quality, harmonious proportions, and intentional craft; users perceive polished interfaces as more usable and trustworthy.
2. **Hick's Law**: Minimize decision fatigue. Group options, provide smart presets, and limit simultaneous choices.
3. **Fitts's Law**: Make primary interaction targets prominent, adequately sized (minimum 44x44px touch targets on mobile), and close to thumb/cursor reach.
4. **Jakob's Law**: Respect established web and mobile patterns for navigation, filters, search, modal dialogs, and actions so users feel immediately at home.
5. **Miller's Law**: Chunk data into digestible groups of 5 to 9 units (or smaller) to prevent cognitive overload.
6. **Doherty Threshold**: Keep UI feedback under 400ms. Provide instant optimistic feedback, snappy spring micro-interactions, and skeleton states for async operations.
7. **Law of Proximity**: Group related controls and metrics tightly using consistent spacing scales, separating unrelated sections with generous whitespace.
8. **Law of Similarity**: Give elements with identical functions identical styling (consistent button variants, badges, and state indicators).
9. **Law of Common Region**: Enclose related content within explicit boundaries (cards, subtle surface tints, defined borders) to clarify group relationships.
10. **Visual Hierarchy**: Direct user focus systematically using scale, contrast, weight, and color (H1 > H2 > H3 > body > caption; primary vs secondary actions).
11. **Progressive Disclosure**: Surface essential information upfront; reveal advanced controls, detailed stats, or configuration on demand via tabs, drawers, or modals.
12. **Recognition over Recall**: Make options, actions, and historical context visible and discoverable instead of forcing users to remember inputs or states.
13. **Von Restorff Effect (Isolation Effect)**: Visually distinguish the single most critical element (e.g. primary call-to-action, champion trophy, active tournament stage).
14. **Peak-End Rule**: Design rewarding peak moments (e.g. tournament win celebrations, balanced team generation) and clean, reassuring conclusion states.
15. **Goal-Gradient Effect**: Accelerate user engagement by visualizing progress toward completion (e.g. tournament brackets, paridad gauges, goal meters).
16. **Serial Position Effect**: Anchor the most critical options at the beginning and end of lists, navigation bars, and action toolbars.
17. **Tesler's Law (Conservation of Complexity)**: Absorb complexity in the application logic (smart auto-balance, auto-calculation, intelligent filtering) rather than delegating it to the user.
18. **Postel's Law (Robustness Principle)**: Be forgiving with user input (dates, search terms, scores) and strict/reliable in output and system state.
19. **Occam's Razor**: Choose the simplest workable layout, interaction model, and copy; eliminate redundant decorative noise that does not aid comprehension.
20. **Feedback Loops**: Provide clear, immediate acknowledgment for every action (button states, toast notices, sound/visual confirmations, and error explanations).


