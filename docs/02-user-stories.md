# User Stories: Real-Time Collaborative Kanban Board

## 1. Authentication & Session

### US-01: User Registration

As a new user,  
I want to register an account with my email, password, and display name,  
So that I can create and collaborate on Kanban boards.

**Acceptance Criteria**:

1. Submitting a valid email, display name, and password (minimum 8 characters) creates a user record and sets an authenticated session.
2. Submitting an email that is already registered returns "An account with this email already exists" without creating a duplicate.
3. Blank required fields or passwords under 8 characters display inline validation messages and prevent submission.

---

### US-02: User Login

As a registered user,  
I want to sign in with my email and password,  
So that I can access my boards.

**Acceptance Criteria**:

1. Submitting valid credentials authenticates the user and navigates to the boards dashboard.
2. Submitting invalid credentials displays "Invalid email or password" and leaves the email input populated.
3. The authenticated session persists across browser reloads until explicit logout or token expiration.

---

### US-03: User Logout

As an authenticated user,  
I want to log out of my account,  
So that other people using this computer cannot access my boards.

**Acceptance Criteria**:

1. Clicking "Log out" clears the session token and terminates active Socket.IO connections.
2. The user is redirected to the login page.
3. Attempting to navigate to protected routes redirects unauthenticated visitors back to the login page.

---

## 2. Board Management

### US-04: Create Board

As an authenticated user,  
I want to create a new board with a title and optional description,  
So that I can organize a project.

**Acceptance Criteria**:

1. Submitting a non-empty board title creates a board record and redirects the user to the board canvas.
2. The creator is assigned the `owner` role in the board membership table.
3. Submitting an empty title prevents form submission and displays "Board title is required".

---

### US-05: View User Boards

As an authenticated user,  
I want to see all boards where I am an owner or member,  
So that I can select which board to open.

**Acceptance Criteria**:

1. The dashboard lists all boards the user belongs to, displaying each board's title and the user's role (`Owner` or `Member`).
2. If the user has no boards, an empty state displays "You do not belong to any boards yet" with a "Create board" button.
3. Failed requests display "Unable to load boards" with a "Retry" button.

---

### US-06: Edit Board Details

As a board owner,  
I want to update the board title and description,  
So that the board reflects updated project scope.

**Acceptance Criteria**:

1. The board owner can edit the title and description from board settings; saved changes persist to the database immediately.
2. Non-owner members cannot view or trigger board edit controls.
3. Renaming to an empty title is rejected with "Board title cannot be empty".

---

### US-07: Delete Board

As a board owner,  
I want to delete my board,  
So that obsolete boards are permanently removed.

**Acceptance Criteria**:

1. The board owner can delete the board after confirming a destructive warning prompt.
2. Deleting cascades to remove all associated lists, cards, and memberships from the database.
3. Non-owner members do not see delete controls; backend rejects non-owner deletion requests with 403 Forbidden.

---

## 3. Members & Roles

### US-08: Add Board Member

As a board owner,  
I want to add a registered user to my board by email,  
So that we can collaborate on the board.

**Acceptance Criteria**:

1. Entering the email of an existing registered user adds that user with the `member` role.
2. Entering an email not found in the database displays "No user found with this email".
3. Entering the email of an existing collaborator displays "User is already a member of this board".

---

### US-09: Remove Member or Leave Board

As a board collaborator,  
I want board memberships to be updatable,  
So that team access matches current project staffing.

**Acceptance Criteria**:

1. The board owner can remove any non-owner member, immediately revoking their access.
2. A member can click "Leave board" to remove themselves, returning to their dashboard.
3. The board owner cannot leave or remove their own ownership without deleting the board.

---

## 4. Lists

### US-10: Create List

As a board collaborator,  
I want to add a new list column with a title,  
So that I can represent a workflow stage.

**Acceptance Criteria**:

1. Entering a title in the "Add a list" input appends a new list to the right of existing lists.
2. The list is stored with a position value higher than all existing lists in that board.
3. Blank submissions are ignored without creating an empty list column.

---

### US-11: Rename List

