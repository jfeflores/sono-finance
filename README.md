# Sono Finance | Made within 24 hours.

This was a project assisted with AI during a 24-hour hackathon.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8d966267-eb2f-47bd-87d4-c237389430e8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Use Bun and Node.js 24 for local development and the security regression suite. Bun's text lockfile is the dependency source of truth. Vitest 4 requires Node.js 20 or newer; the current Supabase SDK requires Node.js 22 or newer.

```sh
git clone <this-repository-url>
cd <repository-name>
bun install --frozen-lockfile --ignore-scripts
bun run dev
```

Run `bun run test` and `bun run build` before publishing changes. The regression suite includes account isolation, delayed assistant work, and quota admission with stubbed providers; it does not call paid services.

Node.js 26's native Web Storage currently conflicts with the jsdom test environment. If using Node.js 26, run `NODE_OPTIONS=--no-experimental-webstorage bun run test` so jsdom supplies the test storage. Node.js 24 runs the suite without this flag.
