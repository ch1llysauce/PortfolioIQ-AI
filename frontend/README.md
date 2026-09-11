# PortfolioIQ AI — Frontend

Angular 22 frontend for the PortfolioIQ AI platform.

**Live:** [portfolio-iq-ai.vercel.app](https://portfolio-iq-ai.vercel.app)

---

## Stack

- Angular 22 (standalone components, signals)
- TypeScript
- Supabase JS (auth + database)
- Tailwind CSS utilities

---

## Local Development

```bash
npm install
ng serve
```

App runs at `http://localhost:4200`.

---

## Environment Configuration

| File | Used for |
|------|----------|
| `src/environments/environment.ts` | Local development (`localhost:8000`) |
| `src/environments/environment.prod.ts` | Production (Render backend URL) |

Angular swaps the file automatically during production builds via `fileReplacements` in `angular.json`.

---

## Build

```bash
# Development
ng build

# Production
ng build --configuration=production
```

Output goes to `dist/portfolioiq-frontend/browser/`.

---

## Deploy to Vercel

Settings in Vercel dashboard:
- **Root directory:** `frontend`
- **Build command:** `ng build --configuration=production`
- **Output directory:** `dist/portfolioiq-frontend/browser`

---

## Key Files

```
src/
├── app/
│   ├── app.ts          # Main component — all state management via Angular signals
│   ├── app.html        # Single-page template (~3400 lines)
│   ├── app.css         # Global styles + light/dark theme (~11000 lines)
│   └── services/
│       ├── api.service.ts
│       ├── auth.service.ts
│       ├── analytics.service.ts
│       ├── coach.service.ts
│       ├── github.service.ts
│       ├── knowledge.service.ts
│       ├── ml.service.ts
│       ├── optimization.service.ts
│       ├── project.service.ts
│       ├── skill.service.ts
│       └── system.service.ts
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
└── styles.css          # Global markdown/chat styles (innerHTML scope)
```
