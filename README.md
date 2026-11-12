# FinSmart AI

Aplikasi manajemen keuangan pribadi dengan asisten AI (Gemini), berjalan 100% di tier gratis.

## Arsitektur (gratis)
- **Frontend**: React + Vite (PWA), di-hosting di Cloudflare Pages (`*.pages.dev`).
- **Login & database**: Firebase Authentication (Google) + Cloud Firestore, project tanpa billing.
- **AI**: Firebase AI Logic → Gemini Developer API (free tier). Tidak ada API key di kode.
- **Android**: Trusted Web Activity (folder `android/`), dibangun lewat GitHub Actions.

## Pengembangan lokal
```
npm install
npm run dev
```

## Build
```
npm run build
```
Output di `dist/`. Cloudflare Pages: build command `npm run build`, output directory `dist`.

## Kebijakan privasi
`/privacy.html`
