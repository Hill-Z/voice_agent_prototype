// 实时监控原型数据：统一提供看板指标、机器人状态、实时通话、告警规则和告警记录。
export type MonitorMetricKey = 'concurrency_rate' | 'call_volume' | 'inbound_volume' | 'outbound_volume' | 'pickup_rate' | 'completion_rate' | 'error_rate' | 'latency_p95' | 'handoff_count' | 'handoff_rate' | 'function_call_volume' | 'function_success_rate' | 'function_latency_p95' | 'function_errors' | 'transfer_failures';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface MonitorBotRow {
  id: string;
  name: string;
  activeCalls: number;
  concurrencyUsed: number;
  concurrencyLimit: number;
  successRate: number;
  errorRate: number;
  latencyP95: number;
  handoffRate: number;
  todayCalls: number;
  toolSuccessRate: number;
  status: 'healthy' | 'warning' | 'offline';
}

export interface LiveCallRow {
  id: string;
  phone: string;
  botName: string;
  direction: '呼入' | '外呼';
  durationSeconds: number;
  currentStep: string;
  latencyMs: number;
  status: '通话中' | '转人工中' | '异常';
}

export interface AlertRule {
  id: string;
  name: string;
  scope: string;
  metric: MonitorMetricKey;
  comparator: 'gt' | 'lt';
  threshold: number;
  windowMinutes: number;
  schedule: 'all_day' | 'bot_working_hours';
  severity: AlertSeverity;
  channel: 'email' | 'webhook' | 'wechat' | 'dingtalk';
  recipients: string;
  enabled: boolean;
}

export interface MonitorAlertRecord {
  id: string;
  triggeredAt: string;
  recoveredAt?: string;
  ruleName: string;
  botName: string;
  metricLabel: string;
  observedValue: string;
  thresholdText: string;
  severity: AlertSeverity;
  status: 'active' | 'acknowledged' | 'recovered';
}

export const METRIC_OPTIONS: Array<{ key: MonitorMetricKey; label: string; unit: string; defaultComparator: 'gt' | 'lt'; defaultThreshold: number }> = [
  { key: 'concurrency_rate', label: '并发使用率', unit: '%', defaultComparator: 'gt', defaultThreshold: 80 },
  { key: 'call_volume', label: '通话量', unit: '通', defaultComparator: 'lt', defaultThreshold: 10 },
  { key: 'inbound_volume', label: '呼入量', unit: '通', defaultComparator: 'lt', defaultThreshold: 10 },
  { key: 'outbound_volume', label: '呼出量', unit: '通', defaultComparator: 'lt', defaultThreshold: 10 },
  { key: 'pickup_rate', label: '接通率', unit: '%', defaultComparator: 'lt', defaultThreshold: 70 },
  { key: 'completion_rate', label: '通话正常完成率', unit: '%', defaultComparator: 'lt', defaultThreshold: 85 },
  { key: 'error_rate', label: '异常率', unit: '%', defaultComparator: 'gt', defaultThreshold: 5 },
  { key: 'latency_p95', label: 'P95 响应耗时', unit: 'ms', defaultComparator: 'gt', defaultThreshold: 2500 },
  { key: 'handoff_rate', label: '转人工率', unit: '%', defaultComparator: 'gt', defaultThreshold: 30 },
  { key: 'handoff_count', label: '转人工量', unit: '通', defaultComparator: 'gt', defaultThreshold: 50 },
  { key: 'function_call_volume', label: '工具调用量', unit: '次', defaultComparator: 'lt', defaultThreshold: 10 },
  { key: 'function_success_rate', label: '工具调用成功率', unit: '%', defaultComparator: 'lt', defaultThreshold: 95 },
  { key: 'function_latency_p95', label: '工具 P95 响应耗时', unit: 'ms', defaultComparator: 'gt', defaultThreshold: 2000 },
  { key: 'function_errors', label: '工具调用失败数', unit: '次', defaultComparator: 'gt', defaultThreshold: 5 },
  { key: 'transfer_failures', label: '转人工失败数', unit: '次', defaultComparator: 'gt', defaultThreshold: 3 },
];

export const MONITOR_BOTS: MonitorBotRow[] = [
  { id: 'bot_didi', name: '滴滴出行智能客服', activeCalls: 42, concurrencyUsed: 45, concurrencyLimit: 60, successRate: 93.8, errorRate: 1.6, latencyP95: 1680, handoffRate: 11.8, todayCalls: 1682, toolSuccessRate: 98.4, status: 'healthy' },
  { id: 'bot_after_sale', name: '电商售后机器人', activeCalls: 31, concurrencyUsed: 34, concurrencyLimit: 50, successRate: 88.4, errorRate: 4.7, latencyP95: 2380, handoffRate: 18.9, todayCalls: 1294, toolSuccessRate: 94.7, status: 'warning' },
  { id: 'bot_claim', name: '保险理赔助手', activeCalls: 22, concurrencyUsed: 24, concurrencyLimit: 40, successRate: 91.2, errorRate: 2.3, latencyP95: 1920, handoffRate: 15.6, todayCalls: 1126, toolSuccessRate: 97.6, status: 'healthy' },
  { id: 'bot_card', name: '银行信用卡服务', activeCalls: 17, concurrencyUsed: 18, concurrencyLimit: 30, successRate: 94.5, errorRate: 1.2, latencyP95: 1430, handoffRate: 9.7, todayCalls: 926, toolSuccessRate: 99.1, status: 'healthy' },
];

