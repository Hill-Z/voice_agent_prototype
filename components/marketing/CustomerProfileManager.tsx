// 这个页面展示语音机器人沉淀的客户画像，复用营销和自动跟进的演示数据。
import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CalendarClock,
  History,
  Megaphone,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  UserSquare,
  X,
} from 'lucide-react';
import { CustomerInteraction, CustomerProfile, CustomerTag } from '../../types';
import { formatDateTime, MOCK_CUSTOMER_PROFILES, MOCK_MARKETING_CAMPAIGNS } from './mockCustomerOperations';

const TAG_TYPE_LABELS: Record<CustomerTag['type'], string> = {
  basic: '基础',
  behavior: '行为',
  intent: '意向',
  risk: '风险',
  result: '结果',
};

const TAG_SOURCE_LABELS: Record<CustomerTag['source'], string> = {
  call_recognition: '通话识别',
  manual: '人工标记',
  marketing_result: '营销结果',
  follow_up_result: '跟进结果',
};

const CONFIDENCE_LABELS: Record<CustomerTag['confidence'], string> = {
  high: '高',
  medium: '中',
  low: '低',
};

// 根据状态文案选择不同的徽标颜色。
const statusClass = (value?: string) => {
  if (!value) return 'bg-slate-50 text-slate-500 border-slate-100';
  if (value.includes('禁止') || value.includes('风险') || value.includes('拒绝')) return 'bg-red-50 text-red-600 border-red-100';
  if (value.includes('待') || value.includes('中') || value.includes('冷却')) return 'bg-amber-50 text-amber-700 border-amber-100';
  if (value.includes('完成') || value.includes('可') || value.includes('正常')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  return 'bg-slate-50 text-slate-600 border-slate-100';
};

// 通用徽标。
const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span className={'inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium ' + className}>{children}</span>
);

const FilterSelect: React.FC<{ value: string; options: string[]; onChange: (value: string) => void }> = ({ value, options, onChange }) => (
  <select
    value={value}
    onChange={event => onChange(event.target.value)}
    className="w-full px-3 py-2 border border-slate-200 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
  >
    {options.map(option => <option key={option} value={option}>{option}</option>)}
  </select>
);

// 给不同互动记录匹配图标。
const interactionIcon = (type: CustomerInteraction['type']) => {
  if (type === 'marketing') return <Megaphone size={14} />;
  if (type === 'follow_up') return <CalendarClock size={14} />;
  if (type === 'manual') return <ShieldCheck size={14} />;
  return <Phone size={14} />;
};

// 给标签类型匹配颜色。
const tagClass = (tag: CustomerTag) => {
  if (tag.type === 'risk') return 'bg-red-50 text-red-600 border-red-100';
  if (tag.type === 'intent') return 'bg-blue-50 text-blue-700 border-blue-100';
  if (tag.type === 'result') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  return 'bg-slate-50 text-slate-600 border-slate-100';
};

