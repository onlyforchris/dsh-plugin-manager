# DSH Plugin Manager

DSH 原生插件管家。它管理当前 DSH Profile 的第三方插件生命周期，检查插件结构健康，并识别 npm Registry 上可用的新版本。

## 产品定位

- **插件管家**是产品定位：管理插件清单、来源和生命周期。
- **插件体检**是辅助能力：检查已安装包、Manifest、Bundle 注册、Bundle patch 和 Client 导出。
- **版本识别**只查询 npm Registry 的 latest 版本；本地包和 Git 源会明确显示无法自动判断。
- **可信来源目录**只展示内置核验或由 Profile 管理员显式配置的来源，不把搜索结果冒充推荐。
- 0.3.0 **不提供漏洞扫描**，不把结构检查冒充为 CVE 或供应链安全扫描。

## 使用方式

安装后运行 `dsh web`，进入 **设置 → 插件 → 插件管家**。

插件管家支持：

- 使用 npm 包、GitHub 仓库地址或本地 .tgz 安装插件
- 升级或卸载当前 Profile 中的第三方插件
- 显示 Registry 最新版本和可升级状态
- 查看可信来源、信任依据和代码仓库
- 查看每个插件的结构健康问题
- 查看实际执行的标准 DSH 命令、退出码和输出

所有变更写入 Profile 后都需要重启 DSH Web 才能加载新的插件代码。

## 标准 CLI 安装

要求 Node.js 22.19 或更高版本。

~~~powershell
npm ci
npm test
npm run pack:release
dsh plugin --profile web add .\dsh-plugin-manager-0.3.0.tgz
dsh web
~~~

## 配置可信来源

插件配置可追加由 Profile 管理员负责的来源：

~~~yaml
catalog:
  - name: example-plugin
    description: 团队核验的示例插件
    installSpec: example-plugin
    repository: https://github.com/example/example-plugin
~~~

目录不是远程搜索结果；每个条目必须由插件内置或 Profile 管理员显式登记。安装仍经过与手动输入相同的目标校验和标准 `dsh plugin` 命令。

## 安全与网络边界

- 操作 API 只接受 add、update、remove。
- 安装目标只接受受限格式的 npm 包、GitHub 仓库或本地 .tgz。
- 不提供任意 Shell、命令拼接或配置文件编辑入口。
- 修改操作严格串行，并要求同源自定义请求头。
- 插件管家不能从运行页面升级或卸载自身。
- 版本检查只向 `https://registry.npmjs.org/<package>/latest` 发起 GET 请求，4 秒超时，成功结果缓存 10 分钟。
- Registry 失败只影响版本提示，不影响本地清单和结构体检。

## 基础健康检查

每个 Profile 依赖会检查：

- 安装目录中是否存在有效 package.json
- 是否声明 dsh.bundle.patch
- Bundle 是否加入当前 Profile
- Bundle patch 文件是否真实存在且位于插件包内
- 声明 dsh.client 时是否存在可访问的 ./client 导出

DSH 仍处于 developer preview。当前版本针对 @deepseek-ai/dsh 0.1.0-rc.6 的 Bundle、Client 和 Settings slot 约定构建。