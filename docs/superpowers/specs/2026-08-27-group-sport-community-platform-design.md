# Group Sport Community Platform Design

## Summary

Build a public, mobile-first sports community platform where people can discover groups, join them, organize recurring activities and one-time events, manage attendance, and communicate without important information becoming buried in a single chat stream.

The initial use case is a public women's innebandy group that trains weekly, collects attendance through chat polls, and organizes social events through messages and date votes. The same product model must support other sports and users who belong to multiple groups.

## Product Goal

Enable a public sports group to move weekly coordination from WhatsApp into one structured application without losing the informal, social experience that keeps the group active.

The product combines:

- Public group and sport discovery
- Persistent group communities
- Recurring activity scheduling and attendance
- One-time events and date polling
- Structured conversations and announcements
- Safety and moderation for openly joinable groups

## Success Criteria

The first release succeeds when pilot groups can use the application as their primary place to coordinate weekly activities. Measure:

- The percentage of visitors who discover and join a group
- The percentage of new members who respond to an activity
- Weekly member return rate
- Organizer retention across multiple recurring sessions
- The percentage of pilot organizers who stop recreating attendance polls in WhatsApp
- Reports and moderation incidents per active group

## Product Principles

1. **Discoverable by default.** People can browse groups in any location without first joining or selecting a current location.
2. **Social by default.** Public groups allow instant joining unless an organizer chooses approval-only or invite-only membership.
3. **Structured around activity.** Schedules, attendance, polls, announcements, and conversations remain attached to the item they concern.
4. **Private where necessary.** Public discovery does not expose private conversations, optional profile data, or exact venues by default.
5. **Simple first release.** The MVP focuses on group coordination and excludes payments, leagues, facility booking, and advanced recommendation models.

## Users and Roles

### Visitor

A visitor can browse public groups, sports, locations, and public events. A visitor can see a group's public profile but must create an account to join, respond, or communicate.

### Member

A member can join permitted groups, respond to attendance, join waiting lists, participate in conversations, vote in event polls, create events when group permissions allow it, report content, and manage personal notification settings.

### Organizer

An organizer creates and manages a group, recurring activities, events, membership settings, roles, announcements, and moderation actions.

### Co-organizer

A co-organizer receives selected organizer permissions. The primary organizer controls which management and moderation abilities are delegated.

### Platform moderator

A platform moderator reviews reports, removes harmful content, suspends accounts, and closes unsafe or fraudulent groups. Moderator actions are recorded in an audit log.

## Information Architecture

The primary navigation contains:

- **Discover:** public groups, public events, sport recommendations, and location recommendations
- **My Groups:** groups the user has joined or manages
- **Schedule:** upcoming activities and events across joined groups
- **Inbox:** announcements, mentions, activity discussions, topic messages, and direct messages
- **Profile:** sports, preferred locations, optional personal information, privacy, and notification settings

Each group home shows the next activity, the member's attendance status, announcements, upcoming events, active topics, and recent group conversation.

## Group Discovery and Membership

### Public group profile

A public group profile shows:

- Name and sport
- Country, city, or approximate area
- Women-only, mixed, or open participation
- Description and social or competitive focus
- Typical schedule and skill information
- Member count
- Organizer information chosen for public display
- Upcoming activities or events marked public
- Membership mode

Exact venues, member-only profile details, and conversations are hidden from visitors.

### Search filters

The MVP offers exactly these discovery filters:

- Sport
- Country, city, or area
- Women-only, mixed, or open participation

Schedule, skill level, age range, and cost may appear as group profile information but are not MVP search filters.

### Recommendations

The Discover area contains rules-based lists such as:

- Groups for you
- Popular in a selected location
- Active this week
- New groups
- Sports to try

Initial recommendations use explicit sport interests, manually selected locations, joined groups, group activity, and popularity. Users can follow sports and locations without joining a group. Behavioral ranking and machine-learning personalization are outside the MVP.

### Membership modes

- **Public and open:** discoverable and instant join; this is the default
- **Public and approval-only:** discoverable, but an organizer must approve requests
- **Private:** accessible only through an invitation

A person may belong to multiple groups and hold a different role in each one.

## Activities, Events, and Attendance

### Recurring activities

An organizer defines a recurring activity with a title, recurrence, start and end time, location, optional capacity, attendance-open time, response deadline, and reminder settings. The system automatically creates future sessions from that schedule.

Editing or cancelling one session does not alter the remaining series. Editing the series applies prospectively and does not rewrite completed sessions.

### Attendance

For each session, a member chooses:

- Going
- Maybe
- Not going

The session displays confirmed participants, remaining capacity, and the waiting list. When a confirmed member leaves a full session, the first eligible waiting-list member is promoted and notified. Attendance updates appear immediately to participants and organizers.

### One-time events

Groups can create tournaments, social gatherings, workshops, trips, special games, or other one-time events. Events may use a fixed date or begin with a date poll.

For a date poll, the creator proposes options, members vote, and an authorized organizer confirms one option. The confirmed result becomes the event date. The poll, result, attendance, updates, and discussion remain attached to the event.

### Personal schedule

The Schedule area combines activities and events from all joined groups. It can be filtered by group, sport, and the user's attendance status.

## Communication

Each group supports several communication contexts:

- **Announcements:** organizer-only posts for important updates; reactions and replies remain attached to the announcement
- **General chat:** informal group-wide conversation
- **Topic channels:** persistent discussions such as equipment, carpools, tournaments, or social plans
- **Activity and event threads:** messages attached to a specific session, event, or poll
- **Direct messages:** private member-to-member conversations subject to privacy and blocking rules

