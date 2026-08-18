// 边配置面板，用于配置连线的类型、条件、优先级等。
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, GitBranch, HelpCircle, Sparkles, X } from 'lucide-react';
import { BotVariable, FlowEdge, FlowFunction, FlowNode } from '../../types';
import { Label } from '../ui/FormComponents';
import VisualConditionBuilder from '../bot/intent/nodes/VisualConditionBuilder';

interface FlowEdgeConfigProps {
  edge: FlowEdge | null;
  sourceNode: FlowNode | null;
  targetNode: FlowNode | null;
  availableFlows?: Array<{ id: string; name: string }>;
  availableFunctions: FlowFunction[];
  availableVariables?: BotVariable[];
  onChange: (edge: FlowEdge) => void;
  onClose: () => void;
  readOnly?: boolean;
}

function Section({ title, icon, children, defaultExpanded = true }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button type="button" onClick={() => setExpanded((v) => !v)} className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">{icon}<span>{title}</span></div>
        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {expanded ? <div className="space-y-4 p-4">{children}</div> : null}
    </section>
  );
}

const EDGE_BRANCH_TYPES = [
  { value: 'conditional', label: '条件分支', desc: '按变量或表达式判断路径', icon: <GitBranch size={16} /> },
  { value: 'llm_branch', label: '模型路由', desc: '由模型根据提示词选择路径', icon: <Sparkles size={16} /> },
];

