// 这个工作区负责跟进 Flow 的列表管理、独立画布编辑、校验和试运行。
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Copy,
  GitBranch,
  LayoutGrid,
  Play,
  Plus,
  Power,
  Save,
  Search,
  Settings2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { FollowUpRule, FollowUpTask } from '../../types';
import FollowUpRuleCanvas from './FollowUpRuleCanvas';
import FollowUpRuleInspector from './FollowUpRuleInspector';
import {
  FollowUpGraphEdge,
  FollowUpGraphNode,
  FollowUpGraphNodeType,
  FollowUpRuleGraphDefinition,
  FollowUpSimulationEvent,
  FollowUpValidationIssue,
  autoLayoutFollowUpRule,
  createBlankFollowUpRule,
  createFollowUpGraphEdge,
  createFollowUpGraphNode,
  createSeedFollowUpRuleGraphs,
  duplicateFollowUpRule,
  getNodeOutputOptions,
  moveFollowUpRuleNode,
  simulateFollowUpRule,
  toggleFollowUpRuleStatus,
  validateFollowUpRule,
} from './followUpRuleGraph';

export const FOLLOW_UP_FLOW_STORAGE_KEY = 'voice_agent_follow_up_rule_graphs_v4';

interface FollowUpRulesWorkspaceProps {
  legacyRules: FollowUpRule[];
  tasks: FollowUpTask[];
}

const statusLabel = { draft: '草稿', published: '已发布', disabled: '已停用' } as const;
const statusClass = {
  draft: 'border-amber-100 bg-amber-50 text-amber-700',
  published: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  disabled: 'border-slate-200 bg-slate-50 text-slate-500',
} as const;

function normalizeRule(rule: FollowUpRuleGraphDefinition): FollowUpRuleGraphDefinition {
  return {
    ...rule,
    disabledFromStatus: rule.disabledFromStatus === 'draft' || rule.disabledFromStatus === 'published'
      ? rule.disabledFromStatus
      : undefined,
    dedupeFieldKeys: Array.isArray(rule.dedupeFieldKeys) ? rule.dedupeFieldKeys : ['customer.phone'],
    dedupeStrategy: rule.dedupeStrategy || 'ignore',
    validityDays: rule.validityDays || 7,
    conflictStrategy: rule.conflictStrategy || 'latest',
    variables: (rule.variables || []).map(variable => ({
      ...variable,
      label: variable.label || variable.name || variable.key,
      name: variable.name || variable.label || variable.key,
      sourceType: variable.sourceType || 'system',
      sourceKey: variable.sourceKey || '',
      required: Boolean(variable.required),
    })),
    nodes: (rule.nodes || []).map(node => {
      const config = node.config || {};
      return {
        ...node,
        config: {
          ...config,
          triggerConditions: Array.isArray(config.triggerConditions) ? config.triggerConditions : [],
          triggerMappings: Array.isArray(config.triggerMappings) ? config.triggerMappings : [],
          conditionRows: Array.isArray(config.conditionRows)
            ? config.conditionRows
            : config.conditionField
              ? [{ id: `${node.id}_condition`, field: config.conditionField, operator: config.conditionOperator || 'equals', valueType: 'text', value: config.conditionValue || '' }]
              : [],
          parameterMappings: Array.isArray(config.parameterMappings) ? config.parameterMappings : [],
          resultMappings: Array.isArray(config.resultMappings) ? config.resultMappings : [],
          writeBackRows: Array.isArray(config.writeBackRows) ? config.writeBackRows : [],
        },
      };
    }),
    edges: rule.edges || [],
  };
}

export function loadFollowUpFlows(legacyRules: FollowUpRule[]) {
  if (typeof window !== 'undefined') {
    try {
      const value = window.localStorage.getItem(FOLLOW_UP_FLOW_STORAGE_KEY);
      if (value) {
        const parsed = JSON.parse(value) as FollowUpRuleGraphDefinition[];
        if (Array.isArray(parsed) && parsed.every(item => Array.isArray(item.nodes) && Array.isArray(item.edges))) return parsed.map(normalizeRule);
      }
    } catch {
      // Ignore unreadable local drafts and restore the published rule set.
    }
  }
  return createSeedFollowUpRuleGraphs(legacyRules);
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(timestamp);
}

