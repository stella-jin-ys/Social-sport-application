# Group Sport Platform MVP Roadmap

**Spec:** `docs/superpowers/specs/2026-08-27-group-sport-community-platform-design.md`

## Why the MVP is split

The approved specification contains discovery, scheduling, attendance, events, messaging, notifications, recommendations, and moderation. These are connected product capabilities but independently reviewable engineering subsystems. Building them as five vertical phases keeps every phase deployable and gives pilot users something coherent to validate before the next subsystem is added.

Each phase receives its own detailed implementation plan. The original broad Phase 1 plan is archived because the completed persistent-membership slice superseded its immediate instructions; see `docs/superpowers/README.md` for the active plan.

## Open-source foundation decision

Two active projects were evaluated before choosing the starting point:

- **[OpenLeague](https://github.com/mbeacom/openleague)** is Apache-2.0 licensed and already includes authentication, teams, scheduling, RSVP, waitlists, and notifications. Its architecture is useful reference material, but its product centers on established teams, leagues, rosters, payments, equipment, and rink operations. Forking it would introduce substantial unrelated behavior before public social discovery could be built.
- **[Teamsster](https://github.com/evillollive/Teamsster)** covers many scheduling, messaging, and moderation concerns, but it is league-first and AGPL-3.0 licensed. Operating a modified network service would require offering the corresponding source code to its users.

Start from a small, clean Next.js modular monolith. Reuse patterns and lessons from these projects, but do not copy or fork their code. Revisit this decision only if the product changes toward league administration.

## Shared technical direction

- Node.js 24 LTS and pnpm 10
- Next.js 16 App Router and React 19
- TypeScript 5.9 in strict mode
- PostgreSQL 17 and Prisma ORM 7
- Better Auth with the official Prisma adapter
- Zod for input contracts
- Tailwind CSS 4 for the responsive interface
- Vitest and Testing Library for unit and component tests
- Playwright and axe-core for end-to-end and accessibility checks
- One deployable application and one relational database

## Phase 1: Core coordination vertical slice

**Outcome:** A visitor can create an account, discover a public group using the three approved filters, join instantly, see a generated weekly session, respond to attendance, and post in that session's discussion.

Includes:

- Application and test foundation
- Account creation and sessions
- Sports profile and manually selected locations
- Public group creation and public profiles
- Exact MVP discovery filters: sport; country, city, or area; participation type
- Open membership, organizer/member roles, and server-side authorization
- Weekly recurring activities and idempotent session generation
- Going, Maybe, Not going, capacity, and FIFO waiting list
- Group home and session-specific discussion
- Responsive PWA shell and one full end-to-end journey

Does not expose the pilot publicly. Reporting and blocking arrive before public launch in Phase 5.

**Completion gate:** The end-to-end test passes on a clean PostgreSQL database, and pilot testers can complete the outcome on a narrow mobile viewport without using direct database tools.

## Phase 2: Events and personal schedule

**Outcome:** Members can coordinate one-time sports or social events, vote on dates, confirm the chosen date, and see activities from all groups in one schedule.

Includes:

- Fixed-date events
- Date options, one vote per member per option, and organizer confirmation
- Public event pages and event listings in Discover
- Event attendance and event-specific discussion
- Event cancellation and date-change history
- Personal schedule across joined groups
- Filters by group, sport, and attendance status
- Calendar-oriented responsive views

**Completion gate:** A member can vote, receive the confirmed result in the application, and find the resulting event in the personal schedule.

## Phase 3: Structured social communication

**Outcome:** Groups can replace the unstructured WhatsApp stream with communication organized by purpose.

Includes:

- Organizer announcements and acknowledgement
- General group chat
- Topic channels
- Real-time activity and event threads
- Direct messages limited by shared-group and privacy rules
- Unified inbox with priority ordering
- Mentions, unread counters, pinned items, and permission-scoped search
- Message submission idempotency and rate limiting

**Completion gate:** A schedule update, announcement, group conversation, topic, and direct message remain distinguishable in the inbox and are visible only to authorized users.

## Phase 4: Notifications and durable background work

**Outcome:** Members receive reliable reminders and urgent changes according to per-group preferences.

Includes:

- In-app notification feed
- Email delivery adapter
- Web Push subscription and delivery
- Per-group and per-category preferences
- Attendance opening and deadline reminders
- Cancellation, venue change, waiting-list promotion, mention, and direct-message notifications
- Durable delivery outbox, retries, and operator visibility for exhausted deliveries
- Scheduled recurring-session generation

**Completion gate:** A stored schedule change remains visible when delivery is unavailable, then delivers successfully after a retry without duplicate notifications.

## Phase 5: Public-launch safety, recommendations, and pilot hardening

**Outcome:** The platform can safely open discovery and instant joining to public users.

Includes:

- User, message, event, and group reports
- Blocking and direct-message request controls
- Organizer warning, muting, removal, and banning
- New-member label and posting restrictions
- Approval-request and invite-only membership flows
- Delegated co-organizer permission grants
- Immediate member-only access revocation
- Platform moderator queue and immutable action audit log
- Public-field indexing and exact-location privacy checks
- Rules-based recommendation lists
- Search-engine metadata for public group pages
- Analytics for the approved success criteria
- Mobile accessibility, slow-network, interrupted-submission, and abuse testing

**Completion gate:** Permission-boundary and abuse-path tests pass, moderators can resolve reports with an audit trail, and a limited real-group pilot completes at least two weekly cycles.

## Sequence rule

Execute phases in order. A phase may be released to internal pilot users when its completion gate passes, but public discovery must remain disabled until Phase 5 is complete.

## Specification Coverage Map

| Specification area | Delivery phase |
| --- | --- |
| Accounts, profiles, sports, and manually selected locations | Phase 1 |
| Public groups, exact discovery filters, membership roles, and instant joining | Phase 1 |
| Weekly recurrence, generated sessions, attendance, capacity, and waiting lists | Phase 1 |
| Group home and session-specific discussion | Phase 1 |
| One-time events, date polls, public event discovery, and personal schedule | Phase 2 |
| Announcements, general chat, topics, direct messages, inbox, pinned content, and search | Phase 3 |
| In-app, email, and Web Push notifications with durable retry | Phase 4 |
| Approval-only and private membership, reports, blocking, bans, delegated roles, and moderator audit log | Phase 5 |
| Rules-based recommendations, public-page indexing, success analytics, and pilot hardening | Phase 5 |
| Payments, leagues, facility booking, advanced ranking, livestreaming, and native apps | Explicitly excluded from the MVP |
