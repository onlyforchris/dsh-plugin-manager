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

不要提交普通 npm 包、指向动态分支的安装地址或无法说明用途的项目。