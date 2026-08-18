import React, { useEffect, useMemo, useState } from 'react';
import {
  AgentTool,
  BotVariable,
  DelayProfile,
  FlowConfig,
  FlowDefinition,
  FlowEdge,
  FlowFunction,
  FlowNode,
  FlowNodeType,
} from '../../types';
import FlowCanvas from './FlowCanvas';
import FlowConfigPanel from './FlowConfigPanel';
import FlowDebugPanel from './FlowDebugPanel';
import FlowEdgeConfig from './FlowEdgeConfig';
import FlowNodeConfig from './FlowNodeConfig';
import FlowStudioToolbar from './FlowStudioToolbar';
import FlowVersionManager from './FlowVersionManager';
import { simulateFlowScenario } from './flowDebugSimulation';

interface FlowStudioProps {
  initialFlow: FlowConfig;
  onSave?: (flow: FlowConfig) => void;
  readOnly?: boolean;
  initialActiveFlowId?: string;
  availableFunctions?: FlowFunction[];
  availableVariables?: BotVariable[];
  availableTools?: AgentTool[];
  availableDelayProfiles?: DelayProfile[];
}

type DrawerMode = 'flow' | 'node' | 'edge' | 'debug' | 'version' | null;

function cloneFlowConfig(flow: FlowConfig): FlowConfig {
  const cloned = JSON.parse(JSON.stringify(flow)) as FlowConfig;
  return {
    ...cloned,
    functions: cloned.functions || [],
    flows: cloned.flows || [],
    annotations: cloned.annotations || [],
    debugScenarios: cloned.debugScenarios || [],
    versions: cloned.versions || [],
  };
}

