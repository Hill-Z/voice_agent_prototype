// 机器人级 Agent 编排的默认数据、资源选项和校验规则，供配置页面复用。
import {
  AgentOrchestrationConfig,
  AgentOrchestrationContextPolicy,
  AgentOrchestrationEdge,
  AgentOrchestrationGraphSnapshot,
  AgentOrchestrationMode,
  AgentOrchestrationNode,
  BotConfiguration,
} from '../../types';

export const DEFAULT_CONTEXT_POLICY: AgentOrchestrationContextPolicy = {
  history: 'summary',
  historyTurns: 4,
  variableNames: [],
  includeCurrentStep: true,
  includeLastToolResult: true,
};

export const ORCHESTRATION_MODES: Array<{ value: AgentOrchestrationMode; label: string; description: string }> = [
  { value: 'single', label: '单 Agent', description: '沿用当前机器人配置' },
  { value: 'supervisor', label: 'Supervisor', description: 'Supervisor 按能力统一分派对话和任务' },
  { value: 'handoff', label: 'Handoff', description: '业务 Agent 按明确规则直接接力' },
];

export const NODE_TYPE_LABELS: Record<AgentOrchestrationNode['type'], string> = {
  supervisor: 'Supervisor',
  flow_agent: 'Flow Agent',
  topic_agent: '主题 Agent',
  task_agent: '任务 Agent',
  human: '人工服务',
  end: '挂机',
};

export const EDGE_TYPE_LABELS: Record<AgentOrchestrationEdge['type'], string> = {
  handoff: '接管对话',
  delegate: '委派任务',
  fanout: '并行任务',
  escalate: '转人工',
  fallback: '兜底',
};

export const DEFAULT_HUMAN_TARGETS = [
  { id: 'ivr_general_queue', name: '通用人工队列' },
  { id: 'ivr_expert', name: '专家坐席组' },
  { id: 'ivr_complaint', name: '投诉建议专线' },
];

export function getHumanTargets(bot: BotConfiguration): Array<{ id: string; name: string }> {
  const targets = new Map(DEFAULT_HUMAN_TARGETS.map((item) => [item.id, item.name]));
  const configured = [
    bot.transferIvrTarget,
    bot.globalExceptionPolicy?.fallbackIvrTarget,
    ...(bot.topicSkillLibraryConfig?.skills || []).map((skill) => skill.transferIvrTarget),
  ].filter((item): item is string => Boolean(item));
  configured.forEach((id) => {
    if (!targets.has(id)) targets.set(id, id);
  });
  return Array.from(targets, ([id, name]) => ({ id, name }));
}

export function createAgentNode(
  id: string,
  type: AgentOrchestrationNode['type'],
  name: string,
  position: { x: number; y: number },
  refId?: string,
  refName?: string,
): AgentOrchestrationNode {
  const isConversationAgent = type === 'flow_agent' || type === 'topic_agent';
  return {
    id,
    type,
    name,
    refId,
    refName,
    enabled: true,
    position,
    entryIntents: [],
    resourcePolicy: isConversationAgent ? 'inherit' : 'custom',
    toolIds: [],
    knowledgeBaseIds: [],
    contextPolicy: { ...DEFAULT_CONTEXT_POLICY },
    maxExecutionSeconds: type === 'task_agent' ? 30 : 0,
    lockCurrentStep: type === 'flow_agent',
    supervisorPrompt: type === 'supervisor' ? '根据用户诉求、当前对话和各 Agent 的能力说明，选择接管对话的 Agent 或需要执行的任务。' : undefined,
    taskPrompt: type === 'task_agent' ? '' : undefined,
    taskOutputSchema: type === 'task_agent' ? '{\n  "status": "success",\n  "result": {}\n}' : undefined,
    handoffSummaryTemplate: isConversationAgent ? '保留已确认的业务信息和最近一次工具结果。' : undefined,
    hangupSpeeches: type === 'end' ? ['感谢您的来电，祝您生活愉快，再见。'] : undefined,
  };
}

