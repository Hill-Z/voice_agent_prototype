import React, { useEffect, useMemo, useState } from 'react';
import { Settings, X, FileText, Bug, ArrowRightLeft, PanelRightOpen } from 'lucide-react';
import {
  AgentTool,
  BotVariable,
  FlowAnnotation,
  FlowConfig,
  FlowDefinition,
  FlowEdge,
  FlowFunction,
  FlowNode,
  FlowNodeType,
} from '../../types';
import FlowCanvas from './FlowCanvas';
import FlowDebugPanel from './FlowDebugPanel';
import FlowEdgeConfig from './FlowEdgeConfig';
import FlowListPanel from './FlowListPanel';
import FlowPrdPanel from './FlowPrdPanel';
import FlowTopToolbar from './FlowTopToolbar';
import FlowWorkbenchNodeConfig from './FlowWorkbenchNodeConfig';

interface FlowWorkbenchProps {
  initialFlow: FlowConfig;
  onSave?: (flow: FlowConfig) => void;
  readOnly?: boolean;
  availableFunctions?: FlowFunction[];
  availableVariables?: BotVariable[];
  availableTools?: AgentTool[];
}

type RightPanelMode = 'node' | 'edge' | 'annotation' | 'debug';

function cloneFlowConfig(flow: FlowConfig): FlowConfig {
  return JSON.parse(JSON.stringify(flow)) as FlowConfig;
}

function createSubFlow(index: number): FlowDefinition {
  return {
    id: `sub_flow_${Date.now()}_${index}`,
    name: `新子 Flow ${index}`,
    nodes: [
      {
        id: `sub_start_${Date.now()}_${index}`,
        type: FlowNodeType.START,
        position: { x: 80, y: 220 },
        data: {
          name: '开始',
          description: '新子 Flow 的起点。',
          stepType: 'default',
          stepPrompt: {
            prompt: '',
            visibleFunctionIds: [],
            transitionFunctionIds: [],
          },
        },
      },
    ],
    edges: [],
  };
}

