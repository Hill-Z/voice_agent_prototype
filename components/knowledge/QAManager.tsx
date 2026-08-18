
import React, { useEffect, useState } from 'react';
import {
  Plus, Search, Download, ArrowRight, X, Volume2, Play, Loader2, Upload, ChevronDown, CheckCircle2, Trash2, Power, PowerOff, ArrowLeft, Wrench
} from 'lucide-react';
import { QAPair, RAGConfig as RAGConfigType, AgentTool } from '../../types';
import { TagInput, Label, Switch as ToggleSwitch } from '../ui/FormComponents';
import RAGConfigPanel from './RAGConfig';
import CategoryListView from './CategoryListView';
import { DEFAULT_RAG_CONFIG } from '../../services/ragService';
import {
  getQATopicStoreEventName,
  loadQACategoryConfigs,
  saveQACategoryConfigs,
} from '../../services/qaTopicStore';

// Mock available tools for binding
const MOCK_AVAILABLE_TOOLS: AgentTool[] = [
  {
    id: 'tool_api_call',
    name: 'API 调用',
    description: '调用外部 API 接口获取数据',
    type: 'API',
    enabled: true
  },
  {
    id: 'tool_sms',
    name: '发送短信',
    description: '向用户发送短信通知',
    type: 'SMS',
    enabled: true
  },
  {
    id: 'tool_query_order',
    name: '查询订单',
    description: '查询用户订单状态',
    type: 'API',
    enabled: true
  },
  {
    id: 'tool_transfer',
    name: '转人工',
    description: '转接人工客服',
    type: 'TRANSFER',
    enabled: true
  }
];

// --- MOCK DATA ---
export const MOCK_QA_PAIRS: QAPair[] = [
  {
    id: '1',
    standardQuestion: '你吃什么',
    similarQuestions: [],
    answer: '是',
    category: '闲聊',
    validityType: 'permanent',
    lastUpdated: 1773134010000,
    isActive: true,
    audioResources: {
      'Azure-Xiaoxiao': 'mock_url_1',
      'Azure-Yunxi': 'mock_url_2'
    }
  },
  {
    id: '2',
    standardQuestion: '你什么工作',
    similarQuestions: [],
    answer: '上班',
    category: '闲聊',
    validityType: 'permanent',
    lastUpdated: 1773133991000,
    isActive: true,
    // No audio resources generated yet
  },
  {
    id: '3',
    standardQuestion: '你在哪',
    similarQuestions: [],
    answer: '北京',
    category: '业务',
    validityType: 'permanent',
    lastUpdated: 1773133985000,
    isActive: false, 
  },
  {
    id: '4',
    standardQuestion: '你是谁?',
    similarQuestions: ['你是干嘛的?', '你是做什么的?', '你叫什么?'],
    answer: '我是顾问',
    category: '业务',
    validityType: 'permanent',
    lastUpdated: 1773133571000,
    isActive: true,
    audioResources: {
      'Azure-Xiaoxiao': 'mock_url_3'
    }
  }
];

// Mock available voices in the system
const ACTIVE_SYSTEM_VOICES = ['Azure-Xiaoxiao', 'Azure-Yunxi', 'Gemini-Voice-Kore'];

