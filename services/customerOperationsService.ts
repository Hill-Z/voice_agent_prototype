// 这个服务提供客户画像、营销活动和自动跟进的前端模拟决策逻辑。
import type {
  CustomerProfile,
  FollowUpRule,
  FollowUpTask,
  FollowUpTaskStatus,
  MarketingCampaign,
  MarketingTriggerTiming,
} from '../types';

interface FollowUpDraftInput {
  utterance: string;
  profile: CustomerProfile;
  rule: FollowUpRule;
  sourceCallId: string;
  sourceBotName: string;
  sourceFlowName: string;
  now: number;
}

interface RetryResult {
  status: FollowUpTaskStatus;
  retryCount: number;
  latestResult: string;
  plannedCallTime?: number;
}

// 判断客户是否允许触达。
export const canTouchCustomer = (profile: CustomerProfile) => {
  const reasons: string[] = [];
  const tagNames = new Set([...(profile.tags || []), ...(profile.structuredTags || []).map(tag => tag.name)]);

  if (profile.riskStatus === '投诉风险') reasons.push('投诉风险客户禁止触达');
  if (profile.riskStatus === '黑名单') reasons.push('黑名单客户禁止触达');
  if (tagNames.has('拒绝营销') || profile.marketingStatus === '已拒绝') reasons.push('客户已拒绝营销，处于冷却或禁触达状态');
  if (profile.marketingStatus === '冷却中' || profile.marketingStatus === '禁止触达') reasons.push(`营销状态为${profile.marketingStatus}`);

  return {
    allowed: reasons.length === 0,
    reasons,
  };
};

// 按客户标签、地区、风险和触发时机匹配可推荐活动。
export const matchMarketingCampaigns = (
  profile: CustomerProfile,
  campaigns: MarketingCampaign[],
  timing: MarketingTriggerTiming
) => {
  const protection = canTouchCustomer(profile);
  if (!protection.allowed) return [];

  const tagNames = new Set([...(profile.tags || []), ...(profile.structuredTags || []).map(tag => tag.name)]);

  return campaigns
    .filter(campaign => campaign.status === 'active')
    .filter(campaign => (campaign.triggerTimings || []).includes(timing))
    .filter(campaign => campaign.targetRegions.length === 0 || campaign.targetRegions.includes(profile.region))
    .filter(campaign => campaign.targetTags.length === 0 || campaign.targetTags.some(tag => tagNames.has(tag)))
    .filter(campaign => !(campaign.excludeTags || []).some(tag => tagNames.has(tag)))
    .filter(campaign => !(campaign.targetLastCallResults || []).length || campaign.targetLastCallResults?.includes(profile.lastCallResult || ''))
    .filter(campaign => !campaign.requireFollowUpTask || profile.followUpStatus === '待跟进')
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
};

// 从用户表达里识别“稍后联系”并生成跟进任务。
export const createFollowUpTaskFromUtterance = (input: FollowUpDraftInput): FollowUpTask | null => {
  const normalized = input.utterance.trim();
  const shouldFollow =
    /稍后|再联系|再打|考虑一下|下周|明天|后天|\d+\s*天后/.test(normalized) &&
    input.rule.enabled;

  if (!shouldFollow) return null;

  const daysMatch = normalized.match(/(\d+)\s*天后/);
  const days = daysMatch ? Number(daysMatch[1]) : input.rule.defaultDelayDays;
  const plannedCallTime = input.now + days * 24 * 60 * 60 * 1000;

  return {
    id: `follow_${input.profile.id}_${plannedCallTime}`,
    ruleId: input.rule.id,
    customerId: input.profile.id,
    customerName: input.profile.name,
    phoneNumber: input.profile.phoneNumber,
    sourceCallId: input.sourceCallId,
    sourceBotName: input.sourceBotName,
    sourceFlowName: input.sourceFlowName,
    reason: `用户表达稍后联系：${normalized}`,
    plannedCallTime,
    executionBotId: input.rule.executionBotId || input.rule.applicableBotIds[0] || 'default_bot',
    executionBotName: input.sourceBotName,
    executionFlowId: input.rule.executionFlowId || input.rule.applicableFlowIds[0] || 'main_flow',
    executionFlowName: input.sourceFlowName,
    status: 'pending',
    retryCount: 0,
    createdAt: input.now,
    attempts: [],
    latestResult: '任务已生成，等待到期外呼',
  };
};

// 未接通后按规则计算下一步状态。
export const applyNoAnswerRetry = (task: FollowUpTask, rule: FollowUpRule, now: number): RetryResult => {
  const nextRetryCount = task.retryCount + 1;
  if (nextRetryCount >= rule.retryPolicy.maxRetries) {
    const finalStatus: FollowUpTaskStatus = rule.retryPolicy.failureAction === 'transfer' ? 'transferred' : 'failed';
    return {
      status: finalStatus,
      retryCount: nextRetryCount,
      latestResult: finalStatus === 'transferred' ? '多次未接通，已转人工跟进' : '达到最大重试次数，任务失败',
    };
  }

  return {
    status: 'pending',
    retryCount: nextRetryCount,
    plannedCallTime: now + rule.retryPolicy.retryIntervalHours * 60 * 60 * 1000,
    latestResult: `未接通，将在 ${rule.retryPolicy.retryIntervalHours} 小时后重试`,
  };
};
