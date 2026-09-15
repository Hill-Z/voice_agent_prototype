// 检查基础配置是否提供精简的思考模式，并隐藏不适合普通用户的模型参数。
import fs from 'node:fs';

const source = fs.readFileSync('components/bot/BotBasicConfig.tsx', 'utf8');
const types = fs.readFileSync('types.ts', 'utf8');

for (const snippet of [
  '思考模式',
  'aria-label="思考强度"',
  '轻度',
  '深度',
  '最大',
  'config.thinkingEnabled ?? false',
  "updateField('thinkingLevel', level.value)",
]) {
  if (!source.includes(snippet)) {
    throw new Error(`BotBasicConfig 缺少模型思考配置：${snippet}`);
  }
}

if (!types.includes('thinkingEnabled?: boolean')) {
  throw new Error('types.ts 缺少 thinkingEnabled 配置字段');
}
if (!types.includes("thinkingLevel?: 'low' | 'high' | 'max'")) {
  throw new Error('types.ts 缺少 thinkingLevel 配置字段');
}

for (const removed of ['上下文压缩', '温度 (Temperature)', '核采样 (Top-P)']) {
  if (source.includes(removed)) {
    throw new Error(`BotBasicConfig 仍展示已删除配置：${removed}`);
  }
}

console.log('bot basic thinking config static check ok');
