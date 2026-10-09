# Real-Time Collaborative Kanban Board

# Real-Time Collaborative Kanban Board

![CI](https://github.com/rajanxweb/real-time-kanban-board/actions/workflows/ci.yml/badge.svg?branch=main)

A real-time collaborative Kanban board for team task management and workflow tracking.

## Run with Docker Compose

Install Docker with the Compose plugin, clone the repository, then run from the repository root:

```sh
docker compose up --build
```

Compose starts PostgreSQL, waits for its healthcheck, runs Prisma migrations when the server starts, and then serves the client after the API is healthy. Open <http://localhost:8080>. The API and Socket.IO server are available on port 5001. PostgreSQL stays available to the other Compose services on the internal network.

The Compose defaults are for local development. The server generates an ephemeral JWT secret on startup when `JWT_SECRET` is unset; set `JWT_SECRET` and `POSTGRES_PASSWORD` in the environment used by Docker Compose for a deployment. `CLIENT_PORT` and `SERVER_PORT` can be set to change the published ports.

Stop the services with `docker compose down`. Add `-v` only when you also want to delete the persisted PostgreSQL data.
