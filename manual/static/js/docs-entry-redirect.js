// 直接访问文档根路径时进入快速开始正文，避免停留在独立欢迎页。
(function redirectDocsEntry() {
  const normalizedPath = window.location.pathname.replace(/\/+$/, '');
  if (normalizedPath === '/docs') {
    window.location.replace('/docs/getting-started/activation/');
  }
})();