function createSubFlow(index: number): FlowDefinition {
  const stamp = Date.now();
  return {
    id: `flow_${stamp}_${index}`,
    name: `新建 Flow ${index}`,
    metadata: {
      description: '补充这个 Flow 的职责、输入和出口。',
    },
    nodes: [
      {
        id: `start_${stamp}_${index}`,
        type: FlowNodeType.START,
        position: { x: 80, y: 220 },
        data: {
          name: '开始',
          description: 'Flow 入口节点。',
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

function reorderFlows(flows: FlowDefinition[], draggedFlowId: string, targetFlowId: string) {
  const draggedIndex = flows.findIndex((flow) => flow.id === draggedFlowId);
  const targetIndex = flows.findIndex((flow) => flow.id === targetFlowId);
  if (draggedIndex === -1 || targetIndex === -1) return flows;
  const next = [...flows];
  const [dragged] = next.splice(draggedIndex, 1);
  next.splice(targetIndex, 0, dragged);
  return next;
}

function validateFlowConfig(flowConfig: FlowConfig): string[] {
  const issues: string[] = [];

  if (!flowConfig.flows.length) {
    issues.push('至少需要一个 Flow。');
    return issues;
  }

  flowConfig.flows.forEach((flow) => {
    const startNodes = flow.nodes.filter((node) => node.type === FlowNodeType.START);
    const exitNodes = flow.nodes.filter((node) => node.type === FlowNodeType.EXIT);

    if (startNodes.length !== 1) {
      issues.push(`Flow「${flow.name}」必须且只能有一个开始节点。`);
    }

    if (exitNodes.length < 1) {
      issues.push(`Flow「${flow.name}」至少需要一个退出节点。`);
    }

    if (!flow.nodes.length) {
      issues.push(`Flow「${flow.name}」不能为空。`);
    }
  });

  return issues;
}

export default function FlowStudio({
  initialFlow,
  onSave,
  readOnly = false,
  initialActiveFlowId,
  availableFunctions = [],
  availableVariables = [],
  availableTools = [],
  availableDelayProfiles = [],
}: FlowStudioProps) {
  const [draftFlow, setDraftFlow] = useState<FlowConfig>(() => cloneFlowConfig(initialFlow));
  const [activeFlowId, setActiveFlowId] = useState(initialActiveFlowId || initialFlow.entryFlowId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeSnapshot, setSelectedNodeSnapshot] = useState<FlowNode | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [viewport, setViewport] = useState({ x: 0, y: 0 });
  const [debugState, setDebugState] = useState<Record<string, any>>({});
  const [debugHistory, setDebugHistory] = useState<string[]>([]);
  const [debugCurrentNodeName, setDebugCurrentNodeName] = useState<string | null>(null);
  const [selectedDebugScenarioId, setSelectedDebugScenarioId] = useState<string | null>(
    initialFlow.debugScenarios?.[0]?.id || null,
  );

  useEffect(() => {
    setDraftFlow(cloneFlowConfig(initialFlow));
    setActiveFlowId(initialActiveFlowId || initialFlow.entryFlowId);
    setSelectedNodeId(null);
    setSelectedNodeSnapshot(null);
    setSelectedEdgeId(null);
    setDrawerMode(null);
    setIsDebugOpen(false);
    setSelectedDebugScenarioId(initialFlow.debugScenarios?.[0]?.id || null);
  }, [initialFlow, initialActiveFlowId]);

  useEffect(() => {
    if (!isFullscreen && !isDebugOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFullscreen(false);
      if (event.key === 'Escape') setIsDebugOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isDebugOpen, isFullscreen]);

  const activeFlow = useMemo(
    () => draftFlow.flows.find((flow) => flow.id === activeFlowId) || draftFlow.flows[0] || null,
    [draftFlow.flows, activeFlowId],
  );

  const selectedNode = useMemo(
    () => activeFlow?.nodes.find((node) => node.id === selectedNodeId) || null,
    [activeFlow, selectedNodeId],
  );

  const resolvedSelectedNode = selectedNode || selectedNodeSnapshot;

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

  const updateDraftFlow = (updater: (flow: FlowConfig) => FlowConfig) => {
    setDraftFlow((currentFlow) => updater(currentFlow));
  };

  const updateActiveFlow = (updater: (flow: FlowDefinition) => FlowDefinition) => {
    if (!activeFlow) return;
    updateDraftFlow((currentFlow) => ({
      ...currentFlow,
      flows: currentFlow.flows.map((flow) => (flow.id === activeFlow.id ? updater(flow) : flow)),
      metadata: {
        ...currentFlow.metadata,
        updatedAt: Date.now(),
      },
    }));
  };

  const handleSave = () => {
    const nextFlow = {
      ...draftFlow,
      metadata: {
        ...draftFlow.metadata,
        updatedAt: Date.now(),
      },
    };
    const issues = validateFlowConfig(nextFlow);
    if (issues.length > 0) {
      window.alert(`Flow 校验未通过：\n\n${issues.join('\n')}`);
      return;
    }

    onSave?.({
      ...nextFlow,
    });
  };

  const closeDrawer = () => {
    if (drawerMode === 'node') {
      setSelectedNodeId(null);
      setSelectedNodeSnapshot(null);
    }
    if (drawerMode === 'edge') setSelectedEdgeId(null);
    setDrawerMode(null);
  };

  const openVersionManager = () => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setDrawerMode('version');
  };

  const handleCreateVersion = (version: string, description: string) => {
    const newVersion = {
      id: `version_${Date.now()}`,
      flowId: activeFlow.id,
      version,
      flowData: JSON.parse(JSON.stringify(activeFlow)),
      createdAt: Date.now(),
      createdBy: '当前用户',
      description,
      isPublished: false,
    };
    updateDraftFlow((currentFlow) => ({
      ...currentFlow,
      versions: [...(currentFlow.versions || []), newVersion],
    }));
  };

  const handleRollbackVersion = (version: any) => {
    if (!confirm(`确定回滚到版本 ${version.version} 吗？`)) return;
    updateActiveFlow(() => JSON.parse(JSON.stringify(version.flowData)));
    handleCreateVersion(`${version.version}-rollback`, `回滚到 ${version.version}`);
  };

  const closeDebug = () => {
    setIsDebugOpen(false);
  };

  const openFlowSettings = (flowId?: string) => {
    if (flowId) setActiveFlowId(flowId);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setDrawerMode('flow');
  };

  const handleCreateDebugScenario = () => {
    const scenarioId = `scenario_${Date.now()}`;
    const nextScenario = {
      id: scenarioId,
      name: `新建场景 ${draftFlow.debugScenarios.length + 1}`,
      initialState: {},
      mockInputs: [],
    };

    updateDraftFlow((currentFlow) => ({
      ...currentFlow,
      debugScenarios: [...currentFlow.debugScenarios, nextScenario],
      metadata: {
        ...currentFlow.metadata,
        updatedAt: Date.now(),
      },
    }));
    setSelectedDebugScenarioId(scenarioId);
    setIsDebugOpen(true);
  };

  const handleDeleteDebugScenario = (scenarioId: string) => {
    const nextScenarios = draftFlow.debugScenarios.filter((scenario) => scenario.id !== scenarioId);
    updateDraftFlow((currentFlow) => ({
      ...currentFlow,
      debugScenarios: nextScenarios,
      metadata: {
        ...currentFlow.metadata,
        updatedAt: Date.now(),
      },
    }));
    setSelectedDebugScenarioId(nextScenarios[0]?.id || null);
  };

  const handleUpdateDebugScenario = (scenarioId: string, updates: Partial<FlowConfig['debugScenarios'][number]>) => {
    updateDraftFlow((currentFlow) => ({
      ...currentFlow,
      debugScenarios: currentFlow.debugScenarios.map((scenario) =>
        scenario.id === scenarioId ? { ...scenario, ...updates } : scenario,
      ),
      metadata: {
        ...currentFlow.metadata,
        updatedAt: Date.now(),
      },
    }));
  };

  const handleNodeChange = (updatedNode: FlowNode) => {
    setSelectedNodeSnapshot(updatedNode);
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

  const handleFlowChange = (updatedFlow: FlowDefinition) => {
    updateActiveFlow(() => updatedFlow);
  };

  const handleAddFlow = () => {
    const newFlow = createSubFlow(draftFlow.flows.length + 1);
    updateDraftFlow((currentFlow) => ({
      ...currentFlow,
      flows: [...currentFlow.flows, newFlow],
      metadata: {
        ...currentFlow.metadata,
        updatedAt: Date.now(),
      },
    }));
    setActiveFlowId(newFlow.id);
    setSelectedNodeId(null);
    setSelectedNodeSnapshot(null);
    setSelectedEdgeId(null);
    setDrawerMode('flow');
  };

  const handleDeleteActiveFlow = () => {
    if (!activeFlow || activeFlow.isEntry || draftFlow.flows.length <= 1) return;
    const nextFlows = draftFlow.flows.filter((flow) => flow.id !== activeFlow.id);
    const fallbackFlow = nextFlows[0];
    if (!fallbackFlow) return;
    updateDraftFlow((currentFlow) => ({
      ...currentFlow,
      flows: nextFlows,
      entryFlowId: currentFlow.entryFlowId === activeFlow.id ? fallbackFlow.id : currentFlow.entryFlowId,
      metadata: {
        ...currentFlow.metadata,
        updatedAt: Date.now(),
      },
    }));
    setActiveFlowId(fallbackFlow.id);
    setSelectedNodeId(null);
    setSelectedNodeSnapshot(null);
    setSelectedEdgeId(null);
    setDrawerMode(null);
  };

  const handleMakeEntryFlow = () => {
    if (!activeFlow) return;
    updateDraftFlow((currentFlow) => ({
      ...currentFlow,
      entryFlowId: activeFlow.id,
      flows: currentFlow.flows.map((flow) => ({
        ...flow,
        isEntry: flow.id === activeFlow.id,
      })),
      metadata: {
        ...currentFlow.metadata,
        updatedAt: Date.now(),
      },
    }));
  };

  const handleReorderFlows = (draggedFlowId: string, targetFlowId: string) => {
    updateDraftFlow((currentFlow) => ({
      ...currentFlow,
      flows: reorderFlows(currentFlow.flows, draggedFlowId, targetFlowId),
      metadata: {
        ...currentFlow.metadata,
        updatedAt: Date.now(),
      },
    }));
  };

  const handleRunDebug = (scenarioId?: string) => {
    const activeScenario =
      draftFlow.debugScenarios.find((scenario) => scenario.id === (scenarioId || selectedDebugScenarioId)) ||
      draftFlow.debugScenarios[0];
    const firstRunnableNode =
      activeFlow?.nodes.find((node) => node.type === FlowNodeType.DEFAULT) || activeFlow?.nodes[0] || null;
    setDebugCurrentNodeName(firstRunnableNode?.data.name || null);
    setDebugState({
      ...(activeScenario?.initialState || {}),
      activeFlowId: activeFlow?.id,
      scenarioId: activeScenario?.id,
      selectedNodeId: firstRunnableNode?.id,
      visibleFunctions: firstRunnableNode?.data.stepPrompt?.visibleFunctionIds || [],
      transitionFunctions: firstRunnableNode?.data.stepPrompt?.transitionFunctionIds || [],
      mockInputs: activeScenario?.mockInputs || [],
    });
    setDebugHistory([
      `进入 ${activeFlow?.name || '当前 Flow'}`,
      activeScenario ? `加载场景 ${activeScenario.name}` : '未指定场景，使用空白调试上下文',
      firstRunnableNode ? `执行节点 ${firstRunnableNode.data.name}` : '等待节点执行',
      '读取 step prompt 与已绑定工具',
      '根据边条件决定下一步路径',
    ]);
    setDrawerMode('debug');
  };

  const runDebugScenario = (scenarioId?: string) => {
    const activeScenario =
      draftFlow.debugScenarios.find((scenario) => scenario.id === (scenarioId || selectedDebugScenarioId)) ||
      draftFlow.debugScenarios[0];
    const result = simulateFlowScenario({
      flowConfig: draftFlow,
      activeFlowId: activeFlow?.id || draftFlow.entryFlowId,
      scenario: activeScenario,
    });

    setDebugCurrentNodeName(result.currentNodeName);
    setDebugState(result.state);
    setDebugHistory(result.history);
    setIsDebugOpen(true);
  };

  if (!activeFlow) return null;

  return (
    <div
      className={`flex flex-col overflow-hidden bg-white shadow-sm ${
        isFullscreen
          ? 'fixed inset-4 z-[70] rounded-2xl border border-slate-300'
          : 'h-full rounded-2xl border border-slate-200'
      }`}
    >
      <FlowStudioToolbar
        drawerMode={drawerMode}
        zoom={zoom}
        onCloseDrawer={closeDrawer}
        onOpenDebug={runDebugScenario}
        onOpenVersion={openVersionManager}
        onZoomIn={() => setZoom((current) => Math.min(current + 0.1, 1.8))}
        onZoomOut={() => setZoom((current) => Math.max(current - 0.1, 0.6))}
        onResetView={() => {
          setZoom(1);
          setViewport({ x: 0, y: 0 });
        }}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <FlowCanvas
          flow={activeFlow}
          annotationMode={false}
          annotations={[]}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          readOnly={readOnly}
          isFullscreen={isFullscreen}
          zoom={zoom}
          viewport={viewport}
          onSelectNode={(nodeId) => {
            setSelectedNodeId(nodeId);
            setSelectedNodeSnapshot(activeFlow.nodes.find((node) => node.id === nodeId) || null);
            setSelectedEdgeId(null);
            if (nodeId) {
              setDrawerMode('node');
              return;
            }
            setDrawerMode((current) => (current === 'node' ? null : current));
          }}
          onSelectEdge={(edgeId) => {
            setSelectedNodeId(null);
            setSelectedEdgeId(edgeId);
            if (edgeId) {
              setDrawerMode('edge');
              return;
            }
            setDrawerMode((current) => (current === 'edge' ? null : current));
          }}
          onChangeFlow={updateActiveFlow}
          onSave={handleSave}
          onToggleFullscreen={() => setIsFullscreen((current) => !current)}
          onZoomChange={setZoom}
          onViewportChange={setViewport}
          onAnnotationSelect={() => {}}
        />

        {drawerMode ? (
          <aside className="absolute inset-y-0 right-0 z-40 flex w-[440px] min-w-[400px] max-w-[42vw] flex-col border-l border-gray-200 bg-white shadow-2xl animate-in slide-in-from-right-8 duration-200">
            {drawerMode === 'flow' ? (
              <FlowConfigPanel
                flow={activeFlow}
                canDelete={!activeFlow.isEntry && draftFlow.flows.length > 1}
                readOnly={readOnly}
                onChange={handleFlowChange}
                onClose={closeDrawer}
                onDelete={handleDeleteActiveFlow}
                onMakeEntry={handleMakeEntryFlow}
              />
            ) : null}

            {drawerMode === 'node' && resolvedSelectedNode ? (
              <FlowNodeConfig
                node={resolvedSelectedNode}
                availableFunctions={draftFlow.functions || availableFunctions}
                availableVariables={availableVariables}
                availableTools={availableTools}
                availableDelayProfiles={availableDelayProfiles}
                availableFlows={draftFlow.flows.filter(f => f.id !== activeFlow.id).map(f => ({ id: f.id, name: f.name, description: f.metadata?.description }))}
                availableNodes={activeFlow.nodes}
                onChange={handleNodeChange}
                onClose={closeDrawer}
                readOnly={readOnly}
              />
            ) : null}

            {drawerMode === 'node' && !resolvedSelectedNode ? (
              <div className="flex h-full items-center justify-center p-8 text-center text-slate-400">
                <div>
                  <div className="text-sm font-medium text-slate-500">未加载到节点配置</div>
                  <div className="mt-2 text-xs leading-6 text-slate-400">
                    当前选中节点 ID: {selectedNodeId || 'none'}
                  </div>
                </div>
              </div>
            ) : null}

            {drawerMode === 'edge' ? (
              <FlowEdgeConfig
                edge={selectedEdge}
                sourceNode={selectedEdgeSource}
                targetNode={selectedEdgeTarget}
                availableFlows={draftFlow.flows.map(f => ({ id: f.id, name: f.name }))}
                availableFunctions={draftFlow.functions || availableFunctions}
                availableVariables={availableVariables}
                onChange={handleEdgeChange}
                onClose={closeDrawer}
                readOnly={readOnly}
              />
            ) : null}

            {drawerMode === 'version' ? (
              <FlowVersionManager
                versions={draftFlow.versions || []}
                currentFlow={activeFlow}
                onVersionChange={(versions) => updateDraftFlow((currentFlow) => ({ ...currentFlow, versions }))}
                onRollback={handleRollbackVersion}
                onClose={closeDrawer}
                readOnly={readOnly}
              />
            ) : null}
          </aside>
        ) : null}

        {isDebugOpen ? (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/28 p-5 backdrop-blur-[1px]"
            onClick={closeDebug}
          >
            <div
              className="flex h-[min(82vh,920px)] w-[min(1180px,calc(100%-48px))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]"
              onClick={(event) => event.stopPropagation()}
            >
              <FlowDebugPanel
                scenarios={draftFlow.debugScenarios}
                selectedScenarioId={selectedDebugScenarioId}
                currentNodeName={debugCurrentNodeName}
                state={debugState}
                history={debugHistory}
                onClose={closeDebug}
                onCreateScenario={handleCreateDebugScenario}
                onDeleteScenario={handleDeleteDebugScenario}
                onRunScenario={runDebugScenario}
                onSelectScenario={setSelectedDebugScenarioId}
                onUpdateScenario={handleUpdateDebugScenario}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
