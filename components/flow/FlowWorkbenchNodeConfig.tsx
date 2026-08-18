import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  MessageSquareQuote,
  Settings,
  Sparkles,
  Target,
  Wrench,
  X,
} from 'lucide-react';
import {
  AgentTool,
  BotVariable,
  BUILT_IN_FUNCTIONS,
  ExitNodeType,
  FlowAsrBiasing,
  FlowEntityType,
  FlowFunction,
  FlowNode,
  FlowNodeType,
  FlowStepKind,
} from '../../types';
import PromptEditor from '../ui/PromptEditor';
import { Label } from '../ui/FormComponents';

interface FlowWorkbenchNodeConfigProps {
  node: FlowNode | null;
  availableFunctions?: FlowFunction[];
  availableVariables?: BotVariable[];
  availableTools?: AgentTool[];
  onChange?: (node: FlowNode) => void;
  onClose?: () => void;
  readOnly?: boolean;
}

interface SectionProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const STEP_TYPE_OPTIONS: Array<{ value: FlowStepKind; label: string }> = [
  { value: 'default', label: 'Default step' },
  { value: 'collect', label: 'Collect step' },
  { value: 'function', label: 'Function step' },
];

const ENTITY_TYPE_OPTIONS: Array<{ value: FlowEntityType; label: string }> = [
  { value: 'text', label: 'Text' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'datetime', label: 'Datetime' },
  { value: 'address', label: 'Address' },
  { value: 'email', label: 'Email' },
  { value: 'alphanumeric', label: 'Alphanumeric' },
];

const ASR_BIAS_OPTIONS: Array<{ value: FlowAsrBiasing; label: string }> = [
  { value: 'default', label: 'Default' },
  { value: 'alphanumeric', label: 'Alphanumeric' },
  { value: 'name', label: 'Name' },
  { value: 'datetime', label: 'Datetime' },
  { value: 'number', label: 'Number' },
  { value: 'address', label: 'Address' },
];

const EXIT_TYPE_OPTIONS: Array<{ value: ExitNodeType; label: string; description: string }> = [
  { value: ExitNodeType.FINISH, label: 'Finish', description: 'End the current flow normally.' },
  { value: ExitNodeType.HANDOFF, label: 'Handoff', description: 'Escalate to a human or fallback flow.' },
  { value: ExitNodeType.STOP, label: 'Stop', description: 'Terminate the conversation immediately.' },
];

