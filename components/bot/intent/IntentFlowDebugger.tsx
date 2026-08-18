import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Play, Pause, Square, RotateCcw, StepForward, CornerDownRight,
  Bug, Settings, X, ChevronRight, ChevronDown, Clock, Zap,
  Activity, AlertCircle, CheckCircle, SkipForward, Eye, EyeOff,
  Volume2, Mic, Timer, Bot, Split, Calculator, Tag, Code,
  Globe, Mail, Headset, PhoneForwarded, PhoneOff, Flag,
  Maximize, Minimize, RotateCcw as ResetIcon
} from 'lucide-react';
import {
  IntentNode, IntentEdge, DebugExecutionState, NodeExecutionInfo,
  DebugBreakpoint, ExecutionStep, DebugSession, DebugConfig, StepType, IntentNodeType
} from '../../../types';
import DebugNodePanel from './DebugNodePanel';
import ExecutionTimeline from './ExecutionTimeline';
import VariableInspector from './VariableInspector';

interface IntentFlowDebuggerProps {
  nodes: IntentNode[];
  edges: IntentEdge[];
  initialVariables?: Record<string, any>;
  onClose: () => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  nodeId: string | null;
}

const DEFAULT_DEBUG_CONFIG: DebugConfig = {
  executionSpeed: 1,
  autoPauseOnError: true,
  showDetailedLogs: true,
  maxSteps: 1000,
  timeoutMs: 30000
};

// Node type to icon mapping (same as MicroFlowEditor)
const NODE_TYPE_ICONS: Record<string, any> = {
  'START': Play,
  'LISTEN': Mic,
  'ACTION': Volume2,
  'BRANCH': Split,
  'AI_AGENT': Bot,
  'LOGIC': Calculator,
  'DATA': Globe,
};

