# DSH Plugin Manager

DSH 原生插件管家。它是当前 DSH Profile 的第三方插件生命周期控制面：查看真实安装状态，通过标准 dsh plugin 命令安装、升级和卸载，并对每个插件执行基础兼容性检查。

## 产品定位

- **插件管家**是产品定位：管理插件清单和生命周期。
- **插件体检**是辅助能力：检查已安装包、Manifest、Bundle 注册、Bundle patch 和 Client 导出。
- **运行环境自检**用于排查 DSH Home、Profile、Node.js 和 Web Runtime，本身不是产品主功能。
- 0.2.0 **不提供漏洞扫描**，不会把依赖健康检查冒充为 CVE 或供应链安全扫描。

## 使用方式

安装后启动 DSH Web：

~~~powershell
dsh web
~~~

进入 DSH **设置 → 插件 → 插件管家**。

插件管家支持：

- 输入 npm 包名或版本，例如 demo-plugin、@scope/plugin@1.2.3
- 输入 GitHub 仓库地址，例如 https://github.com/owner/repo
- 输入无空格的本地 .tgz 绝对路径
- 升级或卸载当前 Profile 中的第三方插件
- 查看实际执行的标准 DSH 命令、退出码和运行日志
- 查看每个插件的基础健康状态和明确问题

所有变更写入 Profile 后都需要重启 DSH Web 才能加载新的插件代码。

## 标准 CLI 安装

要求 Node.js 22.19 或更高版本。生成安装包：

~~~powershell
npm ci
npm test
npm run build
npm run pack:release
~~~

安装到默认 Web Profile：

~~~powershell
dsh plugin --profile web add .\dsh-plugin-manager-0.2.0.tgz
~~~

升级已发布的 npm 包：

~~~powershell
dsh plugin --profile web update dsh-plugin-manager
~~~

卸载：

~~~powershell
dsh plugin --profile web remove dsh-plugin-manager
~~~

## 安全边界

- 操作 API 只接受 add、update、remove 三种动作。
- 安装目标只接受受限格式的 npm 包、GitHub 仓库或本地 .tgz。
- 不提供任意 Shell、命令拼接或配置文件编辑入口。
- 插件管家不能从自己的运行页面升级或卸载自身。
- 修改操作严格串行，并要求同源自定义请求头。
- 本地路径暂不接受空格或 Shell 特殊字符。
- 操作完成后只提示重启，不从插件进程内部强制终止 DSH。

## 基础健康检查

每个 Profile 依赖会检查：

- 安装目录中是否存在有效 package.json
- 是否声明 dsh.bundle.patch
- Bundle 是否加入当前 Profile
- Bundle patch 文件是否真实存在且位于插件包内
- 声明 dsh.client 时是否存在可访问的 ./client 导出

DSH 仍处于 developer preview。当前版本针对 @deepseek-ai/dsh 0.1.0-rc.6 的 Bundle、Client 和 Settings slot 约定构建。
