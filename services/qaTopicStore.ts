import { QACategoryConfig } from '../types';

const QA_TOPIC_STORAGE_KEY = 'polyai.qa-category-configs';
const QA_TOPIC_EVENT = 'polyai:qa-category-configs-updated';

export const DEFAULT_QA_CATEGORY_CONFIGS: QACategoryConfig[] = [
  { id: 'topic_general', name: '通用', enabled: true, topicType: 'qa', entryBehavior: 'direct_answer' },
  { id: 'topic_smalltalk', name: '闲聊', enabled: true, topicType: 'smalltalk', entryBehavior: 'direct_answer' },
  { id: 'topic_business', name: '业务', enabled: true, topicType: 'business', entryBehavior: 'flow_trigger' },
];

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeCategoryConfig(item: QACategoryConfig, index: number): QACategoryConfig {
  return {
    id: item.id || `topic_${index}_${item.name || 'unnamed'}`,
    name: item.name,
    description: item.description || '',
    topicType: item.topicType || 'qa',
    entryBehavior: item.entryBehavior || 'direct_answer',
    linkedFlowId: item.linkedFlowId,
    linkedToolIds: item.linkedToolIds || [],
    linkedFunctionIds: item.linkedFunctionIds || [],
    enabled: item.enabled ?? true,
  };
}

export function loadQACategoryConfigs(): QACategoryConfig[] {
  if (!canUseBrowserStorage()) return DEFAULT_QA_CATEGORY_CONFIGS;
  try {
    const raw = window.localStorage.getItem(QA_TOPIC_STORAGE_KEY);
    if (!raw) return DEFAULT_QA_CATEGORY_CONFIGS;
    const parsed = JSON.parse(raw) as QACategoryConfig[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_QA_CATEGORY_CONFIGS;
    return parsed
      .filter((item) => item && item.name)
      .map(normalizeCategoryConfig);
  } catch {
    return DEFAULT_QA_CATEGORY_CONFIGS;
  }
}

export function saveQACategoryConfigs(categoryConfigs: QACategoryConfig[]): void {
  if (!canUseBrowserStorage()) return;
  const normalized = categoryConfigs.map(normalizeCategoryConfig);
  window.localStorage.setItem(QA_TOPIC_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(QA_TOPIC_EVENT, { detail: normalized }));
}

export function getQATopicStoreEventName() {
  return QA_TOPIC_EVENT;
}
