# Fuelstats Frontend Application

This repository contains the frontend client for Fuelstats, a self-hosted dashboard for tracking vehicle fuel consumption, service records, and maintenance history. The application is built using Vue 3, TypeScript, Vite, and Pinia, with custom CSS styling designed for modern dark-theme aesthetics.

## Features

- **Dashboard Statistics**: Dynamic processing of refueling logs to calculate average fuel consumption, consumption since the last refuel, and odometer distance driven over multiple intervals (past month, 6 months, year, and all-time).
- **Interactive Visualizations**: Dynamic trend charts for fuel prices and consumption rates using Chart.js.
- **Log Management**: Chronological logs for fuel purchases and services, featuring segment filters, search capabilities, and inline record editing and deletion.
- **Vehicle Management**: Interface to add, update, delete, and star vehicles. Setting a new default vehicle automatically updates active user contexts.
- **CSV Data Operations**: Standalone CSV export and import tools for refuel and service records, featuring fallback vehicle handling if row-level vehicle data is omitted.
- **Form Calculators**: Float-safe reciprocal form calculators in the refueling input page that automatically compute total cost, liters, or price-per-liter based on user inputs.

## Project Structure

```
├── backups/           # Database dumps and test CSV templates
├── public/            # Static assets and icons
├── src/
│   ├── assets/        # Stylesheets and theme configurations
│   ├── components/    # Reusable UI elements (dialogs, charts, buttons)
│   ├── composables/   # Composition API hooks (vehicle states, fetch hooks)
│   ├── lib/           # Axios HTTP client and constants
│   ├── router/        # Navigation routing guards and authentication interceptors
│   ├── stores/        # Pinia state management (auth store)
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

### Code Quality and Linting

Run TypeScript compilation checks:

```bash
npm run type-check
```

Run ESLint to inspect and fix code formatting issues:

```bash
npm run lint
```

## Production Deployment

This repository includes a multi-stage production `Dockerfile` and an `nginx.conf` template that reverse-proxies API calls to the backend server to prevent CORS issues.

For a complete containerized setup including the frontend, API server, and MongoDB database, refer to the unified `docker-compose.prod.yaml` in this directory.

To build and run the production environment locally:

```bash
docker compose -f docker-compose.prod.yaml up -d --build
```
