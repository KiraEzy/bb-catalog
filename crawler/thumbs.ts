import { mkdir, readdir, unlink, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"

import type { Page } from "playwright"

import type { CatalogItem } from "../src/types/catalog.ts"

const ROOT = path.resolve(import.meta.dirname, "..")
export const THUMBS_DIR = path.join(ROOT, "public", "thumbs")

function localThumbPath(vendor: string, productId: string): string {
  return `thumbs/${vendor}/${productId}.jpg`
}

export async function saveThumbsFromListing(
  page: Page,
  items: CatalogItem[],
): Promise<{ saved: number; removed: number }> {
  const snapshots = await page.evaluate(() => {
    const seen = new Set<string>()
    const out: { id: string; dataUrl: string }[] = []
    const links = document.querySelectorAll('a[href*="product_info.html"]')
    for (const link of links) {
      const href = (link as HTMLAnchorElement).href
      const id = href.match(/\/p(\d+)\//)?.[1]
      if (!id || seen.has(id)) continue
      const scope = link.closest("td, li, article") ?? link.parentElement
      const img = (scope?.querySelector("img[src*='images/']") ??
        link.querySelector("img") ??
        scope?.querySelector("img")) as HTMLImageElement | null
      if (!img || img.naturalWidth === 0) continue
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) continue
      ctx.drawImage(img, 0, 0)
      seen.add(id)
      out.push({ id, dataUrl: canvas.toDataURL("image/jpeg", 0.86) })
    }
    return out
  })

  const byId = new Map(snapshots.map((snap) => [snap.id, snap.dataUrl]))
  let saved = 0
  for (const item of items) {
    const dataUrl = byId.get(item.vendorProductId)
    if (!dataUrl) continue
    const relative = localThumbPath(item.vendor, item.vendorProductId)
    const filePath = path.join(ROOT, "public", relative)
    await mkdir(path.dirname(filePath), { recursive: true })
    const base64 = dataUrl.split(",")[1]
    if (!base64) continue
    await writeFile(filePath, Buffer.from(base64, "base64"))
    item.imageUrl = relative
    saved += 1
  }

  const removed = await pruneStaleThumbs(items)
  return { saved, removed }
}

export async function pruneStaleThumbs(items: CatalogItem[]): Promise<number> {
  if (!existsSync(THUMBS_DIR)) return 0
  const keep = new Set(
    items.map((item) => localThumbPath(item.vendor, item.vendorProductId)),
  )
  let removed = 0
  const vendors = await readdir(THUMBS_DIR, { withFileTypes: true })
  for (const vendor of vendors) {
    if (!vendor.isDirectory()) continue
    const dir = path.join(THUMBS_DIR, vendor.name)
    const files = await readdir(dir)
    for (const file of files) {
      const relative = `thumbs/${vendor.name}/${file}`
      if (keep.has(relative)) continue
      await unlink(path.join(dir, file))
      removed += 1
    }
  }
  return removed
}
