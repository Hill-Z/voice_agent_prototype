// 业务漏斗原型数据：用真实可埋点事件生成通话事件流和严格有序漏斗。
import {
  BusinessFunnelCall,
  BusinessFunnelDefinition,
  BusinessFunnelReport,
  BusinessFunnelRuntimeEvent,
  BusinessFunnelSourceData,
  CallDirectionFilter,
} from '../../types';

export interface BusinessFunnelFilters {
  botIds: string[];
  callDirection: CallDirectionFilter;
  versionId: string;
}

const BOTS = [
  { id: 'bot_1', name: '滴滴出行智能客服' },
  { id: 'bot_2', name: '电商售后机器人' },
];

const VERSIONS = [
  { id: 'v24', name: 'V2.4', botId: 'bot_1' },
  { id: 'v23', name: 'V2.3', botId: 'bot_1' },
  { id: 'v15', name: 'V1.5', botId: 'bot_2' },
];

const EVENTS: BusinessFunnelSourceData['events'] = [
  { id: 'event_refund_topic', code: 'topic.refund.matched', name: '命中退款申请主题', sourceType: 'platform', sourceObject: 'Topic：退款申请', enabled: true },
  { id: 'event_refund_flow', code: 'flow.refund.entered', name: '进入退款申请 Flow', sourceType: 'platform', sourceObject: 'Flow：退款申请', enabled: true },
  {
    id: 'event_order_query_success',
    code: 'tool.order_query.success',
    name: '订单查询成功',
    sourceType: 'tool_result',
    sourceObject: 'Tool：订单查询',
    condition: { field: 'response.code', operator: 'equals', value: '0' },
    enabled: true,
  },
  {
    id: 'event_refund_submitted',
    code: 'business.refund.submitted',
    name: '退款申请提交成功',
    sourceType: 'tool_result',
    sourceObject: 'Tool：提交退款申请',
    condition: { field: 'response.data.status', operator: 'equals', value: 'submitted' },
    enabled: true,
  },
  { id: 'event_service_topic', code: 'topic.service_booking.matched', name: '命中服务预约主题', sourceType: 'platform', sourceObject: 'Topic：服务预约', enabled: true },
  { id: 'event_appointment_flow', code: 'flow.appointment.entered', name: '进入预约服务 Flow', sourceType: 'platform', sourceObject: 'Flow：预约服务', enabled: true },
  {
    id: 'event_slot_found',
    code: 'tool.slot_query.available',
    name: '查询到可预约时段',
    sourceType: 'tool_result',
    sourceObject: 'Tool：查询服务时段',
    condition: { field: 'response.data.available', operator: 'equals', value: 'true' },
    enabled: true,
  },
  {
    id: 'event_appointment_created',
    code: 'business.appointment.created',
    name: '预约单创建成功',
    sourceType: 'callback',
    sourceObject: '回调：预约结果通知',
    condition: { field: 'payload.status', operator: 'equals', value: 'created' },
    enabled: true,
  },
  {
    id: 'event_member_verified',
    code: 'business.member.verified',
    name: '会员身份校验通过',
    sourceType: 'variable',
    sourceObject: '通话变量：member_verified',
    condition: { field: 'member_verified', operator: 'equals', value: 'true' },
    enabled: false,
  },
];

const FUNNELS: BusinessFunnelDefinition[] = [
  {
    id: 'funnel_refund',
    name: '退款申请转化漏斗',
    botId: 'bot_2',
    versionId: 'v15',
    enabled: true,
    stages: [
      { id: 'refund_stage_1', name: '表达退款需求', eventId: 'event_refund_topic' },
      { id: 'refund_stage_2', name: '进入退款流程', eventId: 'event_refund_flow' },
      { id: 'refund_stage_3', name: '订单查询成功', eventId: 'event_order_query_success' },
      { id: 'refund_stage_4', name: '退款申请提交成功', eventId: 'event_refund_submitted' },
    ],
  },
  {
    id: 'funnel_appointment',
    name: '服务预约转化漏斗',
    botId: 'bot_1',
    versionId: 'v24',
    enabled: true,
    stages: [
      { id: 'appointment_stage_1', name: '表达预约需求', eventId: 'event_service_topic' },
      { id: 'appointment_stage_2', name: '进入预约流程', eventId: 'event_appointment_flow' },
      { id: 'appointment_stage_3', name: '查询到可约时段', eventId: 'event_slot_found' },
      { id: 'appointment_stage_4', name: '预约单创建成功', eventId: 'event_appointment_created' },
    ],
  },
];