export function createAgentEdge(
  id: string,
  source: string,
  target: string,
  type: AgentOrchestrationEdge['type'] = 'handoff',
): AgentOrchestrationEdge {
  const isTaskEdge = type === 'delegate' || type === 'fanout';
  return {
    id,
    source,
    target,
    type,
    label: EDGE_TYPE_LABELS[type],
    priority: type === 'fallback' ? 999 : 10,
    conditionMode: type === 'fallback' ? 'always' : 'intent',
    conditionValue: '',
    eligibilityExpression: '',
    inputMappings: [],
    outputMappings: [],
    contextPolicy: { ...DEFAULT_CONTEXT_POLICY },
    timeoutSeconds: isTaskEdge ? 15 : undefined,
    onFailure: type === 'escalate' ? 'continue' : 'fallback',
    returnToSource: isTaskEdge,
    speechMode: type === 'handoff' || type === 'escalate' ? 'fixed' : 'none',
    speeches: type === 'handoff' ? ['好的，我继续为您处理。'] : type === 'escalate' ? ['好的，我为您转接人工客服。'] : [],
    parallelGroupId: type === 'fanout' ? 'parallel_1' : undefined,
    fanoutJoinStrategy: type === 'fanout' ? 'all' : undefined,
    fanoutMergeStrategy: type === 'fanout' ? 'source_agent' : undefined,
    enabled: true,
  };
}

export function graphSnapshot(config: AgentOrchestrationConfig): AgentOrchestrationGraphSnapshot {
  return {
    supervisorNodeId: config.supervisorNodeId,
    initialNodeId: config.initialNodeId,
    fallbackNodeId: config.fallbackNodeId,
    maxHandoffCount: config.maxHandoffCount,
    nodes: config.nodes,
    edges: config.edges,
  };
}

export function createDefaultOrchestration(_bot: BotConfiguration): AgentOrchestrationConfig {
  return {
    enabled: false,
    mode: 'single',
    status: 'draft',
    draftVersion: 1,
    publishedVersion: undefined,
    initialNodeId: undefined,
    fallbackNodeId: undefined,
    maxHandoffCount: 3,
    nodes: [],
    edges: [],
    modeDrafts: {},
    updatedAt: Date.now(),
  };
}

function normalizeNode(node: AgentOrchestrationNode): AgentOrchestrationNode {
  return {
    ...createAgentNode(node.id, node.type, node.name, node.position, node.refId, node.refName),
    ...node,
    resourcePolicy: node.resourcePolicy || (node.type === 'flow_agent' || node.type === 'topic_agent' ? 'inherit' : 'custom'),
    contextPolicy: { ...DEFAULT_CONTEXT_POLICY, ...(node.contextPolicy || {}) },
    taskPrompt: node.type === 'task_agent' ? node.taskPrompt || node.description || '' : node.taskPrompt,
    taskOutputSchema: node.type === 'task_agent' ? node.taskOutputSchema || '{\n  "status": "success",\n  "result": {}\n}' : node.taskOutputSchema,
    hangupSpeeches: node.type === 'end' ? node.hangupSpeeches?.length ? node.hangupSpeeches : ['感谢您的来电，祝您生活愉快，再见。'] : node.hangupSpeeches,
  };
}

function normalizeEdge(edge: AgentOrchestrationEdge): AgentOrchestrationEdge {
  const isTaskEdge = edge.type === 'delegate' || edge.type === 'fanout';
  return {
    ...createAgentEdge(edge.id, edge.source, edge.target, edge.type),
    ...edge,
    conditionMode: edge.type === 'fallback' ? 'always' : edge.conditionMode,
    priority: edge.type === 'fallback' ? 999 : edge.priority,
    returnToSource: isTaskEdge,
    contextPolicy: { ...DEFAULT_CONTEXT_POLICY, ...(edge.contextPolicy || {}) },
  };
}

function normalizeSnapshot(snapshot: AgentOrchestrationGraphSnapshot): AgentOrchestrationGraphSnapshot {
  return {
    ...snapshot,
    nodes: snapshot.nodes.map(normalizeNode),
    edges: snapshot.edges.map(normalizeEdge),
  };
}

export function normalizeOrchestration(value: AgentOrchestrationConfig | undefined, bot: BotConfiguration): AgentOrchestrationConfig {
  if (!value) return createDefaultOrchestration(bot);
  const defaults = createDefaultOrchestration(bot);
  const normalized: AgentOrchestrationConfig = {
    ...defaults,
    ...value,
    mode: value.mode === ('adaptive_network' as AgentOrchestrationMode) ? 'handoff' : value.mode,
    nodes: value.nodes?.map(normalizeNode) || defaults.nodes,
    edges: value.edges?.map(normalizeEdge) || defaults.edges,
    modeDrafts: Object.fromEntries(
      Object.entries(value.modeDrafts || {}).map(([mode, snapshot]) => [mode, normalizeSnapshot(snapshot)]),
    ),
  };
  if (normalized.mode !== 'single') {
    normalized.modeDrafts = { ...normalized.modeDrafts, [normalized.mode]: graphSnapshot(normalized) };
  }
  return normalized;
}

