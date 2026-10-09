# Learning notes

## Task: Continuous Integration and Dependency Updates

### What Was Built
- Added a GitHub Actions workflow for pushes to `main` and pull requests targeting `main`. It installs both packages, runs lint, typecheck, tests and production builds, and builds both Docker images.
- Added a PostgreSQL service for server integration tests, including a separate test database.
- Added npm Dependabot updates for the client and server and a CI status badge to the README.

### Why This Approach
- Running the same package scripts in CI catches type, lint, test, and build failures before changes are merged.
- The server tests run against an isolated PostgreSQL database provided by the workflow, rather than requiring a developer's local database.
- Dependabot checks both npm lockfiles so dependency updates can be reviewed as pull requests.

### Key Terms
- **GitHub Actions**: GitHub's workflow runner for automated checks.
- **Service container**: A temporary database container attached to a CI job.
- **Dependabot**: GitHub's tool for proposing dependency updates.

## Task: Avoid Local API Port Conflict

### What Was Built
- Changed the Compose published API port default to 5001 and made the client build use the same configured port for API and Socket.IO connections.

### Why This Approach
- The usual local API development server uses port 5000. Publishing the container on 5001 lets the local and containerized APIs run at the same time.

### Key Terms
- **Published port**: A host port forwarded to a port inside a container.
- **Build argument**: A value provided during image building, used here for the browser’s API and socket URLs.

## Task: Avoid Host Database Port Conflicts

### What Was Built
- Removed the database host-port mapping from Compose and updated the run instructions to explain that PostgreSQL is only reachable inside the Compose network.

### Why This Approach
- The API connects to the database using the Compose service name, so the app does not need a host port for PostgreSQL. Removing the mapping avoids collisions with another local database using port 5433.

### Key Terms
- **Compose network**: The private network where Compose services reach one another by service name.
- **Port mapping**: A rule that exposes a container port on the host machine.

## Task: Docker Compose App Startup

### What Was Built
- Added multi-stage Docker builds for the server and client. The server runs as the non-root `node` user and applies Prisma migrations before starting; the client is served by Nginx with a single-page-app fallback.
- Extended Compose to start PostgreSQL, the server, and the client with readiness checks and health-based startup ordering.
- Updated the README with the local startup instructions and documented the Compose URLs and environment overrides.

### Why This Approach
- Compose healthchecks keep the server from migrating until PostgreSQL is ready and keep the client from starting before the API has opened its port.
- The client uses build-time API and socket URLs to connect directly to the published server ports, so Nginx only needs to serve the static app.
- Multi-stage builds keep source/build tooling out of the final client image, while the server runtime image installs only production dependencies.
- The container generates a temporary random JWT key when none is configured, allowing a local Compose startup without committing a fixed secret.

### Key Terms
- **Multi-stage build**: A Docker build that uses separate stages for compiling and running an application.
- **Healthcheck**: A container check used by Compose to decide when a service is ready.
- **SPA fallback**: Serving `index.html` for client-side routes that do not map to static files.

## Task: Socket and Client Flow Tests

### What Was Built
- Added a Socket.IO integration test with an owner, a board member, and a non-member. It checks that both members can join, the non-member is denied, and the member receives `card:moved` after the owner moves a card.
- Added React Testing Library coverage for invalid login input, submitting a card through the inline composer, and the empty-board message.
- Added Vitest browser-like setup for the client and documented the test coverage and required commands in `docs/08-test-plan.md`.

### Why This Approach
- The socket test goes through the same REST move route used by the app, so it checks the full path from an authorized mutation to the room broadcast.
- The client tests render the existing screens and verify their user-visible behavior, while mocking only the API boundary.
- jsdom provides the DOM needed by React Testing Library without requiring a browser in automated runs.

### Key Terms
- **Integration test**: A test that runs connected parts of the application together, such as REST, database access, and Socket.IO.
- **React Testing Library**: A tool for checking React interfaces through the controls and text users interact with.
- **jsdom**: A JavaScript implementation of browser DOM APIs used by client-side tests.

## Task: Server Security Hardening and Audit

