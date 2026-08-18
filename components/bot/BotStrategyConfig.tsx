
import React from 'react';
import { 
  Headset, Search, RotateCcw, Clock, PhoneOff, CheckCircle2, 
  MessageSquare, UserX, PlusCircle, X, Volume2, MicOff, Mic, Plus, Trash2,
  ShieldCheck, AlertTriangle
} from 'lucide-react';
import { Switch, Label, TagInput, Select } from '../ui/FormComponents';
import { BotConfiguration, FirstResponseFillerConfig } from '../../types';
import SpeechListEditor from '../ui/SpeechListEditor';

// --- Helper Components ---

const StrategyCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8 transition-all hover:shadow-md">
    <div className="px-6 py-4 border-b border-gray-100 bg-slate-50/50 flex items-center justify-between">
      <div className="flex items-center">
        <div className="p-2 bg-white rounded-lg shadow-sm mr-3 text-primary border border-gray-100">
          {icon}
        </div>
        <h3 className="text-base font-bold text-slate-800 tracking-tight">{title}</h3>
      </div>
    </div>
    <div className="p-8">
      {children}
    </div>
  </div>
);

const SubSection: React.FC<{ title: string; enabled?: boolean; onToggle?: (v: boolean) => void; children: React.ReactNode }> = ({ title, enabled, onToggle, children }) => (
  <div className={`mb-8 last:mb-0 transition-all duration-300 ${onToggle && !enabled ? 'opacity-50' : 'opacity-100'}`}>
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-sm font-bold text-slate-700 flex items-center">
        <span className="w-1 h-4 bg-primary rounded-full mr-2"></span>
        {title}
      </h4>
      {onToggle && (
        <Switch label="" checked={enabled || false} onChange={onToggle} />
      )}
    </div>
    <div className={`pl-3 border-l border-slate-100 ml-1 space-y-4 ${onToggle && !enabled ? 'pointer-events-none' : ''}`}>
      {children}
    </div>
  </div>
);

const DEFAULT_FIRST_RESPONSE_FILLER_CONFIG: FirstResponseFillerConfig = {
  enabled: true,
  triggerDelayMs: 500,
  phrases: ['稍等', '我看下', '稍等下'],
  minUserTurnsBetweenPlays: 2,
  avoidConsecutiveRepeat: true,
};

// --- Main Component ---

interface BotStrategyConfigProps {
  config: BotConfiguration;
  updateField: <K extends keyof BotConfiguration>(key: K, value: BotConfiguration[K]) => void;
  onSave: () => void;
  onCancel: () => void;
}

