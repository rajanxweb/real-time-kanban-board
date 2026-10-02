# Requirements: Real-Time Collaborative Kanban Board

## 1. Project Overview

A real-time collaborative Kanban board web application. Multiple authenticated users can collaborate on boards divided into lists and cards, with drag-and-drop interactions, live synchronization via WebSockets, and active user presence.

Stack: React, Vite, TypeScript, Tailwind CSS (client); Node.js, Express, TypeScript, Socket.IO (server); PostgreSQL, Prisma (database).

---

## 2. Functional Requirements (FR)

### FR-1: Authentication & Account Management

- **FR-1.1**: User registration with email, password (minimum 8 characters), and display name.
- **FR-1.2**: Password hashing using bcrypt with per-user salt.
- **FR-1.3**: User login issuing a secure HTTP-only cookie or signed JWT token.
- **FR-1.4**: Session persistence across browser reloads; logout revoking active authentication tokens.
- **FR-1.5**: Unauthenticated requests to protected API endpoints and Socket.IO namespaces rejected with 401 Unauthorized.

### FR-2: Board Management

- **FR-2.1**: Authenticated users can create boards with a required title and optional description.
- **FR-2.2**: The creator is assigned the `owner` role automatically upon board creation.
- **FR-2.3**: Dashboard displays all boards where the user is an `owner` or a `member`.
- **FR-2.4**: The board owner can update board title and description.
- **FR-2.5**: The board owner can permanently delete a board, cascading deletion to all lists, cards, and memberships.

### FR-3: Members & Roles

- **FR-3.1**: Two discrete roles per board: `owner` and `member`.
- **FR-3.2**: Board owner can invite/add registered users to a board by email address as `member`.
- **FR-3.3**: Board owner can remove any `member` from the board.
- **FR-3.4**: A `member` can remove themselves (leave) from a board.
- **FR-3.5**: The `owner` cannot leave or delete their own ownership without deleting the board.
- **FR-3.6**: Role permissions:
  - `owner`: Board deletion, board metadata edits, member invitations, member removals, list/card CRUD.
  - `member`: List/card CRUD, self-removal from board. Read-only access to board settings and member lists.

### FR-4: Lists

- **FR-4.1**: Any board collaborator (`owner` or `member`) can create a list with a title.
- **FR-4.2**: Lists display horizontally in order determined by an explicit numeric position field.
- **FR-4.3**: Collaborators can rename a list inline.
- **FR-4.4**: Collaborators can delete a list and all cards contained within it after confirmation.
- **FR-4.5**: Collaborators can reorder lists horizontally.

### FR-5: Cards

- **FR-5.1**: Collaborators can create a card in any list with a title.
- **FR-5.2**: Cards maintain an ordered position index within their parent list.
- **FR-5.3**: Collaborators can view and edit card details: title, description, optional due date, and assigned member (selected from board members).
- **FR-5.4**: Collaborators can delete a card.

### FR-6: Drag-and-Drop (DnD)

- **FR-6.1**: Drag-and-drop reordering of cards within the same list.
- **FR-6.2**: Drag-and-drop moving of cards between different lists on the same board.
- **FR-6.3**: Drag-and-drop horizontal reordering of lists.
- **FR-6.4**: Keyboard alternative controls for moving cards and lists (accessible via Tab, Space/Enter, Arrow keys, Esc).
- **FR-6.5**: Optimistic UI update on drop with rollback and user feedback if the backend mutation fails.

### FR-7: Live Synchronization

- **FR-7.1**: Socket.IO room scoped to each board ID (`board:{boardId}`).
- **FR-7.2**: Real-time broadcast of all board mutations:
  - `card:created`, `card:updated`, `card:moved`, `card:deleted`
  - `list:created`, `list:updated`, `list:moved`, `list:deleted`
  - `member:added`, `member:removed`
- **FR-7.3**: Clients apply incoming socket events without re-fetching the entire board payload.
- **FR-7.4**: Automatic socket reconnection with exponential backoff; re-sync full board state on reconnect.

### FR-8: User Presence

- **FR-8.1**: Real-time collaborator presence bar on each board displaying online members currently viewing the board.
- **FR-8.2**: Disconnect detection removing inactive members within 3 seconds of socket drop.
- **FR-8.3**: Active card editing presence: indicator on a card when another collaborator has opened its detail modal.

---

## 3. Non-Functional Requirements (NFR)

### NFR-1: Security

- **NFR-1.1 Authorization**: Every REST endpoint and every incoming Socket.IO event must verify user authentication and validate board membership/role permissions.
- **NFR-1.2 Input Validation**: All incoming requests (REST query/body, Socket payloads) validated with Zod schemas before reaching service logic.
- **NFR-1.3 Data Protection**: Passwords salted and hashed with bcrypt. Secrets loaded exclusively from environment variables; zero hardcoded secrets.
- **NFR-1.4 Transport Security**: CORS configured strictly to permitted frontend origins; HTTP-only, secure, SameSite cookies for tokens.

### NFR-2: Performance & Latency

- **NFR-2.1 Sync Latency**: Real-time socket message delivery latency under 1 second (target <200ms round-trip on broadband connections) from client action to collaborator render.
- **NFR-2.2 Payload Sizing**: Real-time broadcasts transmit minimal mutation deltas (IDs, modified fields, new index) rather than full board snapshots.
- **NFR-2.3 Database Indexing**: Composite indexes on `(board_id, position)` for lists and `(list_id, position)` for cards to guarantee fast retrieval and sort operations.

### NFR-3: Accessibility (a11y)

- **NFR-3.1 Compliance**: Conform to WCAG 2.1 Level AA guidelines.
- **NFR-3.2 Keyboard Navigation**: Every interactive element reachable and operable via keyboard; visible focus rings (`focus-visible`) maintained.
- **NFR-3.3 Screen Reader Support**: Form inputs explicitly labelled with `htmlFor` / `aria-labelledby`; dynamic board updates and DnD moves announced using `aria-live="polite"` regions.
- **NFR-3.4 Visual Contrast**: Minimum text-to-background contrast ratio of 4.5:1 for normal text and 3:1 for large text and UI boundaries.

### NFR-4: Reliability & UI State Discipline

- **NFR-4.1 States**: Every view and data-fetching component must implement discrete loading, empty, and error states.
- **NFR-4.2 Error Handling**: API returns structured JSON error objects with machine codes and plain, actionable messages. No generic "Something went wrong" or "Oops!".

---

## 4. Out of Scope

The following capabilities are deliberately excluded:

1. Third-party OAuth / Social Logins (Google, GitHub, etc.).
2. File attachments, document uploads, or cloud object storage.
3. Rich-text / WYSIWYG editors with embedded images (plain text and lightweight Markdown preview only).
4. Custom fields, tags, checklist items, and color-coded labels.
5. Time tracking, estimations, Gantt charts, burndown charts, and calendar views.
6. Email delivery, password reset emails, and desktop/browser push notifications.
7. Nested subtasks or multi-board workspaces / organizations (flat boards with direct member invites only).
8. Conflict-Free Replicated Data Types (CRDTs) and offline-first storage engines (IndexedDB sync).
9. Paid subscription tiers, payment gateways, and seat management.
