
import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { IntentNode, LabelGroup } from '../../../../types';
import { Label, Select } from '../../../ui/FormComponents';
import VisualConditionBuilder from './VisualConditionBuilder';
import ExtractionRuleConfig from './ExtractionRuleConfig';
import SimpleErrorHandling from './SimpleErrorHandling';

interface Props {
  node: IntentNode;
  onChange: (updates: any) => void;
  availableNodes?: { label: string; value: string }[];
  labelGroups?: LabelGroup[]; // Receive global labels
}

const LogicConfig: React.FC<Props> = ({ node, onChange, availableNodes = [], labelGroups = [] }) => {
  // 5. Condition
  if (node.subType === 'condition') {
    return (
      <div className="space-y-4">
        {(node.config?.expressions || []).map((expr: any, idx: number) => (
          <div key={idx} className="p-3 bg-amber-50 border border-amber-100 rounded text-xs space-y-3 relative">
            {/* Branch Name */}
            <input
              className="w-full px-2 py-1.5 bg-white border border-amber-200 rounded font-bold text-amber-800 text-sm"
              placeholder="分支名称 (如: 已收集姓名)"
              value={expr.name}
              onChange={(e) => {
                const newExprs = [...(node.config?.expressions || [])];
                newExprs[idx] = { ...expr, name: e.target.value };
                onChange({ expressions: newExprs });
              }}
            />

            {/* Visual Condition Builder */}
            <div className="bg-white border border-amber-100 rounded p-2">
              <VisualConditionBuilder
                value={expr.logic || ''}
                onChange={(newLogic) => {
                  const newExprs = [...(node.config?.expressions || [])];
                  newExprs[idx] = { ...expr, logic: newLogic };
                  onChange({ expressions: newExprs });
                }}
                availableVariables={['userName', 'phone', 'email', 'address', 'age', 'status', 'tags']}
              />
            </div>

            {/* Connection Status Indicator */}
            <div className="flex items-center justify-between pt-2 border-t border-amber-100">
              <div className="flex items-center space-x-2 flex-1">
                <span className="text-[10px] text-amber-700 font-bold whitespace-nowrap">
                  {expr.targetNodeId ? '✓ 已连接' : '未连接'}:
                </span>
                <select
                  className="flex-1 px-2 py-1.5 text-[10px] border border-amber-200 rounded bg-white outline-none"
                  value={expr.targetNodeId || ''}
                  onChange={(e) => {
                    const newExprs = [...(node.config?.expressions || [])];
                    newExprs[idx] = { ...expr, targetNodeId: e.target.value };
                    onChange({ expressions: newExprs });
                  }}
                >
                  <option value="">-- 选择节点 --</option>
                  {availableNodes.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {expr.targetNodeId && (
                <button
                  onClick={() => {
                    const newExprs = [...(node.config?.expressions || [])];
                    newExprs[idx] = { ...expr, targetNodeId: undefined };
                    onChange({ expressions: newExprs });
                  }}
                  className="ml-2 text-slate-300 hover:text-red-500 p-1"
                  title="断开连接"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={() => {
                const newExprs = (node.config?.expressions || []).filter((_: any, i: number) => i !== idx);
                onChange({ expressions: newExprs });
              }}
              className="absolute top-2 right-2 text-amber-300 hover:text-red-500 p-1"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            const newExpr = { id: Date.now().toString(), name: '新分支', logic: '' };
            onChange({ expressions: [...(node.config?.expressions || []), newExpr] });
          }}
          className="w-full py-2 border border-dashed border-amber-300 rounded text-xs text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"
        >
          <Plus size={14} className="mr-1" /> 添加条件分支
        </button>

        {/* Else Branch - 均不满足配置 */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">均不满足时</span>
            <span className="text-[10px] text-slate-400">当所有条件都不满足时</span>
          </div>
          <div className="flex items-center space-x-2 pt-1">
             <span className="text-[10px] text-slate-600 font-bold whitespace-nowrap">跳转至:</span>
             <select
                className="flex-1 px-2 py-1.5 text-[10px] border border-slate-200 rounded bg-white outline-none"
                value={node.config?.elseTargetId || ''}
                onChange={(e) => onChange({ elseTargetId: e.target.value })}
             >
                <option value="">-- 选择节点 --</option>
                {availableNodes.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
             </select>
          </div>
        </div>
      </div>
    );
  }

  // 6. Set Variable (Enhanced with Extraction Mode)
  if (node.subType === 'set_variable') {
    const mode = node.config?.mode || 'SYSTEM';
    const [localVariableTypes, setLocalVariableTypes] = useState<string[]>([
      '客户姓名', '公司', '详细地址', '地铁开始地址', '地铁结束地址', '日期', '时间', '人名', '电话', '邮箱'
    ]);

    const handleAddVariableType = (newType: string) => {
      if (!localVariableTypes.includes(newType)) {
        setLocalVariableTypes([...localVariableTypes, newType]);
      }
    };

    return (
      <div className="space-y-4">
        {/* Mode Switch */}
        <div>
          <Label label="赋值模式" />
          <div className="flex bg-slate-100 p-1 rounded">
            <button
              onClick={() => onChange({ mode: 'SYSTEM' })}
              className={`flex-1 py-2 text-xs font-medium rounded transition-colors ${
                mode === 'SYSTEM'
                  ? 'bg-white shadow text-primary'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              系统赋值
            </button>
            <button
              onClick={() => onChange({ mode: 'EXTRACTION' })}
              className={`flex-1 py-2 text-xs font-medium rounded transition-colors ${
                mode === 'EXTRACTION'
                  ? 'bg-white shadow text-primary'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              提取赋值
            </button>
          </div>
        </div>

        {/* System Mode - Original Operations */}
        {mode === 'SYSTEM' && (
          <div className="space-y-3">
            <div className="flex space-x-2 text-[10px] text-slate-500 font-bold px-1">
              <span className="flex-1">变量名</span>
              <span className="w-16">操作</span>
              <span className="flex-1">值</span>
            </div>
            {(node.config?.operations || []).map((op: any, idx: number) => (
              <div key={idx} className="flex space-x-1 items-center">
                <input
                  className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-gray-200 rounded"
                  placeholder="变量名"
                  value={op.variableId}
                  onChange={(e) => {
                    const newOps = [...(node.config?.operations || [])];
                    newOps[idx] = { ...op, variableId: e.target.value };
                    onChange({ operations: newOps });
                  }}
                />
                <select
                  className="w-16 px-1 py-1.5 text-xs border border-gray-200 rounded bg-white"
                  value={op.type}
                  onChange={(e) => {
                    const newOps = [...(node.config?.operations || [])];
                    newOps[idx] = { ...op, type: e.target.value };
                    onChange({ operations: newOps });
                  }}
                >
                  <option value="SET">=</option>
                  <option value="ADD">+</option>
                  <option value="SUBTRACT">-</option>
                </select>
                <input
                  className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-gray-200 rounded"
                  placeholder="值"
                  value={op.value}
                  onChange={(e) => {
                    const newOps = [...(node.config?.operations || [])];
                    newOps[idx] = { ...op, value: e.target.value };
                    onChange({ operations: newOps });
                  }}
                />
                <button
                  onClick={() => {
                    const newOps = (node.config?.operations || []).filter((_: any, i: number) => i !== idx);
                    onChange({ operations: newOps });
                  }}
                  className="text-slate-300 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const newOp = { variableId: '', type: 'SET', value: '' };
                onChange({ operations: [...(node.config?.operations || []), newOp] });
              }}
              className="w-full py-2 border border-dashed border-gray-300 rounded text-xs text-slate-500 hover:text-primary hover:border-primary transition-colors flex items-center justify-center"
            >
              <Plus size={14} className="mr-1" /> 添加操作
            </button>
          </div>
        )}

        {/* Extraction Mode - New Feature */}
        {mode === 'EXTRACTION' && (
          <div className="space-y-4">
            {/* Voice Collection Toggle */}
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded">
              <div>
                <span className="text-sm font-medium text-slate-700">对话变量赋值</span>
                <p className="text-[10px] text-slate-400 mt-0.5">开启后从对话中提取变量</p>
              </div>
              <button
                onClick={() => onChange({ voiceCollectionEnabled: !node.config?.voiceCollectionEnabled })}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  node.config?.voiceCollectionEnabled ? 'bg-blue-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    node.config?.voiceCollectionEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Extraction Rules */}
            {node.config?.voiceCollectionEnabled && (
              <ExtractionRuleConfig
                rules={node.config?.extractionRules || []}
                onChange={(rules) => onChange({ extractionRules: rules })}
                availableVariables={['userName', 'phone', 'email', 'address', 'company', 'orderNo', 'age']}
                variableTypes={localVariableTypes}
                onAddVariableType={handleAddVariableType}
              />
            )}

            {/* Error Handling for Extraction Mode */}
            {node.config?.voiceCollectionEnabled && (
              <div className="pt-4 border-t border-blue-100">
                <SimpleErrorHandling
                  label="提取失败时跳转至"
                  tooltip="包括正则无匹配、大模型提取失败等情况"
                  value={node.config?.onExtractionErrorNodeId || ''}
                  onChange={(value) => onChange({ onExtractionErrorNodeId: value })}
                  availableNodes={availableNodes}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 7. Tag (New)
  if (node.subType === 'tag') {
    const allTags = labelGroups.flatMap(g => g.tags.map(t => ({ label: `${g.name}: ${t.name}`, value: t.name })));
    
    return (
      <>
        <Select 
          label="动作"
          options={[{label: '添加标签', value: 'ADD'}, {label: '移除标签', value: 'REMOVE'}]}
          value={node.config?.action || 'ADD'}
          onChange={(e) => onChange({ action: e.target.value })}
        />
        <Label label="选择标签" />
        <select 
           className="w-full px-3 py-2 text-sm border border-gray-200 rounded bg-white outline-none"
           value={node.config?.tags?.[0] || ''}
           onChange={(e) => onChange({ tags: [e.target.value] })}
        >
           <option value="">请选择标签...</option>
           {allTags.map((t, i) => <option key={i} value={t.value}>{t.label}</option>)}
        </select>
        {allTags.length === 0 && <div className="text-[10px] text-amber-500 mt-1">请先在“业务分析”中配置标签组。</div>}
      </>
    );
  }

  // 9. Script
  if (node.subType === 'script') {
    return (
      <>
        <Select 
          label="语言"
          options={['javascript', 'python']}
          value={node.config?.language || 'javascript'}
          onChange={(e) => onChange({ language: e.target.value })}
        />
        <Label label="代码内容" />
        <textarea 
          className="w-full h-64 px-3 py-2 text-xs border border-gray-200 rounded resize-none focus:border-primary outline-none font-mono bg-slate-900 text-green-400"
          value={node.config?.code || ''}
          onChange={(e) => onChange({ code: e.target.value })}
          spellCheck={false}
        />

        {/* Error Handling */}
        <div className="pt-4 border-t border-gray-100">
          <SimpleErrorHandling
            label="执行异常时跳转至"
            tooltip="包括代码错误、执行超时、内存溢出等"
            value={node.config?.onErrorNodeId || ''}
            onChange={(value) => onChange({ onErrorNodeId: value })}
            availableNodes={availableNodes}
          />
        </div>
      </>
    );
  }

  return null;
};

export default LogicConfig;
