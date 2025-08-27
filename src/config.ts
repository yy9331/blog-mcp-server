import { MCPConfig } from './types';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

export function parseConfig(): MCPConfig {
  const args = process.argv.slice(2);
  
  // 从环境变量获取默认配置
  const config: Partial<MCPConfig> = {
    blogUrl: process.env.BLOG_URL,
    secret: process.env.MCP_SECRET,
    clientId: process.env.MCP_CLIENT_ID || 'blog-mcp-client',
    signatureSecret: process.env.MCP_SIGNATURE_SECRET
  };

  // 命令行参数覆盖环境变量
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[i + 1];
      
      switch (key) {
        case 'blog-url':
          config.blogUrl = value;
          break;
        case 'secret':
          config.secret = value;
          break;
        case 'client-id':
          config.clientId = value;
          break;
        case 'signature-secret':
          config.signatureSecret = value;
          break;
        case 'local':
          // 使用本地开发环境
          config.blogUrl = process.env.BLOG_LOCAL_URL || 'http://localhost:3000';
          break;
      }
    }
  }

  // 验证必需参数
  if (!config.blogUrl) {
    throw new Error('BLOG_URL 环境变量或 --blog-url 参数是必需的');
  }
  if (!config.secret) {
    throw new Error('MCP_SECRET 环境变量或 --secret 参数是必需的');
  }

  return config as MCPConfig;
}