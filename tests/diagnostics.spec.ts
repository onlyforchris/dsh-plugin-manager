import { afterEach, describe, expect, it } from 'vitest'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createDiagnosticReport } from '../src/diagnostics.js'
import { PACKAGE_NAME } from '../src/shared.js'

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

async function healthyHome(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'dsh-plugin-manager-'))
  roots.push(root)
  const profile = join(root, 'profiles', 'web')
  await mkdir(profile, { recursive: true })
  await writeFile(join(profile, 'package.json'), JSON.stringify({
    dependencies: { [PACKAGE_NAME]: '0.1.0' },
    dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', PACKAGE_NAME] } },
  }))
  await writeFile(join(profile, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n')
  return root
}

describe('createDiagnosticReport', () => {
  it('reports a healthy standard CLI installation', async () => {
    const dshHome = await healthyHome()
    const report = await createDiagnosticReport({
      dshHome,
      profileName: 'web',
      nodeVersion: '22.19.0',
      platform: 'win32',
      arch: 'x64',
      webServer: { host: '127.0.0.1', port: 3080 },
      loaderEntries: [{ id: 'plugin-manager', options: { name: PACKAGE_NAME } }],
    })

    expect(report.summary.fail).toBe(0)
    expect(report.summary.warning).toBe(0)
    expect(report.checks.every(item => item.status === 'pass')).toBe(true)
  })

  it('warns about duplicate Loader modules without exposing local paths', async () => {
    const dshHome = await healthyHome()
    const report = await createDiagnosticReport({
      dshHome,
      profileName: 'web',
      nodeVersion: '24.1.0',
      platform: 'win32',
      arch: 'x64',
      webServer: { host: '0.0.0.0', port: 3080 },
      loaderEntries: [
        { id: 'plugin-manager-a', options: { name: PACKAGE_NAME } },
        { id: 'plugin-manager-b', options: { name: PACKAGE_NAME } },
      ],
    })

    expect(report.checks.find(item => item.id === 'manager-loader-entry')?.status).toBe('warning')
    expect(JSON.stringify(report)).not.toContain(dshHome)
  })
})
