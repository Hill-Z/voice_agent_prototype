// 流程方案列表页，负责长期任务流程的搜索、筛选、排序、分页和入口操作。
import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CalendarClock, Copy, Edit3, FileText, Search } from 'lucide-react';
import {
  FLOW_SCENARIO_OPTIONS,
  FLOW_STATUS_OPTIONS,
  filterLongTermFlows,
  getFlowSummary,
  paginateLongTermFlows,
  sortLongTermFlows,
} from './longTermFlowData';
import type {
  LongTermFlowDefinition,
  LongTermFlowScenarioType,
  LongTermFlowSortConfig,
  LongTermFlowSortKey,
  LongTermFlowStatus,
} from './longTermFlowTypes';

interface LongTermFlowListProps {
  flows: LongTermFlowDefinition[];
  selectedFlowId: string;
  onSelectFlow: (flowId: string) => void;
  onOpenDesigner: (flowId: string) => void;
  onOpenRuns: (flowId: string) => void;
  onCreateNewFlow: () => void;
  onCreateFromTemplate: (flowId: string) => void;
}

interface SummaryCardProps {
  label: string;
  value: number;
  helper: string;
  tone: 'blue' | 'green' | 'amber' | 'red';
}

const TONE_CLASS_MAP: Record<SummaryCardProps['tone'], string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  red: 'bg-rose-50 text-rose-700 border-rose-100',
};

