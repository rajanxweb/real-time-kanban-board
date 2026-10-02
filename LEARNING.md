# Learning notes

## Task: Initial Repository Skeleton

### What Was Built
- Set up the foundational repository skeleton for the Real-time Collaborative Kanban Board without scaffolding application code.
- Added `README.md` with project title, one-line pitch, and work-in-progress note.
- Configured `.gitignore` targeting Node dependencies, environment files, build artifacts, and OS-generated files.
- Added standard MIT `LICENSE`.
- Created placeholder directory structure with `client/` and `server/` containing `.gitkeep` files, along with an empty `docs/` directory.

### Why This Approach
- **Clean Structure**: Setting up `client/` and `server/` early establishes a clear boundary between frontend and backend architectures without cluttering the project root.
- **Security & Hygiene**: Defining `.gitignore` rules before adding dependencies or `.env` files prevents committing sensitive credentials, logs, and build artifacts.
- **Git Compatibility**: Using `.gitkeep` ensures that version control tracks required empty directories across clones and branches.
- **Step-by-Step Discipline**: Avoiding premature scaffolding keeps the repository free of unused libraries and speculative abstractions.

### Key Terms
- **Repository Skeleton**: The initial directory structure, licensing, configuration, and documentation files that establish repository setup before application code is introduced.
- **.gitkeep**: A convention-based placeholder file placed in empty directories so that Git (which only tracks files, not empty folders) records and tracks the folder structure.
- **.gitignore**: A configuration file read by Git to ignore specific files or patterns from being staged or committed to source control.

## Task: Requirements and User Stories Specification

### What Was Built
- Created `docs/01-requirements.md` detailing functional requirements (auth, boards, members, lists, cards, drag-and-drop, live sync, presence), non-functional requirements (security, <1s sync latency, accessibility/WCAG 2.1 AA), and an explicit out-of-scope list.
- Created `docs/02-user-stories.md` with 20 concrete user stories covering all core Kanban capabilities, each equipped with 3 testable acceptance criteria.

### Why This Approach
- **Clear Scope Boundaries**: Defining an explicit out-of-scope list prevents feature creep and keeps the project aligned with free-tier infrastructure (avoiding cloud storage, complex OAuth, and CRDT overhead).
- **Testable Acceptance Criteria**: Structuring user stories with precise, unambiguous acceptance criteria ensures subsequent implementation phases (schema design, API routes, socket handlers, UI components) have clear definitions of done.
- **Accessibility & Latency Targets**: Documenting accessibility (keyboard navigation, visible focus rings, ARIA live announcements) and sync performance (<1s latency, minimal mutation deltas) upfront establishes them as core architectural requirements.

### Key Terms
- **Acceptance Criteria**: The explicit, testable conditions that a software feature must satisfy to be verified as complete and correct.
- **Sync Latency**: The duration between a user action emitted to the server and the resulting state update rendered on a collaborator's screen.
- **Presence**: Real-time awareness mechanisms that broadcast and display which users are actively connected to a board or inspecting specific cards.
- **Optimistic UI**: A frontend pattern where the client updates its interface immediately on user action without waiting for server confirmation, rolling back if the request fails.

## Task: Technical Architecture and System Design Specifications

### What Was Built
- Created `docs/03-architecture.md` outlining the high-level system topology with Mermaid architecture and sequence diagrams, the dual-channel communication model (REST + Socket.IO), backend layering, room isolation, and the free-tier deployment approach.
- Created `docs/04-database-design.md` detailing the PostgreSQL schema with a Mermaid ER diagram, floating-point position ordering using midpoint insertion, cascade delete behaviors, and a complete `schema.prisma` definition.
- Created `docs/05-api-spec.md` documenting every REST endpoint across Auth, Boards, Board Members, Lists, and Cards with HTTP methods, paths, request validation schemas, response structures, and authorization rules.
- Created `docs/06-realtime-events.md` specifying all Socket.IO client and server event payloads (`board:join`, `board:leave`, `presence:update`, `list:created`, `list:updated`, `list:deleted`, `card:created`, `card:updated`, `card:moved`, `card:deleted`), along with handshake authentication and reconnection reconciliation.
- Created `docs/DECISIONS.md` documenting Architecture Decision Records (ADRs) explaining the rationale and trade-offs for Socket.IO, PostgreSQL, Prisma, JWT, and Last-Write-Wins (LWW) conflict handling with server authority.

### Why This Approach
- **Midpoint Insertion for Reordering**: Using floating-point positions allows moving a card or list with an $O(1)$ single-row update rather than re-indexing $O(N)$ sibling records, minimizing database write contention and socket message volume.
- **Server Authority & Last-Write-Wins**: Discrete Kanban actions (moving cards, editing titles) do not require the immense complexity and memory bloat of CRDT tombstones or OT algorithms; server validation with LWW provides a clean, reliable, and testable single source of truth.
- **Stateless Free-Tier Design**: Combining JWT authentication with in-memory Socket.IO rooms eliminates the operational cost and infrastructure requirements of separate Redis session clusters while running comfortably on free cloud tiers.
- **Strict Layered Separation**: Documenting clear boundaries (routes -> controllers -> services -> prisma) upfront ensures the subsequent code implementation adheres strictly to `RULES.md` without tight coupling or speculative abstractions.

