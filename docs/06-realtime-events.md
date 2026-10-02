# Real-Time Socket Events Specification

## 1. Socket Architecture & Lifecycle

All real-time collaboration is built on Socket.IO and organized by board-specific rooms.
- **Namespace**: Default namespace `/`
- **Room Naming Convention**: `board:{boardId}`
- **Authentication**: JWT token transmitted in connection handshake auth (`auth: { token: "<jwt_token>" }`).

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Server as Socket.IO Server
    participant Room as Room: board:{boardId}

    Client->>Server: Connect (Handshake with JWT)
    Server->>Server: Validate JWT; attach userId & email to socket
    Client->>Server: emit("board:join", { boardId })
    Server->>Server: Verify board membership in DB
    Server->>Room: Add socket to board:{boardId}
    Server-->>Client: ack({ success: true, activeUsers: [...] })
    Server->>Room: broadcast("presence:update", { userId, status: "online" })
    
    note over Client,Room: Normal Collaboration (Card moves, edits, list updates)

    Client->>Server: emit("board:leave", { boardId })
    Server->>Room: Remove socket from board:{boardId}
    Server->>Room: broadcast("presence:update", { userId, status: "offline" })
```

---

## 2. Handshake & Connection

### Connection Establishment
```typescript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});
```

### Connection Error (`connect_error`)
Dispatched if the token is missing, expired, or invalid.
```json
{
  "message": "Authentication failed: invalid token"
}
```

---

## 3. Client $\rightarrow$ Server Events

### 3.1 `board:join`
Emitted when a user opens a board canvas.

- **Payload**:
  ```json
  {
    "boardId": "cuid_board_1"
  }
  ```
- **Acknowledgment Callback / Response**:
  ```json
  {
    "success": true,
    "boardId": "cuid_board_1",
    "activeUsers": [
      {
        "userId": "cuid_user_1",
        "name": "Alice Cooper",
        "email": "alice@example.com",
        "activeCardId": null
      },
      {
        "userId": "cuid_user_2",
        "name": "Bob Vance",
        "email": "bob@example.com",
        "activeCardId": "cuid_card_5"
      }
    ]
  }
  ```
- **Error Acknowledgment**:
  ```json
  {
    "success": false,
    "error": {
      "code": "ACCESS_DENIED",
      "message": "User is not a member of this board"
    }
  }
  ```

---

### 3.2 `board:leave`
Emitted when a user navigates away from the board canvas.

- **Payload**:
  ```json
  {
    "boardId": "cuid_board_1"
  }
  ```

---

### 3.3 `presence:update`
Emitted when a user interacts with a specific card or changes active focus.

- **Payload**:
  ```json
  {
    "boardId": "cuid_board_1",
    "cardId": "cuid_card_2",
    "status": "editing"
  }
  ```
- **Values for `status`**:
  - `"viewing"`: Card modal is open in read mode.
  - `"editing"`: User is actively typing into card title/description.
  - `"idle"`: Modal closed or focus returned to canvas. `cardId` must be `null`.

---

## 4. Server $\rightarrow$ Client Broadcast Events

All mutation events are broadcast to room members using `socket.to(room).emit(...)` so the originating client (which has already applied an optimistic update) does not process a duplicate event.

---

### 4.1 `presence:update`
Broadcast to all room members whenever an active user changes focus or disconnects.

- **Trigger**: Handshake connect/disconnect, `board:join`, `board:leave`, or client `presence:update`.
- **Payload**:
  ```json
  {
    "boardId": "cuid_board_1",
    "userId": "cuid_user_2",
    "name": "Bob Vance",
    "status": "editing",
    "cardId": "cuid_card_2"
  }
  ```

---

### 4.2 `list:created`
Broadcast when a collaborator creates a new list column.

- **Trigger**: Successful `POST /api/v1/boards/:boardId/lists`.
- **Payload**:
  ```json
  {
    "boardId": "cuid_board_1",
    "list": {
      "id": "cuid_list_2",
      "boardId": "cuid_board_1",
      "title": "In Progress",
      "position": 2000.0,
      "createdAt": "2026-10-02T11:20:00.000Z",
      "updatedAt": "2026-10-02T11:20:00.000Z"
    }
  }
  ```

---

### 4.3 `list:updated`
Broadcast when a collaborator renames or reorders a list column.

- **Trigger**: Successful `PATCH /api/v1/boards/:boardId/lists/:listId`.
- **Payload**:
  ```json
  {
    "boardId": "cuid_board_1",
    "list": {
      "id": "cuid_list_2",
      "boardId": "cuid_board_1",
      "title": "Doing",
      "position": 1500.0,
      "updatedAt": "2026-10-02T11:25:00.000Z"
    }
  }
  ```

---

### 4.4 `list:deleted`
Broadcast when a collaborator deletes a list column.

- **Trigger**: Successful `DELETE /api/v1/boards/:boardId/lists/:listId`.
- **Payload**:
  ```json
  {
    "boardId": "cuid_board_1",
    "listId": "cuid_list_2"
  }
  ```

---

### 4.5 `card:created`
Broadcast when a collaborator adds a card to any list.

- **Trigger**: Successful `POST /api/v1/boards/:boardId/lists/:listId/cards`.
- **Payload**:
  ```json
  {
    "boardId": "cuid_board_1",
    "listId": "cuid_list_1",
    "card": {
      "id": "cuid_card_2",
      "listId": "cuid_list_1",
      "title": "Implement JWT Middleware",
      "description": "Verify Bearer tokens and attach user to req.user",
      "position": 1000.0,
      "dueDate": "2026-10-10T00:00:00.000Z",
      "assigneeId": "cuid_user_1",
      "createdAt": "2026-10-02T11:30:00.000Z",
      "updatedAt": "2026-10-02T11:30:00.000Z"
    }
  }
  ```

---

### 4.6 `card:updated`
Broadcast when a collaborator updates card metadata (title, description, due date, assignee).

- **Trigger**: Successful `PATCH /api/v1/boards/:boardId/cards/:cardId`.
- **Payload**:
  ```json
  {
    "boardId": "cuid_board_1",
    "card": {
      "id": "cuid_card_2",
      "listId": "cuid_list_1",
      "title": "Implement JWT Middleware & Refresh",
      "description": "Updated scope to include token invalidation",
      "dueDate": null,
      "assigneeId": "cuid_user_2",
      "updatedAt": "2026-10-02T11:35:00.000Z"
    }
  }
  ```

---

### 4.7 `card:moved`
Broadcast when a collaborator drags and drops a card within the same list or across lists.

- **Trigger**: Successful `PATCH /api/v1/boards/:boardId/cards/:cardId/move`.
- **Payload**:
  ```json
  {
    "boardId": "cuid_board_1",
    "cardId": "cuid_card_2",
    "sourceListId": "cuid_list_1",
    "targetListId": "cuid_list_2",
    "position": 1500.0,
    "updatedAt": "2026-10-02T11:38:00.000Z"
  }
  ```

---

### 4.8 `card:deleted`
Broadcast when a collaborator deletes a card.

- **Trigger**: Successful `DELETE /api/v1/boards/:boardId/cards/:cardId`.
- **Payload**:
  ```json
  {
    "boardId": "cuid_board_1",
    "listId": "cuid_list_1",
    "cardId": "cuid_card_2"
  }
  ```

---

## 5. Event Summary Matrix

| Event Name | Direction | Room Target | Transport Trigger | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `board:join` | Client $\rightarrow$ Server | Unicast | Component mount | Join room, receive presence roster |
| `board:leave` | Client $\rightarrow$ Server | Unicast | Component unmount | Leave room, trigger presence prune |
| `presence:update` | Bi-directional | `board:{boardId}` | Modal open/focus/close | Sync online avatars & card inspectors |
| `list:created` | Server $\rightarrow$ Client | `board:{boardId}` | REST POST list | Append column on peer screens |
| `list:updated` | Server $\rightarrow$ Client | `board:{boardId}` | REST PATCH list | Rename/reorder column on peers |
| `list:deleted` | Server $\rightarrow$ Client | `board:{boardId}` | REST DELETE list | Remove column on peers |
| `card:created` | Server $\rightarrow$ Client | `board:{boardId}` | REST POST card | Insert card on peer screens |
| `card:updated` | Server $\rightarrow$ Client | `board:{boardId}` | REST PATCH card | Update card title/assignee on peers |
| `card:moved` | Server $\rightarrow$ Client | `board:{boardId}` | REST PATCH card move | Relocate card position on peers |
| `card:deleted` | Server $\rightarrow$ Client | `board:{boardId}` | REST DELETE card | Remove card from canvas on peers |

---

## 6. Conflict & Reconciliation Policy

1. **Server Authority**: The PostgreSQL database remains the single source of truth for all board state.
2. **Delta Propagation**: Socket events transmit small, specific delta objects (IDs, updated fields, float positions) rather than full board trees.
3. **Reconnection Sync**: When a socket disconnects and subsequently reconnects, the client does not replay missed delta events. Instead, it re-queries `GET /api/v1/boards/:boardId` to reconcile against the authoritative database snapshot.
