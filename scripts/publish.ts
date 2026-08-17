import { execSync } from "node:child_process"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")

function run(command: string): string {
  return execSync(command, { cwd: ROOT, encoding: "utf8" }).trim()
}

function hasRemote(): boolean {
  try {
    return run("git remote").length > 0
  } catch {
    return false
  }
}

function main() {
  run("git add public/data/catalog.json public/thumbs")
  const staged = run("git diff --cached --name-only")
  if (!staged.includes("catalog.json") && !staged.includes("thumbs")) {
    console.log("No catalog.json or thumbnail changes to publish.")
    return
  }

  try {
    run('git commit -m "Update catalog snapshot"')
  } catch (error) {
    console.error("git commit failed. Configure user.name / user.email locally, then retry.")
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }

  if (!hasRemote()) {
    console.log("Committed catalog.json. Add a GitHub remote, then npm run publish again to push.")
    return
  }

  run("git push")
  console.log("Pushed catalog.json. GitHub Pages will rebuild from the deploy workflow.")
}

main()