### What Was Built
- Added Helmet headers, CORS limited to `CLIENT_ORIGIN`, a 1 MB JSON body limit, and a per-IP rate limit of 20 requests per 15 minutes across `/api/v1/auth`.
- Protected the health route with bearer authentication and returned explicit client errors for oversized or malformed JSON bodies.
- Audited REST parameter/body validation and socket payload validation, and checked authorization on routes and board-room socket actions.
- Rechecked membership for room rosters and broadcasts, removing sockets whose board membership was revoked.
- Added `docs/07-security-plan.md` describing the protections, audit findings, and operating limits. Git tracks only the three `.env.example` templates; I replaced their database and JWT values with explicit placeholders. No runtime `.env` or common private-key/credential files are tracked.

### Why This Approach
- Middleware applies shared transport protections consistently before route handling, while existing Zod schemas and authorization guards continue to enforce request-specific rules.
- Rechecking room membership before sending board events closes the gap where a removed member could keep receiving updates through an already joined socket.
- Rate limiting and a bounded body parser constrain repeated authentication attempts and oversized input without adding external infrastructure.

### Key Terms
- **CORS allowlist**: The exact browser origin permitted to call the API from another origin.
- **Rate limit**: A cap on requests from one client address during a fixed time window.
- **Room authorization**: Confirming each connected socket still belongs to a board before sending its updates.

## Task: Board Presence and Reconnection Status

### What Was Built
- Added per-board online tracking on the server, with each user represented once even when they have multiple tabs open.
- Broadcast online and offline `presence:update` events on board joins, leaves, and disconnects. A user is marked offline only after their final tab leaves that board.
- Added a board avatar stack with name tooltips and a connected/reconnecting status label.
- On socket reconnection, the client rejoins the board and refetches its board query to recover changes missed while disconnected.

### Why This Approach
- Counting the user's sockets in a board room prevents one tab closing from incorrectly marking the user offline while another tab remains connected.
- The join acknowledgment provides the initial online roster; presence events keep it current without polling.
- Refetching after reconnection restores the authoritative board snapshot after any missed delta events.

### Key Terms
- **Presence**: The set of users currently connected to a board.
- **Multi-tab presence**: Counting several sockets for one user as one online participant.
- **Reconciliation fetch**: Reloading the authoritative board after reconnection to recover updates missed while offline.

## Task: Client Board Socket Updates

### What Was Built
- Added a board-scoped Socket.IO provider that connects with the saved JWT, joins after board data loads, and leaves and disconnects when the board page unmounts.
- Added handlers for all documented list and card events. Each handler updates only that board's TanStack Query cache; none triggers a full board refetch.
- Made event updates idempotent with existing optimistic changes by upserting created records, replacing matching temporary rows, and applying moves/deletes by record ID.
- Added the Vite WebSocket proxy so the client can connect to the local server during development.

### Why This Approach
- Joining after the board query has data ensures events have a cached board to update.
- Reusing the existing cache keeps collaborators' changes in the same state that the board page renders.
- ID-based updates and reconciliation with optimistic rows prevent the originating window from showing duplicate records when it receives its own room broadcast.

### Key Terms
- **Socket provider**: A component that owns a board's live connection and event listeners for the time that board is open.
- **Cache delta**: A targeted change to one list or card in the cached board, without fetching the whole board again.
- **Idempotent update**: An update that reaches the same final cache state if the same change is already reflected locally.

### Two-Window Check
- Start the server with `npm run dev` from `server/` and the client with `npm run dev` from `client/`.
- Open the same board in two signed-in windows. Create and edit a card, move it to another list, then delete it; confirm each change appears in both windows.

## Task: Socket.IO Server and List/Card Broadcasts

### What Was Built
- Attached a Socket.IO server to the same HTTP server as Express and installed the existing JWT authentication check on its handshake.
- Added Zod-validated `board:join` and `board:leave` handlers. Joining checks board membership, enters `board:<id>`, and acknowledges with the active room users; leaving can only remove that socket from its own room.
- Emitted the documented list and card create, update, move, and delete events after their REST services complete successfully. Room broadcasts include the originating socket as requested.
- Returned source-list information from the card move/delete services so the broadcast payloads include the IDs required by the event contract.

