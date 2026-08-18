// 任务流程编排的常量与纯函数，供画布和配置面板复用。
import type { ComponentType } from 'react';
import {
  Bot,
  CheckCircle2,
  CircleDot,
  Clock3,
  GitBranch,
  Wrench,
} from 'lucide-react';
import type {
  ComponentLibraryItem,
  LongTermFlowEdge,
  LongTermFlowEdgeType,
  LongTermFlowLane,
  LongTermFlowNode,
  LongTermFlowNodeType,
  LongTermLaneRole,
} from './longTermFlowTypes';

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface DraggingNodeState {
  nodeId: string;
  offsetX: number;
  offsetY: number;
}

export interface ConnectionDraftState {
  sourceNodeId: string;
  x: number;
  y: number;
}

export const NODE_WIDTH = 236;
export const NODE_HEIGHT = 148;
export const LANE_HEIGHT = 132;
export const CANVAS_PADDING = 36;
export const LANE_LABEL_WIDTH = 250;
export const MIN_NODE_X = CANVAS_PADDING + LANE_LABEL_WIDTH + 24;

export const COMPONENT_LIBRARY: ComponentLibraryItem[] = [
  { type: '触发器', title: '触发器', description: '名单导入、用户申请、支付变化或定时触发。', icon: CircleDot },
  { type: 'Agent', title: 'Agent 节点', description: '外呼、用户协商、商家协商或审核 Agent。', icon: Bot },
  { type: '等待', title: '等待节点', description: '等待承诺日期、商家回复或外部事件。', icon: Clock3 },
  { type: '条件', title: '条件节点', description: '判断还款、金额、证据、风险或回复状态。', icon: GitBranch },
  { type: '动作', title: '动作节点', description: '发短信、自动退款、创建工单或回写状态。', icon: Wrench },
  { type: '结束', title: '结束节点', description: '完成、关闭、失败或人工接管后的终态。', icon: CheckCircle2 },
];

export const NODE_TYPE_OPTIONS: LongTermFlowNodeType[] = ['触发器', 'Agent', '等待', '条件', '动作', '结束'];
export const EDGE_TYPE_OPTIONS: LongTermFlowEdgeType[] = ['条件分支', '固定流转', '超时流转', '人工兜底'];

export const NODE_TYPE_CLASS_MAP: Record<LongTermFlowNodeType, string> = {
  触发器: 'border-slate-200 bg-white text-slate-700',
  Agent: 'border-blue-200 bg-blue-50 text-blue-700',
  等待: 'border-amber-200 bg-amber-50 text-amber-700',
  条件: 'border-violet-200 bg-violet-50 text-violet-700',
  动作: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  结束: 'border-rose-200 bg-rose-50 text-rose-700',
};

export const NODE_TYPE_ICON_MAP: Record<LongTermFlowNodeType, ComponentType<{ size?: number; className?: string }>> = {
  触发器: CircleDot,
  Agent: Bot,
  等待: Clock3,
  条件: GitBranch,
  动作: Wrench,
  结束: CheckCircle2,
};

export const NODE_DEFAULT_TITLE_MAP: Record<LongTermFlowNodeType, string> = {
  触发器: '新触发器',
  Agent: '新 Agent 节点',
  等待: '新等待节点',
  条件: '新条件节点',
  动作: '新动作节点',
  结束: '新结束节点',
};

export const RISK_CLASS_MAP: Record<LongTermFlowNode['riskLevel'], string> = {
  低: 'bg-emerald-50 text-emerald-700',
  中: 'bg-amber-50 text-amber-700',
  高: 'bg-rose-50 text-rose-700',
};

