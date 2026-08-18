import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Database, HelpCircle, X, ChevronDown } from 'lucide-react';
import { Switch } from '../ui/FormComponents';
import PromptEditor from '../ui/PromptEditor';
import { BotConfiguration, BUILT_IN_FUNCTIONS } from '../../types';
import { getQATopicStoreEventName, loadQACategoryConfigs } from '../../services/qaTopicStore';
import { syncTopicBindingsWithCategories } from '../../services/polyaiConfigHelpers';

const LEXICON_CATEGORIES = ['产品名称', '技术术语', '行业概念', '医疗词汇', '公司名称', '自定义'];

// --- MultiSelect Dropdown Component ---
interface MultiSelectDropdownProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  tagColor?: 'blue' | 'green';
  disabled?: boolean;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ 
  options, 
  selected, 
  onChange, 
  placeholder = '请选择...',
  tagColor = 'blue',
  disabled = false
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
        className={`w-full px-3 py-2 text-sm border border-gray-200 rounded bg-white cursor-pointer min-h-[38px] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
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
                  onClick={(e) => !disabled && removeTag(item, e)}
                />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
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

// --- Simple Switch Component for List ---  
const SimpleSwitch: React.FC<{
  checked: boolean;
  onChange: () => void;
}> = ({ checked, onChange }) => (
  <div 
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${checked ? 'bg-primary' : 'bg-gray-300'}`}
    onClick={onChange}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </div>
);

// --- Knowledge Space Item Component ---
interface KnowledgeSpaceItemProps {
  item: any;
  isEditMode: boolean;
  onToggle: (id: string) => void;
  level?: number;
}

