import React, { useMemo, useRef, useState } from 'react';
import {
  Clock3,
  Flag,
  GitBranch,
  PhoneCall,
  Plus,
  ShieldCheck,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  FOLLOW_UP_ACTION_LABELS,
  FOLLOW_UP_NODE_META,
  FollowUpGraphEdge,
  FollowUpGraphNode,
  FollowUpGraphNodeType,
  FollowUpRuleGraphDefinition,
  getNodeOutputOptions,
} from './followUpRuleGraph';

const NODE_WIDTH = 226;
const NODE_HEIGHT = 108;

const NODE_LIBRARY: Array<{ type: FollowUpGraphNodeType; icon: React.ElementType }> = [
  { type: 'trigger', icon: Zap },
  { type: 'condition', icon: GitBranch },
  { type: 'wait', icon: Clock3 },
  { type: 'protection', icon: ShieldCheck },
  { type: 'action', icon: PhoneCall },
  { type: 'end', icon: Flag },
];

const NODE_ICON: Record<FollowUpGraphNodeType, React.ElementType> = {
  trigger: Zap,
  condition: GitBranch,
  wait: Clock3,
  protection: ShieldCheck,
  action: PhoneCall,
  end: Flag,
};

const NODE_TONE: Record<FollowUpGraphNodeType, string> = {
  trigger: 'border-blue-200 bg-blue-50 text-blue-700',
  condition: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  wait: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  protection: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  action: 'border-orange-200 bg-orange-50 text-orange-700',
  end: 'border-slate-200 bg-slate-100 text-slate-700',
};

const EDGE_TONE: Record<FollowUpGraphEdge['edgeType'], string> = {
  normal: '#94a3b8',
  condition: '#6366f1',
  outcome: '#f97316',
  timeout: '#0891b2',
  fallback: '#94a3b8',
};

interface FollowUpRuleCanvasProps {
  rule: FollowUpRuleGraphDefinition;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  zoom: number;
  viewport: { x: number; y: number };
  onZoomChange: (zoom: number) => void;
  onViewportChange: (viewport: { x: number; y: number }) => void;
  onSelectNode: (nodeId: string | null) => void;
  onSelectEdge: (edgeId: string | null) => void;
  onMoveNode: (nodeId: string, position: { x: number; y: number }) => void;
  onAddNode: (type: FollowUpGraphNodeType, position: { x: number; y: number }) => void;
  onConnectNodes: (sourceId: string, targetId: string) => void;
  onDeleteSelected: () => void;
}

function summarizeNode(node: FollowUpGraphNode) {
  if (node.type === 'trigger') return node.config.triggerSource || '通话事件';
  if (node.type === 'condition') return `${node.config.conditionField || '未配置字段'}`;
  if (node.type === 'wait') {
    if (node.config.waitMode === 'user_time') return '用户指定时间';
    if (node.config.waitMode === 'variable_time') return node.config.dateVariable || '变量时间';
    return `${node.config.waitAmount || 0}${node.config.waitUnit === 'day' ? '天' : node.config.waitUnit === 'minute' ? '分钟' : '小时'}`;
  }
  if (node.type === 'protection') return `每日最多 ${node.config.maxDailyCalls || 0} 次`;
  if (node.type === 'action') return FOLLOW_UP_ACTION_LABELS[node.config.actionType || 'auto_call'];
  return node.config.resultStatus || '任务结束';
}

function curve(startX: number, startY: number, endX: number, endY: number) {
  const distance = Math.max(90, Math.abs(endX - startX) * 0.45);
  return `M ${startX} ${startY} C ${startX + distance} ${startY}, ${endX - distance} ${endY}, ${endX} ${endY}`;
}

