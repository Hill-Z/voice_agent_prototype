// 任务流程画布的节点卡片和组件库项，供编排工作台复用。
import React, { DragEvent, MouseEvent as ReactMouseEvent } from 'react';
import {
  NODE_HEIGHT,
  NODE_TYPE_CLASS_MAP,
  NODE_TYPE_ICON_MAP,
  NODE_WIDTH,
  RISK_CLASS_MAP,
} from './longTermFlowDesignerUtils';
import type { ComponentLibraryItem, LongTermFlowNode, LongTermFlowNodeType } from './longTermFlowTypes';

// 显示左侧组件库中的单个节点类型。
export function LibraryItem({ item, onAdd, onDragStart }: {
  item: ComponentLibraryItem;
  onAdd: (type: LongTermFlowNodeType) => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>, type: LongTermFlowNodeType) => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => onDragStart(event, item.type)}
      onClick={() => onAdd(item.type)}
      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-primary hover:bg-blue-50"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Icon size={16} className="text-primary" />
        {item.title}
      </div>
      <div className="mt-1 text-xs leading-5 text-slate-500">{item.description}</div>
    </button>
  );
}

// 展示流程画布中的单个节点。
export function FlowNodeCard({
  node,
  selected,
  onMouseDown,
  onMouseUp,
  onSelect,
  onConnectorMouseDown,
  onDragStart,
}: {
  node: LongTermFlowNode;
  selected: boolean;
  onMouseDown: (event: ReactMouseEvent<HTMLButtonElement>, node: LongTermFlowNode) => void;
  onMouseUp: (event: ReactMouseEvent<HTMLButtonElement>, nodeId: string) => void;
  onSelect: (nodeId: string) => void;
  onConnectorMouseDown: (event: ReactMouseEvent<HTMLSpanElement>, nodeId: string) => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>, nodeId: string) => void;
}) {
  const Icon = NODE_TYPE_ICON_MAP[node.type];
  return (
    <button
      type="button"
      draggable
      aria-label={`查看节点配置：${node.title}`}
      onDragStart={(event) => onDragStart(event, node.id)}
      onMouseDown={(event) => onMouseDown(event, node)}
      onMouseUp={(event) => onMouseUp(event, node.id)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(node.id);
      }}
      className={`absolute rounded-2xl border p-3 text-left shadow-sm transition-all ${NODE_TYPE_CLASS_MAP[node.type]} ${
        selected ? 'ring-2 ring-primary ring-offset-2' : 'hover:-translate-y-0.5 hover:shadow-md'
      }`}
      style={{ left: node.position.x, top: node.position.y, width: NODE_WIDTH, minHeight: NODE_HEIGHT }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Icon size={15} />
          {node.type}
        </div>
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-slate-500">D+{node.dayOffset}</span>
      </div>
      <div className="mt-3 text-sm font-bold text-slate-900">{node.title}</div>
      <div className="mt-1 text-xs text-slate-500">{node.subtitle}</div>
      <div className="mt-3 line-clamp-2 text-xs leading-5 text-slate-600">{node.description}</div>
      <div className="mt-3 flex items-center justify-between border-t border-white/70 pt-2 text-[11px] text-slate-500">
        <span className="truncate pr-2">输出：{node.output}</span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 font-semibold ${RISK_CLASS_MAP[node.riskLevel]}`}>{node.riskLevel}</span>
      </div>
      <span
        data-no-node-drag="true"
        aria-label={`从 ${node.title} 拉出连线`}
        onMouseDown={(event) => onConnectorMouseDown(event, node.id)}
        className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow-sm transition-transform hover:scale-125"
      />
    </button>
  );
}
