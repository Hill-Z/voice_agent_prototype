import type { FollowUpRule } from '../../types';

export type FollowUpRuleStatus = 'draft' | 'published' | 'disabled';
export type FollowUpGraphNodeType = 'trigger' | 'condition' | 'wait' | 'protection' | 'action' | 'end';
export type FollowUpActionType = 'auto_call' | 'send_sms' | 'manual_task' | 'call_tool' | 'write_back';
export type FollowUpEdgeType = 'normal' | 'condition' | 'outcome' | 'timeout' | 'fallback';
export type FollowUpConditionOperator = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
export type FollowUpRuleDedupeStrategy = 'ignore' | 'update' | 'merge';
export type FollowUpRuleConflictStrategy = 'latest' | 'highest_priority' | 'manual';
export type FollowUpVariableSourceType = 'system' | 'event' | 'node' | 'fixed';
export type FollowUpConditionLogic = 'ALL' | 'ANY';
export type FollowUpConditionValueType = 'text' | 'number' | 'boolean' | 'datetime' | 'variable';
export type FollowUpWaitBaseTime = 'now' | 'variable';
export type FollowUpWaitOffsetDirection = 'before' | 'after';
export type FollowUpWaitInvalidStrategy = 'use_default' | 'skip' | 'manual' | 'fail';
export type FollowUpProtectionTarget = 'customer' | 'phone' | 'order';
export type FollowUpEndReportCategory = 'success' | 'failure' | 'manual' | 'blocked' | 'expired';

export interface FollowUpRuleVariable {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'datetime';
  defaultValue?: string;
  name?: string;
  sourceType?: FollowUpVariableSourceType;
  sourceKey?: string;
  required?: boolean;
}

export interface FollowUpConditionRow {
  id: string;
  field: string;
  operator: FollowUpConditionOperator;
  valueType: FollowUpConditionValueType;
  value?: string;
  valueVariableKey?: string;
}

export interface FollowUpFieldMappingRow {
  id: string;
  sourceKey: string;
  targetKey: string;
  valueType: FollowUpConditionValueType;
  defaultValue?: string;
  required?: boolean;
}

export interface FollowUpRuleScope {
  botIds: string[];
  flowIds: string[];
}

export interface FollowUpGraphNodeConfig {
  triggerSourceType?: 'call' | 'task' | 'external';
  triggerEventType?: string;
  triggerConditionsLogic?: FollowUpConditionLogic;
  triggerConditions?: FollowUpConditionRow[];
  triggerDedupeFieldKeys?: string[];
  triggerRepeatStrategy?: FollowUpRuleDedupeStrategy;
  triggerMappings?: FollowUpFieldMappingRow[];
  triggerEvent?: string;
  triggerSource?: string;
  dedupeWindowMinutes?: number;
  conditionField?: string;
  conditionOperator?: FollowUpConditionOperator;
  conditionValue?: string;
  conditionLogic?: FollowUpConditionLogic;
  conditionRows?: FollowUpConditionRow[];
  waitMode?: 'fixed' | 'user_time' | 'variable_time';
  waitBaseTime?: FollowUpWaitBaseTime;
  waitVariableKey?: string;
  waitOffsetDirection?: FollowUpWaitOffsetDirection;
  waitOffsetAmount?: number;
  waitOffsetUnit?: 'minute' | 'hour' | 'day';
  waitWindowEnabled?: boolean;
  waitWindowStart?: string;
  waitWindowEnd?: string;
  waitInvalidStrategy?: FollowUpWaitInvalidStrategy;
  waitExpiredStrategy?: FollowUpWaitInvalidStrategy;
  waitAmount?: number;
  waitUnit?: 'minute' | 'hour' | 'day';
  dateVariable?: string;
  timeWindow?: string;
  timeoutHours?: number;
  protectionTemplateId?: string;
  protectionTarget?: FollowUpProtectionTarget;
  maxDailyCalls?: number;
  maxWeeklyCalls?: number;
  minIntervalMinutes?: number;
  avoidNightCalls?: boolean;
  avoidHolidays?: boolean;
  rejectCooldownDays?: number;
  blockComplaintRisk?: boolean;
  blockBlacklist?: boolean;
  blockInService?: boolean;
  actionType?: FollowUpActionType;
  executionBotId?: string;
  executionFlowId?: string;
  executionBotIds?: string[];
  executionFlowIds?: string[];
  smsTemplateId?: string;
  manualQueueId?: string;
  toolId?: string;
  parameterMappings?: FollowUpFieldMappingRow[];
  resultMappings?: FollowUpFieldMappingRow[];
  timeoutSeconds?: number;
  retryCount?: number;
  retryIntervalMinutes?: number;
  idempotencyKey?: string;
  writeBackTarget?: string;
  writeBackRows?: FollowUpFieldMappingRow[];
  resultStatus?: string;
  resultCodeSource?: 'dictionary' | 'flow' | 'tool';
  resultCode?: string;
  reportCategory?: FollowUpEndReportCategory;
  writeBackTags?: string;
  emitEvent?: boolean;
}

export interface FollowUpGraphNode {
  id: string;
  type: FollowUpGraphNodeType;
  title: string;
  description: string;
  position: { x: number; y: number };
  config: FollowUpGraphNodeConfig;
}

export interface FollowUpGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  sourceHandle: string;
  edgeType: FollowUpEdgeType;
  priority: number;
  isDefault?: boolean;
  conditionField?: string;
  conditionOperator?: FollowUpConditionOperator;
  conditionValue?: string;
}

