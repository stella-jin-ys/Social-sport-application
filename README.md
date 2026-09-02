# Sportship

Sportship is a mobile-first social sports platform for finding and joining local sports groups. Users can choose a sport and city, explore nearby groups, view upcoming activities, join communities, and discuss plans with members.

## Live application

[Open the Sportship live app](https://social-sport-app-sportship.vercel.app/)

## Project

This repository contains the Sportship web application and its Capacitor shells for iOS and Android.

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
- `prisma/` contains the PostgreSQL schema and seed data
- `android/` and `ios/` contain the Capacitor native projects

The web app uses Next.js, React, TypeScript, PostgreSQL, Prisma, Better Auth, and Capacitor.

## Local development

Install dependencies:

```bash
pnpm install
```

Copy `.env.example` to `.env` and set the database and authentication values. For the local PostgreSQL database, start the included service:

```bash
docker compose up -d
pnpm exec prisma db push
pnpm db:seed
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Mobile shells

After building the web app, synchronize the Capacitor projects:

```bash
pnpm build
pnpm mobile:sync
```

Use `pnpm mobile:open:ios` or `pnpm mobile:open:android` to open the native project.

## Repository

[GitHub repository](https://github.com/stella-jin-ys/Social-sport-application)
