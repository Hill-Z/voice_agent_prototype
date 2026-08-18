// 通话明细页签，支持从列表钻取录音、文本、流程路径和工具记录。
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { CallDetail } from '../../types';
import { cx, formatDuration, formatTime, StatusBadge } from './reportUi';

interface CallDetailsTabProps {
  calls: CallDetail[];
}

export default function CallDetailsTab({ calls }: CallDetailsTabProps) {
  const [selectedCall, setSelectedCall] = useState<CallDetail | null>(null);
  const [callSearch, setCallSearch] = useState('');
  const filteredCalls = calls.filter(call => call.id.includes(callSearch) || call.customerPhone.includes(callSearch) || call.businessName.includes(callSearch));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3"><div className="relative min-w-[240px] flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={callSearch} onChange={e => setCallSearch(e.target.value)} placeholder="搜索通话 ID、号码、业务" className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-3 text-sm" /></div><select className="rounded-lg border border-gray-200 px-3 py-2 text-sm"><option>全部状态</option><option>完成</option><option>失败</option><option>转人工</option><option>异常</option></select><select className="rounded-lg border border-gray-200 px-3 py-2 text-sm"><option>全部结果</option><option>业务完成</option><option>工具失败</option><option>已转人工</option></select></div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">通话 ID</th><th className="px-5 py-3">开始时间</th><th className="px-5 py-3">客户号码</th><th className="px-5 py-3">机器人</th><th className="px-5 py-3">状态</th><th className="px-5 py-3">时长</th><th className="px-5 py-3">命中业务</th><th className="px-5 py-3">当前结果</th><th className="px-5 py-3">满意度</th><th className="px-5 py-3">操作</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredCalls.map(call => (<tr key={call.id}><td className="px-5 py-3 font-mono text-xs">{call.id}</td><td className="px-5 py-3 text-xs text-slate-500">{formatTime(call.startedAt)}</td><td className="px-5 py-3">{call.customerPhone}</td><td className="px-5 py-3">{call.botName}</td><td className="px-5 py-3"><StatusBadge tone={call.status === 'completed' ? 'green' : call.status === 'transferred' ? 'blue' : call.status === 'error' ? 'red' : 'amber'}>{call.status}</StatusBadge></td><td className="px-5 py-3">{formatDuration(call.duration)}</td><td className="px-5 py-3">{call.businessName}</td><td className="px-5 py-3">{call.result}</td><td className="px-5 py-3">{call.satisfaction || '-'}</td><td className="px-5 py-3"><button className="text-xs font-bold text-primary" onClick={() => setSelectedCall(call)}>查看详情</button></td></tr>))}</tbody></table></div></div>

      {selectedCall && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-5"><h3 className="text-base font-bold text-slate-800">通话详情：{selectedCall.id}</h3><button className="text-sm text-slate-400" onClick={() => setSelectedCall(null)}>关闭</button></div>
          <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2">
            <div><h4 className="mb-3 font-bold text-slate-800">基本信息</h4><div className="space-y-2 text-sm text-slate-600"><p>客户号码：{selectedCall.customerPhone}</p><p>机器人：{selectedCall.botName}</p><p>通话录音：{selectedCall.recordingUrl}</p><p>业务结果：{selectedCall.businessSummary}</p></div><h4 className="mb-3 mt-5 font-bold text-slate-800">对话文本</h4><div className="space-y-2">{selectedCall.transcript.map((line, index) => (<div key={index} className="rounded-lg bg-slate-50 p-3 text-sm"><b>{line.speaker === 'user' ? '用户' : line.speaker === 'agent' ? '人工' : '机器人'}：</b>{line.text}</div>))}</div></div>
            <div><h4 className="mb-3 font-bold text-slate-800">流程路径</h4><div className="space-y-3">{selectedCall.flowPath.map((node, index) => (<div key={`${node.nodeName}-${index}`} className={cx('rounded-lg border p-3 text-sm', node.marker === 'error' ? 'border-red-200 bg-red-50' : node.marker === 'transfer' ? 'border-blue-200 bg-blue-50' : node.marker === 'tool' ? 'border-green-200 bg-green-50' : 'border-slate-100 bg-slate-50')}><div className="flex justify-between"><b>{node.nodeName}</b><span>{formatDuration(node.staySeconds)}</span></div><p className="text-xs text-slate-500">{node.nodeType}{node.marker ? ` · ${node.marker === 'tool' ? '工具调用点' : node.marker === 'transfer' ? '转人工点' : '异常点'}` : ''}</p></div>))}</div></div>
          </div>
          <div className="grid grid-cols-1 gap-6 border-t border-gray-100 p-5 lg:grid-cols-3"><div><h4 className="mb-3 font-bold text-slate-800">工具调用记录</h4>{selectedCall.toolRecords.map(tool => <div key={tool.calledAt} className="rounded-lg bg-slate-50 p-3 text-sm"><b>{tool.toolName}</b><p>入参：{tool.paramsSummary}</p><p>结果：{tool.resultSummary}</p><p>状态：{tool.status} · {tool.latencyMs}ms</p></div>)}</div><div><h4 className="mb-3 font-bold text-slate-800">转人工记录</h4>{selectedCall.transferRecords.length ? selectedCall.transferRecords.map(item => <div key={item.time} className="rounded-lg bg-blue-50 p-3 text-sm">{item.reason} · 排队 {formatDuration(item.queueSeconds)} · {item.result}</div>) : <p className="text-sm text-slate-400">无转人工记录</p>}</div><div><h4 className="mb-3 font-bold text-slate-800">异常记录</h4>{selectedCall.alertRecords.length ? selectedCall.alertRecords.map(item => <div key={item.time} className="rounded-lg bg-red-50 p-3 text-sm">{item.type}：{item.message}</div>) : <p className="text-sm text-slate-400">无异常记录</p>}</div></div>
        </div>
      )}
    </div>
  );
}
