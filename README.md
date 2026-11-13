# Study Atlas

One exam workbench for DAA, Computer Networks, Engineering Economics, Software Engineering, and Distributed Operating Systems.

[Open Study Atlas](https://clankclankclankclank.github.io/atlas/)

## Run locally

```sh
npm ci
npm run build
```

Open `dist/index.html` in a browser. Study progress and display preferences are stored in the browser. Progress from an offline copy may belong to a different browser origin.

## Publish updates

GitHub Pages uses the GitHub Actions source. Push to `main` to build and deploy the static site. Assets and question scans are served alongside the app.

The subject modules keep separate styles and load on demand. The shared hub preloads destinations and retains the current screen until the next subject is ready. Navigation uses an in-page crossfade and respects the browser’s reduced-motion preference.

The password prompt is a browser-side gate. GitHub Pages serves public assets and the repository is public. Successful unlocks are remembered in browser storage.

## Discord failed sign-in alerts

Deploy this repository on Vercel and set `ATLAS_DISCORD_WEBHOOK` as a Production environment variable on that project. Use a fresh Discord webhook URL. Configure a Vercel Firewall rate limit for POST requests to `/api/atlas-alert` before enabling it. The relay also applies a five-minute cooldown per running function instance.

Set the `atlas-alert-endpoint` meta tag in `index.html` to the deployment’s HTTPS URL ending in `/api/atlas-alert`, then publish to GitHub Pages. Leave the tag empty to disable alerts. The endpoint only accepts the Study Atlas Pages origin in browsers. A public caller can forge a report, so treat messages as signals rather than verified security events. The client sends no password, IP field, or device details, and Discord receives a fixed message.