Search covers announcements, topics, events, and messages. Organizers can pin permanent information such as rules, equipment requirements, venue guidance, and payment instructions.

The unified inbox prioritizes announcements, mentions, direct messages, and schedule changes above ordinary group chat.

## Notifications

Members configure notifications by group and category. A member may keep announcements and schedule changes enabled while muting general chat.

Priority notifications include:

- Activity cancellation
- Venue or time change
- Attendance opening and deadline reminders
- Waiting-list promotion
- Event date confirmation
- Mentions and direct messages
- Moderation actions affecting the member

Schedule and attendance changes are committed before notifications are queued. Failed deliveries are retried, while the canonical update remains visible in the application.

## Safety, Privacy, and Moderation

Open membership requires core safety controls:

- Report users, messages, events, and groups
- Block users and direct communication
- Warn, mute, remove, or ban members at group level
- Restrict newly joined members from posting links or creating events
- Disable incoming direct-message requests
- Limit direct messages to people who share a group
- Keep reporters anonymous from the reported person
- Record platform moderator actions in an audit log

New members receive a temporary visible label within the group. Organizers may let new members read discussions and register for activities while temporarily restricting posting abilities.

Profiles expose only information users choose to share. Exact venues may remain hidden until a person joins the group or registers for the relevant public event.

Women-only participation is expressed through group rules and organizer moderation. The platform does not require users to publish sensitive identity information to participate.

## Technical Architecture

### Client

Launch as a responsive, mobile-first web application that can be installed as a Progressive Web App. Shared public links open directly in the browser. Native iOS and Android applications may be introduced after product validation.

### Backend

Use a modular monolith with bounded modules for:

- Accounts and profiles
- Groups and memberships
- Discovery and recommendations
- Recurring activities and generated sessions
- Attendance and waiting lists
- Events and polls
- Conversations and messages
- Notifications
- Reports and moderation

One deployable backend and one relational database keep the first version operationally simple. Module interfaces prevent business rules from becoming coupled and allow later extraction only if scale makes it necessary.

### Supporting services

- Real-time connections for chat and attendance updates
- Background jobs for session generation, reminders, and notification retries
- Object storage for permitted user and group media
- Authentication provider or secure first-party authentication
- Location lookup for country, city, and area selection
- Push and email delivery providers

### Core data entities

- User and UserPreference
- Sport and FollowedSport
- LocationPreference
- Group, GroupMembership, and GroupRole
- RecurringActivity and ActivitySession
- AttendanceResponse and WaitingListEntry
- Event, EventDateOption, and EventVote
- Conversation, ConversationParticipant, and Message
- Announcement and PinnedItem
- NotificationPreference and NotificationDelivery
- Report, ModerationAction, Block, and GroupBan

## Data and Process Rules

- Retrying a join, attendance response, event creation, or message submission must not create duplicate records.
- Session generation is idempotent: retrying the same recurrence window cannot generate duplicate sessions.
- Membership and role checks apply on the server for every protected action.
- Removing a member immediately revokes access to member-only conversations and locations.
- Banning a member prevents rejoining the same group until the ban is removed.
- Completed sessions retain historical attendance even when a recurrence is later changed.
- Public search indexes only fields explicitly classified as public.

## Error Handling

Actions provide immediate, understandable feedback. If joining, responding, voting, or sending a message fails, the client preserves the user's input and offers a retry. Optimistic interface updates must reconcile with server results and clearly revert when rejected.

Notification failure does not roll back a successfully stored schedule change. Background jobs retry transient failures and surface exhausted failures to operators. Permission errors explain that access changed without exposing private group information.

## Testing Strategy

### Unit tests

Cover recurrence calculations, attendance transitions, capacity rules, waiting-list promotion, poll confirmation, recommendation inputs, notification preference resolution, and permission policies.

### Integration tests

Cover database constraints, idempotent session generation, membership changes, conversation visibility, notification queuing, reports, bans, and moderator audit records.

### End-to-end tests

Cover these complete journeys:

1. Discover a public group, create an account, join instantly, and view member content.
2. Respond to a generated weekly activity and participate in its discussion.
3. Fill a session, join its waiting list, and receive promotion after a cancellation.
4. Vote on event dates and receive the confirmed event update.
5. Change a venue and verify that participants see the update even if notification delivery is delayed.
6. Block and report a user, then verify communication and moderation boundaries.
7. Remove or ban a member and verify immediate access revocation.

### Experience validation

Test mobile layouts, keyboard navigation, screen-reader labels, color contrast, reduced-motion preferences, slow connections, and interrupted submissions. Pilot the product with real organizers and members before broad launch.

## MVP Scope

The MVP includes:

- Accounts and lightweight sports profiles
- Public group creation, discovery, recommendations, and joining
- The three approved discovery filters
- Group roles and member moderation
- Recurring activities and generated sessions
- Attendance, capacities, and waiting lists
- One-time events and date polls
- Group home, announcements, general chat, topics, and item-specific threads
- Direct messages and blocking
- Personal schedule and unified inbox
- Configurable notifications
- Reporting and a basic platform moderator dashboard
- Installable mobile-first web experience

## Explicit Non-goals

The MVP does not include:

- Payments or subscriptions
- League administration or tournament brackets
- Facility booking
- Advanced ranking or machine-learning recommendations
- Livestreaming or video calls
- Native iOS or Android applications
- Public exposure of exact venues by default

## Rollout

Start with a small number of real sports groups in one or two cities. Onboard organizers directly, import their recurring schedule manually through the product, and observe one complete weekly cycle. Expand only after the core discovery, joining, attendance, and communication workflows are reliable and organizers choose the application as their primary coordination tool.
