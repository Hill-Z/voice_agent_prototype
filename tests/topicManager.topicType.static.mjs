import fs from 'node:fs';

const source = fs.readFileSync('components/bot/BotTopicManager.tsx', 'utf8');
const types = fs.readFileSync('types.ts', 'utf8');

const requiredSourceSnippets = [
  '主题类型',
  '流程主题',
  '普通主题',
  '绑定流程',
  '普通主题配置',
  'isFlowTopic',
  "topicType: 'flow'",
  "topicType: 'normal'",
  "linkedFlowId: isFlowTopic ? linkedFlowId : ''",
  "prompt: isFlowTopic ? ''",
  "tools: isFlowTopic ? []",
  "entities: isFlowTopic ? []",
  "flows: isFlowTopic ? [linkedFlowId] : []",
  'availableFlows={[]}',
  "updateEditingTopic('flows', value ? [value] : [])",
  '转人工与挂机判断',
  '转人工判断提示词',
  '目标 IVR',
  '挂机判断提示词',
  '转人工话术',
  '挂机话术',
  "updateEditingTopic('transferDecisionPrompt'",
  "updateEditingTopic('transferIvrTarget'",
  "updateEditingTopic('hangupDecisionPrompt'",
  "updateEditingTopic('transferSpeeches'",
  "updateEditingTopic('hangupSpeeches'",
  "transferDecisionPrompt: isFlowTopic ? '' : editingTopic.transferDecisionPrompt",
  "transferIvrTarget: isFlowTopic ? '' : editingTopic.transferIvrTarget",
  "hangupDecisionPrompt: isFlowTopic ? '' : editingTopic.hangupDecisionPrompt",
  "transferSpeeches: isFlowTopic ? [] : editingTopic.transferSpeeches",
  "hangupSpeeches: isFlowTopic ? [] : editingTopic.hangupSpeeches",
];

const requiredTypeSnippets = [
  "topicType?: 'normal' | 'flow'",
  'linkedFlowId?: string',
  'transferDecisionPrompt?: string',
  'transferIvrTarget?: string',
  'hangupDecisionPrompt?: string',
  'transferSpeeches?: string | string[]',
  'hangupSpeeches?: string | string[]',
];

const forbiddenFlowSectionSnippets = [
  "isFlowTopic && <PromptEditor",
  "isFlowTopic && renderSelectedChips(editingTopic.tools",
  "isFlowTopic && renderSelectedChips(editingTopic.entities",
  "toggleTopicArrayValue('flows'",
  "availableFlows={(config.flowConfig",
  '流程主题只负责把用户问题路由到指定 Flow',
  '一一对应',
];

for (const snippet of requiredSourceSnippets) {
  if (!source.includes(snippet)) {
    throw new Error(`BotTopicManager 缺少文案或逻辑：${snippet}`);
  }
}

for (const snippet of requiredTypeSnippets) {
  if (!types.includes(snippet)) {
    throw new Error(`types.ts 缺少主题类型字段：${snippet}`);
  }
}

for (const snippet of forbiddenFlowSectionSnippets) {
  if (source.includes(snippet)) {
    throw new Error(`流程主题不应展示普通主题配置：${snippet}`);
  }
}

console.log('topic manager topic type static check ok');
