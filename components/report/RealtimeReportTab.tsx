// 实时监控页签，展示当前通话、并发和机器人在线状态。
import React from 'react';
import { Bot, CheckCircle, Headphones, Phone, TrendingUp } from 'lucide-react';
import { RealtimeMonitorData } from '../../types';
import { cx, formatDuration, getRealtimeStatus, StatCard, StatusBadge } from './reportUi';

interface RealtimeReportTabProps {
  data: RealtimeMonitorData;
  onViewCallDetail: () => void;
}

export default function RealtimeReportTab({ data, onViewCallDetail }: RealtimeReportTabProps) {
  const concurrencyRate = data.concurrencyUsed / data.concurrencyLimit;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard title="当前通话中" value={data.activeCalls} tone="green" icon={<Phone size={22} />} />
        <StatCard
          title="当前占用并发"
          value={`${data.concurrencyUsed}/${data.concurrencyLimit}`}
          tone={concurrencyRate > 0.95 ? 'red' : concurrencyRate > 0.8 ? 'amber' : 'green'}
          icon={<TrendingUp size={22} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="今日通话量" value={data.todayCalls} tone="blue" icon={<Phone size={22} />} />
        <StatCard title="今日异常量" value={data.todayErrors} tone="red" icon={<CheckCircle size={22} />} />
        <StatCard title="今日转人工量" value={data.todayTransfers} tone="purple" icon={<Headphones size={22} />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800"><Bot size={18} />机器人在线状态</h3>
          <div className="space-y-3">
            {data.botStatuses.map(bot => {
              const usage = bot.concurrencyUsed / bot.concurrencyLimit;
              return (
                <div key={bot.botId} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">{bot.botName}</span>
                    <StatusBadge tone={bot.status === 'warning' ? 'amber' : bot.status === 'online' ? 'green' : 'red'}>
                      {bot.status === 'warning' ? '预警' : bot.status === 'online' ? '在线' : '离线'}
                    </StatusBadge>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={cx('h-full rounded-full', usage > 0.8 ? 'bg-amber-400' : 'bg-primary')} style={{ width: `${Math.min(100, usage * 100)}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">通话 {bot.activeCalls} · 并发 {bot.concurrencyUsed}/{bot.concurrencyLimit}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800"><TrendingUp size={18} />并发占用趋势</h3>
          <div className="grid h-56 grid-cols-12 items-end gap-2">
            {data.concurrencyTrend.map(point => (
              <div key={point.time} className="flex h-full flex-col justify-end gap-2 text-center">
                <div className="rounded-t bg-sky-400" style={{ height: `${(point.used / point.limit) * 100}%` }} title={`${point.time} ${point.used}/${point.limit}`} />
                <span className="text-[10px] text-slate-400">{point.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5"><h3 className="text-base font-bold text-slate-800">实时通话队列</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">通话 ID</th><th className="px-5 py-3">客户号码</th><th className="px-5 py-3">机器人</th><th className="px-5 py-3">当前流程 / 节点</th><th className="px-5 py-3">时长</th><th className="px-5 py-3">状态</th><th className="px-5 py-3">操作</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.queueItems.map(item => {
                const status = getRealtimeStatus(item.status);
                return (
                  <tr key={item.id} className={item.status === 'error' ? 'bg-red-50/50' : ''}>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{item.id}</td>
                    <td className="px-5 py-3">{item.customerPhone}</td>
                    <td className="px-5 py-3">{item.botName}</td>
                    <td className="px-5 py-3">{item.currentFlow} / {item.currentNode}</td>
                    <td className="px-5 py-3">{formatDuration(item.duration)}</td>
                    <td className="px-5 py-3"><StatusBadge tone={status.tone}>{status.label}</StatusBadge></td>
                    <td className="px-5 py-3"><button className="text-xs font-bold text-primary" onClick={onViewCallDetail}>查看详情</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
