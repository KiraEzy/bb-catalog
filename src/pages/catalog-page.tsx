import { useEffect, useMemo, useState } from "react"

import { CatalogSearch } from "@/components/catalog-search"
import { CatalogTable } from "@/components/catalog-table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { catalogUrl, formatGeneratedAt } from "@/lib/format"
import type { CatalogFile } from "@/types/catalog"

export function CatalogPage() {
  const [catalog, setCatalog] = useState<CatalogFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    let cancelled = false
    fetch(catalogUrl(), { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Catalog JSON returned ${response.status}`)
        }
        return (await response.json()) as CatalogFile
      })
      .then((data) => {
        if (!cancelled) setCatalog(data)
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Failed to load catalog")
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    if (!catalog) return []
    const needle = query.trim().toLowerCase()
    if (!needle) return catalog.items
    return catalog.items.filter((item) => {
      return (
        item.name.toLowerCase().includes(needle) ||
        item.sku.toLowerCase().includes(needle) ||
        item.vendor.toLowerCase().includes(needle)
      )
    })
  }, [catalog, query])

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">BB Catalog</p>
        <h1 className="font-heading text-3xl font-medium tracking-tight">
          Daily deals
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Public listings from vendor sites, normalized to JSON and searchable
          here. Prices and stock belong to the seller — open View to buy on
          their page.
        </p>
      </header>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Tiger111hk</CardTitle>
          <CardDescription>
            {catalog
              ? `Updated ${formatGeneratedAt(catalog.generatedAt)} · ${catalog.items.length} products`
              : error
                ? "Catalog JSON is missing or unreadable. Run npm run crawl locally, then refresh."
                : "Loading catalog…"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {error}
            </p>
          ) : catalog ? (
            <>
              <CatalogSearch
                value={query}
                onChange={setQuery}
                resultCount={filtered.length}
                totalCount={catalog.items.length}
              />
              <CatalogTable items={filtered} />
            </>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Loading catalog…
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
