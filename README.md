# SOL: caregiver app for the SOL sensory-overload band

SOL is a wrist band (ESP32 + MAX30102 heart-rate/SpO2 sensor + MPU6050 motion sensor) and this web app for caregivers. It watches a child's heart rate and movement, notices when heart rate rises well above that child's own resting level, and **suggests one support action that a caregiver must approve**. Nothing is ever done automatically.

SOL is a monitoring and support aid. It is **not a medical device**.

## What the app does

- **Live monitoring** of heart rate, SpO2 and movement from the band (values older than 15 s are greyed out and labelled "Disconnected").
- **Rule-based state**: Calm / Elevated / Escalating, decided against a resting baseline recorded for this child (see "How the state is decided").
- **Caregiver approval**: when the state is *Escalating* the app shows one suggested action (dim the light, play calming audio, or vibrate the band) with **Approve** / **Not now**. Unanswered suggestions expire after 120 s and nothing happens. *Elevated* only shows a quiet note.
- **Learning what helps**: after an approved action the app measures how long the state takes to return to Calm and suggests the actions with the shortest average recovery first.
- **Event log** with CSV export, **trends** from the saved 30-second windows, and a clearly labelled **Demo mode** with simulated data.

## How data flows

```
band (ESP32)  --Wi-Fi-->  Blynk cloud  --HTTPS-->  /api/vitals (Vercel function)  -->  browser app
                                              <--  /api/command (start sending V3, vibrate V5)
```

| Datastream | Meaning |
| --- | --- |
| V0 | SpO2 (%) |
| V1 | placeholder motion number (ignored) |
| V2 | heart rate (bpm); 0 when invalid |
| V3 | switch the app sets to 1 so the band starts sending |
| V4 | motion magnitude (g deviation) |
| V5 | app sets 1 to vibrate the band (firmware change pending) |

`V2`, `V4` and `V5` must exist as datastreams in the Blynk template, and the firmware must send them. A missing or 0 value is shown as "No finger detected".

The browser never sees the Blynk token: `api/vitals.js` and `api/command.js` read it from the server environment.

## Environment variables

| Name | Where | Meaning |
| --- | --- | --- |
| `BLYNK_TOKEN` | Vercel project -> Settings -> Environment Variables (and a gitignored `.env.local` for local testing) | The band's Blynk auth token |

See `.env.example`. `.env*` files are gitignored. **Never commit a token.**

## Run it

```bash
npm install
npm run dev        # UI only. /api is not served, so Live mode shows "Disconnected"; Demo mode works
```

To run the UI together with the serverless functions locally:

```bash
npx vercel dev     # reads BLYNK_TOKEN from .env.local
```

Other commands:

```bash
npm run build      # type-check and build
npm run lint
npm test           # unit tests (state engine, ranking, expiry, CSV, Blynk parsing)
```

## Testing with Demo mode

Use the **Live / Demo** switch in the header. Demo mode:

- shows a visible **DEMO** badge and labels values "simulated";
- takes the state from the *Demo State* dropdown (choose *Escalating* to see the approval card);
- keeps its own event log, separate from real events;
- never sends anything to the band, and always uses the simulated bulb.

The app always starts in Live mode.

## How the state is decided

1. **Baseline**: the caregiver records 5 minutes at rest (10 windows of 30 s). The mean and SD of the window heart rates are stored on the device. Windows with high motion are skipped. *Quick calibration* (60 s) exists for demos only.
2. **Windows**: samples (about every 4 s) are averaged into 30 s windows (mean heart rate, mean motion).
3. **Motion gate**: a window with mean motion > 0.45 g is "Exercise" and can never be Elevated or Escalating (threshold is configurable).
4. **State per window**: *Elevated* if heart rate > mean + 2×SD, *Escalating* if > mean + 4×SD, otherwise *Calm*.
5. **Persistence**: a new state is reported only after it appears in 2 consecutive windows.

One addition to that method: the baseline SD is floored at 1 bpm so a very steady (or very short) baseline cannot make tiny rises count as Elevated. The logic is in `src/data/stateEngine.ts` (pure, unit-tested).

## Light bridge (optional) and audio

- **Dim the light** is simulated by default (an on-screen "Bulb: dimmed" indicator). To control a real Tapo bulb, run the optional script in [`bridge/`](bridge/README.md) on the same Wi-Fi and enter its URL in Settings. **It is untested with a real bulb.**
- **Calming audio** loops `public/audio/calm.mp3`. **TODO: add that file** (see `public/audio/README.md`).

## Known limits

- **Rule-based, not a trained model.** Thresholds on heart rate and movement against a personal baseline; there is no learned model and no confidence score.
- **The motion gate also hides real distress.** A meltdown with a lot of movement is classed as "Exercise" and will not escalate.
- **Light control is simulated** unless the bridge is used, and the bridge is untested. A https-hosted app cannot call a plain-http bridge on another device (browser mixed-content rules).
- **Monitoring only runs while the app is open in a browser tab.** Windows, state and recovery timing are computed in the browser. Background tabs may be throttled by the browser. Nothing is recorded while the tab is closed.
- **Freshness is approximate.** Blynk's API does not give a timestamp per value, so "live" means: the proxy answered within 15 s, Blynk says the band is online, and the values have not been frozen for 30 s.
- **Recovery comparisons are simple.** There is no control group; a state may calm down by itself. Treat the ranking as a hint, not proof that an action works. A "not recovered" trial counts as 15 minutes in the average.
- **No finger on the sensor** gives SpO2 = 0 and no heart rate; the app shows "No finger detected" and does not decide a state.
- **Data lives in this browser only** (localStorage): one device, no sync, no accounts. Windows are kept for 24 hours, events for the latest 1000.
- **No access control.** Anyone who has the deployed URL can read the band's values and trigger a vibration through `/api/*`. Turn on Vercel Deployment Protection (or add your own auth) before using it with real data.
- The firmware is not part of this repository yet.
