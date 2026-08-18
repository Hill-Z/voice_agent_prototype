import React from 'react';
import { renderToString } from 'react-dom/server';
import FlowCanvas from '../components/flow/FlowCanvas';
import { FlowDefinition, FlowNodeType } from '../types';

const flow: FlowDefinition = {
  id: 'flow_main',
  name: 'Main Flow',
  nodes: [
    {
      id: 'start_1',
      type: FlowNodeType.START,
      position: { x: 80, y: 160 },
      data: {
        name: 'Start',
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

const html = renderToString(
  <FlowCanvas
    flow={flow}
    annotationMode={false}
    annotations={[]}
    selectedNodeId={null}
    selectedEdgeId={null}
    zoom={1}
    viewport={{ x: 0, y: 0 }}
    onSelectNode={() => {}}
    onSelectEdge={() => {}}
    onChangeFlow={() => flow}
    onZoomChange={() => {}}
    onViewportChange={() => {}}
    onAnnotationSelect={() => {}}
  />,
);

if (!html.includes('Step')) {
  throw new Error('Expected a single Step toolbox item.');
}

if (html.includes('Collect Step')) {
  throw new Error('Collect Step toolbox item should not exist.');
}

if (html.includes('Function Step')) {
  throw new Error('Function Step toolbox item should not exist.');
}

console.log('toolbox render ok');
