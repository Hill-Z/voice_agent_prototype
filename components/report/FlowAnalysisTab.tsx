// 流程分析页签，展示 Flow 节点漏斗、边命中和转人工入口。
import React from 'react';
import { CheckCircle, Headphones, Phone, TrendingUp } from 'lucide-react';
import { FlowFunnelReport } from '../../types';
import { cx, formatDuration, formatRate, StatCard, StatusBadge } from './reportUi';

interface FlowAnalysisTabProps {
  report: FlowFunnelReport;
}

export default function FlowAnalysisTab({ report }: FlowAnalysisTabProps) {
  const mainTransferNode = report.nodes.reduce((max, node) => (node.transferRate > max.transferRate ? node : max), report.nodes[0]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="进入人数" value={report.enteredCount} tone="blue" icon={<Phone size={22} />} />
        <StatCard title="到达完成" value={report.completedCount} tone="green" icon={<CheckCircle size={22} />} />
        <StatCard title="整体通过率" value={formatRate(report.completedCount / report.enteredCount)} tone="purple" icon={<TrendingUp size={22} />} />
        <StatCard title="主要人工入口" value={mainTransferNode.nodeName} desc={`转人工率 ${formatRate(mainTransferNode.transferRate)}`} tone="amber" icon={<Headphones size={22} />} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-5 text-base font-bold text-slate-800">流程漏斗：{report.flowName}</h3>
          <div className="space-y-4">
            {report.nodes.map((node, index) => (
              <div key={node.nodeId} className={cx('rounded-xl border p-4', node.dropRate > 0.3 ? 'border-red-200 bg-red-50/60' : node.toolFailureCount / Math.max(1, node.enteredCount) > 0.1 ? 'border-amber-200 bg-amber-50/60' : 'border-slate-100 bg-slate-50')}>
                <div className="flex items-center justify-between"><div><span className="text-sm font-bold text-slate-800">{index + 1}. {node.nodeName}</span><span className="ml-2 text-xs text-slate-400">{node.nodeType}</span></div><StatusBadge tone={node.dropRate > 0.3 ? 'red' : 'green'}>通过率 {formatRate(node.passRate)}</StatusBadge></div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-primary" style={{ width: `${node.passRate * 100}%` }} /></div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 md:grid-cols-4"><span>进入 {node.enteredCount}</span><span>流失 {formatRate(node.dropRate)}</span><span>转人工 {formatRate(node.transferRate)}</span><span>停留 {formatDuration(node.avgStaySeconds)}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5"><h3 className="text-base font-bold text-slate-800">边分析</h3></div>
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
          {report.edges.map(edge => (
            <div key={edge.edgeId} className="rounded-lg border border-slate-100 p-4"><p className="text-sm font-bold text-slate-800">{edge.fromNode} → {edge.toNode}</p><p className="mt-2 text-xs text-slate-500">{edge.branchType === 'conditional' ? '条件分支' : edge.branchType === 'llm_branch' ? '大模型分支' : '普通连线'}：{edge.conditionText}</p><p className="mt-3 text-sm text-slate-700">命中 {edge.hitCount} 次 · {formatRate(edge.hitRate)}</p></div>
          ))}
        </div>
      </div>
    </div>
  );
}
