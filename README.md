# Fuelstats Frontend Application

This repository contains the frontend client for Fuelstats, a self-hosted dashboard for tracking vehicle fuel consumption, service records, and maintenance history. The application is built using Vue 3, TypeScript, Vite, and Pinia, with custom CSS styling designed for modern dark-theme aesthetics.

## Features

- **Dashboard Statistics**: Average fuel consumption and consumption since the last refuel from refueling logs, plus distance driven over multiple intervals (past month, 6 months, year, and all-time) from every mileage reading – refuel, odometer and service records – starting at the first refuel or at an odometer record marked as *Start of odometer history* (e.g. the reading when the car was bought).
- **Interactive Visualizations**: Dynamic trend charts for fuel prices and consumption rates using Chart.js.
- **Log Management**: Chronological logs for fuel purchases and services, featuring segment filters, search capabilities, and inline record editing and deletion.
- **Vehicle Management**: Interface to add, update, delete, and star vehicles. Setting a new default vehicle automatically updates active user contexts.
- **CSV Data Operations**: Standalone CSV export and import tools for refuel and service records, featuring fallback vehicle handling if row-level vehicle data is omitted.
- **Remember Me**: Stay signed in for 30 days (configurable on the server with `AUTH_REMEMBER_DAYS`), renewed automatically whenever the app is used. Without it the session ends when the browser is closed.
- **Single Sign-On**: Log in with email/password or through Authelia and any other OpenID Connect provider – both lead to the same account. Providers can be linked and unlinked in Settings, and accounts created through a provider can set a password later.
- **Form Calculators**: Float-safe reciprocal form calculators in the refueling input page that automatically compute total cost, liters, or price-per-liter based on user inputs.

## Project Structure

```
├── backups/           # Database dumps and test CSV templates
├── public/            # Static assets and icons
├── src/
│   ├── assets/        # Stylesheets and theme configurations
│   ├── components/    # Reusable UI elements (dialogs, charts, buttons)
│   ├── composables/   # Composition API hooks (vehicle states, fetch hooks)
│   ├── lib/           # Axios HTTP client, single sign-on helpers and constants
│   ├── router/        # Navigation routing guards and authentication interceptors
│   ├── stores/        # Pinia state management (auth store)
│   ├── test/          # Shared test helpers (tests live next to code in __tests__/)
│   ├── views/         # Page containers (dashboard, history, login, settings)
│   ├── App.vue        # Main application layout
│   └── main.ts        # App entry point
├── Dockerfile         # Production container build definition
└── nginx.conf         # Production Nginx reverse-proxy configuration
```

## Setup and Installation

### Prerequisites

- Node.js (version 22.x or higher)
- npm (version 10.x or higher)

### Configuration

Create a `.env` file in the root directory to define the target API endpoint:

```env
VITE_API=http://localhost:6060/api/v1
```

### Installation

Install the required project dependencies:

```bash
npm install
```

## Running the Application

### Development Server

Start the local development server with hot-reload:

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`.

### Production Build

Typecheck, compile, and bundle the application assets for production deployment:

```bash
npm run build
```

The compiled static files will be exported to the `dist` directory, ready to be served by Nginx or a similar web server.

### Tests

Unit and component tests use [Vitest](https://vitest.dev) and Vue Test Utils:

```bash
npm test               # run once
npm run test:watch     # watch mode
npm run test:coverage  # with coverage report
```

### Code Quality and Linting

Run TypeScript compilation checks:

```bash
npm run type-check
```

Run ESLint to inspect and fix code formatting issues:

```bash
npm run lint
```

## Single Sign-On (Authelia & other OIDC providers)

Besides email and password, users can log in through **Authelia** or any other
**OpenID Connect** provider (Authentik, Keycloak, Pocket ID, Google, …). Everything is configured
on the **server** – the app needs no extra settings and simply shows a
**Continue with …** button for each provider the server reports.

How it works:

1. The login (or sign-up) page asks the server for configured providers (`GET /auth/providers`).
2. Clicking **Continue with Authelia** navigates to the server, which redirects to Authelia.
3. After signing in, Authelia sends the browser back to the server, which matches or creates the
   account and redirects to `/auth/callback` in the app with a session token.
4. The app stores the token and opens the dashboard.

**One account, several ways in.** A provider login lands in the existing account with the same
(verified) email, so users keep all their vehicles and history. Under
**Settings → Sign-in methods** users can:

- link or unlink providers,
- set a password for an account created through a provider (to also log in with email),
- change their password.

The last remaining sign-in method can't be removed.

### Adding Authelia

1. Register Fuelstats as an OIDC client in Authelia with the redirect URL
   `https://<your-domain>/api/v1/auth/oidc/authelia/callback`.
2. Set `APP_HOST`, `OIDC_PROVIDERS=authelia` and the `OIDC_AUTHELIA_*` variables on the server
   (see the commented example in `docker-compose.prod.yaml`).
3. Restart the server – the button appears on the login page.

Step-by-step instructions (including the Authelia client YAML), the full list of variables and
examples for other providers are in the
[server README – *Authentication & Single Sign-On*](../fuelstats-server/README.md#authentication--single-sign-on).

### Adding another provider

Add its id to `OIDC_PROVIDERS` (e.g. `authelia,google`) and set
`OIDC_<ID>_ISSUER`, `OIDC_<ID>_CLIENT_ID`, `OIDC_<ID>_CLIENT_SECRET` (optionally `OIDC_<ID>_NAME`)
on the server. Register `https://<your-domain>/api/v1/auth/oidc/<id>/callback` as redirect URL
at the provider. No app rebuild is needed.

> **Development:** when the app (`localhost:5173`) and API (`localhost:6060`) run on different
> origins, set `APP_HOST=http://localhost:5173` and `API_PUBLIC_URL=http://localhost:6060` on the
> server and register `http://localhost:6060/api/v1/auth/oidc/<id>/callback` at the provider.

## Production Deployment

This repository includes a multi-stage production `Dockerfile` and an `nginx.conf` template that reverse-proxies API calls to the backend server to prevent CORS issues.

For a complete containerized setup including the frontend, API server, and MongoDB database, refer to the unified `docker-compose.prod.yaml` in this directory.

To build and run the production environment locally:

```bash
docker compose -f docker-compose.prod.yaml up -d --build
```
