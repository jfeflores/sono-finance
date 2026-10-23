# Project rules

- Keep credentials in server-side secret storage and local environment files; public examples contain placeholders only.
- Centralize account cache cleanup and run it on sign-out/account changes to prevent cross-account exposure.
- Use Bun's text lockfile as the dependency source of truth so scans and installs resolve the same versions.