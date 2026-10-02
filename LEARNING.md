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

