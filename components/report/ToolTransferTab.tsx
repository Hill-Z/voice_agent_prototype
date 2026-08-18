// 工具调用报表区块，只展示工具调用稳定性和性能数据。
import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { ToolCallReport } from '../../types';
import { compareNumber, compareText, EmptyTableState, formatRate, LoadingBlock, paginateRows, ReportTablePagination, SortableHeader, SortState, StatusBadge, toggleSort } from './reportUi';

interface ToolTransferTabProps {
  tools: ToolCallReport[];
  isLoading?: boolean;
}

type ToolSortKey = 'toolName' | 'botCount' | 'toolType' | 'callCount' | 'successRate' | 'avgLatencyMs' | 'timeoutCount' | 'directPlayCount' | 'directPlaySuccessRate' | 'modelReplyCount' | 'savedModelCalls';

const TOOL_PAGE_SIZE_OPTIONS = [5, 10, 20];

export default function ToolTransferTab({ tools, isLoading = false }: ToolTransferTabProps) {
  if (isLoading) {
    return <LoadingBlock rows={5} />;
  }

  return <ToolCallTable tools={tools} />;
}

interface ToolCallTableProps {
  tools: ToolCallReport[];
}

function ToolCallTable({ tools }: ToolCallTableProps) {
  const [sort, setSort] = useState<SortState<ToolSortKey>>({ key: 'callCount', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [query, setQuery] = useState('');

  // 工具表按名称、类型和失败原因过滤，支持运营人员快速定位不稳定工具。
  const filteredTools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchedTools = normalizedQuery.length === 0
      ? tools
      : tools.filter(tool => [tool.toolName, tool.toolType, tool.topFailureReason].some(value => value.toLowerCase().includes(normalizedQuery)));
    return [...matchedTools].sort((left, right) => {
      const direction = sort.direction === 'asc' ? 1 : -1;
      const result = sort.key === 'toolName' || sort.key === 'toolType'
        ? compareText(left[sort.key], right[sort.key])
        : compareNumber(left[sort.key], right[sort.key]);
      return result * direction;
    });
  }, [query, sort, tools]);

  const pageData = paginateRows<ToolCallReport>(filteredTools, page, pageSize);
  const handleSort = (key: ToolSortKey) => {
    setSort(current => toggleSort(current, key));
    setPage(1);
  };
  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <TableToolbar title="工具调用报表" value={query} onChange={setQuery} placeholder="搜工具 / 类型 / 失败原因" />
      {filteredTools.length === 0 ? (
        <EmptyTableState desc="当前筛选条件下没有工具调用记录。" />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1440px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <SortableHeader label="工具名称" sortKey="toolName" sort={sort} onSort={handleSort} className="px-5" />
                  <SortableHeader label="关联机器人" sortKey="botCount" sort={sort} onSort={handleSort} className="px-5" />
                  <SortableHeader label="类型" sortKey="toolType" sort={sort} onSort={handleSort} className="px-5" />
                  <SortableHeader label="调用次数" sortKey="callCount" sort={sort} onSort={handleSort} className="px-5" />
                  <SortableHeader label="成功率" sortKey="successRate" sort={sort} onSort={handleSort} className="px-5" />
                  <SortableHeader label="平均耗时" sortKey="avgLatencyMs" sort={sort} onSort={handleSort} className="px-5" />
                  <SortableHeader label="超时次数" sortKey="timeoutCount" sort={sort} onSort={handleSort} className="px-5" />
                  <SortableHeader label="直接播报次数" sortKey="directPlayCount" sort={sort} onSort={handleSort} className="px-5" />
                  <SortableHeader label="直接播报成功率" sortKey="directPlaySuccessRate" sort={sort} onSort={handleSort} className="px-5" />
                  <SortableHeader label="调模型回复次数" sortKey="modelReplyCount" sort={sort} onSort={handleSort} className="px-5" />
                  <SortableHeader label="节省模型次数" sortKey="savedModelCalls" sort={sort} onSort={handleSort} className="px-5" />
                  <th className="px-5 py-3">失败原因 TOP1</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageData.rows.map(tool => (
                  <tr key={tool.toolId} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3"><b>{tool.toolName}</b></td>
                    <td className="px-5 py-3">{tool.botCount} 个</td>
                    <td className="px-5 py-3"><StatusBadge tone="blue">{tool.toolType}</StatusBadge></td>
                    <td className="px-5 py-3">{tool.callCount.toLocaleString()}</td>
                    <td className="px-5 py-3"><StatusBadge tone={tool.successRate > 0.9 ? 'green' : 'amber'}>{formatRate(tool.successRate)}</StatusBadge></td>
                    <td className="px-5 py-3">{tool.avgLatencyMs}ms</td>
                    <td className="px-5 py-3">{tool.timeoutCount}</td>
                    <td className="px-5 py-3">{tool.directPlayCount}</td>
                    <td className="px-5 py-3">{formatRate(tool.directPlaySuccessRate)}</td>
                    <td className="px-5 py-3">{tool.modelReplyCount}</td>
                    <td className="px-5 py-3">{tool.savedModelCalls}</td>
                    <td className="px-5 py-3">{tool.topFailureReason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ReportTablePagination page={pageData.safePage} totalPages={pageData.totalPages} total={filteredTools.length} pageSize={pageSize} pageSizeOptions={TOOL_PAGE_SIZE_OPTIONS} onPageSizeChange={handlePageSizeChange} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

interface TableToolbarProps {
  title: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

function TableToolbar({ title, value, placeholder, onChange }: TableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      <label className="relative w-full sm:w-60">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white"
        />
      </label>
    </div>
  );
}
