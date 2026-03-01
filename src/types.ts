export interface BlogPostData {
  title: string;
  content: string;
  tags?: string[];
  author?: string;
  readTime?: number;
  date?: string;
  github_url?: string;
  slug?: string;
}

/** 博客 API 返回的单篇文章（用于 GET） */
export interface BlogPost extends BlogPostData {
  slug: string;
}

/** 局部修改：在文章内容中把 find 替换为 replace（可多次） */
export interface ContentEdit {
  find: string;
  replace: string;
}

/** PATCH 文章时只传要更新的字段 */
export interface PatchPostData {
  content?: string;
  title?: string;
  tags?: string[];
  author?: string;
  readTime?: number;
  github_url?: string;
}

export interface SecureBlogPostData extends BlogPostData {
  client_id: string;
  timestamp: number;
  signature?: string;
}

export interface MCPConfig {
  blogUrl: string;
  secret: string;
  clientId: string;
  signatureSecret?: string;
}

export interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}