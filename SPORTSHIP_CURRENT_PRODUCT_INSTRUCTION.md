# Sportship — Current Product Instruction

## Product direction

Sportship is a discoverable social sports platform. Users browse local sports groups, filter by sport and location, join groups, attend recurring training, communicate in group discussions, and see confirmed one-time events in their personal schedule.

Ignore all previous travel-planner discussions, travel-app branding, unrelated plans, and the incorrect repository. Sportship is the only active product direction.

## Current source of truth

- Repository: `https://github.com/stella-jin-ys/Social-sport-application.git`
- Active branch: `codex/phase-1-fast-build`
- Product name: Sportship
- Web app: `https://social-sport-app-sportship.vercel.app`
- Capacitor app ID: `com.sportship.app`

## Implemented product scope

- Discoverable groups with sport and city filters
- Recommended groups
- Women-only, mixed, open, and men-only participation
- Group creation with recurring schedule/rhythm
- Group membership and attendance
- Sign-in modal flow before joining
- Account avatar and account dropdown
- One-time events with descriptions and member comments
- Personal schedule for confirmed events
- Responsive 16:10 hero image with a shared source
- Accessible pending states with disabled buttons
- Vercel deployment and Capacitor iOS/Android shells

## Development order

1. Make the Vercel domain publicly accessible and verify deployment protection settings.
2. Configure production database, authentication origins, environment variables, and migrations.
3. Test the deployed app end-to-end on desktop and mobile.
4. Finish mobile branding, icons, splash screens, deep links, and native authentication behavior.
5. Build and test iOS through Xcode and TestFlight.
6. Build and test Android through Android Studio and internal testing.
7. Prepare privacy policy, account deletion, moderation/reporting, support contact, screenshots, and store metadata.
8. Submit to the Apple App Store and Google Play.
9. Continue product improvements from verified user feedback and reproducible issues.

## Working rules

- Make the smallest focused implementation that solves the requested problem.
- Preserve Sportship branding and the existing product direction.
- Do not reintroduce travel-planner concepts or use another repository.
- Run type checks, lint, relevant tests, and live UI verification before declaring a change complete.
- Commit changes to the Social-sport-application repository and active branch.
- Keep secrets in environment variables; never commit `.env` files or credentials.
