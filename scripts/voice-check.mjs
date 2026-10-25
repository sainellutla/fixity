import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

// Checks the simulated voice-reporting flow across two tabs. Requires `npm run dev` on port 5173.
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
for (const p of [resident, leader]) p.on('pageerror', (e) => errors.push(e.message))

await resident.goto(BASE + '/resident', { waitUntil: 'networkidle' })
await leader.goto(BASE + '/leadership', { waitUntil: 'networkidle' })

async function openSpeak(x, y) {
  await resident.getByRole('button', { name: 'Report an Issue' }).click()
  await resident.getByText('A single spot').click()
  await resident.mouse.click(x, y)
  await resident.getByRole('tab', { name: /Speak it/ }).click()
}

// Spanish traffic light, spoken
await openSpeak(1000, 300)
await resident.getByRole('button', { name: 'Español' }).click()
await resident.getByRole('button', { name: /Semáforo/ }).click()
check('Mic label localized to Spanish', (await resident.locator('.cl-sheet').innerText()).includes('Toca para hablar'))
await resident.getByRole('button', { name: 'Toca para hablar' }).click()
await resident.waitForTimeout(2200)
const partial = (await resident.locator('.cl-transcript').innerText()).trim().split(/\s+/).length
const total = 'El semáforo de esta intersección no funciona. Los carros no saben cuándo pasar y es muy peligroso.'.split(/\s+/).length
check('Transcript appears word by word', partial > 1 && partial < total, `${partial}/${total} words after 2.2s`)
check('Listening state shown', (await resident.locator('.cl-sheet').innerText()).includes('Escuchando'))
await resident.screenshot({ path: `${SHOTS}/voice-listening.png` })
await resident.getByText('¡Listo!').waitFor({ timeout: 30000 })
const sheet = await resident.locator('.cl-sheet').innerText()
check('Full Spanish transcript shown', sheet.includes('Los carros no saben cuándo pasar y es muy peligroso.'))
check('English translation shown for city staff', sheet.includes('The traffic light at this intersection is not working.'))
check('Title auto-filled in English', (await resident.getByPlaceholder('Traffic signal not working').inputValue()) === 'Traffic light not working')
await resident.screenshot({ path: `${SHOTS}/voice-done.png` })
await resident.getByRole('button', { name: 'Submit Report' }).click()
await resident.getByText('Priority classification complete.').waitFor({ timeout: 6000 })
check('Spoken report classified Critical', (await resident.locator('.cl-sheet').innerText()).includes('Critical'))
await resident.getByRole('button', { name: 'View on Map' }).click()
await resident.waitForTimeout(900)
check('Resident drawer shows original Spanish', (await resident.locator('.cl-dock-right').innerText()).includes('El semáforo de esta intersección no funciona.'))

await leader.waitForTimeout(500)
check('Leadership alert says reported by voice in Spanish', (await leader.locator('body').innerText()).includes('reported by voice in Spanish'))
await leader.getByRole('button', { name: 'Review Issue' }).last().click()
await leader.waitForTimeout(900)
const ld = await leader.locator('.cl-dock-right').innerText()
check('Leadership drawer tags spoken language', ld.includes('Spoken in Spanish'))
check('Leadership sees original + translation', ld.includes('El semáforo de esta intersección') && ld.includes('The traffic light at this intersection is not working.'))
await leader.screenshot({ path: `${SHOTS}/voice-leader.png` })

// A typed English report at the same spot groups with the spoken one
await resident.getByRole('button', { name: /Alex Rivera/ }).click()
await resident.getByRole('button', { name: 'Jordan Patel' }).click()
await resident.getByRole('button', { name: 'Report an Issue' }).click()
await resident.getByText('A single spot').click()
await resident.mouse.click(700, 470)
await resident.getByPlaceholder('Traffic signal not working').fill('Stoplight broken')
await resident.getByPlaceholder(/The traffic light at this intersection/).fill('The stoplight here is broken.')
await resident.getByRole('button', { name: 'Submit Report' }).click()
await resident.getByText('Priority classification complete.').waitFor({ timeout: 6000 })
check('English report groups with the Spanish one', (await resident.locator('.cl-sheet').innerText()).includes('grouped with an existing'))
await resident.getByRole('button', { name: 'View on Map' }).click()

// Punjabi renders
await openSpeak(1000, 700)
await resident.getByRole('button', { name: 'ਪੰਜਾਬੀ' }).click()
await resident.getByRole('button', { name: /ਸੜਕ ਵਿੱਚ ਟੋਆ/ }).click()
await resident.getByRole('button', { name: 'Fast' }).click()
await resident.getByRole('button', { name: 'ਬੋਲਣ ਲਈ ਦਬਾਓ' }).click()
await resident.getByText('ਹੋ ਗਿਆ!').waitFor({ timeout: 30000 })
const pa = await resident.locator('.cl-sheet').innerText()
check('Punjabi transcript + translation', pa.includes('ਸੜਕ ਵਿੱਚ ਇੱਕ ਵੱਡਾ ਟੋਆ ਹੈ।') && pa.includes('There is a large pothole in the road.'))
await resident.screenshot({ path: `${SHOTS}/voice-punjabi.png` })

check('No page errors', errors.length === 0, errors.join(' | '))
console.log(results.join('\n'))
await browser.close()
