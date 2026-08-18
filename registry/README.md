# DSH Plugin Registry

推荐目录使用 `plugins.json`，每个候选插件必须经过人工准入和自动兼容性验证。

## 准入要求

- 是真实 DSH Bundle 或 Client 插件
- 仓库与维护者明确
- 使用固定 npm 版本、GitHub Release、tag 或 commit
- 通过标准 `dsh plugin --profile web add` 安装
- DSH Web 启动成功
- Manifest、Bundle、patch 和 Client 体检完成
- 记录 DSH 兼容版本、验证日期、许可证和权限

- 提供 1–5 个可验证的首次使用步骤
- 如提供快捷入口，只能使用 `settings` 或 `copy-prompt`，不得下发任意命令
不要提交普通 npm 包、指向动态分支的安装地址或无法说明用途的项目。

## 验证 SOP（新增/变更条目必走）

1. **隔离安装**：用独立 Profile（如 `dsh plugin --profile verify-xxx add <固定版本或 commit>`）安装候选，避免污染日常 Profile。
2. **启动检查**：启动 `dsh web`，确认 Loader 清单中候选「已挂载、已启用」，无报错。
3. **运行检查**：Playwright 新会话记录 0 error / 0 warning；观察候选的动态 API 请求全部返回 200（404 即拒绝，参见 `dsh-memory-evolve` 先例）。
4. **留痕**：结论写入 `reviews/<YYYY-MM-DD>-<批次>.md`（含验证环境：系统、Node 版本、DSH 版本、Profile）。
5. **上架**：只有走完上述流程才能标 `verified`；其余一律 `community`（来源明确、未实机验证）或 `experimental`（功能/兼容性实验阶段）。同步更新 `plugins.json` 的 `updatedAt`。
6. **联动**：目录变更必须同步 `reviews/` 记录与根 README 的收录说明；CI 会校验 `plugins.json` 结构（`scripts/validate-registry.mjs`）。

## 当前收录

首批（2026-08-18，验证环境：Windows x64、Node.js 24.14.0、DSH 0.1.0-rc.6、Web Profile）：

| id | 状态 | 版本 |
| --- | --- | --- |
| vision-toolkit | verified | 0.1.31 |
| dsh-at-file | verified | v0.6.3 |
| dsh-find-plugin | verified | 0.3.6 |
| dsh-genui | experimental | dab48fae |
| dsh-web-ui-all | experimental | 0.1.20 |

> `verified` 仅表示上述 DSH 兼容性检查通过，不是漏洞扫描、供应链审计或对外部服务的安全背书。
> 复验待办：上述条目验证于 rc.6；DSH rc.7 发布后按 SOP 复跑，通过后更新 `verifiedWithDsh`。
