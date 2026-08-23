// 主项目构建配置，同时为内置操作手册提供 /docs 入口映射。
import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// 将开发和预览环境中的 /docs 请求映射到文档站首页。
const docsEntryPlugin = (): Plugin => ({
  name: 'voice-agent-docs-entry',
  // 开发环境的 /docs 由实时文档服务处理；这里只适配正式构建后的预览服务。
  configurePreviewServer(server) {
    server.middlewares.use((request, response, next) => {
      const [pathname, query] = (request.url || '').split('?');
      if (pathname === '/docs' || pathname === '/docs/') {
        response.statusCode = 302;
        response.setHeader('Location', '/docs/getting-started/activation/');
        response.end();
        return;
      }
      if (pathname.startsWith('/docs/') && !path.extname(pathname)) {
        const documentPath = `${pathname.replace(/\/+$/, '')}/index.html`;
        request.url = query ? `${documentPath}?${query}` : documentPath;
      }
      next();
    });
  },
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 8080,
        host: '0.0.0.0',
        proxy: {
          // 开发时交由文档服务处理 /docs，实现 Markdown 保存后自动刷新。
          '/docs': {
            target: 'http://127.0.0.1:5174',
            changeOrigin: true,
            ws: true,
          },
          // 转发文档服务的热更新连接，让浏览器在 Markdown 保存后立即刷新。
          '/ws': {
            target: 'ws://127.0.0.1:5174',
            ws: true,
          },
        },
      },
      plugins: [docsEntryPlugin(), react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
