import React, { useMemo, useRef, useState } from 'react';
import { Flag, Maximize2, Minimize2, Play, Save, Settings, Square, Trash2 } from 'lucide-react';
import {
  FlowAnnotation,
  FlowDefinition,
  FlowEdge,
  FlowNode,
  FlowNodeType,
  FlowStepKind,
} from '../../types';

interface FlowCanvasProps {
  flow: FlowDefinition;
  annotationMode: boolean;
  annotations: FlowAnnotation[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  readOnly?: boolean;
  isFullscreen?: boolean;
  zoom: number;
  viewport: { x: number; y: number };
  onSelectNode: (nodeId: string | null) => void;
  onSelectEdge: (edgeId: string | null) => void;
  onChangeFlow: (updater: (flow: FlowDefinition) => FlowDefinition) => void;
  onSave?: () => void;
  onToggleFullscreen?: () => void;
  onZoomChange: (zoom: number) => void;
  onViewportChange: (viewport: { x: number; y: number }) => void;
  onAnnotationSelect: (annotationId: string) => void;
}

interface ToolboxItem {
  type: FlowNodeType;
  label: string;
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 88;

const TOOLBOX_ITEMS: ToolboxItem[] = [
  { type: FlowNodeType.START, label: 'Start' },
  { type: FlowNodeType.DEFAULT, label: 'Step' },
  { type: FlowNodeType.EXIT, label: 'Exit' },
];

function getTemplateName(type: FlowNodeType, stepType?: FlowStepKind) {
  if (type === FlowNodeType.START) return '开始';
  if (type === FlowNodeType.EXIT) return '退出';
  if (stepType === 'collect') return '采集步骤';
  if (stepType === 'function') return '函数步骤';
  if (stepType === 'advanced') return '高级步骤';
  return '标准步骤';
}

function createNode(type: FlowNodeType, position: { x: number; y: number }, stepType?: FlowStepKind): FlowNode {
  return {
    id: `flow_node_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    position,
    data: {
      name: getTemplateName(type, stepType),
      description: '',
      stepType: type === FlowNodeType.EXIT ? 'exit' : stepType || 'default',
      stepPrompt: {
        prompt: '',
        visibleFunctionIds: [],
        transitionFunctionIds: [],
      },
    },
  };
}

function AnnotationBadge({
  index,
  style,
  onClick,
}: {
  index: number;
  style: React.CSSProperties;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="absolute z-30 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white shadow"
      style={style}
    >
      {index}
    </button>
  );
}

function getNodeColors(node: FlowNode) {
  if (node.type === FlowNodeType.START) return 'border-emerald-300 bg-emerald-50 text-emerald-700';
  if (node.type === FlowNodeType.EXIT) return 'border-rose-300 bg-rose-50 text-rose-700';
  if (node.data.stepType === 'collect') return 'border-amber-300 bg-amber-50 text-amber-700';
  if (node.data.stepType === 'function') return 'border-violet-300 bg-violet-50 text-violet-700';
  if (node.data.stepType === 'advanced') return 'border-indigo-300 bg-indigo-50 text-indigo-700';
  return 'border-sky-300 bg-sky-50 text-sky-700';
}

function getNodeIcon(node: FlowNode) {
  if (node.type === FlowNodeType.START) return <Play size={16} />;
  if (node.type === FlowNodeType.EXIT) return <Flag size={16} />;
  if (node.data.stepType === 'function') return <Settings size={16} />;
  return <Square size={16} />;
}

function getStepLabel(node: FlowNode) {
  if (node.type === FlowNodeType.START) return '开始节点';
  if (node.type === FlowNodeType.EXIT) return '退出节点';
  if (node.data.stepType === 'collect') return '采集步骤';
  if (node.data.stepType === 'function') return '函数步骤';
  if (node.data.stepType === 'advanced') return '高级步骤';
  return '标准步骤';
}

export default function FlowCanvas({
  flow,
  annotationMode,
  annotations,
  selectedNodeId,
  selectedEdgeId,
  readOnly = false,
  isFullscreen = false,
  zoom,
  viewport,
  onSelectNode,
  onSelectEdge,
  onChangeFlow,
  onSave,
  onToggleFullscreen,
  onZoomChange,
  onViewportChange,
  onAnnotationSelect,
}: FlowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [drawingSourceNodeId, setDrawingSourceNodeId] = useState<string | null>(null);
  const [drawingMouse, setDrawingMouse] = useState({ x: 0, y: 0 });

  const edgeMap = useMemo(() => {
    return flow.edges.map((edge) => {
      const source = flow.nodes.find((node) => node.id === edge.source);
      const target = flow.nodes.find((node) => node.id === edge.target);
      return { edge, source, target };
    });
  }, [flow.edges, flow.nodes]);

  const getWorldPosition = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - viewport.x) / zoom,
      y: (clientY - rect.top - viewport.y) / zoom,
    };
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || draggedNodeId || drawingSourceNodeId) return;
    setIsPanning(true);
    setLastMousePos({ x: event.clientX, y: event.clientY });
    onSelectNode(null);
    onSelectEdge(null);
  };

  const handleNodeMouseDown = (event: React.MouseEvent<HTMLDivElement>, nodeId: string) => {
    event.stopPropagation();
    onSelectNode(nodeId);
    onSelectEdge(null);
    if (readOnly) return;
    setDraggedNodeId(nodeId);
    setLastMousePos({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const deltaX = event.clientX - lastMousePos.x;
    const deltaY = event.clientY - lastMousePos.y;

    if (isPanning) {
      onViewportChange({ x: viewport.x + deltaX, y: viewport.y + deltaY });
      setLastMousePos({ x: event.clientX, y: event.clientY });
      return;
    }

    if (draggedNodeId) {
      onChangeFlow((currentFlow) => ({
        ...currentFlow,
        nodes: currentFlow.nodes.map((node) =>
          node.id === draggedNodeId
            ? {
                ...node,
                position: {
                  x: node.position.x + deltaX / zoom,
                  y: node.position.y + deltaY / zoom,
                },
              }
            : node,
        ),
      }));
      setLastMousePos({ x: event.clientX, y: event.clientY });
      return;
    }

    if (drawingSourceNodeId) {
      setDrawingMouse(getWorldPosition(event.clientX, event.clientY));
    }
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (drawingSourceNodeId) {
      const mouse = getWorldPosition(event.clientX, event.clientY);
      const targetNode = flow.nodes.find((node) => {
        const withinX = mouse.x >= node.position.x && mouse.x <= node.position.x + NODE_WIDTH;
        const withinY = mouse.y >= node.position.y && mouse.y <= node.position.y + NODE_HEIGHT;
        return withinX && withinY && node.id !== drawingSourceNodeId;
      });

      if (targetNode) {
        onChangeFlow((currentFlow) => {
          const exists = currentFlow.edges.some(
            (edge) => edge.source === drawingSourceNodeId && edge.target === targetNode.id,
          );
          if (exists) return currentFlow;

          const newEdge: FlowEdge = {
            id: `flow_edge_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            source: drawingSourceNodeId,
            target: targetNode.id,
            label: 'Next',
            edgeType: 'normal',
          };
          return { ...currentFlow, edges: [...currentFlow.edges, newEdge] };
        });
      }
    }

    setIsPanning(false);
    setDraggedNodeId(null);
    setDrawingSourceNodeId(null);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (readOnly) return;

    const type = event.dataTransfer.getData('nodeType') as FlowNodeType;
    if (!type) return;

    const position = getWorldPosition(event.clientX, event.clientY);
    onChangeFlow((currentFlow) => ({
      ...currentFlow,
      nodes: [...currentFlow.nodes, createNode(type, position)],
    }));
  };

  const handleDeleteSelected = () => {
    if (readOnly) return;

    if (selectedEdgeId) {
      onChangeFlow((currentFlow) => ({
        ...currentFlow,
        edges: currentFlow.edges.filter((edge) => edge.id !== selectedEdgeId),
      }));
      onSelectEdge(null);
      return;
    }

    if (selectedNodeId) {
      const selectedNode = flow.nodes.find((node) => node.id === selectedNodeId);
      if (selectedNode?.type === FlowNodeType.START) return;

      onChangeFlow((currentFlow) => ({
        ...currentFlow,
        nodes: currentFlow.nodes.filter((node) => node.id !== selectedNodeId),
        edges: currentFlow.edges.filter(
          (edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId,
        ),
      }));
      onSelectNode(null);
    }
  };

  const renderCurve = (startX: number, startY: number, endX: number, endY: number) => {
    const cp1x = startX + 80;
    const cp2x = endX - 80;
    return `M ${startX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${endX} ${endY}`;
  };

  return (
    <div className="relative flex flex-1 overflow-hidden">
      {!readOnly ? (
        <div className="flex w-20 shrink-0 flex-col items-center gap-3 border-r border-gray-200 bg-white py-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">节点</div>
          {TOOLBOX_ITEMS.map((item) => (
            <div
              key={`${item.type}_${item.label}`}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('nodeType', item.type);
                event.dataTransfer.effectAllowed = 'copy';
              }}
              className="flex h-11 w-11 cursor-grab items-center justify-center rounded-xl border border-transparent bg-slate-50 text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-100"
              title={item.label}
            >
              {item.type === FlowNodeType.START ? (
                <Play size={16} />
              ) : item.type === FlowNodeType.EXIT ? (
                <Flag size={16} />
              ) : (
                <Square size={16} />
              )}
            </div>
          ))}
        </div>
      ) : null}

      <div
        ref={canvasRef}
        className="relative flex-1 overflow-hidden bg-slate-50"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={(event) => {
          if (!event.ctrlKey) return;
          event.preventDefault();
          onZoomChange(Math.min(1.8, Math.max(0.6, zoom + (event.deltaY > 0 ? -0.05 : 0.05))));
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <div
          className="absolute inset-[-200%] opacity-[0.03]"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px)`,
            backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            position: 'absolute',
            inset: 0,
          }}
        >
          <svg className="absolute inset-0 h-full w-full overflow-visible">
            <defs>
              <marker id="flow-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
              </marker>
            </defs>

            {edgeMap.map(({ edge, source, target }) => {
              if (!source || !target) return null;
              const startX = source.position.x + NODE_WIDTH;
              const startY = source.position.y + NODE_HEIGHT / 2;
              const endX = target.position.x;
              const endY = target.position.y + NODE_HEIGHT / 2;
              const selected = edge.id === selectedEdgeId;
              const edgeAnnotation = annotations.find(
                (item) => item.targetType === 'edge' && item.targetId === edge.id,
              );

              // 根据边类型设置样式
              const edgeType = edge.edgeType || 'normal';
              let strokeColor = selected ? '#0284c7' : '#94a3b8';
              let strokeWidth = selected ? 3 : 2;
              let strokeDasharray = 'none';

              if (edgeType === 'conditional') {
                strokeColor = selected ? '#ea580c' : '#f97316'; // 橙色
              } else if (edgeType === 'llm_branch') {
                strokeColor = selected ? '#2563eb' : '#60a5fa'; // 蓝色
              } else if (edgeType === 'fallback') {
                strokeColor = selected ? '#6b7280' : '#d1d5db'; // 灰色
                strokeDasharray = '6 4'; // 虚线
              } else if (edgeType === 'goto_flow') {
                strokeColor = selected ? '#7c3aed' : '#a78bfa'; // 紫色
              }

              return (
                <g key={edge.id}>
                  <path
                    d={renderCurve(startX, startY, endX, endY)}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    fill="none"
                    markerEnd="url(#flow-arrow)"
                    className="cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectNode(null);
                      onSelectEdge(edge.id);
                    }}
                  />

                  {edge.label ? (
                    <foreignObject
                      x={(startX + endX) / 2 - 56}
                      y={(startY + endY) / 2 - 14}
                      width="112"
                      height="28"
                    >
                      <div className={`rounded-full border px-2 py-1 text-center text-[10px] shadow-sm ${
                        edgeType === 'conditional' ? 'border-orange-200 bg-orange-50 text-orange-700' :
                        edgeType === 'llm_branch' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                        edgeType === 'fallback' ? 'border-gray-200 bg-gray-50 text-gray-600' :
                        edgeType === 'goto_flow' ? 'border-purple-200 bg-purple-50 text-purple-700' :
                        'border-gray-200 bg-white text-slate-500'
                      }`}>
                        {edge.label}
                      </div>
                    </foreignObject>
                  ) : null}

                  {annotationMode && edgeAnnotation ? (
                    <foreignObject
                      x={(startX + endX) / 2 + 58}
                      y={(startY + endY) / 2 - 16}
                      width="28"
                      height="28"
                    >
                      <button
                        onClick={() => onAnnotationSelect(edgeAnnotation.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white shadow"
                      >
                        {edgeAnnotation.index}
                      </button>
                    </foreignObject>
                  ) : null}
                </g>
              );
            })}

            {drawingSourceNodeId ? (
              (() => {
                const source = flow.nodes.find((node) => node.id === drawingSourceNodeId);
                if (!source) return null;
                return (
                  <path
                    d={renderCurve(
                      source.position.x + NODE_WIDTH,
                      source.position.y + NODE_HEIGHT / 2,
                      drawingMouse.x,
                      drawingMouse.y,
                    )}
                    stroke="#0284c7"
                    strokeWidth={2}
                    fill="none"
                    strokeDasharray="6 4"
                  />
                );
              })()
            ) : null}
          </svg>

          {flow.nodes.map((node) => {
            const annotation = annotations.find(
              (item) => item.targetType === 'node' && item.targetId === node.id,
            );

            return (
              <div
                key={node.id}
                className={`absolute w-[220px] rounded-2xl border-2 shadow-sm transition-all ${
                  getNodeColors(node)
                } ${selectedNodeId === node.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                }}
                onMouseDown={(event) => handleNodeMouseDown(event, node.id)}
              >
                {annotationMode && annotation ? (
                  <AnnotationBadge
                    index={annotation.index}
                    style={{ right: -12, top: -10 }}
                    onClick={() => onAnnotationSelect(annotation.id)}
                  />
                ) : null}

                {node.type !== FlowNodeType.START ? (
                  <div className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-slate-400" />
                ) : null}

                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-white/70 p-2">{getNodeIcon(node)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-800">{node.data.name}</div>
                      <div className="mt-1 text-[11px] text-slate-500">{getStepLabel(node)}</div>
                    </div>
                  </div>

                  {node.type === FlowNodeType.DEFAULT ? (
                    <div className="mt-3 space-y-2">
                      <div className="line-clamp-2 text-[11px] leading-5 text-slate-600">
                        {node.data.description || 'Click the node to configure prompt, tools, entity collection and retry strategy.'}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {node.data.entityConfig?.enabled ? (
                          <span className="rounded-full bg-white px-2 py-1 text-[10px] text-amber-700">
                            Entity: {node.data.entityConfig.entityType || 'text'}
                          </span>
                        ) : null}
                        {(node.data.stepPrompt?.transitionFunctionIds || []).length > 0 ? (
                          <span className="rounded-full bg-white px-2 py-1 text-[10px] text-emerald-700">
                            Transition: {(node.data.stepPrompt?.transitionFunctionIds || []).length}
                          </span>
                        ) : null}
                        {(node.data.stepPrompt?.visibleFunctionIds || []).length > 0 ? (
                          <span className="rounded-full bg-white px-2 py-1 text-[10px] text-sky-700">
                            Visible: {(node.data.stepPrompt?.visibleFunctionIds || []).length}
                          </span>
                        ) : null}
                        {(node.data.toolIds || []).length > 0 ? (
                          <span className="rounded-full bg-white px-2 py-1 text-[10px] text-slate-700">
                            Tools: {(node.data.toolIds || []).length}
                          </span>
                        ) : null}
                        {(node.data.codeBlockIds || []).length > 0 ? (
                          <span className="rounded-full bg-white px-2 py-1 text-[10px] text-indigo-700">
                            代码块: {(node.data.codeBlockIds || []).length}
                          </span>
                        ) : null}
                        {node.data.handoffTargetId ? (
                          <span className="rounded-full bg-white px-2 py-1 text-[10px] text-fuchsia-700">
                            转接
                          </span>
                        ) : null}
                        {node.data.retryConfig?.enabled ? (
                          <span className="rounded-full bg-white px-2 py-1 text-[10px] text-rose-700">
                            重试: {node.data.retryConfig.maxAttempts}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>

                {node.type !== FlowNodeType.EXIT ? (
                  <button
                    onMouseDown={(event) => {
                      event.stopPropagation();
                      if (readOnly) return;
                      setDrawingSourceNodeId(node.id);
                      setDrawingMouse(getWorldPosition(event.clientX, event.clientY));
                    }}
                    className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-slate-400"
                    title="Drag to connect"
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          {!readOnly ? (
            <button
              onClick={onSave}
              className="rounded-lg border border-gray-200 bg-white p-2 text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
              title="保存流程"
            >
              <Save size={16} />
            </button>
          ) : null}

          <button
            onClick={onToggleFullscreen}
            className="rounded-lg border border-gray-200 bg-white p-2 text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
            title={isFullscreen ? '退出全屏' : '全屏'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {!readOnly && (selectedNodeId || selectedEdgeId) ? (
            <button
              onClick={handleDeleteSelected}
              className="rounded-lg border border-gray-200 bg-white p-2 text-red-500 shadow-sm transition-colors hover:bg-red-50"
            title="删除当前选中"
            >
              <Trash2 size={16} />
            </button>
          ) : null}
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] text-slate-500 shadow-sm">
            当前 Flow：{flow.name}
          </div>
        </div>
      </div>
    </div>
  );
}
