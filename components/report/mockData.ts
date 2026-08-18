import { 
  ReportMetrics, 
  TrendData, 
  BotPerformance, 
  IntentAnalysis, 
  HourlyDistribution,
  DurationDistribution,
  HangupReasonDistribution,
  UnmatchedIntent,
  CallRecordDetail,
  TimeRange,
  RealtimeMonitorData,
  AlertEvent,
  TopicAnalysisReport,
  BusinessResultReport,
  FlowFunnelReport,
  ToolCallReport,
  TransferReport,
  CallDetail,
  ReportSubscription,
  CallAnalysisData,
  EntityQualityReport
} from '../../types';
import { BUSINESS_FUNNEL_SOURCE_DATA } from './funnelMockData';

export const MOCK_BOTS = [
  { id: 'bot_1', name: '滴滴出行智能客服' },
  { id: 'bot_2', name: '电商售后机器人' },
  { id: 'bot_3', name: '银行信用卡服务' },
  { id: 'bot_4', name: '保险理赔助手' },
  { id: 'bot_5', name: '餐饮预订机器人' },
];

const MOCK_INTENTS = [
  { id: 'intent_1', name: '🚨 高危安全拦截' },
  { id: 'intent_2', name: '👜 物品遗失查找' },
  { id: 'intent_3', name: '💰 费用异议/绕路' },
  { id: 'intent_4', name: '🧾 发票与报销' },
  { id: 'intent_5', name: '😤 投诉与建议' },
  { id: 'intent_6', name: '📦 订单查询' },
  { id: 'intent_7', name: '💳 账单查询' },
  { id: 'intent_8', name: '🔄 退换货申请' },
  { id: 'intent_9', name: '📅 预约改期' },
  { id: 'intent_10', name: '❓ 常见问题' },
];

export function generateDates(days: number = 30): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  const num = Math.random() * (max - min) + min;
  return parseFloat(num.toFixed(decimals));
}

// 按日期范围缩放 mock 数量，模拟所有报表模块都受顶部日期筛选影响。
function scaleByDays(value: number, days: number): number {
  return Math.max(1, Math.round(value * days / 30));
}

export function generateTrendData(days: number = 30): TrendData[] {
  const dates = generateDates(days);
  return dates.map((date, index) => {
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseCalls = isWeekend ? 80 : 150;
    const variation = randomInt(-30, 30);
    
    const totalCalls = Math.max(50, baseCalls + variation);
    const connectionRate = randomFloat(0.65, 0.85);
    const connectedCalls = Math.floor(totalCalls * connectionRate);
    
    return {
      date,
      totalCalls,
      connectedCalls,
      avgDuration: randomFloat(120, 300),
      satisfaction: randomFloat(3.5, 4.8),
    };
  });
}

export function generateCurrentMetrics(): { current: ReportMetrics; previous: ReportMetrics } {
  const currentTotalCalls = randomInt(800, 1500);
  const currentConnectedCalls = Math.floor(currentTotalCalls * randomFloat(0.65, 0.85));
  const currentAvgDuration = randomFloat(120, 300);
  const currentTotalDuration = Math.floor(currentConnectedCalls * currentAvgDuration);
  
  const previousTotalCalls = randomInt(700, 1400);
  const previousConnectedCalls = Math.floor(previousTotalCalls * randomFloat(0.60, 0.80));
  const previousAvgDuration = randomFloat(110, 290);
  const previousTotalDuration = Math.floor(previousConnectedCalls * previousAvgDuration);
  
  return {
    current: {
      totalCalls: currentTotalCalls,
      connectedCalls: currentConnectedCalls,
      connectionRate: parseFloat((currentConnectedCalls / currentTotalCalls).toFixed(2)),
      avgDuration: currentAvgDuration,
      totalDuration: currentTotalDuration,
      avgSatisfaction: randomFloat(3.5, 4.8),
      transferCount: Math.floor(currentConnectedCalls * randomFloat(0.1, 0.25)),
      transferRate: randomFloat(0.1, 0.25),
      interceptRate: randomFloat(0.6, 0.85),
    },
    previous: {
      totalCalls: previousTotalCalls,
      connectedCalls: previousConnectedCalls,
      connectionRate: parseFloat((previousConnectedCalls / previousTotalCalls).toFixed(2)),
      avgDuration: previousAvgDuration,
      totalDuration: previousTotalDuration,
      avgSatisfaction: randomFloat(3.3, 4.6),
      transferCount: Math.floor(previousConnectedCalls * randomFloat(0.12, 0.28)),
      transferRate: randomFloat(0.12, 0.28),
      interceptRate: randomFloat(0.55, 0.80),
    },
  };
}

