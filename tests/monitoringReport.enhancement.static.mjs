import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const reportDir = join(here, '..', 'components', 'report');
const monitoring = readFileSync(join(reportDir, 'MonitoringReport.tsx'), 'utf8');
const topicFlow = readFileSync(join(reportDir, 'TopicFlowAnalysis.tsx'), 'utf8');
let flowDetailModal = '';
try {
  flowDetailModal = readFileSync(join(reportDir, 'FlowDetailModal.tsx'), 'utf8');
} catch {
  throw new Error('Expected Flow detail popup to be extracted into FlowDetailModal.tsx');
}
const report = [
  'MonitoringReport.tsx',
  'CallAnalysisTab.tsx',
  'TopicFlowAnalysis.tsx',
  'FlowDetailModal.tsx',
  'ToolTransferTab.tsx',
  'reportUi.tsx',
  'mockData.ts',
]
  .map(file => readFileSync(join(reportDir, file), 'utf8'))
  .join('\n');
const types = readFileSync(join(here, '..', 'types.ts'), 'utf8');

const requiredLabels = [
  '综合运营报表',
  '通话统计',
  '业务与流程分析',
  '工具调用',
  'Topic 主题分析',
  'Flow 流程分析',
  'Step 明细',
  '边 / 分支明细',
  '完成率',
  '平均流程时长',
  'SortableHeader',
  'ReportTablePagination',
  'EmptyTableState',
  'LoadingBlock',
  '上一页',
  '下一页',
  '暂无数据',
  '正在加载报表数据',
  '刷新',
  '搜索',
  '每页',
  '直接播报次数',
  '直接播报成功率',
  '调模型回复次数',
  '节省模型次数',
  '关联机器人',
  '转人工率',
];

for (const label of requiredLabels) {
  if (!report.includes(label)) {
    throw new Error(`Expected report module to include ${label}`);
  }
}

const requiredTypes = [
  'TopicAnalysisReport',
  'FlowFunnelReport',
  'ToolCallReport',
  'TransferReport',
  'CallAnalysisData',
  'EntityQualityReport',
];

for (const typeName of requiredTypes) {
  if (!types.includes(`interface ${typeName}`)) {
    throw new Error(`Expected report type ${typeName}`);
  }
  if (!report.includes(typeName)) {
    throw new Error(`Expected report module to reference ${typeName}`);
  }
}

const forbiddenEntrySnippets = [
  'TAB_OPTIONS',
  'SECTION_LINKS',
  'activeTab',
  'scrollToSection',
  '<RealtimeReportTab',
  '<AlertCenterPanel',
  '<SubscriptionPanel',
  '实时监控',
  '异常告警中心',
  '报表订阅',
];

for (const snippet of forbiddenEntrySnippets) {
  if (monitoring.includes(snippet)) {
    throw new Error(`MonitoringReport should not include ${snippet}`);
  }
}

const forbiddenTopicFlowSnippets = [
  '只看流程执行表现；展开后查看 Step 明细和边 / 分支明细。',
  '结束率',
  '到达结束节点量',
  '中途离开量',
  '下一步到达量',
  '下一步到达率',
  '趋势',
  '代表原话',
  '最高卡点步骤',
];

for (const snippet of forbiddenTopicFlowSnippets) {
  if (topicFlow.includes(snippet)) {
    throw new Error(`Topic/Flow analysis should not include ${snippet}`);
  }
}

const requiredFlowDetailSnippets = [
  'FLOW_DETAIL_PAGE_SIZE',
  'StepSortKey',
  'EdgeSortKey',
  'FlowDetailSearchInput',
  'placeholder={isStep ? \'搜索 Step 名称 / 类型\' : \'搜索起点 / 终点 / 条件\'}',
  'ReportTablePagination',
  'max-h-[52vh] overflow-auto',
  'sticky top-0 z-10',
  '当前搜索没有命中的 Step。',
  '当前搜索没有命中的边或分支。',
  'Escape',
];

for (const snippet of requiredFlowDetailSnippets) {
  if (!flowDetailModal.includes(snippet)) {
    throw new Error(`Flow detail popup should include production detail capability: ${snippet}`);
  }
}

const forbiddenFlowDetailSnippets = [
  'overflow-auto bg-slate-50/70 p-5',
  'rounded-xl border border-slate-200 bg-white shadow-sm',
  '<StepTable flow={detail.flow} />',
  '<EdgeTable flow={detail.flow} />',
];

for (const snippet of forbiddenFlowDetailSnippets) {
  if (topicFlow.includes(snippet) || flowDetailModal.includes(snippet)) {
    throw new Error(`Flow detail popup should avoid nested large-card/small-card layout: ${snippet}`);
  }
}

const forbiddenRemovedReportBlocks = [
  '当前口径',
  '清空筛选',
  '最近更新',
  '全部业务线',
  '实体提取质量',
  '参数校验漏斗',
  '转人工分析',
  '客户主动放弃量',
  '占线',
  '拒接',
];

for (const snippet of forbiddenRemovedReportBlocks) {
  if (report.includes(snippet)) {
    throw new Error(`Report should not include removed block or filter: ${snippet}`);
  }
}

const forbiddenToolCellSnippets = [
  '关联机器人 {tool.botCount} 个',
  '成功率 {formatRate(tool.directPlaySuccessRate)}',
  '节省 {tool.savedModelCalls} 次',
];

for (const snippet of forbiddenToolCellSnippets) {
  if (report.includes(snippet)) {
    throw new Error(`Tool report should split nested cell info into standalone columns: ${snippet}`);
  }
}

const requiredTrendSemantics = [
  'CallDirectionFilter',
  'getTrendConfig',
  "callDirection === '呼入'",
  "secondaryLabel: '有效接待量'",
  "callDirection === '外呼'",
  "secondaryLabel: '接通量'",
  'inboundEffective',
  'outboundConnected',
];

for (const snippet of requiredTrendSemantics) {
  if (!report.includes(snippet) && !types.includes(snippet)) {
    throw new Error(`Expected call trend direction semantics to include ${snippet}`);
  }
}

console.log('monitoring report enhancement static check ok');
