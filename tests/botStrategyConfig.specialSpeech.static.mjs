import fs from 'node:fs';

const source = fs.readFileSync('components/bot/BotStrategyConfig.tsx', 'utf8');
const types = fs.readFileSync('types.ts', 'utf8');

for (const snippet of [
  '通道确认话术',
  '未听清话术',
  'normalizeSpeechList',
  'updateSpeechItem',
  'addSpeechItem',
  'removeSpeechItem',
  '添加话术',
]) {
  if (!source.includes(snippet)) {
    throw new Error(`BotStrategyConfig 缺少特殊话术配置：${snippet}`);
  }
}

for (const snippet of ['channelCheckSpeech?: string | string[];', 'unclearSpeech?: string | string[];']) {
  if (!types.includes(snippet)) {
    throw new Error(`types.ts 缺少特殊话术字段：${snippet}`);
  }
}

for (const snippet of [
  "value={config.channelCheckSpeech || ''}",
  "value={config.unclearSpeech || ''}",
]) {
  if (source.includes(snippet)) {
    throw new Error(`BotStrategyConfig 仍在使用单个大文本框：${snippet}`);
  }
}

console.log('bot strategy special speech static check ok');
