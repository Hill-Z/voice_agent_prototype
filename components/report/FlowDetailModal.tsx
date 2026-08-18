// Flow 明细弹窗：承载 Step 与边 / 分支的搜索、排序、滚动和分页展示。
import React, { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { FlowFunnelEdgeReport, FlowFunnelNodeReport, FlowFunnelReport } from '../../types';
import {
  compareNumber,
  compareText,
  cx,
  EmptyTableState,
  formatDuration,
  formatRate,
  paginateRows,
  ReportTablePagination,
  SortableHeader,
  SortState,
  toggleSort,
} from './reportUi';

export type FlowDetailModalState = {
  type: 'steps' | 'edges';
  flow: FlowFunnelReport;
};

type StepSortKey = 'nodeName' | 'nodeType' | 'enteredCount' | 'avgStaySeconds' | 'transferCount' | 'userHangupCount';
type EdgeSortKey = 'fromNode' | 'toNode' | 'branchType' | 'conditionText' | 'hitCount' | 'hitRate';

const FLOW_DETAIL_PAGE_SIZE = 8;
const FLOW_DETAIL_PAGE_SIZE_OPTIONS = [8, 15, 30];

interface FlowDetailModalProps {
  detail: FlowDetailModalState;
  onClose: () => void;
}

// 展示当前 Flow 的节点或连线明细，点击遮罩或按 Escape 可关闭。
export default function FlowDetailModal({ detail, onClose }: FlowDetailModalProps) {
  const isStep = detail.type === 'steps';
  const title = isStep ? 'Step 明细' : '边 / 分支明细';
  const [query, setQuery] = useState('');
  const [stepSort, setStepSort] = useState<SortState<StepSortKey>>({ key: 'enteredCount', direction: 'desc' });
  const [edgeSort, setEdgeSort] = useState<SortState<EdgeSortKey>>({ key: 'hitCount', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(FLOW_DETAIL_PAGE_SIZE);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setQuery('');
    setPage(1);
  }, [detail.flow.flowId, detail.type]);

  // 根据明细类型切换搜索目标，避免 Step 和边互相污染状态。
  const stepRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchedRows = normalizedQuery.length === 0
      ? detail.flow.nodes
      : detail.flow.nodes.filter(node => matchValues(normalizedQuery, node.nodeName, node.nodeType));

    return [...matchedRows].sort((left, right) => {
      const direction = stepSort.direction === 'asc' ? 1 : -1;
      const result = getStepSortResult(left, right, stepSort.key);
      return result * direction;
    });
  }, [detail.flow.nodes, query, stepSort]);

  const edgeRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchedRows = normalizedQuery.length === 0
      ? detail.flow.edges
      : detail.flow.edges.filter(edge => matchValues(
        normalizedQuery,
        edge.fromNode,
        edge.toNode,
        edge.conditionText,
        getBranchTypeLabel(edge.branchType)
      ));

    return [...matchedRows].sort((left, right) => {
      const direction = edgeSort.direction === 'asc' ? 1 : -1;
      const result = getEdgeSortResult(left, right, edgeSort.key);
      return result * direction;
    });
  }, [detail.flow.edges, edgeSort, query]);

  const rows = isStep ? stepRows : edgeRows;
  const pageData = paginateRows(rows, page, pageSize);
  const emptyDesc = isStep ? '当前搜索没有命中的 Step。' : '当前搜索没有命中的边或分支。';

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="关闭弹窗背景" />
      <section className="relative flex max-h-[82vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-400" title={detail.flow.flowName}>{detail.flow.flowName}</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">{title}</h3>
          </div>
          <div className="flex items-center gap-3">
            <FlowDetailSearchInput
              value={query}
              onChange={value => {
                setQuery(value);
                setPage(1);
              }}
              placeholder={isStep ? '搜索 Step 名称 / 类型' : '搜索起点 / 终点 / 条件'}
            />
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="关闭弹窗"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyTableState desc={emptyDesc} />
        ) : (
          <>
            <div className="max-h-[52vh] overflow-auto">
              {isStep ? (
                <StepDetailTable
                  rows={pageData.rows as FlowFunnelNodeReport[]}
                  sort={stepSort}
                  onSort={key => {
                    setStepSort(current => toggleSort(current, key));
                    setPage(1);
                  }}
                />
              ) : (
                <EdgeDetailTable
                  rows={pageData.rows as FlowFunnelEdgeReport[]}
                  sort={edgeSort}
                  onSort={key => {
                    setEdgeSort(current => toggleSort(current, key));
                    setPage(1);
                  }}
                />
              )}
            </div>
            <ReportTablePagination
              page={pageData.safePage}
              totalPages={pageData.totalPages}
              total={rows.length}
              pageSize={pageSize}
              pageSizeOptions={FLOW_DETAIL_PAGE_SIZE_OPTIONS}
              onPageSizeChange={handlePageSizeChange}
              onPageChange={setPage}
            />
          </>
        )}
      </section>
    </div>
  );
}

interface StepDetailTableProps {
  rows: FlowFunnelNodeReport[];
  sort: SortState<StepSortKey>;
  onSort: (key: StepSortKey) => void;
}

