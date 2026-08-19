import type { IncomingMessage, ServerResponse } from 'node:http'
import { PluginOperationError, type PluginOperationService } from './operations.js'
import { RestartError, type DshRestartService } from './restart.js'
import type {
  DiagnosticReport,
  PluginCatalog,
  PluginInventory,
  PluginUpdatesReport,
  PluginOperationRequest,
} from './shared.js'

export type DiagnosticReportProvider = () => Promise<DiagnosticReport>
export type PluginInventoryProvider = () => Promise<PluginInventory>
export type PluginUpdatesProvider = () => Promise<PluginUpdatesReport>
export type PluginCatalogProvider = () => Promise<PluginCatalog>

const JSON_HEADERS = {
  'cache-control': 'no-store',
  'content-type': 'application/json; charset=utf-8',
  'x-content-type-options': 'nosniff',
}

function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  extraHeaders: Record<string, string> = {},
): void {
  res.writeHead(status, { ...JSON_HEADERS, ...extraHeaders })
  res.end(JSON.stringify(body))
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  let body = ''
  for await (const chunk of req) {
    body += chunk.toString()
    if (body.length > 8_192) throw new Error('request_too_large')
  }
  return JSON.parse(body)
}

export function createDiagnosticsHandler(
  getReport: DiagnosticReportProvider,
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'method_not_allowed' }, { allow: 'GET' })
      return
    }

    try {
      sendJson(res, 200, await getReport())
    } catch {
      sendJson(res, 500, { error: 'diagnostics_failed' })
    }
  }
}

export function createInventoryHandler(
  getInventory: PluginInventoryProvider,
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'method_not_allowed' }, { allow: 'GET' })
      return
    }

    try {
      sendJson(res, 200, await getInventory())
    } catch {
      sendJson(res, 500, { error: 'inventory_failed' })
    }
  }
}

export function createUpdatesHandler(
  getUpdates: PluginUpdatesProvider,
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'method_not_allowed' }, { allow: 'GET' })
      return
    }
    try {
      sendJson(res, 200, await getUpdates())
    } catch {
      sendJson(res, 500, { error: 'updates_failed' })
    }
  }
}

export function createCatalogHandler(
  getCatalog: PluginCatalogProvider,
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'method_not_allowed' }, { allow: 'GET' })
      return
    }
    try {
      sendJson(res, 200, await getCatalog())
    } catch {
      sendJson(res, 500, { error: 'catalog_failed' })
    }
  }
}
export function createOperationsProgressHandler(
  service: PluginOperationService,
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'method_not_allowed' }, { allow: 'GET' })
      return
    }
    sendJson(res, 200, service.progressSnapshot())
  }
}

export function createRestartHandler(
  service: DshRestartService,
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    if (req.method !== "POST") {
      sendJson(res, 405, { error: "method_not_allowed" }, { allow: "POST" })
      return
    }
    if (req.headers["x-dsh-plugin-manager"] !== "1") {
      sendJson(res, 403, { error: "request_guard_required" })
      return
    }
    try {
      sendJson(res, 202, await service.schedule())
    } catch (error) {
      if (error instanceof RestartError) {
        sendJson(res, error.code === "busy" ? 409 : 503, {
          error: error.code,
          message: error.code === "busy"
            ? "DSH 已在准备重启"
            : "当前 DSH 启动器不支持自动重启",
        })
        return
      }
      sendJson(res, 500, {
        error: "restart_failed",
        message: "无法启动 DSH 重启助手",
      })
    }
  }
}
export function createOperationsHandler(
  service: PluginOperationService,
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'method_not_allowed' }, { allow: 'POST' })
      return
    }
    if (req.headers['x-dsh-plugin-manager'] !== '1') {
      sendJson(res, 403, { error: 'request_guard_required' })
      return
    }

    let parsed: unknown
    try {
      parsed = await readJsonBody(req)
    } catch {
      sendJson(res, 400, { error: 'invalid_request', message: '请求格式无效' })
      return
    }
    if (parsed === null || typeof parsed !== 'object') {
      sendJson(res, 400, { error: 'invalid_request', message: '请求格式无效' })
      return
    }
    const request = parsed as PluginOperationRequest
    if (typeof request.action !== 'string' || typeof request.target !== 'string') {
      sendJson(res, 400, { error: 'invalid_request', message: '请求格式无效' })
      return
    }

    try {
      sendJson(res, 200, await service.run(request))
    } catch (error) {
      if (error instanceof PluginOperationError) {
        sendJson(res, error.code === 'busy' ? 409 : 400, {
          error: error.code,
          message: error.message,
        })
        return
      }
      sendJson(res, 500, { error: 'operation_failed', message: 'DSH 插件命令执行失败' })
    }
  }
}
