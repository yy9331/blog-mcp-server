import { MCPTool } from './types';

export const tools: Record<string, MCPTool> = {
  create_blog_post: {
    name: "create_blog_post",
    description: "在你的技术博客中创建新文章",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "文章标题"
        },
        content: {
          type: "string", 
          description: "文章内容，支持 Markdown 格式"
        },
        tags: {
          type: "array",
          items: {
            type: "string"
          },
          description: "文章标签数组"
        },
        author: {
          type: "string",
          description: "作者名称"
        },
        readTime: {
          type: "number",
          description: "预计阅读时间（分钟）"
        },
        date: {
          type: "string",
          description: "发布日期（ISO 8601 格式）"
        },
        github_url: {
          type: "string",
          description: "相关的 GitHub 链接"
        },
        slug: {
          type: "string",
          description: "自定义文章 slug（可选）"
        }
      },
      required: ["title", "content"]
    }
  },
  create_multiple_blog_posts: {
    name: "create_multiple_blog_posts",
    description: "批量创建多篇博客文章",
    inputSchema: {
      type: "object",
      properties: {
        articles: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "文章标题"
              },
              content: {
                type: "string",
                description: "文章内容（Markdown 格式）"
              },
              tags: {
                type: "array",
                items: {
                  type: "string"
                },
                description: "文章标签"
              },
              author: {
                type: "string",
                description: "作者名称"
              },
              readTime: {
                type: "number",
                description: "阅读时间（分钟）"
              },
              date: {
                type: "string",
                description: "发布日期"
              },
              github_url: {
                type: "string",
                description: "GitHub 链接"
              },
              slug: {
                type: "string",
                description: "自定义 slug"
              }
            },
            required: ["title", "content"]
          },
          description: "要创建的文章数组"
        }
      },
      required: ["articles"]
    }
  },
  get_all_tags: {
    name: "get_all_tags",
    description: "查询博客中所有的标签（tags）",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  patch_blog_post: {
    name: "patch_blog_post",
    description: "根据文章 URL 读取文章内容后做局部修改（不整篇替换）。传入文章链接和若干「查找-替换」对，只修改匹配到的部分。",
    inputSchema: {
      type: "object",
      properties: {
        article_url: {
          type: "string",
          description: "文章完整 URL，例如 https://www.zyzy.info/post/Qvk4wF0esIqWF-Pu34nup，或直接传文章 slug"
        },
        edits: {
          type: "array",
          description: "局部修改列表，按顺序对文章内容执行：每项把 find 的文本替换为 replace",
          items: {
            type: "object",
            properties: {
              find: {
                type: "string",
                description: "要查找的原文（会全部替换为 replace）"
              },
              replace: {
                type: "string",
                description: "替换后的新内容"
              }
            },
            required: ["find", "replace"]
          }
        }
      },
      required: ["article_url", "edits"]
    }
  }
};