import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '../screenshots')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

async function shot(url, name) {
  await page.goto(url, { waitUntil: 'networkidle' })
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log(`✅ ${name} → ${file}`)
}

import { mkdirSync } from 'fs'
mkdirSync(OUT, { recursive: true })

const BASE = 'http://localhost:3000'

await shot(`${BASE}/`, '01_home')
await shot(`${BASE}/teacher/dashboard`, '02_teacher_dashboard_login')
await shot(`${BASE}/teacher/assignments/new`, '03_new_assignment')
await shot(`${BASE}/plan/invalid-token`, '04_plan_invalid_token')

await browser.close()
console.log('\n모든 스크린샷 완료')
