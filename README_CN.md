# Blog MCP Server

<div align="center">

[README_EN.md 查看英文版](./README_EN.md) 

</div>

> 私人 MCP 服务器 - 让 AI 助手直接在你的技术博客中创建文章

这是一个专为你的博客定制的私人 MCP (Model Context Protocol) 服务器，允许 AI 助手（如 Cursor、Claude 等）直接在你的技术博客中创建文章，无需手动编辑。

## 🎯 项目特点

- 🔒 **私人服务** - 专为你的博客定制，不对外公开
- 🚀 **自动化创建** - AI 可以直接创建完整的博客文章
- 📝 **Markdown 支持** - 支持完整的 Markdown 格式
- 🏷️ **标签管理** - 自动创建和管理文章标签
- 🔐 **安全认证** - 多层安全验证机制
- 📦 **npm 包** - 可直接通过 npx 安装使用
- ⚡ **实时发布** - 文章创建后立即可见

## 🚀 快速开始

### 1. 在 Cursor 中配置

在你的 Cursor 设置文件 `~/.cursor/mcp.json` 中添加以下配置：

```json
{
  "Blog MCP Server": {
    "type": "stdio",
    "command": "npx",
    "args": [
      "-y",
      "@zyzy-org/blog-mcp-server@latest"
    ],
    "env": {
      "BLOG_URL": "https://your-blog.com",
      "MCP_SECRET": "your_shared_secret_here",
      "MCP_CLIENT_ID": "your_client_id",
      "MCP_SIGNATURE_SECRET": "your_signature_secret"
    }
  }
}
```

### 2. 重启 Cursor

配置完成后，重启 Cursor 以使新的 MCP 服务器生效。

### 3. 开始使用

在 Cursor 中直接使用：

```
请在我的博客中创建一篇关于 React Hooks 的文章
```

## 🛠️ 可用工具

### create_blog_post
创建单篇博客文章

**参数:**
- `title` (string): 文章标题（必需）
- `content` (string): 文章内容，支持 Markdown（必需）
- `tags` (array): 文章标签（可选）
- `author` (string): 作者名称（可选）
- `readTime` (number): 预计阅读时间（分钟）（可选）
- `date` (string): 发布日期（ISO 8601 格式）（可选）
- `github_url` (string): 相关的 GitHub 链接（可选）
- `slug` (string): 自定义文章 slug（可选）

### create_multiple_blog_posts
批量创建多篇博客文章

**参数:**
- `articles` (array): 要创建的文章数组

## 🔒 安全特性

- **共享密钥认证** - 使用预配置的密钥进行基础认证
- **时间戳验证** - 防止重放攻击
- **签名验证** - 可选的额外安全层
- **客户端白名单** - 限制允许的客户端访问
- **环境变量管理** - 所有敏感信息存储在环境变量中

## 🏗️ 博客端配置

### 1. API 端点

在你的 Next.js 博客项目中创建 `/app/api/mcp/posts/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const secret = process.env.MCP_SHARED_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  // 基础密钥验证
  const provided = req.headers.get('x-mcp-secret');
  if (!provided || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // 客户端白名单验证
  const allowedClients = process.env.MCP_ALLOWED_CLIENTS?.split(',') || [];
  if (allowedClients.length > 0 && body.client_id && !allowedClients.includes(body.client_id)) {
    return NextResponse.json({ error: 'Client not authorized' }, { status: 403 });
  }

  // 创建文章逻辑...
  const admin = createAdminClient();
  const finalSlug = body.slug ?? crypto.randomUUID();

  try {
    const { error: postError } = await admin
      .from('Post')
      .upsert({
        slug: finalSlug,
        title: body.title,
        date: body.date ?? new Date().toISOString(),
        author: body.author || '',
        tags: body.tags || [],
        content: body.content,
        readTime: body.readTime === '' ? null : body.readTime,
        lastModified: new Date().toISOString(),
        github_url: body.github_url || '',
        isShown: true,
      }, { onConflict: 'slug' });

    if (postError) {
      return NextResponse.json({ error: 'Failed to create post', details: postError.message }, { status: 500 });
    }

    return NextResponse.json({ slug: finalSlug, message: 'ok' });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Unexpected error', details: errorMessage }, { status: 500 });
  }
}
```

### 2. 环境变量配置

在 Vercel 中配置以下环境变量：

```bash
# MCP 认证配置
MCP_SHARED_SECRET=your_shared_secret_here
MCP_CLIENT_ID=your_client_id
MCP_SIGNATURE_SECRET=your_signature_secret
MCP_ALLOWED_CLIENTS=client1,client2,client3

# Supabase 配置
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. 中间件配置

确保 `middleware.ts` 排除 API 路由：

```typescript
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|categories|post/|write|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

## 🧪 测试

### 本地测试

```bash
# 构建项目
npm run build

# 启动 MCP 服务器
npm start

# 测试配置
npm test
```

### API 测试

```bash
curl -X POST https://your-blog.com/api/mcp/posts \
  -H "Content-Type: application/json" \
  -H "x-mcp-secret: your_shared_secret_here" \
  -d '{
    "title": "测试文章",
    "content": "这是一篇测试文章",
    "client_id": "your_client_id"
  }'
```

## 📁 项目结构

```
src/
├── index.ts          # 主入口文件
├── types.ts          # 类型定义
├── config.ts         # 配置解析
├── blog-client.ts    # 博客 API 客户端
└── mcp-server.ts     # MCP 服务器实现
```

## 🚨 重要提醒

1. **私人服务** - 这是专为你的博客定制的私人服务，不对外公开
2. **密钥安全** - 所有敏感信息都存储在环境变量中，不要提交到代码仓库
3. **定期更新** - 建议定期更换签名密钥
4. **本地测试** - 建议先在本地环境测试功能

## 🎉 使用示例

配置完成后，你可以在 Cursor 中这样使用：

### 创建单篇文章
```
请在我的博客中创建一篇关于 TypeScript 的文章，标题为"TypeScript 最佳实践"
```

### 批量创建文章
```
请在我的博客中创建三篇关于 React 的文章：
1. React Hooks 详解
2. React 性能优化
3. React 状态管理
```

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

---

**注意**: 这是一个私人 MCP 服务，专为你的博客定制。所有敏感配置信息都存储在环境变量中，确保安全性。