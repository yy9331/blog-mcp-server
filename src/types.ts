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