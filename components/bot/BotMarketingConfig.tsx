// 这个配置页决定某个机器人是否启用客户画像、营销推荐、自动跟进和结果回写。
import React from 'react';
import { AlertTriangle, CalendarClock, DatabaseZap, Megaphone, RotateCcw, ShieldCheck } from 'lucide-react';
import { BotConfiguration, BotMarketingConfig as BotOperationsConfig, MarketingCampaign, MarketingTriggerTiming, TouchProtectionPolicy } from '../../types';
import { Input, Label, Select, Switch } from '../ui/FormComponents';
import { MARKETING_TRIGGER_LABELS, MOCK_FOLLOW_UP_RULES } from '../marketing/mockCustomerOperations';

interface Props {
  config: BotConfiguration;
  updateField: <K extends keyof BotConfiguration>(key: K, value: BotConfiguration[K]) => void;
  campaigns: MarketingCampaign[];
}

type ConflictStrategy = 'service_first' | 'record_only' | 'disabled';
type OperationsFormConfig = Omit<BotOperationsConfig, 'touchProtection' | 'conflictStrategy'> & {
  conflictStrategy: ConflictStrategy;
  touchProtection: TouchProtectionPolicy;
};

const triggerOptions: MarketingTriggerTiming[] = ['post_resolution', 'price_inquiry', 'interest_detected', 'hesitation', 'pre_hangup'];
const EMPTY_CAMPAIGNS: MarketingCampaign[] = [];

// 兼容旧字段，并为新配置补齐默认值。
const getOperationsConfig = (config: BotConfiguration): OperationsFormConfig => {
  const legacyConflict: ConflictStrategy =
    config.marketingConflictStrategy === 'record_only' || config.marketingConflictStrategy === 'disabled'
      ? config.marketingConflictStrategy
      : 'service_first';

  return {
    profileRecognitionEnabled: config.customerOperationsConfig?.profileRecognitionEnabled ?? config.profileCollectionEnabled ?? false,
    autoExtractTags: config.customerOperationsConfig?.autoExtractTags ?? true,
    autoGenerateSummary: config.customerOperationsConfig?.autoGenerateSummary ?? true,
    autoDetectIntent: config.customerOperationsConfig?.autoDetectIntent ?? true,
    autoDetectFollowUpTime: config.customerOperationsConfig?.autoDetectFollowUpTime ?? true,
    marketingRecommendationEnabled: config.customerOperationsConfig?.marketingRecommendationEnabled ?? config.marketingEnabled ?? false,
    enabledCampaignIds: config.customerOperationsConfig?.enabledCampaignIds ?? config.activeCampaignIds ?? [],
    triggerTimings: config.customerOperationsConfig?.triggerTimings ?? (config.marketingTimings as MarketingTriggerTiming[] | undefined) ?? ['post_resolution'],
    conflictStrategy: config.customerOperationsConfig?.conflictStrategy === 'record_only' || config.customerOperationsConfig?.conflictStrategy === 'disabled'
      ? config.customerOperationsConfig.conflictStrategy
      : legacyConflict,
    followUpEnabled: config.customerOperationsConfig?.followUpEnabled ?? false,
    enabledFollowUpRuleIds: config.customerOperationsConfig?.enabledFollowUpRuleIds ?? [],
    defaultExecutionBotId: config.customerOperationsConfig?.defaultExecutionBotId ?? config.id,
    defaultExecutionFlowId: config.customerOperationsConfig?.defaultExecutionFlowId ?? 'main_flow',
    askWhenTimeUnclear: config.customerOperationsConfig?.askWhenTimeUnclear ?? true,
    defaultFollowUpDelayDays: config.customerOperationsConfig?.defaultFollowUpDelayDays ?? 3,
    touchProtection: config.customerOperationsConfig?.touchProtection ?? {
      maxDailyCalls: 1,
      maxWeeklyCalls: 3,
      avoidNightCalls: true,
      avoidHolidays: true,
      rejectCooldownDays: 14,
      blockComplaintRisk: true,
      blockBlacklist: true,
    },
    writeBackTags: config.customerOperationsConfig?.writeBackTags ?? true,
    writeBackSummary: config.customerOperationsConfig?.writeBackSummary ?? true,
    writeBackMarketingResult: config.customerOperationsConfig?.writeBackMarketingResult ?? true,
    writeBackFollowUpResult: config.customerOperationsConfig?.writeBackFollowUpResult ?? true,
    generateReportData: config.customerOperationsConfig?.generateReportData ?? true,
  };
};

