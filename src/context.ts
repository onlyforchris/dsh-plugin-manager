import type { IncomingMessage, ServerResponse } from 'node:http'

export interface LoaderEntryLike {
  readonly id: string
  readonly disabled?: boolean
  readonly options: {
    readonly name: string
    readonly group?: boolean
  }
}

export interface WebServerLike {
  readonly host: '127.0.0.1' | '0.0.0.0'
  readonly port: number
  register(route: {
    readonly kind: 'exact' | 'prefix'
    readonly path: string
    readonly handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
  }): () => void
}

export interface DshHostContext {
  readonly webServer: WebServerLike
  readonly loader: {
    entries(): Iterable<LoaderEntryLike>
  }
  effect(setup: () => void | (() => void) | Promise<void | (() => void)>, label?: string): void
  readonly logger: {
    warn(error: unknown): void
  }
  get(name: "appExit"): ((code: number) => void) | undefined
  get(name: "cmdlineArgs"): { get(): readonly string[] } | undefined
}
