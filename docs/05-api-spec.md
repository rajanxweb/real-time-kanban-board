# REST API Specification: Real-Time Collaborative Kanban Board

## 1. Global API Conventions

- **Base URL**: `/api/v1`
- **Transport**: HTTPS
- **Payload Format**: `application/json`
- **Authentication**: Bearer Token in `Authorization` header (`Authorization: Bearer <jwt_token>`).
- **Input Validation**: All incoming requests are validated using Zod schemas before reaching the service layer. Extraneous fields are stripped.

### Standard Response Envelope

All API endpoints return a predictable JSON envelope:

#### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required and must be at least 1 character.",
    "details": [
      {
        "field": "title",
        "message": "String must contain at least 1 character(s)"
      }
    ]
  }
}
```

---

## 2. Authentication Endpoints

### 2.1 Register User
- **Method**: `POST`
- **Path**: `/api/v1/auth/register`
- **Auth Rule**: Public
- **Request Body**:
  ```json
  {
    "email": "alice@example.com",
    "password": "Password123!",
    "name": "Alice Cooper"
  }
  ```
- **Validation Rules**:
  - `email`: Valid email format, trimmed, lowercase.
  - `password`: String, minimum 8 characters.
  - `name`: String, 1–100 characters.
- **Success Response** (`201 Created`):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "cuid_user_1",
        "email": "alice@example.com",
        "name": "Alice Cooper",
        "createdAt": "2026-10-02T10:00:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `VALIDATION_ERROR` (e.g., password under 8 characters).
  - `409 Conflict`: `EMAIL_ALREADY_EXISTS` ("An account with this email already exists").

---

### 2.2 Login User
- **Method**: `POST`
- **Path**: `/api/v1/auth/login`
- **Auth Rule**: Public
- **Request Body**:
  ```json
  {
    "email": "alice@example.com",
    "password": "Password123!"
  }
  ```
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "cuid_user_1",
        "email": "alice@example.com",
        "name": "Alice Cooper"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: `INVALID_CREDENTIALS` ("Invalid email or password").

---

### 2.3 Logout User
- **Method**: `POST`
- **Path**: `/api/v1/auth/logout`
- **Auth Rule**: Authenticated (`Bearer <token>`)
- **Request Body**: None
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "message": "Logged out successfully"
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: `UNAUTHORIZED` ("Missing or invalid authentication token").

---

### 2.4 Get Current User Profile
- **Method**: `GET`
- **Path**: `/api/v1/auth/me`
- **Auth Rule**: Authenticated (`Bearer <token>`)
- **Request Body**: None
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "cuid_user_1",
        "email": "alice@example.com",
        "name": "Alice Cooper",
        "createdAt": "2026-10-02T10:00:00.000Z"
      }
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: `UNAUTHORIZED` ("Token is expired or invalid").

---

## 3. Board Endpoints

### 3.1 List User's Boards
- **Method**: `GET`
- **Path**: `/api/v1/boards`
- **Auth Rule**: Authenticated
- **Request Body**: None
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "boards": [
        {
          "id": "cuid_board_1",
          "title": "Sprint 34 Board",
          "description": "Core roadmap delivery",
          "role": "OWNER",
          "createdAt": "2026-10-02T10:00:00.000Z",
          "updatedAt": "2026-10-02T10:30:00.000Z"
        },
        {
          "id": "cuid_board_2",
          "title": "Design System",
          "description": null,
          "role": "MEMBER",
          "createdAt": "2026-10-01T08:00:00.000Z",
          "updatedAt": "2026-10-02T09:15:00.000Z"
        }
      ]
    }
  }
  ```

---

### 3.2 Create Board
- **Method**: `POST`
- **Path**: `/api/v1/boards`
- **Auth Rule**: Authenticated (creator is automatically assigned `OWNER` role)
- **Request Body**:
  ```json
  {
    "title": "Product Launch",
    "description": "Q4 release tracking"
  }
  ```
- **Validation Rules**:
  - `title`: String, 1–120 characters.
  - `description`: String, optional, max 1000 characters.
- **Success Response** (`201 Created`):
  ```json
  {
    "success": true,
    "data": {
      "board": {
        "id": "cuid_board_3",
        "title": "Product Launch",
        "description": "Q4 release tracking",
        "role": "OWNER",
        "createdAt": "2026-10-02T11:00:00.000Z",
        "updatedAt": "2026-10-02T11:00:00.000Z"
      }
    }
  }
  ```

---

