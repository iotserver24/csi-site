# CSI NMAMIT Website

Next.js App Router application for CSI NMAMIT. Firebase handles Google authentication only; PostgreSQL is the source of truth for users, roles, profiles, events, registrations, memberships, and payments.

## Stack

- Next.js + React + Tailwind CSS
- Firebase Auth
- PostgreSQL + Drizzle ORM
- S3-compatible object storage
- Razorpay payments

## Local setup

```bash
npm ci
cp .env.example .env.local
npm run db:migrate
npm run dev
```

Required server variables are listed in `.env.example`. Firebase client variables must use the `NEXT_PUBLIC_` prefix; Firebase Admin, Postgres, Razorpay secrets, and S3 credentials must remain server-only.

## Commands

```bash
npm run dev
npm run build
npm run start
npm run db:generate
npm run db:migrate
npm run db:studio
npm run migrate:firestore
```

## Migration

`npm run migrate:firestore` is a one-time migration tool. It requires `DATABASE_URL` and `FIREBASE_SERVICE_ACCOUNT_JSON`, migrates operational Firestore collections into normalized PostgreSQL tables, seeds membership plans, and prints counts plus duplicate-email/orphan-registration validation results.

Run it only after generating and applying the Drizzle migration. Keep the Firestore export as rollback evidence until the Next.js deployment is verified.

## Routes

Public pages live under `app/`. Protected data is accessed through Next.js route handlers under `app/api/`; handlers verify Firebase ID tokens and enforce Postgres roles. Razorpay webhooks use `/api/payments/webhook`.
