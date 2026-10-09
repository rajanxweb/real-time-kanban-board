# Test Plan

## Automated coverage

- The server Socket.IO integration test creates an owner, a board member, and a non-member. Both authorized clients join the board room, the owner moves a card through the REST API, and the member receives `card:moved`. The test also checks that the non-member receives an access-denied acknowledgement when attempting to join.
- The client login test submits an invalid email and verifies that validation is shown without calling the login action.
- The client card composer test opens a list's inline composer, submits a title, and checks that the created card appears and the create request is sent.
- The client empty-board test verifies the no-lists message and its next-step instruction.

## Running the tests

From `server/`, run `npm test`. Server integration tests require `TEST_DATABASE_URL` in an ignored `.env.test` file, pointing to a dedicated test database. The test setup applies migrations and refuses to use the same database name as `DATABASE_URL`.

From `client/`, run `npm test`. Vitest uses jsdom and React Testing Library for the component tests.

Lint and typecheck commands are `npm run lint` and `npm run typecheck` from each package directory.