const KnowledgeSpaceItem: React.FC<KnowledgeSpaceItemProps> = ({ item, isEditMode, onToggle, level = 0 }) => {
  const [expanded, setExpanded] = useState(true);
  const indent = level * 20;

  const getIcon = (type: string) => {
    switch (type) {
      case 'space': return '🌐';
      case 'folder': return '📁';
      case 'file': return '📄';
      default: return '📦';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white mb-3">
      {/* Space/Folder Header */}
      <div 
        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center" style={{ marginLeft: indent }}>
          {isEditMode && (
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => onToggle(item.id)}
              className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
          )}
          <div className="flex items-center">
            <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-xs">
              {getIcon(item.type)}
            </span>
            <span className="font-medium text-slate-800 text-sm">{item.name}</span>
            {item.type === 'space' && (
              <span className="text-xs text-slate-400 ml-2">知识空间</span>
            )}
          </div>
        </div>
        {item.children && item.children.length > 0 && (
          <ChevronDown 
            size={16} 
            className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} 
          />
        )}
      </div>
      
      {/* Children */}
      {expanded && item.children && item.children.length > 0 && (
        <div>
          {item.children.map((child: any) => (
            <KnowledgeSpaceItem 
              key={child.id} 
              item={child} 
              isEditMode={isEditMode}
              onToggle={onToggle}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface BotKnowledgeConfigProps {
  config: BotConfiguration;
  updateField: <K extends keyof BotConfiguration>(key: K, value: BotConfiguration[K]) => void;
}

const BotKnowledgeConfig: React.FC<BotKnowledgeConfigProps> = ({ config, updateField }) => {
  const [activeTab, setActiveTab] = useState<'QA' | 'KB'>('QA');
  const [isEditMode, setIsEditMode] = useState(false);
  const [qaCategoryConfigs, setQaCategoryConfigs] = useState(() => config.qaCategoryConfigs || loadQACategoryConfigs());
  // 模拟KCS开通状态（仅用于知识库配置）
  const [kcsEnabled, setKcsEnabled] = useState(false);

  // 模拟知识空间数据
  useEffect(() => {
    setQaCategoryConfigs(config.qaCategoryConfigs || loadQACategoryConfigs());
  }, [config.qaCategoryConfigs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncCategories = () => setQaCategoryConfigs(loadQACategoryConfigs());
    const eventName = getQATopicStoreEventName();
    window.addEventListener(eventName, syncCategories);
    return () => window.removeEventListener(eventName, syncCategories);
  }, []);

  useEffect(() => {
    if (config.qaCategoryConfigs === qaCategoryConfigs) return;
    updateField('qaCategoryConfigs', qaCategoryConfigs);
  }, [config.qaCategoryConfigs, qaCategoryConfigs, updateField]);

  const qaTopics = useMemo(
    () => qaCategoryConfigs.filter((item) => item.enabled !== false).map((item) => item.name),
    [qaCategoryConfigs],
  );

  const syncedTopicBindings = useMemo(
    () => syncTopicBindingsWithCategories(qaCategoryConfigs, config.topicBindings || []),
    [qaCategoryConfigs, config.topicBindings],
  );

  useEffect(() => {
    const currentBindings = config.topicBindings || [];
    if (JSON.stringify(currentBindings) === JSON.stringify(syncedTopicBindings)) return;
    updateField('topicBindings', syncedTopicBindings);
  }, [config.topicBindings, syncedTopicBindings, updateField]);

  const normalizedSmalltalkTopicId = useMemo(() => {
    if (!config.smalltalkTopicId) return '';
    const matchedById = qaCategoryConfigs.find((item) => item.id === config.smalltalkTopicId);
    if (matchedById) return matchedById.id;
    const matchedByName = qaCategoryConfigs.find((item) => item.name === config.smalltalkTopicId);
    return matchedByName?.id || '';
  }, [config.smalltalkTopicId, qaCategoryConfigs]);

  useEffect(() => {
    if (!config.smalltalkTopicId || config.smalltalkTopicId === normalizedSmalltalkTopicId) return;
    updateField('smalltalkTopicId', normalizedSmalltalkTopicId);
  }, [config.smalltalkTopicId, normalizedSmalltalkTopicId, updateField]);

  const [knowledgeSpaces, setKnowledgeSpaces] = useState([
    {
      id: '1',
      name: '全公司公用空间',
      type: 'space',
      checked: true,
      children: [
        {
          id: '2',
          name: '行政管理',
          type: 'folder',
          checked: true,
          children: [
            {
              id: '3',
              name: '员工手册2024.pdf',
              type: 'file',
              checked: true
            },
            {
              id: '4',
              name: '报销流程.docx',
              type: 'file',
              checked: true
            }
          ]
        },
        {
          id: '5',
          name: '审计合规目录',
          type: 'folder',
          checked: false,
          children: []
        }
      ]
    },
    {
      id: '6',
      name: '法务合规专区',
      type: 'space',
      checked: true,
      children: []
    }
  ]);

  // 切换知识空间选择状态
  const toggleKnowledgeSpace = (id: string) => {
    const updateItem = (items: any[]): any[] => {
      return items.map(item => {
        if (item.id === id) {
          const newChecked = !item.checked;
          // 递归更新子项
          const updateChildren = (children: any[]): any[] => {
            return children.map(child => ({
              ...child,
              checked: newChecked,
              children: child.children ? updateChildren(child.children) : []
            }));
          };
          return {
            ...item,
            checked: newChecked,
            children: item.children ? updateChildren(item.children) : []
          };
        } else if (item.children) {
          return {
            ...item,
            children: updateItem(item.children)
          };
        }
        return item;
      });
    };
    setKnowledgeSpaces(updateItem(knowledgeSpaces));
  };

  return (
    <div className="p-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('QA')}
            className={`pb-2 text-sm font-bold transition-all relative ${
              activeTab === 'QA' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            问答库配置
          </button>
          <button
            onClick={() => setActiveTab('KB')}
            className={`pb-2 text-sm font-bold transition-all relative ${
              activeTab === 'KB' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            知识库配置
          </button>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between rounded border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <span className="text-sm font-bold text-slate-700">召回模式</span>
        <div className="flex rounded bg-slate-100 p-1">
          {([
            { value: 'global', label: '全局召回' },
            { value: 'tool', label: '工具调用' },
          ] as const).map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => updateField('knowledgeRetrievalMode', item.value)}
              className={`h-8 rounded px-4 text-xs font-bold transition-colors ${
                (config.knowledgeRetrievalMode ?? 'global') === item.value
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 问答库配置 */}
      {activeTab === 'QA' && (
        <div className="bg-white rounded border border-gray-200 shadow-sm p-8 space-y-8 animate-in fade-in">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg mr-4">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">启用问答库</h3>
                <p className="text-xs text-slate-500 mt-1">开启后，机器人将使用问答库中的内容回答用户提问</p>
              </div>
            </div>
            <Switch 
              label="" 
              checked={config.kbEnabled || false} 
              onChange={(v) => updateField('kbEnabled', v)} 
            />
          </div>

          <div className={`space-y-6 transition-opacity duration-300 ${!config.kbEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-4">
              <div className="flex items-center mb-2">
                <span className="text-sm font-bold text-slate-700">生效分类 (Allowed Categories)</span>
                <HelpCircle size={14} className="ml-1 text-slate-400" />
              </div>
              <div className="text-xs text-slate-500 mb-3">
                选择要使用的问答对分类和词库分类，用于知识库问答匹配
              </div>
              
              {/* 问答对分类选择 */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">问答对分类</label>
                <MultiSelectDropdown
                  options={qaTopics}
                  selected={config.kbQACategories || []}
                  onChange={(selected) => updateField('kbQACategories', selected)}
                  placeholder="选择问答对分类"
                  disabled={!config.kbEnabled}
                />
              </div>
              
              {/* 词库分类选择 */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">词库分类</label>
                <MultiSelectDropdown
                  options={LEXICON_CATEGORIES}
                  selected={config.kbLexiconCategories || []}
                  onChange={(selected) => updateField('kbLexiconCategories', selected)}
                  placeholder="选择词库分类"
                  tagColor="green"
                  disabled={!config.kbEnabled}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 知识库配置 */}
      {activeTab === 'KB' && (
        <div className="bg-white rounded border border-gray-200 shadow-sm p-8 space-y-8 animate-in fade-in">
          {!kcsEnabled ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">知识库检索</h3>
              <p className="text-slate-500 mb-6 max-w-md">
                知识库检索功能需要开通KCS（知识管理系统）后使用。开通后，您可以配置知识空间、目录和文件，为机器人提供知识检索能力
              </p>
              <button
                onClick={() => setKcsEnabled(true)}
                className="px-6 py-2 bg-primary text-white rounded hover:bg-sky-600 text-sm font-medium transition-all"
              >
                开通KCS
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg mr-4">
                    <Database size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">启用知识库检索</h3>
                    <p className="text-xs text-slate-500 mt-1">开启后，机器人将使用知识库中的文档内容回答用户提问</p>
                  </div>
                </div>
                <Switch 
                  label="" 
                  checked={config.kcsEnabled || false} 
                  onChange={(v) => updateField('kcsEnabled', v)} 
                />
              </div>

              <div className={`space-y-6 transition-opacity duration-300 ${!config.kcsEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="flex items-center mb-4">
                    <span className="text-sm font-bold text-slate-700">知识空间选择</span>
                    <HelpCircle size={14} className="ml-1 text-slate-400" />
                  </div>
                  <div className="text-xs text-slate-500 mb-4">
                    选择要使用的知识空间和目录，用于知识库文档检索
                  </div>
                  
                  {/* 知识空间列表 */}
                  <div className="space-y-3">
                    {knowledgeSpaces.map((space) => (
                      <KnowledgeSpaceItem 
                        key={space.id} 
                        item={space} 
                        isEditMode={isEditMode}
                        onToggle={toggleKnowledgeSpace}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 按钮移到右下角 */}
              {config.kcsEnabled && (
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                  {isEditMode ? (
                    <>
                      <button
                        onClick={() => setIsEditMode(false)}
                        className="px-4 py-2 bg-gray-100 text-slate-700 rounded text-sm font-medium hover:bg-gray-200 transition-all"
                      >
                        取消
                      </button>
                      <button 
                        onClick={() => setIsEditMode(false)}
                        className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-sky-600 transition-all"
                      >
                        保存
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-sky-600 transition-all"
                    >
                      编辑
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BotKnowledgeConfig;
