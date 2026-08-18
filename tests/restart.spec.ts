import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRestartHandler } from "../src/http.js";
import {
  DshRestartService,
  RestartError,
  type RestartHelper,
} from "../src/restart.js";

function request(headers: Record<string, string> = {}): IncomingMessage {
  const stream = Readable.from([]);
  Object.assign(stream, { method: "POST", headers });
  return stream as unknown as IncomingMessage;
}

function responseRecorder() {
  const result: { status?: number; body?: string } = {};
  const response = {
    writeHead(status: number) {
      result.status = status;
      return this;
    },
    end(body?: string) {
      if (body !== undefined) result.body = body;
      return this;
    },
  } as unknown as ServerResponse;
  return { response, result };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("DSH restart service", () => {
  it("launches the detached helper before requesting graceful exit", async () => {
    vi.useFakeTimers();
    const helper = vi.fn<RestartHelper>(async () => undefined);
    const appExit = vi.fn();
    const service = new DshRestartService(helper, appExit);

    await expect(service.schedule()).resolves.toEqual({ accepted: true });
    expect(helper).toHaveBeenCalledOnce();
    expect(appExit).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(200);
    expect(appExit).toHaveBeenCalledWith(0);
  });

  it("rejects unsupported hosts and duplicate restart requests", async () => {
    const unavailable = new DshRestartService(async () => undefined, undefined);
    await expect(unavailable.schedule()).rejects.toMatchObject({
      code: "unavailable",
    });

    const service = new DshRestartService(async () => undefined, vi.fn());
    await service.schedule();
    await expect(service.schedule()).rejects.toBeInstanceOf(RestartError);
  });

  it("requires the mutation guard and accepts a scheduled restart", async () => {
    vi.useFakeTimers();
    const service = new DshRestartService(async () => undefined, vi.fn());

    const rejected = responseRecorder();
    await createRestartHandler(service)(request(), rejected.response);
    expect(rejected.result.status).toBe(403);

    const accepted = responseRecorder();
    await createRestartHandler(service)(
      request({ "x-dsh-plugin-manager": "1" }),
      accepted.response,
    );
    expect(accepted.result.status).toBe(202);
    expect(JSON.parse(accepted.result.body ?? "")).toEqual({ accepted: true });
  });
});