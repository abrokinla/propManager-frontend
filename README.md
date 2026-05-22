# PropManager

**Multi-tenant property management SaaS** — a full-stack platform for landlords and property managers to manage properties, units, tenants, rent payments, and maintenance requests.

## Features

- **Dashboard** — Real-time overview of portfolio stats, occupancy rate, monthly revenue, recent payments, and upcoming lease expirations.
- **Properties** — CRUD management with type classification (Apartment, House, Condo, Commercial, etc.).
- **Units** — Track bedrooms, bathrooms, size, sale/rent prices, and status (Available, Occupied, Maintenance).
- **Tenants** — Manage tenant profiles, lease dates, rent amounts, and unit assignments.
- **Payments** — Record and track rent payments with multiple methods (Bank Transfer, Cash, Credit Card, Mobile Money, Cheque).
- **Maintenance** — Log and track maintenance requests with priority and status workflow.
- **Authentication** — JWT-based login/registration with automatic token refresh.
- **Responsive** — Mobile-first UI with collapsible navigation.

## Tech Stack

| Layer          | Technology                           |
| -------------- | ------------------------------------ |
| **Framework**  | Next.js 15 (App Router)              |
| **Runtime**    | React 19                             |
| **Styling**    | Tailwind CSS 3                       |
| **Language**   | TypeScript                           |
| **HTTP**       | Axios (with interceptors & refresh)  |
| **Deploy**     | Cloudflare Pages (via OpenNext)      |
| **Backend**    | Django REST Framework (hosted separately) |

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Start the development server at [http://localhost:3000](http://localhost:3000).

The app expects a running backend at `http://localhost:8000/api` by default.

## Available Scripts

| Script          | Description                                 |
| --------------- | ------------------------------------------- |
| `npm run dev`   | Next.js development server                  |
| `npm run build` | Standard Next.js production build           |
| `npm run start` | Start production server                     |
| `npm run lint`  | Run Next.js lint                            |
| `npm run cf-build` | Build for Cloudflare via OpenNext       |
| `npm run preview`  | Preview Cloudflare build locally        |
| `npm run deploy`   | Build and deploy to Cloudflare via Wrangler |

## Environment Variables

| Variable               | Required | Default                        | Description               |
| ---------------------- | -------- | ------------------------------ | ------------------------- |
| `NEXT_PUBLIC_API_URL`  | Yes      | `http://localhost:8000/api`    | Backend API base URL      |

Set this in your Cloudflare Pages dashboard under **Settings → Environment variables**:

```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

## Deployment

This project uses **Cloudflare Pages** with the **OpenNext Cloudflare adapter** for deployment.

### Cloudflare Pages (Git integration)

| Setting              | Value                        |
| -------------------- | ---------------------------- |
| **Framework preset** | None                         |
| **Build command**    | `npm run cf-build`           |
| **Build output**     | `.open-next`                 |
| **Root directory**   | `frontend`                   |

### Manual deploy (CLI)

```bash
npm run deploy
```

Requires `wrangler.toml` to be configured and `CLOUDFLARE_API_TOKEN` set.

## Project Structure

```
frontend/
├── open-next.config.ts          # OpenNext Cloudflare config
├── wrangler.toml                # Cloudflare Worker config
├── next.config.mjs              # Next.js configuration
├── tailwind.config.js           # Tailwind CSS theme
├── tsconfig.json                # TypeScript configuration
├── .nvmrc                       # Node.js version pinning
└── src/
    ├── app/                     # Next.js App Router pages
    │   ├── layout.tsx           # Root layout
    │   ├── globals.css          # Global styles & Tailwind
    │   ├── page.tsx             # Home (redirects to /login)
    │   ├── login/
    │   ├── register/
    │   ├── dashboard/
    │   ├── properties/
    │   ├── units/
    │   ├── tenants/
    │   ├── payments/
    │   ├── maintenance/
    │   └── profile/
    ├── components/              # Shared components
    │   ├── ClientProvider.tsx
    │   ├── DashboardLayout.tsx
    │   ├── DashboardCards.tsx
    │   ├── Navbar.tsx
    │   ├── ConfirmDialog.tsx
    │   └── ErrorBoundary.tsx
    ├── context/                 # React context providers
    │   ├── AuthContext.tsx
    │   └── ToastContext.tsx
    ├── lib/
    │   └── api.ts               # Axios instance with auth interceptors
    └── types/
        └── index.ts             # TypeScript type definitions
```

## Backend

This frontend requires the PropManager API backend. The Django REST API is hosted separately on **Render** and communicates via REST endpoints under `/api/`.

## License

MIT
