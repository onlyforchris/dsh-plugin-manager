# DSH Plugin Manager

DSH 的插件发现与生命周期管理入口。0.6.1 将“推荐插件”放到首屏，在同一页面完成发现、安装、升级、卸载和结构体检。

## 使用

安装后运行 `dsh web`，进入 **设置 → 插件 → 插件推荐**。

页面分为：

- 推荐插件：来自受控远程目录，展示用途、兼容范围、验证状态和推荐理由。
- 已安装插件：展示版本、更新状态和结构健康，可升级或卸载。
- 高级安装：手动安装可信的 npm 固定版本、GitHub 仓库或本地 .tgz。
- 关于与环境自检：管家自身和 DSH 运行状态。

## 第一次成功使用

推荐卡不仅告诉用户“装什么”，还要解释“为什么推荐”和“第一次怎么用”。安装会依次显示：未安装、安装中、自动重启、已启用或安装失败。安装成功后，管家会安全退出并按原启动参数拉起 DSH，页面等待服务恢复后自动刷新；只有自动重启不可用时才显示命令行兜底。回到推荐卡后，可直接打开真实存在的设置入口，或复制一段可立即试用的示例提示。

远程目录中的 `firstUse` 负责提供 1–5 个首次使用步骤；`launch` 仅允许打开已注册的设置入口或复制示例提示，不允许目录下发任意 URL、脚本或 Shell 命令。
## 推荐策略

推荐不是 npm 搜索结果。条目必须说明维护者、源码、许可证、DSH 兼容范围、验证日期、权限和推荐理由。

验证状态：

- `verified`：完成标准 CLI 安装、DSH 启动和结构体检。
- `community`：来源明确，尚未完成当前版本实机验证。
- `experimental`：功能或兼容性仍处于实验阶段。

“已验证”只代表兼容性验证，不代表漏洞或供应链安全认证。

## 远程目录

目录文件位于 [registry/plugins.json](./registry/plugins.json)，默认从 GitHub Raw 获取，**GitHub Raw 不可达时自动回退 jsDelivr CDN 镜像**（内容一致，国内网络通常可达）。服务端请求超时 4 秒，限制 256 KB 和 200 条记录，并严格校验字段、GitHub 仓库地址和安装目标。

获取顺序：

1. 远程目录（GitHub Raw → jsDelivr 镜像）
2. ETag 本地缓存
3. 安装包内置目录

缓存位于 `~/.dsh/cache/dsh-plugin-manager/registry.json`。远程失败不会影响已安装插件管理。缓存超过 7 天会显示过期状态。目录获取本身不会触发安装；每次安装仍需用户确认，并走标准 `dsh plugin` 命令。

> 发布目录：改动 `registry/plugins.json` 后推送到 GitHub main 分支即可；jsDelivr 缓存约几分钟内同步（可用 `https://purge.jsdelivr.net/gh/onlyforchris/dsh-plugin-manager@main/registry/plugins.json` 强制刷新）。

首批候选（2026-08-18 验证）已完成实机验证并收录，见 [registry/plugins.json](./registry/plugins.json)：3 个 `verified`（vision-toolkit、dsh-at-file、dsh-find-plugin）、2 个 `experimental`（dsh-genui、dsh-web-ui-all）。验证记录见 [registry/reviews](./registry/reviews)。目录仍不接受未经验证的条目，也不会用普通 npm 包凑数。

> 复验待办：首批验证于 DSH 0.1.0-rc.6 完成；rc.7 发布后需按 [registry/README.md](./registry/README.md) 的 SOP 复跑，通过后更新 `verifiedWithDsh`。

## 标准安装

~~~powershell
npm ci
npm test
npm run pack:release
dsh plugin --profile web add .\dsh-plugin-manager-0.7.0.tgz
dsh web
~~~

页面内的安装、升级、卸载直接以隐藏控制台运行 Profile 内置 pnpm（与 `dsh plugin` 命令等效，含相对路径锚定和 bundles 对账），Windows 上不会弹出 cmd 窗口，也不会受 PATH 上其他 pnpm 大版本影响。

## 故障排查

### pnpm store 版本不匹配（ERR_PNPM_UNEXPECTED_STORE）

Profile 的依赖由 pnpm 10.x（store v10）安装；如果 PATH 上的 pnpm 是其他大版本（如 11.x），终端里手动执行 `dsh plugin` 会报 `ERR_PNPM_UNEXPECTED_STORE`，pnpm 会拒绝继续。插件管家在页面内执行操作时不受影响——它会优先使用 Profile 内置的 pnpm 10.34.5（`<profile>/node_modules/.bin`）。终端手动执行时，把 Profile 内置 pnpm 放到 PATH 最前即可：

~~~powershell
$env:PATH = "$env:USERPROFILE\.dsh\profiles\web\node_modules\.bin;$env:PATH"
dsh plugin --profile web remove some-plugin
~~~

## 产品边界

- 不提供任意 Shell 或命令拼接。
- 不自动安装远程目录中的插件。
- 不做个性化推荐或安装行为采集。
- 不把结构体检称为漏洞扫描。
- 管家不能从运行页面升级或卸载自身。

当前版本针对 @deepseek-ai/dsh 0.1.0-rc.7 构建。