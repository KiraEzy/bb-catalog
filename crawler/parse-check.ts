import { readFileSync } from "node:fs"
import path from "node:path"

import { parseTiger111hkDailyDeals } from "./tiger111hk.ts"

const html = readFileSync(
  path.join(import.meta.dirname, "fixtures", "daily-deals-sample.html"),
  "utf8",
)
const items = parseTiger111hkDailyDeals(html)
if (items.length !== 2) {
  throw new Error(`expected 2 items, got ${items.length}`)
}
if (items[0].sku !== "AY-A0024-03" || items[0].price !== 74) {
  throw new Error(`unexpected first item: ${JSON.stringify(items[0])}`)
}
if (!items[1].badges.includes("hot") || items[1].discountPercent !== 5) {
  throw new Error(`unexpected second item: ${JSON.stringify(items[1])}`)
}
console.log("Parser fixture check passed.")
