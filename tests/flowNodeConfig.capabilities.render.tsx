import React from 'react';
import { renderToString } from 'react-dom/server';
import FlowNodeConfig from '../components/flow/FlowNodeConfig';
import { FlowNode, FlowNodeType } from '../types';

const sampleNode: FlowNode = {
  id: 'step_verify',
  type: FlowNodeType.DEFAULT,
  position: { x: 220, y: 180 },
  data: {
    name: 'Verification Step',
    description: 'Collect verification code and retry when needed.',
    stepType: 'collect',
    stepPrompt: {
      prompt: 'Collect the verification code.',
      visibleFunctionIds: [],
      transitionFunctionIds: [],
      transferSpeeches: ['I will transfer you now.', 'One moment while I connect you.'],
      hangupSpeeches: ['Thank you for calling. Goodbye.'],
    },
    entityConfig: {
      enabled: true,
      entityName: 'verification_code',
      entityType: 'alphanumeric',
      prompt: 'Please say your verification code.',
      asrBiasing: 'alphanumeric',
      required: true,
    },
    retryConfig: {
      enabled: true,
      maxAttempts: 3,
      noInputPrompt: 'Please repeat the code.',
      noMatchPrompt: 'That did not sound like a valid code.',
      fallbackTargetId: 'handoff_exit',
    },
    gotoFlowId: 'lookup',
  },
};

const html = renderToString(<FlowNodeConfig node={sampleNode} />);

for (const text of [
  '转人工与挂机判断',
  '转人工判断提示词',
  '目标 IVR',
  '挂机判断提示词',
  '转人工话术',
  '挂机话术',
  'I will transfer you now.',
  'Thank you for calling. Goodbye.',
]) {
  if (!html.includes(text)) {
    throw new Error(`Expected FlowNodeConfig to render section: ${text}`);
  }
}

if (html.includes('后端默认判断规则')) {
  throw new Error('FlowNodeConfig 不应展示后端判断相关文案');
}

console.log('capabilities render ok');
