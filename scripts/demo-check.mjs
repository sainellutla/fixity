import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

// Runs the full judging-demo script across two tabs. Requires `npm run dev` on port 5173.
const BASE = 'http://localhost:5173'
const SHOTS = fileURLToPath(new URL('../.demo-shots', import.meta.url))
mkdirSync(SHOTS, { recursive: true })
const results = []
function check(name, ok, detail = '') {
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const errors = []

const resident = await context.newPage()
const leader = await context.newPage()
for (const [name, p] of [['resident', resident], ['leader', leader]]) {
  p.on('pageerror', (e) => errors.push(`${name}: ${e.message}`))
  p.on('dialog', (d) => { errors.push(`${name}: DIALOG FIRED (${d.message()})`); d.dismiss() })
}

await resident.goto(BASE + '/resident', { waitUntil: 'networkidle' })
await leader.goto(BASE + '/leadership', { waitUntil: 'networkidle' })
await resident.waitForTimeout(800)

const leaderText = () => leader.locator('body').innerText()
const activeBefore = await leader.locator('.cl-gauge').first().innerText()
check('Seed: 3 active issues on leadership', activeBefore.startsWith('3'), activeBefore.replace(/\n/g, ' '))

// Scene 2 — resident reports a broken traffic signal
await resident.getByRole('button', { name: 'Report an Issue' }).click()
await resident.getByText('A single spot').click()
await resident.mouse.click(1000, 300)
await resident.getByPlaceholder('Traffic signal not working').fill('Traffic light not working')
await resident.getByPlaceholder(/The traffic light at this intersection/).fill('The traffic signal has completely stopped functioning. Drivers are confused about who should go first.')
await resident.getByRole('button', { name: 'Submit Report' }).click()
await resident.getByText('Your voice has been heard.').waitFor({ timeout: 3000 })
check('Confirmation animation shows', true)
await resident.getByText('Priority classification complete.').waitFor({ timeout: 5000 })
const residentSheet = await resident.locator('.cl-sheet').innerText()
check('Traffic signal classified Critical', residentSheet.includes('Critical') && residentSheet.includes('Traffic Signal Malfunction'))
check('AI output labeled as demo', residentSheet.toUpperCase().includes('DEMO AI ANALYSIS'))
await resident.getByRole('button', { name: 'View on Map' }).click()
await resident.waitForTimeout(900)

// Scene 3 — leadership sees it without refresh
await leader.waitForTimeout(500)
const lt = await leaderText()
check('Leadership toast without refresh', lt.includes('Critical Issue Detected') && lt.includes('Traffic light not working') && lt.includes('Priority: Critical'))
check('New marker pulses on leadership map', (await leader.locator('.cl-pin.is-new').count()) === 1)
const criticalCard = await leader.locator('.cl-gauge').nth(1).innerText()
check('Critical metric updated to 1', criticalCard.startsWith('1'), criticalCard.replace(/\n/g, ' '))
await leader.screenshot({ path: `${SHOTS}/e2e-leader-toast.png` })

// Scene 4 — a second resident confirms it nearby
await resident.getByRole('button', { name: /Alex Rivera/ }).click()
await resident.getByRole('button', { name: 'Jordan Patel' }).click()
await resident.getByRole('button', { name: 'Report an Issue' }).click()
await resident.getByText('A single spot').click()
await resident.mouse.click(700, 470) // map has flown to the new issue (centered), click ~30-60m away
await resident.getByPlaceholder('Traffic signal not working').fill('Stoplight broken')
await resident.getByPlaceholder(/The traffic light at this intersection/).fill('The stoplight here is broken. Cars are having trouble crossing safely.')
await resident.getByRole('button', { name: 'Submit Report' }).click()
await resident.getByText('Priority classification complete.').waitFor({ timeout: 5000 })
const sheet2 = await resident.locator('.cl-sheet').innerText()
check('Second report grouped into existing issue', sheet2.includes('grouped with an existing'))
await resident.getByRole('button', { name: 'View on Map' }).click()
await resident.waitForTimeout(800)

// Leadership opens the issue via the toast
await leader.waitForTimeout(400)
const reviewBtn = leader.getByRole('button', { name: 'Review Issue' }).last()
await reviewBtn.click()
await leader.waitForTimeout(900)
const drawer = await leader.locator('.cl-dock-right').innerText()
check('Leadership drawer shows 2 reports', drawer.includes('2 reports'))
check('Both resident descriptions visible', drawer.includes('completely stopped functioning') && drawer.includes('stoplight here is broken'))
check('Consensus summary present', drawer.includes('independent resident report'))
check('Report attributed to Jordan Patel', drawer.includes('Jordan Patel'))

// Scene 5 — AI intelligence report
await leader.getByRole('button', { name: 'AI Intelligence' }).click()
await leader.getByRole('button', { name: 'Generate City Intelligence Report' }).click()
await leader.getByText('Finding 1:').waitFor({ timeout: 6000 })
const report = await leader.locator('.cl-sheet').innerText()
check('Intelligence report leads with traffic signal', /Finding 1: Traffic light not working/.test(report), report.split('\n').find((l) => l.startsWith('Finding 1')))
check('Report references both reports', /2 reports/i.test(report))
check('Report suggests Traffic Operations', report.includes('Traffic Operations'))
await leader.screenshot({ path: `${SHOTS}/e2e-leader-ai.png` })
await leader.getByRole('button', { name: 'Open referenced issue' }).first().click()
await leader.waitForTimeout(700)

// Scene 6 — leadership responds
await leader.getByRole('button', { name: 'Mark In Progress' }).click()
await leader.getByRole('button', { name: 'Publish Official Update' }).click()
await leader.getByPlaceholder('Traffic Signal Repair Underway').fill('Traffic Signal Repair Underway')
await leader.locator('.cl-sheet textarea').fill('We are aware of the malfunctioning traffic signal. A maintenance response has been initiated in this demonstration. We expect to provide an update within two hours.')
await leader.getByPlaceholder('2 hours').fill('2 hours')
await leader.getByRole('button', { name: 'Publish Update' }).click()
await leader.waitForTimeout(600)

// Scene 7 — resident sees it live and asks a question
await resident.waitForTimeout(600)
const rdrawer = await resident.locator('.cl-dock-right').innerText()
check('Resident sees In Progress live', rdrawer.includes('In Progress'))
check('Resident sees official update', rdrawer.includes('Traffic Signal Repair Underway') && rdrawer.includes('Estimated resolution: 2 hours'))
const rToast = await resident.locator('body').innerText()
check('Resident notified of update', rToast.includes('Your Report Has Been Updated'))
await resident.screenshot({ path: `${SHOTS}/e2e-resident-update.png` })

await resident.getByPlaceholder(/Ask a question as/).fill('<script>alert(1)</script> Will the intersection be safe to use while the repair is happening?')
await resident.getByPlaceholder(/Ask a question as/).press('Enter')
await leader.waitForTimeout(700)
const ldrawer2 = await leader.locator('.cl-dock-right').innerText()
check('Leadership sees resident question live', ldrawer2.includes('Will the intersection be safe'))
check('Script tag rendered as text, not executed', ldrawer2.includes('<script>alert(1)</script>'))
await leader.getByPlaceholder(/Reply as official/).fill('Temporary traffic control may be required during maintenance.')
await leader.getByPlaceholder(/Reply as official/).press('Enter')
await resident.waitForTimeout(700)
const rdrawer2 = await resident.locator('.cl-dock-right').innerText()
check('Resident sees official reply', rdrawer2.includes('Temporary traffic control'))
check('Reply carries Official City Response badge', rdrawer2.toUpperCase().includes('OFFICIAL CITY RESPONSE'))

// Community verification
await leader.getByRole('button', { name: 'Mark Resolved' }).click()
await resident.getByText('Has this problem actually been resolved?').waitFor({ timeout: 3000 })
check('Resident sees verification prompt after resolve', true)
await resident.getByRole('button', { name: 'No, still there' }).click()
await resident.getByPlaceholder('What did you notice?').fill('The signal is still flashing red.')
await resident.getByRole('button', { name: 'Submit Follow-up' }).click()
await leader.waitForTimeout(700)
const ldrawer3 = await leader.locator('.cl-dock-right').innerText()
check('Leadership sees follow-up request', ldrawer3.includes('Resident requested follow-up.'))
await leader.getByRole('button', { name: 'Reopen Issue' }).click()
await resident.waitForTimeout(700)
check('Resident sees Reopened status', (await resident.locator('.cl-dock-right').innerText()).includes('Reopened'))

// Persistence after refresh
await leader.reload({ waitUntil: 'networkidle' })
await leader.waitForTimeout(800)
const afterReload = await leader.locator('.cl-gauge').nth(2).innerText()
check('Reports persist after refresh (6 total)', afterReload.startsWith('6'), afterReload.replace(/\n/g, ' '))

// Demo reset
await resident.getByRole('button', { name: 'Demo Settings' }).click()
await resident.getByRole('button', { name: 'Demo Reset' }).click()
await resident.getByRole('button', { name: 'Confirm Reset' }).click()
await leader.waitForTimeout(1200)
const afterReset = await leader.locator('.cl-gauge').nth(2).innerText()
const lt3 = await leaderText()
check('Demo reset syncs to leadership (4 reports)', afterReset.startsWith('4'), afterReset.replace(/\n/g, ' '))
check('Traffic signal issue removed by reset', !(await leader.locator('.cl-dock-right').count()) || !lt3.includes('Traffic light not working'))

check('No page errors or alert dialogs', errors.length === 0, errors.join(' | '))

console.log(results.join('\n'))
await browser.close()
