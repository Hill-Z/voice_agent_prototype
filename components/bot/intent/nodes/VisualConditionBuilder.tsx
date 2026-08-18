import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Code, Eye, EyeOff } from 'lucide-react';

interface ConditionRule {
  id: string;
  variable: string;
  operator: 'is_empty' | 'not_empty' | 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'starts_with' | 'ends_with' | 'regex';
  value?: string;
}

interface ConditionGroup {
  id: string;
  logic: 'AND' | 'OR';
  rules: ConditionRule[];
}

interface VisualConditionBuilderProps {
  value: string;
  onChange: (expression: string) => void;
  availableVariables?: string[];
}

const OPERATOR_OPTIONS = [
  { value: 'is_empty', label: '为空', hasValue: false },
  { value: 'not_empty', label: '不为空', hasValue: false },
  { value: 'equals', label: '等于', hasValue: true },
  { value: 'not_equals', label: '不等于', hasValue: true },
  { value: 'contains', label: '包含', hasValue: true },
  { value: 'not_contains', label: '不包含', hasValue: true },
  { value: 'gt', label: '大于', hasValue: true },
  { value: 'gte', label: '大于等于', hasValue: true },
  { value: 'lt', label: '小于', hasValue: true },
  { value: 'lte', label: '小于等于', hasValue: true },
  { value: 'starts_with', label: '开头是', hasValue: true },
  { value: 'ends_with', label: '结尾是', hasValue: true },
  { value: 'regex', label: '正则匹配', hasValue: true },
];

