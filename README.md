# dookfolio

Personal portfolio for Lloyd Nicolas (Thats me!) — software developer based in Bulacan, Philippines. Built with **SvelteKit 2**, **Svelte 5 (runes)**, **TypeScript**, **Tailwind CSS v4**, and **Supabase**.

## Features

- Landing page with an interactive easter egg (click the duck to switch into "game dev" mode)
- **About** section with a skills list
- **Projects** and **Experiences** pages backed by Supabase
- **Contacts** page (email, phone, GitHub, LinkedIn)
- Admin dashboard (`/admin`) to manage projects and experiences
- Responsive sidebar layout with smooth hash scrolling

## Tech stack

| Layer     | Tool                                               |
| --------- | -------------------------------------------------- |
| Framework | [SvelteKit](https://svelte.dev/docs/kit)           |
| UI        | [Svelte 5](https://svelte.dev/docs/svelte) (runes) |
| Language  | TypeScript                                         |
| Styling   | [Tailwind CSS v4](https://tailwindcss.com)         |
| Icons     | [lucide-svelte](https://lucide.dev)                |
| Backend   | [Supabase](https://supabase.com) (Postgres + Auth) |
| Fonts     | Nunito + Pixelify Sans (via Fontsource)            |

## Getting started

```sh
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` (open it automatically with `npm run dev -- --open`).

## Environment variables

Copy `.env.example` to `.env` and fill in your Supabase project values:

```
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
```

## Database

Create the tables, Row Level Security policies, and seed data by running [`supabase/schema.sql`](supabase/schema.sql) in your Supabase project's SQL editor.

## Admin dashboard

Projects and experiences are managed from `/admin`. Sign in with any user registered in your Supabase project's Auth (Email + Password provider). The server hook in `src/hooks.server.ts` guards all `/admin` routes.

## Project structure

```
src/
├── app.html
├── hooks.server.ts          # admin route auth guard
├── lib/
│   ├── assets/              # images (profile, duck, spotlight)
│   ├── supabase/            # Supabase client helpers
│   ├── game-mode.svelte.ts  # duck easter-egg state
│   ├── types.ts             # Project / Experience types
│   └── project-form.ts / experience-form.ts
└── routes/
    ├── +layout.svelte       # sidebar + nav
    ├── +page.svelte         # landing / about
    ├── about/               # redirects to /#about
    ├── contacts/            # contact info
    ├── projects/
    ├── experiences/
    └── admin/               # auth + CRUD forms
```

## Scripts

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start the dev server               |
| `npm run build`   | Build for production               |
| `npm run preview` | Preview the production build       |
| `npm run check`   | Run `svelte-check` (type checking) |
| `npm run lint`    | Prettier + ESLint                  |
| `npm run format`  | Format with Prettier               |
