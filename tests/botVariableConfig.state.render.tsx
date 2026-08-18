import React from 'react';
import { renderToString } from 'react-dom/server';
import BotVariableConfig from '../components/bot/BotVariableConfig';
import { BotVariable } from '../types';

const variables: BotVariable[] = [
  {
    id: '1',
    name: 'booking_reference',
    type: 'TEXT',
    description: '订票号',
    isSystem: false,
    category: 'CONVERSATION',
    isStateful: true,
    source: 'flow',
  },
];

const html = renderToString(
  <BotVariableConfig
    variables={variables}
    stateDefaults="booking_status=pending"
    stateWriteRules="refund_amount -> only_after_lookup"
    onUpdate={() => {}}
    onStateDefaultsChange={() => {}}
    onStateWriteRulesChange={() => {}}
    onSave={() => {}}
    onCancel={() => {}}
  />,
);

for (const text of ['State', '系统内置', '自定义 State']) {
  if (!html.includes(text)) {
    throw new Error(`Expected BotVariableConfig to render section: ${text}`);
  }
}

for (const text of ['State Defaults', 'State Write Rules']) {
  if (html.includes(text)) {
    throw new Error(`Expected BotVariableConfig to remove legacy section: ${text}`);
  }
}

console.log('bot variable state render ok');
