import { describe, expect, it } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createDiagnosticsHandler } from '../src/http.js'
import type { DiagnosticReport } from '../src/shared.js'

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

const report: DiagnosticReport = {
  schemaVersion: 1,
  managerVersion: '0.1.0',
  generatedAt: '2026-08-17T00:00:00.000Z',
  profileName: 'web',
  summary: { pass: 1, warning: 0, fail: 0 },
  checks: [{ id: 'ok', label: 'ok', status: 'pass', message: 'ok' }],
}

describe('diagnostics HTTP handler', () => {
  it('returns a no-store JSON report for GET', async () => {
    const { response, result } = responseRecorder()
    await createDiagnosticsHandler(async () => report)({ method: 'GET' } as IncomingMessage, response)

    expect(result.status).toBe(200)
    expect(result.headers?.['cache-control']).toBe('no-store')
    expect(JSON.parse(result.body ?? '')).toEqual(report)
  })

  it('rejects mutating methods', async () => {
    const { response, result } = responseRecorder()
    await createDiagnosticsHandler(async () => report)({ method: 'POST' } as IncomingMessage, response)

    expect(result.status).toBe(405)
    expect(result.headers?.allow).toBe('GET')
  })
})
