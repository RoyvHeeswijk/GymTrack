# GymTrack op je iPhone installeren

GymTrack draait als **PWA** (web-app met icoon op je beginscherm). Geen App Store nodig.

## Stap 1 — Vercel-link openen

Open de productie-URL in **Safari** op je iPhone (niet Chrome):

`https://[jouw-vercel-url].vercel.app`

> De exacte URL staat in het Vercel-dashboard na deploy, of vraag je ontwikkelaar.

## Stap 2 — Op beginscherm zetten

1. Tik op **Delen** (vierkant met pijl omhoog, onderaan in Safari)
2. Scroll en kies **Zet op beginscherm**
3. Tik **Voeg toe**

GymTrack opent daarna fullscreen, zonder Safari-adresbalk — net als een app.

---

## Lokaal testen (zelfde WiFi)

Als je nog niet op Vercel hebt gedeployed:

```bash
cd gymtrack
npm run dev -- --host
```

Open op je iPhone: `http://[IP-van-je-PC]:5173` (staat in de terminal).

---

## Supabase op Vercel (GitHub-deploy)

Bij deploy via **GitHub → Vercel** worden lokale `.env`-bestanden niet meegestuurd. Daarom staat de productie-config in **`.env.production`** (wel in git).

Vercel voert `npm run build` uit; Vite laadt `.env.production` automatisch. Geen handmatige env vars in Vercel nodig, tenzij je andere keys wilt gebruiken.

Lokaal ontwikkelen: gebruik `.env` (kopieer van `.env.example`).

---

## Supabase Auth URL’s (eenmalig)

Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL**: je Vercel production URL
- **Redirect URLs**: dezelfde URL + `https://*.vercel.app/**`

Nodig voor e-mailbevestiging bij registratie. Inloggen met wachtwoord werkt meestal direct.

---

## Vercel deploy (Windows)

```bash
cd gymtrack
npx vercel login
npx vercel --prod
```

Bij eerste deploy: env vars instellen (zie hierboven), daarna opnieuw deployen.
