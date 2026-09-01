# Sportship

Sportship is a social sports app that helps people find and join local sports groups. Browse groups by sport and city, see upcoming trainings and events, join communities, and discuss plans with other members.

## Live demo

[Open Sportship](https://social-sport-app-sportship.vercel.app/)

## What you can do

- Discover local groups by sport and city
- View group details, recurring trainings, and one-time events
- Create groups and manage schedules as an organizer
- Join groups and confirm attendance
- See joined-group activities on the home dashboard
- Discuss plans with group members through comments

## Tech stack

- Next.js and React
- TypeScript
- PostgreSQL with Prisma
- Better Auth
- Capacitor shells for iOS and Android

## Run locally

Install dependencies and start the development server:

```bash
pnpm install
pnpm dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

Configure these environment variables before using authentication or database-backed features:

```text
DATABASE_URL=
BETTER_AUTH_URL=
BETTER_AUTH_SECRET=
```

Useful checks:

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Mobile app

The project includes Capacitor iOS and Android shells. After building the web app, sync the native projects with:

```bash
pnpm mobile:sync
```
