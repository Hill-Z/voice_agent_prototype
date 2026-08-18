// 工具编辑页面，替代弹窗实现，包含两个tab：页面配置和体验优化
import React, { useState, useEffect } from 'react';
import { X, Plug, Plus, Trash2, HelpCircle, Music, MessageSquare } from 'lucide-react';
import { AgentTool, ExtractionConfig } from '../../types';
import { Input, Select, Switch, Label } from '../ui/FormComponents';

interface ToolEditPageProps {
  tool?: AgentTool;
  onSave: (tool: AgentTool) => void;
  onClose: () => void;
  extractionConfigs: ExtractionConfig[];
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
    fillerContent: '正在为您查询，请稍候...'
  },
  responseInstruction: '',
  startSpeech: '正在为您查询，请稍候...',
  needReturn: true,
  successSpeech: '查询已完成，结果如下：',
  failureSpeech: '抱歉，查询遇到了问题，请稍后再试或联系人工客服。',
  interruptSpeech: '正在处理中，请稍候，处理完成后我会为您解答。'
};

export default function ToolEditPage({ tool, onSave, onClose, extractionConfigs }: ToolEditPageProps) {
  const [formData, setFormData] = useState<AgentTool>(tool || { ...DEFAULT_TOOL, id: Date.now().toString() });
  const [activeTab, setActiveTab] = useState<'config' | 'experience'>('config');
  const [isToolOptimizationEnabled, setIsToolOptimizationEnabled] = useState<boolean>(true);
  const [timeoutSpeeches, setTimeoutSpeeches] = useState<string[]>(['抱歉让您久等了，查询遇到了一些问题，我为您转接人工客服...', '系统正在努力为您处理中，请稍候...']);
  const [randomSpeeches, setRandomSpeeches] = useState<string[]>(['正在为您查询订单信息，请稍候...', '系统正在处理中，请保持通话...']);
  const [isRandomWaitEnabled, setIsRandomWaitEnabled] = useState<boolean>(true);
  const [timeoutValue, setTimeoutValue] = useState<number>(10);
  const [initialDelay, setInitialDelay] = useState<number>(2);
  const [speechInterval, setSpeechInterval] = useState<number>(3);

  const addTimeoutSpeech = () => {
    setTimeoutSpeeches([...timeoutSpeeches, '']);
  };

  const removeTimeoutSpeech = (index: number) => {
    setTimeoutSpeeches(timeoutSpeeches.filter((_, i) => i !== index));
  };

  const updateTimeoutSpeech = (index: number, value: string) => {
    const newSpeeches = [...timeoutSpeeches];
    newSpeeches[index] = value;
    setTimeoutSpeeches(newSpeeches);
  };

  const addRandomSpeech = () => {
    setRandomSpeeches([...randomSpeeches, '']);
  };

  const removeRandomSpeech = (index: number) => {
    setRandomSpeeches(randomSpeeches.filter((_, i) => i !== index));
  };

  const updateRandomSpeech = (index: number, value: string) => {
    const newSpeeches = [...randomSpeeches];
    newSpeeches[index] = value;
    setRandomSpeeches(newSpeeches);
  };

  // When API ref changes, auto-populate parameters if empty
  const handleRefChange = (refId: string) => {
    const api = extractionConfigs.find(c => c.id === refId);
    let newParams = formData.parameters;
    
    if (api && formData.type === 'API') {
      // Auto generate params from API config
      const apiParams = api.params.map(p => ({
        name: p.key,
        type: 'string', // Default assumption
        description: p.desc || `Parameter for ${p.key}`,
        required: true
      }));
      newParams = apiParams;
    }
    
    setFormData(prev => ({ 
      ...prev, 
      refId, 
      parameters: newParams,
      // Auto-suggest name if empty
      name: prev.name || (api ? `query_${api.name}` : '')
    }));
  };

  const addParameter = () => {
    setFormData(prev => ({
      ...prev,
      parameters: [...prev.parameters, { name: '', type: 'string', description: '', required: true }]
    }));
  };

  const updateParameter = (index: number, updates: Partial<typeof formData.parameters[0]>) => {
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

  const handleSubmit = () => {
    if (!formData.name) return alert("请输入工具/函数名称");
    if (!formData.description) return alert("请输入工具描述，这对于LLM识别至关重要");
    onSave(formData);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Plug size={20} className="mr-2 text-primary" />
          <h1 className="text-lg font-bold text-slate-800">
            {tool ? '编辑智能体工具' : '添加智能体工具'}
          </h1>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'config' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            工具配置
          </button>
          <button
            onClick={() => setActiveTab('experience')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'experience' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            工具调用优化
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'config' && (
          <div className="space-y-8">
            {/* 1. Basic Info */}
            <section className="bg-white p-6 rounded-xl border border-gray-200">
              <h2 className="text-md font-bold text-slate-800 mb-4">基本信息</h2>
              
              <div className="flex items-center space-x-4 mb-4">
                 <div className="flex-1">
                    <Label label="工具类型" required />
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                       {['API', 'SMS'].map(t => (
                         <button
                           key={t}
                           onClick={() => setFormData(prev => ({ ...prev, type: t as any }))}
                           className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                             formData.type === t ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                           }`}
                         >
                           {t === 'API' && '外部接口'}
                           {t === 'SMS' && '发送短信'}
                         </button>
                       ))}
                    </div>
                 </div>
                 
                 {formData.type === 'API' && (
                   <div className="flex-[2]">
                      <Label label="关联 API 配置" required />
                      <Select 
                         options={[{label: '请选择...', value: ''}, ...extractionConfigs.map(c => ({label: c.name, value: c.id}))]}
                         value={formData.refId || ''}
                         onChange={(e) => handleRefChange(e.target.value)}
                      />
                   </div>
                 )}

                 {formData.type === 'SMS' && (
                   <div className="flex-[2]">
                      <Label label="短信模版 ID" required />
                      <Input 
                         placeholder="例如: SMS_123456"
                         value={formData.smsTemplateId || ''}
                         onChange={(e) => setFormData({...formData, smsTemplateId: e.target.value})}
                      />
                   </div>
                 )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                 <div>
                    <Label label="函数名称" required tooltip="LLM 将使用此名称调用工具，建议使用蛇形命名法 (e.g. query_order)" />
                    <Input 
                      className="font-mono text-xs"
                      placeholder="e.g. query_order_status"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                 </div>
                 <div>
                    <Label label="中文别名 (可选)" />
                    <Input 
                      placeholder="e.g. 查询订单"
                    />
                 </div>
              </div>

              <div className="mb-4">
                 <Label label="工具描述" required tooltip="非常重要！告诉大模型在什么场景下应该使用此工具。" />
                 <textarea 
                    className="w-full h-20 px-3 py-2 text-sm border border-slate-300 rounded focus:border-primary outline-none resize-none"
                    placeholder="例如：当用户询问发货状态、物流进度或订单详情时使用此工具。需要提供订单号。"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                 />
              </div>

              {/* New Response Instruction */}
              <div>
                 <Label label="结果回复指引" tooltip="指导大模型在获取到接口数据后，如何向用户播报结果。可包含话术风格或必须播报的字段。" />
                 <textarea 
                    className="w-full h-20 px-3 py-2 text-sm border border-slate-300 rounded focus:border-primary outline-none resize-none bg-blue-50/20"
                    placeholder="例如：请以热情的语气回复，重点播报订单状态和预计到达时间。如果订单已发货，请询问用户是否需要发送物流短信。"
                    value={formData.responseInstruction || ''}
                    onChange={(e) => setFormData({...formData, responseInstruction: e.target.value})}
                 />
              </div>
            </section>

            {/* 2. Parameters */}
            <section className="bg-white p-6 rounded-xl border border-gray-200">
               <div className="flex justify-between items-center mb-4">
                  <h2 className="text-md font-bold text-slate-800">参数定义</h2>
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
                     <div key={idx} className="flex items-start space-x-2 bg-slate-50 p-2 rounded border border-slate-100">
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
                        <div className="w-10 pt-5 text-center">
                           <button onClick={() => removeParameter(idx)} className="text-slate-300 hover:text-red-500">
                              <Trash2 size={14} />
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            </section>
          </div>
        )}

        {activeTab === 'experience' && (
          <section className="space-y-6">
             {/* 总开关控制 */}
             <div className="bg-white p-6 rounded-xl border border-gray-200">
               <div className="flex justify-between items-center">
                 <div>
                   <h2 className="text-md font-bold text-slate-800">工具调用优化</h2>
                   <p className="text-xs text-slate-500 mt-1">控制所有工具调用相关配置是否生效</p>
                 </div>
                 <Switch 
                   label="" 
                   checked={isToolOptimizationEnabled}
                   onChange={(value) => setIsToolOptimizationEnabled(value)}
                 />
               </div>
             </div>

             {isToolOptimizationEnabled && (
               <>
               {/* 工具调用话术配置 */}
               <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-5">
                 <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-gray-100">工具调用话术</h3>
                 
                 <div>
                   <div className="flex items-center gap-2 mb-2">
                     <span className="text-sm font-medium text-slate-700">工具调用开始话术</span>
                     <HelpCircle size={12} className="text-slate-400" />
                   </div>
                   <textarea 
                     value={formData.startSpeech || ''}
                     onChange={(e) => setFormData({...formData, startSpeech: e.target.value})}
                     placeholder="工具开始执行时机器人说的话，如：正在为您查询，请稍候..."
                     className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none bg-slate-50"
                     rows={2}
                   />
                 </div>

                 <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg border border-slate-200">
                   <div className="flex items-center gap-2">
                     <span className="text-sm font-medium text-slate-700">工具是否需要返回结果</span>
                     <HelpCircle size={12} className="text-slate-400" />
                   </div>
                   <Switch 
                     label="" 
                     checked={formData.needReturn !== false}
                     onChange={(value) => setFormData({...formData, needReturn: value})}
                   />
                 </div>
                 <p className="text-xs text-slate-400 -mt-2">关闭后，工具执行完成不会向用户汇报结果（适用于后台记录类工具）</p>

                 {formData.needReturn !== false && (
                   <>
                     <div>
                       <div className="flex items-center gap-2 mb-2">
                         <span className="text-sm font-medium text-slate-700">工具调用成功话术</span>
                         <HelpCircle size={12} className="text-slate-400" />
                       </div>
                       <textarea 
                         value={formData.successSpeech || ''}
                         onChange={(e) => setFormData({...formData, successSpeech: e.target.value})}
                         placeholder="工具执行成功后的回复，如：查询已完成，结果如下："
                         className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none bg-slate-50"
                         rows={2}
                       />
                     </div>

                     <div>
                       <div className="flex items-center gap-2 mb-2">
                         <span className="text-sm font-medium text-slate-700">工具调用失败话术</span>
                         <HelpCircle size={12} className="text-slate-400" />
                       </div>
                       <textarea 
                         value={formData.failureSpeech || ''}
                         onChange={(e) => setFormData({...formData, failureSpeech: e.target.value})}
                         placeholder="工具执行失败后的回复，如：抱歉，查询遇到了问题..."
                         className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none bg-slate-50"
                         rows={2}
                       />
                     </div>
                   </>
                 )}

                 <div>
                   <div className="flex items-center gap-2 mb-2">
                     <span className="text-sm font-medium text-slate-700">调用中客户咨询回复话术</span>
                     <HelpCircle size={12} className="text-slate-400" />
                   </div>
                   <textarea 
                     value={formData.interruptSpeech || ''}
                     onChange={(e) => setFormData({...formData, interruptSpeech: e.target.value})}
                     placeholder="工具执行期间，如果客户插话问问题，机器人如何回复"
                     className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none bg-slate-50"
                     rows={2}
                   />
                   <p className="text-xs text-slate-400 mt-1">工具执行与对话并行，客户可在等待时继续说话</p>
                 </div>
               </div>

               <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-5">
                 <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-gray-100">超时配置</h3>
                 
                 <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2">
                     <span className="text-sm font-medium text-slate-700">强制超时时间</span>
                     <span className="text-red-500">*</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <input 
                       type="number"
                       value={timeoutValue}
                       onChange={(e) => setTimeoutValue(Number(e.target.value))}
                       className="w-20 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                     />
                     <span className="text-sm text-slate-500">秒</span>
                   </div>
                   <p className="text-xs text-slate-400">超过此时强制终止并返回超时提示</p>
                 </div>

                 <div>
                   <div className="flex items-center gap-2 mb-3">
                     <span className="text-sm font-medium text-slate-700">超时提示话术</span>
                     <span className="text-xs text-slate-400">(可选)</span>
                   </div>
                   <div className="space-y-2">
                     {timeoutSpeeches.map((speech, idx) => (
                       <div key={idx} className="relative">
                         <textarea 
                           value={speech}
                           onChange={(e) => updateTimeoutSpeech(idx, e.target.value)}
                           placeholder="输入超时提示话术..."
                           className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none bg-slate-50"
                           rows={2}
                         />
                         <button 
                           onClick={() => removeTimeoutSpeech(idx)}
                           className="absolute right-2 top-2 text-slate-300 hover:text-red-500 p-1"
                         >
                           <Trash2 size={14} />
                         </button>
                       </div>
                     ))}
                   </div>
                   <button 
                     onClick={addTimeoutSpeech}
                     className="text-xs text-primary hover:underline mt-2 font-medium"
                   >
                     + 添加话术
                   </button>
                 </div>
               </div>

               <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-5">
                 <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                   <h3 className="text-sm font-bold text-slate-700">等待互动配置</h3>
                   <div className="flex items-center gap-2">
                     <span className="text-xs text-slate-500">启用随机等待话术</span>
                     <Switch 
                       label="" 
                       checked={isRandomWaitEnabled} 
                       onChange={(value) => setIsRandomWaitEnabled(value)} 
                     />
                   </div>
                 </div>
                 
                 {isRandomWaitEnabled && (
                   <>
                   <div>
                     <div className="flex items-center gap-2 mb-3">
                       <span className="text-sm font-medium text-slate-700">随机话术列表</span>
                     </div>
                     <div className="space-y-2">
                       {randomSpeeches.map((speech, idx) => (
                         <div key={idx} className="relative">
                           <textarea 
                             value={speech}
                             onChange={(e) => updateRandomSpeech(idx, e.target.value)}
                             placeholder="输入工具调用时的随机话术..."
                             className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none bg-slate-50"
                             rows={2}
                           />
                           <button 
                             onClick={() => removeRandomSpeech(idx)}
                             className="absolute right-2 top-2 text-slate-300 hover:text-red-500 p-1"
                           >
                             <Trash2 size={14} />
                           </button>
                         </div>
                       ))}
                     </div>
                     <button 
                       onClick={addRandomSpeech}
                       className="text-xs text-primary hover:underline mt-2 font-medium"
                     >
                       + 添加话术
                     </button>
                   </div>

                   <div className="grid grid-cols-2 gap-6 pt-2">
                     <div className="flex items-center gap-3">
                       <div className="flex items-center gap-1.5">
                         <span className="text-sm font-medium text-slate-700">初始触发延迟</span>
                         <span className="text-red-500">*</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                         <input 
                           type="number"
                           value={initialDelay}
                           onChange={(e) => setInitialDelay(Number(e.target.value))}
                           className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                         />
                         <span className="text-sm text-slate-500">秒</span>
                       </div>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="flex items-center gap-1.5">
                         <span className="text-sm font-medium text-slate-700">话术播放间隔</span>
                         <span className="text-red-500">*</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                         <input 
                           type="number"
                           value={speechInterval}
                           onChange={(e) => setSpeechInterval(Number(e.target.value))}
                           className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                         />
                         <span className="text-sm text-slate-500">秒</span>
                       </div>
                     </div>
                   </div>
                   </>
                 )}
               </div>
               </>
             )}
           </section>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-slate-600 text-sm hover:bg-white transition-colors">
          取消
        </button>
        <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-sky-600 shadow-sm transition-colors">
          保存工具
        </button>
      </div>
    </div>
  );
}
