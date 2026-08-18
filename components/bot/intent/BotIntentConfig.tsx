
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Trash2, Edit3, Target, AlertCircle, 
  GitBranch, X, Save, Crown
} from 'lucide-react';
import { BotIntent, BotConfiguration, ExtractionConfig } from '../../../types';
import { Switch, Input, TagInput, Label } from '../../ui/FormComponents';
import MicroFlowEditor from './MicroFlowEditor';

interface BotIntentConfigProps {
  config: BotConfiguration;
  updateField: <K extends keyof BotConfiguration>(key: K, value: BotConfiguration[K]) => void;
  extractionConfigs?: ExtractionConfig[];
}

const DEFAULT_INTENT: BotIntent = {
  id: '',
  name: '',
  description: '',
  keywords: [],
  systemPrompt: '',
  similarQuestions: [],
  flowCanvas: {
    nodes: [{ id: 'start', type: 'START', subType: 'start', label: '意图触发', x: 50, y: 300 }],
    edges: []
  }
};

export default function BotIntentConfig({ config, updateField, extractionConfigs }: BotIntentConfigProps) {
  const [activeIntentId, setActiveIntentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIntentData, setEditingIntentData] = useState<BotIntent>(DEFAULT_INTENT);
  
  const intents = config.intents || [];
  const activeIntent = intents.find(i => i.id === activeIntentId);

  // Auto-generate Main Flow if router enabled
  useEffect(() => {
    if (config.routerEnabled) {
      const mainFlowExists = intents.find(i => i.id === 'main_flow');
      if (!mainFlowExists) {
        const mainFlow: BotIntent = {
          id: 'main_flow',
          name: '主流程 (Main Flow)',
          description: '机器人的默认主入口流程。',
          keywords: [],
          systemPrompt: '',
          flowCanvas: {
            nodes: [
              { id: 'start', type: 'START', subType: 'start', label: '通话开始', x: 50, y: 300 }
            ],
            edges: []
          }
        };
        updateField('intents', [mainFlow, ...intents]);
      }
    }
  }, [config.routerEnabled, intents, updateField]);

  // --- Handlers ---
  const openModal = (intent?: BotIntent) => {
    if (intent) {
      setEditingIntentData({ ...intent });
    } else {
      setEditingIntentData({ ...DEFAULT_INTENT, id: Date.now().toString() });
    }
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    if (!editingIntentData.name) {
      alert("请输入意图名称");
      return;
    }
    
    // Auto-fill systemPrompt with description if empty, ensuring compatibility
    const intentToSave = {
      ...editingIntentData,
      systemPrompt: editingIntentData.description // Use description as the routing instruction/prompt
    };

    let newIntents = [...intents];
    const index = newIntents.findIndex(i => i.id === intentToSave.id);
    
    if (index >= 0) {
      // Update existing
      newIntents[index] = { ...newIntents[index], ...intentToSave };
    } else {
      // Add new
      newIntents.push(intentToSave);
      setActiveIntentId(intentToSave.id);
    }
    
    updateField('intents', newIntents);
    setIsModalOpen(false);
  };

  const handleDeleteIntent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === 'main_flow') {
      alert("主流程不可删除");
      return;
    }
    if (confirm('确定删除该意图吗？此操作不可恢复。')) {
      const newIntents = intents.filter(i => i.id !== id);
      updateField('intents', newIntents);
      if (activeIntentId === id) setActiveIntentId(null);
    }
  };

  const updateActiveIntentFlow = useCallback((nodes: any[], edges: any[]) => {
    if (!activeIntentId) return;
    const updatedIntents = intents.map(i => 
      i.id === activeIntentId ? { ...i, flowCanvas: { nodes, edges } } : i
    );
    updateField('intents', updatedIntents);
  }, [activeIntentId, intents, updateField]);

  return (
    <div className="flex h-[calc(100vh-280px)] bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      
      {/* Left Sidebar: Intent List */}
      <div className="w-64 bg-slate-50 border-r border-gray-200 flex flex-col shrink-0">
         <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex justify-between items-center mb-3">
               <h3 className="text-sm font-bold text-slate-800">技能列表</h3>
               <div className="scale-75 origin-right">
                 <Switch 
                    label="" 
                    checked={config.routerEnabled} 
                    onChange={(v) => updateField('routerEnabled', v)} 
                 />
               </div>
            </div>
            <button 
               onClick={() => openModal()}
               className="w-full py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-sky-600 transition-all flex items-center justify-center shadow-sm disabled:opacity-50"
               disabled={!config.routerEnabled}
            >
               <Plus size={14} className="mr-1.5" /> 新建意图技能
            </button>
            {!config.routerEnabled && (
               <div className="mt-2 text-[10px] text-amber-600 bg-amber-50 p-2 rounded flex items-start">
                  <AlertCircle size={10} className="mr-1 mt-0.5 shrink-0" />
                  开启后生效，默认进入主流程
               </div>
            )}
         </div>

         <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {intents.map(intent => (
               <div 
                  key={intent.id}
                  onClick={() => setActiveIntentId(intent.id)}
                  className={`px-3 py-3 rounded-lg cursor-pointer transition-all border group relative ${
                     activeIntentId === intent.id 
                       ? 'bg-white border-primary shadow-sm' 
                       : 'bg-transparent border-transparent hover:bg-white hover:border-gray-200'
                  }`}
               >
                  <div className="flex items-center justify-between mb-1">
                     <span className={`text-sm font-bold truncate pr-6 flex items-center ${activeIntentId === intent.id ? 'text-primary' : 'text-slate-700'}`}>
                        {intent.id === 'main_flow' && <Crown size={12} className="mr-1.5 fill-current text-amber-500" />}
                        {intent.name}
                     </span>
                     <div className="absolute right-2 top-3 hidden group-hover:flex bg-white/80 rounded">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openModal(intent); }}
                          className="text-slate-400 hover:text-primary mr-1 p-0.5"
                          title="编辑属性"
                        >
                           <Edit3 size={12} />
                        </button>
                        {intent.id !== 'main_flow' && (
                          <button 
                            onClick={(e) => handleDeleteIntent(intent.id, e)}
                            className="text-slate-400 hover:text-red-500 p-0.5"
                            title="删除"
                          >
                             <Trash2 size={12} />
                          </button>
                        )}
                     </div>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                     {intent.description || '暂无描述'}
                  </div>
                  {/* Status Indicator */}
                  <div className="mt-2 flex items-center space-x-2">
                     <span className="flex items-center text-[9px] text-slate-400 bg-slate-100 px-1.5 rounded">
                        <GitBranch size={8} className="mr-1" /> {intent.flowCanvas?.nodes?.length || 0}
                     </span>
                  </div>
               </div>
            ))}
            
            {intents.length === 0 && (
               <div className="text-center py-8 text-slate-400 text-xs">
                  暂无意图
               </div>
            )}
         </div>
      </div>

      {/* Right Content: Flow Canvas Only */}
      <div className="flex-1 flex flex-col bg-white min-w-0 relative">
         {activeIntent ? (
            <>
               {/* Minimal Header */}
               <div className="h-12 border-b border-gray-100 flex items-center justify-between px-4 shrink-0 bg-slate-50/30">
                  <div className="flex items-center">
                     <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center mr-2">
                        {activeIntent.id === 'main_flow' ? <Crown size={14}/> : <Target size={14} />}
                     </div>
                     <span className="text-sm font-bold text-slate-800">{activeIntent.name}</span>
                     <span className="mx-2 text-slate-300">|</span>
                     <span className="text-xs text-slate-500">流程编排</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => openModal(activeIntent)} 
                      className="text-xs text-primary hover:underline flex items-center"
                    >
                      <Edit3 size={12} className="mr-1" /> 编辑属性
                    </button>
                  </div>
               </div>

               {/* Canvas Area */}
               <div className="flex-1 overflow-hidden relative">
                  {/* KEY FIX: The key prop forces a re-mount when the ID changes */}
                  <div key={activeIntent.id} className="w-full h-full">
                     <MicroFlowEditor 
                        initialNodes={activeIntent.flowCanvas?.nodes || []}
                        initialEdges={activeIntent.flowCanvas?.edges || []}
                        onSave={updateActiveIntentFlow}
                        extractionConfigs={extractionConfigs}
                        labelGroups={config.labelGroups}
                        availableTools={config.agentConfig?.tools || []}
                        availableFunctions={[]}
                     />
                  </div>
               </div>
            </>
         ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
               <Target size={48} className="mb-4 opacity-20" />
               <p className="text-sm">请从左侧选择一个流程进行编排</p>
            </div>
         )}
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                 <h3 className="text-base font-bold text-slate-800 flex items-center">
                    <Target size={16} className="mr-2 text-primary" />
                    {editingIntentData.id && intents.find(i => i.id === editingIntentData.id) ? '编辑意图' : '新建意图'}
                 </h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                 {/* 意图名称 */}
                 <div>
                    <Label label="意图名称" required />
                    <Input 
                       value={editingIntentData.name}
                       onChange={(e) => setEditingIntentData({...editingIntentData, name: e.target.value})}
                       placeholder="例如：售后报修、产品咨询"
                       disabled={editingIntentData.id === 'main_flow'}
                    />
                 </div>
                 
                 {/* 意图描述 */}
                 <div>
                    <Label label="意图描述 (Prompt Context)" required tooltip="模型将根据此描述判断用户意图是否属于该类别。" />
                    <textarea 
                       className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded focus:border-primary outline-none resize-none bg-slate-50"
                       placeholder="例如：当用户询问产品保修政策、设备出现故障需要维修、或者询问维修进度时，进入此意图。"
                       value={editingIntentData.description}
                       onChange={(e) => setEditingIntentData({...editingIntentData, description: e.target.value})}
                    />
                    <p className="text-[11px] text-slate-400 mt-2">提示：描述越具体，识别越准确。该描述将同时作为进入该意图后的初始系统人设上下文。</p>
                 </div>

                 {/* 相似问法 */}
                 <div>
                    <Label 
                       label="相似问法" 
                       tooltip="添加用户可能使用的不同表达方式，帮助模型更准确地识别该意图。"
                    />
                    <SimilarQuestionsInput
                       questions={editingIntentData.similarQuestions || []}
                       onChange={(questions) => setEditingIntentData({...editingIntentData, similarQuestions: questions})}
                       placeholder="输入相似问法后按回车，例如：怎么报修、设备坏了、保修政策"
                    />
                    <p className="text-[11px] text-slate-400 mt-2">
                       已添加 {editingIntentData.similarQuestions?.length || 0} 个相似问法，建议添加 3-10 个
                    </p>
                 </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 bg-slate-50 flex justify-end space-x-3">
                 <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-slate-600 text-sm font-medium hover:bg-white">
                    取消
                 </button>
                 <button onClick={handleSaveModal} className="px-4 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-sky-600 shadow-sm flex items-center">
                    <Save size={14} className="mr-1.5" /> 保存
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}

// --- Similar Questions Input Component ---

interface SimilarQuestionsInputProps {
  questions: string[];
  onChange: (questions: string[]) => void;
  placeholder?: string;
}

const SimilarQuestionsInput: React.FC<SimilarQuestionsInputProps> = ({
  questions,
  onChange,
  placeholder = "输入相似问法后按回车"
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed && !questions.includes(trimmed)) {
        onChange([...questions, trimmed]);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && questions.length > 0) {
      // 删除最后一个
      onChange(questions.slice(0, -1));
    }
  };

  const removeQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full">
      {/* Tags Display */}
      {questions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {questions.map((question, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-100 group hover:bg-blue-100 transition-colors"
            >
              <span className="max-w-[200px] truncate">{question}</span>
              <button
                onClick={() => removeQuestion(index)}
                className="ml-2 text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-primary outline-none bg-slate-50"
      />

      {/* Quick Add Suggestions */}
      {questions.length === 0 && (
        <div className="mt-2">
          <span className="text-[11px] text-slate-400">快速添加示例：</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {['怎么联系客服', '多少钱', '有什么优惠', '如何操作'].map((example) => (
              <button
                key={example}
                onClick={() => onChange([...questions, example])}
                className="text-[11px] px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
              >
                + {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
