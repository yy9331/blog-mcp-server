# Blog MCP Server

<div align="center">

[README.md for Chinese version](./README.md) 

</div>

> Private MCP Server - Let AI assistants create articles directly in your tech blog

This is a private MCP (Model Context Protocol) server customized for your blog, allowing AI assistants (such as Cursor, Claude, etc.) to create articles directly in your tech blog without manual editing.

## 🎯 Project Features

- 🔒 **Private Service** - Customized for your blog, not publicly available
- 🚀 **Automated Creation** - AI can create complete blog articles directly
- 📝 **Markdown Support** - Full Markdown format support
- 🏷️ **Tag Management** - Automatic creation and management of article tags
- 🔐 **Security Authentication** - Multi-layer security verification mechanism
- 📦 **npm Package** - Can be installed directly via npx
- ⚡ **Real-time Publishing** - Articles are immediately visible after creation

## 🚀 Quick Start

### 1. Configure in Cursor

Add the following configuration to your Cursor settings file `~/.cursor/mcp.json`:

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

### 2. Restart Cursor

After configuration, restart Cursor to activate the new MCP server.

### 3. Start Using

Use directly in Cursor:

```
Please create an article about React Hooks in my blog
```

## 🛠️ Available Tools

### create_blog_post
Create a single blog article

**Parameters:**
- `title` (string): Article title (required)
- `content` (string): Article content, supports Markdown (required)
- `tags` (array): Article tags (optional)
- `author` (string): Author name (optional)
- `readTime` (number): Estimated reading time in minutes (optional)
- `date` (string): Publication date (ISO 8601 format) (optional)
- `github_url` (string): Related GitHub link (optional)
- `slug` (string): Custom article slug (optional)

### create_multiple_blog_posts
Create multiple blog articles in batch

**Parameters:**
- `articles` (array): Array of articles to create

## 🔒 Security Features

- **Shared Secret Authentication** - Uses pre-configured keys for basic authentication
- **Timestamp Verification** - Prevents replay attacks
- **Signature Verification** - Optional additional security layer
- **Client Whitelist** - Restricts allowed client access
- **Environment Variable Management** - All sensitive information stored in environment variables

## 🏗️ Blog End Configuration

### 1. API Endpoint

Create `/app/api/mcp/posts/route.ts` in your Next.js blog project:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const secret = process.env.MCP_SHARED_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  // Basic secret verification
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

  // Client whitelist verification
  const allowedClients = process.env.MCP_ALLOWED_CLIENTS?.split(',') || [];
  if (allowedClients.length > 0 && body.client_id && !allowedClients.includes(body.client_id)) {
    return NextResponse.json({ error: 'Client not authorized' }, { status: 403 });
  }

  // Article creation logic...
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

### 2. Environment Variable Configuration

Configure the following environment variables in Vercel:

```bash
# MCP Authentication Configuration
MCP_SHARED_SECRET=your_shared_secret_here
MCP_CLIENT_ID=your_client_id
MCP_SIGNATURE_SECRET=your_signature_secret
MCP_ALLOWED_CLIENTS=client1,client2,client3

# Supabase Configuration
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Middleware Configuration

Ensure `middleware.ts` excludes API routes:

```typescript
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|categories|post/|write|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

## 🧪 Testing

### Local Testing

```bash
# Build project
npm run build

# Start MCP server
npm start

# Test configuration
npm test
```

### API Testing

```bash
curl -X POST https://your-blog.com/api/mcp/posts \
  -H "Content-Type: application/json" \
  -H "x-mcp-secret: your_shared_secret_here" \
  -d '{
    "title": "Test Article",
    "content": "This is a test article",
    "client_id": "your_client_id"
  }'
```

## 📁 Project Structure

```
src/
├── index.ts          # Main entry file
├── types.ts          # Type definitions
├── config.ts         # Configuration parsing
├── blog-client.ts    # Blog API client
└── mcp-server.ts     # MCP server implementation
```

## 🚨 Important Notes

1. **Private Service** - This is a private service customized for your blog, not publicly available
2. **Key Security** - All sensitive information is stored in environment variables, do not commit to code repository
3. **Regular Updates** - It's recommended to regularly rotate signature keys
4. **Local Testing** - It's recommended to test functionality in local environment first

## 🎉 Usage Examples

After configuration, you can use it in Cursor like this:

### Create Single Article
```
Please create an article about TypeScript in my blog with the title "TypeScript Best Practices"
```

### Create Multiple Articles
```
Please create three articles about React in my blog:
1. React Hooks Deep Dive
2. React Performance Optimization
3. React State Management
```

## 📄 License

MIT License - See [LICENSE](./LICENSE) file for details

---

**Note**: This is a private MCP service customized for your blog. All sensitive configuration information is stored in environment variables to ensure security.
