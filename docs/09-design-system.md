# Design System: Real-Time Collaborative Kanban Board

## 1. Aesthetic Direction & Philosophy

- **Concept**: Warm "index card on paper" feel — utilitarian, physical, tactile, and calm.
- **Physical Metaphor**: Heavy paper stock, ink typography, typewriter/monospaced metadata, subtle hairline pencil rules, and a single vermilion stamp accent.
- **Core Principles**:
  - **1px Tactile Borders Over Shadows**: Boundaries are defined by crisp, 1px rules rather than elevation or blurred drop shadows.
  - **Zero Decorative Fluff**: No purple/blue gradients, no gradient text, no glassmorphism or `backdrop-filter` blurs, no floating gradient orbs, and no emoji used as iconography.
  - **Utilitarian Spacing**: Dense, purposeful rhythm optimized for desktop productivity and rapid scanning. Spacing is intentional, avoiding generic "padding-6 everywhere."
  - **Subtle State Changes**: Interactive components react with direct, non-distracting visual cues (1px border darkening, warm background shifts, high-contrast focus rings).

---

## 2. Color Palette

```
+-------------------------------------------------------------------------+
| Ground (#F4F1EA)                                                        |
|   +-----------------------------------------------------------------+   |
|   | Surface (#FBFAF6)                                               |   |
|   |   Ink (#1B1A17)          Muted (#6B665C)                        |   |
|   |   Border: rgba(27,26,23,0.14)                                   |   |
|   |   Accent (#E4572E) [Vermilion Stamp]                            |   |
|   +-----------------------------------------------------------------+   |
+-------------------------------------------------------------------------+
```

### 2.1 Core Palette Tokens

| Token | Hex / Value | Role | Usage |
| :--- | :--- | :--- | :--- |
| `color-bg` | `#F4F1EA` | Paper Ground | Application background, canvas ground behind board columns |
| `color-surface` | `#FBFAF6` | Index Card Surface | Cards, modals, dropdown menus, input backgrounds |
| `color-surface-subtle` | `#EFECE4` | Toned Surface | List column container background, table header row |
| `color-ink` | `#1B1A17` | Primary Ink | Headings, card titles, primary buttons, high-emphasis text |
| `color-muted` | `#6B665C` | Pencil / Secondary Ink | Helper text, timestamps, labels, input placeholders, icons |
| `color-border` | `rgba(27, 26, 23, 0.14)` | Hairline Rule | All component boundaries, dividers, and card borders (1px) |
| `color-border-hover` | `rgba(27, 26, 23, 0.28)` | Darkened Rule | Hovered cards, inputs, and interactive containers |
| `color-accent` | `#E4572E` | Vermilion Stamp | Focus rings, primary active state, badge indicators |
| `color-success` | `#2E6F40` | Sage Green | Presence online dot, save confirmations (used sparingly) |
| `color-danger` | `#C83E28` | Terracotta Red | Destructive actions, validation errors, conflict alerts |

### 2.2 Dark Mode Policy
**Dark mode is explicitly OUT OF SCOPE** for this version of the application. The system strictly renders in this single, calibrated warm paper palette.

---

## 3. Typography

Three purposeful typefaces create a clear, editorial hierarchy:
- **Headings**: `"Bricolage Grotesque"`, sans-serif (confident, structured, mechanical humanist flavor).
- **Body & Inputs**: `"Instrument Sans"`, sans-serif (clean, open, highly legible grotesque).
- **Metadata, Counters, Dates**: `"JetBrains Mono"`, monospace (precise, compact, utilitarian stamp feel).

### 3.1 Type Scale

| Level | Font Family | Size | Line Height | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display / H1** | Bricolage Grotesque | 24px (`1.5rem`) | 1.2 (`28px`) | 600 (Semibold) | `-0.02em` | Board title, dashboard greeting |
| **Heading / H2** | Bricolage Grotesque | 20px (`1.25rem`) | 1.25 (`25px`) | 600 (Semibold) | `-0.015em` | Modal title, dashboard section headers |
| **Subheading / H3** | Bricolage Grotesque | 16px (`1.0rem`) | 1.3 (`21px`) | 600 (Semibold) | `-0.01em` | List column titles, drawer headers |
| **Body Large** | Instrument Sans | 14px (`0.875rem`) | 1.45 (`20px`) | 500 (Medium) | `0em` | Card titles, navigation tabs, primary buttons |
| **Body Base** | Instrument Sans | 13px (`0.8125rem`) | 1.5 (`19.5px`) | 400 (Regular) | `0em` | Card descriptions, modal body copy, form inputs |
| **Small / Helper** | Instrument Sans | 12px (`0.75rem`) | 1.4 (`16.8px`) | 400 (Regular) | `0em` | Form field hints, inline validation messages |
| **Mono Metadata** | JetBrains Mono | 11px (`0.6875rem`) | 1.35 (`14.8px`) | 500 (Medium) | `0.02em` | Due dates, card counts, positions, user roles |