function Pill({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${className}`}>{children}</span>;
}

function RulesList({
  rules,
  tasks,
  onCreate,
  onEdit,
  onDuplicate,
  onToggle,
  onDelete,
}: {
  rules: FollowUpRuleGraphDefinition[];
  tasks: FollowUpTask[];
  onCreate: () => void;
  onEdit: (ruleId: string) => void;
  onDuplicate: (ruleId: string) => void;
  onToggle: (ruleId: string) => void;
  onDelete: (ruleId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const visibleRules = useMemo(() => rules.filter(rule => {
    const matchesSearch = !search.trim() || `${rule.name} ${rule.description}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesSearch && (statusFilter === 'all' || rule.status === statusFilter);
  }), [rules, search, statusFilter]);

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden border border-slate-200 bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">跟进 Flow</h2>
          <div className="mt-1 text-xs text-slate-500">共 {rules.length} 个 Flow，{rules.filter(rule => rule.status === 'published').length} 个已发布</div>
        </div>
        <button type="button" onClick={onCreate} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"><Plus size={16} />新建 Flow</button>
      </header>

      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <div className="relative w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary" placeholder="搜索 Flow 名称" value={search} onChange={event => setSearch(event.target.value)} />
        </div>
        <div className="relative">
          <select className="appearance-none rounded-md border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm text-slate-600 outline-none focus:border-primary" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
            <option value="all">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
            <option value="disabled">已停用</option>
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[27%]" />
            <col className="w-[7%]" />
            <col className="w-[5%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[7%]" />
            <col className="w-[10%]" />
            <col className="w-[22%]" />
          </colgroup>
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
            <tr className="whitespace-nowrap text-xs font-semibold text-slate-500">
              <th className="px-5 py-3">Flow</th>
              <th className="px-2 py-3">状态</th>
              <th className="px-2 py-3">版本</th>
              <th className="px-4 py-3">适用范围</th>
              <th className="px-4 py-3">流程规模</th>
              <th className="px-4 py-3">运行任务</th>
              <th className="px-4 py-3">更新时间</th>
              <th className="px-5 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleRules.map(rule => {
              const relatedTasks = tasks.filter(task => task.ruleId === rule.id);
              const runningTasks = relatedTasks.filter(task => ['pending', 'running', 'no_answer'].includes(task.status)).length;
              const toggleLabel = rule.status === 'disabled'
                ? rule.disabledFromStatus === 'published' ? '启用 Flow' : '恢复草稿'
                : '停用 Flow';
              return (
                <tr key={rule.id} className="group hover:bg-slate-50">
                  <td className="max-w-[360px] px-5 py-4">
                    <button type="button" onClick={() => onEdit(rule.id)} className="text-left">
                      <div className="font-medium text-slate-900 group-hover:text-primary">{rule.name}</div>
                      <div className="mt-1 line-clamp-1 text-xs text-slate-500">{rule.description || '未填写规则说明'}</div>
                    </button>
                  </td>
                  <td className="px-2 py-4"><Pill className={statusClass[rule.status]}>{statusLabel[rule.status]}</Pill></td>
                  <td className="px-2 py-4 text-slate-600">V{rule.version}</td>
                  <td className="px-4 py-4 text-xs text-slate-500"><div className="whitespace-nowrap">{rule.scope.botIds.length || '全部'} 个机器人</div><div className="mt-1 whitespace-nowrap">{rule.scope.flowIds.length || '全部'} 个 Flow</div></td>
                  <td className="px-4 py-4 text-slate-600">{rule.nodes.length} 节点 / {rule.edges.length} 边</td>
                  <td className="px-4 py-4"><span className={runningTasks > 0 ? 'font-semibold text-primary' : 'text-slate-500'}>{runningTasks}</span></td>
                  <td className="px-4 py-4 text-xs text-slate-500">{formatTime(rule.updatedAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => onEdit(rule.id)} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-primary hover:text-primary">编辑</button>
                      <button type="button" onClick={() => onDuplicate(rule.id)} className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:border-primary hover:text-primary" title="复制 Flow"><Copy size={15} /></button>
                      <button type="button" onClick={() => onToggle(rule.id)} className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:border-primary hover:text-primary" title={toggleLabel} aria-label={`${toggleLabel} ${rule.name}`}><Power size={15} /></button>
                      <button type="button" onClick={() => onDelete(rule.id)} className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:border-rose-200 hover:text-rose-600" title="删除 Flow" aria-label={`删除 ${rule.name}`}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visibleRules.length === 0 && <div className="flex h-60 items-center justify-center text-sm text-slate-400">没有符合条件的 Flow</div>}
      </div>
    </section>
  );
}

