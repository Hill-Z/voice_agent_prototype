import { BUILT_IN_FUNCTIONS, FlowConfig, FlowDebugScenario, FlowDefinition, FlowEdge, FlowFunction, FlowNode, FlowNodeType } from '../../types';

export interface FlowSimulationResult {
  activeFlowId: string | null;
  currentNodeId: string | null;
  currentNodeName: string | null;
  history: string[];
  state: Record<string, any>;
}

interface SimulateFlowScenarioArgs {
  flowConfig: FlowConfig;
  activeFlowId?: string | null;
  scenario?: FlowDebugScenario | null;
  maxSteps?: number;
}

const DEFAULT_MAX_STEPS = 48;

function buildFunctionMap(flowConfig: FlowConfig) {
  const functionMap = new Map<string, FlowFunction>();
  [...BUILT_IN_FUNCTIONS, ...(flowConfig.functions || [])].forEach((item) => {
    if (!functionMap.has(item.id)) {
      functionMap.set(item.id, item);
    }
  });
  return functionMap;
}

function getFlow(flowConfig: FlowConfig, flowId?: string | null) {
  return flowConfig.flows.find((item) => item.id === flowId) || flowConfig.flows.find((item) => item.id === flowConfig.entryFlowId) || flowConfig.flows[0] || null;
}

function getStartNode(flow: FlowDefinition) {
  return flow.nodes.find((node) => node.type === FlowNodeType.START) || flow.nodes[0] || null;
}

function getNode(flow: FlowDefinition, nodeId: string) {
  return flow.nodes.find((node) => node.id === nodeId) || null;
}

function getOutgoingEdges(flow: FlowDefinition, nodeId: string) {
  return flow.edges
    .filter((edge) => edge.source === nodeId)
    .sort((left, right) => (left.priority ?? 999) - (right.priority ?? 999));
}

function normalizeInput(value: string) {
  return value.trim();
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, '');
}

function validateEntityInput(node: FlowNode, rawInput: string) {
  const entityConfig = node.data.entityConfig;
  const input = normalizeInput(rawInput);

  if (!entityConfig?.enabled) {
    return { valid: true, normalized: input, reason: null as string | null };
  }

  if (!input) {
    return { valid: false, normalized: input, reason: 'no_input' };
  }

  if (entityConfig.inputMode === 'dtmf') {
    const digits = input.replace(/\s+/g, '');
    const maxDigits = entityConfig.dtmfMaxDigits || 6;
    const valid = /^\d+$/.test(digits) && digits.length <= maxDigits;
    return {
      valid,
      normalized: digits,
      reason: valid ? null : 'no_match',
    };
  }

  if (entityConfig.options?.length && !entityConfig.options.includes(input)) {
    return { valid: false, normalized: input, reason: 'no_match' };
  }

  if (entityConfig.validationPattern) {
    try {
      const pattern = new RegExp(entityConfig.validationPattern);
      if (!pattern.test(input)) {
        return { valid: false, normalized: input, reason: 'no_match' };
      }
    } catch {
      // Ignore invalid regex in simulation and keep permissive behavior.
    }
  }

  switch (entityConfig.entityType) {
    case 'phone': {
      const normalized = normalizePhone(input);
      const valid = /^\+?\d{7,15}$/.test(normalized);
      return { valid, normalized, reason: valid ? null : 'no_match' };
    }
    case 'number': {
      const valid = /^-?\d+(\.\d+)?$/.test(input);
      return { valid, normalized: valid ? Number(input) : input, reason: valid ? null : 'no_match' };
    }
    case 'email': {
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
      return { valid, normalized: input, reason: valid ? null : 'no_match' };
    }
    case 'alphanumeric': {
      const valid = /^[a-zA-Z0-9_-]+$/.test(input);
      return { valid, normalized: input, reason: valid ? null : 'no_match' };
    }
    default:
      return { valid: true, normalized: input, reason: null as string | null };
  }
}

function evaluateCondition(conditionSummary: string | undefined, state: Record<string, any>) {
  if (!conditionSummary?.trim()) {
    return true;
  }

  try {
    const evaluator = new Function(
      'state',
      `
        const ctx = state;
        const input = state.lastInput;
        with (state) {
          return Boolean(${conditionSummary});
        }
      `,
    );
    return Boolean(evaluator(state));
  } catch {
    return false;
  }
}

function evaluateStructuredCondition(edge: FlowEdge, state: Record<string, any>) {
  const condition = edge.condition;
  if (!condition) return null;

  if (condition.mode === 'expression') {
    return evaluateCondition(condition.expression || edge.conditionSummary, state);
  }

  if (condition.mode === 'entity') {
    const currentValue = state[condition.entityName || ''];
    if (condition.operator === 'exists') return currentValue !== undefined && currentValue !== null && currentValue !== '';
    if (condition.operator === 'equals') return String(currentValue ?? '') === String(condition.value ?? '');
    if (condition.operator === 'not_equals') return String(currentValue ?? '') !== String(condition.value ?? '');
    if (condition.operator === 'contains') return String(currentValue ?? '').includes(String(condition.value ?? ''));
    return Boolean(currentValue);
  }

  if (condition.mode === 'state' || condition.mode === 'intent') {
    const currentValue = state[condition.stateKey || ''];
    if (condition.operator === 'contains') return String(currentValue ?? '').includes(String(condition.value ?? ''));
    if (condition.operator === 'not_equals') return String(currentValue ?? '') !== String(condition.value ?? '');
    return String(currentValue ?? '') === String(condition.value ?? '');
  }

  return null;
}