---

## 4. Radii, Borders, and Elevation (Shadows)

### 4.1 Maximum Corner Radius
- **Strict Rule**: Maximum radius is **`3px`** (`rounded-sm`).
- **Cards, Buttons, Inputs, Modals**: `border-radius: 3px`.
- **Inner chips, badges**: `border-radius: 2px`.
- **Presence Avatars**: `border-radius: 9999px` (permitted exception for circular initials chips, 22px × 22px max).
- **Prohibited**: Uniform `rounded-xl`, `rounded-2xl`, pill shapes, or asymmetric curves.

### 4.2 Hairline Borders
- Every container, card, list, modal, and button uses an explicit **1px solid border**:
  `border: 1px solid rgba(27, 26, 23, 0.14)`.
- Never use 2px or thicker borders except for the keyboard focus ring.

### 4.3 Resting Shadows vs. Drag Elevation
- **Resting State**: **ZERO shadows**. Cards, buttons, dropdowns, and list columns sit flat on the surface with 1px borders.
- **Active Drag Elevation**: The *only* element that receives a shadow is an active card currently being dragged:
  ```css
  /* Dragging Card State Only */
  box-shadow: 0 4px 12px rgba(27, 26, 23, 0.12), 0 1px 3px rgba(27, 26, 23, 0.08);
  transform: rotate(1deg);
  border-color: #1B1A17;
  cursor: grabbing;
  ```
- **Drop Slot**: When dragging, the receiving slot renders a 1px dashed outline with background `#EFECE4`:
  ```css
  border: 1px dashed rgba(27, 26, 23, 0.28);
  background-color: #EFECE4;
  border-radius: 3px;
  ```

---

## 5. Spacing Scale & Layout Rhythm

Spacing is constructed on a strict **4px base unit**.

| Token | Pixels | Application |
| :--- | :--- | :--- |
| `space-1` | 4px | Gap between icon and label, inline tag padding, label-to-input gap |
| `space-2` | 8px | Gap between cards in a list, button horizontal padding (compact) |
| `space-3` | 12px | Card internal padding (`p-3`), list header vertical padding |
| `space-4` | 16px | List column padding, form group vertical spacing, modal header/footer |
| `space-5` | 20px | List horizontal gap, modal content padding |
| `space-6` | 24px | Page container padding, dashboard card grid gap |
| `space-8` | 32px | Section vertical separation on marketing/auth pages |

### 5.1 Rhythm Rule: Dense vs. Roomy

- **Dense Contexts (4px to 12px)**:
  - Inside board lists, task cards, presence stacks, and dropdowns.
  - The Kanban canvas is an operational tool where collaborators need to see multiple tasks without excessive scrolling. Cards use `p-3` (12px) padding and `gap-2` (8px) vertical spacing.
- **Roomy Contexts (16px to 24px)**:
  - Modals, page boundaries, empty state containers, and account settings.
  - Outer page gutters maintain `24px` padding to provide visual breathing room around the dense board workspace.

---

## 6. Core Component Specifications

### 6.1 Buttons

```
[ Primary Button ]      [ Secondary Button ]      [ Ghost Button ]
#1B1A17 fill            #FBFAF6 fill              Transparent fill
#FBFAF6 text            #1B1A17 text              #6B665C text
```

#### Primary Button
- **Base**: Background `#1B1A17`, text `#FBFAF6`, border `1px solid #1B1A17`, font Instrument Sans 13px (Medium), radius 3px, padding `6px 12px`.
- **Hover**: Background `#33312B`.
- **Active**: Background `#0D0C0B`.
- **Focus-visible**: Outline `2px solid #E4572E`, outline-offset `2px`.
- **Disabled**: Background `rgba(27, 26, 23, 0.25)`, border `transparent`, text `rgba(251, 250, 246, 0.7)`, cursor `not-allowed`.

