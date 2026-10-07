// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const SCRIPT = resolve(__dirname, '../../scripts/scan-report-for-secret.py')
const SECRET = 'scan-test-secret-value'

// Playwright's HTML report keeps its data in a base64 zip inside index.html, so a plain grep of
// the report folder does not see it. This is the shape a real leak took: the bypass token sat in
// a step `error` inside that zip while the folder looked clean.
function makeZip(members: Record<string, string>): Buffer {
  const py =
    'import sys,io,json,zipfile\n' +
    'b=io.BytesIO()\nz=zipfile.ZipFile(b,"w")\n' +
    '[z.writestr(k,v) for k,v in json.loads(sys.argv[1]).items()]\n' +
    'z.close()\nsys.stdout.buffer.write(b.getvalue())\n'
  return execFileSync('python3', ['-I', '-c', py, JSON.stringify(members)])
}

function writeReport(dir: string, members: Record<string, string>) {
  mkdirSync(dir, { recursive: true })
  const b64 = makeZip(members).toString('base64')
  writeFileSync(
    join(dir, 'index.html'),
    `<html><body><script id="playwrightReportBase64" type="application/zip">data:application/zip;base64,${b64}</script></body></html>`,
  )
}

function scan(dirs: string[], env: Record<string, string> = { SCAN_SECRET: SECRET }) {
  return spawnSync('python3', ['-I', SCRIPT, ...dirs], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH ?? '', ...env },
  })
}

describe('scripts/scan-report-for-secret.py', () => {
  let root: string
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'scan-report-'))
  })
  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('passes a clean report', () => {
    writeReport(join(root, 'report'), { 'a.json': '{"error":"timeout"}' })
    const result = scan([join(root, 'report')])
    expect(result.status).toBe(0)
  })

  it('fails when the secret is inside the report\'s embedded zip, and does not print it', () => {
    writeReport(join(root, 'report'), {
      'a.json': `{"steps":[{"title":"GET","error":"Call log: - x-pantheon-bot-bypass: ${SECRET}"}]}`,
    })
    const result = scan([join(root, 'report')])
    expect(result.status).toBe(1)
    expect(result.stdout + result.stderr).toMatch(/embedded/i)
    expect(result.stdout + result.stderr).not.toContain(SECRET)
  })

  it('fails when the secret is in a plain file', () => {
    mkdirSync(join(root, 'results'))
    writeFileSync(join(root, 'results', 'junit.xml'), `<failure>${SECRET}</failure>`)
    const result = scan([join(root, 'results')])
    expect(result.status).toBe(1)
    expect(result.stdout + result.stderr).toContain('junit.xml')
    expect(result.stdout + result.stderr).not.toContain(SECRET)
  })

  it('fails when the secret is inside a standalone zip (a trace)', () => {
    mkdirSync(join(root, 'results'))
    writeFileSync(join(root, 'results', 'trace.zip'), makeZip({ '0-trace.network': `x-pantheon-bot-bypass ${SECRET}` }))
    const result = scan([join(root, 'results')])
    expect(result.status).toBe(1)
    expect(result.stdout + result.stderr).toContain('trace.zip')
  })

  // If a Playwright upgrade changes how the report embeds its data, the pattern that finds it
  // stops matching. Calling that report clean would defeat the scan, so it counts as a hit.
  it('fails closed when report data is present but in a shape it cannot read', () => {
    mkdirSync(join(root, 'report'))
    writeFileSync(
      join(root, 'report', 'index.html'),
      '<script id="playwrightReportBase64" type="application/zip">some-future-encoding:abc123</script>',
    )
    const result = scan([join(root, 'report')])
    expect(result.status).toBe(1)
    expect(result.stdout + result.stderr).toMatch(/cannot be verified|could not be read/i)
  })

  it('scans every directory it is given and ignores ones that do not exist', () => {
    writeReport(join(root, 'report'), { 'a.json': '{}' })
    mkdirSync(join(root, 'results'))
    writeFileSync(join(root, 'results', 'x.txt'), SECRET)
    expect(scan([join(root, 'report'), join(root, 'missing'), join(root, 'results')]).status).toBe(1)
    expect(scan([join(root, 'report'), join(root, 'missing')]).status).toBe(0)
  })

  // An empty needle matches everything and a missing one would call every report clean, so
  // either is a hard error rather than a pass.
  it.each([
    ['unset', {}],
    ['empty', { SCAN_SECRET: '' }],
  ])('refuses to run when the secret is %s', (_label, env) => {
    writeReport(join(root, 'report'), { 'a.json': '{}' })
    const result = scan([join(root, 'report')], env)
    expect(result.status).toBe(2)
  })
})
