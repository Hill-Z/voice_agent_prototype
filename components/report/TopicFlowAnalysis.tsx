// Topic 与 Flow 分析区：主题只看用户需求分布，流程只看执行表现，Step / 边通过独立弹窗查看。
import React, { useMemo, useState } from 'react';
import { GitBranch, ListTree, Search } from 'lucide-react';
import { FlowFunnelReport, TopicAnalysisReport } from '../../types';
import FlowDetailModal, { type FlowDetailModalState } from './FlowDetailModal';
import {
  compareNumber,
  compareText,
  cx,
  EmptyTableState,
  formatDuration,
  formatRate,
  LoadingBlock,
  paginateRows,
  ReportTablePagination,
  SortableHeader,
  SortState,
  StatusBadge,
  toggleSort,
} from './reportUi';

interface TopicFlowAnalysisProps {
  topics: TopicAnalysisReport[];
  flows: FlowFunnelReport[];
  isLoading?: boolean;
}

type TopicSortKey = 'topicName' | 'callCount' | 'callShare' | 'firstTopicCallCount' | 'firstTopicShare';
type FlowSortKey = 'flowName' | 'botName' | 'enteredCount' | 'finishedRatio' | 'avgFlowDuration';

const TOPIC_PAGE_SIZE = 5;
const FLOW_PAGE_SIZE = 4;
const PAGE_SIZE_OPTIONS = [5, 10, 20];

export default function TopicFlowAnalysis({ topics, flows, isLoading = false }: TopicFlowAnalysisProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <LoadingBlock rows={5} />
        <LoadingBlock rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <TopicAnalysisTable topics={topics} />
      <FlowAnalysisTable flows={flows} />
    </div>
  );
}

interface TopicAnalysisTableProps {
  topics: TopicAnalysisReport[];
}

