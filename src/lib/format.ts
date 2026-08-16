const currencyLabels: Record<string, string> = {
  HKD: "HK$",
  USD: "US$",
  EUR: "€",
}

export function formatMoney(amount: number, currency: string): string {
  const symbol = currencyLabels[currency] ?? `${currency} `
  return `${symbol}${amount.toLocaleString("en-HK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatGeneratedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat("en-HK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Hong_Kong",
  }).format(date)
}

export function catalogUrl(): string {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  return `${base}data/catalog.json`
}
