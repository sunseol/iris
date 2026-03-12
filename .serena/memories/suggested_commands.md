Project root for most work: `C:\Users\keduall\iris\opencode-mobile`

Install deps:
- `npm install` in `opencode-mobile/app`
- `npm install` in `opencode-mobile/bridge`

Root quality commands:
- `npm run lint` — runs app TypeScript check and bridge syntax checks
- `npm run build` — exports Expo web bundle and syntax-checks bridge
- `npm run test` — runs app and bridge tests
- `npm run gate` — lint + build + test

App commands (`opencode-mobile/app`):
- `npm run start` — Expo dev server
- `npm run android` — Android run
- `npm run ios` — iOS run
- `npm run web` — Expo web preview
- `npm run test` — `tsx --test tests/**/*.test.ts`

Bridge commands (`opencode-mobile/bridge`):
- `npm run dev` — watch mode server
- `npm start` — start bridge server
- `npm run test` — `node --test tests/*.test.js`
- `npm run smoke` — smoke client

Useful Windows shell commands: `dir`, `where opencode`, `set VAR=value`, PowerShell `$env:VAR='value'`.