export default function FlowEdgeConfig({
  edge,
  sourceNode,
  targetNode,
  availableFlows = [],
  availableFunctions,
  availableVariables = [],
  onChange,
  onClose,
  readOnly = false,
}: FlowEdgeConfigProps) {
  if (!edge) {
    return <div className="flex h-full items-center justify-center p-8 text-sm text-slate-400">请选择一条连线</div>;
  }

  const updateEdge = (updates: Partial<FlowEdge>) => {
    if (readOnly) return;
    onChange({ ...edge, ...updates });
  };

  const edgeType = edge.edgeType === 'conditional' ? 'conditional' : 'llm_branch';
  const conditionExpression = edge.condition?.expression || edge.conditionSummary || '';
  const variableNames = availableVariables.map((variable) => variable.name).filter(Boolean);

  const updateEdgeType = (nextType: FlowEdge['edgeType']) => {
    if (nextType === 'conditional') {
      updateEdge({
        edgeType: 'conditional',
        condition: edge.condition || { mode: 'expression', expression: conditionExpression },
      });
      return;
    }

    updateEdge({
      edgeType: 'llm_branch',
      llmRoutingPrompt: edge.llmRoutingPrompt || edge.description || edge.conditionSummary || '',
    });
  };

  const updateConditionExpression = (expression: string) => {
    updateEdge({
      conditionSummary: expression,
      condition: {
        ...(edge.condition || {}),
        mode: 'expression',
        expression,
      },
    });
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-slate-800">连线配置</div>
          <div className="text-[11px] text-slate-400">{edge.id}</div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"><X size={16} /></button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* 基础信息 */}
        <Section title="基础信息" icon={<GitBranch size={16} />}>
          <div>
            <Label label="边标签" tooltip="给人看的短标签，如：验证成功、需要转人工、继续追问" />
            <input
              value={edge.label || ''}
              disabled={readOnly}
              onChange={(e) => updateEdge({ label: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
              placeholder="如：是、否、成功"
            />
          </div>
          <div>
            <Label label="边描述" tooltip="给运营和调试人员看的备注，不参与机器判断" />
            <textarea
              rows={3}
              value={edge.description || ''}
              disabled={readOnly}
              onChange={(e) => updateEdge({ description: e.target.value })}
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
              placeholder="如：用户确认了订单信息，可以继续下一步"
            />
          </div>
        </Section>

        {/* 边类型 */}
        <Section title="边类型" icon={<GitBranch size={16} />}>
          <div className="space-y-2">
            {EDGE_BRANCH_TYPES.map((item) => {
              const selected = edgeType === item.value;
              return (
                <label
                  key={item.value}
                  className={`flex items-start gap-3 rounded-xl border px-3 py-3 cursor-pointer ${
                    selected ? 'border-primary bg-sky-50' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`edge_type_${edge.id}`}
                    checked={selected}
                    disabled={readOnly}
                    onChange={() => updateEdgeType(item.value as FlowEdge['edgeType'])}
                    className="mt-1 h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-800">{item.icon}{item.label}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{item.desc}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </Section>

        {/* 条件配置 - 仅 conditional 类型显示 */}
        {edgeType === 'conditional' ? (
          <Section title="条件配置" icon={<GitBranch size={16} />}>
            <div>
              <Label label="条件表达式" tooltip="参考意图识别模块的条件分支：可以按变量、状态值、文本内容组合判断" />
              <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-3">
                <VisualConditionBuilder
                  value={conditionExpression}
                  onChange={updateConditionExpression}
                  availableVariables={variableNames}
                />
              </div>
            </div>
            <div>
              <Label label="条件函数" tooltip="可选：选择用于辅助判断或执行转场的函数" />
              <select
                value={edge.transitionFunctionId || ''}
                disabled={readOnly}
                onChange={(e) => updateEdge({ transitionFunctionId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
              >
                <option value="">无</option>
                {availableFunctions.map((fn) => (
                  <option key={fn.id} value={fn.id}>{fn.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label label="前置实体要求" tooltip="这些实体满足前不应触发此边" />
              <input
                value={(edge.requiredEntities || []).join(', ')}
                disabled={readOnly}
                onChange={(e) => updateEdge({ requiredEntities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
                placeholder="如：phone, order_id（逗号分隔）"
              />
            </div>
          </Section>
        ) : null}

        {/* 模型路由配置 */}
        {edgeType === 'llm_branch' ? (
          <Section title="模型路由" icon={<Sparkles size={16} />}>
            <div>
              <Label label="路由规则" tooltip="说明模型选择该连线的业务条件" />
              <textarea
                rows={6}
                value={edge.llmRoutingPrompt || ''}
                disabled={readOnly}
                onChange={(e) => updateEdge({ llmRoutingPrompt: e.target.value })}
                className="w-full resize-none rounded-xl border border-sky-200 bg-sky-50/30 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
                placeholder="例如：用户确认手机号无误并愿意继续验证时，进入此路径；用户拒绝、质疑或要求人工时不进入。"
              />
              <p className="mt-2 text-[11px] leading-5 text-slate-400">
                用于模型判断分支走向；备注信息请填写在“边描述”。
              </p>
            </div>
          </Section>
        ) : null}

        {/* 跨 Flow 跳转配置 - 仅 goto_flow 类型显示 */}
        {edgeType === 'goto_flow' ? (
          <Section title="跳转配置" icon={<GitBranch size={16} />}>
            <div>
              <Label label="目标 Flow" tooltip="选择要跳转到的 Flow" />
              <select
                value={edge.targetFlowId || ''}
                disabled={readOnly}
                onChange={(e) => updateEdge({ targetFlowId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
              >
                <option value="">选择目标 Flow</option>
                {availableFlows.map((flow) => (
                  <option key={flow.id} value={flow.id}>{flow.name}</option>
                ))}
              </select>
              {edge.targetFlowId && !availableFlows.find(f => f.id === edge.targetFlowId) && (
                <p className="mt-1 text-xs text-red-500">目标 Flow 不存在，请重新选择</p>
              )}
            </div>
          </Section>
        ) : null}

        {/* 优先级 */}
        <Section title="优先级" icon={<GitBranch size={16} />}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label label="优先级" tooltip="数字越大优先级越高，兜底边应设为最低" />
              <span className="text-xs text-slate-500 font-mono">{edge.priority ?? 50}</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={edge.priority ?? 50}
              disabled={readOnly}
              onChange={(e) => updateEdge({ priority: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>低</span>
              <span>中</span>
              <span>高</span>
            </div>
          </div>
        </Section>

        {/* 调试规则 */}
        <Section title="调试规则" icon={<HelpCircle size={16} />} defaultExpanded={false}>
          <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3">
            <div>
              <div className="text-sm font-medium text-slate-800">强制走这条边</div>
              <div className="mt-1 text-xs text-slate-500">调试时忽略条件判断，直接走这条边</div>
            </div>
            <input
              type="checkbox"
              checked={edge.debugRule?.forceEdge ?? false}
              disabled={readOnly}
              onChange={(e) => updateEdge({ debugRule: { ...edge.debugRule, forceEdge: e.target.checked } })}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
          </label>
        </Section>
      </div>
    </div>
  );
}

export type { FlowEdgeConfigProps };
