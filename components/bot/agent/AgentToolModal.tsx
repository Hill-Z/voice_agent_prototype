
import React, { useState } from 'react';
import { X, Plug, Plus, Trash2, HelpCircle, MessageSquare, Music, ShieldCheck } from 'lucide-react';
import { AgentTool, ExtractionConfig, AgentToolParameter, BotVariable, PricingRule, ToolExecutionRule, ToolSoundEffectConfig } from '../../../types';
import { Input, Select, Switch, Label } from '../../ui/FormComponents';

interface AgentToolModalProps {
  tool?: AgentTool;
  onSave: (tool: AgentTool) => void;
  onClose: () => void;
  extractionConfigs: ExtractionConfig[];
  pricingRules?: PricingRule[];
  availableVariables?: BotVariable[];
}

const DEFAULT_TOOL: AgentTool = {
  id: '',
  name: '',
  description: '',
  type: 'API',
  parameters: [],
  executionStrategy: {
    playFiller: true,
    fillerType: 'TTS',
    fillerContent: '正在为您查询，请稍候...',
    soundEffect: {
      enabled: false,
      stopOnTtsStart: true,
    }
  },
  responseInstruction: '',
  startSpeech: '正在为您查询，请稍候...',
  needReturn: true,
  directPlayOnReturn: false,
  directReturnSpeech: '查询已完成，请您注意查收。',
  successSpeech: '查询已完成，结果如下：',
  failureSpeech: '抱歉，查询遇到了问题，请稍后再试或联系人工客服。',
  interruptSpeech: '正在处理中，请稍候，处理完成后我会为您解答。',
  duplicateCallPolicy: 'reuse_result',
  interruptionPolicy: 'cancel',
  pauseSilenceTimer: true,
  firstProgressFeedbackSeconds: 3,
  progressFeedbackIntervalSeconds: 8,
  maxExecutionSeconds: 30,
  progressSpeeches: ['正在为您查询，请稍候。'],
  executionLevel: 'auto',
  executionRules: [],
  confirmationSpeeches: ['请确认是否执行本次操作？'],
  humanApprovalQueueId: '',
  humanApprovalIvrTarget: '',
  humanApprovalTimeoutSeconds: 30,
  approvalTimeoutAction: 'transfer',
};

const TOOL_CATEGORY_BY_TYPE: Record<AgentTool['type'], NonNullable<AgentTool['category']>> = {
  API: 'api_call',
  RAG: 'knowledge',
  PRICING: 'pricing',
  QUOTE: 'pricing',
  CART_PRICING: 'pricing',
  SMS: 'communication',
  TRANSFER: 'transfer',
  EMAIL: 'communication',
  CUSTOM: 'other',
};

const normalizePricingTool = (tool?: AgentTool): AgentTool => {
  if (!tool || (tool.type !== 'QUOTE' && tool.type !== 'CART_PRICING')) {
    return tool || { ...DEFAULT_TOOL, id: Date.now().toString() };
  }

  const isQuote = tool.type === 'QUOTE';
  return {
    ...tool,
    type: 'PRICING',
    pricingConfig: {
      mode: isQuote ? 'quote' : 'cart',
      dataSource: (isQuote ? tool.quoteConfig?.dataSource : tool.cartPricingConfig?.dataSource) === 'api' ? 'api' : 'rule',
      pricingRuleId: isQuote ? tool.quoteConfig?.pricingRuleId : tool.cartPricingConfig?.pricingRuleId,
      externalInterfaceId: isQuote ? tool.quoteConfig?.externalInterfaceId : tool.cartPricingConfig?.externalInterfaceId,
      storeVariableId: tool.cartPricingConfig?.storeVariableId,
      resultSpeechMode: tool.cartPricingConfig?.resultSpeechMode,
    },
  };
};

const DEFAULT_SOUND_EFFECT_CONFIG: ToolSoundEffectConfig = {
  enabled: false,
  stopOnTtsStart: true,
};

const TOOL_SOUND_EFFECT_OPTIONS = [
  { id: 'bgm_keyboard_typing', name: '键盘敲击声', fileName: 'typing_sound_effect.wav', url: 'mock_bgm_2.wav' },
  { id: 'bgm_light_happy', name: '轻快背景音', fileName: 'bgm_happy.mp3', url: 'mock_bgm_1.mp3' },
];

