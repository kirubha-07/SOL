# SOL light bridge (optional, UNTESTED)

> **Status: untested.** This script has not been run against a real Tapo bulb yet. Treat it as a starting point and test it yourself before relying on it. The SOL app works without it: by default the "Dim the light" action only updates a simulated on-screen "Bulb: dimmed" indicator.

## Why a bridge?

A web page cannot (and should not) log in to the Tapo cloud with your account. This small Node script runs on a computer **on the same Wi-Fi as the bulb**, talks to the bulb locally using the [`tapo`](https://www.npmjs.com/package/tapo) npm package, and exposes two endpoints the app can call:

| Endpoint | What it does |
| --- | --- |
| `POST /dim` | Dims the bulb (remembers the previous brightness) |
| `POST /restore` | Restores the previous brightness |
| `GET /health` | `{ "ok": true }` |

## Run it

```bash
cd bridge
npm install
TAPO_EMAIL="you@example.com" TAPO_PASSWORD="your-tapo-password" BULB_IP="192.168.1.50" node server.mjs
```

Environment variables (never commit them):

| Variable | Default | Meaning |
| --- | --- | --- |
| `TAPO_EMAIL`, `TAPO_PASSWORD` | required | Your Tapo account (used only to talk to the bulb locally) |
| `BULB_IP` | required | The bulb's local IP address (give it a fixed address in your router) |
| `BULB_MODEL` | `l530` | One of `l510 l530 l535 l610 l630 l900 l920 l930` |
| `DIM_BRIGHTNESS` | `15` | Brightness (1-100) used when dimming |
| `PORT` / `HOST` | `8787` / `127.0.0.1` | Use `HOST=0.0.0.0` only if the app runs on another device on your network |
| `ALLOW_ORIGIN` | `http://localhost:5173` | Comma-separated list of web-app origins allowed to call the bridge. Requests from other sites are refused |

Then open the app, go to **Settings** and set the bridge URL (for example `http://localhost:8787`).

## Browser limits you will probably hit

- The deployed SOL app is served over **https**. Browsers block an https page from calling a plain `http://192.168.x.x` address (mixed content). `http://localhost` is usually allowed (Chrome, Edge, Firefox), Safari may block it. If the caregiver's device is not the computer running the bridge, run the app locally (`npm run dev`) on a machine that can reach the bridge, or put the bridge behind HTTPS.
- Keep `ALLOW_ORIGIN` as narrow as possible.

## Things to check when you test it

- [ ] `curl -X POST http://localhost:8787/dim` actually dims the bulb
- [ ] `curl -X POST http://localhost:8787/restore` brings back the previous brightness
- [ ] The `tapo` package version you installed exposes `setBrightness` or `set().brightness().send()` (the script tries both)
- [ ] The Approve button in the app (Demo mode forces the simulated bulb, so test in Live mode) reaches the bridge from your browser
