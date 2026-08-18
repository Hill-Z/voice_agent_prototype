import assert from 'node:assert/strict';

const canTouchCustomer = (profile) => {
  const reasons = [];
  const tagNames = new Set([...(profile.tags || []), ...(profile.structuredTags || []).map(tag => tag.name)]);
  if (profile.riskStatus === '投诉风险') reasons.push('投诉风险客户禁止触达');
  if (profile.riskStatus === '黑名单') reasons.push('黑名单客户禁止触达');
  if (tagNames.has('拒绝营销') || profile.marketingStatus === '已拒绝') reasons.push('客户已拒绝营销，处于冷却或禁触达状态');
  if (profile.marketingStatus === '冷却中' || profile.marketingStatus === '禁止触达') reasons.push(`营销状态为${profile.marketingStatus}`);
  return { allowed: reasons.length === 0, reasons };
};

const matchMarketingCampaigns = (profile, campaigns, timing) => {
  const protection = canTouchCustomer(profile);
  if (!protection.allowed) return [];
  const tagNames = new Set([...(profile.tags || []), ...(profile.structuredTags || []).map(tag => tag.name)]);
  return campaigns
    .filter(campaign => campaign.status === 'active')
    .filter(campaign => (campaign.triggerTimings || []).includes(timing))
    .filter(campaign => campaign.targetRegions.length === 0 || campaign.targetRegions.includes(profile.region))
    .filter(campaign => campaign.targetTags.length === 0 || campaign.targetTags.some(tag => tagNames.has(tag)))
    .filter(campaign => !(campaign.excludeTags || []).some(tag => tagNames.has(tag)))
    .filter(campaign => !(campaign.targetLastCallResults || []).length || campaign.targetLastCallResults.includes(profile.lastCallResult || ''))
    .filter(campaign => !campaign.requireFollowUpTask || profile.followUpStatus === '待跟进')
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
};

const createFollowUpTaskFromUtterance = (input) => {
  const normalized = input.utterance.trim();
  const shouldFollow = /稍后|再联系|再打|考虑一下|下周|明天|后天|\d+\s*天后/.test(normalized) && input.rule.enabled;
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

const applyNoAnswerRetry = (task, rule, now) => {
  const nextRetryCount = task.retryCount + 1;
  if (nextRetryCount >= rule.retryPolicy.maxRetries) {
    const finalStatus = rule.retryPolicy.failureAction === 'transfer' ? 'transferred' : 'failed';
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

const now = new Date('2026-05-25T10:00:00+08:00').getTime();

const allowedCustomer = {
  id: 'customer_001',
  name: '张伟',
  phoneNumber: '13800001111',
  region: '上海',
  tags: ['高意向', '老客户'],
  structuredTags: [{ name: '高意向' }],
  marketingStatus: '可推荐',
  followUpStatus: '待跟进',
  riskStatus: '正常',
  lastCallResult: '已解决',
  lastInteraction: now,
};

const blockedCustomer = {
  ...allowedCustomer,
  id: 'customer_002',
  name: '赵敏',
  riskStatus: '投诉风险',
  tags: ['拒绝营销'],
  marketingStatus: '已拒绝',
};

const campaigns = [
  {
    id: 'campaign_001',
    name: '老客户续费优惠推荐',
    status: 'active',
    priority: 8,
    targetRegions: ['上海'],
    targetTags: ['高意向'],
    excludeTags: ['拒绝营销'],
    targetLastCallResults: ['已解决'],
    triggerTimings: ['post_resolution'],
  },
  {
    id: 'campaign_002',
    name: '非目标活动',
    status: 'active',
    priority: 1,
    targetRegions: ['北京'],
    targetTags: ['沉睡客户'],
    excludeTags: [],
    triggerTimings: ['post_resolution'],
  },
];

const followUpRule = {
  id: 'rule_001',
  name: '稍后联系自动外呼',
  enabled: true,
  applicableBotIds: ['bot_001'],
  applicableFlowIds: ['main_flow'],
  executionBotId: 'bot_001',
  executionFlowId: 'main_flow',
  defaultDelayDays: 3,
  retryPolicy: {
    maxRetries: 2,
    retryIntervalHours: 6,
    failureAction: 'transfer',
  },
};

const matchedCampaigns = matchMarketingCampaigns(allowedCustomer, campaigns, 'post_resolution');
assert.equal(matchedCampaigns[0]?.name, '老客户续费优惠推荐');

const protection = canTouchCustomer(blockedCustomer);
assert.equal(protection.allowed, false);
assert.ok(protection.reasons.includes('投诉风险客户禁止触达'));

const task = createFollowUpTaskFromUtterance({
  utterance: '我现在不方便，7天后再联系我',
  profile: allowedCustomer,
  rule: followUpRule,
  sourceCallId: 'call_test',
  sourceBotName: '滴滴出行智能客服',
  sourceFlowName: '主入口 Flow',
  now,
});

assert.ok(task);
assert.equal(task.reason.includes('用户表达稍后联系'), true);
assert.equal(task.status, 'pending');

const retry = applyNoAnswerRetry({ ...task, retryCount: 0 }, followUpRule, task.plannedCallTime);
assert.equal(retry.status, 'pending');
assert.equal(retry.retryCount, 1);

console.log('customer operations behavior ok');
