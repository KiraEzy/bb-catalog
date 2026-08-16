# BB Catalog

Searchable table of Tiger111hk daily deals. A local Playwright crawl writes `public/data/catalog.json`; the Vite app renders it. GitHub Pages hosts the static files (no crawl in CI).

## Setup

```powershell
cd E:\Projects\bb-catalog
npm install
npm run crawl:headed
```

Complete the Cloudflare checkbox in Chrome once. Later `npm run crawl` reuses `crawler/.chrome-profile`.

```powershell
npm run dev
```

Open the URL Vite prints (`/bb-catalog/` is the base path).

## Daily publish

1. Create a GitHub repo named `bb-catalog` and `git remote add origin …`
2. Repo Settings → Pages → Source: GitHub Actions
3. `npm run crawl-and-publish` (or `powershell -File scripts/register-daily-task.ps1`)