const BotMarketingConfig: React.FC<Props> = ({ config, updateField, campaigns = EMPTY_CAMPAIGNS }) => {
  const operationsConfig = getOperationsConfig(config);

  const updateOperations = (patch: Partial<OperationsFormConfig>) => {
    const next = { ...operationsConfig, ...patch };
    updateField('customerOperationsConfig', next);

    // 同步旧字段，保证现有页面和数据仍能读取。
    if ('marketingRecommendationEnabled' in patch) updateField('marketingEnabled', next.marketingRecommendationEnabled);
    if ('enabledCampaignIds' in patch) updateField('activeCampaignIds', next.enabledCampaignIds);
    if ('triggerTimings' in patch) updateField('marketingTimings', next.triggerTimings);
    if ('conflictStrategy' in patch) updateField('marketingConflictStrategy', next.conflictStrategy);
    if ('profileRecognitionEnabled' in patch) updateField('profileCollectionEnabled', next.profileRecognitionEnabled);
  };

  const toggleCampaign = (id: string) => {
    const current = operationsConfig.enabledCampaignIds || [];
    updateOperations({ enabledCampaignIds: current.includes(id) ? current.filter(item => item !== id) : [...current, id] });
  };

  const toggleFollowUpRule = (id: string) => {
    const current = operationsConfig.enabledFollowUpRuleIds || [];
    updateOperations({ enabledFollowUpRuleIds: current.includes(id) ? current.filter(item => item !== id) : [...current, id] });
  };

  const toggleTiming = (timing: MarketingTriggerTiming) => {
    const current = operationsConfig.triggerTimings || [];
    updateOperations({ triggerTimings: current.includes(timing) ? current.filter(item => item !== timing) : [...current, timing] });
  };

  const updateProtection = (patch: Partial<TouchProtectionPolicy>) => {
    updateOperations({ touchProtection: { ...operationsConfig.touchProtection, ...patch } });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-slate-900">营销与跟进配置</h3>
        <p className="text-sm text-slate-500 mt-1">在机器人侧只做能力绑定，复杂规则在营销活动和自动跟进页面维护。</p>
      </div>

      <ConfigSection icon={<DatabaseZap size={20} />} title="能力绑定" desc="选择该机器人启用哪些客户运营能力，包含客户画像识别。">
        <div className="grid grid-cols-2 gap-x-6">
          <Switch label="启用画像识别" checked={operationsConfig.profileRecognitionEnabled} onChange={checked => updateOperations({ profileRecognitionEnabled: checked })} />
          <Switch label="通话结束后自动提取标签" checked={operationsConfig.autoExtractTags} onChange={checked => updateOperations({ autoExtractTags: checked })} />
          <Switch label="自动生成 AI 摘要" checked={operationsConfig.autoGenerateSummary} onChange={checked => updateOperations({ autoGenerateSummary: checked })} />
          <Switch label="自动识别用户意向" checked={operationsConfig.autoDetectIntent} onChange={checked => updateOperations({ autoDetectIntent: checked })} />
          <Switch label="自动识别跟进时间" checked={operationsConfig.autoDetectFollowUpTime} onChange={checked => updateOperations({ autoDetectFollowUpTime: checked })} />
        </div>
      </ConfigSection>

      <ConfigSection icon={<Megaphone size={20} />} title="绑定可用营销活动" desc="只选择活动范围；活动目标人群、话术和触发规则在营销活动页维护。">
        <Switch label="启用营销推荐" checked={operationsConfig.marketingRecommendationEnabled} onChange={checked => updateOperations({ marketingRecommendationEnabled: checked })} />
        <Label label="选择可用营销活动" />
        <div className="grid grid-cols-2 gap-3 mb-5">
          {campaigns.map(campaign => (
            <label key={campaign.id} className="flex items-start gap-3 border border-slate-200 rounded-lg p-3 cursor-pointer hover:bg-slate-50">
              <input type="checkbox" className="mt-1" checked={operationsConfig.enabledCampaignIds.includes(campaign.id)} onChange={() => toggleCampaign(campaign.id)} />
              <span>
                <span className="block text-sm font-medium text-slate-800">{campaign.name}</span>
                <span className="block text-xs text-slate-500 mt-1">{campaign.targetTags.join('、') || '全部客户'}</span>
              </span>
            </label>
          ))}
        </div>
        <Label label="允许的触发时机" />
        <div className="grid grid-cols-2 gap-3 mb-5">
          {triggerOptions.map(timing => (
            <label key={timing} className="flex items-center gap-3 border border-slate-200 rounded-lg p-3 cursor-pointer hover:bg-slate-50 text-sm">
              <input type="checkbox" checked={operationsConfig.triggerTimings.includes(timing)} onChange={() => toggleTiming(timing)} />
              {MARKETING_TRIGGER_LABELS[timing]}
            </label>
          ))}
        </div>
        <Select
          label="冲突策略"
          value={operationsConfig.conflictStrategy}
          options={[
            { label: '服务优先', value: 'service_first' },
            { label: '只记录不推荐', value: 'record_only' },
            { label: '禁止营销', value: 'disabled' },
          ]}
          onChange={event => updateOperations({ conflictStrategy: event.target.value as ConflictStrategy })}
        />
      </ConfigSection>

      <ConfigSection icon={<CalendarClock size={20} />} title="绑定自动跟进规则" desc="只选择规则范围；规则流程图在自动跟进页维护。">
        <div className="grid grid-cols-2 gap-x-6">
          <Switch label="启用自动跟进" checked={operationsConfig.followUpEnabled} onChange={checked => updateOperations({ followUpEnabled: checked })} />
          <Switch label="用户时间不明确时追问确认" checked={operationsConfig.askWhenTimeUnclear} onChange={checked => updateOperations({ askWhenTimeUnclear: checked })} />
          <Input label="默认执行机器人" value={operationsConfig.defaultExecutionBotId} onChange={event => updateOperations({ defaultExecutionBotId: event.target.value })} />
          <Input label="默认执行 Flow" value={operationsConfig.defaultExecutionFlowId} onChange={event => updateOperations({ defaultExecutionFlowId: event.target.value })} />
          <Input label="默认跟进时间" type="number" suffix="天后" value={operationsConfig.defaultFollowUpDelayDays} onChange={event => updateOperations({ defaultFollowUpDelayDays: Number(event.target.value) })} />
        </div>
        <Label label="选择可用跟进规则" />
        <div className="grid grid-cols-2 gap-3">
          {MOCK_FOLLOW_UP_RULES.map(rule => (
            <label key={rule.id} className="flex items-start gap-3 border border-slate-200 rounded-lg p-3 cursor-pointer hover:bg-slate-50">
              <input type="checkbox" className="mt-1" checked={operationsConfig.enabledFollowUpRuleIds.includes(rule.id)} onChange={() => toggleFollowUpRule(rule.id)} />
              <span>
                <span className="block text-sm font-medium text-slate-800">{rule.name}</span>
                <span className="block text-xs text-slate-500 mt-1">{(rule.flowNames && rule.flowNames.length > 0 ? rule.flowNames : rule.applicableFlowIds).join('、')}</span>
              </span>
            </label>
          ))}
        </div>
      </ConfigSection>

      <ConfigSection icon={<ShieldCheck size={20} />} title="策略模板" desc="为该机器人选择默认触达保护策略，规则内可继续细化。">
        <div className="grid grid-cols-3 gap-5">
          <Input label="每天最多外呼次数" type="number" value={operationsConfig.touchProtection.maxDailyCalls} onChange={event => updateProtection({ maxDailyCalls: Number(event.target.value) })} />
          <Input label="每周最多外呼次数" type="number" value={operationsConfig.touchProtection.maxWeeklyCalls} onChange={event => updateProtection({ maxWeeklyCalls: Number(event.target.value) })} />
          <Input label="拒绝后冷却期" type="number" suffix="天" value={operationsConfig.touchProtection.rejectCooldownDays} onChange={event => updateProtection({ rejectCooldownDays: Number(event.target.value) })} />
          <Switch label="夜间禁止外呼" checked={operationsConfig.touchProtection.avoidNightCalls} onChange={checked => updateProtection({ avoidNightCalls: checked })} />
          <Switch label="投诉风险客户禁止触达" checked={operationsConfig.touchProtection.blockComplaintRisk} onChange={checked => updateProtection({ blockComplaintRisk: checked })} />
          <Switch label="黑名单客户禁止触达" checked={operationsConfig.touchProtection.blockBlacklist} onChange={checked => updateProtection({ blockBlacklist: checked })} />
        </div>
        <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle size={14} className="mt-0.5" />
          触达保护优先级高于营销活动，命中保护条件时只记录原因，不自动外呼。
        </div>
      </ConfigSection>

      <ConfigSection icon={<RotateCcw size={20} />} title="结果回写" desc="通话、营销和跟进结果会回写到客户画像和报表。">
        <div className="grid grid-cols-2 gap-x-6">
          <Switch label="回写客户标签" checked={operationsConfig.writeBackTags} onChange={checked => updateOperations({ writeBackTags: checked })} />
          <Switch label="回写 AI 摘要" checked={operationsConfig.writeBackSummary} onChange={checked => updateOperations({ writeBackSummary: checked })} />
          <Switch label="回写营销结果" checked={operationsConfig.writeBackMarketingResult} onChange={checked => updateOperations({ writeBackMarketingResult: checked })} />
          <Switch label="回写跟进结果" checked={operationsConfig.writeBackFollowUpResult} onChange={checked => updateOperations({ writeBackFollowUpResult: checked })} />
          <Switch label="生成报表数据" checked={operationsConfig.generateReportData} onChange={checked => updateOperations({ generateReportData: checked })} />
        </div>
      </ConfigSection>
    </div>
  );
};

const ConfigSection: React.FC<{ icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }> = ({ icon, title, desc, children }) => (
  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
    <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-blue-50 text-primary flex items-center justify-center">{icon}</div>
      <div>
        <h4 className="font-bold text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

export default BotMarketingConfig;
