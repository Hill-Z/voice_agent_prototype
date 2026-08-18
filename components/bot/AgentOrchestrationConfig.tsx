// 机器人级 Agent 编排配置页，提供模式切换、无限画布、节点/边编辑、校验和发布。
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Bot,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Copy,
  GitBranch,
  Headset,
  Link2,
  Maximize2,
  MessageSquareText,
  Minus,
  MousePointer2,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import type {
  AgentOrchestrationConfig,
  AgentOrchestrationContextPolicy,
  AgentOrchestrationEdge,
  AgentOrchestrationEdgeType,
  AgentOrchestrationNode,
  AgentOrchestrationNodeType,
  BotConfiguration,
} from '../../types';
import {
  createAgentEdge,
  createAgentNode,
  EDGE_TYPE_LABELS,
  getHumanTargets,
  graphSnapshot,
  NODE_TYPE_LABELS,
  normalizeOrchestration,
  ORCHESTRATION_MODES,
  validateOrchestration,
} from './agentOrchestrationData';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 112;
const CANVAS_WIDTH = 2200;
const CANVAS_HEIGHT = 1200;

interface AgentOrchestrationConfigProps {
  bot: BotConfiguration;
  value?: AgentOrchestrationConfig;
  onChange: (value: AgentOrchestrationConfig) => void;
  onSave: (value: AgentOrchestrationConfig) => void;
}

interface DragState {
  kind: 'node' | 'canvas';
  nodeId?: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

interface ResourceOption {
  id: string;
  name: string;
  type?: string;
  description?: string;
}

interface ValidationIssue {
  level: 'error' | 'warning';
  code: string;
  message: string;
  targetId?: string;
}

// 生成节点类型的图标。
function nodeIcon(type: AgentOrchestrationNodeType): React.ReactNode {
  const iconClass = 'h-4 w-4';
  if (type === 'supervisor') return <ShieldCheck className={iconClass} />;
  if (type === 'flow_agent') return <Workflow className={iconClass} />;
  if (type === 'topic_agent') return <Bot className={iconClass} />;
  if (type === 'task_agent') return <Zap className={iconClass} />;
  if (type === 'human') return <Headset className={iconClass} />;
  return <Check className={iconClass} />;
}

// 返回节点的配色。
function nodeStyle(type: AgentOrchestrationNodeType): { shell: string; icon: string; badge: string } {
  if (type === 'supervisor') return { shell: 'border-blue-200 bg-blue-50', icon: 'bg-blue-600 text-white', badge: 'text-blue-700 bg-blue-100' };
  if (type === 'flow_agent') return { shell: 'border-amber-200 bg-amber-50', icon: 'bg-amber-500 text-white', badge: 'text-amber-700 bg-amber-100' };
  if (type === 'topic_agent') return { shell: 'border-violet-200 bg-violet-50', icon: 'bg-violet-600 text-white', badge: 'text-violet-700 bg-violet-100' };
  if (type === 'task_agent') return { shell: 'border-orange-200 bg-orange-50', icon: 'bg-orange-500 text-white', badge: 'text-orange-700 bg-orange-100' };
  if (type === 'human') return { shell: 'border-rose-200 bg-rose-50', icon: 'bg-rose-600 text-white', badge: 'text-rose-700 bg-rose-100' };
  return { shell: 'border-slate-200 bg-slate-50', icon: 'bg-slate-500 text-white', badge: 'text-slate-600 bg-slate-100' };
}

// 复制上下文策略，避免面板编辑时修改共享引用。
function cloneContextPolicy(policy: AgentOrchestrationContextPolicy): AgentOrchestrationContextPolicy {
  return { ...policy, variableNames: [...policy.variableNames] };
}

// 返回当前节点可以选择的业务资源。
function resourceOptions(type: AgentOrchestrationNodeType, bot: BotConfiguration): ResourceOption[] {
  if (type === 'flow_agent') {
    const flows = (bot.flowConfig?.flows || []).map((item) => ({ id: item.id, name: item.name, type: 'Flow', description: item.metadata?.description }));
    const legacyIntents = (bot.intents || []).map((item) => ({ id: `intent:${item.id}`, name: item.name, type: '旧版流程', description: item.description }));
    return [...flows, ...legacyIntents];
  }
  if (type === 'topic_agent') return (bot.topicSkillLibraryConfig?.skills || []).map((item) => ({ id: item.id, name: item.name, type: '主题', description: item.description }));
  return [];
}

// 使用机器人已有的 Flow、主题或工具创建首个业务 Agent。
function createFirstBusinessAgent(bot: BotConfiguration, position: { x: number; y: number }): AgentOrchestrationNode {
  const entryFlow = bot.flowConfig?.flows?.find((flow) => flow.id === bot.flowConfig?.entryFlowId) || bot.flowConfig?.flows?.[0];
  if (entryFlow) return { ...createAgentNode('agent_default', 'flow_agent', entryFlow.name, position, entryFlow.id, entryFlow.name), description: entryFlow.metadata?.description };
  const legacyIntent = bot.intents?.[0];
  if (legacyIntent) return { ...createAgentNode('agent_default', 'flow_agent', legacyIntent.name, position, `intent:${legacyIntent.id}`, legacyIntent.name), description: legacyIntent.description };
  const topic = bot.topicSkillLibraryConfig?.skills?.find((skill) => skill.isEnabled) || bot.topicSkillLibraryConfig?.skills?.[0];
  if (topic) return { ...createAgentNode('agent_default', 'topic_agent', topic.name, position, topic.id, topic.name), description: topic.description, entryIntents: [topic.name] };
  const tool = bot.agentConfig?.tools?.[0];
  if (tool) return { ...createAgentNode('agent_default', 'task_agent', `${tool.displayName || tool.name}任务`, position), description: tool.description, taskPrompt: tool.description, toolIds: [tool.id] };
  return createAgentNode('agent_default', 'flow_agent', '业务 Agent', position);
}

// 返回资源和变量选择项。
function getResourcePools(bot: BotConfiguration) {
  const knowledgeIds = Array.from(new Set([...(bot.kbQACategories || []), ...(bot.kbLexiconCategories || [])]));
  return {
    variables: (bot.variables || []).map((item) => ({ id: item.name, name: item.name })),
    tools: (bot.agentConfig?.tools || []).map((item) => ({ id: item.id, name: item.displayName || item.name })),
    knowledge: knowledgeIds.map((item) => ({ id: item, name: item })),
  };
}

// 节点卡片。
function AgentNodeCard({
  node,
  selected,
  connecting,
  onPointerDown,
  onClick,
  onStartConnect,
}: {
  node: AgentOrchestrationNode;
  key?: React.Key;
  selected: boolean;
  connecting: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>, nodeId: string) => void;
  onClick: (event: React.MouseEvent<HTMLDivElement>, nodeId: string) => void;
  onStartConnect: (event: React.MouseEvent<HTMLButtonElement>, nodeId: string) => void;
}) {
  const style = nodeStyle(node.type);
  return (
    <div
      className={`absolute w-[180px] select-none rounded-xl border shadow-sm transition-shadow ${style.shell} ${selected ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg' : 'hover:shadow-md'} ${node.enabled ? '' : 'opacity-50'}`}
      style={{ left: node.position.x, top: node.position.y, height: NODE_HEIGHT }}
      onPointerDown={(event) => onPointerDown(event, node.id)}
      onClick={(event) => onClick(event, node.id)}
    >
      <div className="flex items-start gap-3 px-3 py-3">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.icon}`}>
          {nodeIcon(node.type)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-slate-900">{node.name || '未命名节点'}</div>
          <div className={`mt-1 inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${style.badge}`}>{NODE_TYPE_LABELS[node.type]}</div>
        </div>
        <button
          type="button"
          title="连接到其他节点"
          aria-label={`连接 ${node.name}`}
          className={`mt-0.5 rounded p-1 transition-colors ${connecting ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/70 hover:text-blue-600'}`}
          onClick={(event) => onStartConnect(event, node.id)}
        >
          <Link2 className="h-4 w-4" />
        </button>
      </div>
      <div className="border-t border-black/5 px-3 py-2 text-[11px] text-slate-600">
        <span>{node.refName || (node.type === 'supervisor' ? '统一调度' : node.type === 'task_agent' ? `${node.toolIds.length} 个工具 · 静默执行` : node.type === 'end' ? '播放话术并挂机' : node.type === 'human' ? node.humanTargetId || '未配置目标' : '未关联资源')}</span>
        {node.lockCurrentStep && <span className="ml-2 rounded bg-white/70 px-1.5 py-0.5">Step 锁定</span>}
      </div>
    </div>
  );
}

