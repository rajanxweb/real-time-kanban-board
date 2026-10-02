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