export function validateOrchestration(config: AgentOrchestrationConfig): Array<{ level: 'error' | 'warning'; code: string; message: string; targetId?: string }> {
  const issues: Array<{ level: 'error' | 'warning'; code: string; message: string; targetId?: string }> = [];
  if (config.mode === 'single') return issues;

  const nodeMap = new Map(config.nodes.map((node) => [node.id, node]));
  const enabledNodes = config.nodes.filter((node) => node.enabled);
  const enabledNodeIds = new Set(enabledNodes.map((node) => node.id));
  const enabledEdges = config.edges.filter((edge) => edge.enabled);

  if (enabledNodes.length < 2) issues.push({ level: 'error', code: 'AGENT_COUNT', message: '多 Agent 模式至少需要两个已启用节点。' });

  if (config.mode === 'supervisor') {
    const supervisors = enabledNodes.filter((node) => node.type === 'supervisor');
    if (supervisors.length !== 1) issues.push({ level: 'error', code: 'SUPERVISOR_COUNT', message: 'Supervisor 模式必须且只能有一个 Supervisor。' });
    if (!config.supervisorNodeId || !enabledNodeIds.has(config.supervisorNodeId)) issues.push({ level: 'error', code: 'SUPERVISOR_MISSING', message: '未配置有效的 Supervisor 节点。' });
  }
  if (config.mode === 'handoff' && (!config.initialNodeId || !enabledNodeIds.has(config.initialNodeId))) {
    issues.push({ level: 'error', code: 'INITIAL_AGENT', message: 'Handoff 模式必须配置入口 Agent。' });
  }
  if (!config.fallbackNodeId || !enabledNodeIds.has(config.fallbackNodeId)) {
    issues.push({ level: 'error', code: 'FALLBACK_MISSING', message: '未配置有效的兜底 Agent。' });
  } else {
    const fallbackNode = nodeMap.get(config.fallbackNodeId);
    if (fallbackNode && !['flow_agent', 'topic_agent', 'human'].includes(fallbackNode.type)) {
      issues.push({ level: 'error', code: 'FALLBACK_TYPE', message: '兜底 Agent 必须是对话 Agent 或人工服务。', targetId: fallbackNode.id });
    }
  }

  enabledNodes.forEach((node) => {
    if (!node.name.trim()) issues.push({ level: 'error', code: 'NODE_NAME', message: '节点名称不能为空。', targetId: node.id });
    if ((node.type === 'flow_agent' || node.type === 'topic_agent') && !node.refId) {
      issues.push({ level: 'error', code: 'NODE_REF', message: `${node.name} 未关联业务资源。`, targetId: node.id });
    }
    if (node.type === 'task_agent') {
      if (!node.taskPrompt?.trim()) issues.push({ level: 'error', code: 'TASK_PROMPT', message: `${node.name} 未配置任务提示词。`, targetId: node.id });
      if (node.toolIds.length === 0) issues.push({ level: 'error', code: 'TASK_TOOL', message: `${node.name} 至少需要一个可用工具。`, targetId: node.id });
      if (!node.taskOutputSchema?.trim()) issues.push({ level: 'error', code: 'TASK_OUTPUT', message: `${node.name} 未配置输出格式。`, targetId: node.id });
    }
    if (node.type === 'human' && !node.humanTargetId) issues.push({ level: 'error', code: 'HUMAN_TARGET', message: `${node.name} 未配置人工目标。`, targetId: node.id });
    if (node.type === 'end' && !node.hangupSpeeches?.some((speech) => speech.trim())) {
      issues.push({ level: 'error', code: 'HANGUP_SPEECH', message: `${node.name} 未配置挂机话术。`, targetId: node.id });
    }
  });

  enabledEdges.forEach((edge) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) issues.push({ level: 'error', code: 'EDGE_TARGET', message: '连线引用了不存在的节点。', targetId: edge.id });
    if (!enabledNodeIds.has(edge.source) || !enabledNodeIds.has(edge.target)) issues.push({ level: 'error', code: 'EDGE_DISABLED_NODE', message: '连线不能连接到已停用节点。', targetId: edge.id });
    if (edge.source === edge.target) issues.push({ level: 'error', code: 'SELF_LOOP', message: '连线不能连接到自身。', targetId: edge.id });

    const supervisorDispatch = config.mode === 'supervisor' && source?.type === 'supervisor';
    if (!supervisorDispatch && edge.type !== 'fallback' && edge.conditionMode !== 'always' && !edge.conditionValue.trim()) {
      issues.push({ level: 'error', code: 'EDGE_CONDITION', message: '转交边必须填写触发条件。', targetId: edge.id });
    }
    if (edge.type === 'fallback' && edge.conditionMode !== 'always') issues.push({ level: 'error', code: 'FALLBACK_ALWAYS', message: '兜底边必须始终执行。', targetId: edge.id });
    if ((edge.type === 'delegate' || edge.type === 'fanout') && target?.type !== 'task_agent') {
      issues.push({ level: 'error', code: 'TASK_TARGET', message: `${EDGE_TYPE_LABELS[edge.type]}必须连接任务 Agent。`, targetId: edge.id });
    }
    if ((edge.type === 'delegate' || edge.type === 'fanout') && (!edge.timeoutSeconds || edge.timeoutSeconds <= 0)) {
      issues.push({ level: 'error', code: 'TIMEOUT', message: `${EDGE_TYPE_LABELS[edge.type]}必须设置超时时间。`, targetId: edge.id });
    }
    if (edge.type === 'escalate' && target?.type !== 'human') issues.push({ level: 'error', code: 'ESCALATE_TARGET', message: '转人工边必须连接人工服务节点。', targetId: edge.id });
    if ((edge.type === 'handoff' || edge.type === 'fallback') && target?.type === 'task_agent') issues.push({ level: 'error', code: 'HANDOFF_TASK', message: '任务 Agent 只能通过委派或并行任务调用。', targetId: edge.id });
    if (edge.speechMode === 'fixed' && !edge.speeches.some((speech) => speech.trim())) issues.push({ level: 'error', code: 'EDGE_SPEECH', message: `${edge.label || '转交边'} 未配置转接话术。`, targetId: edge.id });
    if (edge.type === 'fanout' && !edge.parallelGroupId?.trim()) issues.push({ level: 'error', code: 'FANOUT_GROUP', message: '并行任务必须配置并行组。', targetId: edge.id });
  });

  const fallbackBySource = new Map<string, number>();
  enabledEdges.filter((edge) => edge.type === 'fallback').forEach((edge) => fallbackBySource.set(edge.source, (fallbackBySource.get(edge.source) || 0) + 1));
  fallbackBySource.forEach((count) => {
    if (count > 1) issues.push({ level: 'error', code: 'FALLBACK_DUPLICATE', message: '同一来源节点最多只能配置一条兜底边。' });
  });

  const fanoutGroups = new Map<string, AgentOrchestrationEdge[]>();
  enabledEdges.filter((edge) => edge.type === 'fanout').forEach((edge) => {
    const key = `${edge.source}:${edge.parallelGroupId || ''}`;
    fanoutGroups.set(key, [...(fanoutGroups.get(key) || []), edge]);
  });
  fanoutGroups.forEach((edges) => {
    if (edges.length < 2) issues.push({ level: 'error', code: 'FANOUT_SIZE', message: '一个并行组至少需要连接两个任务 Agent。', targetId: edges[0]?.id });
  });

  if (config.mode === 'handoff') {
    if (enabledEdges.length > 0 && !enabledEdges.some((edge) => edge.type === 'fallback')) {
      issues.push({ level: 'warning', code: 'NO_FALLBACK_EDGE', message: '当前编排没有显式兜底边，将使用默认兜底 Agent。' });
    }
    const priorityKeys = new Set<string>();
    enabledEdges.filter((edge) => edge.type !== 'fallback').forEach((edge) => {
      const key = `${edge.source}:${edge.priority}`;
      if (priorityKeys.has(key)) issues.push({ level: 'warning', code: 'EDGE_PRIORITY', message: '同一节点存在相同优先级的转交边。', targetId: edge.id });
      priorityKeys.add(key);
    });
  }
  return issues;
}