function FollowUpMiniMap({ rule }: { rule: FollowUpRuleGraphDefinition }) {
  const bounds = useMemo(() => {
    if (rule.nodes.length === 0) return { minX: 0, minY: 0, width: 1, height: 1 };
    const xs = rule.nodes.map(node => node.position.x);
    const ys = rule.nodes.map(node => node.position.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    return {
      minX,
      minY,
      width: Math.max(1, Math.max(...xs) - minX + NODE_WIDTH),
      height: Math.max(1, Math.max(...ys) - minY + NODE_HEIGHT),
    };
  }, [rule.nodes]);
  const scale = Math.min(164 / bounds.width, 96 / bounds.height);

  return (
    <div className="pointer-events-none absolute bottom-4 right-4 h-[116px] w-[184px] overflow-hidden rounded-md border border-slate-200 bg-white/95 shadow-sm">
      <div className="border-b border-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-400">导航</div>
      <div className="relative h-[96px] w-[164px] mx-2">
        {rule.nodes.map(node => (
          <div
            key={node.id}
            className={`absolute rounded-sm border ${NODE_TONE[node.type]}`}
            style={{
              left: (node.position.x - bounds.minX) * scale,
              top: (node.position.y - bounds.minY) * scale,
              width: Math.max(8, NODE_WIDTH * scale),
              height: Math.max(5, NODE_HEIGHT * scale),
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function FollowUpRuleCanvas({
  rule,
  selectedNodeId,
  selectedEdgeId,
  zoom,
  viewport,
  onZoomChange,
  onViewportChange,
  onSelectNode,
  onSelectEdge,
  onMoveNode,
  onAddNode,
  onConnectNodes,
  onDeleteSelected,
}: FollowUpRuleCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [panning, setPanning] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [connectionSourceId, setConnectionSourceId] = useState<string | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [lastPointer, setLastPointer] = useState({ x: 0, y: 0 });

  const nodeById = useMemo(() => new Map(rule.nodes.map(node => [node.id, node])), [rule.nodes]);

  const toWorld = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - viewport.x) / zoom,
      y: (clientY - rect.top - viewport.y) / zoom,
    };
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || draggedNodeId || connectionSourceId) return;
    setPanning(true);
    setLastPointer({ x: event.clientX, y: event.clientY });
    onSelectNode(null);
    onSelectEdge(null);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (panning) {
      onViewportChange({
        x: viewport.x + event.clientX - lastPointer.x,
        y: viewport.y + event.clientY - lastPointer.y,
      });
      setLastPointer({ x: event.clientX, y: event.clientY });
      return;
    }
    if (draggedNodeId) {
      const current = nodeById.get(draggedNodeId);
      if (current) {
        onMoveNode(draggedNodeId, {
          x: current.position.x + (event.clientX - lastPointer.x) / zoom,
          y: current.position.y + (event.clientY - lastPointer.y) / zoom,
        });
      }
      setLastPointer({ x: event.clientX, y: event.clientY });
      return;
    }
    if (connectionSourceId) setPointer(toWorld(event.clientX, event.clientY));
  };

  const finishPointerAction = (event: React.MouseEvent<HTMLDivElement>) => {
    if (connectionSourceId) {
      const world = toWorld(event.clientX, event.clientY);
      const target = rule.nodes.find(node =>
        node.id !== connectionSourceId &&
        world.x >= node.position.x &&
        world.x <= node.position.x + NODE_WIDTH &&
        world.y >= node.position.y &&
        world.y <= node.position.y + NODE_HEIGHT,
      );
      if (target) onConnectNodes(connectionSourceId, target.id);
    }
    setPanning(false);
    setDraggedNodeId(null);
    setConnectionSourceId(null);
  };

  const fitView = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rule.nodes.length === 0) return;
    const minX = Math.min(...rule.nodes.map(node => node.position.x));
    const minY = Math.min(...rule.nodes.map(node => node.position.y));
    const maxX = Math.max(...rule.nodes.map(node => node.position.x + NODE_WIDTH));
    const maxY = Math.max(...rule.nodes.map(node => node.position.y + NODE_HEIGHT));
    const width = maxX - minX;
    const height = maxY - minY;
    const nextZoom = Math.min(1.15, Math.max(0.35, Math.min((rect.width - 120) / width, (rect.height - 120) / height)));
    onZoomChange(nextZoom);
    onViewportChange({
      x: (rect.width - width * nextZoom) / 2 - minX * nextZoom,
      y: (rect.height - height * nextZoom) / 2 - minY * nextZoom,
    });
  };

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-slate-50">
      <aside className="z-20 w-52 shrink-0 border-r border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">节点库</div>
        </div>
        <div className="space-y-2 p-3">
          {NODE_LIBRARY.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.type}
                draggable
                onDragStart={event => {
                  event.dataTransfer.setData('followUpNodeType', item.type);
                  event.dataTransfer.effectAllowed = 'copy';
                }}
                className="flex cursor-grab items-center gap-3 rounded-md border border-slate-200 bg-white p-3 hover:border-primary/50 hover:bg-slate-50 active:cursor-grabbing"
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-md border ${NODE_TONE[item.type]}`}><Icon size={16} /></span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800">{FOLLOW_UP_NODE_META[item.type].label}</div>
                  <div className="mt-0.5 truncate text-[11px] text-slate-400">{FOLLOW_UP_NODE_META[item.type].description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <div
        ref={canvasRef}
        tabIndex={0}
        className={`relative min-w-0 flex-1 overflow-hidden outline-none ${panning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={finishPointerAction}
        onMouseLeave={finishPointerAction}
        onKeyDown={event => {
          if (event.key === 'Delete' || event.key === 'Backspace') onDeleteSelected();
        }}
        onDragOver={event => event.preventDefault()}
        onDrop={event => {
          event.preventDefault();
          const type = event.dataTransfer.getData('followUpNodeType') as FollowUpGraphNodeType;
          if (!type) return;
          onAddNode(type, toWorld(event.clientX, event.clientY));
        }}
        onWheel={event => {
          event.preventDefault();
          if (event.ctrlKey || event.metaKey) {
            onZoomChange(Math.min(1.8, Math.max(0.35, zoom + (event.deltaY > 0 ? -0.08 : 0.08))));
          } else {
            onViewportChange({ x: viewport.x - event.deltaX, y: viewport.y - event.deltaY });
          }
        }}
      >
        <div
          className="pointer-events-none absolute inset-[-300%] opacity-60"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px)`,
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          }}
        />

        <div
          className="absolute inset-0 origin-top-left"
          style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${zoom})` }}
        >
          <svg className="absolute inset-0 h-full w-full overflow-visible">
            <defs>
              <marker id="follow-up-arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
                <polygon points="0 0, 10 4, 0 8" fill="#94a3b8" />
              </marker>
            </defs>
            {rule.edges.map(edge => {
              const source = nodeById.get(edge.source);
              const target = nodeById.get(edge.target);
              if (!source || !target) return null;
              const startX = source.position.x + NODE_WIDTH;
              const startY = source.position.y + NODE_HEIGHT / 2;
              const endX = target.position.x;
              const endY = target.position.y + NODE_HEIGHT / 2;
              const path = curve(startX, startY, endX, endY);
              const active = edge.id === selectedEdgeId;
              const color = active ? '#2563eb' : EDGE_TONE[edge.edgeType];
              const dashed = edge.edgeType === 'timeout' || edge.edgeType === 'fallback';
              return (
                <g key={edge.id}>
                  <path
                    d={path}
                    stroke="transparent"
                    strokeWidth="18"
                    fill="none"
                    className="cursor-pointer"
                    onClick={event => {
                      event.stopPropagation();
                      onSelectNode(null);
                      onSelectEdge(edge.id);
                    }}
                  />
                  <path
                    d={path}
                    stroke={color}
                    strokeWidth={active ? 3 : 2}
                    strokeDasharray={dashed ? '6 5' : undefined}
                    fill="none"
                    markerEnd="url(#follow-up-arrow)"
                    className="pointer-events-none"
                  />
                  <foreignObject
                    x={(startX + endX) / 2 - 62}
                    y={(startY + endY) / 2 - 15}
                    width="124"
                    height="30"
                    className="pointer-events-auto"
                  >
                    <button
                      type="button"
                      aria-label={`配置流转 ${edge.label || '下一步'}`}
                      onClick={event => {
                        event.stopPropagation();
                        onSelectNode(null);
                        onSelectEdge(edge.id);
                      }}
                      className={`w-full truncate rounded-full border bg-white px-2 py-1 text-center text-[10px] font-medium shadow-sm ${active ? 'border-blue-300 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-blue-200 hover:text-blue-600'}`}
                    >
                      {edge.label || '下一步'}
                    </button>
                  </foreignObject>
                </g>
              );
            })}
            {connectionSourceId && (() => {
              const source = nodeById.get(connectionSourceId);
              if (!source) return null;
              return (
                <path
                  d={curve(source.position.x + NODE_WIDTH, source.position.y + NODE_HEIGHT / 2, pointer.x, pointer.y)}
                  stroke="#2563eb"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  fill="none"
                  markerEnd="url(#follow-up-arrow)"
                />
              );
            })()}
          </svg>

          {rule.nodes.map(node => {
            const Icon = NODE_ICON[node.type];
            const active = node.id === selectedNodeId;
            const outgoing = rule.edges.filter(edge => edge.source === node.id);
            return (
              <div
                key={node.id}
                className={`absolute rounded-md border bg-white shadow-sm transition-shadow ${active ? 'border-blue-500 ring-2 ring-blue-100 shadow-md' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}
                style={{ left: node.position.x, top: node.position.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
                onMouseDown={event => {
                  event.stopPropagation();
                  onSelectNode(node.id);
                  onSelectEdge(null);
                  setDraggedNodeId(node.id);
                  setLastPointer({ x: event.clientX, y: event.clientY });
                }}
                onDoubleClick={event => {
                  event.stopPropagation();
                  onSelectNode(node.id);
                }}
              >
                <div className="flex h-full items-start gap-3 p-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${NODE_TONE[node.type]}`}><Icon size={17} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">{node.title}</span>
                      <span className="shrink-0 text-[10px] text-slate-400">{FOLLOW_UP_NODE_META[node.type].label}</span>
                    </div>
                    <div className="mt-2 truncate text-xs text-slate-500">{summarizeNode(node)}</div>
                    {node.type !== 'end' && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                        <GitBranch size={11} /> {outgoing.length} 条流转
                      </div>
                    )}
                  </div>
                </div>
                {node.type !== 'trigger' && (
                  <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-slate-300 bg-white" />
                )}
                {node.type !== 'end' && (
                  <button
                    type="button"
                    aria-label="创建连线"
                    title="拖动连接到其他节点"
                    className="absolute -right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border-2 border-blue-400 bg-white text-blue-600 shadow-sm hover:bg-blue-50"
                    onMouseDown={event => {
                      event.stopPropagation();
                      setConnectionSourceId(node.id);
                      setPointer(toWorld(event.clientX, event.clientY));
                    }}
                  >
                    <Plus size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-4 left-4 z-20 flex items-center overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <button type="button" onClick={() => onZoomChange(Math.max(0.35, zoom - 0.1))} className="h-9 w-9 border-r border-slate-100 text-sm text-slate-600 hover:bg-slate-50" aria-label="缩小">−</button>
          <button type="button" onClick={() => onZoomChange(1)} className="h-9 min-w-16 border-r border-slate-100 px-2 text-xs font-medium text-slate-600 hover:bg-slate-50">{Math.round(zoom * 100)}%</button>
          <button type="button" onClick={() => onZoomChange(Math.min(1.8, zoom + 0.1))} className="h-9 w-9 border-r border-slate-100 text-sm text-slate-600 hover:bg-slate-50" aria-label="放大">＋</button>
          <button type="button" onClick={fitView} className="h-9 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">适应画布</button>
          {(selectedNodeId || selectedEdgeId) && (
            <button type="button" onClick={onDeleteSelected} className="flex h-9 items-center gap-1 border-l border-slate-100 px-3 text-xs font-medium text-rose-600 hover:bg-rose-50"><Trash2 size={13} />删除</button>
          )}
        </div>
        <FollowUpMiniMap rule={rule} />
      </div>
    </div>
  );
}
