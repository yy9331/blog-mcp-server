#!/usr/bin/env node

import { parseConfig } from './config';
import { BlogClient } from './blog-client';
import { MCPServer } from './mcp-server';

async function main() {
  try {
    // 解析配置
    const config = parseConfig();
    
    // 创建博客客户端
    const blogClient = new BlogClient(config);
    
    // 创建并启动 MCP 服务器
    const server = new MCPServer(blogClient);
    server.start();
    
  } catch (error) {
    console.error('启动失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();