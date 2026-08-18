import React, { useState, useEffect } from 'react';
import { Search, Edit2, Check, X, Database, Hash, Clock, Filter, Variable } from 'lucide-react';

interface VariableInspectorProps {
  variables: Record<string, any>;
  onVariableChange: (key: string, value: any) => void;
  readOnly?: boolean;
}

type VariableCategory = 'all' | 'input' | 'conversation' | 'extraction';

export default function VariableInspector({
  variables,
  onVariableChange,
  readOnly = false
}: VariableInspectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [category, setCategory] = useState<VariableCategory>('all');
  const [changedKeys, setChangedKeys] = useState<Set<string>>(new Set());

  // Track variable changes for highlighting
  useEffect(() => {
    const timer = setTimeout(() => {
      setChangedKeys(new Set());
    }, 1000);
    return () => clearTimeout(timer);
  }, [variables]);

  const handleEditStart = (key: string, value: any) => {
    if (readOnly) return;
    setEditingKey(key);
    setEditValue(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value));
  };

  const handleEditSave = () => {
    if (!editingKey) return;

    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(editValue);
      onVariableChange(editingKey, parsed);
    } catch {
      // If not valid JSON, save as string
      onVariableChange(editingKey, editValue);
    }

    setChangedKeys(prev => new Set(prev).add(editingKey));
    setEditingKey(null);
    setEditValue('');
  };

  const handleEditCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const getValueType = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'string':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'number':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'boolean':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'object':
      case 'array':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'null':
      case 'undefined':
        return 'text-slate-500 bg-slate-100 border-slate-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getCategoryIcon = (cat: VariableCategory) => {
    switch (cat) {
      case 'input':
        return <Database className="w-3 h-3" />;
      case 'conversation':
        return <Clock className="w-3 h-3" />;
      case 'extraction':
        return <Hash className="w-3 h-3" />;
      default:
        return <Filter className="w-3 h-3" />;
    }
  };

  const getCategoryLabel = (cat: VariableCategory): string => {
    switch (cat) {
      case 'input':
        return '输入变量';
      case 'conversation':
        return '对话变量';
      case 'extraction':
        return '提取变量';
      default:
        return '全部';
    }
  };

  // Filter variables based on search and category
  const filteredEntries = Object.entries(variables).filter(([key, value]) => {
    const matchesSearch = key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         formatValue(value).toLowerCase().includes(searchTerm.toLowerCase());

    if (category === 'all') return matchesSearch;

    // Simple heuristic for categorization
    if (category === 'input') {
      return matchesSearch && (key.includes('input') || key.includes('客户') || key.includes('用户'));
    }
    if (category === 'conversation') {
      return matchesSearch && (key.includes('time') || key.includes('date') || key.includes('当前'));
    }
    if (category === 'extraction') {
      return matchesSearch && (key.includes('extract') || key.includes('提取') || key.includes('意图'));
    }

    return matchesSearch;
  });

  const categories: VariableCategory[] = ['all', 'input', 'conversation', 'extraction'];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索变量..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="flex space-x-1.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`
                flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all
                ${category === cat
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }
              `}
            >
              {getCategoryIcon(cat)}
              <span>{getCategoryLabel(cat)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Variable List */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Variable className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-xs text-slate-500">无变量</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredEntries.map(([key, value]) => {
              const isEditing = editingKey === key;
              const valueType = getValueType(value);
              const isChanged = changedKeys.has(key);

              return (
                <div
                  key={key}
                  className={`
                    p-3 rounded-xl border transition-all duration-200
                    ${isChanged ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200 hover:border-slate-300'}
                  `}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">{key}</span>
                        <div className="flex space-x-1">
                          <button
                            onClick={handleEditSave}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full h-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-mono resize-none focus:outline-none focus:border-blue-500 transition-colors"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div
                      onDoubleClick={() => handleEditStart(key, value)}
                      className="cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-700">{key}</span>
                          <span className={`
                            text-[9px] px-1.5 py-0.5 rounded-md font-medium border
                            ${getTypeColor(valueType)}
                          `}>
                            {valueType}
                          </span>
                        </div>
                        {!readOnly && (
                          <button
                            onClick={() => handleEditStart(key, value)}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="text-xs font-mono text-slate-600 truncate bg-slate-50 rounded-lg px-2 py-1.5 border border-slate-100">
                        {formatValue(value)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 p-3 bg-slate-50/50">
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>共 {filteredEntries.length} 个变量</span>
          {!readOnly && <span className="text-slate-400">双击编辑</span>}
        </div>
      </div>
    </div>
  );
}
