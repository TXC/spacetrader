// Checks that the built game works without a connection after one visit, keeps exactly the
// files of its build, and moves to a new build the next time it is opened.
//
//   node scripts/check-offline.mjs      (or: pnpm test:offline)
//
// It makes two builds of its own, the second marked so that it differs from the first.
import { readFile, rm } from 'node:fs/promises'
import { chromium } from 'playwright'
import { build, preview } from 'vite'

const PORT = 4196
const ADDRESS = `http://localhost:${PORT}/`
const FIRST = 'node_modules/.tmp/offline-first'
const SECOND = 'node_modules/.tmp/offline-second'

let failed = false
const check = (ok, what) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`)
  failed ||= !ok
}

// A build of the game. With a mark, its start-up code differs, as a new version's would.
function buildInto(outDir, mark) {
  const marked = {
    name: 'mark-the-build',
    transform: (code, id) => (id.endsWith('/src/main.tsx') ? `${code}\nwindow.buildMark = ${JSON.stringify(mark)}` : null),
  }
  return build({ logLevel: 'error', build: { outDir, emptyOutDir: true }, plugins: mark ? [marked] : [] })
}

const serve = (outDir) => preview({ logLevel: 'error', build: { outDir }, preview: { port: PORT, strictPort: true } })

// The paths the worker of a build is told to keep, read from the built worker itself.
async function filesOf(outDir) {
  const worker = await readFile(`${outDir}/sw.js`, 'utf8')
  return [...worker.matchAll(/"url":"([^"]+)"/g)].map((match) => '/' + match[1]).sort()
}

// The paths the browser has stored for the game.
const stored = (page) =>
  page.evaluate(async () => {
    const paths = []
    for (const name of await caches.keys()) {
      for (const request of await (await caches.open(name)).keys()) paths.push(new URL(request.url).pathname)
    }
    return paths.sort()
  })

// True once `condition`, tried every 100 ms, holds; false after five seconds.
async function eventually(condition) {
  for (let i = 0; i < 50; i++) {
    if (await condition()) return true
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  return false
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const appears = (page, selector) => page.waitForSelector(selector, { timeout: 5000 }).then(() => true, () => false)

async function checkFirstBuild(context) {
  const page = await context.newPage()
  await page.goto(ADDRESS)
  await page.evaluate(() => navigator.serviceWorker.ready)
  const expected = await filesOf(FIRST)
  check(await eventually(async () => same(await stored(page), expected)), 'exactly the files of the build are stored')

  const fromNetwork = []
  page.on('response', (response) => response.fromServiceWorker() || fromNetwork.push(response.url()))
  await page.reload()
  await appears(page, '#newCommanderDiv')
  check(fromNetwork.length === 0, `a second load downloads nothing (${fromNetwork.join(', ') || 'none'})`)
  return page
}

async function checkOffline(context, page) {
  await context.setOffline(true)
  await page.reload()
  check(await appears(page, '#newCommanderDiv'), 'the game starts offline')
  check(await page.evaluate(() => document.querySelector('#newCommanderDiv img').naturalWidth > 0), 'the title picture shows offline')
  await page.locator('#createCommander').click()
  await page.locator('[id="Ship Yard"]').click()
  check(await appears(page, '#buyship_Flea'), 'a game can be started and played offline')
  await page.reload()
  check(await appears(page, '#system-info-welcome'), 'the saved game resumes offline')
  await context.setOffline(false)
}

// The second build is being served. The open game stays on the first until it is closed.
async function checkUpdate(context, page) {
  await page.reload()
  const waiting = () => page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting))
  check(await eventually(waiting), 'a new build is fetched in the background')
  check(await page.evaluate(() => window.buildMark === undefined), 'the open game is not replaced while it is open')
  await page.close()

  const reopened = await context.newPage()
  const isNew = async () => {
    await reopened.goto(ADDRESS)
    return reopened.evaluate(() => window.buildMark === 'second')
  }
  check(await eventually(isNew), 'the new build is used the next time the game is opened')
  const expected = await filesOf(SECOND)
  check(await eventually(async () => same(await stored(reopened), expected)), "the old build's files are gone")
}

await buildInto(FIRST)
await buildInto(SECOND, 'second')
const browser = await chromium.launch()
let server = await serve(FIRST)
try {
  const context = await browser.newContext()
  const page = await checkFirstBuild(context)
  await checkOffline(context, page)
  await server.close()
  server = await serve(SECOND)
  await checkUpdate(context, page)
} finally {
  await browser.close()
  await server.close()
  await rm(FIRST, { recursive: true, force: true })
  await rm(SECOND, { recursive: true, force: true })
}
process.exit(failed ? 1 : 0)
