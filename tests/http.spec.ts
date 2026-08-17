import type { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'
import { describe, expect, it } from 'vitest'
import {
  createDiagnosticsHandler,
  createInventoryHandler,
  createOperationsHandler,
} from '../src/http.js'
import { PluginOperationService } from '../src/operations.js'
import type { DiagnosticReport, PluginInventory } from '../src/shared.js'

function responseRecorder(): {
  readonly response: ServerResponse
  readonly result: { status?: number; headers?: Record<string, string>; body?: string | undefined }
} {
  const result: { status?: number; headers?: Record<string, string>; body?: string | undefined } = {}
  const response = {
    writeHead(status: number, headers: Record<string, string>) {
      result.status = status
      result.headers = headers
      return this
    },
    end(body?: string) {
      result.body = body
      return this
    },
  } as unknown as ServerResponse
  return { response, result }
}

function request(
  method: string,
  body?: unknown,
  headers: Record<string, string> = {},
): IncomingMessage {
  const stream = Readable.from(body === undefined ? [] : [JSON.stringify(body)])
  Object.assign(stream, { method, headers })
  return stream as unknown as IncomingMessage
}

const report: DiagnosticReport = {
  schemaVersion: 1,
  managerVersion: '0.2.0',
  generatedAt: '2026-08-17T00:00:00.000Z',
  profileName: 'web',
  summary: { pass: 1, warning: 0, fail: 0 },
  checks: [{ id: 'ok', label: 'ok', status: 'pass', message: 'ok' }],
}

const inventory: PluginInventory = {
  schemaVersion: 1,
  generatedAt: '2026-08-17T00:00:00.000Z',
  profileName: 'web',
  plugins: [],
}

describe('plugin manager HTTP handlers', () => {
  it('returns a no-store diagnostics report for GET', async () => {
    const { response, result } = responseRecorder()
    await createDiagnosticsHandler(async () => report)(request('GET'), response)

    expect(result.status).toBe(200)
    expect(result.headers?.['cache-control']).toBe('no-store')
    expect(JSON.parse(result.body ?? '')).toEqual(report)
  })

  it('returns the current plugin inventory', async () => {
    const { response, result } = responseRecorder()
    await createInventoryHandler(async () => inventory)(request('GET'), response)

    expect(result.status).toBe(200)
    expect(JSON.parse(result.body ?? '')).toEqual(inventory)
  })

  it('requires the mutation guard header', async () => {
    const service = new PluginOperationService(
      async () => ({ exitCode: 0, output: '' }),
      async () => new Set<string>(),
      'web',
    )
    const { response, result } = responseRecorder()
    await createOperationsHandler(service)(
      request('POST', { action: 'add', target: 'demo-plugin' }),
      response,
    )

    expect(result.status).toBe(403)
    expect(JSON.parse(result.body ?? '')).toEqual({ error: 'request_guard_required' })
  })

  it('executes a validated operation and returns its result', async () => {
    const service = new PluginOperationService(
      async () => ({ exitCode: 0, output: 'installed' }),
      async () => new Set<string>(),
      'web',
    )
    const { response, result } = responseRecorder()
    await createOperationsHandler(service)(
      request(
        'POST',
        { action: 'add', target: 'demo-plugin' },
        { 'x-dsh-plugin-manager': '1' },
      ),
      response,
    )

    expect(result.status).toBe(200)
    expect(JSON.parse(result.body ?? '')).toMatchObject({
      success: true,
      action: 'add',
      target: 'demo-plugin',
    })
  })

  it('separates internal command failures from invalid requests', async () => {
    const service = new PluginOperationService(
      async () => { throw new Error('spawn failed') },
      async () => new Set<string>(),
      'web',
    )
    const { response, result } = responseRecorder()
    await createOperationsHandler(service)(
      request(
        'POST',
        { action: 'add', target: 'demo-plugin' },
        { 'x-dsh-plugin-manager': '1' },
      ),
      response,
    )

    expect(result.status).toBe(500)
    expect(JSON.parse(result.body ?? '')).toMatchObject({ error: 'operation_failed' })
  })

  it('rejects unsupported methods', async () => {
    const { response, result } = responseRecorder()
    await createDiagnosticsHandler(async () => report)(request('POST'), response)

    expect(result.status).toBe(405)
    expect(result.headers?.allow).toBe('GET')
  })
})
