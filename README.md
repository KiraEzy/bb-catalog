# BB Catalog

Searchable table of Tiger111hk daily deals. A local crawl writes `public/data/catalog.json`; GitHub Pages hosts the static site.

Live: https://kiraezy.github.io/bb-catalog/

## Images

Vendor image URLs are blocked by Cloudflare (403) when loaded from GitHub Pages. The crawler copies listing thumbnails into **`public/thumbs/`** in this repo. GitHub Pages serves those files — no extra CDN or image host.

Each crawl **overwrites** the same `{productId}.jpg` and **deletes** thumbs that are no longer in the catalog. There is no per-date image archive.

The table only **renders visible rows** (plus a small overscan). Off-screen product images are not in the DOM, so the browser does not download them until you scroll near them.

`npm run publish` commits both `public/data/catalog.json` and `public/thumbs/`.

## Crawl (Cloudflare)

Do **not** use a Playwright-launched Chrome — Cloudflare will loop the human check. The crawler opens a normal Chrome window, waits until you can see the listing, then reads the page.

```powershell
cd E:\Projects\bb-catalog
npm run crawl
```

1. A Chrome window opens to daily deals.
2. Complete Cloudflare there if asked, and wait until products are visible.
3. Return to the terminal and press Enter.

To open Chrome first, then crawl:

```powershell
powershell -File scripts/open-chrome-debug.ps1
# pass Cloudflare, then:
npm run crawl
```

If attach still retriggers Cloudflare, save the page in Chrome (`Ctrl+S`, Webpage HTML only) and parse it:

```powershell
npm run crawl -- --html $HOME\Downloads\daily_deals.php.html
```

## Site

```powershell
npm run dev
```

Open the `/bb-catalog/` URL Vite prints.

## Publish

```powershell
npm run crawl-and-publish
```

Or register a daily task: `powershell -File scripts/register-daily-task.ps1` (uses `crawl:auto` after a session already exists in `crawler/.chrome-cdp`).
