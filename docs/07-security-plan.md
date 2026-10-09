# Security Plan

## HTTP protections

- Helmet sets the standard HTTP security headers on Express responses.
- Express CORS accepts browser requests only from the configured `CLIENT_ORIGIN`. Socket.IO uses the same origin restriction.
- JSON request bodies are limited to 1 MB. Oversized bodies receive a `413 PAYLOAD_TOO_LARGE` response, and malformed JSON receives `400 INVALID_JSON`.
- Every route under `/api/v1/auth` is limited to 20 requests per IP in a 15-minute window. Rate-limit responses use the API error envelope and include standard rate-limit headers.
- The health endpoint requires a valid bearer token, like other protected endpoints.

## Authentication and authorization

- Registration and login are public so users can establish an account and session; both validate their JSON bodies with Zod and are covered by the auth rate limit.
- `/api/v1/auth/me` and all board endpoints require a valid JWT. The server reloads the user from the database when it verifies a token, so deleted users cannot continue with an old token.
- Board reads and member operations check board membership. Board changes that require owner rights check the owner role. List and card operations resolve the resource's board and check membership in that board.
- REST path parameters are validated with Zod through `readPathParam`; request bodies are validated with the route's Zod schema. No current REST handler consumes query parameters.
- Socket handshakes validate the token with the same access-token service as REST. `board:join` and `board:leave` validate their payloads with Zod. Joining requires current board membership; leaving is limited to a board room already joined by that socket. Disconnect handling only processes rooms held by that authenticated socket.
- Room broadcasts recheck each connected socket's board membership and remove sockets whose membership has ended before publishing. This prevents revoked members from receiving later board events.

## Validation and authorization audit

- Found that `/health` was public. It now requires bearer authentication.
- Found that a member removed after joining could remain in a Socket.IO room and receive subsequent broadcasts. Room membership is now rechecked before roster responses and broadcasts, and unauthorized sockets are removed.
- The member-removal `userId` path parameter is checked through the existing Zod-backed `readPathParam` helper. Other board, list, and card path parameters use the same validation, and all accepted JSON bodies have route schemas.
- Registration and login remain intentionally unauthenticated entry points; their input validation and rate limit provide their route-level protections.

## Secret handling

- A Git tracked-file scan found no runtime `.env` files or common private-key and credential filenames. Three `.env.example` templates are tracked by design; their database and JWT values are explicit placeholders, not usable credentials. Local runtime environment files are ignored by `.gitignore`.
- Secrets such as `JWT_SECRET` and `DATABASE_URL` are read from the process environment and are not hardcoded in application code.

## Operational limits

- The auth limiter uses the process's in-memory store. Counts reset when the server restarts and are not shared between multiple server instances.
- The client origin must be set accurately in `CLIENT_ORIGIN`; other browser origins will not receive CORS permission.
