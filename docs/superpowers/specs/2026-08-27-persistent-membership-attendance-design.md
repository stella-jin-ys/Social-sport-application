# Persistent Membership and Attendance Design

## Summary

Replace the group detail demo's browser-only join and attendance state with authenticated PostgreSQL records. Public discovery remains available without an account. A signed-out visitor who presses **Join group** sees sign-in in a modal over the group page. Successful authentication from that pending join flow completes the membership automatically and unlocks attendance. Ordinary sign-in, failed authentication, and closing the modal do not create membership.

This is a focused Phase 1 slice. It does not add chat, waiting lists, organizer dashboards, approval-only groups, or event management.

## Product Decisions

- Public group profiles remain visible to signed-out visitors.
- Clicking **Join group** while signed out opens a sign-in modal without leaving the group context.
- The modal offers both sign-in and account creation.
- Pressing **Join group** records a pending join intent for that group before opening authentication.
- Successful authentication from that modal consumes the pending intent, creates the membership, closes the modal, and returns to the same group page in the joined state.
- Failed authentication does not create membership and keeps the modal open so the user can retry the same pending join.
- Closing the modal, cancelling, or using browser Back clears the pending intent and does not create membership.
- Signing in through the ordinary sign-in route does not create membership.
- Public open groups join instantly. Organizer moderation happens after joining; moderation controls are outside this slice.
- Only active members can respond to training attendance.
- Membership and attendance survive reloads and work across devices for the same account.

## User Flow

### Signed-out visitor

1. Open a public group profile.
2. Press **Join group**.
3. See the sign-in route rendered as a modal over the current group.
4. Sign in or create an account.
5. After successful authentication, return to the same group profile in the persistent joined state with the attendance control unlocked.

Closing the modal or using browser Back clears the pending join intent and returns to the unchanged group profile. A failed authentication attempt preserves both the entered email and pending join intent, displays an inline error, and creates no membership. A later successful retry completes the join; closing the modal instead clears the intent and leaves the visitor unjoined.

### Signed-in non-member

Pressing **Join group** creates one active member record. Repeating the request returns the existing membership and never duplicates it.

### Active member

The member can mark the next training as going or not going. The latest response replaces the previous response for that member and session. Reloading the group page restores both membership and attendance state.

## Application Architecture

The application remains a single Next.js App Router service backed by PostgreSQL and Prisma. Better Auth remains the authentication boundary.

### Routes and components

- `/discover` loads public groups from PostgreSQL and keeps the approved sport, location, and participation filters.
- `/groups/[slug]` loads the public group, current user membership, and next public session on the server.
- A focused client action component renders Join and attendance states and calls authenticated server actions.
- `/sign-in` remains a full page for direct navigation.
- A root parallel route intercepts `/sign-in` when navigation begins inside the app and renders the same form in an accessible modal.
- The Join control records a tab-scoped pending intent containing the group slug and same-origin return path, then navigates to the intercepted sign-in route. Arbitrary `join` query parameters are not treated as consent.
- After successful modal authentication, the shared form submits the pending intent to an authenticated join action. When joining succeeds, it clears the intent, closes the modal, returns to the group, and refreshes server data.
- Closing the modal clears its pending intent. The direct `/sign-in` page has no join intent and only signs the user in.

The existing sign-in form is extracted into a reusable component so the full-page and modal routes share behavior and validation. The group page keeps the current visual design; only authenticated state, disabled states, progress feedback, and errors are added.

### Server actions and services

Route components do not contain membership rules. Focused services own the mutations:

- `joinOpenGroup(userId, groupSlug)` finds a public open group and creates or returns its active membership in one idempotent operation. It is called after successful authentication only when the current tab holds a pending intent created by the Join control.
- `setAttendance(userId, sessionId, status)` verifies active membership in the session's group and upserts that user's attendance response.

Thin server actions obtain the authenticated user, validate input, call these services, and revalidate the affected group route. Authorization is always checked on the server; hiding a button is not treated as authorization.

## Data Model

The six current demo groups and their displayed next sessions are seeded into PostgreSQL. Database rows become the source of truth for both Discover and group profiles; the static catalog is retained only as seed input or removed after migration.

