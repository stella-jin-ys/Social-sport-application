# Recurring training and organizer edits design

## Goal

Make weekly training sessions concrete and editable by the group creator or organizer.

## Scope

- Store recurring weekday, start time, end time, and venue as structured group fields.
- Ensure a future weekly session exists for recurring groups when group data is read.
- When the current recurring session passes, create the next week’s session automatically.
- Let an organizer edit the group sport and the next upcoming event/training.
- A recurring schedule edit changes only the next upcoming training; later weeks continue using the existing recurring cadence unless edited again.
- Members and visitors cannot use the edit action.

## Authorization

The edit server action requires an authenticated user with an `ORGANIZER` role and `ACTIVE` membership for the group. It validates the group slug and submitted fields before updating any records.

## Data model

Add nullable recurring fields to `Group`: weekday, start time, end time, and venue. Keep `ActivitySession` as the concrete attendance target. Recurring groups receive stable generated session IDs based on group and week; one-time events remain ordinary sessions.

## UI

Show an organizer-only Edit control on the group detail page. The editor includes sport, next event title, date, start/end time, venue, and recurring schedule fields. On success, refresh the page and show the updated next training.

## Verification

- Test next-week session generation and idempotency.
- Test organizer authorization and next-event updates.
- Test organizer-only edit visibility and form submission.
- Run local unit tests, type-checking, and show the updated group page locally before deployment.
