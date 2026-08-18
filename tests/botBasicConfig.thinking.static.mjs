// 检查基础配置是否提供模型思考开关，并保留旧配置默认关闭的兼容逻辑。
import fs from 'node:fs';

const source = fs.readFileSync('components/bot/BotBasicConfig.tsx', 'utf8');
const types = fs.readFileSync('types.ts', 'utf8');

for (const snippet of [
  '开启思考',
  'config.thinkingEnabled ?? false',
  "updateField('thinkingEnabled', value)",
]) {
  if (!source.includes(snippet)) {
    throw new Error(`BotBasicConfig 缺少模型思考配置：${snippet}`);
  }
}

if (!types.includes('thinkingEnabled?: boolean')) {
  throw new Error('types.ts 缺少 thinkingEnabled 配置字段');
}

console.log('bot basic thinking config static check ok');
