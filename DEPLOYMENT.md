# 部署说明

## 发布到 npm

```bash
# 构建项目
npm run build

# 发布包
npm run publish-package
```

## 发布到 GitHub

```bash
# 初始化 Git 仓库（如果还没有）
git init

# 添加文件
git add .

# 提交更改
git commit -m "Initial commit: Blog MCP Server"

# 添加远程仓库
git remote add origin https://github.com/zyzy-org/blog-mcp-server.git

# 推送到 GitHub
git push -u origin main
```

## 注意事项

1. **敏感信息保护** - 确保 `.env` 文件已添加到 `.gitignore`
2. **环境变量** - 所有敏感配置都通过环境变量管理
3. **私人服务** - 这是私人 MCP 服务，不对外公开
4. **测试** - 发布前请确保所有功能正常工作

## 版本更新

```bash
# 更新版本号
npm version patch  # 或 minor, major

# 重新发布
npm run publish-package
```