const BotStrategyConfig: React.FC<BotStrategyConfigProps> = ({ config, updateField, onSave, onCancel }) => {
  type SpeechField = 'channelCheckSpeech' | 'unclearSpeech' | 'forceInterruptReply';

  const normalizeSpeechList = (value?: string | string[]) => {
    if (Array.isArray(value)) return value.length > 0 ? value : [''];
    return [value || ''];
  };

  const getSpeechValue = (field: SpeechField) => (
    config[field] ?? (field === 'forceInterruptReply' ? ['好的，您请说。'] : undefined)
  );

  const updateSpeechItem = (field: SpeechField, index: number, value: string) => {
    const items = [...normalizeSpeechList(getSpeechValue(field))];
    items[index] = value;
    updateField(field, items);
  };

  const addSpeechItem = (field: SpeechField) => {
    updateField(field, [...normalizeSpeechList(getSpeechValue(field)), '']);
  };

  const removeSpeechItem = (field: SpeechField, index: number) => {
    const items = normalizeSpeechList(getSpeechValue(field));
    if (items.length <= 1) return;
    updateField(field, items.filter((_, itemIndex) => itemIndex !== index));
  };

  const renderSpeechList = (field: SpeechField, label: string, placeholder: string) => {
    const items = normalizeSpeechList(config[field]);

    return (
      <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Label label={label} />
          <button
            type="button"
            onClick={() => addSpeechItem(field)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-sky-100 bg-white px-2.5 text-xs font-bold text-primary transition-colors hover:bg-sky-50"
          >
            <Plus size={12} /> 添加话术
          </button>
        </div>

        <div className="space-y-2">
          {items.map((speech, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                className="h-10 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
                value={speech}
                onChange={(e) => updateSpeechItem(field, index, e.target.value)}
                placeholder={placeholder}
              />
              <button
                type="button"
                onClick={() => removeSpeechItem(field, index)}
                disabled={items.length <= 1}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-400"
                title="删除话术"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const firstResponseFillerConfig: FirstResponseFillerConfig = {
    ...DEFAULT_FIRST_RESPONSE_FILLER_CONFIG,
    ...(config.firstResponseFillerConfig || {}),
    phrases: config.firstResponseFillerConfig?.phrases?.length
      ? config.firstResponseFillerConfig.phrases
      : DEFAULT_FIRST_RESPONSE_FILLER_CONFIG.phrases,
  };

  const updateFirstResponseFillerConfig = (updates: Partial<FirstResponseFillerConfig>) => {
    updateField('firstResponseFillerConfig', {
      ...firstResponseFillerConfig,
      ...updates,
    });
  };

  const safetyGuardrailConfig: NonNullable<BotConfiguration['safetyGuardrailConfig']> = {
    sensitiveInfoMode: 'mask' as const,
    fallbackSpeeches: ['抱歉，这个问题暂时无法处理，我帮您换一种方式。'],
    businessRules: [],
    ...(config.safetyGuardrailConfig || {}),
  };

  const updateSafetyGuardrailConfig = (updates: Partial<NonNullable<BotConfiguration['safetyGuardrailConfig']>>) => {
    updateField('safetyGuardrailConfig', { ...safetyGuardrailConfig, ...updates });
  };

  const globalExceptionPolicy: NonNullable<BotConfiguration['globalExceptionPolicy']> = {
    fallbackAction: 'transfer' as const,
    fallbackIvrTarget: 'ivr_general_queue',
    fallbackSpeeches: ['抱歉，当前服务出现异常，我帮您转接人工客服。'],
    maxConsecutiveErrors: 2,
    ...(config.globalExceptionPolicy || {}),
  };

  const updateGlobalExceptionPolicy = (updates: Partial<NonNullable<BotConfiguration['globalExceptionPolicy']>>) => {
    updateField('globalExceptionPolicy', { ...globalExceptionPolicy, ...updates });
  };

  const updateFirstResponsePhrase = (index: number, value: string) => {
    const phrases = [...firstResponseFillerConfig.phrases];
    phrases[index] = value;
    updateFirstResponseFillerConfig({ phrases });
  };

  const addFirstResponsePhrase = () => {
    updateFirstResponseFillerConfig({
      phrases: [...firstResponseFillerConfig.phrases, ''],
    });
  };

  const removeFirstResponsePhrase = (index: number) => {
    if (firstResponseFillerConfig.phrases.length <= 1) return;
    updateFirstResponseFillerConfig({
      phrases: firstResponseFillerConfig.phrases.filter((_, itemIndex) => itemIndex !== index),
    });
  };

  return (
    <div className="space-y-6">
      <StrategyCard title="开场欢迎语" icon={<MessageSquare size={18} />}>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 mr-3 shadow-sm text-primary">
                <Volume2 size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">启用开场白</div>
                <div className="text-[11px] text-slate-500">电话接通后机器人首先播放的话术</div>
              </div>
            </div>
            <Switch label="" checked={config.welcomeMessageEnabled} onChange={(v) => updateField('welcomeMessageEnabled', v)} />
          </div>
          
          <div className={`transition-opacity duration-200 ${!config.welcomeMessageEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex justify-between items-center mb-2">
                 <Label label="欢迎语话术" required />
                 <div className="flex items-center space-x-2 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 flex items-center">
                       {config.welcomeMessageInterruptible ? <Mic size={10} className="mr-1"/> : <MicOff size={10} className="mr-1"/>}
                       允许打断
                    </span>
                    <Switch label="" checked={config.welcomeMessageInterruptible ?? true} onChange={(v) => updateField('welcomeMessageInterruptible', v)} />
                 </div>
              </div>
              <textarea 
                className="w-full h-24 px-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none bg-white leading-relaxed shadow-sm"
                value={config.welcomeMessage}
                onChange={(e) => updateField('welcomeMessage', e.target.value)}
                placeholder="例如：您好，这里是XX科技，请问有什么可以帮您？"
              />
          </div>
        </div>
      </StrategyCard>

      <StrategyCard title="打断控制" icon={<Mic size={18} />}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Select
            label="打断灵敏度"
            options={[
              { label: '灵敏', value: 'sensitive' },
              { label: '平衡', value: 'balanced' },
              { label: '稳健', value: 'robust' },
            ]}
            value={config.interruptionSensitivity || 'balanced'}
            onChange={(event) => updateField('interruptionSensitivity', event.target.value as BotConfiguration['interruptionSensitivity'])}
          />
          <TagInput
            label="有效短回复词"
            tags={config.validShortReplyWords ?? ['是', '对', '嗯', '好', '行']}
            onChange={(words) => updateField('validShortReplyWords', words)}
          />
          <TagInput
            label="强制打断词"
            tags={config.forceInterruptWords ?? config.emergencyStopWords ?? ['停', '等一下', '先别说']}
            onChange={(words) => updateField('forceInterruptWords', words)}
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <Label label="打断后话术" />
            <button
              type="button"
              onClick={() => addSpeechItem('forceInterruptReply')}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-primary transition-colors hover:bg-sky-50"
            >
              <Plus size={12} /> 添加话术
            </button>
          </div>
          <div className="space-y-2">
            {normalizeSpeechList(getSpeechValue('forceInterruptReply')).map((speech, index, items) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  className="h-10 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
                  value={speech}
                  onChange={(event) => updateSpeechItem('forceInterruptReply', index, event.target.value)}
                />
                <button
                  type="button"
                  aria-label="删除打断后话术"
                  onClick={() => removeSpeechItem('forceInterruptReply', index)}
                  disabled={items.length <= 1}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </StrategyCard>

      <StrategyCard title="首响连接词" icon={<Volume2 size={18} />}>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 mr-3 shadow-sm text-primary">
                <MessageSquare size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">启用首响连接词</div>
                <div className="text-[11px] text-slate-500">LLM/TTS 未及时就绪时，先播短连接词降低等待感</div>
              </div>
            </div>
            <Switch
              label=""
              checked={firstResponseFillerConfig.enabled}
              onChange={(v) => updateFirstResponseFillerConfig({ enabled: v })}
            />
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${!firstResponseFillerConfig.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="lg:col-span-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 h-full">
                <Label label="触发时间" tooltip="用户说完后，如果正式回复还没准备好，到达该时间才播放连接词。" />
                <div className="mt-3 flex items-center bg-slate-50 rounded-lg border border-slate-200 px-2 w-fit shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
                  <input
                    type="number"
                    min="100"
                    max="3000"
                    step="100"
                    className="w-24 h-10 text-sm font-bold text-center bg-transparent outline-none"
                    value={firstResponseFillerConfig.triggerDelayMs}
                    onChange={(e) => updateFirstResponseFillerConfig({
                      triggerDelayMs: Math.max(100, Math.min(3000, parseInt(e.target.value) || 500)),
                    })}
                  />
                  <span className="text-[10px] font-bold text-slate-400 uppercase pr-1">ms</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                  默认 500ms；如果 LLM 已有输出就不播连接词。连接词一旦开始播放，必须播完后再播 LLM 的正式 TTS。
                </p>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5 h-full">
                <div className="flex items-center justify-between mb-3">
                  <Label label="连接词列表" tooltip="默认：稍等、我看下、稍等下。建议保持短句、低语义。" />
                  <button
                    onClick={addFirstResponsePhrase}
                    className="text-primary text-xs flex items-center hover:underline bg-white px-2 py-1 rounded-full border border-sky-100 transition-colors font-bold"
                  >
                    <Plus size={12} className="mr-1" />
                    添加连接词
                  </button>
                </div>

                <div className="space-y-2">
                  {firstResponseFillerConfig.phrases.map((phrase, index) => (
                    <div key={`${index}-${phrase}`} className="flex items-center gap-2">
                      <input
                        className="flex-1 h-10 px-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                        value={phrase}
                        placeholder="请输入短连接词"
                        onChange={(e) => updateFirstResponsePhrase(index, e.target.value)}
                      />
                      <button
                        onClick={() => removeFirstResponsePhrase(index)}
                        disabled={firstResponseFillerConfig.phrases.length <= 1}
                        className="w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:bg-white transition-colors flex items-center justify-center"
                        title="删除连接词"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </div>
      </StrategyCard>

      <StrategyCard title="转人工策略" icon={<Headset size={18} />}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-6">
            <SubSection title="触发条件">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 mr-3 shadow-sm text-primary">
                    <Search size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">意图识别转人工</div>
                    <div className="text-[11px] text-slate-500">包含默认语义识别及下方自定义关键词</div>
                  </div>
                </div>
                <Switch label="" checked={config.transferIntentDefaultEnabled} onChange={(v) => updateField('transferIntentDefaultEnabled', v)} />
              </div>
              
              {config.transferIntentDefaultEnabled && (
                <div className="bg-white p-4 border border-slate-100 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                     <Label label="自定义转人工关键词" tooltip="添加特定的词汇来强制触发转人工流程" />
                  </div>
                  <TagInput 
                    label="" 
                    placeholder="输入词汇后回车..." 
                    tags={config.transferCustomIntents} 
                    onChange={(tags) => updateField('transferCustomIntents', tags)} 
                  />
                  
                  <div className="mt-4 pt-3 border-t border-dashed border-gray-100 flex items-center justify-between">
                     <div className="text-xs text-slate-500 flex flex-col">
                        <span className="font-bold text-slate-700">意图确认阈值</span>
                        <span className="scale-90 origin-left opacity-70">连续识别到 N 次才执行动作</span>
                     </div>
                     <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 px-1">
                        <button 
                          className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-primary disabled:opacity-30"
                          onClick={() => updateField('transferIntentThreshold', Math.max(1, (config.transferIntentThreshold || 1) - 1))}
                          disabled={config.transferIntentThreshold <= 1}
                        >-</button>
                        <input 
                           className="w-8 text-center bg-transparent text-xs font-bold outline-none" 
                           value={config.transferIntentThreshold || 1} 
                           readOnly 
                        />
                        <button 
                          className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-primary disabled:opacity-30"
                          onClick={() => updateField('transferIntentThreshold', Math.min(5, (config.transferIntentThreshold || 1) + 1))}
                          disabled={config.transferIntentThreshold >= 5}
                        >+</button>
                     </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 mt-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 mr-3 shadow-sm text-primary">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">场景识别转人工</div>
                    <div className="text-[11px] text-slate-500">当检测到特定场景时自动转接人工</div>
                  </div>
                </div>
                <Switch label="" checked={config.transferSceneEnabled || false} onChange={(v) => updateField('transferSceneEnabled', v)} />
              </div>
              
              {config.transferSceneEnabled && (
                <div className="bg-white p-4 border border-slate-100 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                     <Label label="转人工场景" tooltip="添加特定场景，当检测到这些场景时自动转接人工" />
                     <button 
                       onClick={() => {
                         const newScene = {
                           id: Date.now().toString(),
                           scene: '',
                           description: ''
                         };
                         updateField('transferScenes', [...(config.transferScenes || []), newScene]);
                       }}
                       className="text-primary text-xs flex items-center hover:underline bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100 transition-colors font-bold"
                     >
                       <Plus size={12} className="mr-1" />
                       添加场景
                     </button>
                  </div>
                  
                  <div className="space-y-3">
                    {config.transferScenes?.map((scene) => (
                      <div key={scene.id} className="flex flex-col space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between">
                          <input 
                            type="text" 
                            className="w-1/3 px-3 py-1 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                            placeholder="场景名称（四五个字）"
                            value={scene.scene}
                            onChange={(e) => {
                              const updatedScenes = config.transferScenes?.map(s => 
                                s.id === scene.id ? { ...s, scene: e.target.value } : s
                              );
                              updateField('transferScenes', updatedScenes);
                            }}
                          />
                          <button 
                            onClick={() => {
                              const updatedScenes = config.transferScenes?.filter(s => s.id !== scene.id);
                              updateField('transferScenes', updatedScenes);
                            }}
                            className="text-slate-300 hover:text-red-500 shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <textarea 
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none resize-none h-16"
                          placeholder="详细场景描述"
                          value={scene.description}
                          onChange={(e) => {
                            const updatedScenes = config.transferScenes?.map(s => 
                              s.id === scene.id ? { ...s, description: e.target.value } : s
                            );
                            updateField('transferScenes', updatedScenes);
                          }}
                        />
                      </div>
                    ))}
                    {(!config.transferScenes || config.transferScenes.length === 0) && (
                      <div className="text-[10px] text-slate-400 text-center py-4">
                        暂无场景，请点击上方"添加场景"按钮添加
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-dashed border-gray-100">
                    <div className="text-xs text-slate-500">
                      <span className="font-bold text-slate-700">示例场景：</span>
                      <span className="bg-slate-100 px-2 py-1 rounded">加微信被拒绝</span>
                      <span className="text-[10px] text-slate-400 ml-2">机器人申请添加客户微信，当客户表示拒绝时</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 transition-opacity ${config.transferConditionDurationEnabled ? 'opacity-40' : 'opacity-100'}`}>
                   <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm text-slate-500">
                        <RotateCcw size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">最大轮次限制</span>
                        <div className="flex items-center mt-1 space-x-1">
                          <input 
                            type="number" 
                            disabled={config.transferConditionDurationEnabled}
                            className="w-12 h-7 px-1 text-xs border border-gray-200 rounded text-center font-bold focus:border-primary outline-none disabled:bg-gray-100" 
                            value={config.transferConditionRounds} 
                            onChange={(e) => updateField('transferConditionRounds', Math.max(1, parseInt(e.target.value) || 1))}
                          />
                          <span className="text-[10px] text-slate-400">轮自动转接</span>
                        </div>
                      </div>
                   </div>
                   <Switch 
                      label="" 
                      checked={config.transferConditionRoundsEnabled} 
                      onChange={(v) => {
                        updateField('transferConditionRoundsEnabled', v);
                        if (v) updateField('transferConditionDurationEnabled', false);
                      }} 
                   />
                </div>

                <div className={`flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 transition-opacity ${config.transferConditionRoundsEnabled ? 'opacity-40' : 'opacity-100'}`}>
                   <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm text-slate-500">
                        <Clock size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">最大通话时长</span>
                        <div className="flex items-center mt-1 space-x-1">
                          <input 
                            type="number" 
                            disabled={config.transferConditionRoundsEnabled}
                            className="w-12 h-7 px-1 text-xs border border-gray-200 rounded text-center font-bold focus:border-primary outline-none disabled:bg-gray-100" 
                            value={config.transferConditionDuration} 
                            onChange={(e) => updateField('transferConditionDuration', Math.max(1, parseInt(e.target.value) || 1))}
                          />
                          <span className="text-[10px] text-slate-400">秒自动转接</span>
                        </div>
                      </div>
                   </div>
                   <Switch 
                      label="" 
                      checked={config.transferConditionDurationEnabled} 
                      onChange={(v) => {
                        updateField('transferConditionDurationEnabled', v);
                        if (v) updateField('transferConditionRoundsEnabled', false);
                      }} 
                   />
                </div>
              </div>
            </SubSection>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-sky-50 rounded-2xl p-6 border border-sky-100 h-full">
              <Label label="引导话术" tooltip="转接成功前播放的安抚话术" required />
              <textarea 
                className="w-full h-32 px-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none bg-white leading-relaxed mb-6"
                value={config.transferSpeech}
                onChange={(e) => updateField('transferSpeech', e.target.value)}
                placeholder="例如：为了更好地帮您处理问题，正为您转接人工客服，请稍后。"
              />
              
              <div className="pt-6 border-t border-sky-200/50">
                <Label label="目标 IVR 队列" required />
                <Select 
                  label="" 
                  options={[
                    { label: '默认通用技能组', value: 'ivr_default_queue' },
                    { label: '专家坐席组', value: 'ivr_expert' },
                    { label: '投诉建议专线', value: 'ivr_complaint' }
                  ]} 
                  value={config.transferIvrTarget} 
                  onChange={(e) => updateField('transferIvrTarget', e.target.value)} 
                />
              </div>
            </div>
          </div>
        </div>
      </StrategyCard>

      <StrategyCard title="挂机策略" icon={<PhoneOff size={18} />}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-6">
            <SubSection title="终止条件">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 mr-3 shadow-sm text-green-500">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">业务闭环挂机</div>
                    <div className="text-[11px] text-slate-500">当收集到所有必需信息后，AI 主动道别挂机</div>
                  </div>
                </div>
                <Switch label="" checked={config.hangupIntentDefaultEnabled} onChange={(v) => updateField('hangupIntentDefaultEnabled', v)} />
              </div>
              
              <div className={`bg-white p-4 border border-slate-100 rounded-xl shadow-sm mb-4 ${!config.hangupIntentDefaultEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                   <Label label="负向意图库 (黑名单)" tooltip="识别到明确拒绝、辱骂词汇时强制挂机" />
                </div>
                <TagInput 
                  label="" 
                  placeholder="如：滚、不需要..." 
                  tags={config.hangupCustomIntents} 
                  onChange={(tags) => updateField('hangupCustomIntents', tags)} 
                  disabled={!config.hangupIntentDefaultEnabled}
                />

                <div className="mt-4 pt-3 border-t border-dashed border-gray-100 flex items-center justify-between">
                   <div className="text-xs text-slate-500 flex flex-col">
                      <span className="font-bold text-slate-700">意图确认阈值</span>
                      <span className="scale-90 origin-left opacity-70">连续识别到 N 次才执行动作</span>
                   </div>
                   <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 px-1">
                      <button 
                        className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-primary disabled:opacity-30"
                        onClick={() => updateField('hangupIntentThreshold', Math.max(1, (config.hangupIntentThreshold || 1) - 1))}
                        disabled={config.hangupIntentThreshold <= 1}
                      >-</button>
                      <input 
                         className="w-8 text-center bg-transparent text-xs font-bold outline-none" 
                         value={config.hangupIntentThreshold || 1} 
                         readOnly 
                      />
                      <button 
                        className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-primary disabled:opacity-30"
                        onClick={() => updateField('hangupIntentThreshold', Math.min(5, (config.hangupIntentThreshold || 1) + 1))}
                        disabled={config.hangupIntentThreshold >= 5}
                      >+</button>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 transition-opacity ${config.hangupConditionDurationEnabled ? 'opacity-40' : 'opacity-100'}`}>
                   <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm text-slate-500">
                        <RotateCcw size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">最大轮次限制</span>
                        <div className="flex items-center mt-1 space-x-1">
                          <input 
                            type="number" 
                            disabled={config.hangupConditionDurationEnabled}
                            className="w-12 h-7 px-1 text-xs border border-gray-200 rounded text-center font-bold focus:border-primary outline-none disabled:bg-gray-100" 
                            value={config.hangupConditionRounds} 
                            onChange={(e) => updateField('hangupConditionRounds', Math.max(1, parseInt(e.target.value) || 1))}
                          />
                          <span className="text-[10px] text-slate-400">轮自动挂机</span>
                        </div>
                      </div>
                   </div>
                   <Switch 
                      label="" 
                      checked={config.hangupConditionRoundsEnabled} 
                      onChange={(v) => {
                        updateField('hangupConditionRoundsEnabled', v);
                        if (v) updateField('hangupConditionDurationEnabled', false);
                      }} 
                   />
                </div>

                <div className={`flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 transition-opacity ${config.hangupConditionRoundsEnabled ? 'opacity-40' : 'opacity-100'}`}>
                   <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm text-slate-500">
                        <Clock size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">最大通话时长</span>
                        <div className="flex items-center mt-1 space-x-1">
                          <input 
                            type="number" 
                            disabled={config.hangupConditionRoundsEnabled}
                            className="w-12 h-7 px-1 text-xs border border-gray-200 rounded text-center font-bold focus:border-primary outline-none disabled:bg-gray-100" 
                            value={config.hangupConditionDuration} 
                            onChange={(e) => updateField('hangupConditionDuration', Math.max(1, parseInt(e.target.value) || 1))}
                          />
                          <span className="text-[10px] text-slate-400">秒自动挂机</span>
                        </div>
                      </div>
                   </div>
                   <Switch 
                      label="" 
                      checked={config.hangupConditionDurationEnabled} 
                      onChange={(v) => {
                        updateField('hangupConditionDurationEnabled', v);
                        if (v) updateField('hangupConditionRoundsEnabled', false);
                      }} 
                   />
                </div>
              </div>
            </SubSection>
          </div>

          <div className="lg:col-span-5">
             <div className="bg-sky-50 rounded-2xl p-6 border border-sky-100 h-full">
                <div className="flex items-center space-x-2 mb-4">
                   <MessageSquare size={16} className="text-primary" />
                   <span className="text-xs font-bold uppercase tracking-wider text-slate-500">礼貌结语</span>
                </div>
                <textarea 
                  className="w-full h-32 px-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none bg-white leading-relaxed"
                  value={config.hangupSpeech}
                  onChange={(e) => updateField('hangupSpeech', e.target.value)}
                  placeholder="例如：感谢您的接听，有任何需要欢迎随时联系我们，祝您生活愉快，再见。"
                />
             </div>
          </div>
        </div>
      </StrategyCard>

      <StrategyCard title="特殊话术" icon={<MessageSquare size={18} />}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderSpeechList('channelCheckSpeech', '通道确认话术', '例如：我在的，请继续说。')}
          {renderSpeechList('unclearSpeech', '未听清话术', '例如：抱歉，没太听清，您可以再说一遍吗？')}
        </div>
      </StrategyCard>

      <StrategyCard title="全局静默播音" icon={<UserX size={18} />}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm text-slate-500">
                    <Clock size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">静默等待</div>
                    <div className="text-[11px] text-slate-500 mt-1">多久没说话就播一次提醒</div>
                  </div>
                </div>
                <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
                  <input 
                    type="number" 
                    min="1" max="60"
                    className="w-16 h-10 text-sm font-bold text-center outline-none" 
                    value={config.noAnswerInterval} 
                    onChange={(e) => updateField('noAnswerInterval', Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))} 
                  />
                    <span className="text-[10px] font-bold text-slate-400 uppercase pr-1">秒</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm text-slate-500">
                    <RotateCcw size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">追问上限</div>
                    <div className="text-[11px] text-slate-500 mt-1">连续静默多少次后结束当前策略</div>
                  </div>
                </div>
                <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
                  <input 
                    type="number" 
                    min="1" max="10"
                    className="w-16 h-10 text-sm font-bold text-center outline-none" 
                    value={config.noAnswerMaxRepeats} 
                    onChange={(e) => updateField('noAnswerMaxRepeats', Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))} 
                  />
                    <span className="text-[10px] font-bold text-slate-400 uppercase pr-1">次</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-5">
             <div className="bg-sky-50 rounded-2xl p-6 border border-sky-100 h-full">
                <div className="flex items-center space-x-2 mb-4">
                   <MessageSquare size={16} className="text-primary" />
                   <span className="text-xs font-bold uppercase tracking-wider text-slate-500">静默话术</span>
                </div>
                <textarea 
                  className="w-full h-32 px-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none bg-white leading-relaxed"
                  value={config.noAnswerSpeech}
                  onChange={(e) => updateField('noAnswerSpeech', e.target.value)}
                  placeholder="例如：我还在线，您方便继续说一下吗？"
                />
             </div>
          </div>
        </div>
      </StrategyCard>

      <StrategyCard title="全局超时播音" icon={<Clock size={18} />}>
        <div className="space-y-5">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 mr-3 shadow-sm text-primary">
                <Clock size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">启用超时播音</div>
              </div>
            </div>
            <Switch label="" checked={config.globalTimeoutEnabled || false} onChange={(v) => updateField('globalTimeoutEnabled', v)} />
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${!config.globalTimeoutEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="lg:col-span-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <Label label="超时时长（秒）" />
                <div className="mt-3 flex items-center bg-slate-50 rounded-lg border border-slate-200 px-2">
                  <input
                    type="number"
                    min="1"
                    max="3600"
                    className="w-20 h-10 text-sm font-bold text-center bg-transparent outline-none"
                    value={config.globalTimeoutSeconds || 60}
                    onChange={(e) => updateField('globalTimeoutSeconds', Math.max(1, Math.min(3600, parseInt(e.target.value) || 1)))}
                  />
                  <span className="text-[10px] font-bold text-slate-400 uppercase pr-1">秒</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
                <Label label="超时话术" />
                <textarea
                  className="mt-3 w-full h-24 px-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none bg-white leading-relaxed"
                  value={config.globalTimeoutSpeech || ''}
                  onChange={(e) => updateField('globalTimeoutSpeech', e.target.value)}
                  placeholder="例如：本次服务时间较长，我先为您结束通话，您稍后可以再次来电。"
                />
              </div>
            </div>
          </div>
        </div>
      </StrategyCard>

      <StrategyCard title="长业务内容智能等待" icon={<Clock size={18} />}>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 mr-3 shadow-sm text-primary">
                <Clock size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">启用长业务内容智能等待</div>
                <div className="text-[11px] text-slate-500">客户在表述订单号、编号等长内容时，中间可能出现停顿。开启后，机器人会延长等待时间，避免误判为已说完。</div>
              </div>
            </div>
            <Switch label="" checked={config.longContentSmartWaitEnabled || false} onChange={(v) => updateField('longContentSmartWaitEnabled', v)} />
          </div>
          
          {config.longContentSmartWaitEnabled && (
            <div className="bg-white p-6 border border-slate-100 rounded-xl shadow-sm">
              <div>
                <Label label="长业务内容场景" tooltip="填写可能出现长内容停顿的场景" />
                <textarea 
                  className="w-full h-20 px-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none bg-white leading-relaxed mt-2"
                  value={config.longContentScenarios || ''}
                  onChange={(e) => updateField('longContentScenarios', e.target.value)}
                  placeholder="例如：
1. 物流场景：查询订单号（示例：123455666）
2. 金融场景：报身份证号（示例：110101199001011234）
3. 支付场景：报银行卡号（示例：6222021234567890123）
4. 客服场景：报会员号（示例：VIP12345678）"
                />
              </div>
            </div>
          )}
        </div>
      </StrategyCard>

      <StrategyCard title="异常处理" icon={<AlertTriangle size={18} />}>
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Select
              label="全局兜底动作"
              options={[
                { label: '继续通话', value: 'continue' },
                { label: '转人工', value: 'transfer' },
                { label: '挂机', value: 'hangup' },
              ]}
              value={globalExceptionPolicy.fallbackAction}
              onChange={(event) => updateGlobalExceptionPolicy({ fallbackAction: event.target.value as NonNullable<BotConfiguration['globalExceptionPolicy']>['fallbackAction'] })}
            />
            {globalExceptionPolicy.fallbackAction === 'transfer' ? (
              <Select
                label="目标 IVR"
                options={[
                  { label: '通用人工队列', value: 'ivr_general_queue' },
                  { label: '高风险专员', value: 'ivr_risk_specialist' },
                  { label: '投诉处理队列', value: 'ivr_complaint' },
                ]}
                value={globalExceptionPolicy.fallbackIvrTarget || 'ivr_general_queue'}
                onChange={(event) => updateGlobalExceptionPolicy({ fallbackIvrTarget: event.target.value })}
              />
            ) : <div />}
            <div>
              <Label label="连续异常上限" />
              <input
                type="number"
                min={1}
                max={5}
                value={globalExceptionPolicy.maxConsecutiveErrors}
                onChange={(event) => updateGlobalExceptionPolicy({ maxConsecutiveErrors: Math.max(1, Math.min(5, Number(event.target.value) || 1)) })}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <SpeechListEditor
            label="异常兜底话术"
            value={globalExceptionPolicy.fallbackSpeeches}
            placeholder="例如：抱歉，当前服务出现异常，我帮您转接人工客服。"
            onChange={(fallbackSpeeches) => updateGlobalExceptionPolicy({ fallbackSpeeches })}
          />
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            节点配置了异常处理时优先执行节点策略，否则使用这里的全局策略。
          </div>
        </div>
      </StrategyCard>

      <StrategyCard title="安全护栏" icon={<ShieldCheck size={18} />}>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 mr-3 shadow-sm text-primary">
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">协议护栏</div>
                <div className="text-[11px] text-slate-500">已启用</div>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">固定开启</span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              label="敏感信息处理"
              options={[
                { label: '部分掩码', value: 'mask' },
                { label: '直接阻断', value: 'block' },
                { label: '验证后播报', value: 'verified' },
              ]}
              value={safetyGuardrailConfig.sensitiveInfoMode}
              onChange={(event) => updateSafetyGuardrailConfig({ sensitiveInfoMode: event.target.value as NonNullable<BotConfiguration['safetyGuardrailConfig']>['sensitiveInfoMode'] })}
            />
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-xs font-bold text-slate-700">控制标签处理</div>
              <div className="mt-2 text-xs leading-5 text-slate-500">think、sync、Transfer、Hangup 不会进入 TTS；旧标签仅作为动作兼容格式。</div>
            </div>
          </div>

          <div className="bg-white p-6 border border-slate-100 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <Label label="业务禁答规则" tooltip="命中后阻断原回答并执行指定处理" />
                <button 
                  onClick={() => {
                    const newWord = {
                      id: Date.now().toString(),
                      word: '',
                      action: 'continue' as const,
                      speech: '',
                    };
                    updateField('securityWords', [...(config.securityWords || []), newWord]);
                  }}
                  className="text-primary text-xs flex items-center hover:underline bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100 transition-colors font-bold"
                >
                  <Plus size={12} className="mr-1" />
                  添加规则
                </button>
              </div>
              
              <div className="space-y-3">
                {config.securityWords?.map((item) => (
                  <div key={item.id} className="flex flex-col space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="grid grid-cols-[minmax(0,1fr)_120px_36px] items-center gap-3">
                      <div className="flex-1">
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                          placeholder="输入触发内容"
                          value={item.word}
                          onChange={(e) => {
                            const updatedWords = config.securityWords?.map(w => 
                              w.id === item.id ? { ...w, word: e.target.value } : w
                            );
                            updateField('securityWords', updatedWords);
                          }}
                        />
                      </div>
                      <select
                        value={item.action || 'continue'}
                        onChange={(event) => {
                          const updatedWords = config.securityWords?.map(w =>
                            w.id === item.id ? { ...w, action: event.target.value as 'continue' | 'transfer' } : w
                          );
                          updateField('securityWords', updatedWords);
                        }}
                        className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none focus:border-primary"
                      >
                        <option value="continue">安全回复</option>
                        <option value="transfer">转人工</option>
                      </select>
                      <button 
                        onClick={() => {
                          const updatedWords = config.securityWords?.filter(w => w.id !== item.id);
                          updateField('securityWords', updatedWords);
                        }}
                        className="text-slate-300 hover:text-red-500 shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={item.speech || ''}
                      onChange={(event) => {
                        const updatedWords = config.securityWords?.map(w =>
                          w.id === item.id ? { ...w, speech: event.target.value } : w
                        );
                        updateField('securityWords', updatedWords);
                      }}
                      className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-primary"
                      placeholder="命中后的安全话术"
                    />
                  </div>
                ))}
                {(!config.securityWords || config.securityWords.length === 0) && (
                  <div className="text-[10px] text-slate-400 text-center py-4">
                    暂无规则
                  </div>
                )}
              </div>
          </div>

          <SpeechListEditor
            label="安全兜底话术"
            value={safetyGuardrailConfig.fallbackSpeeches}
            placeholder="例如：抱歉，这个问题暂时无法处理。"
            onChange={(fallbackSpeeches) => updateSafetyGuardrailConfig({ fallbackSpeeches })}
          />
        </div>
      </StrategyCard>
      
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

export default BotStrategyConfig;
