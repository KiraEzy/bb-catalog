import { createInterface } from "node:readline"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { chromium, type Page } from "playwright"

import type { CatalogFile, CatalogItem } from "../src/types/catalog.ts"
import { CDP_URL, ensureDebugChrome, isCdpReady } from "./chrome.ts"
import { saveThumbsFromListing } from "./thumbs.ts"
import { tiger111hkAdapter } from "./tiger111hk.ts"

const ROOT = path.resolve(import.meta.dirname, "..")
const OUTPUT = path.join(ROOT, "public", "data", "catalog.json")
const FAILURE_SHOT = path.join(ROOT, "crawler", "last-failure.png")

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

async function waitForEnter(prompt: string): Promise<void> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  await new Promise<void>((resolve) => {
    rl.question(prompt, () => {
      rl.close()
      resolve()
    })
  })
}

async function productCount(page: Page): Promise<number> {
  return page.locator('a[href*="product_info.html"]').count()
}

async function writeCatalog(items: CatalogItem[]) {
  if (items.length === 0) {
    throw new Error("Parser found 0 products.")
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

async function crawlFromChrome(auto: boolean) {
  const alreadyRunning = await isCdpReady()
  if (!alreadyRunning) {
    console.log("Starting a normal Chrome window (Playwright does not launch it).")
    await ensureDebugChrome(tiger111hkAdapter.listingUrl)
  } else {
    console.log(`Chrome is already listening at ${CDP_URL}`)
  }

  if (!auto && process.stdin.isTTY) {
    await waitForEnter(
      "In that Chrome window, finish Cloudflare if needed. When you can see the daily deals list, press Enter here.\n> ",
    )
  } else {
    console.log("Auto mode: waiting up to 90s for the product list…")
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }

  const browser = await chromium.connectOverCDP(CDP_URL)
  try {
    const context = browser.contexts()[0]
    if (!context) {
      throw new Error("Chrome has no window. Keep the debug Chrome open and retry.")
    }

    const pages = context.pages()
    const page =
      pages.find((candidate) => candidate.url().includes("airsoft.tiger111hk.com")) ??
      pages.at(-1)
    if (!page) {
      throw new Error("No Chrome tab found. Open the daily deals page, then retry.")
    }

    if ((await productCount(page)) === 0) {
      await page.goto(tiger111hkAdapter.listingUrl, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      })
      await page.waitForSelector('a[href*="product_info.html"]', {
        timeout: auto ? 90_000 : 30_000,
      })
    }

    const html = await page.content()
    const items = tiger111hkAdapter.parse(html)
    if (items.length === 0) {
      await writeFile(path.join(ROOT, "crawler", "last-html.html"), html, "utf8")
      throw new Error("Parser found 0 products. Saved crawler/last-html.html for inspection.")
    }

    const { saved, removed } = await saveThumbsFromListing(page, items)
    console.log(`Saved ${saved} local thumbnails from the listing page.`)
    if (removed > 0) {
      console.log(`Removed ${removed} leftover thumbnails from older crawls.`)
    }
    await writeCatalog(items)
  } catch (error) {
    const context = browser.contexts()[0]
    const page = context?.pages()[0]
    await page?.screenshot({ path: FAILURE_SHOT, fullPage: true }).catch(() => undefined)
    throw new Error(
      `Could not read the listing. Screenshot: ${FAILURE_SHOT}. Pass Cloudflare in the debug Chrome window, leave it open, then run npm run crawl again.`,
      { cause: error },
    )
  } finally {
    await browser.close().catch(() => undefined)
  }
}

async function main() {
  const htmlPath = argValue("--html")
  if (htmlPath) {
    console.log(`Parsing saved HTML: ${htmlPath}`)
    const items = tiger111hkAdapter.parse(await readFile(path.resolve(htmlPath), "utf8"))
    await writeCatalog(items)
    console.log("Saved HTML has no in-browser images; run npm run crawl against the live listing to capture thumbnails.")
    return
  }

  console.log(`Crawling ${tiger111hkAdapter.listingUrl}`)
  await crawlFromChrome(hasFlag("--auto"))
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
