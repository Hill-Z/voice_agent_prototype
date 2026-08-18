// 任务流程配置容器，管理流程创建、列表、编排、运行任务视图和本地持久化。
import React, { useEffect, useMemo, useState } from 'react';
import { LONG_TERM_FLOW_DEFINITIONS, LONG_TERM_FLOW_RUNS_BY_FLOW_ID } from './longTermFlowData';
import { MIN_NODE_X } from './longTermFlowDesignerUtils';
import LongTermFlowDesigner from './LongTermFlowDesigner';
import LongTermFlowList from './LongTermFlowList';
import LongTermFlowRuns from './LongTermFlowRuns';
import type { LongTermFlowDefinition, LongTermFlowNodeConfig, LongTermFlowRun, LongTermFlowRunStore } from './longTermFlowTypes';

type ViewMode = 'list' | 'designer' | 'runs';

const FLOW_STORAGE_KEY = 'ai-voice-bot.long-term-flows.v1';
const RUN_STORAGE_KEY = 'ai-voice-bot.long-term-flow-runs.v1';
const LEGACY_NODE_PROMPTS = new Set([
  '根据当前任务上下文执行节点目标，输出结构化处理结果。',
  '根据任务上下文执行当前节点目标，并输出结构化处理结果。',
]);
const DEFAULT_NODE_PROMPT = '按执行目标处理当前任务，并记录处理结果。';

// 判断本地存储中的对象是否是可用流程定义。
function isFlowDefinition(value: unknown): value is LongTermFlowDefinition {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string'
    && typeof record.name === 'string'
    && typeof record.status === 'string'
    && typeof record.owner === 'string'
    && Array.isArray(record.lanes)
    && Array.isArray(record.nodes)
    && Array.isArray(record.edges)
  );
}

// 判断本地存储中的对象是否是可用运行任务。
function isFlowRun(value: unknown): value is LongTermFlowRun {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string'
    && typeof record.flowId === 'string'
    && typeof record.customer === 'string'
    && typeof record.status === 'string'
    && typeof record.currentNode === 'string'
    && typeof record.nextTriggerAt === 'string'
    && typeof record.owner === 'string'
    && Array.isArray(record.events)
  );
}

// 清理旧版本本地数据中残留的内部说明文案。
function normalizeStoredFlow(flow: LongTermFlowDefinition): LongTermFlowDefinition {
  return {
    ...flow,
    nodes: flow.nodes.map((node) => {
      const config = cloneNodeConfig(node.config);
      return {
        ...node,
        config: {
          ...config,
          prompt: LEGACY_NODE_PROMPTS.has(config.prompt) ? DEFAULT_NODE_PROMPT : config.prompt,
        },
        position: {
          ...node.position,
          x: Math.max(MIN_NODE_X, node.position.x),
        },
      };
    }),
  };
}

// 从浏览器本地存储读取流程配置。
function loadStoredFlows(): LongTermFlowDefinition[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(FLOW_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const flows = parsed.filter(isFlowDefinition).map(normalizeStoredFlow);
    return flows.length ? flows : null;
  } catch (error) {
    console.warn('读取任务流程配置失败，已使用默认配置。', error);
    return null;
  }
}

// 保存流程配置到浏览器本地存储。
function persistFlows(flows: LongTermFlowDefinition[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(flows));
  } catch (error) {
    console.warn('保存任务流程配置失败，请检查浏览器存储空间。', error);
  }
}

// 从浏览器本地存储读取运行任务，避免把运行实例混进流程模板。
function loadStoredRuns(): LongTermFlowRunStore | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(RUN_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    const entries = Object.entries(parsed as Record<string, unknown>)
      .map(([flowId, value]) => [flowId, Array.isArray(value) ? value.filter(isFlowRun) : []] as const)
      .filter(([, runs]) => runs.length > 0);
    return entries.length ? Object.fromEntries(entries) : null;
  } catch (error) {
    console.warn('读取任务运行实例失败，已使用默认运行数据。', error);
    return null;
  }
}

// 保存运行任务到独立本地存储。
function persistRuns(runsByFlowId: LongTermFlowRunStore) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RUN_STORAGE_KEY, JSON.stringify(runsByFlowId));
  } catch (error) {
    console.warn('保存任务运行实例失败，请检查浏览器存储空间。', error);
  }
}