export interface FollowUpRuleGraphDefinition {
  id: string;
  name: string;
  description: string;
  status: FollowUpRuleStatus;
  disabledFromStatus?: 'draft' | 'published';
  version: number;
  priority: number;
  scope: FollowUpRuleScope;
  dedupeFieldKeys: string[];
  dedupeStrategy: FollowUpRuleDedupeStrategy;
  validityDays: number;
  conflictStrategy: FollowUpRuleConflictStrategy;
  variables: FollowUpRuleVariable[];
  nodes: FollowUpGraphNode[];
  edges: FollowUpGraphEdge[];
  updatedAt: number;
}

export interface FollowUpValidationIssue {
  id: string;
  level: 'error' | 'warning';
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface FollowUpSimulationEvent {
  nodeId: string;
  nodeTitle: string;
  detail: string;
}

export const FOLLOW_UP_NODE_META: Record<FollowUpGraphNodeType, { label: string; description: string }> = {
  trigger: { label: '触发器', description: '接收通话、任务或外部系统事件' },
  condition: { label: '条件判断', description: '根据任务变量决定后续分支' },
  wait: { label: '等待', description: '等待固定时间、变量时间或用户指定时间' },
  protection: { label: '触达保护', description: '执行频控、夜间、节假日和风险拦截' },
  action: { label: '执行动作', description: '外呼、短信、人工任务、工具或回写' },
  end: { label: '结束', description: '结束任务并记录业务结果' },
};

export const FOLLOW_UP_ACTION_LABELS: Record<FollowUpActionType, string> = {
  auto_call: '自动外呼',
  send_sms: '发送短信',
  manual_task: '创建人工任务',
  call_tool: '调用工具',
  write_back: '回写数据',
};

export const CONDITION_OPERATOR_LABELS: Record<FollowUpConditionOperator, string> = {
  equals: '等于',
  not_equals: '不等于',
  contains: '包含',
  greater_than: '大于',
  less_than: '小于',
  exists: '存在',
  not_exists: '不存在',
};

export const FOLLOW_UP_SOURCE_RESULT_LABELS: Record<string, string> = {
  triggered: '已触发',
  matched: '条件成立',
  not_matched: '条件不成立',
  default: '默认分支',
  due: '等待结束',
  timeout: '等待超时',
  allowed: '允许触达',
  delayed: '延后触达',
  blocked: '禁止触达',
  success: '执行成功',
  no_answer: '未接通',
  busy: '忙线',
  rejected: '用户拒绝',
  failed: '执行失败',
  parameter_error: '参数错误',
  business_failed: '业务失败',
  system_error: '系统异常',
  duplicate: '重复命中',
  unavailable: '资源不可用',
  conflict: '数据冲突',
  expired: '已过期',
};

const createId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function mapping(idPrefix: string, sourceKey: string, targetKey: string, valueType: FollowUpConditionValueType = 'text', defaultValue = '', required = false): FollowUpFieldMappingRow {
  return { id: createId(idPrefix), sourceKey, targetKey, valueType, defaultValue, required };
}

function condition(idPrefix: string, field: string, operator: FollowUpConditionOperator, valueType: FollowUpConditionValueType, value = ''): FollowUpConditionRow {
  return { id: createId(idPrefix), field, operator, valueType, value };
}

export function getNodeOutputOptions(node: FollowUpGraphNode): Array<{ value: string; label: string }> {
  if (node.type === 'trigger') return [{ value: 'triggered', label: '已触发' }];
  if (node.type === 'condition') {
    return [
      { value: 'matched', label: '条件成立' },
      { value: 'not_matched', label: '条件不成立' },
      { value: 'default', label: '默认分支' },
    ];
  }
  if (node.type === 'wait') {
    return [
      { value: 'due', label: '等待结束' },
      { value: 'timeout', label: '等待超时' },
    ];
  }
  if (node.type === 'protection') {
    return [
      { value: 'allowed', label: '允许触达' },
      { value: 'delayed', label: '延后触达' },
      { value: 'blocked', label: '禁止触达' },
    ];
  }
  if (node.type === 'action') {
    const actionType = node.config.actionType || 'auto_call';
    if (actionType === 'send_sms') {
      return [
        { value: 'success', label: '发送成功' },
        { value: 'failed', label: '发送失败' },
        { value: 'parameter_error', label: '参数错误' },
        { value: 'timeout', label: '发送超时' },
        { value: 'system_error', label: '系统异常' },
      ];
    }
    if (actionType === 'manual_task') {
      return [
        { value: 'success', label: '创建成功' },
        { value: 'failed', label: '创建失败' },
        { value: 'duplicate', label: '重复任务' },
        { value: 'unavailable', label: '队列不可用' },
      ];
    }
    if (actionType === 'call_tool') {
      return [
        { value: 'success', label: '调用成功' },
        { value: 'business_failed', label: '业务失败' },
        { value: 'parameter_error', label: '参数错误' },
        { value: 'timeout', label: '调用超时' },
        { value: 'system_error', label: '系统异常' },
      ];
    }
    if (actionType === 'write_back') {
      return [
        { value: 'success', label: '回写成功' },
        { value: 'conflict', label: '数据冲突' },
        { value: 'failed', label: '回写失败' },
      ];
    }
    return [
      { value: 'success', label: '接通并完成' },
      { value: 'no_answer', label: '未接通' },
      { value: 'busy', label: '忙线' },
      { value: 'rejected', label: '用户拒绝' },
      { value: 'failed', label: '执行失败' },
      { value: 'timeout', label: '执行超时' },
    ];
  }
  return [];
}

function createNode(type: FollowUpGraphNodeType, id: string, title: string, x: number, y: number, config: FollowUpGraphNodeConfig): FollowUpGraphNode {
  return {
    id,
    type,
    title,
    description: FOLLOW_UP_NODE_META[type].description,
    position: { x, y },
    config,
  };
}

function createEdge(
  id: string,
  source: string,
  target: string,
  label: string,
  sourceHandle: string,
  edgeType: FollowUpEdgeType = 'normal',
  priority = 1,
): FollowUpGraphEdge {
  return { id, source, target, label, sourceHandle, edgeType, priority };
}

export function createFollowUpGraphNode(type: FollowUpGraphNodeType, position: { x: number; y: number }): FollowUpGraphNode {
  const id = createId(`follow_node_${type}`);
  if (type === 'trigger') {
    return createNode(type, id, '用户要求稍后联系', position.x, position.y, {
      triggerSourceType: 'call',
      triggerEventType: 'later_contact',
      triggerConditionsLogic: 'ALL',
      triggerConditions: [condition('trigger_condition', 'call.reason', 'contains', 'text', '稍后联系')],
      triggerDedupeFieldKeys: ['customer.phone'],
      triggerRepeatStrategy: 'ignore',
      triggerMappings: [mapping('trigger_mapping', 'event.requestedTime', 'follow_up_time', 'datetime', '', true)],
      triggerEvent: 'later_contact',
      triggerSource: '通话事件',
      dedupeWindowMinutes: 30,
    });
  }
  if (type === 'condition') {
    return createNode(type, id, '条件判断', position.x, position.y, {
      conditionLogic: 'ALL',
      conditionRows: [condition('condition_row', 'task.retryCount', 'less_than', 'number', '3')],
      conditionField: 'task.retryCount',
      conditionOperator: 'less_than',
      conditionValue: '3',
    });
  }
  if (type === 'wait') {
    return createNode(type, id, '等待执行时间', position.x, position.y, {
      waitMode: 'fixed',
      waitBaseTime: 'now',
      waitOffsetDirection: 'after',
      waitOffsetAmount: 24,
      waitOffsetUnit: 'hour',
      waitWindowEnabled: true,
      waitWindowStart: '09:00',
      waitWindowEnd: '20:00',
      waitInvalidStrategy: 'use_default',
      waitExpiredStrategy: 'skip',
      waitAmount: 24,
      waitUnit: 'hour',
      timeWindow: '09:00-20:00',
      timeoutHours: 72,
    });
  }
  if (type === 'protection') {
    return createNode(type, id, '检查触达保护', position.x, position.y, {
      protectionTemplateId: 'default',
      protectionTarget: 'customer',
      maxDailyCalls: 1,
      maxWeeklyCalls: 3,
      minIntervalMinutes: 180,
      avoidNightCalls: true,
      avoidHolidays: true,
      rejectCooldownDays: 14,
      blockComplaintRisk: true,
      blockBlacklist: true,
      blockInService: true,
    });
  }
  if (type === 'action') {
    return createNode(type, id, '自动外呼', position.x, position.y, {
      actionType: 'auto_call',
      executionBotIds: ['bot_didi_demo'],
      executionFlowIds: ['lookup'],
      executionBotId: 'bot_didi_demo',
      executionFlowId: 'lookup',
      parameterMappings: [mapping('call_parameter', 'customer.phone', 'phone', 'variable', '', true)],
      timeoutSeconds: 30,
      retryCount: 1,
      retryIntervalMinutes: 1,
      idempotencyKey: '{{task.id}}:{{node.id}}:{{task.attempt}}',
    });
  }
  return createNode(type, id, '任务结束', position.x, position.y, {
    resultStatus: 'completed',
    resultCodeSource: 'dictionary',
    resultCode: 'FOLLOW_UP_COMPLETED',
    reportCategory: 'success',
    writeBackTags: '跟进完成',
    emitEvent: true,
  });
}

export function createFollowUpGraphEdge(source: FollowUpGraphNode, target: FollowUpGraphNode): FollowUpGraphEdge {
  const firstOutput = getNodeOutputOptions(source)[0];
  return {
    id: createId('follow_edge'),
    source: source.id,
    target: target.id,
    label: firstOutput?.label || '下一步',
    sourceHandle: firstOutput?.value || 'next',
    edgeType: source.type === 'condition' ? 'condition' : source.type === 'action' ? 'outcome' : 'normal',
    priority: 1,
  };
}

function buildLaterContactRule(legacyRule: FollowUpRule): FollowUpRuleGraphDefinition {
  const nodes: FollowUpGraphNode[] = [
    createNode('trigger', 'later_trigger', '用户要求稍后联系', 80, 260, {
      triggerSourceType: 'call',
      triggerEventType: 'later_contact',
      triggerConditionsLogic: 'ALL',
      triggerConditions: [condition('later_trigger_condition', 'call.reason', 'contains', 'text', '稍后联系')],
      triggerDedupeFieldKeys: ['customer.phone'],
      triggerRepeatStrategy: 'ignore',
      triggerMappings: [mapping('later_trigger_mapping', 'event.requestedTime', 'follow_up_time', 'datetime', '', true)],
      triggerEvent: 'later_contact',
      triggerSource: '通话事件',
      dedupeWindowMinutes: 30,
    }),
    createNode('wait', 'later_wait', '等待用户指定时间', 360, 260, {
      waitMode: 'user_time',
      waitBaseTime: 'variable',
      waitVariableKey: 'follow_up_time',
      waitOffsetDirection: 'after',
      waitOffsetAmount: legacyRule.defaultDelayDays,
      waitOffsetUnit: 'day',
      waitWindowEnabled: true,
      waitWindowStart: '09:00',
      waitWindowEnd: '20:00',
      waitInvalidStrategy: 'use_default',
      waitExpiredStrategy: 'skip',
      dateVariable: 'follow_up_time',
      timeWindow: legacyRule.preferredTimeRange,
      timeoutHours: 168,
    }),
    createNode('protection', 'later_protection', '检查触达保护', 660, 260, {
      protectionTemplateId: 'default',
      protectionTarget: 'customer',
      maxDailyCalls: legacyRule.touchProtection.maxDailyCalls,
      maxWeeklyCalls: legacyRule.touchProtection.maxWeeklyCalls,
      minIntervalMinutes: 180,
      avoidNightCalls: legacyRule.touchProtection.avoidNightCalls,
      avoidHolidays: legacyRule.touchProtection.avoidHolidays,
      rejectCooldownDays: legacyRule.touchProtection.rejectCooldownDays,
      blockComplaintRisk: legacyRule.touchProtection.blockComplaintRisk,
      blockBlacklist: legacyRule.touchProtection.blockBlacklist,
      blockInService: true,
    }),
    createNode('action', 'later_call', '发起自动外呼', 960, 180, {
      actionType: 'auto_call',
      executionBotIds: [legacyRule.executionBotId || 'bot_didi_demo'],
      executionFlowIds: [legacyRule.executionFlowId || 'lookup'],
      executionBotId: legacyRule.executionBotId || 'bot_didi_demo',
      executionFlowId: legacyRule.executionFlowId || 'lookup',
      parameterMappings: [mapping('later_call_phone', 'customer.phone', 'phone', 'variable', '', true)],
      timeoutSeconds: 30,
      retryCount: 1,
      retryIntervalMinutes: 1,
      idempotencyKey: '{{task.id}}:call:{{task.attempt}}',
    }),
    createNode('condition', 'later_retry_check', '是否继续重试', 1260, 320, {
      conditionLogic: 'ALL',
      conditionRows: [condition('later_retry_check_row', 'task.retryCount', 'less_than', 'number', String(legacyRule.retryPolicy.maxRetries))],
      conditionField: 'task.retryCount',
      conditionOperator: 'less_than',
      conditionValue: String(legacyRule.retryPolicy.maxRetries),
    }),
    createNode('wait', 'later_retry_wait', '等待下次重试', 960, 480, {
      waitMode: 'fixed',
      waitBaseTime: 'now',
      waitOffsetDirection: 'after',
      waitOffsetAmount: legacyRule.retryPolicy.retryIntervalHours,
      waitOffsetUnit: 'hour',
      waitWindowEnabled: true,
      waitWindowStart: '09:00',
      waitWindowEnd: '20:00',
      waitInvalidStrategy: 'use_default',
      waitExpiredStrategy: 'skip',
      waitAmount: legacyRule.retryPolicy.retryIntervalHours,
      waitUnit: 'hour',
      timeWindow: legacyRule.preferredTimeRange,
      timeoutHours: 72,
    }),
    createNode('end', 'later_complete', '跟进完成', 1540, 80, { resultStatus: 'completed', resultCode: 'FOLLOW_UP_COMPLETED', reportCategory: 'success', writeBackTags: '已完成跟进', emitEvent: true }),
    createNode('end', 'later_rejected', '客户拒绝', 1540, 220, { resultStatus: 'rejected', resultCode: 'CUSTOMER_REJECTED', reportCategory: 'failure', writeBackTags: '拒绝跟进', emitEvent: true }),
    createNode('action', 'later_manual', '创建人工任务', 1540, 380, { actionType: 'manual_task', manualQueueId: 'customer_success', timeoutSeconds: 10, idempotencyKey: '{{task.id}}:manual' }),
    createNode('end', 'later_blocked', '触达受限', 960, 620, { resultStatus: 'expired', resultCode: 'TOUCH_BLOCKED', reportCategory: 'blocked', writeBackTags: '触达受限', emitEvent: true }),
    createNode('end', 'later_manual_end', '转人工结束', 1840, 380, { resultStatus: 'transferred', resultCode: 'MANUAL_FOLLOW_UP', reportCategory: 'manual', writeBackTags: '人工跟进', emitEvent: true }),
  ];

  const edges: FollowUpGraphEdge[] = [
    createEdge('edge_trigger_wait', 'later_trigger', 'later_wait', '生成跟进任务', 'triggered'),
    createEdge('edge_wait_protection', 'later_wait', 'later_protection', '到达执行时间', 'due'),
    createEdge('edge_protection_call', 'later_protection', 'later_call', '允许触达', 'allowed', 'outcome'),
    createEdge('edge_protection_delay', 'later_protection', 'later_retry_wait', '延后触达', 'delayed', 'outcome', 2),
    createEdge('edge_protection_blocked', 'later_protection', 'later_blocked', '禁止触达', 'blocked', 'outcome', 3),
    createEdge('edge_call_complete', 'later_call', 'later_complete', '接通并完成', 'success', 'outcome'),
    createEdge('edge_call_rejected', 'later_call', 'later_rejected', '用户拒绝', 'rejected', 'outcome', 2),
    createEdge('edge_call_retry', 'later_call', 'later_retry_check', '未接通', 'no_answer', 'outcome', 3),
    createEdge('edge_call_failed', 'later_call', 'later_retry_check', '执行失败', 'failed', 'fallback', 4),
    createEdge('edge_retry_yes', 'later_retry_check', 'later_retry_wait', '继续重试', 'matched', 'condition'),
    createEdge('edge_retry_no', 'later_retry_check', 'later_manual', '达到重试上限', 'not_matched', 'condition', 2),
    createEdge('edge_retry_wait_call', 'later_retry_wait', 'later_protection', '重新检查触达', 'due'),
    createEdge('edge_manual_end', 'later_manual', 'later_manual_end', '人工任务已创建', 'success', 'outcome'),
  ];

  return {
    id: legacyRule.id,
    name: legacyRule.name,
    description: '识别用户稍后联系诉求，在合适时间自动外呼，并根据触达结果重试或转人工。',
    status: legacyRule.enabled ? 'published' : 'disabled',
    version: 3,
    priority: 100,
    scope: { botIds: legacyRule.applicableBotIds, flowIds: legacyRule.applicableFlowIds },
    dedupeFieldKeys: ['customer.phone'],
    dedupeStrategy: 'ignore',
    validityDays: 7,
    conflictStrategy: 'latest',
    variables: [
      { key: 'customer.phone', label: '客户手机号', name: '客户手机号', sourceType: 'system', sourceKey: 'customer.phone', type: 'string', required: true },
      { key: 'follow_up_time', label: '跟进时间', name: '跟进时间', sourceType: 'event', sourceKey: 'event.requestedTime', type: 'datetime', required: true },
      { key: 'task.retryCount', label: '重试次数', name: '重试次数', sourceType: 'system', sourceKey: 'task.retryCount', type: 'number', defaultValue: '0', required: true },
      { key: 'customer.riskStatus', label: '客户风险状态', name: '客户风险状态', sourceType: 'system', sourceKey: 'customer.riskStatus', type: 'string' },
      { key: 'call.result', label: '外呼结果', name: '外呼结果', sourceType: 'node', sourceKey: 'call.result', type: 'string' },
    ],
    nodes,
    edges,
    updatedAt: Date.now() - 2 * 60 * 60 * 1000,
  };
}

function buildReviewRule(legacyRule: FollowUpRule): FollowUpRuleGraphDefinition {
  const trigger = createNode('trigger', 'review_trigger', '通话结束', 80, 220, {
    triggerSourceType: 'call',
    triggerEventType: 'post_call_review',
    triggerConditionsLogic: 'ALL',
    triggerConditions: [condition('review_trigger_condition', 'call.endReason', 'equals', 'text', 'completed')],
    triggerDedupeFieldKeys: ['customer.phone'],
    triggerRepeatStrategy: 'update',
    triggerMappings: [mapping('review_trigger_mapping', 'call.satisfaction', 'call.satisfaction', 'text', '', false)],
    triggerEvent: 'post_call_review',
    triggerSource: '通话事件',
    dedupeWindowMinutes: 60,
  });
  const conditionNode = createNode('condition', 'review_condition', '满意度是否缺失', 370, 220, {
    conditionLogic: 'ALL',
    conditionRows: [condition('review_condition_row', 'call.satisfaction', 'not_exists', 'text', '')],
    conditionField: 'call.satisfaction',
    conditionOperator: 'not_exists',
    conditionValue: '',
  });
  const wait = createNode('wait', 'review_wait', '等待回访时间', 660, 160, {
    waitMode: 'fixed',
    waitBaseTime: 'now',
    waitOffsetDirection: 'after',
    waitOffsetAmount: legacyRule.defaultDelayDays,
    waitOffsetUnit: 'day',
    waitWindowEnabled: true,
    waitWindowStart: '09:00',
    waitWindowEnd: '20:00',
    waitInvalidStrategy: 'use_default',
    waitExpiredStrategy: 'skip',
    waitAmount: legacyRule.defaultDelayDays,
    waitUnit: 'day',
    timeWindow: legacyRule.preferredTimeRange,
    timeoutHours: 72,
  });
  const protection = createNode('protection', 'review_protection', '检查触达保护', 960, 160, {
    protectionTemplateId: 'default',
    protectionTarget: 'customer',
    ...legacyRule.touchProtection,
    minIntervalMinutes: 180,
    blockInService: true,
  });
  const call = createNode('action', 'review_call', '满意度回访', 1260, 160, {
    actionType: 'auto_call',
    executionBotIds: [legacyRule.executionBotId || 'bot_didi_demo'],
    executionFlowIds: [legacyRule.executionFlowId || 'lookup'],
    executionBotId: legacyRule.executionBotId || 'bot_didi_demo',
    executionFlowId: legacyRule.executionFlowId || 'lookup',
    parameterMappings: [mapping('review_call_phone', 'customer.phone', 'phone', 'variable', '', true)],
    timeoutSeconds: 30,
    retryCount: 1,
    retryIntervalMinutes: 1,
    idempotencyKey: '{{task.id}}:review',
  });
  const complete = createNode('end', 'review_complete', '回访完成', 1560, 80, { resultStatus: 'completed', resultCode: 'REVIEW_COMPLETED', reportCategory: 'success', writeBackTags: '已回访', emitEvent: true });
  const skip = createNode('end', 'review_skip', '无需回访', 660, 360, { resultStatus: 'cancelled', resultCode: 'SATISFACTION_EXISTS', reportCategory: 'blocked', writeBackTags: '', emitEvent: false });
  const manual = createNode('action', 'review_manual', '创建人工回访', 1560, 260, { actionType: 'manual_task', manualQueueId: 'quality_review', timeoutSeconds: 10, idempotencyKey: '{{task.id}}:review_manual' });
  const manualEnd = createNode('end', 'review_manual_end', '人工接管', 1840, 260, { resultStatus: 'transferred', resultCode: 'MANUAL_REVIEW', reportCategory: 'manual', writeBackTags: '人工回访', emitEvent: true });

  return {
    id: legacyRule.id,
    name: legacyRule.name,
    description: '通话结束后检查满意度状态，并按触达策略发起回访。',
    status: legacyRule.enabled ? 'published' : 'disabled',
    version: 2,
    priority: 90,
    scope: { botIds: legacyRule.applicableBotIds, flowIds: legacyRule.applicableFlowIds },
    dedupeFieldKeys: ['customer.phone'],
    dedupeStrategy: 'update',
    validityDays: 3,
    conflictStrategy: 'latest',
    variables: [
      { key: 'customer.phone', label: '客户手机号', name: '客户手机号', sourceType: 'system', sourceKey: 'customer.phone', type: 'string', required: true },
      { key: 'call.satisfaction', label: '满意度', name: '满意度', sourceType: 'system', sourceKey: 'call.satisfaction', type: 'string' },
      { key: 'customer.riskStatus', label: '客户风险状态', name: '客户风险状态', sourceType: 'system', sourceKey: 'customer.riskStatus', type: 'string' },
    ],
    nodes: [trigger, conditionNode, wait, protection, call, complete, skip, manual, manualEnd],
    edges: [
      createEdge('review_trigger_condition', trigger.id, conditionNode.id, '检查满意度', 'triggered'),
      createEdge('review_condition_wait', conditionNode.id, wait.id, '满意度缺失', 'matched', 'condition'),
      createEdge('review_condition_skip', conditionNode.id, skip.id, '已有满意度', 'not_matched', 'condition', 2),
      createEdge('review_wait_protection', wait.id, protection.id, '到达回访时间', 'due'),
      createEdge('review_protection_call', protection.id, call.id, '允许触达', 'allowed', 'outcome'),
      createEdge('review_protection_skip', protection.id, skip.id, '禁止触达', 'blocked', 'outcome', 2),
      createEdge('review_call_complete', call.id, complete.id, '回访完成', 'success', 'outcome'),
      createEdge('review_call_manual', call.id, manual.id, '执行失败', 'failed', 'fallback', 2),
      createEdge('review_manual_end', manual.id, manualEnd.id, '人工任务已创建', 'success', 'outcome'),
    ],
    updatedAt: Date.now() - 24 * 60 * 60 * 1000,
  };
}

export function createSeedFollowUpRuleGraphs(rules: FollowUpRule[]): FollowUpRuleGraphDefinition[] {
  return rules.map((rule, index) => (index === 0 ? buildLaterContactRule(rule) : buildReviewRule(rule)));
}

export function createBlankFollowUpRule(name = '新建跟进规则'): FollowUpRuleGraphDefinition {
  const trigger = createFollowUpGraphNode('trigger', { x: 80, y: 220 });
  const end = createFollowUpGraphNode('end', { x: 420, y: 220 });
  return {
    id: createId('follow_rule'),
    name,
    description: '',
    status: 'draft',
    version: 1,
    priority: 100,
    scope: { botIds: [], flowIds: [] },
    dedupeFieldKeys: ['customer.phone'],
    dedupeStrategy: 'ignore',
    validityDays: 7,
    conflictStrategy: 'latest',
    variables: [
      { key: 'task.retryCount', label: '重试次数', name: '重试次数', sourceType: 'system', sourceKey: 'task.retryCount', type: 'number', defaultValue: '0', required: true },
      { key: 'customer.phone', label: '客户手机号', name: '客户手机号', sourceType: 'system', sourceKey: 'customer.phone', type: 'string', required: true },
    ],
    nodes: [trigger, end],
    edges: [createFollowUpGraphEdge(trigger, end)],
    updatedAt: Date.now(),
  };
}

export function duplicateFollowUpRule(rule: FollowUpRuleGraphDefinition): FollowUpRuleGraphDefinition {
  const nextId = createId('follow_rule');
  return {
    ...rule,
    id: nextId,
    name: `${rule.name} 副本`,
    status: 'draft',
    disabledFromStatus: undefined,
    version: 1,
    nodes: rule.nodes.map(item => ({ ...item, config: { ...item.config }, position: { ...item.position } })),
    edges: rule.edges.map(item => ({ ...item })),
    variables: rule.variables.map(item => ({ ...item })),
    scope: { botIds: [...rule.scope.botIds], flowIds: [...rule.scope.flowIds] },
    dedupeFieldKeys: [...(rule.dedupeFieldKeys || [])],
    updatedAt: Date.now(),
  };
}

export function toggleFollowUpRuleStatus(rule: FollowUpRuleGraphDefinition): FollowUpRuleGraphDefinition {
  if (rule.status === 'disabled') {
    return {
      ...rule,
      status: rule.disabledFromStatus || 'draft',
      disabledFromStatus: undefined,
      updatedAt: Date.now(),
    };
  }

  return {
    ...rule,
    status: 'disabled',
    disabledFromStatus: rule.status,
    updatedAt: Date.now(),
  };
}

export function moveFollowUpRuleNode(
  rule: FollowUpRuleGraphDefinition,
  nodeId: string,
  position: FollowUpGraphNode['position'],
): FollowUpRuleGraphDefinition {
  return {
    ...rule,
    status: rule.status === 'published' ? 'draft' : rule.status,
    nodes: rule.nodes.map(node => node.id === nodeId ? { ...node, position } : node),
    updatedAt: Date.now(),
  };
}

export function validateFollowUpRule(rule: FollowUpRuleGraphDefinition): FollowUpValidationIssue[] {
  const issues: FollowUpValidationIssue[] = [];
  const nodeIds = new Set(rule.nodes.map(item => item.id));
  const triggerNodes = rule.nodes.filter(item => item.type === 'trigger');
  const endNodes = rule.nodes.filter(item => item.type === 'end');

  if (!rule.name.trim()) issues.push({ id: 'rule_name', level: 'error', message: '规则名称不能为空' });
  if (triggerNodes.length === 0) issues.push({ id: 'trigger_missing', level: 'error', message: '至少需要一个触发器节点' });
  if (endNodes.length === 0) issues.push({ id: 'end_missing', level: 'error', message: '至少需要一个结束节点' });
  if (rule.variables.some(item => !item.key.trim() || !item.label.trim())) issues.push({ id: 'variable_empty', level: 'warning', message: '存在未完整配置的变量' });

  const variableKeys = new Set<string>();
  rule.variables.forEach(variable => {
    if (variableKeys.has(variable.key)) {
      issues.push({ id: `duplicate_variable_${variable.key}`, level: 'error', message: `变量标识重复：${variable.key}` });
    }
    variableKeys.add(variable.key);
  });

  rule.edges.forEach(item => {
    if (!nodeIds.has(item.source) || !nodeIds.has(item.target)) {
      issues.push({ id: `broken_${item.id}`, level: 'error', edgeId: item.id, message: '连线引用了不存在的节点' });
      return;
    }
    const sourceNode = rule.nodes.find(node => node.id === item.source);
    if (sourceNode && !item.isDefault && !getNodeOutputOptions(sourceNode).some(option => option.value === item.sourceHandle)) {
      issues.push({ id: `invalid_output_${item.id}`, level: 'error', edgeId: item.id, message: `${sourceNode.title}不存在“${FOLLOW_UP_SOURCE_RESULT_LABELS[item.sourceHandle] || item.sourceHandle}”结果` });
    }
  });

  rule.nodes.forEach(item => {
    const outgoing = rule.edges.filter(edgeItem => edgeItem.source === item.id);
    if (item.type !== 'end' && outgoing.length === 0) {
      issues.push({ id: `no_output_${item.id}`, level: 'error', nodeId: item.id, message: `${item.title}没有配置下一步` });
    }
    if (item.type === 'condition' && outgoing.length < 2) {
      issues.push({ id: `condition_branch_${item.id}`, level: 'warning', nodeId: item.id, message: `${item.title}建议至少配置两个分支` });
    }
    if (outgoing.filter(edgeItem => edgeItem.isDefault).length > 1) {
      issues.push({ id: `default_branch_${item.id}`, level: 'error', nodeId: item.id, message: `${item.title}只能有一个默认分支` });
    }
    const outputKeys = new Set<string>();
    outgoing.filter(edgeItem => !edgeItem.isDefault).forEach(edgeItem => {
      if (outputKeys.has(edgeItem.sourceHandle)) {
        issues.push({ id: `duplicate_output_${item.id}_${edgeItem.sourceHandle}`, level: 'error', nodeId: item.id, message: `${item.title}的同一结果不能配置多个分支` });
      }
      outputKeys.add(edgeItem.sourceHandle);
    });
    if (item.type === 'trigger' && !item.config.triggerEventType) {
      issues.push({ id: `trigger_event_${item.id}`, level: 'error', nodeId: item.id, message: `${item.title}需要选择事件类型` });
    }
    if (item.type === 'condition') {
      const rows = item.config.conditionRows || [];
      if (rows.length === 0 || rows.some(row => !row.field.trim() || (!['exists', 'not_exists'].includes(row.operator) && !String(row.value || '').trim()))) {
        issues.push({ id: `condition_rows_${item.id}`, level: 'error', nodeId: item.id, message: `${item.title}存在未完成的判断条件` });
      }
    }
    if (item.type === 'wait' && item.config.waitBaseTime === 'variable') {
      const variable = rule.variables.find(variableItem => variableItem.key === item.config.waitVariableKey);
      if (!variable || variable.type !== 'datetime') {
        issues.push({ id: `wait_variable_${item.id}`, level: 'error', nodeId: item.id, message: `${item.title}需要选择日期时间变量` });
      }
    }
    if (item.type === 'action' && !item.config.actionType) {
      issues.push({ id: `action_type_${item.id}`, level: 'error', nodeId: item.id, message: `${item.title}需要选择动作类型` });
    }
    if (item.type === 'action' && item.config.actionType) {
      const config = item.config;
      if (config.actionType === 'auto_call' && (!(config.executionBotIds || []).length || !(config.executionFlowIds || []).length)) {
        issues.push({ id: `call_target_${item.id}`, level: 'error', nodeId: item.id, message: `${item.title}需要配置执行机器人和 Flow` });
      }
      if (config.actionType === 'send_sms' && !config.smsTemplateId) issues.push({ id: `sms_template_${item.id}`, level: 'error', nodeId: item.id, message: `${item.title}需要选择短信模板` });
      if (config.actionType === 'manual_task' && !config.manualQueueId) issues.push({ id: `manual_queue_${item.id}`, level: 'error', nodeId: item.id, message: `${item.title}需要选择处理队列` });
      if (config.actionType === 'call_tool' && !config.toolId) issues.push({ id: `tool_${item.id}`, level: 'error', nodeId: item.id, message: `${item.title}需要选择工具` });
      if (config.actionType === 'write_back' && (!config.writeBackTarget || !(config.writeBackRows || []).length)) issues.push({ id: `write_back_${item.id}`, level: 'error', nodeId: item.id, message: `${item.title}需要配置回写对象和字段` });
      if (!config.idempotencyKey) issues.push({ id: `idempotency_${item.id}`, level: 'error', nodeId: item.id, message: `${item.title}需要配置幂等键` });
    }
    if (item.type === 'end' && (!item.config.resultStatus || !item.config.resultCode || !item.config.reportCategory)) {
      issues.push({ id: `end_result_${item.id}`, level: 'error', nodeId: item.id, message: `${item.title}需要配置任务状态、结果编码和报表分类` });
    }
  });

  const reachable = new Set<string>();
  const queue = triggerNodes.map(item => item.id);
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (reachable.has(current)) continue;
    reachable.add(current);
    rule.edges.filter(item => item.source === current).forEach(item => queue.push(item.target));
  }
  rule.nodes.filter(item => !reachable.has(item.id)).forEach(item => {
    issues.push({ id: `unreachable_${item.id}`, level: 'warning', nodeId: item.id, message: `${item.title}无法从触发器到达` });
  });