### Why This Approach
- Reusing the access-token service keeps socket and REST authentication consistent, including checking that the user still exists.
- Board-specific rooms scope each mutation event to collaborators who joined that board, and membership checks run before a socket can join.
- Controllers emit only after the database service succeeds, so failed mutations do not publish state changes.

### Key Terms
- **Socket handshake**: The initial connection request where the client supplies its JWT before the server accepts the socket.
- **Board room**: A Socket.IO group named `board:<id>` used to deliver updates for one board.
- **Broadcast event**: A small payload sent to room members after a successful REST mutation.

## Task: Design System and Screen Accessibility Review

### What Was Built
- Reviewed the account, session, dashboard, board, and card dialog screens against the design system.
- Added a clear empty-board state with focus on the list name field, mobile snap scrolling for board lists, and narrow-screen adjustments to the board header and columns.
- Standardized visible focus rings and 3px component corners, replaced low-contrast accent text with ink, and made fallback messages more specific.
- Added an inline card-dialog error notice and saving state so failed edits remain visible and actionable.

### Why This Approach
- Shared focus and corner rules keep existing screens consistent without adding components or dependencies.
- Explicit empty and error messages make missing data and failed requests understandable, while responsive list snapping keeps columns usable on small screens.
- Using ink for small labels preserves the warm palette while improving text contrast.

### Key Terms
- **Focus-visible ring**: A high-contrast outline shown when navigating controls with a keyboard.
- **Scroll snap**: Browser behavior that aligns each horizontally scrolling list column into view on mobile.
- **Empty state**: Screen content that explains what the user sees when a collection has no items.

## Task: Drag and Drop for Lists and Cards

### What Was Built
- Added dnd-kit pointer and keyboard controls to reorder lists and move cards within or across lists.
- Calculated midpoint positions between destination neighbors and sent list updates or card move requests to the existing API.
- Updated the board cache immediately when a drag ends, restoring its previous state and showing the existing failure toast if the request fails.
- Styled the actively dragged card with the design system's drag shadow and a 1-degree rotation.

### Why This Approach
- dnd-kit supplies sortable keyboard interactions as well as pointer dragging without changing the server API.
- Midpoint placement matches the server's fractional ordering model, so a normal move updates only the moved item.
- Optimistic cache updates make ordering immediate while rollback keeps the display aligned with the server after a rejected request.

### Key Terms
- **Drag sensor**: Input handling that lets a user start and control a drag with a pointer or keyboard.
- **Sortable context**: The ordered set dnd-kit uses to calculate positions while moving lists or cards.
- **Midpoint position**: A number between neighboring positions used to insert an item without renumbering the whole collection.

## Task: Board List and Card Editing

### What Was Built
- Added list creation, inline list renaming, and confirmed list deletion to the board canvas.
- Added an inline card composer at the bottom of each list and a card detail dialog for editing titles and descriptions or deleting cards.
- Applied optimistic board updates with rollback and an on-screen failure toast for failed list and card requests. The card dialog traps keyboard focus, closes with Escape, and restores focus to the opener.

### Why This Approach
- The existing list and card API routes already provide the needed operations, so the client reuses those contracts without adding server endpoints or dependencies.
- Updating the cached board immediately keeps the interface responsive; restoring the previous board snapshot and showing a notice makes failed saves visible.
- A small dialog focus loop keeps keyboard users inside the card editor and returns them to the card they opened afterward.

### Key Terms
- **Optimistic update**: Updating the visible board before the server responds, then restoring its previous data if the request fails.
- **Focus trap**: Keyboard behavior that cycles Tab navigation among controls inside an open dialog.
- **Inline composer**: A small form displayed in the list where the new card will appear.

## Task: Boards and Board Members API

### What Was Built
- Added authenticated endpoints to create and list a user's boards, get a board with its members, lists, and cards, update board details, and delete a board.
- Board creation adds the creator as an owner in the same database operation. Board and list/card results use the documented response envelopes, with lists and cards ordered by position.
- Added board member endpoints to list members, invite a registered user by normalized email, and remove a member.
- Added reusable membership and owner checks for board routes, plus Zod validation for request bodies and path parameters.

