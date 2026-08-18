import React from 'react';
import { Code2, X } from 'lucide-react';
import { FlowFunction } from '../../types';
import FunctionManager from './FunctionManager';

interface FlowFunctionLibraryPanelProps {
  functions?: FlowFunction[];
  onClose?: () => void;
  onSave?: (functions: FlowFunction[]) => void;
}

export default function FlowFunctionLibraryPanel({
  functions = [],
  onClose,
  onSave,
}: FlowFunctionLibraryPanelProps) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Code2 size={16} className="text-slate-600" />
          <div>
            <div className="text-sm font-semibold text-slate-800">代码块 / 函数库</div>
            <div className="text-[11px] text-slate-400">管理 visible functions、transition functions 和自定义代码</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
        >
          <X size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <FunctionManager functions={functions} onSave={onSave} />
      </div>
    </div>
  );
}
