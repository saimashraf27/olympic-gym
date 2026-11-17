# Olympic Gym website

Public website for Olympic Gym at **olympicgym.pk**. The member app (app.olympicgym.pk) and
staff panel (admin.olympicgym.pk) are separate projects; this site links to both.

- `public/index.html`: the whole site (HTML, CSS and JS in one file, light and dark mode)
- `server.js`: tiny Node server with no dependencies (security headers, 404 page, `/healthz`)
- `test/`: server tests (`npm test`)

## Run it

```bash
npm start          # http://localhost:3000
npm test
```

## Gym details

Address, map link, phone, WhatsApp, timings, packages and social links live in the
`window.GYM` block near the top of `public/index.html`. Anything left empty is hidden.
Setting `whatsapp` makes every "Join now" button open WhatsApp.

## Deploy on Railway

1. Railway → New Project → Deploy from GitHub repo → `saimashraf27/olympic-gym`.
   Railway runs `npm start` and sets `PORT`.
2. Settings → Networking → Custom Domain: add `olympicgym.pk` and `www.olympicgym.pk`, and
   remove them from the service that serves the old landing page.
3. At the domain registrar, set the DNS records Railway shows.
4. Optional: Settings → Deploy → Healthcheck Path: `/healthz`.
