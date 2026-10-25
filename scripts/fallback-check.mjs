import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
const results = []
const check = (name, ok, detail = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await context.addInitScript(() => { delete window.BroadcastChannel })
const errors = []
const resident = await context.newPage()
const leader = await context.newPage()
for (const p of [resident, leader]) p.on('pageerror', (e) => errors.push(e.message))

await resident.goto(BASE + '/resident', { waitUntil: 'networkidle' })
await leader.goto(BASE + '/leadership', { waitUntil: 'networkidle' })
check('BroadcastChannel disabled', await leader.evaluate(() => typeof window.BroadcastChannel === 'undefined'))

// Area mode: drag a circle
await resident.getByRole('button', { name: 'Report an Issue' }).click()
await resident.getByText('A wider area').click()
await resident.mouse.move(950, 600)
await resident.mouse.down()
await resident.mouse.move(1010, 640, { steps: 8 })
await resident.mouse.up()
const formText = await resident.locator('.cl-sheet').innerText()
const radius = formText.match(/~(\d+)m radius/)
check('Area mode captured a radius', !!radius && Number(radius[1]) > 20, radius?.[0])
await resident.getByPlaceholder('Traffic signal not working').fill('Street flooding across several blocks')
await resident.locator('.cl-sheet select').selectOption('water_drainage')
await resident.getByPlaceholder(/The traffic light at this intersection/).fill('Severe flooding is covering the road after the storm.')
await resident.getByRole('button', { name: 'Submit Report' }).click()
await resident.getByText('Priority classification complete.').waitFor({ timeout: 5000 })
check('Flooding classified Critical', (await resident.locator('.cl-sheet').innerText()).includes('Critical'))
await resident.getByRole('button', { name: 'View on Map' }).click()

await leader.waitForTimeout(1000)
const lt = await leader.locator('body').innerText()
check('Storage-event fallback delivered report to leadership', lt.includes('Street flooding across several blocks'))
const reports = await leader.locator('.cl-gauge').nth(2).innerText()
check('Leadership metrics updated via fallback', reports.startsWith('5'), reports.replace(/\n/g, ' '))
check('No page errors', errors.length === 0, errors.join(' | '))

console.log(results.join('\n'))
await browser.close()
