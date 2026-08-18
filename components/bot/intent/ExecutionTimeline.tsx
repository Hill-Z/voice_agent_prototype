import React, { useRef } from 'react';
import { Clock, CheckCircle, AlertCircle, SkipForward, Play, RotateCcw } from 'lucide-react';
import { ExecutionStep, IntentNode } from '../../../types';

interface ExecutionTimelineProps {
  history: ExecutionStep[];
  currentStep: number;
  onJumpToStep: (stepIndex: number) => void;
  nodes: IntentNode[];
}

// Node type to color mapping
const getNodeTypeColor = (type: string, subType?: string) => {
  if (subType === 'end_flow') return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', dot: 'bg-slate-400' };
  switch(type) {
    case 'START': return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-400' };
    case 'LISTEN': return { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', dot: 'bg-indigo-400' };
    case 'BRANCH': return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-400' };
    case 'AI_AGENT': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400' };
    case 'LOGIC': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-400' };
    case 'ACTION': return { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-400' };
    case 'DATA': return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-400' };
    default: return { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-700', dot: 'bg-gray-400' };
  }
};

export default function ExecutionTimeline({
  history,
  currentStep,
  onJumpToStep,
  nodes
}: ExecutionTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-500" />;
      case 'skipped':
        return <SkipForward className="w-3.5 h-3.5 text-slate-400" />;
      case 'executing':
        return <Play className="w-3.5 h-3.5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-emerald-400 bg-emerald-50';
      case 'error':
        return 'border-rose-400 bg-rose-50';
      case 'skipped':
        return 'border-slate-300 bg-slate-50';
      case 'executing':
        return 'border-blue-400 bg-blue-50';
      default:
        return 'border-slate-200 bg-white';
    }
  };

  const getNodeLabel = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node?.label || nodeId;
  };

  const getNodeType = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node?.subType || node?.type || 'unknown';
  };

  const getNodeColors = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return getNodeTypeColor(node?.type || 'ACTION', node?.subType);
  };

  if (history.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <RotateCcw className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-600">尚未开始执行</p>
        <p className="text-xs mt-1 text-slate-400">点击"开始"按钮启动调试</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center">
          <Clock className="w-4 h-4 text-slate-400 mr-2" />
          <span className="text-xs font-bold text-slate-700">执行步骤</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
          {currentStep + 1} / {history.length}
        </span>
      </div>

      {/* Timeline */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2"
      >
        {history.map((step, index) => {
          const isCurrent = index === currentStep;
          const isPast = index < currentStep;
          const isFuture = index > currentStep;
          const colors = getNodeColors(step.nodeId);

          return (
            <div
              key={step.id}
              onClick={() => onJumpToStep(index)}
              className={`
                relative flex items-start p-3 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${isCurrent ? 'border-blue-500 bg-blue-50/50 shadow-sm' : getStatusColor(step.executionInfo.status)}
                ${isPast ? 'opacity-80' : ''}
                ${isFuture ? 'opacity-50' : ''}
                hover:opacity-100 hover:shadow-md
              `}
            >
              {/* Step Number */}
              <div className={`
                flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mr-3
                ${isCurrent ? 'bg-blue-500 text-white' : colors.dot + ' text-white'}
              `}>
                {index + 1}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 truncate">
                    {getNodeLabel(step.nodeId)}
                  </span>
                  {getStatusIcon(step.executionInfo.status)}
                </div>

                <div className="flex items-center mt-1 space-x-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                    {getNodeType(step.nodeId)}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {step.executionInfo.duration}ms
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 mt-1">
                  {new Date(step.timestamp).toLocaleTimeString()}
                </div>

                {/* Current Indicator */}
                {isCurrent && (
                  <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="border-t border-slate-200 p-4 bg-slate-50/50">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <div className="text-lg font-bold text-emerald-600">
              {history.filter(h => h.executionInfo.status === 'success').length}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">成功</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <div className="text-lg font-bold text-rose-600">
              {history.filter(h => h.executionInfo.status === 'error').length}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">错误</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <div className="text-lg font-bold text-slate-700">
              {history.reduce((sum, h) => sum + (h.executionInfo.duration || 0), 0)}ms
            </div>
            <div className="text-[10px] text-slate-500 font-medium">总耗时</div>
          </div>
        </div>
      </div>
    </div>
  );
}
