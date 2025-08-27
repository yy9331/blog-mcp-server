import readline from 'readline';
import { MCPRequest, MCPResponse, MCPTool } from './types';
import { BlogClient } from './blog-client';
import { tools } from './tools';

export class MCPServer {
  private rl: readline.Interface;
  private blogClient: BlogClient;

  constructor(blogClient: BlogClient) {
    this.blogClient = blogClient;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  private sendResponse(id: string | number, result?: any, error?: string): void {
    const response: MCPResponse = {
      jsonrpc: "2.0",
      id,
      result: error ? undefined : result,
      error: error ? { code: -1, message: error } : undefined
    };
    console.log(JSON.stringify(response));
  }

  private async handleRequest(request: MCPRequest): Promise<void> {
    try {
      const { id, method, params } = request;

      switch (method) {
        case "initialize":
          this.sendResponse(id, {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: "blog-mcp-server",
              version: "1.0.0"
            }
          });
          break;

        case "tools/list":
          this.sendResponse(id, {
            tools: Object.values(tools).map(tool => ({
              name: tool.name,
              description: tool.description,
              inputSchema: tool.inputSchema
            }))
          });
          break;

        case "tools/call":
          const { name, arguments: args } = params;
          
          if (name === "create_blog_post") {
            const result = await this.blogClient.createBlogPost(args);
            this.sendResponse(id, { 
              content: [{ 
                type: "text", 
                text: `文章创建成功！\n\n标题: ${result.slug}\n状态: ${result.message}\n\n文章已发布到你的博客。` 
              }] 
            });
          } else if (name === "create_multiple_blog_posts") {
            const result = await this.blogClient.createMultipleBlogPosts(args.articles);
            const successCount = result.filter((r: any) => r.success).length;
            const failCount = result.length - successCount;
            
            this.sendResponse(id, { 
              content: [{ 
                type: "text", 
                text: `批量创建完成！\n\n成功: ${successCount} 篇\n失败: ${failCount} 篇\n\n详细信息: ${JSON.stringify(result, null, 2)}` 
              }] 
            });
          } else {
            this.sendResponse(id, undefined, `未知工具: ${name}`);
          }
          break;

        default:
          this.sendResponse(id, undefined, `未知方法: ${method}`);
      }
    } catch (error) {
      this.sendResponse(
        request.id, 
        undefined, 
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  start(): void {
    this.rl.on('line', (line) => {
      try {
        if (!line.trim()) return;
        const request: MCPRequest = JSON.parse(line);
        this.handleRequest(request);
      } catch (error) {
        // 忽略解析错误
      }
    });

    // 发送初始化通知
    console.log(JSON.stringify({
      jsonrpc: "2.0",
      method: "notifications/initialized",
      params: {}
    }));
  }
}