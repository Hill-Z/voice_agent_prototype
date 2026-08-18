// 流程节点配置面板，按 PolyAI 理念简化：用提示词驱动，工具/代码块通过 / 引用。
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, FileText, LogOut, Settings, Sparkles, Target, X } from 'lucide-react';
import { AgentTool, BotVariable, BUILT_IN_FUNCTIONS, DelayProfile, ExitNodeType, FlowAsrBiasing, FlowEntityType, FlowFunction, FlowNode, FlowNodeType, StepExceptionPolicy } from '../../types';
import PromptEditor from '../ui/PromptEditor';
import SpeechListEditor from '../ui/SpeechListEditor';
import { Label } from '../ui/FormComponents';
import { getDelayProfileOptions } from '../../services/polyaiConfigHelpers';

interface FlowNodeConfigProps {
  node: FlowNode | null;
  availableFunctions?: FlowFunction[];
  availableVariables?: BotVariable[];
  availableTools?: AgentTool[];
  availableDelayProfiles?: DelayProfile[];
  availableFlows?: Array<{ id: string; name: string }>;
  availableNodes?: FlowNode[];
  onChange?: (node: FlowNode) => void;
  onClose?: () => void;
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

const ENTITY_TYPES: FlowEntityType[] = ['text', 'phone', 'number', 'datetime', 'address', 'email', 'alphanumeric'];
const ASR_TYPES: FlowAsrBiasing[] = ['default', 'alphanumeric', 'name', 'datetime', 'number', 'address'];
const IVR_OPTIONS = [
  { value: 'ivr_general_queue', label: '通用人工队列' },
  { value: 'ivr_expert', label: 'VIP 专属坐席' },
  { value: 'ivr_complaint', label: '投诉建议专线' },
];
const HANDOFF_OPTIONS = [
  { id: 'handoff_human_service', label: '人工客服队列' },
  { id: 'handoff_vip_service', label: 'VIP 专席' },
  { id: 'handoff_risk_service', label: '高风险专员' },
];


export default function FlowNodeConfig({
  node,
  availableFunctions = [],
  availableVariables = [],
  availableTools = [],
  availableDelayProfiles = [],
  availableFlows = [],
  availableNodes = [],
  onChange,
  onClose,
  readOnly = false,
}: FlowNodeConfigProps) {
  const [localNode, setLocalNode] = useState<FlowNode | null>(node);
  useEffect(() => setLocalNode(node), [node]);

  const allFunctions = useMemo(() => {
    const builtInIds = new Set(BUILT_IN_FUNCTIONS.map((item) => item.id));
    return [...BUILT_IN_FUNCTIONS, ...availableFunctions.filter((item) => !builtInIds.has(item.id))];
  }, [availableFunctions]);
  const codeBlocks = useMemo(() => availableFunctions.filter((item) => !item.isBuiltIn), [availableFunctions]);
  const delayProfiles = useMemo(() => getDelayProfileOptions(availableDelayProfiles), [availableDelayProfiles]);

  if (!localNode) {
    return <div className="flex h-full items-center justify-center p-8 text-sm text-slate-400">请选择一个节点</div>;
  }

  const isStepNode = localNode.type === FlowNodeType.DEFAULT;
  const isExitNode = localNode.type === FlowNodeType.EXIT;
  const hasEntityCollection = Boolean(localNode.data.entityConfig?.enabled);
  const selectedPrimaryFunction = localNode.data.primaryFunctionId
    ? allFunctions.find((item) => item.id === localNode.data.primaryFunctionId)
    : null;
  const entityInputMode = localNode.data.entityConfig?.inputMode || 'speech';
  const exceptionPolicy: StepExceptionPolicy = {
    mode: 'inherit',
    ...(localNode.data.exceptionPolicy || {}),
  };
  const exceptionFallbackAction = exceptionPolicy.fallbackAction || 'transfer';

  const updateNode = (nextNode: FlowNode) => {
    setLocalNode(nextNode);
    onChange?.(nextNode);
  };

  const updateNodeData = (updates: Partial<FlowNode['data']>) => {
    if (readOnly) return;
    updateNode({ ...localNode, data: { ...localNode.data, ...updates } });
  };

  const updateStepPrompt = (updates: Partial<NonNullable<FlowNode['data']['stepPrompt']>>) => {
    updateNodeData({
      stepPrompt: {
        ...localNode.data.stepPrompt,
        prompt: localNode.data.stepPrompt?.prompt || '',
        visibleFunctionIds: localNode.data.stepPrompt?.visibleFunctionIds || [],
        transitionFunctionIds: localNode.data.stepPrompt?.transitionFunctionIds || [],
        codeBlockIds: localNode.data.stepPrompt?.codeBlockIds || [],
        ...updates,
      },
    });
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-slate-800">{localNode.data.name || '未命名节点'}</div>
          <div className="text-[11px] text-slate-400">{localNode.id}</div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"><X size={16} /></button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* 基础信息 */}
        {isStepNode ? (
          <Section title="步骤设置" icon={<Settings size={16} />}>
            <div>
              <Label label="步骤名称" />
              <input value={localNode.data.name || ''} disabled={readOnly} onChange={(e) => updateNodeData({ name: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100" />
            </div>
            <div>
              <Label label="步骤备注" />
              <textarea rows={2} value={localNode.data.description || ''} disabled={readOnly} onChange={(e) => updateNodeData({ description: e.target.value })} className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100" placeholder="选填，例如：这里负责确认订单号并决定是否继续。" />
            </div>
          </Section>
        ) : (
          <Section title="基础信息" icon={<Settings size={16} />}>
            <div>
              <Label label="节点名称" />
              <input value={localNode.data.name || ''} disabled={readOnly} onChange={(e) => updateNodeData({ name: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100" />
            </div>
            <div>
              <Label label="节点描述" />
              <textarea rows={3} value={localNode.data.description || ''} disabled={readOnly} onChange={(e) => updateNodeData({ description: e.target.value })} className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100" />
            </div>
          </Section>
        )}

        {/* 提示词 - 核心配置，所有节点（除开始节点）都有 */}
        {localNode.type !== FlowNodeType.START ? (
          <Section title="提示词" icon={<FileText size={16} />}>
            <PromptEditor
              value={localNode.data.stepPrompt?.prompt || ''}
              onChange={(prompt) => updateStepPrompt({ prompt })}
              variables={availableVariables.map((item) => ({ name: item.name, description: item.description }))}
              availableTools={availableTools}
              availableFunctions={codeBlocks}
              availableFlows={availableFlows}
              height="h-32"
              enableFullscreen
              fullscreenTitle={`${localNode.data.name || '当前 Step'} · 提示词`}
              placeholder="描述这个步骤要完成的对话目标。使用 / 引用工具、代码块或流程。"
            />
          </Section>
        ) : null}

        {localNode.type !== FlowNodeType.START ? (
          <Section
            title="转人工与挂机判断"
            icon={<Sparkles size={16} />}
          >
            <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-xs leading-5 text-sky-700">
              以下配置仅对当前 Step 生效。
            </div>

            <div>
              <Label label="转人工判断提示词" tooltip="描述当前 Step 在什么情况下需要转人工。" />
              <textarea
                rows={4}
                value={localNode.data.stepPrompt?.transferDecisionPrompt || ''}
                disabled={readOnly}
                onChange={(event) => updateStepPrompt({ transferDecisionPrompt: event.target.value })}
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
                placeholder="选填，例如：用户明确要求人工，或当前问题无法继续自动处理时转人工。"
              />
            </div>

            <div>
              <Label label="目标 IVR" tooltip="当前 Step 判断需要转人工后进入的 IVR。" />
              <select
                value={localNode.data.stepPrompt?.transferIvrTarget || ''}
                disabled={readOnly}
                onChange={(event) => updateStepPrompt({ transferIvrTarget: event.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
              >
                <option value="">请选择目标 IVR</option>
                {IVR_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label label="挂机判断提示词" tooltip="描述当前 Step 在什么情况下可以结束通话。" />
              <textarea
                rows={4}
                value={localNode.data.stepPrompt?.hangupDecisionPrompt || ''}
                disabled={readOnly}
                onChange={(event) => updateStepPrompt({ hangupDecisionPrompt: event.target.value })}
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
                placeholder="选填，例如：用户明确表示没有其他问题或要求结束通话时允许挂机。"
              />
            </div>

            <SpeechListEditor
              label="转人工话术"
              value={localNode.data.stepPrompt?.transferSpeeches}
              disabled={readOnly}
              onChange={(transferSpeeches) => updateStepPrompt({ transferSpeeches })}
              placeholder="例如：好的，我帮您转接人工客服。"
            />

            <SpeechListEditor
              label="挂机话术"
              value={localNode.data.stepPrompt?.hangupSpeeches}
              disabled={readOnly}
              onChange={(hangupSpeeches) => updateStepPrompt({ hangupSpeeches })}
              placeholder="例如：感谢您的来电，祝您生活愉快，再见。"
            />
          </Section>
        ) : null}

        {isStepNode ? (
          <Section title="异常处理" icon={<Sparkles size={16} />} defaultExpanded={exceptionPolicy.mode === 'override'}>
            <div>
              <Label label="处理策略" />
              <select
                value={exceptionPolicy.mode}
                disabled={readOnly}
                onChange={(event) => updateNodeData({
                  exceptionPolicy: {
                    ...exceptionPolicy,
                    mode: event.target.value as StepExceptionPolicy['mode'],
                  },
                })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
              >
                <option value="inherit">跟随全局策略</option>
                <option value="override">当前 Step 单独处理</option>
              </select>
            </div>

            {exceptionPolicy.mode === 'override' ? (
              <>
                <div>
                  <Label label="异常动作" />
                  <select
                    value={exceptionFallbackAction}
                    disabled={readOnly}
                    onChange={(event) => updateNodeData({
                      exceptionPolicy: {
                        ...exceptionPolicy,
                        mode: 'override',
                        fallbackAction: event.target.value as StepExceptionPolicy['fallbackAction'],
                      },
                    })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
                  >
                    <option value="continue">继续当前流程</option>
                    <option value="goto_node">跳转到指定 Step</option>
                    <option value="transfer">转人工</option>
                    <option value="hangup">挂机</option>
                  </select>
                </div>

                {exceptionFallbackAction === 'goto_node' ? (
                  <div>
                    <Label label="异常目标 Step" />
                    <select
                      value={exceptionPolicy.fallbackTargetId || ''}
                      disabled={readOnly}
                      onChange={(event) => updateNodeData({ exceptionPolicy: { ...exceptionPolicy, mode: 'override', fallbackTargetId: event.target.value } })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
                    >
                      <option value="">请选择目标 Step</option>
                      {availableNodes.filter((item) => item.id !== localNode.id && item.type === FlowNodeType.DEFAULT).map((item) => (
                        <option key={item.id} value={item.id}>{item.data.name || item.id}</option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {exceptionFallbackAction === 'transfer' ? (
                  <div>
                    <Label label="目标 IVR" />
                    <select
                      value={exceptionPolicy.fallbackIvrTarget || ''}
                      disabled={readOnly}
                      onChange={(event) => updateNodeData({ exceptionPolicy: { ...exceptionPolicy, mode: 'override', fallbackIvrTarget: event.target.value } })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
                    >
                      <option value="">请选择目标 IVR</option>
                      {IVR_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                ) : null}

                <SpeechListEditor
                  label="异常话术"
                  value={exceptionPolicy.fallbackSpeeches}
                  disabled={readOnly}
                  onChange={(fallbackSpeeches) => updateNodeData({ exceptionPolicy: { ...exceptionPolicy, mode: 'override', fallbackSpeeches } })}
                  placeholder="例如：当前步骤暂时无法继续，我帮您转接人工。"
                />
              </>
            ) : null}
          </Section>
        ) : null}

        {/* 实体采集 - 仅步骤节点，默认折叠 */}
        {isStepNode ? (
          <Section title="实体采集" icon={<Target size={16} />} defaultExpanded={hasEntityCollection}>
            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3">
              <div>
                <div className="text-sm font-medium text-slate-800">启用实体采集</div>
                <div className="mt-1 text-xs text-slate-500">从已配置的变量/实体中选择，自动应用对应类型和校验规则。</div>
              </div>
              <input type="checkbox" checked={hasEntityCollection} disabled={readOnly} onChange={(e) => updateNodeData({ stepType: e.target.checked ? 'collect' : (selectedPrimaryFunction ? 'function' : 'default'), entityConfig: { enabled: e.target.checked, entityName: localNode.data.entityConfig?.entityName || '', entityType: localNode.data.entityConfig?.entityType || 'text', prompt: localNode.data.entityConfig?.prompt || '', asrBiasing: localNode.data.entityConfig?.asrBiasing || 'default', required: localNode.data.entityConfig?.required ?? true, inputMode: localNode.data.entityConfig?.inputMode || 'speech', dtmfMaxDigits: localNode.data.entityConfig?.dtmfMaxDigits || 6, dtmfTerminator: localNode.data.entityConfig?.dtmfTerminator || '#', dtmfFirstDigitTimeoutMs: localNode.data.entityConfig?.dtmfFirstDigitTimeoutMs || 5000, dtmfInterDigitTimeoutMs: localNode.data.entityConfig?.dtmfInterDigitTimeoutMs || 2500, collectWhileSpeaking: localNode.data.entityConfig?.collectWhileSpeaking ?? false, containsPii: localNode.data.entityConfig?.containsPii ?? false, validationPattern: localNode.data.entityConfig?.validationPattern || '', options: localNode.data.entityConfig?.options || [] } })} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
            </label>

            {hasEntityCollection ? (
              <>
                <div>
                  <Label label="选择变量/实体" />
                  <select 
                    value={localNode.data.entityConfig?.entityName || ''} 
                    disabled={readOnly} 
                    onChange={(e) => {
                      const selectedVar = availableVariables.find(v => v.name === e.target.value);
                      updateNodeData({ 
                        entityConfig: { 
                          ...localNode.data.entityConfig, 
                          enabled: true, 
                          entityName: e.target.value,
                          entityType: selectedVar?.type?.toLowerCase() || 'text',
                        } 
                      });
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
                  >
                    <option value="">请选择...</option>
                    {availableVariables.map((v) => (
                      <option key={v.id} value={v.name}>{v.name} ({v.type}{v.description ? ` - ${v.description}` : ''})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">从「变量配置」中已定义的变量中选择，自动应用其类型</p>
                </div>
                
                {localNode.data.entityConfig?.entityName && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-xs text-slate-500">
                      <span className="font-medium">已选变量：</span>{localNode.data.entityConfig?.entityName}
                      <span className="mx-2">|</span>
                      <span className="font-medium">类型：</span>{localNode.data.entityConfig?.entityType || 'text'}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </Section>
        ) : null}

        {/* 高级设置 - 默认折叠，仅保留 DTMF */}
        {isStepNode ? (
          <Section title="高级设置" icon={<Sparkles size={16} />} defaultExpanded={false}>
            {hasEntityCollection ? (
              <div className="space-y-4">
                <div className="mb-3 text-xs font-medium text-slate-600">DTMF 按键设置</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label label="输入模式" /><select value={entityInputMode} disabled={readOnly} onChange={(e) => updateNodeData({ entityConfig: { ...localNode.data.entityConfig, enabled: true, inputMode: e.target.value as 'speech' | 'dtmf' | 'speech_or_dtmf' } })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"><option value="speech">仅语音</option><option value="dtmf">仅按键</option><option value="speech_or_dtmf">语音 + 按键</option></select></div>
                  <div><Label label="DTMF 位数" /><input type="number" min={1} max={20} value={localNode.data.entityConfig?.dtmfMaxDigits || 6} disabled={readOnly} onChange={(e) => updateNodeData({ entityConfig: { ...localNode.data.entityConfig, enabled: true, dtmfMaxDigits: Number(e.target.value) || 1 } })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label label="结束键" /><select value={localNode.data.entityConfig?.dtmfTerminator || '#'} disabled={readOnly} onChange={(e) => updateNodeData({ entityConfig: { ...localNode.data.entityConfig, enabled: true, dtmfTerminator: e.target.value as '#' | '*' } })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"><option value="#">#</option><option value="*">*</option></select></div>
                  <div><Label label="首位超时 (ms)" /><input type="number" min={0} value={localNode.data.entityConfig?.dtmfFirstDigitTimeoutMs || 5000} disabled={readOnly} onChange={(e) => updateNodeData({ entityConfig: { ...localNode.data.entityConfig, enabled: true, dtmfFirstDigitTimeoutMs: Number(e.target.value) || 0 } })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100" /></div>
                </div>
                <div><Label label="位间超时 (ms)" /><input type="number" min={0} value={localNode.data.entityConfig?.dtmfInterDigitTimeoutMs || 2500} disabled={readOnly} onChange={(e) => updateNodeData({ entityConfig: { ...localNode.data.entityConfig, enabled: true, dtmfInterDigitTimeoutMs: Number(e.target.value) || 0 } })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100" /></div>
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-600"><input type="checkbox" checked={localNode.data.entityConfig?.collectWhileSpeaking ?? false} disabled={readOnly} onChange={(e) => updateNodeData({ entityConfig: { ...localNode.data.entityConfig, enabled: true, collectWhileSpeaking: e.target.checked } })} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />播报时采集按键</label>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-400">
                请先启用「实体采集」，再配置 DTMF 设置
              </div>
            )}

            {/* 函数参数 - 仅当选择主函数时显示 */}
            {selectedPrimaryFunction ? (
              <div className="border-t border-dashed border-slate-200 pt-4 mt-4">
                <div className="mb-3 text-xs font-medium text-slate-600">函数参数</div>
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {selectedPrimaryFunction.parameters.map((param) => (
                    <div key={param.name} className="flex items-center gap-2">
                      <span className="w-24 text-xs text-slate-600">{param.name}</span>
                      <select
                        value={(localNode.data.functionArgsMapping || []).find((mapping) => mapping.argName === param.name)?.sourceType || 'variable'}
                        disabled={readOnly}
                        onChange={(e) => {
                          const current = localNode.data.functionArgsMapping || [];
                          const existing = current.find((mapping) => mapping.argName === param.name);
                          const updated = existing
                            ? current.map((mapping) => mapping.argName === param.name ? { ...mapping, sourceType: e.target.value as 'variable' | 'state' | 'constant' | 'entity' } : mapping)
                            : [...current, { argName: param.name, sourceType: e.target.value as 'variable' | 'state' | 'constant' | 'entity', sourceKey: '' }];
                          updateNodeData({ functionArgsMapping: updated });
                        }}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                      >
                        <option value="variable">变量</option>
                        <option value="state">状态</option>
                        <option value="constant">常量</option>
                        <option value="entity">实体</option>
                      </select>
                      <input
                        type="text"
                        value={(localNode.data.functionArgsMapping || []).find((mapping) => mapping.argName === param.name)?.sourceKey || ''}
                        disabled={readOnly}
                        onChange={(e) => {
                          const current = localNode.data.functionArgsMapping || [];
                          const existing = current.find((mapping) => mapping.argName === param.name);
                          const updated = existing
                            ? current.map((mapping) => mapping.argName === param.name ? { ...mapping, sourceKey: e.target.value } : mapping)
                            : [...current, { argName: param.name, sourceType: 'variable', sourceKey: e.target.value }];
                          updateNodeData({ functionArgsMapping: updated });
                        }}
                        className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}


          </Section>
        ) : null}

        {/* 退出行为 - 仅退出节点 */}
        {isExitNode ? (
          <Section title="退出行为" icon={<LogOut size={16} />}>
            <div className="space-y-2">
              {[ExitNodeType.FINISH, ExitNodeType.HANDOFF, ExitNodeType.STOP].map((item) => {
                const selected = (localNode.data.exitType || ExitNodeType.FINISH) === item;
                return <label key={item} className={`flex items-start gap-3 rounded-xl border px-3 py-3 ${selected ? 'border-primary bg-sky-50' : 'border-slate-200 bg-white'}`}><input type="radio" name={`exit_${localNode.id}`} checked={selected} disabled={readOnly} onChange={() => updateNodeData({ exitType: item })} className="mt-1 h-4 w-4 border-slate-300 text-primary focus:ring-primary" /><div className="text-sm font-medium text-slate-800">{item === ExitNodeType.FINISH ? '正常结束' : item === ExitNodeType.HANDOFF ? '转人工' : '立即停止'}</div></label>;
              })}
            </div>
            {(localNode.data.exitType || ExitNodeType.FINISH) === ExitNodeType.HANDOFF ? (
              <div className="space-y-3">
                <div><Label label="转人工目标" /><select value={localNode.data.handoffTargetId || ''} disabled={readOnly} onChange={(e) => updateNodeData({ handoffTargetId: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"><option value="">未指定</option>{HANDOFF_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
                <div><Label label="转接原因" /><textarea rows={2} value={localNode.data.handoffReason || ''} disabled={readOnly} onChange={(e) => updateNodeData({ handoffReason: e.target.value })} className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100" /></div>
              </div>
            ) : null}
          </Section>
        ) : null}
      </div>
    </div>
  );
}

export type { FlowNodeConfigProps };
