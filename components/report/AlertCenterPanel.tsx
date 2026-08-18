// 异常告警中心，支持查看详情和标记处理入口。
import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { AlertEvent } from '../../types';
import { formatTime, getAlertTone, StatusBadge } from './reportUi';

interface AlertCenterPanelProps {
  alerts: AlertEvent[];
  onAcknowledge: (alertItem: AlertEvent) => void;
}

export default function AlertCenterPanel({ alerts, onAcknowledge }: AlertCenterPanelProps) {
  const [selectedAlert, setSelectedAlert] = useState<AlertEvent | null>(null);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 p-5">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-800"><ShieldAlert size={18} className="text-red-500" />异常告警中心</h3>
        <span className="text-xs text-slate-500">同类错误 5 分钟内自动合并，高等级默认置顶</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">时间</th><th className="px-5 py-3">等级</th><th className="px-5 py-3">类型</th><th className="px-5 py-3">机器人</th><th className="px-5 py-3">关联通话</th><th className="px-5 py-3">失败原因</th><th className="px-5 py-3">状态</th><th className="px-5 py-3">操作</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {alerts.map(alert => {
              const tone = getAlertTone(alert.level);
              return (
                <tr key={alert.id} className={alert.level === 'high' && alert.status !== 'recovered' ? 'bg-red-50/50' : ''}>
                  <td className="px-5 py-3 text-xs text-slate-500">{formatTime(alert.time)}</td>
                  <td className="px-5 py-3"><StatusBadge tone={tone.tone}>{tone.label}</StatusBadge></td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{alert.type}</td>
                  <td className="px-5 py-3">{alert.botName}</td>
                  <td className="px-5 py-3 font-mono text-xs">{alert.callId}</td>
                  <td className="px-5 py-3">{alert.reason}</td>
                  <td className="px-5 py-3"><StatusBadge tone={alert.status === 'open' ? 'red' : alert.status === 'acknowledged' ? 'amber' : 'green'}>{alert.status === 'open' ? '未处理' : alert.status === 'acknowledged' ? '已确认' : '已恢复'}</StatusBadge></td>
                  <td className="px-5 py-3"><button className="mr-3 text-xs font-bold text-primary" onClick={() => setSelectedAlert(alert)}>查看详情</button><button className="text-xs font-bold text-slate-500" onClick={() => onAcknowledge(alert)}>标记已处理</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selectedAlert && (
        <div className="border-t border-gray-100 bg-slate-50 p-5">
          <div className="flex items-center justify-between"><h4 className="font-bold text-slate-800">告警详情：{selectedAlert.type}</h4><button onClick={() => setSelectedAlert(null)} className="text-sm text-slate-400">关闭</button></div>
          <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <p><b>发生时间：</b>{formatTime(selectedAlert.time)}</p><p><b>通话 ID：</b>{selectedAlert.callId}</p><p><b>所在流程 / 节点：</b>{selectedAlert.flowName} / {selectedAlert.nodeName}</p><p><b>请求对象：</b>{selectedAlert.target}</p><p className="md:col-span-2"><b>错误信息：</b>{selectedAlert.errorMessage}</p><p className="md:col-span-2"><b>建议处理方式：</b>{selectedAlert.suggestion}</p>
          </div>
        </div>
      )}
    </div>
  );
}
