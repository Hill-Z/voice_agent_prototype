import React, { useState } from 'react';
import { Plus, Trash2, X, Search } from 'lucide-react';
import { ExtractionRule, ExtractionMethod } from '../../../../types';

interface ExtractionRuleConfigProps {
  rules: ExtractionRule[];
  onChange: (rules: ExtractionRule[]) => void;
  availableVariables?: string[];
  variableTypes?: string[];
  onAddVariableType?: (type: string) => void;
}

const SOURCE_OPTIONS = [
  { value: 'lastUserInput', label: '用户输入' },
  { value: 'fullContext', label: '完整对话' },
  { value: 'lastBotResponse', label: '机器人回复' },
];

const DEFAULT_RULE: ExtractionRule = {
  id: '',
  targetVariable: '',
  variableType: '',
  method: 'REGEX',
  regexPattern: '',
  regexGroup: 0,
  sourceText: 'lastUserInput',
  fallbackValue: '',
};

export default function ExtractionRuleConfig({
  rules = [],
  onChange,
  availableVariables = [],
  variableTypes = ['客户姓名', '公司', '详细地址', '地铁开始地址', '地铁结束地址', '日期', '时间', '人名'],
  onAddVariableType,
}: ExtractionRuleConfigProps) {
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const addRule = () => {
    const newRule: ExtractionRule = {
      ...DEFAULT_RULE,
      id: Date.now().toString(),
    };
    onChange([...rules, newRule]);
  };

  const removeRule = (id: string) => {
    onChange(rules.filter(r => r.id !== id));
  };

  const updateRule = (id: string, updates: Partial<ExtractionRule>) => {
    onChange(rules.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleAddVariableType = () => {
    if (newTypeName.trim() && onAddVariableType) {
      onAddVariableType(newTypeName.trim());
      setNewTypeName('');
      setShowAddTypeModal(false);
    }
  };

  const filteredVariableTypes = variableTypes.filter(type =>
    type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {rules.map((rule, index) => (
        <div key={rule.id} className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-3 relative">
          {/* Rule Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700">规则 {index + 1}</span>
            <button
              onClick={() => removeRule(rule.id)}
              className="text-slate-400 hover:text-red-500 p-1"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Target Variable */}
          <div>
            <label className="text-[10px] text-slate-500 font-medium block mb-1">对话变量</label>
            <select
              value={rule.targetVariable}
              onChange={(e) => updateRule(rule.id, { targetVariable: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-blue-200 rounded bg-white outline-none"
            >
              <option value="">-- 选择变量 --</option>
              {availableVariables.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Variable Type with Search and Add */}
          <div>
            <label className="text-[10px] text-slate-500 font-medium block mb-1">变量类型</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={rule.variableType}
                  onChange={(e) => {
                    updateRule(rule.id, { variableType: e.target.value });
                    setSearchQuery(e.target.value);
                    setActiveDropdown(rule.id);
                  }}
                  onFocus={() => setActiveDropdown(rule.id)}
                  placeholder="选择或输入类型"
                  className="w-full px-2 py-1.5 text-xs border border-blue-200 rounded bg-white outline-none"
                />
                {activeDropdown === rule.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setActiveDropdown(null)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-blue-200 rounded-lg shadow-lg z-20 max-h-48 overflow-auto">
                      <div className="p-2 border-b border-blue-100">
                        <button
                          onClick={() => setShowAddTypeModal(true)}
                          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                        >
                          <Plus size={12} />
                          新增变量类型
                        </button>
                      </div>
                      {filteredVariableTypes.map(type => (
                        <button
                          key={type}
                          onClick={() => {
                            updateRule(rule.id, { variableType: type });
                            setActiveDropdown(null);
                            setSearchQuery('');
                          }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 ${
                            rule.variableType === type ? 'bg-blue-50 text-primary font-medium' : 'text-slate-700'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowAddTypeModal(true)}
                className="px-2 py-1.5 text-xs border border-blue-200 rounded text-primary hover:bg-blue-50"
                title="新增变量类型"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Extraction Method */}
          <div>
            <label className="text-[10px] text-slate-500 font-medium block mb-1">提取方式</label>
            <div className="flex gap-2">
              <button
                onClick={() => updateRule(rule.id, { method: 'REGEX' })}
                className={`flex-1 py-1.5 text-xs rounded border ${
                  rule.method === 'REGEX'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-slate-600 border-blue-200 hover:bg-blue-50'
                }`}
              >
                正则提取
              </button>
              <button
                onClick={() => updateRule(rule.id, { method: 'LLM' })}
                className={`flex-1 py-1.5 text-xs rounded border ${
                  rule.method === 'LLM'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-slate-600 border-blue-200 hover:bg-blue-50'
                }`}
              >
                大模型提取
              </button>
            </div>
          </div>

          {/* REGEX Config */}
          {rule.method === 'REGEX' && (
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-1">正则规则</label>
                <input
                  type="text"
                  value={rule.regexPattern || ''}
                  onChange={(e) => updateRule(rule.id, { regexPattern: e.target.value })}
                  placeholder="例如: (?:公司|单位)是(.+?)(?:的|，|$)"
                  className="w-full px-2 py-1.5 text-xs border border-blue-200 rounded bg-white font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-medium block mb-1">捕获组</label>
                  <input
                    type="number"
                    min={0}
                    value={rule.regexGroup || 0}
                    onChange={(e) => updateRule(rule.id, { regexGroup: parseInt(e.target.value) })}
                    className="w-full px-2 py-1.5 text-xs border border-blue-200 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-medium block mb-1">默认值</label>
                  <input
                    type="text"
                    value={rule.fallbackValue || ''}
                    onChange={(e) => updateRule(rule.id, { fallbackValue: e.target.value })}
                    placeholder="未识别"
                    className="w-full px-2 py-1.5 text-xs border border-blue-200 rounded bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* LLM Config */}
          {rule.method === 'LLM' && (
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-1">提取提示词</label>
                <textarea
                  value={rule.llmPrompt || ''}
                  onChange={(e) => updateRule(rule.id, { llmPrompt: e.target.value })}
                  placeholder="例如: 从用户输入中提取公司名称，只返回公司名称文本"
                  className="w-full h-20 px-2 py-1.5 text-xs border border-blue-200 rounded bg-white resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-1">默认值</label>
                <input
                  type="text"
                  value={rule.fallbackValue || ''}
                  onChange={(e) => updateRule(rule.id, { fallbackValue: e.target.value })}
                  placeholder="未识别"
                  className="w-full px-2 py-1.5 text-xs border border-blue-200 rounded bg-white"
                />
              </div>
            </div>
          )}

          {/* Source Text */}
          <div>
            <label className="text-[10px] text-slate-500 font-medium block mb-1">提取来源</label>
            <select
              value={rule.sourceText || 'lastUserInput'}
              onChange={(e) => updateRule(rule.id, { sourceText: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-blue-200 rounded bg-white outline-none"
            >
              {SOURCE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      ))}

      {/* Add Rule Button */}
      <button
        onClick={addRule}
        className="w-full py-2 border border-dashed border-blue-300 rounded text-xs text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"
      >
        <Plus size={14} className="mr-1" /> 添加提取规则
      </button>

      {/* Add Variable Type Modal */}
      {showAddTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-80 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">新增变量类型</h3>
              <button
                onClick={() => setShowAddTypeModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">类型名称</label>
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="例如: 客户电话"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowAddTypeModal(false)}
                  className="flex-1 py-2 border border-gray-200 rounded text-xs text-slate-600 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleAddVariableType}
                  disabled={!newTypeName.trim()}
                  className="flex-1 py-2 bg-primary text-white rounded text-xs hover:bg-primary/90 disabled:opacity-50"
                >
                  确认添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
