// 检查基础配置是否提供精简的双模协同与思考强度，并隐藏不适合普通用户的模型参数。
import fs from 'node:fs';

const source = fs.readFileSync('components/bot/BotBasicConfig.tsx', 'utf8');
const types = fs.readFileSync('types.ts', 'utf8');

for (const snippet of [
  '双模协同',
  'aria-label="思考强度"',
  '关闭',
  '轻度',
  '深度',
  '最大',
  'config.dualModelEnabled ?? false',
  "config.thinkingLevel ?? 'off'",
  "updateField('thinkingLevel', level.value)",
]) {
  if (!source.includes(snippet)) {
    throw new Error(`BotBasicConfig 缺少模型思考配置：${snippet}`);
  }
}

if (!types.includes("export type ThinkingLevel = 'off' | 'low' | 'high' | 'max';")) {
  throw new Error('types.ts 缺少 ThinkingLevel 类型');
}
if (!types.includes('thinkingLevel?: ThinkingLevel;')) {
  throw new Error('types.ts 缺少 thinkingLevel 配置字段');
}
if (!types.includes('dualModelEnabled?: boolean')) {
  throw new Error('types.ts 缺少双模协同开关字段');
}
// 旧字段仅用于兼容历史配置，仍需保留但不再由组件读写。
if (!types.includes('thinkingEnabled?: boolean')) {
  throw new Error('types.ts 缺少兼容字段 thinkingEnabled');
}

for (const removed of ['上下文压缩', '温度 (Temperature)', '核采样 (Top-P)', '思考模式']) {
  if (source.includes(removed)) {
    throw new Error(`BotBasicConfig 仍展示已删除配置：${removed}`);
  }
}

console.log('bot basic thinking config static check ok');