function Section({ title, subtitle, icon, children, defaultExpanded = true }: SectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100"
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-white p-2 text-slate-500 shadow-sm">{icon}</div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-800">{title}</div>
            {subtitle ? <div className="mt-0.5 text-[11px] text-slate-500">{subtitle}</div> : null}
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {expanded ? <div className="space-y-4 p-4">{children}</div> : null}
    </section>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3 ${disabled ? 'opacity-60' : ''}`}>
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-800">{label}</div>
        {description ? <div className="mt-1 text-xs leading-5 text-slate-500">{description}</div> : null}
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
      />
    </label>
  );
}

function TokenPicker({
  title,
  items,
  selectedIds,
  emptyText,
  accentClass,
  disabled,
  onToggle,
}: {
  title: string;
  items: Array<{ id: string; name: string; description?: string; isBuiltIn?: boolean }>;
  selectedIds: string[];
  emptyText: string;
  accentClass: string;
  disabled?: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium text-slate-600">{title}</div>
      <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
        {items.length === 0 ? (
          <div className="px-2 py-4 text-xs text-slate-400">{emptyText}</div>
        ) : (
          items.map((item) => {
            const selected = selectedIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => onToggle(item.id)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  selected
                    ? `${accentClass} border-transparent text-white`
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                title={item.description || item.name}
              >
                <span className="inline-flex items-center gap-1">
                  <span>{item.name}</span>
                  {item.isBuiltIn ? (
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${selected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      built-in
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function getNodeTypeLabel(nodeType: FlowNodeType) {
  if (nodeType === FlowNodeType.START) return 'Start node';
  if (nodeType === FlowNodeType.EXIT) return 'Exit node';
  return 'Step node';
}

function getNodeTypeBadge(nodeType: FlowNodeType) {
  if (nodeType === FlowNodeType.START) return 'bg-emerald-500';
  if (nodeType === FlowNodeType.EXIT) return 'bg-rose-500';
  return 'bg-sky-500';
}

function mergeUniqueFunctions(functions: FlowFunction[]) {
  const builtInIds = new Set(BUILT_IN_FUNCTIONS.map((item) => item.id));
  return [...BUILT_IN_FUNCTIONS, ...functions.filter((item) => !builtInIds.has(item.id))];
}

export default function FlowWorkbenchNodeConfig({
  node,
  availableFunctions = [],
  availableVariables = [],
  availableTools = [],
  onChange,
  onClose,
  readOnly = false,
}: FlowWorkbenchNodeConfigProps) {
  const [localNode, setLocalNode] = useState<FlowNode | null>(node);

  useEffect(() => {
    setLocalNode(node);
  }, [node]);

  const allFunctions = useMemo(() => mergeUniqueFunctions(availableFunctions), [availableFunctions]);
  const visibleFunctions = allFunctions.filter((item) => item.category === 'visible');
  const transitionFunctions = allFunctions.filter((item) => item.category === 'transition');

  if (!localNode) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-slate-400">
        <div>
          <Settings size={40} className="mx-auto mb-3 text-slate-200" />
          <div className="text-sm font-medium text-slate-500">Select a node</div>
          <div className="mt-1 text-xs leading-6 text-slate-400">Step prompt, entity collection and retry policy will appear here.</div>
        </div>
      </div>
    );
  }

  const updateNodeData = (updates: Partial<FlowNode['data']>) => {
    if (readOnly) return;
    const nextNode: FlowNode = {
      ...localNode,
      data: {
        ...localNode.data,
        ...updates,
      },
    };
    setLocalNode(nextNode);
    onChange?.(nextNode);
  };

  const updateStepPrompt = (updates: Partial<NonNullable<FlowNode['data']['stepPrompt']>>) => {
    updateNodeData({
      stepPrompt: {
        prompt: localNode.data.stepPrompt?.prompt || '',
        visibleFunctionIds: localNode.data.stepPrompt?.visibleFunctionIds || [],
        transitionFunctionIds: localNode.data.stepPrompt?.transitionFunctionIds || [],
        ...updates,
      },
    });
  };

  const toggleTool = (toolId: string) => {
    const current = localNode.data.toolIds || [];
    updateNodeData({
      toolIds: current.includes(toolId) ? current.filter((id) => id !== toolId) : [...current, toolId],
    });
  };

  const toggleVisibleFunction = (functionId: string) => {
    const current = localNode.data.stepPrompt?.visibleFunctionIds || [];
    updateStepPrompt({
      visibleFunctionIds: current.includes(functionId)
        ? current.filter((id) => id !== functionId)
        : [...current, functionId],
    });
  };

  const toggleTransitionFunction = (functionId: string) => {
    const current = localNode.data.stepPrompt?.transitionFunctionIds || [];
    updateStepPrompt({
      transitionFunctionIds: current.includes(functionId)
        ? current.filter((id) => id !== functionId)
        : [...current, functionId],
    });
  };

  const examples = localNode.data.fewShotExamples || [];

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-slate-600" />
          <div>
            <div className="text-sm font-semibold text-slate-800">{localNode.data.name || '未命名节点'}</div>
            <div className="text-[11px] text-slate-400">
              {getNodeTypeLabel(localNode.type)} / {localNode.data.stepType || (localNode.type === FlowNodeType.EXIT ? 'exit' : 'default')}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Node Type</div>
          <div className="mt-3 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${getNodeTypeBadge(localNode.type)}`} />
            <span className="text-sm font-medium text-slate-700">{getNodeTypeLabel(localNode.type)}</span>
          </div>
        </div>

        <Section title="Basic" subtitle="Core node metadata and step semantics." icon={<Settings size={16} />}>
          <div>
            <Label label="Node name" />
            <input
              type="text"
              value={localNode.data.name || ''}
              disabled={readOnly}
              onChange={(event) => updateNodeData({ name: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
              placeholder="Example: Collect customer phone"
            />
          </div>

          <div>
            <Label label="Description" />
            <textarea
              rows={3}
              value={localNode.data.description || ''}
              disabled={readOnly}
              onChange={(event) => updateNodeData({ description: event.target.value })}
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
              placeholder="What this node is responsible for."
            />
          </div>

          {localNode.type === FlowNodeType.DEFAULT ? (
            <div>
              <Label label="Step type" />
              <select
                value={localNode.data.stepType || 'default'}
                disabled={readOnly}
                onChange={(event) => updateNodeData({ stepType: event.target.value as FlowStepKind })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
              >
                {STEP_TYPE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </Section>

        {localNode.type !== FlowNodeType.START ? (
          <Section title="Step Prompt" subtitle="Prompt scoped to the current step only." icon={<FileText size={16} />}>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
              在提示词中输入 <code className="rounded bg-amber-100 px-1 font-mono">/工具名</code> 或{' '}
              <code className="rounded bg-amber-100 px-1 font-mono">/代码块名</code> 可直接引用能力，输入{' '}
              <code className="rounded bg-amber-100 px-1 font-mono">{'{{变量名}}'}</code> 可引用变量。
            </div>
            <PromptEditor
              value={localNode.data.stepPrompt?.prompt || ''}
              onChange={(prompt) => updateStepPrompt({ prompt })}
              variables={availableVariables.map((item) => ({ name: item.name, description: item.description }))}
              availableTools={availableTools}
              availableFunctions={allFunctions}
              height="h-32"
              enableFullscreen
              fullscreenTitle={`${localNode.data.name || '当前 Step'} · 提示词`}
              placeholder="Describe exactly what the assistant should do in this step."
            />
          </Section>
        ) : null}

        {localNode.type === FlowNodeType.DEFAULT ? (
          <Section title="工具引用 / 代码块引用" subtitle="在当前 step 里直接绑定和引用工具、可见代码块、过渡代码块。" icon={<Wrench size={16} />} defaultExpanded>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
              这里选中的工具和代码块，会同时出现在上方 `Step Prompt` 的 `/` 引用菜单中，点选后即可绑定，写提示词时可直接引用。
            </div>

            <TokenPicker
              title="工具"
              items={availableTools.map((item) => ({
                id: item.id,
                name: item.name,
                description: item.description,
              }))}
              selectedIds={localNode.data.toolIds || []}
              emptyText="No tools bound."
              accentClass="bg-slate-900"
              disabled={readOnly}
              onToggle={toggleTool}
            />

            <TokenPicker
              title="可见代码块"
              items={visibleFunctions.map((item) => ({
                id: item.id,
                name: item.name,
                description: item.description,
                isBuiltIn: item.isBuiltIn,
              }))}
              selectedIds={localNode.data.stepPrompt?.visibleFunctionIds || []}
              emptyText="No visible functions."
              accentClass="bg-sky-600"
              disabled={readOnly}
              onToggle={toggleVisibleFunction}
            />

            <TokenPicker
              title="过渡代码块"
              items={transitionFunctions.map((item) => ({
                id: item.id,
                name: item.name,
                description: item.description,
                isBuiltIn: item.isBuiltIn,
              }))}
              selectedIds={localNode.data.stepPrompt?.transitionFunctionIds || []}
              emptyText="No transition functions."
              accentClass="bg-emerald-600"
              disabled={readOnly}
              onToggle={toggleTransitionFunction}
            />
          </Section>
        ) : null}

        {localNode.type === FlowNodeType.DEFAULT ? (
          <Section title="Entity Collection" subtitle="Collect slots, entity types and ASR biasing." icon={<Target size={16} />} defaultExpanded={localNode.data.stepType === 'collect'}>
            <ToggleRow
              label="Enable entity collection"
              description="Turn this step into a structured collection step with required slot settings."
              checked={Boolean(localNode.data.entityConfig?.enabled)}
              disabled={readOnly}
              onChange={(checked) =>
                updateNodeData({
                  entityConfig: {
                    enabled: checked,
                    entityName: localNode.data.entityConfig?.entityName || '',
                    entityType: localNode.data.entityConfig?.entityType || 'text',
                    prompt: localNode.data.entityConfig?.prompt || '',
                    asrBiasing: localNode.data.entityConfig?.asrBiasing || 'default',
                    required: localNode.data.entityConfig?.required ?? true,
                  },
                })
              }
            />

            {localNode.data.entityConfig?.enabled ? (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label label="Entity name" />
                  <input
                    type="text"
                    value={localNode.data.entityConfig?.entityName || ''}
                    disabled={readOnly}
                    onChange={(event) =>
                      updateNodeData({
                        entityConfig: {
                          ...localNode.data.entityConfig,
                          enabled: true,
                          entityName: event.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
                    placeholder="phone_number"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label label="Entity type" />
                    <select
                      value={localNode.data.entityConfig?.entityType || 'text'}
                      disabled={readOnly}
                      onChange={(event) =>
                        updateNodeData({
                          entityConfig: {
                            ...localNode.data.entityConfig,
                            enabled: true,
                            entityType: event.target.value as FlowEntityType,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
                    >
                      {ENTITY_TYPE_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label label="ASR biasing" />
                    <select
                      value={localNode.data.entityConfig?.asrBiasing || 'default'}
                      disabled={readOnly}
                      onChange={(event) =>
                        updateNodeData({
                          entityConfig: {
                            ...localNode.data.entityConfig,
                            enabled: true,
                            asrBiasing: event.target.value as FlowAsrBiasing,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
                    >
                      {ASR_BIAS_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label label="Collection prompt" />
                  <textarea
                    rows={3}
                    value={localNode.data.entityConfig?.prompt || ''}
                    disabled={readOnly}
                    onChange={(event) =>
                      updateNodeData({
                        entityConfig: {
                          ...localNode.data.entityConfig,
                          enabled: true,
                          prompt: event.target.value,
                        },
                      })
                    }
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
                    placeholder="What should the bot say while collecting this entity?"
                  />
                </div>

                <ToggleRow
                  label="Required"
                  description="Require a valid value before allowing downstream transitions."
                  checked={localNode.data.entityConfig?.required ?? true}
                  disabled={readOnly}
                  onChange={(checked) =>
                    updateNodeData({
                      entityConfig: {
                        ...localNode.data.entityConfig,
                        enabled: true,
                        required: checked,
                      },
                    })
                  }
                />
              </div>
            ) : null}
          </Section>
        ) : null}

        {localNode.type === FlowNodeType.DEFAULT ? (
          <Section title="Retry Policy" subtitle="Handle no-input, no-match and fallback routing." icon={<Sparkles size={16} />} defaultExpanded={Boolean(localNode.data.retryConfig?.enabled)}>
            <ToggleRow
              label="Enable retry strategy"
              description="Prototype-level retry loop for no-input and no-match cases."
              checked={Boolean(localNode.data.retryConfig?.enabled)}
              disabled={readOnly}
              onChange={(checked) =>
                updateNodeData({
                  retryConfig: {
                    enabled: checked,
                    maxAttempts: localNode.data.retryConfig?.maxAttempts || 3,
                    noInputPrompt: localNode.data.retryConfig?.noInputPrompt || '',
                    noMatchPrompt: localNode.data.retryConfig?.noMatchPrompt || '',
                    fallbackTargetId: localNode.data.retryConfig?.fallbackTargetId || '',
                  },
                })
              }
            />

            {localNode.data.retryConfig?.enabled ? (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label label="Max attempts" />
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={localNode.data.retryConfig?.maxAttempts || 3}
                    disabled={readOnly}
                    onChange={(event) =>
                      updateNodeData({
                        retryConfig: {
                          ...localNode.data.retryConfig,
                          enabled: true,
                          maxAttempts: Number(event.target.value) || 1,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <Label label="No-input prompt" />
                  <textarea
                    rows={2}
                    value={localNode.data.retryConfig?.noInputPrompt || ''}
                    disabled={readOnly}
                    onChange={(event) =>
                      updateNodeData({
                        retryConfig: {
                          ...localNode.data.retryConfig,
                          enabled: true,
                          noInputPrompt: event.target.value,
                        },
                      })
                    }
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
                    placeholder="Prompt used when the user says nothing."
                  />
                </div>

                <div>
                  <Label label="No-match prompt" />
                  <textarea
                    rows={2}
                    value={localNode.data.retryConfig?.noMatchPrompt || ''}
                    disabled={readOnly}
                    onChange={(event) =>
                      updateNodeData({
                        retryConfig: {
                          ...localNode.data.retryConfig,
                          enabled: true,
                          noMatchPrompt: event.target.value,
                        },
                      })
                    }
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
                    placeholder="Prompt used when ASR or entity parsing fails."
                  />
                </div>

                <div>
                  <Label label="Fallback target id" />
                  <input
                    type="text"
                    value={localNode.data.retryConfig?.fallbackTargetId || ''}
                    disabled={readOnly}
                    onChange={(event) =>
                      updateNodeData({
                        retryConfig: {
                          ...localNode.data.retryConfig,
                          enabled: true,
                          fallbackTargetId: event.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
                    placeholder="verification_handoff"
                  />
                </div>
              </div>
            ) : null}
          </Section>
        ) : null}

        {localNode.type === FlowNodeType.DEFAULT ? (
          <Section title="Few-shot Examples" subtitle="Prototype examples for expected input/output shape." icon={<MessageSquareQuote size={16} />} defaultExpanded={false}>
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">Use short examples to demonstrate expected behavior.</div>
              <button
                type="button"
                disabled={readOnly}
                onClick={() =>
                  updateNodeData({
                    fewShotExamples: [...examples, { input: '', output: '' }],
                  })
                }
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add example
              </button>
            </div>

            <div className="space-y-3">
              {examples.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-400">
                  No few-shot examples yet.
                </div>
              ) : (
                examples.map((example, index) => (
                  <div key={`${localNode.id}_example_${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-xs font-medium text-slate-600">Example {index + 1}</div>
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() =>
                          updateNodeData({
                            fewShotExamples: examples.filter((_, exampleIndex) => exampleIndex !== index),
                          })
                        }
                        className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label label="Input" />
                        <textarea
                          rows={2}
                          value={example.input}
                          disabled={readOnly}
                          onChange={(event) =>
                            updateNodeData({
                              fewShotExamples: examples.map((item, exampleIndex) =>
                                exampleIndex === index ? { ...item, input: event.target.value } : item,
                              ),
                            })
                          }
                          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
                        />
                      </div>

                      <div>
                        <Label label="Expected output" />
                        <textarea
                          rows={2}
                          value={example.output}
                          disabled={readOnly}
                          onChange={(event) =>
                            updateNodeData({
                              fewShotExamples: examples.map((item, exampleIndex) =>
                                exampleIndex === index ? { ...item, output: event.target.value } : item,
                              ),
                            })
                          }
                          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Section>
        ) : null}

        {(localNode.type === FlowNodeType.DEFAULT || localNode.type === FlowNodeType.EXIT) ? (
          <Section title="Flow Navigation" subtitle="Route to another flow or configure exit behavior." icon={<Target size={16} />} defaultExpanded={localNode.type === FlowNodeType.EXIT}>
            {localNode.type === FlowNodeType.EXIT ? (
              <div>
                <Label label="Exit type" />
                <div className="space-y-2">
                  {EXIT_TYPE_OPTIONS.map((item) => {
                    const selected = (localNode.data.exitType || ExitNodeType.FINISH) === item.value;
                    return (
                      <label
                        key={item.value}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors ${
                          selected ? 'border-primary bg-sky-50' : 'border-slate-200 bg-white hover:border-slate-300'
                        } ${readOnly ? 'opacity-60' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`exit_type_${localNode.id}`}
                          checked={selected}
                          disabled={readOnly}
                          onChange={() => updateNodeData({ exitType: item.value })}
                          className="mt-1 h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                        />
                        <div>
                          <div className="text-sm font-medium text-slate-800">{item.label}</div>
                          <div className="mt-1 text-xs leading-5 text-slate-500">{item.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div>
              <Label label="Target flow id" />
              <input
                type="text"
                value={localNode.data.gotoFlowId || ''}
                disabled={readOnly}
                onChange={(event) => updateNodeData({ gotoFlowId: event.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
                placeholder="verification / lookup / handoff"
              />
              <div className="mt-1 text-[11px] text-slate-400">Use this to prototype entry flow, sub flow and exit routing.</div>
            </div>
          </Section>
        ) : null}
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>
            Bindings: {(localNode.data.toolIds || []).length} tools / {(localNode.data.stepPrompt?.visibleFunctionIds || []).length} visible / {(localNode.data.stepPrompt?.transitionFunctionIds || []).length} transition
          </span>
          {readOnly ? <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">read only</span> : null}
        </div>
      </div>
    </div>
  );
}

export type { FlowWorkbenchNodeConfigProps };