// 显示单个统计指标。
function SummaryCard({ label, value, helper, tone }: SummaryCardProps) {
  return (
    <div className={`rounded-2xl border p-4 ${TONE_CLASS_MAP[tone]}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value.toLocaleString()}</div>
      <div className="mt-1 text-xs text-slate-500">{helper}</div>
    </div>
  );
}

// 根据状态返回稳定的视觉标签。
function StatusBadge({ status }: { status: LongTermFlowStatus }) {
  const className = {
    草稿: 'bg-slate-100 text-slate-600',
    已发布: 'bg-blue-50 text-blue-700',
    运行中: 'bg-emerald-50 text-emerald-700',
    已停用: 'bg-rose-50 text-rose-700',
  }[status];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{status}</span>;
}

// 渲染可排序表头。
function SortableHeader({
  label,
  sortKey,
  sortConfig,
  onSort,
}: {
  label: string;
  sortKey: LongTermFlowSortKey;
  sortConfig: LongTermFlowSortConfig;
  onSort: (key: LongTermFlowSortKey) => void;
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

// 主列表页组件。
export default function LongTermFlowList({
  flows,
  selectedFlowId,
  onSelectFlow,
  onOpenDesigner,
  onOpenRuns,
  onCreateNewFlow,
  onCreateFromTemplate,
}: LongTermFlowListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LongTermFlowStatus | '全部状态'>('全部状态');
  const [scenarioFilter, setScenarioFilter] = useState<LongTermFlowScenarioType | '全部场景'>('全部场景');
  const [sortConfig, setSortConfig] = useState<LongTermFlowSortConfig>({ key: 'updatedAt', direction: 'desc' });
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const summary = useMemo(() => getFlowSummary(flows), [flows]);
  const filteredFlows = useMemo(
    () => filterLongTermFlows(flows, { searchTerm, statusFilter, scenarioFilter }),
    [flows, searchTerm, statusFilter, scenarioFilter],
  );
  const sortedFlows = useMemo(() => sortLongTermFlows(filteredFlows, sortConfig), [filteredFlows, sortConfig]);
  const totalPages = Math.max(1, Math.ceil(sortedFlows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedFlows = useMemo(
    () => paginateLongTermFlows(sortedFlows, safeCurrentPage, pageSize),
    [sortedFlows, safeCurrentPage, pageSize],
  );

  // 切换排序字段或方向。
  const handleSort = (key: LongTermFlowSortKey) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  // 筛选变化后回到第一页。
  const resetPage = () => setCurrentPage(1);

  return (
    <section className="space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-primary">任务流程配置</div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">流程方案列表</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            配置和维护业务流程方案，支持发布状态、运行指标、触发计划和异常处理。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onCreateFromTemplate(selectedFlowId)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-primary hover:text-primary"
          >
            <Copy size={16} /> 从模板创建
          </button>
          <button
            type="button"
            onClick={onCreateNewFlow}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-600"
          >
            <Edit3 size={16} /> 新建流程
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="流程总数" value={summary.totalFlows} helper="当前工作区内方案" tone="blue" />
        <SummaryCard label="运行中任务" value={summary.runningTasks} helper="正在等待或执行" tone="green" />
        <SummaryCard label="今日待触发" value={summary.todayTriggers} helper="今天需要恢复流程" tone="amber" />
        <SummaryCard label="异常待处理" value={summary.exceptionTasks} helper="失败、超时或需人工" tone="red" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-[260px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="搜索流程名称、场景或负责人"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                resetPage();
              }}
              placeholder="搜索流程名 / 场景 / Agent"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary focus:bg-white"
            />
          </div>
          <select
            aria-label="按状态筛选"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as LongTermFlowStatus | '全部状态');
              resetPage();
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-primary"
          >
            {FLOW_STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
          </select>
          <select
            aria-label="按场景筛选"
            value={scenarioFilter}
            onChange={(event) => {
              setScenarioFilter(event.target.value as LongTermFlowScenarioType | '全部场景');
              resetPage();
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-primary"
          >
            {FLOW_SCENARIO_OPTIONS.map((scenario) => <option key={scenario}>{scenario}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3"><SortableHeader label="流程名称" sortKey="name" sortConfig={sortConfig} onSort={handleSort} /></th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">场景类型</th>
                <th className="px-4 py-3"><SortableHeader label="状态" sortKey="status" sortConfig={sortConfig} onSort={handleSort} /></th>
                <th className="px-4 py-3"><SortableHeader label="Agent 数" sortKey="agentCount" sortConfig={sortConfig} onSort={handleSort} /></th>
                <th className="px-4 py-3"><SortableHeader label="运行中任务" sortKey="runningTasks" sortConfig={sortConfig} onSort={handleSort} /></th>
                <th className="px-4 py-3"><SortableHeader label="今日待触发" sortKey="todayTriggers" sortConfig={sortConfig} onSort={handleSort} /></th>
                <th className="px-4 py-3"><SortableHeader label="异常待处理" sortKey="exceptionTasks" sortConfig={sortConfig} onSort={handleSort} /></th>
                <th className="px-4 py-3"><SortableHeader label="最近更新" sortKey="updatedAt" sortConfig={sortConfig} onSort={handleSort} /></th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedFlows.map((flow) => (
                <tr key={flow.id} className={flow.id === selectedFlowId ? 'bg-blue-50/40' : 'bg-white hover:bg-slate-50'}>
                  <td className="px-4 py-4">
                    <button type="button" onClick={() => onSelectFlow(flow.id)} className="text-left">
                      <div className="font-semibold text-slate-900">{flow.name}</div>
                      <div className="mt-1 max-w-md truncate text-xs text-slate-500">{flow.description}</div>
                    </button>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{flow.scenarioType}</td>
                  <td className="px-4 py-4"><StatusBadge status={flow.status} /></td>
                  <td className="px-4 py-4 text-sm text-slate-700">{flow.agentCount}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-800">{flow.runningTasks}</td>
                  <td className="px-4 py-4 text-sm text-amber-700">{flow.todayTriggers}</td>
                  <td className="px-4 py-4 text-sm text-rose-700">{flow.exceptionTasks}</td>
                  <td className="px-4 py-4 text-sm text-slate-500">{flow.updatedAt}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => onOpenDesigner(flow.id)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-primary hover:text-primary">
                        编辑
                      </button>
                      <button type="button" onClick={() => onOpenRuns(flow.id)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-primary hover:text-primary">
                        运行任务
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedFlows.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <FileText size={34} className="text-slate-300" />
            <div className="mt-3 font-semibold text-slate-700">暂无匹配的流程方案</div>
            <div className="mt-1 text-sm text-slate-400">请调整搜索词或筛选条件。</div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <CalendarClock size={15} /> 共 {filteredFlows.length} 条，当前 {safeCurrentPage} / {totalPages} 页
          </div>
          <div className="flex items-center gap-2">
            <span>每页</span>
            <select
              aria-label="选择每页条数"
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

    </section>
  );
}

