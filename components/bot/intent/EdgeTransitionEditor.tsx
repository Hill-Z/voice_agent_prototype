import React from 'react';
import { X, ArrowRight, Info } from 'lucide-react';
import { IntentEdge, IntentNode } from '../../../types';

interface EdgeTransitionEditorProps {
  edge: IntentEdge;
  sourceNode: IntentNode;
  targetNode: IntentNode;
  onClose: () => void;
}

export default function EdgeTransitionEditor({
  edge,
  sourceNode,
  targetNode,
  onClose
}: EdgeTransitionEditorProps) {
  return (
    <div className="absolute top-0 right-0 bottom-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col animate-in slide-in-from-right duration-200">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <ArrowRight size={16} className="text-primary" />
          <span className="text-sm font-bold text-slate-800">连线信息</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-blue-700 mb-2">
            <Info size={12} />
            <span className="font-medium">流程走向</span>
          </div>
          <div className="text-xs text-blue-600">
            <p>从 <strong>{sourceNode.label}</strong></p>
            <p className="mt-1">到 <strong>{targetNode.label}</strong></p>
          </div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <div className="text-xs text-amber-700">
            <p className="font-medium mb-1">提示</p>
            <p>流程跳转逻辑由过渡函数代码控制。</p>
            <p className="mt-1">在源节点的步骤提示词中配置过渡函数引用。</p>
          </div>
        </div>

        {edge.label && (
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">连线标签</label>
            <div className="px-3 py-2 bg-slate-50 rounded border border-slate-200 text-sm text-slate-600">
              {edge.label}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-slate-50">
        <button
          onClick={onClose}
          className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          关闭
        </button>
      </div>
    </div>
  );
}
