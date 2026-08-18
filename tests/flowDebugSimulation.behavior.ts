import { ExitNodeType, FlowConfig, FlowDebugScenario, FlowNodeType } from '../types';
import { simulateFlowScenario } from '../components/flow/flowDebugSimulation';

const flowConfig: FlowConfig = {
  id: 'test_flow',
  name: 'Test Flow',
  entryFlowId: 'main',
  functions: [],
  annotations: [],
  debugScenarios: [],
  flows: [
    {
      id: 'main',
      name: 'Main Flow',
      isEntry: true,
      nodes: [
        {
          id: 'main_start',
          type: FlowNodeType.START,
          position: { x: 0, y: 0 },
          data: { name: 'Main Start' },
        },
        {
          id: 'collect_phone',
          type: FlowNodeType.DEFAULT,
          position: { x: 240, y: 0 },
          data: {
            name: 'Collect Phone',
            stepType: 'collect',
            stepPrompt: {
              prompt: 'Collect the phone number.',
              visibleFunctionIds: [],
              transitionFunctionIds: ['builtin_goto_flow'],
            },
            entityConfig: {
              enabled: true,
              entityName: 'phone_number',
              entityType: 'phone',
              prompt: 'Please say your phone number.',
              asrBiasing: 'number',
              required: true,
            },
            retryConfig: {
              enabled: true,
              maxAttempts: 2,
              noInputPrompt: 'Please repeat the phone number.',
              noMatchPrompt: 'That did not sound like a phone number.',
              fallbackTargetId: 'handoff_exit',
            },
          },
        },
        {
          id: 'verify_step',
          type: FlowNodeType.DEFAULT,
          position: { x: 480, y: 0 },
          data: {
            name: 'Verify Step',
            stepType: 'function',
            stepPrompt: {
              prompt: 'Decide where to go next.',
              visibleFunctionIds: [],
              transitionFunctionIds: ['builtin_goto_flow'],
            },
          },
        },
        {
          id: 'success_exit',
          type: FlowNodeType.EXIT,
          position: { x: 720, y: -80 },
          data: {
            name: 'Success Exit',
            stepType: 'exit',
            exitType: ExitNodeType.FINISH,
            gotoFlowId: 'lookup',
          },
        },
        {
          id: 'handoff_exit',
          type: FlowNodeType.EXIT,
          position: { x: 720, y: 80 },
          data: {
            name: 'Handoff Exit',
            stepType: 'exit',
            exitType: ExitNodeType.HANDOFF,
          },
        },
      ],
      edges: [
        { id: 'edge_start_collect', source: 'main_start', target: 'collect_phone', edgeType: 'normal', priority: 1 },
        { id: 'edge_collect_verify', source: 'collect_phone', target: 'verify_step', edgeType: 'normal', priority: 1 },
        {
          id: 'edge_verify_success',
          source: 'verify_step',
          target: 'success_exit',
          edgeType: 'conditional',
          conditionSummary: 'isVerified === true',
          priority: 1,
          transitionFunctionId: 'builtin_goto_flow',
        },
        {
          id: 'edge_verify_handoff',
          source: 'verify_step',
          target: 'handoff_exit',
          edgeType: 'fallback',
          conditionSummary: 'retryCount >= 2',
          priority: 2,
        },
      ],
    },
    {
      id: 'lookup',
      name: 'Lookup Flow',
      nodes: [
        {
          id: 'lookup_start',
          type: FlowNodeType.START,
          position: { x: 0, y: 0 },
          data: { name: 'Lookup Start' },
        },
        {
          id: 'lookup_step',
          type: FlowNodeType.DEFAULT,
          position: { x: 240, y: 0 },
          data: {
            name: 'Lookup Step',
            stepType: 'function',
            stepPrompt: {
              prompt: 'Lookup the order.',
              visibleFunctionIds: [],
              transitionFunctionIds: [],
            },
          },
        },
        {
          id: 'lookup_exit',
          type: FlowNodeType.EXIT,
          position: { x: 480, y: 0 },
          data: {
            name: 'Lookup Exit',
            stepType: 'exit',
            exitType: ExitNodeType.FINISH,
          },
        },
      ],
      edges: [
        { id: 'edge_lookup_1', source: 'lookup_start', target: 'lookup_step', edgeType: 'normal', priority: 1 },
        { id: 'edge_lookup_2', source: 'lookup_step', target: 'lookup_exit', edgeType: 'normal', priority: 1 },
      ],
    },
  ],
};

const successScenario: FlowDebugScenario = {
  id: 'scenario_success',
  name: 'Success',
  initialState: {
    isVerified: true,
  },
  mockInputs: ['13800138000'],
};

const successResult = simulateFlowScenario({
  flowConfig,
  activeFlowId: 'main',
  scenario: successScenario,
});

if (successResult.currentNodeName !== 'Lookup Exit') {
  throw new Error(`Expected debug to end in Lookup Exit, got ${successResult.currentNodeName}`);
}

if (successResult.state.phone_number !== '13800138000') {
  throw new Error('Expected collected entity to be stored in debug state.');
}

if (!successResult.history.some((item) => item.includes('Lookup Flow'))) {
  throw new Error('Expected debug history to include sub flow navigation.');
}

if (!successResult.history.some((item) => item.includes('builtin_goto_flow'))) {
  throw new Error('Expected debug history to include the selected transition function.');
}

const fallbackScenario: FlowDebugScenario = {
  id: 'scenario_fallback',
  name: 'Fallback',
  initialState: {
    isVerified: false,
  },
  mockInputs: ['', ''],
};

const fallbackResult = simulateFlowScenario({
  flowConfig,
  activeFlowId: 'main',
  scenario: fallbackScenario,
});

if (fallbackResult.currentNodeName !== 'Handoff Exit') {
  throw new Error(`Expected retry exhaustion to end in Handoff Exit, got ${fallbackResult.currentNodeName}`);
}

if (!fallbackResult.state.retryExhausted) {
  throw new Error('Expected retry exhaustion flag in debug state.');
}

if (!fallbackResult.history.some((item) => item.includes('Retry exhausted'))) {
  throw new Error('Expected debug history to include retry exhaustion.');
}

console.log('flow debug simulation ok');
