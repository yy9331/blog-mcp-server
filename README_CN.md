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

### patch_blog_post
根据文章 URL 读取内容后做**局部修改**（不整篇替换）。适合改错别字、改某一段、补一小节等。

**参数:**
- `article_url` (string): 文章完整 URL，例如 `https://www.zyzy.info/post/Qvk4wF0esIqWF-Pu34nup`，或直接传文章 slug
- `edits` (array): 局部修改列表，按顺序执行；每项为 `{ find: string, replace: string }`，将内容中所有 `find` 替换为 `replace`

**示例:** 把文中「旧术语」改成「新术语」，并修正一段话：
```json
{
  "article_url": "https://www.zyzy.info/post/Qvk4wF0esIqWF-Pu34nup",
  "edits": [
    { "find": "旧术语", "replace": "新术语" },
    { "find": "原来的段落文字", "replace": "修改后的段落文字" }
  ]
}
```

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

**为支持「局部修改」功能，需额外提供按 slug 获取与更新的接口：**

在博客中创建 `/app/api/mcp/posts/[slug]/route.ts`（或等价动态路由），并实现：

- **GET** `/api/mcp/posts/[slug]`  
  - 校验 `x-mcp-secret`，返回该 slug 对应文章，至少包含 `slug`、`content`（及可选 `title`、`tags` 等）。  
  - 用于 MCP 先读取文章再在本地做 find/replace。

- **PATCH** `/api/mcp/posts/[slug]`  
  - 校验 `x-mcp-secret`，请求体为 JSON，仅包含要更新的字段（如 `content`、`title`、`tags` 等）。  
  - 只更新传入的字段，未传字段保持不变；更新后建议更新 `lastModified`。  
  - 返回如 `{ slug, message: "ok" }`。

这样 MCP 工具 `patch_blog_post` 会：先 GET 该文章 → 在内存中对 `content` 按 `edits` 做 find/replace → 再 PATCH 回 `content`，实现局部修改。

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

## 🔧 搭建 MCP 服务的要点

基于本项目实现，以下是搭建一个 MCP 服务的核心要点：

### 1. **实现 JSON-RPC 2.0 协议**

MCP 基于 JSON-RPC 2.0 协议，需要实现标准的请求/响应格式：

```typescript
// 请求格式
interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: any;
}

// 响应格式
interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: any;
  error?: { code: number; message: string };
}
```

### 2. **实现核心 MCP 方法**

必须实现以下标准方法：

- **`initialize`**: 初始化握手，返回服务器能力和版本信息
- **`tools/list`**: 列出所有可用的工具
- **`tools/call`**: 执行具体的工具调用

```typescript
switch (method) {
  case "initialize":
    // 返回协议版本、能力和服务器信息
    break;
  case "tools/list":
    // 返回所有工具的定义
    break;
  case "tools/call":
    // 执行工具并返回结果
    break;
}
```

### 3. **定义工具（Tools）**

每个工具需要定义：
- `name`: 工具名称
- `description`: 工具描述（AI 会根据描述决定是否使用）
- `inputSchema`: JSON Schema 格式的输入参数定义

```typescript
export const tools: Record<string, MCPTool> = {
  my_tool: {
    name: "my_tool",
    description: "工具的功能描述",
    inputSchema: {
      type: "object",
      properties: {
        param1: { type: "string", description: "参数说明" }
      },
      required: ["param1"]
    }
  }
};
```

### 4. **使用 stdio 通信**

MCP 服务器通过标准输入输出（stdio）与客户端通信：

```typescript
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (line) => {
  const request = JSON.parse(line);
  // 处理请求并输出 JSON 响应
  console.log(JSON.stringify(response));
});
```

### 5. **配置管理**

- 使用环境变量存储敏感信息（密钥、URL 等）
- 支持命令行参数覆盖环境变量
- 验证必需配置项

```typescript
export function parseConfig(): MCPConfig {
  const config = {
    apiUrl: process.env.API_URL,
    secret: process.env.MCP_SECRET,
    // ...
  };
  
  // 验证必需参数
  if (!config.apiUrl) {
    throw new Error('API_URL 是必需的');
  }
  
  return config;
}
```

### 6. **错误处理**

完善的错误处理机制：

```typescript
try {
  // 执行工具逻辑
  const result = await executeTool(params);
  this.sendResponse(id, result);
} catch (error) {
  this.sendResponse(
    id, 
    undefined, 
    error instanceof Error ? error.message : String(error)
  );
}
```

### 7. **安全性考虑**

- **认证机制**: 使用共享密钥或签名验证
- **时间戳验证**: 防止重放攻击
- **客户端白名单**: 限制允许的客户端
- **环境变量**: 敏感信息不硬编码

### 8. **响应格式**

工具调用成功时，返回标准的内容格式：

```typescript
{
  content: [{
    type: "text",
    text: "操作结果描述"
  }]
}
```

### 9. **项目配置**

在 `package.json` 中配置：

```json
{
  "bin": {
    "your-mcp-server": "dist/index.js"
  },
  "main": "dist/index.js",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 10. **客户端配置**

在 Cursor 的 `~/.cursor/mcp.json` 中配置：

```json
{
  "Your MCP Server": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "your-package@latest"],
    "env": {
      "API_URL": "https://your-api.com",
      "MCP_SECRET": "your_secret"
    }
  }
}
```

### 关键要点总结

1. ✅ **协议标准**: 严格遵循 JSON-RPC 2.0 和 MCP 协议规范
2. ✅ **工具定义**: 清晰描述工具功能和参数，便于 AI 理解和使用
3. ✅ **通信方式**: 使用 stdio 进行进程间通信
4. ✅ **配置灵活**: 支持环境变量和命令行参数
5. ✅ **错误处理**: 完善的错误捕获和响应机制
6. ✅ **安全性**: 多层安全验证机制
7. ✅ **可发布**: 打包为 npm 包，支持 npx 直接运行

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