  if (rule.scope.botIds.length === 0) {
    issues.push({ id: 'scope_bot', level: 'warning', message: '尚未配置适用机器人' });
  }
  if (rule.scope.flowIds.length === 0) {
    issues.push({ id: 'scope_flow', level: 'warning', message: '尚未配置适用 Flow' });
  }
  if ((rule.dedupeFieldKeys || []).length === 0) {
    issues.push({ id: 'rule_dedupe', level: 'warning', message: '尚未配置任务去重字段' });
  }

  return issues;
}

function compareValue(left: unknown, operator: FollowUpConditionOperator | undefined, right: string | undefined) {
  if (operator === 'exists') return left !== undefined && left !== null && left !== '';
  if (operator === 'not_exists') return left === undefined || left === null || left === '';
  if (operator === 'not_equals') return String(left ?? '') !== String(right ?? '');
  if (operator === 'contains') return String(left ?? '').includes(String(right ?? ''));
  if (operator === 'greater_than') return Number(left) > Number(right);
  if (operator === 'less_than') return Number(left) < Number(right);
  return String(left ?? '') === String(right ?? '');
}

export function simulateFollowUpRule(rule: FollowUpRuleGraphDefinition, variables: Record<string, string>): FollowUpSimulationEvent[] {
  const events: FollowUpSimulationEvent[] = [];
  const trigger = rule.nodes.find(item => item.type === 'trigger');
  if (!trigger) return events;

  let current: FollowUpGraphNode | undefined = trigger;
  let stepCount = 0;
  while (current && stepCount < 30) {
    stepCount += 1;
    events.push({
      nodeId: current.id,
      nodeTitle: current.title,
      detail: current.type === 'end' ? `任务状态：${current.config.resultStatus || 'completed'}` : FOLLOW_UP_NODE_META[current.type].description,
    });
    if (current.type === 'end') break;

    const outgoing = rule.edges
      .filter(item => item.source === current!.id)
      .sort((a, b) => a.priority - b.priority);
    if (outgoing.length === 0) break;

    let nextEdge: FollowUpGraphEdge | undefined;
    if (current.type === 'condition') {
      const rows = current.config.conditionRows?.length ? current.config.conditionRows : current.config.conditionField ? [{
        id: 'legacy',
        field: current.config.conditionField,
        operator: current.config.conditionOperator || 'equals',
        valueType: 'text' as const,
        value: current.config.conditionValue,
      }] : [];
      const matched = (current.config.conditionLogic || 'ALL') === 'ANY'
        ? rows.some(row => compareValue(variables[row.field], row.operator, row.value))
        : rows.every(row => compareValue(variables[row.field], row.operator, row.value));
      nextEdge = outgoing.find(item => item.sourceHandle === (matched ? 'matched' : 'not_matched'));
    } else if (current.type === 'protection') {
      nextEdge = outgoing.find(item => item.sourceHandle === (variables.touchBlocked === 'true' ? 'blocked' : 'allowed'));
    } else if (current.type === 'action') {
      const resultKey = `${current.id}.result`;
      nextEdge = outgoing.find(item => item.sourceHandle === (variables[resultKey] || 'success'));
    } else if (current.type === 'wait') {
      nextEdge = outgoing.find(item => item.sourceHandle === 'due');
    } else {
      nextEdge = outgoing[0];
    }
    nextEdge = nextEdge || outgoing.find(item => item.isDefault) || outgoing[0];
    current = rule.nodes.find(item => item.id === nextEdge?.target);
  }

  if (stepCount >= 30) {
    events.push({ nodeId: 'loop_guard', nodeTitle: '运行已停止', detail: '路径超过30个节点，请检查循环和退出条件' });
  }
  return events;
}

