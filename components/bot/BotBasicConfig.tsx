
import React, { useState } from 'react';
import { 
  Sparkles, Loader2, Cpu, Volume2, Mic, MessageSquare, Plus, Trash2, ChevronDown, Languages, FileText, Edit3
} from 'lucide-react';
import { Input, Select, Slider, Switch, TagInput, Label } from '../ui/FormComponents';
import { BotConfiguration, ModelType, TTSModel, ASRModel, EMOTIONS, Parameter, BUILT_IN_FUNCTIONS } from '../../types';
import PromptGeneratorModal from './PromptGeneratorModal';
import PromptEditor from '../ui/PromptEditor';

interface BotBasicConfigProps {
  config: BotConfiguration;
  updateField: <K extends keyof BotConfiguration>(key: K, value: BotConfiguration[K]) => void;
  isGenerating: boolean;
  handleSmartGenerate: () => void; // Legacy, kept for interface compatibility if needed, but overridden locally
  onSave: () => void;
  onCancel: () => void;
}

// Available voices for mapping
const AVAILABLE_VOICES = [
  { label: 'Azure-Xiaoxiao (普通话)', value: 'Azure-Xiaoxiao' },
  { label: 'Azure-Yunxi (普通话)', value: 'Azure-Yunxi' },
  { label: 'Azure-HiuGaai (粤语)', value: 'Azure-HiuGaai' },
  { label: 'Azure-WanLung (粤语)', value: 'Azure-WanLung' },
  { label: 'Google-Journey (English)', value: 'Google-Journey' },
  { label: 'Gemini-Voice-Kore (English)', value: 'Gemini-Voice-Kore' },
  { label: 'Volc-Sichuan (四川话)', value: 'Volc-Sichuan' },
];

const CODE_SWITCHING_PROMPT = `
# Multi-Language Code-Switching Strategy
You are a smart assistant capable of fluent code-switching between languages (Mandarin, Cantonese, English, etc.).

## Interaction Rules
1. **Language Detection**: Analyze the user's input language.
2. **Response Style**: Reply in the same language as the user. If the user mixes languages, mirror their style naturally.
3. **TTS Control (CRITICAL)**: To ensure correct pronunciation, you MUST prefix your response with a language tag:
   - For Mandarin: Start with \`[LANG:ZH]\`
   - For Cantonese: Start with \`[LANG:YUE]\`
   - For English: Start with \`[LANG:EN]\`

## Example
User: "Hello, 请问食咗饭未?"
Assistant: "[LANG:YUE] Hello, 我食咗啦，你呢?"
`;