interface CallSpec {
  funnelId: string;
  reachedStages: number;
  reasonCode?: string;
  reasonName?: string;
}

const REFUND_SPECS: CallSpec[] = [
  { funnelId: 'funnel_refund', reachedStages: 4 },
  { funnelId: 'funnel_refund', reachedStages: 4 },
  { funnelId: 'funnel_refund', reachedStages: 4 },
  { funnelId: 'funnel_refund', reachedStages: 3, reasonCode: 'refund_not_supported', reasonName: '订单不满足退款条件' },
  { funnelId: 'funnel_refund', reachedStages: 3, reasonCode: 'tool_failed', reasonName: '提交退款工具失败' },
  { funnelId: 'funnel_refund', reachedStages: 2, reasonCode: 'order_missing', reasonName: '未提供有效订单号' },
  { funnelId: 'funnel_refund', reachedStages: 2, reasonCode: 'user_transfer', reasonName: '用户要求转人工' },
  { funnelId: 'funnel_refund', reachedStages: 1, reasonCode: 'user_hangup', reasonName: '用户主动挂断' },
];

const APPOINTMENT_SPECS: CallSpec[] = [
  { funnelId: 'funnel_appointment', reachedStages: 4 },
  { funnelId: 'funnel_appointment', reachedStages: 4 },
  { funnelId: 'funnel_appointment', reachedStages: 3, reasonCode: 'confirm_timeout', reasonName: '用户未确认预约' },
  { funnelId: 'funnel_appointment', reachedStages: 3, reasonCode: 'callback_failed', reasonName: '预约结果回调失败' },
  { funnelId: 'funnel_appointment', reachedStages: 2, reasonCode: 'no_available_slot', reasonName: '暂无可预约时段' },
  { funnelId: 'funnel_appointment', reachedStages: 2, reasonCode: 'user_transfer', reasonName: '用户要求转人工' },
  { funnelId: 'funnel_appointment', reachedStages: 1, reasonCode: 'user_hangup', reasonName: '用户主动挂断' },
];

// 生成稳定的通话与事件记录，漏斗统计只读取这些事件。
function buildRuntimeData(): Pick<BusinessFunnelSourceData, 'calls' | 'runtimeEvents'> {
  const now = Date.now();
  const specs = [...REFUND_SPECS, ...APPOINTMENT_SPECS];
  const calls: BusinessFunnelCall[] = [];
  const runtimeEvents: BusinessFunnelRuntimeEvent[] = [];

  Array.from({ length: 128 }, (_, index) => {
    const spec = specs[index % specs.length];
    const funnel = FUNNELS.find(item => item.id === spec.funnelId)!;
    const bot = BOTS.find(item => item.id === funnel.botId)!;
    const versionId = funnel.botId === 'bot_1' && index % 6 === 0 ? 'v23' : funnel.versionId;
    const version = VERSIONS.find(item => item.id === versionId)!;
    const callId = `call_${String(index + 1).padStart(5, '0')}`;
    const startedAt = now - (index + 1) * 3 * 60 * 60 * 1000;
    const status = spec.reasonCode === 'user_transfer'
      ? 'transferred'
      : spec.reasonCode === 'user_hangup'
        ? 'hangup'
        : spec.reasonCode?.includes('failed')
          ? 'failed'
          : 'completed';

    calls.push({
      id: callId,
      startedAt,
      customerPhone: `1${index % 2 === 0 ? '38' : '86'}****${String(3100 + index * 73).slice(-4)}`,
      botId: bot.id,
      botName: bot.name,
      versionId: version.id,
      versionName: version.name,
      direction: index % 5 === 0 ? 'outbound' : 'inbound',
      durationSeconds: 34 + spec.reachedStages * 23 + (index % 5) * 7,
      status,
    });

    funnel.stages.slice(0, spec.reachedStages).forEach((stage, stageIndex) => {
      runtimeEvents.push({
        id: `${callId}_${stage.id}`,
        callId,
        eventId: stage.eventId,
        occurredAt: startedAt + (stageIndex + 1) * 18 * 1000,
      });
    });

    if (spec.reasonCode) {
      runtimeEvents.push({
        id: `${callId}_loss`,
        callId,
        eventId: 'system.loss',
        occurredAt: startedAt + (spec.reachedStages + 1) * 18 * 1000,
        reasonCode: spec.reasonCode,
        reasonName: spec.reasonName,
      });
    }
  });

  return { calls, runtimeEvents };
}

const runtimeData = buildRuntimeData();

export const BUSINESS_FUNNEL_SOURCE_DATA: BusinessFunnelSourceData = {
  bots: BOTS,
  versions: VERSIONS,
  events: EVENTS,
  funnels: FUNNELS,
  ...runtimeData,
};

