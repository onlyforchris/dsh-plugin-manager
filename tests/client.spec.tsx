// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { apply, installManagerNavIcon, PluginManagerTab } from "../src/client/index.js";

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

  it("replaces the gear glyph of the manager nav item with the brand icon", () => {
    document.body.innerHTML = `
      <nav>
        <button><svg data-testid="gear"></svg><span>通用设置</span></button>
        <button><svg data-testid="gear"></svg><span>插件管家</span></button>
      </nav>`;
    installManagerNavIcon(document);
    const managerButton = [...document.querySelectorAll("nav button")].find(
      (b) => b.querySelector("span")?.textContent?.trim() === "插件管家",
    );
    // 齿轮已被品牌盾牌图标替换，且只替换一次
    expect(managerButton?.querySelector("svg")?.getAttribute("data-testid")).toBeNull();
    expect(managerButton?.querySelectorAll("svg").length).toBe(1);
    expect(managerButton?.querySelector("svg")?.querySelector("path")).not.toBeNull();
    installManagerNavIcon(document);
    expect(managerButton?.querySelectorAll("svg").length).toBe(1);
    // 其他 section 的图标不受影响
    const generalButton = [...document.querySelectorAll("nav button")].find(
      (b) => b.querySelector("span")?.textContent?.trim() === "通用设置",
    );
    expect(generalButton?.querySelector("svg")?.getAttribute("data-testid")).toBe("gear");
  });
});
