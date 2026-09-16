import React from 'react';
import { Crown, Settings2, Trash2, Workflow, X } from 'lucide-react';
import { FlowDefinition } from '../../types';

interface FlowConfigPanelProps {
  flow: FlowDefinition | null;
  canDelete?: boolean;
  readOnly?: boolean;
  onClose?: () => void;
  onDelete?: () => void;
  onMakeEntry?: () => void;
}

export default function FlowConfigPanel({
  flow,
  canDelete = false,
  readOnly = false,
  onClose,
  onDelete,
  onMakeEntry,
}: FlowConfigPanelProps) {
  if (!flow) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-slate-400">
        <div>
          <Workflow size={40} className="mx-auto mb-3 text-slate-200" />
          <div className="text-sm font-medium text-slate-500">选择一个 Flow</div>
          <div className="mt-1 text-xs leading-6 text-slate-400">Flow 名称和入口设置会显示在这里。</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Settings2 size={16} className="text-slate-600" />
          <div>
            <div className="text-sm font-semibold text-slate-800">Flow 配置</div>
            <div className="text-[11px] text-slate-400">{flow.id}</div>
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

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            <Workflow size={12} />
            Flow Summary
          </div>
          <div className="space-y-2 text-sm text-slate-700">
            <div>{flow.nodes.length} 节点</div>
            <div>{flow.edges.length} 连线</div>
            <div>{flow.isEntry ? '当前是入口 Flow' : '当前是子 Flow'}</div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={onMakeEntry}
                disabled={readOnly || flow.isEntry}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Crown size={14} />
                设为入口 Flow
              </button>

              {canDelete ? (
                <button
                  onClick={onDelete}
                  disabled={readOnly}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={14} />
                  删除 Flow
                </button>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
