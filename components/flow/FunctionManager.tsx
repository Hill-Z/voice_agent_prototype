import React, { useEffect, useState } from 'react';
import {
  Plus, Search, Trash2, Edit3, Code, Globe, ChevronRight, ChevronDown,
  Copy, CheckCircle2, X, Settings, Play, ArrowUp, ArrowDown, Shield, Zap, ArrowRight
} from 'lucide-react';
import { FlowFunction, FlowFunctionParameter, BUILT_IN_FUNCTIONS, FunctionCategory } from '../../types';
import { Label, Input } from '../ui/FormComponents';
import {
  getFunctionCatalogStoreEventName,
  loadStoredCustomFunctions,
  saveStoredCustomFunctions,
} from '../../services/functionCatalogStore';

interface FunctionManagerProps {
  functions?: FlowFunction[];
  onSave?: (functions: FlowFunction[]) => void;
}

const DEFAULT_FUNCTION: FlowFunction = {
  id: '',
  name: '',
  description: '',
  parameters: [],
  scope: 'flow',
  isBuiltIn: false,
  category: 'global'
};

export default function FunctionManager({ functions = [], onSave }: FunctionManagerProps) {
  const [customFunctions, setCustomFunctions] = useState<FlowFunction[]>(() =>
    onSave ? functions : loadStoredCustomFunctions(),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingFunction, setEditingFunction] = useState<FlowFunction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategory, setShowCategory] = useState<'all' | 'transition' | 'global'>('all');
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!onSave) return;
    setCustomFunctions(functions);
  }, [functions, onSave]);

  useEffect(() => {
    if (onSave || typeof window === 'undefined') return;
    const syncFromStore = () => setCustomFunctions(loadStoredCustomFunctions());
    syncFromStore();
    const eventName = getFunctionCatalogStoreEventName();
    window.addEventListener(eventName, syncFromStore);
    return () => window.removeEventListener(eventName, syncFromStore);
  }, [onSave]);

  const persistFunctions = (nextFunctions: FlowFunction[]) => {
    setCustomFunctions(nextFunctions);
    if (onSave) {
      onSave(nextFunctions);
      return;
    }
    saveStoredCustomFunctions(nextFunctions);
  };

  const allFunctions = [...BUILT_IN_FUNCTIONS, ...customFunctions];

  const filteredFunctions = allFunctions.filter(fn => {
    const matchesSearch = fn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         fn.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = showCategory === 'all' || fn.category === showCategory;
    return matchesSearch && matchesCategory;
  });

  const transitionFunctions = filteredFunctions.filter(fn => fn.category === 'transition');
  const globalFunctions = filteredFunctions.filter(fn => fn.category === 'global');

  const selectedFunction = allFunctions.find(fn => fn.id === selectedId);

  const handleCreate = () => {
    setEditingFunction({
      ...DEFAULT_FUNCTION,
      id: `custom_${Date.now()}`
    });
    setIsEditing(true);
  };

  const handleEdit = (fn: FlowFunction) => {
    if (fn.isBuiltIn) return;
    setEditingFunction({ ...fn });
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('确定要删除该代码块吗？')) return;
    const nextFunctions = customFunctions.filter(f => f.id !== id);
    persistFunctions(nextFunctions);
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const handleSave = () => {
    if (!editingFunction) return;
    if (!editingFunction.name) {
      alert('请输入代码块名称');
      return;
    }

    const nextFunctions = (() => {
      const exists = customFunctions.find(f => f.id === editingFunction.id);
      if (exists) {
        return customFunctions.map(f => f.id === editingFunction.id ? editingFunction : f);
      }
      return [...customFunctions, editingFunction];
    })();

    persistFunctions(nextFunctions);
    setIsEditing(false);
    setSelectedId(editingFunction.id);
  };

  const handleAddParameter = () => {
    if (!editingFunction) return;
    setEditingFunction({
      ...editingFunction,
      parameters: [
        ...editingFunction.parameters,
        { name: '', type: 'string', description: '', required: false }
      ]
    });
  };

  const handleUpdateParameter = (index: number, updates: Partial<FlowFunctionParameter>) => {
    if (!editingFunction) return;
    const newParams = [...editingFunction.parameters];
    newParams[index] = { ...newParams[index], ...updates };
    setEditingFunction({ ...editingFunction, parameters: newParams });
  };

  const handleDeleteParameter = (index: number) => {
    if (!editingFunction) return;
    setEditingFunction({
      ...editingFunction,
      parameters: editingFunction.parameters.filter((_, i) => i !== index)
    });
  };

  const toggleDescription = (id: string) => {
    const newSet = new Set(expandedDescriptions);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedDescriptions(newSet);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getCategoryIcon = (category: FunctionCategory) => {
    return category === 'transition' ? ArrowRight : Zap;
  };

  const getCategoryColor = (category: FunctionCategory) => {
    return category === 'transition' ? 'green' : 'blue';
  };

  const renderFunctionList = (fns: FlowFunction[], title: string, icon: any, color: string) => {
    if (fns.length === 0) return null;
    const Icon = icon;
    return (
      <div className="px-2 py-2">
        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase mb-2 px-2">
          <Icon size={10} className={`mr-1 text-${color}-500`} />
          {title}
        </div>
        {fns.map(fn => (
          <div
            key={fn.id}
            onClick={() => { setSelectedId(fn.id); setIsEditing(false); }}
            className={`px-3 py-2.5 rounded-lg mb-1 cursor-pointer transition-colors group ${
              selectedId === fn.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-700">{fn.name}</span>
                {fn.isBuiltIn && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[8px] rounded">内置</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {!fn.isBuiltIn && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(fn); }}
                      className="p-1 text-slate-400 hover:text-primary"
                    >
                      <Edit3 size={10} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(fn.id); }}
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                )}
                <Code size={12} className="text-slate-400" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{fn.description}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-full bg-slate-50">
      {/* Left Sidebar - Function List */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800">代码块管理</h2>
            <button
              onClick={handleCreate}
              className="p-1.5 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
              title="新建代码块"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索代码块..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-primary outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="flex bg-slate-100 p-1 rounded mb-2">
            {(['all', 'transition', 'global'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setShowCategory(cat)}
                className={`flex-1 py-1 text-[10px] font-medium rounded transition-colors ${
                  showCategory === cat ? 'bg-white shadow text-primary' : 'text-slate-500'
                }`}
              >
                {cat === 'all' ? '全部' : cat === 'transition' ? '过渡' : '全局'}
              </button>
            ))}
          </div>

        </div>

        {/* Function List */}
        <div className="flex-1 overflow-y-auto">
          {showCategory !== 'global' && renderFunctionList(transitionFunctions.filter(fn => fn.isBuiltIn), '过渡函数 (内置)', ArrowRight, 'green')}
          {showCategory !== 'global' && renderFunctionList(transitionFunctions.filter(fn => !fn.isBuiltIn), '过渡函数 (自定义)', ArrowRight, 'green')}
          {showCategory !== 'transition' && renderFunctionList(globalFunctions.filter(fn => fn.isBuiltIn), '全局函数 (内置)', Zap, 'blue')}
          {showCategory !== 'transition' && renderFunctionList(globalFunctions.filter(fn => !fn.isBuiltIn), '全局函数 (自定义)', Zap, 'blue')}
          
          {filteredFunctions.length === 0 && (
            <p className="text-[10px] text-slate-400 text-center py-8">暂无匹配的代码块</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {isEditing && editingFunction ? (
          /* Edit Mode */
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800">
                  {customFunctions.find(f => f.id === editingFunction.id) ? '编辑代码块' : '新建代码块'}
                </h2>
                <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-sm font-bold text-slate-700 mb-4">基本信息</h3>
                  <div className="space-y-4">
                    <div>
                      <Label label="代码块名称" required />
                      <Input
                        placeholder="如 save_confirmation_code"
                        value={editingFunction.name}
                        onChange={(e) => setEditingFunction({ ...editingFunction, name: e.target.value })}
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        使用下划线命名，用于 LLM 调用
                      </p>
                    </div>
                    <div>
                      <Label label="代码块描述" required />
                      <textarea
                        className="w-full h-20 px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:border-primary outline-none"
                        placeholder="描述代码块的作用和使用场景，帮助 LLM 理解何时调用..."
                        value={editingFunction.description}
                        onChange={(e) => setEditingFunction({ ...editingFunction, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label label="函数类型" />
                      <div className="flex gap-4">
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:border-green-300 transition-colors flex-1">
                          <input
                            type="radio"
                            checked={editingFunction.category === 'transition'}
                            onChange={() => setEditingFunction({ 
                              ...editingFunction, 
                              category: 'transition',
                              transitionConfig: {
                                canGotoStep: true,
                                canGotoFlow: false,
                                canModifyState: true
                              }
                            })}
                            className="mr-2"
                          />
                          <div>
                            <div className="flex items-center gap-1 text-sm text-slate-700">
                              <ArrowRight size={12} className="text-green-500" />
                              <span className="font-medium">过渡函数</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">用于流程控制，可跳转步骤</p>
                          </div>
                        </label>
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:border-blue-300 transition-colors flex-1">
                          <input
                            type="radio"
                            checked={editingFunction.category === 'global'}
                            onChange={() => setEditingFunction({ 
                              ...editingFunction, 
                              category: 'global',
                              globalConfig: {
                                executionStrategy: 'sync',
                                playFiller: false
                              }
                            })}
                            className="mr-2"
                          />
                          <div>
                            <div className="flex items-center gap-1 text-sm text-slate-700">
                              <Zap size={12} className="text-blue-500" />
                              <span className="font-medium">全局函数</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">用于业务执行，LLM自主调用</p>
                          </div>
                        </label>
                      </div>
                    </div>
                    <div>
                      <Label label="作用域" />
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={editingFunction.scope === 'global'}
                            onChange={() => setEditingFunction({ ...editingFunction, scope: 'global' })}
                            className="mr-2"
                          />
                          <span className="text-sm text-slate-600">全局</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={editingFunction.scope === 'flow'}
                            onChange={() => setEditingFunction({ ...editingFunction, scope: 'flow' })}
                            className="mr-2"
                          />
                          <span className="text-sm text-slate-600">流程级别</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transition Config */}
                {editingFunction.category === 'transition' && (
                  <div className="bg-green-50 rounded-xl border border-green-100 p-6">
                    <h3 className="text-sm font-bold text-green-700 mb-4">过渡函数配置</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingFunction.transitionConfig?.canGotoStep || false}
                          onChange={(e) => setEditingFunction({
                            ...editingFunction,
                            transitionConfig: {
                              ...editingFunction.transitionConfig,
                              canGotoStep: e.target.checked
                            } as any
                          })}
                          className="mr-2"
                        />
                        <span className="text-sm text-slate-600">允许跳转步骤 (flow.goto_step)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingFunction.transitionConfig?.canGotoFlow || false}
                          onChange={(e) => setEditingFunction({
                            ...editingFunction,
                            transitionConfig: {
                              ...editingFunction.transitionConfig,
                              canGotoFlow: e.target.checked
                            } as any
                          })}
                          className="mr-2"
                        />
                        <span className="text-sm text-slate-600">允许跳转流程 (flow.goto_flow)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingFunction.transitionConfig?.canModifyState || false}
                          onChange={(e) => setEditingFunction({
                            ...editingFunction,
                            transitionConfig: {
                              ...editingFunction.transitionConfig,
                              canModifyState: e.target.checked
                            } as any
                          })}
                          className="mr-2"
                        />
                        <span className="text-sm text-slate-600">允许修改状态 (conv.state)</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Global Config */}
                {editingFunction.category === 'global' && (
                  <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
                    <h3 className="text-sm font-bold text-blue-700 mb-4">全局函数配置</h3>
                    <div className="space-y-4">
                      <div>
                        <Label label="执行策略" />
                        <select
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded bg-white"
                          value={editingFunction.globalConfig?.executionStrategy || 'sync'}
                          onChange={(e) => setEditingFunction({
                            ...editingFunction,
                            globalConfig: {
                              ...editingFunction.globalConfig,
                              executionStrategy: e.target.value as 'sync' | 'async'
                            }
                          })}
                        >
                          <option value="sync">同步执行</option>
                          <option value="async">异步执行</option>
                        </select>
                      </div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingFunction.globalConfig?.playFiller || false}
                          onChange={(e) => setEditingFunction({
                            ...editingFunction,
                            globalConfig: {
                              ...editingFunction.globalConfig,
                              playFiller: e.target.checked
                            }
                          })}
                          className="mr-2"
                        />
                        <span className="text-sm text-slate-600">执行时播放等待音</span>
                      </label>
                      {editingFunction.globalConfig?.playFiller && (
                        <div>
                          <Label label="等待音内容" />
                          <Input
                            placeholder="正在处理，请稍候..."
                            value={editingFunction.globalConfig?.fillerContent || ''}
                            onChange={(e) => setEditingFunction({
                              ...editingFunction,
                              globalConfig: {
                                ...editingFunction.globalConfig,
                                fillerContent: e.target.value
                              }
                            })}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Parameters */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-700">参数定义</h3>
                    <button
                      onClick={handleAddParameter}
                      className="text-xs text-primary hover:text-primary/80 flex items-center"
                    >
                      <Plus size={12} className="mr-1" /> 添加参数
                    </button>
                  </div>
                  {editingFunction.parameters.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">暂无参数定义</p>
                  ) : (
                    <div className="space-y-3">
                      {editingFunction.parameters.map((param, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500">参数 {idx + 1}</span>
                            <button
                              onClick={() => handleDeleteParameter(idx)}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              placeholder="参数名"
                              value={param.name}
                              onChange={(e) => handleUpdateParameter(idx, { name: e.target.value })}
                            />
                            <select
                              className="px-3 py-2 text-sm border border-slate-200 rounded bg-white outline-none"
                              value={param.type}
                              onChange={(e) => handleUpdateParameter(idx, { type: e.target.value as any })}
                            >
                              <option value="string">string</option>
                              <option value="number">number</option>
                              <option value="boolean">boolean</option>
                              <option value="object">object</option>
                            </select>
                          </div>
                          <div className="mt-3">
                            <Input
                              placeholder="参数描述"
                              value={param.description}
                              onChange={(e) => handleUpdateParameter(idx, { description: e.target.value })}
                            />
                          </div>
                          <div className="mt-3 flex items-center">
                            <input
                              type="checkbox"
                              checked={param.required}
                              onChange={(e) => handleUpdateParameter(idx, { required: e.target.checked })}
                              className="mr-2"
                              id={`param-required-${idx}`}
                            />
                            <label htmlFor={`param-required-${idx}`} className="text-xs text-slate-600">必填参数</label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Code Editor */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-700">代码实现 (可选)</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    使用 Python 编写代码逻辑。访问 <code className="text-primary bg-slate-100 px-1 py-0.5 rounded">conv</code> 操作对话状态，
                    使用 <code className="text-blue-600 bg-slate-100 px-1 py-0.5 rounded">flow.goto_step()</code> 控制流程跳转。
                  </p>
                  <textarea
                    className="w-full h-48 px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:border-primary outline-none font-mono bg-slate-800 text-emerald-400 leading-relaxed"
                    placeholder={"def my_function(conv, flow, param1):\n    conv.state['my_var'] = param1\n    flow.goto_step('next_step')\n    return"}
                    value={editingFunction.code || ''}
                    onChange={(e) => setEditingFunction({ ...editingFunction, code: e.target.value })}
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
                  >
                    保存代码块
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : selectedFunction ? (
          /* View Mode */
          <>
            <div className="p-6 border-b border-slate-200 bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-slate-800">{selectedFunction.name}</h2>
                    {selectedFunction.isBuiltIn && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">
                        内置
                      </span>
                    )}
                    {selectedFunction.scope === 'global' && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded">
                        全局
                      </span>
                    )}
                    <span className={`px-2 py-0.5 ${
                      selectedFunction.category === 'transition' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    } text-[10px] font-medium rounded flex items-center gap-1`}>
                      {selectedFunction.category === 'transition' ? (
                        <><ArrowRight size={10} /> 过渡函数</>
                      ) : (
                        <><Zap size={10} /> 可见函数</>
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{selectedFunction.description}</p>
                </div>
                <div className="flex gap-2">
                  {!selectedFunction.isBuiltIn && (
                    <>
                      <button
                        onClick={() => handleEdit(selectedFunction)}
                        className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1"
                      >
                        <Edit3 size={12} /> 编辑
                      </button>
                      <button
                        onClick={() => handleDelete(selectedFunction.id)}
                        className="px-3 py-1.5 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 flex items-center gap-1"
                      >
                        <Trash2 size={12} /> 删除
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto">
                {/* Function Signature */}
                <div className="bg-slate-800 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">代码块签名</span>
                    <button
                      onClick={() => copyToClipboard(`${selectedFunction.name}(${selectedFunction.parameters.map(p => p.name).join(', ')})`)}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                    >
                      <Copy size={10} /> 复制
                    </button>
                  </div>
                  <code className="text-sm text-emerald-400 font-mono">
                    {selectedFunction.name}(
                    {selectedFunction.parameters.map((p, i) => (
                      <span key={p.name}>
                        <span className="text-blue-400">{p.name}</span>
                        <span className="text-slate-500">: </span>
                        <span className="text-amber-300">{p.type}</span>
                        {i < selectedFunction.parameters.length - 1 && <span className="text-slate-500">, </span>}
                      </span>
                    ))}
                    )
                  </code>
                </div>

                {/* Parameters */}
                {selectedFunction.parameters.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">参数列表</h3>
                    <div className="space-y-3">
                      {selectedFunction.parameters.map((param, idx) => (
                        <div key={param.name} className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono text-primary">{param.name}</code>
                              <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded">
                                {param.type}
                              </span>
                              {param.required && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-500 rounded">
                                  必填
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{param.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Code Block */}
                {selectedFunction.code && (
                  <div className="bg-slate-800 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">代码实现</span>
                      <button
                        onClick={() => copyToClipboard(selectedFunction.code!)}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                      >
                        <Copy size={10} /> 复制代码
                      </button>
                    </div>
                    <pre className="text-sm text-emerald-400 font-mono overflow-x-auto">
                      <code>{selectedFunction.code}</code>
                    </pre>
                  </div>
                )}

                {/* Context Objects */}
                <div className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-100">
                  <h3 className="text-sm font-bold text-amber-700 mb-3">可用的上下文对象</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <code className="text-primary font-mono bg-amber-100 px-1.5 py-0.5 rounded">conv</code>
                      <span className="text-amber-800">- Conversation 对象，访问对话状态 <code className="text-primary font-mono">conv.state['xxx']</code></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <code className="text-blue-600 font-mono bg-amber-100 px-1.5 py-0.5 rounded">flow</code>
                      <span className="text-amber-800">- Flow 对象，控制流程跳转 <code className="text-blue-600 font-mono">flow.goto_step("step_name")</code></span>
                    </div>
                  </div>
                </div>

                {/* Usage in Prompt */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-700">在提示词中引用</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    在提示词编辑时，使用 / 符号可以快速插入代码块引用：
                  </p>
                  <div className="bg-slate-50 rounded-lg p-3 font-mono text-xs text-slate-700">
                    <p className="mb-2">当用户确认预约时，调用 <span className="text-primary">/{selectedFunction.name}</span> 代码块</p>
                    <p className="text-slate-400">参数将根据上下文自动填充</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Code size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-400">选择一个代码块查看详情</p>
              <p className="text-xs text-slate-400 mt-1">或点击左上角 + 创建新代码块</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
