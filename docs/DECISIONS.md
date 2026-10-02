# Architecture Decision Records (ADR)

This document details the architectural decisions, trade-offs, and design rationale behind the technology choices and synchronization patterns for the Real-Time Collaborative Kanban Board.

---

## 1. Real-Time Transport: Socket.IO

### Decision
Use **Socket.IO** (v4) over raw WebSockets (`ws`), Server-Sent Events (SSE), or long-polling alone.

### Rationale
- **Built-in Room Abstractions**: Scoping real-time events to specific boards requires grouping connections. Socket.IO provides native in-memory rooms (`socket.join('board:' + boardId)`), allowing targeted broadcasts (`socket.to(room).emit(...)`) without manual socket registry management.
- **Automatic Reconnection & Heartbeats**: Network interruptions on mobile or unstable Wi-Fi are handled automatically by Socket.IO's exponential backoff reconnection protocol. Heartbeat pings detect ungraceful disconnects within 3 seconds, ensuring the board presence roster remains accurate.
- **Transport Fallback**: If a corporate firewall or proxy blocks WebSocket upgrades (HTTP 101), Socket.IO gracefully falls back to HTTP long-polling, ensuring reliability across all network topologies.
- **Unified Handshake Authentication**: Socket.IO supports an `auth` object during connection handshakes, enabling JWT validation before upgrading or accepting event traffic.

### Trade-offs & Mitigations
- *Trade-off*: Socket.IO has a slightly larger client library size compared to native browser `WebSocket`.
- *Mitigation*: The client bundle overhead (~12 KB minified/gzipped) is negligible and drastically reduces custom application code for heartbeat detection, reconnection loops, and message parsing.

---

## 2. Persistence Layer: PostgreSQL

### Decision
Use **PostgreSQL** over NoSQL document stores (MongoDB, DynamoDB) and file-based databases (SQLite).

### Rationale
- **Relational Integrity & Foreign Keys**: Kanban boards possess clear relational boundaries: Users have Memberships, Boards have Lists, and Lists have Cards. PostgreSQL strictly enforces foreign keys, ensuring cards cannot point to non-existent lists and memberships cannot point to deleted users.
- **Engine-Level Cascade Deletes**: Deleting a board or list triggers automatic cascading deletions for all child entities directly within the database engine, avoiding multi-step cleanup scripts and eliminating orphaned records.
- **Composite Indexing for High-Performance Sorting**: Ordering lists by `(board_id, position)` and cards by `(list_id, position)` maps directly to PostgreSQL B-tree composite indices, yielding sub-millisecond retrieval times.
- **ACID Transactions**: Atomic transactions are necessary when rebalancing floating-point positions or executing ownership transfers.
- **Free-Tier Ecosystem**: Managed PostgreSQL is readily available on generous free tiers (Neon, Supabase, Render), providing serverless compute and connection pooling at zero operational cost.

### Trade-offs & Mitigations
- *Trade-off*: Relational schemas require structured migrations compared to schemaless document stores.
- *Mitigation*: Schema changes are managed declaratively using Prisma Migrate, producing predictable, version-controlled SQL migration scripts.

---

## 3. ORM & Data Layer: Prisma

### Decision
Use **Prisma ORM** over TypeORM, Drizzle, or raw SQL queries (`pg`).

### Rationale
- **End-to-End Type Safety**: Prisma generates TypeScript types directly from `schema.prisma`. Any change to the database schema immediately surfaces compilation errors in controllers and services, preventing runtime property mismatch bugs.
- **Declarative Schema Modeling**: Relations, indices, enums, and cascading behaviors (`onDelete: Cascade`) are defined concisely in a single file rather than spread across entity decorators or SQL strings.
- **Integration with Zod**: Prisma-generated models align cleanly with Zod validation schemas, establishing an unbroken type contract from HTTP/Socket payload down to database columns.
- **Developer Ergonomics**: Prisma Client provides auto-completion for complex nested reads (e.g., loading a board with its lists, cards, and member user profiles in a single query).

### Trade-offs & Mitigations
- *Trade-off*: Prisma Client historically carried higher memory usage and cold-start latency in serverless environments.
- *Mitigation*: Co-hosting Express and Socket.IO in a persistent Node.js server container eliminates cold-start concerns. Connection pooling handles database limits seamlessly.

---

## 4. Authentication Mechanism: JSON Web Tokens (JWT)

### Decision
Use **Stateless JWTs** (HMAC-SHA256) over stateful server sessions stored in Redis or database tables.

### Rationale
- **Stateless Infrastructure for Free-Tier Hosting**: Storing active sessions on the server requires an external cache like Redis or frequent database session lookups. Using signed JWTs eliminates the need to provision and manage a Redis cluster, preserving free-tier resource quotas.
- **Dual-Channel Authentication**: A single signed JWT token authenticates both the HTTP REST API (via `Authorization: Bearer <token>`) and the Socket.IO WebSocket handshake (`socket.handshake.auth.token`). The server verifies the token signature using the identical secret key without querying session stores.
- **Self-Contained Claims**: The JWT payload contains the `userId`, `email`, and token issuance timestamps, enabling middleware to attach identity to `req.user` with zero database overhead on standard requests.

### Trade-offs & Mitigations
- *Trade-off*: Stateless tokens cannot be revoked instantly prior to expiration without a centralized revocation list.
- *Mitigation*: Tokens are configured with a reasonable 7-day expiration window. Explicit logout drops the token on the client and severs the active socket connection. For high-security environments, token blacklisting or shorter lifespans with refresh tokens can be layered in without architectural changes.

---

## 5. Conflict Resolution: Last-Write-Wins (LWW) with Server as Authority

### Decision
Adopt **Last-Write-Wins (LWW) with Server Authority** over Conflict-Free Replicated Data Types (CRDTs like Yjs/Automerge) or Operational Transformation (OT).

### Rationale
- **Domain Fit**: Kanban boards operate on discrete components (cards, lists) and coarse-grained user actions (moving a card, editing title, assigning a member). Users rarely type simultaneously into the exact same card title character-by-character. CRDTs are optimized for continuous real-time collaborative text (e.g., Google Docs), which adds unnecessary overhead here.
- **Zero Tombstone and Memory Bloat**: CRDTs require retaining "tombstones" for every deleted card or list to resolve concurrent causality, causing state sizes to grow indefinitely over time. With server authority and PostgreSQL, deleted rows are purged cleanly.
- **Minimal Network Footprint**: CRDTs require exchanging complex state vectors and operation logs. With LWW, the server broadcasts minimal JSON delta payloads (`cardId`, `position`, `listId`), keeping real-time sync latency well under 100ms.
- **Fractional Positioning Prevents Collision**: Midpoint insertion ensures that when two users drop cards into the same list, each card computes a distinct fractional float position based on its surrounding items. Collisions at the same index are mathematically rare.
- **Predictable Single Source of Truth**: When concurrent edits do collide (e.g., Alice updates a card title at 10:00:01.100 and Bob updates the same card title at 10:00:01.150), the PostgreSQL transaction commits Bob's update as the definitive state. The server broadcasts Bob's update to the room, and Alice's client reconciles immediately against the broadcast.
- **Optimistic UI with Deterministic Rollback**: The client updates immediately on user drop or input. If the server rejects the REST mutation (e.g., board permission revoked or target list deleted), the client rolls back to its pre-mutation snapshot and displays an actionable error. On reconnection, clients re-fetch the full board snapshot via REST to eliminate state drift.