#### Secondary Button
- **Base**: Background `#FBFAF6`, text `#1B1A17`, border `1px solid rgba(27, 26, 23, 0.14)`, radius 3px, padding `6px 12px`.
- **Hover**: Background `#F4F1EA`, border `rgba(27, 26, 23, 0.28)`.
- **Active**: Background `#EAE5DB`.
- **Focus-visible**: Outline `2px solid #E4572E`, outline-offset `2px`.
- **Disabled**: Background `#FBFAF6`, text `rgba(27, 26, 23, 0.3)`, border `rgba(27, 26, 23, 0.08)`, cursor `not-allowed`.

#### Ghost Button
- **Base**: Background `transparent`, text `#6B665C`, border `1px solid transparent`, radius 3px, padding `6px 10px`.
- **Hover**: Background `rgba(27, 26, 23, 0.06)`, text `#1B1A17`.
- **Active**: Background `rgba(27, 26, 23, 0.12)`.
- **Focus-visible**: Outline `2px solid #E4572E`, outline-offset `2px`.
- **Disabled**: Text `rgba(27, 26, 23, 0.25)`, cursor `not-allowed`.

---

### 6.2 Text Input & Textarea
- **Base**: Background `#FBFAF6`, border `1px solid rgba(27, 26, 23, 0.14)`, text `#1B1A17`, placeholder `#6B665C`, radius 3px, font Instrument Sans 13px, padding `6px 10px`.
- **Hover**: Border `rgba(27, 26, 23, 0.28)`.
- **Focus**: Border `#1B1A17`, outline `2px solid #E4572E`, outline-offset `1px`.
- **Disabled**: Background `#F4F1EA`, text `rgba(27, 26, 23, 0.35)`, border `rgba(27, 26, 23, 0.08)`, cursor `not-allowed`.
- **Error**: Border `#C83E28`, outline `2px solid #C83E28`.

---

### 6.3 Card (Task Item)
- **Base**: Background `#FBFAF6`, border `1px solid rgba(27, 26, 23, 0.14)`, radius 3px, padding `10px 12px`, no resting shadow.
- **Hover**: Border `rgba(27, 26, 23, 0.32)`, cursor `grab`.
- **Focus-visible**: Outline `2px solid #E4572E`, outline-offset `2px`.
- **Dragging**: Shadow `0 4px 12px rgba(27, 26, 23, 0.12)`, border `#1B1A17`, rotation `1deg`, cursor `grabbing`.
- **Active Viewing Indicator**: When another member is inspecting the card, a 2px left border accent `#E4572E` and a small initials chip in the top right.

---

### 6.4 List Column
- **Base**: Width `280px`, background `#EFECE4`, border `1px solid rgba(27, 26, 23, 0.12)`, radius 3px, padding `10px`.
- **Header**: Bricolage Grotesque 14px (Semibold), uppercase badge with count in JetBrains Mono 11px.
- **Card Container**: Vertical stack with `gap-2` (8px).
- **Footer**: Inline "Add card" trigger with quick-input field.

---

### 6.5 Modal (Detail Dialog)
- **Backdrop**: Solid dimming overlay `rgba(27, 26, 23, 0.40)`. No blurred glass or backdrop filters.
- **Dialog Box**: Background `#FBFAF6`, border `1px solid rgba(27, 26, 23, 0.24)`, radius 3px, shadow `0 8px 24px rgba(27, 26, 23, 0.14)`, max-width `540px`, padding `20px`.
- **Dividers**: 1px solid `rgba(27, 26, 23, 0.10)` separating header, body, and actions.
- **Keyboard**: Focus trapped inside dialog, closed with `Esc`.

---

### 6.6 Toast (System Notice)
- **Base**: Fixed position (bottom-right, 24px margin). Background `#1B1A17`, text `#FBFAF6`, border `1px solid rgba(251, 250, 246, 0.15)`, radius 3px, padding `10px 14px`, shadow `0 4px 12px rgba(27, 26, 23, 0.2)`.
- **Typography**: Instrument Sans 13px with actionable buttons in vermilion `#E4572E`.
- **Variants**: Neutral info (default), error with terracotta accent `#C83E28`.