export const LIVE_CALLS: LiveCallRow[] = [
  { id: 'call_rt_004', phone: '138****9231', botName: '电商售后机器人', direction: '呼入', durationSeconds: 186, currentStep: '订单查询 / 调用接口', latencyMs: 3210, status: '异常' },
  { id: 'call_rt_001', phone: '139****1208', botName: '滴滴出行智能客服', direction: '呼入', durationSeconds: 92, currentStep: '行程查询 / 核对手机号', latencyMs: 1240, status: '通话中' },
  { id: 'call_rt_002', phone: '186****5510', botName: '保险理赔助手', direction: '外呼', durationSeconds: 130, currentStep: '理赔回访 / 收集结果', latencyMs: 1760, status: '通话中' },
  { id: 'call_rt_003', phone: '177****4318', botName: '银行信用卡服务', direction: '呼入', durationSeconds: 210, currentStep: '账单查询 / 转人工', latencyMs: 1580, status: '转人工中' },
];

export const MONITOR_TREND = [
  { time: '10:00', calls: 78, latency: 1.38, errors: 1.2 }, { time: '10:05', calls: 86, latency: 1.42, errors: 1.4 },
  { time: '10:10', calls: 92, latency: 1.51, errors: 1.3 }, { time: '10:15', calls: 101, latency: 1.59, errors: 1.7 },
  { time: '10:20', calls: 108, latency: 1.71, errors: 2.1 }, { time: '10:25', calls: 112, latency: 1.84, errors: 2.4 },
];

export const TODAY_CALL_TREND = [
  { time: '08:00', inbound: 186, outbound: 92, handoffs: 24 }, { time: '10:00', inbound: 482, outbound: 218, handoffs: 61 },
  { time: '12:00', inbound: 731, outbound: 376, handoffs: 102 }, { time: '14:00', inbound: 986, outbound: 518, handoffs: 146 },
  { time: '16:00', inbound: 1284, outbound: 706, handoffs: 207 }, { time: '18:00', inbound: 1628, outbound: 894, handoffs: 266 },
];

export const TODAY_TOOL_TREND = [
  { time: '08:00', calls: 286, successRate: 98.8, latency: 620 }, { time: '10:00', calls: 648, successRate: 98.4, latency: 710 },
  { time: '12:00', calls: 1032, successRate: 98.2, latency: 760 }, { time: '14:00', calls: 1578, successRate: 97.9, latency: 820 },
  { time: '16:00', calls: 2246, successRate: 97.6, latency: 910 }, { time: '18:00', calls: 2864, successRate: 97.8, latency: 870 },
];

export const INITIAL_ALERT_RULES: AlertRule[] = [
  { id: 'rule_1', name: '并发容量接近上限', scope: '全部机器人', metric: 'concurrency_rate', comparator: 'gt', threshold: 80, windowMinutes: 5, schedule: 'all_day', severity: 'critical', channel: 'wechat', recipients: '语音平台运维群', enabled: true },
  { id: 'rule_2', name: '响应耗时持续升高', scope: '全部机器人', metric: 'latency_p95', comparator: 'gt', threshold: 2500, windowMinutes: 5, schedule: 'all_day', severity: 'warning', channel: 'email', recipients: 'voice-ops@example.com', enabled: true },
  { id: 'rule_3', name: '通话正常完成率下降', scope: '电商售后机器人', metric: 'completion_rate', comparator: 'lt', threshold: 85, windowMinutes: 10, schedule: 'bot_working_hours', severity: 'warning', channel: 'webhook', recipients: 'https://example.com/monitor', enabled: true },
  { id: 'rule_4', name: '工具调用连续失败', scope: '全部机器人', metric: 'function_errors', comparator: 'gt', threshold: 5, windowMinutes: 5, schedule: 'all_day', severity: 'critical', channel: 'dingtalk', recipients: '技术值班群', enabled: false },
  { id: 'rule_5', name: '工具调用成功率下降', scope: '全部机器人', metric: 'function_success_rate', comparator: 'lt', threshold: 95, windowMinutes: 10, schedule: 'all_day', severity: 'critical', channel: 'wechat', recipients: '语音平台运维群', enabled: true },
];

export const ALERT_RECORDS: MonitorAlertRecord[] = [
  { id: 'event_1', triggeredAt: '2026-08-27 10:24:18', ruleName: '响应耗时持续升高', botName: '电商售后机器人', metricLabel: 'P95 响应耗时', observedValue: '3,210 ms', thresholdText: '连续 5 分钟 > 2,500 ms', severity: 'warning', status: 'active' },
  { id: 'event_2', triggeredAt: '2026-08-27 09:48:05', ruleName: '工具调用连续失败', botName: '滴滴出行智能客服', metricLabel: '工具调用失败数', observedValue: '8 次', thresholdText: '5 分钟内 > 5 次', severity: 'critical', status: 'acknowledged' },
  { id: 'event_3', triggeredAt: '2026-08-27 08:36:11', recoveredAt: '2026-08-27 08:44:20', ruleName: '并发容量接近上限', botName: '全部机器人', metricLabel: '并发使用率', observedValue: '86%', thresholdText: '连续 5 分钟 > 80%', severity: 'critical', status: 'recovered' },
];