As a board collaborator,  
I want to edit a list's title inline,  
So that column headings stay accurate.

**Acceptance Criteria**:

1. Clicking a list title turns it into an editable input containing the current title.
2. Pressing Enter or clicking outside saves the new title to the database.
3. Clearing the input and submitting preserves the previous title without saving blank text.

---

### US-12: Delete List

As a board collaborator,  
I want to delete a list,  
So that retired workflow stages are removed.

**Acceptance Criteria**:

1. Selecting "Delete list" shows a confirmation modal indicating all cards inside the list will also be deleted.
2. Confirming deletes the list and all child cards from the database and removes them from the board view.
3. Canceling the confirmation closes the modal without deleting data.

---

## 5. Cards

### US-13: Create Card

As a board collaborator,  
I want to add a card to a list,  
So that I can capture a specific task.

**Acceptance Criteria**:

1. Entering a title in the "Add card" field and submitting adds a new card to the bottom of the list.
2. The card is assigned a position index greater than all existing cards in that list.
3. Empty title submission is prevented and focus remains on the input.

---

### US-14: Edit Card Details & Assignment

As a board collaborator,  
I want to update a card's description, due date, and assignee,  
So that task details and responsibilities are clear.

**Acceptance Criteria**:

1. Clicking a card opens a detail modal with fields for title, description, due date, and assignee.
2. The assignee dropdown includes only current board members and an "Unassigned" option.
3. Saving updates the database and reflects immediately on the card's canvas preview.

---

### US-15: Delete Card

As a board collaborator,  
I want to delete a card,  
So that abandoned tasks do not clutter the board.

**Acceptance Criteria**:

1. Selecting "Delete card" from the card detail modal permanently removes the card from the database.
2. The card immediately disappears from the list for all active board viewers.
3. Remaining cards in the list maintain correct relative ordering without gaps.

---

## 6. Drag-and-Drop

### US-16: Drag-and-Drop Reorder Within List

As a board collaborator,  
I want to drag a card up or down within its current list,  
So that I can change task priority.

**Acceptance Criteria**:

1. Grabbing a card applies a 1px border with elevated shadow and displays a drop indicator line between cards.
2. Dropping the card recalculates its position and persists the new order to the backend.
3. Keyboard users can focus a card, press Space to lift, Up/Down arrow keys to move, and Space/Enter to drop.

---

### US-17: Drag-and-Drop Move Across Lists

As a board collaborator,  
I want to drag a card from one list into another list,  
So that I can update its workflow status.

**Acceptance Criteria**:

1. Dragging a card across list boundaries displays a drop slot indicator inside the target list.
2. Dropping updates both `list_id` and `position` on the backend.
3. If the network request fails, the card reverts to its source list and position with an error toast message.

---

## 7. Live Synchronization

### US-18: Real-Time Board Mutation Sync

As a board collaborator,  
I want changes made by team members to appear automatically,  
So that everyone works with identical board state without manual refreshes.

**Acceptance Criteria**:

1. When user A creates, edits, moves, or deletes a card or list, user B sees the update within 1 second.
2. Socket updates apply directly to client state without full board re-fetches or page flashes.
3. Socket messages are strictly isolated to users connected to the specific board's room.

---

## 8. Presence

### US-19: Active Board Collaborator Presence

As a board collaborator,  
I want to see who is currently viewing the board,  
So that I know who is actively online.

**Acceptance Criteria**:

1. The board navigation bar displays avatar indicators with initials for all active users connected to the board room.
2. When a user joins or navigates away from the board, the presence list updates for all connected users within 3 seconds.
3. Hovering or focusing an avatar indicator displays the collaborator's display name and email.

---

### US-20: Active Card Inspection Indicator

As a board collaborator,  
I want to see when another user is viewing or editing a card,  
So that we do not conflict or edit the same task concurrently.

**Acceptance Criteria**:

1. When collaborator A opens a card detail modal, collaborator B sees an active viewing badge on that card's board preview.
2. When collaborator A closes the modal or disconnects, the active viewing badge disappears within 1 second.
3. If multiple users inspect the same card, the badge reflects the count or stacked indicators of all active viewers.
