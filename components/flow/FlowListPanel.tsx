import React from 'react';
import { Plus, Crown, MessageSquareMore } from 'lucide-react';
import { FlowAnnotation, FlowDefinition } from '../../types';

interface FlowListPanelProps {
  flows: FlowDefinition[];
  activeFlowId: string;
  annotationMode: boolean;
  annotations: FlowAnnotation[];
  onSelect: (flowId: string) => void;
  onAddFlow: () => void;
  onAnnotationSelect: (annotationId: string) => void;
}

function AnnotationBadge({
  index,
  onClick,
}: {
  index: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white shadow"
    >
      {index}
    </button>
  );
}

export default function FlowListPanel({
  flows,
  activeFlowId,
  annotationMode,
  annotations,
  onSelect,
  onAddFlow,
  onAnnotationSelect,
}: FlowListPanelProps) {
  const panelAnnotation = annotations.find(
    (annotation) => annotation.targetType === 'panel' && annotation.targetId === 'flow-list-panel',
  );

  return (
    <aside className="relative flex w-72 shrink-0 flex-col border-r border-gray-200 bg-slate-50">
      <div className="border-b border-gray-200 bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-800">Flow 列表</div>
            <div className="mt-1 text-xs text-slate-400">入口 Flow 与子 Flow</div>
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
        {flows.map((flow) => {
          const flowAnnotation = annotations.find(
            (annotation) => annotation.targetType === 'flow' && annotation.targetId === flow.id,
          );

          return (
            <button
              key={flow.id}
              onClick={() => onSelect(flow.id)}
              className={`relative w-full rounded-xl border px-3 py-3 text-left transition-all ${
                activeFlowId === flow.id
                  ? 'border-primary bg-white shadow-sm'
                  : 'border-gray-200 bg-white hover:border-slate-300'
              }`}
            >
              {annotationMode && flowAnnotation ? (
                <AnnotationBadge
                  index={flowAnnotation.index}
                  onClick={() => onAnnotationSelect(flowAnnotation.id)}
                />
              ) : null}

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                    {flow.isEntry ? <Crown size={14} className="fill-amber-400 text-amber-400" /> : null}
                    <span className="truncate">{flow.name}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    {flow.nodes.length} 节点 · {flow.edges.length} 连线
                  </div>
                </div>
                <div className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  {flow.isEntry ? '入口' : '子 Flow'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="border-t border-gray-200 bg-white px-4 py-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <MessageSquareMore size={14} className="text-slate-400" />
          当前原型用于内部评审，不影响旧的意图技能流程。
        </div>
      </div>

      {annotationMode && panelAnnotation ? (
        <AnnotationBadge
          index={panelAnnotation.index}
          onClick={() => onAnnotationSelect(panelAnnotation.id)}
        />
      ) : null}
    </aside>
  );
}
