// 报表页面共享展示工具，服务监控报表各个子模块。
import React from 'react';
import { AlertEvent } from '../../types';

export const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' ');

export const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`;
};

export const formatRate = (rate: number) => `${(rate * 100).toFixed(1)}%`;
export const formatTime = (time: number) => new Date(time).toLocaleString();

export type SortDirection = 'asc' | 'desc';

export interface SortState<T extends string> {
  key: T;
  direction: SortDirection;
}

export const toggleSort = <T extends string>(current: SortState<T>, key: T): SortState<T> => ({
  key,
  direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
});

export const compareText = (left: string, right: string) => left.localeCompare(right, 'zh-Hans-CN');
export const compareNumber = (left: number, right: number) => left - right;

export function paginateRows<T>(rows: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    totalPages,
    safePage,
    rows: rows.slice((safePage - 1) * pageSize, safePage * pageSize),
  };
}

export const StatCard: React.FC<{
  title: string;
  value: React.ReactNode;
  desc?: string;
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  icon?: React.ReactNode;
}> = ({ title, value, desc, tone = 'blue', icon }) => {
  const toneMap = {
    blue: { card: 'border-blue-100 bg-gradient-to-br from-blue-50 to-white', glow: 'bg-blue-200/40', icon: 'text-blue-600 bg-white ring-blue-100', value: 'text-blue-950' },
    green: { card: 'border-emerald-100 bg-gradient-to-br from-emerald-50 to-white', glow: 'bg-emerald-200/40', icon: 'text-emerald-600 bg-white ring-emerald-100', value: 'text-emerald-950' },
    amber: { card: 'border-amber-100 bg-gradient-to-br from-amber-50 to-white', glow: 'bg-amber-200/40', icon: 'text-amber-600 bg-white ring-amber-100', value: 'text-amber-950' },
    red: { card: 'border-rose-100 bg-gradient-to-br from-rose-50 to-white', glow: 'bg-rose-200/40', icon: 'text-rose-600 bg-white ring-rose-100', value: 'text-rose-950' },
    purple: { card: 'border-violet-100 bg-gradient-to-br from-violet-50 to-white', glow: 'bg-violet-200/40', icon: 'text-violet-600 bg-white ring-violet-100', value: 'text-violet-950' },
  };
  const toneStyle = toneMap[tone];

  return (
    <div className={cx('group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md', toneStyle.card)}>
      <span className={cx('pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl transition-transform group-hover:scale-125', toneStyle.glow)} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <div className={cx('mt-3 text-3xl font-black tracking-tight', toneStyle.value)}>{value}</div>
          {desc && <p className="mt-2 text-xs font-semibold text-slate-500">{desc}</p>}
        </div>
        {icon && <div className={cx('rounded-xl p-2.5 shadow-sm ring-1', toneStyle.icon)}>{icon}</div>}
      </div>
    </div>
  );
};

export const StatusBadge: React.FC<{ children: React.ReactNode; tone?: 'green' | 'red' | 'amber' | 'blue' | 'slate' }> = ({ children, tone = 'slate' }) => {
  const toneMap = {
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700',
    slate: 'bg-slate-100 text-slate-600',
  };
  return <span className={cx('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', toneMap[tone])}>{children}</span>;
};

export const SortableHeader = <T extends string>({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: T;
  sort: SortState<T>;
  onSort: (key: T) => void;
  className?: string;
}) => {
  const active = sort.key === sortKey;
  return (
    <th className={cx('px-6 py-3', className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cx('inline-flex items-center gap-1 rounded-md text-xs font-bold transition hover:text-slate-800', active ? 'text-slate-800' : 'text-slate-500')}
        aria-label={`按${label}排序`}
      >
        {label}
        <span className={cx('text-[10px]', active ? 'text-primary' : 'text-slate-300')}>{active ? (sort.direction === 'desc' ? '↓' : '↑') : '↕'}</span>
      </button>
    </th>
  );
};

export const ReportTablePagination: React.FC<{
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
}> = ({ page, totalPages, total, pageSize, onPageChange, pageSizeOptions = [], onPageSizeChange }) => {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <span>共 {total.toLocaleString()} 条，当前 {start}-{end}</span>
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <label className="mr-1 flex items-center gap-1 font-semibold text-slate-500">
            每页
            <select
              value={pageSize}
              onChange={event => onPageSizeChange(Number(event.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-600 outline-none transition hover:bg-slate-50 focus:border-primary"
            >
              {pageSizeOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          上一页
        </button>
        <span className="min-w-16 text-center font-semibold text-slate-600">{page} / {totalPages}</span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          下一页
        </button>
      </div>
    </div>
  );
};

export const EmptyTableState: React.FC<{ title?: string; desc?: string; action?: React.ReactNode }> = ({ title = '暂无数据', desc = '当前筛选条件下没有可展示的报表记录。', action }) => (
  <div className="flex min-h-36 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{title}</div>
    <p className="max-w-md text-xs text-slate-400">{desc}</p>
    {action}
  </div>
);

export const LoadingBlock: React.FC<{ rows?: number; title?: string }> = ({ rows = 4, title = '正在加载报表数据' }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-busy="true">
    <div className="mb-5 flex items-center gap-3 text-sm font-bold text-slate-500">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
      {title}
    </div>
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-10 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  </div>
);

export const getRealtimeStatus = (status: string) => {
  const map: Record<string, { label: string; tone: 'green' | 'red' | 'amber' | 'blue' | 'slate' }> = {
    in_call: { label: '通话中', tone: 'green' },
    queueing: { label: '排队中', tone: 'amber' },
    transferring: { label: '转人工中', tone: 'blue' },
    error: { label: '异常', tone: 'red' },
  };
  return map[status] || { label: status, tone: 'slate' };
};

export const getAlertTone = (level: AlertEvent['level']) => {
  if (level === 'high') return { label: '高', tone: 'red' as const };
  if (level === 'medium') return { label: '中', tone: 'amber' as const };
  return { label: '低', tone: 'blue' as const };
};
