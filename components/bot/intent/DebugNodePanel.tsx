import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight, Clock, AlertCircle, CheckCircle, Play, Database, ArrowRight, Tag, Settings } from 'lucide-react';
import { IntentNode, NodeExecutionInfo } from '../../../types';

interface DebugNodePanelProps {
  node: IntentNode;
  executionInfo?: NodeExecutionInfo;
  onClose: () => void;
}

// Node type to color mapping (same as IntentFlowDebugger)
const getNodeTypeColor = (type: string, subType?: string) => {
  if (subType === 'end_flow') return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', icon: 'text-slate-500' };
  switch(type) {
    case 'START': return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500' };
    case 'LISTEN': return { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', icon: 'text-indigo-500' };
    case 'BRANCH': return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'text-orange-500' };
    case 'AI_AGENT': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-500' };
    case 'LOGIC': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-500' };
    case 'ACTION': return { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: 'text-rose-500' };
    case 'DATA': return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-500' };
    default: return { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-700', icon: 'text-gray-500' };
  }
};

export default function DebugNodePanel({ node, executionInfo, onClose }: DebugNodePanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    input: true,
    output: true,
    execution: true,
    config: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const formatJSON = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'error':
        return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'executing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'skipped':
        return 'text-slate-600 bg-slate-50 border-slate-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'success':
        return '执行成功';
      case 'error':
        return '执行错误';
      case 'executing':
        return '执行中';
      case 'skipped':
        return '已跳过';
      default:
        return '未执行';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'executing':
        return <Play className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const colors = getNodeTypeColor(node.type, node.subType);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${colors.bg} ${colors.icon}`}>
            {getStatusIcon(executionInfo?.status) || <Settings className="w-4 h-4" />}
          </div>
          <div>
            <span className="text-sm font-bold text-slate-800">{node.label}</span>
            <div className="text-[10px] text-slate-500 mt-0.5">{node.type} · {node.subType}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Execution Status */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection('execution')}
            className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-slate-400 mr-2" />
              <span className="text-xs font-bold text-slate-700">执行信息</span>
            </div>
            {expandedSections.execution ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedSections.execution && (
            <div className="px-3 pb-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">执行状态</span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border ${getStatusColor(executionInfo?.status)}`}>
                  {getStatusText(executionInfo?.status)}
                </span>
              </div>

              {executionInfo?.duration && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">执行耗时</span>
                  <span className="text-xs text-slate-700 font-mono font-medium">{executionInfo.duration}ms</span>
                </div>
              )}

              {executionInfo?.attemptCount && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">执行次数</span>
                  <span className="text-xs text-slate-700">{executionInfo.attemptCount}</span>
                </div>
              )}

              {executionInfo?.startTime && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">开始时间</span>
                  <span className="text-xs text-slate-700 font-mono">
                    {new Date(executionInfo.startTime).toLocaleTimeString()}
                  </span>
                </div>
              )}

              {executionInfo?.error && (
                <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg">
                  <div className="flex items-center mb-1">
                    <AlertCircle className="w-3 h-3 text-rose-500 mr-1.5" />
                    <span className="text-[10px] text-rose-600 font-medium">错误信息</span>
                  </div>
                  <p className="text-xs text-rose-700">{executionInfo.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Data */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection('input')}
            className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center">
              <Database className="w-4 h-4 text-slate-400 mr-2" />
              <span className="text-xs font-bold text-slate-700">输入数据</span>
            </div>
            {expandedSections.input ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedSections.input && (
            <div className="px-3 pb-3">
              {executionInfo?.input ? (
                <pre className="text-xs text-slate-700 bg-slate-50 rounded-lg p-3 overflow-x-auto font-mono border border-slate-100">
                  {formatJSON(executionInfo.input)}
                </pre>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  暂无输入数据
                </p>
              )}
            </div>
          )}
        </div>

        {/* Output Data */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection('output')}
            className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center">
              <ArrowRight className="w-4 h-4 text-slate-400 mr-2" />
              <span className="text-xs font-bold text-slate-700">输出数据</span>
            </div>
            {expandedSections.output ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedSections.output && (
            <div className="px-3 pb-3">
              {executionInfo?.output ? (
                <pre className="text-xs text-slate-700 bg-slate-50 rounded-lg p-3 overflow-x-auto font-mono border border-slate-100">
                  {formatJSON(executionInfo.output)}
                </pre>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  暂无输出数据
                </p>
              )}
            </div>
          )}
        </div>

        {/* Node Config */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection('config')}
            className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center">
              <Tag className="w-4 h-4 text-slate-400 mr-2" />
              <span className="text-xs font-bold text-slate-700">节点配置</span>
            </div>
            {expandedSections.config ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedSections.config && (
            <div className="px-3 pb-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">节点类型</span>
                <span className="text-xs text-slate-700 font-medium">{node.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">子类型</span>
                <span className="text-xs text-slate-700 font-medium">{node.subType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">节点 ID</span>
                <span className="text-xs text-slate-700 font-mono">{node.id}</span>
              </div>
              {node.config && (
                <div className="mt-2">
                  <span className="text-xs text-slate-500 block mb-1.5">配置详情</span>
                  <pre className="text-xs text-slate-700 bg-slate-50 rounded-lg p-3 overflow-x-auto font-mono border border-slate-100">
                    {formatJSON(node.config)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
