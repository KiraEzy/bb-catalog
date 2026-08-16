import type { CatalogItem } from "../src/types/catalog.ts"

export type VendorAdapter = {
  id: string
  listingUrl: string
  parse: (html: string) => CatalogItem[]
}