// 画布右侧节点配置面板。
function NodeInspector({
  node,
  bot,
  onChange,
  onDelete,
}: {
  node: AgentOrchestrationNode;
  bot: BotConfiguration;
  onChange: (node: AgentOrchestrationNode) => void;
  onDelete: () => void;
}) {
  const pools = getResourcePools(bot);
  const resources = resourceOptions(node.type, bot);
  const humanTargets = getHumanTargets(bot);
  const isConversationAgent = node.type === 'flow_agent' || node.type === 'topic_agent';
  const update = (patch: Partial<AgentOrchestrationNode>) => onChange({ ...node, ...patch });
  const updateContext = (patch: Partial<AgentOrchestrationContextPolicy>) => update({ contextPolicy: { ...cloneContextPolicy(node.contextPolicy), ...patch } });
  const changeType = (type: AgentOrchestrationNodeType) => {
    const defaults = createAgentNode(node.id, type, node.name, node.position);
    onChange({ ...defaults, enabled: node.enabled });
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <InspectorHeader title={node.name || '节点配置'} onDelete={onDelete} />
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-5">
          <Field label="节点名称" required>
            <input value={node.name} onChange={(event) => update({ name: event.target.value })} className="field" placeholder="输入节点名称" />
          </Field>
          <Field label="节点类型">
            <select value={node.type} onChange={(event) => changeType(event.target.value as AgentOrchestrationNodeType)} className="field">
              {Object.entries(NODE_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>

          {resources.length > 0 && (
            <Field label="关联资源" required>
              <select
                value={node.refId || ''}
                onChange={(event) => {
                  const option = resources.find((item) => item.id === event.target.value);
                  update({ refId: option?.id || undefined, refName: option?.name || undefined, description: option?.description || node.description });
                }}
                className="field"
              >
                <option value="">请选择资源</option>
                {resources.map((option) => <option key={option.id} value={option.id}>{option.type ? `${option.name} · ${option.type}` : option.name}</option>)}
              </select>
            </Field>
          )}

          {node.type !== 'end' && node.type !== 'human' && (
            <Field label={node.type === 'supervisor' ? '职责说明' : '能力说明'}>
              <textarea value={node.description || ''} onChange={(event) => update({ description: event.target.value })} className="textarea" placeholder={node.type === 'supervisor' ? '定义调度范围和处理边界' : '描述该 Agent 可以处理的业务'} />
            </Field>
          )}

          {node.type === 'human' && (
            <Field label="人工目标" required>
              <select value={node.humanTargetId || ''} onChange={(event) => update({ humanTargetId: event.target.value })} className="field">
                <option value="">请选择人工目标</option>
                {humanTargets.map((target) => <option key={target.id} value={target.id}>{target.name}</option>)}
              </select>
            </Field>
          )}

          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <span className="text-sm font-semibold text-slate-700">启用节点</span>
            <Toggle checked={node.enabled} onChange={(checked) => update({ enabled: checked })} />
          </div>

          {node.type === 'supervisor' && (
            <Field label="Supervisor 提示词" required>
              <textarea value={node.supervisorPrompt || ''} onChange={(event) => update({ supervisorPrompt: event.target.value })} className="textarea min-h-[132px]" placeholder="定义 Agent 选择、任务分派和兜底规则" />
            </Field>
          )}

          {isConversationAgent && (
            <Field label="可处理意图">
              <TagEditor values={node.entryIntents} onChange={(entryIntents) => update({ entryIntents })} placeholder="输入意图后回车" />
            </Field>
          )}

          {node.type === 'task_agent' && (
            <>
              <Field label="任务提示词" required>
                <textarea value={node.taskPrompt || ''} onChange={(event) => update({ taskPrompt: event.target.value })} className="textarea min-h-[132px]" placeholder="定义任务目标、执行约束和结果要求" />
              </Field>
              <MultiSelectSection title="可用工具" options={pools.tools} values={node.toolIds} onChange={(toolIds) => update({ toolIds })} />
              <Field label="输出格式" required>
                <textarea value={node.taskOutputSchema || ''} onChange={(event) => update({ taskOutputSchema: event.target.value })} className="textarea min-h-[120px] font-mono" placeholder="输入 JSON 结构" />
              </Field>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-600">
                <span>执行方式</span><span className="text-slate-900">静默执行并返回结果</span>
              </div>
            </>
          )}

          {node.type === 'task_agent' && (
            <Field label="最大执行时间（秒）">
              <input type="number" min={1} value={node.maxExecutionSeconds || 30} onChange={(event) => update({ maxExecutionSeconds: Number(event.target.value) })} className="field" />
            </Field>
          )}

          {node.type === 'flow_agent' && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <div className="text-sm font-semibold text-slate-700">Step 执行期间锁定</div>
              </div>
              <Toggle checked={Boolean(node.lockCurrentStep)} onChange={(lockCurrentStep) => update({ lockCurrentStep })} />
            </div>
          )}

          {isConversationAgent && (
            <Field label="资源权限">
              <select value={node.resourcePolicy} onChange={(event) => update({ resourcePolicy: event.target.value as AgentOrchestrationNode['resourcePolicy'] })} className="field">
                <option value="inherit">继承关联配置</option>
                <option value="custom">自定义</option>
              </select>
            </Field>
          )}

          {isConversationAgent && node.resourcePolicy === 'custom' && (
            <>
              <MultiSelectSection title="可用工具" options={pools.tools} values={node.toolIds} onChange={(toolIds) => update({ toolIds })} />
              <MultiSelectSection title="可用知识库" options={pools.knowledge} values={node.knowledgeBaseIds} onChange={(knowledgeBaseIds) => update({ knowledgeBaseIds })} />
            </>
          )}

          {isConversationAgent && <ContextPolicyEditor policy={node.contextPolicy} variables={pools.variables} onChange={updateContext} />}

          {isConversationAgent && (
            <Field label="转交摘要模板">
              <textarea value={node.handoffSummaryTemplate || ''} onChange={(event) => update({ handoffSummaryTemplate: event.target.value })} className="textarea" placeholder="定义接管时传递的业务摘要" />
            </Field>
          )}

          {node.type === 'end' && (
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <Field label="挂机话术" required>
                <SpeechListEditor values={node.hangupSpeeches || []} onChange={(hangupSpeeches) => update({ hangupSpeeches })} placeholder="输入挂机话术" />
              </Field>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 画布右侧边配置面板。
function EdgeInspector({
  edge,
  nodes,
  bot,
  mode,
  onChange,
  onDelete,
}: {
  edge: AgentOrchestrationEdge;
  nodes: AgentOrchestrationNode[];
  bot: BotConfiguration;
  mode: AgentOrchestrationConfig['mode'];
  onChange: (edge: AgentOrchestrationEdge) => void;
  onDelete: () => void;
}) {
  const pools = getResourcePools(bot);
  const sourceNode = nodes.find((node) => node.id === edge.source);
  const targetNode = nodes.find((node) => node.id === edge.target);
  const configuredTools = bot.agentConfig?.tools || [];
  const targetTools = targetNode?.type === 'task_agent' ? configuredTools.filter((tool) => targetNode.toolIds.includes(tool.id)) : [];
  const targetTopic = targetNode?.type === 'topic_agent' ? bot.topicSkillLibraryConfig?.skills?.find((topic) => topic.id === targetNode.refId) : undefined;
  const targetInputs: ResourceOption[] = targetTools.length > 0
    ? Array.from(new Map(targetTools.flatMap((tool) => tool.parameters).map((parameter) => [parameter.name, { id: parameter.name, name: parameter.name }])).values())
    : targetTopic
      ? targetTopic.variables.map((variable) => ({ id: variable, name: variable }))
      : pools.variables;
  const supervisorDispatch = mode === 'supervisor' && sourceNode?.type === 'supervisor';
  const isTaskEdge = edge.type === 'delegate' || edge.type === 'fanout';
  const allowedTypes: AgentOrchestrationEdgeType[] = targetNode?.type === 'human'
    ? ['escalate']
    : targetNode?.type === 'task_agent'
      ? ['delegate', 'fanout']
      : ['handoff', 'fallback'];
  const update = (patch: Partial<AgentOrchestrationEdge>) => onChange({ ...edge, ...patch });
  const updateContext = (patch: Partial<AgentOrchestrationContextPolicy>) => update({ contextPolicy: { ...cloneContextPolicy(edge.contextPolicy), ...patch } });
  const mapRows = (key: 'inputMappings' | 'outputMappings') => edge[key];
  const updateMapping = (key: 'inputMappings' | 'outputMappings', index: number, patch: Partial<{ source: string; target: string }>) => {
    const rows = mapRows(key).map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row);
    update({ [key]: rows } as Pick<AgentOrchestrationEdge, 'inputMappings' | 'outputMappings'>);
  };
  const addMapping = (key: 'inputMappings' | 'outputMappings') => update({ [key]: [...mapRows(key), { source: '', target: '' }] } as Pick<AgentOrchestrationEdge, 'inputMappings' | 'outputMappings'>);
  const removeMapping = (key: 'inputMappings' | 'outputMappings', index: number) => update({ [key]: mapRows(key).filter((_, rowIndex) => rowIndex !== index) } as Pick<AgentOrchestrationEdge, 'inputMappings' | 'outputMappings'>);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <InspectorHeader title="边配置" onDelete={onDelete} />
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-5">
          <Field label="来源节点">
            <select value={edge.source} onChange={(event) => update({ source: event.target.value })} className="field">
              {nodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}
            </select>
          </Field>
          <Field label="目标节点">
            <select value={edge.target} onChange={(event) => {
              const target = event.target.value;
              const nextTarget = nodes.find((node) => node.id === target);
              const type: AgentOrchestrationEdgeType = nextTarget?.type === 'human' ? 'escalate' : nextTarget?.type === 'task_agent' ? 'delegate' : 'handoff';
              const defaults = createAgentEdge(edge.id, edge.source, target, type);
              update({ ...defaults, target });
            }} className="field">
              {nodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}
            </select>
          </Field>
          <Field label="动作类型">
            <select value={edge.type} onChange={(event) => {
              const type = event.target.value as AgentOrchestrationEdgeType;
              const defaults = createAgentEdge(edge.id, edge.source, edge.target, type);
              update({ ...defaults, label: EDGE_TYPE_LABELS[type] });
            }} className="field">
              {allowedTypes.map((value) => <option key={value} value={value}>{EDGE_TYPE_LABELS[value]}</option>)}
            </select>
          </Field>
          <Field label="边名称">
            <input value={edge.label} onChange={(event) => update({ label: event.target.value })} className="field" placeholder="例如：用户要求退款" />
          </Field>
          {supervisorDispatch ? (
            <Field label="准入条件">
              <input value={edge.eligibilityExpression || ''} onChange={(event) => update({ eligibilityExpression: event.target.value })} className="field" placeholder="例如：refund_amount <= 500" />
            </Field>
          ) : edge.type !== 'fallback' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="条件类型">
                  <select value={edge.conditionMode} onChange={(event) => update({ conditionMode: event.target.value as AgentOrchestrationEdge['conditionMode'] })} className="field">
                    <option value="intent">意图</option>
                    <option value="expression">表达式</option>
                    <option value="always">始终执行</option>
                  </select>
                </Field>
                <Field label="优先级">
                  <input type="number" min={1} value={edge.priority} onChange={(event) => update({ priority: Number(event.target.value) })} className="field" />
                </Field>
              </div>
              {edge.conditionMode !== 'always' && (
                <Field label="触发条件" required>
                  <input value={edge.conditionValue} onChange={(event) => update({ conditionValue: event.target.value })} className="field" placeholder={edge.conditionMode === 'intent' ? '输入意图名称' : '输入变量表达式'} />
                </Field>
              )}
            </>
          )}

          {isTaskEdge && (
            <>
              <Field label="超时时间（秒）" required>
                <input type="number" min={1} value={edge.timeoutSeconds || 15} onChange={(event) => update({ timeoutSeconds: Number(event.target.value) })} className="field" />
              </Field>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-600"><span>完成后</span><span className="text-slate-900">结果返回当前对话 Agent</span></div>
            </>
          )}

          {edge.type === 'fanout' && (
            <>
              <Field label="并行组" required><input value={edge.parallelGroupId || ''} onChange={(event) => update({ parallelGroupId: event.target.value })} className="field" placeholder="输入并行组名称" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="完成条件"><select value={edge.fanoutJoinStrategy || 'all'} onChange={(event) => update({ fanoutJoinStrategy: event.target.value as AgentOrchestrationEdge['fanoutJoinStrategy'] })} className="field"><option value="all">全部完成</option><option value="first_success">任一成功</option></select></Field>
                <Field label="结果合并"><select value={edge.fanoutMergeStrategy || 'source_agent'} onChange={(event) => update({ fanoutMergeStrategy: event.target.value as AgentOrchestrationEdge['fanoutMergeStrategy'] })} className="field"><option value="source_agent">当前 Agent</option><option value="supervisor">Supervisor</option><option value="structured">结构化合并</option></select></Field>
              </div>
            </>
          )}

          {edge.type !== 'fallback' && <Field label="失败处理"><select value={edge.onFailure} onChange={(event) => update({ onFailure: event.target.value as AgentOrchestrationEdge['onFailure'] })} className="field"><option value="fallback">进入兜底 Agent</option><option value="handoff">转人工</option><option value="return_error">返回任务失败</option><option value="continue">继续当前 Agent</option></select></Field>}

          {(edge.type === 'handoff' || edge.type === 'escalate' || edge.type === 'fallback') && (
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <Field label="转接话术">
                <select value={edge.speechMode} onChange={(event) => update({ speechMode: event.target.value as AgentOrchestrationEdge['speechMode'] })} className="field">
                  <option value="fixed">固定话术</option>
                  <option value="generated">由 Agent 生成</option>
                  <option value="none">不播放</option>
                </select>
              </Field>
              {edge.speechMode === 'fixed' && <SpeechListEditor values={edge.speeches} onChange={(speeches) => update({ speeches })} />}
            </div>
          )}

          {(edge.type === 'handoff' || edge.type === 'fallback') && <ContextPolicyEditor policy={edge.contextPolicy} variables={pools.variables} onChange={updateContext} />}
          {isTaskEdge && (
            <>
              <MappingEditor title="输入参数映射" rows={edge.inputMappings} sourcePlaceholder="来源变量" targetPlaceholder="任务参数" sourceOptions={pools.variables} targetOptions={targetInputs} onAdd={() => addMapping('inputMappings')} onChange={(index, patch) => updateMapping('inputMappings', index, patch)} onRemove={(index) => removeMapping('inputMappings', index)} />
              <MappingEditor title="输出参数映射" rows={edge.outputMappings} sourcePlaceholder="结果字段" targetPlaceholder="通话变量" targetOptions={pools.variables} onAdd={() => addMapping('outputMappings')} onChange={(index, patch) => updateMapping('outputMappings', index, patch)} onRemove={(index) => removeMapping('outputMappings', index)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// 统一的检查器标题。
function InspectorHeader({ title, onDelete }: { title: string; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-900"><Settings2 className="h-4 w-4 text-blue-600" />{title}</div>
      <button type="button" title="删除" aria-label="删除当前配置" onClick={onDelete} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

// 表单字段包装器。
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-600">{required && <span className="mr-1 text-rose-500">*</span>}{label}</span>{children}</label>;
}

// 开关控件。
function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}><span className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} /></button>;
}

// 标签输入控件。
function TagEditor({ values, onChange, placeholder }: { values: string[]; onChange: (values: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('');
  const add = () => {
    const value = input.trim();
    if (!value || values.includes(value)) return;
    onChange([...values, value]);
    setInput('');
  };
  return <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 focus-within:border-blue-400">{values.map((value) => <span key={value} className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{value}<button type="button" aria-label={`删除 ${value}`} onClick={() => onChange(values.filter((item) => item !== value))}><X className="h-3 w-3" /></button></span>)}<input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} onBlur={add} className="min-w-[120px] flex-1 bg-transparent px-1 py-1 text-xs outline-none" placeholder={placeholder} /></div>;
}

// 多选资源区块。
function MultiSelectSection({ title, options, values, onChange }: { title: string; options: ResourceOption[]; values: string[]; onChange: (values: string[]) => void }) {
  return <div><div className="mb-2 text-xs font-semibold text-slate-600">{title}</div><div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">{options.map((option) => <label key={option.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50"><input type="checkbox" checked={values.includes(option.id)} onChange={() => onChange(values.includes(option.id) ? values.filter((item) => item !== option.id) : [...values, option.id])} className="accent-blue-600" />{option.name}</label>)}</div></div>;
}

// 多条转接话术编辑器。
function SpeechListEditor({ values, onChange, placeholder = '输入转接话术' }: { values: string[]; onChange: (values: string[]) => void; placeholder?: string }) {
  const rows = values.length > 0 ? values : [''];
  return (
    <div className="space-y-2">
      {rows.map((value, index) => (
        <div key={index} className="flex items-center gap-2">
          <input value={value} onChange={(event) => onChange(rows.map((item, rowIndex) => rowIndex === index ? event.target.value : item))} className="field" placeholder={placeholder} />
          <button type="button" aria-label="删除话术" onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))} className="icon-button shrink-0 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...rows, ''])} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"><Plus className="h-3.5 w-3.5" />添加话术</button>
    </div>
  );
}

// 未选择节点或边时展示编排运行设置。
function OrchestrationInspector({ config, onChange }: { config: AgentOrchestrationConfig; onChange: (value: AgentOrchestrationConfig) => void }) {
  const enabledNodes = config.nodes.filter((node) => node.enabled);
  const entryNodes = enabledNodes.filter((node) => node.type === 'flow_agent' || node.type === 'topic_agent');
  const fallbackNodes = enabledNodes.filter((node) => node.type === 'flow_agent' || node.type === 'topic_agent' || node.type === 'human');
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-900"><Settings2 className="h-4 w-4 text-blue-600" />编排设置</div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        {config.mode === 'handoff' && (
          <Field label="入口 Agent" required>
            <select value={config.initialNodeId || ''} onChange={(event) => onChange({ ...config, initialNodeId: event.target.value || undefined })} className="field">
              <option value="">请选择入口 Agent</option>
              {entryNodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="兜底 Agent" required>
          <select value={config.fallbackNodeId || ''} onChange={(event) => onChange({ ...config, fallbackNodeId: event.target.value || undefined })} className="field">
            <option value="">请选择兜底 Agent</option>
            {fallbackNodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}
          </select>
        </Field>
        <Field label="单次通话最大转交次数">
          <input type="number" min={1} max={20} value={config.maxHandoffCount} onChange={(event) => onChange({ ...config, maxHandoffCount: Math.max(1, Math.min(20, Number(event.target.value) || 1)) })} className="field" />
        </Field>
        <div className="border-t border-slate-100 pt-4">
          <div className="mb-3 text-xs font-semibold text-slate-600">节点状态</div>
          <div className="space-y-2">
            {enabledNodes.map((node, index) => (
              <div key={node.id} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-xs text-slate-600">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-[10px] font-bold text-slate-500">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate">{node.name}</span>
                {config.fallbackNodeId === node.id && <span className="text-[10px] font-semibold text-amber-600">兜底</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 单 Agent 模式沿用现有机器人配置，不创建额外编排节点。
function SingleAgentSummary({ bot }: { bot: BotConfiguration }) {
  const flows = bot.flowConfig?.flows?.length || 0;
  const topics = bot.topicSkillLibraryConfig?.skills?.filter((item) => item.isEnabled).length || 0;
  const tools = bot.agentConfig?.tools?.length || 0;
  return (
    <div className="flex min-h-[560px] items-center justify-center bg-slate-50/50 px-6 py-12">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Bot className="h-6 w-6" /></div>
          <div><div className="text-base font-bold text-slate-900">{bot.name}</div><div className="mt-1 text-sm text-slate-500">当前机器人直接处理全部来电</div></div>
          <span className="ml-auto rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">运行中</span>
        </div>
        <div className="mt-7 grid grid-cols-3 divide-x divide-slate-100 border-y border-slate-100 py-5 text-center">
          <div><div className="text-xl font-bold text-slate-900">{flows}</div><div className="mt-1 text-xs text-slate-500">Flow</div></div>
          <div><div className="text-xl font-bold text-slate-900">{topics}</div><div className="mt-1 text-xs text-slate-500">启用主题</div></div>
          <div><div className="text-xl font-bold text-slate-900">{tools}</div><div className="mt-1 text-xs text-slate-500">可用工具</div></div>
        </div>
        <div className="mt-6 flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600"><MessageSquareText className="h-4 w-4 text-slate-400" />使用基础配置、Flow、主题和对话策略生成回复</div>
      </div>
    </div>
  );
}

// 上下文传递配置。
function ContextPolicyEditor({ policy, variables, onChange }: { policy: AgentOrchestrationContextPolicy; variables: ResourceOption[]; onChange: (patch: Partial<AgentOrchestrationContextPolicy>) => void }) {
  return <div className="space-y-3 border-t border-slate-100 pt-4"><div className="text-xs font-semibold text-slate-600">上下文传递</div><div className="grid grid-cols-[1fr_86px] gap-2"><select value={policy.history} onChange={(event) => onChange({ history: event.target.value as AgentOrchestrationContextPolicy['history'] })} className="field"><option value="none">不传历史</option><option value="summary">摘要</option><option value="last_n">最近 N 轮</option><option value="full">完整历史</option></select>{policy.history === 'last_n' && <input type="number" min={1} value={policy.historyTurns || 4} onChange={(event) => onChange({ historyTurns: Number(event.target.value) })} className="field" />}</div><div className="space-y-2">{variables.length > 0 && <div className="max-h-28 overflow-y-auto rounded-lg border border-slate-200 p-2">{variables.map((variable) => <label key={variable.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"><input type="checkbox" checked={policy.variableNames.includes(variable.id)} onChange={() => onChange({ variableNames: policy.variableNames.includes(variable.id) ? policy.variableNames.filter((item) => item !== variable.id) : [...policy.variableNames, variable.id] })} className="accent-blue-600" />{variable.name}</label>)}</div>}<label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={policy.includeCurrentStep} onChange={(event) => onChange({ includeCurrentStep: event.target.checked })} className="accent-blue-600" />传递当前 Step</label><label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={policy.includeLastToolResult} onChange={(event) => onChange({ includeLastToolResult: event.target.checked })} className="accent-blue-600" />传递最近工具结果</label></div></div>;
}

// 输入输出映射编辑器。
function MappingEditor({ title, rows, sourcePlaceholder, targetPlaceholder, sourceOptions = [], targetOptions = [], onAdd, onChange, onRemove }: { title: string; rows: Array<{ source: string; target: string }>; sourcePlaceholder: string; targetPlaceholder: string; sourceOptions?: ResourceOption[]; targetOptions?: ResourceOption[]; onAdd: () => void; onChange: (index: number, patch: Partial<{ source: string; target: string }>) => void; onRemove: (index: number) => void }) {
  const renderControl = (value: string, placeholder: string, options: ResourceOption[], onValueChange: (value: string) => void) => options.length > 0
    ? <select value={value} onChange={(event) => onValueChange(event.target.value)} className="field min-w-0 flex-1"><option value="">{placeholder}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select>
    : <input value={value} onChange={(event) => onValueChange(event.target.value)} className="field min-w-0 flex-1" placeholder={placeholder} />;
  return <div className="border-t border-slate-100 pt-4"><div className="mb-2 flex items-center justify-between"><div className="text-xs font-semibold text-slate-600">{title}</div><button type="button" onClick={onAdd} className="text-xs font-semibold text-blue-600 hover:text-blue-700">添加映射</button></div>{rows.length === 0 ? <div className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-400">暂无映射</div> : <div className="space-y-2">{rows.map((row, index) => <div key={`${index}-${row.source}`} className="flex items-center gap-1.5">{renderControl(row.source, sourcePlaceholder, sourceOptions, (source) => onChange(index, { source }))}<span className="text-slate-300">→</span>{renderControl(row.target, targetPlaceholder, targetOptions, (target) => onChange(index, { target }))}<button type="button" aria-label="删除映射" onClick={() => onRemove(index)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><X className="h-3.5 w-3.5" /></button></div>)}</div>}</div>;
}

// Agent 编排主配置页。
export default function AgentOrchestrationConfig({ bot, value, onChange, onSave }: AgentOrchestrationConfigProps) {
  const [draft, setDraft] = useState<AgentOrchestrationConfig>(() => normalizeOrchestration(value, bot));
  const draftRef = useRef(draft);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(draft.nodes[0]?.id || null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [validationOpen, setValidationOpen] = useState(false);
  const [toast, setToast] = useState('');
  const lastSyncedValue = useRef<AgentOrchestrationConfig | undefined>();
  const lastSyncedBotId = useRef<string>(bot.id);
  const hasSynced = useRef(false);

  useEffect(() => {
    if (hasSynced.current && value === lastSyncedValue.current && bot.id === lastSyncedBotId.current) return;
    const next = normalizeOrchestration(value, bot);
    setDraft(next);
    draftRef.current = next;
    lastSyncedValue.current = value;
    lastSyncedBotId.current = bot.id;
    hasSynced.current = true;
    setSelectedNodeId(next.nodes[0]?.id || null);
    setSelectedEdgeId(null);
  }, [bot.id, value]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragState) return;
      if (dragState.kind === 'canvas') {
        setPan({ x: dragState.originX + event.clientX - dragState.startX, y: dragState.originY + event.clientY - dragState.startY });
        return;
      }
      const nodeId = dragState.nodeId;
      if (!nodeId) return;
      const next = {
        ...draftRef.current,
        nodes: draftRef.current.nodes.map((node) => node.id === nodeId
          ? { ...node, position: { x: Math.max(20, dragState.originX + (event.clientX - dragState.startX) / zoom), y: Math.max(20, dragState.originY + (event.clientY - dragState.startY) / zoom) } }
          : node),
      };
      draftRef.current = next;
      setDraft(next);
    };
    const handlePointerUp = () => {
      if (dragState?.kind === 'node') commit(draftRef.current);
      setDragState(null);
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, zoom]);

  // 将草稿写入状态并同步到机器人配置。
  const commit = (next: AgentOrchestrationConfig, sync = true, markAsDraft = true): AgentOrchestrationConfig => {
    const current = draftRef.current;
    const nextDraftVersion = markAsDraft && current.status === 'published'
      ? Math.max(current.draftVersion, (current.publishedVersion || current.draftVersion) + 1)
      : next.draftVersion;
    const valueWithTime: AgentOrchestrationConfig = {
      ...next,
      status: markAsDraft ? 'draft' as const : next.status,
      draftVersion: nextDraftVersion,
      updatedAt: Date.now(),
    };
    if (valueWithTime.mode !== 'single') {
      valueWithTime.modeDrafts = { ...valueWithTime.modeDrafts, [valueWithTime.mode]: graphSnapshot(valueWithTime) };
    }
    setDraft(valueWithTime);
    draftRef.current = valueWithTime;
    if (sync) {
      lastSyncedValue.current = valueWithTime;
      lastSyncedBotId.current = bot.id;
      hasSynced.current = true;
      onChange(valueWithTime);
    }
    return valueWithTime;
  };

  // 切换编排模式并补齐所需节点。
  const changeMode = (mode: AgentOrchestrationConfig['mode']) => {
    if (mode === draft.mode) return;
    const modeDrafts = { ...draft.modeDrafts };
    if (draft.mode !== 'single') modeDrafts[draft.mode] = graphSnapshot(draft);
    const savedTarget = mode === 'single' ? undefined : modeDrafts[mode];
    let next: AgentOrchestrationConfig = { ...draft, mode, modeDrafts, enabled: mode !== 'single' };
    if (mode === 'single') {
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    } else if (savedTarget) {
      next = { ...next, ...savedTarget, mode, modeDrafts, enabled: true };
      setSelectedNodeId(mode === 'supervisor' ? savedTarget.supervisorNodeId || savedTarget.nodes[0]?.id || null : savedTarget.initialNodeId || savedTarget.nodes[0]?.id || null);
      setSelectedEdgeId(null);
    } else if (mode === 'supervisor') {
      const supervisor = draft.nodes.find((node) => node.type === 'supervisor') || createAgentNode('agent_supervisor', 'supervisor', 'Supervisor', { x: 40, y: 170 });
      const childBase = draft.nodes.find((node) => node.id !== supervisor.id && node.type !== 'supervisor' && node.type !== 'end' && node.type !== 'human') || createFirstBusinessAgent(bot, { x: 300, y: 170 });
      const child = { ...childBase, enabled: true, position: { x: 320, y: 170 } };
      const positionedSupervisor = { ...supervisor, enabled: true, position: { x: 40, y: 170 } };
      const nodes = [positionedSupervisor, child, ...draft.nodes.filter((node) => node.id !== supervisor.id && node.id !== child.id && node.type !== 'supervisor')];
      const existingEdges = draft.edges.filter((edge) => nodes.some((node) => node.id === edge.source) && nodes.some((node) => node.id === edge.target));
      const hasEntry = existingEdges.some((edge) => edge.source === positionedSupervisor.id && edge.target === child.id);
      const defaultEdgeType: AgentOrchestrationEdgeType = child.type === 'task_agent' ? 'delegate' : 'handoff';
      next = { ...next, nodes, supervisorNodeId: positionedSupervisor.id, initialNodeId: positionedSupervisor.id, fallbackNodeId: child.id, edges: hasEntry ? existingEdges : [createAgentEdge('edge_supervisor_default', positionedSupervisor.id, child.id, defaultEdgeType), ...existingEdges] };
      setSelectedNodeId(positionedSupervisor.id);
      setZoom(0.82);
      setPan({ x: 24, y: 48 });
    } else if (mode === 'handoff') {
      const supervisorIds = new Set(draft.nodes.filter((node) => node.type === 'supervisor').map((node) => node.id));
      const nodes = draft.nodes.filter((node) => !supervisorIds.has(node.id));
      const initial = nodes.find((node) => node.type !== 'end' && node.type !== 'human') || createFirstBusinessAgent(bot, { x: 160, y: 190 });
      next = { ...next, nodes: nodes.length > 0 ? nodes : [initial], supervisorNodeId: undefined, initialNodeId: initial.id, fallbackNodeId: initial.id, edges: draft.edges.filter((edge) => !supervisorIds.has(edge.source) && !supervisorIds.has(edge.target)) };
      setSelectedNodeId(initial.id);
      setSelectedEdgeId(null);
    }
    commit(next);
  };

  // 新增 Agent 节点。
  const addNode = (type: AgentOrchestrationNodeType) => {
    const id = `agent_${type}_${Date.now()}`;
    const names: Record<AgentOrchestrationNodeType, string> = { supervisor: 'Supervisor', flow_agent: '新 Flow Agent', topic_agent: '新主题 Agent', task_agent: '新任务 Agent', human: '人工服务', end: '结束' };
    const node = createAgentNode(id, type, names[type], { x: 320 + (draft.nodes.length % 3) * 260, y: 150 + Math.floor(draft.nodes.length / 3) * 150 });
    const next = { ...draft, nodes: [...draft.nodes, node] };
    commit(next);
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
  };

  // 删除当前选中的节点或边。
  const deleteSelection = (kind: 'node' | 'edge', id: string) => {
    const target = kind === 'node' ? draft.nodes.find((node) => node.id === id)?.name : draft.edges.find((edge) => edge.id === id)?.label;
    if (!window.confirm(`确定删除“${target || '当前配置'}”吗？`)) return;
    const next = kind === 'node'
      ? { ...draft, nodes: draft.nodes.filter((node) => node.id !== id), edges: draft.edges.filter((edge) => edge.source !== id && edge.target !== id) }
      : { ...draft, edges: draft.edges.filter((edge) => edge.id !== id) };
    commit(next);
    if (kind === 'node') setSelectedNodeId(next.nodes[0]?.id || null);
    setSelectedEdgeId(null);
  };

  // 创建一条新的边。
  const connectNodes = (source: string, target: string) => {
    if (source === target) return;
    if (draft.edges.some((edge) => edge.source === source && edge.target === target)) return;
    const targetNode = draft.nodes.find((node) => node.id === target);
    const edgeType: AgentOrchestrationEdgeType = targetNode?.type === 'human' ? 'escalate' : targetNode?.type === 'task_agent' ? 'delegate' : 'handoff';
    const edge = createAgentEdge(`edge_${Date.now()}`, source, target, edgeType);
    commit({ ...draft, edges: [...draft.edges, edge] });
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
    setConnectingFrom(null);
  };

  // 执行编排校验。
  const validateDraft = () => {
    const issues = validateOrchestration(draft);
    setValidationIssues(issues);
    setValidationOpen(true);
    return issues;
  };

  // 保存草稿。
  const saveDraft = () => {
    const next = { ...draft, status: 'draft' as const, draftVersion: Math.max(1, draft.draftVersion), updatedAt: Date.now() };
    const persisted = commit(next, true, false);
    onSave(persisted);
    setToast('编排草稿已保存');
    window.setTimeout(() => setToast(''), 2200);
  };

  // 开始拖动节点或画布。
  const handleNodePointerDown = (event: React.PointerEvent<HTMLDivElement>, nodeId: string) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    const node = draft.nodes.find((item) => item.id === nodeId);
    if (!node) return;
    setDragState({ kind: 'node', nodeId, startX: event.clientX, startY: event.clientY, originX: node.position.x, originY: node.position.y });
  };
  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    setDragState({ kind: 'canvas', startX: event.clientX, startY: event.clientY, originX: pan.x, originY: pan.y });
  };

  const selectedNode = draft.nodes.find((node) => node.id === selectedNodeId) || null;
  const selectedEdge = draft.edges.find((edge) => edge.id === selectedEdgeId) || null;
  const nodeMap = useMemo(() => new Map(draft.nodes.map((node) => [node.id, node])), [draft.nodes]);
  const liveIssues = useMemo(() => validateOrchestration(draft), [draft]);
  const issueCount = liveIssues.filter((issue) => issue.level === 'error').length;

  // 更新选中节点。
  const updateSelectedNode = (node: AgentOrchestrationNode) => commit({ ...draft, nodes: draft.nodes.map((item) => item.id === node.id ? node : item) });
  // 更新选中边。
  const updateSelectedEdge = (edge: AgentOrchestrationEdge) => commit({ ...draft, edges: draft.edges.map((item) => item.id === edge.id ? edge : item) });

  return (
    <div className="flex min-h-[680px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Sparkles className="h-5 w-5" /></div>
          <div><h2 className="text-base font-bold text-slate-900">Agent 编排</h2><div className="mt-1 flex items-center gap-2 text-xs text-slate-500"><span>{draft.mode === 'single' ? '单 Agent' : draft.mode === 'supervisor' ? 'Supervisor' : 'Handoff'}</span>{draft.mode !== 'single' && <><span className="text-slate-300">·</span><span>{draft.nodes.filter((node) => node.enabled).length} 个节点</span><span className="text-slate-300">·</span><span>{draft.edges.filter((edge) => edge.enabled).length} 条边</span></>}</div></div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={validateDraft} className="button-secondary"><ShieldCheck className="h-4 w-4" />校验</button>
          <button type="button" onClick={saveDraft} className="button-secondary"><Save className="h-4 w-4" />保存草稿</button>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 text-xs font-semibold text-slate-500">编排模式</span>
          {ORCHESTRATION_MODES.map((mode) => <button key={mode.value} type="button" title={mode.description} onClick={() => changeMode(mode.value)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${draft.mode === mode.value ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-transparent bg-white text-slate-500 hover:border-slate-200 hover:text-slate-700'}`}>{mode.label}</button>)}
        </div>
      </div>

      {draft.mode === 'single' ? <SingleAgentSummary bot={bot} /> : <div className="flex min-h-0 flex-1">
        <aside className="w-44 shrink-0 border-r border-slate-200 bg-slate-50/60 p-3">
          <div className="mb-3 flex items-center justify-between"><div className="text-xs font-bold text-slate-700">节点</div><button type="button" title="重置视图" onClick={() => { setPan({ x: 40, y: 40 }); setZoom(1); }} className="rounded p-1 text-slate-400 hover:bg-white hover:text-blue-600"><RotateCcw className="h-3.5 w-3.5" /></button></div>
          <div className="space-y-2">
            {(['flow_agent', 'topic_agent', 'task_agent', 'human', 'end'] as AgentOrchestrationNodeType[]).map((type) => <button key={type} type="button" onClick={() => addNode(type)} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"><span className={`flex h-6 w-6 items-center justify-center rounded ${nodeStyle(type).icon}`}>{nodeIcon(type)}</span>{NODE_TYPE_LABELS[type]}<Plus className="ml-auto h-3.5 w-3.5 text-slate-400" /></button>)}
          </div>
          <div className="mt-5 border-t border-slate-200 pt-4"><div className="mb-2 text-xs font-bold text-slate-700">画布工具</div><button type="button" onClick={() => { setConnectingFrom(null); setSelectedNodeId(null); setSelectedEdgeId(null); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-600 hover:bg-white"><MousePointer2 className="h-4 w-4 text-slate-400" />选择</button><button type="button" onClick={() => setConnectingFrom(null)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs ${connectingFrom ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-white'}`}><Link2 className="h-4 w-4 text-slate-400" />{connectingFrom ? '点击目标节点完成连接' : '点击节点右侧连接'}</button></div>
          <div className="mt-5 rounded-lg border border-slate-200 bg-white p-3"><div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-700"><span>编排状态</span><button type="button" onClick={validateDraft} className="text-blue-600 hover:text-blue-700">校验</button></div><div className={`flex items-center gap-2 text-xs ${issueCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{issueCount > 0 ? <AlertCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}{issueCount > 0 ? `${issueCount} 个错误` : '配置可发布'}</div></div>
        </aside>

        <div className="relative min-w-0 flex-1 bg-[#f8fafc]">
          <div className="absolute left-4 top-4 z-10 flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm"><button type="button" title="缩小" onClick={() => setZoom((current) => Math.max(0.55, Number((current - 0.1).toFixed(2))))} className="icon-button"><Minus className="h-4 w-4" /></button><span className="min-w-12 text-center text-xs font-semibold text-slate-500">{Math.round(zoom * 100)}%</span><button type="button" title="放大" onClick={() => setZoom((current) => Math.min(1.6, Number((current + 0.1).toFixed(2))))} className="icon-button"><Plus className="h-4 w-4" /></button><button type="button" title="适应画布" onClick={() => { setPan({ x: 40, y: 40 }); setZoom(0.82); }} className="icon-button"><Maximize2 className="h-4 w-4" /></button></div>
          <div className="absolute right-4 top-4 z-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm"><span className="font-semibold text-slate-700">{draft.mode === 'supervisor' ? '统一调度' : '直接接力'}</span></div>
          <div className="h-full min-h-[560px] overflow-hidden" onPointerDown={(event) => { setSelectedNodeId(null); setSelectedEdgeId(null); handleCanvasPointerDown(event); }} onWheel={(event) => { event.preventDefault(); setZoom((current) => Math.max(0.55, Math.min(1.6, Number((current + (event.deltaY > 0 ? -0.05 : 0.05)).toFixed(2))))); }}>
            <div className="relative h-full" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              <div className="absolute left-0 top-0 origin-top-left" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
                <svg className="pointer-events-none absolute left-0 top-0 h-full w-full overflow-visible">
                  <defs><marker id="agent-edge-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#94a3b8" /></marker><marker id="agent-edge-arrow-selected" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#2563eb" /></marker></defs>
                  {draft.edges.map((edge) => {
                    const source = nodeMap.get(edge.source);
                    const target = nodeMap.get(edge.target);
                    if (!source || !target) return null;
                    const x1 = source.position.x + NODE_WIDTH;
                    const y1 = source.position.y + NODE_HEIGHT / 2;
                    const x2 = target.position.x;
                    const y2 = target.position.y + NODE_HEIGHT / 2;
                    const dx = Math.max(50, Math.abs(x2 - x1) * 0.45);
                    const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
                    const selected = selectedEdgeId === edge.id;
                    return <g key={edge.id} className="pointer-events-auto cursor-pointer" onClick={(event) => { event.stopPropagation(); setSelectedEdgeId(edge.id); setSelectedNodeId(null); }}><path d={path} fill="none" stroke="transparent" strokeWidth="14" /><path d={path} fill="none" stroke={selected ? '#2563eb' : '#94a3b8'} strokeWidth={selected ? '2.5' : '1.8'} markerEnd={`url(#${selected ? 'agent-edge-arrow-selected' : 'agent-edge-arrow'})`} /><text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 7} textAnchor="middle" className={selected ? 'fill-blue-700 text-[11px] font-semibold' : 'fill-slate-500 text-[11px]'}>{edge.label}</text></g>;
                  })}
                </svg>
                {draft.nodes.map((node) => <AgentNodeCard key={node.id} node={node} selected={selectedNodeId === node.id} connecting={connectingFrom === node.id} onPointerDown={handleNodePointerDown} onClick={(event, nodeId) => { event.stopPropagation(); if (connectingFrom && connectingFrom !== nodeId) connectNodes(connectingFrom, nodeId); else { setSelectedNodeId(nodeId); setSelectedEdgeId(null); } }} onStartConnect={(event, nodeId) => { event.stopPropagation(); setConnectingFrom((current) => current === nodeId ? null : nodeId); setSelectedNodeId(nodeId); setSelectedEdgeId(null); }} />)}
              </div>
            </div>
          </div>
        </div>

        <aside className="w-[320px] shrink-0 border-l border-slate-200">
          {selectedNode && <NodeInspector node={selectedNode} bot={bot} onChange={updateSelectedNode} onDelete={() => deleteSelection('node', selectedNode.id)} />}
          {selectedEdge && !selectedNode && <EdgeInspector edge={selectedEdge} nodes={draft.nodes} bot={bot} mode={draft.mode} onChange={updateSelectedEdge} onDelete={() => deleteSelection('edge', selectedEdge.id)} />}
           {!selectedNode && !selectedEdge && <OrchestrationInspector config={draft} onChange={(value) => commit(value)} />}
         </aside>
      </div>}

      {validationOpen && <Modal title="编排校验" onClose={() => setValidationOpen(false)}><div className="space-y-2">{validationIssues.length === 0 ? <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm text-emerald-700"><Check className="h-4 w-4" />当前配置可以发布</div> : validationIssues.map((issue, index) => <button key={`${issue.code}-${index}`} type="button" onClick={() => { if (issue.targetId?.startsWith('agent_')) { setSelectedNodeId(issue.targetId); setSelectedEdgeId(null); } else if (issue.targetId?.startsWith('edge_')) { setSelectedEdgeId(issue.targetId); setSelectedNodeId(null); } setValidationOpen(false); }} className={`flex w-full items-start gap-2 rounded-lg border px-3 py-3 text-left text-xs ${issue.level === 'error' ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-amber-100 bg-amber-50 text-amber-700'}`}>{issue.level === 'error' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" />}<span>{issue.message}</span></button>)}</div></Modal>}
      {toast && <div className="fixed right-8 top-20 z-[80] rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg">{toast}</div>}
    </div>
  );
}

// 弹窗容器。
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/30 px-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h3 className="text-base font-bold text-slate-900">{title}</h3><button type="button" aria-label="关闭" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button></div><div className="p-5">{children}</div></div></div>;
}
