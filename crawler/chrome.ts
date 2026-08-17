import { spawn, type ChildProcess } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdir } from "node:fs/promises"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")

export const CDP_PORT = 9222
export const CDP_URL = `http://127.0.0.1:${CDP_PORT}`
export const CHROME_PROFILE = path.join(ROOT, "crawler", ".chrome-cdp")

const CHROME_CANDIDATES = [
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
]

export function chromeExecutable(): string {
  const found = CHROME_CANDIDATES.find((candidate) => existsSync(candidate))
  if (!found) {
    throw new Error("Google Chrome not found. Install Chrome, then retry.")
  }
  return found
}

export async function isCdpReady(): Promise<boolean> {
  try {
    const response = await fetch(`${CDP_URL}/json/version`, {
      signal: AbortSignal.timeout(1000),
    })
    return response.ok
  } catch {
    return false
  }
}

export async function waitForCdp(timeoutMs = 20_000): Promise<void> {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (await isCdpReady()) return
    await new Promise((resolve) => setTimeout(resolve, 400))
  }
  throw new Error(
    `Chrome DevTools is not listening on ${CDP_URL}. Start Chrome with scripts/open-chrome-debug.ps1, then retry.`,
  )
}

export async function ensureDebugChrome(listingUrl: string): Promise<ChildProcess | null> {
  if (await isCdpReady()) return null

  await mkdir(CHROME_PROFILE, { recursive: true })
  const child = spawn(
    chromeExecutable(),
    [
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${CHROME_PROFILE}`,
      "--no-first-run",
      "--no-default-browser-check",
      listingUrl,
    ],
    {
      detached: true,
      stdio: "ignore",
      windowsHide: false,
    },
  )
  child.unref()
  await waitForCdp()
  return child
}
