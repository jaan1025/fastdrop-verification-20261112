// Local ambient typing for the `import.meta.env` client var this package reads.
// We declare only our own key instead of pulling `vite/client` (not a dep here),
// keeping the package self-contained. Optional string — a build may omit it, and
// the code no-ops when absent.
interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN?: string
  // Vite built-ins we read for the dev/prod branch.
  readonly MODE?: string
  readonly DEV?: boolean
  readonly PROD?: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
