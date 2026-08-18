import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, X, Check, Search, Power, Tag, ChevronLeft, ChevronRight, Wrench, Box, Workflow } from 'lucide-react';
import { BotConfiguration, TopicSkill, BUILT_IN_FUNCTIONS } from '../../types';
import PromptEditor from '../ui/PromptEditor';
import SpeechListEditor from '../ui/SpeechListEditor';
import TopicMatchingSettings from './TopicMatchingSettings';

interface BotTopicManagerProps {
  config: BotConfiguration;
  updateField: <K extends keyof BotConfiguration>(key: K, value: BotConfiguration[K]) => void;
}

const BotTopicManager: React.FC<BotTopicManagerProps> = ({ config, updateField }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ENABLED' | 'DISABLED'>('ALL');
  const [topicTypeFilter, setTopicTypeFilter] = useState<'ALL' | 'flow' | 'normal'>('ALL');
  const [sortBy, setSortBy] = useState<'CREATED' | 'UPDATED' | 'NAME'>('CREATED');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [editingTopic, setEditingTopic] = useState<TopicSkill | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const topics = config.topicSkillLibraryConfig?.skills || [];
  const historyConversationEnabled = config.topicSkillLibraryConfig?.historyConversationEnabled ?? true;
  const historyConversationCount = config.topicSkillLibraryConfig?.historyConversationCount ?? 5;
  const previousTopicContextEnabled = config.topicSkillLibraryConfig?.previousTopicContextEnabled ?? false;
  const flowTopicPatch = { topicType: 'flow' as const };
  const normalTopicPatch = { topicType: 'normal' as const };
  const ivrOptions = [
    { value: 'ivr_general_queue', label: '通用人工队列' },
    { value: 'ivr_expert', label: 'VIP 专属坐席' },
    { value: 'ivr_complaint', label: '投诉建议专线' },
  ];

  // 筛选和排序
  const filteredTopics = useMemo(() => {
    let filtered = [...topics];
    
    // 搜索筛选
    if (searchQuery) {
      filtered = filtered.filter(
        topic => 
          topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          topic.exampleQuestions.some((q: string) => q.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // 状态筛选
    if (statusFilter === 'ENABLED') {
      filtered = filtered.filter(topic => topic.isEnabled);
    } else if (statusFilter === 'DISABLED') {
      filtered = filtered.filter(topic => !topic.isEnabled);
    }

    if (topicTypeFilter !== 'ALL') {
      filtered = filtered.filter(topic => (topic.topicType || 'normal') === topicTypeFilter);
    }
    
    // 排序
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'CREATED':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'UPDATED':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'NAME':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      
      return sortOrder === 'ASC' ? comparison : -comparison;
    });
    
    return filtered;
  }, [topics, searchQuery, statusFilter, topicTypeFilter, sortBy, sortOrder]);

  // 翻页
  const totalPages = Math.ceil(filteredTopics.length / pageSize);
  const pagedTopics = filteredTopics.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCreate = () => {
    const newTopic: TopicSkill = {
      id: Date.now().toString(),
      name: '',
      description: '',
      topicType: 'normal',
      linkedFlowId: '',
      isEnabled: true,
      exampleQuestions: [],
      prompt: '',
      tools: [],
      variables: [],
      entities: [],
      flows: [],
      knowledgeTags: [],
      transferDecisionPrompt: '',
      transferIvrTarget: '',
      hangupDecisionPrompt: '',
      transferSpeeches: [''],
      hangupSpeeches: [''],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setEditingTopic(newTopic);
    setIsCreating(true);
  };

  const handleEdit = (topic: TopicSkill) => {
    setEditingTopic({ ...topic });
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    const updatedTopics = topics.filter(t => t.id !== id);
    updateField('topicSkillLibraryConfig', {
      ...config.topicSkillLibraryConfig,
      skills: updatedTopics,
      totalCount: updatedTopics.length
    } as any);
  };

  const handleToggleEnabled = (id: string) => {
    const updatedTopics = topics.map(t => 
      t.id === id ? { ...t, isEnabled: !t.isEnabled, updatedAt: new Date().toISOString() } : t
    );
    updateField('topicSkillLibraryConfig', {
      ...config.topicSkillLibraryConfig,
      skills: updatedTopics
    } as any);
  };

  const batchToggleSkills = (enabled: boolean) => {
    const updatedTopics = topics.map(t =>
      selectedSkills.includes(t.id) ? { ...t, isEnabled: enabled, updatedAt: new Date().toISOString() } : t
    );
    updateField('topicSkillLibraryConfig', {
      ...config.topicSkillLibraryConfig,
      skills: updatedTopics
    } as any);
    setSelectedSkills([]);
  };

  const batchDeleteSkills = () => {
    const updatedTopics = topics.filter(t => !selectedSkills.includes(t.id));
    updateField('topicSkillLibraryConfig', {
      ...config.topicSkillLibraryConfig,
      skills: updatedTopics,
      totalCount: updatedTopics.length
    } as any);
    setSelectedSkills([]);
  };

  const handleSave = () => {
    if (!editingTopic) return;
    if (!editingTopic.name.trim()) {
      alert('请输入主题名称');
      return;
    }

    const isFlowTopic = editingTopic.topicType === 'flow';
    const linkedFlowId = editingTopic.linkedFlowId || editingTopic.flows?.[0] || '';
    if (isFlowTopic && !linkedFlowId) {
      alert('流程主题需要绑定一个 Flow');
      return;
    }

    const updatedTopic = {
      ...editingTopic,
      topicType: editingTopic.topicType || 'normal',
      linkedFlowId: isFlowTopic ? linkedFlowId : '',
      prompt: isFlowTopic ? '' : editingTopic.prompt,
      tools: isFlowTopic ? [] : editingTopic.tools,
      variables: isFlowTopic ? [] : editingTopic.variables,
      entities: isFlowTopic ? [] : editingTopic.entities,
      knowledgeTags: isFlowTopic ? [] : editingTopic.knowledgeTags,
      transferDecisionPrompt: isFlowTopic ? '' : editingTopic.transferDecisionPrompt,
      transferIvrTarget: isFlowTopic ? '' : editingTopic.transferIvrTarget,
      hangupDecisionPrompt: isFlowTopic ? '' : editingTopic.hangupDecisionPrompt,
      transferSpeeches: isFlowTopic ? [] : editingTopic.transferSpeeches,
      hangupSpeeches: isFlowTopic ? [] : editingTopic.hangupSpeeches,
      flows: isFlowTopic ? [linkedFlowId] : [],
      updatedAt: new Date().toISOString(),
    };
    
    if (isCreating) {
      const updatedTopics = [...topics, updatedTopic];
      updateField('topicSkillLibraryConfig', {
        ...config.topicSkillLibraryConfig,
        skills: updatedTopics,
        totalCount: updatedTopics.length
      } as any);
    } else {
      const updatedTopics = topics.map(t => t.id === editingTopic.id ? updatedTopic : t);
      updateField('topicSkillLibraryConfig', {
        ...config.topicSkillLibraryConfig,
        skills: updatedTopics
      } as any);
    }

    setEditingTopic(null);
    setIsCreating(false);
  };

  const handleCancel = () => {
    setEditingTopic(null);
    setIsCreating(false);
  };

  const updateEditingTopic = (key: keyof TopicSkill, value: any) => {
    if (!editingTopic) return;
    setEditingTopic({ ...editingTopic, [key]: value });
  };

  const changeTopicType = (topicType: 'normal' | 'flow') => {
    if (!editingTopic) return;
    const isFlowTopic = topicType === 'flow';
    const linkedFlowId = editingTopic.linkedFlowId || editingTopic.flows?.[0] || '';
    setEditingTopic({
      ...editingTopic,
      ...(isFlowTopic ? flowTopicPatch : normalTopicPatch),
      linkedFlowId: isFlowTopic ? linkedFlowId : '',
      prompt: isFlowTopic ? '' : editingTopic.prompt,
      tools: isFlowTopic ? [] : editingTopic.tools,
      variables: isFlowTopic ? [] : editingTopic.variables,
      entities: isFlowTopic ? [] : editingTopic.entities,
      knowledgeTags: isFlowTopic ? [] : editingTopic.knowledgeTags,
      flows: isFlowTopic ? (linkedFlowId ? [linkedFlowId] : []) : [],
    });
  };

  const toggleTopicArrayValue = (key: 'tools' | 'entities', value: string) => {
    if (!editingTopic || !value) return;
    const current = editingTopic[key] || [];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    updateEditingTopic(key, next);
  };

  const renderSelectedChips = (
    values: string[] = [],
    options: Array<{ id: string; name: string }>,
    tone: 'tool' | 'entity' | 'flow',
    onRemove: (value: string) => void,
  ) => {
    const toneClass = {
      tool: 'bg-sky-50 text-sky-700 border-sky-100',
      entity: 'bg-amber-50 text-amber-700 border-amber-100',
      flow: 'bg-purple-50 text-purple-700 border-purple-100',
    }[tone];

    if (values.length === 0) {
      return <p className="text-[10px] text-slate-400">暂未选择</p>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          const label = options.find((item) => item.id === value)?.name || value;
          return (
            <span key={value} className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${toneClass}`}>
              {label}
              <button type="button" onClick={() => onRemove(value)} className="text-current/60 hover:text-red-500">
                <X size={10} />
              </button>
            </span>
          );
        })}
      </div>
    );
  };

  const toolOptions = useMemo(
    () => (config.agentConfig?.tools || []).map((tool) => ({ id: tool.id, name: tool.name, description: tool.description })),
    [config.agentConfig?.tools],
  );

  const entityOptions = useMemo(
    () => [
      ...new Map(
        (config.variables || [])
          .filter((variable) => variable.category === 'EXTRACTION' || variable.source === 'extraction')
          .map((variable) => [variable.id || variable.name, {
            id: variable.id || variable.name,
            name: variable.name,
            description: variable.description,
          }]),
      ).values(),
    ],
    [config.variables],
  );

  const flowOptions = useMemo(
    () => (config.flowConfig?.flows || []).map((flow) => ({ id: flow.id, name: flow.name, description: flow.metadata?.description })),
    [config.flowConfig?.flows],
  );

  const addExampleQuestion = () => {
    if (!editingTopic) return;
    updateEditingTopic('exampleQuestions', [...editingTopic.exampleQuestions, '']);
  };

  const updateExampleQuestion = (index: number, value: string) => {
    if (!editingTopic) return;
    const updated = [...editingTopic.exampleQuestions];
    updated[index] = value;
    updateEditingTopic('exampleQuestions', updated);
  };

  const removeExampleQuestion = (index: number) => {
    if (!editingTopic) return;
    updateEditingTopic('exampleQuestions', editingTopic.exampleQuestions.filter((_, i) => i !== index));
  };

  const addKnowledgeTag = () => {
    if (!editingTopic) return;
    updateEditingTopic('knowledgeTags', [...(editingTopic.knowledgeTags || []), '']);
  };

  const updateKnowledgeTag = (index: number, value: string) => {
    if (!editingTopic) return;
    const updated = [...(editingTopic.knowledgeTags || [])];
    updated[index] = value;
    updateEditingTopic('knowledgeTags', updated);
  };

  const removeKnowledgeTag = (index: number) => {
    if (!editingTopic) return;
    updateEditingTopic('knowledgeTags', (editingTopic.knowledgeTags || []).filter((_, i) => i !== index));
  };

  if (editingTopic) {
    const isFlowTopic = editingTopic.topicType === 'flow';

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              {isCreating ? '新建主题' : '编辑主题'}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-xs text-slate-600 border border-gray-200 rounded hover:bg-slate-50 transition-colors flex items-center gap-1"
              >
                <X size={12} /> 取消
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-sky-600 transition-colors flex items-center gap-1"
              >
                <Check size={12} /> 保存
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="sr-only">主题类型</label>
            <div role="tablist" aria-label="主题类型" className="flex border-b border-gray-100">
              <button
                type="button"
                role="tab"
                aria-selected={!isFlowTopic}
                onClick={() => changeTopicType('normal')}
                className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  !isFlowTopic ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                普通主题
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isFlowTopic}
                onClick={() => changeTopicType('flow')}
                className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  isFlowTopic ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                流程主题
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">主题名称 *</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                placeholder="如：订单查询、退款申请"
                value={editingTopic.name}
                onChange={(e) => updateEditingTopic('name', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">启用状态</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateEditingTopic('isEnabled', !editingTopic.isEnabled)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    editingTopic.isEnabled 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  <Power size={12} />
                  {editingTopic.isEnabled ? '已启用' : '已禁用'}
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">相似问</label>
              <button
                onClick={addExampleQuestion}
                className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors flex items-center gap-1"
              >
                <Plus size={10} /> 添加
              </button>
            </div>
            <div className="space-y-2">
              {editingTopic.exampleQuestions.map((q, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded focus:border-primary outline-none"
                    placeholder="如：如何查询我的订单状态？"
                    value={q}
                    onChange={(e) => updateExampleQuestion(idx, e.target.value)}
                  />
                  <button
                    onClick={() => removeExampleQuestion(idx)}
                    className="text-slate-300 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {editingTopic.exampleQuestions.length === 0 && (
                <div className="text-[10px] text-slate-400 text-center py-3">
                  暂无相似问，点击"添加"按钮添加
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">主题描述</label>
            <textarea
              className="w-full h-20 px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none resize-none"
              placeholder="描述这个主题的作用和使用场景..."
              value={editingTopic.description || ''}
              onChange={(e) => updateEditingTopic('description', e.target.value)}
            />
          </div>

          {isFlowTopic ? (
            <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Workflow size={14} className="text-purple-500" /> 绑定流程
                  </label>
                </div>
              </div>
              <select
                value={editingTopic.linkedFlowId || editingTopic.flows?.[0] || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  updateEditingTopic('linkedFlowId', value);
                  updateEditingTopic('flows', value ? [value] : []);
                }}
                className="mt-3 w-full px-3 py-2 text-xs border border-purple-100 rounded bg-white outline-none focus:border-primary"
              >
                <option value="">选择流程</option>
                {flowOptions.map((flow) => (
                  <option key={flow.id} value={flow.id}>{flow.name}</option>
                ))}
              </select>
              <div className="mt-3">
                {renderSelectedChips(
                  editingTopic.linkedFlowId ? [editingTopic.linkedFlowId] : editingTopic.flows || [],
                  flowOptions,
                  'flow',
                  () => {
                    updateEditingTopic('linkedFlowId', '');
                    updateEditingTopic('flows', []);
                  },
                )}
              </div>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">知识库标签</label>
                  <button
                    onClick={addKnowledgeTag}
                    className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors flex items-center gap-1"
                  >
                    <Plus size={10} /> 添加
                  </button>
                </div>
                <div className="space-y-2">
                  {(editingTopic.knowledgeTags || []).map((tag, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 px-3 py-1.5 text-xs border border-gray-200 rounded bg-slate-50">
                        <Tag size={12} className="text-slate-400" />
                        <input
                          type="text"
                          className="flex-1 bg-transparent outline-none"
                          placeholder="输入知识库标签，如：订单、售后"
                          value={tag}
                          onChange={(e) => updateKnowledgeTag(idx, e.target.value)}
                        />
                      </div>
                      <button
                        onClick={() => removeKnowledgeTag(idx)}
                        className="text-slate-300 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {(editingTopic.knowledgeTags || []).length === 0 && (
                    <div className="text-[10px] text-slate-400 text-center py-3">
                      暂无标签，RAG 将从全部知识库中召回。点击&quot;添加&quot;按钮指定标签进行筛选
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">指定标签后，知识库只会从命中标签的知识进行 RAG 召回</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">提示词</label>
                </div>
                <PromptEditor
                  value={editingTopic.prompt}
                  onChange={(v) => updateEditingTopic('prompt', v)}
                  placeholder="定义此主题下 Agent 的具体行为规范和回复策略..."
                  variables={config.variables || []}
                  availableTools={config.agentConfig?.tools || []}
                  availableFunctions={BUILT_IN_FUNCTIONS}
                  availableFlows={[]}
                  height="h-48"
                />
              </div>

              <div className="space-y-4 rounded-xl border border-sky-100 bg-sky-50/40 p-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-700">转人工与挂机判断</h4>
                  <p className="mt-1 text-[10px] text-slate-500">以下配置仅对当前普通主题生效。</p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-700">转人工判断提示词</label>
                  <textarea
                    rows={4}
                    value={editingTopic.transferDecisionPrompt || ''}
                    onChange={(e) => updateEditingTopic('transferDecisionPrompt', e.target.value)}
                    className="w-full resize-none rounded border border-sky-100 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="选填，例如：用户明确要求人工，或当前问题无法继续自动处理时转人工。"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-700">目标 IVR</label>
                  <select
                    value={editingTopic.transferIvrTarget || ''}
                    onChange={(e) => updateEditingTopic('transferIvrTarget', e.target.value)}
                    className="w-full rounded border border-sky-100 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="">请选择目标 IVR</option>
                    {ivrOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-700">挂机判断提示词</label>
                  <textarea
                    rows={4}
                    value={editingTopic.hangupDecisionPrompt || ''}
                    onChange={(e) => updateEditingTopic('hangupDecisionPrompt', e.target.value)}
                    className="w-full resize-none rounded border border-sky-100 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="选填，例如：用户明确表示没有其他问题或要求结束通话时允许挂机。"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <SpeechListEditor
                    label="转人工话术"
                    value={editingTopic.transferSpeeches}
                    onChange={(value) => updateEditingTopic('transferSpeeches', value)}
                    placeholder="例如：好的，我帮您转接人工客服。"
                  />
                  <SpeechListEditor
                    label="挂机话术"
                    value={editingTopic.hangupSpeeches}
                    onChange={(value) => updateEditingTopic('hangupSpeeches', value)}
                    placeholder="例如：感谢您的来电，祝您生活愉快，再见。"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-6">
                <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-4">
                  <label className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Wrench size={14} className="text-sky-500" /> 工具
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      toggleTopicArrayValue('tools', e.target.value);
                      e.target.value = '';
                    }}
                    className="w-full px-3 py-2 text-xs border border-sky-100 rounded bg-white outline-none focus:border-primary"
                  >
                    <option value="">选择工具</option>
                    {toolOptions.map((tool) => (
                      <option key={tool.id} value={tool.id}>{tool.name}</option>
                    ))}
                  </select>
                  <div className="mt-3">
                    {renderSelectedChips(editingTopic.tools || [], toolOptions, 'tool', (value) => toggleTopicArrayValue('tools', value))}
                  </div>
                </div>

                <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
                  <label className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Box size={14} className="text-amber-500" /> 实体
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      toggleTopicArrayValue('entities', e.target.value);
                      e.target.value = '';
                    }}
                    className="w-full px-3 py-2 text-xs border border-amber-100 rounded bg-white outline-none focus:border-primary"
                  >
                    <option value="">选择实体</option>
                    {entityOptions.map((entity) => (
                      <option key={entity.id} value={entity.id}>{entity.name}</option>
                    ))}
                  </select>
                  <div className="mt-3">
                    {renderSelectedChips(editingTopic.entities || [], entityOptions, 'entity', (value) => toggleTopicArrayValue('entities', value))}
                  </div>
                </div>
              </div>
              <div className="sr-only">普通主题配置</div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TopicMatchingSettings
        value={{
          historyConversationEnabled,
          historyConversationCount,
          previousTopicContextEnabled,
        }}
        onChange={(patch) => updateField('topicSkillLibraryConfig', {
          enabled: config.topicSkillLibraryConfig?.enabled ?? false,
          skills: topics,
          pageSize: config.topicSkillLibraryConfig?.pageSize ?? 10,
          currentPage: config.topicSkillLibraryConfig?.currentPage ?? 1,
          totalPages: config.topicSkillLibraryConfig?.totalPages ?? 1,
          totalCount: config.topicSkillLibraryConfig?.totalCount ?? topics.length,
          historyConversationEnabled,
          historyConversationCount,
          previousTopicContextEnabled,
          ...patch,
        })}
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800">主题管理</h3>
          <button
            onClick={handleCreate}
            className="px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-sky-600 transition-colors flex items-center gap-1"
          >
            <Plus size={12} /> 新建主题
          </button>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded focus:border-primary outline-none w-full"
              placeholder="搜索主题..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded focus:border-primary outline-none"
          >
            <option value="ALL">全部</option>
            <option value="ENABLED">已启用</option>
            <option value="DISABLED">已禁用</option>
          </select>

          <select
            aria-label="主题分类"
            value={topicTypeFilter}
            onChange={(e) => {
              setTopicTypeFilter(e.target.value as typeof topicTypeFilter);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded focus:border-primary outline-none"
          >
            <option value="ALL">全部分类</option>
            <option value="flow">流程</option>
            <option value="normal">普通</option>
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-');
              setSortBy(by as any);
              setSortOrder(order as any);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded focus:border-primary outline-none"
          >
            <option value="CREATED-DESC">创建时间降序</option>
            <option value="CREATED-ASC">创建时间升序</option>
            <option value="UPDATED-DESC">更新时间降序</option>
            <option value="UPDATED-ASC">更新时间升序</option>
            <option value="NAME-ASC">名称升序</option>
            <option value="NAME-DESC">名称降序</option>
          </select>
        </div>
      </div>

      <div className="p-6">
        {/* 批量操作栏 */}
        {selectedSkills.length > 0 && (
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 mb-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">
                已选择 {selectedSkills.length} 项
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => batchToggleSkills(true)}
                  className="text-xs px-3 py-1 rounded bg-green-200 text-green-800 hover:bg-green-300 transition-colors"
                >
                  批量启用
                </button>
                <button
                  onClick={() => batchToggleSkills(false)}
                  className="text-xs px-3 py-1 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
                >
                  批量禁用
                </button>
                <button
                  onClick={batchDeleteSkills}
                  className="text-xs px-3 py-1 rounded bg-red-200 text-red-800 hover:bg-red-300 transition-colors"
                >
                  批量删除
                </button>
              </div>
            </div>
            <button
              onClick={() => setSelectedSkills([])}
              className="text-xs px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              清空选择
            </button>
          </div>
        )}

        {filteredTopics.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-sm text-slate-500 mb-2">
              {searchQuery ? '未找到匹配的主题' : '暂无主题'}
            </p>
            <p className="text-xs text-slate-400">
              {searchQuery ? '尝试调整搜索条件' : '点击"新建主题"开始创建'}
            </p>
          </div>
        ) : (
          <>
            {/* 列表表头 */}
            <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 rounded-t-lg border border-gray-200 font-medium text-sm">
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={selectedSkills.length === pagedTopics.length && pagedTopics.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedSkills(pagedTopics.map(topic => topic.id));
                    } else {
                      setSelectedSkills([]);
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>
              <div className="col-span-2">名称</div>
              <div className="col-span-3">问题</div>
              <div className="col-span-2">分类</div>
              <div className="col-span-2">状态</div>
              <div className="col-span-2">操作</div>
            </div>
            
            {/* 列表内容 */}
            <div className="border border-gray-200 rounded-b-lg overflow-hidden">
              {pagedTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="grid grid-cols-12 gap-4 p-3 border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedSkills.includes(topic.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSkills([...selectedSkills, topic.id]);
                        } else {
                          setSelectedSkills(selectedSkills.filter(id => id !== topic.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>
                  <div className="col-span-2 flex items-center min-w-0">
                    <h4 className="truncate text-sm font-medium text-gray-900">{topic.name}</h4>
                  </div>
                  <div className="col-span-3 flex items-center">
                    <p className="text-sm text-gray-500">
                      {topic.exampleQuestions[0] || '无示例问题'}
                    </p>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className={`rounded px-2 py-1 text-xs ${topic.topicType === 'flow' ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-600'}`}>
                      {topic.topicType === 'flow' ? '流程' : '普通'}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <button
                      onClick={() => handleToggleEnabled(topic.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        topic.isEnabled ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        topic.isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  <div className="col-span-2 flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(topic)}
                      className="text-xs px-2 py-1 rounded bg-blue-200 text-blue-800 hover:bg-blue-300 transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(topic.id)}
                      className="text-xs px-2 py-1 rounded bg-red-200 text-red-800 hover:bg-red-300 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 分页控件 */}
            {filteredTopics.length > 0 && (
              <div className="flex justify-between items-center border-t border-gray-200 pt-4 mt-4">
                <div className="text-sm text-gray-700">
                  显示从<span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> 到{' '}
                  <span className="font-medium">{Math.min(currentPage * pageSize, filteredTopics.length)}</span> 条，
                  共<span className="font-medium">{filteredTopics.length}</span> 条
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                    
                    if (endPage - startPage + 1 < maxVisible) {
                      startPage = Math.max(1, endPage - maxVisible + 1);
                    }
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i)}
                          className={`px-3 py-1 rounded-md text-sm ${
                            i === currentPage
                              ? 'bg-primary text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                    return pages;
                  })()}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
};

export default BotTopicManager;
