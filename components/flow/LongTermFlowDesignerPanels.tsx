// 任务流程右侧配置抽屉，负责按节点类型编辑节点配置和分支流转条件。
import React from 'react';
import { Trash2 } from 'lucide-react';
import {
  EDGE_TYPE_OPTIONS,
  formatListInput,
  NODE_TYPE_OPTIONS,
  parseListInput,
} from './longTermFlowDesignerUtils';
import type {
  LongTermConditionOperator,
  LongTermFlowEdge,
  LongTermFlowEdgeType,
  LongTermFlowLane,
  LongTermFlowNode,
  LongTermFlowNodeConfig,
  LongTermFlowNodeType,
  LongTermLaneRole,
  LongTermWaitMode,
  LongTermWaitUnit,
} from './longTermFlowTypes';

interface NodeConfigPanelProps {
  node: LongTermFlowNode;
  lanes: LongTermFlowLane[];
  onNodeChange: (node: LongTermFlowNode) => void;
  onDeleteNode: (nodeId: string) => void;
}

interface EdgeConfigPanelProps {
  edge: LongTermFlowEdge;
  nodes: LongTermFlowNode[];
  onEdgeChange: (edge: LongTermFlowEdge) => void;
  onDeleteEdge: (edgeId: string) => void;
}

type WaitRule = NonNullable<LongTermFlowNodeConfig['waitRule']>;
type ConditionRule = NonNullable<LongTermFlowNodeConfig['conditionRule']>;
type ToolCall = NonNullable<LongTermFlowNodeConfig['toolCall']>;

const WAIT_MODE_OPTIONS: LongTermWaitMode[] = ['固定等待', '日期字段', '外部事件'];
const WAIT_UNIT_OPTIONS: LongTermWaitUnit[] = ['分钟', '小时', '天'];
const CONDITION_OPERATOR_OPTIONS: LongTermConditionOperator[] = ['等于', '不等于', '大于', '大于等于', '小于', '小于等于', '存在', '不存在', '包含'];

// 生成等待节点默认结构化恢复规则。
function getDefaultWaitRule(): WaitRule {
  return {
    mode: '固定等待',
    amount: 1,
    unit: '天',
    dateField: 'created_at',
    resumeEvent: '外部状态更新',
    quietHours: '22:00-09:00 不触达',
    timeoutTarget: '下一节点',
  };
}

// 生成条件节点默认结构化判断规则。
function getDefaultConditionRule(): ConditionRule {
  return {
    field: 'status',
    operator: '等于',
    value: '目标状态',
    defaultTarget: '兜底分支',
    description: '补充命中条件和未命中后的默认去向。',
  };
}

// 生成动作节点默认结构化工具调用配置。
function getDefaultToolCall(): ToolCall {
  return {
    toolId: '',
    toolName: '选择要调用的业务工具',
    parameterMappings: [],
    timeoutSeconds: 30,
    idempotencyKey: 'task_id',
    permissionScope: '按业务场景授权',
  };
}

// 展示一组配置字段。
function ConfigSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h3 className="text-xs font-bold text-slate-400">{title}</h3>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

