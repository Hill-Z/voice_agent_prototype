// 工具执行分级策略：根据工具参数选择自动、确认或人工处理方式。
import { AgentTool, ToolExecutionLevel, ToolExecutionRule } from '../types';

export interface ToolExecutionDecision {
  level: ToolExecutionLevel;
  matchedRuleId?: string;
  parameterName?: string;
}

const normalizeText = (value: unknown): string => String(value ?? '').trim();

const compare = (
  actual: unknown,
  operator: ToolExecutionRule['operator'],
  expected: string,
  parameterType?: string,
): boolean => {
  const normalizedType = parameterType?.toLowerCase();
  const isNumericType = normalizedType === 'number'
    || normalizedType === 'integer'
    || normalizedType === 'float'
    || normalizedType === 'decimal';
  const expectedText = expected.trim();

  if (!isNumericType) {
    return operator === 'eq' && normalizeText(actual) === expectedText;
  }

  const actualNumber = typeof actual === 'number' ? actual : Number(actual);
  const expectedNumber = Number(expectedText);
  if (!Number.isFinite(actualNumber) || !Number.isFinite(expectedNumber)) {
    return false;
  }

  if (operator === 'lt') return actualNumber < expectedNumber;
  if (operator === 'lte') return actualNumber <= expectedNumber;
  if (operator === 'eq') return actualNumber === expectedNumber;
  if (operator === 'gte') return actualNumber >= expectedNumber;
  return actualNumber > expectedNumber;
};

// 规则按配置顺序匹配，未命中时使用工具默认执行方式。
export function evaluateToolExecution(
  tool: AgentTool,
  parameters: Record<string, unknown>,
): ToolExecutionDecision {
  const parameterTypes = new Map(tool.parameters.map((parameter) => [parameter.name, parameter.type]));
  const matchedRule = (tool.executionRules || []).find((rule) => (
    Object.prototype.hasOwnProperty.call(parameters, rule.parameterName)
      && compare(
        parameters[rule.parameterName],
        rule.operator,
        rule.compareValue,
        parameterTypes.get(rule.parameterName),
      )
  ));

  if (matchedRule) {
    return {
      level: matchedRule.action,
      matchedRuleId: matchedRule.id,
      parameterName: matchedRule.parameterName,
    };
  }

  return { level: tool.executionLevel || 'auto' };
}
