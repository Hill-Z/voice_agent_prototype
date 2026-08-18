// 经营报表页签，展示业务触发、完成、转人工和放弃情况。
import React from 'react';
import { CheckCircle, Headphones, Phone, TrendingUp } from 'lucide-react';
import { BusinessResultReport } from '../../types';
import { formatDuration, formatRate, StatCard } from './reportUi';

interface BusinessReportTabProps {
  data: BusinessResultReport[];
  onOpenFlow: () => void;
}

export default function BusinessReportTab({ data, onOpenFlow }: BusinessReportTabProps) {
  const totalCompleted = data.reduce((sum, item) => sum + item.completedCount, 0);
  const totalTriggered = data.reduce((sum, item) => sum + item.triggerCount, 0);
  const totalTransfers = data.reduce((sum, item) => sum + item.transferCount, 0);
  const totalAbandoned = data.reduce((sum, item) => sum + item.abandonedCount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="业务触发量" value={totalTriggered} tone="blue" icon={<TrendingUp size={22} />} />
        <StatCard title="业务完成量" value={totalCompleted} tone="green" icon={<CheckCircle size={22} />} />
        <StatCard title="转人工量" value={totalTransfers} tone="purple" icon={<Headphones size={22} />} />
        <StatCard title="客户主动放弃量" value={totalAbandoned} tone="amber" icon={<Phone size={22} />} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5"><h3 className="text-base font-bold text-slate-800">业务结果报表</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">业务名称</th><th className="px-5 py-3">触发次数</th><th className="px-5 py-3">完成次数</th><th className="px-5 py-3">转人工次数</th><th className="px-5 py-3">转人工率</th><th className="px-5 py-3">平均处理时长</th><th className="px-5 py-3">客户主动放弃</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.map(item => (
                <tr key={item.id}>
                  <td className="px-5 py-3"><button className="font-bold text-primary" onClick={onOpenFlow}>{item.businessName}</button><p className="text-xs text-slate-400">关联流程：{item.relatedFlowName}</p></td>
                  <td className="px-5 py-3">{item.triggerCount}</td><td className="px-5 py-3">{item.completedCount}</td><td className="px-5 py-3">{item.transferCount}</td><td className="px-5 py-3">{formatRate(item.transferRate)}</td><td className="px-5 py-3">{formatDuration(item.avgHandleTime)}</td><td className="px-5 py-3">{item.abandonedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
