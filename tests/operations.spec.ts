import { existsSync } from 'node:fs'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  anchorPathSpec,
  buildPnpmArgs,
  isInstallSpec,
  OperationProgressTracker,
  PluginOperationService,
  pnpmStoreHint,
  reconcileBundles,
  resolvePnpmBinScript,
  resolvePnpmBins,
} from '../src/operations.js'

const tempDirs: string[] = []
afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})
async function tempProfile(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'dpm-test-'))
  tempDirs.push(dir)
  await mkdir(join(dir, 'node_modules'), { recursive: true })
  return dir
}

describe('plugin operation service', () => {
  it('accepts only bounded package, GitHub, and local tarball specs', () => {
    expect(isInstallSpec('@scope/plugin@1.2.3')).toBe(true)
    expect(isInstallSpec('https://github.com/owner/repo.git#main')).toBe(true)
    expect(isInstallSpec('D:\\plugins\\demo.tgz')).toBe(true)
    expect(isInstallSpec('D:\\plugins\\bad name.tgz')).toBe(false)
    expect(isInstallSpec('demo & whoami')).toBe(false)
  })

  it('runs the exact standard DSH plugin action', async () => {
    const runner = vi.fn(async () => ({ exitCode: 0, output: 'done' }))
    const service = new PluginOperationService(
      runner,
      async () => new Set(['demo-plugin']),
      'web',
    )

    const result = await service.run({ action: 'update', target: 'demo-plugin' })
    expect(runner).toHaveBeenCalledWith('update', 'demo-plugin')
    expect(result).toMatchObject({
      success: true,
      command: 'dsh plugin --profile web update demo-plugin',
      restartRequired: true,
    })
  })

  it('builds pnpm args with --latest for updates', () => {
    // 精确版本声明的插件在裸 pnpm update 下不会升级，必须带 --latest
    expect(buildPnpmArgs('update', 'demo-plugin', 'C:\\workspace'))
      .toEqual(['update', '--latest', 'demo-plugin'])
    expect(buildPnpmArgs('add', './a.tgz', 'C:\\workspace'))
      .toEqual(['add', 'C:\\workspace\\a.tgz'])
    expect(buildPnpmArgs('remove', 'demo-plugin', 'C:\\workspace'))
      .toEqual(['remove', 'demo-plugin'])
  })

  it('does not request a restart when pnpm reports no actual change', async () => {
    const runner = vi.fn(async () => ({
      exitCode: 0,
      output: 'Already up to date\nDone in 1.2s',
    }))
    const service = new PluginOperationService(
      runner,
      async () => new Set(['demo-plugin']),
      'web',
    )

    const result = await service.run({ action: 'update', target: 'demo-plugin' })
    expect(result.success).toBe(true)
    expect(result.restartRequired).toBe(false)
  })

  it('requests a restart only when pnpm applied changes', async () => {
    const runner = vi.fn(async () => ({
      exitCode: 0,
      output: 'Packages: +1\nProgress: resolved 19, downloaded 1, added 1, done',
    }))
    const service = new PluginOperationService(
      runner,
      async () => new Set(['demo-plugin']),
      'web',
    )

    const result = await service.run({ action: 'update', target: 'demo-plugin' })
    expect(result.success).toBe(true)
    expect(result.restartRequired).toBe(true)
  })

  it('protects the running manager and rejects missing dependencies', async () => {
    const service = new PluginOperationService(
      async () => ({ exitCode: 0, output: '' }),
      async () => new Set(['dsh-plugin-manager']),
      'web',
    )

    await expect(service.run({
      action: 'remove',
      target: 'dsh-plugin-manager',
    })).rejects.toMatchObject({ code: 'manager_protected' })

    await expect(service.run({
      action: 'update',
      target: 'missing-plugin',
    })).rejects.toMatchObject({ code: 'not_installed' })
  })

  it('serializes mutating operations', async () => {
    let release: (() => void) | undefined
    const runner = vi.fn(() => new Promise<{ exitCode: number; output: string }>(resolve => {
      release = () => resolve({ exitCode: 0, output: '' })
    }))
    const service = new PluginOperationService(
      runner,
      async () => new Set(['demo-plugin']),
      'web',
    )

    const first = service.run({ action: 'update', target: 'demo-plugin' })
    await expect(service.run({
      action: 'remove',
      target: 'demo-plugin',
    })).rejects.toMatchObject({ code: 'busy' })
    release?.()
    await first
  })

  it('prefers the profile and manager pnpm bins over the ambient PATH', () => {
    const bins = resolvePnpmBins(process.cwd())
    expect(bins.length).toBeGreaterThan(0)
    // 每个候选都必须是真实存在的 .bin 目录，且包含 pnpm 入口
    for (const bin of bins) {
      expect(bin.endsWith('.bin')).toBe(true)
      expect(existsSync(join(bin, 'pnpm.cmd')) || existsSync(join(bin, 'pnpm'))).toBe(true)
    }
  })

  it('resolves the pnpm bin script for hidden direct execution', () => {
    const script = resolvePnpmBinScript(resolvePnpmBins(process.cwd()))
    expect(script).not.toBeNull()
    expect(script?.endsWith('pnpm.cjs')).toBe(true)
    expect(existsSync(script ?? '')).toBe(true)
  })

  it('renders a remediation hint for pnpm store mismatches', () => {
    const hint = pnpmStoreHint(process.cwd())
    expect(hint).toContain('pnpm 版本与 Profile 不匹配')
    expect(hint).toContain('pnpm 10.34.5')
    expect(hint).toContain(process.cwd())
  })

  it('anchors relative install specs to the invoking directory', () => {
    const cwd = 'C:\\workspace\\demo'
    expect(anchorPathSpec('.', cwd)).toBe('C:\\workspace\\demo')
    expect(anchorPathSpec('../plugin', cwd)).toBe('C:\\workspace\\plugin')
    expect(anchorPathSpec('file:./a.tgz', cwd)).toBe('file:C:\\workspace\\demo\\a.tgz')
    expect(anchorPathSpec('D:\\plugins\\demo.tgz', cwd)).toBe('D:\\plugins\\demo.tgz')
    expect(anchorPathSpec('github:owner/repo#main', cwd)).toBe('github:owner/repo#main')
    expect(anchorPathSpec('@scope/plugin@1.2.3', cwd)).toBe('@scope/plugin@1.2.3')
  })

  it('reconciles profile bundles against the installed state', async () => {
    const dir = await tempProfile()
    await writeFile(join(dir, 'package.json'), JSON.stringify({
      name: 'dsh-profile-test',
      dependencies: {
        'a-bundle': '1.0.0',
        'b-plain': '1.0.0',
      },
      dsh: { profile: { bundles: ['in-box-base', 'a-bundle', 'c-removed'] } },
    }, null, 2), 'utf8')
    await mkdir(join(dir, 'node_modules', 'a-bundle'), { recursive: true })
    await writeFile(join(dir, 'node_modules', 'a-bundle', 'package.json'), JSON.stringify({
      name: 'a-bundle',
      dsh: { bundle: { patch: './cordis.patch.yml' } },
    }), 'utf8')
    await mkdir(join(dir, 'node_modules', 'b-plain'), { recursive: true })
    await writeFile(join(dir, 'node_modules', 'b-plain', 'package.json'), JSON.stringify({
      name: 'b-plain',
    }), 'utf8')

    // beforeDeps = pnpm 运行前：a-bundle 与 c-removed 都曾是依赖，c-removed 已被移除
    await reconcileBundles(dir, new Set(['a-bundle', 'c-removed']))

    const manifest = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
    expect(manifest.dsh.profile.bundles).toEqual(['in-box-base', 'a-bundle'])
  })

  it('tracks operation output for the progress endpoint', async () => {
    const tracker = new OperationProgressTracker()
    const idle = tracker.snapshot()
    expect(idle.running).toBe(false)
    expect(idle.output).toBe('')

    tracker.start('update', 'demo-plugin')
    expect(tracker.snapshot()).toMatchObject({
      running: true,
      action: 'update',
      target: 'demo-plugin',
    })
    tracker.append('Progress: resolved 19, downloaded 2')
    tracker.append('\nProgress: resolved 19, downloaded 2, added 1, done')
    const running = tracker.snapshot()
    expect(running.output).toContain('added 1, done')
    expect(running.finishedAt).toBeNull()

    tracker.finish()
    const done = tracker.snapshot()
    expect(done.running).toBe(false)
    expect(done.finishedAt).not.toBeNull()
    // finish 后不再追加
    tracker.append('late output')
    expect(tracker.snapshot().output).not.toContain('late output')
  })

  it('exposes a bounded progress snapshot from the service', async () => {
    const tracker = new OperationProgressTracker()
    const service = new PluginOperationService(
      vi.fn(async () => ({ exitCode: 0, output: 'done' })),
      async () => new Set(['demo-plugin']),
      'web',
      tracker,
    )
    const run = service.run({ action: 'update', target: 'demo-plugin' })
    expect(service.progressSnapshot().running).toBe(true)
    await run
    expect(service.progressSnapshot().running).toBe(false)
  })
})