// 生成适合展示和排序的更新时间。
function formatNow() {
  return new Intl.DateTimeFormat('zh-Hans-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date()).replaceAll('/', '-');
}

// 创建基础节点配置。
function createBaseNodeConfig(overrides: Partial<LongTermFlowNodeConfig> = {}): LongTermFlowNodeConfig {
  return {
    owner: '系统调度器',
    goal: '完成当前节点的业务处理并输出明确结果。',
    inputVariables: [],
    outputVariables: [],
    retryCount: 1,
    fallback: '失败时进入异常队列并通知负责人。',
    prompt: '按执行目标处理当前任务，并记录处理结果。',
    visibleFunctionIds: [],
    transitionFunctionIds: [],
    readStateKeys: [],
    writeStateKeys: [],
    handoffSummaryTemplate: '客户：{{customer_name}}；当前节点：{{node_name}}；处理摘要：{{summary}}。',
    ...overrides,
  };
}

// 复制节点配置，避免模板和草稿共享数组或结构化规则对象。
function cloneNodeConfig(config: LongTermFlowNodeConfig): LongTermFlowNodeConfig {
  return {
    ...config,
    inputVariables: [...config.inputVariables],
    outputVariables: [...config.outputVariables],
    visibleFunctionIds: [...config.visibleFunctionIds],
    transitionFunctionIds: [...config.transitionFunctionIds],
    readStateKeys: [...config.readStateKeys],
    writeStateKeys: [...config.writeStateKeys],
    waitRule: config.waitRule ? { ...config.waitRule } : undefined,
    conditionRule: config.conditionRule ? { ...config.conditionRule } : undefined,
    toolCall: config.toolCall
      ? {
          ...config.toolCall,
          parameterMappings: [...config.toolCall.parameterMappings],
        }
      : undefined,
  };
}

// 获取当前可用的默认流程，避免默认节点压住泳道说明。
function getDefaultFlows(): LongTermFlowDefinition[] {
  return LONG_TERM_FLOW_DEFINITIONS.map(normalizeStoredFlow);
}

// 从当前工作区创建一个最小可编辑流程。
function createBlankFlow(template: LongTermFlowDefinition): LongTermFlowDefinition {
  const id = `custom-flow-${Date.now()}`;
  const triggerId = `${id}-trigger`;
  const endId = `${id}-end`;
  return {
    id,
    name: '新任务流程',
    scenarioType: template.scenarioType,
    status: '草稿',
    owner: template.owner,
    description: '配置触发条件、Agent 协作、等待恢复、分支判断和结束动作。',
    agentCount: 0,
    runningTasks: 0,
    todayTriggers: 0,
    exceptionTasks: 0,
    updatedAt: formatNow(),
    lanes: template.lanes,
    nodes: [
      {
        id: triggerId,
        type: '触发器',
        lane: '系统调度',
        title: '任务触发',
        subtitle: '配置启动条件',
        description: '从名单、外部事件或定时策略启动任务。',
        dayOffset: 0,
        position: { x: MIN_NODE_X, y: 70 },
        dependsOn: [],
        output: '任务上下文',
        riskLevel: '低',
        config: createBaseNodeConfig({
          owner: '系统调度器',
          goal: '创建任务实例并写入初始上下文。',
          outputVariables: ['task_id', 'customer_id'],
          writeStateKeys: ['task_id', 'customer_id'],
        }),
      },
      {
        id: endId,
        type: '结束',
        lane: '系统调度',
        title: '任务结束',
        subtitle: '回写结果',
        description: '关闭任务并同步最终状态。',
        dayOffset: 0,
        position: { x: MIN_NODE_X + 360, y: 70 },
        dependsOn: [triggerId],
        output: '最终状态',
        riskLevel: '低',
        config: createBaseNodeConfig({
          owner: '系统调度器',
          goal: '记录任务结果并回写业务系统。',
          inputVariables: ['task_id', 'result'],
          outputVariables: ['closed_at'],
          writeStateKeys: ['closed_at'],
        }),
      },
    ],
    edges: [
      {
        id: `${id}-edge-start`,
        source: triggerId,
        target: endId,
        label: '完成后结束',
        edgeType: '固定流转',
        condition: '任务初始化成功',
        priority: 1,
      },
    ],
  };
}

// 从现有流程复制一个草稿，保留配置但清空运行实例。
function cloneFlowAsDraft(source: LongTermFlowDefinition): LongTermFlowDefinition {
  const id = `template-flow-${Date.now()}`;
  const nodeIdMap = new Map(source.nodes.map((node) => [node.id, `${id}-${node.id}`]));
  const nodes = source.nodes.map((node) => ({
    ...node,
    id: nodeIdMap.get(node.id) || node.id,
    position: { ...node.position },
    dependsOn: node.dependsOn.map((nodeId) => nodeIdMap.get(nodeId) || nodeId),
    config: cloneNodeConfig(node.config),
  }));
  const edges = source.edges.map((edge) => ({
    ...edge,
    id: `${id}-${edge.id}`,
    source: nodeIdMap.get(edge.source) || edge.source,
    target: nodeIdMap.get(edge.target) || edge.target,
  }));
  return {
    ...source,
    id,
    name: `${source.name} 副本`,
    status: '草稿',
    runningTasks: 0,
    todayTriggers: 0,
    exceptionTasks: 0,
    updatedAt: formatNow(),
    nodes,
    edges,
  };
}

// 主容器组件。
export default function LongTermFlowConfig() {
  const [flows, setFlows] = useState<LongTermFlowDefinition[]>(() => loadStoredFlows() || getDefaultFlows());
  const [runsByFlowId, setRunsByFlowId] = useState<LongTermFlowRunStore>(() => loadStoredRuns() || LONG_TERM_FLOW_RUNS_BY_FLOW_ID);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedFlowId, setSelectedFlowId] = useState(LONG_TERM_FLOW_DEFINITIONS[0]?.id || '');

  useEffect(() => {
    persistFlows(flows);
  }, [flows]);

  useEffect(() => {
    persistRuns(runsByFlowId);
  }, [runsByFlowId]);

  const selectedFlow = useMemo(
    () => flows.find((flow) => flow.id === selectedFlowId) || flows[0],
    [flows, selectedFlowId],
  );

  // 打开流程编排页。
  const openDesigner = (flowId: string) => {
    setSelectedFlowId(flowId);
    setViewMode('designer');
  };

  // 打开运行任务视图。
  const openRuns = (flowId: string) => {
    setSelectedFlowId(flowId);
    setViewMode('runs');
  };

  // 更新流程定义，支撑节点配置面板的真实前端编辑能力。
  const updateFlow = (updatedFlow: LongTermFlowDefinition) => {
    setFlows((currentFlows) => currentFlows.map((flow) => (flow.id === updatedFlow.id ? updatedFlow : flow)));
  };

  // 保存草稿时保留当前状态，未来接后端时在这里换成接口提交。
  const saveDraft = (flowId: string) => {
    setFlows((currentFlows) => currentFlows.map((flow) => (flow.id === flowId ? { ...flow, status: '草稿' } : flow)));
  };

  // 新建一个空白流程并直接进入画布。
  const createNewFlow = () => {
    const draftFlow = createBlankFlow(selectedFlow || flows[0]);
    setFlows((currentFlows) => [draftFlow, ...currentFlows]);
    setRunsByFlowId((currentRuns) => ({ ...currentRuns, [draftFlow.id]: [] }));
    setSelectedFlowId(draftFlow.id);
    setViewMode('designer');
  };

  // 从当前选中流程复制一个可编辑草稿。
  const createFlowFromTemplate = (flowId: string) => {
    const source = flows.find((flow) => flow.id === flowId) || selectedFlow || flows[0];
    const draftFlow = cloneFlowAsDraft(source);
    setFlows((currentFlows) => [draftFlow, ...currentFlows]);
    setRunsByFlowId((currentRuns) => ({ ...currentRuns, [draftFlow.id]: [] }));
    setSelectedFlowId(draftFlow.id);
    setViewMode('designer');
  };

  if (!selectedFlow) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        暂无任务流程配置。
      </div>
    );
  }

  if (viewMode === 'designer') {
    return (
      <LongTermFlowDesigner
        flow={selectedFlow}
        onBackToList={() => setViewMode('list')}
        onOpenRuns={() => setViewMode('runs')}
        onUpdateFlow={updateFlow}
        onSaveDraft={saveDraft}
      />
    );
  }

  if (viewMode === 'runs') {
    return (
      <LongTermFlowRuns
        flow={selectedFlow}
        runs={runsByFlowId[selectedFlow.id] || []}
        onBackToDesigner={() => setViewMode('designer')}
        onBackToList={() => setViewMode('list')}
      />
    );
  }

  return (
    <div className="min-h-full bg-slate-50">
      <LongTermFlowList
        flows={flows}
        selectedFlowId={selectedFlowId}
        onSelectFlow={setSelectedFlowId}
        onOpenDesigner={openDesigner}
        onOpenRuns={openRuns}
        onCreateNewFlow={createNewFlow}
        onCreateFromTemplate={createFlowFromTemplate}
      />
    </div>
  );
}

