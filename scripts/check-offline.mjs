// Checks that the built game starts and plays without a connection after one visit.
//
//   pnpm build && node scripts/check-offline.mjs
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const PORT = 4196
const server = spawn('pnpm', ['exec', 'vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
await new Promise((resolve) => setTimeout(resolve, 2500))
const browser = await chromium.launch()
let failed = false
const check = (ok, what) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`)
  failed ||= !ok
}

// True when the element shows up within a few seconds.
const appears = (page, selector) => page.waitForSelector(selector, { timeout: 5000 }).then(() => true, () => false)

try {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(`http://localhost:${PORT}/`)
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.waitForTimeout(1500)

  await context.setOffline(true)
  await page.reload()
  check(await appears(page, '#newCommanderDiv'), 'the game starts offline')
  check(await page.evaluate(() => document.querySelector('#newCommanderDiv img').naturalWidth > 0), 'the title picture shows offline')
  await page.locator('#createCommander').click()
  await page.locator('[id="Ship Yard"]').click()
  check(await appears(page, '#buyship_Flea'), 'a game can be started and played offline')
  await page.reload()
  check(await appears(page, '#system-info-welcome'), 'the saved game resumes offline')
} finally {
  await browser.close()
  server.kill()
}
process.exit(failed ? 1 : 0)
