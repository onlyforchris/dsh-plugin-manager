// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { apply, PluginManagerTab } from "../src/client/index.js";

describe("client plugin registration", () => {
  it("registers the plugin manager as a first-level settings section", () => {
    const register = vi.fn(
      (
        _options: {
          name?: string;
          id?: string;
          label?: () => string;
        },
        _component: unknown,
      ) => () => undefined,
    );
    const inject = vi.fn((_name: string, provider: () => unknown) =>
      provider(),
    );
    const effects: (() => void | (() => void))[] = [];

    apply({
      slots: { inject, register },
      effect(setup) {
        effects.push(setup);
      },
    });

    const dispose = effects[0]?.();
    expect(
      document.head.querySelector('style[data-plugin="dsh-plugin-manager"]'),
    ).not.toBeNull();
    expect(inject).toHaveBeenCalledWith(
      "settings.section",
      expect.any(Function),
    );
    const registration = register.mock.calls[0]?.[0];
    expect(registration).toMatchObject({
      name: "settings.section",
      id: "manager",
    });
    // label 是本地化函数（生态惯例），调用后返回菜单名
    expect(typeof registration?.label).toBe("function");
    expect(registration?.label?.()).toBe("插件管家");

    if (typeof dispose === "function") dispose();
    expect(
      document.head.querySelector('style[data-plugin="dsh-plugin-manager"]'),
    ).toBeNull();
  });
});
