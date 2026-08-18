// 检查主题匹配设置的默认值、文案、数据字段和折叠交互是否齐全。
import fs from 'node:fs';

const component = fs.readFileSync('components/bot/TopicMatchingSettings.tsx', 'utf8');
const manager = fs.readFileSync('components/bot/BotTopicManager.tsx', 'utf8');
const types = fs.readFileSync('types.ts', 'utf8');
const app = fs.readFileSync('App.tsx', 'utf8');

const componentSnippets = [
  '主题匹配设置',
  '历史对话辅助匹配',
  '历史消息条数',
  '参考最近的机器人和用户消息',
  '上一轮主题优先匹配',
  '不匹配时再识别其他主题',
  'aria-expanded={expanded}',
  'useState<boolean>(false)',
];

const fieldSnippets = [
  'historyConversationEnabled',
  'historyConversationCount',
  'previousTopicPriorityEnabled',
];

for (const snippet of componentSnippets) {
  if (!component.includes(snippet)) {
    throw new Error(`主题匹配设置缺少内容：${snippet}`);
  }
}

for (const snippet of fieldSnippets) {
  if (!types.includes(snippet) || !manager.includes(snippet)) {
    throw new Error(`主题匹配配置字段未完整接入：${snippet}`);
  }
}

if (!app.includes('historyConversationEnabled: true') || !app.includes('historyConversationCount: 3')) {
  throw new Error('历史对话辅助匹配默认值不正确');
}

if (!app.includes('previousTopicPriorityEnabled: false')) {
  throw new Error('上一轮主题优先匹配应默认关闭');
}

console.log('topic matching settings static check ok');
