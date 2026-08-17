import type { IncomingMessage, ServerResponse } from 'node:http'
import type { DiagnosticReport } from './shared.js'

export type DiagnosticReportProvider = () => Promise<DiagnosticReport>

export function createDiagnosticsHandler(
  getReport: DiagnosticReportProvider,
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    if (req.method !== 'GET') {
      res.writeHead(405, {
        allow: 'GET',
        'cache-control': 'no-store',
        'content-type': 'application/json; charset=utf-8',
        'x-content-type-options': 'nosniff',
      })
      res.end(JSON.stringify({ error: 'method_not_allowed' }))
      return
    }

    try {
      const report = await getReport()
      res.writeHead(200, {
        'cache-control': 'no-store',
        'content-type': 'application/json; charset=utf-8',
        'x-content-type-options': 'nosniff',
      })
      res.end(JSON.stringify(report))
    } catch {
      res.writeHead(500, {
        'cache-control': 'no-store',
        'content-type': 'application/json; charset=utf-8',
        'x-content-type-options': 'nosniff',
      })
      res.end(JSON.stringify({ error: 'diagnostics_failed' }))
    }
  }
}
