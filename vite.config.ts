// 主项目构建配置，同时为内置操作手册提供 /docs 入口映射。
import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// 将开发和预览环境中的 /docs 请求映射到文档站首页。
const docsEntryPlugin = (): Plugin => ({
  name: 'voice-agent-docs-entry',
  configureServer(server) {
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
