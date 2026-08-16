export type CatalogItem = {
  id: string
  vendor: string
  vendorProductId: string
  sku: string
  name: string
  url: string
  imageUrl: string
  currency: string
  price: number
  originalPrice: number | null
  discountPercent: number | null
  categoryPath: string | null
  badges: string[]
}

export type CatalogSource = {
  vendor: string
  url: string
  itemCount: number
}

export type CatalogFile = {
  generatedAt: string
  sources: CatalogSource[]
  items: CatalogItem[]
}
