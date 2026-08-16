import { useMemo, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowUpDown, ExternalLink } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatMoney } from "@/lib/format"
import type { CatalogItem } from "@/types/catalog"

type CatalogTableProps = {
  items: CatalogItem[]
}

function SortHeader({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <Button variant="ghost" size="sm" className="-ml-2.5" onClick={onClick}>
      {label}
      <ArrowUpDown />
    </Button>
  )
}

export function CatalogTable({ items }: CatalogTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<CatalogItem>[]>(
    () => [
      {
        id: "image",
        header: "",
        cell: ({ row }) => (
          <img
            src={row.original.imageUrl}
            alt=""
            className="size-12 rounded-md object-cover bg-muted"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortHeader
            label="Name"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <div className="max-w-80 space-y-1 whitespace-normal">
            <p className="font-medium leading-snug">{row.original.name}</p>
            <div className="flex flex-wrap gap-1">
              {row.original.badges.map((badge) => (
                <Badge key={badge} variant="secondary">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "sku",
        header: ({ column }) => (
          <SortHeader
            label="SKU"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.sku || "—"}</span>
        ),
      },
      {
        accessorKey: "originalPrice",
        header: ({ column }) => (
          <SortHeader
            label="Original"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) =>
          row.original.originalPrice == null ? (
            "—"
          ) : (
            <span className="text-muted-foreground line-through">
              {formatMoney(row.original.originalPrice, row.original.currency)}
            </span>
          ),
      },
      {
        accessorKey: "price",
        header: ({ column }) => (
          <SortHeader
            label="Deal"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {formatMoney(row.original.price, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "discountPercent",
        header: ({ column }) => (
          <SortHeader
            label="Off"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) =>
          row.original.discountPercent == null ? (
            "—"
          ) : (
            <Badge variant="outline">{row.original.discountPercent}%</Badge>
          ),
      },
      {
        accessorKey: "vendor",
        header: "Vendor",
        cell: ({ row }) => row.original.vendor,
      },
      {
        id: "link",
        header: "",
        cell: ({ row }) => (
          <Button variant="outline" size="sm" asChild>
            <a
              href={row.original.url}
              target="_blank"
              rel="noreferrer"
            >
              View
              <ExternalLink />
            </a>
          </Button>
        ),
      },
    ],
    [],
  )

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No products match that search.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
