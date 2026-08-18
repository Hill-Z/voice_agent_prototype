import { BUILT_IN_FUNCTIONS, BotVariable, QACategoryConfig } from '../types';
import {
  getDelayProfileOptions,
  getStateVariableOptions,
  mergeFunctionCatalog,
  syncTopicBindingsWithCategories,
} from '../services/polyaiConfigHelpers';

const categories: QACategoryConfig[] = [
  { id: 'topic_general', name: '通用', enabled: true },
  { id: 'topic_smalltalk', name: '闲聊', enabled: true, topicType: 'smalltalk' },
  { id: 'topic_refund', name: '退票', enabled: true, topicType: 'business' },
];

const syncedBindings = syncTopicBindingsWithCategories(categories, [
  { categoryId: 'legacy_1', categoryName: '闲聊', enabled: true, entryBehavior: 'direct_answer', priority: 1 },
  { categoryId: 'topic_refund', categoryName: '退票', enabled: false, entryBehavior: 'flow_trigger', priority: 2 },
]);

if (syncedBindings.length !== 2) {
  throw new Error(`Expected synced bindings length to stay at 2, got ${syncedBindings.length}`);
}

if (syncedBindings[0].categoryId !== 'topic_smalltalk') {
  throw new Error(`Expected 闲聊 binding to adopt topic_smalltalk, got ${syncedBindings[0].categoryId}`);
}

if (syncedBindings[1].categoryId !== 'topic_refund') {
  throw new Error(`Expected 退票 binding to keep topic_refund, got ${syncedBindings[1].categoryId}`);
}

const mergedFunctions = mergeFunctionCatalog([
  {
    id: 'code_lookup_refund',
    name: 'lookup_refund',
    description: 'query refund',
    parameters: [],
    scope: 'global',
    isBuiltIn: false,
    category: 'visible',
  },
  {
    id: BUILT_IN_FUNCTIONS[0].id,
    name: 'duplicate_builtin',
    description: 'should be ignored',
    parameters: [],
    scope: 'global',
    isBuiltIn: false,
    category: 'transition',
  },
]);

if (!mergedFunctions.some((item) => item.id === 'code_lookup_refund')) {
  throw new Error('Expected custom function to be merged into catalog.');
}

const builtinCount = mergedFunctions.filter((item) => item.id === BUILT_IN_FUNCTIONS[0].id).length;
if (builtinCount !== 1) {
  throw new Error(`Expected builtin function dedupe count 1, got ${builtinCount}`);
}

const variables: BotVariable[] = [
  { id: 'v1', name: 'booking_reference', type: 'TEXT', isSystem: false, category: 'CONVERSATION', isStateful: true },
  { id: 'v2', name: 'last_user_utterance', type: 'TEXT', isSystem: true, category: 'CONVERSATION', isStateful: true },
  { id: 'v3', name: 'refund_reason', type: 'TEXT', isSystem: false, category: 'EXTRACTION', isStateful: false },
];

const stateVariables = getStateVariableOptions(variables);
if (stateVariables.length !== 1 || stateVariables[0].name !== 'booking_reference') {
  throw new Error(`Expected only non-system stateful variable, got ${stateVariables.map((item) => item.name).join(', ')}`);
}

const delayProfiles = getDelayProfileOptions([
  { id: 'delay_short', name: '短等待', triggerMs: 1200, message: '请稍等', allowBargeIn: true },
  { id: 'delay_long', name: '长等待', triggerMs: 3200, message: '正在查询', allowBargeIn: true },
]);

if (delayProfiles.length !== 2 || delayProfiles[1].id !== 'delay_long') {
  throw new Error('Expected delay profiles to preserve order and ids.');
}

console.log('polyai config helpers ok');