const VARIABLE_TYPE_LABELS: Record<BotVariable['type'], string> = {
  TEXT: '文本',
  NUMBER: '数字',
  DATE: '日期',
  DATETIME: '日期时间',
  TIME: '时间',
  BOOLEAN: '布尔值',
};

const EXECUTION_LEVEL_OPTIONS = [
  { value: 'auto', label: '自动执行' },
  { value: 'user_confirm', label: '用户确认后执行' },
  { value: 'human_approval', label: '人工审批后执行' },
  { value: 'human_only', label: '仅转人工处理' },
] as const;

const RULE_OPERATOR_OPTIONS = [
  { value: 'lt', label: '小于' },
  { value: 'lte', label: '小于等于' },
  { value: 'eq', label: '等于' },
  { value: 'gte', label: '大于等于' },
  { value: 'gt', label: '大于' },
] as const;

const mapVariableTypeToParameterType = (type: BotVariable['type']) => {
  if (type === 'NUMBER') return 'number';
  if (type === 'BOOLEAN') return 'boolean';
  return 'string';
};

export default function AgentToolModal({ tool, onSave, onClose, extractionConfigs, pricingRules = [], availableVariables = [] }: AgentToolModalProps) {
  const [formData, setFormData] = useState<AgentTool>(() => normalizePricingTool(tool));
  const isBuiltInPricing = formData.type === 'PRICING';
  const soundEffectConfig: ToolSoundEffectConfig = {
    ...DEFAULT_SOUND_EFFECT_CONFIG,
    ...(formData.executionStrategy?.soundEffect || {}),
  };

  const updateSoundEffectConfig = (updates: Partial<ToolSoundEffectConfig>) => {
    setFormData(prev => ({
      ...prev,
      executionStrategy: {
        playFiller: prev.executionStrategy?.playFiller ?? true,
        fillerType: prev.executionStrategy?.fillerType ?? 'TTS',
        fillerContent: prev.executionStrategy?.fillerContent ?? '正在为您查询，请稍候...',
        backgroundMusicId: prev.executionStrategy?.backgroundMusicId,
        soundEffect: {
          ...DEFAULT_SOUND_EFFECT_CONFIG,
          ...(prev.executionStrategy?.soundEffect || {}),
          ...updates,
        },
      },
    }));
  };

  const handleSoundEffectSelect = (audioId: string) => {
    const selectedAudio = TOOL_SOUND_EFFECT_OPTIONS.find(item => item.id === audioId);
    updateSoundEffectConfig({
      audioId,
      audioName: selectedAudio?.name,
      audioUrl: selectedAudio?.url,
    });
  };

  const addParameter = () => {
    setFormData(prev => ({
      ...prev,
      parameters: [...prev.parameters, { name: '', type: 'string', description: '', required: true, source: 'llm' }]
    }));
  };

  const updateParameter = (index: number, updates: Partial<AgentToolParameter>) => {
    const newParams = [...formData.parameters];
    newParams[index] = { ...newParams[index], ...updates };
    setFormData(prev => ({ ...prev, parameters: newParams }));
  };

  const removeParameter = (index: number) => {
    setFormData(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index)
    }));
  };

  const updateParameterSource = (index: number, source: AgentToolParameter['source']) => {
    if (source === 'variable') {
      const firstVariable = availableVariables[0];
      updateParameter(index, firstVariable ? {
        source: 'variable',
        variableId: firstVariable.id,
        variableName: firstVariable.name,
        variableType: firstVariable.type,
        name: firstVariable.name,
        type: mapVariableTypeToParameterType(firstVariable.type),
        description: firstVariable.description || '',
      } : {
        source: 'variable',
        variableId: '',
        variableName: '',
        variableType: undefined,
        name: '',
        type: 'string',
        description: '',
      });
      return;
    }

    updateParameter(index, {
      source: 'llm',
      variableId: undefined,
      variableName: undefined,
      variableType: undefined,
      name: '',
      type: 'string',
      description: '',
    });
  };

  const updateReferencedVariable = (index: number, variableId: string) => {
    const variable = availableVariables.find((item) => item.id === variableId);
    if (!variable) {
      updateParameter(index, {
        variableId: '',
        variableName: '',
        variableType: undefined,
        name: '',
        type: 'string',
        description: '',
      });
      return;
    }

    updateParameter(index, {
      source: 'variable',
      variableId: variable.id,
      variableName: variable.name,
      variableType: variable.type,
      name: variable.name,
      type: mapVariableTypeToParameterType(variable.type),
      description: variable.description || '',
    });
  };

  const handleSubmit = () => {
    if (!formData.name) return alert("请输入工具/函数名称");
    if (isBuiltInPricing && !formData.displayName?.trim()) return alert("请输入工具显示名称");
    if (!formData.description) return alert("请输入工具描述，这对于LLM识别至关重要");
    if (formData.parameters.some((parameter) => parameter.source === 'variable' && !parameter.variableId)) {
      return alert("请选择参数引用的变量");
    }
    onSave(formData);
  };

  const addExecutionRule = () => {
    const nextRule: ToolExecutionRule = {
      id: `rule_${Date.now()}`,
      parameterName: formData.parameters[0]?.name || '',
      operator: 'lte',
      compareValue: '',
      action: 'user_confirm',
    };
    setFormData((current) => ({
      ...current,
      executionRules: [...(current.executionRules || []), nextRule],
    }));
  };

  const updateExecutionRule = (ruleId: string, updates: Partial<ToolExecutionRule>) => {
    setFormData((current) => ({
      ...current,
      executionRules: (current.executionRules || []).map((rule) => (
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )),
    }));
  };

  const removeExecutionRule = (ruleId: string) => {
    setFormData((current) => ({
      ...current,
      executionRules: (current.executionRules || []).filter((rule) => rule.id !== ruleId),
    }));
  };

  const handleTypeChange = (type: AgentTool['type']) => {
    setFormData((current) => ({
      ...current,
      type,
      category: TOOL_CATEGORY_BY_TYPE[type],
      name: type === 'PRICING' && current.type !== 'PRICING' ? 'calculate_price' : current.name,
      displayName: type === 'PRICING' && current.type !== 'PRICING' ? '智能计价' : current.displayName,
      description: type === 'PRICING' && current.type !== 'PRICING'
        ? '根据商品或服务、规格、数量和适用条件匹配价格并完成确定性计算。'
        : current.description,
      refId: type === 'RAG' ? undefined : current.refId,
      ragConfig: type === 'RAG'
        ? current.ragConfig || { knowledgeBaseId: '', topK: 3, similarityThreshold: 0.7 }
        : current.ragConfig,
      pricingConfig: type === 'PRICING'
        ? current.pricingConfig || {
          mode: 'quote',
          dataSource: 'rule',
          pricingRuleId: pricingRules.find((rule) => rule.status === 'published')?.id,
          resultSpeechMode: 'change_and_total',
        }
        : current.pricingConfig,
      executionLevel: type === 'PRICING' ? 'auto' : current.executionLevel,
      needReturn: type === 'PRICING' ? true : current.needReturn,
      directPlayOnReturn: type === 'PRICING' ? true : current.directPlayOnReturn,
    }));
  };

  const executionLevels = [
    formData.executionLevel || 'auto',
    ...(formData.executionRules || []).map((rule) => rule.action),
  ];
  const needsUserConfirmation = executionLevels.includes('user_confirm');
  const needsHumanHandling = executionLevels.includes('human_approval') || executionLevels.includes('human_only');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-base font-bold text-slate-800 flex items-center">
            <Plug size={18} className="mr-2 text-primary" />
            {tool ? '编辑智能体工具' : '添加智能体工具'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* 1. Basic Info */}
          <section>
            <div className="mb-4">
               <Label label="工具类型" required />
               <select
                 className="w-full px-3 py-2 text-sm border border-gray-200 rounded bg-white outline-none focus:border-primary"
                 value={formData.type}
                 onChange={(event) => handleTypeChange(event.target.value as AgentTool['type'])}
               >
                 <option value="API">API</option>
                 <option value="RAG">RAG</option>
                 <option value="PRICING">智能计价</option>
                 <option value="SMS">短信</option>
                 <option value="TRANSFER">转接</option>
                 <option value="EMAIL">邮件</option>
                 <option value="CUSTOM">自定义</option>
               </select>
            </div>

            {isBuiltInPricing ? (
              <>
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <Input
                    label="工具显示名称"
                    required
                    value={formData.displayName || ''}
                    onChange={(event) => setFormData({ ...formData, displayName: event.target.value })}
                  />
                  <Input label="函数名称" required className="font-mono text-xs" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} />
                </div>
                <Select
                  label="使用方式"
                  required
                  options={[
                    { label: '单次报价', value: 'quote' },
                    { label: '连续计价', value: 'cart' },
                    { label: '同时支持', value: 'both' },
                  ]}
                  value={formData.pricingConfig?.mode || 'quote'}
                  onChange={(event) => setFormData({
                    ...formData,
                    pricingConfig: {
                      ...(formData.pricingConfig || { dataSource: 'rule' }),
                      mode: event.target.value as NonNullable<AgentTool['pricingConfig']>['mode'],
                    },
                  })}
                />
              </>
            ) : (
              <div className="mb-4">
                <Label label="工具名称" required tooltip="LLM 将使用此名称调用工具，建议使用蛇形命名法 (e.g. query_order)" />
                <Input
                  className="font-mono text-xs"
                  placeholder="e.g. query_order_status"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            )}

            <div className="mb-4">
               <Label label="工具描述" required tooltip="非常重要！告诉大模型在什么场景下应该使用此工具。" />
               <textarea 
                  placeholder="例如：当用户询问发货状态、物流进度或订单详情时使用此工具。需要提供订单号。"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full h-20 px-3 py-2 text-sm border border-slate-300 rounded focus:border-primary outline-none resize-none"
               />
            </div>

            {/* 接口选择 */}
            {formData.type !== 'RAG' && !isBuiltInPricing && <div className="mb-4">
               <Label label="关联接口" tooltip="选择已配置好的接口方案，工具将调用此接口执行。" />
               <select 
                 className="w-full px-3 py-2 text-sm border border-gray-200 rounded bg-white outline-none focus:border-primary"
                 value={formData.refId || ''}
                 onChange={(e) => setFormData({...formData, refId: e.target.value})}
               >
                 <option value="">不关联接口（仅作为模型能力）</option>
                 {extractionConfigs.map(config => (
                   <option key={config.id} value={config.id}>{config.name} - {config.description}</option>
                 ))}
               </select>
               {formData.refId && (
                 <p className="text-[10px] text-slate-400 mt-1">
                   已关联接口：{extractionConfigs.find(c => c.id === formData.refId)?.description || '暂无描述'}
                 </p>
               )}
            </div>}

            {formData.type === 'RAG' && (
              <div className="mb-4 grid grid-cols-2 gap-4 rounded border border-slate-200 bg-slate-50 p-4">
                <div className="col-span-2">
                  <Label label="知识库 ID" required />
                  <Input
                    value={formData.ragConfig?.knowledgeBaseId || ''}
                    onChange={(event) => setFormData({
                      ...formData,
                      ragConfig: {
                        knowledgeBaseId: event.target.value,
                        topK: formData.ragConfig?.topK ?? 3,
                        similarityThreshold: formData.ragConfig?.similarityThreshold ?? 0.7,
                      },
                    })}
                  />
                </div>
                <div>
                  <Label label="Top-K" required />
                  <Input
                    type="number"
                    min={1}
                    value={formData.ragConfig?.topK ?? 3}
                    onChange={(event) => setFormData({
                      ...formData,
                      ragConfig: {
                        knowledgeBaseId: formData.ragConfig?.knowledgeBaseId || '',
                        topK: Number(event.target.value),
                        similarityThreshold: formData.ragConfig?.similarityThreshold ?? 0.7,
                      },
                    })}
                  />
                </div>
                <div>
                  <Label label="相似度阈值" required />
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    value={formData.ragConfig?.similarityThreshold ?? 0.7}
                    onChange={(event) => setFormData({
                      ...formData,
                      ragConfig: {
                        knowledgeBaseId: formData.ragConfig?.knowledgeBaseId || '',
                        topK: formData.ragConfig?.topK ?? 3,
                        similarityThreshold: Number(event.target.value),
                      },
                    })}
                  />
                </div>
              </div>
            )}

            {/* 模型使用指南 */}
            <div className="mb-4">
               <Label label="模型使用指南" tooltip="详细说明工具的使用方法、注意事项、示例等，帮助模型更好地理解和使用此工具。" />
               <textarea 
                  className="w-full h-24 px-3 py-2 text-sm border border-slate-300 rounded focus:border-primary outline-none resize-none bg-blue-50/20"
                  placeholder="例如：&#10;1. 此工具需要在获取到订单号后才能调用&#10;2. 如果用户没有提供订单号，请先询问用户&#10;3. 返回结果包含 order_status 字段，值为：pending/shipped/delivered"
                  value={formData.modelReadme || ''}
                  onChange={(e) => setFormData({...formData, modelReadme: e.target.value})}
               />
            </div>
          </section>

          {/* 2. Parameters */}
          {formData.type !== 'RAG' && <section>
             <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-2">
                <h4 className="text-sm font-bold text-slate-700">参数定义</h4>
                <button onClick={addParameter} className="text-xs text-primary flex items-center hover:underline">
                   <Plus size={12} className="mr-1" /> 添加参数
                </button>
             </div>
             
             {formData.parameters.length === 0 && (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded text-center text-xs text-slate-400">
                   此工具无需参数 (空)
                </div>
             )}

             <div className="space-y-3">
                {formData.parameters.map((param, idx) => (
                   <div key={idx} className="bg-slate-50 p-2 rounded border border-slate-100">
                      <div className="flex items-start space-x-2">
                         <div className="w-28">
                            <label className="text-[10px] font-bold text-slate-500 mb-1 block">参数来源</label>
                            <select
                               className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-white"
                               value={param.source || 'llm'}
                               onChange={(e) => updateParameterSource(idx, e.target.value as AgentToolParameter['source'])}
                            >
                               <option value="llm">自定义参数</option>
                               <option value="variable" disabled={availableVariables.length === 0}>引用变量</option>
                            </select>
                         </div>

                         {(param.source || 'llm') === 'variable' ? (
                            <>
                               <div className="flex-1">
                                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">变量</label>
                                  <select
                                     className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-white font-mono"
                                     value={param.variableId || ''}
                                     onChange={(e) => updateReferencedVariable(idx, e.target.value)}
                                  >
                                     {availableVariables.length === 0 && <option value="">暂无可引用变量</option>}
                                     {availableVariables.map((variable) => (
                                        <option key={variable.id} value={variable.id}>
                                           {variable.name}
                                        </option>
                                     ))}
                                  </select>
                               </div>
                               <div className="w-24">
                                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">类型</label>
                                  <div className="px-2 py-1 text-xs border border-gray-200 rounded bg-white text-slate-500">
                                     {param.variableType ? VARIABLE_TYPE_LABELS[param.variableType] : '-'}
                                  </div>
                               </div>
                               <div className="flex-1">
                                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">说明</label>
                                  <div className="px-2 py-1 text-xs border border-gray-200 rounded bg-white text-slate-500 truncate">
                                     {param.description || '-'}
                                  </div>
                               </div>
                            </>
                         ) : (
                            <>
                               <div className="w-1/4">
                                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">参数名</label>
                                  <input 
                                     className="w-full px-2 py-1 text-xs border border-gray-200 rounded font-mono"
                                     value={param.name}
                                     onChange={(e) => updateParameter(idx, { name: e.target.value })}
                                     placeholder="order_id"
                                  />
                               </div>
                               <div className="w-1/5">
                                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">类型</label>
                                  <select 
                                     className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-white"
                                     value={param.type}
                                     onChange={(e) => updateParameter(idx, { type: e.target.value })}
                                  >
                                     <option value="string">String</option>
                                     <option value="number">Number</option>
                                     <option value="boolean">Boolean</option>
                                  </select>
                               </div>
                               <div className="flex-1">
                                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">描述</label>
                                  <input 
                                     className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                                     value={param.description}
                                     onChange={(e) => updateParameter(idx, { description: e.target.value })}
                                     placeholder="参数用途说明"
                                  />
                               </div>
                            </>
                         )}

                         <div className="w-10 pt-5 text-center">
                            <button onClick={() => removeParameter(idx)} className="text-slate-300 hover:text-red-500">
                               <Trash2 size={14} />
                            </button>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </section>}

          <section>
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <ShieldCheck size={15} className="text-primary" /> 调用控制
              </h4>
              <button
                type="button"
                onClick={addExecutionRule}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Plus size={12} /> 添加规则
              </button>
            </div>

            <Select
              label="默认执行方式"
              options={EXECUTION_LEVEL_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
              value={formData.executionLevel || 'auto'}
              onChange={(event) => setFormData({
                ...formData,
                executionLevel: event.target.value as AgentTool['executionLevel'],
              })}
            />

            {(formData.executionRules || []).length > 0 && (
              <div className="mt-4 space-y-2">
                {(formData.executionRules || []).map((rule) => (
                  <div key={rule.id} className="grid grid-cols-[1fr_112px_120px_150px_36px] items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div>
                      <Label label="判断参数" />
                      <input
                        value={rule.parameterName}
                        onChange={(event) => updateExecutionRule(rule.id, { parameterName: event.target.value })}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <Label label="条件" />
                      <select
                        value={rule.operator}
                        onChange={(event) => updateExecutionRule(rule.id, { operator: event.target.value as ToolExecutionRule['operator'] })}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-primary"
                      >
                        {RULE_OPERATOR_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label label="比较值" />
                      <input
                        value={rule.compareValue}
                        onChange={(event) => updateExecutionRule(rule.id, { compareValue: event.target.value })}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <Label label="处理方式" />
                      <select
                        value={rule.action}
                        onChange={(event) => updateExecutionRule(rule.id, { action: event.target.value as ToolExecutionRule['action'] })}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-primary"
                      >
                        {EXECUTION_LEVEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExecutionRule(rule.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                      title="删除规则"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {needsUserConfirmation && (
              <div className="mt-4">
                <Label label="确认话术（每行一条）" />
                <textarea
                  rows={3}
                  value={(formData.confirmationSpeeches || ['请确认是否执行本次操作？']).join('\n')}
                  onChange={(event) => setFormData({
                    ...formData,
                    confirmationSpeeches: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean),
                  })}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}

            {needsHumanHandling && (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="人工处理队列"
                  value={formData.humanApprovalQueueId || ''}
                  onChange={(event) => setFormData({ ...formData, humanApprovalQueueId: event.target.value })}
                />
                <Select
                  label="目标 IVR"
                  options={[
                    { label: '请选择目标 IVR', value: '' },
                    { label: '通用人工队列', value: 'ivr_general_queue' },
                    { label: '退款审批队列', value: 'ivr_refund_approval' },
                    { label: '高风险专员', value: 'ivr_risk_specialist' },
                  ]}
                  value={formData.humanApprovalIvrTarget || ''}
                  onChange={(event) => setFormData({ ...formData, humanApprovalIvrTarget: event.target.value })}
                />
                <Input
                  label="审批超时（秒）"
                  type="number"
                  min={1}
                  value={formData.humanApprovalTimeoutSeconds ?? 30}
                  onChange={(event) => setFormData({ ...formData, humanApprovalTimeoutSeconds: Number(event.target.value) })}
                />
                <Select
                  label="超时处理"
                  options={[
                    { label: '转人工', value: 'transfer' },
                    { label: '取消本次调用', value: 'cancel' },
                  ]}
                  value={formData.approvalTimeoutAction || 'transfer'}
                  onChange={(event) => setFormData({ ...formData, approvalTimeoutAction: event.target.value as AgentTool['approvalTimeoutAction'] })}
                />
              </div>
            )}
          </section>

          <section>
            <h4 className="mb-3 border-b border-slate-100 pb-2 text-sm font-bold text-slate-700">运行控制</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="重复调用"
                options={[
                  { label: '复用结果', value: 'reuse_result' },
                  { label: '等待原任务', value: 'wait_running' },
                  { label: '拒绝重复', value: 'reject' },
                ]}
                value={formData.duplicateCallPolicy || 'reuse_result'}
                onChange={(event) => setFormData({ ...formData, duplicateCallPolicy: event.target.value as AgentTool['duplicateCallPolicy'] })}
              />
              <Select
                label="用户打断后"
                options={[
                  { label: '取消执行', value: 'cancel' },
                  { label: '后台继续', value: 'continue' },
                  { label: '静默继续', value: 'continue_silent' },
                ]}
                value={formData.interruptionPolicy || 'cancel'}
                onChange={(event) => setFormData({ ...formData, interruptionPolicy: event.target.value as AgentTool['interruptionPolicy'] })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-3">
              <span className="text-xs font-bold text-slate-700">执行期间暂停静默计时</span>
              <Switch
                label=""
                ariaLabel="执行期间暂停静默计时"
                compact
                checked={formData.pauseSilenceTimer ?? true}
                onChange={(value) => setFormData({ ...formData, pauseSilenceTimer: value })}
              />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label="首次反馈（秒）"
                type="number"
                min={1}
                value={formData.firstProgressFeedbackSeconds ?? 3}
                onChange={(event) => setFormData({ ...formData, firstProgressFeedbackSeconds: Number(event.target.value) })}
              />
              <Input
                label="反馈间隔（秒）"
                type="number"
                min={1}
                value={formData.progressFeedbackIntervalSeconds ?? 8}
                onChange={(event) => setFormData({ ...formData, progressFeedbackIntervalSeconds: Number(event.target.value) })}
              />
              <Input
                label="最大执行（秒）"
                type="number"
                min={1}
                value={formData.maxExecutionSeconds ?? 30}
                onChange={(event) => setFormData({ ...formData, maxExecutionSeconds: Number(event.target.value) })}
              />
            </div>
            <div>
              <Label label="等待反馈话术（每行一条）" />
              <textarea
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={(formData.progressSpeeches || ['正在为您查询，请稍候。']).join('\n')}
                onChange={(event) => setFormData({
                  ...formData,
                  progressSpeeches: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean),
                })}
              />
            </div>
          </section>

          {/* 3. 工具调用话术 */}
          <section className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
             <h4 className="text-sm font-bold text-emerald-900 flex items-center mb-4">
                <MessageSquare size={16} className="mr-2" /> 工具调用话术
             </h4>
             
             {isBuiltInPricing ? (
               <div className="space-y-4">
                 <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-white px-3 py-3">
                   <span className="text-xs font-medium text-slate-700">结果播报</span>
                   <span className="rounded-md bg-emerald-50 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-700">speak_text</span>
                 </div>
                 <div>
                   <Label label="工具调用失败话术" />
                   <textarea
                     value={formData.failureSpeech || ''}
                     onChange={(event) => setFormData({ ...formData, failureSpeech: event.target.value })}
                     className="mt-2 w-full resize-none rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs outline-none focus:border-primary"
                     rows={2}
                   />
                 </div>
               </div>
             ) : (
             <div className="space-y-4">
               <div>
                 <div className="flex items-center gap-2 mb-2">
                   <Label label="工具调用开始话术" />
                   <HelpCircle size={12} className="text-slate-400" />
                 </div>
                 <textarea 
                   value={formData.startSpeech || ''}
                   onChange={(e) => setFormData({...formData, startSpeech: e.target.value})}
                   placeholder="工具开始执行时机器人说的话，如：正在为您查询，请稍候..."
                   className="w-full px-3 py-2 text-xs border border-emerald-200 rounded-lg focus:outline-none focus:border-primary resize-none bg-white"
                   rows={2}
                 />
               </div>

               <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-emerald-200">
                 <div className="flex items-center gap-2">
                   <span className="text-xs font-medium text-slate-700">工具是否需要返回结果</span>
                   <HelpCircle size={12} className="text-slate-400" />
                 </div>
                 <Switch 
                   label="" 
                   checked={formData.needReturn !== false}
                   onChange={(value) => setFormData({...formData, needReturn: value})}
                 />
               </div>
               <p className="text-[10px] text-emerald-600 -mt-2">关闭后，工具执行完成不会向用户汇报结果（适用于后台记录类工具）</p>

               {formData.needReturn !== false && (
                 <div className="space-y-4 animate-in fade-in">
                   <div className="space-y-3 rounded-lg border border-emerald-200 bg-white p-3">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <span className="text-xs font-medium text-slate-700">返回结果后直接播报</span>
                         <HelpCircle size={12} className="text-slate-400" />
                       </div>
                       <Switch
                         label=""
                         checked={formData.directPlayOnReturn === true}
                         onChange={(value) => setFormData({ ...formData, directPlayOnReturn: value })}
                       />
                     </div>
                     <p className="text-[10px] text-emerald-600">
                       开启后，工具返回结果时直接播放固定话术，不再调用模型生成回复。
                     </p>

                     {formData.directPlayOnReturn === true && (
                       <div className="animate-in fade-in">
                         <div className="flex items-center gap-2 mb-2">
                           <Label label="固定播报话术" />
                           <HelpCircle size={12} className="text-slate-400" />
                         </div>
                         <textarea
                           value={formData.directReturnSpeech || ''}
                           onChange={(e) => setFormData({ ...formData, directReturnSpeech: e.target.value })}
                           placeholder="如：已为您完成处理，请稍后查看短信通知。"
                           className="w-full px-3 py-2 text-xs border border-emerald-200 rounded-lg focus:outline-none focus:border-primary resize-none bg-white"
                           rows={2}
                         />
                       </div>
                     )}
                   </div>

                   <div>
                     <div className="flex items-center gap-2 mb-2">
                       <Label label="工具调用成功话术" />
                       <HelpCircle size={12} className="text-slate-400" />
                     </div>
                     <p className="text-[10px] text-slate-400 mb-2">
                       {formData.directPlayOnReturn === true ? '直接播报开启时，此话术仅作为后台记录或兜底参考。' : '工具结果会交给模型组织回复时，可用这段话作为成功回复前缀。'}
                     </p>
                     <textarea 
                       value={formData.successSpeech || ''}
                       onChange={(e) => setFormData({...formData, successSpeech: e.target.value})}
                       placeholder="工具执行成功后的回复，如：查询已完成，结果如下："
                       className="w-full px-3 py-2 text-xs border border-emerald-200 rounded-lg focus:outline-none focus:border-primary resize-none bg-white"
                       rows={2}
                     />
                   </div>

                   <div>
                     <div className="flex items-center gap-2 mb-2">
                       <Label label="工具调用失败话术" />
                       <HelpCircle size={12} className="text-slate-400" />
                     </div>
                     <textarea 
                       value={formData.failureSpeech || ''}
                       onChange={(e) => setFormData({...formData, failureSpeech: e.target.value})}
                       placeholder="工具执行失败后的回复，如：抱歉，查询遇到了问题..."
                       className="w-full px-3 py-2 text-xs border border-emerald-200 rounded-lg focus:outline-none focus:border-primary resize-none bg-white"
                       rows={2}
                     />
                   </div>
                 </div>
               )}

               <div>
                 <div className="flex items-center gap-2 mb-2">
                   <Label label="调用中客户咨询回复话术" />
                   <HelpCircle size={12} className="text-slate-400" />
                 </div>
                 <textarea 
                   value={formData.interruptSpeech || ''}
                   onChange={(e) => setFormData({...formData, interruptSpeech: e.target.value})}
                   placeholder="工具执行期间，如果客户插话问问题，机器人如何回复"
                   className="w-full px-3 py-2 text-xs border border-emerald-200 rounded-lg focus:outline-none focus:border-primary resize-none bg-white"
                   rows={2}
                 />
                 <p className="text-[10px] text-emerald-600 mt-1">工具执行与对话并行，客户可在等待时继续说话</p>
               </div>
             </div>
             )}
          </section>

          {/* 4. 等待音效 */}
          <section className="bg-sky-50/60 rounded-xl p-4 border border-sky-100">
             <div className="flex items-center justify-between mb-4">
               <h4 className="text-sm font-bold text-sky-900 flex items-center">
                  <Music size={16} className="mr-2" /> 等待音效
               </h4>
               <Switch
                 label=""
                 checked={soundEffectConfig.enabled}
                 onChange={(value) => updateSoundEffectConfig({ enabled: value })}
               />
             </div>

             <div className={`space-y-4 ${!soundEffectConfig.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
               <div>
                 <Label label="音效文件" tooltip="从文件管理的背景音/音效资产中选择，适合配置键盘音、等待音等。" />
                 <select
                   className="w-full px-3 py-2 text-sm border border-sky-200 rounded-lg bg-white outline-none focus:border-primary"
                   value={soundEffectConfig.audioId || ''}
                   onChange={(e) => handleSoundEffectSelect(e.target.value)}
                 >
                   <option value="">请选择音效</option>
                   {TOOL_SOUND_EFFECT_OPTIONS.map((item) => (
                     <option key={item.id} value={item.id}>
                       {item.name}（{item.fileName}）
                     </option>
                   ))}
                 </select>
                 <p className="text-[10px] text-sky-600 mt-1">
                   工具确认调用后开始播放，默认持续到正式 TTS 生成。
                 </p>
               </div>
             </div>
          </section>

        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-slate-600 text-sm hover:bg-white transition-colors">
            取消
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-sky-600 shadow-sm transition-colors">
            保存工具
          </button>
        </div>
      </div>
    </div>
  );
}
