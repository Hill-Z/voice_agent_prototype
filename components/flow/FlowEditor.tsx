import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Play, Square, Save, ZoomIn, ZoomOut, RotateCcw, Maximize, Minimize,
  Trash2, Move, Settings, X, ChevronRight, ChevronDown, Plus, GripVertical
} from 'lucide-react';
import { FlowNode, FlowEdge, FlowNodeType, ExitNodeType, FlowConfig, FlowFunction, BotVariable, AgentTool } from '../../types';
import FlowNodeConfig from './FlowNodeConfig';

// --- Types ---
interface FlowEditorProps {
  initialFlow?: FlowConfig;
  onSave?: (flow: FlowConfig) => void;
  readOnly?: boolean;
  availableFunctions?: FlowFunction[];
  availableVariables?: BotVariable[];
  availableTools?: AgentTool[];
}

interface ToolboxItem {
  type: FlowNodeType;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

// --- Constants ---
const NODE_WIDTH = 200;
const NODE_HEIGHT = 60;  // Start/Exit nodes
const NODE_HEIGHT_DEFAULT = 80;  // Default nodes

const TOOLBOX_ITEMS: ToolboxItem[] = [
  {
    type: FlowNodeType.START,
    label: '开始节点',
    icon: <Play size={18} />,
    description: '流程的起始点',
    color: 'emerald'
  },
  {
    type: FlowNodeType.DEFAULT,
    label: '默认节点',
    icon: <Square size={18} />,
    description: '执行步骤或对话节点',
    color: 'blue'
  },
  {
    type: FlowNodeType.EXIT,
    label: '退出节点',
    icon: <Settings size={18} />,
    description: '流程结束或转接',
    color: 'rose'
  }
];

// --- Helper Functions ---
const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getNodeColor = (type: FlowNodeType) => {
  switch (type) {
    case FlowNodeType.START:
      return 'bg-emerald-50 border-emerald-300 text-emerald-700';
    case FlowNodeType.EXIT:
      return 'bg-rose-50 border-rose-300 text-rose-700';
    case FlowNodeType.DEFAULT:
    default:
      return 'bg-blue-50 border-blue-300 text-blue-700';
  }
};

const getNodeIconColor = (type: FlowNodeType) => {
  switch (type) {
    case FlowNodeType.START:
      return 'text-emerald-600';
    case FlowNodeType.EXIT:
      return 'text-rose-600';
    case FlowNodeType.DEFAULT:
    default:
      return 'text-blue-600';
  }
};

// --- Main Component ---
export default function FlowEditor({ 
  initialFlow, 
  onSave, 
  readOnly = false,
  availableFunctions = [],
  availableVariables = [],
  availableTools = []
}: FlowEditorProps) {
  // --- State ---
  const [nodes, setNodes] = useState<FlowNode[]>(initialFlow?.nodes || [
    {
      id: 'start',
      type: FlowNodeType.START,
      position: { x: 100, y: 300 },
      data: { name: '开始', description: '流程起始点' }
    }
  ]);
  const [edges, setEdges] = useState<FlowEdge[]>(initialFlow?.edges || []);
  
  // Viewport state
  const [viewport, setViewport] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  
  // Selection state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  
  // Dragging state
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  
  // Edge drawing state
  const [isDrawingEdge, setIsDrawingEdge] = useState(false);
  const [edgeStartNodeId, setEdgeStartNodeId] = useState<string | null>(null);
  const [edgeMousePos, setEdgeMousePos] = useState({ x: 0, y: 0 });
  
  // UI state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPropertyPanel, setShowPropertyPanel] = useState(false);
  
  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // --- Handlers ---
  const handleSave = useCallback(() => {
    const flow: FlowConfig = {
      id: initialFlow?.id || `flow_${Date.now()}`,
      name: initialFlow?.name || 'New Flow',
      nodes,
      edges,
      metadata: {
        ...initialFlow?.metadata,
        updatedAt: Date.now()
      }
    };
    onSave?.(flow);
  }, [nodes, edges, initialFlow, onSave]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleReset = () => {
    setZoom(1);
    setViewport({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  };

  // Mouse event handlers for canvas panning
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !isDraggingNode && !isDrawingEdge) {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setShowPropertyPanel(false);
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setShowPropertyPanel(true);
    
    if (!readOnly) {
      setIsDraggingNode(true);
      setDraggedNodeId(nodeId);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleOutputHandleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (readOnly) return;
    
    setIsDrawingEdge(true);
    setEdgeStartNodeId(nodeId);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setEdgeMousePos({
        x: (e.clientX - rect.left - viewport.x) / zoom,
        y: (e.clientY - rect.top - viewport.y) / zoom
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    if (isPanning) {
      setViewport(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else if (isDraggingNode && draggedNodeId) {
      setNodes(prev => prev.map(n => 
        n.id === draggedNodeId 
          ? { ...n, position: { x: n.position.x + deltaX / zoom, y: n.position.y + deltaY / zoom } }
          : n
      ));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else if (isDrawingEdge) {
      setEdgeMousePos({
        x: (e.clientX - rect.left - viewport.x) / zoom,
        y: (e.clientY - rect.top - viewport.y) / zoom
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDrawingEdge && edgeStartNodeId) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = (e.clientX - rect.left - viewport.x) / zoom;
        const mouseY = (e.clientY - rect.top - viewport.y) / zoom;
        
        // Find target node
        const targetNode = nodes.find(n => 
          mouseX >= n.position.x && 
          mouseX <= n.position.x + NODE_WIDTH &&
          mouseY >= n.position.y && 
          mouseY <= n.position.y + NODE_HEIGHT &&
          n.id !== edgeStartNodeId
        );
        
        if (targetNode) {
          // Check if edge already exists
          const existingEdge = edges.find(e => e.source === edgeStartNodeId && e.target === targetNode.id);
          if (!existingEdge) {
            const newEdge: FlowEdge = {
              id: `edge_${Date.now()}`,
              source: edgeStartNodeId,
              target: targetNode.id
            };
            setEdges(prev => [...prev, newEdge]);
          }
        }
      }
    }
    
    setIsPanning(false);
    setIsDraggingNode(false);
    setDraggedNodeId(null);
    setIsDrawingEdge(false);
    setEdgeStartNodeId(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, type: FlowNodeType) => {
    e.dataTransfer.setData('nodeType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (readOnly) return;
    
    const type = e.dataTransfer.getData('nodeType') as FlowNodeType;
    if (!type) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - viewport.x) / zoom;
    const y = (e.clientY - rect.top - viewport.y) / zoom;

    const newNode: FlowNode = {
      id: generateId(),
      type,
      position: { x, y },
      data: {
        name: type === FlowNodeType.START ? '开始' : type === FlowNodeType.EXIT ? '退出' : '步骤',
        description: ''
      }
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    setShowPropertyPanel(true);
  };

  // Delete handlers
  const deleteSelected = () => {
    if (readOnly) return;
    
    if (selectedNodeId) {
      // Don't allow deleting start node if it's the only one
      const node = nodes.find(n => n.id === selectedNodeId);
      if (node?.type === FlowNodeType.START && nodes.filter(n => n.type === FlowNodeType.START).length === 1) {
        return;
      }
      
      setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
      setEdges(prev => prev.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
      setSelectedNodeId(null);
      setShowPropertyPanel(false);
    } else if (selectedEdgeId) {
      setEdges(prev => prev.filter(e => e.id !== selectedEdgeId));
      setSelectedEdgeId(null);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedEdgeId, nodes]);

  // --- Render Helpers ---
  const renderBezierCurve = (startX: number, startY: number, endX: number, endY: number) => {
    const cp1x = startX + 80;
    const cp1y = startY;
    const cp2x = endX - 80;
    const cp2y = endY;
    return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-full w-full bg-slate-50 border border-slate-200 rounded-lg overflow-hidden"
      tabIndex={0}
    >
      {/* --- Top Toolbar --- */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-700">PolyAI Flow 编辑器</span>
          <div className="h-6 w-px bg-gray-200"></div>
          <button 
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Save size={14} />
            保存
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button onClick={handleZoomOut} className="p-1.5 text-slate-600 hover:bg-white rounded transition-colors" title="缩小">
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-mono w-12 text-center text-slate-600">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="p-1.5 text-slate-600 hover:bg-white rounded transition-colors" title="放大">
              <ZoomIn size={16} />
            </button>
          </div>
          <button onClick={handleReset} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="重置视图">
            <RotateCcw size={16} />
          </button>
          <button onClick={toggleFullscreen} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="全屏">
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="flex flex-1 overflow-hidden">
        {/* --- Left Toolbox --- */}
        {!readOnly && (
          <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-3 flex-shrink-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">节点</div>
            {TOOLBOX_ITEMS.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => handleDragStart(e, item.type)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-grab hover:bg-${item.color}-50 hover:text-${item.color}-600 transition-all border border-transparent hover:border-${item.color}-200 text-slate-400 group relative`}
                title={item.label}
              >
                {item.icon}
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- Canvas --- */}
        <div className="flex-1 relative overflow-hidden bg-slate-50">
          <div
            ref={canvasRef}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {/* Grid Background */}
            <div 
              className="absolute inset-[-200%] pointer-events-none opacity-[0.03]"
              style={{
                transform: `translate(${viewport.x}px, ${viewport.y}px)`,
                backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            />

            {/* Transformed Content */}
            <div
              style={{
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0
              }}
            >
              {/* Edges SVG Layer */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ zIndex: 1 }}>
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                  </marker>
                  <marker id="arrowhead-selected" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                  </marker>
                </defs>
                
                {edges.map(edge => {
                  const source = nodes.find(n => n.id === edge.source);
                  const target = nodes.find(n => n.id === edge.target);
                  if (!source || !target) return null;
                  
                  const startX = source.position.x + NODE_WIDTH;
                  const startY = source.position.y + NODE_HEIGHT / 2;
                  const endX = target.position.x;
                  const endY = target.position.y + NODE_HEIGHT / 2;
                  
                  const isSelected = selectedEdgeId === edge.id;
                  
                  return (
                    <g key={edge.id}>
                      <path
                        d={renderBezierCurve(startX, startY, endX, endY)}
                        stroke={isSelected ? '#3b82f6' : '#94a3b8'}
                        strokeWidth={isSelected ? 3 : 2}
                        fill="none"
                        markerEnd={isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'}
                        className="pointer-events-auto cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEdgeId(edge.id);
                          setSelectedNodeId(null);
                        }}
                      />
                      {/* Invisible wider path for easier clicking */}
                      <path
                        d={renderBezierCurve(startX, startY, endX, endY)}
                        stroke="transparent"
                        strokeWidth={15}
                        fill="none"
                        className="pointer-events-auto cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEdgeId(edge.id);
                          setSelectedNodeId(null);
                        }}
                      />
                    </g>
                  );
                })}
                
                {/* Drawing edge preview */}
                {isDrawingEdge && edgeStartNodeId && (
                  (() => {
                    const startNode = nodes.find(n => n.id === edgeStartNodeId);
                    if (!startNode) return null;
                    
                    const startX = startNode.position.x + NODE_WIDTH;
                    const startY = startNode.position.y + NODE_HEIGHT / 2;
                    
                    return (
                      <path
                        d={renderBezierCurve(startX, startY, edgeMousePos.x, edgeMousePos.y)}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="5,5"
                        fill="none"
                      />
                    );
                  })()
                )}
              </svg>

              {/* Nodes */}
              {nodes.map(node => {
                const isSelected = selectedNodeId === node.id;
                const isStartNode = node.type === FlowNodeType.START;
                
                const isExitNode = node.type === FlowNodeType.EXIT;
                
                return (
                  <div
                    key={node.id}
                    className={`absolute w-[200px] rounded-lg border-2 shadow-sm flex flex-col cursor-pointer transition-all select-none ${
                      getNodeColor(node.type)
                    } ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''} hover:shadow-md`}
                    style={{
                      left: node.position.x,
                      top: node.position.y,
                      zIndex: isSelected ? 20 : 10
                    }}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  >
                    {/* Input handle (left) - 开始节点没有输入 */}
                    {!isStartNode && (
                      <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-400 rounded-full border-2 border-white hover:bg-blue-400 hover:scale-125 transition-all" />
                    )}
                    
                    {/* Node Content */}
                    <div className="flex-1 flex flex-col p-3">
                      {/* Node Header */}
                      <div className="flex items-center">
                        <div className={`mr-2 ${getNodeIconColor(node.type)}`}>
                          {node.type === FlowNodeType.START && <Play size={16} />}
                          {node.type === FlowNodeType.DEFAULT && <Square size={16} />}
                          {node.type === FlowNodeType.EXIT && <Settings size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{node.data.name}</div>
                        </div>
                      </div>
                      
                      {/* Node Body - 仅步骤节点显示额外信息 */}
                      {node.type === FlowNodeType.DEFAULT && (
                        <div className="flex-1 flex items-center justify-between mt-1">
                          <div className="text-[10px] text-slate-500 truncate">
                            {node.data.stepPrompt?.prompt ? '已配置步骤提示词' : '点击配置步骤提示词'}
                          </div>
                          <div className="flex gap-1 ml-2">
                            {node.data.visibleFunctionIds?.length > 0 && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[9px] rounded whitespace-nowrap">
                                {node.data.visibleFunctionIds.length} 可见
                              </span>
                            )}
                            {node.data.transitionFunctionIds?.length > 0 && (
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-600 text-[9px] rounded whitespace-nowrap">
                                {node.data.transitionFunctionIds.length} 过渡
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Node Type Label */}
                      <div className="mt-1">
                        <span className="text-[9px] opacity-60">
                          {node.type === FlowNodeType.START && '开始节点'}
                          {node.type === FlowNodeType.DEFAULT && '步骤节点'}
                          {node.type === FlowNodeType.EXIT && '退出节点'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Output handle (right) - 结束节点没有输出 */}
                    {!isExitNode && (
                      <div
                        className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-400 rounded-full border-2 border-white cursor-crosshair hover:bg-blue-400 hover:scale-125 transition-all"
                        onMouseDown={(e) => handleOutputHandleMouseDown(e, node.id)}
                        title="拖拽创建连接"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Canvas Controls (Bottom Left) */}
          <div className="absolute left-4 bottom-4 flex items-center gap-2">
            {(selectedNodeId || selectedEdgeId) && !readOnly && (
              <button
                onClick={deleteSelected}
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 text-red-500 hover:bg-red-50 transition-colors"
                title="删除选中"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* --- Right Property Panel --- */}
        {showPropertyPanel && selectedNode && (
          <div className="w-[480px] bg-white border-l border-gray-200 flex flex-col flex-shrink-0 animate-in slide-in-from-right duration-200">
            {/* Panel Header - Close Button Only */}
            <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-end bg-slate-50">
              <button
                onClick={() => {
                  setShowPropertyPanel(false);
                  setSelectedNodeId(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Flow Node Config */}
              <FlowNodeConfig
                node={selectedNode}
                availableFunctions={availableFunctions}
                availableVariables={availableVariables}
                availableTools={availableTools}
                availableNodes={nodes}
                onChange={(updatedNode) => {
                  setNodes(prev => prev.map(n => 
                    n.id === updatedNode.id ? updatedNode : n
                  ));
                }}
                onClose={() => {
                  setShowPropertyPanel(false);
                  setSelectedNodeId(null);
                }}
                readOnly={readOnly}
              />
            </div>

            {/* Panel Footer */}
            <div className="px-4 py-3 border-t border-gray-200 bg-slate-50">
              <div className="text-[10px] text-slate-400">
                节点 ID: <span className="font-mono">{selectedNode.id}</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty Property Panel Placeholder */}
        {!showPropertyPanel && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col items-center justify-center flex-shrink-0">
            <div className="text-center p-6">
              <Settings size={40} className="text-slate-200 mx-auto mb-3" />
              <div className="text-sm text-slate-500 mb-1">选择一个节点</div>
              <div className="text-xs text-slate-400">点击画布上的节点查看和编辑属性</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