function matchesEdge(edge: FlowEdge, state: Record<string, any>) {
  if (edge.requiredEntities?.length) {
    const allExists = edge.requiredEntities.every((item) => {
      const value = state[item];
      return value !== undefined && value !== null && value !== '';
    });
    if (!allExists) return false;
  }

  if (edge.debugRule === 'always') return true;
  if (edge.debugRule === 'entity_collected') return Boolean(state.lastCollectedEntity);
  if (edge.debugRule === 'retry_exhausted') return Boolean(state.retryExhausted);
  if (edge.debugRule === 'condition') return evaluateCondition(edge.conditionSummary, state);

  const structuredResult = evaluateStructuredCondition(edge, state);
  if (typeof structuredResult === 'boolean') {
    return structuredResult;
  }

  if (edge.edgeType === 'fallback') {
    return Boolean(state.retryExhausted) || evaluateCondition(edge.conditionSummary, state);
  }

  if (edge.edgeType === 'conditional' || edge.conditionSummary) {
    return evaluateCondition(edge.conditionSummary, state);
  }

  return true;
}

function findNextEdge(flow: FlowDefinition, node: FlowNode, state: Record<string, any>) {
  return getOutgoingEdges(flow, node.id).find((edge) => matchesEdge(edge, state)) || null;
}

function recordStepContext(state: Record<string, any>, node: FlowNode, flow: FlowDefinition) {
  state.activeFlowId = flow.id;
  state.currentFlowName = flow.name;
  state.selectedNodeId = node.id;
  state.currentNodeId = node.id;
  state.currentNodeName = node.data.name || node.id;
  state.visibleFunctions = node.data.stepPrompt?.visibleFunctionIds || [];
  state.transitionFunctions = node.data.stepPrompt?.transitionFunctionIds || [];
}