function TopicAnalysisTable({ topics }: TopicAnalysisTableProps) {
  const [sort, setSort] = useState<SortState<TopicSortKey>>({ key: 'callCount', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TOPIC_PAGE_SIZE);
  const [query, setQuery] = useState('');

  // 根据当前列排序，Topic 只排序需求分布相关字段。
  const sortedTopics = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchedTopics = normalizedQuery.length === 0
      ? topics
      : topics.filter(topic => topic.topicName.toLowerCase().includes(normalizedQuery));
    return [...matchedTopics].sort((left, right) => {
      const direction = sort.direction === 'asc' ? 1 : -1;
      const result = sort.key === 'topicName'
        ? compareText(left.topicName, right.topicName)
        : compareNumber(left[sort.key], right[sort.key]);
      return result * direction;
    });
  }, [query, topics, sort]);

  const pageData = paginateRows<TopicAnalysisReport>(sortedTopics, page, pageSize);

  const handleSort = (key: TopicSortKey) => {
    setSort(current => toggleSort(current, key));
    setPage(1);
  };
  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Topic 主题分析</h3>
          <p className="mt-1 text-xs text-slate-500">只统计通话中出现过的用户需求主题，不绑定流程结果。</p>
        </div>
        <SearchInput value={query} onChange={value => { setQuery(value); setPage(1); }} placeholder="搜索主题" />
      </div>
      {sortedTopics.length === 0 ? (
        <EmptyTableState desc="当前筛选条件下没有命中的主题。" />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50/80 text-xs text-slate-500">
                <tr>
                  <SortableHeader label="主题" sortKey="topicName" sort={sort} onSort={handleSort} />
                  <SortableHeader label="命中通话数" sortKey="callCount" sort={sort} onSort={handleSort} />
                  <SortableHeader label="主题占比" sortKey="callShare" sort={sort} onSort={handleSort} />
                  <SortableHeader label="首次主题通话数" sortKey="firstTopicCallCount" sort={sort} onSort={handleSort} />
                  <SortableHeader label="首次主题占比" sortKey="firstTopicShare" sort={sort} onSort={handleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageData.rows.map((topic, index) => {
                  const rank = (pageData.safePage - 1) * pageSize + index + 1;
                  return (
                    <tr key={topic.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className={cx(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                            rank <= 3 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                          )}>{rank}</span>
                          <span className="truncate font-bold text-slate-900" title={topic.topicName}>{topic.topicName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{topic.callCount.toLocaleString()}</td>
                      <td className="px-6 py-4"><RateBar value={topic.callShare} tone="blue" /></td>
                      <td className="px-6 py-4 font-medium text-slate-700">{topic.firstTopicCallCount.toLocaleString()}</td>
                      <td className="px-6 py-4"><RateBar value={topic.firstTopicShare} tone="green" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ReportTablePagination page={pageData.safePage} totalPages={pageData.totalPages} total={sortedTopics.length} pageSize={pageSize} pageSizeOptions={PAGE_SIZE_OPTIONS} onPageSizeChange={handlePageSizeChange} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

interface FlowAnalysisTableProps {
  flows: FlowFunnelReport[];
}

function FlowAnalysisTable({ flows }: FlowAnalysisTableProps) {
  const [sort, setSort] = useState<SortState<FlowSortKey>>({ key: 'enteredCount', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(FLOW_PAGE_SIZE);
  const [query, setQuery] = useState('');
  const [detailModal, setDetailModal] = useState<FlowDetailModalState | null>(null);

  // Flow 主表只排序流程级字段，Step 和边通过弹窗查看。
  const sortedFlows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchedFlows = normalizedQuery.length === 0
      ? flows
      : flows.filter(flow => [flow.flowName, flow.botName].some(value => value.toLowerCase().includes(normalizedQuery)));
    return [...matchedFlows].sort((left, right) => {
      const direction = sort.direction === 'asc' ? 1 : -1;
      const leftValue = getFlowSortValue(left, sort.key);
      const rightValue = getFlowSortValue(right, sort.key);
      const result = typeof leftValue === 'string' && typeof rightValue === 'string'
        ? compareText(leftValue, rightValue)
        : compareNumber(Number(leftValue), Number(rightValue));
      return result * direction;
    });
  }, [flows, query, sort]);

  const pageData = paginateRows<FlowFunnelReport>(sortedFlows, page, pageSize);

  const handleSort = (key: FlowSortKey) => {
    setSort(current => toggleSort(current, key));
    setPage(1);
  };
  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Flow 流程分析</h3>
        </div>
        <SearchInput value={query} onChange={value => { setQuery(value); setPage(1); }} placeholder="搜索 Flow / 机器人" />
      </div>
      {sortedFlows.length === 0 ? (
        <EmptyTableState desc="当前筛选条件下没有进入过的 Flow。" />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50/80 text-xs text-slate-500">
                <tr>
                  <SortableHeader label="Flow 名称" sortKey="flowName" sort={sort} onSort={handleSort} />
                  <SortableHeader label="机器人" sortKey="botName" sort={sort} onSort={handleSort} />
                  <SortableHeader label="进入量" sortKey="enteredCount" sort={sort} onSort={handleSort} />
                  <SortableHeader label="完成率" sortKey="finishedRatio" sort={sort} onSort={handleSort} />
                  <SortableHeader label="平均流程时长" sortKey="avgFlowDuration" sort={sort} onSort={handleSort} />
                  <th className="px-6 py-3 text-xs font-bold text-slate-500">明细</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageData.rows.map(flow => {
                  const avgFlowDuration = getAverageFlowDuration(flow);
                  const finishedRatio = flow.completedCount / Math.max(1, flow.enteredCount);
                  return (
                    <tr key={flow.flowId} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <div className="max-w-52 truncate font-bold text-slate-900" title={flow.flowName}>{flow.flowName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-48 truncate font-medium text-slate-600" title={flow.botName}>{flow.botName}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{flow.enteredCount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex min-w-[150px] items-center gap-3">
                          <StatusBadge tone={getRateTone(finishedRatio)}>{formatRate(finishedRatio)}</StatusBadge>
                          <MiniBar value={finishedRatio} />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">{formatDuration(avgFlowDuration)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailModal({ type: 'steps', flow })}
                            className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-primary transition hover:border-blue-200 hover:bg-blue-100"
                          >
                            <ListTree size={14} /> Step 明细
                          </button>
                          <button
                            type="button"
                            onClick={() => setDetailModal({ type: 'edges', flow })}
                            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-100"
                          >
                            <GitBranch size={14} /> 边 / 分支
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ReportTablePagination page={pageData.safePage} totalPages={pageData.totalPages} total={sortedFlows.length} pageSize={pageSize} pageSizeOptions={PAGE_SIZE_OPTIONS} onPageSizeChange={handlePageSizeChange} onPageChange={setPage} />
        </>
      )}
      {detailModal && (
        <FlowDetailModal detail={detailModal} onClose={() => setDetailModal(null)} />
      )}
    </div>
  );
}

function RateBar({ value, tone }: { value: number; tone: 'blue' | 'green' }) {
  return (
    <div className="min-w-[160px]">
      <div className="mb-1 flex items-center justify-between text-xs"><span className="font-semibold text-slate-700">{formatRate(value)}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={cx('h-full rounded-full', tone === 'blue' ? 'bg-blue-500' : 'bg-emerald-500')} style={{ width: `${Math.min(100, value * 100)}%` }} />
      </div>
    </div>
  );
}

function MiniBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, value * 100)}%` }} />
    </div>
  );
}

function getAverageFlowDuration(flow: FlowFunnelReport) {
  if (flow.nodes.length === 0) return 0;
  const totalStay = flow.nodes.reduce((sum, node) => sum + node.avgStaySeconds, 0);
  return totalStay;
}

function getFlowSortValue(flow: FlowFunnelReport, key: FlowSortKey) {
  if (key === 'flowName') return flow.flowName;
  if (key === 'botName') return flow.botName;
  if (key === 'finishedRatio') return flow.completedCount / Math.max(1, flow.enteredCount);
  if (key === 'avgFlowDuration') return getAverageFlowDuration(flow);
  return flow.enteredCount;
}

function getRateTone(rate: number) {
  if (rate >= 0.75) return 'green' as const;
  if (rate >= 0.5) return 'amber' as const;
  return 'red' as const;
}

function SearchInput({ value, placeholder, onChange }: { value: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <label className="relative w-full lg:w-64">
      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white"
      />
    </label>
  );
}
