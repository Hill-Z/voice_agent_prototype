// 长期任务运行视图，负责查看运行中、等待中、异常和需人工处理的任务实例。
import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, CalendarClock, CheckCircle2, Clock3, Search, UserRoundCheck } from 'lucide-react';
import type { LongTermFlowDefinition, LongTermFlowRun, LongTermFlowRunStatus } from './longTermFlowTypes';

interface LongTermFlowRunsProps {
  flow: LongTermFlowDefinition;
  runs: LongTermFlowRun[];
  onBackToDesigner: () => void;
  onBackToList: () => void;
}

const RUN_STATUS_OPTIONS: Array<LongTermFlowRunStatus | '全部状态'> = ['全部状态', '运行中', '等待中', '异常', '已完成', '需人工'];
type RunSortKey = 'id' | 'status' | 'currentNode' | 'nextTriggerAt' | 'owner';
type SortDirection = 'asc' | 'desc';

interface RunSortConfig {
  key: RunSortKey;
  direction: SortDirection;
}

// 根据任务状态返回标签样式。
function RunStatusBadge({ status }: { status: LongTermFlowRunStatus }) {
  const className = {
    运行中: 'bg-blue-50 text-blue-700',
    等待中: 'bg-amber-50 text-amber-700',
    异常: 'bg-rose-50 text-rose-700',
    已完成: 'bg-emerald-50 text-emerald-700',
    需人工: 'bg-violet-50 text-violet-700',
  }[status];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{status}</span>;
}

