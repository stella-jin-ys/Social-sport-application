# One-Time Events and Personal Schedule

**Status:** Approved design
**Date:** 2026-08-28

## Goal

Give groups a structured way to organize one-time sports or social events without using date polls or unstructured chat, and give members one place to see upcoming events from their joined groups.

## Scope

### Event creation

An organizer can create a one-time event with:

- Title
- Event description
- Date
- Start time
- City

The event is confirmed immediately when published. The description is the place for venue names, street addresses, meeting points, and additional instructions. Events do not have an end time in this phase.

Organizers can edit or cancel events they created or events belonging to groups they organize.

### Event visibility and comments

Event details are visible from the group experience. A group member can read and post comments on an event. A signed-out visitor or non-member can view the event details but cannot comment.

Comments contain a text body, author, and creation timestamp. This phase does not include reactions, threaded replies, editing, deletion, mentions, or notifications.

### Personal schedule

Signed-in users have a schedule view containing upcoming, confirmed events from groups where they have an active membership. Events are sorted chronologically and show the group, title, city, date, start time, and description. Cancelled and past events are excluded from the default upcoming view.

The schedule is read-only in this phase. It does not include event RSVP, calendar export, reminders, or external calendar synchronization.

### City browsing

The city is stored as a structured event field. The group event listing and schedule support city-aware display; event browsing can filter by city without parsing the description.

## Authorization

- Only authenticated organizers can create, edit, or cancel events.
- Only active group members can create event comments.
- Group membership and organizer permissions are checked server-side.
- A cancelled event remains stored for auditability but is not shown in upcoming schedule results.

## Data model

Add an `Event` entity related to a group and its creator, with title, description, city, start date/time, status, and timestamps.

Add an `EventComment` entity related to an event and its author, with body and creation timestamp.

Use the project’s existing Prisma, service, and authorization patterns. The first implementation should avoid introducing a separate calendar or messaging abstraction.

## Product surfaces

- Group detail: upcoming event list and event details/comments.
- Organizer flow: create, edit, and cancel event controls.
- Discover or city browsing: event results can be filtered by city where the existing discovery surface supports event listings.
- Personal schedule: a signed-in schedule page linked from the main navigation.

## Error and empty states

- Invalid or incomplete event fields show inline validation.
- Unauthorized create/edit/cancel/comment attempts are rejected server-side and surfaced as an actionable error.
- Groups with no upcoming events show a concise empty state.
- Users with no joined-group events see a schedule empty state with a link to discover groups.
- Cancelled events show a clear cancelled state when reached directly, but do not appear in upcoming lists.

## Accessibility and responsive behavior

- Event forms use associated labels and keyboard-accessible controls.
- Comments have a labelled input and a clear submit action.
- Date, time, and city information use readable text labels, not color alone.
- Group event lists and the schedule remain usable on narrow mobile viewports.
- New interactive surfaces receive visible focus styles and feature-scoped axe coverage.

## Out of scope

- Date options and voting
- Event attendance or RSVP
- End times
- Notifications and reminders
- Calendar export or external synchronization
- Threaded comments, reactions, mentions, editing, or deletion
- Event discovery beyond the existing group/discover experience

## Success criteria

1. An organizer can publish a one-time event with a description and city.
2. A member can see the event and post a comment.
3. A non-member cannot post a comment or modify the event.
4. A signed-in member can find upcoming confirmed events from all joined groups in one schedule.
5. The critical flows pass on a narrow mobile viewport with no feature-scoped accessibility violations.
