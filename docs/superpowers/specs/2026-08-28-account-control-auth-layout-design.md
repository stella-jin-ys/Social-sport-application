# Account control and auth-page layout design

Date: 2026-08-28

## Goal

Make standalone authentication pages comfortable to use at every viewport and give users a consistent account control in each main application header.

## Scope

- Add safe horizontal and vertical padding to standalone sign-in and sign-up pages.
- Constrain the authentication form to a readable card width and preserve the established Huddle light, energetic visual system.
- Add one reusable account control to the home, Discover, and group-detail headers.
- Do not add a profile route or profile-editing features.

## Account control behavior

The account control reads the Better Auth client session.

- While signed out, it renders a **Sign in** link.
- While signed in, it renders a circular 44px initials avatar button.
- The initials are derived from the user's display name, with a stable email fallback.
- Activating the avatar opens a dropdown anchored to the header control.
- The dropdown displays the user's name, email, and a **Sign out** action.
- The dropdown closes after sign-out, when Escape is pressed, or when the user clicks outside it.
- The avatar button exposes `aria-expanded`, `aria-controls`, and an accessible **Open account menu** name.
- Signing out returns the user to the home page and refreshes session-backed UI.

## Auth-page layout

Standalone `/sign-in` and `/sign-up` routes share an auth-page wrapper around the existing `AuthForm`.

- The wrapper fills the viewport and centers the form card.
- Mobile pages have safe outer padding and no edge-to-edge controls.
- The card has a maximum width of 30rem, uses the existing surface, border, radius, and focus tokens, and remains fluid below that width.
- The intercepted group sign-in modal keeps its existing layout and behavior.

## Component boundaries

- `AccountControl` owns session-aware account rendering, dropdown interaction, and sign-out.
- Existing page headers consume `AccountControl`; their navigation and primary actions remain otherwise unchanged.
- `AuthPage` (or an equivalently small shared wrapper) owns standalone auth-page composition only.
- `AuthForm` continues to own credential fields and authentication submission.

## Error and loading states

- Session loading reserves a stable control-sized area to avoid header layout shift.
- A rejected sign-out keeps the menu open, restores the action, and shows a retryable alert.
- No private name or email is rendered when the client has no authenticated session.

## Responsive and visual requirements

- Account controls remain at least 44px high.
- The menu aligns to the right edge of the avatar, stays inside narrow viewports, and uses a readable width.
- All interactive states have visible keyboard focus.
- Existing Huddle typography, orange accent, light surfaces, imagery, and page composition remain unchanged outside the requested surfaces.

## Testing and acceptance

Implementation follows test-driven development.

- Component tests cover signed-out, loading, and signed-in states.
- Component tests cover menu opening, Escape dismissal, outside-click dismissal, successful sign-out, and rejected sign-out recovery.
- Page tests prove standalone sign-in and sign-up routes use the shared padded wrapper.
- Existing unit, integration, typecheck, lint, and build checks remain green.
- Browser verification covers the sign-up card and account menu at desktop and 390×844, including keyboard focus and browser error logs.