export default function FlowWorkbench({
  initialFlow,
  onSave,
  readOnly = false,
  availableFunctions = [],
  availableVariables = [],
  availableTools = [],
}: FlowWorkbenchProps) {
  const [draftFlow, setDraftFlow] = useState<FlowConfig>(() => cloneFlowConfig(initialFlow));
  const [activeFlowId, setActiveFlowId] = useState(initialFlow.entryFlowId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>('node');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [viewport, setViewport] = useState({ x: 0, y: 0 });
  const [debugState, setDebugState] = useState<Record<string, any>>({});
  const [debugHistory, setDebugHistory] = useState<string[]>([]);
  const [debugCurrentNodeName, setDebugCurrentNodeName] = useState<string | null>(null);

  useEffect(() => {
    setDraftFlow(cloneFlowConfig(initialFlow));
    setActiveFlowId(initialFlow.entryFlowId);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setSelectedAnnotationId(null);
  }, [initialFlow]);

  useEffect(() => {
    if (!isFullscreen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const activeFlow = useMemo(() => {
    return draftFlow.flows.find((flow) => flow.id === activeFlowId) || draftFlow.flows[0];
  }, [draftFlow.flows, activeFlowId]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return activeFlow?.nodes.find((node) => node.id === selectedNodeId) || null;
  }, [activeFlow, selectedNodeId]);

  const selectedAnnotation = useMemo<FlowAnnotation | null>(() => {
    if (!selectedAnnotationId) return null;
    return draftFlow.annotations.find((annotation) => annotation.id === selectedAnnotationId) || null;
  }, [draftFlow.annotations, selectedAnnotationId]);

  const selectedEdge = useMemo<FlowEdge | null>(() => {
    if (!selectedEdgeId) return null;
    return activeFlow?.edges.find((edge) => edge.id === selectedEdgeId) || null;
  }, [activeFlow, selectedEdgeId]);

  const selectedEdgeSource = useMemo(() => {
    if (!selectedEdge) return null;
    return activeFlow?.nodes.find((node) => node.id === selectedEdge.source) || null;
  }, [activeFlow, selectedEdge]);

  const selectedEdgeTarget = useMemo(() => {
    if (!selectedEdge) return null;
    return activeFlow?.nodes.find((node) => node.id === selectedEdge.target) || null;
  }, [activeFlow, selectedEdge]);

  const updateDraftFlow = (updater: (flow: FlowConfig) => FlowConfig) => {
    setDraftFlow((currentFlow) => updater(currentFlow));
  };

  const updateActiveFlow = (updater: (flow: FlowDefinition) => FlowDefinition) => {
    updateDraftFlow((currentFlow) => ({
      ...currentFlow,
      flows: currentFlow.flows.map((flow) => (flow.id === activeFlowId ? updater(flow) : flow)),
      metadata: {
        ...currentFlow.metadata,
        updatedAt: Date.now(),
      },
    }));
  };

  const handleNodeChange = (updatedNode: FlowNode) => {
    updateActiveFlow((flow) => ({
      ...flow,
      nodes: flow.nodes.map((node) => (node.id === updatedNode.id ? updatedNode : node)),
    }));
  };

  const handleEdgeChange = (updatedEdge: FlowEdge) => {
    updateActiveFlow((flow) => ({
      ...flow,
      edges: flow.edges.map((edge) => (edge.id === updatedEdge.id ? updatedEdge : edge)),
    }));
  };

  const handleSave = () => {
    onSave?.({
      ...draftFlow,
      metadata: {
        ...draftFlow.metadata,
        updatedAt: Date.now(),
      },
    });
  };

  const handleAddFlow = () => {
    const nextIndex = draftFlow.flows.length + 1;
    const newFlow = createSubFlow(nextIndex);
    updateDraftFlow((currentFlow) => ({
      ...currentFlow,
      flows: [...currentFlow.flows, newFlow],
      metadata: {
        ...currentFlow.metadata,
        updatedAt: Date.now(),
      },
    }));
    setActiveFlowId(newFlow.id);
    setSelectedNodeId(newFlow.nodes[0]?.id || null);
    setRightPanelMode('node');
  };

  const handleSelectAnnotation = (annotationId: string) => {
    setSelectedAnnotationId(annotationId);
    setIsSidebarCollapsed(false);
    setRightPanelMode('annotation');
  };

  const handleRunDebug = () => {
    const scenario = draftFlow.debugScenarios[0];
    const phoneNode = draftFlow.flows.flatMap((flow) => flow.nodes).find((node) => node.id === 'collect_phone');
    const verifyNode = draftFlow.flows.flatMap((flow) => flow.nodes).find((node) => node.id === 'verify_result');
    const handoffNode = draftFlow.flows.flatMap((flow) => flow.nodes).find((node) => node.id === 'handoff_exit');

    setDebugState({
      ...(scenario?.initialState || {}),
      phone_number: '13800138000',
      last_flow: 'verification',
      retryCount: 3,
      isVerified: false,
    });
    setDebugCurrentNodeName(handoffNode?.data.name || verifyNode?.data.name || phoneNode?.data.name || null);
    setDebugHistory([
      '进入主入口 Flow',
      `执行节点：${phoneNode?.data.name || '收集手机号'}`,
      '根据 transition function 跳转到身份验证子 Flow',
      `执行节点：${verifyNode?.data.name || '验证结果判断'}`,
      '验证失败，命中 fallback 分支',
      `退出到 ${handoffNode?.data.name || '转人工'}，结束机器人流程`,
    ]);
    setIsSidebarCollapsed(false);
    setRightPanelMode('debug');
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <FlowTopToolbar
        annotationMode={annotationMode}
        zoom={zoom}
        annotations={draftFlow.annotations}
        onToggleAnnotationMode={() => setAnnotationMode((current) => !current)}
        onSave={handleSave}
        onRunDebug={handleRunDebug}
        onZoomIn={() => setZoom((current) => Math.min(current + 0.1, 1.8))}
        onZoomOut={() => setZoom((current) => Math.max(current - 0.1, 0.6))}
        onResetView={() => {
          setZoom(1);
          setViewport({ x: 0, y: 0 });
        }}
        onAnnotationSelect={handleSelectAnnotation}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <FlowListPanel
          flows={draftFlow.flows}
          activeFlowId={activeFlow.id}
          annotationMode={annotationMode}
          annotations={draftFlow.annotations}
          onSelect={(flowId) => {
            setActiveFlowId(flowId);
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
            setRightPanelMode('node');
          }}
          onAddFlow={handleAddFlow}
          onAnnotationSelect={handleSelectAnnotation}
        />

        <FlowCanvas
          flow={activeFlow}
          annotationMode={annotationMode}
          annotations={draftFlow.annotations}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          readOnly={readOnly}
          zoom={zoom}
          viewport={viewport}
          onSelectNode={(nodeId) => {
            setSelectedNodeId(nodeId);
            if (nodeId) setRightPanelMode('node');
          }}
          onSelectEdge={setSelectedEdgeId}
          onChangeFlow={updateActiveFlow}
          onZoomChange={setZoom}
          onViewportChange={setViewport}
          onAnnotationSelect={handleSelectAnnotation}
        />

        <aside className="flex w-[420px] shrink-0 flex-col border-l border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRightPanelMode('node')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  rightPanelMode === 'node' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  <Settings size={13} />
                  节点配置
                </span>
              </button>
              <button
                onClick={() => setRightPanelMode('annotation')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  rightPanelMode === 'annotation' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  <FileText size={13} />
                  PRD 说明
                </span>
              </button>
              <button
                onClick={() => setRightPanelMode('debug')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  rightPanelMode === 'debug' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  <Bug size={13} />
                  调试详情
                </span>
              </button>
            </div>
            <button
              onClick={() => {
                setSelectedNodeId(null);
                setSelectedAnnotationId(null);
              }}
              className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {rightPanelMode === 'annotation' ? (
              <FlowAnnotationPanel annotation={selectedAnnotation} />
            ) : null}

            {rightPanelMode === 'debug' ? (
              <FlowDebugPanel
                scenario={draftFlow.debugScenarios[0]}
                currentNodeName={debugCurrentNodeName}
                state={debugState}
                history={debugHistory}
              />
            ) : null}

            {rightPanelMode === 'node' ? (
              selectedNode ? (
                <FlowWorkbenchNodeConfig
                  node={selectedNode}
                  availableFunctions={availableFunctions}
                  availableVariables={availableVariables}
                  availableTools={availableTools}
                  onChange={handleNodeChange}
                  onClose={() => setSelectedNodeId(null)}
                  readOnly={readOnly}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-400">
                  <Settings size={40} className="mb-3 text-slate-200" />
                  <div className="text-sm font-medium text-slate-500">选择一个节点</div>
                  <div className="mt-1 text-xs leading-6 text-slate-400">
                    点击画布上的节点后，这里会展示 step prompt、函数、实体采集和重试策略。
                  </div>
                </div>
              )
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