// 生成适合展示和排序的更新时间。
export function formatFlowTimestamp() {
  return new Intl.DateTimeFormat('zh-Hans-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date()).replaceAll('/', '-');
}

// 将逗号、顿号或换行分隔的文本转换成列表。
export function parseListInput(value: string) {
  return value
    .split(/[，,、\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

// 将列表转换成可编辑文本。
export function formatListInput(values: string[]) {
  return values.join('，');
}

// 根据鼠标位置推断所属泳道。
export function getLaneFromY(lanes: LongTermFlowLane[], y: number): LongTermLaneRole {
  const index = Math.max(0, Math.min(lanes.length - 1, Math.floor((y - CANVAS_PADDING) / LANE_HEIGHT)));
  return lanes[index]?.id || lanes[0].id;
}

// 获取泳道在画布里的纵向位置。
export function getLaneTop(lanes: LongTermFlowLane[], laneId: LongTermLaneRole) {
  const index = Math.max(0, lanes.findIndex((lane) => lane.id === laneId));
  return CANVAS_PADDING + index * LANE_HEIGHT;
}

// 创建一个完整可编辑的新节点。
export function createDesignerNode(
  type: LongTermFlowNodeType,
  point: CanvasPoint,
  lane: LongTermLaneRole,
  sourceNode?: LongTermFlowNode,
): LongTermFlowNode {
  const stamp = Date.now();
  const isWait = type === '等待';
  const isCondition = type === '条件';
  const isAction = type === '动作';
  return {
    id: `long_node_${stamp}`,
    type,
    lane,
    title: NODE_DEFAULT_TITLE_MAP[type],
    subtitle: isWait ? '配置恢复时间' : '补充执行说明',
    description: '配置该节点的执行目标、输入输出、调用工具和失败兜底。',
    dayOffset: sourceNode ? sourceNode.dayOffset + 1 : 0,
    position: {
      x: Math.max(MIN_NODE_X, point.x),
      y: Math.max(CANVAS_PADDING, point.y),
    },
    dependsOn: sourceNode ? [sourceNode.id] : [],
    output: '待配置输出',
    riskLevel: isAction || isCondition ? '中' : '低',
    config: {
      owner: sourceNode?.config.owner || (type === 'Agent' ? '业务 Agent' : '系统调度器'),
      goal: '补充这个节点需要完成的业务目标。',
      inputVariables: [],
      outputVariables: [],
      retryCount: isWait ? 0 : 1,
      fallback: '失败时进入异常队列，并把上下文交给人工处理。',
      prompt: '按执行目标处理当前任务，并记录处理结果。',
      visibleFunctionIds: [],
      transitionFunctionIds: [],
      readStateKeys: [],
      writeStateKeys: [],
      handoffSummaryTemplate: '客户：{{customer_name}}；节点：{{node_name}}；摘要：{{summary}}。',
      waitPolicy: isWait ? '固定等待 1 天，避开夜间触达保护时段。' : undefined,
      condition: isCondition ? '补充判断规则。' : undefined,
      toolName: isAction ? '选择要调用的业务工具。' : undefined,
      waitRule: isWait
        ? {
            mode: '固定等待',
            amount: 1,
            unit: '天',
            dateField: 'created_at',
            resumeEvent: '外部状态更新',
            quietHours: '22:00-09:00 不触达',
            timeoutTarget: '下一节点',
          }
        : undefined,
      conditionRule: isCondition
        ? {
            field: 'status',
            operator: '等于',
            value: '目标状态',
            defaultTarget: '兜底分支',
            description: '补充命中条件和未命中后的默认去向。',
          }
        : undefined,
      toolCall: isAction
        ? {
            toolId: '',
            toolName: '选择要调用的业务工具',
            parameterMappings: [],
            timeoutSeconds: 30,
            idempotencyKey: 'task_id',
            permissionScope: '按业务场景授权',
          }
        : undefined,
    },
  };
}

// 创建一条新连线。
export function createDesignerEdge(source: string, target: string): LongTermFlowEdge {
  const stamp = Date.now();
  return {
    id: `long_edge_${stamp}`,
    source,
    target,
    label: '新增流转',
    edgeType: '固定流转',
    condition: '上一步完成',
    priority: 1,
  };
}

// 获取连线曲线。
export function getEdgePath(sourceNode: LongTermFlowNode, targetNode: LongTermFlowNode) {
  const sourceX = sourceNode.position.x + NODE_WIDTH;
  const sourceY = sourceNode.position.y + NODE_HEIGHT / 2;
  const targetX = targetNode.position.x;
  const targetY = targetNode.position.y + NODE_HEIGHT / 2;
  const curve = Math.max(90, Math.abs(targetX - sourceX) / 2);
  return `M ${sourceX} ${sourceY} C ${sourceX + curve} ${sourceY}, ${targetX - curve} ${targetY}, ${targetX} ${targetY}`;
}
