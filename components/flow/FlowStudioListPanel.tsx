import React, { useState } from 'react';
import { Crown, GripVertical, Plus, Settings2, Workflow } from 'lucide-react';
import { FlowDefinition } from '../../types';

interface FlowStudioListPanelProps {
  flows: FlowDefinition[];
  activeFlowId: string;
  onSelect: (flowId: string) => void;
  onOpenConfig: (flowId: string) => void;
  onAddFlow: () => void;
  onReorder: (draggedFlowId: string, targetFlowId: string) => void;
}

export default function FlowStudioListPanel({
  flows,
  activeFlowId,
  onSelect,
  onOpenConfig,
  onAddFlow,
  onReorder,
}: FlowStudioListPanelProps) {
  const [draggingFlowId, setDraggingFlowId] = useState<string | null>(null);

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-gray-200 bg-slate-50">
      <div className="border-b border-gray-200 bg-white px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-800">Flow 列表</div>
            <div className="mt-1 text-xs text-slate-400">创建、切换、排序和管理入口 Flow / 子 Flow</div>
          </div>
          <button
            onClick={onAddFlow}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-primary hover:text-primary"
          >
            <Plus size={14} />
            新建
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {flows.map((flow) => (
          <div
            key={flow.id}
            draggable
            onDragStart={() => setDraggingFlowId(flow.id)}
            onDragEnd={() => setDraggingFlowId(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (draggingFlowId && draggingFlowId !== flow.id) {
                onReorder(draggingFlowId, flow.id);
              }
              setDraggingFlowId(null);
            }}
            onClick={() => onSelect(flow.id)}
            className={`w-full rounded-2xl border px-3 py-3 text-left transition-all cursor-pointer ${
              activeFlowId === flow.id
                ? 'border-primary bg-white shadow-sm'
                : 'border-gray-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-slate-300">
                <GripVertical size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-semibold text-slate-800">
                    {flow.isEntry ? (
                      <Crown size={14} className="fill-amber-400 text-amber-400" />
                    ) : (
                      <Workflow size={14} className="text-slate-400" />
                    )}
                    <span className="truncate">{flow.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenConfig(flow.id);
                    }}
                    className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    title="打开流程设置"
                  >
                    <Settings2 size={13} />
                  </button>
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {flow.nodes.length} 节点 · {flow.edges.length} 连线
                </div>
              </div>
              <div className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                {flow.isEntry ? '入口' : '子 Flow'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 bg-white px-4 py-3 text-xs leading-6 text-slate-500">
        左侧拖拽排序 Flow，画布左边工具栏拖拽创建节点；节点和边的详细配置在右侧抽屉中编辑。
      </div>
    </aside>
  );
}
