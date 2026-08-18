import {themes as prismThemes} from 'prism-react-renderer';
import type {ConfigOptions} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: ConfigOptions = {
  title: '语音智能体文档',
  tagline: '语音智能体产品操作手册',
  favicon: 'img/microphone-logo.svg',

  url: process.env.DOCS_SITE_URL || 'http://localhost',
  baseUrl: '/docs/',

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  onBrokenLinks: 'throw',

  scripts: [
    {
      src: '/docs/js/docs-entry-redirect.js',
    },
    {
      src: '/docs/js/image-lightbox.js',
      defer: true,
    },
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: {
          showReadingTime: true,
          blogTitle: '语音智能体博客',
          blogDescription: '语音智能体产品更新日志',
          postsPerPage: 10,
          blogSidebarTitle: '最近文章',
          blogSidebarCount: 'ALL',
          onInlineAuthors: 'ignore',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['en', 'zh'],
        docsRouteBasePath: '/',
        indexBlog: false,
        indexPages: false,
        highlightSearchTermsOnTargetPage: true,
        searchResultLimits: 8,
        searchResultContextMaxLength: 80,
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: '操作手册',
      logo: {
        alt: '语音智能体 Logo',
        src: 'img/microphone-logo.svg',
      },
      items: [
        {
          type: 'html',
          value: '<a class="navbar__item navbar__link docs-return-link" href="/" aria-label="返回语音智能体主系统"><span aria-hidden="true">←</span> 返回主系统</a>',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '文档',
          items: [
            {
              label: '快速开始',
              to: '/docs/getting-started/activation',
            },
            {
              label: '配置指南',
              to: '/docs/configuration/basic-settings',
            },
          ],
        },
        {
          title: '支持',
          items: [
            {
              label: '常见问题',
              to: '/docs/faq/',
            },
            {
              label: '故障排查',
              to: '/docs/faq/troubleshooting',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} 语音智能体团队 · 操作手册`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      defaultLanguage: 'bash',
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
