import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'html',
      value: '<a class="menu__link docs-sidebar-return" href="/" aria-label="返回语音智能体主系统"><span aria-hidden="true">←</span> 返回主系统</a>',
    },
    {
      type: 'category',
      label: '快速开始',
      items: [
        'getting-started/activation',
      ],
    },
    {
      type: 'category',
      label: '配置指南',
      items: [
        'configuration/basic-settings',
        'configuration/conversation-policy',
        'configuration/variables',
        'configuration/business-analysis',
        'configuration/model-testing',
        'configuration/knowledge-retrieval',
        'configuration/advanced-settings',
      ],
    },
    {
      type: 'category',
      label: '外呼任务',
      items: [
        'outbound/outbound-template',
        'outbound/outbound-task',
        'outbound/contact-list',
      ],
    },
    {
      type: 'category',
      label: 'API 参考',
      items: [
        'api/api-reference',
      ],
    },
    {
      type: 'category',
      label: '常见问题',
      items: [
        'faq/troubleshooting',
        'faq/faq',
      ],
    },
    {
      type: 'doc',
      label: '术语表',
      id: 'glossary',
    },
    {
      type: 'doc',
      label: '编写指南',
      id: 'doc-guide',
    },
  ],
};

export default sidebars;
