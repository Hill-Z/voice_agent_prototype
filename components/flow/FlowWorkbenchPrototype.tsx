import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, Bug, FileText, PanelRightOpen, Settings, X } from 'lucide-react';
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

interface FlowWorkbenchPrototypeProps {
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
    name: `New Sub Flow ${index}`,
    nodes: [
      {
        id: `sub_start_${Date.now()}_${index}`,
        type: FlowNodeType.START,
        position: { x: 80, y: 220 },
        data: {
          name: 'Start',
          description: 'New sub flow entry.',
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

export default function FlowWorkbenchPrototype({
  initialFlow,
  onSave,
  readOnly = false,
  availableFunctions = [],
  availableVariables = [],
  availableTools = [],
}: FlowWorkbenchPrototypeProps) {
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
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen]);

  const activeFlow = useMemo(
    () => draftFlow.flows.find((flow) => flow.id === activeFlowId) || draftFlow.flows[0],
    [draftFlow.flows, activeFlowId],
  );

  const selectedNode = useMemo(
    () => activeFlow?.nodes.find((node) => node.id === selectedNodeId) || null,
    [activeFlow, selectedNodeId],
  );

  const selectedEdge = useMemo(
    () => activeFlow?.edges.find((edge) => edge.id === selectedEdgeId) || null,
    [activeFlow, selectedEdgeId],
  );

  const selectedEdgeSource = useMemo(
    () => activeFlow?.nodes.find((node) => node.id === selectedEdge?.source) || null,
    [activeFlow, selectedEdge],
  );

  const selectedEdgeTarget = useMemo(
    () => activeFlow?.nodes.find((node) => node.id === selectedEdge?.target) || null,
    [activeFlow, selectedEdge],
  );

  const selectedAnnotation = useMemo<FlowAnnotation | null>(
    () => draftFlow.annotations.find((annotation) => annotation.id === selectedAnnotationId) || null,
    [draftFlow.annotations, selectedAnnotationId],
  );

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

  const handleAddFlow = () => {
    const newFlow = createSubFlow(draftFlow.flows.length + 1);
    updateDraftFlow((currentFlow) => ({
      ...currentFlow,
      flows: [...currentFlow.flows, newFlow],
      metadata: { ...currentFlow.metadata, updatedAt: Date.now() },
    }));
    setActiveFlowId(newFlow.id);
    setSelectedNodeId(newFlow.nodes[0]?.id || null);
    setSelectedEdgeId(null);
    setRightPanelMode('node');
    setIsSidebarCollapsed(false);
  };

  const handleSave = () => {
    onSave?.({
      ...draftFlow,
      metadata: { ...draftFlow.metadata, updatedAt: Date.now() },
    });
  };

  const handleSelectAnnotation = (annotationId: string) => {
    setSelectedAnnotationId(annotationId);
    setRightPanelMode('annotation');
    setIsSidebarCollapsed(false);
  };

  const handleRunDebug = () => {
    const scenario = draftFlow.debugScenarios[0];
    const handoffNode = draftFlow.flows.flatMap((flow) => flow.nodes).find((node) => node.id === 'handoff_exit');
    setDebugState({
      ...(scenario?.initialState || {}),
      phone_number: '13800138000',
      retryCount: 3,
      isVerified: false,
      last_flow: 'verification',
    });
    setDebugCurrentNodeName(handoffNode?.data.name || null);
    setDebugHistory([
      'Enter main flow',
      'Collect phone number and store phone_number',
      'Jump into verification sub flow',
      'Collect verification code and trigger retry logic',
      'Hit fallback branch after retry exhaustion',
      'Exit current flow and hand off to human support',
    ]);
    setRightPanelMode('debug');
    setIsSidebarCollapsed(false);
  };

  return (
    <div
      className={`flex flex-col overflow-hidden bg-white shadow-sm ${
        isFullscreen
          ? 'fixed inset-4 z-[70] rounded-2xl border border-slate-300'
          : 'h-full rounded-2xl border border-slate-200'
      }`}
    >
      <FlowTopToolbar
        annotationMode={annotationMode}
        isFullscreen={isFullscreen}
        isSidebarCollapsed={isSidebarCollapsed}
        zoom={zoom}
        annotations={draftFlow.annotations}
        onToggleAnnotationMode={() => setAnnotationMode((current) => !current)}
        onToggleFullscreen={() => setIsFullscreen((current) => !current)}
        onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
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

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <FlowListPanel
          flows={draftFlow.flows}
          activeFlowId={activeFlow.id}
          annotationMode={annotationMode}
          annotations={draftFlow.annotations}
          onSelect={(flowId) => {
            setActiveFlowId(flowId);
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
            setSelectedAnnotationId(null);
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
            setSelectedEdgeId(null);
            if (nodeId) {
              setRightPanelMode('node');
              setIsSidebarCollapsed(false);
            }
          }}
          onSelectEdge={(edgeId) => {
            setSelectedNodeId(null);
            setSelectedEdgeId(edgeId);
            if (edgeId) {
              setRightPanelMode('edge');
              setIsSidebarCollapsed(false);
            }
          }}
          onChangeFlow={updateActiveFlow}
          onZoomChange={setZoom}
          onViewportChange={setViewport}
          onAnnotationSelect={handleSelectAnnotation}
        />

        {isSidebarCollapsed ? (
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            className="absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <PanelRightOpen size={14} />
            打开右栏
          </button>
        ) : null}

        <aside className={`${isSidebarCollapsed ? 'hidden' : 'flex'} w-[420px] shrink-0 flex-col border-l border-gray-200 bg-white`}>
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
                onClick={() => setRightPanelMode('edge')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  rightPanelMode === 'edge' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  <ArrowRightLeft size={13} />
                  边条件
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
                  PRD说明
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
                setSelectedEdgeId(null);
                setSelectedAnnotationId(null);
                setIsSidebarCollapsed(true);
              }}
              className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {rightPanelMode === 'annotation' ? (
              <FlowPrdPanel
                annotation={selectedAnnotation}
                annotations={draftFlow.annotations}
                onSelect={handleSelectAnnotation}
              />
            ) : null}

            {rightPanelMode === 'debug' ? (
              <FlowDebugPanel
                scenario={draftFlow.debugScenarios[0]}
                currentNodeName={debugCurrentNodeName}
                state={debugState}
                history={debugHistory}
              />
            ) : null}

            {rightPanelMode === 'edge' ? (
              <FlowEdgeConfig
                edge={selectedEdge}
                sourceNode={selectedEdgeSource}
                targetNode={selectedEdgeTarget}
                onChange={handleEdgeChange}
                onClose={() => setSelectedEdgeId(null)}
                readOnly={readOnly}
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
                    点击画布中的节点后，这里会显示 step prompt、函数、实体采集和重试策略。
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
