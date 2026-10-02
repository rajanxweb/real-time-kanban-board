PROJECT: Real-time collaborative Kanban board. Stack: React + Vite + TypeScript + Tailwind (client), Node + Express + TypeScript + Socket.IO (server), PostgreSQL + Prisma. Everything must be free-tier friendly.

DESIGN RULES (strict):
- Follow docs/09-design-system.md exactly. Do not invent new colors, fonts or radii.
- Never use: purple/blue gradients, gradient text, glassmorphism, blurred blobs, emoji as icons, Inter/Roboto as the main font, centered hero sections, "icon in a colored circle" feature grids, uniform rounded-2xl + shadow-lg cards.
- Prefer 1px borders over shadows. Shadows only on a card being dragged.
- Dense, purposeful layouts. Real spacing rhythm, not "p-6 everywhere".
- Write real microcopy in a plain, specific voice. No "Welcome back!", "Oops!", "Something went wrong", "Seamless", "Powerful", "Effortless".
- Every screen must handle loading, empty, error states.
- Keyboard accessible, labelled inputs, visible focus rings.

CODE RULES:
- TypeScript strict. No `any`. No unused code.
- Do not add comments that restate the code ("// handle submit"). Comment only the non-obvious why.
- Small files, clear names, no speculative abstractions, no extra libraries unless I approve.
- Backend layering: routes -> controllers -> services -> prisma. Validate all input with Zod.
- Never hardcode secrets. Never commit .env.
- Authorization check on every route and every socket event.
- Do exactly what the step asks. Do not refactor unrelated files.

OUTPUT RULES:
- After every task, append to LEARNING.md: what was built, why this approach, key terms.