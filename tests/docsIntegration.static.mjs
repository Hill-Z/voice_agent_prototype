// 检查操作手册子项目、/docs 构建路径和主系统双向入口是否完整。
import fs from 'node:fs';

const rootPackage = fs.readFileSync('package.json', 'utf8');
const docsPackage = fs.readFileSync('manual/package.json', 'utf8');
const docsConfig = fs.readFileSync('manual/docusaurus.config.ts', 'utf8');
const docsSidebar = fs.readFileSync('manual/sidebars.ts', 'utf8');
const docsStyles = fs.readFileSync('manual/src/css/custom.css', 'utf8');
const layout = fs.readFileSync('components/ui/LayoutComponents.tsx', 'utf8');
const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
const writingGuide = fs.readFileSync('manual/docs/doc-guide.md', 'utf8');

const checks = [
  [rootPackage, '"workspaces"'],
  [rootPackage, '"manual"'],
  [rootPackage, '"build:docs"'],
  [docsPackage, 'docusaurus build --out-dir ../public/docs'],
  [docsConfig, "baseUrl: '/docs/'"],
  [docsConfig, "routeBasePath: '/'"],
  [docsConfig, '返回主系统'],
  [docsConfig, 'href="/"'],
  [docsConfig, 'docs-return-link'],
  [docsSidebar, 'docs-sidebar-return'],
  [docsSidebar, 'href="/"'],
  [docsStyles, '.theme-doc-sidebar-menu > li:first-child'],
  [layout, "label: '帮助与支持'"],
  [layout, "label: '操作手册'"],
  [layout, "href: '/docs/getting-started/activation/'"],
  [viteConfig, "pathname === '/docs'"],
  [viteConfig, "'/docs/getting-started/activation/'"],
  [viteConfig, "pathname.startsWith('/docs/')"],
  [viteConfig, 'const documentPath'],
  [writingGuide, 'manual/docs/'],
  [writingGuide, 'manual/sidebars.ts'],
  [writingGuide, 'manual/static/img/'],
  [docsConfig, "'@easyops-cn/docusaurus-search-local'"],
  [docsConfig, "language: ['en', 'zh']"],
  [docsConfig, "defaultLocale: 'zh-Hans'"],
  [docsConfig, 'highlightSearchTermsOnTargetPage: true'],
];

for (const [source, snippet] of checks) {
  if (!source.includes(snippet)) {
    throw new Error(`操作手册融合缺少配置：${snippet}`);
  }
}

const requiredDocs = [
  'manual/docs/getting-started/activation.md',
  'manual/docs/configuration/basic-settings.md',
  'manual/docs/outbound/outbound-task.md',
  'manual/docs/api/api-reference.md',
];

for (const file of requiredDocs) {
  if (!fs.existsSync(file)) {
    throw new Error(`操作手册缺少文档：${file}`);
  }
}

console.log('docs integration static check ok');
