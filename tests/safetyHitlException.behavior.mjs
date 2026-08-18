import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

const projectRoot = path.resolve('C:/Users/13609/.trae-cn/AI-voice-bot');

async function loadTsModule(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  const source = await fs.readFile(absolutePath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
      esModuleInterop: true,
    },
    fileName: absolutePath,
  });
  const url = `data:text/javascript;charset=utf-8,${encodeURIComponent(outputText)}`;
  return import(url);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const guard = await loadTsModule('services/voiceSafetyGuard.ts');
const policy = await loadTsModule('services/toolExecutionPolicy.ts');

// 1) 流式安全解析：跨 chunk 的 think/sync 不入稿，未知/未闭合标签不泄漏。
{
  let state = guard.createVoiceSafetyState();
  const speechPieces = [];
  const actions = [];
  const chunks = [
    '开头 hello <thi',
    'nk>内部思考</think> 中段 <sync>同步内容',
    '</sync> 结尾 <custom>丢弃</custom> 再来 #Transfer[ivr:1918335] 和 #Transfer[1918336] #Hangup[end]',
  ];

  chunks.forEach((chunk, index) => {
    const result = guard.processVoiceSafetyChunk(state, chunk, index === chunks.length - 1);
    state = result.state;
    speechPieces.push(result.speech);
    actions.push(...result.actions);
  });

  const speech = speechPieces.join('');
  assert(speech.includes('hello'), '应保留普通话术');
  assert(speech.includes('中段'), '应保留普通话术');
  assert(speech.includes('结尾'), '应保留普通话术');
  assert(!speech.includes('内部思考'), 'think 内容不应进入 TTS');
  assert(!speech.includes('同步内容'), 'sync 内容不应进入 TTS');
  assert(!speech.includes('<custom>'), '未知标签不应泄漏');
  assert(!speech.includes('</custom>'), '未知闭合标签不应泄漏');
  assert(actions.length === 3, '应提取两条转人工和一条挂机动作');
  assert(actions[0].type === 'transfer' && actions[0].target === '1918335', 'Transfer[ivr:...] 应兼容并提取目标 IVR');
  assert(actions[1].type === 'transfer' && actions[1].target === '1918336', 'Transfer[<id>] 应兼容并提取目标 IVR');
  assert(actions[2].type === 'hangup', '应提取 Hangup 动作');
}

// 2) 未闭合标签在最终输出时应被丢弃，不应卡住或泄漏。
{
  const result = guard.sanitizeVoiceModelOutput('开始 <think>只说一半');
  assert(result.speech === '开始 ', '未闭合标签内容不应输出');
  assert(result.actions.length === 0, '纯文本不应产生动作');
}

// 3) 工具规则按参数声明类型判断：数字参数按数值比较，字符串参数只做精确等值。
{
  const tool = {
    id: 'refund_tool',
    name: 'refund',
    description: 'refund',
    type: 'API',
    parameters: [
      { name: 'amount', type: 'number', description: '金额', required: true },
      { name: 'orderId', type: 'string', description: '订单号', required: true },
      { name: 'retryCount', type: 'INTEGER', description: '重试次数', required: false },
    ],
    executionLevel: 'auto',
    executionRules: [
      { id: 'r1', parameterName: 'amount', operator: 'lte', compareValue: '500', action: 'user_confirm' },
      { id: 'r2', parameterName: 'amount', operator: 'gt', compareValue: '500', action: 'human_approval' },
      { id: 'r3', parameterName: 'orderId', operator: 'eq', compareValue: '00123', action: 'human_only' },
      { id: 'r4', parameterName: 'orderId', operator: 'gt', compareValue: '100', action: 'human_approval' },
      { id: 'r5', parameterName: 'retryCount', operator: 'gte', compareValue: '3', action: 'human_approval' },
    ],
  };

  const lowAmount = policy.evaluateToolExecution(tool, { amount: '500', orderId: '123' });
  assert(lowAmount.level === 'user_confirm' && lowAmount.matchedRuleId === 'r1', '金额 500 应命中数值规则');

  const highAmount = policy.evaluateToolExecution(tool, { amount: '1200', orderId: '123' });
  assert(highAmount.level === 'human_approval' && highAmount.matchedRuleId === 'r2', '金额 1200 应命中高金额规则');

  const exactOrder = policy.evaluateToolExecution(tool, { amount: 'not-a-number', orderId: '00123' });
  assert(exactOrder.level === 'human_only' && exactOrder.matchedRuleId === 'r3', '字符串订单号应按精确等值匹配');

  const nonMatchOrder = policy.evaluateToolExecution(tool, { amount: 'not-a-number', orderId: '100' });
  assert(nonMatchOrder.level === 'auto', '字符串字段不应按数值范围匹配');

  const defaultResult = policy.evaluateToolExecution(tool, { amount: 'not-a-number', orderId: '00001' });
  assert(defaultResult.level === 'auto', '非数字金额不应命中数值规则');

  const upperCaseInteger = policy.evaluateToolExecution(tool, { amount: 'not-a-number', orderId: '00001', retryCount: '3' });
  assert(upperCaseInteger.level === 'human_approval' && upperCaseInteger.matchedRuleId === 'r5', 'INTEGER 类型应按数值规则匹配');
}

console.log('safety guard and tool execution behavior ok');
