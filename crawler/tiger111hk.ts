import { load } from "cheerio"

import type { CatalogItem } from "../src/types/catalog.ts"
import type { VendorAdapter } from "./adapter.ts"

export const TIGER111HK_ORIGIN = "https://airsoft.tiger111hk.com"
export const TIGER111HK_DAILY_DEALS_URL =
  `${TIGER111HK_ORIGIN}/daily_deals.php?currency=HKD&language=en&display_num=360`

const MONEY_RE = /(HK\$|US\$|€)\s*([\d,]+(?:\.\d+)?)/i
const PRODUCT_ID_RE = /\/p(\d+)\//i
const CPATH_RE = /[?&]cPath=([^&]+)/i
const PRODUCT_ID_QUERY_RE = /[?&]products_id=(\d+)/i

function absoluteUrl(href: string | undefined): string {
  if (!href) return ""
  try {
    return new URL(href, TIGER111HK_ORIGIN).toString()
  } catch {
    return href
  }
}

function parseMoney(text: string): { amount: number; currency: string } | null {
  const match = text.replace(/\u00a0/g, " ").match(MONEY_RE)
  if (!match) return null
  const amount = Number.parseFloat(match[2].replace(/,/g, ""))
  if (Number.isNaN(amount)) return null
  const symbol = match[1].toUpperCase()
  const currency = symbol.includes("HK") ? "HKD" : symbol.includes("US") ? "USD" : "EUR"
  return { amount, currency }
}

function allMoney(text: string): { amount: number; currency: string }[] {
  const found: { amount: number; currency: string }[] = []
  const normalized = text.replace(/\u00a0/g, " ")
  const globalRe = /(HK\$|US\$|€)\s*([\d,]+(?:\.\d+)?)/gi
  for (const match of normalized.matchAll(globalRe)) {
    const amount = Number.parseFloat(match[2].replace(/,/g, ""))
    if (Number.isNaN(amount)) continue
    const symbol = match[1].toUpperCase()
    const currency = symbol.includes("HK") ? "HKD" : symbol.includes("US") ? "USD" : "EUR"
    found.push({ amount, currency })
  }
  return found
}

function looksLikeSku(value: string, name: string): boolean {
  const sku = value.trim()
  if (sku.length < 3 || sku.length > 48) return false
  if (sku === name) return false
  if (/\s/.test(sku)) return false
  if (MONEY_RE.test(sku)) return false
  if (/^(add to cart|buy now|daily deals time left|hot)$/i.test(sku)) return false
  return /[A-Za-z]/.test(sku) && /[\d-]/.test(sku)
}

function discountPercent(price: number, original: number | null): number | null {
  if (original == null || original <= 0 || price >= original) return null
  return Math.round((1 - price / original) * 100)
}

export function parseTiger111hkDailyDeals(html: string): CatalogItem[] {
  const $ = load(html)
  const items: CatalogItem[] = []
  const seen = new Set<string>()

  $('a[href*="product_info.html"]').each((_, el) => {
    const href = absoluteUrl($(el).attr("href"))
    const idMatch = href.match(PRODUCT_ID_RE)
    if (!idMatch) return
    const vendorProductId = idMatch[1]
    if (seen.has(vendorProductId)) return
    seen.add(vendorProductId)

    const $card = $(el).closest("td, li, article")
    const scope = $card.length ? $card : $(el).parent()
    const name =
      scope.find('a[href*="product_info.html"]').text().replace(/\s+/g, " ").trim() ||
      scope.find("img[alt]").attr("alt")?.trim() ||
      $(el).text().replace(/\s+/g, " ").trim()

    const imageHref =
      scope.find('img[src*="small_th"], img[src*="images/"]').first().attr("src") ||
      scope.find("img").first().attr("src")

    const buyHref =
      scope.find('a[href*="products_id="]').attr("href") ||
      scope.find('a[href*="buy_now"]').attr("href") ||
      ""
    const cPath = buyHref.match(CPATH_RE)?.[1] ?? null
    const buyId = buyHref.match(PRODUCT_ID_QUERY_RE)?.[1]
    if (buyId && buyId !== vendorProductId) {
      // Keep product_info id; buy link is only used for cPath.
    }

    const strikeText =
      scope.find("s, strike, del").first().text() ||
      scope.find("[style*='line-through']").first().text()
    const originalParsed = parseMoney(strikeText)

    const money = allMoney(scope.text())
    let price = money.at(-1)?.amount
    let currency = money.at(-1)?.currency ?? "HKD"
    let originalPrice = originalParsed?.amount ?? (money.length > 1 ? money[0].amount : null)
    if (price == null && money.length === 1) {
      price = money[0].amount
      originalPrice = null
    }
    if (price == null) return

    const badges: string[] = []
    if (scope.find('img[src*="hot-icon"]').length) badges.push("hot")

    let sku = ""
    scope.contents().each((__, node) => {
      if (sku) return
      if (node.type === "text") {
        const candidate = node.data?.trim() ?? ""
        if (looksLikeSku(candidate, name)) sku = candidate
      }
    })
    if (!sku) {
      const tokens = scope
        .text()
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
      sku = tokens.find((token) => looksLikeSku(token, name)) ?? ""
    }

    items.push({
      id: `tiger111hk:${vendorProductId}`,
      vendor: "tiger111hk",
      vendorProductId,
      sku,
      name,
      url: href.split("?")[0],
      imageUrl: absoluteUrl(imageHref),
      currency,
      price,
      originalPrice,
      discountPercent: discountPercent(price, originalPrice),
      categoryPath: cPath,
      badges,
    })
  })

  return items
}

export const tiger111hkAdapter: VendorAdapter = {
  id: "tiger111hk",
  listingUrl: TIGER111HK_DAILY_DEALS_URL,
  parse: parseTiger111hkDailyDeals,
}
