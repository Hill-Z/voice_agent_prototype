// 这个页面配置语音机器人可推荐的营销活动，并展示触达、拒绝和转化效果。
import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Megaphone,
  PlayCircle,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { MarketingCampaign, MarketingGoal, MarketingTriggerTiming } from '../../types';
import { Input, Label, Select, Switch, TagInput } from '../ui/FormComponents';
import { CAMPAIGN_GOAL_LABELS, MARKETING_TRIGGER_LABELS, MOCK_MARKETING_CAMPAIGNS } from './mockCustomerOperations';

interface CampaignManagerProps {
  campaigns?: MarketingCampaign[];
  onUpdateCampaigns?: (campaigns: MarketingCampaign[]) => void;
}

export const MOCK_CAMPAIGNS: MarketingCampaign[] = MOCK_MARKETING_CAMPAIGNS;

const goalOptions: { label: string; value: MarketingGoal }[] = [
  { label: '转化', value: 'conversion' },
  { label: '续费', value: 'renewal' },
  { label: '唤醒', value: 'reactivation' },
  { label: '关怀', value: 'care' },
  { label: '回访', value: 'follow_up' },
];

const triggerOptions: { label: string; value: MarketingTriggerTiming }[] = [
  { label: '业务办理完成后', value: 'post_resolution' },
  { label: '用户主动问价格/优惠时', value: 'price_inquiry' },
  { label: '用户表达兴趣时', value: 'interest_detected' },
  { label: '用户犹豫时', value: 'hesitation' },
  { label: '通话结束前', value: 'pre_hangup' },
];

const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '进行中', value: 'active' },
  { label: '待开始', value: 'scheduled' },
  { label: '已结束', value: 'ended' },
];

// 根据活动状态展示徽标。
const getStatusBadge = (status: MarketingCampaign['status']) => {
  switch (status) {
    case 'active':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-50 text-green-700 border border-green-100"><CheckCircle2 size={10} className="mr-1" /> 进行中</span>;
    case 'scheduled':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100"><Clock size={10} className="mr-1" /> 待开始</span>;
    case 'ended':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">已结束</span>;
    default:
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">草稿</span>;
  }
};

// 切换多选值。
const toggleValue = <T extends string,>(values: T[] = [], value: T) => (
  values.includes(value) ? values.filter(item => item !== value) : [...values, value]
);

// 计算活动转化率。
const conversionRate = (campaign: MarketingCampaign) => {
  const exposure = campaign.stats?.exposureCount ?? campaign.exposureCount;
  const conversion = campaign.stats?.conversionCount ?? campaign.conversionCount;
  return exposure > 0 ? ((conversion / exposure) * 100).toFixed(1) : '0.0';
};

const InfoBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-slate-50 border border-slate-100 p-3">
    <p className="text-xs text-slate-400">{label}</p>
    <p className="text-sm font-semibold text-slate-800 mt-1">{value}</p>
  </div>
);

