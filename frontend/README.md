# PortfolioIQ AI — Frontend

Angular 22 frontend for the PortfolioIQ AI platform.

**Live:** [portfolio-iq-ai.vercel.app](https://portfolio-iq-ai.vercel.app)

---

## Stack

- **Angular 22** (standalone components, signals-based reactive state)
- **TypeScript 5.8+**
- **Supabase JS** (auth, password reset, GitHub OAuth, database storage)
- **HTML5 Canvas** (client-side 10MB image compression for profile avatars)
- **Web App Manifest & PWA Support** (maskable icons, mobile home screen installation)

---

## Key Features

- **Modular Component Architecture**:
  - Structured modular design decomposing screens into `layout/` (sidebar, header), `pages/` (dashboard, projects, skills, career, github, coach, resume, optimization, analytics), and `modals/` (project-modal, github-import-modal, project-analysis-modal, resume-analysis-modal, auth-modal, skill-dropdown-portal, confirm-dialog).
  - Centralized state coordination powered by Angular Signals for fine-grained reactivity with zero unnecessary re-renders.

- **GitHub Repository Sync & Pre-Import AI Analysis**:
  - Live repository scanning supporting multi-language detection (scans all programming languages per repo via concurrent API queries).
  - One-click `[ 📊 AI Analysis ]` modal directly on repository cards in GitHub Sync to preview ML domain classification, confidence score, and top domain probabilities prior to importing.
  - Interactive skill tagging and bulk repository import workflows.

- **Mobile & PWA Ready (Adaptive Icon Safe-Zones)**:
  - Standards-compliant `manifest.json` with standalone display configuration.
  - Dedicated mobile safe-zone icons (`portfolioiq-mobile.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`) formatted with 72% inner safe area so mobile squircle and circular launcher masks never clip branding, borders, or text.
  - Native iOS `apple-touch-icon` integration for Safari "Add to Home Screen".

- **Adaptive Theme System**:
  - High-contrast Dark & Light mode parity across all screens, modals, badges, ML probability charts, AI coach canvas, and form inputs.
  - Dynamic branding and favicon switching (`portfolioiq.png` & `portfolioiqlight.png`) responding in real-time to theme selection.

- **Enhanced Authentication & Password Recovery**:
  - Segmented 6-box OTP verification with auto-focus, backspace navigation, and smart clipboard paste (`Ctrl+V`).
  - Real-time rate-limit and failed attempt lockout countdowns with auto-dismiss banners.
  - Safe GitHub OAuth login flow with deep link recovery handlers.

- **Custom Avatar Management**:
  - Client-side image upload supporting up to 10MB files, compressed via HTML5 Canvas into ultra-lightweight Web-ready avatars with sentinel fallback protection.

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
│   │   ├── app.ts                  # Root application coordinator (signals state)
│   │   ├── app.html                # Shell template
│   │   ├── app.css                 # Comprehensive styling + light/dark themes
│   │   │
│   │   ├── layout/                 # Layout components
│   │   │   ├── header/             # Top header, search, user avatar, theme toggle
│   │   │   └── sidebar/            # Navigation sidebar, branding, active tab routing
│   │   │
│   │   ├── pages/                  # Main view components
│   │   │   ├── dashboard/          # Health score, quick stats, target role card
│   │   │   ├── projects/           # Project grid, filters, tags, ML classifications
│   │   │   ├── skills/             # Skills radar, catalog, level management
│   │   │   ├── career/             # Target role selection, skill gaps, learning paths
│   │   │   ├── github/             # GitHub sync, multi-language scanning, AI analysis
│   │   │   ├── coach/              # AI Developer Coach chat and critique canvas
│   │   │   ├── resume/             # PDF resume upload, ATS scoring, extracted skills
│   │   │   ├── optimization/       # Knapsack optimizer, effort budget, blueprints
│   │   │   └── analytics/          # Deep portfolio analytics & breakdown charts
│   │   │
│   │   ├── modals/                 # Dialogs & portals
│   │   │   ├── auth-modal/         # Sign in, register, 6-box OTP password reset
│   │   │   ├── project-modal/      # Add/edit project form with ML preview
│   │   │   ├── github-import-modal/# Bulk repository import dialog
│   │   │   ├── project-analysis-modal/ # ML classification & probabilities modal
│   │   │   ├── resume-analysis-modal/  # ATS score and parsed resume review
│   │   │   ├── skill-dropdown-portal/  # Floating fixed skill search & attach dropdown
│   │   │   └── confirm-dialog/     # Universal styled confirmation modal
│   │   │
│   │   └── services/               # Services (API, Auth, GitHub, ML, Skills, etc.)
│   │
│   ├── environments/               # Environment configs (dev / prod)
│   ├── index.html                  # HTML entry point with meta, PWA, apple-touch-icon
│   ├── main.ts                     # Application bootstrap
│   └── styles.css                  # Global typography & reset styles
│
├── public/                         # Static assets
│   ├── manifest.json               # Web App Manifest for mobile installation
│   ├── apple-touch-icon.png        # iOS Safari home screen icon (safe-zoned)
│   ├── icon-192.png                # PWA 192x192 maskable icon
│   ├── icon-512.png                # PWA 512x512 maskable icon
│   ├── portfolioiq-mobile.png      # High-res mobile icon with safe area padding
│   ├── portfolioiq.png             # Dark theme brand asset & favicon
│   ├── portfolioiqlight.png        # Light theme brand asset & favicon
│   ├── favicon.ico                 # Fallback favicon
│   └── _redirects                  # SPA routing rules
├── vercel.json                     # Vercel deployment configuration
└── package.json
```