### Key Terms
- **Midpoint Insertion**: A technique for ordered collections where an item moved between position $A$ and position $B$ is assigned position $(A + B) / 2$, avoiding updates to any neighboring elements.
- **Last-Write-Wins (LWW)**: A conflict resolution policy where the update that commits latest to the authoritative server overrides prior writes, reconciling client states deterministically.
- **Room Isolation**: The practice of partitioning WebSocket connections into logical rooms (such as `board:{boardId}`) so broadcasts are delivered only to relevant collaborators.
- **Stateless Authentication**: An authentication pattern using cryptographically signed tokens (like JWTs) that carry identity and permission data, eliminating server-side session lookups.
- **Referential Integrity & Cascading**: Database constraints ensuring related child records (e.g. lists and cards) are automatically cleaned up when parent entities (boards) are deleted.

## Task: Design System Specification

### What Was Built
- Created `docs/09-design-system.md` defining the complete visual design system around a calm, tactile "index card on paper" aesthetic.
- Specified the color palette based on warm paper ground (`#F4F1EA`), clean index card surface (`#FBFAF6`), ink (`#1B1A17`), muted pencil (`#6B665C`), 1px borders (`rgba(27,26,23,0.14)`), and a vermilion stamp accent (`#E4572E`), with dark mode explicitly marked out of scope.
- Established typography scales utilizing Bricolage Grotesque (headings), Instrument Sans (body & inputs), and JetBrains Mono (metadata, dates, counters).
- Enforced geometry and elevation constraints: maximum 3px radii, 1px borders, zero resting shadows, and a single elevation shadow reserved strictly for cards being actively dragged.
- Defined a 4px base spacing scale with explicit density rules (dense for board canvas and lists, roomy for framing and modals).
- Documented core components (Button, Input, Card, List Column, Modal, Toast, Avatar Stack, Empty State) across hover, focus-visible, and disabled states.
- Standardized plain-language voice and microcopy with 10 representative UI strings prohibiting generic fillers.
- Outlined explicit loading, empty, and error UI states for login, register, dashboard, board view, and card modal.

### Why This Approach
- **Utilitarian Focus Over Visual Trends**: Grounding the interface in an index-card physical metaphor avoids trendy, distracting gradients, glassmorphism, or heavy drop shadows, keeping user focus squarely on task workflows.
- **Strict Geometric Constraints (3px Max Radius & 1px Borders)**: Consistent, tight radii and hairline boundaries yield a dense, professional, and crisp desktop tool feel without loose, floating elements.
- **Deliberate Microcopy**: Banning generic or artificial messages (such as "Oops!" or "Welcome back!") ensures communication remains direct, trustworthy, and actionable when errors or conflicts occur.
- **Comprehensive UI States**: Defining loading skeletons, empty containers, and retryable error states before writing frontend components guarantees that edge cases and asynchronous delays are never left unhandled.

### Key Terms
- **Tactile Hierarchy**: A visual design approach that uses subtle border contrasts, paper-like surfaces, and ink tones rather than dramatic drop shadows to communicate component boundaries.
- **Focus-Visible Ring**: An accessibility styling mechanism that renders high-contrast keyboard navigation rings (`outline: 2px solid #E4572E`) only when users navigate via keyboard, avoiding visual clutter during mouse clicks.
- **Microcopy**: Short, purposeful text snippets in user interfaces (button labels, empty state guidance, error alerts) designed to guide users clearly without jargon.
- **Rhythm & Density**: The systematic allocation of whitespace where operational task workspaces are tightly packed (dense) while container frames remain open (roomy).

## Task: Backend Server Setup (Node + Express + TypeScript)

### What Was Built
- Initialized `server/` with Node.js, Express, TypeScript (strict mode), `tsx` for development, ESLint, and Prettier.
- Configured `tsconfig.json` with strict type checking (`strict: true`, `noImplicitReturns: true`, `noUnusedLocals: true`, `noUnusedParameters: true`) targeting `ES2022` with `NodeNext` module resolution.
- Configured ESLint (flat config `eslint.config.mjs`) combining `@eslint/js`, `typescript-eslint`, and `eslint-config-prettier`.
- Configured Prettier (`.prettierrc`, `.prettierignore`) for standard formatting.
- Created `server/.env.example` defining default port configuration (`PORT=5000`).
- Implemented `server/src/index.ts` initializing an Express server on the `PORT` specified in the environment (defaulting to `5000`) without routes.
- Configured standard npm scripts: `dev`, `build`, `start`, `lint`, and `typecheck`.

### Why This Approach
- **TypeScript Strict Mode**: Enforcing strict compiler checks and rejecting unused identifiers catches defects at build time and keeps the codebase disciplined as domain layers are introduced.
- **Fast Development Cycles with `tsx`**: `tsx` provides native TypeScript execution and automatic reloading on file modification without needing multi-step transpile-and-run scripts.
- **Separation of Linting and Formatting**: Pairing `typescript-eslint` with `eslint-config-prettier` turns off stylistic rules in ESLint, letting Prettier handle formatting and ESLint focus strictly on code quality.
- **Clean Baseline**: Setting up the server process and port listener without speculative routes or premature abstractions aligns with `RULES.md` and provides a clean canvas for subsequent API and socket layers.

### Key Terms
- **Strict Mode (TypeScript)**: A configuration flag (`strict: true`) that enables all strict type checking options, eliminating implicit `any` types and ensuring explicit handling of `null` and `undefined`.
- **tsx**: A fast Node.js runtime enhanced with `esbuild` for executing and watching TypeScript files without upfront compilation.
- **Flat Config**: The module-based configuration schema in ESLint 9+ (`eslint.config.mjs`) providing explicit, deterministic plugin compositions.


