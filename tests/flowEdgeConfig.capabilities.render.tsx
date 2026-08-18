import React from 'react';
import { renderToString } from 'react-dom/server';
import FlowEdgeConfig from '../components/flow/FlowEdgeConfig';

const html = renderToString(
  <FlowEdgeConfig
    edge={{
      id: 'edge_verify_success',
      source: 'verify_step',
      target: 'lookup_step',
      label: 'Verified',
      edgeType: 'conditional',
      conditionSummary: 'state.isVerified === true',
      priority: 1,
    }}
    availableFunctions={[
      {
        id: 'builtin_goto_flow',
        name: 'goto_flow',
        description: 'Jump to another flow.',
        parameters: [],
        scope: 'global',
        isBuiltIn: true,
        category: 'transition',
      },
    ]}
  />,
);

for (const text of ['条件分支', '条件表达式', '优先级']) {
  if (!html.includes(text)) {
    throw new Error(`Expected FlowEdgeConfig to render section: ${text}`);
  }
}

console.log('edge capabilities render ok');