// Parse expression string to condition groups
const parseExpression = (expr: string): ConditionGroup[] => {
  if (!expr.trim()) return [{ id: '1', logic: 'AND', rules: [] }];
  
  // Simple parsing - treat as single group with single rule for complex expressions
  // This is a simplified parser
  try {
    // Check if it's a simple variable check
    const emptyMatch = expr.match(/!\s*variables\.(\w+)\s*\|\|\s*variables\.(\w+)\s*===?\s*['"]\s*['"]/);
    if (emptyMatch) {
      return [{
        id: '1',
        logic: 'AND',
        rules: [{ id: '1', variable: emptyMatch[1], operator: 'is_empty' }]
      }];
    }
    
    const notEmptyMatch = expr.match(/variables\.(\w+)\s*&&\s*variables\.(\w+)\s*!==?\s*['"]\s*['"]/);
    if (notEmptyMatch) {
      return [{
        id: '1',
        logic: 'AND',
        rules: [{ id: '1', variable: notEmptyMatch[1], operator: 'not_empty' }]
      }];
    }
    
    const equalsMatch = expr.match(/variables\.(\w+)\s*===?\s*['"]([^'"]+)['"]/);
    if (equalsMatch) {
      return [{
        id: '1',
        logic: 'AND',
        rules: [{ id: '1', variable: equalsMatch[1], operator: 'equals', value: equalsMatch[2] }]
      }];
    }
    
    const containsMatch = expr.match(/variables\.(\w+)\.(\w+)\(['"]([^'"]+)['"]\)/);
    if (containsMatch) {
      return [{
        id: '1',
        logic: 'AND',
        rules: [{ id: '1', variable: containsMatch[1], operator: 'contains', value: containsMatch[3] }]
      }];
    }
    
    // Default: return empty group, keep original expression
    return [{ id: '1', logic: 'AND', rules: [] }];
  } catch {
    return [{ id: '1', logic: 'AND', rules: [] }];
  }
};

// Build expression from condition groups
const buildExpression = (groups: ConditionGroup[]): string => {
  const groupExpressions = groups.map(group => {
    const ruleExpressions = group.rules.map(rule => {
      const varRef = `variables.${rule.variable}`;
      
      switch (rule.operator) {
        case 'is_empty':
          return `!${varRef} || ${varRef} === ''`;
        case 'not_empty':
          return `${varRef} && ${varRef} !== ''`;
        case 'equals':
          return `${varRef} === '${rule.value || ''}'`;
        case 'not_equals':
          return `${varRef} !== '${rule.value || ''}'`;
        case 'contains':
          return `${varRef}.includes('${rule.value || ''}')`;
        case 'not_contains':
          return `!${varRef}.includes('${rule.value || ''}')`;
        case 'gt':
          return `${varRef} > ${rule.value || 0}`;
        case 'gte':
          return `${varRef} >= ${rule.value || 0}`;
        case 'lt':
          return `${varRef} < ${rule.value || 0}`;
        case 'lte':
          return `${varRef} <= ${rule.value || 0}`;
        case 'starts_with':
          return `${varRef}.startsWith('${rule.value || ''}')`;
        case 'ends_with':
          return `${varRef}.endsWith('${rule.value || ''}')`;
        case 'regex':
          return `new RegExp('${rule.value || ''}').test(${varRef})`;
        default:
          return '';
      }
    }).filter(Boolean);
    
    if (ruleExpressions.length === 0) return '';
    if (ruleExpressions.length === 1) return ruleExpressions[0];
    return ruleExpressions.join(` ${group.logic === 'AND' ? '&&' : '||'} `);
  }).filter(Boolean);
  
  if (groupExpressions.length === 0) return '';
  if (groupExpressions.length === 1) return groupExpressions[0];
  return groupExpressions.join(' && ');
};

export default function VisualConditionBuilder({ 
  value, 
  onChange,
  availableVariables = []
}: VisualConditionBuilderProps) {
  const [groups, setGroups] = useState<ConditionGroup[]>([{ id: '1', logic: 'AND', rules: [] }]);
  const [showCode, setShowCode] = useState(false);
  const [manualCode, setManualCode] = useState(value);

  // Sync with external value
  useEffect(() => {
    if (value !== manualCode && !showCode) {
      const parsed = parseExpression(value);
      setGroups(parsed);
      setManualCode(value);
    }
  }, [value]);

  // Update expression when groups change
  useEffect(() => {
    if (!showCode) {
      const newExpr = buildExpression(groups);
      if (newExpr !== value) {
        onChange(newExpr);
        setManualCode(newExpr);
      }
    }
  }, [groups, showCode]);

  const addGroup = () => {
    setGroups([...groups, { id: Date.now().toString(), logic: 'AND', rules: [] }]);
  };

  const removeGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
  };

  const updateGroupLogic = (groupId: string, logic: 'AND' | 'OR') => {
    setGroups(groups.map(g => g.id === groupId ? { ...g, logic } : g));
  };

  const addRule = (groupId: string) => {
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          rules: [...g.rules, { id: Date.now().toString(), variable: '', operator: 'not_empty' }]
        };
      }
      return g;
    }));
  };

  const removeRule = (groupId: string, ruleId: string) => {
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        return { ...g, rules: g.rules.filter(r => r.id !== ruleId) };
      }
      return g;
    }));
  };

  const updateRule = (groupId: string, ruleId: string, updates: Partial<ConditionRule>) => {
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          rules: g.rules.map(r => r.id === ruleId ? { ...r, ...updates } : r)
        };
      }
      return g;
    }));
  };

  const handleManualCodeChange = (newCode: string) => {
    setManualCode(newCode);
    onChange(newCode);
  };

  const getOperatorLabel = (opValue: string) => {
    return OPERATOR_OPTIONS.find(o => o.value === opValue)?.label || opValue;
  };

  const needsValue = (opValue: string) => {
    return OPERATOR_OPTIONS.find(o => o.value === opValue)?.hasValue ?? true;
  };

  return (
    <div className="space-y-3">
      {/* Toggle between visual and code mode */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-medium">条件配置</span>
        <button
          onClick={() => setShowCode(!showCode)}
          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-primary transition-colors"
        >
          {showCode ? <Eye size={12} /> : <Code size={12} />}
          {showCode ? '可视化' : '代码'}
        </button>
      </div>

      {showCode ? (
        // Code Mode
        <div className="space-y-2">
          <textarea
            className="w-full h-24 px-3 py-2 text-xs border border-amber-200 rounded resize-none font-mono text-slate-600 bg-white"
            placeholder="输入JavaScript表达式，如: variables.age > 18"
            value={manualCode}
            onChange={(e) => handleManualCodeChange(e.target.value)}
          />
          <p className="text-[10px] text-slate-400">
            提示: 使用 variables.xxx 访问变量
          </p>
        </div>
      ) : (
        // Visual Mode
        <div className="space-y-3">
          {groups.map((group, groupIndex) => (
            <div key={group.id} className="bg-amber-50/50 border border-amber-100 rounded-lg p-3 space-y-2">
              {/* Group Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-amber-700">
                    条件组 {groupIndex + 1}
                  </span>
                  {group.rules.length > 1 && (
                    <select
                      value={group.logic}
                      onChange={(e) => updateGroupLogic(group.id, e.target.value as 'AND' | 'OR')}
                      className="text-[10px] px-2 py-0.5 border border-amber-200 rounded bg-white"
                    >
                      <option value="AND">且</option>
                      <option value="OR">或</option>
                    </select>
                  )}
                </div>
                {groups.length > 1 && (
                  <button
                    onClick={() => removeGroup(group.id)}
                    className="text-slate-300 hover:text-red-500"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              {/* Rules */}
              <div className="space-y-2">
                {group.rules.map((rule, ruleIndex) => (
                  <div key={rule.id} className="flex items-center gap-2">
                    {/* Rule number indicator */}
                    <span className="text-[10px] text-amber-400 w-4">
                      {ruleIndex + 1}
                    </span>
                    
                    {/* Variable input */}
                    <input
                      type="text"
                      list="available-vars"
                      value={rule.variable}
                      onChange={(e) => updateRule(group.id, rule.id, { variable: e.target.value })}
                      placeholder="变量名"
                      className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-amber-200 rounded bg-white"
                    />
                    
                    {/* Operator select */}
                    <select
                      value={rule.operator}
                      onChange={(e) => updateRule(group.id, rule.id, { operator: e.target.value as any })}
                      className="w-24 px-2 py-1.5 text-xs border border-amber-200 rounded bg-white"
                    >
                      {OPERATOR_OPTIONS.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                    
                    {/* Value input (if needed) */}
                    {needsValue(rule.operator) && (
                      <input
                        type="text"
                        value={rule.value || ''}
                        onChange={(e) => updateRule(group.id, rule.id, { value: e.target.value })}
                        placeholder="值"
                        className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-amber-200 rounded bg-white"
                      />
                    )}
                    
                    {/* Remove rule */}
                    <button
                      onClick={() => removeRule(group.id, rule.id)}
                      className="text-slate-300 hover:text-red-500 p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add rule button */}
              <button
                onClick={() => addRule(group.id)}
                className="w-full py-1.5 border border-dashed border-amber-300 rounded text-[10px] text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"
              >
                <Plus size={12} className="mr-1" /> 添加条件
              </button>
            </div>
          ))}

          {/* Add group button */}
          <button
            onClick={addGroup}
            className="w-full py-2 border border-dashed border-slate-300 rounded text-xs text-slate-500 hover:text-primary hover:border-primary transition-colors flex items-center justify-center"
          >
            <Plus size={14} className="mr-1" /> 添加条件组
          </button>

          {/* Preview expression */}
          {manualCode && (
            <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded">
              <div className="flex items-center gap-1 mb-1">
                <EyeOff size={10} className="text-slate-400" />
                <span className="text-[10px] text-slate-400">生成的表达式</span>
              </div>
              <code className="text-[10px] text-slate-600 break-all">
                {manualCode}
              </code>
            </div>
          )}
        </div>
      )}

      {/* Variable suggestions datalist */}
      <datalist id="available-vars">
        {availableVariables.map(v => (
          <option key={v} value={v} />
        ))}
      </datalist>
    </div>
  );
}
