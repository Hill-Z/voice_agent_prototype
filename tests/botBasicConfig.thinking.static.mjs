// 检查基础配置的模型参数是否齐备：主模型（温度、核采样、思考强度）、双模协同开关、快模型独立参数与过渡话术。
// 温度和核采样在 2026-09-19 曾被移除界面，2026-09-22 按要求恢复，因此它们不再属于「已删除配置」。
import fs from 'node:fs';

const source = fs.readFileSync('components/bot/BotBasicConfig.tsx', 'utf8');
const types = fs.readFileSync('types.ts', 'utf8');

for (const snippet of [
  '双模协同',
  'aria-label="主模型思考强度"',
  '关闭',
  '轻度',
  '深度',
  '最大',
  'config.dualModelEnabled ?? false',
  "config.thinkingLevel ?? 'off'",
  "updateField('thinkingLevel', level.value)",
  // 温度和核采样恢复后的入口，必须走紧凑滑条，否则四个参数会把区块撑高一大截。
  'compact label="温度"',
  'compact label="Top-P"',
  "updateField('temperature', value)",
  "updateField('topP', value)",
  // 快模型与过渡话术。
  // 主模型名称固定，不随双模协同开关在「大模型类型」与「主模型」之间切换。
  'label="主模型"',
  '主模型思考强度',
  '快模型',
  '过渡话术',
  'config.fastModelType ?? ModelType.GEMINI_FLASH',
  'config.transitionPhrases ?? DEFAULT_TRANSITION_PHRASES',
  "updateField('fastModelType', e.target.value as ModelType)",
]) {
  if (!source.includes(snippet)) {
    throw new Error(`BotBasicConfig 缺少模型配置：${snippet}`);
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
if (!types.includes('fastModelType?: ModelType')) {
  throw new Error('types.ts 缺少快模型字段 fastModelType');
}
if (!types.includes('transitionPhrases?: string[]')) {
  throw new Error('types.ts 缺少过渡话术字段 transitionPhrases');
}
if (!types.includes('export const DEFAULT_TRANSITION_PHRASES')) {
  throw new Error('types.ts 缺少过渡话术预置值');
}
// 旧字段仅用于兼容历史配置，仍需保留但不再由组件读写。
if (!types.includes('thinkingEnabled?: boolean')) {
  throw new Error('types.ts 缺少兼容字段 thinkingEnabled');
}

// 上下文压缩与旧版「思考模式」仍在移除之列，本轮只恢复温度和核采样。
for (const removed of ['上下文压缩', '思考模式']) {
  if (source.includes(removed)) {
    throw new Error(`BotBasicConfig 仍展示已删除配置：${removed}`);
  }
}

// 主模型的名称必须固定：同一个模型不能随开关在「大模型类型」和「主模型」之间改名，
// 否则客户分不清它和「快模型」的关系。注意 ASR 模型名里合法地含有「大模型」字样，所以只锁定这个完整旧称。
if (source.includes('大模型类型')) {
  throw new Error('BotBasicConfig 不应再出现「大模型类型」，主模型名称需固定');
}

// 过渡话术是选填的，删空后不能再被默认值填回来，读取必须用 ?? 而不是 ||。
if (!source.includes('config.transitionPhrases ?? DEFAULT_TRANSITION_PHRASES')) {
  throw new Error('过渡话术读取必须用 ?? 兜底，用 || 会把客户删空的话术填回预置值');
}

console.log('bot basic thinking config static check ok');
