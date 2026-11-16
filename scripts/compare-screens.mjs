// Development check: does a screen look the same as in old/?
//
//   node scripts/compare-screens.mjs [--alert] <row-id> [step-id ...]
//
// Loads the saved game from the test fixtures into old/index.html and into the dev
// server (started here), clicks the landing row with the given id and then any further
// element ids, and compares screenshots of the area below the navigation.
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const PORT = 5199
// --alert compares the open alert instead; alerts sit on top of the page.
const alertOnly = process.argv.includes('--alert')
const steps = process.argv.slice(2).filter((arg) => arg !== '--alert')
if (steps.length === 0) throw new Error('Give the id of a landing row, for example: Bank')
const out = 'node_modules/.tmp/compare-screens'
mkdirSync(out, { recursive: true })
const save = JSON.parse(readFileSync('src/tests/fixtures/old-save.json', 'utf8'))

async function startDevServer() {
  const server = spawn('pnpm', ['exec', 'vite', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
  for (let i = 0; i < 50; i++) {
    const up = await fetch(`http://localhost:${PORT}/`).then(() => true, () => false)
    if (up) return server
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  server.kill()
  throw new Error('The dev server did not start')
}

async function shoot(browser, url, tag) {
  const page = await browser.newPage({ viewport: { width: 800, height: 1400 } })
  const problems = []
  page.on('pageerror', (error) => problems.push(String(error)))
  await page.goto(url)
  await page.evaluate((games) => {
    localStorage.clear()
    for (const [key, value] of Object.entries(games)) localStorage.setItem(key, JSON.stringify(value))
  }, save)
  await page.reload()
  await page.waitForSelector('#systemLandingDiv')
  for (const id of steps) await page.locator(`[id="${id}"]`).first().click()
  await page.waitForTimeout(300)
  const target = page.locator(alertOnly ? '.alert-box' : '#systemLandingSubContentDiv').first()
  const png = await target.screenshot({ path: `${out}/${tag}-${steps.join('_')}.png` })
  return { png, problems }
}

const server = await startDevServer()
const browser = await chromium.launch()
try {
  const before = await shoot(browser, `file://${process.cwd()}/old/index.html`, 'old')
  const after = await shoot(browser, `http://localhost:${PORT}/`, 'new')
  console.log(`${steps.join(' > ')}: identical: ${before.png.equals(after.png)}; page errors in new: ${after.problems.length}`)
  if (after.problems.length) console.log(after.problems.slice(0, 3).join('\n'))
  if (!before.png.equals(after.png)) console.log(`Screenshots are in ${out}/`)
} finally {
  await browser.close()
  server.kill()
}
