// 报表订阅面板，展示日报、周报、月报等自动发送配置。
import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { ReportSubscription } from '../../types';
import { StatusBadge } from './reportUi';

interface SubscriptionPanelProps {
  subscriptions: ReportSubscription[];
  onCreate: () => void;
}

export default function SubscriptionPanel({ subscriptions, onCreate }: SubscriptionPanelProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 p-5"><h3 className="flex items-center gap-2 text-base font-bold text-slate-800"><FileSpreadsheet size={18} />报表订阅</h3><button onClick={onCreate} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-white">新建订阅</button></div>
      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
        {subscriptions.map(sub => (<div key={sub.id} className="rounded-lg border border-slate-100 p-4"><div className="flex items-center justify-between"><h4 className="font-bold text-slate-800">{sub.name}</h4><StatusBadge tone={sub.enabled ? 'green' : 'slate'}>{sub.enabled ? '启用' : '停用'}</StatusBadge></div><p className="mt-2 text-sm text-slate-500">{sub.frequency} · {sub.sendTime} · {sub.fileFormat}</p><p className="mt-2 text-xs text-slate-400">接收人：{sub.recipients.join('、')}</p><div className="mt-3 flex flex-wrap gap-1">{sub.contentSummary.map(item => <StatusBadge key={item} tone="blue">{item}</StatusBadge>)}</div></div>))}
      </div>
    </div>
  );
}
