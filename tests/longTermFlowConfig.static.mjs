import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const flowDir = join(root, 'components', 'flow');

const requiredFiles = [
  'LongTermFlowConfig.tsx',
  'LongTermFlowList.tsx',
  'LongTermFlowDesigner.tsx',
  'LongTermFlowDesignerPanels.tsx',
  'LongTermFlowCanvasParts.tsx',
  'longTermFlowDesignerUtils.ts',
  'LongTermFlowRuns.tsx',
  'longTermFlowData.ts',
  'longTermFlowTypes.ts',
];

for (const file of requiredFiles) {
  const absolutePath = join(flowDir, file);
  if (!existsSync(absolutePath)) {
    throw new Error(`Expected flow config module file to exist: ${file}`);
  }
}

const app = readFileSync(join(root, 'App.tsx'), 'utf8');
const moduleSource = requiredFiles
  .map((file) => readFileSync(join(flowDir, file), 'utf8'))
  .join('\n');
const docs = ['README.md', 'ARCHITECTURE.md', 'CONTEXT.md']
  .map((file) => readFileSync(join(root, file), 'utf8'))
  .join('\n');

const requiredAppSnippets = [
  "import LongTermFlowConfig from './components/flow/LongTermFlowConfig'",
  "case '流程配置':",
  '<LongTermFlowConfig',
];

for (const snippet of requiredAppSnippets) {
  if (!app.includes(snippet)) {
    throw new Error(`Expected App.tsx to include ${snippet}`);
  }
}

const requiredProductLabels = [
  '流程配置',
  '流程方案列表',
  '流程编排',
  '运行任务',
  '流程画布',
  '系统调度',
  '用户沟通 Agent',
  '商家协商 Agent',
  '风控决策 Agent',
  '人工处理',
  '催收三轮跟进',
  '外卖退款协商',
  '等待 3 天',
  '等待 7 天',
  '等待商家回复',
  '承诺还款',
  '自动退款',
  '转人工审核',
  '试运行',
  '今日待触发',
  '异常待处理',
  '运行中任务',
  '节点配置',
  '失败兜底',
  '重试次数',
];

for (const label of requiredProductLabels) {
  if (!moduleSource.includes(label)) {
    throw new Error(`Expected flow config module to include product label: ${label}`);
  }
}

const requiredEngineeringSnippets = [
  'searchTerm',
  'statusFilter',
  'scenarioFilter',
  'sortConfig',
  'pageSize',
  'currentPage',
  'filteredFlows',
  'paginatedFlows',
  'aria-label',
  'overflow-x-auto',
  '暂无匹配的流程方案',
  'LongTermFlowStatus',
  'LongTermFlowNodeType',
  'LongTermFlowRunStatus',
  'LongTermFlowEdge',
  'getFlowSummary',
  'sortLongTermFlows',
  'filterLongTermFlows',
  'validateFlowDefinition',
  'localStorage',
  'FLOW_STORAGE_KEY',
  'RUN_STORAGE_KEY',
  'LONG_TERM_FLOW_RUNS_BY_FLOW_ID',
  'runsByFlowId',
];

for (const snippet of requiredEngineeringSnippets) {
  if (!moduleSource.includes(snippet)) {
    throw new Error(`Expected flow config module to include engineering capability: ${snippet}`);
  }
}

const requiredCanvasSnippets = [
  'draggable',
  'onDragStart',
  'onDragOver',
  'onDrop',
  'draggedNodeId',
  'handleNodeMouseDown',
  'handleCanvasMouseMove',
  'connectionDraft',
  'handleConnectorMouseDown',
  'handleNodeMouseUp',
  'svg',
  'markerEnd',
  'selectedEdgeId',
  'EdgeConfigPanel',
  'PanelLeftClose',
  'PanelLeftOpen',
  'configDrawerOpen',
  '流程完整性校验',
  '执行说明',
  '可用动作',
  '流转动作',
  '字段统计',
  '人工交接摘要',
  'onDeleteNode',
  'handleDeleteNode',
  'renderNodeTypeFields',
  '恢复条件',
  '条件构建器',
  '工具调用配置',
  'waitRule',
  'conditionRule',
  'toolCall',
  '默认分支',
];

for (const snippet of requiredCanvasSnippets) {
  if (!moduleSource.includes(snippet)) {
    throw new Error(`Expected enterprise flow canvas capability: ${snippet}`);
  }
}

const forbiddenDisplaySnippets = [
  '当前连接',
  '长期任务流程配置可把外呼、等待、条件判断、多 Agent 协作和人工兜底串成可运营的任务流',
  '长期任务流程配置',
  '管理跨多天、多次触达和多 Agent 协作的业务流程；先看运行状态，再进入泳道式流程配置。',
  '拖拽形态后续接入，这里先展示真实节点模型。',
  '首呼后根据承诺还款日期自动等待、检查和再次外呼，最终异常转人工。',
  '已连接',
  '任务流程配置负责长期任务',
  '设计说明',
  '设计口径',
  '流程方案同时管理调度',
  '用于验证等待、分支',
];

for (const snippet of forbiddenDisplaySnippets) {
  if (moduleSource.includes(snippet)) {
    throw new Error(`Flow config UI should not include planning/demo copy: ${snippet}`);
  }
}

const forbiddenSnippets = [
  'any;',
  ': any',
  'border-l-4',
  'border-r-4',
  'background-clip: text',
  '只为 Demo',
  '后续接入',
  'Array.isArray(record.runs)',
  'flow.runs',
  'runs: collectionRuns',
  'runs: refundRuns',
  "onEdgeChange({ ...edge, source",
  "onEdgeChange({ ...edge, target",
];

for (const snippet of forbiddenSnippets) {
  if (moduleSource.includes(snippet)) {
    throw new Error(`Flow config module should avoid ${snippet}`);
  }
}

const requiredDocs = [
  '任务流程配置',
  '多 Agent',
  '拖拽',
  '连线',
];

for (const snippet of requiredDocs) {
  if (!docs.includes(snippet)) {
    throw new Error(`Expected project docs to mention ${snippet}`);
  }
}

console.log('long-term flow config static check ok');