export default function CampaignManager({ campaigns: propCampaigns, onUpdateCampaigns }: CampaignManagerProps = {}) {
  const [localCampaigns, setLocalCampaigns] = useState<MarketingCampaign[]>(MOCK_CAMPAIGNS);
  const campaigns = propCampaigns || localCampaigns;
  const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
  const [editingItem, setEditingItem] = useState<MarketingCampaign | null>(null);
  const [formData, setFormData] = useState<Partial<MarketingCampaign>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const updateCampaigns = (next: MarketingCampaign[]) => {
    if (onUpdateCampaigns) onUpdateCampaigns(next);
    else setLocalCampaigns(next);
  };

  const filteredCampaigns = useMemo(() => {
    const keyword = searchTerm.trim();
    if (!keyword) return campaigns;
    return campaigns.filter(item =>
      item.name.includes(keyword) ||
      item.targetTags.some(tag => tag.includes(keyword)) ||
      item.speechContent.includes(keyword)
    );
  }, [campaigns, searchTerm]);

  const handleCreate = () => {
    setFormData({
      name: '',
      status: 'draft',
      goal: 'conversion',
      priority: 3,
      targetRegions: [],
      targetTags: [],
      excludeTags: [],
      targetLastCallResults: [],
      requireNoRecentTouch: true,
      requireFollowUpTask: false,
      excludeRiskTags: ['投诉风险', '黑名单'],
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      speechContent: '',
      speechVariants: [],
      interestedReply: '',
      rejectedReply: '',
      triggerTimings: ['post_resolution'],
      executableBotIds: [],
      executableFlowIds: [],
      requireUserConfirmation: true,
      allowAutoFollowUp: false,
      exposureCount: 0,
      conversionCount: 0,
      stats: { exposureCount: 0, interestedCount: 0, rejectedCount: 0, transferCount: 0, conversionCount: 0, negativeFeedbackCount: 0 },
    });
    setEditingItem(null);
    setView('FORM');
  };

  const handleEdit = (item: MarketingCampaign) => {
    setFormData({ ...item });
    setEditingItem(item);
    setView('FORM');
  };

  const handleSave = () => {
    const payload = {
      ...formData,
      id: editingItem?.id || `campaign_${Date.now()}`,
      name: formData.name || '未命名活动',
      status: formData.status || 'draft',
      goal: formData.goal || 'conversion',
      priority: formData.priority || 3,
      targetRegions: formData.targetRegions || [],
      targetTags: formData.targetTags || [],
      speechContent: formData.speechContent || '',
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      endDate: formData.endDate || '',
      exposureCount: formData.exposureCount || 0,
      conversionCount: formData.conversionCount || 0,
    } as MarketingCampaign;
    const next = editingItem
      ? campaigns.map(item => (item.id === editingItem.id ? payload : item))
      : [payload, ...campaigns];
    updateCampaigns(next);
    setView('LIST');
  };

  const removeCampaign = (id: string) => {
    updateCampaigns(campaigns.filter(item => item.id !== id));
  };

  if (view === 'FORM') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{editingItem ? '编辑营销活动' : '新建营销活动'}</h2>
            <p className="text-sm text-slate-500 mt-1">服务优先：先完成用户主诉求，再判断是否推荐活动。</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView('LIST')} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              <X size={14} className="inline mr-1" />取消
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded-lg text-sm shadow-sm hover:bg-primary/90">
              保存活动
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[220px_1fr] gap-4">
          <div className="bg-white border border-slate-200 p-4 h-fit">
            <h3 className="font-semibold text-slate-900">配置目录</h3>
            {['基础信息', '目标人群规则', '排除人群规则', '触发规则', '语音话术', '关联执行'].map(item => (
              <div key={item} className="mt-3 px-3 py-2 text-sm border border-slate-100 bg-slate-50 text-slate-600">{item}</div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 p-5 space-y-8">
          <section>
            <h3 className="font-bold text-slate-800 mb-4">基础信息</h3>
            <div className="grid grid-cols-2 gap-5">
              <Input label="活动名称" required value={formData.name || ''} onChange={event => setFormData({ ...formData, name: event.target.value })} />
              <Select
                label="活动目标"
                value={formData.goal || 'conversion'}
                options={goalOptions}
                onChange={event => setFormData({ ...formData, goal: event.target.value as MarketingGoal })}
              />
              <Select
                label="活动状态"
                value={formData.status || 'draft'}
                options={statusOptions}
                onChange={event => setFormData({ ...formData, status: event.target.value as MarketingCampaign['status'] })}
              />
              <Input label="优先级" type="number" value={formData.priority || 1} onChange={event => setFormData({ ...formData, priority: Number(event.target.value) })} />
              <Input label="开始日期" type="date" value={formData.startDate || ''} onChange={event => setFormData({ ...formData, startDate: event.target.value })} />
              <Input label="结束日期" type="date" value={formData.endDate || ''} onChange={event => setFormData({ ...formData, endDate: event.target.value })} />
            </div>
          </section>

          <section>
            <h3 className="font-bold text-slate-800 mb-4">目标人群规则</h3>
            <div className="grid grid-cols-2 gap-5">
              <TagInput label="目标标签" tags={formData.targetTags || []} onChange={tags => setFormData({ ...formData, targetTags: tags })} placeholder="例如：高意向、VIP客户" />
              <TagInput label="地区" tags={formData.targetRegions || []} onChange={tags => setFormData({ ...formData, targetRegions: tags })} placeholder="例如：上海、北京" />
              <TagInput label="最近通话结果" tags={formData.targetLastCallResults || []} onChange={tags => setFormData({ ...formData, targetLastCallResults: tags })} placeholder="例如：已解决、有意向" />
            </div>
          </section>

          <section>
            <h3 className="font-bold text-slate-800 mb-4">排除人群规则</h3>
            <div className="grid grid-cols-2 gap-5">
              <TagInput label="排除标签" tags={formData.excludeTags || []} onChange={tags => setFormData({ ...formData, excludeTags: tags })} placeholder="例如：拒绝营销、黑名单" />
              <TagInput label="排除风险标签" tags={formData.excludeRiskTags || []} onChange={tags => setFormData({ ...formData, excludeRiskTags: tags })} placeholder="例如：投诉风险、黑名单" />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <Switch label="最近未触达才推荐" checked={Boolean(formData.requireNoRecentTouch)} onChange={checked => setFormData({ ...formData, requireNoRecentTouch: checked })} />
              <Switch label="要求存在跟进任务" checked={Boolean(formData.requireFollowUpTask)} onChange={checked => setFormData({ ...formData, requireFollowUpTask: checked })} />
              <Switch label="排除风险标签" checked={(formData.excludeRiskTags || []).length > 0} onChange={checked => setFormData({ ...formData, excludeRiskTags: checked ? ['投诉风险', '黑名单'] : [] })} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <InfoBox label="命中预估" value="约 1,280 人" />
              <InfoBox label="排除人数" value="约 96 人" />
              <InfoBox label="可触达人数" value="约 1,184 人" />
            </div>
          </section>

          <section>
            <h3 className="font-bold text-slate-800 mb-4">语音话术</h3>
            <Label label="主话术" />
            <textarea
              value={formData.speechContent || ''}
              onChange={event => setFormData({ ...formData, speechContent: event.target.value })}
              className="w-full min-h-[120px] border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="例如：您的问题已经处理完成，另外目前有一个适合您的优惠活动，是否需要我简单介绍一下？"
            />
            <div className="grid grid-cols-2 gap-5 mt-5">
              <Input label="用户感兴趣后的追问话术" value={formData.interestedReply || ''} onChange={event => setFormData({ ...formData, interestedReply: event.target.value })} />
              <Input label="用户拒绝后的结束话术" value={formData.rejectedReply || ''} onChange={event => setFormData({ ...formData, rejectedReply: event.target.value })} />
            </div>
            <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 flex items-center justify-between">
              <span>不同标签的话术版本可按客户标签差异化表达，避免所有客户听到同一段话。</span>
              <button type="button" className="inline-flex items-center px-3 py-1.5 rounded bg-white border border-slate-200 text-slate-600">
                <PlayCircle size={14} className="mr-1" /> TTS 试听入口
              </button>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-slate-800 mb-4">触发规则</h3>
            <div className="grid grid-cols-2 gap-3">
              {triggerOptions.map(option => (
                <label key={option.value} className="flex items-center gap-3 border border-slate-200 rounded-lg p-3 text-sm cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={(formData.triggerTimings || []).includes(option.value)}
                    onChange={() => setFormData({ ...formData, triggerTimings: toggleValue(formData.triggerTimings, option.value) })}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </section>

          <section>
            <h3 className="font-bold text-slate-800 mb-4">关联执行</h3>
            <div className="grid grid-cols-2 gap-5">
              <TagInput label="可执行机器人" tags={formData.executableBotIds || []} onChange={tags => setFormData({ ...formData, executableBotIds: tags })} placeholder="例如：滴滴出行智能客服" />
              <TagInput label="关联 Flow" tags={formData.executableFlowIds || []} onChange={tags => setFormData({ ...formData, executableFlowIds: tags })} placeholder="例如：main_flow、renewal_flow" />
              <Switch label="是否需要用户确认" checked={Boolean(formData.requireUserConfirmation)} onChange={checked => setFormData({ ...formData, requireUserConfirmation: checked })} />
              <Switch label="是否允许自动生成跟进任务" checked={Boolean(formData.allowAutoFollowUp)} onChange={checked => setFormData({ ...formData, allowAutoFollowUp: checked })} />
            </div>
          </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">营销活动</h2>
          <p className="text-sm text-slate-500 mt-1">配置机器人可以推荐什么、对谁推荐、什么时候推荐。</p>
        </div>
        <button onClick={handleCreate} className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg text-sm shadow-sm hover:bg-primary/90">
          <Plus size={16} className="mr-1" /> 新建活动
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-500">触达次数</p>
          <p className="text-2xl font-bold mt-1">{campaigns.reduce((sum, item) => sum + (item.stats?.exposureCount || item.exposureCount || 0), 0)}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-500">感兴趣次数</p>
          <p className="text-2xl font-bold mt-1">{campaigns.reduce((sum, item) => sum + (item.stats?.interestedCount || 0), 0)}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-500">转化次数</p>
          <p className="text-2xl font-bold mt-1">{campaigns.reduce((sum, item) => sum + (item.stats?.conversionCount || item.conversionCount || 0), 0)}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-500">负反馈</p>
          <p className="text-2xl font-bold mt-1">{campaigns.reduce((sum, item) => sum + (item.stats?.negativeFeedbackCount || 0), 0)}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">活动列表</h3>
            <p className="text-xs text-slate-500 mt-1">默认服务优先，不做强营销插播。</p>
          </div>
          <div className="relative w-72">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="搜索活动、标签或话术"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredCampaigns.map(campaign => (
            <div key={campaign.id} className="p-5 hover:bg-slate-50">
              <div className="flex items-start justify-between gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Megaphone size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{campaign.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(campaign.status)}
                        <span className="text-xs text-slate-500">活动目标：{CAMPAIGN_GOAL_LABELS[campaign.goal || 'conversion']}</span>
                        <span className="text-xs text-slate-500">优先级：{campaign.priority || 1}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 mt-3 line-clamp-2">{campaign.speechContent}</p>
                  <div className="grid grid-cols-3 gap-4 mt-4 text-xs text-slate-500">
                    <div>
                      <p className="font-semibold text-slate-700 mb-1">目标人群</p>
                      {(campaign.targetTags || []).join('、') || '全部客户'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 mb-1">触发时机</p>
                      {(campaign.triggerTimings || []).map(item => MARKETING_TRIGGER_LABELS[item]).join('、') || '未配置'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 mb-1">关联 Flow</p>
                      {(campaign.executableFlowIds || []).join('、') || '未绑定'}
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-3 mt-4">
                    {[
                      ['触达', campaign.stats?.exposureCount ?? campaign.exposureCount],
                      ['感兴趣', campaign.stats?.interestedCount ?? 0],
                      ['拒绝', campaign.stats?.rejectedCount ?? 0],
                      ['转人工', campaign.stats?.transferCount ?? 0],
                      ['转化', campaign.stats?.conversionCount ?? campaign.conversionCount],
                      ['转化率', conversionRate(campaign) + '%'],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-slate-50 rounded-lg p-3">
                        <p className="text-[11px] text-slate-400">{label}</p>
                        <p className="text-sm font-bold text-slate-800 mt-1">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(campaign)} className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-primary hover:border-primary">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => removeCampaign(campaign.id)} className="p-2 border border-red-100 rounded-lg text-red-500 hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 flex items-start gap-3 text-sm text-blue-900">
        <BarChart3 size={18} className="mt-0.5" />
        <div>
          <p className="font-bold">效果统计口径</p>
          <p className="mt-1">活动会记录触达、感兴趣、拒绝、转人工、转化和负反馈次数，后续可同步到监控报表。</p>
        </div>
      </div>
    </div>
  );
}