---

### 6.7 Avatar Stack (Presence)
- **Chip**: 22px × 22px circular chip, background `#FBFAF6`, border `1px solid rgba(27, 26, 23, 0.20)`, text `#1B1A17`, font JetBrains Mono 10px (Bold).
- **Overlap**: `-5px` horizontal overlap.
- **Online Indicator**: 5px solid dot in `#2E6F40` positioned at the bottom right of active user chip.

---

### 6.8 Empty State
- **Container**: Border `1px dashed rgba(27, 26, 23, 0.20)`, background `transparent`, radius 3px, padding `24px`, text-align center.
- **Content**: Plain, direct explanation text in `#6B665C`, paired with a single primary or secondary button.

---

## 7. Voice and Microcopy Guidelines

### 7.1 Tone Rules
- **Direct, Calm, and Specific**: State facts plainly without manufactured excitement or apologetic filler.
- **Forbidden Phrases**:
  - Never write: *"Welcome back!"*, *"Oops!"*, *"Something went wrong"*, *"Seamless"*, *"Powerful"*, *"Effortless"*, *"Uh oh!"*.
- **Active Voice**: Clearly specify who did what or what needs user action.

### 7.2 Ten Calibrated Microcopy Examples

1. **Empty Board**:  
   `"No lists on this board yet. Create a list to begin organizing tasks."`
2. **Empty List**:  
   `"No cards in this list."`
3. **Empty Dashboard**:  
   `"You do not belong to any boards yet. Create a board to get started."`
4. **Failed Card Save (Network)**:  
   `"Unable to save card changes. Check your network connection and retry."`
5. **Unauthorized Board Deletion**:  
   `"Only the board owner can delete this board."`
6. **Destructive Board Delete Confirmation**:  
   `"Permanently delete 'Sprint 34'? All 4 lists and 28 cards will be removed immediately. This action cannot be undone."`
7. **Duplicate Member Invite**:  
   `"User 'bob@example.com' is already a member of this board."`
8. **Card Move Conflict / Revert**:  
   `"Card position could not be updated on the server. Reverting card to its previous position."`
9. **Socket Disconnect Notice**:  
   `"Disconnected from server. Reconnecting in 3 seconds..."`
10. **Active Card Inspection Badge**:  
    `"Bob is currently editing this card."`

---

## 8. UI States Across Core Views

Every screen and modal must implement discrete **Loading**, **Empty**, and **Error** states.

### 8.1 Login Screen (`/login`)
- **Loading**: Submit button changes to disabled secondary appearance with text `"Signing in..."`. Inputs disabled.
- **Empty**: Form with clean, empty inputs, visible focus rings, and explicit labels (`Email`, `Password`).
- **Error**: Terracotta border banner above form: `"Invalid email or password."`. Inputs remain editable.

### 8.2 Registration Screen (`/register`)
- **Loading**: Submit button disabled with text `"Creating account..."`.
- **Empty**: Blank form with helper text below password: `"Minimum 8 characters."`.
- **Error**: Form banner: `"An account with this email already exists."` or inline field message: `"Password must be at least 8 characters."`.

### 8.3 Dashboard View (`/boards`)
- **Loading**: 3 skeleton outline boxes (height 80px) with 1px border `rgba(27, 26, 23, 0.08)`.
- **Empty**: Dashed border container displaying `"You do not belong to any boards yet."` with a primary `"Create board"` button.
- **Error**: Solid box with 1px border: `"Unable to load boards."` accompanied by a secondary `"Retry"` button.

### 8.4 Board Canvas View (`/boards/:boardId`)
- **Loading**: 3 skeleton column containers with `"Loading board canvas..."` in JetBrains Mono.
- **Empty**: Board with zero columns displays `"No lists on this board yet. Add your first column."` and auto-focuses the `"Add a list"` field.
- **Error**: Centered message: `"Unable to load board. You may not have permission or the board was deleted."` with a `"Return to dashboard"` button.

### 8.5 Card Detail Modal
- **Loading**: Title and description inputs render faint hairline skeleton placeholders with disabled action buttons.
- **Empty**: If the description field is empty, displays placeholder `"Add a description for this task..."`.
- **Error**: Red warning banner at modal top: `"Unable to save card changes. Retry."` without clearing the user's uncommitted edits.