export function simulateFlowScenario({
  flowConfig,
  activeFlowId,
  scenario,
  maxSteps = DEFAULT_MAX_STEPS,
}: SimulateFlowScenarioArgs): FlowSimulationResult {
  const functionMap = buildFunctionMap(flowConfig);
  const history: string[] = [];
  const state: Record<string, any> = {
    ...(scenario?.initialState || {}),
    scenarioId: scenario?.id || null,
    mockInputs: [...(scenario?.mockInputs || [])],
    retryCount: 0,
    retryExhausted: false,
  };
  const pendingInputs = [...(scenario?.mockInputs || [])];
  const attemptByNode: Record<string, number> = {};

  let currentFlow = getFlow(flowConfig, activeFlowId);
  let currentNode = currentFlow ? getStartNode(currentFlow) : null;
  let steps = 0;

  if (!currentFlow || !currentNode) {
    return {
      activeFlowId: null,
      currentNodeId: null,
      currentNodeName: null,
      history: ['No runnable flow or start node found.'],
      state,
    };
  }

  history.push(`Enter flow ${currentFlow.name}`);
  if (scenario) {
    history.push(`Load scenario ${scenario.name}`);
  }

  while (currentNode && steps < maxSteps) {
    steps += 1;
    recordStepContext(state, currentNode, currentFlow);

    if (currentNode.type === FlowNodeType.START) {
      history.push(`At start node ${currentNode.data.name || currentNode.id}`);
      const nextEdge = findNextEdge(currentFlow, currentNode, state);
      if (!nextEdge) {
        history.push(`No outgoing edge from ${currentNode.data.name || currentNode.id}`);
        break;
      }
      state.lastEdgeId = nextEdge.id;
      history.push(`Follow edge ${nextEdge.label || nextEdge.id}`);
      currentNode = getNode(currentFlow, nextEdge.target);
      continue;
    }

    if (currentNode.type === FlowNodeType.EXIT) {
      state.currentExitType = currentNode.data.exitType || null;
      history.push(`Reached exit ${currentNode.data.name || currentNode.id}`);
      if (currentNode.data.gotoFlowId) {
        const targetFlow = getFlow(flowConfig, currentNode.data.gotoFlowId);
        if (!targetFlow) {
          history.push(`Target flow ${currentNode.data.gotoFlowId} was not found`);
          break;
        }
        history.push(`Goto flow ${targetFlow.name}`);
        currentFlow = targetFlow;
        currentNode = getStartNode(targetFlow);
        if (!currentNode) {
          history.push(`Target flow ${targetFlow.name} has no start node`);
          break;
        }
        continue;
      }
      break;
    }

    history.push(`Run step ${currentNode.data.name || currentNode.id}`);
    if (currentNode.data.stepPrompt?.prompt) {
      history.push(`Load prompt for ${currentNode.data.name || currentNode.id}`);
    }

    if (currentNode.data.toolIds?.length) {
      history.push(`Expose tools: ${currentNode.data.toolIds.join(', ')}`);
    }

    if (state.transitionFunctions?.length) {
      history.push(`Expose transition functions: ${state.transitionFunctions.join(', ')}`);
    }

    if (currentNode.data.entityConfig?.enabled) {
      const attempt = (attemptByNode[currentNode.id] || 0) + 1;
      const rawInput = pendingInputs.shift() || '';
      const validation = validateEntityInput(currentNode, rawInput);
      const entityName = currentNode.data.entityConfig.entityName || 'collected_entity';

      attemptByNode[currentNode.id] = attempt;
      state.lastInput = rawInput;
      state.retryCount = validation.valid ? Math.max(0, attempt - 1) : attempt;

      if (!validation.valid) {
        const reason = validation.reason === 'no_input' ? 'No input' : 'No match';
        history.push(`${reason} on ${currentNode.data.name || currentNode.id}`);

        const retryConfig = currentNode.data.retryConfig;
        if (retryConfig?.enabled && attempt < retryConfig.maxAttempts) {
          state.retryExhausted = false;
          history.push(`Retry ${attempt}/${retryConfig.maxAttempts} on ${currentNode.data.name || currentNode.id}`);
          const retryPrompt =
            validation.reason === 'no_input' ? retryConfig.noInputPrompt : retryConfig.noMatchPrompt;
          if (retryPrompt) {
            history.push(`Retry prompt: ${retryPrompt}`);
          }
          continue;
        }

        state.retryExhausted = true;
        history.push(`Retry exhausted on ${currentNode.data.name || currentNode.id}`);

        if (retryConfig?.fallbackAction === 'goto_flow' && retryConfig.fallbackFlowId) {
          const targetFlow = getFlow(flowConfig, retryConfig.fallbackFlowId);
          if (targetFlow) {
            history.push(`Retry fallback goto flow ${targetFlow.name}`);
            currentFlow = targetFlow;
            currentNode = getStartNode(targetFlow);
            continue;
          }
        }

        if (retryConfig?.fallbackAction === 'handoff' && retryConfig.handoffTargetId) {
          state.currentExitType = 'handoff';
          state.handoffTargetId = retryConfig.handoffTargetId;
          history.push(`Retry fallback handoff -> ${retryConfig.handoffTargetId}`);
          break;
        }

        if (retryConfig?.fallbackAction === 'exit') {
          state.currentExitType = 'stop';
          history.push('Retry fallback exit');
          break;
        }

        if (retryConfig?.fallbackTargetId) {
          const fallbackNode = getNode(currentFlow, retryConfig.fallbackTargetId);
          if (fallbackNode) {
            history.push(`Fallback to ${fallbackNode.data.name || fallbackNode.id}`);
            currentNode = fallbackNode;
            continue;
          }
        }

        const fallbackEdge = findNextEdge(currentFlow, currentNode, state);
        if (!fallbackEdge) {
          history.push(`No fallback edge from ${currentNode.data.name || currentNode.id}`);
          break;
        }
        state.lastEdgeId = fallbackEdge.id;
        history.push(`Follow edge ${fallbackEdge.label || fallbackEdge.id}`);
        currentNode = getNode(currentFlow, fallbackEdge.target);
        continue;
      }

      state.retryExhausted = false;
      state[entityName] = validation.normalized;
      state.lastCollectedEntity = entityName;
      history.push(`Collected entity ${entityName}: ${String(validation.normalized)}`);
    } else {
      state.lastCollectedEntity = null;
      state.retryExhausted = false;
    }

    const nextEdge = findNextEdge(currentFlow, currentNode, state);
    if (!nextEdge) {
      history.push(`No matching edge from ${currentNode.data.name || currentNode.id}`);
      break;
    }

    state.lastEdgeId = nextEdge.id;
    if (nextEdge.transitionFunctionId) {
      const transitionFunction = functionMap.get(nextEdge.transitionFunctionId);
      state.lastTransitionFunctionId = nextEdge.transitionFunctionId;
      history.push(`Transition function ${transitionFunction?.name || nextEdge.transitionFunctionId}`);
    }
    history.push(`Follow edge ${nextEdge.label || nextEdge.id}`);

    const targetNode = getNode(currentFlow, nextEdge.target);
    if (!targetNode) {
      history.push(`Target node ${nextEdge.target} was not found`);
      break;
    }
    currentNode = targetNode;
  }

  if (steps >= maxSteps && currentNode) {
    history.push(`Stop simulation after ${maxSteps} steps to avoid looping forever`);
  }

  return {
    activeFlowId: currentFlow.id,
    currentNodeId: currentNode?.id || state.currentNodeId || null,
    currentNodeName: currentNode?.data.name || state.currentNodeName || null,
    history,
    state,
  };
}
