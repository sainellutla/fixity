import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

// Single-tab flow using the top-right portal switch. Requires `npm run dev` on port 5173.
const BASE = 'http://localhost:5173'
const SHOTS = fileURLToPath(new URL('../.demo-shots', import.meta.url))
mkdirSync(SHOTS, { recursive: true })
const results = []
const check = (name, ok, detail = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))

await page.goto(BASE + '/resident', { waitUntil: 'networkidle' })
const sw = page.locator('.cl-portal-switch')
check('Switch shows Resident as active', (await sw.getByRole('tab', { name: 'Resident' }).getAttribute('aria-selected')) === 'true')
const box = await sw.boundingBox()
check('Switch sits at top right', box && box.x + box.width > 1380 && box.y < 60, box && `x=${Math.round(box.x)} y=${Math.round(box.y)}`)
await page.screenshot({ path: `${SHOTS}/switch-resident.png`, clip: { x: 700, y: 0, width: 740, height: 100 } })

await page.getByRole('button', { name: 'Report an Issue' }).click()
await page.getByText('A single spot').click()
await page.mouse.click(1000, 300)
await page.getByPlaceholder('Traffic signal not working').fill('Traffic light not working')
await page.getByPlaceholder(/The traffic light at this intersection/).fill('The signal stopped working.')
await page.getByRole('button', { name: 'Submit Report' }).click()
await page.getByText('Priority classification complete.').waitFor({ timeout: 6000 })
await page.getByRole('button', { name: 'View on Map' }).click()

await sw.getByRole('tab', { name: 'Leadership' }).click()
await page.waitForURL('**/leadership')
await page.waitForTimeout(800)
check('Switched to /leadership in the same tab', page.url().endsWith('/leadership'))
const body = await page.locator('body').innerText()
check('Leadership shows the critical alert after switching', body.includes('Critical Issue Detected') && body.includes('Traffic light not working'))
check('Leadership metrics include the new report', (await page.locator('.cl-gauge').nth(1).innerText()).startsWith('1'))
await page.screenshot({ path: `${SHOTS}/switch-leadership.png` })

await page.locator('.cl-portal-switch').getByRole('tab', { name: 'Resident' }).click()
await page.waitForURL('**/resident')
await page.waitForTimeout(600)
check('Switched back to /resident', page.url().endsWith('/resident'))
check('Alert not replayed on resident side', !(await page.locator('body').innerText()).includes('Critical Issue Detected'))
await page.locator('.cl-portal-switch').getByRole('tab', { name: 'Leadership' }).click()
await page.waitForTimeout(600)
check('Alert not replayed when flipping again', (await page.locator('.cl-toast').count()) <= 1)

check('No page errors', errors.length === 0, errors.join(' | '))
console.log(results.join('\n'))
await browser.close()