export default function CustomerProfileManager() {
  const [profiles] = useState<CustomerProfile[]>(MOCK_CUSTOMER_PROFILES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<CustomerProfile | null>(null);
  const [levelFilter, setLevelFilter] = useState('全部等级');
  const [riskFilter, setRiskFilter] = useState('全部风险');
  const [marketingFilter, setMarketingFilter] = useState('全部营销状态');
  const [followUpFilter, setFollowUpFilter] = useState('全部跟进状态');

  const filteredProfiles = useMemo(() => {
    const keyword = searchTerm.trim();
    return profiles.filter(profile => {
      const matchedKeyword = !keyword || [profile.name, profile.phoneNumber, profile.region, profile.customerLevel, ...(profile.tags || [])]
        .filter(Boolean)
        .some(value => String(value).includes(keyword));
      const matchedLevel = levelFilter === '全部等级' || profile.customerLevel === levelFilter;
      const matchedRisk = riskFilter === '全部风险' || profile.riskStatus === riskFilter;
      const matchedMarketing = marketingFilter === '全部营销状态' || profile.marketingStatus === marketingFilter;
      const matchedFollowUp = followUpFilter === '全部跟进状态' || profile.followUpStatus === followUpFilter;
      return matchedKeyword && matchedLevel && matchedRisk && matchedMarketing && matchedFollowUp;
    });
  }, [profiles, searchTerm, levelFilter, riskFilter, marketingFilter, followUpFilter]);

  const overview = useMemo(() => {
    return [
      { label: '客户总数', value: profiles.length, icon: UserSquare, tone: 'bg-blue-50 text-blue-600' },
      { label: '可推荐', value: profiles.filter(item => item.marketingStatus === '可推荐').length, icon: Megaphone, tone: 'bg-emerald-50 text-emerald-600' },
      { label: '待跟进', value: profiles.filter(item => item.followUpStatus === '待跟进').length, icon: CalendarClock, tone: 'bg-amber-50 text-amber-600' },
      { label: '风险客户', value: profiles.filter(item => item.riskStatus && item.riskStatus !== '正常').length, icon: AlertTriangle, tone: 'bg-red-50 text-red-600' },
    ];
  }, [profiles]);

  const recommendedCampaigns = selectedProfile
    ? MOCK_MARKETING_CAMPAIGNS.filter(campaign => selectedProfile.recommendedCampaignIds?.includes(campaign.id))
    : [];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">客户画像</h2>
          <p className="text-sm text-slate-500 mt-1">按标签、风险、营销和跟进状态管理语音机器人客户资产。</p>
        </div>
        <button className="px-3 py-2 text-sm border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded">导出客户</button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {overview.map(item => (
          <div key={item.label} className="bg-white border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{item.value}</p>
              </div>
              <div className={'h-10 w-10 rounded-xl flex items-center justify-center ' + item.tone}>
                <item.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div>
            <h3 className="font-semibold text-slate-800">客户筛选</h3>
            <p className="text-xs text-slate-500 mt-1">从通话、营销、跟进和人工标记中筛选可运营客户。</p>
          </div>
          <div className="grid grid-cols-5 gap-3 mt-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="姓名、手机号、地区或标签"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <FilterSelect value={levelFilter} onChange={setLevelFilter} options={['全部等级', '普通客户', 'VIP客户', '企业客户', '高价值客户']} />
            <FilterSelect value={riskFilter} onChange={setRiskFilter} options={['全部风险', '正常', '投诉风险', '情绪异常', '黑名单']} />
            <FilterSelect value={marketingFilter} onChange={setMarketingFilter} options={['全部营销状态', '可推荐', '已触达', '已拒绝', '冷却中', '禁止触达']} />
            <FilterSelect value={followUpFilter} onChange={setFollowUpFilter} options={['全部跟进状态', '无跟进', '待跟进', '跟进中', '已完成', '已取消']} />
          </div>
        </div>

        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">客户列表</h3>
            <p className="text-xs text-slate-500 mt-1">共 {filteredProfiles.length} 个客户，点击行查看标签证据链和通话时间线。</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="text-left px-5 py-3 font-medium">客户信息</th>
                <th className="text-left px-5 py-3 font-medium">客户等级</th>
                <th className="text-left px-5 py-3 font-medium">最近通话结果</th>
                <th className="text-left px-5 py-3 font-medium">营销状态</th>
                <th className="text-left px-5 py-3 font-medium">跟进状态</th>
                <th className="text-left px-5 py-3 font-medium">风险状态</th>
                <th className="text-left px-5 py-3 font-medium">画像标签</th>
                <th className="text-left px-5 py-3 font-medium">证据</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProfiles.map(profile => (
                <tr key={profile.id} onClick={() => setSelectedProfile(profile)} className="hover:bg-blue-50/40 cursor-pointer">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-800">{profile.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{profile.phoneNumber} · {profile.region}</div>
                    <div className="text-xs text-slate-400 mt-1">最近通话：{formatDateTime(profile.lastInteraction)}</div>
                  </td>
                  <td className="px-5 py-4"><Badge className="bg-purple-50 text-purple-700 border-purple-100">{profile.customerLevel || '普通客户'}</Badge></td>
                  <td className="px-5 py-4"><Badge className={statusClass(profile.lastCallResult)}>{profile.lastCallResult || '无记录'}</Badge></td>
                  <td className="px-5 py-4"><Badge className={statusClass(profile.marketingStatus)}>{profile.marketingStatus || '未配置'}</Badge></td>
                  <td className="px-5 py-4"><Badge className={statusClass(profile.followUpStatus)}>{profile.followUpStatus || '无跟进'}</Badge></td>
                  <td className="px-5 py-4"><Badge className={statusClass(profile.riskStatus)}>{profile.riskStatus || '正常'}</Badge></td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {(profile.structuredTags || []).slice(0, 4).map(tag => (
                        <Badge key={tag.id} className={tagClass(tag)}>{tag.name}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">标签证据链 · 通话时间线</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedProfile && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex justify-end">
          <div className="w-[560px] bg-white h-full shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-start justify-between z-10">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedProfile.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{selectedProfile.phoneNumber} · {selectedProfile.region}</p>
              </div>
              <button onClick={() => setSelectedProfile(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <section className="border border-blue-100 bg-blue-50/60 p-4">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <Sparkles size={18} />
                  AI 洞察摘要
                </div>
                <p className="text-sm text-blue-900/80 mt-3 leading-6">{selectedProfile.notes || '暂无摘要'}</p>
              </section>

              <section className="border border-slate-200 p-4">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Tag size={18} />
                  画像标签与标签来源
                </div>
                <p className="text-xs text-slate-500 mt-1">标签证据链会展示来源、置信度、更新时间和解释说明。</p>
                <div className="mt-3 space-y-3">
                  {(selectedProfile.structuredTags || []).map(tag => (
                    <div key={tag.id} className="border border-slate-100 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <Badge className={tagClass(tag)}>{tag.name}</Badge>
                        <span className="text-xs text-slate-400">置信度：{CONFIDENCE_LABELS[tag.confidence]}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        {TAG_TYPE_LABELS[tag.type]} · 标签来源：{TAG_SOURCE_LABELS[tag.source]} · 更新时间：{formatDateTime(tag.updatedAt)}
                      </div>
                      <p className="text-sm text-slate-600 mt-2">{tag.explanation}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid grid-cols-2 gap-3">
                <div className="border border-slate-200 p-4">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Megaphone size={17} />
                    当前可推荐活动
                  </div>
                  <div className="mt-3 space-y-2">
                    {recommendedCampaigns.length === 0 && <p className="text-sm text-slate-400">当前无可推荐活动</p>}
                    {recommendedCampaigns.map(campaign => (
                      <div key={campaign.id} className="text-sm text-slate-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                        {campaign.name}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border border-slate-200 p-4">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <AlertTriangle size={17} />
                    当前禁止触达原因
                  </div>
                  <div className="mt-3 space-y-2">
                    {(selectedProfile.touchBlockReasons || []).length === 0 && <p className="text-sm text-slate-400">暂无禁止触达原因</p>}
                    {(selectedProfile.touchBlockReasons || []).map(reason => (
                      <div key={reason} className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{reason}</div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="border border-slate-200 p-4">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <History size={18} />
                  通话时间线、营销和自动跟进记录
                </div>
                <div className="mt-4 space-y-3">
                  {(selectedProfile.interactions || []).map(item => (
                    <div key={item.id} className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                        {interactionIcon(item.type)}
                      </div>
                      <div className="flex-1 border-b border-slate-100 pb-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-800">{item.title}</p>
                          <span className="text-xs text-slate-400">{formatDateTime(item.time)}</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{item.detail}</p>
                        {item.result && <p className="text-xs text-slate-400 mt-1">结果：{item.result}</p>}
                        {(item.botName || item.flowName) && (
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Bot size={12} /> {item.botName || '-'} · {item.flowName || '-'}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
