import { BotVariable, BUILT_IN_FUNCTIONS, FlowFunction, QACategoryConfig, BotConfiguration } from '../types';

type TopicBinding = NonNullable<BotConfiguration['topicBindings']>[number];
type DelayProfile = NonNullable<NonNullable<BotConfiguration['agentConfig']>['delayProfiles']>[number];

export function mergeFunctionCatalog(functions: FlowFunction[] = []): FlowFunction[] {
  const merged = [...BUILT_IN_FUNCTIONS, ...functions];
  const seen = new Set<string>();
  return merged.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function getStateVariableOptions(variables: BotVariable[] = []): BotVariable[] {
  return variables.filter((item) => !item.isSystem && item.isStateful);
}

export function getDelayProfileOptions(delayProfiles: DelayProfile[] = []): DelayProfile[] {
  return [...delayProfiles];
}

export function syncTopicBindingsWithCategories(
  categories: QACategoryConfig[] = [],
  bindings: TopicBinding[] = [],
): TopicBinding[] {
  const categoryByName = new Map(categories.map((item) => [item.name, item]));
  return bindings
    .map((binding) => {
      const matchedCategory = categoryByName.get(binding.categoryName);
      if (!matchedCategory) return null;
      return {
        ...binding,
        categoryId: matchedCategory.id,
        categoryName: matchedCategory.name,
      };
    })
    .filter((item): item is TopicBinding => Boolean(item));
}
