import React from 'react';
import { renderToString } from 'react-dom/server';
import ToolConfigPage from '../components/tools/ToolConfigPage';

const html = renderToString(<ToolConfigPage />);

for (const text of ['工具配置', '添加工具', '添加 MCP']) {
  if (!html.includes(text)) {
    throw new Error(`Expected ToolConfigPage to render section: ${text}`);
  }
}

if (html.includes('使用提示')) {
  throw new Error('Expected ToolConfigPage to remove usage hint block');
}

console.log('tool config render ok');