### Group

Stores a stable unique slug, name, sport, public description, country/city/area display data, participation type, membership mode, schedule summary, organizer display name, public member-count baseline, and visual accent values used by the current cards.

This slice supports `PUBLIC_OPEN` membership in the interface. The schema may represent the other approved modes, but no approval or invitation workflow is implemented.

### GroupMembership

Connects one Better Auth user to one group with role, active state, and join timestamps. A unique `(groupId, userId)` constraint guarantees one membership per person per group. Rejoining a previously inactive membership reactivates the same record instead of inserting another.

### ActivitySession

Stores the group, title, start/end times, public venue text, and cancellation state for a concrete training session. This slice seeds the displayed next session; recurring generation remains a later Phase 1 task.

### AttendanceResponse

Connects one user to one activity session with `GOING` or `NOT_GOING` and an update timestamp. A unique `(sessionId, userId)` constraint makes responses idempotent. Capacity, `MAYBE`, and waiting-list behavior remain outside this slice.

## Data Flow and Consistency

Public reads query PostgreSQL directly. Authenticated page reads add membership and attendance only for the current user; they do not expose other members' private profile data.

The pending join intent is local to the current browser tab and is never itself a membership. Failed authentication causes no database mutation and keeps the intent available for a retry while the modal remains open. Modal dismissal clears it without a database mutation. Successful authentication supplies the new session to the authenticated join action, which consumes the intent through one idempotent request.

Joining runs in a transaction that creates or reactivates membership and updates the imported public member count only when the active-member state actually changes. Attendance uses a database upsert after membership authorization. Both mutations return canonical server state to the client, and the route is revalidated so a reload produces the same result.

## Error Handling

- Missing or non-public groups return the existing friendly not-found experience.
- A signed-out Join click records pending intent and opens the sign-in modal without attempting a database mutation.
- Failed authentication creates no membership and preserves pending intent only while the modal remains open for retry.
- Modal dismissal clears pending intent without creating membership.
- If authentication succeeds but joining fails, the user remains signed in but not joined; the group page shows a retryable join error.
- A non-member attendance request returns a permission error without revealing member-only information.
- Pending mutations disable only the affected control and use clear progress labels.
- Database or network failures keep the page and user input intact, display an inline retry message, and restore the previous button state.
- The `returnTo` parameter accepts only local application paths to prevent open redirects.

## Accessibility and Responsive Behavior

The modal has a labelled dialog, initial focus on its heading or first field, Escape and close-button support, focus containment, and focus restoration to **Join group**. Authentication and mutation errors use an announced alert region. Pending and selected button states are conveyed with text and ARIA state, not color alone. Existing keyboard focus outlines and mobile layouts remain intact.

## Testing and Completion Criteria

### Unit and component tests

- Signed-out Join records intent and requests the sign-in modal for the current group.
- Successful modal authentication consumes intent, preserves the group route, and renders the persistent joined state.
- Failed authentication creates no membership; a later successful retry in the still-open modal completes the pending join.
- Modal dismissal and direct sign-in do not create membership.
- Joined and attendance states render from server-provided state.
- Pending, permission, and retry errors are understandable and accessible.

### PostgreSQL integration tests

- Joining creates one membership and repeated requests do not duplicate it.
- An inactive membership is reactivated rather than duplicated.
- A non-member cannot set attendance.
- A member can create and replace one attendance response per session.
- Seeded groups and sessions can be read by stable slug.

### Browser verification

On a clean local database, a visitor can discover a group, open it, press Join, authenticate in the modal, return already joined, set attendance, reload, and see both states preserved. Separate checks confirm that failed authentication and closing the modal leave the visitor unjoined. The same journey is checked at a narrow mobile viewport, with keyboard operation, no accessibility violations in the changed flow, and a successful production build.

## Deferred Work

- Organizer moderation interface and removal/ban actions
- Approval-only and invite-only joining
- Recurring-session generation
- `MAYBE`, capacity, and FIFO waiting lists
- Group and session discussions
- Notifications, events, and polls
