import { afterEach, describe, expect, it, vi } from "vitest";
import { waitForRestart } from "../src/client/index.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("waitForRestart", () => {
  it("reloads after the app goes offline and returns two consecutive ready probes", async () => {
    vi.useFakeTimers();
    const results = [false, true, true];
    let calls = 0;
    const reload = vi.fn();
    const probe = vi.fn(async () => results[calls++] ?? true);
    const promise = waitForRestart(probe, reload);
    await vi.advanceTimersByTimeAsync(5_000);
    await expect(promise).resolves.toBeUndefined();
    expect(reload).toHaveBeenCalledOnce();
  });

  it("recovers quickly when the app is back but the offline transition was missed", async () => {
    vi.useFakeTimers();
    const reload = vi.fn();
    const probe = vi.fn(async () => true);
    const promise = waitForRestart(probe, reload);
    await vi.advanceTimersByTimeAsync(12_000);
    await expect(promise).resolves.toBeUndefined();
    expect(reload).toHaveBeenCalledOnce();
  });

  it("throws when the app stays down past the deadline without a recovery probe", async () => {
    vi.useFakeTimers();
    const reload = vi.fn();
    const probe = vi.fn(async () => false);
    const promise = waitForRestart(probe, reload);
    const assertion = expect(promise).rejects.toThrow("DSH 重启超时");
    await vi.advanceTimersByTimeAsync(70_000);
    await assertion;
    expect(reload).not.toHaveBeenCalled();
  });
});
