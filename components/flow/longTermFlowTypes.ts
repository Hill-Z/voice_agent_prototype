// 任务流程配置的类型定义，供列表、流程图工作台和运行任务视图共用。
import type { LucideIcon } from 'lucide-react';

export type LongTermFlowStatus = '草稿' | '已发布' | '运行中' | '已停用';
export type LongTermFlowScenarioType = '催收' | '退款' | '回访' | '售后';
export type LongTermFlowRunStatus = '运行中' | '等待中' | '异常' | '已完成' | '需人工';
export type LongTermFlowNodeType = '触发器' | 'Agent' | '等待' | '条件' | '动作' | '结束';
export type LongTermLaneRole = '系统调度' | '用户沟通 Agent' | '商家协商 Agent' | '风控决策 Agent' | '财务核验 Agent' | '人工处理';
export type LongTermFlowEdgeType = '条件分支' | '固定流转' | '超时流转' | '人工兜底';
export type LongTermFlowSortKey = 'name' | 'status' | 'agentCount' | 'runningTasks' | 'todayTriggers' | 'exceptionTasks' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';
export type LongTermWaitMode = '固定等待' | '日期字段' | '外部事件';
export type LongTermWaitUnit = '分钟' | '小时' | '天';
export type LongTermConditionOperator = '等于' | '不等于' | '大于' | '大于等于' | '小于' | '小于等于' | '存在' | '不存在' | '包含';

export interface LongTermFlowLane {
  id: LongTermLaneRole;
  description: string;
}

export interface LongTermFlowWaitRule {
  mode: LongTermWaitMode;
  amount: number;
  unit: LongTermWaitUnit;
  dateField: string;
  resumeEvent: string;
  quietHours: string;
  timeoutTarget: string;
}

export interface LongTermFlowConditionRule {
  field: string;
  operator: LongTermConditionOperator;
  value: string;
  defaultTarget: string;
  description: string;
}

export interface LongTermFlowToolCall {
  toolId: string;
  toolName: string;
  parameterMappings: string[];
  timeoutSeconds: number;
  idempotencyKey: string;
  permissionScope: string;
}

export interface LongTermFlowNodeConfig {
  owner: string;
  goal: string;
  inputVariables: string[];
  outputVariables: string[];
  retryCount: number;
  fallback: string;
  prompt: string;
  visibleFunctionIds: string[];
  transitionFunctionIds: string[];
  readStateKeys: string[];
  writeStateKeys: string[];
  handoffSummaryTemplate: string;
  delayProfileId?: string;
  primaryFunctionId?: string;
  waitPolicy?: string;
  condition?: string;
  toolName?: string;
  waitRule?: LongTermFlowWaitRule;
  conditionRule?: LongTermFlowConditionRule;
  toolCall?: LongTermFlowToolCall;
}

export interface LongTermFlowNode {
  id: string;
  type: LongTermFlowNodeType;
  lane: LongTermLaneRole;
  title: string;
  subtitle: string;
  description: string;
  dayOffset: number;
  position: {
    x: number;
    y: number;
  };
  dependsOn: string[];
  output: string;
  riskLevel: '低' | '中' | '高';
  config: LongTermFlowNodeConfig;
}

export interface LongTermFlowEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  edgeType: LongTermFlowEdgeType;
  condition: string;
  priority: number;
  isDefault?: boolean;
}

export interface LongTermFlowRunEvent {
  id: string;
  time: string;
  title: string;
  detail: string;
  status: '成功' | '等待' | '异常' | '人工';
  nodeId?: string;
}

export interface LongTermFlowRun {
  id: string;
  flowId: string;
  customer: string;
  status: LongTermFlowRunStatus;
  currentNode: string;
  nextTriggerAt: string;
  owner: string;
  exceptionReason?: string;
  events: LongTermFlowRunEvent[];
}

export type LongTermFlowRunStore = Record<string, LongTermFlowRun[]>;

export interface LongTermFlowDefinition {
  id: string;
  name: string;
  scenarioType: LongTermFlowScenarioType;
  status: LongTermFlowStatus;
  owner: string;
  description: string;
  agentCount: number;
  runningTasks: number;
  todayTriggers: number;
  exceptionTasks: number;
  updatedAt: string;
  lanes: LongTermFlowLane[];
  nodes: LongTermFlowNode[];
  edges: LongTermFlowEdge[];
}

export interface LongTermFlowSummary {
  totalFlows: number;
  runningTasks: number;
  todayTriggers: number;
  exceptionTasks: number;
}

export interface LongTermFlowFilter {
  searchTerm: string;
  statusFilter: LongTermFlowStatus | '全部状态';
  scenarioFilter: LongTermFlowScenarioType | '全部场景';
}

export interface LongTermFlowSortConfig {
  key: LongTermFlowSortKey;
  direction: SortDirection;
}

export interface ComponentLibraryItem {
  type: LongTermFlowNodeType;
  title: string;
  description: string;
  icon: LucideIcon;
}
