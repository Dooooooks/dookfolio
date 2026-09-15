# dookfolio

Personal portfolio for Lloyd Nicolas (Thats me!) — software developer based in Bulacan, Philippines. Built with **SvelteKit 2**, **Svelte 5 (runes)**, **TypeScript**, and **Tailwind CSS v4**.

## Features

- Landing page with an interactive easter egg (click the duck to switch into "game dev" mode)
- **About** section with a skills list
- **Projects** and **Experiences** showcases driven by clean, version-controlled JSON data
- **Contacts** page (email, phone, GitHub, LinkedIn)
- Responsive sidebar layout with smooth hash scrolling
- Zero external database or backend services required

## Tech stack

| Layer     | Tool                                               |
| --------- | -------------------------------------------------- |
| Framework | [SvelteKit](https://svelte.dev/docs/kit)           |
| UI        | [Svelte 5](https://svelte.dev/docs/svelte) (runes) |
| Language  | TypeScript                                         |
| Styling   | [Tailwind CSS v4](https://tailwindcss.com)         |
| Icons     | [lucide-svelte](https://lucide.dev)                |
| Data      | Local JSON (`src/lib/data/`)                       |
| Fonts     | Nunito + Pixelify Sans (via Fontsource)            |

## Getting started

```sh
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` (open it automatically with `npm run dev -- --open`).

## Managing Portfolio Content

Portfolio content is stored directly in type-safe JSON files under `src/lib/data/`:

### Adding or Editing Projects

Edit [`src/lib/data/projects.json`](src/lib/data/projects.json). Each project has the following structure:

```json
{
	"id": "my-project",
	"title": "Project Title",
	"description": "Short project description...",
	"tags": ["TypeScript", "SvelteKit"],
	"demo_url": "https://...",
	"github_url": "https://github.com/...",
	"cover_url": "/ProjectPictures/my-image.png",
	"date": "2026-09",
	"created_at": "2026-09-14T00:00:00.000Z"
}
```

Projects are automatically sorted by `date` descending (most recent first). Place project cover images in `static/ProjectPictures/` and reference them with `/ProjectPictures/<filename>`.

### Adding or Editing Experiences

Edit [`src/lib/data/experiences.json`](src/lib/data/experiences.json). Each experience has the following structure:

```json
{
	"id": "role-identifier",
	"period": "2025 — PRESENT",
	"role": "Role Title",
	"company": "Company Name",
	"description": "Description of responsibilities and achievements...",
	"date": "2025-03",
	"order_num": 1
}
```

Experiences are sorted by `date` descending (most recent first).

## Project structure

```
src/
├── app.html
├── lib/
│   ├── assets/              # images (profile, duck, spotlight)
│   ├── data/                # portfolio JSON data (projects.json, experiences.json)
│   ├── game-mode.svelte.ts  # duck easter-egg state
│   ├── index.ts             # library exports
│   └── types.ts             # Project / Experience interfaces
└── routes/
    ├── +layout.svelte       # sidebar + nav
    ├── +page.svelte         # landing / about
    ├── about/               # redirects to /#about
    ├── contacts/            # contact info
    ├── projects/            # projects showcase
    └── experiences/         # experiences timeline
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
