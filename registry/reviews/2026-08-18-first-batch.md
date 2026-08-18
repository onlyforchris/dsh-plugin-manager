# 2026-08-18 首批插件准入记录

验证环境：Windows x64、Node.js 24.14.0、`@deepseek-ai/dsh` 0.1.0-rc.6、Web Profile。

统一流程：固定版本或提交，使用标准 `dsh plugin --profile web add` 安装到隔离 Profile，启动 `dsh web`，检查 Loader 清单、浏览器控制台与动态请求。

| 候选 | 安装结果 | Loader | 浏览器 | 结论 |
| --- | --- | --- | --- | --- |
| `@anionex/dsh-vision-toolkit@0.1.31` | 通过 | 已挂载、已启用 | 无专属错误 | 收录，verified |
| `dsh-at-file#v0.6.3` | 通过 | 已挂载、已启用 | 设置接口 200 | 收录，verified |
| `dsh-find-plugin@0.3.6` | 通过 | 已挂载、已启用 | 无专属错误 | 收录，verified；搜索结果不等于准入 |
| `dsh-genui@dab48fae` | 通过 | 已挂载、已启用 | 无专属错误 | 收录，experimental；pnpm 声明范围不一致 |
| `@linxin666/dsh-web-ui-all@0.1.20` | 通过 | 已挂载、已启用 | 页面与动态接口正常 | 收录，experimental；原生依赖构建脚本未执行 |
| `dsh-memory-evolve#v26081701` | 通过 | 已挂载、已启用 | 7 个 `/memory-evolve/api/*` 请求返回 404 | 拒绝收录 |

移除 `dsh-memory-evolve` 后重新启动剩余五个候选，Playwright 新会话记录为 0 error、0 warning，已观察的动态请求均返回 200。

“verified”仅表示上述 DSH 兼容性检查通过，不是漏洞扫描、供应链审计或对外部服务的安全背书。
