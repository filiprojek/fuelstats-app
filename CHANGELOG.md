# Changelog - FuelStats App

All notable changes to the `fuelstats-app` frontend application will be documented in this file.

## [2.1.1] - 2026-07-20

### Features & Improvements
* `feat`: Custom Service Task Creator (add user-defined maintenance tasks with custom km/month intervals).
* `feat`: Inline interval reset/clear controls in Service Plans modal.
* `style`: Polished custom task form layout and dark pill input styling in Service Plans modal.

---

## [2.1.0] - 2026-07-19

### Features & Improvements
* `feat`: Standalone Odometer Reading entry form and history management (log mileage state without refuel/service).
* `feat`: Integrated standalone Odometer logs into Service Maintenance Tracker status calculations.
* `feat`: App & Server Version display with live online indicator and interactive release notes modal in Settings.
* `style`: Optimized SegmentSwitch picker for mobile screens with compact native column tab layout.
* `fix`: Resolved date input width collapse bug on mobile WebKit browsers.

---

## [2.0.0] - 2026-07-19

### Major Highlights
* **Vue 3 Web App Rewrite**: Replaced the legacy Flutter mobile client with a full-stack Vue 3 PWA application.
* **Service Maintenance Tracker**: Added customizable interval tracking by mileage (km) and time (months) with dynamic overdue alerts.
* **Service Schedule Overview**: Added interactive schedule overview card on the dashboard showing elapsed usage percentage, countdowns, and quick actions.
* **CSV Import Wizard**: Added interactive CSV import modal with vehicle picker and drag-and-drop file upload supporting flexible Czech column headers and date formats.
* **PWA & Responsive Design**: Added PWA offline caching, manifest configuration, and responsive desktop/mobile dark glassmorphism design.

### Features & Improvements
* `feat`: Service Maintenance Tracker alerts component (`src/components/ServiceAlerts.vue`)
* `feat`: Service Schedule Overview card with progress bars (`src/components/ServiceOverview.vue`)
* `feat`: CSV import wizard modal in Settings (`src/views/SettingsView.vue`)
* `feat`: Refuel and Service Records history view with filters, sorting, and inline edit modals (`src/views/AboutView.vue`)
* `feat`: Interactive charts for fuel prices and consumption trends (`src/views/HomeView.vue`)
* `feat`: Photo attachments, custom vehicle VIN, and notes fields support (`src/views/AddView.vue`, `src/views/VehiclesView.vue`)
* `feat`: Dynamic app and server version display with changelog modal in Settings

---

## [1.0.0] - 2026-01-01

### Highlights
* **Initial Mobile Release**: First-generation Flutter mobile application for tracking vehicle refuel logs and basic service entries.
