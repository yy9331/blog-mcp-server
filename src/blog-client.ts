// 使用原生 fetch API
import crypto from 'crypto';
import { BlogPostData, SecureBlogPostData, MCPConfig, BlogPost, PatchPostData, ContentEdit } from './types';

export class BlogClient {
  private config: MCPConfig;

  constructor(config: MCPConfig) {
    this.config = config;
  }

  private generateSignature(data: SecureBlogPostData): string {
    if (!this.config.signatureSecret) {
      throw new Error('签名密钥未配置');
    }
    
    return crypto
      .createHmac('sha256', this.config.signatureSecret)
      .update(JSON.stringify({ ...data, signature: undefined }))
      .digest('hex');
  }

  async createBlogPost(postData: BlogPostData): Promise<any> {
    const secureData: SecureBlogPostData = {
      ...postData,
      client_id: this.config.clientId,
      timestamp: Date.now(),
    };

    if (this.config.signatureSecret) {
      secureData.signature = this.generateSignature(secureData);
    }

    const response = await fetch(`${this.config.blogUrl}/api/mcp/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-mcp-secret': this.config.secret,
      },
      body: JSON.stringify(secureData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  }

  async createMultipleBlogPosts(articles: BlogPostData[]): Promise<any[]> {
    const results = [];
    for (const article of articles) {
      try {
        const result = await this.createBlogPost(article);
        results.push({ success: true, ...result });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
    return results;
  }

  async getAllTags(): Promise<string[]> {
    const response = await fetch(`${this.config.blogUrl}/api/mcp/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-mcp-secret': this.config.secret,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data: any = await response.json();
    // 假设API返回格式为 { tags: string[] } 或直接返回 string[]
    return Array.isArray(data) ? data : (data.tags || []);
  }

  /** 从文章 URL 或 slug 解析出 slug，例如 https://www.zyzy.info/post/xxx -> xxx */
  static parseSlugFromArticleUrl(articleUrl: string): string {
    const trimmed = articleUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const pathname = new URL(trimmed).pathname;
      const segments = pathname.split('/').filter(Boolean);
      const slug = segments.pop();
      if (!slug) throw new Error(`无法从 URL 解析 slug: ${articleUrl}`);
      return slug;
    }
    return trimmed;
  }

  /** 根据 slug 获取单篇文章（用于读取后局部修改） */
  async getPostBySlug(slug: string): Promise<BlogPost> {
    const response = await fetch(`${this.config.blogUrl}/api/mcp/posts/${encodeURIComponent(slug)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-mcp-secret': this.config.secret,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    if (!data.slug || data.content === undefined) {
      throw new Error('API 返回格式无效，需要包含 slug 和 content');
    }
    return data as unknown as BlogPost;
  }

  /** 对文章内容应用局部修改（按 find/replace 依次替换），返回新内容 */
  static applyContentEdits(content: string, edits: ContentEdit[]): string {
    let result = content;
    for (const { find, replace } of edits) {
      result = result.split(find).join(replace);
    }
    return result;
  }

  /** 局部更新文章（只提交变更的字段，如 content） */
  async patchPost(slug: string, payload: PatchPostData): Promise<{ slug: string; message: string }> {
    const response = await fetch(`${this.config.blogUrl}/api/mcp/posts/${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-mcp-secret': this.config.secret,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return (await response.json()) as { slug: string; message: string };
  }

  /** 读取文章后按 edits 做局部修改并写回 */
  async patchBlogPostByUrl(articleUrl: string, edits: ContentEdit[]): Promise<{ slug: string; message: string }> {
    const slug = BlogClient.parseSlugFromArticleUrl(articleUrl);
    const post = await this.getPostBySlug(slug);
    const newContent = BlogClient.applyContentEdits(post.content, edits);
    return this.patchPost(slug, { content: newContent });
  }
}