export default function QAManager() {
  const [qaPairs, setQaPairs] = useState<QAPair[]>(MOCK_QA_PAIRS);
  const [view, setView] = useState<'CATEGORY_LIST' | 'LIST' | 'FORM'>('CATEGORY_LIST');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(['闲聊', '业务']);
  const [editingItem, setEditingItem] = useState<QAPair | null>(null);
  const [categoryConfigs, setCategoryConfigs] = useState(() => loadQACategoryConfigs());
  
  // Modal States
  const [isBatchTTSOpen, setIsBatchTTSOpen] = useState(false);
  const [activeAudioPopover, setActiveAudioPopover] = useState<string | null>(null); // ID of the row with open audio popover
  
  // Import/Export States
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; fail: number } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<QAPair>>({});

  // Batch TTS State
  const [batchVoices, setBatchVoices] = useState<string[]>(['Azure-Xiaoxiao']);
  const [batchStrategy, setBatchStrategy] = useState<'missing' | 'all'>('missing');
  const [batchScope, setBatchScope] = useState<'active' | 'selected'>('active');
  const [batchProgress, setBatchProgress] = useState<{current: number, total: number} | null>(null);

  // Batch Operations State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchDeleteConfirmOpen, setIsBatchDeleteConfirmOpen] = useState(false);
  const [isBatchToggleConfirmOpen, setIsBatchToggleConfirmOpen] = useState(false);
  const [batchToggleAction, setBatchToggleAction] = useState<'enable' | 'disable'>('enable');

  // RAG Config State
  const [ragConfig, setRagConfig] = useState<RAGConfigType>(DEFAULT_RAG_CONFIG);

  useEffect(() => {
    const storedConfigs = loadQACategoryConfigs();
    setCategoryConfigs(storedConfigs);
    setCategories(storedConfigs.map((item) => item.name));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncCategories = () => {
      const storedConfigs = loadQACategoryConfigs();
      setCategoryConfigs(storedConfigs);
      setCategories(storedConfigs.map((item) => item.name));
    };
    const eventName = getQATopicStoreEventName();
    window.addEventListener(eventName, syncCategories);
    return () => window.removeEventListener(eventName, syncCategories);
  }, []);

  const persistCategoryConfigs = (nextConfigs: typeof categoryConfigs) => {
    setCategoryConfigs(nextConfigs);
    setCategories(nextConfigs.map((item) => item.name));
    saveQACategoryConfigs(nextConfigs);
  };

  const handleCreate = () => {
    setFormData({
      standardQuestion: '',
      similarQuestions: [],
      answer: '',
      category: selectedCategory || '通用',
      validityType: 'permanent',
      isActive: true,
      audioResources: {},
      entryPolicy: 'immediate',
      handoffOnFailure: false,
    });
    setEditingItem(null);
    setView('FORM');
  };

  const handleEdit = (item: QAPair) => {
    setFormData({ ...item });
    setEditingItem(item);
    setView('FORM');
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除该问答对吗？')) {
      setQaPairs(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleSave = () => {
    if (!formData.standardQuestion || !formData.answer) {
      alert('请填写完整标准问题和答案');
      return;
    }

    const newItem: QAPair = {
      id: editingItem ? editingItem.id : Date.now().toString(),
      standardQuestion: formData.standardQuestion!,
      similarQuestions: formData.similarQuestions || [],
      answer: formData.answer!,
      category: formData.category || '通用',
      validityType: formData.validityType || 'permanent',
      validityStart: formData.validityStart,
      validityEnd: formData.validityEnd,
      lastUpdated: Date.now(),
      isActive: formData.isActive ?? true,
      audioResources: formData.audioResources || {},
      toolIds: formData.toolIds || [],
      toolCallMode: formData.toolCallMode || 'sync',
      entryPolicy: formData.entryPolicy || 'immediate',
      handoffOnFailure: formData.handoffOnFailure ?? false,
    };

    setQaPairs(prev => {
      if (editingItem) {
        return prev.map(p => p.id === editingItem.id ? newItem : p);
      }
      return [newItem, ...prev];
    });

    setView('LIST');
  };

  const toggleActive = (id: string, currentStatus: boolean) => {
    setQaPairs(prev => prev.map(p => p.id === id ? { ...p, isActive: !currentStatus } : p));
  };

  // --- Batch Operations Logic ---
  const toggleSelectAll = () => {
    if (selectedIds.size === qaPairs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(qaPairs.map(p => p.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    setQaPairs(prev => prev.filter(p => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
    setIsBatchDeleteConfirmOpen(false);
  };

  const handleBatchToggle = () => {
    if (selectedIds.size === 0) return;
    const newStatus = batchToggleAction === 'enable';
    setQaPairs(prev => prev.map(p => 
      selectedIds.has(p.id) ? { ...p, isActive: newStatus } : p
    ));
    setSelectedIds(new Set());
    setIsBatchToggleConfirmOpen(false);
  };

  // --- Import/Export Logic ---
  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImporting(true);
      // Simulate API processing delay
      setTimeout(() => {
        setIsImporting(false);
        setImportResult({ success: 12, fail: 3 }); // Mock result
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 1500);
    }
  };

  const handleExport = (type: 'full' | 'template') => {
    setIsExportMenuOpen(false);
    if (type === 'full') {
      const link = document.createElement('a');
      link.href = '#';
      link.download = `qa_knowledge_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("模版下载开始...");
    }
  };

  // --- Batch TTS Logic ---
  const startBatchTTS = () => {
    // Simulate API call
    setBatchProgress({ current: 0, total: 100 });
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setBatchProgress({ current: progress, total: 100 });
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
           setBatchProgress(null);
           setIsBatchTTSOpen(false);
           alert("批量生成任务已完成！");
           // Mock update: add mock audio to items without it
           setQaPairs(prev => prev.map(p => {
             if (p.isActive) {
               const resources = { ...p.audioResources };
               batchVoices.forEach(v => {
                 if (!resources[v] || batchStrategy === 'all') {
                   resources[v] = `generated_${Date.now()}`;
                 }
               });
               return { ...p, audioResources: resources };
             }
             return p;
           }));
        }, 500);
      }
    }, 100);
  };

  if (view === 'FORM') {
    return (
      <div className="p-6 max-w-5xl mx-auto w-full pb-20 animate-in fade-in slide-in-from-bottom-2">
         {/* Form Header */}
         <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button onClick={() => setView('LIST')} className="text-xs text-slate-500 hover:text-primary flex items-center transition-colors mr-3 px-2 py-1 rounded hover:bg-slate-100">
                <ArrowRight size={14} className="rotate-180 mr-1" /> 返回
              </button>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">
                {editingItem ? '编辑问答对' : '新建问答对'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
               <span className="text-xs font-medium text-slate-600">启用状态</span>
               <ToggleSwitch label="" checked={formData.isActive ?? true} onChange={(v) => setFormData({...formData, isActive: v})} />
            </div>
         </div>

         <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 space-y-6">
            {/* Standard Question */}
            <div className="max-w-3xl">
               <Label label="标准问题" required />
               <input 
                 className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                 placeholder="例如：你的公司在哪里？"
                 value={formData.standardQuestion}
                 onChange={(e) => setFormData({...formData, standardQuestion: e.target.value})}
               />
               <p className="text-[11px] text-slate-400 mt-1.5 ml-0.5">该问题将作为NLP匹配的核心依据，请尽量简练准确。</p>
            </div>

            {/* Topic */}
            <div className="max-w-3xl">
               <Label label="Topic" required tooltip="用于机器人配置中的知识库过滤和Topic绑定" />
               <div className="relative">
                  <input 
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="例如：闲聊、业务咨询、投诉"
                    list="topic-suggestions"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  />
                  <datalist id="topic-suggestions">
                     <option value="通用" />
                     <option value="闲聊" />
                     <option value="业务" />
                     <option value="产品咨询" />
                     <option value="技术支持" />
                     <option value="投诉建议" />
                     <option value="常见问题" />
                  </datalist>
               </div>
            </div>

            {/* Similar Questions */}
            <div className="max-w-3xl">
               <Label label="相似问题" tooltip="添加语义相近的问法，增加匹配命中率。" />
               <TagInput 
                 label="" 
                 placeholder="输入后回车 (如: 你们在哪办公?)"
                 tags={formData.similarQuestions || []}
                 onChange={(tags) => setFormData({...formData, similarQuestions: tags})}
               />
            </div>

            {/* Answer */}
            <div className="max-w-3xl">
               <div className="flex justify-between items-center mb-2">
                 <Label label="答案内容" required />
                 <div className="flex bg-slate-100 rounded p-0.5 border border-slate-200">
                    <button className="px-2 py-0.5 text-xs font-medium rounded bg-white text-slate-700 shadow-sm border border-slate-200">文本</button>
                    <button className="px-2 py-0.5 text-xs font-medium rounded text-slate-400 hover:text-slate-600">富文本</button>
                 </div>
               </div>
               <textarea 
                 className="w-full h-32 px-3 py-2 text-sm border border-slate-300 rounded focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all leading-relaxed"
                 placeholder="请输入回答内容..."
                 value={formData.answer}
                 onChange={(e) => setFormData({...formData, answer: e.target.value})}
               />
            </div>

            {/* Tool Binding */}
            <div>
               <div className="flex items-center justify-between mb-2">
                 <Label label="绑定工具 (可选)" tooltip="选择后，机器人在回复该问题时可调用这些工具" />
                 {/* 同步/异步切换 */}
                 {(formData.toolIds || []).length > 0 && (
                   <div className="flex items-center gap-2">
                     <span className="text-xs text-slate-500">调用方式:</span>
                     <div className="flex bg-slate-100 rounded p-0.5 border border-slate-200">
                       <button
                         onClick={() => setFormData({...formData, toolCallMode: 'sync' })}
                         className={`px-2 py-0.5 text-xs font-medium rounded transition-all ${
                           (formData.toolCallMode || 'sync') === 'sync'
                             ? 'bg-white text-slate-700 shadow-sm border border-slate-200'
                             : 'text-slate-400 hover:text-slate-600'
                         }`}
                       >
                         同步
                       </button>
                       <button
                         onClick={() => setFormData({...formData, toolCallMode: 'async' })}
                         className={`px-2 py-0.5 text-xs font-medium rounded transition-all ${
                           formData.toolCallMode === 'async'
                             ? 'bg-white text-slate-700 shadow-sm border border-slate-200'
                             : 'text-slate-400 hover:text-slate-600'
                         }`}
                       >
                         异步
                       </button>
                     </div>
                   </div>
                 )}
               </div>
               <div className="flex flex-wrap gap-2 mt-2 max-h-40 overflow-y-auto p-3 bg-slate-50 rounded border border-slate-100">
                 {MOCK_AVAILABLE_TOOLS.map(tool => {
                   const isSelected = (formData.toolIds || []).includes(tool.id);
                   return (
                     <button
                       key={tool.id}
                       onClick={() => {
                         const currentToolIds = formData.toolIds || [];
                         const newToolIds = isSelected
                           ? currentToolIds.filter(id => id !== tool.id)
                           : [...currentToolIds, tool.id];
                         setFormData({...formData, toolIds: newToolIds });
                       }}
                       className={`px-3 py-1.5 text-xs rounded-full flex items-center gap-1.5 transition-colors ${
                         isSelected
                           ? 'bg-primary text-white'
                           : 'bg-white border border-gray-200 text-slate-600 hover:border-primary'
                       }`}
                     >
                       <Wrench size={10} />
                       {tool.name}
                     </button>
                   );
                 })}
               </div>
               {(formData.toolIds || []).length > 0 && (
                 <div className="flex items-center justify-between mt-1.5">
                   <p className="text-[10px] text-slate-400">
                     已绑定 {(formData.toolIds || []).length} 个工具，
                     {(formData.toolCallMode || 'sync') === 'sync' ? '同步调用：等待工具返回后再回复' : '异步调用：先回复用户，后台执行工具'}
                   </p>
                 </div>
               )}
            </div>

            {/* 需求 6：入口策略和失败转人工 */}
            <div className="max-w-3xl border-t border-slate-100 pt-6">
              <h4 className="text-xs font-bold text-slate-700 mb-4">入口策略配置</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label label="入口策略" tooltip="控制问答对的触发方式" />
                  <select
                    value={formData.entryPolicy || 'immediate'}
                    onChange={(e) => setFormData({...formData, entryPolicy: e.target.value as any})}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="immediate">立即回答</option>
                    <option value="after_confirmation">确认后回答</option>
                    <option value="fallback_only">仅作为兜底</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={formData.handoffOnFailure ?? false}
                      onChange={(e) => setFormData({...formData, handoffOnFailure: e.target.checked})}
                      className="rounded border-slate-300"
                    />
                    回答失败时转人工
                  </label>
                </div>
              </div>
            </div>

            {/* Validity */}
            <div>
               <Label label="有效期" />
               <div className="flex space-x-6 mt-2">
                  <label className="flex items-center cursor-pointer group">
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center mr-2 transition-colors ${formData.validityType === 'permanent' ? 'border-primary' : 'border-slate-300'}`}>
                      {formData.validityType === 'permanent' && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                    <input type="radio" className="hidden" checked={formData.validityType === 'permanent'} onChange={() => setFormData({...formData, validityType: 'permanent'})} />
                    <span className="text-sm text-slate-700 group-hover:text-primary transition-colors">永久有效</span>
                  </label>
                  {/* Additional validity options can be added here */}
               </div>
            </div>
         </div>

         {/* Footer Actions */}
         <div className="mt-6 flex items-center space-x-3 max-w-3xl">
            <button onClick={handleSave} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-all shadow-sm">
              保存更改
            </button>
            <button onClick={() => setView('LIST')} className="px-6 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
              取消
            </button>
         </div>
      </div>
    );
  }

  // --- CATEGORY LIST VIEW ---
  if (view === 'CATEGORY_LIST') {
    const getCategoryStats = (category: string) => {
      const items = qaPairs.filter(qa => qa.category === category);
      const activeCount = items.filter(qa => qa.isActive).length;
      const inactiveCount = items.filter(qa => !qa.isActive).length;
      const lastUpdated = items.length > 0 
        ? Math.max(...items.map(qa => qa.lastUpdated || 0))
        : undefined;
      
      return {
        count: items.length,
        lastUpdated,
        activeCount,
        inactiveCount,
      };
    };

    const handleCategoryClick = (category: string) => {
      setSelectedCategory(category);
      setView('LIST');
    };

    const handleAddCategory = (name: string) => {
      if (!categories.includes(name)) {
        persistCategoryConfigs([
          ...categoryConfigs,
          {
            id: `topic_${Date.now()}`,
            name,
            enabled: true,
            topicType: 'qa',
            entryBehavior: 'direct_answer',
          },
        ]);
      }
    };

    const handleEditCategory = (oldName: string, newName: string) => {
      if (oldName === newName) return;
      if (categories.includes(newName)) {
        alert('Topic 名称已存在');
        return;
      }
      
      const nextConfigs = categoryConfigs.map((item) =>
        item.name === oldName ? { ...item, name: newName } : item,
      );
      persistCategoryConfigs(nextConfigs);
      if (selectedCategory === oldName) {
        setSelectedCategory(newName);
      }
      
      // Update category in all QA pairs
      setQaPairs(qaPairs.map(qa => 
        qa.category === oldName ? { ...qa, category: newName } : qa
      ));
    };

    const handleDeleteCategory = (name: string) => {
      persistCategoryConfigs(categoryConfigs.filter((item) => item.name !== name));
      if (selectedCategory === name) {
        setSelectedCategory(null);
        setView('CATEGORY_LIST');
      }
    };

    return (
      <div className="h-full overflow-auto">
        <CategoryListView
          title="问答对 Topic"
          description="选择 Topic 查看和管理问答对"
          categories={categories}
          onCategoryClick={handleCategoryClick}
          onAddCategory={handleAddCategory}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
          getCategoryStats={getCategoryStats}
        >
          {/* RAG Config Panel */}
          <RAGConfigPanel config={ragConfig} onChange={setRagConfig} />
        </CategoryListView>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="p-6 max-w-full mx-auto w-full relative h-full flex flex-col">
      {/* RAG Config Panel */}
      <div className="mb-6">
        <RAGConfigPanel config={ragConfig} onChange={setRagConfig} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setView('CATEGORY_LIST');
              setSelectedCategory(null);
            }}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">{selectedCategory}</h1>
              <span className="text-xs text-slate-400">问答对管理</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
               维护 NLP 知识库，支持批量生成 TTS 语音。
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
           {/* Import Button */}
           <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".xlsx,.csv" />
           <button 
             onClick={triggerImport}
             disabled={isImporting}
             className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-50 hover:text-primary transition-colors flex items-center shadow-sm"
           >
             {isImporting ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Upload size={14} className="mr-1.5" />}
             导入
           </button>

           {/* Export Dropdown */}
           <div className="relative">
              <button 
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-50 hover:text-primary transition-colors flex items-center shadow-sm"
              >
                <Download size={14} className="mr-1.5" /> 导出 <ChevronDown size={12} className="ml-1 opacity-50" />
              </button>
              {isExportMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsExportMenuOpen(false)}></div>
                  <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                     <button onClick={() => handleExport('full')} className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-primary block">全量导出</button>
                     <button onClick={() => handleExport('template')} className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-primary block border-t border-slate-50">下载模版</button>
                  </div>
                </>
              )}
           </div>

           <div className="w-px h-6 bg-slate-200 mx-1 self-center"></div>

           <button 
             onClick={() => setIsBatchTTSOpen(true)}
             className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-50 hover:text-primary transition-colors flex items-center shadow-sm"
           >
             <Volume2 size={14} className="mr-1.5" /> 录音配置
           </button>
           <button 
             onClick={handleCreate}
             className="bg-primary text-white px-4 py-1.5 rounded-md font-medium text-xs hover:bg-sky-600 transition-all flex items-center shadow-sm"
           >
             <Plus size={16} className="mr-1.5" /> 新增
           </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Filters */}
        <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
           <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:border-primary outline-none w-64 bg-white"
                placeholder="搜索标准问题或答案..."
              />
           </div>
           <div className="flex items-center space-x-2">
              {selectedIds.size > 0 && (
                <div className="flex items-center space-x-2 mr-4 animate-in fade-in slide-in-from-right-2">
                  <span className="text-xs text-slate-600">
                    已选择 <span className="font-bold text-primary">{selectedIds.size}</span> 条
                  </span>
                  <div className="h-4 w-px bg-slate-300"></div>
                  <button 
                    onClick={() => { setBatchToggleAction('enable'); setIsBatchToggleConfirmOpen(true); }}
                    className="flex items-center px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 rounded transition-colors"
                  >
                    <Power size={12} className="mr-1" /> 批量启用
                  </button>
                  <button 
                    onClick={() => { setBatchToggleAction('disable'); setIsBatchToggleConfirmOpen(true); }}
                    className="flex items-center px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 rounded transition-colors"
                  >
                    <PowerOff size={12} className="mr-1" /> 批量停用
                  </button>
                  <button 
                    onClick={() => setIsBatchDeleteConfirmOpen(true)}
                    className="flex items-center px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={12} className="mr-1" /> 批量删除
                  </button>
                  <div className="h-4 w-px bg-slate-300"></div>
                  <button 
                    onClick={() => setSelectedIds(new Set())}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    取消选择
                  </button>
                </div>
              )}
              <span className="text-xs text-slate-400 pl-2">
                  共 {qaPairs.length} 条
              </span>
           </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="w-10 px-4 py-3 bg-slate-50">
                   <input 
                     type="checkbox" 
                     className="rounded border-slate-300 text-primary focus:ring-primary/20"
                     checked={selectedIds.size > 0 && selectedIds.size === qaPairs.length}
                     onChange={toggleSelectAll}
                   />
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-1/5">标准问题</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Topic</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-1/4">相似问题</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-1/4">答案预览</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">录音资源</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">更新时间</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {qaPairs.map(item => (
                <tr key={item.id} className={`hover:bg-slate-50 transition-colors group relative ${selectedIds.has(item.id) ? 'bg-blue-50/30' : ''}`}>
                  <td className="px-4 py-3">
                     <input 
                       type="checkbox" 
                       className="rounded border-slate-300 text-primary focus:ring-primary/20"
                       checked={selectedIds.has(item.id)}
                       onChange={() => toggleSelectItem(item.id)}
                     />
                  </td>
                  <td className="px-4 py-3">
                    <div className={`text-sm font-medium ${item.isActive ? 'text-slate-700' : 'text-slate-400'}`}>{item.standardQuestion}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 font-medium">
                       {item.category || '通用'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {item.similarQuestions && item.similarQuestions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.similarQuestions.slice(0, 2).map((q, i) => (
                           <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded border border-transparent ${item.isActive ? 'text-slate-500 bg-slate-100' : 'text-slate-300 bg-slate-50 border-slate-100'}`}>{q}</span>
                        ))}
                        {item.similarQuestions.length > 2 && <span className="text-[10px] text-slate-400 self-center">...</span>}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className={`text-sm truncate max-w-xs ${item.isActive ? 'text-slate-600' : 'text-slate-400'}`} title={item.answer}>
                      {item.answer}
                    </div>
                  </td>
                  
                  {/* Audio Status Column */}
                  <td className="px-4 py-3 relative">
                     <div className="relative inline-block">
                        {item.audioResources && Object.keys(item.audioResources).length > 0 ? (
                          <button 
                             onClick={() => setActiveAudioPopover(activeAudioPopover === item.id ? null : item.id)}
                             className="flex items-center text-blue-600 hover:text-blue-800 transition-colors px-2 py-0.5 bg-blue-50 hover:bg-blue-100 rounded-full border border-blue-100"
                          >
                             <Play size={10} className="fill-current mr-1" />
                             <span className="text-[10px] font-bold">{Object.keys(item.audioResources).length}</span>
                          </button>
                        ) : (
                          <div className="flex items-center text-slate-300" title="仅支持实时TTS">
                             <Volume2 size={14} />
                          </div>
                        )}

                       {/* Popover */}
                       {activeAudioPopover === item.id && (
                          <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded shadow-lg border border-slate-200 z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                             <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-100">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">音频资源</span>
                                <button onClick={() => setActiveAudioPopover(null)}><X size={10} className="text-slate-400 hover:text-slate-600"/></button>
                             </div>
                             
                             <div className="space-y-0.5 mb-2">
                                {item.audioResources && Object.keys(item.audioResources).length > 0 ? (
                                   Object.keys(item.audioResources).map(voice => (
                                     <div key={voice} className="flex justify-between items-center text-xs text-slate-600 hover:bg-slate-50 p-1.5 rounded cursor-pointer group/item">
                                        <span className="truncate max-w-[140px]">{voice}</span>
                                        <Play size={10} className="text-primary opacity-0 group-hover/item:opacity-100" />
                                     </div>
                                   ))
                                ) : (
                                  <div className="text-xs text-slate-400 text-center py-2">无资源</div>
                                )}
                             </div>
                          </div>
                       )}
                     </div>
                  </td>

                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                    {new Date(item.lastUpdated).toLocaleDateString()}
                  </td>
                  
                  {/* Active Switch Column */}
                  <td className="px-4 py-3">
                     <div className="scale-75 origin-left">
                       <ToggleSwitch 
                         label="" 
                         checked={item.isActive} 
                         onChange={(v) => toggleActive(item.id, v)} 
                       />
                     </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end space-x-3 text-xs">
                       <button onClick={() => handleEdit(item)} className="text-primary hover:text-sky-700 font-medium">编辑</button>
                       <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-500 transition-colors">删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch TTS Modal */}
      {isBatchTTSOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-lg shadow-xl w-[480px] overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <h3 className="text-sm font-bold text-slate-800 flex items-center">
                    <Volume2 size={16} className="mr-2 text-primary" />
                    批量录音生成 (Batch TTS)
                 </h3>
                 <button onClick={() => !batchProgress && setIsBatchTTSOpen(false)} className="text-slate-400 hover:text-slate-600 disabled:opacity-50">
                    <X size={16} />
                 </button>
              </div>
              
              <div className="p-6 space-y-6">
                 {batchProgress ? (
                    <div className="py-6 text-center space-y-4">
                       <Loader2 size={32} className="mx-auto text-primary animate-spin" />
                       <div className="space-y-2">
                          <h4 className="text-sm font-bold text-slate-700">正在生成音频文件...</h4>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                             <div 
                                className="bg-primary h-full transition-all duration-200"
                                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                             ></div>
                          </div>
                          <p className="text-xs text-slate-400">
                             进度: {batchProgress.current} / {batchProgress.total}
                          </p>
                       </div>
                    </div>
                 ) : (
                   <>
                      {/* Section 1: Target Voices */}
                      <div>
                         <label className="text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wide">1. 目标音色</label>
                         <div className="space-y-1 max-h-32 overflow-y-auto border border-slate-200 rounded p-2 bg-slate-50">
                            {ACTIVE_SYSTEM_VOICES.map(voice => (
                               <label key={voice} className="flex items-center cursor-pointer hover:bg-slate-100 p-1 rounded">
                                  <input 
                                     type="checkbox" 
                                     className="rounded border-slate-300 text-primary focus:ring-primary/20 mr-2.5 scale-90"
                                     checked={batchVoices.includes(voice)}
                                     onChange={(e) => {
                                        if (e.target.checked) setBatchVoices([...batchVoices, voice]);
                                        else setBatchVoices(batchVoices.filter(v => v !== voice));
                                     }}
                                  />
                                  <span className="text-xs text-slate-700 font-medium">{voice}</span>
                               </label>
                            ))}
                         </div>
                      </div>

                      {/* Section 2: Scope */}
                      <div>
                         <label className="text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wide">2. 覆盖范围</label>
                         <div className="flex space-x-4">
                            <label className="flex items-center cursor-pointer">
                               <input type="radio" checked={batchScope === 'active'} onChange={() => setBatchScope('active')} className="mr-1.5 text-primary scale-90" />
                               <span className="text-xs text-slate-600">所有启用状态的问答</span>
                            </label>
                            <label className={`flex items-center cursor-pointer ${selectedIds.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                               <input 
                                 type="radio" 
                                 checked={batchScope === 'selected'} 
                                 disabled={selectedIds.size === 0}
                                 onChange={() => setBatchScope('selected')} 
                                 className="mr-1.5 text-primary scale-90" 
                               />
                               <span className="text-xs text-slate-600">仅勾选的问答 ({selectedIds.size})</span>
                            </label>
                         </div>
                      </div>

                      {/* Section 3: Strategy */}
                      <div>
                         <label className="text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wide">3. 生成策略</label>
                         <div className="flex flex-col space-y-1.5">
                            <label className="flex items-center cursor-pointer">
                               <input type="radio" checked={batchStrategy === 'missing'} onChange={() => setBatchStrategy('missing')} className="mr-1.5 text-primary scale-90" />
                               <span className="text-xs text-slate-600">增量生成 (仅跳过已存在的录音)</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                               <input type="radio" checked={batchStrategy === 'all'} onChange={() => setBatchStrategy('all')} className="mr-1.5 text-primary scale-90" />
                               <span className="text-xs text-slate-600">强制覆盖 (重新生成所有录音)</span>
                            </label>
                         </div>
                      </div>
                   </>
                 )}
              </div>

              {!batchProgress && (
                 <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
                    <button onClick={() => setIsBatchTTSOpen(false)} className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 text-xs font-medium hover:bg-white">
                       取消
                    </button>
                    <button 
                       onClick={startBatchTTS} 
                       disabled={batchVoices.length === 0}
                       className="px-3 py-1.5 bg-primary text-white rounded text-xs font-bold hover:bg-sky-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       开始任务
                    </button>
                 </div>
              )}
           </div>
        </div>
      )}

      {/* Import Result Modal */}
      {importResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-lg shadow-xl w-80 overflow-hidden p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                 <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">导入完成</h3>
              <p className="text-sm text-slate-500 mb-6">
                 成功导入 <span className="font-bold text-green-600">{importResult.success}</span> 条数据<br/>
                 失败 <span className="font-bold text-red-500">{importResult.fail}</span> 条数据
              </p>
              <button onClick={() => setImportResult(null)} className="w-full py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-sky-600">
                 确定
              </button>
           </div>
        </div>
      )}

      {/* Batch Delete Confirm Modal */}
      {isBatchDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-lg shadow-xl w-96 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                 <h3 className="text-sm font-bold text-slate-800 flex items-center">
                    <Trash2 size={16} className="mr-2 text-red-500" />
                    确认批量删除
                 </h3>
              </div>
              <div className="p-5">
                 <p className="text-sm text-slate-600 mb-2">
                    您确定要删除选中的 <span className="font-bold text-red-500">{selectedIds.size}</span> 条问答对吗？
                 </p>
                 <p className="text-xs text-slate-400">
                    此操作不可撤销，删除后机器人将无法回答这些问题。
                 </p>
              </div>
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
                 <button 
                   onClick={() => setIsBatchDeleteConfirmOpen(false)} 
                   className="px-4 py-2 border border-slate-300 rounded text-slate-600 text-xs font-medium hover:bg-white"
                 >
                    取消
                 </button>
                 <button 
                   onClick={handleBatchDelete}
                   className="px-4 py-2 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-600 shadow-sm"
                 >
                    确认删除
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Batch Toggle Confirm Modal */}
      {isBatchToggleConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-lg shadow-xl w-96 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                 <h3 className="text-sm font-bold text-slate-800 flex items-center">
                    {batchToggleAction === 'enable' ? (
                      <><Power size={16} className="mr-2 text-green-500" /> 确认批量启用</>
                    ) : (
                      <><PowerOff size={16} className="mr-2 text-orange-500" /> 确认批量停用</>
                    )}
                 </h3>
              </div>
              <div className="p-5">
                 <p className="text-sm text-slate-600 mb-2">
                    {batchToggleAction === 'enable' ? (
                      <>您确定要启用选中的 <span className="font-bold text-green-500">{selectedIds.size}</span> 条问答对吗？</>
                    ) : (
                      <>您确定要停用选中的 <span className="font-bold text-orange-500">{selectedIds.size}</span> 条问答对吗？</>
                    )}
                 </p>
                 <p className="text-xs text-slate-400">
                    {batchToggleAction === 'enable' 
                      ? '启用后，机器人将可以回答这些问题。' 
                      : '停用后，机器人将不再回答这些问题，但数据仍保留。'}
                 </p>
              </div>
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
                 <button 
                   onClick={() => setIsBatchToggleConfirmOpen(false)} 
                   className="px-4 py-2 border border-slate-300 rounded text-slate-600 text-xs font-medium hover:bg-white"
                 >
                    取消
                 </button>
                 <button 
                   onClick={handleBatchToggle}
                   className={`px-4 py-2 text-white rounded text-xs font-bold shadow-sm ${
                     batchToggleAction === 'enable' 
                       ? 'bg-green-500 hover:bg-green-600' 
                       : 'bg-orange-500 hover:bg-orange-600'
                   }`}
                 >
                    确认{batchToggleAction === 'enable' ? '启用' : '停用'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
