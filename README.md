# Sportship

Sportship is a social sports web app for finding and joining local sports groups. Users can choose a sport and city, explore nearby groups, view upcoming activities, join communities, and discuss plans with members.

## Live application

[Open the Sportship live app](https://social-sport-app-sportship.vercel.app/)

## Project

This repository contains the Sportship web application deployed on Vercel.

The app includes:

- Sport and city discovery for local groups
- Group recommendations and group detail pages
- Recurring trainings and one-time events
- Group membership and attendance responses
- Organizer controls for schedules and events
- Member discussions and comments
- Signed-in dashboard with joined-group activity

## Architecture

- `src/app/` contains the Next.js routes and UI
- `src/components/` contains reusable interface components
- `src/modules/` contains group, membership, and attendance logic
- `prisma/` contains the PostgreSQL schema and migrations

The web app uses Next.js, React, TypeScript, PostgreSQL, Prisma, and Better Auth.

## Deployment

```bash
pnpm install
pnpm build
```

Configure `DATABASE_URL`, `BETTER_AUTH_URL`, and `BETTER_AUTH_SECRET` in the Vercel project settings.

## Repository

[GitHub repository](https://github.com/stella-jin-ys/Social-sport-application)