export function generateBotPerformance(): BotPerformance[] {
  return MOCK_BOTS.map(bot => {
    const totalCalls = randomInt(100, 500);
    const connectedCalls = Math.floor(totalCalls * randomFloat(0.60, 0.90));
    
    return {
      botId: bot.id,
      botName: bot.name,
      totalCalls,
      connectionRate: parseFloat((connectedCalls / totalCalls).toFixed(2)),
      avgDuration: randomFloat(100, 350),
      satisfaction: randomFloat(3.2, 4.9),
      intentAccuracy: randomFloat(0.75, 0.95),
      transferRate: randomFloat(0.08, 0.30),
    };
  });
}

export function generateIntentAnalysis(): IntentAnalysis[] {
  return MOCK_INTENTS.map(intent => ({
    intentId: intent.id,
    intentName: intent.name,
    triggerCount: randomInt(50, 500),
    accuracy: randomFloat(0.70, 0.98),
    avgDuration: randomFloat(60, 240),
  }));
}

export function generateHourlyDistribution(): HourlyDistribution[] {
  return Array.from({ length: 24 }, (_, hour) => {
    const isPeakHour = (hour >= 9 && hour <= 12) || (hour >= 14 && hour <= 17);
    const baseCount = isPeakHour ? 80 : 20;
    const variation = randomInt(-15, 15);
    
    return {
      hour,
      callCount: Math.max(5, baseCount + variation),
    };
  });
}

export function generateDurationDistribution(): DurationDistribution[] {
  const ranges = [
    { range: '0-30秒', min: 0, max: 30 },
    { range: '30-60秒', min: 30, max: 60 },
    { range: '1-3分钟', min: 60, max: 180 },
    { range: '3-5分钟', min: 180, max: 300 },
    { range: '5分钟以上', min: 300, max: 600 },
  ];
  
  const total = 1000;
  const distributions = [
    { count: randomInt(150, 250), percentage: 0 },
    { count: randomInt(200, 300), percentage: 0 },
    { count: randomInt(300, 400), percentage: 0 },
    { count: randomInt(100, 180), percentage: 0 },
    { count: randomInt(50, 100), percentage: 0 },
  ];
  
  return ranges.map((range, index) => ({
    range: range.range,
    count: distributions[index].count,
    percentage: parseFloat(((distributions[index].count / total) * 100).toFixed(1)),
  }));
}

export function generateHangupReasonDistribution(): HangupReasonDistribution[] {
  const reasons = [
    { reason: '正常结束', weight: 45 },
    { reason: '用户主动挂断', weight: 25 },
    { reason: '转人工', weight: 15 },
    { reason: '超时挂断', weight: 10 },
    { reason: '异常中断', weight: 5 },
  ];
  
  const total = 1000;
  return reasons.map(r => {
    const count = randomInt(
      Math.floor(total * (r.weight - 5) / 100),
      Math.floor(total * (r.weight + 5) / 100)
    );
    return {
      reason: r.reason,
      count,
      percentage: parseFloat(((count / total) * 100).toFixed(1)),
    };
  });
}