function ValidationDialog({
  issues,
  onClose,
  onSelectIssue,
}: {
  issues: FollowUpValidationIssue[];
  onClose: () => void;
  onSelectIssue: (issue: FollowUpValidationIssue) => void;
}) {
  const errors = issues.filter(issue => issue.level === 'error');
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 p-6">
      <div className="flex max-h-[72vh] w-[560px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-full ${errors.length ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{errors.length ? <CircleAlert size={18} /> : <CheckCircle2 size={18} />}</span><div><h3 className="font-semibold text-slate-900">规则校验</h3><div className="mt-0.5 text-xs text-slate-500">{issues.length ? `${errors.length} 个错误，${issues.length - errors.length} 个提醒` : '规则可以发布'}</div></div></div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-400 hover:bg-slate-100"><X size={17} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {issues.length === 0 ? <div className="py-12 text-center text-sm text-slate-500">未发现流程结构问题</div> : <div className="space-y-2">{issues.map(issue => <button key={issue.id} type="button" onClick={() => onSelectIssue(issue)} className="flex w-full items-start gap-3 rounded-md border border-slate-200 p-3 text-left hover:border-primary/40 hover:bg-slate-50"><span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${issue.level === 'error' ? 'bg-rose-500' : 'bg-amber-500'}`} /><span className="text-sm text-slate-700">{issue.message}</span></button>)}</div>}
        </div>
      </div>
    </div>
  );
}

function SimulationDialog({
  rule,
  onClose,
  onSelectNode,
}: {
  rule: FollowUpRuleGraphDefinition;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
}) {
  const [variables, setVariables] = useState<Record<string, string>>(() => ({
    ...Object.fromEntries(rule.variables.map(item => [item.key, item.defaultValue || ''])),
    ...Object.fromEntries(rule.nodes.filter(item => item.type === 'action').map(item => [`${item.id}.result`, getNodeOutputOptions(item)[0]?.value || 'success'])),
  }));
  const [events, setEvents] = useState<FollowUpSimulationEvent[]>([]);
  const actionNodes = rule.nodes.filter(item => item.type === 'action');
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 p-6">
      <div className="grid max-h-[82vh] w-[900px] grid-cols-[360px_1fr] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
        <div className="border-r border-slate-200">
          <header className="border-b border-slate-100 px-5 py-4"><h3 className="font-semibold text-slate-900">试运行输入</h3></header>
          <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5">
            {rule.variables.map(variable => <label key={variable.key} className="block"><span className="text-xs font-medium text-slate-500">{variable.label}</span><input className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" value={variables[variable.key] || ''} onChange={event => setVariables(current => ({ ...current, [variable.key]: event.target.value }))} /></label>)}
            {actionNodes.map(node => <label key={node.id} className="block"><span className="text-xs font-medium text-slate-500">{node.title}结果</span><select className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary" value={variables[`${node.id}.result`] || ''} onChange={event => setVariables(current => ({ ...current, [`${node.id}.result`]: event.target.value }))}>{getNodeOutputOptions(node).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>)}
            <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600"><input type="checkbox" checked={variables.touchBlocked === 'true'} onChange={event => setVariables(current => ({ ...current, touchBlocked: String(event.target.checked) }))} />命中触达保护</label>
            <button type="button" onClick={() => setEvents(simulateFollowUpRule(rule, variables))} className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-white"><Play size={15} />开始试运行</button>
          </div>
        </div>
        <div className="flex min-w-0 flex-col">
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="font-semibold text-slate-900">执行路径</h3><div className="mt-0.5 text-xs text-slate-500">{events.length ? `经过 ${events.length} 个节点` : '等待运行'}</div></div><button type="button" onClick={onClose} className="rounded-md p-2 text-slate-400 hover:bg-slate-100"><X size={17} /></button></header>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {events.length === 0 ? <div className="flex h-72 items-center justify-center text-sm text-slate-400">配置变量后开始试运行</div> : <div className="space-y-0">{events.map((event, index) => <button key={`${event.nodeId}_${index}`} type="button" onClick={() => { onSelectNode(event.nodeId); onClose(); }} className="relative flex w-full gap-4 pb-6 text-left last:pb-0"><span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-xs font-semibold text-primary">{index + 1}</span>{index < events.length - 1 && <span className="absolute bottom-0 left-[13px] top-7 w-px bg-slate-200" />}<span><span className="text-sm font-medium text-slate-900">{event.nodeTitle}</span><span className="mt-1 block text-xs text-slate-500">{event.detail}</span></span></button>)}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function RuleEditor({
  initialRule,
  onSave,
  onBack,
}: {
  initialRule: FollowUpRuleGraphDefinition;
  onSave: (rule: FollowUpRuleGraphDefinition) => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState<FollowUpRuleGraphDefinition>(initialRule);
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(initialRule));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialRule.nodes[0]?.id || null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [zoom, setZoom] = useState(0.78);
  const [viewport, setViewport] = useState({ x: 50, y: 80 });
  const [validationOpen, setValidationOpen] = useState(false);
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [publishMenuOpen, setPublishMenuOpen] = useState(false);
  const issues = useMemo(() => validateFollowUpRule(draft), [draft]);
  const dirty = JSON.stringify(draft) !== savedSnapshot;
  const selectedNode = draft.nodes.find(node => node.id === selectedNodeId) || null;
  const selectedEdge = draft.edges.find(edge => edge.id === selectedEdgeId) || null;

  const updateDraft = (next: FollowUpRuleGraphDefinition) => {
    setDraft({ ...next, status: next.status === 'published' ? 'draft' : next.status, updatedAt: Date.now() });
  };

  const saveDraft = () => {
    const next = { ...draft, updatedAt: Date.now() };
    setDraft(next);
    setSavedSnapshot(JSON.stringify(next));
    onSave(next);
  };

  const publish = () => {
    if (issues.some(issue => issue.level === 'error')) {
      setValidationOpen(true);
      setPublishMenuOpen(false);
      return;
    }
    const next = { ...draft, status: 'published' as const, disabledFromStatus: undefined, version: draft.version + 1, updatedAt: Date.now() };
    setDraft(next);
    setSavedSnapshot(JSON.stringify(next));
    onSave(next);
    setPublishMenuOpen(false);
  };

  const handleBack = () => {
    if (dirty && !window.confirm('当前规则有未保存修改，确认返回吗？')) return;
    onBack();
  };

  const deleteNode = (nodeId: string) => {
    updateDraft({ ...draft, nodes: draft.nodes.filter(node => node.id !== nodeId), edges: draft.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId) });
    setSelectedNodeId(null);
  };

  const deleteEdge = (edgeId: string) => {
    updateDraft({ ...draft, edges: draft.edges.filter(edge => edge.id !== edgeId) });
    setSelectedEdgeId(null);
  };

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden border border-slate-200 bg-white">
      <header className="flex h-[62px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={handleBack} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="返回 Flow 列表"><ArrowLeft size={18} /></button>
          <div className="min-w-0">
            <div className="flex items-center gap-2"><h2 className="truncate text-sm font-semibold text-slate-900">{draft.name}</h2><Pill className={statusClass[draft.status]}>{statusLabel[draft.status]}</Pill><span className="text-xs text-slate-400">V{draft.version}</span></div>
            <div className="mt-1 text-[11px] text-slate-400">{dirty ? '有未保存修改' : `已保存 ${formatTime(draft.updatedAt)}`}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null); setInspectorOpen(true); }} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"><Settings2 size={15} />规则设置</button>
          <button type="button" onClick={() => updateDraft(autoLayoutFollowUpRule(draft))} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"><LayoutGrid size={15} />自动布局</button>
          <button type="button" onClick={() => setValidationOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"><GitBranch size={15} />校验</button>
          <button type="button" onClick={() => setSimulationOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"><Play size={15} />试运行</button>
          <button type="button" onClick={saveDraft} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"><Save size={15} />保存</button>
          <div className="relative">
            <button type="button" onClick={() => setPublishMenuOpen(current => !current)} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-xs font-medium text-white hover:bg-primary/90"><Upload size={15} />发布<ChevronDown size={13} /></button>
            {publishMenuOpen && <div className="absolute right-0 top-11 z-50 w-48 rounded-md border border-slate-200 bg-white p-1 shadow-lg"><button type="button" onClick={publish} className="w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">发布为 V{draft.version + 1}</button><button type="button" onClick={() => { setDraft(current => toggleFollowUpRuleStatus(current)); setPublishMenuOpen(false); }} className="w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">停用规则</button></div>}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <FollowUpRuleCanvas
          rule={draft}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          zoom={zoom}
          viewport={viewport}
          onZoomChange={setZoom}
          onViewportChange={setViewport}
          onSelectNode={nodeId => { setSelectedNodeId(nodeId); setSelectedEdgeId(null); setInspectorOpen(Boolean(nodeId)); }}
          onSelectEdge={edgeId => { setSelectedEdgeId(edgeId); setSelectedNodeId(null); setInspectorOpen(Boolean(edgeId)); }}
          onMoveNode={(nodeId, position) => setDraft(current => moveFollowUpRuleNode(current, nodeId, position))}
          onAddNode={(type: FollowUpGraphNodeType, position) => { const nextNode = createFollowUpGraphNode(type, position); updateDraft({ ...draft, nodes: [...draft.nodes, nextNode] }); setSelectedNodeId(nextNode.id); setSelectedEdgeId(null); setInspectorOpen(true); }}
          onConnectNodes={(sourceId, targetId) => {
            const source = draft.nodes.find(node => node.id === sourceId);
            const target = draft.nodes.find(node => node.id === targetId);
            if (!source || !target) return;
            const nextOutput = getNodeOutputOptions(source).find(option => !draft.edges.some(edge => edge.source === sourceId && edge.sourceHandle === option.value));
            if (!nextOutput) return;
            const nextEdge = { ...createFollowUpGraphEdge(source, target), sourceHandle: nextOutput.value, label: nextOutput.label };
            updateDraft({ ...draft, edges: [...draft.edges, nextEdge] });
            setSelectedEdgeId(nextEdge.id);
            setSelectedNodeId(null);
            setInspectorOpen(true);
          }}
          onDeleteSelected={() => selectedNodeId ? deleteNode(selectedNodeId) : selectedEdgeId ? deleteEdge(selectedEdgeId) : undefined}
        />
      </div>

      {inspectorOpen && (
        <FollowUpRuleInspector
          rule={draft}
          node={selectedNode}
          edge={selectedEdge}
          onRuleChange={updateDraft}
          onNodeChange={(nextNode: FollowUpGraphNode) => updateDraft({ ...draft, nodes: draft.nodes.map(node => node.id === nextNode.id ? nextNode : node) })}
          onEdgeChange={(nextEdge: FollowUpGraphEdge) => updateDraft({ ...draft, edges: draft.edges.map(edge => edge.id === nextEdge.id ? nextEdge : edge) })}
          onDeleteNode={deleteNode}
          onDeleteEdge={deleteEdge}
          onClose={() => setInspectorOpen(false)}
        />
      )}
      {validationOpen && <ValidationDialog issues={issues} onClose={() => setValidationOpen(false)} onSelectIssue={issue => { setValidationOpen(false); setSelectedNodeId(issue.nodeId || null); setSelectedEdgeId(issue.edgeId || null); setInspectorOpen(Boolean(issue.nodeId || issue.edgeId)); }} />}
      {simulationOpen && <SimulationDialog rule={draft} onClose={() => setSimulationOpen(false)} onSelectNode={nodeId => { setSelectedNodeId(nodeId); setSelectedEdgeId(null); setInspectorOpen(true); }} />}
    </section>
  );
}

export default function FollowUpRulesWorkspace({ legacyRules, tasks }: FollowUpRulesWorkspaceProps) {
  const [rules, setRules] = useState<FollowUpRuleGraphDefinition[]>(() => loadFollowUpFlows(legacyRules));
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const editingRule = rules.find(rule => rule.id === editingRuleId) || null;

  useEffect(() => {
    window.localStorage.setItem(FOLLOW_UP_FLOW_STORAGE_KEY, JSON.stringify(rules));
  }, [rules]);

  const saveRule = (nextRule: FollowUpRuleGraphDefinition) => {
    setRules(current => current.some(rule => rule.id === nextRule.id) ? current.map(rule => rule.id === nextRule.id ? nextRule : rule) : [...current, nextRule]);
  };

  if (editingRule) return <RuleEditor initialRule={editingRule} onSave={saveRule} onBack={() => setEditingRuleId(null)} />;

  return (
    <RulesList
      rules={rules}
      tasks={tasks}
      onCreate={() => { const next = createBlankFollowUpRule('新建跟进 Flow'); setRules(current => [...current, next]); setEditingRuleId(next.id); }}
      onEdit={setEditingRuleId}
      onDuplicate={ruleId => { const source = rules.find(rule => rule.id === ruleId); if (!source) return; const next = duplicateFollowUpRule(source); setRules(current => [...current, next]); setEditingRuleId(next.id); }}
      onToggle={ruleId => setRules(current => current.map(rule => rule.id === ruleId ? toggleFollowUpRuleStatus(rule) : rule))}
      onDelete={ruleId => {
        const target = rules.find(rule => rule.id === ruleId);
        if (!target) return;
        if (tasks.some(task => task.ruleId === ruleId)) {
          window.alert('该 Flow 已关联跟进任务，无法删除');
          return;
        }
        if (!window.confirm(`确认删除 Flow“${target.name}”吗？`)) return;
        setRules(current => current.filter(rule => rule.id !== ruleId));
      }}
    />
  );
}