// 按通话事件发生顺序计算严格漏斗，同一通话每阶段只计一次。
export function buildBusinessFunnelReport(
  source: BusinessFunnelSourceData,
  funnel: BusinessFunnelDefinition,
  filters: BusinessFunnelFilters,
  rangeDays: number,
): BusinessFunnelReport {
  const earliestTime = Date.now() - rangeDays * 24 * 60 * 60 * 1000;
  const calls = source.calls.filter(call => {
    if (call.startedAt < earliestTime) return false;
    if (call.botId !== funnel.botId) return false;
    if (filters.botIds.length > 0 && !filters.botIds.includes(call.botId)) return false;
    if (filters.versionId !== 'all' && call.versionId !== filters.versionId) return false;
    if (filters.callDirection === '呼入' && call.direction !== 'inbound') return false;
    if (filters.callDirection === '外呼' && call.direction !== 'outbound') return false;
    return true;
  });
  const callIds = new Set(calls.map(call => call.id));
  const eventsByCall = new Map<string, BusinessFunnelRuntimeEvent[]>();

  source.runtimeEvents.forEach(event => {
    if (!callIds.has(event.callId)) return;
    const current = eventsByCall.get(event.callId) || [];
    current.push(event);
    eventsByCall.set(event.callId, current);
  });
  eventsByCall.forEach(events => events.sort((left, right) => left.occurredAt - right.occurredAt));

  const reachedCallIdsByStage: Record<string, string[]> = {};
  const lostCallIdsByStage: Record<string, string[]> = {};
  const lossReasonsByStage: BusinessFunnelReport['lossReasonsByStage'] = {};

  calls.forEach(call => {
    const events = eventsByCall.get(call.id) || [];
    let cursor = -1;
    for (const stage of funnel.stages) {
      const eventIndex = events.findIndex((event, index) => index > cursor && event.eventId === stage.eventId);
      if (eventIndex === -1) break;
      cursor = eventIndex;
      reachedCallIdsByStage[stage.id] = [...(reachedCallIdsByStage[stage.id] || []), call.id];
    }
  });

  funnel.stages.forEach((stage, stageIndex) => {
    const reachedCurrent = new Set(reachedCallIdsByStage[stage.id] || []);
    const candidates = stageIndex === 0
      ? calls.map(call => call.id)
      : reachedCallIdsByStage[funnel.stages[stageIndex - 1].id] || [];
    const lostCallIds = candidates.filter(callId => !reachedCurrent.has(callId));
    lostCallIdsByStage[stage.id] = lostCallIds;
    const reasonCounts = new Map<string, { code: string; name: string; count: number }>();
    lostCallIds.forEach(callId => {
      const lossEvent = (eventsByCall.get(callId) || []).find(event => event.reasonCode);
      const code = lossEvent?.reasonCode || 'stage_not_reached';
      const name = lossEvent?.reasonName || '未进入下一阶段';
      const current = reasonCounts.get(code) || { code, name, count: 0 };
      current.count += 1;
      reasonCounts.set(code, current);
    });
    lossReasonsByStage[stage.id] = [...reasonCounts.values()].sort((left, right) => right.count - left.count);
  });

  const firstStageCount = reachedCallIdsByStage[funnel.stages[0]?.id]?.length || 0;
  const stages = funnel.stages.map((stage, index) => {
    const reachedCount = reachedCallIdsByStage[stage.id]?.length || 0;
    const previousCount = index === 0 ? calls.length : reachedCallIdsByStage[funnel.stages[index - 1].id]?.length || 0;
    return {
      ...stage,
      reachedCount,
      previousConversionRate: index === 0 ? 1 : reachedCount / Math.max(1, previousCount),
      cumulativeConversionRate: reachedCount / Math.max(1, firstStageCount),
      lossCount: index === 0 ? Math.max(0, calls.length - reachedCount) : Math.max(0, previousCount - reachedCount),
    };
  });

  return { funnel, stages, calls, reachedCallIdsByStage, lostCallIdsByStage, lossReasonsByStage };
}

export const BUSINESS_EVENT_SOURCE_LABELS: Record<BusinessFunnelSourceData['events'][number]['sourceType'], string> = {
  platform: '平台事件',
  tool_result: 'Tool 返回',
  callback: '接口回调',
  variable: '通话变量',
};

export const BUSINESS_EVENT_OPERATOR_LABELS = {
  equals: '等于',
  not_equals: '不等于',
  greater_than: '大于',
  contains: '包含',
} as const;
