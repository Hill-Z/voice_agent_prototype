
import React, { useState } from 'react';
import { Edit3, ChevronDown, ArrowUpDown, LayoutList, X, Plus, Database, HelpCircle, Trash2, UserCircle2, BookOpen } from 'lucide-react';
import { Switch, Select, TagInput } from '../ui/FormComponents';
import { LabelGroup, BotConfiguration, ExtractionConfig, ModelType, TagItem, Parameter, ProfileExtractionRule } from '../../types';

// --- Mock Data for Knowledge Base Categories ---
// 这些分类通常来自 QAManager 和 LexiconManager
const QA_CATEGORIES = ['闲聊', '业务', '产品咨询', '技术支持', '投诉建议', '常见问题'];
const LEXICON_CATEGORIES = ['产品名称', '技术术语', '行业概念', '医疗词汇', '公司名', '自定义'];

// --- MultiSelect Dropdown Component ---
interface MultiSelectDropdownProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  tagColor?: 'blue' | 'green';
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ 
  options, 
  selected, 
  onChange, 
  placeholder = '请选择...',
  tagColor = 'blue'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeTag = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== option));
  };

  const tagClass = tagColor === 'green' 
    ? 'bg-green-50 text-green-600 border-green-100' 
    : 'bg-blue-50 text-blue-600 border-blue-100';

  const optionActiveClass = tagColor === 'green'
    ? 'bg-green-50 text-green-700'
    : 'bg-blue-50 text-blue-700';

  return (
    <div className="relative">
      {/* Trigger */}
      <div 
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded bg-white cursor-pointer min-h-[38px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length === 0 ? (
          <span className="text-slate-400">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selected.map(item => (
              <span 
                key={item} 
                className={`px-2 py-0.5 text-xs rounded border ${tagClass} flex items-center`}
                onClick={(e) => e.stopPropagation()}
              >
                {item}
                <X 
                  size={12} 
                  className="ml-1 cursor-pointer hover:opacity-70" 
                  onClick={(e) => removeTag(item, e)}
                />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
            {options.map(option => (
              <div
                key={option}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                  selected.includes(option) ? optionActiveClass : 'text-slate-700'
                }`}
                onClick={() => toggleOption(option)}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selected.includes(option)}
                    onChange={() => {}}
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  {option}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

interface BotBusinessConfigProps {
  config: BotConfiguration;
  updateField: <K extends keyof BotConfiguration>(key: K, value: BotConfiguration[K]) => void;
  onSave: () => void;
  onCancel: () => void;
  extractionConfigs: ExtractionConfig[];
}

const BotBusinessConfig: React.FC<BotBusinessConfigProps> = ({ config, updateField, onSave, onCancel, extractionConfigs }) => {
  const [activeSubTab, setActiveSubTab] = useState<'TAG' | 'SATISFACTION' | 'SUMMARY' | 'INFO_EXTRACTION' | 'USER_PROFILE' | 'KNOWLEDGE'>('TAG');
  const [tagModal, setTagModal] = useState<{ isOpen: boolean, groupId: string, name: string, description: string } | null>(null);

  const groups = config.labelGroups;

  const onUpdate = (newGroups: LabelGroup[]) => {
    updateField('labelGroups', newGroups);
  };

  const addGroup = () => {
    const newGroup: LabelGroup = {
      id: Date.now().toString(),
      name: '新增标签组',
      tags: [],
      enabled: true
    };
    onUpdate([...groups, newGroup]);
  };

  const updateGroup = (id: string, updates: Partial<LabelGroup>) => {
    onUpdate(groups.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const removeGroup = (id: string) => {
    onUpdate(groups.filter(g => g.id !== id));
  };

  const openTagModal = (groupId: string) => {
    setTagModal({ isOpen: true, groupId, name: '', description: '' });
  };

  const handleTagSubmit = () => {
    if (!tagModal || !tagModal.name) return;
    const group = groups.find(g => g.id === tagModal.groupId);
    if (group) {
      const newTag: TagItem = { name: tagModal.name, description: tagModal.description };
      updateGroup(tagModal.groupId, { tags: [...group.tags, newTag] });
    }
    setTagModal(null);
  };

  const removeTag = (groupId: string, tagName: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      updateGroup(groupId, { tags: group.tags.filter(t => t.name !== tagName) });
    }
  };

  // --- Parameter Management (Copied logic from BotBasicConfig) ---
  const addParameter = () => {
    const newParam: Parameter = { id: Date.now().toString(), key: '', description: '', source: 'llm' };
    updateField('parameters', [...config.parameters, newParam]);
  };

  const updateParameter = (id: string, key: keyof Parameter, value: string) => {
    const newParams = config.parameters.map(p => {
      if (p.id === id) {
        return { ...p, [key]: value };
      }
      return p;
    });
    updateField('parameters', newParams);
  };

  const removeParameter = (id: string) => {
    updateField('parameters', config.parameters.filter(p => p.id !== id));
  };

  // --- Profile Rule Management ---
  const addProfileRule = () => {
    const newRule: ProfileExtractionRule = { id: Date.now().toString(), targetField: '', description: '' };
    updateField('profileExtractionRules', [...(config.profileExtractionRules || []), newRule]);
  };

  const updateProfileRule = (id: string, key: keyof ProfileExtractionRule, value: string) => {
    const newRules = (config.profileExtractionRules || []).map(r => {
      if (r.id === id) return { ...r, [key]: value };
      return r;
    });
    updateField('profileExtractionRules', newRules);
  };

  const removeProfileRule = (id: string) => {
    updateField('profileExtractionRules', (config.profileExtractionRules || []).filter(r => r.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex border-b border-gray-200 mb-6 space-x-8 bg-white/50 px-4 -mx-4 overflow-x-auto">
        {[
          { id: 'TAG', label: '标签管理' },
          { id: 'KNOWLEDGE', label: '知识库设置' },
          { id: 'SATISFACTION', label: '满意度分析' },
          { id: 'SUMMARY', label: '通话小结' },
          { id: 'INFO_EXTRACTION', label: '信息提取' },
          { id: 'USER_PROFILE', label: '用户画像 (CDP)' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`pb-3 text-xs font-bold transition-all relative whitespace-nowrap ${
              activeSubTab === tab.id ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'TAG' && (
        <div className="space-y-4">
          <div className="flex justify-end mb-2">
            <button 
              onClick={addGroup}
              className="bg-primary text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-sky-600 transition-all flex items-center shadow-sm"
            >
              新增标签组
            </button>
          </div>

          <div className="bg-white rounded border border-gray-200 shadow-sm divide-y divide-gray-100">
            {groups.map((group) => (
              <div key={group.id} className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-slate-800">{group.name}</span>
                    <button className="text-slate-300 hover:text-primary transition-colors">
                      <Edit3 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center space-x-6">
                    {group.name === '情绪标签' && (
                      <div className="flex items-center space-x-2">
                         <Switch 
                          label="" 
                          checked={group.enabled || false} 
                          onChange={(v) => updateGroup(group.id, { enabled: v })} 
                        />
                        <span className="text-xs text-slate-400 font-medium">{group.enabled ? '开' : '关'}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs font-medium">
                      {group.name === '用户画像' && (
                        <>
                          <div className="flex items-center space-x-2 text-slate-500">
                            <span>标签规则：</span>
                            <div className="relative">
                              <select className="bg-white border border-gray-200 rounded px-2 py-1 outline-none text-slate-700 pr-6 appearance-none min-w-[80px]">
                                <option>多标签</option>
                                <option>单标签</option>
                              </select>
                              <ChevronDown size={12} className="absolute right-2 top-2 text-slate-400" />
                            </div>
                          </div>
                          <button className="text-primary hover:underline flex items-center">
                            排序 <ArrowUpDown size={12} className="ml-1" />
                          </button>
                          <button onClick={() => removeGroup(group.id)} className="text-primary hover:underline flex items-center">
                            删除标签组
                          </button>
                          <button className="text-slate-800">
                             <LayoutList size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                  {group.tags.map((tag, idx) => (
                    <div 
                      key={idx} 
                      className={`px-4 py-1.5 text-xs font-medium rounded transition-all flex items-center group/tag relative ${
                        group.name === '意向标签' || group.name === '情绪标签' 
                        ? 'bg-slate-100 text-slate-700' 
                        : 'border border-gray-200 text-slate-700 bg-white hover:border-primary/30'
                      }`}
                      title={tag.description}
                    >
                      {tag.name}
                      {tag.description && (
                         <div className="w-1.5 h-1.5 bg-blue-400 rounded-full absolute -top-0.5 -right-0.5 border border-white"></div>
                      )}
                      {group.name === '用户画像' && (
                        <button 
                          onClick={() => removeTag(group.id, tag.name)}
                          className="ml-2 text-slate-300 hover:text-red-500 opacity-0 group-hover/tag:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  {group.name === '用户画像' && (
                    <button 
                      onClick={() => openTagModal(group.id)}
                      className="px-4 py-1.5 text-xs font-medium rounded border border-dashed border-gray-300 text-slate-400 hover:border-primary hover:text-primary transition-all flex items-center"
                    >
                      <Plus size={14} className="mr-1" /> 添加标签
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KNOWLEDGE BASE SETTINGS - 已转移到知识检索配置 */}
      {activeSubTab === 'KNOWLEDGE' && (
        <div className="bg-white rounded border border-gray-200 shadow-sm p-12 text-center text-slate-400">
          <div className="flex flex-col items-center">
            <BookOpen size={48} className="text-slate-300 mb-4" />
            <p className="text-sm">知识库设置已转移到「知识检索配置」页面</p>
            <p className="text-xs text-slate-400 mt-2">请前往知识检索配置进行问答库和知识库的设置</p>
          </div>
        </div>
      )}

      {activeSubTab === 'SATISFACTION' && (
        <div className="bg-white rounded border border-gray-200 shadow-sm p-12 text-center text-slate-400">
          满意度分析模块开发中...
        </div>
      )}

      {activeSubTab === 'SUMMARY' && (
        <div className="bg-white rounded border border-gray-200 shadow-sm p-12 text-center text-slate-400">
          通话小结模块开发中...
        </div>
      )}

      {activeSubTab === 'INFO_EXTRACTION' && (
        <div className="space-y-6">
          {/* Main Config Selection */}
          <div className="bg-white rounded border border-gray-200 shadow-sm p-8">
            <div className="max-w-2xl">
               <div className="flex items-center mb-6 text-slate-800 font-bold">
                 <div className="p-2 bg-blue-50 text-primary rounded-lg mr-3">
                   <Database size={20} />
                 </div>
                 配置信息提取方案
               </div>
               
               <Select 
                 label="选择接口配置方案" 
                 tooltip="选择在对话过程中使用的信息提取配置方案（API定义等）。"
                 value={config.extractionConfigId || ''}
                 onChange={(e) => updateField('extractionConfigId', e.target.value)}
                 options={[
                   { label: '请选择...', value: '' },
                   ...extractionConfigs.map(c => ({ label: c.name, value: c.id }))
                 ]}
               />
               
               {config.extractionConfigId && (
                 <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-600 mb-6">
                    <div className="font-bold mb-2 text-xs uppercase text-slate-500">关联方案详情</div>
                    {extractionConfigs.find(c => c.id === config.extractionConfigId)?.description || '暂无描述'}
                 </div>
               )}
            </div>
          </div>

          {/* Model & Prompt Configuration (Moved Here) */}
          {config.extractionConfigId && (
            <div className="bg-white rounded border border-gray-200 shadow-sm p-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="max-w-7xl">
                 <div className="flex items-center mb-6 text-slate-800 font-bold">
                   <div className="p-2 bg-purple-50 text-purple-600 rounded-lg mr-3">
                     <HelpCircle size={20} />
                   </div>
                   提取逻辑配置 (LLM)
                 </div>
                 
                 {/* Extraction Model Selection Removed */}

                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                   <div className="lg:col-span-7">
                      <div className="flex items-center mb-2">
                        <label className="text-sm font-medium text-slate-700">提取提示词 (Prompt)</label>
                      </div>
                      <textarea 
                        className="w-full h-80 px-4 py-3 text-sm border border-gray-200 rounded focus:border-primary outline-none transition-all font-mono leading-relaxed bg-slate-50/30 resize-none"
                        value={config.extractionPrompt}
                        onChange={(e) => updateField('extractionPrompt', e.target.value)}
                        placeholder="例如：请从用户的回答中提取订单号和手机号码..."
                      />
                      <p className="text-xs text-slate-400 mt-2">指导模型如何从对话中提取所需信息，并映射到接口参数。</p>
                   </div>
                   
                   <div className="lg:col-span-5">
                      <div className="bg-slate-50/50 border border-slate-100 rounded p-4 h-full">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xs font-bold text-slate-700">提取变量参数</span>
                          <button onClick={addParameter} className="text-[10px] px-2 py-0.5 border border-primary text-primary rounded hover:bg-primary/5 flex items-center">
                             <Plus size={10} className="mr-1" /> 添加
                          </button>
                        </div>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {config.parameters.map((param) => (
                            <div key={param.id} className="p-3 bg-white rounded border border-gray-200 space-y-2">
                              {/* 第一行：参数名和来源选择 */}
                              <div className="flex space-x-2 items-center">
                                <div className="flex-1 min-w-0 relative">
                                   <select 
                                     className="w-full px-2 py-1 text-[11px] border border-gray-200 rounded bg-white outline-none appearance-none"
                                     value={param.key}
                                     onChange={(e) => updateParameter(param.id, 'key', e.target.value)}
                                   >
                                     <option value="">选择接口参数</option>
                                     {config.variables?.map(v => (
                                       <option key={v.id} value={v.name}>{v.name}</option>
                                     ))}
                                   </select>
                                   <ChevronDown size={10} className="absolute right-1 top-2 text-gray-400 pointer-events-none" />
                                </div>
                                
                                <select
                                  className="w-24 px-2 py-1 text-[11px] border border-gray-200 rounded bg-white outline-none appearance-none"
                                  value={param.source || 'llm'}
                                  onChange={(e) => {
                                    const newSource = e.target.value as 'llm' | 'variable';
                                    const updates: any = { source: newSource };
                                    if (newSource === 'variable') {
                                      updates.variableName = config.variables?.[0]?.name || '';
                                      updates.description = '';
                                    } else {
                                      updates.variableName = undefined;
                                    }
                                    updateParameter(param.id, 'source', newSource);
                                    if (updates.variableName !== undefined) {
                                      updateParameter(param.id, 'variableName', updates.variableName);
                                    }
                                  }}
                                >
                                  <option value="llm">LLM提取</option>
                                  <option value="variable">变量映射</option>
                                </select>

                                <button onClick={() => removeParameter(param.id)} className="text-slate-300 hover:text-red-500 shrink-0">
                                   <Trash2 size={12} />
                                </button>
                              </div>
                              
                              {/* 第二行：根据来源显示不同输入 */}
                              {param.source === 'variable' ? (
                                <div className="flex items-center space-x-2">
                                  <span className="text-[10px] text-slate-500">映射变量：</span>
                                  <select
                                    className="flex-1 px-2 py-1 text-[11px] border border-gray-200 rounded bg-white outline-none appearance-none"
                                    value={param.variableName || ''}
                                    onChange={(e) => updateParameter(param.id, 'variableName', e.target.value)}
                                  >
                                    <option value="">选择已有变量</option>
                                    {config.variables?.map(v => (
                                      <option key={v.id} value={v.name}>{v.name} ({v.description || '无描述'})</option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <div className="flex-[2] min-w-0">
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1 text-[11px] border border-gray-200 rounded bg-white outline-none focus:border-primary placeholder:text-slate-300"
                                    placeholder="输入提取指令/描述，指导LLM如何提取此参数"
                                    value={param.description || ''}
                                    onChange={(e) => updateParameter(param.id, 'description', e.target.value)}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                          {config.parameters.length === 0 && <div className="text-[10px] text-slate-400 text-center py-4">暂无变量</div>}
                        </div>
                        
                        <div className="mt-3 p-2 bg-blue-50 rounded text-[10px] text-blue-600">
                          <span className="font-bold">提示：</span>LLM提取会分析对话内容自动提取信息；变量映射会直接使用已配置的变量值，不经过LLM提取。
                        </div>
                      </div>
                   </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NEW: User Profile Collection */}
      {activeSubTab === 'USER_PROFILE' && (
        <div className="space-y-6">
           <div className="bg-white rounded border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-start mb-6">
                 <div className="flex items-center">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mr-4">
                       <UserCircle2 size={24} />
                    </div>
                    <div>
                       <h3 className="text-base font-bold text-slate-800">用户画像自动采集</h3>
                       <p className="text-xs text-slate-500 mt-1">
                          在对话过程中自动分析用户特征（如年龄、偏好、身份），并更新到 CDP 系统。
                       </p>
                    </div>
                 </div>
                 <Switch 
                    label=""
                    checked={config.profileCollectionEnabled || false}
                    onChange={(v) => updateField('profileCollectionEnabled', v)}
                 />
              </div>

              <div className={`transition-opacity duration-300 ${!config.profileCollectionEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Prompt */}
                    <div>
                       <div className="mb-2 font-bold text-sm text-slate-700">画像提取指令 (Extraction Prompt)</div>
                       <textarea 
                          className="w-full h-64 px-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none resize-none leading-relaxed bg-slate-50/50"
                          placeholder="例如：请分析用户的对话内容，推断用户的年龄段、职业以及购买意向强度..."
                          value={config.profileExtractionPrompt || ''}
                          onChange={(e) => updateField('profileExtractionPrompt', e.target.value)}
                       />
                       <p className="text-xs text-slate-400 mt-2">
                          提示：明确告知大模型需要关注哪些维度的信息。
                       </p>
                    </div>

                    {/* Right: Rules List */}
                    <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 flex flex-col h-full">
                       <div className="flex justify-between items-center mb-4">
                          <span className="text-sm font-bold text-slate-700">画像字段映射</span>
                          <button 
                             onClick={addProfileRule}
                             className="text-xs px-2 py-1 bg-white border border-indigo-200 text-indigo-600 rounded hover:bg-indigo-50 flex items-center shadow-sm"
                          >
                             <Plus size={10} className="mr-1" /> 添加字段
                          </button>
                       </div>
                       
                       <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                          {(config.profileExtractionRules || []).map((rule, idx) => (
                             <div key={rule.id} className="bg-white p-3 rounded border border-gray-100 shadow-sm relative group">
                                <div className="grid grid-cols-1 gap-2">
                                   <div>
                                      <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">目标字段 (Key)</label>
                                      <input 
                                         className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:border-indigo-300 outline-none font-mono text-slate-700"
                                         placeholder="e.g. user_age"
                                         value={rule.targetField}
                                         onChange={(e) => updateProfileRule(rule.id, 'targetField', e.target.value)}
                                      />
                                   </div>
                                   <div>
                                      <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">提取说明 (Description)</label>
                                      <input 
                                         className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:border-indigo-300 outline-none"
                                         placeholder="e.g. 推断用户的年龄"
                                         value={rule.description}
                                         onChange={(e) => updateProfileRule(rule.id, 'description', e.target.value)}
                                      />
                                   </div>
                                </div>
                                <button 
                                   onClick={() => removeProfileRule(rule.id)}
                                   className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                   <Trash2 size={14} />
                                </button>
                             </div>
                          ))}
                          {(config.profileExtractionRules || []).length === 0 && (
                             <div className="text-center py-10 text-slate-400 text-xs italic">
                                暂无配置，请添加需要采集的字段。
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
      
      <div className="flex justify-start space-x-4 pt-4 border-t border-gray-100">
         <button onClick={onSave} className="px-6 py-2 bg-primary text-white rounded hover:bg-sky-600 text-sm font-medium shadow-sm transition-all">
           保存配置
         </button>
         <button onClick={onCancel} className="px-6 py-2 border border-gray-200 text-slate-600 rounded hover:bg-slate-50 text-sm font-medium transition-all">
           取消
         </button>
      </div>

      {/* Tag Modal */}
      {tagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl w-[400px] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800">添加自定义标签</h3>
              <button onClick={() => setTagModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">标签名称</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-primary outline-none text-sm"
                  placeholder="如：高意向"
                  value={tagModal.name}
                  onChange={(e) => setTagModal({...tagModal, name: e.target.value})}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">标签描述 (可选)</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-primary outline-none text-sm"
                  placeholder="如：客户明确表示购买意愿"
                  value={tagModal.description}
                  onChange={(e) => setTagModal({...tagModal, description: e.target.value})}
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button onClick={() => setTagModal(null)} className="px-4 py-2 border border-gray-300 rounded text-slate-600 text-sm font-medium hover:bg-white">取消</button>
              <button onClick={handleTagSubmit} className="px-4 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-sky-600">添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotBusinessConfig;