// Node type to color mapping (same as MicroFlowEditor)
const getNodeTypeColor = (type: IntentNodeType, subType?: string) => {
  if (subType === 'end_flow') return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', icon: 'text-slate-500' };
  switch(type) {
    case 'START': return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500' };
    case 'LISTEN': return { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', icon: 'text-indigo-500' };
    case 'BRANCH': return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'text-orange-500' };
    case 'AI_AGENT': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-500' };
    case 'LOGIC': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-500' };
    case 'ACTION': return { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: 'text-rose-500' };
    case 'DATA': return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-500' };
    default: return { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-700', icon: 'text-gray-500' };
  }
};

// Get node icon based on type and subType
const getNodeIconComponent = (node: IntentNode) => {
  if (node.type === 'START') return Play;
  
  // Map subTypes to specific icons
  const subTypeIcons: Record<string, any> = {
    'play_tts': Volume2,
    'collect': Mic,
    'wait': Timer,
    'llm': Bot,
    'condition': Split,
    'set_variable': Calculator,
    'tag': Tag,
    'script': Code,
    'http_request': Globe,
    'sms': Mail,
    'transfer': Headset,
    'transfer_pstn': PhoneForwarded,
    'hangup': PhoneOff,
    'end_flow': Flag,
  };
  
  return subTypeIcons[node.subType] || NODE_TYPE_ICONS[node.type] || Activity;
};

export default function IntentFlowDebugger({
  nodes,
  edges,
  initialVariables = {},
  onClose
}: IntentFlowDebuggerProps) {
  // Debug Session State
  const [session, setSession] = useState<DebugSession>({
    id: `debug_${Date.now()}`,
    startTime: Date.now(),
    state: 'idle',
    currentNodeId: null,
    executionHistory: [],
    breakpoints: [],
    variables: { ...initialVariables },
    executionSpeed: 1,
    maxSteps: 1000,
    currentStep: 0,
    autoPauseOnError: true
  });

  // UI State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(true);
  const [showVariables, setShowVariables] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDetailedLogs, setShowDetailedLogs] = useState(true);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null
  });
  
  // Viewport State (same as MicroFlowEditor)
  const [viewport, setViewport] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Refs
  const executionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Computed
  const currentNodeInfo = useMemo(() => {
    if (!session.currentNodeId) return null;
    return session.executionHistory.find(h => h.nodeId === session.currentNodeId);
  }, [session.currentNodeId, session.executionHistory]);

  const executedNodeIds = useMemo(() => {
    return new Set(session.executionHistory.map(h => h.nodeId));
  }, [session.executionHistory]);

  const isBreakpoint = useCallback((nodeId: string) => {
    return session.breakpoints.some(bp => bp.nodeId === nodeId && bp.enabled);
  }, [session.breakpoints]);

  // Execution Logic
  const executeNode = useCallback(async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Check breakpoint
    const breakpoint = session.breakpoints.find(bp => bp.nodeId === nodeId && bp.enabled);
    if (breakpoint) {
      // Update hitCount for the breakpoint
      setSession(prev => ({
        ...prev,
        state: 'paused',
        currentNodeId: nodeId,
        breakpoints: prev.breakpoints.map(bp =>
          bp.id === breakpoint.id ? { ...bp, hitCount: bp.hitCount + 1 } : bp
        )
      }));
      return;
    }

    // Start execution
    setSession(prev => ({ ...prev, currentNodeId: nodeId, state: 'running' }));

    const startTime = Date.now();
    const executionInfo: NodeExecutionInfo = {
      nodeId,
      status: 'executing',
      input: { ...session.variables },
      output: {},
      startTime,
      attemptCount: 1
    };

    // Simulate execution delay based on node type
    const delay = Math.random() * 500 + 200;
    await new Promise(r => setTimeout(r, delay / session.executionSpeed));

    // Simulate execution result
    const success = Math.random() > 0.1;
    const endTime = Date.now();

    executionInfo.status = success ? 'success' : 'error';
    executionInfo.endTime = endTime;
    executionInfo.duration = endTime - startTime;

    if (!success) {
      executionInfo.error = '模拟执行错误';
    }

    // Update variables based on node type
    const newVariables = { ...session.variables };
    if (node.subType === 'set_variable' && node.config?.operations) {
      node.config.operations.forEach((op: any) => {
        newVariables[op.variableId] = op.value;
      });
    }

    executionInfo.output = { ...newVariables };

    const step: ExecutionStep = {
      id: `step_${Date.now()}`,
      nodeId,
      timestamp: endTime,
      executionInfo,
      variablesSnapshot: newVariables
    };

    setSession(prev => ({
      ...prev,
      variables: newVariables,
      executionHistory: [...prev.executionHistory, step],
      currentStep: prev.currentStep + 1
    }));

    // Check if should pause on error
    if (!success && session.autoPauseOnError) {
      setSession(prev => ({ ...prev, state: 'paused' }));
      return;
    }

    // Continue to next node
    const nextNodeId = node.config?.nextNodeId;
    if (nextNodeId && nodes.find(n => n.id === nextNodeId)) {
      if (session.state === 'running') {
        executeNode(nextNodeId);
      }
    } else {
      setSession(prev => ({ ...prev, state: 'completed', currentNodeId: null }));
    }
  }, [nodes, session.breakpoints, session.variables, session.executionSpeed, session.autoPauseOnError, session.state]);

  const startExecution = useCallback(() => {
    const startNode = nodes.find(n => n.type === 'START');
    if (startNode) {
      setSession(prev => ({ ...prev, state: 'running' }));
      executeNode(startNode.id);
    }
  }, [nodes, executeNode]);

  const pauseExecution = useCallback(() => {
    setSession(prev => ({ ...prev, state: 'paused' }));
    if (executionTimerRef.current) {
      clearTimeout(executionTimerRef.current);
    }
  }, []);

  const resumeExecution = useCallback(() => {
    if (session.currentNodeId) {
      setSession(prev => ({ ...prev, state: 'running' }));
      executeNode(session.currentNodeId);
    }
  }, [session.currentNodeId, executeNode]);

  const stopExecution = useCallback(() => {
    setSession(prev => ({
      ...prev,
      state: 'idle',
      currentNodeId: null,
      endTime: Date.now()
    }));
    if (executionTimerRef.current) {
      clearTimeout(executionTimerRef.current);
    }
  }, []);

  const resetExecution = useCallback(() => {
    setSession({
      id: `debug_${Date.now()}`,
      startTime: Date.now(),
      state: 'idle',
      currentNodeId: null,
      executionHistory: [],
      breakpoints: session.breakpoints,
      variables: { ...initialVariables },
      executionSpeed: session.executionSpeed,
      maxSteps: session.maxSteps,
      currentStep: 0,
      autoPauseOnError: session.autoPauseOnError
    });
  }, [initialVariables, session.breakpoints, session.executionSpeed, session.maxSteps, session.autoPauseOnError]);

  const stepExecution = useCallback((stepType: StepType) => {
    if (session.state !== 'paused' || !session.currentNodeId) return;

    const currentNode = nodes.find(n => n.id === session.currentNodeId);
    if (!currentNode) return;

    let nextNodeId: string | undefined;

    switch (stepType) {
      case 'over':
        nextNodeId = currentNode.config?.nextNodeId;
        break;
      case 'into':
        // For now, same as over (can be enhanced for sub-flows)
        nextNodeId = currentNode.config?.nextNodeId;
        break;
      case 'out':
        // For now, stop execution (can be enhanced for sub-flows)
        stopExecution();
        return;
    }

    if (nextNodeId && nodes.find(n => n.id === nextNodeId)) {
      executeNode(nextNodeId);
    } else {
      setSession(prev => ({ ...prev, state: 'completed', currentNodeId: null }));
    }
  }, [session.state, session.currentNodeId, nodes, executeNode, stopExecution]);

  const jumpToStep = useCallback((stepIndex: number) => {
    const step = session.executionHistory[stepIndex];
    if (step) {
      setSession(prev => ({
        ...prev,
        currentNodeId: step.nodeId,
        variables: { ...step.variablesSnapshot },
        state: 'paused'
      }));
      setSelectedNodeId(step.nodeId);
    }
  }, [session.executionHistory]);

  // Breakpoint Management
  const toggleBreakpoint = useCallback((nodeId: string) => {
    setSession(prev => {
      const existingIndex = prev.breakpoints.findIndex(bp => bp.nodeId === nodeId);
      if (existingIndex >= 0) {
        const newBreakpoints = [...prev.breakpoints];
        newBreakpoints.splice(existingIndex, 1);
        return { ...prev, breakpoints: newBreakpoints };
      } else {
        return {
          ...prev,
          breakpoints: [...prev.breakpoints, {
            id: `bp_${Date.now()}`,
            nodeId,
            enabled: true,
            hitCount: 0
          }]
        };
      }
    });
  }, []);

  const executeFromNode = useCallback((nodeId: string) => {
    setSession(prev => ({
      ...prev,
      state: 'running',
      currentNodeId: nodeId
    }));
    executeNode(nodeId);
  }, [executeNode]);

  // Context Menu Handlers
  const handleNodeContextMenu = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      nodeId
    });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // Viewport controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setViewport({ x: 0, y: 0 });
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
        e.preventDefault();
        if (session.state === 'idle') {
          startExecution();
        } else if (session.state === 'paused') {
          resumeExecution();
        }
      } else if (e.key === 'F10') {
        e.preventDefault();
        stepExecution('over');
      } else if (e.shiftKey && e.key === 'F11') {
        e.preventDefault();
        stepExecution('out');
      } else if (e.key === 'F11') {
        e.preventDefault();
        stepExecution('into');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session.state, startExecution, resumeExecution, stepExecution]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => hideContextMenu();
    if (contextMenu.visible) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [contextMenu.visible, hideContextMenu]);

  // Render Helpers
  const getNodeStatus = (nodeId: string): NodeExecutionInfo | undefined => {
    return session.executionHistory.find(h => h.nodeId === nodeId)?.executionInfo;
  };

  const getNodeExecutionStyle = (node: IntentNode) => {
    const status = getNodeStatus(node.id)?.status;
    const isCurrent = session.currentNodeId === node.id;
    const hasBreakpoint = isBreakpoint(node.id);
    const colors = getNodeTypeColor(node.type, node.subType);

    let executionClass = '';
    
    if (isCurrent) {
      executionClass = 'ring-4 ring-blue-400 ring-opacity-60 animate-pulse z-20';
    } else if (status === 'success') {
      executionClass = 'border-green-400 shadow-green-100';
    } else if (status === 'error') {
      executionClass = 'border-red-400 shadow-red-100';
    } else if (status === 'skipped') {
      executionClass = 'opacity-50 grayscale';
    }

    return {
      colors,
      executionClass,
      hasBreakpoint,
      isCurrent
    };
  };

  const renderBezierCurve = (startX: number, startY: number, endX: number, endY: number) => {
    const cp1x = startX + 50;
    const cp1y = startY;
    const cp2x = endX - 50;
    const cp2y = endY;
    return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  };

  // Status badge color
  const getStatusBadgeStyle = (state: DebugExecutionState) => {
    switch (state) {
      case 'idle': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'running': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'paused': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'error': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col" ref={containerRef}>
      {/* Header - Clean white style like MicroFlowEditor */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Bug className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">意图技能调试器</h2>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusBadgeStyle(session.state)}`}>
                {session.state === 'idle' ? '空闲' :
                 session.state === 'running' ? '运行中' :
                 session.state === 'paused' ? '已暂停' :
                 session.state === 'completed' ? '已完成' : '错误'}
              </span>
              {session.currentNodeId && (
                <span className="text-[10px] text-slate-500">
                  当前: {nodes.find(n => n.id === session.currentNodeId)?.label || session.currentNodeId}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Debug Controls - Compact toolbar style */}
        <div className="flex items-center space-x-1.5">
          {session.state === 'idle' && (
            <button
              onClick={startExecution}
              className="flex items-center px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium transition-colors"
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              开始
              <span className="ml-1 text-[10px] opacity-60">F5</span>
            </button>
          )}

          {session.state === 'running' && (
            <button
              onClick={pauseExecution}
              className="flex items-center px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-medium transition-colors"
            >
              <Pause className="w-3.5 h-3.5 mr-1.5" />
              暂停
            </button>
          )}

          {session.state === 'paused' && (
            <>
              <button
                onClick={resumeExecution}
                className="flex items-center px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium transition-colors"
              >
                <Play className="w-3.5 h-3.5 mr-1.5" />
                继续
              </button>
              <button
                onClick={() => stepExecution('over')}
                className="flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium transition-colors"
              >
                <StepForward className="w-3.5 h-3.5 mr-1.5" />
                步过
                <span className="ml-1 text-[10px] opacity-60">F10</span>
              </button>
              <button
                onClick={() => stepExecution('into')}
                className="flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium transition-colors"
              >
                <CornerDownRight className="w-3.5 h-3.5 mr-1.5" />
                步入
                <span className="ml-1 text-[10px] opacity-60">F11</span>
              </button>
            </>
          )}

          {(session.state === 'running' || session.state === 'paused') && (
            <button
              onClick={stopExecution}
              className="flex items-center px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium transition-colors"
            >
              <Square className="w-3.5 h-3.5 mr-1.5" />
              停止
            </button>
          )}

          <button
            onClick={resetExecution}
            className="flex items-center px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            重置
          </button>

          <div className="w-px h-6 bg-slate-200 mx-1" />

          {/* Speed Control */}
          <div className="flex items-center space-x-2 px-2">
            <span className="text-[10px] text-slate-500">速度</span>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.5"
              value={session.executionSpeed}
              onChange={(e) => setSession(prev => ({ ...prev, executionSpeed: parseFloat(e.target.value) }))}
              className="w-20 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-[10px] text-slate-600 w-8">{session.executionSpeed}x</span>
          </div>

          <div className="w-px h-6 bg-slate-200 mx-1" />

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden bg-slate-50">
        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden" ref={canvasRef}>
          {/* Settings Panel */}
          {showSettings && (
            <div className="absolute top-4 right-4 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-4">
              <h3 className="text-sm font-bold text-slate-800 mb-4">调试设置</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">出错时自动暂停</span>
                  <button
                    onClick={() => setSession(prev => ({ ...prev, autoPauseOnError: !prev.autoPauseOnError }))}
                    className={`w-10 h-5 rounded-full transition-colors relative ${session.autoPauseOnError ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${session.autoPauseOnError ? 'left-5.5' : 'left-0.5'}`} style={{ left: session.autoPauseOnError ? '22px' : '2px' }} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">显示详细日志</span>
                  <button
                    onClick={() => setShowDetailedLogs(!showDetailedLogs)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${showDetailedLogs ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all`} style={{ left: showDetailedLogs ? '22px' : '2px' }} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="absolute bottom-4 left-4 flex items-center space-x-1 bg-white border border-slate-200 rounded-lg shadow-sm p-1 z-20">
            <button onClick={handleZoomOut} className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
              <Minimize className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
              <Maximize className="w-4 h-4" />
            </button>
            <button onClick={handleResetView} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 border-l border-slate-200 ml-1">
              <ResetIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Flow Canvas */}
          <div className="absolute inset-0 overflow-auto">
            <svg className="w-full h-full min-w-[2000px] min-h-[2000px]">
              <defs>
                <marker id="arrowhead-debug" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
                <marker id="arrowhead-executed" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                </marker>
                <marker id="arrowhead-current" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
                </marker>
              </defs>

              {/* Edges */}
              {edges.map(edge => {
                const start = nodes.find(n => n.id === edge.source);
                const end = nodes.find(n => n.id === edge.target);
                if (!start || !end) return null;

                const isExecuted = executedNodeIds.has(edge.source) && executedNodeIds.has(edge.target);
                const isCurrentPath = session.currentNodeId === edge.source;

                return (
                  <g key={edge.id}>
                    <path
                      d={renderBezierCurve(start.x + 180, start.y + 30, end.x, end.y + 30)}
                      stroke={isCurrentPath ? '#10b981' : isExecuted ? '#3b82f6' : '#cbd5e1'}
                      strokeWidth={isCurrentPath ? 3 : 2}
                      fill="none"
                      markerEnd={isCurrentPath ? "url(#arrowhead-current)" : isExecuted ? "url(#arrowhead-executed)" : "url(#arrowhead-debug)"}
                      strokeDasharray={isExecuted ? undefined : "5,5"}
                      className="transition-all duration-300"
                    />
                    {edge.label && (
                      <foreignObject x={(start.x + 180 + end.x) / 2 - 30} y={(start.y + 30 + end.y + 30) / 2 - 10} width="60" height="20">
                        <div className="text-[8px] text-center rounded px-1 bg-white text-slate-600 border border-slate-200 shadow-sm">
                          {edge.label}
                        </div>
                      </foreignObject>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map(node => {
              const status = getNodeStatus(node.id);
              const { colors, executionClass, hasBreakpoint, isCurrent } = getNodeExecutionStyle(node);
              const NodeIcon = getNodeIconComponent(node);

              return (
                <div
                  key={node.id}
                  className={`absolute w-[180px] h-[60px] rounded-xl border-2 flex items-center px-3 cursor-pointer transition-all duration-200 select-none shadow-sm hover:shadow-md ${colors.bg} ${colors.border} ${executionClass}`}
                  style={{ left: node.x, top: node.y }}
                  onClick={() => setSelectedNodeId(node.id)}
                  onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
                >
                  {/* Breakpoint Indicator */}
                  {hasBreakpoint && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  )}

                  {/* Status Icon */}
                  {status && (
                    <div className="absolute -bottom-1.5 -right-1.5">
                      {status.status === 'success' && (
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {status.status === 'error' && (
                        <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center shadow-sm">
                          <AlertCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {status.status === 'skipped' && (
                        <div className="w-5 h-5 bg-slate-400 rounded-full flex items-center justify-center shadow-sm">
                          <SkipForward className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Current Indicator */}
                  {isCurrent && (
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
                  )}

                  {/* Node Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${colors.bg} ${colors.icon}`}>
                    <NodeIcon size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold truncate ${colors.text}`}>{node.label}</div>
                    <div className="text-[9px] opacity-60 truncate text-slate-500">
                      {node.subType?.replace(/_/g, ' ') || node.type}
                    </div>
                    {status?.duration && (
                      <div className="text-[8px] text-slate-400 mt-0.5 font-mono">
                        {status.duration}ms
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Context Menu */}
          {contextMenu.visible && contextMenu.nodeId && (
            <div
              className="fixed bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 min-w-[180px]"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <button
                onClick={() => {
                  toggleBreakpoint(contextMenu.nodeId!);
                  hideContextMenu();
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center transition-colors"
              >
                <div className={`w-2 h-2 rounded-full mr-3 ${isBreakpoint(contextMenu.nodeId) ? 'bg-red-500' : 'bg-slate-300'}`} />
                {isBreakpoint(contextMenu.nodeId) ? '取消断点' : '设置断点'}
              </button>
              <button
                onClick={() => {
                  executeFromNode(contextMenu.nodeId!);
                  hideContextMenu();
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center transition-colors disabled:opacity-50"
                disabled={session.state === 'running'}
              >
                <Play className="w-4 h-4 mr-3 text-emerald-500" />
                从此节点执行
              </button>
              <div className="h-px bg-slate-100 my-1" />
              <button
                onClick={() => {
                  setSelectedNodeId(contextMenu.nodeId);
                  hideContextMenu();
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center transition-colors"
              >
                <Eye className="w-4 h-4 mr-3 text-blue-500" />
                查看详情
              </button>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-sm">
          {/* Tabs - Modern style */}
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button
              onClick={() => { setShowTimeline(true); setShowVariables(false); setSelectedNodeId(null); }}
              className={`flex-1 py-3 text-xs font-medium transition-colors relative ${showTimeline && !selectedNodeId ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              执行历史
              {showTimeline && !selectedNodeId && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => { setShowVariables(true); setShowTimeline(false); setSelectedNodeId(null); }}
              className={`flex-1 py-3 text-xs font-medium transition-colors relative ${showVariables && !selectedNodeId ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              变量监视
              {showVariables && !selectedNodeId && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden bg-slate-50/30">
            {selectedNodeId ? (
              <DebugNodePanel
                node={nodes.find(n => n.id === selectedNodeId)!}
                executionInfo={getNodeStatus(selectedNodeId)}
                onClose={() => setSelectedNodeId(null)}
              />
            ) : (
              <>
                {showTimeline && (
                  <ExecutionTimeline
                    history={session.executionHistory}
                    currentStep={session.executionHistory.findIndex(h => h.nodeId === session.currentNodeId)}
                    onJumpToStep={jumpToStep}
                    nodes={nodes}
                  />
                )}
                {showVariables && (
                  <VariableInspector
                    variables={session.variables}
                    onVariableChange={(key, value) => setSession(prev => ({
                      ...prev,
                      variables: { ...prev.variables, [key]: value }
                    }))}
                    readOnly={session.state === 'running'}
                  />
                )}
              </>
            )}
          </div>

          {/* Breakpoint List */}
          <div className="border-t border-slate-200 p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700">断点列表</span>
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{session.breakpoints.length}</span>
            </div>
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {session.breakpoints.map(bp => {
                const node = nodes.find(n => n.id === bp.nodeId);
                const colors = getNodeTypeColor(node?.type || 'ACTION', node?.subType);
                return (
                  <div key={bp.id} className="flex items-center justify-between text-xs bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 group hover:border-slate-200 transition-colors">
                    <div className="flex items-center min-w-0">
                      <div className={`w-2 h-2 rounded-full mr-2 ${colors.bg.replace('bg-', 'bg-').replace('50', '400')}`} />
                      <span className="text-slate-700 truncate">{node?.label || bp.nodeId}</span>
                    </div>
                    <button
                      onClick={() => toggleBreakpoint(bp.nodeId)}
                      className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              {session.breakpoints.length === 0 && (
                <div className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  暂无断点，右键点击节点设置
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
