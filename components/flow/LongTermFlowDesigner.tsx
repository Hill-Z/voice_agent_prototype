// 任务流程编排页，提供流程画布、节点编辑、分支连线和运行记录。
import React, { DragEvent, MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  RotateCcw,
  Save,
  Sparkles,
  X,
} from 'lucide-react';
import { validateFlowDefinition } from './longTermFlowData';
import { FlowNodeCard, LibraryItem } from './LongTermFlowCanvasParts';
import { EdgeConfigPanel, NodeConfigPanel } from './LongTermFlowDesignerPanels';
import {
  CANVAS_PADDING,
  COMPONENT_LIBRARY,
  ConnectionDraftState,
  createDesignerEdge,
  createDesignerNode,
  DraggingNodeState,
  formatFlowTimestamp,
  getEdgePath,
  getLaneFromY,
  getLaneTop,
  LANE_HEIGHT,
  MIN_NODE_X,
  NODE_HEIGHT,
  NODE_TYPE_OPTIONS,
  NODE_WIDTH,
} from './longTermFlowDesignerUtils';
import type { LongTermFlowDefinition, LongTermFlowEdge, LongTermFlowNode, LongTermFlowNodeType } from './longTermFlowTypes';

interface LongTermFlowDesignerProps {
  flow: LongTermFlowDefinition;
  onBackToList: () => void;
  onOpenRuns: () => void;
  onUpdateFlow: (flow: LongTermFlowDefinition) => void;
  onSaveDraft: (flowId: string) => void;
}

interface CanvasPoint {
  x: number;
  y: number;
}

