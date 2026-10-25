import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

// LENS urgency ranking + action plans across tabs. Requires `npm run dev` on port 5173.
const BASE = 'http://localhost:5173'
const SHOTS = fileURLToPath(new URL('../.demo-shots', import.meta.url))
mkdirSync(SHOTS, { recursive: true })
const results = []
const check = (name, ok, detail = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const errors = []
const resident = await context.newPage()
const leader = await context.newPage()
const leader2 = await context.newPage()
for (const p of [resident, leader, leader2]) p.on('pageerror', (e) => errors.push(e.message))

await resident.goto(BASE + '/resident', { waitUntil: 'networkidle' })
await leader.goto(BASE + '/leadership', { waitUntil: 'networkidle' })
await leader2.goto(BASE + '/leadership', { waitUntil: 'networkidle' })

async function openRanking() {
  await leader.getByRole('button', { name: /Urgency Ranking/ }).click()
  await leader.locator('.cl-rank-row').first().waitFor({ timeout: 5000 })
}
const topRow = () => leader.locator('.cl-rank-row').first().innerText()
const sheetText = () => leader.locator('.cl-sheet').last().innerText()

await openRanking()
const seedTop = await topRow()
check('Ranking shows explainable factors', /\+\d+/.test(seedTop) && seedTop.includes('Confidence'), seedTop.split('\n').slice(0, 4).join(' | '))
check('Seed #1 is the long-unacknowledged pothole, not just the highest label', seedTop.includes('Large pothole on Yosemite Ave'))
await leader.keyboard.press('Escape')

async function report(x, y, title, desc) {
  await resident.getByRole('button', { name: 'Report an Issue' }).click()
  await resident.getByText('A single spot').click()
  await resident.mouse.click(x, y)
  await resident.getByPlaceholder('Traffic signal not working').fill(title)
  await resident.getByPlaceholder(/The traffic light at this intersection/).fill(desc)
  await resident.getByRole('button', { name: 'Submit Report' }).click()
  await resident.getByText('Priority classification complete.').waitFor({ timeout: 6000 })
  await resident.getByRole('button', { name: 'View on Map' }).click()
  await resident.waitForTimeout(900)
}

await report(1000, 300, 'Traffic light not working', 'The traffic signal stopped working and drivers are confused at the intersection.')
await openRanking()
const t1 = await topRow()
const score1 = Number(t1.match(/\n(\d+)\n/)?.[1] ?? t1.match(/#1\s*(\d+)/)?.[1])
check('New broken signal jumps to #1', t1.includes('Traffic light not working'))
check('Broken signal is tiered Act now', t1.toUpperCase().includes('ACT NOW'))
await leader.screenshot({ path: `${SHOTS}/urgency-ranking.png` })
await leader.keyboard.press('Escape')

await resident.getByRole('button', { name: /Alex Rivera/ }).click()
await resident.getByRole('button', { name: 'Jordan Patel' }).click()
await report(700, 470, 'Stoplight broken', 'The stoplight here is broken near the crosswalk.')
await openRanking()
const t2 = await topRow()
const score2 = Number(t2.match(/\n(\d+)\n/)?.[1])
check('Second report raises the urgency score', score2 > score1, `${score1} → ${score2}`)
check('Corroboration factor shown', t2.includes('2 independent reports'))

// Action plan from the ranking
await leader.locator('.cl-rank-row').first().getByRole('button', { name: 'Action Plan' }).click()
await leader.getByText('Sequencing the steps…').waitFor({ timeout: 4000 })
await leader.locator('.cl-plan-step').first().waitFor({ timeout: 5000 })
let plan = await sheetText()
check('Plan drafting animation shown', true)
check('Plan has three phases', /RESPOND/i.test(plan) && /FIX/i.test(plan) && /CLOSE THE LOOP/i.test(plan))
check('Signal-specific playbook steps', plan.includes('Verify the signal on site') && plan.includes('Arrange temporary traffic control'))
check('Plan assigns Traffic Operations', plan.includes('Assign to Traffic Operations'))
check('Plan adapts: residents to answer', plan.includes('2 residents reported this'))
await leader.screenshot({ path: `${SHOTS}/action-plan.png` })
const progress0 = plan.match(/(\d+) \/ (\d+) steps/)

await leader.getByRole('button', { name: 'Acknowledge now' }).click()
await leader.getByRole('button', { name: 'Assign now' }).click()
await leader.waitForTimeout(400)
plan = await sheetText()
const progress1 = plan.match(/(\d+) \/ (\d+) steps/)
check('"Do it" buttons perform the real actions', Number(progress1[1]) === Number(progress0[1]) + 2, `${progress0[0]} → ${progress1[0]}`)
check('Issue status now Acknowledged', plan.includes('Acknowledged'))

await leader.getByRole('button', { name: 'Mark "Verify the signal on site" done' }).click()
await leader.waitForTimeout(500)
check('Manual step checks off', (await sheetText()).match(/(\d+) \/ \d+ steps/)[1] === String(Number(progress1[1]) + 1))

// Second leadership tab sees the same plan progress
await leader2.getByRole('button', { name: /Urgency Ranking/ }).click()
await leader2.locator('.cl-rank-row').first().getByRole('button', { name: 'Action Plan' }).click()
await leader2.locator('.cl-plan-step').first().waitFor({ timeout: 5000 })
const plan2 = await leader2.locator('.cl-sheet').last().innerText()
check('Plan progress syncs to another tab', plan2.includes(`${Number(progress1[1]) + 1} / ${progress1[2]} steps`), plan2.match(/\d+ \/ \d+ steps/)?.[0])

// Draft the update → prefilled publish → resident sees it
await leader.getByRole('button', { name: 'Draft the update' }).click()
const draftTitle = await leader.getByPlaceholder('Traffic Signal Repair Underway').inputValue()
check('Publish panel prefilled by the plan', draftTitle.includes('Traffic Signal Malfunction'), draftTitle)
await leader.getByRole('button', { name: 'Publish Update' }).click()
await resident.waitForTimeout(700)
check('Resident receives the plan-drafted update', (await resident.locator('.cl-dock-right').innerText()).includes('Traffic Signal Malfunction — City Response'))

await leader.keyboard.press('Escape')
await leader.waitForTimeout(400)
check('Escape closes only the plan, ranking stays open', (await leader.locator('.cl-sheet').count()) === 1 && (await leader.locator('.cl-rank-row').count()) > 0)
const t3 = await topRow()
check('Working on it lowers urgency (crew assigned)', !t3.includes('Traffic light not working') || Number(t3.match(/\n(\d+)\n/)?.[1]) < score2)

check('No page errors', errors.length === 0, errors.join(' | '))
console.log(results.join('\n'))
await browser.close()