// 编辑右侧节点配置详情。
export function NodeConfigPanel({ node, lanes, onNodeChange, onDeleteNode }: NodeConfigPanelProps) {
  const updateConfig = (updates: Partial<LongTermFlowNodeConfig>) => {
    onNodeChange({ ...node, config: { ...node.config, ...updates } });
  };

  // 切换节点类型时补齐该类型常见结构化字段。
  const handleTypeChange = (type: LongTermFlowNodeType) => {
    onNodeChange({
      ...node,
      type,
      config: {
        ...node.config,
        waitPolicy: type === '等待' ? node.config.waitPolicy || '固定等待 1 天，避开夜间触达保护时段。' : node.config.waitPolicy,
        condition: type === '条件' ? node.config.condition || '补充判断规则。' : node.config.condition,
        toolName: type === '动作' || type === '触发器' ? node.config.toolName || '选择要调用的业务工具。' : node.config.toolName,
        waitRule: type === '等待' ? node.config.waitRule || getDefaultWaitRule() : node.config.waitRule,
        conditionRule: type === '条件' ? node.config.conditionRule || getDefaultConditionRule() : node.config.conditionRule,
        toolCall: type === '动作' || type === '触发器' ? node.config.toolCall || getDefaultToolCall() : node.config.toolCall,
      },
    });
  };

  // 更新数组类配置字段。
  const updateListConfig = (
    key: 'inputVariables' | 'outputVariables' | 'visibleFunctionIds' | 'transitionFunctionIds' | 'readStateKeys' | 'writeStateKeys',
    value: string,
  ) => {
    updateConfig({ [key]: parseListInput(value) });
  };

  // 更新等待恢复规则。
  const updateWaitRule = (updates: Partial<WaitRule>) => {
    updateConfig({ waitRule: { ...(node.config.waitRule || getDefaultWaitRule()), ...updates } });
  };

  // 更新条件构建器规则。
  const updateConditionRule = (updates: Partial<ConditionRule>) => {
    updateConfig({ conditionRule: { ...(node.config.conditionRule || getDefaultConditionRule()), ...updates } });
  };

  // 更新工具调用配置。
  const updateToolCall = (updates: Partial<ToolCall>) => {
    updateConfig({ toolCall: { ...(node.config.toolCall || getDefaultToolCall()), ...updates } });
  };

  // 渲染节点类型专属配置，避免所有节点共用一张大表单。
  const renderNodeTypeFields = () => {
    if (node.type === '等待') {
      const waitRule = node.config.waitRule || getDefaultWaitRule();
      return (
        <ConfigSection title="恢复条件">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="rounded-xl bg-amber-50 p-3">
              <span className="text-xs font-semibold text-amber-700">等待方式</span>
              <select value={waitRule.mode} onChange={(event) => updateWaitRule({ mode: event.target.value as LongTermWaitMode })} className="mt-1 w-full bg-transparent font-bold text-slate-900 outline-none">
                {WAIT_MODE_OPTIONS.map((mode) => <option key={mode}>{mode}</option>)}
              </select>
            </label>
            <label className="rounded-xl bg-amber-50 p-3">
              <span className="text-xs font-semibold text-amber-700">等待时长</span>
              <div className="mt-1 flex gap-2">
                <input type="number" min={0} value={waitRule.amount} onChange={(event) => updateWaitRule({ amount: Number(event.target.value) })} className="w-full bg-transparent text-lg font-bold text-slate-900 outline-none" />
                <select value={waitRule.unit} onChange={(event) => updateWaitRule({ unit: event.target.value as LongTermWaitUnit })} className="bg-transparent font-bold text-slate-900 outline-none">
                  {WAIT_UNIT_OPTIONS.map((unit) => <option key={unit}>{unit}</option>)}
                </select>
              </div>
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">日期字段</span>
            <input value={waitRule.dateField} onChange={(event) => updateWaitRule({ dateField: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">提前恢复事件</span>
            <input value={waitRule.resumeEvent} onChange={(event) => updateWaitRule({ resumeEvent: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">触达保护</span>
            <input value={waitRule.quietHours} onChange={(event) => updateWaitRule({ quietHours: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">超时后去向</span>
            <input value={waitRule.timeoutTarget} onChange={(event) => updateWaitRule({ timeoutTarget: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 outline-none focus:border-primary" />
          </label>
        </ConfigSection>
      );
    }

    if (node.type === '条件') {
      const conditionRule = node.config.conditionRule || getDefaultConditionRule();
      return (
        <ConfigSection title="条件构建器">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">判断字段</span>
              <input value={conditionRule.field} onChange={(event) => updateConditionRule({ field: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">判断关系</span>
              <select value={conditionRule.operator} onChange={(event) => updateConditionRule({ operator: event.target.value as LongTermConditionOperator })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 outline-none focus:border-primary">
                {CONDITION_OPERATOR_OPTIONS.map((operator) => <option key={operator}>{operator}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">比较值</span>
            <input value={conditionRule.value} onChange={(event) => updateConditionRule({ value: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">默认分支</span>
            <input value={conditionRule.defaultTarget} onChange={(event) => updateConditionRule({ defaultTarget: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">规则说明</span>
            <textarea value={conditionRule.description} onChange={(event) => updateConditionRule({ description: event.target.value })} className="mt-1 h-20 w-full resize-none rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-xs leading-5 text-violet-800 outline-none focus:border-violet-300" />
          </label>
        </ConfigSection>
      );
    }

    if (node.type === '动作' || node.type === '触发器') {
      const toolCall = node.config.toolCall || getDefaultToolCall();
      return (
        <ConfigSection title="工具调用配置">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">工具名称</span>
              <input value={toolCall.toolName} onChange={(event) => updateToolCall({ toolName: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">工具 ID</span>
              <input value={toolCall.toolId} onChange={(event) => updateToolCall({ toolId: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 outline-none focus:border-primary" />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">参数映射</span>
            <textarea value={formatListInput(toolCall.parameterMappings)} onChange={(event) => updateToolCall({ parameterMappings: parseListInput(event.target.value) })} className="mt-1 h-20 w-full resize-none rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800 outline-none focus:border-primary" />
          </label>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">超时秒数</span>
              <input type="number" min={1} value={toolCall.timeoutSeconds} onChange={(event) => updateToolCall({ timeoutSeconds: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">幂等键</span>
              <input value={toolCall.idempotencyKey} onChange={(event) => updateToolCall({ idempotencyKey: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 outline-none focus:border-primary" />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">权限范围</span>
            <input value={toolCall.permissionScope} onChange={(event) => updateToolCall({ permissionScope: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 outline-none focus:border-primary" />
          </label>
        </ConfigSection>
      );
    }

    if (node.type === 'Agent') {
      return (
        <ConfigSection title="Agent 执行配置">
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">执行说明</span>
            <textarea value={node.config.prompt} onChange={(event) => updateConfig({ prompt: event.target.value })} className="mt-1 h-24 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 leading-6 text-slate-700 outline-none focus:border-primary" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">可用动作</span>
              <textarea value={formatListInput(node.config.visibleFunctionIds)} onChange={(event) => updateListConfig('visibleFunctionIds', event.target.value)} className="mt-1 h-20 w-full resize-none rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800 outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">流转动作</span>
              <textarea value={formatListInput(node.config.transitionFunctionIds)} onChange={(event) => updateListConfig('transitionFunctionIds', event.target.value)} className="mt-1 h-20 w-full resize-none rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-xs leading-5 text-violet-800 outline-none focus:border-primary" />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">人工交接摘要</span>
            <textarea value={node.config.handoffSummaryTemplate} onChange={(event) => updateConfig({ handoffSummaryTemplate: event.target.value })} className="mt-1 h-20 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-xs leading-5 text-slate-700 outline-none focus:border-primary" />
          </label>
        </ConfigSection>
      );
    }

    return (
      <ConfigSection title="结束处理">
        <label className="block">
          <span className="text-xs font-semibold text-slate-400">回写字段</span>
          <textarea value={formatListInput(node.config.writeStateKeys)} onChange={(event) => updateListConfig('writeStateKeys', event.target.value)} className="mt-1 h-20 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-xs leading-5 text-slate-700 outline-none focus:border-primary" />
        </label>
      </ConfigSection>
    );
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-primary">节点配置</div>
          <div className="mt-1 text-sm text-slate-500">按节点类型维护业务规则。</div>
        </div>
        <button type="button" onClick={() => onDeleteNode(node.id)} className="inline-flex items-center gap-1 rounded-lg border border-rose-100 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">
          <Trash2 size={14} /> 删除
        </button>
      </div>

      <div className="mt-4 space-y-4 text-sm">
        <ConfigSection title="基础信息">
          <input
            aria-label="节点名称"
            value={node.title}
            onChange={(event) => onNodeChange({ ...node, title: event.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-lg font-bold text-slate-900 outline-none focus:border-primary"
          />
          <input
            aria-label="节点副标题"
            value={node.subtitle}
            onChange={(event) => onNodeChange({ ...node, subtitle: event.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary"
          />
          <textarea
            aria-label="节点描述"
            value={node.description}
            onChange={(event) => onNodeChange({ ...node, description: event.target.value })}
            className="h-20 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-600 outline-none focus:border-primary"
          />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-semibold text-slate-400">节点类型</span>
              <select value={node.type} onChange={(event) => handleTypeChange(event.target.value as LongTermFlowNodeType)} className="mt-1 w-full bg-transparent font-bold text-slate-900 outline-none">
                {NODE_TYPE_OPTIONS.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label className="rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-semibold text-slate-400">负责层级</span>
              <select value={node.lane} onChange={(event) => onNodeChange({ ...node, lane: event.target.value as LongTermLaneRole })} className="mt-1 w-full bg-transparent font-bold text-slate-900 outline-none">
                {lanes.map((lane) => <option key={lane.id}>{lane.id}</option>)}
              </select>
            </label>
            <label className="rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-semibold text-slate-400">触发日</span>
              <input type="number" value={node.dayOffset} onChange={(event) => onNodeChange({ ...node, dayOffset: Number(event.target.value) })} className="mt-1 w-full bg-transparent text-lg font-bold text-slate-900 outline-none" />
            </label>
            <label className="rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-semibold text-slate-400">风险等级</span>
              <select value={node.riskLevel} onChange={(event) => onNodeChange({ ...node, riskLevel: event.target.value as LongTermFlowNode['riskLevel'] })} className="mt-1 w-full bg-transparent text-lg font-bold text-slate-900 outline-none">
                <option>低</option>
                <option>中</option>
                <option>高</option>
              </select>
            </label>
          </div>
        </ConfigSection>

        <ConfigSection title="业务输入输出">
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">负责角色</span>
            <input value={node.config.owner} onChange={(event) => updateConfig({ owner: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-medium text-slate-800 outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">执行目标</span>
            <textarea value={node.config.goal} onChange={(event) => updateConfig({ goal: event.target.value })} className="mt-1 h-20 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 leading-6 text-slate-700 outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">输出说明</span>
            <input value={node.output} onChange={(event) => onNodeChange({ ...node, output: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 outline-none focus:border-primary" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">需要信息</span>
              <textarea value={formatListInput(node.config.inputVariables)} onChange={(event) => updateListConfig('inputVariables', event.target.value)} className="mt-1 h-20 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-xs leading-5 text-slate-700 outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">产出信息</span>
              <textarea value={formatListInput(node.config.outputVariables)} onChange={(event) => updateListConfig('outputVariables', event.target.value)} className="mt-1 h-20 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-xs leading-5 text-slate-700 outline-none focus:border-primary" />
            </label>
          </div>
        </ConfigSection>

        {renderNodeTypeFields()}

        <ConfigSection title="高级字段">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">读取字段</span>
              <textarea value={formatListInput(node.config.readStateKeys)} onChange={(event) => updateListConfig('readStateKeys', event.target.value)} className="mt-1 h-20 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-xs leading-5 text-slate-700 outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">写入字段</span>
              <textarea value={formatListInput(node.config.writeStateKeys)} onChange={(event) => updateListConfig('writeStateKeys', event.target.value)} className="mt-1 h-20 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-xs leading-5 text-slate-700 outline-none focus:border-primary" />
            </label>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">字段统计：读取 {node.config.readStateKeys.length || 0} 个；写入 {node.config.writeStateKeys.length || 0} 个</div>
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <label className="rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-semibold text-slate-400">重试次数</span>
              <input type="number" min={0} value={node.config.retryCount} onChange={(event) => updateConfig({ retryCount: Number(event.target.value) })} className="mt-1 w-full bg-transparent text-lg font-bold text-slate-900 outline-none" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-rose-600">失败兜底</span>
              <textarea value={node.config.fallback} onChange={(event) => updateConfig({ fallback: event.target.value })} className="mt-1 h-20 w-full resize-none rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700 outline-none focus:border-rose-300" />
            </label>
          </div>
        </ConfigSection>
      </div>
    </div>
  );
}

// 编辑连线配置。
export function EdgeConfigPanel({ edge, nodes, onEdgeChange, onDeleteEdge }: EdgeConfigPanelProps) {
  const sourceNode = nodes.find((node) => node.id === edge.source);
  const targetNode = nodes.find((node) => node.id === edge.target);

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-primary">边 / 分支</div>
          <h2 className="mt-1 text-lg font-bold text-slate-900">连线配置</h2>
        </div>
        <button type="button" onClick={() => onDeleteEdge(edge.id)} className="inline-flex items-center gap-1 rounded-lg border border-rose-100 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">
          <Trash2 size={14} /> 删除
        </button>
      </div>
      <div className="mt-5 space-y-4 text-sm">
        <ConfigSection title="流转关系">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-semibold text-slate-400">起点</span>
              <div className="mt-1 font-bold text-slate-900">{sourceNode?.title || '未找到起点'}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-semibold text-slate-400">终点</span>
              <div className="mt-1 font-bold text-slate-900">{targetNode?.title || '未找到终点'}</div>
            </div>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">流转名称</span>
            <input value={edge.label} onChange={(event) => onEdgeChange({ ...edge, label: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-medium text-slate-800 outline-none focus:border-primary" />
          </label>
        </ConfigSection>

        <ConfigSection title="流转条件">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">流转类型</span>
              <select value={edge.edgeType} onChange={(event) => onEdgeChange({ ...edge, edgeType: event.target.value as LongTermFlowEdgeType })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 outline-none focus:border-primary">
                {EDGE_TYPE_OPTIONS.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">判断顺序</span>
              <input type="number" min={1} value={edge.priority} onChange={(event) => onEdgeChange({ ...edge, priority: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 outline-none focus:border-primary" />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">命中条件</span>
            <textarea value={edge.condition} onChange={(event) => onEdgeChange({ ...edge, condition: event.target.value })} className="mt-1 h-28 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 leading-6 text-slate-700 outline-none focus:border-primary" />
          </label>
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
            <input type="checkbox" checked={Boolean(edge.isDefault)} onChange={(event) => onEdgeChange({ ...edge, isDefault: event.target.checked })} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
            默认分支
          </label>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800">
            连线只负责“什么条件下从当前节点去下一个节点”；Agent、工具和等待规则请在节点里配置。
          </div>
        </ConfigSection>
      </div>
    </div>
  );
}
