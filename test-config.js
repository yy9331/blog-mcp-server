#!/usr/bin/env node

/**
 * 测试配置是否正确加载
 */

const { parseConfig } = require('./dist/config');

try {
  console.log('🔍 测试配置加载...');
  
  const config = parseConfig();
  
  console.log('✅ 配置加载成功！');
  console.log('📋 配置详情:');
  console.log(`  博客地址: ${config.blogUrl}`);
  console.log(`  客户端ID: ${config.clientId}`);
  console.log(`  密钥: ${config.secret ? '已配置' : '未配置'}`);
  console.log(`  签名密钥: ${config.signatureSecret ? '已配置' : '未配置'}`);
  
  console.log('\n🚀 配置验证通过，可以启动 MCP 服务器！');
  
} catch (error) {
  console.error('❌ 配置加载失败:', error.message);
  console.log('\n💡 请检查 .env 文件配置是否正确');
  process.exit(1);
}