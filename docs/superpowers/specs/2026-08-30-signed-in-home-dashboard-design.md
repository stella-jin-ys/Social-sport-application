# Sportship Signed-in Home Dashboard

## Goal

After authentication, Sportship’s home page should help a member resume their sports life: see joined groups, see upcoming training or events, discover other groups, and explore recommendations. Signed-out visitors should continue to get the public sport-and-city finder.

## Product behavior

### Signed-out visitor

- Render the current public finder as the primary experience.
- Keep sport selection, city entry, group results, and the existing “Start a group” path.
- Keep the public discover route as the full browse/search experience.

### Signed-in member

- Render a personalized home dashboard first.
- Show active joined groups with group name, sport, location, membership context, and the next non-canceled activity when one exists.
- Show upcoming activities across joined groups, ordered by `startsAt`.
- Provide a clearly labeled “Search other groups” action linking to `/discover`.
- Show recommended sports and recommended public groups after the member’s activity.
- Exclude groups the member is already an active member of from recommendations.

### Signed-in member with no groups

- Show an inviting empty state with a “Find a group” action.
- Keep the finder and recommendations available immediately below it.

### Missing upcoming activity

- Keep the joined group visible.
- Do not invent a training or event; show a concise “No upcoming activity” state.

## Architecture

`src/app/page.tsx` becomes the server boundary and calls `getCurrentUser()`. It fetches personalized data only when a user exists, then renders a server dashboard shell around a client finder component. The finder owns only local sport/city state and remains interactive without introducing a client-side auth or membership fetch.

Existing `ActivitySession` records represent both training and events for this scope. No new event model or authentication change is required.

## Data contracts and queries

Extend `src/modules/groups/contracts.ts` with focused home-dashboard types:

- `JoinedGroupCard`: group identity, sport, location, membership metadata, and optional next activity.
- `UpcomingActivity`: session id, group slug/name, title, start/end, venue, and attendance count.
- `HomeDashboardData`: joined groups, upcoming activities, recommended groups, and recommended sports.

Add focused query functions to `src/modules/groups/group-queries.ts`:

1. `listJoinedGroups(userId)` filters `GroupMembership.status = ACTIVE`, includes the related group and its earliest non-canceled future session, and preserves group ordering by joined date.
2. `listUpcomingActivities(userId)` finds non-canceled future sessions through active memberships and orders them by `startsAt` ascending.
3. `listRecommendedGroups(userId)` lists public groups while excluding active memberships; recommendations remain ordered by the existing `recommended` flag and group name.

The query layer owns database filtering and mapping. Components receive display-ready values and do not access Prisma.

## Components and interaction

Add focused components under `src/components/home/`:

- `home-dashboard.tsx`: personalized layout and empty state.
- `home-finder.tsx`: existing sport/city finder interaction extracted from the page.
- `joined-group-card.tsx`: joined group summary and next activity.
- `upcoming-activity.tsx`: compact upcoming training/event row.
- `recommended-groups.tsx`: recommended sports and group links.

The dashboard’s primary actions are “View group” and “Search other groups”. Group cards link to `/groups/[slug]`; search links to `/discover`. Existing join, attendance, auth, and group-detail actions remain unchanged.

## Failure and loading behavior

- A signed-out page remains usable without personalized queries.
- If a personalized query fails, log the server-side error and render the public finder with a neutral fallback message; do not expose database details.
- Empty collections are rendered intentionally rather than hidden.
- Existing reduced-motion behavior remains in force for the mobile-first visual system.

## Verification

Add tests before implementation for:

- Active membership filtering.
- Future/non-canceled activity ordering.
- Recommendation exclusion of joined groups.
- Signed-out home rendering.
- Signed-in dashboard rendering with joined groups.
- Signed-in empty membership rendering.
- Existing sport/city finder behavior.

Run the focused unit and integration tests, TypeScript, lint, and the UI detector after implementation. Keep changes limited to the home page, home components, group query contracts/implementation, and related tests.

## Explicit non-goals

- No changes to auth flows or account persistence.
- No changes to join or attendance server actions.
- No new event database model.
- No redesign of `/discover` or group detail pages.
- No push notifications, calendar integration, or RSVP workflow changes.