export function generateUnmatchedIntents(): UnmatchedIntent[] {
  const unmatchedTexts = [
    '我要投诉你们的服务',
    '这个订单什么时候能到',
    '帮我查一下余额',
    '我要退货怎么操作',
    '你们的人工客服在哪里',
    '这个费用是怎么算的',
    '我想修改我的地址',
    '帮我取消这个订单',
    '你们的营业时间是什么',
    '我要申请退款',
    '这个产品质量有问题',
    '帮我转接经理',
  ];
  
  return unmatchedTexts
    .map(text => ({
      text,
      count: randomInt(5, 50),
      lastTime: Date.now() - randomInt(0, 7 * 24 * 60 * 60 * 1000),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export function generateSatisfactionDistribution(): { rating: number; count: number; percentage: number }[] {
  const ratings = [1, 2, 3, 4, 5];
  const weights = [5, 10, 20, 35, 30];
  
  const total = 1000;
  return ratings.map((rating, index) => {
    const count = randomInt(
      Math.floor(total * (weights[index] - 3) / 100),
      Math.floor(total * (weights[index] + 3) / 100)
    );
    return {
      rating,
      count,
      percentage: parseFloat(((count / total) * 100).toFixed(1)),
    };
  });
}

export function generateCallRecords(count: number = 50): CallRecordDetail[] {
  const statuses: ('answered' | 'no_answer' | 'busy' | 'failed')[] = ['answered', 'no_answer', 'busy', 'failed'];
  const hangupReasons: ('normal' | 'user_hangup' | 'timeout' | 'transfer' | 'error')[] = ['normal', 'user_hangup', 'timeout', 'transfer', 'error'];
  
  return Array.from({ length: count }, (_, i) => {
    const status = statuses[randomInt(0, statuses.length - 1)];
    const isAnswered = status === 'answered';
    
    return {
      id: `call_${Date.now()}_${i}`,
      taskId: `task_${randomInt(1, 10)}`,
      phoneNumber: `138${randomInt(10000000, 99999999)}`,
      customerName: `客户${i + 1}`,
      startTime: Date.now() - randomInt(0, 7 * 24 * 60 * 60 * 1000),
      duration: isAnswered ? randomInt(30, 600) : 0,
      status,
      intentResult: isAnswered ? ['A级意向', 'B级意向', 'C级意向', '拒绝'][randomInt(0, 3)] : '',
      botName: MOCK_BOTS[randomInt(0, MOCK_BOTS.length - 1)].name,
      rounds: isAnswered ? randomInt(1, 15) : 0,
      recordingUrl: isAnswered ? `https://example.com/recordings/call_${i}.mp3` : undefined,
      satisfaction: isAnswered ? randomInt(1, 5) : undefined,
      hangupReason: hangupReasons[randomInt(0, hangupReasons.length - 1)],
      intentMatched: Math.random() > 0.15,
      intentName: isAnswered ? MOCK_INTENTS[randomInt(0, MOCK_INTENTS.length - 1)].name : undefined,
      waitTime: randomInt(1, 10),
      botId: MOCK_BOTS[randomInt(0, MOCK_BOTS.length - 1)].id,
    };
  });
}



export function generateRealtimeMonitorData(): RealtimeMonitorData {
  const concurrencyLimit = 200;
  const concurrencyUsed = randomInt(132, 188);
  const statuses: RealtimeMonitorData['botStatuses'] = MOCK_BOTS.map((bot, index) => {
    const activeCalls = randomInt(6, 38);
    const queueCount = index % 2 === 0 ? randomInt(0, 8) : randomInt(0, 3);
    const concurrencyLimitForBot = randomInt(25, 60);
    return {
      botId: bot.id,
      botName: bot.name,
      status: index === 3 ? 'warning' : 'online',
      activeCalls,
      queueCount,
      concurrencyUsed: Math.min(concurrencyLimitForBot, activeCalls + queueCount),
      concurrencyLimit: concurrencyLimitForBot,
      lastHeartbeat: Date.now() - randomInt(10, 120) * 1000,
    };
  });

  const queueItems: RealtimeMonitorData['queueItems'] = [
    { id: 'call_rt_004', customerPhone: '138****9231', botName: '滴滴出行智能客服', currentFlow: '主入口 Flow', currentNode: '转人工排队', duration: 186, status: 'error', startedAt: Date.now() - 186000 },
    { id: 'call_rt_001', customerPhone: '139****1208', botName: '电商售后机器人', currentFlow: '退款申请 Flow', currentNode: '收集订单号', duration: 92, status: 'in_call', startedAt: Date.now() - 92000 },
    { id: 'call_rt_002', customerPhone: '186****5510', botName: '保险理赔助手', currentFlow: '身份验证 Flow', currentNode: '排队等待', duration: 130, status: 'queueing', startedAt: Date.now() - 130000 },
    { id: 'call_rt_003', customerPhone: '177****4318', botName: '银行信用卡服务', currentFlow: '账单查询 Flow', currentNode: '人工转接', duration: 210, status: 'transferring', startedAt: Date.now() - 210000 },
  ];

  return {
    activeCalls: randomInt(88, 128),
    queueingCalls: randomInt(8, 22),
    concurrencyUsed,
    concurrencyLimit,
    todayCalls: randomInt(980, 1580),
    todayErrors: randomInt(12, 38),
    todayTransfers: randomInt(118, 260),
    botStatuses: statuses,
    concurrencyTrend: Array.from({ length: 12 }, (_, index) => ({
      time: String(index + 8).padStart(2, '0') + ':00',
      used: Math.min(concurrencyLimit, randomInt(90, 190)),
      limit: concurrencyLimit,
    })),
    queueItems,
  };
}

export function generateAlertEvents(): AlertEvent[] {
  const alerts: AlertEvent[] = [
    { id: 'alert_1', time: Date.now() - 5 * 60 * 1000, level: 'high', type: '工具调用失败', botName: '滴滴出行智能客服', callId: 'call_rt_004', reason: '订单查询接口连续超时', status: 'open', flowName: '订单查询 Flow', nodeName: '查询订单状态', target: '订单查询工具', errorMessage: 'HTTP 504 Gateway Timeout，5 分钟内合并 7 次', suggestion: '检查订单系统网关或临时切换到固定话术兜底。' },
    { id: 'alert_2', time: Date.now() - 18 * 60 * 1000, level: 'medium', type: '转人工失败', botName: '保险理赔助手', callId: 'call_20260525_118', reason: '转人工队列容量不足', status: 'acknowledged', flowName: '理赔咨询 Flow', nodeName: '转人工排队', target: '理赔专席队列', errorMessage: 'Queue capacity exceeded', suggestion: '检查转人工队列容量或播放兜底提示。' },
    { id: 'alert_3', time: Date.now() - 42 * 60 * 1000, level: 'medium', type: 'TTS 播放失败', botName: '电商售后机器人', callId: 'call_20260525_096', reason: '音频资源不存在', status: 'recovered', flowName: '退款申请 Flow', nodeName: '播放退款说明', target: 'TTS 服务', errorMessage: 'audio resource not found', suggestion: '确认录音资源是否已发布。' },
    { id: 'alert_4', time: Date.now() - 70 * 60 * 1000, level: 'low', type: '知识库检索失败', botName: '银行信用卡服务', callId: 'call_20260525_071', reason: '知识库无命中结果', status: 'open', flowName: '常见问题 Flow', nodeName: '知识检索', target: '信用卡知识库', errorMessage: 'No document matched threshold 0.72', suggestion: '补充高频问答或降低召回阈值。' },
  ];

  return alerts.sort((a, b) => {
    const levelOrder = { high: 0, medium: 1, low: 2 } as const;
    if (a.status !== 'recovered' && b.status === 'recovered') return -1;
    if (a.status === 'recovered' && b.status !== 'recovered') return 1;
    return levelOrder[a.level] - levelOrder[b.level] || b.time - a.time;
  });
}


export function generateTopicAnalysisReports(days: number = 30, totalCalls: number = scaleByDays(12000, days)): TopicAnalysisReport[] {
  const topics = [
    { name: '订单查询', weight: 22, firstWeight: 26 },
    { name: '退款申请', weight: 18, firstWeight: 16 },
    { name: '投诉受理', weight: 15, firstWeight: 12 },
    { name: '身份验证', weight: 13, firstWeight: 14 },
    { name: '预约修改', weight: 11, firstWeight: 10 },
    { name: '发票与报销', weight: 9, firstWeight: 8 },
    { name: '费用异议', weight: 7, firstWeight: 6 },
    { name: '其他咨询', weight: 5, firstWeight: 8 },
  ];
  const scopedTotalCalls = Math.max(1, totalCalls);

  return topics.map((topic, index) => {
    const callCount = Math.max(1, Math.round(scopedTotalCalls * topic.weight / 100) + scaleByDays(randomInt(-80, 80), days));
    const firstTopicCallCount = Math.max(1, Math.round(scopedTotalCalls * topic.firstWeight / 100) + scaleByDays(randomInt(-50, 50), days));
    return {
      id: 'topic_' + (index + 1),
      topicName: topic.name,
      callCount,
      callShare: parseFloat((callCount / scopedTotalCalls).toFixed(3)),
      firstTopicCallCount,
      firstTopicShare: parseFloat((firstTopicCallCount / scopedTotalCalls).toFixed(3)),
    };
  }).sort((a, b) => b.callCount - a.callCount);
}

export function generateBusinessResultReports(days: number = 30): BusinessResultReport[] {
  const names = ['订单查询', '投诉受理', '退款申请', '身份验证', '转人工', '预约修改'];
  return names.map((name, index) => {
    const triggerCount = scaleByDays(randomInt(180, 620), days);
    const completedCount = Math.floor(triggerCount * randomFloat(0.62, 0.91));
    const transferCount = Math.floor(triggerCount * randomFloat(0.08, 0.28));
    return {
      id: 'biz_' + (index + 1),
      businessName: name,
      triggerCount,
      completedCount,
      transferCount,
      transferRate: parseFloat((transferCount / triggerCount).toFixed(2)),
      transferAfterCompleted: Math.floor(transferCount * randomFloat(0.35, 0.68)),
      avgHandleTime: randomFloat(80, 260),
      abandonedCount: scaleByDays(randomInt(6, 44), days),
      relatedFlowName: name + ' Flow',
      relatedTools: ['订单查询工具', '短信通知工具', '身份校验工具'].slice(0, (index % 3) + 1),
    };
  });
}

export function generateFlowFunnelReports(days: number = 30): FlowFunnelReport[] {
  const nodes = [
    { nodeId: 'node_start', nodeName: '开始', nodeType: '开始节点', enteredCount: scaleByDays(1200, days), arrivedCount: scaleByDays(1200, days), passedCount: scaleByDays(1128, days), passRate: 0.94, dropRate: 0.06, transferRate: 0.02, avgStaySeconds: 8, userHangupCount: scaleByDays(18, days), transferCount: scaleByDays(22, days), toolFailureCount: 0, errorCount: 0 },
    { nodeId: 'node_collect', nodeName: '收集手机号', nodeType: '采集步骤', enteredCount: scaleByDays(1128, days), arrivedCount: scaleByDays(1128, days), passedCount: scaleByDays(846, days), passRate: 0.75, dropRate: 0.25, transferRate: 0.08, avgStaySeconds: 42, userHangupCount: scaleByDays(96, days), transferCount: scaleByDays(90, days), toolFailureCount: scaleByDays(12, days), errorCount: scaleByDays(6, days) },
    { nodeId: 'node_verify', nodeName: '身份验证', nodeType: '工具步骤', enteredCount: scaleByDays(846, days), arrivedCount: scaleByDays(846, days), passedCount: scaleByDays(550, days), passRate: 0.65, dropRate: 0.35, transferRate: 0.18, avgStaySeconds: 55, userHangupCount: scaleByDays(88, days), transferCount: scaleByDays(152, days), toolFailureCount: scaleByDays(42, days), errorCount: scaleByDays(12, days) },
    { nodeId: 'node_done', nodeName: '完成处理', nodeType: '结束节点', enteredCount: scaleByDays(550, days), arrivedCount: scaleByDays(550, days), passedCount: scaleByDays(550, days), passRate: 1, dropRate: 0, transferRate: 0.03, avgStaySeconds: 16, userHangupCount: 0, transferCount: scaleByDays(16, days), toolFailureCount: 0, errorCount: 0 },
  ];

  return [{
    flowId: 'flow_main', flowName: '主入口 Flow', botName: '滴滴出行智能客服', enteredCount: scaleByDays(1200, days), completedCount: scaleByDays(550, days), nodes,
    edges: [
      { edgeId: 'edge_1', fromNode: '开始', toNode: '收集手机号', branchType: 'normal', conditionText: '默认路径', hitCount: scaleByDays(1128, days), hitRate: 0.94 },
      { edgeId: 'edge_2', fromNode: '收集手机号', toNode: '身份验证', branchType: 'conditional', conditionText: '手机号已收集', hitCount: scaleByDays(846, days), hitRate: 0.75 },
      { edgeId: 'edge_3', fromNode: '身份验证', toNode: '完成处理', branchType: 'llm_branch', conditionText: '模型判断身份验证通过', hitCount: scaleByDays(550, days), hitRate: 0.65 },
    ],
    lossReasons: [
      { reason: '用户主动挂断', count: scaleByDays(202, days), percentage: 16.8 },
      { reason: '工具调用失败', count: scaleByDays(54, days), percentage: 4.5 },
      { reason: '转人工等待', count: scaleByDays(44, days), percentage: 3.7 },
    ],
  }];
}

export function generateToolCallReports(days: number = 30): ToolCallReport[] {
  const tools = [
    ['tool_order', '订单查询工具', 'API'],
    ['tool_sms', '短信通知工具', 'SMS'],
    ['tool_transfer', '人工转接工具', 'TRANSFER'],
    ['tool_verify', '身份校验函数', 'FUNCTION'],
  ] as const;

  return tools.map(([toolId, toolName, toolType], index) => {
    const callCount = scaleByDays(randomInt(220, 980), days);
    const successCount = Math.floor(callCount * randomFloat(0.78, 0.97));
    return {
      toolId, toolName, toolType, callCount, successCount,
      successRate: parseFloat((successCount / callCount).toFixed(2)),
      failureRate: parseFloat(((callCount - successCount) / callCount).toFixed(2)),
      avgLatencyMs: randomInt(320, 2400), timeoutCount: scaleByDays(randomInt(3, 38), days),
      directPlayCount: index === 0 ? randomInt(120, 220) : randomInt(10, 70),
      directPlaySuccessRate: randomFloat(0.88, 0.99), modelReplyCount: randomInt(80, 260), savedModelCalls: randomInt(50, 180),
      topFailureReason: ['接口超时', '参数缺失', '目标队列繁忙', '返回格式异常'][index],
      botCount: randomInt(1, 5), errorCodes: [{ code: 'TIMEOUT', count: randomInt(3, 20) }, { code: 'PARAM_ERROR', count: randomInt(1, 12) }],
      recentFailureSamples: [toolName + '失败样本 1', toolName + '失败样本 2'],
      relatedFlowNodes: ['身份验证', '订单查询', '转人工入口'].slice(0, (index % 3) + 1),
    };
  });
}

export function generateTransferReport(days: number = 30): TransferReport {
  const reasons = ['用户主动要求', '多轮未解决', '情绪异常', '高风险问题', '工具失败', '流程兜底', '系统异常'];
  const totalTransfers = scaleByDays(420, days);
  const reasonRows = reasons.map((reason, index) => {
    const count = scaleByDays(randomInt(22, 96), days);
    return { reason, count, percentage: parseFloat(((count / totalTransfers) * 100).toFixed(1)), mainSourceFlow: ['主入口 Flow', '投诉受理 Flow', '身份验证 Flow'][index % 3] };
  });

  return {
    totalTransfers, transferRate: 0.18,
    reasons: reasonRows,
  };
}

export function generateCallDetails(): CallDetail[] {
  return Array.from({ length: 12 }, (_, index) => {
    const statusPool: CallDetail['status'][] = ['completed', 'failed', 'transferred', 'error'];
    const status = statusPool[index % statusPool.length];
    const resultMap: Record<CallDetail['status'], CallDetail['result']> = { completed: '完成', failed: '失败', transferred: '转人工', error: '异常' };
    const startedAt = Date.now() - randomInt(10, 600) * 60 * 1000;
    return {
      id: 'call_detail_' + (index + 1), startedAt, customerPhone: '13' + randomInt(6, 9) + '****' + randomInt(1000, 9999), botName: MOCK_BOTS[index % MOCK_BOTS.length].name,
      status, duration: randomInt(42, 520), businessName: ['订单查询', '投诉受理', '退款申请', '身份验证'][index % 4], result: resultMap[status], satisfaction: status === 'completed' ? randomInt(3, 5) : undefined, recordingUrl: 'mock_recording_' + (index + 1) + '.mp3',
      transcript: [
        { speaker: 'bot', text: '您好，请问有什么可以帮您？', time: startedAt },
        { speaker: 'user', text: '我想查询一下订单。', time: startedAt + 8000 },
        { speaker: 'bot', text: '好的，请您提供手机号后四位。', time: startedAt + 16000 },
      ],
      flowPath: [
        { nodeName: '开始', nodeType: '开始节点', enteredAt: startedAt, staySeconds: 8 },
        { nodeName: '收集手机号', nodeType: '采集步骤', enteredAt: startedAt + 8000, staySeconds: 35 },
        { nodeName: '订单查询', nodeType: '工具步骤', enteredAt: startedAt + 43000, staySeconds: 12, marker: index % 3 === 0 ? 'error' : 'tool' },
        { nodeName: status === 'transferred' ? '人工转接' : '完成处理', nodeType: status === 'transferred' ? '转人工' : '结束节点', enteredAt: startedAt + 55000, staySeconds: 18, marker: status === 'transferred' ? 'transfer' : undefined },
      ],
      toolRecords: [{ toolName: '订单查询工具', calledAt: startedAt + 43000, paramsSummary: '手机号后四位、订单号', resultSummary: status === 'error' ? '接口超时' : '返回订单状态', status: status === 'error' ? 'timeout' : 'success', latencyMs: randomInt(420, 2800) }],
      transferRecords: status === 'transferred' ? [{ reason: '用户主动要求', queueSeconds: 38, result: '已接入人工', time: startedAt + 65000 }] : [],
      alertRecords: status === 'error' ? [{ type: '工具调用失败', message: '订单查询接口超时', time: startedAt + 45000 }] : [],
      businessSummary: status === 'completed' ? '订单状态已查询并播报给用户。' : '业务未完全闭环，需要后续跟进。',
    };
  });
}

export function generateReportSubscriptions(): ReportSubscription[] {
  return [
    { id: 'sub_daily', name: '每日运营日报', reportType: 'daily', frequency: '每日', sendTime: '09:00', recipients: ['ops@example.com'], filters: ['全部机器人', '呼入+外呼'], fileFormat: 'Excel', enabled: true, contentSummary: ['核心指标摘要', 'TOP 异常', 'TOP 转人工原因'] },
    { id: 'sub_weekly', name: '每周机器人效果报表', reportType: 'weekly', frequency: '每周', sendTime: '周一 10:00', recipients: ['pm@example.com'], filters: ['重点业务线'], fileFormat: 'Excel', enabled: true, contentSummary: ['环比变化', '业务完成量', '工具调用报表'] },
    { id: 'sub_monthly', name: '每月业务完成报表', reportType: 'monthly', frequency: '每月', sendTime: '1日 10:00', recipients: ['manager@example.com'], filters: ['全部业务'], fileFormat: 'CSV', enabled: false, contentSummary: ['业务完成明细', '工具调用报表', '附件明细'] },
  ];
}

export function generateCallAnalysisData(days: number = 30): CallAnalysisData {
  const isHourly = days <= 1;
  const points = isHourly ? 24 : days;
  const volumeTrend = Array.from({ length: points }, (_, i) => {
    const label = isHourly ? String(i).padStart(2, '0') + ':00' : generateDates(days)[i];
    const isPeak = isHourly ? (i >= 9 && i <= 12) || (i >= 14 && i <= 17) : true;
    const inbound = randomInt(isPeak ? 80 : 20, isPeak ? 180 : 60);
    const outbound = randomInt(40, 120);
    const total = inbound + outbound;
    const outboundConnected = Math.floor(outbound * randomFloat(0.58, 0.82));
    const inboundEffective = Math.floor(inbound * randomFloat(0.68, 0.9));
    const effective = inboundEffective + Math.floor(outboundConnected * randomFloat(0.72, 0.92));
    const connected = inbound + outboundConnected;
    return { label, inbound, outbound, connected, inboundEffective, effective, outboundConnected, missed: total - connected };
  });

  const durationDefs = [
    { range: '0-10秒', weight: 12 },
    { range: '10-30秒', weight: 18 },
    { range: '30-60秒', weight: 24 },
    { range: '1-3分钟', weight: 28 },
    { range: '3-5分钟', weight: 12 },
    { range: '5分钟以上', weight: 6 },
  ];
  const durTotal = 12000;
  const durationBuckets = durationDefs.map(d => {
    const count = Math.floor(durTotal * d.weight / 100) + randomInt(-200, 200);
    return {
      range: d.range,
      count,
      percentage: parseFloat(((count / durTotal) * 100).toFixed(1)),
      completionRate: randomFloat(0.4, 0.92),
      transferRate: randomFloat(0.05, 0.3),
    };
  });

  const repeatPhones = Array.from({ length: 8 }, () => '1' + randomInt(30, 89) + '****' + randomInt(1000, 9999));
  const repeatCustomers = repeatPhones.map(phone => {
    const c24 = randomInt(2, 6);
    return {
      customerPhone: phone,
      count24h: c24,
      count7d: c24 + randomInt(1, 8),
      lastBusiness: ['订单查询', '投诉受理', '退款申请', '账单查询'][randomInt(0, 3)],
      lastResult: ['完成', '失败', '转人工', '未解决'][randomInt(0, 3)],
      unresolvedCount: randomInt(0, c24),
      lastCallTime: Date.now() - randomInt(0, 24 * 60 * 60 * 1000),
    };
  }).sort((a, b) => b.count24h - a.count24h);

  const regions = ['广东', '江苏', '浙江', '山东', '北京', '上海', '四川', '湖北', '福建', '河南'];
  const regionStats = regions.map(region => ({
    region,
    totalCalls: randomInt(400, 3200),
    connectionRate: randomFloat(0.68, 0.92),
    completionRate: randomFloat(0.5, 0.85),
    transferRate: randomFloat(0.08, 0.28),
  })).sort((a, b) => b.totalCalls - a.totalCalls);

  const weekdayHourHeatmap = Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) => {
      const isWeekend = day >= 5;
      const isPeak = (hour >= 9 && hour <= 12) || (hour >= 14 && hour <= 17);
      const base = isPeak ? (isWeekend ? 45 : 90) : (isWeekend ? 8 : 20);
      return Math.max(0, base + randomInt(-12, 12));
    })
  );

  const hangupDefs = [
    { reason: '正常结束', weight: 38 },
    { reason: '用户主动挂断', weight: 18 },
    { reason: '接通前放弃', weight: 8 },
    { reason: '超时', weight: 9 },
    { reason: '异常中断', weight: 5 },
    { reason: '无人接听', weight: 12 },
  ];
  const hangTotal = 10000;
  const hangupReasons = hangupDefs.map(h => {
    const count = Math.floor(hangTotal * h.weight / 100) + randomInt(-100, 100);
    return { reason: h.reason, count, percentage: parseFloat(((count / hangTotal) * 100).toFixed(1)) };
  });

  const shortCallSamples = Array.from({ length: 8 }, (_, i) => ({
    callId: 'CALL' + (20260601000 + i),
    customerPhone: '1' + randomInt(30, 89) + '****' + randomInt(1000, 9999),
    duration: randomInt(3, 28),
    hangupBy: ['用户', '系统', '未知'][randomInt(0, 2)],
    hangupReason: ['秒挂', '静默超时', '未说话', '误拨'][randomInt(0, 3)],
    botName: MOCK_BOTS[randomInt(0, MOCK_BOTS.length - 1)].name,
    businessName: ['订单查询', '投诉受理', '退款申请', '账单查询'][randomInt(0, 3)],
    lastNode: ['开场白', '收集手机号', '身份验证', '主菜单'][randomInt(0, 3)],
  }));

  const totalCalls = volumeTrend.reduce((s, p) => s + p.inbound + p.outbound, 0);
  const connectedCalls = volumeTrend.reduce((s, p) => s + p.connected, 0);

  return {
    metrics: {
      totalCalls,
      connectionRate: parseFloat((connectedCalls / totalCalls).toFixed(3)),
      effectiveRate: randomFloat(0.6, 0.82),
      avgDuration: randomFloat(120, 240),
      medianDuration: randomFloat(80, 160),
      repeatCustomers: randomInt(120, 480),
      userHangupRate: randomFloat(0.08, 0.22),
    },
    volumeTrend,
    durationBuckets,
    repeatCustomers,
    regionStats,
    weekdayHourHeatmap,
    hangupReasons,
    shortCallSamples,
  };
}

export function generateEntityQualityReport(days: number = 30): EntityQualityReport {
  const fieldDefs = [
    { field: '手机号', business: '身份验证' },
    { field: '订单号', business: '订单查询' },
    { field: '地址', business: '退换货' },
    { field: '姓名', business: '工单创建' },
    { field: '产品型号', business: '售后咨询' },
    { field: '工单类型', business: '投诉受理' },
    { field: '预约时间', business: '预约改期' },
  ];
  const fields = fieldDefs.map(d => {
    const extractedCount = scaleByDays(randomInt(320, 1800), days);
    const missingCount = scaleByDays(randomInt(20, 180), days);
    const formatErrorCount = scaleByDays(randomInt(8, 90), days);
    const lowConfidenceCount = scaleByDays(randomInt(10, 120), days);
    const successCount = extractedCount - missingCount - formatErrorCount;
    return {
      field: d.field,
      extractedCount,
      successRate: parseFloat((successCount / extractedCount).toFixed(3)),
      missingCount,
      formatErrorCount,
      lowConfidenceCount,
      affectedBusiness: d.business,
      suggestion: ['补追问话术', '加格式校验', '提高置信阈值', '补充示例'][randomInt(0, 3)],
    };
  }).sort((a, b) => a.successRate - b.successRate);

  const extracted = scaleByDays(8600, days);
  const formatPass = Math.floor(extracted * 0.88);
  const bizPass = Math.floor(formatPass * 0.9);
  const toolSuccess = Math.floor(bizPass * 0.93);
  const validationFunnel = [
    { stage: '已提取实体', count: extracted, rate: 1 },
    { stage: '格式校验通过', count: formatPass, rate: parseFloat((formatPass / extracted).toFixed(3)) },
    { stage: '业务校验通过', count: bizPass, rate: parseFloat((bizPass / extracted).toFixed(3)) },
    { stage: '工具调用成功', count: toolSuccess, rate: parseFloat((toolSuccess / extracted).toFixed(3)) },
  ];

  return { fields, validationFunnel };
}

export function getReportData(timeRange: TimeRange) {
  let days = 30;
  switch (timeRange) {
    case 'today':
    case 'yesterday':
      days = 1;
      break;
    case 'this_week':
    case 'last_week':
      days = 7;
      break;
    case 'this_month':
    case 'last_month':
      days = 30;
      break;
    default:
      days = 30;
  }
  
  const callAnalysis = generateCallAnalysisData(days);

  return {
    trendData: generateTrendData(days),
    metrics: generateCurrentMetrics(),
    botPerformance: generateBotPerformance(),
    intentAnalysis: generateIntentAnalysis(),
    hourlyDistribution: generateHourlyDistribution(),
    durationDistribution: generateDurationDistribution(),
    hangupReasonDistribution: generateHangupReasonDistribution(),
    unmatchedIntents: generateUnmatchedIntents(),
    satisfactionDistribution: generateSatisfactionDistribution(),
    callRecords: generateCallRecords(50),
    topicAnalysis: generateTopicAnalysisReports(days, callAnalysis.metrics.totalCalls),
    businessResults: generateBusinessResultReports(days),
    flowFunnels: generateFlowFunnelReports(days),
    toolCalls: generateToolCallReports(days),
    transferReport: generateTransferReport(days),
    callAnalysis,
    entityQuality: generateEntityQualityReport(days),
    funnelSource: BUSINESS_FUNNEL_SOURCE_DATA,
  };
}