// 主流程编排组件。
export default function LongTermFlowDesigner({
  flow,
  onBackToList,
  onOpenRuns,
  onUpdateFlow,
  onSaveDraft,
}: LongTermFlowDesignerProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState(flow.nodes[0]?.id || '');
  const [selectedEdgeId, setSelectedEdgeId] = useState('');
  const [draggingNode, setDraggingNode] = useState<DraggingNodeState | null>(null);
  const [connectionDraft, setConnectionDraft] = useState<ConnectionDraftState | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [libraryCollapsed, setLibraryCollapsed] = useState(false);
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const isPointerDraggingRef = useRef(false);

  useEffect(() => {
    if (!flow.nodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(flow.nodes[0]?.id || '');
    }
    if (selectedEdgeId && !flow.edges.some((edge) => edge.id === selectedEdgeId)) {
      setSelectedEdgeId('');
    }
  }, [flow.id, flow.nodes, flow.edges, selectedNodeId, selectedEdgeId]);

  useEffect(() => {
    setConfigDrawerOpen(false);
  }, [flow.id]);

  const selectedNode = useMemo(
    () => flow.nodes.find((node) => node.id === selectedNodeId),
    [flow.nodes, selectedNodeId],
  );
  const selectedEdge = useMemo(
    () => flow.edges.find((edge) => edge.id === selectedEdgeId),
    [flow.edges, selectedEdgeId],
  );
  const validationIssues = useMemo(() => validateFlowDefinition(flow), [flow]);
  const nodeById = useMemo(() => new Map(flow.nodes.map((node) => [node.id, node])), [flow.nodes]);
  const canvasWidth = Math.max(1420, Math.max(...flow.nodes.map((node) => node.position.x), 0) + NODE_WIDTH + CANVAS_PADDING * 2);
  const canvasHeight = Math.max(680, flow.lanes.length * LANE_HEIGHT + CANVAS_PADDING * 2);
  // 将屏幕坐标换算为流程画布坐标。
  const getCanvasPoint = (event: ReactMouseEvent<HTMLElement> | DragEvent<HTMLElement>): CanvasPoint => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: CANVAS_PADDING, y: CANVAS_PADDING };
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  // 更新单个节点并同步流程更新时间。
  const handleNodeChange = (updatedNode: LongTermFlowNode) => {
    onUpdateFlow({
      ...flow,
      updatedAt: formatFlowTimestamp(),
      nodes: flow.nodes.map((node) => (node.id === updatedNode.id ? updatedNode : node)),
    });
  };

  // 更新单条连线配置。
  const handleEdgeChange = (updatedEdge: LongTermFlowEdge) => {
    onUpdateFlow({
      ...flow,
      updatedAt: formatFlowTimestamp(),
      edges: flow.edges.map((edge) => (edge.id === updatedEdge.id ? updatedEdge : edge)),
    });
  };

  // 点击组件库后在当前节点后新增一个节点。
  const handleAddNode = (type: LongTermFlowNodeType) => {
    const referenceNode = selectedNode || flow.nodes[flow.nodes.length - 1];
    const lane = referenceNode?.lane || flow.lanes[0].id;
    const point = referenceNode
      ? { x: referenceNode.position.x + NODE_WIDTH + 80, y: referenceNode.position.y }
      : { x: CANVAS_PADDING, y: getLaneTop(flow.lanes, lane) };
    const nextNode = createDesignerNode(type, point, lane, referenceNode);
    const nextEdges = referenceNode ? [...flow.edges, createDesignerEdge(referenceNode.id, nextNode.id)] : flow.edges;
    onUpdateFlow({ ...flow, updatedAt: formatFlowTimestamp(), nodes: [...flow.nodes, nextNode], edges: nextEdges });
    setSelectedNodeId(nextNode.id);
    setSelectedEdgeId('');
    setConfigDrawerOpen(true);
  };

  // 组件库拖拽开始。
  const handleLibraryDragStart = (event: DragEvent<HTMLButtonElement>, type: LongTermFlowNodeType) => {
    event.dataTransfer.setData('application/x-long-flow-node-type', type);
    event.dataTransfer.effectAllowed = 'copy';
  };

  // 节点 HTML 拖拽开始。
  const handleNodeDragStart = (event: DragEvent<HTMLButtonElement>, nodeId: string) => {
    event.dataTransfer.setData('application/x-long-flow-node-id', nodeId);
    event.dataTransfer.effectAllowed = 'move';
  };

  // 允许把节点或组件放入画布。
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // 将组件库节点拖入画布，或把已有节点放到新位置。
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const point = getCanvasPoint(event);
    const draggedNodeId = event.dataTransfer.getData('application/x-long-flow-node-id');
    const droppedType = event.dataTransfer.getData('application/x-long-flow-node-type') as LongTermFlowNodeType;
    if (draggedNodeId) {
      const node = nodeById.get(draggedNodeId);
      if (!node) return;
      handleNodeChange({
        ...node,
        lane: getLaneFromY(flow.lanes, point.y),
        position: {
          x: Math.max(MIN_NODE_X, point.x - NODE_WIDTH / 2),
          y: Math.max(CANVAS_PADDING, point.y - NODE_HEIGHT / 2),
        },
      });
      return;
    }
    if (NODE_TYPE_OPTIONS.includes(droppedType)) {
      const lane = getLaneFromY(flow.lanes, point.y);
      const newNode = createDesignerNode(droppedType, { x: point.x - NODE_WIDTH / 2, y: point.y - NODE_HEIGHT / 2 }, lane, selectedNode);
      const nextEdges = selectedNode ? [...flow.edges, createDesignerEdge(selectedNode.id, newNode.id)] : flow.edges;
      onUpdateFlow({ ...flow, updatedAt: formatFlowTimestamp(), nodes: [...flow.nodes, newNode], edges: nextEdges });
      setSelectedNodeId(newNode.id);
      setSelectedEdgeId('');
      setConfigDrawerOpen(true);
    }
  };

  // 鼠标按下节点后进入画布内自由拖拽。
  const handleNodeMouseDown = (event: ReactMouseEvent<HTMLButtonElement>, node: LongTermFlowNode) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-no-node-drag="true"]')) return;
    const point = getCanvasPoint(event);
    isPointerDraggingRef.current = false;
    setDraggingNode({ nodeId: node.id, offsetX: point.x - node.position.x, offsetY: point.y - node.position.y });
    setSelectedNodeId(node.id);
    setSelectedEdgeId('');
  };

  // 画布鼠标移动时更新节点位置或临时连线。
  const handleCanvasMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    const point = getCanvasPoint(event);
    if (connectionDraft) {
      setConnectionDraft({ ...connectionDraft, x: point.x, y: point.y });
    }
    if (!draggingNode) return;
    isPointerDraggingRef.current = true;
    const node = nodeById.get(draggingNode.nodeId);
    if (!node) return;
    handleNodeChange({
      ...node,
      lane: getLaneFromY(flow.lanes, point.y),
      position: {
        x: Math.max(MIN_NODE_X, point.x - draggingNode.offsetX),
        y: Math.max(CANVAS_PADDING, point.y - draggingNode.offsetY),
      },
    });
  };

  // 画布鼠标松开后结束拖拽或取消未完成连线。
  const handleCanvasMouseUp = () => {
    setDraggingNode(null);
    setConnectionDraft(null);
    window.setTimeout(() => {
      isPointerDraggingRef.current = false;
    }, 0);
  };

  // 从节点连接点拉出一条临时连线。
  const handleConnectorMouseDown = (event: ReactMouseEvent<HTMLSpanElement>, nodeId: string) => {
    event.preventDefault();
    event.stopPropagation();
    const point = getCanvasPoint(event);
    setConnectionDraft({ sourceNodeId: nodeId, x: point.x, y: point.y });
    setSelectedNodeId(nodeId);
    setSelectedEdgeId('');
  };

  // 在另一个节点上松开鼠标后创建连线。
  const handleNodeMouseUp = (event: ReactMouseEvent<HTMLButtonElement>, targetNodeId: string) => {
    event.stopPropagation();
    if (!connectionDraft || connectionDraft.sourceNodeId === targetNodeId) {
      const wasDragging = isPointerDraggingRef.current;
      setDraggingNode(null);
      setConnectionDraft(null);
      window.setTimeout(() => {
        isPointerDraggingRef.current = false;
      }, 0);
      if (!connectionDraft && !wasDragging) {
        setConfigDrawerOpen(true);
      }
      return;
    }
    const newEdge = createDesignerEdge(connectionDraft.sourceNodeId, targetNodeId);
    onUpdateFlow({ ...flow, updatedAt: formatFlowTimestamp(), edges: [...flow.edges, newEdge] });
    setSelectedEdgeId(newEdge.id);
    setSelectedNodeId('');
    setConfigDrawerOpen(true);
    setConnectionDraft(null);
    setDraggingNode(null);
    window.setTimeout(() => {
      isPointerDraggingRef.current = false;
    }, 0);
  };

  // 删除连线前做确认，避免误操作。
  const handleDeleteEdge = (edgeId: string) => {
    if (!window.confirm('确认删除这条连线吗？')) return;
    onUpdateFlow({ ...flow, updatedAt: formatFlowTimestamp(), edges: flow.edges.filter((edge) => edge.id !== edgeId) });
    setSelectedEdgeId('');
    setConfigDrawerOpen(false);
  };

  // 删除节点时同步清理相关连线，避免画布留下断点。
  const handleDeleteNode = (nodeId: string) => {
    const node = nodeById.get(nodeId);
    if (!node) return;
    if (!window.confirm(`确认删除节点「${node.title}」吗？相关连线也会一起删除。`)) return;
    onUpdateFlow({
      ...flow,
      updatedAt: formatFlowTimestamp(),
      nodes: flow.nodes.filter((flowNode) => flowNode.id !== nodeId),
      edges: flow.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    });
    setSelectedNodeId('');
    setSelectedEdgeId('');
    setConfigDrawerOpen(false);
  };

  // 试运行按钮只改变前端状态，用于给用户即时反馈。
  const handleSimulate = () => {
    setIsSimulating(true);
    window.setTimeout(() => setIsSimulating(false), 600);
  };

  // 保存当前草稿并给出明确反馈。
  const handleSaveDraft = () => {
    onSaveDraft(flow.id);
    setSaveMessage(`已保存草稿 ${formatFlowTimestamp()}`);
  };

  return (
    <section className="flex h-full min-h-[calc(100vh-4rem)] flex-col bg-slate-50">
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="h-full overflow-auto bg-[radial-gradient(circle_at_1px_1px,#dbe4ef_1px,transparent_0)] [background-size:20px_20px]">
          <div
            ref={canvasRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onClick={() => {
              setSelectedNodeId('');
              setSelectedEdgeId('');
              setConfigDrawerOpen(false);
            }}
            className="relative bg-white/80"
            style={{ width: canvasWidth, height: canvasHeight }}
          >
            <div onClick={(event) => event.stopPropagation()} className="absolute left-4 right-4 top-4 z-40 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg">
              <div className="flex min-w-0 items-center gap-3">
                <button type="button" onClick={onBackToList} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-primary hover:text-primary" aria-label="返回流程方案列表">
                  <ChevronLeft size={18} />
                </button>
                {validationIssues.length ? (
                  <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700" title={validationIssues.join('；')}>
                    <AlertTriangle size={13} /> {validationIssues.length}
                  </div>
                ) : null}
                {saveMessage ? <div className="hidden text-xs font-medium text-emerald-600 lg:block">{saveMessage}</div> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleSimulate} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary">
                  {isSimulating ? <RotateCcw size={16} className="animate-spin" /> : <Play size={16} />}
                  试运行
                </button>
                <button type="button" onClick={onOpenRuns} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary">
                  <CalendarClock size={16} /> 运行任务
                </button>
                <button type="button" onClick={handleSaveDraft} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-600">
                  <Save size={16} /> 保存草稿
                </button>
              </div>
            </div>

            <div
              onClick={(event) => event.stopPropagation()}
              className={`absolute bottom-4 left-4 top-20 z-20 rounded-2xl border border-slate-200 bg-white/95 shadow-lg transition-all ${libraryCollapsed ? 'w-14' : 'w-72'}`}
            >
              {libraryCollapsed ? (
                <button
                  type="button"
                  onClick={() => setLibraryCollapsed(false)}
                  className="flex h-full w-full flex-col items-center justify-start gap-3 rounded-2xl px-2 py-4 text-slate-500 hover:text-primary"
                  aria-label="展开节点库"
                >
                  <PanelLeftOpen size={18} />
                  <span className="[writing-mode:vertical-rl] text-xs font-semibold tracking-widest">节点库</span>
                </button>
              ) : (
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <div className="text-sm font-bold text-slate-900">节点库</div>
                      <div className="mt-1 text-xs text-slate-400">选择要添加的节点类型。</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles size={16} className="text-primary" />
                      <button type="button" onClick={() => setLibraryCollapsed(true)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="收起节点库">
                        <PanelLeftClose size={17} />
                      </button>
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto p-3">
                    <div className="grid gap-2">
                      {COMPONENT_LIBRARY.map((item) => (
                        <React.Fragment key={item.type}>
                          <LibraryItem item={item} onAdd={handleAddNode} onDragStart={handleLibraryDragStart} />
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <svg className="pointer-events-none absolute inset-0" width={canvasWidth} height={canvasHeight}>
              <defs>
                <marker id="long-flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#0284c7" />
                </marker>
              </defs>
              {flow.edges.map((edge) => {
                const sourceNode = nodeById.get(edge.source);
                const targetNode = nodeById.get(edge.target);
                if (!sourceNode || !targetNode) return null;
                const path = getEdgePath(sourceNode, targetNode);
                const active = edge.id === selectedEdgeId;
                const labelX = (sourceNode.position.x + targetNode.position.x + NODE_WIDTH) / 2;
                const labelY = (sourceNode.position.y + targetNode.position.y + NODE_HEIGHT) / 2 - 10;
                return (
                  <g key={edge.id}>
                    <path d={path} stroke="transparent" strokeWidth="18" fill="none" className="pointer-events-auto cursor-pointer" onClick={(event) => { event.stopPropagation(); setSelectedEdgeId(edge.id); setSelectedNodeId(''); setConfigDrawerOpen(true); }} />
                    <path d={path} stroke={active ? '#0369a1' : '#38bdf8'} strokeWidth={active ? 3 : 2} fill="none" markerEnd="url(#long-flow-arrow)" strokeDasharray={edge.edgeType === '超时流转' ? '6 6' : undefined} />
                    <foreignObject x={labelX - 58} y={labelY - 12} width="116" height="28" className="pointer-events-none">
                      <div className={`truncate rounded-full border px-2 py-1 text-center text-[10px] font-semibold ${active ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-500'}`}>{edge.label}</div>
                    </foreignObject>
                  </g>
                );
              })}
              {connectionDraft ? (
                <path
                  d={`M ${(nodeById.get(connectionDraft.sourceNodeId)?.position.x || 0) + NODE_WIDTH} ${(nodeById.get(connectionDraft.sourceNodeId)?.position.y || 0) + NODE_HEIGHT / 2} L ${connectionDraft.x} ${connectionDraft.y}`}
                  stroke="#0284c7"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                  fill="none"
                  markerEnd="url(#long-flow-arrow)"
                />
              ) : null}
            </svg>

            {flow.nodes.map((node) => (
              <React.Fragment key={node.id}>
                <FlowNodeCard
                  node={node}
                  selected={node.id === selectedNode?.id}
                  onMouseDown={handleNodeMouseDown}
                  onMouseUp={handleNodeMouseUp}
                  onSelect={(nodeId) => {
                    if (isPointerDraggingRef.current) return;
                    setSelectedNodeId(nodeId);
                    setSelectedEdgeId('');
                    setConfigDrawerOpen(true);
                  }}
                  onConnectorMouseDown={handleConnectorMouseDown}
                  onDragStart={handleNodeDragStart}
                />
              </React.Fragment>
            ))}

            {configDrawerOpen && (selectedEdge || selectedNode) ? (
              <div onClick={(event) => event.stopPropagation()} className="fixed bottom-4 right-4 top-24 z-50 flex w-[400px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                  <div>
                    <div className="text-xs font-semibold text-primary">{selectedEdge ? '边 / 分支' : '节点配置'}</div>
                    <div className="mt-1 text-sm font-bold text-slate-900">{selectedEdge ? selectedEdge.label : selectedNode?.title}</div>
                  </div>
                  <button type="button" onClick={() => setConfigDrawerOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="关闭配置抽屉">
                    <X size={18} />
                  </button>
                </div>
                <div className="min-h-0 flex-1">
                  {selectedEdge ? (
                    <EdgeConfigPanel edge={selectedEdge} nodes={flow.nodes} onEdgeChange={handleEdgeChange} onDeleteEdge={handleDeleteEdge} />
                  ) : selectedNode ? (
                    <NodeConfigPanel node={selectedNode} lanes={flow.lanes} onNodeChange={handleNodeChange} onDeleteNode={handleDeleteNode} />
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}