### Why This Approach
- Routes apply authentication and the right board permission check before controllers call services.
- Services keep authorization lookups and board/member database operations out of the HTTP layer.
- Prisma relations handle cascading board deletion, and the unique membership constraint prevents duplicate invitations even when requests race.

### Key Terms
- **Board membership**: A record linking a user to a board with either the `OWNER` or `MEMBER` role.
- **Authorization middleware**: A request check that confirms a signed-in user has the required board role before the route runs.
- **Ordered position**: The numeric value used to return lists and cards in their board order.

## Task: Authentication Endpoints

### What Was Built
- Implemented registration, login, and current-user endpoints under `/api/v1/auth`.
- Validated registration and login bodies with Zod, including normalized email addresses and an eight-character minimum registration password.
- Hashed passwords with bcrypt and issued JWT access tokens that expire after one hour.
- Added bearer-token middleware that verifies the token, loads the current user, and attaches only public user fields to the request.
- Kept login failures for an unknown email and an incorrect password on the same `401 INVALID_CREDENTIALS` response: `Invalid email or password`.

### Why This Approach
- The routes, controllers, services, and Prisma access remain separate, so HTTP handling is distinct from authentication logic and persistence.
- Password hashes are used only for verification and are excluded from all response objects.
- Zod rejects invalid input before service logic runs, and the same login error avoids revealing whether an email is registered.

### Key Terms
- **JWT access token**: A signed token sent as a bearer credential and accepted until its one-hour expiration.
- **Password hash**: A one-way bcrypt result stored in the database instead of the original password.
- **Bearer authentication**: Sending a credential in the `Authorization: Bearer <token>` request header.

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

## Task: Client Setup (Vite + React + TypeScript + Tailwind + Fonts)

### What Was Built
- Scaffolded frontend in `client/` using Vite, React 19, TypeScript in strict mode, and React Router (`react-router-dom`).
- Translated `docs/09-design-system.md` design tokens into `client/tailwind.config.js`:
  - Colors: Paper ground (`bg`), index card surface (`surface`), toned surface (`surface-subtle`), primary ink (`ink`), pencil muted (`muted`), hairline rules (`border`, `border-hover`), vermilion stamp accent (`accent`), sage green (`success`), and terracotta (`danger`).
  - Typography: Bricolage Grotesque (`heading`), Instrument Sans (`body`), and JetBrains Mono (`mono`).
  - Corner Radii: Strict maximum 3px (`rounded`), 2px for chips (`rounded-sm`), and 9999px for presence avatars (`rounded-full`).
  - Spacing Scale: Base 4px rhythm (`space-1` through `space-8`).
  - Elevation: Drag-only box shadow (`boxShadow.drag`), modal shadow (`boxShadow.modal`), and toast shadow (`boxShadow.toast`).
- Self-hosted all three fonts via `@fontsource` packages (`@fontsource/bricolage-grotesque`, `@fontsource/instrument-sans`, `@fontsource/jetbrains-mono`), completely eliminating external CDN calls.
- Configured PostCSS (`postcss.config.js`), ESLint (`eslint.config.js` with Prettier and React Hooks plugins), Prettier (`.prettierrc`, `.prettierignore`), and strict TypeScript options in `tsconfig.app.json`.
- Removed all default Vite template leftovers (Vite/React logos, demo counter, `App.css`, default purple theme, template SVGs and readme) and replaced them with a minimal, tactile SVG favicon and a blank verification shell demonstrating all typefaces, colors, and radii.
- Configured npm scripts: `dev`, `build`, `lint`, and `typecheck`.

### Why This Approach
- **Local Font Loading via @fontsource**: Packaging fonts locally avoids external render-blocking network requests, CDN outages, and privacy issues, ensuring fast, deterministic offline-ready builds.
- **Single Source of Truth Design Tokens**: Mapping `docs/09-design-system.md` directly into the Tailwind configuration guarantees that UI components cannot inadvertently introduce prohibited colors, large corner radii, or arbitrary spacing.
- **Strict TypeScript & Flat ESLint**: Adding strict compiler flags (`strict: true`, `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`) and combining typescript-eslint with Prettier catches type mismatches and unused variables early while enforcing clean code standards.
- **Verification Shell**: Rendering a blank shell verifying all three font families and tokenized colors in React Router proves the toolchain and styling pipelines function before adding complex application components.

