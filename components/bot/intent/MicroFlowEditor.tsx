
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Play, Settings, X, 
  MessageSquare, Globe, ArrowLeft, 
  Zap, PhoneOff, Headset, 
  Move, Plus, GitBranch,
  Bot, UserCog, Search, Clock, Calculator, Loader, Smartphone, Mail, Database, Activity, Volume2,
  Smile, ZoomIn, ZoomOut, Maximize, Minimize, RotateCcw,
  Mic, Split, Trash2, Hash, Music, Tag, Code, Layers, AlertCircle, Check, ChevronDown, List,
  Flag, Timer, PhoneForwarded,
  Pause, Square, StepForward, CornerDownRight, Bug, Eye, EyeOff,
  ChevronRight, ChevronDown as ChevronDownIcon, FileText, Copy, Maximize2, RefreshCw, Circle
} from 'lucide-react';
import { IntentNode, IntentEdge, IntentNodeType, ModelType, TTSModel, ASRModel, ExtractionConfig, LabelGroup, DebugExecutionState, ExecutionStep, AgentTool, FlowFunction } from '../../../types';
import { Input, Label, Select, Switch, Slider } from '../../ui/FormComponents';
import { StringList } from './NodeFormHelpers';

// Node Config Components
import InteractionConfig from './nodes/InteractionConfig';
import CognitiveConfig from './nodes/CognitiveConfig';
import LogicConfig from './nodes/LogicConfig';
import DataConfig from './nodes/DataConfig';
import EdgeTransitionEditor from './EdgeTransitionEditor';

interface MicroFlowEditorProps {
  initialNodes: IntentNode[];
  initialEdges: IntentEdge[];
  onSave: (nodes: IntentNode[], edges: IntentEdge[]) => void;
  readOnly?: boolean;
  extractionConfigs?: ExtractionConfig[];
  labelGroups?: LabelGroup[];
  availableTools?: AgentTool[];
  availableFunctions?: FlowFunction[];
}

interface ToolboxItem {
  type: IntentNodeType;
  subType: string;
  label: string;
  icon: any;
  tip: string;
}

// Updated Toolbox Groups
const INTENT_TOOLBOX_GROUPS: { name: string; color: string; items: ToolboxItem[] }[] = [
  {
    name: '交互 (Interaction)',
    color: 'indigo',
    items: [
      { type: 'ACTION', subType: 'play_audio', label: '播放录音', icon: Volume2, tip: '从录音市场选择录音播放。' },
      { type: 'LISTEN', subType: 'collect', label: '收集 (Collect)', icon: Mic, tip: '收集用户语音意图、槽位或按键输入。' },
      { type: 'ACTION', subType: 'wait', label: '等待 (Wait)', icon: Timer, tip: '静音等待一段时间，通常用于模拟思考或节奏控制。' },
    ]
  },
  {
    name: '认知 (Cognitive)',
    color: 'amber',
    items: [
      { type: 'AI_AGENT', subType: 'llm', label: '大模型生成', icon: Bot, tip: '调用 LLM 生成动态回复。' },
    ]
  },
  {
    name: '逻辑 (Logic)',
    color: 'blue',
    items: [
      { type: 'BRANCH', subType: 'condition', label: '条件分支', icon: Split, tip: '根据变量值或表达式进行逻辑判断。' },
      { type: 'LOGIC', subType: 'set_variable', label: '变量操作', icon: Calculator, tip: '设置、更新或清除上下文变量。' },
      { type: 'LOGIC', subType: 'tag', label: '打标签', icon: Tag, tip: '给当前会话打上业务标签（如：高意向）。' },
      { type: 'LOGIC', subType: 'script', label: '脚本代码', icon: Code, tip: '执行自定义 JavaScript 脚本。' },
    ]
  },
  {
    name: '服务与数据 (Service)',
    color: 'rose',
    items: [
      { type: 'DATA', subType: 'http_request', label: 'HTTP 请求', icon: Globe, tip: '调用外部 API 接口。' },
      { type: 'DATA', subType: 'sms', label: '发送短信', icon: Mail, tip: '触发短信模版发送。' },
      { type: 'ACTION', subType: 'transfer', label: '转人工', icon: Headset, tip: '转接到内呼坐席技能组。' },
      { type: 'ACTION', subType: 'transfer_pstn', label: '转外线', icon: PhoneForwarded, tip: '转接到外部手机或固话号码。' },
      { type: 'ACTION', subType: 'hangup', label: '挂断', icon: PhoneOff, tip: '结束通话。' }
    ]
  },
  {
    name: '流程控制 (Flow)',
    color: 'slate',
    items: [
      { type: 'ACTION', subType: 'end_flow', label: '流程结束', icon: Flag, tip: '标记意图流程的自然结束点。' }
    ]
  }
];

// --- Main Editor Component ---

