# PortfolioIQ AI — Frontend

Angular 22 frontend for the PortfolioIQ AI platform.

**Live:** [portfolio-iq-ai.vercel.app](https://portfolio-iq-ai.vercel.app)

---

## Stack

- **Angular 22** (standalone components, signals-based reactive state)
- **TypeScript 5.8+**
- **Supabase JS** (auth, password reset, GitHub OAuth, database storage)
- **HTML5 Canvas** (client-side 10MB image compression for profile avatars)

---

## Key Features

- **Signals-Driven Architecture**: 100% fine-grained reactive state with zero unnecessary re-renders.
- **Adaptive Theme System**: Real-time Light & Dark mode with dynamic brand assets (`portfolioiq.png` & `portfolioiqlight.png`), favicon switching, and high-contrast accessible palettes.
- **Enhanced Authentication & Password Recovery**:
  - Segmented 6-box OTP verification with auto-focus, backspace navigation, and smart clipboard paste (`Ctrl+V`).
  - Real-time rate-limit and failed attempt lockout countdowns with auto-dismiss banners.
  - Safe OAuth login flow with deep link recovery handlers.
- **Custom Avatar Management**: Client-side image upload supporting up to 10MB files, compressed via HTML5 Canvas into ultra-lightweight Web-ready avatars with sentinel fallback protection.

---

## Local Development

```bash
cd frontend
npm install
ng serve
```

App runs at `http://localhost:4200`.

---

## Environment Configuration

| File | Used for |
|------|----------|
| `src/environments/environment.ts` | Local development (`http://127.0.0.1:8000`) |
| `src/environments/environment.prod.ts` | Production (`https://portfolioiq-ai.onrender.com`) |

Angular swaps the file automatically during production builds via `fileReplacements` in `angular.json`.

---

## Build

```bash
# Development
ng build

# Production
ng build --configuration=production
```

Output directory: `dist/portfolioiq-frontend/browser/`.

---

## Deploy to Vercel

Configured with `vercel.json` and `public/_redirects` for full single-page application (SPA) client-side routing.

Settings in Vercel dashboard:
- **Framework Preset:** Angular
- **Root Directory:** `frontend`
- **Build Command:** `ng build --configuration=production`
- **Output Directory:** `dist/portfolioiq-frontend/browser`

---

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── app.ts          # Root component — state management via Angular signals
│   │   ├── app.html        # Main application template
│   │   ├── app.css         # Complete styling + light/dark theme variables
│   │   └── services/       # Modular services (API, Auth, Analytics, Coach, GitHub, ML, etc.)
│   ├── environments/       # Environment configs (dev / prod)
│   ├── index.html          # HTML entry point with dynamic meta and favicon
│   ├── main.ts             # Application bootstrap
│   └── styles.css          # Global typography & markdown preview styles
├── public/                 # Static assets (logos, favicons, _redirects)
├── vercel.json             # Vercel SPA rewrite configuration
└── package.json
```

