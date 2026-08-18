// 通话分析页签，展示通话量趋势、时长分布、重复呼入、地域排行、时段热力和挂断原因。
import React, { useMemo, useState } from 'react';
import { Headphones, Phone, PhoneOff, Repeat, Search, Timer, TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CallAnalysisData, CallDirectionFilter, CallVolumeTrendPoint, RepeatCallCustomer, ShortCallSample } from '../../types';
import { compareNumber, compareText, cx, EmptyTableState, formatDuration, formatRate, LoadingBlock, paginateRows, ReportTablePagination, SortableHeader, SortState, StatCard, StatusBadge, toggleSort } from './reportUi';

interface CallAnalysisTabProps {
  data: CallAnalysisData;
  transferCount: number;
  callDirection: CallDirectionFilter;
  onViewCall: (callId: string) => void;
  isLoading?: boolean;
}

const heatColor = (value: number, max: number) => {
  if (max === 0) return 'bg-slate-50';
  const ratio = value / max;
  if (ratio > 0.8) return 'bg-sky-600';
  if (ratio > 0.6) return 'bg-sky-500';
  if (ratio > 0.4) return 'bg-sky-400';
  if (ratio > 0.2) return 'bg-sky-300';
  if (ratio > 0.05) return 'bg-sky-200';
  return 'bg-slate-100';
};

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const CUSTOMER_PAGE_SIZE_OPTIONS = [5, 10, 20];
const SHORT_CALL_PAGE_SIZE_OPTIONS = [5, 10, 20];

type RepeatSortKey = 'customerPhone' | 'count24h' | 'count7d' | 'unresolvedCount' | 'lastCallTime';
type ShortCallSortKey = 'callId' | 'duration' | 'hangupBy' | 'hangupReason' | 'businessName';