### 3.3 Get Board Canvas (Full State)
- **Method**: `GET`
- **Path**: `/api/v1/boards/:boardId`
- **Auth Rule**: Authenticated + Board Member (`OWNER` or `MEMBER`)
- **Request Body**: None
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "board": {
        "id": "cuid_board_1",
        "title": "Sprint 34 Board",
        "description": "Core roadmap delivery",
        "currentUserRole": "OWNER",
        "members": [
          {
            "id": "cuid_member_1",
            "userId": "cuid_user_1",
            "name": "Alice Cooper",
            "email": "alice@example.com",
            "role": "OWNER"
          }
        ],
        "lists": [
          {
            "id": "cuid_list_1",
            "title": "Backlog",
            "position": 1000.0,
            "cards": [
              {
                "id": "cuid_card_1",
                "listId": "cuid_list_1",
                "title": "Set up database schema",
                "description": "Define Prisma models and run initial migration",
                "position": 1000.0,
                "dueDate": "2026-10-15T00:00:00.000Z",
                "assignee": {
                  "id": "cuid_user_1",
                  "name": "Alice Cooper",
                  "email": "alice@example.com"
                },
                "createdAt": "2026-10-02T10:15:00.000Z",
                "updatedAt": "2026-10-02T10:20:00.000Z"
              }
            ]
          }
        ]
      }
    }
  }
  ```
- **Error Responses**:
  - `403 Forbidden`: `ACCESS_DENIED` ("You are not a member of this board").
  - `404 Not Found`: `BOARD_NOT_FOUND` ("Board not found").

---

### 3.4 Update Board Metadata
- **Method**: `PATCH`
- **Path**: `/api/v1/boards/:boardId`
- **Auth Rule**: Authenticated + Board `OWNER` only
- **Request Body**:
  ```json
  {
    "title": "Sprint 34 - Revised",
    "description": "Updated scope"
  }
  ```
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "board": {
        "id": "cuid_board_1",
        "title": "Sprint 34 - Revised",
        "description": "Updated scope",
        "updatedAt": "2026-10-02T11:15:00.000Z"
      }
    }
  }
  ```
- **Error Responses**:
  - `403 Forbidden`: `FORBIDDEN` ("Only the board owner can update board details").

---

### 3.5 Delete Board
- **Method**: `DELETE`
- **Path**: `/api/v1/boards/:boardId`
- **Auth Rule**: Authenticated + Board `OWNER` only
- **Request Body**: None
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "message": "Board deleted successfully"
    }
  }
  ```
- **Error Responses**:
  - `403 Forbidden`: `FORBIDDEN` ("Only the board owner can delete this board").

---

## 4. Board Member Endpoints

### 4.1 List Members
- **Method**: `GET`
- **Path**: `/api/v1/boards/:boardId/members`
- **Auth Rule**: Authenticated + Board Member (`OWNER` or `MEMBER`)
- **Request Body**: None
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "members": [
        {
          "id": "cuid_member_1",
          "userId": "cuid_user_1",
          "name": "Alice Cooper",
          "email": "alice@example.com",
          "role": "OWNER"
        },
        {
          "id": "cuid_member_2",
          "userId": "cuid_user_2",
          "name": "Bob Vance",
          "email": "bob@example.com",
          "role": "MEMBER"
        }
      ]
    }
  }
  ```

---

### 4.2 Add Member by Email
- **Method**: `POST`
- **Path**: `/api/v1/boards/:boardId/members`
- **Auth Rule**: Authenticated + Board `OWNER` only
- **Request Body**:
  ```json
  {
    "email": "bob@example.com"
  }
  ```
- **Success Response** (`201 Created`):
  ```json
  {
    "success": true,
    "data": {
      "member": {
        "id": "cuid_member_2",
        "userId": "cuid_user_2",
        "name": "Bob Vance",
        "email": "bob@example.com",
        "role": "MEMBER"
      }
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `USER_NOT_FOUND` ("No user found with this email").
  - `409 Conflict`: `MEMBER_ALREADY_EXISTS` ("User is already a member of this board").
  - `403 Forbidden`: `FORBIDDEN` ("Only the board owner can add members").

---

### 4.3 Remove Member or Leave Board
- **Method**: `DELETE`
- **Path**: `/api/v1/boards/:boardId/members/:userId`
- **Auth Rule**: Authenticated + (Board `OWNER` removing a `MEMBER`, OR `MEMBER` removing themselves). Owners cannot remove themselves.
- **Request Body**: None
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "message": "Member removed successfully"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `OWNER_CANNOT_LEAVE` ("The board owner cannot leave without deleting the board").
  - `403 Forbidden`: `FORBIDDEN` ("You do not have permission to remove this member").

---

## 5. List Endpoints

### 5.1 Create List
- **Method**: `POST`
- **Path**: `/api/v1/boards/:boardId/lists`
- **Auth Rule**: Authenticated + Board Member (`OWNER` or `MEMBER`)
- **Request Body**:
  ```json
  {
    "title": "In Progress",
    "position": 2000.0
  }
  ```
- **Validation Rules**:
  - `title`: String, 1–80 characters.
  - `position`: Number (Float), optional. Defaults to `(max_existing_position + 1000.0)` or `1000.0`.
- **Success Response** (`201 Created`):
  ```json
  {
    "success": true,
    "data": {
      "list": {
        "id": "cuid_list_2",
        "boardId": "cuid_board_1",
        "title": "In Progress",
        "position": 2000.0,
        "createdAt": "2026-10-02T11:20:00.000Z",
        "updatedAt": "2026-10-02T11:20:00.000Z"
      }
    }
  }
  ```

---

### 5.2 Update List
- **Method**: `PATCH`
- **Path**: `/api/v1/boards/:boardId/lists/:listId`
- **Auth Rule**: Authenticated + Board Member (`OWNER` or `MEMBER`)
- **Request Body**:
  ```json
  {
    "title": "Doing",
    "position": 1500.0
  }
  ```
- **Validation Rules**:
  - `title`: String, optional, 1–80 characters.
  - `position`: Number (Float), optional.
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "list": {
        "id": "cuid_list_2",
        "boardId": "cuid_board_1",
        "title": "Doing",
        "position": 1500.0,
        "updatedAt": "2026-10-02T11:25:00.000Z"
      }
    }
  }
  ```

