export interface ReleaseChange {
  type: 'feat' | 'fix' | 'style' | 'docs' | 'refactor'
  text: string
  commit?: string
}

export interface ReleaseLog {
  version: string
  date: string
  title: string
  highlight?: string
  changes: ReleaseChange[]
}

export const CHANGELOG_DATA: ReleaseLog[] = [
  {
    version: '2.0.0',
    date: '2026-07-19',
    title: 'Vue 3 Web App Rewrite & Service Maintenance Tracker',
    highlight: 'Major release replacing the legacy Flutter mobile app with a full-stack Vue 3 PWA client.',
    changes: [
      { type: 'feat', text: 'Service Maintenance Tracker with dynamic overdue warning alerts & status logic', commit: 'db160db' },
      { type: 'feat', text: 'Service Schedule Overview card on the dashboard with progress bars', commit: 'ec2c4e6' },
      { type: 'feat', text: 'CSV import wizard modal with vehicle selector and drag-and-drop file upload', commit: '032c4f4' },
      { type: 'feat', text: 'Flexible Czech date & column parsing for service CSV imports' },
      { type: 'feat', text: 'Progressive Web App (PWA) support with offline caching and manifest setup', commit: 'ed333e2' },
      { type: 'feat', text: 'Refuel and Service Records history view with filters, sorting, and inline edit modals', commit: '6ba4158' },
      { type: 'feat', text: 'Interactive charts for fuel prices and consumption trends', commit: '9a40647' },
      { type: 'feat', text: 'Support for photo uploads, custom vehicle VIN, and detailed notes', commit: '80d88e3' },
      { type: 'style', text: 'Modern dark glassmorphism design system with responsive desktop and mobile support' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-01-01',
    title: 'Initial Release (Flutter Mobile App)',
    highlight: 'Legacy first-generation native mobile application.',
    changes: [
      { type: 'feat', text: 'Initial release of FuelStats mobile application' },
      { type: 'feat', text: 'Basic fuel logs tracking and server synchronization' },
      { type: 'feat', text: 'Initial authentication and vehicle management' },
    ],
  },
]
