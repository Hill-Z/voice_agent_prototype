import React from 'react';
import { renderToString } from 'react-dom/server';
import FlowNodeConfig from '../components/flow/FlowNodeConfig';
import { FlowNode, FlowNodeType } from '../types';

const sampleNode: FlowNode = {
  id: 'node_llm_1',
  type: FlowNodeType.DEFAULT,
  position: { x: 120, y: 180 },
  data: {
    name: 'Collect customer phone',
    description: 'Ask for the phone number and validate it.',
    stepType: 'collect',
    stepPrompt: {
      prompt: 'Ask for {{customer_name}} phone. Use /lookup_customer if needed.',
      visibleFunctionIds: ['lookup_customer'],
      transitionFunctionIds: ['save_state'],
    },
    toolIds: ['lookup_customer'],
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
      maxAttempts: 3,
      noInputPrompt: 'I did not hear anything.',
      noMatchPrompt: 'That did not sound like a phone number.',
      fallbackTargetId: 'exit_handoff',
    },
    fewShotExamples: [
      { input: 'My number is 13800138000.', output: 'Captured phone_number=13800138000' },
    ],
  },
};

const html = renderToString(
  <FlowNodeConfig
    node={sampleNode}
    availableVariables={[
      { name: 'customer_name', description: 'Customer display name', defaultValue: '', type: 'string' },
    ]}
    availableTools={[
      {
        id: 'lookup_customer',
        name: 'lookup_customer',
        description: 'Find an existing customer record.',
        type: 'API',
        parameters: [],
      },
    ]}
    availableFunctions={[
      {
        id: 'lookup_customer',
        name: 'lookup_customer',
        description: 'Lookup customer profile.',
        parameters: [],
        scope: 'global',
        isBuiltIn: false,
        category: 'visible',
      },
    ]}
  />,
);

if (!html.includes('Collect customer phone')) {
  throw new Error('FlowNodeConfig did not render the selected node title.');
}

console.log('render ok');
