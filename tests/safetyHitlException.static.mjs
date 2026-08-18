// 检查安全护栏、工具分级和全局/Step 异常配置入口。
import fs from 'node:fs';

const strategy = fs.readFileSync('components/bot/BotStrategyConfig.tsx', 'utf8');
const tool = fs.readFileSync('components/bot/agent/AgentToolModal.tsx', 'utf8');
const step = fs.readFileSync('components/flow/FlowNodeConfig.tsx', 'utf8');
const guard = fs.readFileSync('services/voiceSafetyGuard.ts', 'utf8');
const policy = fs.readFileSync('services/toolExecutionPolicy.ts', 'utf8');
const types = fs.readFileSync('types.ts', 'utf8');

for (const text of ['安全护栏', '协议护栏', '控制标签处理', '敏感信息处理', '安全兜底话术']) {
  if (!strategy.includes(text)) throw new Error(`安全护栏缺少：${text}`);
}
for (const text of ['异常处理', '全局兜底动作', '连续异常上限', '节点配置了异常处理时优先执行节点策略']) {
  if (!strategy.includes(text)) throw new Error(`全局异常策略缺少：${text}`);
}
for (const text of ['调用控制', '默认执行方式', '用户确认后执行', '人工审批后执行', '添加规则', '判断参数', '目标 IVR']) {
  if (!tool.includes(text)) throw new Error(`工具分级配置缺少：${text}`);
}
for (const text of ['异常处理', '跟随全局策略', '当前 Step 单独处理', '异常动作', 'goto_node', 'exceptionPolicy']) {
  if (!step.includes(text)) throw new Error(`Step 异常覆盖缺少：${text}`);
}
for (const text of ['processVoiceSafetyChunk', 'suppressedTag', '#Transfer[', '#Hangup[', 'state.pending']) {
  if (!guard.includes(text)) throw new Error(`安全解析器缺少：${text}`);
}
if (!policy.includes('evaluateToolExecution') || !policy.includes('matchedRuleId')) {
  throw new Error('工具执行策略缺少规则评估入口');
}
for (const text of ['ToolExecutionLevel', 'ToolExecutionRule', 'GlobalExceptionPolicy', 'StepExceptionPolicy', 'SafetyGuardrailConfig']) {
  if (!types.includes(text)) throw new Error(`类型定义缺少：${text}`);
}

console.log('safety, HITL and exception static check ok');
