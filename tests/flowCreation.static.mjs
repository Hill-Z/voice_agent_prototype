// 检查 Flow 新建流程仅保留名称，且不再使用描述作为模型提示。
import fs from 'node:fs';

const form = fs.readFileSync('components/bot/BotConfigForm.tsx', 'utf8');
const panel = fs.readFileSync('components/flow/FlowConfigPanel.tsx', 'utf8');
const studio = fs.readFileSync('components/flow/FlowStudio.tsx', 'utf8');

for (const text of ['const createFlow = () =>', 'setEditingFlowId(newFlow.id)', 'setFlowEditMode(true)', '搜索 Flow 名称', '编辑</button>']) {
  if (!form.includes(text)) throw new Error(`Flow 新建交互缺少：${text}`);
}

for (const text of ['flowInfoMode', 'flowInfoDraft', 'Flow 描述 / 大模型提示词', 'metadata?.description']) {
  if (form.includes(text)) throw new Error(`Flow 列表仍保留描述交互：${text}`);
}

if (panel.includes('Flow 说明') || panel.includes('metadata?.description') || panel.includes('<Label label="Flow 名称"')) throw new Error('Flow 编辑侧栏仍保留名称或描述输入');
if (studio.includes('补充这个 Flow 的职责')) throw new Error('Flow 新建默认值仍包含描述');
if (!studio.includes('flowName={activeFlow.name}') || !studio.includes('onFlowNameChange')) throw new Error('Flow 画布顶部缺少名称编辑');

console.log('flow creation static check ok');
