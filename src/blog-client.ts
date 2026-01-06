// 使用原生 fetch API
import crypto from 'crypto';
import { BlogPostData, SecureBlogPostData, MCPConfig } from './types';

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
    const response = await fetch(`${this.config.blogUrl}/api/tags`, {
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
}