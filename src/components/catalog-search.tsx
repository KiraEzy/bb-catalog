import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"

type CatalogSearchProps = {
  value: string
  onChange: (value: string) => void
  resultCount: number
  totalCount: number
}

export function CatalogSearch({
  value,
  onChange,
  resultCount,
  totalCount,
}: CatalogSearchProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search name or SKU"
          aria-label="Search catalog"
          className="pl-8"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {resultCount === totalCount
          ? `${totalCount} items`
          : `${resultCount} of ${totalCount} items`}
      </p>
    </div>
  )
}
