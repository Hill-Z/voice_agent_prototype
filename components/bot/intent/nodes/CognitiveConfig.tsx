
import React from 'react';
import { Plus, X, Wrench, Code, Zap, ArrowRight } from 'lucide-react';
import { IntentNode, ModelType, AgentTool, FlowFunction, BUILT_IN_FUNCTIONS } from '../../../../types';
import { Label, Select, Slider } from '../../../ui/FormComponents';
import SimpleErrorHandling from './SimpleErrorHandling';
import PromptEditor from '../../../ui/PromptEditor';

interface Props {
  node: IntentNode;
  onChange: (updates: any) => void;
  availableNodes?: { label: string; value: string }[];
  availableTools?: AgentTool[];
  availableFunctions?: FlowFunction[];
}

const CognitiveConfig: React.FC<Props> = ({ node, onChange, availableNodes = [], availableTools = [], availableFunctions = [] }) => {
  const selectedToolIds = node.config?.toolIds || [];
  const selectedVisibleFunctionIds = node.config?.visibleFunctionIds || [];
  const selectedTransitionFunctionIds = node.config?.transitionFunctionIds || [];

  const allFunctions = [...BUILT_IN_FUNCTIONS, ...(availableFunctions || [])];
  
  const visibleFunctions = allFunctions.filter(fn => fn.category === 'visible');
  const transitionFunctions = allFunctions.filter(fn => fn.category === 'transition');

  const handleToolToggle = (toolId: string) => {
    const newToolIds = selectedToolIds.includes(toolId)
      ? selectedToolIds.filter(id => id !== toolId)
      : [...selectedToolIds, toolId];
    onChange({ toolIds: newToolIds });
  };

  const handleVisibleFunctionToggle = (functionId: string) => {
    const newFunctionIds = selectedVisibleFunctionIds.includes(functionId)
      ? selectedVisibleFunctionIds.filter(id => id !== functionId)
      : [...selectedVisibleFunctionIds, functionId];
    onChange({ visibleFunctionIds: newFunctionIds });
  };

  const handleTransitionFunctionToggle = (functionId: string) => {
    const newFunctionIds = selectedTransitionFunctionIds.includes(functionId)
      ? selectedTransitionFunctionIds.filter(id => id !== functionId)
      : [...selectedTransitionFunctionIds, functionId];
    onChange({ transitionFunctionIds: newFunctionIds });
  };

  // 3. LLM
  if (node.subType === 'llm') {
    return (
      <>
        <Select
          label="模型选择"
          options={Object.values(ModelType) as string[]}
          value={node.config?.modelType || ModelType.GEMINI_FLASH}
          onChange={(e) => onChange({ modelType: e.target.value })}
        />
        <div>
          <Label label="系统提示词 (System Prompt)" />
          <PromptEditor
            value={node.config?.systemPrompt || ''}
            onChange={(v) => onChange({ systemPrompt: v })}
            placeholder="设定此节点的具体人设和行为规范..."
            availableTools={availableTools}
            availableFunctions={allFunctions}
            height="h-40"
          />
        </div>
        
        <div>
          <Label label="步骤提示词 (Step Prompt)" tooltip="当前步骤的专属提示词，LLM只看到当前步骤的prompt" />
          <textarea
            className="w-full h-20 px-3 py-2 text-xs border border-gray-200 rounded-lg resize-none focus:border-primary outline-none"
            placeholder="描述当前步骤的具体任务，例如：收集用户的确认码..."
            value={node.config?.stepPrompt || ''}
            onChange={(e) => onChange({ stepPrompt: e.target.value })}
          />
          <p className="text-[10px] text-slate-400 mt-1">
            类似 PolyAI 的 Step Prompt，LLM 只能看到当前步骤的提示词
          </p>
        </div>
        
        <Slider
          label="随机性 (Temperature)"
          min={0} max={1} step={0.1}
          value={node.config?.temperature ?? 0.7}
          onChange={(v) => onChange({ temperature: v })}
        />

        <div className="pt-4 border-t border-gray-100">
          <Label label="绑定工具 (Tools)" tooltip="绑定后可在提示词中用 / 引用，LLM 会根据上下文决定是否调用" />
          <div className="flex flex-wrap gap-2 mt-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded border border-slate-100">
            {availableTools.length > 0 ? availableTools.map(tool => (
              <button
                key={tool.id}
                onClick={() => handleToolToggle(tool.id)}
                className={`px-3 py-1.5 text-xs rounded-full flex items-center gap-1.5 transition-colors ${
                  selectedToolIds.includes(tool.id)
                    ? 'bg-primary text-white'
                    : 'bg-white border border-gray-200 text-slate-600 hover:border-primary'
                }`}
              >
                <Wrench size={10} />
                {tool.name}
                {selectedToolIds.includes(tool.id) && (
                  <X size={10} className="ml-1" />
                )}
              </button>
            )) : (
              <p className="text-xs text-slate-400 py-2 px-3">暂无工具，请在「智能体配置」中添加工具</p>
            )}
          </div>
          {selectedToolIds.length > 0 && (
            <p className="text-[10px] text-slate-400 mt-1">
              已选择 {selectedToolIds.length} 个工具
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={12} className="text-blue-500" />
            <Label label="可见函数 (Visible Functions)" tooltip="LLM自主决定调用的函数，用于执行业务操作" />
          </div>
          <div className="flex flex-wrap gap-2 mt-2 max-h-40 overflow-y-auto p-2 bg-blue-50 rounded border border-blue-100">
            {visibleFunctions.length > 0 ? visibleFunctions.map(fn => {
              const isSelected = selectedVisibleFunctionIds.includes(fn.id);
              return (
                <button
                  key={fn.id}
                  onClick={() => handleVisibleFunctionToggle(fn.id)}
                  className={`px-3 py-1.5 text-xs rounded-full flex items-center gap-1.5 transition-colors ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-blue-200 text-slate-600 hover:border-blue-400'
                  }`}
                >
                  <Code size={10} />
                  {fn.name}
                  {fn.isBuiltIn && (
                    <span className="px-1 py-0.5 bg-amber-400/20 text-amber-600 text-[8px] rounded">内置</span>
                  )}
                  {isSelected && <X size={10} className="ml-1" />}
                </button>
              );
            }) : (
              <p className="text-xs text-slate-400 py-2 px-3">暂无可函数</p>
            )}
          </div>
          {selectedVisibleFunctionIds.length > 0 && (
            <p className="text-[10px] text-blue-500 mt-1">
              已选择 {selectedVisibleFunctionIds.length} 个可见函数，LLM 可自主调用
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight size={12} className="text-green-500" />
            <Label label="过渡函数 (Transition Functions)" tooltip="在步骤提示词中引用，用于控制流程跳转" />
          </div>
          <div className="flex flex-wrap gap-2 mt-2 max-h-40 overflow-y-auto p-2 bg-green-50 rounded border border-green-100">
            {transitionFunctions.length > 0 ? transitionFunctions.map(fn => {
              const isSelected = selectedTransitionFunctionIds.includes(fn.id);
              return (
                <button
                  key={fn.id}
                  onClick={() => handleTransitionFunctionToggle(fn.id)}
                  className={`px-3 py-1.5 text-xs rounded-full flex items-center gap-1.5 transition-colors ${
                    isSelected
                      ? 'bg-green-500 text-white'
                      : 'bg-white border border-green-200 text-slate-600 hover:border-green-400'
                  }`}
                >
                  <ArrowRight size={10} />
                  {fn.name}
                  {fn.isBuiltIn && (
                    <span className="px-1 py-0.5 bg-amber-400/20 text-amber-600 text-[8px] rounded">内置</span>
                  )}
                  {isSelected && <X size={10} className="ml-1" />}
                </button>
              );
            }) : (
              <p className="text-xs text-slate-400 py-2 px-3">暂无过渡函数</p>
            )}
          </div>
          {selectedTransitionFunctionIds.length > 0 && (
            <p className="text-[10px] text-green-500 mt-1">
              已选择 {selectedTransitionFunctionIds.length} 个过渡函数，可在步骤提示词中用 / 引用
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <Label label="Few-shot 示例" />
            <button
              onClick={() => {
                const examples = node.config?.fewShotExamples || [];
                onChange({
                  fewShotExamples: [...examples, { input: '', output: '' }]
                });
              }}
              className="text-xs text-primary hover:text-primary/80 flex items-center"
            >
              <Plus size={12} className="mr-1" /> 添加示例
            </button>
          </div>
          {(node.config?.fewShotExamples || []).map((example: { input: string; output: string }, idx: number) => (
            <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-100 mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500">示例 {idx + 1}</span>
                <button
                  onClick={() => {
                    const examples = (node.config?.fewShotExamples || []).filter((_: any, i: number) => i !== idx);
                    onChange({ fewShotExamples: examples });
                  }}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X size={12} />
                </button>
              </div>
              <textarea
                className="w-full h-12 px-2 py-1.5 text-xs border border-gray-200 rounded resize-none mb-2"
                placeholder="用户输入..."
                value={example.input}
                onChange={(e) => {
                  const examples = [...(node.config?.fewShotExamples || [])];
                  examples[idx] = { ...examples[idx], input: e.target.value };
                  onChange({ fewShotExamples: examples });
                }}
              />
              <textarea
                className="w-full h-12 px-2 py-1.5 text-xs border border-gray-200 rounded resize-none"
                placeholder="期望回复..."
                value={example.output}
                onChange={(e) => {
                  const examples = [...(node.config?.fewShotExamples || [])];
                  examples[idx] = { ...examples[idx], output: e.target.value };
                  onChange({ fewShotExamples: examples });
                }}
              />
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-100">
          <SimpleErrorHandling
            label="节点执行异常时跳转至"
            tooltip="异常包括API调用失败、响应超时、返回空内容等"
            value={node.config?.onErrorNodeId || ''}
            onChange={(value) => onChange({ onErrorNodeId: value })}
            availableNodes={availableNodes}
          />
        </div>
      </>
    );
  }

  // 4. Collect
  if (node.subType === 'collect') {
    return (
      <>
        <Select 
          label="收集类型"
          options={[
            {label: '意图 (Intent)', value: 'intent'},
            {label: '槽位 (Slot)', value: 'slot'},
            {label: '按键 (DTMF)', value: 'dtmf'}
          ]}
          value={node.config?.collectType || 'intent'}
          onChange={(e) => onChange({ collectType: e.target.value })}
        />
        
        {node.config?.collectType === 'slot' && (
          <div className="p-3 bg-amber-50 border border-amber-100 rounded text-xs text-amber-700">
            槽位收集将尝试从用户输入中提取指定变量。
          </div>
        )}

        {node.config?.collectType === 'dtmf' && (
          <>
            <Label label="最大位数" />
            <input 
              type="number"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded"
              value={node.config?.dtmfConfig?.maxDigits || 1}
              onChange={(e) => onChange({ 
                dtmfConfig: { 
                  ...(node.config?.dtmfConfig || {}), 
                  maxDigits: parseInt(e.target.value) 
                } 
              })}
            />
          </>
        )}

        <div className="pt-4 border-t border-gray-100">
          <SimpleErrorHandling
            label="收集异常时跳转至"
            tooltip="包括用户未响应超时、语音识别失败、用户打断等"
            value={node.config?.onCollectErrorNodeId || ''}
            onChange={(value) => onChange({ onCollectErrorNodeId: value })}
            availableNodes={availableNodes}
          />
        </div>
      </>
    );
  }

  return null;
};

export default CognitiveConfig;
