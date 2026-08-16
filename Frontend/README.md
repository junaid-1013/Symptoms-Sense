# Symptoms Sense Frontend

Next.js 14 (App Router) web app for Symptoms Sense. It talks to the [FastAPI backend](../Backend/README.md) over REST.

## Requirements

- Node.js 18.17+ (20 recommended) and npm
- The backend running locally (default `http://localhost:8000`)

## Setup

```bash
cd Frontend
npm install
cp .env.sample .env
npm run dev
```

Open `http://localhost:3000`.

### Environment

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Browser-accessible API base URL **including** `/api/`, e.g. `http://localhost:8000/api/`. Next.js embeds it at build time, so rebuild after changing it. Don't use a Docker-internal hostname. |

Never put secrets in frontend environment files; every `NEXT_PUBLIC_*` value is visible in the browser.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (Next.js config) |
| `npx tsc --noEmit` | Type check |

Run lint and the type check before opening a pull request.

## Project layout

```
src/
├── app/
│   ├── (site)/          Public pages: home, doctors, profile, reminders, testimonials, about, login
│   ├── (agent)/         AI chat page
│   └── (dash)/          Clinic dashboard
├── components/
│   ├── ui/              shadcn/ui primitives
│   ├── agentComps/      Chat UI: messages, cards, input, sidebar
│   ├── landingPage/     Home page sections, doctor and testimonial cards
│   ├── doctorDetailPageComps/   Doctor page and the booking dialog
│   └── ...              Auth, profile, dashboard, skeleton components
├── endPoints/           API calls (one file per backend area) built on lib/axiosInstance
├── contextApis/         User/auth context
├── lib/                 axios instance (token refresh), utilities
├── config/              Constants (nav links, team, specializations)
└── types/               Shared TypeScript types
```

## Conventions

- **API calls** go through `src/lib/axiosInstance.ts`. It attaches the access token and refreshes it on 401. Don't use raw `fetch` for authenticated calls.
- **Styling:** Tailwind with theme tokens (`bg-primary`, `text-muted-foreground`). Prefer tokens over hardcoded colours. Headings use the display font set in `app/layout.tsx`.
- **Components:** reuse the primitives in `components/ui` before adding new ones.
- **Accessibility:** label icon-only buttons, keep focus outlines, and don't convey state by colour alone.

## Learn more

[Next.js docs](https://nextjs.org/docs), [Tailwind CSS](https://tailwindcss.com/docs), [shadcn/ui](https://ui.shadcn.com).