export default function CallAnalysisTab({ data, transferCount, callDirection, onViewCall, isLoading = false }: CallAnalysisTabProps) {
  const { metrics } = data;
  const maxRegion = Math.max(...data.regionStats.map(r => r.totalCalls), 1);
  const heatMax = Math.max(...data.weekdayHourHeatmap.flat(), 1);
  const maxHangup = Math.max(...data.hangupReasons.map(h => h.count), 1);
  const userHangupCount = Math.round(metrics.totalCalls * metrics.userHangupRate);
  const transferRate = transferCount / Math.max(1, metrics.totalCalls);
  const repeatRate = metrics.repeatCustomers / Math.max(1, metrics.totalCalls);

  if (isLoading) {
    return <LoadingBlock rows={6} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard title="通话总量" value={metrics.totalCalls.toLocaleString()} tone="blue" icon={<Phone size={22} />} />
        <StatCard title="接通率" value={formatRate(metrics.connectionRate)} tone="green" icon={<TrendingUp size={22} />} />
        <StatCard title="有效通话率" value={formatRate(metrics.effectiveRate)} desc="时长 >15 秒" tone="green" />
        <StatCard title="平均通话时长" value={formatDuration(metrics.avgDuration)} tone="blue" icon={<Timer size={22} />} />
        <StatCard title="转人工量" value={transferCount.toLocaleString()} desc={`转人工率 ${formatRate(transferRate)}`} tone="purple" icon={<Headphones size={22} />} />
        <StatCard title="重复呼入客户" value={metrics.repeatCustomers.toLocaleString()} desc={`占比 ${formatRate(repeatRate)}`} tone="amber" icon={<Repeat size={22} />} />
        <StatCard title="用户主动挂断量" value={userHangupCount.toLocaleString()} desc={`占比 ${formatRate(metrics.userHangupRate)}`} tone="red" icon={<PhoneOff size={22} />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-base font-bold text-slate-800">通话量趋势</h3>
          <CallVolumeTrendChart data={data.volumeTrend} callDirection={callDirection} />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-bold text-slate-800">挂断 / 未接通原因</h3>
          <div className="space-y-2.5">
            {data.hangupReasons.map(item => (
              <div key={item.reason}>
                <div className="flex justify-between text-sm"><span className="text-slate-700">{item.reason}</span><span className="text-slate-500">{item.count}（{item.percentage}%）</span></div>
                <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-rose-400" style={{ width: `${(item.count / maxHangup) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5"><h3 className="text-base font-bold text-slate-800">通话时长分布</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">时长区间</th><th className="px-5 py-3">数量</th><th className="px-5 py-3">占比</th><th className="px-5 py-3">完成率</th><th className="px-5 py-3">转人工率</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.durationBuckets.map(b => (
                  <tr key={b.range}><td className="px-5 py-3 font-medium text-slate-700">{b.range}</td><td className="px-5 py-3">{b.count}</td><td className="px-5 py-3">{b.percentage}%</td><td className="px-5 py-3"><StatusBadge tone={b.completionRate > 0.7 ? 'green' : 'amber'}>{formatRate(b.completionRate)}</StatusBadge></td><td className="px-5 py-3">{formatRate(b.transferRate)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5"><h3 className="text-base font-bold text-slate-800">地域分析（呼叫量 TOP）</h3></div>
          <div className="space-y-2.5 p-5">
            {data.regionStats.slice(0, 8).map(r => (
              <div key={r.region}>
                <div className="flex justify-between text-sm"><span className="text-slate-700">{r.region}</span><span className="text-slate-500">{r.totalCalls}｜接通 {formatRate(r.connectionRate)}</span></div>
                <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary" style={{ width: `${(r.totalCalls / maxRegion) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-slate-800">时段热力图（通话量）</h3>
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="flex">
              <div className="w-12 shrink-0" />
              {Array.from({ length: 24 }, (_, h) => <div key={h} className="flex-1 text-center text-[10px] text-slate-400">{h}</div>)}
            </div>
            {data.weekdayHourHeatmap.map((row, day) => (
              <div key={day} className="mt-1 flex items-center">
                <div className="w-12 shrink-0 text-xs text-slate-500">{WEEKDAYS[day]}</div>
                {row.map((value, hour) => (
                  <div key={hour} className="flex-1 px-0.5">
                    <div className={cx('h-5 rounded-sm', heatColor(value, heatMax))} title={`${WEEKDAYS[day]} ${hour}:00｜${value} 通`} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RepeatCustomerTable rows={data.repeatCustomers} />
        <ShortCallSampleTable rows={data.shortCallSamples} onViewCall={onViewCall} />
      </div>
    </div>
  );
}

interface CallVolumeTrendChartProps {
  data: CallVolumeTrendPoint[];
  callDirection: CallDirectionFilter;
}

// 按呼叫方向切换趋势口径：呼入看有效接待，外呼看接通，全部看总体有效通话。
function CallVolumeTrendChart({ data, callDirection }: CallVolumeTrendChartProps) {
  const trendConfig = useMemo(() => getTrendConfig(callDirection), [callDirection]);
  const chartData = useMemo(() => data.map(point => ({
    label: point.label,
    primaryValue: trendConfig.getPrimary(point),
    secondaryValue: trendConfig.getSecondary(point),
  })), [data, trendConfig]);

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 18, left: -16, bottom: 6 }}>
          <defs>
            <linearGradient id="callTrendTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.24} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="callTrendConnected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" vertical={true} />
          <XAxis
            dataKey="label"
            tickFormatter={formatTrendLabel}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            tick={{ fill: '#64748b', fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={20}
          />
          <YAxis
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            tick={{ fill: '#64748b', fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip content={<CallTrendTooltip />} />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            wrapperStyle={{ paddingTop: 12, fontSize: 12, color: '#64748b' }}
          />
          <Area
            type="monotone"
            dataKey="primaryValue"
            name={trendConfig.primaryLabel}
            stroke="#3b82f6"
            strokeWidth={3}
            fill="url(#callTrendTotal)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
          />
          <Area
            type="monotone"
            dataKey="secondaryValue"
            name={trendConfig.secondaryLabel}
            stroke="#10b981"
            strokeWidth={3}
            fill="url(#callTrendConnected)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TrendConfig {
  primaryLabel: string;
  secondaryLabel: string;
  getPrimary: (point: CallVolumeTrendPoint) => number;
  getSecondary: (point: CallVolumeTrendPoint) => number;
}

// 统一管理通话量趋势图的业务口径，避免呼入场景误用“接通量”。
function getTrendConfig(callDirection: CallDirectionFilter): TrendConfig {
  if (callDirection === '呼入') {
    return {
      primaryLabel: '呼入量',
      secondaryLabel: '有效接待量',
      getPrimary: point => point.inbound,
      getSecondary: point => point.inboundEffective,
    };
  }

  if (callDirection === '外呼') {
    return {
      primaryLabel: '外呼量',
      secondaryLabel: '接通量',
      getPrimary: point => point.outbound,
      getSecondary: point => point.outboundConnected,
    };
  }

  return {
    primaryLabel: '总通话数',
    secondaryLabel: '有效通话数',
    getPrimary: point => point.inbound + point.outbound,
    getSecondary: point => point.effective,
  };
}

// 日期按月/日展示，小时粒度保持原始时间。
function formatTrendLabel(label: string) {
  if (label.includes(':')) return label;
  const date = new Date(`${label}T00:00:00`);
  if (Number.isNaN(date.getTime())) return label;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

interface CallTrendTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{
    color?: string;
    name?: string;
    value?: number;
  }>;
}

// 自定义提示框，让折线图悬停信息更接近真实报表。
function CallTrendTooltip({ active, label, payload }: CallTrendTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-bold text-slate-700">{label}</div>
      <div className="space-y-1">
        {payload.map(item => (
          <div key={item.name} className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-bold text-slate-800">{(item.value ?? 0).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface RepeatCustomerTableProps {
  rows: RepeatCallCustomer[];
}

function RepeatCustomerTable({ rows }: RepeatCustomerTableProps) {
  const [sort, setSort] = useState<SortState<RepeatSortKey>>({ key: 'count24h', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [query, setQuery] = useState('');

  // 先按号码、业务和结果过滤，再按运营关注度排序。
  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchedRows = normalizedQuery.length === 0
      ? rows
      : rows.filter(row => [row.customerPhone, row.lastBusiness, row.lastResult].some(value => value.toLowerCase().includes(normalizedQuery)));
    return [...matchedRows].sort((left, right) => {
      const direction = sort.direction === 'asc' ? 1 : -1;
      const result = sort.key === 'customerPhone'
        ? compareText(left.customerPhone, right.customerPhone)
        : compareNumber(left[sort.key], right[sort.key]);
      return result * direction;
    });
  }, [query, rows, sort]);

  const pageData = paginateRows<RepeatCallCustomer>(filteredRows, page, pageSize);
  const handleSort = (key: RepeatSortKey) => {
    setSort(current => toggleSort(current, key));
    setPage(1);
  };
  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <TableToolbar title="重复呼入 TOP 客户" value={query} onChange={setQuery} placeholder="搜号码 / 业务 / 结果" />
      {filteredRows.length === 0 ? (
        <EmptyTableState desc="当前筛选条件下没有重复呼入客户。" />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <SortableHeader label="客户号码" sortKey="customerPhone" sort={sort} onSort={handleSort} className="px-5" />
                  <SortableHeader label="24h" sortKey="count24h" sort={sort} onSort={handleSort} className="px-5" />
                  <SortableHeader label="7d" sortKey="count7d" sort={sort} onSort={handleSort} className="px-5" />
                  <th className="px-5 py-3">最近业务</th>
                  <th className="px-5 py-3">最近结果</th>
                  <SortableHeader label="未解决" sortKey="unresolvedCount" sort={sort} onSort={handleSort} className="px-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageData.rows.map(customer => (
                  <tr key={customer.customerPhone} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono text-xs">{customer.customerPhone}</td>
                    <td className="px-5 py-3 font-semibold text-rose-600">{customer.count24h}</td>
                    <td className="px-5 py-3">{customer.count7d}</td>
                    <td className="px-5 py-3">{customer.lastBusiness}</td>
                    <td className="px-5 py-3">{customer.lastResult}</td>
                    <td className="px-5 py-3">{customer.unresolvedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ReportTablePagination page={pageData.safePage} totalPages={pageData.totalPages} total={filteredRows.length} pageSize={pageSize} pageSizeOptions={CUSTOMER_PAGE_SIZE_OPTIONS} onPageSizeChange={handlePageSizeChange} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

interface ShortCallSampleTableProps {
  rows: ShortCallSample[];
  onViewCall: (callId: string) => void;
}

function ShortCallSampleTable({ rows, onViewCall }: ShortCallSampleTableProps) {
  const [sort, setSort] = useState<SortState<ShortCallSortKey>>({ key: 'duration', direction: 'asc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [query, setQuery] = useState('');

  // 短通话默认按时长从短到长，方便先看最异常样本。
  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchedRows = normalizedQuery.length === 0
      ? rows
      : rows.filter(row => [row.callId, row.hangupBy, row.hangupReason, row.lastNode, row.businessName].some(value => value.toLowerCase().includes(normalizedQuery)));
    return [...matchedRows].sort((left, right) => {
      const direction = sort.direction === 'asc' ? 1 : -1;
      const result = sort.key === 'duration'
        ? compareNumber(left.duration, right.duration)
        : compareText(left[sort.key], right[sort.key]);
      return result * direction;
    });
  }, [query, rows, sort]);

  const pageData = paginateRows<ShortCallSample>(filteredRows, page, pageSize);
  const handleSort = (key: ShortCallSortKey) => {
    setSort(current => toggleSort(current, key));
    setPage(1);
  };
  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <TableToolbar title="短通话样本" value={query} onChange={setQuery} placeholder="搜通话 / 原因 / 节点" />
      {filteredRows.length === 0 ? (
        <EmptyTableState desc="当前筛选条件下没有短通话样本。" />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <SortableHeader label="通话 ID" sortKey="callId" sort={sort} onSort={handleSort} className="px-5" />
                  <SortableHeader label="时长" sortKey="duration" sort={sort} onSort={handleSort} className="px-5" />
                  <SortableHeader label="挂断方" sortKey="hangupBy" sort={sort} onSort={handleSort} className="px-5" />
                  <SortableHeader label="原因" sortKey="hangupReason" sort={sort} onSort={handleSort} className="px-5" />
                  <th className="px-5 py-3">最近节点</th>
                  <th className="px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageData.rows.map(sample => (
                  <tr key={sample.callId} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono text-xs">{sample.callId}</td>
                    <td className="px-5 py-3">{sample.duration}秒</td>
                    <td className="px-5 py-3">{sample.hangupBy}</td>
                    <td className="px-5 py-3">{sample.hangupReason}</td>
                    <td className="px-5 py-3">{sample.lastNode}</td>
                    <td className="px-5 py-3"><button className="text-xs font-bold text-primary hover:text-blue-700" onClick={() => onViewCall(sample.callId)}>查看通话</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ReportTablePagination page={pageData.safePage} totalPages={pageData.totalPages} total={filteredRows.length} pageSize={pageSize} pageSizeOptions={SHORT_CALL_PAGE_SIZE_OPTIONS} onPageSizeChange={handlePageSizeChange} onPageChange={setPage} />
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
      <label className="relative w-full sm:w-56">
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
