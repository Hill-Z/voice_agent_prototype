// 业务与流程统计列表，将业务结果、流程节点和边命中合并为报表型表格。
import React from 'react';
import { BusinessResultReport, FlowFunnelReport } from '../../types';
import { formatDuration, formatRate, StatusBadge } from './reportUi';

interface FlowBusinessReportProps {
  businesses: BusinessResultReport[];
  flow: FlowFunnelReport;
}

export default function FlowBusinessReport({ businesses, flow }: FlowBusinessReportProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5"><h3 className="text-base font-bold text-slate-800">业务与流程统计</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3">业务 / 流程节点</th>
                <th className="px-5 py-3">类型</th>
                <th className="px-5 py-3">进入 / 触发</th>
                <th className="px-5 py-3">完成 / 通过</th>
                <th className="px-5 py-3">通过率</th>
                <th className="px-5 py-3">转人工次数</th>
                <th className="px-5 py-3">转人工率</th>
                <th className="px-5 py-3">平均时长</th>
                <th className="px-5 py-3">客户主动放弃</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {businesses.map(item => (
                <tr key={item.id}>
                  <td className="px-5 py-3"><b className="text-primary">{item.businessName}</b><p className="text-xs text-slate-400">关联流程：{item.relatedFlowName}</p></td>
                  <td className="px-5 py-3"><StatusBadge tone="blue">业务</StatusBadge></td>
                  <td className="px-5 py-3">{item.triggerCount}</td>
                  <td className="px-5 py-3">{item.completedCount}</td>
                  <td className="px-5 py-3">-</td>
                  <td className="px-5 py-3">{item.transferCount}</td>
                  <td className="px-5 py-3">{formatRate(item.transferRate)}</td>
                  <td className="px-5 py-3">{formatDuration(item.avgHandleTime)}</td>
                  <td className="px-5 py-3">{item.abandonedCount}</td>
                </tr>
              ))}
              {flow.nodes.map(node => (
                <tr key={node.nodeId}>
                  <td className="px-5 py-3"><b>{node.nodeName}</b><p className="text-xs text-slate-400">所属流程：{flow.flowName}</p></td>
                  <td className="px-5 py-3"><StatusBadge tone="purple">{node.nodeType}</StatusBadge></td>
                  <td className="px-5 py-3">{node.enteredCount}</td>
                  <td className="px-5 py-3">{node.passedCount}</td>
                  <td className="px-5 py-3"><StatusBadge tone={node.passRate > 0.7 ? 'green' : node.passRate > 0.5 ? 'amber' : 'red'}>{formatRate(node.passRate)}</StatusBadge></td>
                  <td className="px-5 py-3">{node.transferCount}</td>
                  <td className="px-5 py-3">{formatRate(node.transferRate)}</td>
                  <td className="px-5 py-3">{formatDuration(node.avgStaySeconds)}</td>
                  <td className="px-5 py-3">{node.userHangupCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5"><h3 className="text-base font-bold text-slate-800">边分析</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3">起点</th>
                <th className="px-5 py-3">终点</th>
                <th className="px-5 py-3">分支类型</th>
                <th className="px-5 py-3">条件 / 说明</th>
                <th className="px-5 py-3">命中次数</th>
                <th className="px-5 py-3">命中率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flow.edges.map(edge => (
                <tr key={edge.edgeId}>
                  <td className="px-5 py-3 font-medium text-slate-700">{edge.fromNode}</td>
                  <td className="px-5 py-3 font-medium text-slate-700">{edge.toNode}</td>
                  <td className="px-5 py-3">{edge.branchType === 'conditional' ? '条件分支' : edge.branchType === 'llm_branch' ? '大模型分支' : '普通连线'}</td>
                  <td className="px-5 py-3 text-slate-500">{edge.conditionText}</td>
                  <td className="px-5 py-3">{edge.hitCount}</td>
                  <td className="px-5 py-3">{formatRate(edge.hitRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
