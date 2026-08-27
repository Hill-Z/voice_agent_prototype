// 检查实时监控、预警规则和需求文档是否覆盖第一期核心能力。
import fs from 'node:fs';

const app = fs.readFileSync('App.tsx', 'utf8');
const sidebar = fs.readFileSync('components/ui/LayoutComponents.tsx', 'utf8');
const page = fs.readFileSync('components/report/RealtimeMonitoringPage.tsx', 'utf8');
const data = fs.readFileSync('components/report/realtimeMonitoringData.ts', 'utf8');
const doc = fs.readFileSync('docs/实时监控与预警需求.md', 'utf8');

const requirements = [
  [app, "case '实时监控'", '页面路由'],
  [sidebar, "label: '实时监控'", '侧边栏入口'],
  [page, '监控预警', '监控与预警页签'],
  [page, 'P95 响应耗时', '核心耗时指标'],
  [page, '正常完成率', '正常完成率指标'],
  [page, '异常率', '异常率指标'],
  [page, '转人工率', '转人工指标'],
  [page, '今日概览', '今日累计指标'],
  [page, '呼入量', '呼入指标'],
  [page, '呼出量', '呼出指标'],
  [page, '今日通话趋势', '通话趋势'],
  [page, '今日工具运行趋势', '工具趋势'],
  [page, '工具成功率', '机器人工具健康'],
  [page, '实时通话', '实时通话列表'],
  [page, '新建告警规则', '规则配置'],
  [page, '只生成一条活动告警', '告警合并'],
  [data, "'concurrency_rate'", '并发预警'],
  [data, "'function_errors'", '工具错误预警'],
  [data, "'function_success_rate'", '工具成功率预警'],
  [data, "'handoff_count'", '转人工量预警'],
  [data, "'inbound_volume'", '呼入量预警'],
  [data, "'outbound_volume'", '呼出量预警'],
  [data, "schedule: 'all_day'", '告警生效时间'],
  [doc, '4/5，必做', '竞品交集依据'],
  [doc, '## 五、边界', '范围边界'],
  [doc, '至少有 20 通已结束通话', '比例指标最小样本'],
  [doc, '至少有 50 次已结束调用', '工具指标最小样本'],
];

for (const [content, snippet, name] of requirements) {
  if (!content.includes(snippet)) throw new Error(`实时监控缺少${name}：${snippet}`);
}

console.log('realtime monitoring static check ok');
