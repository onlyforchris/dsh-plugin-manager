# DSH Plugin Manager

DSH 原生插件管家。第一版提供只读“插件医生”，检查当前 Web Profile、Bundle 注册、Loader 中的插件管家实例、Node.js 与 Web 运行状态。

## 产品边界

- 通过 `dsh plugin` 安装、升级和卸载。
- 安装后进入 DSH **设置 → 插件 → 插件医生**。
- 不提供双击脚本、独立管理页面或额外常驻进程。
- 第一版不执行 shell、不改写 Profile、不读取凭据，也不向诊断响应暴露本地绝对路径。

## 构建与打包

要求 Node.js 22.19 或更高版本。

```powershell
npm ci
npm test
npm run build
npm run pack:release
```

## 标准 CLI 安装

在生成 `.tgz` 后执行：

```powershell
dsh plugin --profile web add .\dsh-plugin-manager-0.1.0.tgz
dsh --profile web --dump-config
dsh web
```

升级已发布的 npm 包：

```powershell
dsh plugin --profile web update dsh-plugin-manager
```

卸载：

```powershell
dsh plugin --profile web remove dsh-plugin-manager
```

如果机器没有全局 `dsh`，仍然使用同一套 DSH CLI，只通过 npm 临时提供可执行文件：

```powershell
npm exec --yes --package=@deepseek-ai/dsh -- dsh plugin --profile web add .\dsh-plugin-manager-0.1.0.tgz
```

## 当前诊断项

- Node.js 最低版本
- DSH Home 可访问性
- Web Profile 清单与 pnpm 锁文件
- 插件依赖和 Bundle 层注册
- 当前 Loader 中插件管家自身的实例数量
- DSH Web 监听状态

DSH 仍处于 developer preview。插件当前针对 `@deepseek-ai/dsh 0.1.0-rc.6` 的 Bundle、Client 模块和 Settings slot 约定构建。
