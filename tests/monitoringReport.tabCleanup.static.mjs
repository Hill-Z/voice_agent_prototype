import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const monitoring = readFileSync(join(root, 'components', 'report', 'MonitoringReport.tsx'), 'utf8');
const callAnalysis = readFileSync(join(root, 'components', 'report', 'CallAnalysisTab.tsx'), 'utf8');
const business = readFileSync(join(root, 'components', 'report', 'TopicFlowAnalysis.tsx'), 'utf8');
const flow = readFileSync(join(root, 'components', 'report', 'TopicFlowAnalysis.tsx'), 'utf8');
const toolTransfer = readFileSync(join(root, 'components', 'report', 'ToolTransferTab.tsx'), 'utf8');
const reportTypes = readFileSync(join(root, 'types.ts'), 'utf8');

const forbiddenMonitoringSnippets = [
  "label: '通话明细'",
  "id: 'calls'",
  "<CallDetailsTab",
  "setActiveTab('calls')",
  'TAB_OPTIONS',
  'SECTION_LINKS',
  'activeTab',
  'scrollToSection',
  '<RealtimeReportTab',
  '<AlertCenterPanel',
  '<SubscriptionPanel',
  '<BusinessReportTab',
  '<FlowAnalysisTab',
  'FlowBusinessReport',
  '经营报表',
  '实时监控',
  '当前通话中',
  '并发占用趋势',
];

for (const snippet of forbiddenMonitoringSnippets) {
  if (monitoring.includes(snippet)) {
    throw new Error(`MonitoringReport should not include ${snippet}`);
  }
}

if (callAnalysis.includes('中位通话时长') || callAnalysis.includes('medianDuration')) {
  throw new Error('CallAnalysisTab should not show median call duration');
}

const forbiddenBusinessSnippets = [
  '业务完成率',
  '失败量',
  '失败原因 TOP',
  'completionRate',
  'failedCount',
  'topFailureReason',
];

for (const snippet of forbiddenBusinessSnippets) {
  if (business.includes(snippet)) {
    throw new Error(`BusinessReportTab should not include ${snippet}`);
  }
}

const forbiddenFlowSnippets = [
  '主要流失节点',
  '流失原因列表',
  '流程漏斗：',
  '业务与流程统计',
  '业务 / 流程节点',
  '关联流程：',
  'rounded-xl border p-4',
  '转人工总量',
  '到达完成',
  '整体通过率',
  '主要人工入口',
];

for (const snippet of forbiddenFlowSnippets) {
  if (flow.includes(snippet)) {
    throw new Error(`FlowAnalysisTab should not include ${snippet}`);
  }
}

const forbiddenTransferSnippets = [
  '转人工成功率',
  '转人工后解决率',
  '平均排队',
  '排队挂断',
  'transferReport.successRate',
  'solvedAfterTransferRate',
  'avgQueueSeconds',
  'queueHangup',
  'queueBands',
];

for (const snippet of forbiddenTransferSnippets) {
  if (toolTransfer.includes(snippet) || reportTypes.includes(snippet)) {
    throw new Error(`ToolTransferTab/types should not include ${snippet}`);
  }
}

if (monitoring.includes('当前空闲坐席') || monitoring.includes('idleSeats') || reportTypes.includes('idleSeats')) {
  throw new Error('Report entry should not include idle seat data');
}

console.log('monitoring report tab cleanup static check ok');
