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
