// 检查细粒度打断策略、旧配置兼容和重复开关清理是否完整。
import fs from 'node:fs';

const policySource = fs.readFileSync(new URL('../components/bot/InterruptionPolicyControl.tsx', import.meta.url), 'utf8');
const basicSource = fs.readFileSync(new URL('../components/bot/BotBasicConfig.tsx', import.meta.url), 'utf8');
const strategySource = fs.readFileSync(new URL('../components/bot/BotStrategyConfig.tsx', import.meta.url), 'utf8');
const typesSource = fs.readFileSync(new URL('../types.ts', import.meta.url), 'utf8');

for (const text of ['允许打断', '有效表达次数', '次后打断', '未触发时将在播报结束后继续处理']) {
  if (!policySource.includes(text)) throw new Error(`缺少打断策略内容：${text}`);
}

if (!policySource.includes('<Switch')) throw new Error('打断策略应使用开关控件');

for (const field of ['globalInterruptionMode?', 'globalInterruptionRounds?', 'welcomeInterruptionMode?', 'welcomeInterruptionRounds?']) {
  if (!typesSource.includes(field)) throw new Error(`缺少打断策略字段：${field}`);
}

if (!basicSource.includes('label="全局打断策略"')) throw new Error('ASR 原位置缺少全局打断策略');
if (!strategySource.includes('label="开场白打断策略"')) throw new Error('开场白原位置缺少打断策略');
if (!basicSource.includes("config.asrInterruptible === false ? 'never' : 'always'")) throw new Error('全局打断未兼容旧版开关');
if (!strategySource.includes("config.welcomeMessageInterruptible === false ? 'never' : 'always'")) throw new Error('开场白打断未兼容旧版开关');

console.log('interruption policies static check ok');