---

### 5.3 Delete List
- **Method**: `DELETE`
- **Path**: `/api/v1/boards/:boardId/lists/:listId`
- **Auth Rule**: Authenticated + Board Member (`OWNER` or `MEMBER`)
- **Request Body**: None
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "message": "List and all child cards deleted successfully"
    }
  }
  ```

---

## 6. Card Endpoints

### 6.1 Create Card
- **Method**: `POST`
- **Path**: `/api/v1/boards/:boardId/lists/:listId/cards`
- **Auth Rule**: Authenticated + Board Member (`OWNER` or `MEMBER`)
- **Request Body**:
  ```json
  {
    "title": "Implement JWT Middleware",
    "description": "Verify Bearer tokens and attach user to req.user",
    "position": 1000.0,
    "dueDate": "2026-10-10T00:00:00.000Z",
    "assigneeId": "cuid_user_1"
  }
  ```
- **Validation Rules**:
  - `title`: String, 1–200 characters.
  - `description`: String, optional.
  - `position`: Number (Float), optional. Defaults to `(max_list_position + 1000.0)`.
  - `dueDate`: ISO 8601 string, optional.
  - `assigneeId`: String (cuid), optional, must be an active board member.
- **Success Response** (`201 Created`):
  ```json
  {
    "success": true,
    "data": {
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
  }
  ```

---

### 6.2 Update Card Details
- **Method**: `PATCH`
- **Path**: `/api/v1/boards/:boardId/cards/:cardId`
- **Auth Rule**: Authenticated + Board Member (`OWNER` or `MEMBER`)
- **Request Body**:
  ```json
  {
    "title": "Implement JWT Middleware & Refresh",
    "description": "Updated scope to include token invalidation",
    "dueDate": null,
    "assigneeId": "cuid_user_2"
  }
  ```
- **Validation Rules**:
  - `title`: String, optional, 1–200 characters.
  - `description`: String or null, optional.
  - `dueDate`: ISO 8601 string or null, optional.
  - `assigneeId`: String or null, optional. If provided, must belong to board members.
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "card": {
        "id": "cuid_card_2",
        "listId": "cuid_list_1",
        "title": "Implement JWT Middleware & Refresh",
        "description": "Updated scope to include token invalidation",
        "position": 1000.0,
        "dueDate": null,
        "assigneeId": "cuid_user_2",
        "updatedAt": "2026-10-02T11:35:00.000Z"
      }
    }
  }
  ```

---

### 6.3 Move Card (Drag-and-Drop)
- **Method**: `PATCH`
- **Path**: `/api/v1/boards/:boardId/cards/:cardId/move`
- **Auth Rule**: Authenticated + Board Member (`OWNER` or `MEMBER`)
- **Request Body**:
  ```json
  {
    "targetListId": "cuid_list_2",
    "position": 1500.0
  }
  ```
- **Validation Rules**:
  - `targetListId`: String (cuid), required. Must belong to the same `boardId`.
  - `position`: Number (Float), required. Computed via midpoint insertion algorithm.
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "card": {
        "id": "cuid_card_2",
        "listId": "cuid_list_2",
        "position": 1500.0,
        "updatedAt": "2026-10-02T11:38:00.000Z"
      }
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `INVALID_TARGET_LIST` ("Target list does not belong to this board").

---

### 6.4 Delete Card
- **Method**: `DELETE`
- **Path**: `/api/v1/boards/:boardId/cards/:cardId`
- **Auth Rule**: Authenticated + Board Member (`OWNER` or `MEMBER`)
- **Request Body**: None
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "message": "Card deleted successfully"
    }
  }
  ```
