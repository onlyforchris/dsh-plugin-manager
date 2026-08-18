import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const HELPER_SOURCE = String.raw`
const { spawn } = require("node:child_process");
const { openSync, closeSync } = require("node:fs");
const net = require("node:net");
const [cli, profile, cwd, host, portText, logPath, ...appArgs] = process.argv.slice(1);
const port = Number(portText);
const MAX_STARTS = 3;
let attempts = 0;
let starting = false;
let starts = 0;
function start() {
  if (starting || starts >= MAX_STARTS) return;
  starting = true;
  starts += 1;
  const output = openSync(logPath, "a");
  const child = spawn(process.execPath, [cli, "--profile", profile, ...appArgs], {
    cwd,
    env: process.env,
    detached: true,
    windowsHide: true,
    stdio: ["ignore", output, output],
  });
  closeSync(output);
  let done = false;
  const settle = () => {
    if (done) return;
    done = true;
    child.unref();
    process.exit(0);
  };
  // 启动后立刻崩溃（如依赖尚未就绪）：短暂等待后重新探测并再次拉起。
  child.once("exit", () => {
    if (done) return;
    starting = false;
    setTimeout(probe, 500);
  });
  // 存活 20 秒即视为启动成功，助手退出，不再干预。
  setTimeout(settle, 20000);
}
function probe() {
  const socket = net.connect({ host, port });
  let settled = false;
  function finish(available) {
    if (settled) return;
    settled = true;
    socket.destroy();
    if (available) {
      start();
      return;
    }
    attempts += 1;
    if (attempts >= 480) process.exit(1);
    setTimeout(probe, 250);
  }
  socket.once("connect", () => finish(false));
  socket.once("error", () => finish(true));
  socket.setTimeout(200, () => finish(false));
}
setTimeout(probe, 250);
`;

export class RestartError extends Error {
  constructor(readonly code: "busy" | "unavailable") {
    super(code);
  }
}

export type RestartHelper = () => Promise<void>;
export type AppExit = (code: number) => void;

export function createRestartHelper(input: {
  readonly dshCliPath: string;
  readonly profileName: string;
  readonly cwd: string;
  readonly dshHome: string;
  readonly host: string;
  readonly port: number;
  readonly appArgs?: readonly string[];
}): RestartHelper {
  const directory = join(input.dshHome, "cache", "dsh-plugin-manager");
  const logPath = join(directory, "restart.log");
  return async () => {
    await mkdir(directory, { recursive: true });
    await new Promise<void>((resolve, reject) => {
      const helper = spawn(
        process.execPath,
        [
          "-e",
          HELPER_SOURCE,
          input.dshCliPath,
          input.profileName,
          input.cwd,
          input.host,
          String(input.port),
          logPath,
          ...(input.appArgs ?? []),
        ],
        {
          cwd: input.cwd,
          env: process.env,
          detached: true,
          shell: false,
          stdio: "ignore",
          windowsHide: true,
        },
      );
      helper.once("spawn", () => {
        helper.unref();
        resolve();
      });
      helper.once("error", reject);
    });
  };
}

export class DshRestartService {
  private scheduled = false;

  constructor(
    private readonly launchHelper: RestartHelper,
    private readonly appExit: AppExit | undefined,
  ) {}

  async schedule(): Promise<{ readonly accepted: true }> {
    if (this.scheduled) throw new RestartError("busy");
    if (!this.appExit) throw new RestartError("unavailable");
    this.scheduled = true;
    try {
      await this.launchHelper();
    } catch (error) {
      this.scheduled = false;
      throw error;
    }
    setTimeout(() => this.appExit?.(0), 200);
    return { accepted: true };
  }
}
