export const PACKAGE_NAME = 'dsh-plugin-manager'
export const MANAGER_VERSION = '0.1.0'
export const DIAGNOSTICS_PATH = '/dsh-plugin-manager/api/diagnostics'

export type DiagnosticStatus = 'pass' | 'warning' | 'fail'

export interface DiagnosticCheck {
  readonly id: string
  readonly label: string
  readonly status: DiagnosticStatus
  readonly message: string
}

export interface DiagnosticSummary {
  readonly pass: number
  readonly warning: number
  readonly fail: number
}

export interface DiagnosticReport {
  readonly schemaVersion: 1
  readonly managerVersion: string
  readonly generatedAt: string
  readonly profileName: string
  readonly summary: DiagnosticSummary
  readonly checks: readonly DiagnosticCheck[]
}
