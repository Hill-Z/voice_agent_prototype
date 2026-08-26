
import React, { useState } from 'react';
import { Edit3, ChevronDown, ArrowUpDown, LayoutList, X, Plus, Database, Trash2, UserCircle2, BookOpen, Wrench, FileText } from 'lucide-react';
import { Switch, Select, TagInput } from '../ui/FormComponents';
import { AgentTool, LabelGroup, BotConfiguration, ExtractionConfig, ModelType, TagItem, Parameter, ProfileExtractionRule } from '../../types';

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
  availableTools: AgentTool[];
}

const BotBusinessConfig: React.FC<BotBusinessConfigProps> = ({ config, updateField, onSave, onCancel, extractionConfigs, availableTools }) => {
  const [activeSubTab, setActiveSubTab] = useState<'TAG' | 'SATISFACTION' | 'SUMMARY' | 'INFO_EXTRACTION' | 'USER_PROFILE' | 'KNOWLEDGE'>('TAG');
  const [tagModal, setTagModal] = useState<{ isOpen: boolean, groupId: string, name: string, description: string } | null>(null);
  const [isToolSelectOpen, setIsToolSelectOpen] = useState(false);

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

  // 旧配置只有接口方案编号时仍按接口类型展示，保证线上配置无需迁移。
  const postCallProcessType = config.postCallProcessType
    || (config.extractionConfigId ? 'interface' : (config.postCallToolIds || []).length > 0 ? 'tool' : 'none');
  const selectedExtractionConfig = extractionConfigs.find(item => item.id === config.extractionConfigId);
  const legacyParameterMappings: NonNullable<BotConfiguration['postCallParameterMappings']> = (selectedExtractionConfig?.params || []).map(param => ({
    id: `legacy-${param.id}`,
    source: param.source,
    targetKey: param.key,
    extractionInstruction: param.desc,
    variableName: param.variableName,
  }));
  const postCallParameterMappings = config.postCallParameterMappings?.length
    ? config.postCallParameterMappings
    : legacyParameterMappings;

  // 首次编辑旧方案参数时先转成机器人级映射，后续修改不会影响原接口方案。
  const updatePostCallParameter = (
    id: string,
    updates: Partial<NonNullable<BotConfiguration['postCallParameterMappings']>[number]>,
  ) => {
    updateField('postCallParameterMappings', postCallParameterMappings.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const addPostCallParameter = () => {
    updateField('postCallParameterMappings', [
      ...postCallParameterMappings,
      {
        id: `post-call-${Date.now()}`,
        source: 'llm',
        toolId: postCallProcessType === 'tool' ? (config.postCallToolIds || [])[0] : undefined,
        targetKey: '',
        extractionInstruction: '',
      },
    ]);
  };

  const removePostCallParameter = (id: string) => {
    updateField('postCallParameterMappings', postCallParameterMappings.filter(item => item.id !== id));
  };

  const togglePostCallTool = (toolId: string, selected: boolean) => {
    const ids = config.postCallToolIds || [];
    updateField('postCallToolIds', selected ? [...ids, toolId] : ids.filter(id => id !== toolId));
    if (!selected && config.postCallParameterMappings?.some(item => item.toolId === toolId)) {
      updateField('postCallParameterMappings', config.postCallParameterMappings.filter(item => item.toolId !== toolId));
    }
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
        <div className="space-y-4 rounded border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-6">
            <div><h3 className="flex items-center text-sm font-bold text-slate-800"><FileText size={18} className="mr-2 text-primary" />通话小结</h3><p className="mt-1 text-xs text-slate-500">通话结束后自动生成，供通话记录查看，也可作为后续回呼的上下文。</p></div>
            <Switch label="" checked={config.callSummaryEnabled ?? true} onChange={(value) => updateField('callSummaryEnabled', value)} />
          </div>
          {(config.callSummaryEnabled ?? true) && <>
            <textarea value={config.callSummaryPrompt || '总结客户诉求、双方承诺、待办事项、回呼原因和已确认时间。'} onChange={(event) => updateField('callSummaryPrompt', event.target.value)} className="h-20 w-full resize-none rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex items-center justify-between rounded border border-gray-200 px-4 py-3"><div><div className="text-xs font-bold text-slate-700">作为回呼上下文</div><div className="mt-1 text-[11px] text-slate-400">将来源通话小结和变量快照带入新对话</div></div><Switch label="" checked={config.callbackContextEnabled ?? true} onChange={(value) => updateField('callbackContextEnabled', value)} /></div>
              <div className="flex items-center justify-between rounded border border-gray-200 px-4 py-3"><div><div className="text-xs font-bold text-slate-700">回呼后生成新小结</div><div className="mt-1 text-[11px] text-slate-400">每次回呼均形成独立记录，不覆盖来源小结</div></div><Switch label="" checked={config.callbackSummaryEnabled ?? true} onChange={(value) => updateField('callbackSummaryEnabled', value)} /></div>
            </div>
          </>}
        </div>
      )}

      {activeSubTab === 'INFO_EXTRACTION' && (
        <div className="space-y-4">
          <div className="rounded border border-gray-200 bg-white p-5 shadow-sm">
            <div>
              <h3 className="flex items-center text-sm font-bold text-slate-800"><Wrench size={18} className="mr-2 text-primary" />配置信息提取方案</h3>
              <p className="mt-1 text-xs text-slate-500">通话结束后，按所选方案提取信息并执行接口或工具。</p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
              <Select
                label="方案类型"
                value={postCallProcessType}
                onChange={(event) => {
                  const nextType = event.target.value as 'none' | 'interface' | 'tool';
                  updateField('postCallProcessType', nextType);
                  if (nextType === 'none' && config.postCallParameterMappings?.length) {
                    updateField('postCallParameterMappings', config.postCallParameterMappings.map(parameter => ({
                      ...parameter,
                      source: 'llm' as const,
                      toolId: undefined,
                      variableName: undefined,
                      extractionInstruction: parameter.extractionInstruction || '从完整通话中提取该字段',
                    })));
                  }
                }}
                options={[
                  { label: '无（仅提取字段）', value: 'none' },
                  { label: '接口类型', value: 'interface' },
                  { label: '工具类型', value: 'tool' },
                ]}
              />

              {postCallProcessType === 'interface' ? (
                <Select
                  label="接口配置方案"
                  tooltip="原有接口方案和参数继续生效。"
                  value={config.extractionConfigId || ''}
                  onChange={(event) => {
                    updateField('extractionConfigId', event.target.value);
                    if (!config.postCallParameterMappings?.length) {
                      const nextConfig = extractionConfigs.find(item => item.id === event.target.value);
                      updateField('postCallParameterMappings', (nextConfig?.params || []).map(param => ({
                        id: `interface-${param.id}`,
                        source: param.source,
                        targetKey: param.key,
                        extractionInstruction: param.desc,
                        variableName: param.variableName,
                      })));
                    }
                  }}
                  options={[{ label: '请选择接口配置方案', value: '' }, ...extractionConfigs.map(item => ({ label: item.name, value: item.id }))]}
                />
              ) : postCallProcessType === 'tool' ? (
                <div className="relative">
                  <div className="mb-1 text-xs font-medium text-slate-600">选择工具</div>
                  <button
                    type="button"
                    onClick={() => setIsToolSelectOpen(value => !value)}
                    className="flex min-h-10 w-full items-center justify-between gap-3 rounded border border-gray-200 bg-white px-3 py-2 text-left outline-none hover:border-primary/50 focus:border-primary"
                  >
                    <span className="flex min-w-0 flex-wrap gap-1">
                      {(config.postCallToolIds || []).length === 0 ? (
                        <span className="text-sm text-slate-400">请选择工具，可多选</span>
                      ) : (
                        (config.postCallToolIds || []).map(toolId => {
                          const tool = availableTools.find(item => item.id === toolId);
                          return <span key={toolId} className="rounded bg-blue-50 px-2 py-0.5 text-xs text-primary">{tool?.displayName || tool?.name || '已删除工具'}</span>;
                        })
                      )}
                    </span>
                    <ChevronDown size={15} className={`shrink-0 text-slate-400 transition-transform ${isToolSelectOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isToolSelectOpen && (
                    <>
                      <button type="button" aria-label="关闭工具选择" className="fixed inset-0 z-10 cursor-default" onClick={() => setIsToolSelectOpen(false)} />
                      <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded border border-gray-200 bg-white py-1 shadow-lg">
                        {availableTools.map(tool => {
                          const selected = (config.postCallToolIds || []).includes(tool.id);
                          return (
                            <label key={tool.id} className={`flex items-center justify-between gap-4 px-3 py-2.5 ${tool.enabled || selected ? 'cursor-pointer hover:bg-slate-50' : 'cursor-not-allowed opacity-55'}`}>
                              <span className="min-w-0">
                                <span className="flex items-center gap-2 truncate text-xs font-medium text-slate-700">
                                  {tool.displayName || tool.name}
                                  <span className={`rounded px-1.5 py-0.5 text-[10px] ${tool.enabled ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>{tool.enabled ? '已启用' : '已停用'}</span>
                                </span>
                                <span className="mt-0.5 block truncate text-[11px] text-slate-400">{tool.description}</span>
                              </span>
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(event) => togglePostCallTool(tool.id, event.target.checked)}
                                disabled={!tool.enabled && !selected}
                                className="h-4 w-4 shrink-0 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                            </label>
                          );
                        })}
                        {availableTools.length === 0 && (
                          <div className="px-3 py-6 text-center text-xs text-slate-400">请先在左侧「工具配置」中创建工具</div>
                        )}
                      </div>
                    </>
                  )}
                  <p className="mt-1 text-[11px] text-amber-600">大模型将根据通话内容和提示词，判断是否调用所选工具。</p>
                </div>
              ) : (
                <div className="flex h-10 items-center rounded border border-dashed border-gray-200 bg-slate-50 px-3 text-xs text-slate-500">
                  不调用接口或工具，仅保存大模型从通话中提取的字段。
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800">
                {postCallProcessType === 'tool' ? '工具调用判断提示词' : '信息提取提示词'}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {postCallProcessType === 'tool'
                  ? '说明哪些通话情况需要调用工具，以及需要从对话中取得哪些参数。'
                  : postCallProcessType === 'interface'
                    ? '说明需要从完整通话中提取哪些信息，并传给接口方案。'
                    : '说明需要从完整通话中提取并保存哪些字段。'}
              </p>
              <textarea
                value={config.extractionPrompt || ''}
                onChange={(event) => updateField('extractionPrompt', event.target.value)}
                placeholder={postCallProcessType === 'tool'
                  ? '例如：仅当客户明确提出回呼需求并确认时间时，调用预约回呼工具。'
                  : postCallProcessType === 'interface'
                    ? '例如：从完整对话中提取客户诉求、处理结果和预约时间，并传给接口。'
                    : '例如：从完整对话中提取客户诉求、处理结果和预约时间。'}
                className="mt-4 h-48 w-full resize-none rounded border border-gray-200 px-3 py-2 text-sm leading-6 outline-none focus:border-primary"
              />
            </div>

            <div className="rounded border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-slate-800">提取变量参数</div>
                  <p className="mt-1 text-xs text-slate-400">大模型抽取支持自定义参数；变量映射直接使用已有业务变量。</p>
                </div>
                <button type="button" onClick={addPostCallParameter} className="flex shrink-0 items-center text-xs font-medium text-primary hover:underline">
                  <Plus size={14} className="mr-1" />添加
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {postCallParameterMappings.map(parameter => (
                  <div key={parameter.id} className={`grid grid-cols-1 gap-2 rounded border border-gray-100 bg-slate-50/60 p-2 ${postCallProcessType === 'tool' ? 'md:grid-cols-[110px_130px_140px_minmax(0,1fr)_28px]' : 'md:grid-cols-[120px_150px_minmax(0,1fr)_28px]'}`}>
                    <select
                      value={parameter.source}
                      onChange={(event) => updatePostCallParameter(parameter.id, {
                        source: event.target.value as 'llm' | 'variable',
                        extractionInstruction: event.target.value === 'llm' ? parameter.extractionInstruction : undefined,
                        variableName: event.target.value === 'variable' ? parameter.variableName : undefined,
                      })}
                      className="h-9 rounded border border-gray-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-primary"
                    >
                      <option value="llm">大模型抽取</option>
                      {postCallProcessType !== 'none' && <option value="variable">变量映射</option>}
                    </select>
                    {postCallProcessType === 'tool' && (
                      <select
                        value={parameter.toolId || ''}
                        onChange={(event) => updatePostCallParameter(parameter.id, { toolId: event.target.value })}
                        className="h-9 rounded border border-gray-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-primary"
                      >
                        <option value="">选择目标工具</option>
                        {availableTools.filter(tool => (config.postCallToolIds || []).includes(tool.id)).map(tool => (
                          <option key={tool.id} value={tool.id}>{tool.displayName || tool.name}</option>
                        ))}
                      </select>
                    )}
                    <input
                      value={parameter.targetKey}
                      onChange={(event) => updatePostCallParameter(parameter.id, { targetKey: event.target.value })}
                      placeholder="调用参数名"
                      className="h-9 rounded border border-gray-200 bg-white px-2 text-xs outline-none focus:border-primary"
                    />
                    {parameter.source === 'llm' ? (
                      <input
                        value={parameter.extractionInstruction || ''}
                        onChange={(event) => updatePostCallParameter(parameter.id, { extractionInstruction: event.target.value })}
                        placeholder="填写提取要求，例如：客户明确确认的回呼时间"
                        className="h-9 rounded border border-gray-200 bg-white px-2 text-xs outline-none focus:border-primary"
                      />
                    ) : (
                      <select
                        value={parameter.variableName || ''}
                        onChange={(event) => updatePostCallParameter(parameter.id, { variableName: event.target.value })}
                        className="h-9 rounded border border-gray-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-primary"
                      >
                        <option value="">选择业务变量</option>
                        {(config.variables || []).map(variable => (
                          <option key={variable.id} value={variable.name}>{variable.name}（{variable.isSystem ? '系统变量' : '业务变量'}）</option>
                        ))}
                      </select>
                    )}
                    <button type="button" onClick={() => removePostCallParameter(parameter.id)} className="flex h-9 items-center justify-center text-slate-300 hover:text-red-500" aria-label="删除参数">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                {postCallParameterMappings.length === 0 && (
                  <div className="rounded border border-dashed border-gray-200 py-8 text-center text-xs text-slate-400">暂未配置参数</div>
                )}
              </div>
            </div>
          </div>
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