const BotBasicConfig: React.FC<BotBasicConfigProps> = ({ 
  config, 
  updateField, 
  onSave,
  onCancel
}) => {
  const [showGenerator, setShowGenerator] = useState(false);

  const addParameter = () => {
    // Only add if there are available variables
    const newParam: Parameter = { id: Date.now().toString(), key: '', description: '' };
    updateField('parameters', [...config.parameters, newParam]);
  };

  const updateParameter = (id: string, key: string, value: string) => {
    const newParams = config.parameters.map(p => {
      if (p.id === id) {
        if (key === 'key') {
          // Find the selected variable
          const selectedVar = config.variables?.find(v => v.name === value);
          // Auto-fill description from variable if available
          const desc = p.description || (selectedVar ? selectedVar.description : '');
          return { ...p, key: value, description: desc };
        }
        return { ...p, [key]: value };
      }
      return p;
    });
    updateField('parameters', newParams);
  };

  const removeParameter = (id: string) => {
    updateField('parameters', config.parameters.filter(p => p.id !== id));
  };

  const handleApplyGeneratedPrompt = (desc: string, prompt: string) => {
    updateField('description', desc);
    updateField('systemPrompt', prompt);
    setShowGenerator(false);
  };

  // --- Voice Mapping Handlers ---
  const updateVoiceMapping = (lang: string, voice: string) => {
    const newMap = { ...(config.ttsVoiceMapping || {}) };
    newMap[lang] = voice;
    updateField('ttsVoiceMapping', newMap);
  };

  const removeVoiceMapping = (lang: string) => {
    const newMap = { ...(config.ttsVoiceMapping || {}) };
    delete newMap[lang];
    updateField('ttsVoiceMapping', newMap);
  };

  return (
    <div className="space-y-6">
      {/* Prompt Generator Modal */}
      <PromptGeneratorModal 
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
        onApply={handleApplyGeneratedPrompt}
        existingVariables={config.variables || []}
      />

      <div className="bg-white rounded border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5">基础信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Input 
            label="配置模板名称" 
            required 
            placeholder="请输入模板名称" 
            value={config.name} 
            onChange={(e) => updateField('name', e.target.value)} 
          />
          <div className="relative">
            <div className="flex justify-between items-center mb-1">
              <Label label="描述" />
              <button 
                onClick={() => setShowGenerator(true)} 
                className="text-primary text-xs flex items-center hover:underline bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100 transition-colors font-bold"
              >
                <Sparkles size={12} className="mr-1 fill-sky-200" />
                AI 智能生成
              </button>
            </div>
            <textarea 
              className="w-full h-12 px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none transition-all resize-none" 
              placeholder="用于信贷业务的逾期提醒与还款计划制定。" 
              value={config.description} 
              onChange={(e) => updateField('description', e.target.value)} 
            />
          </div>
        </div>
        
        {/* 需求 1：新增 Agent 身份配置 */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            Agent 身份配置
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Agent 角色"
              placeholder="如：客服代表、技术支持、销售顾问"
              value={config.agentRole || ''}
              onChange={(e) => updateField('agentRole', e.target.value)}
              tooltip="定义 Agent 的角色身份，影响对话风格和专业领域"
            />
            <Select
              label="人格设定"
              options={['专业', '友好', '温和', '热情', '严肃']}
              value={config.persona || '专业'}
              onChange={(e) => updateField('persona', e.target.value)}
              tooltip="选择 Agent 的整体人格风格"
            />
            <div className="md:col-span-1">
              <Label label="业务场景" tooltip="描述 Agent 所处的业务场景" />
              <textarea
                className="w-full h-10 px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none transition-all resize-none"
                placeholder="如：逾期催收、预约确认、投诉处理"
                value={config.businessScene || ''}
                onChange={(e) => updateField('businessScene', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5">核心模型配置</h3>
        <div className="bg-slate-50/50 rounded p-6 border border-slate-100">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="rounded bg-blue-100 p-1.5 text-primary">
                <Cpu size={14} />
              </div>
              <span className="text-xs font-bold text-slate-700">大模型配置</span>
            </div>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">上下文压缩</span>
                <Switch
                  label=""
                  ariaLabel="上下文压缩"
                  compact
                  checked={config.contextCompactionEnabled ?? false}
                  onChange={(value) => updateField('contextCompactionEnabled', value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">开启思考</span>
                <Switch
                  label=""
                  ariaLabel="开启思考"
                  compact
                  checked={config.thinkingEnabled ?? false}
                  onChange={(value) => updateField('thinkingEnabled', value)}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-4">
              <Select 
                label="大模型类型" 
                tooltip="选择用于生成对话内容的基础大语言模型。"
                options={Object.values(ModelType) as string[]} 
                value={config.llmType} 
                onChange={(e) => updateField('llmType', e.target.value as ModelType)} 
              />
            </div>
            <div className="lg:col-span-4">
              <Slider label="温度 (Temperature)" min={0} max={1} step={0.1} value={config.temperature} onChange={(v) => updateField('temperature', v)} tooltip="控制生成文本的随机性" />
            </div>
            <div className="lg:col-span-4">
              <Slider label="核采样 (Top-P)" min={0} max={1} step={0.1} value={config.topP} onChange={(v) => updateField('topP', v)} tooltip="另一种控制生成多样性的采样方式" />
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-8">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center space-x-2">
               <div className="p-1.5 bg-pink-100 text-pink-600 rounded">
                 <Volume2 size={14} />
               </div>
               <span className="text-xs font-bold text-slate-700">TTS 语音配置</span>
             </div>
             
             {/* Auto Switch Toggle */}
             <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1 rounded border border-indigo-100">
                <Languages size={14} className="text-indigo-600" />
                <span className="text-xs font-bold text-indigo-700">自动语种跟随</span>
                <Switch 
                   label="" 
                   checked={config.ttsAutoSwitch || false}
                   onChange={(v) => updateField('ttsAutoSwitch', v)} 
                />
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-4">
              <Select label="TTS模型" options={Object.values(TTSModel) as string[]} value={config.ttsModel} onChange={(e) => updateField('ttsModel', e.target.value as TTSModel)} />
              
              {!config.ttsAutoSwitch ? (
                 <Select 
                   label="默认音色" 
                   options={AVAILABLE_VOICES} 
                   value={config.voiceName} 
                   onChange={(e) => updateField('voiceName', e.target.value)} 
                 />
              ) : (
                 <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                    <div className="text-[10px] font-bold text-slate-500 uppercase flex justify-between items-center">
                       <span>音色映射表</span>
                       <button 
                         onClick={() => updateVoiceMapping(`lang_${Date.now()}`, '')} 
                         className="text-primary hover:underline"
                       >
                         + 添加
                       </button>
                    </div>
                    
                    {/* Header Row for Clarity */}
                    <div className="flex items-center text-[9px] text-slate-400 font-medium px-1 mb-1">
                       <span className="w-16">语言</span>
                       <span className="w-20">系统标签</span>
                       <span>音色</span>
                    </div>

                    {/* Fixed Rows for Common Languages */}
                    <div className="space-y-2">
                       {/* Mandarin */}
                       <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                             <span className="text-xs text-slate-600 font-bold w-16">中文</span>
                          </div>
                          <code className="text-[9px] text-pink-500 bg-pink-50 px-1 rounded border border-pink-100 w-20 font-mono">[LANG:ZH]</code>
                          <select 
                             className="text-xs border border-gray-200 rounded p-1 w-28 outline-none"
                             value={config.ttsVoiceMapping?.['ZH'] || 'Azure-Xiaoxiao'}
                             onChange={(e) => updateVoiceMapping('ZH', e.target.value)}
                          >
                             {AVAILABLE_VOICES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                          </select>
                       </div>
                       {/* Cantonese */}
                       <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                             <span className="text-xs text-slate-600 font-bold w-16">粤语</span>
                          </div>
                          <code className="text-[9px] text-pink-500 bg-pink-50 px-1 rounded border border-pink-100 w-20 font-mono">[LANG:YUE]</code>
                          <select 
                             className="text-xs border border-gray-200 rounded p-1 w-28 outline-none"
                             value={config.ttsVoiceMapping?.['YUE'] || 'Azure-HiuGaai'}
                             onChange={(e) => updateVoiceMapping('YUE', e.target.value)}
                          >
                             {AVAILABLE_VOICES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                          </select>
                       </div>
                       {/* English */}
                       <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                             <span className="text-xs text-slate-600 font-bold w-16">English</span>
                          </div>
                          <code className="text-[9px] text-pink-500 bg-pink-50 px-1 rounded border border-pink-100 w-20 font-mono">[LANG:EN]</code>
                          <select 
                             className="text-xs border border-gray-200 rounded p-1 w-28 outline-none"
                             value={config.ttsVoiceMapping?.['EN'] || 'Google-Journey'}
                             onChange={(e) => updateVoiceMapping('EN', e.target.value)}
                          >
                             {AVAILABLE_VOICES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                          </select>
                       </div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-tight bg-slate-100 p-2 rounded">
                       提示：请确保 Prompt 中包含系统标签（如 <code className="text-pink-600">[LANG:ZH]</code>），系统检测到标签时将自动切换至对应音色。
                    </div>
                 </div>
              )}
            </div>
            
            <div className="lg:col-span-4 space-y-6">
              <Slider label="音量" min={0} max={100} value={config.volume} onChange={(v) => updateField('volume', v)} />
              <Slider label="语速" min={0.5} max={2.0} step={0.1} value={config.speed} onChange={(v) => updateField('speed', v)} />
            </div>
            <div className="lg:col-span-4 space-y-4">
              <Select label="情绪" options={EMOTIONS as string[]} value={config.emotion} onChange={(e) => updateField('emotion', e.target.value)} />
              <div className="bg-slate-50 border border-slate-100 rounded p-4">
                 <Label label="预览：" />
                 <div className="text-[11px] text-slate-500 leading-relaxed italic">
                   {config.ttsAutoSwitch 
                     ? '已启用多语言混合模式，音色将根据 LLM 输出的语言标签 [LANG:XX] 自动切换。' 
                     : `当前音色风格为 ${config.emotion}，适合标准服务场景。`
                   }
                 </div>
              </div>
            </div>
          </div>

          {/* TTS 朗读优化 */}
          <div className="mt-8 border-t border-gray-100 pt-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-sky-100 text-sky-600 rounded">
                  <Volume2 size={14} />
                </div>
                <span className="text-xs font-bold text-slate-700">TTS 朗读优化</span>
              </div>
              <Switch 
                label="" 
                checked={config.ttsOptimizationEnabled || false}
                onChange={(v) => updateField('ttsOptimizationEnabled', v)} 
              />
            </div>

            {config.ttsOptimizationEnabled && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <Label label="词汇列表" tooltip="添加需要替换的词汇" />
                  <button 
                    onClick={() => {
                      const newRule = {
                        id: Date.now().toString(),
                        matchText: '',
                        replaceText: ''
                      };
                      updateField('ttsOptimizationRules', [...(config.ttsOptimizationRules || []), newRule]);
                    }}
                    className="text-primary text-xs flex items-center hover:underline bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100 transition-colors font-bold"
                  >
                    <Plus size={12} className="mr-1" />
                    添加优化规则
                  </button>
                </div>
                
                <div className="space-y-3">
                  {config.ttsOptimizationRules?.map((rule) => (
                    <div key={rule.id} className="flex flex-col space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="text-xs font-bold text-slate-600 mb-1">匹配文本</div>
                          <input 
                            type="text" 
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                            placeholder="例如: -"
                            value={rule.matchText}
                            onChange={(e) => {
                              const updatedRules = config.ttsOptimizationRules?.map(r => 
                                r.id === rule.id ? { ...r, matchText: e.target.value } : r
                              );
                              updateField('ttsOptimizationRules', updatedRules);
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-slate-600 mb-1">替换文本</div>
                          <input 
                            type="text" 
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                            placeholder="例如: 杠"
                            value={rule.replaceText}
                            onChange={(e) => {
                              const updatedRules = config.ttsOptimizationRules?.map(r => 
                                r.id === rule.id ? { ...r, replaceText: e.target.value } : r
                              );
                              updateField('ttsOptimizationRules', updatedRules);
                            }}
                          />
                        </div>
                        <button 
                          onClick={() => {
                            const updatedRules = config.ttsOptimizationRules?.filter(r => r.id !== rule.id);
                            updateField('ttsOptimizationRules', updatedRules);
                          }}
                          className="text-slate-300 hover:text-red-500 shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!config.ttsOptimizationRules || config.ttsOptimizationRules.length === 0) && (
                    <div className="text-[10px] text-slate-400 text-center py-4">
                      暂无优化规则，请点击上方"添加优化规则"按钮添加
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-8">
          <div className="flex items-center space-x-2 mb-6">
            <div className="p-1.5 bg-teal-100 text-teal-600 rounded">
              <Mic size={14} />
            </div>
            <span className="text-xs font-bold text-slate-700">ASR 识别配置</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-4">
              <Select label="ASR模型" options={Object.values(ASRModel) as string[]} value={config.asrModel} onChange={(e) => updateField('asrModel', e.target.value as ASRModel)} />
            </div>
            <div className="lg:col-span-4 space-y-4">
               <Input label="静音时长 (ms)" tooltip="检测到静音多长时间后切断识别" value={config.asrSilenceDurationMs} onChange={(e) => updateField('asrSilenceDurationMs', parseInt(e.target.value) || 0)} />
            </div>
            <div className="lg:col-span-4 space-y-6 pt-2">
              <Switch label="允许被打断" checked={config.asrInterruptible} onChange={(v) => updateField('asrInterruptible', v)} tooltip="客户说话时是否立刻停止机器人播报" />
            </div>
          </div>

          {/* ASR 文本修正 */}
          <div className="mt-8 border-t border-gray-100 pt-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-teal-100 text-teal-600 rounded">
                  <Edit3 size={14} />
                </div>
                <span className="text-xs font-bold text-slate-700">ASR 文本修正</span>
              </div>
              <Switch 
                label="" 
                checked={config.asrTextCorrectionEnabled || false}
                onChange={(v) => updateField('asrTextCorrectionEnabled', v)} 
              />
            </div>

            {config.asrTextCorrectionEnabled && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <Label label="修正规则" tooltip="添加需要修正的文本规则" />
                  <button 
                    onClick={() => {
                      const newRule = {
                        id: Date.now().toString(),
                        matchText: '',
                        replaceText: ''
                      };
                      updateField('asrTextCorrectionRules', [...(config.asrTextCorrectionRules || []), newRule]);
                    }}
                    className="text-primary text-xs flex items-center hover:underline bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100 transition-colors font-bold"
                  >
                    <Plus size={12} className="mr-1" />
                    添加修正规则
                  </button>
                </div>
                
                <div className="space-y-3">
                  {config.asrTextCorrectionRules?.map((rule) => (
                    <div key={rule.id} className="flex flex-col space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="text-xs font-bold text-slate-600 mb-1">匹配文本</div>
                          <input 
                            type="text" 
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                            placeholder="例如: 瑞鑫"
                            value={rule.matchText}
                            onChange={(e) => {
                              const updatedRules = config.asrTextCorrectionRules?.map(r => 
                                r.id === rule.id ? { ...r, matchText: e.target.value } : r
                              );
                              updateField('asrTextCorrectionRules', updatedRules);
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-slate-600 mb-1">替换文本</div>
                          <input 
                            type="text" 
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                            placeholder="例如: 瑞幸"
                            value={rule.replaceText}
                            onChange={(e) => {
                              const updatedRules = config.asrTextCorrectionRules?.map(r => 
                                r.id === rule.id ? { ...r, replaceText: e.target.value } : r
                              );
                              updateField('asrTextCorrectionRules', updatedRules);
                            }}
                          />
                        </div>
                        <button 
                          onClick={() => {
                            const updatedRules = config.asrTextCorrectionRules?.filter(r => r.id !== rule.id);
                            updateField('asrTextCorrectionRules', updatedRules);
                          }}
                          className="text-slate-300 hover:text-red-500 shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!config.asrTextCorrectionRules || config.asrTextCorrectionRules.length === 0) && (
                    <div className="text-[10px] text-slate-400 text-center py-4">
                      暂无修正规则，请点击上方"添加修正规则"按钮添加
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>


      </div>

      <div className="bg-white rounded border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5">提示词与传参逻辑</h3>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-2">
                <MessageSquare size={14} className="text-primary" />
                <span className="text-xs font-bold text-slate-700">可视化填写提示词</span>
              </div>
              <div className="flex items-center space-x-3">
                 <button 
                   onClick={() => updateField('systemPrompt', config.systemPrompt + '\n' + CODE_SWITCHING_PROMPT)}
                   className="text-xs flex items-center bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition-colors border border-indigo-100 font-medium"
                   title="插入多语言切换指令模板"
                 >
                   <FileText size={12} className="mr-1" /> 多语言模版
                 </button>
                 <span className="text-slate-300">|</span>
                 <button 
                  onClick={() => setShowGenerator(true)} 
                  className="text-primary text-[10px] flex items-center hover:underline bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100 transition-colors font-bold"
                >
                  <Sparkles size={10} className="mr-1 fill-sky-200" />
                  AI 生成
                </button>
              </div>
            </div>
            <PromptEditor
              value={config.systemPrompt}
              onChange={(v) => updateField('systemPrompt', v)}
              placeholder="全局限制、角色边界、禁答要求、统一回复风格都写在这里。你是一个专业的客服助手..."
              variables={config.variables || []}
              availableTools={config.agentConfig?.tools || []}
              availableFunctions={BUILT_IN_FUNCTIONS}
              availableFlows={(config.flowConfig?.flows || []).map(f => ({ id: f.id, name: f.name, description: f.metadata?.description }))}
              height="h-80"
            />
          </div>
          <div className="lg:col-span-4">
            <div className="bg-slate-50/50 border border-slate-100 rounded p-4 h-full">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-700">业务变量参数</span>
                <button onClick={addParameter} className="text-[10px] px-2 py-0.5 border border-primary text-primary rounded hover:bg-primary/5 flex items-center">
                   <Plus size={10} className="mr-1" /> 添加
                </button>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {config.parameters.map((param) => (
                  <div key={param.id} className="flex space-x-2 items-center">
                    <div className="w-1/2 relative">
                       <select 
                         className="w-full px-2 py-1 text-[11px] border border-gray-200 rounded bg-white outline-none appearance-none"
                         value={param.key}
                         onChange={(e) => updateParameter(param.id, 'key', e.target.value)}
                       >
                         <option value="">选择变量</option>
                         {config.variables?.map(v => (
                           <option key={v.id} value={v.name}>{v.name}</option>
                         ))}
                       </select>
                       <ChevronDown size={10} className="absolute right-1 top-2 text-gray-400 pointer-events-none" />
                    </div>
                    
                    <div className="w-1/2 px-2 py-1 text-[11px] bg-slate-100 rounded text-slate-500 font-mono truncate border border-slate-200">
                      {param.key || '-'}
                    </div>

                    <button onClick={() => removeParameter(param.id)} className="text-slate-300 hover:text-red-500 shrink-0">
                       <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {config.parameters.length === 0 && <div className="text-[10px] text-slate-400 text-center py-4">暂无变量</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-start space-x-4 pt-4 border-t border-gray-100">
         <button onClick={onSave} className="px-6 py-2 bg-primary text-white rounded hover:bg-sky-600 text-sm font-medium shadow-sm transition-all">
           保存配置
         </button>
         <button onClick={onCancel} className="px-6 py-2 border border-gray-200 text-slate-600 rounded hover:bg-slate-50 text-sm font-medium transition-all">
           取消
         </button>
      </div>
    </div>
  );
};

export default BotBasicConfig;