### Key Terms
- **@fontsource**: An open-source collection of self-hosted Google Fonts packaged as npm modules, bundled directly into application CSS assets.
- **Tailwind Theme Extension**: The configuration object (`theme.extend`) used to customize Tailwind's utility generation with project-specific color palettes, fonts, spacing, and geometry.
- **Self-Hosting Fonts**: Serving font files directly from the application's origin bundle rather than making third-party requests to external services like Google Fonts.
- **Project References (TypeScript)**: A TypeScript feature dividing a project into separate build steps (e.g. `tsconfig.app.json` and `tsconfig.node.json`) for modular, faster incremental type-checking with `tsc -b`.

## Task: Infrastructure and Environment Configuration (Docker Compose & Zod Env Validation)

### What Was Built
- Created root `docker-compose.yml` declaring an isolated PostgreSQL service (`postgres:16-alpine`), named data volume (`postgres_data`), container healthcheck via `pg_isready`, and variable-driven credentials.
- Created root `.env.example` documenting PostgreSQL service credentials (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`) and backend server configurations (`PORT`, `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`).
- Updated `server/.env.example` to mirror server-specific environment requirements.
- Implemented `server/src/config/env.ts` using `zod` to validate all required environment variables (`PORT`, `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`) at startup, immediately printing formatted issue descriptions and exiting (`process.exit(1)`) if configuration is invalid or missing.
- Updated `server/src/index.ts` to import validated `env` and start listening on `env.PORT`.

### Why This Approach
- **Fail-Fast Architecture**: Validating configuration at startup with Zod ensures that missing database connection strings or cryptographic keys halt execution immediately with clear diagnostic feedback, rather than throwing runtime exceptions during request handling.
- **Strict Typing for Configuration**: Exporting an inferred Zod type (`z.infer<typeof envSchema>`) provides type safety and autocomplete throughout the application without type casting `process.env`.
- **Reproducible Local Development**: Providing a minimal, dedicated `docker-compose.yml` for PostgreSQL ensures every developer and testing environment shares the exact same database engine version and port mappings without installing PostgreSQL directly on the host machine.
- **Secure Default Practices**: Keeping `.env.example` committed while keeping actual `.env` files ignored prevents accidental exposure of credentials in Git history.

### Key Terms
- **Fail-Fast**: A system design principle where software immediately stops execution upon encountering an unrecoverable error or invalid prerequisite, preventing corrupted states or confusing downstream bugs.
- **Zod Schema Validation**: A TypeScript-first schema declaration and validation library that parses untyped data into strictly typed runtime values.
- **Named Volume**: A persistent Docker storage mechanism managed by the Docker engine that preserves database data across container restarts and recreations.
- **Container Healthcheck**: A command executed periodically by Docker inside a running container to verify that the service is ready to accept client connections.

## Task: Database Setup (Prisma ORM with PostgreSQL)

### What Was Built
- Configured Prisma ORM in `server/` connecting to PostgreSQL via `DATABASE_URL`.
- Implemented the normalized schema in `server/prisma/schema.prisma` matching `docs/04-database-design.md`:
  - `User`: Accounts with authentication credentials (`email`, `passwordHash`, `name`) and timestamps.
  - `Board`: Collaborative workspace entities with titles, descriptions, and timestamps.
  - `BoardMember`: Join table with `Role` enum (`OWNER`, `MEMBER`) managing board access and permissions, with a compound unique constraint on `[boardId, userId]`.
  - `List`: Columns belonging to boards with floating-point `position` values for fractional ordering and a composite index on `[boardId, position]`.
  - `Card`: Task cards belonging to lists with optional assignees (`User`), nullable markdown descriptions, due dates, floating-point `position` values, and composite index on `[listId, position]`.
- Implemented explicit cascading deletes:
  - Deleting a `Board` cascades down to remove all its `BoardMember` entries, `List` records, and downstream `Card` records.
  - Deleting a `List` cascades down to delete its `Card` records.
  - Deleting a `User` cascades down to delete their `BoardMember` memberships and safely sets `assigneeId` to `NULL` on assigned cards (`SetNull`).
- Created and executed the initial migration (`server/prisma/migrations/20261002080950_init/migration.sql`) to provision the tables, enum types, unique constraints, and foreign key indexes in PostgreSQL.
- Implemented a Prisma client singleton (`server/src/lib/prisma.ts` and `server/src/prisma.ts`) utilizing the global object in development to prevent connection exhaustion during hot reloading.
- Authored a deterministic seed script (`server/prisma/seed.ts`) that resets existing records and seeds 2 users (Alice Smith, Bob Jones), 1 board ('Product Roadmap'), 3 lists ('To Do', 'In Progress', 'Done'), and 6 cards with assigned users and initial fractional positions (`1000.0`, `2000.0`).
- Added npm scripts to `server/package.json` for database migration and seeding (`migrate`, `seed`, `db:migrate`, `db:seed`).

### Why This Approach
- **Floating-Point Positions for $O(1)$ Reordering**: Using double-precision floats for list and card positions allows moving items between any two adjacent elements by calculating the midpoint, avoiding expensive multi-row $O(N)$ database updates.
- **Relational Integrity via Cascades**: Configuring cascade deletes in the database engine ensures no orphaned cards, lists, or memberships remain when parents are deleted, without requiring complex transactional cleanup code in application controllers.
- **Prisma Client Singleton**: In development environments where tools like `tsx` reload server code upon file changes, instantiating new `PrismaClient` instances per reload quickly exceeds PostgreSQL connection pool limits; storing the instance on `globalThis` reuses active connections.
- **Foreign Key Indexing**: Explicit indexes on foreign key columns (`userId`, `boardId`, `listId`, `assigneeId`) speed up relational joins and cascade delete traversals in PostgreSQL.

### Key Terms
- **Prisma ORM**: A next-generation Node.js and TypeScript object-relational mapper providing type-safe database queries generated directly from a declarative schema.
- **Singleton Pattern**: A software design pattern that restricts the instantiation of a class to a single shared instance throughout the lifetime of the application process.
- **Cascade Delete**: A database constraint rule where deleting a parent row automatically triggers the deletion of all associated dependent child rows.
- **Database Seeding**: The automated population of a database with initial, predictable sample data for local development, integration testing, and verification.
- **Midpoint Insertion**: A sorting strategy using fractional indices where a new position is computed as $(P_{\text{prev}} + P_{\text{next}}) / 2$, allowing single-row updates during reordering.

## Task: Express App Structure (Errors, Logging, Health)

### What Was Built
- Split the server into `app.ts` (builds the Express app) and `index.ts` (starts listening), so tests can import the app without opening a port.
- Added the layered folders `routes/`, `controllers/`, `services/`, `middleware/`, and `validators/` under `server/src`.
- Added an `AppError` class for expected HTTP failures (status code plus message).
- Added an async handler wrapper so rejected promises from route handlers reach Express instead of becoming unhandled rejections.
- Added a global error handler that sends a JSON error body and omits stack traces when `NODE_ENV` is `production`.
- Added a pino request logger that records method, URL, status code, and duration after each response finishes.
- Added `GET /health`, which runs `SELECT 1` through Prisma. A reachable database returns `{ "status": "ok" }`; a failed check becomes a 503 `AppError`.

### Why This Approach
- **App vs process**: Tests need the request handler, not a listening socket. Creating the app in one file and calling `listen` in another keeps those concerns apart.
- **Routes → controllers → services**: The health check is small, but putting it through the same layers as future APIs keeps request/response code out of Prisma calls.
- **Operational errors vs crashes**: `AppError` is for failures we expect (like the database being down). Unknown errors get a generic 500 in production so stack traces and raw driver messages stay off the wire.
- **Async wrapper**: Express only treats a function as an error middleware if `next(err)` is called. Wrapping async handlers forwards `catch` into `next`.
- **Pino**: Structured JSON logs are easier to search later than `console.log` strings, and pino is built for that without extra pretty-print tooling.

### Key Terms
- **AppError**: A custom error that carries an HTTP status code so the global handler can return a known failure instead of a generic 500.
- **Error middleware**: An Express function with four arguments `(err, req, res, next)`. Express uses the arity to treat it as the error sink for the app.
- **Async handler**: A wrapper that turns a `Promise` rejection into `next(err)` so the error middleware can format the response.
- **Health check**: A cheap endpoint used by operators and load balancers to see if the process can still talk to its database.
- **pino**: A fast JSON logger for Node.js. Here it records one line per finished HTTP request.

## Task: Authentication API (Register, Login, Current User)

### What Was Built
- Added `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, and `GET /api/v1/auth/me` using the existing routes → controllers → services layout.
- Validated request bodies with Zod before they reach the service: register requires a trimmed lowercase email, a password of at least 8 characters, and a name of 1–100 characters. Extra fields are stripped.
- Hashed passwords with bcrypt (10 salt rounds) and stored only `passwordHash` in PostgreSQL. API responses never include the hash.
- Issued a JWT access token signed with `JWT_SECRET`, with a 1-hour expiry and `userId` plus `email` in the payload.
- Added auth middleware that reads `Authorization: Bearer <token>`, verifies the JWT, loads the user, and attaches that user to `req.user`.
- Login failures for an unknown email and a wrong password both return the same `401 INVALID_CREDENTIALS` message: "Invalid email or password". Duplicate registration returns `409 EMAIL_ALREADY_EXISTS`.

### Why This Approach
- **Same error for both login failures**: Telling an attacker whether the email exists makes account guessing easier. One generic message hides that distinction.
- **Hash, never store plaintext**: bcrypt with a per-password salt means a leaked database is not immediately usable as a password list.
- **Short-lived JWT**: A 1-hour access token is enough for a session without keeping server-side session records, which matches the free-tier, stateless design.
- **Middleware attaches the user**: Protected routes can read `req.user` instead of repeating token parsing. `/me` still loads the user from the database so a deleted account cannot keep using an old token.
- **Zod at the route edge**: Invalid bodies fail with `VALIDATION_ERROR` before any hashing or database write.

### Key Terms
- **bcrypt**: A password hashing algorithm that includes a salt and is deliberately slow, so guessing passwords from a stolen hash file is expensive.
- **JWT (JSON Web Token)**: A signed string that carries claims (here `userId` and `email`). The server checks the signature with `JWT_SECRET` and does not need to look up a session table for that check.
- **Bearer token**: The HTTP convention `Authorization: Bearer <token>` for sending a JWT on each request.
- **Salt rounds**: How much work bcrypt does per hash (10 here). Higher numbers are slower for both attackers and the server.

## Task: Lists and Cards API

### What Was Built
- Added the documented list endpoints to create, rename, reorder, and delete lists, including cascading deletion of a list's cards.
- Added card endpoints to create, edit, delete, and move cards between lists on the same board.
- Added Zod request validation for list/card fields, optional positions, ISO date strings, nullable edits, and destination-list IDs.
- Added board membership checks that resolve the board from the list or card being changed. Card moves also confirm that the destination list belongs to the card's board; assignees must be active board members.
- Chose insertion positions between neighbouring items and rebalance a list's or list-card positions in a transaction when a safe gap is no longer available.

### Why This Approach
- Resource-based authorization prevents a caller from gaining access by supplying a board ID they belong to while targeting a list or card on another board.
- Keeping validation, authorization, HTTP responses, and database operations in the existing route → controller → service layers makes the behavior consistent with the rest of the server.
- Midpoint positions avoid rewriting every sibling on an ordinary reorder. Rebalancing only when the gap is too small restores usable spacing while keeping that update atomic.

### Key Terms
- **Resource-based authorization**: Checking access against the board that actually owns a list or card, rather than trusting a board identifier supplied by the caller.
- **Midpoint position**: A sortable number halfway between two neighbouring items, allowing insertion without changing their stored positions.
- **Rebalancing**: Reassigning evenly spaced positions when neighbouring numbers no longer have a safely usable midpoint.

## Task: Server API Integration Tests

### What Was Built
- Added Vitest and Supertest to exercise the Express API against PostgreSQL.
- Added integration coverage for registration and login success/failure, `/auth/me` without a token, non-member board access, owner-only board deletion, and card moves preserving order.
- Added `.env.test` configuration through `TEST_DATABASE_URL`; the test setup rejects using the same database name as `DATABASE_URL` and applies Prisma migrations to the test database before running.
- Added `npm test` and included test files in the TypeScript typecheck.
- Generate Prisma Client after server dependencies install so clean installs have the schema-specific database types required by build and tests.

### Why This Approach
- Supertest sends real HTTP requests through the Express app without needing a separate server process, while Prisma uses a dedicated PostgreSQL test database for persistence behavior.
- The test setup makes the database selection explicit and applies the schema before tests, so the same command is repeatable without risking application data.
- Prisma Client is generated from the schema, not shipped as ready-to-use model types; running generation during installation keeps fresh checkouts type-safe before verification.
- Small request helpers keep the scenarios readable while leaving each test's important setup, request, and assertions visible.

### Key Terms
- **Integration test**: A test that checks connected parts of the application together, such as routing, validation, authentication, and database access.
- **Supertest**: A library for making HTTP requests against an Express application in tests.
- **Test database**: A separate database selected by `TEST_DATABASE_URL`, isolated from the application's configured database.

## Task: Client Authentication

### What Was Built
- Added public login and registration pages plus a protected `/boards` route. Both auth screens use the paper and index-card visual language, labelled inputs, field-level validation, loading buttons, and specific error messages.
- Added Zod schemas wired through React Hook Form, an API fetch client that reads and attaches the stored JWT, a session context that loads the current user, and a TanStack Query client.
- Added a development API proxy so browser requests to `/api/v1` reach the local server without adding cross-origin setup.

### Why This Approach
- The auth forms follow the server's documented request and response shapes, while the session query verifies saved tokens before allowing access to protected routes.
- Keeping public credential requests separate from authenticated requests lets invalid login credentials remain on the login form; an unauthorized protected request clears the token and returns the browser to login.
- The pages use the documented paper colors, fonts, narrow borders, direct copy, and visible keyboard focus rather than a generic gradient-and-card layout.

### Key Terms
- **JWT (JSON Web Token)**: A signed token saved after login or registration and sent in the `Authorization` header on protected requests.
- **Protected route**: A route that checks for a verified user before rendering its page.
- **TanStack Query**: The client-side cache and request state used here to load the current user and expose loading, error, and retry behavior.

## Task: Boards Dashboard

### What Was Built
- Replaced the placeholder boards page with a dense, row-based dashboard that loads the signed-in user's boards and shows a loading skeleton, retryable error state, or empty state as appropriate.
- Added an inline board creation form with optional description, plus confirmation before owners delete a board. The server remains the authority for owner-only deletion.
- Added the workspace top bar with the user's name and a logout action that clears the saved session and cached user data.

### Why This Approach
- Using the existing board API and query cache keeps dashboard data aligned with the server and refreshes the list after create or delete without adding a new backend contract.
- A compact list keeps board names, descriptions, ownership, and update dates easy to scan without large repeated cards.
- Keeping deletion confirmation in the browser avoids adding dependencies while making the destructive action explicit; role-based rendering improves the interface, and server authorization enforces the actual permission.

### Key Terms
- **Query invalidation**: Marking cached board data stale so it is fetched again after a successful change.
- **Owner-only action**: A destructive control shown only to board owners in the client and enforced by authorization on the server.
- **Loading skeleton**: A placeholder layout shown while board data is being fetched.

## Task: Read-Only Board Page

### What Was Built
- Added a board page that fetches one board through TanStack Query and renders its lists as horizontally scrollable columns with sticky headers, card totals, and read-only cards.
- Added loading skeletons, an empty-board state, and separate not-found, forbidden, and retryable loading-error states.
- Linked dashboard board names to their board page.

### Why This Approach
- The page uses the existing board detail API and its authorization responses, so the server remains responsible for deciding whether a user can view a board.
- TanStack Query handles the request state and cache key per board, while the layout keeps each list header and card count visible as its cards scroll.
- The first version stays read-only; it introduces no editing or drag-and-drop behavior.

### Key Terms
- **Board detail query**: A cached request keyed by board ID that retrieves one board's lists and cards.
- **Sticky list header**: A list title and count that remain visible while the cards within that column scroll.
- **Forbidden response**: An HTTP 403 response indicating that the signed-in user cannot access the requested board.