// 渲染 Step 明细表，表头固定，长列表在弹窗内部滚动。
function StepDetailTable({ rows, sort, onSort }: StepDetailTableProps) {
  return (
    <table className="w-full min-w-[760px] text-left text-xs">
      <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
        <tr>
          <SortableHeader label="Step 名称" sortKey="nodeName" sort={sort} onSort={onSort} className="px-6 py-3" />
          <SortableHeader label="Step 类型" sortKey="nodeType" sort={sort} onSort={onSort} className="px-4 py-3" />
          <SortableHeader label="进入量" sortKey="enteredCount" sort={sort} onSort={onSort} className="px-4 py-3" />
          <SortableHeader label="平均停留时长" sortKey="avgStaySeconds" sort={sort} onSort={onSort} className="px-4 py-3" />
          <SortableHeader label="转人工量" sortKey="transferCount" sort={sort} onSort={onSort} className="px-4 py-3" />
          <SortableHeader label="用户挂断量" sortKey="userHangupCount" sort={sort} onSort={onSort} className="px-4 py-3" />
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map(node => (
          <tr key={node.nodeId} className="transition-colors hover:bg-slate-50/70">
            <td className="px-6 py-3">
              <span className="block max-w-56 truncate font-semibold text-slate-800" title={node.nodeName}>{node.nodeName}</span>
            </td>
            <td className="px-4 py-3 font-medium text-slate-600">{node.nodeType}</td>
            <td className="px-4 py-3 font-semibold text-slate-800">{node.enteredCount.toLocaleString()}</td>
            <td className="px-4 py-3 text-slate-700">{formatDuration(node.avgStaySeconds)}</td>
            <td className="px-4 py-3 text-slate-700">{node.transferCount.toLocaleString()}</td>
            <td className="px-4 py-3 text-slate-700">{node.userHangupCount.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface EdgeDetailTableProps {
  rows: FlowFunnelEdgeReport[];
  sort: SortState<EdgeSortKey>;
  onSort: (key: EdgeSortKey) => void;
}

// 渲染边 / 分支明细表，统一支持横向和纵向滚动。
function EdgeDetailTable({ rows, sort, onSort }: EdgeDetailTableProps) {
  return (
    <table className="w-full min-w-[860px] text-left text-xs">
      <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
        <tr>
          <SortableHeader label="起点 Step" sortKey="fromNode" sort={sort} onSort={onSort} className="px-6 py-3" />
          <SortableHeader label="终点 Step" sortKey="toNode" sort={sort} onSort={onSort} className="px-4 py-3" />
          <SortableHeader label="分支类型" sortKey="branchType" sort={sort} onSort={onSort} className="px-4 py-3" />
          <SortableHeader label="条件说明" sortKey="conditionText" sort={sort} onSort={onSort} className="px-4 py-3" />
          <SortableHeader label="命中次数" sortKey="hitCount" sort={sort} onSort={onSort} className="px-4 py-3" />
          <SortableHeader label="命中占比" sortKey="hitRate" sort={sort} onSort={onSort} className="px-4 py-3" />
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map(edge => (
          <tr key={edge.edgeId} className="transition-colors hover:bg-slate-50/70">
            <td className="px-6 py-3 font-medium text-slate-700">{edge.fromNode}</td>
            <td className="px-4 py-3 font-medium text-slate-700">{edge.toNode}</td>
            <td className="px-4 py-3">
              <span className={cx(
                'inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold',
                getBranchTypeTone(edge.branchType)
              )}>{getBranchTypeLabel(edge.branchType)}</span>
            </td>
            <td className="px-4 py-3">
              <span className="block max-w-64 truncate text-slate-500" title={edge.conditionText}>{edge.conditionText}</span>
            </td>
            <td className="px-4 py-3 font-semibold text-slate-800">{edge.hitCount.toLocaleString()}</td>
            <td className="px-4 py-3 text-slate-700">{formatRate(edge.hitRate)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface FlowDetailSearchInputProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

// 弹窗内搜索框，统一用于 Step 和边 / 分支。
function FlowDetailSearchInput({ value, placeholder, onChange }: FlowDetailSearchInputProps) {
  return (
    <label className="relative w-56 sm:w-72">
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

// 判断搜索词是否命中多个字段中的任意一个。
function matchValues(query: string, ...values: string[]) {
  return values.some(value => value.toLowerCase().includes(query));
}

// 计算 Step 表排序结果。
function getStepSortResult(left: FlowFunnelNodeReport, right: FlowFunnelNodeReport, key: StepSortKey) {
  if (key === 'nodeName' || key === 'nodeType') {
    return compareText(left[key], right[key]);
  }
  return compareNumber(left[key], right[key]);
}

// 计算边 / 分支表排序结果。
function getEdgeSortResult(left: FlowFunnelEdgeReport, right: FlowFunnelEdgeReport, key: EdgeSortKey) {
  if (key === 'hitCount' || key === 'hitRate') {
    return compareNumber(left[key], right[key]);
  }
  if (key === 'branchType') {
    return compareText(getBranchTypeLabel(left.branchType), getBranchTypeLabel(right.branchType));
  }
  return compareText(left[key], right[key]);
}

// 转换边类型为业务可读文案。
function getBranchTypeLabel(branchType: FlowFunnelEdgeReport['branchType']) {
  if (branchType === 'conditional') return '条件分支';
  if (branchType === 'llm_branch') return '大模型分支';
  return '普通连线';
}

// 按边类型返回标签颜色。
function getBranchTypeTone(branchType: FlowFunnelEdgeReport['branchType']) {
  if (branchType === 'conditional') return 'bg-emerald-100 text-emerald-700';
  if (branchType === 'llm_branch') return 'bg-blue-100 text-blue-700';
  return 'bg-slate-100 text-slate-600';
}