// 过滤运行任务。
function filterRuns(runs: LongTermFlowRun[], searchTerm: string, statusFilter: LongTermFlowRunStatus | '全部状态') {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  return runs.filter((run) => {
    const matchesSearch = normalizedSearchTerm
      ? [run.id, run.customer, run.currentNode, run.owner, run.exceptionReason || ''].some((value) => value.toLowerCase().includes(normalizedSearchTerm))
      : true;
    const matchesStatus = statusFilter === '全部状态' || run.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
}

// 排序运行任务。
function sortRuns(runs: LongTermFlowRun[], sortConfig: RunSortConfig) {
  return [...runs].sort((left, right) => {
    const leftValue = left[sortConfig.key];
    const rightValue = right[sortConfig.key];
    const result = String(leftValue).localeCompare(String(rightValue), 'zh-Hans-CN');
    return sortConfig.direction === 'asc' ? result : -result;
  });
}

// 分页运行任务。
function paginateRuns<T>(items: T[], currentPage: number, pageSize: number) {
  const start = (currentPage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

// 渲染可排序表头。
function SortableRunHeader({
  label,
  sortKey,
  sortConfig,
  onSort,
}: {
  label: string;
  sortKey: RunSortKey;
  sortConfig: RunSortConfig;
  onSort: (key: RunSortKey) => void;
}) {
  const active = sortConfig.key === sortKey;
  const Icon = sortConfig.direction === 'asc' ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      aria-label={`按${label}排序`}
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition-colors hover:text-primary"
    >
      {label}
      {active ? <Icon size={13} /> : <ArrowDown size={13} className="opacity-30" />}
    </button>
  );
}

// 主运行任务视图。
export default function LongTermFlowRuns({ flow, runs, onBackToDesigner, onBackToList }: LongTermFlowRunsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LongTermFlowRunStatus | '全部状态'>('全部状态');
  const [selectedRunId, setSelectedRunId] = useState(runs[0]?.id || '');
  const [sortConfig, setSortConfig] = useState<RunSortConfig>({ key: 'nextTriggerAt', direction: 'asc' });
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRuns = useMemo(() => filterRuns(runs, searchTerm, statusFilter), [runs, searchTerm, statusFilter]);
  const sortedRuns = useMemo(() => sortRuns(filteredRuns, sortConfig), [filteredRuns, sortConfig]);
  const totalPages = Math.max(1, Math.ceil(sortedRuns.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRuns = useMemo(() => paginateRuns(sortedRuns, safeCurrentPage, pageSize), [sortedRuns, safeCurrentPage, pageSize]);
  const selectedRun = useMemo(
    () => runs.find((run) => run.id === selectedRunId) || paginatedRuns[0] || sortedRuns[0] || runs[0],
    [runs, paginatedRuns, selectedRunId, sortedRuns],
  );

  const summary = useMemo(() => ({
    running: runs.filter((run) => run.status === '运行中').length,
    waiting: runs.filter((run) => run.status === '等待中').length,
    exception: runs.filter((run) => run.status === '异常' || run.status === '需人工').length,
  }), [runs]);

  // 切换排序字段或方向。
  const handleSort = (key: RunSortKey) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // 过滤条件变化后回到第一页。
  const resetPage = () => setCurrentPage(1);

  return (
    <section className="space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button type="button" onClick={onBackToDesigner} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary">
            <ArrowLeft size={16} /> 返回流程编排
          </button>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">运行任务 · {flow.name}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">查看当前流程的长期任务实例，重点关注今日待触发、异常待处理和人工接管任务。</p>
        </div>
        <button type="button" onClick={onBackToList} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary">
          回到流程方案列表
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700"><Clock3 size={15} /> 运行中任务</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{summary.running}</div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700"><Clock3 size={15} /> 等待中任务</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{summary.waiting}</div>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-700"><AlertTriangle size={15} /> 异常待处理</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{summary.exception}</div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
            <div className="relative min-w-[260px] flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                aria-label="搜索运行任务"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  resetPage();
                }}
                placeholder="搜索任务 ID / 客户 / 当前节点 / 负责人"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:bg-white"
              />
            </div>
            <select
              aria-label="筛选任务状态"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as LongTermFlowRunStatus | '全部状态');
                resetPage();
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-primary"
            >
              {RUN_STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[840px] w-full text-left">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3"><SortableRunHeader label="任务" sortKey="id" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th className="px-4 py-3"><SortableRunHeader label="状态" sortKey="status" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th className="px-4 py-3"><SortableRunHeader label="当前节点" sortKey="currentNode" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th className="px-4 py-3"><SortableRunHeader label="下次触发" sortKey="nextTriggerAt" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th className="px-4 py-3"><SortableRunHeader label="负责人" sortKey="owner" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th className="px-4 py-3">异常原因</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRuns.map((run) => (
                  <tr key={run.id} className={run.id === selectedRun?.id ? 'bg-blue-50/40' : 'hover:bg-slate-50'}>
                    <td className="px-4 py-4">
                      <button type="button" onClick={() => setSelectedRunId(run.id)} className="text-left">
                        <div className="font-semibold text-slate-900">{run.id}</div>
                        <div className="mt-1 text-xs text-slate-500">{run.customer}</div>
                      </button>
                    </td>
                    <td className="px-4 py-4"><RunStatusBadge status={run.status} /></td>
                    <td className="px-4 py-4 text-sm text-slate-700">{run.currentNode}</td>
                    <td className="px-4 py-4 text-sm text-slate-500">{run.nextTriggerAt}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{run.owner}</td>
                    <td className="px-4 py-4 text-sm text-rose-600">{run.exceptionReason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {paginatedRuns.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <CheckCircle2 size={34} className="text-slate-300" />
              <div className="mt-3 font-semibold text-slate-700">暂无匹配的运行任务</div>
              <div className="mt-1 text-sm text-slate-400">请调整搜索词或状态筛选。</div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <CalendarClock size={15} /> 共 {filteredRuns.length} 条，当前 {safeCurrentPage} / {totalPages} 页
            </div>
            <div className="flex items-center gap-2">
              <span>每页</span>
              <select
                aria-label="选择每页任务数"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 outline-none focus:border-primary"
              >
                {[5, 10, 20].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
              <button type="button" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="rounded-lg border border-slate-200 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40 hover:border-primary">
                上一页
              </button>
              <button type="button" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="rounded-lg border border-slate-200 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40 hover:border-primary">
                下一页
              </button>
            </div>
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-primary">任务时间线</div>
              <h2 className="mt-1 text-lg font-bold text-slate-900">{selectedRun?.id || '暂无任务'}</h2>
            </div>
            {selectedRun ? <RunStatusBadge status={selectedRun.status} /> : null}
          </div>
          <div className="mt-2 text-sm text-slate-500">{selectedRun?.customer || '当前没有可查看的任务。'}</div>

          <div className="mt-5 space-y-4">
            {selectedRun?.events.map((event) => (
              <div key={event.id} className="flex gap-3">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  {event.status === '人工' ? <UserRoundCheck size={15} /> : event.status === '异常' ? <AlertTriangle size={15} /> : <Clock3 size={15} />}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400">{event.time}</div>
                  <div className="mt-1 text-sm font-bold text-slate-800">{event.title}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">{event.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