export default function MicroFlowEditor({ 
  initialNodes, initialEdges, onSave, readOnly,
  extractionConfigs = [], labelGroups = [], availableTools = [], availableFunctions = []
}: MicroFlowEditorProps) {
  const [nodes, setNodes] = useState<IntentNode[]>(initialNodes.length > 0 ? initialNodes : [{ id: 'start', type: 'START', subType: 'start', label: '流程开始', x: 50, y: 250 }]);
  // edges are now derived mostly from node configs, but we keep state for initial load or manual overrides if we were to support hybrid.
  // For this refactor, we will regenerate edges automatically based on config.
  const [edges, setEdges] = useState<IntentEdge[]>(initialEdges);
  
  // Viewport / Canvas State
  const [viewport, setViewport] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Interaction State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [activeTab, setActiveTab] = useState<'CONFIG' | 'ADVANCED'>('CONFIG');
  
  // Hover Tooltip
  const [hoveredTool, setHoveredTool] = useState<{ item: ToolboxItem, rect: DOMRect } | null>(null);
  
  // Edge Drawing State
  const [isDrawingEdge, setIsDrawingEdge] = useState(false);
  const [edgeStartNodeId, setEdgeStartNodeId] = useState<string | null>(null);
  const [edgeStartBranchIndex, setEdgeStartBranchIndex] = useState<number | null>(null);
  const [edgeMousePos, setEdgeMousePos] = useState({ x: 0, y: 0 });
  
  // Debug Mode State
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugState, setDebugState] = useState<DebugExecutionState>('idle');
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [executionHistory, setExecutionHistory] = useState<ExecutionStep[]>([]);
  const [debugVariables, setDebugVariables] = useState<Record<string, any>>({});
  const [showDebugVariables, setShowDebugVariables] = useState(false);
  const [executionSpeed, setExecutionSpeed] = useState(1);
  const [showDebugSidebar, setShowDebugSidebar] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const executionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-generate edges when nodes change
  useEffect(() => {
    const newEdges: IntentEdge[] = [];
    
    nodes.forEach(node => {
      // 1. Linear connections (nextNodeId)
      if (node.config?.nextNodeId) {
        // Validation: Ensure target exists
        if (nodes.find(n => n.id === node.config.nextNodeId)) {
          newEdges.push({
            id: `e_${node.id}_to_${node.config.nextNodeId}`,
            source: node.id,
            target: node.config.nextNodeId
          });
        }
      }

      // 2. Branch connections (Condition Node)
      if (node.subType === 'condition' && node.config?.expressions) {
        node.config.expressions.forEach((expr: any, idx: number) => {
          if (expr.targetNodeId && nodes.find(n => n.id === expr.targetNodeId)) {
             newEdges.push({
               id: `e_${node.id}_br_${idx}`,
               source: node.id,
               target: expr.targetNodeId,
               label: expr.name || `分支 ${idx+1}`
             });
          }
        });
      }
    });

    setEdges(newEdges);
    // We trigger onSave here to persist changes immediately
    onSave(nodes, newEdges);
  }, [nodes, onSave]);

  // Handle Fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // --- Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { 
       setIsPanning(true);
       setLastMousePos({ x: e.clientX, y: e.clientY });
       setSelectedNodeId(null);
       setSelectedEdgeId(null);
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    if (!readOnly) {
      setIsDraggingNode(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleBranchHandleMouseDown = (e: React.MouseEvent, nodeId: string, branchIndex: number) => {
    e.stopPropagation();
    e.preventDefault();
    if (readOnly) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setIsDrawingEdge(true);
    setEdgeStartNodeId(nodeId);
    setEdgeStartBranchIndex(branchIndex);
    
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    setEdgeMousePos({ x: (clientX - viewport.x) / zoom, y: (clientY - viewport.y) / zoom });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    if (isPanning) {
      setViewport(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else if (isDraggingNode && selectedNodeId) {
      setNodes(prev => prev.map(n => 
        n.id === selectedNodeId ? { ...n, x: n.x + (deltaX / zoom), y: n.y + (deltaY / zoom) } : n
      ));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else if (isDrawingEdge && edgeStartNodeId !== null) {
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      setEdgeMousePos({ x: (clientX - viewport.x) / zoom, y: (clientY - viewport.y) / zoom });
    }
  };

  const handleMouseUp = (e?: React.MouseEvent) => {
    if (isDrawingEdge && edgeStartNodeId && edgeStartBranchIndex !== null && e) {
      // Check if released over a valid node
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = (e.clientX - rect.left - viewport.x) / zoom;
        const mouseY = (e.clientY - rect.top - viewport.y) / zoom;
        
        // Find if mouse is over any node
        const targetNode = nodes.find(n => 
          mouseX >= n.x && mouseX <= n.x + 180 &&
          mouseY >= n.y && mouseY <= n.y + 60 &&
          n.id !== edgeStartNodeId
        );
        
        if (targetNode) {
          // Establish connection
          const startNode = nodes.find(n => n.id === edgeStartNodeId);
          if (startNode && startNode.subType === 'condition' && startNode.config?.expressions) {
            const newExpressions = [...(startNode.config.expressions || [])];
            if (newExpressions[edgeStartBranchIndex]) {
              newExpressions[edgeStartBranchIndex] = {
                ...newExpressions[edgeStartBranchIndex],
                targetNodeId: targetNode.id
              };
              updateNodeConfig(edgeStartNodeId, { expressions: newExpressions });
            }
          }
        }
      }
    }
    
    setIsPanning(false);
    setIsDraggingNode(false);
    setIsDrawingEdge(false);
    setEdgeStartNodeId(null);
    setEdgeStartBranchIndex(null);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleReset = () => {
    setZoom(1);
    setViewport({ x: 0, y: 0 });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (readOnly) return;
    
    const type = e.dataTransfer.getData('nodeType') as unknown as IntentNodeType;
    const subType = e.dataTransfer.getData('nodeSubType');
    if (!type) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    
    const x = (clientX - viewport.x) / zoom;
    const y = (clientY - viewport.y) / zoom;

    let defaultLabel: string = type;
    for(const g of INTENT_TOOLBOX_GROUPS) {
        const found = g.items.find(i => i.type === type && i.subType === subType);
        if(found) defaultLabel = found.label.split(' (')[0];
    }

    const newNode: IntentNode = {
      id: `node_${Date.now()}`,
      type,
      subType,
      label: defaultLabel,
      x,
      y,
      config: {}
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const deleteSelected = () => {
    if (readOnly) return;
    if (selectedNodeId) {
       if (selectedNodeId === 'start') return; 
       
       // Remove node
       setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
       
       // Also clear references to this node in other nodes' configs
       setNodes(prev => prev.map(n => {
         const newConfig = { ...n.config };
         
         // Clear linear nextNodeId
         if (newConfig.nextNodeId === selectedNodeId) {
           delete newConfig.nextNodeId;
         }
         
         // Clear branch targets
         if (n.subType === 'condition' && newConfig.expressions) {
           newConfig.expressions = newConfig.expressions.map((expr: any) => 
             expr.targetNodeId === selectedNodeId ? { ...expr, targetNodeId: undefined } : expr
           );
         }
         
         return { ...n, config: newConfig };
       }));

       setSelectedNodeId(null);
    }
  };

  const deleteEdge = (sourceNodeId: string, branchIndex: number) => {
    if (readOnly) return;
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    if (sourceNode && sourceNode.subType === 'condition' && sourceNode.config?.expressions) {
      const newExpressions = [...(sourceNode.config.expressions || [])];
      if (newExpressions[branchIndex]) {
        newExpressions[branchIndex] = { ...newExpressions[branchIndex], targetNodeId: undefined };
        updateNodeConfig(sourceNodeId, { expressions: newExpressions });
      }
    }
  };

  const updateNodeConfig = (nodeId: string, updates: any) => {
    setNodes(prev => prev.map(n => 
      n.id === nodeId ? { ...n, config: { ...(n.config || {}), ...updates } } : n
    ));
  };

  const updateEdge = (edgeId: string, updates: Partial<IntentEdge>) => {
    setEdges(prev => prev.map(e => 
      e.id === edgeId ? { ...e, ...updates } : e
    ));
  };

  // --- Debug Execution Logic ---
  
  // Get next node based on current node and variables
  const getNextNodeId = useCallback((nodeId: string): string | null => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    // For condition/branch nodes, evaluate expressions
    if (node.subType === 'condition' && node.config?.expressions) {
      // Find first matching expression
      for (let i = 0; i < node.config.expressions.length; i++) {
        const expr = node.config.expressions[i];
        if (expr.targetNodeId) {
          // In production, you would evaluate expr.logic here
          // For now, just return the first target that exists
          const targetNode = nodes.find(n => n.id === expr.targetNodeId);
          if (targetNode) {
            return expr.targetNodeId;
          }
        }
      }
      // If no match, use else target
      if (node.config.elseTargetId) {
        const elseNode = nodes.find(n => n.id === node.config.elseTargetId);
        if (elseNode) {
          return node.config.elseTargetId;
        }
      }
      return null;
    }

    // For other nodes, use nextNodeId
    if (node.config?.nextNodeId) {
      const nextNode = nodes.find(n => n.id === node.config.nextNodeId);
      if (nextNode) {
        return node.config.nextNodeId;
      }
    }
    
    return null;
  }, [nodes]);

  // Execute a single node
  const executeNode = useCallback(async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const startTime = Date.now();
    const logs: string[] = [];
    
    // Log: Start execution
    logs.push(`[${new Date().toLocaleTimeString()}] 开始执行节点：${node.label} (${node.subType})`);
    
    // Update current node
    setCurrentNodeId(nodeId);

    // Simulate execution delay
    const delay = Math.random() * 500 + 200;
    logs.push(`[${new Date().toLocaleTimeString()}] 执行延迟：${delay.toFixed(0)}ms`);
    await new Promise(r => setTimeout(r, delay / executionSpeed));

    // Simulate execution result (always success for now)
    const success = true;
    const endTime = Date.now();
    logs.push(`[${new Date().toLocaleTimeString()}] 节点执行${success ? '成功' : '失败'}`);

    // Update variables based on node type
    const newVariables = { ...debugVariables };
    if (node.subType === 'set_variable' && node.config?.operations) {
      logs.push(`[${new Date().toLocaleTimeString()}] 设置变量操作`);
      node.config.operations.forEach((op: any) => {
        if (op.variableId && op.value !== undefined) {
          newVariables[op.variableId] = op.value;
          logs.push(`  - ${op.variableId} = ${JSON.stringify(op.value)}`);
        }
      });
    } else if (node.subType === 'condition') {
      logs.push(`[${new Date().toLocaleTimeString()}] 条件分支判断`);
      if (node.config?.expressions) {
        node.config.expressions.forEach((expr: any, idx: number) => {
          if (expr.logic) {
            logs.push(`  - 分支${idx + 1} (${expr.name}): ${expr.logic}`);
          }
        });
      }
    } else if (node.type === 'LISTEN') {
      logs.push(`[${new Date().toLocaleTimeString()}] 监听用户输入`);
      newVariables['lastInput'] = '用户输入内容';
    } else if (node.type === 'ACTION') {
      logs.push(`[${new Date().toLocaleTimeString()}] 执行动作：${node.subType}`);
    }

    logs.push(`[${new Date().toLocaleTimeString()}] 执行完成，耗时：${endTime - startTime}ms`);

    // Add to execution history
    const step: ExecutionStep = {
      id: `step_${Date.now()}`,
      nodeId,
      timestamp: endTime,
      executionInfo: {
        nodeId,
        status: success ? 'success' : 'error',
        input: { ...debugVariables },
        output: newVariables,
        startTime,
        endTime: success ? endTime : undefined,
        duration: endTime - startTime,
        error: success ? undefined : '执行失败',
        attemptCount: 1,
        logs
      },
      variablesSnapshot: newVariables
    };

    setExecutionHistory(prev => [...prev, step]);
    setDebugVariables(newVariables);

    if (!success) {
      setDebugState('paused');
      setCurrentNodeId(null);
      return;
    }

    // Get next node
    const nextNodeId = getNextNodeId(nodeId);
    
    if (nextNodeId && nodes.find(n => n.id === nextNodeId)) {
      // Continue execution if not paused
      if (debugState === 'running') {
        executeNode(nextNodeId);
      }
    } else {
      // End of flow
      setDebugState('completed');
      setCurrentNodeId(null);
    }
  }, [nodes, debugVariables, executionSpeed, debugState, getNextNodeId]);

  // Start debug execution
  const startDebugExecution = useCallback(() => {
    const startNode = nodes.find(n => n.type === 'START' || n.subType === 'start');
    if (startNode) {
      setDebugState('running');
      setExecutionHistory([]);
      setDebugVariables({});
      executeNode(startNode.id);
    } else {
      alert('未找到 START 节点，无法开始执行');
    }
  }, [nodes, executeNode]);

  // Pause debug execution
  const pauseDebugExecution = useCallback(() => {
    setDebugState('paused');
    if (executionTimerRef.current) {
      clearTimeout(executionTimerRef.current);
    }
  }, []);

  // Resume debug execution
  const resumeDebugExecution = useCallback(() => {
    if (currentNodeId) {
      setDebugState('running');
      const nextNodeId = getNextNodeId(currentNodeId);
      if (nextNodeId) {
        executeNode(nextNodeId);
      }
    }
  }, [currentNodeId, getNextNodeId, executeNode]);

  // Stop debug execution
  const stopDebugExecution = useCallback(() => {
    setDebugState('idle');
    setCurrentNodeId(null);
    if (executionTimerRef.current) {
      clearTimeout(executionTimerRef.current);
    }
  }, []);

  // Reset debug execution
  const resetDebugExecution = useCallback(() => {
    setDebugState('idle');
    setCurrentNodeId(null);
    setExecutionHistory([]);
    setDebugVariables({});
  }, []);

  // Step over (execute current node and pause at next)
  const stepOver = useCallback(() => {
    if (debugState !== 'paused' || !currentNodeId) return;
    
    const nextNodeId = getNextNodeId(currentNodeId);
    if (nextNodeId) {
      setDebugState('running');
      executeNode(nextNodeId);
    }
  }, [debugState, currentNodeId, getNextNodeId, executeNode]);

  // Get node execution status
  const getNodeExecutionStatus = useCallback((nodeId: string) => {
    const status = executionHistory.find(h => h.nodeId === nodeId)?.executionInfo?.status;
    const isCurrent = currentNodeId === nodeId;
    return { status, isCurrent };
  }, [executionHistory, currentNodeId]);

  // Toggle step expansion
  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  // Scroll to node
  const scrollToNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      canvas.scrollTo({
        left: node.x - rect.width / 2,
        top: node.y - rect.height / 2,
        behavior: 'smooth'
      });
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Handle user input submission
  const handleUserInputSubmit = () => {
    if (!userInput.trim()) return;
    
    // Add to chat history
    setChatHistory(prev => [...prev, { role: 'user', content: userInput }]);
    
    // Update debug variables with user input
    setDebugVariables(prev => ({
      ...prev,
      'sys.query': userInput,
      'lastUserInput': userInput
    }));
    
    // Clear input
    setUserInput('');
    
    // If debug is not running, start it
    if (debugState === 'idle') {
      startDebugExecution();
    }
  };

  // Handle key press in input
  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserInputSubmit();
    }
  };

  // Keyboard shortcuts for debug mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDebugMode) return;
      
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'F5':
          e.preventDefault();
          if (debugState === 'idle' || debugState === 'completed') {
            startDebugExecution();
          }
          break;
        case 'F6':
          e.preventDefault();
          if (debugState === 'running') {
            pauseDebugExecution();
          } else if (debugState === 'paused') {
            resumeDebugExecution();
          }
          break;
        case 'F10':
          e.preventDefault();
          if (debugState === 'paused') {
            stepOver();
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (debugState === 'running' || debugState === 'paused') {
            stopDebugExecution();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDebugMode, debugState, startDebugExecution, pauseDebugExecution, resumeDebugExecution, stepOver, stopDebugExecution]);

  // --- Helpers for Dropdown Options ---
  // Returns list of nodes that can be connected to (excluding self and start)
  const getConnectableNodes = (currentNodeId: string) => {
    return nodes
      .filter(n => n.id !== currentNodeId)
      .map(n => ({ label: `${n.label} (${n.subType})`, value: n.id }));
  };

  // --- Render Helpers ---
  const getNodeColor = (type: IntentNodeType, subType?: string) => {
    if (subType === 'end_flow') return 'bg-slate-100 border-slate-300 text-slate-700';
    switch(type) {
      case 'START': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'LISTEN': return 'bg-indigo-50 border-indigo-200 text-indigo-700';
      case 'BRANCH': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'AI_AGENT': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'LOGIC': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'ACTION': return 'bg-rose-50 border-rose-200 text-rose-700';
      case 'DATA': return 'bg-purple-50 border-purple-200 text-purple-700';
      default: return 'bg-white border-gray-200';
    }
  };

  // Get node execution style for debug mode
  const getNodeExecutionStyle = (nodeId: string) => {
    if (!isDebugMode) return '';
    
    const { status, isCurrent } = getNodeExecutionStatus(nodeId);
    
    if (isCurrent) {
      return 'ring-4 ring-purple-400 ring-opacity-60 animate-pulse z-20';
    } else if (status === 'success') {
      return 'border-green-400 shadow-green-100';
    } else if (status === 'error') {
      return 'border-red-400 shadow-red-100';
    }
    return '';
  };

  const getNodeIcon = (node: IntentNode) => {
      if (node.type === 'START') return <Play size={14} />;
      
      for(const g of INTENT_TOOLBOX_GROUPS) {
          const item = g.items.find(i => i.type === node.type && i.subType === node.subType);
          if(item) return <item.icon size={14} />;
      }
      return <Activity size={14} />;
  };

  const renderBezierCurve = (startX: number, startY: number, endX: number, endY: number) => {
    const cp1x = startX + 50;
    const cp1y = startY;
    const cp2x = endX - 50;
    const cp2y = endY;
    return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex flex-1 h-full relative overflow-hidden bg-slate-50 border border-slate-200 rounded-lg" ref={containerRef} tabIndex={0} onKeyDown={(e) => {
       if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
    }}>
      
      {/* Toolbox (Left) */}
      {!readOnly && (
        <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 z-20 gap-2 overflow-y-auto">
           {INTENT_TOOLBOX_GROUPS.map((group, gIdx) => (
             <React.Fragment key={gIdx}>
                <div className={`text-[8px] font-bold text-${group.color}-600 mt-2 mb-1 px-1 text-center leading-tight`}>{group.name}</div>
                {group.items.map(item => (
                  <div 
                    key={`${item.type}-${item.subType}`}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-grab hover:bg-${group.color}-50 hover:text-${group.color}-600 transition-colors text-slate-400 border border-transparent hover:border-${group.color}-100`}
                    draggable
                    onDragStart={(e) => {
                        e.dataTransfer.setData('nodeType', item.type);
                        e.dataTransfer.setData('nodeSubType', item.subType);
                    }}
                    onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredTool({ item, rect });
                    }}
                    onMouseLeave={() => setHoveredTool(null)}
                  >
                    <item.icon size={18} />
                  </div>
                ))}
                <div className="w-8 h-px bg-gray-100 my-1"></div>
             </React.Fragment>
           ))}
        </div>
      )}

      {/* Main Canvas Area */}
      <div 
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing bg-slate-50 outline-none"
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
         {/* Debug Mode Toggle Button */}
         {!isDebugMode && !readOnly && (
           <button
             onClick={() => setIsDebugMode(true)}
             className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 rounded-lg text-xs font-medium transition-colors shadow-sm"
             title="进入调试模式"
           >
             <Bug className="w-4 h-4" />
             调试模式
           </button>
         )}
         {/* Transformed Content Layer */}
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
             {/* Grid */}
             <div 
                className="absolute inset-[-200%] pointer-events-none opacity-[0.05]" 
                style={{ 
                  backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', 
                  backgroundSize: '20px 20px',
                }}
             ></div>

             {/* Edges */}
             <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                 <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                    </marker>
                 </defs>
                 {edges.map(edge => {
                    const start = nodes.find(n => n.id === edge.source);
                    const end = nodes.find(n => n.id === edge.target);
                    if (!start || !end) return null;
                    
                    // Calculate startY based on branch index for condition nodes
                     let startY = start.y + 30;
                     if (start.subType === 'condition' && edge.id.includes('_br_')) {
                       const parts = edge.id.split('_br_');
                       if (parts.length === 2) {
                         const branchIndex = parseInt(parts[1]);
                         const totalBranches = start.config?.expressions?.length || 1;
                         const branchSpacing = 22; // Match the gap-1 (4px) + handle height (12px)
                         const totalHeight = (totalBranches - 1) * branchSpacing;
                         // Start from center, distribute evenly
                         startY = start.y + 30 - (totalHeight / 2) + (branchIndex * branchSpacing);
                       }
                     }
                     
                     const startX = start.x + 180; 
                    const endX = end.x;
                    const endY = end.y + 30;
                    
                    const midX = (startX + endX) / 2;
                    const midY = (startY + endY) / 2;

                    return (
                       <g key={edge.id} className="pointer-events-auto">
                          <path 
                            d={renderBezierCurve(startX, startY, endX, endY)} 
                            stroke="#94a3b8" 
                            strokeWidth="2"
                            fill="none" 
                            markerEnd="url(#arrowhead)"
                          />
                          {edge.label && (
                             <foreignObject x={midX - 30} y={midY - 10} width="60" height="20">
                                <div className="text-[8px] text-center rounded px-1 truncate bg-white border border-gray-200 text-slate-500 shadow-sm">
                                   {edge.label}
                                </div>
                             </foreignObject>
                          )}
                          {/* Clickable area for edge editing */}
                          <path 
                            d={renderBezierCurve(startX, startY, endX, endY)} 
                            stroke="transparent" 
                            strokeWidth="10"
                            fill="none"
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEdgeId(edge.id);
                              setSelectedNodeId(null);
                            }}
                          />
                       </g>
                    );
                 })}
                 
                 {/* Drawing edge (while dragging) */}
                  {isDrawingEdge && edgeStartNodeId !== null && edgeStartBranchIndex !== null && (
                    <g>
                      {(() => {
                         const startNode = nodes.find(n => n.id === edgeStartNodeId);
                         if (!startNode) return null;
                         
                         // Calculate startY based on branch index and total branches
                         let startY = startNode.y + 30;
                         const totalBranches = startNode.config?.expressions?.length || 1;
                         const branchSpacing = 22;
                         const totalHeight = (totalBranches - 1) * branchSpacing;
                         startY = startNode.y + 30 - (totalHeight / 2) + (edgeStartBranchIndex * branchSpacing);
                         const startX = startNode.x + 180;
                         const endX = edgeMousePos.x;
                         const endY = edgeMousePos.y;
                         
                         return (
                           <>
                             <path 
                               d={renderBezierCurve(startX, startY, endX, endY)} 
                               stroke="#f97316" 
                               strokeWidth="2"
                               strokeDasharray="5,5"
                               fill="none" 
                               className="animate-pulse"
                             />
                             <circle cx={endX} cy={endY} r="4" fill="#f97316" />
                           </>
                         );
                       })()}
                    </g>
                  )}
             </svg>

             {/* Nodes */}
             {nodes.map(node => (
                <div 
                   key={node.id}
                   className={`absolute w-[180px] h-[60px] rounded-lg border shadow-sm flex items-center px-3 cursor-pointer transition-all select-none ${getNodeColor(node.type, node.subType)} ${selectedNodeId === node.id ? 'ring-2 ring-primary ring-offset-2 z-20' : 'z-10'} ${getNodeExecutionStyle(node.id)}`}
                   style={{ left: node.x, top: node.y }}
                   onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                >
                   <div className="mr-3 p-1.5 bg-white/50 rounded">
                      {getNodeIcon(node)}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{node.label}</div>
                      <div className="text-[9px] opacity-70 truncate uppercase">
                          {node.subType?.replace('_', ' ') || node.type}
                      </div>
                   </div>
                   {node.type !== 'START' && <div className="absolute -left-1 w-2 h-2 bg-slate-300 rounded-full border border-white" />}
                   
                   {/* Output Handles - Multiple for condition nodes */}
                   {node.subType !== 'end_flow' && (
                     <>
                       {node.subType === 'condition' && node.config?.expressions && node.config.expressions.length > 0 ? (
                         // Multiple branch handles for condition nodes
                         <div className="absolute -right-1 top-1/2 -translate-y-1/2 flex flex-col justify-center gap-1">
                           {node.config.expressions.map((_: any, idx: number) => {
                             const totalBranches = node.config.expressions.length;
                             const isConnected = !!node.config.expressions[idx]?.targetNodeId;
                             return (
                               <div
                                 key={idx}
                                 className={`w-3 h-3 rounded-full cursor-crosshair hover:scale-125 transition-all relative group border-2 ${
                                   isConnected 
                                     ? 'bg-green-400 border-green-600 hover:bg-green-500' 
                                     : 'bg-orange-300 border-orange-500 hover:bg-orange-400'
                                 }`}
                                 onMouseDown={(e) => handleBranchHandleMouseDown(e, node.id, idx)}
                                 title={`拖拽连接到目标节点 - ${node.config.expressions[idx]?.name || `分支 ${idx + 1}`}${isConnected ? ' (已连接)' : ' (未连接)'}`}
                               >
                                 {/* Connection status indicator */}
                                 {isConnected && (
                                   <div className="absolute inset-0 flex items-center justify-center">
                                     <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                   </div>
                                 )}
                               </div>
                             );
                           })}
                         </div>
                       ) : (
                         // Single handle for other nodes
                         <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-300 rounded-full border border-white"></div>
                       )}
                     </>
                   )}
                </div>
             ))}
         </div>
      </div>

      {/* Canvas Controls */}
      <div className="absolute left-20 bottom-6 flex space-x-2 z-20">
         <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex items-center p-1">
            <button onClick={handleZoomOut} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" title="缩小"><ZoomOut size={16} /></button>
            <span className="text-[10px] w-10 text-center font-mono text-slate-600">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" title="放大"><ZoomIn size={16} /></button>
            <div className="w-px h-4 bg-gray-200 mx-1"></div>
            <button onClick={handleReset} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" title="复位"><RotateCcw size={14} /></button>
         </div>
         <button onClick={toggleFullscreen} className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 text-slate-500 hover:text-primary hover:bg-slate-50" title="全屏">
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
         </button>
         {(selectedNodeId) && (
            <button onClick={deleteSelected} className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 text-red-500 hover:bg-red-50" title="删除选中">
               <Trash2 size={16} />
            </button>
         )}
      </div>

      {/* Debug Variables Panel */}
      {isDebugMode && showDebugVariables && (
        <div className="absolute right-4 bottom-20 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-gray-200 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700">变量监视器</span>
            <button onClick={() => setShowDebugVariables(false)} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto p-2">
            {Object.keys(debugVariables).length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-4">暂无变量</div>
            ) : (
              <div className="space-y-1">
                {Object.entries(debugVariables).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-xs p-1.5 bg-slate-50 rounded">
                    <span className="font-medium text-slate-600">{key}</span>
                    <span className="text-slate-500 truncate max-w-[120px]">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Debug Sidebar */}
      {isDebugMode && showDebugSidebar && (
        <div className="absolute top-0 right-0 bottom-0 w-96 bg-white border-l border-gray-200 shadow-lg z-30 flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-bold text-slate-700">执行轨迹</span>
            </div>
            <div className="flex items-center gap-2">
              {executionHistory.length > 0 && (
                <button
                  onClick={() => {
                    setExecutionHistory([]);
                    setExpandedSteps(new Set());
                    setSelectedStepId(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors"
                  title="清空历史"
                >
                  <RefreshCw size={14} />
                </button>
              )}
              <button
                onClick={() => setShowDebugSidebar(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors"
                title="关闭侧边栏"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Steps List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* User Input History as First Step */}
            {chatHistory.length > 0 && (
              <div className="mb-3 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-600">用户输入</span>
                </div>
                <div className="space-y-1.5">
                  {chatHistory.map((chat, idx) => (
                    <div key={idx} className="bg-blue-50 border border-blue-100 rounded p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-blue-600">用户</span>
                        <span className="text-[10px] text-slate-400">#{idx + 1}</span>
                      </div>
                      <div className="text-xs text-slate-700">{chat.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {executionHistory.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-8">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div>暂无执行记录</div>
                <div className="mt-1">点击"开始"按钮运行流程</div>
              </div>
            ) : (
              executionHistory.map((step, index) => {
                const node = nodes.find(n => n.id === step.nodeId);
                const isExpanded = expandedSteps.has(step.id);
                const isSelected = selectedStepId === step.id;
                const isCurrent = currentNodeId === step.nodeId;
                const status = step.executionInfo.status;
                
                return (
                  <div
                    key={step.id}
                    className={`border rounded-lg overflow-hidden transition-all ${
                      isSelected ? 'border-purple-300 shadow-md' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Step Header */}
                    <div
                      className={`px-3 py-2.5 flex items-center gap-2 cursor-pointer ${
                        isCurrent ? 'bg-purple-50' : 'bg-white'
                      }`}
                      onClick={() => {
                        setSelectedStepId(step.id);
                        toggleStepExpansion(step.id);
                        scrollToNode(step.nodeId);
                      }}
                    >
                      <button className="text-slate-400 hover:text-slate-600">
                        {isExpanded ? <ChevronDownIcon size={16} /> : <ChevronRight size={16} />}
                      </button>
                      
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        status === 'success' ? 'bg-green-100 text-green-600' :
                        status === 'error' ? 'bg-red-100 text-red-600' :
                        status === 'running' ? 'bg-blue-100 text-blue-600 animate-pulse' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {status === 'success' ? <Check size={12} strokeWidth={3} /> :
                         status === 'error' ? <AlertCircle size={12} strokeWidth={3} /> :
                         status === 'running' ? <Activity size={12} /> :
                         <Circle size={12} />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-700 truncate">
                          {index + 1}. {node?.label || '未知节点'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {step.executionInfo.duration?.toFixed(0)}ms
                        </div>
                      </div>
                      
                      {isCurrent && (
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      )}
                    </div>

                    {/* Step Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-slate-50">
                        {/* Input */}
                        <div className="px-3 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">输入</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(JSON.stringify(step.executionInfo.input, null, 2));
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600"
                              title="复制"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                          <div className="bg-white border border-gray-200 rounded p-2 max-h-32 overflow-y-auto">
                            <pre className="text-[10px] font-mono text-slate-600 whitespace-pre-wrap">
                              {JSON.stringify(step.executionInfo.input, null, 2)}
                            </pre>
                          </div>
                        </div>

                        {/* Output */}
                        <div className="px-3 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">输出</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(JSON.stringify(step.executionInfo.output, null, 2));
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600"
                              title="复制"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                          <div className="bg-white border border-gray-200 rounded p-2 max-h-32 overflow-y-auto">
                            <pre className="text-[10px] font-mono text-slate-600 whitespace-pre-wrap">
                              {JSON.stringify(step.executionInfo.output, null, 2)}
                            </pre>
                          </div>
                        </div>

                        {/* Logs */}
                        {step.executionInfo.logs && step.executionInfo.logs.length > 0 && (
                          <div className="px-3 py-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">日志</span>
                            </div>
                            <div className="bg-white border border-gray-200 rounded p-2 max-h-40 overflow-y-auto">
                              <div className="space-y-0.5">
                                {step.executionInfo.logs.map((log, idx) => (
                                  <div key={idx} className="text-[10px] font-mono text-slate-600">
                                    {log}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Error */}
                        {step.executionInfo.error && (
                          <div className="px-3 py-2">
                            <div className="flex items-center gap-1 mb-1">
                              <AlertCircle size={12} className="text-red-500" />
                              <span className="text-[10px] font-bold text-red-500 uppercase">错误</span>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded p-2">
                              <div className="text-[10px] font-mono text-red-600">
                                {step.executionInfo.error}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Stats */}
          {executionHistory.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-slate-50">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">总计：{executionHistory.length} 步</span>
                  <span className="text-slate-500">
                    成功：{executionHistory.filter(s => s.executionInfo.status === 'success').length}
                  </span>
                  <span className="text-slate-500">
                    失败：{executionHistory.filter(s => s.executionInfo.status === 'error').length}
                  </span>
                </div>
                <div className="text-slate-400">
                  总耗时：{executionHistory.reduce((sum, s) => sum + (s.executionInfo.duration || 0), 0).toFixed(0)}ms
                </div>
              </div>
            </div>
          )}

          {/* User Input Area - Fixed at Bottom */}
          <div className="border-t border-gray-200 p-3 bg-white">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleInputKeyPress}
              placeholder="输入用户说的话，按 Enter 发送..."
              className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm resize-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none"
              rows={2}
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleUserInputSubmit}
                disabled={!userInput.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors text-xs font-medium"
              >
                <CornerDownRight size={14} />
                发送
              </button>
            </div>
            
            {/* Chat History Mini Preview */}
            {chatHistory.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageSquare size={10} className="text-slate-400" />
                  <span className="text-[9px] text-slate-500">对话历史 ({chatHistory.length})</span>
                </div>
                <div className="max-h-16 overflow-y-auto space-y-1">
                  {chatHistory.slice(-2).map((chat, idx) => (
                    <div key={idx} className="text-[9px] flex items-start gap-1">
                      <span className={`font-bold ${chat.role === 'user' ? 'text-blue-600' : 'text-green-600'}`}>
                        {chat.role === 'user' ? '用户' : '机器人'}:
                      </span>
                      <span className="text-slate-600 truncate">{chat.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Edge Transition Editor (Drawer) --- */}
      {selectedEdgeId && !readOnly && (
        (() => {
          const edge = edges.find(e => e.id === selectedEdgeId);
          const sourceNode = edge ? nodes.find(n => n.id === edge.source) : null;
          const targetNode = edge ? nodes.find(n => n.id === edge.target) : null;
          return edge && sourceNode && targetNode ? (
            <EdgeTransitionEditor
              edge={edge}
              sourceNode={sourceNode}
              targetNode={targetNode}
              onClose={() => setSelectedEdgeId(null)}
            />
          ) : null;
        })()
      )}

      {/* --- Property Panel (Drawer) --- */}
      {selectedNode && !readOnly && (
         <div className="absolute top-0 right-0 bottom-0 w-[420px] bg-white shadow-2xl border-l border-gray-200 z-40 flex flex-col animate-in slide-in-from-right-10 duration-200">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-sm">
               <div>
                  <div className="text-sm font-bold text-slate-800 flex items-center">
                     {getNodeIcon(selectedNode)}
                     <span className="ml-2">{selectedNode.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{selectedNode.type} / {selectedNode.subType}</div>
               </div>
               <button onClick={() => setSelectedNodeId(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors">
                  <X size={18} />
               </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-4">
               <button 
                  onClick={() => setActiveTab('CONFIG')}
                  className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${activeTab === 'CONFIG' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
               >
                  核心配置
               </button>
               <button 
                  onClick={() => setActiveTab('ADVANCED')}
                  className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${activeTab === 'ADVANCED' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
               >
                  高级设置
               </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
               
               {/* --- Common Fields --- */}
               <div>
                  <Label label="节点名称" />
                  <input 
                     className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:border-primary outline-none"
                     value={selectedNode.label} 
                     onChange={(e) => setNodes(nodes.map(n => n.id === selectedNode.id ? {...n, label: e.target.value} : n))}
                  />
               </div>

               {/* --- CONFIG TAB CONTENT --- */}
               {activeTab === 'CONFIG' && (
                  <>
                     <InteractionConfig
                        node={selectedNode}
                        onChange={(updates) => updateNodeConfig(selectedNode.id, updates)}
                        availableNodes={getConnectableNodes(selectedNode.id)}
                     />
                     <CognitiveConfig
                        node={selectedNode}
                        onChange={(updates) => updateNodeConfig(selectedNode.id, updates)}
                        availableNodes={getConnectableNodes(selectedNode.id)}
                        availableTools={availableTools}
                        availableFunctions={availableFunctions}
                     />
                     {/* Pass available nodes to LogicConfig for branch targeting */}
                     <LogicConfig 
                        node={selectedNode} 
                        onChange={(updates) => updateNodeConfig(selectedNode.id, updates)} 
                        availableNodes={getConnectableNodes(selectedNode.id)}
                        labelGroups={labelGroups}
                     />
                     <DataConfig
                        node={selectedNode}
                        onChange={(updates) => updateNodeConfig(selectedNode.id, updates)}
                        extractionConfigs={extractionConfigs}
                        availableNodes={getConnectableNodes(selectedNode.id)}
                     />
                     
                     {/* Standard Next Step Selector (For Non-Branch/Non-End Nodes) */}
                     {selectedNode.type !== 'BRANCH' && selectedNode.subType !== 'condition' && selectedNode.subType !== 'end_flow' && (
                        <div className="pt-4 border-t border-gray-100 mt-4">
                           <Label label="下一步 (Next Step)" tooltip="当前节点执行完成后，流转到的下一个节点。" />
                           <Select 
                              label=""
                              options={[{label: '无 (结束或断开)', value: ''}, ...getConnectableNodes(selectedNode.id)]}
                              value={selectedNode.config?.nextNodeId || ''}
                              onChange={(e) => updateNodeConfig(selectedNode.id, { nextNodeId: e.target.value })}
                           />
                        </div>
                     )}
                  </>
               )}

               {/* --- ADVANCED TAB CONTENT --- */}
               {activeTab === 'ADVANCED' && (
                  <div className="space-y-6">
                     <div>
                        <Label label="前置动作 (Pre-Actions)" tooltip="进入节点前执行的快速操作，如清空变量。" />
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded text-xs text-slate-400 text-center">
                           暂未添加前置动作
                        </div>
                        <button className="mt-2 w-full py-1.5 border border-slate-200 rounded text-xs text-slate-500 hover:bg-slate-50">
                           + 添加动作
                        </button>
                     </div>

                     <div>
                        <Label label="执行超时 (ms)" />
                        <Input 
                           type="number"
                           value={selectedNode.config?.nextTimeoutMs || 0}
                           onChange={(e) => updateNodeConfig(selectedNode.id, { nextTimeoutMs: parseInt(e.target.value) })}
                           placeholder="0 (无限制)"
                        />
                     </div>

                     {selectedNode.type === 'LISTEN' && (
                        <div className="border-t border-gray-100 pt-4">
                           <h4 className="text-xs font-bold text-slate-800 mb-3">重试策略 (Retry)</h4>
                           <Input 
                              label="最大重试次数"
                              type="number"
                              value={selectedNode.config?.retryStrategy?.maxAttempts || 3}
                              onChange={(e) => updateNodeConfig(selectedNode.id, { retryStrategy: { ...selectedNode.config?.retryStrategy, maxAttempts: parseInt(e.target.value) } })}
                           />
                           <div className="mt-3">
                              <Label label="无输入提示音 (No Input)" />
                              <StringList 
                                 items={selectedNode.config?.retryStrategy?.noInputPrompts || []}
                                 onChange={(items) => updateNodeConfig(selectedNode.id, { retryStrategy: { ...selectedNode.config?.retryStrategy, noInputPrompts: items } })}
                                 placeholder="您还在吗？"
                              />
                           </div>
                           <div className="mt-3">
                              <Label label="拒识提示音 (No Match)" />
                              <StringList 
                                 items={selectedNode.config?.retryStrategy?.noMatchPrompts || []}
                                 onChange={(items) => updateNodeConfig(selectedNode.id, { retryStrategy: { ...selectedNode.config?.retryStrategy, noMatchPrompts: items } })}
                                 placeholder="抱歉我没听清..."
                              />
                           </div>
                        </div>
                     )}

                     {selectedNode.subType === 'play_tts' && (
                        <div className="border-t border-gray-100 pt-4 space-y-4">
                           <div className="flex items-center justify-between">
                              <Label label="允许打断 (Barge-in)" />
                              <Switch 
                                 label=""
                                 checked={selectedNode.config?.bargeIn ?? true}
                                 onChange={(v) => updateNodeConfig(selectedNode.id, { bargeIn: v })}
                              />
                           </div>
                           <div className="px-1">
                              <Slider 
                                 label="打断阈值 (Confidence)"
                                 min={0} max={1} step={0.1}
                                 value={selectedNode.config?.bargeInThreshold ?? 0.8}
                                 onChange={(v) => updateNodeConfig(selectedNode.id, { bargeInThreshold: v })}
                              />
                           </div>
                        </div>
                     )}
                  </div>
               )}

            </div>
         </div>
      )}
      
      {/* Tooltip Portal */}
      {hoveredTool && (
        <div 
           className="fixed z-[100] w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl pointer-events-none"
           style={{
             left: hoveredTool.rect.right + 10,
             top: hoveredTool.rect.top
           }}
        >
          <div className="font-bold mb-1 border-b border-slate-600 pb-1 flex items-center">
             <hoveredTool.item.icon size={10} className="mr-1" />
             {hoveredTool.item.label}
          </div>
          <div className="leading-tight text-slate-300">
             {hoveredTool.item.tip}
          </div>
        </div>
      )}
    </div>
  );
}