export function autoLayoutFollowUpRule(rule: FollowUpRuleGraphDefinition): FollowUpRuleGraphDefinition {
  const triggers = rule.nodes.filter(item => item.type === 'trigger');
  const depth = new Map<string, number>();
  const queue = triggers.map(item => ({ id: item.id, level: 0 }));
  while (queue.length > 0) {
    const current = queue.shift()!;
    const previous = depth.get(current.id);
    if (previous !== undefined && previous >= current.level) continue;
    depth.set(current.id, current.level);
    rule.edges.filter(item => item.source === current.id).forEach(item => {
      if (current.level < rule.nodes.length) queue.push({ id: item.target, level: current.level + 1 });
    });
  }

  const groups = new Map<number, FollowUpGraphNode[]>();
  rule.nodes.forEach(item => {
    const level = depth.get(item.id) ?? 0;
    groups.set(level, [...(groups.get(level) || []), item]);
  });

  const positioned = rule.nodes.map(item => {
    const level = depth.get(item.id) ?? 0;
    const group = groups.get(level) || [];
    const index = group.findIndex(groupNode => groupNode.id === item.id);
    return { ...item, position: { x: 100 + level * 300, y: 100 + index * 180 } };
  });
  return { ...rule, nodes: positioned, updatedAt: Date.now() };
}
