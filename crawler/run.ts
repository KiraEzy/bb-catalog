import { existsSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import { chromium, type BrowserContext } from "playwright"

import type { CatalogFile } from "../src/types/catalog.ts"
import { tiger111hkAdapter } from "./tiger111hk.ts"

const ROOT = path.resolve(import.meta.dirname, "..")
const OUTPUT = path.join(ROOT, "public", "data", "catalog.json")
const PROFILE = path.join(ROOT, "crawler", ".chrome-profile")
const FAILURE_SHOT = path.join(ROOT, "crawler", "last-failure.png")

const CHROME_CANDIDATES = [
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
]

function chromeExecutable(): string | undefined {
  return CHROME_CANDIDATES.find((candidate) => existsSync(candidate))
}

async function openContext(headed: boolean): Promise<BrowserContext> {
  const executablePath = chromeExecutable()
  await mkdir(PROFILE, { recursive: true })
  return chromium.launchPersistentContext(PROFILE, {
    headless: !headed,
    executablePath,
    locale: "en-HK",
    viewport: { width: 1400, height: 900 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  })
}

async function fetchListingHtml(headed: boolean): Promise<string> {
  const context = await openContext(headed)
  const page = context.pages()[0] ?? (await context.newPage())
  const waitMs = headed ? 180_000 : 45_000
  try {
    if (headed) {
      console.log(
        "If Chrome shows a Cloudflare checkbox, complete it. Waiting up to 3 minutes for the product list…",
      )
    }
    await page.goto(tiger111hkAdapter.listingUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    })
    try {
      await page.waitForSelector('a[href*="product_info.html"]', {
        timeout: waitMs,
      })
    } catch {
      await page.screenshot({ path: FAILURE_SHOT, fullPage: true })
      throw new Error(
        `Listing not found (Cloudflare challenge?). Screenshot: ${FAILURE_SHOT}. Run npm run crawl:headed and complete the checkbox once; the Chrome profile is reused after that.`,
      )
    }
    return await page.content()
  } finally {
    await context.close()
  }
}

async function main() {
  const headed = process.argv.includes("--headed")
  console.log(`Crawling ${tiger111hkAdapter.listingUrl}`)
  const html = await fetchListingHtml(headed)
  const items = tiger111hkAdapter.parse(html)
  if (items.length === 0) {
    await writeFile(path.join(ROOT, "crawler", "last-html.html"), html, "utf8")
    throw new Error("Parser found 0 products. Saved crawler/last-html.html for inspection.")
  }

  const catalog: CatalogFile = {
    generatedAt: new Date().toISOString(),
    sources: [
      {
        vendor: tiger111hkAdapter.id,
        url: tiger111hkAdapter.listingUrl,
        itemCount: items.length,
      },
    ],
    items,
  }

  await mkdir(path.dirname(OUTPUT), { recursive: true })
  await writeFile(OUTPUT, `${JSON.stringify(catalog, null, 2)}\n`, "utf8")
  console.log(`Wrote ${items.length} items to ${OUTPUT}`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
