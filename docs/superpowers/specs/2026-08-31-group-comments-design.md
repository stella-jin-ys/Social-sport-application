# Group comments design

## Goal

Let members discuss plans and updates directly on a group page.

## Scope

- Add a `GroupComment` record linked to a group and author.
- Allow only authenticated active members to post comments.
- Let visitors and non-members read the discussion.
- Display newest comments first with author name and timestamp.
- Limit new comments to 500 characters and reject blank submissions.
- Revalidate the group page after a successful post.

## Data model

`GroupComment` stores `id`, `groupId`, `userId`, `body`, `createdAt`, and `updatedAt`. Group and user relations cascade on deletion. Index comments by group and creation time for the group-page read path.

## Server boundary

The group page query returns comments with author display names. A server action validates the group slug and body, resolves the current user, verifies an `ACTIVE` membership, creates the comment, and returns a typed success or error result. Unauthorized users receive a clear recovery message and no database write occurs.

## UI

Add a discussion section below the training section. It contains a member-only textarea and submit button, a login prompt for signed-out visitors, and a readable empty state. The layout remains mobile-first and matches the existing group-page visual language.

## Verification

- Unit-test the comment form states and rendering.
- Integration-test member authorization, validation, creation, and newest-first ordering.
- Run type-checking, focused tests, and the production build before deployment.
