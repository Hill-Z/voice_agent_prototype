// 计费中心 · 通话消费明细：每一通电话花了多少、按什么价花的。
// 表里的金额只来自已计费的通话；待定价与未接通的通话显示为「—」并单独计数，不混进合计。
import React, { useMemo, useState } from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import {
  BILLING_CALL_ROWS,
  BILLING_ROBOT_PROFILES,
  type BillingCallRow,
} from './billingData';
import { formatPricePerMin, milliToYuan, TIER_LABEL } from './billingEngine';
import { BILLING_STATUS_META, yuan } from './billingUi';
import type { BillingTier } from '../../types';
import {
  EmptyTableState,
  ReportTablePagination,
  SortableHeader,
  StatusBadge,
  cx,
  formatDuration,
  paginateRows,
  toggleSort,
  type SortState,
} from '../report/reportUi';
import type { RateBasisSubject } from './BillingBasisPanel';

type SortKey = 'startedAt' | 'durationSec' | 'priceMilli' | 'amountCents';
type StatusFilter = 'all' | 'billed' | 'free' | 'pending';
type DirectionFilter = 'all' | 'outbound' | 'inbound';
type TierFilter = 'all' | BillingTier;

const SELECT = 'h-9 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700';
// 搜索用的规范化：只留数字，去掉脱敏用的「*」。
// 表里的客户号码是脱敏的（176****1334），客户照着自己 CRM 里的完整号码搜永远搜不到，
// 会以为筛选坏了。去掉星号之后，完整号码的后四位、脱敏写法本身都能搜到。
const digitsOnly = (value: string): string => value.replace(/\D/g, '');
const INPUT = 'h-9 w-52 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700 placeholder:text-slate-400';
// 表头单元格的内边距。本表用 px-3，跟普通表头保持一致，所以要整个换掉 SortableHeader 的默认值。
const TH_CELL = 'whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-slate-500';

interface Props {
  from: string;
  to: string;
  onOpenBasis: (subject: RateBasisSubject) => void;
  onOpenCallRecord: (callId: string) => void;
}

// 明细行的默认排序：按通话时刻倒序，最近的在最前面。
const DEFAULT_SORT: SortState<SortKey> = { key: 'startedAt', direction: 'desc' };

// 已删除机器人的 id 集合。已删除的机器人不再占并发、也不在机器人列表里，
// 但它留下的通话记录仍然在这里，所以行上要标出来它已经不在了。
const deletedRobotIds = new Set(BILLING_ROBOT_PROFILES.filter((item) => item.state === 'deleted').map((item) => item.id));

const CallBillingDetail: React.FC<Props> = ({ from, to, onOpenBasis, onOpenCallRecord }) => {
  const [robotId, setRobotId] = useState<string>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [direction, setDirection] = useState<DirectionFilter>('all');
  const [tier, setTier] = useState<TierFilter>('all');
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState<SortState<SortKey>>(DEFAULT_SORT);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    // 号码按「只留数字」比对：客户输 1334 或 176****1334 都能命中 176****1334 这一行。
    const phoneNeedle = digitsOnly(needle);
    const rows = BILLING_CALL_ROWS.filter((row) => {
      const day = row.startedAt.slice(0, 10);
      if (day < from || day > to) return false;
      if (robotId !== 'all' && row.robotId !== robotId) return false;
      if (status !== 'all' && row.record.billingStatus !== status) return false;
      if (direction !== 'all' && row.direction !== direction) return false;
      // 档位只对已计费的通话有意义：待定价和未接通的行里没有真实档位。
      if (tier !== 'all' && (row.record.billingStatus !== 'billed' || row.record.snapshot.tier !== tier)) return false;
      // 号码两侧都只留数字再比：客户输 1334、176****1334 都能命中同一行。
      if (needle && !row.record.callId.toLowerCase().includes(needle) && !(phoneNeedle && digitsOnly(row.phoneNumber).includes(phoneNeedle))) return false;
      return true;
    });
    const dir = sort.direction === 'asc' ? 1 : -1;
    const value = (row: BillingCallRow): string | number => {
      if (sort.key === 'startedAt') return row.startedAt;
      if (sort.key === 'priceMilli') return row.record.snapshot.priceMilli;
      if (sort.key === 'amountCents') return row.record.amountCents;
      return row.durationSec;
    };
    return [...rows].sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * dir;
      return ((av as number) - (bv as number)) * dir;
    });
  }, [from, to, robotId, status, direction, tier, keyword, sort]);

  // 合计只累加已计费的钱；未计入的通话单独报数，避免「合计」看起来少算了却说不清。
  const billedCents = filtered.filter((row) => row.record.billingStatus === 'billed').reduce((sum, row) => sum + row.record.amountCents, 0);
  const billedSec = filtered.filter((row) => row.record.billingStatus === 'billed').reduce((sum, row) => sum + row.durationSec, 0);
  // 平均单价 = 已计费金额 ÷ 已计费时长。它是「实际收的钱摊到每分钟」，
  // 因为每通都向上取整到分，会比逐通的单价略高一点，所以叫「平均」而不是「费率」。
  const avgPriceMilli = billedSec > 0 ? (billedCents * 600) / billedSec : 0;
  const notCounted = filtered.filter((row) => row.record.billingStatus !== 'billed');
  const pendingCount = notCounted.filter((row) => row.record.billingStatus === 'pending').length;
  const freeCount = notCounted.filter((row) => row.record.billingStatus === 'free').length;

  const { totalPages, safePage, rows: pageRows } = paginateRows(filtered, page, pageSize);

  // 改筛选条件要回到第一页，否则会停在一个已经不存在的页码上。
  const resetPage = () => setPage(1);
  const changeFilter = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    resetPage();
  };

  const openBasis = (row: BillingCallRow) => {
    // 没计费的通话没有费率可言，这里给面板一个「算不出价」的主题，
    // 让它说清缺什么，而不是把占位快照里的 0 当成价格显示成「0.00 元/分钟」。
    // 缺什么读的是这条记录里冻结下来的那一份（billingMissing），不是机器人现在的配置。
    // 机器人后来补齐了配置也不改这里——否则回头看这通电话，会拿今天已经配好的机器人
    // 去解释当时的「算不出价」，客户看到的原因就是假的。
    const pendingReasons = row.record.billingStatus === 'pending' ? row.record.billingMissing ?? [] : [];
    onOpenBasis({
      snapshot: row.record.snapshot,
      title: row.robotName,
      subtitle: `${row.startedAt} · ${row.record.callId.slice(0, 8)}`,
      call: row.record,
      pending: pendingReasons.length > 0 ? { reasons: pendingReasons } : undefined,
    });
  };

  const clearFilters = () => {
    setRobotId('all');
    setStatus('all');
    setDirection('all');
    setTier('all');
    setKeyword('');
    resetPage();
  };

  const hasFilter =
    robotId !== 'all' || status !== 'all' ||
    direction !== 'all' || tier !== 'all' || keyword.trim() !== '';

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 px-5 py-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">机器人</span>
          <select className={SELECT} value={robotId} onChange={(event) => changeFilter(setRobotId)(event.target.value)}>
            <option value="all">全部机器人</option>
            {BILLING_ROBOT_PROFILES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.state === 'deleted' ? `${item.name}（已删除）` : item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">计费状态</span>
          <select className={SELECT} value={status} onChange={(event) => changeFilter(setStatus)(event.target.value as StatusFilter)}>
            <option value="all">全部状态</option>
            <option value="billed">已计费</option>
            <option value="pending">待定价</option>
            <option value="free">未接通不计费</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">通话类型</span>
          <select className={SELECT} value={direction} onChange={(event) => changeFilter(setDirection)(event.target.value as DirectionFilter)}>
            <option value="all">全部类型</option>
            <option value="outbound">呼出</option>
            <option value="inbound">呼入</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">费率档位</span>
          <select className={SELECT} value={tier} onChange={(event) => changeFilter(setTier)(event.target.value as TierFilter)}>
            <option value="all">全部档位</option>
            {(Object.keys(TIER_LABEL) as BillingTier[]).map((key) => (
              <option key={key} value={key}>{TIER_LABEL[key]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">关键词</span>
          <input
            type="search"
            className={INPUT}
            value={keyword}
            placeholder="搜 Call ID 或号码后四位"
            onChange={(event) => changeFilter(setKeyword)(event.target.value)}
          />
        </label>
        {hasFilter && (
          <button type="button" onClick={clearFilters} className="h-9 rounded-md px-3 text-sm text-slate-500 hover:bg-slate-100">
            重置筛选
          </button>
        )}
        <span className="ml-auto pb-2 text-xs text-slate-500">共 {filtered.length} 通</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyTableState
          title="没有符合条件的通话"
          desc="调整页首时间范围或这里的筛选条件试试。"
          action={
            hasFilter ? (
              <button type="button" onClick={clearFilters} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                重置筛选
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <SortableHeader label="通话时间" sortKey="startedAt" sort={sort} onSort={(key) => setSort(toggleSort(sort, key))} cellClassName={TH_CELL} />
                  <th scope="col" className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-slate-500">Call ID</th>
                  <th scope="col" className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-slate-500">机器人</th>
                  <th scope="col" className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-slate-500">客户号码</th>
                  <SortableHeader label="通话时长" sortKey="durationSec" sort={sort} onSort={(key) => setSort(toggleSort(sort, key))} cellClassName={TH_CELL} />
                  <SortableHeader label="适用费率" sortKey="priceMilli" sort={sort} onSort={(key) => setSort(toggleSort(sort, key))} cellClassName={TH_CELL} />
                  <SortableHeader label="本通费用" sortKey="amountCents" sort={sort} onSort={(key) => setSort(toggleSort(sort, key))} cellClassName={TH_CELL} />
                  <th scope="col" className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-slate-500">状态</th>
                  <th scope="col" className="whitespace-nowrap px-3 py-2 text-right text-xs font-semibold text-slate-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((row) => {
                  const { record } = row;
                  const meta = BILLING_STATUS_META[record.billingStatus];
                  const priced = record.billingStatus === 'billed';
                  return (
                    <tr
                      key={record.callId}
                      onClick={() => openBasis(row)}
                      className="cursor-pointer hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-slate-700">{row.startedAt}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-500" title={record.callId}>{record.callId.slice(0, 8)}…</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-slate-700">
                        {row.robotName}
                        {/* 已删除的机器人照样产生通话、照样扣钱，历史账要能对上，
                            所以这里必须标出来：客户看到一台自己不记得的机器人花了钱，
                            不标「已删除」就只能来问客服。 */}
                        {deletedRobotIds.has(row.robotId) && (
                          <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">已删除</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-slate-700">
                        {row.phoneNumber}
                        <span className="ml-1 text-xs text-slate-400">{row.direction === 'outbound' ? '呼出' : '呼入'}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-slate-700">
                        {record.billingStatus === 'free' ? '—' : formatDuration(row.durationSec)}
                      </td>
                      <td className={cx('whitespace-nowrap px-3 py-2.5 text-sm', priced ? 'text-slate-700' : 'text-slate-400')}>
                        {priced ? formatPricePerMin(record.snapshot.priceMilli) : '—'}
                      </td>
                      <td className={cx('whitespace-nowrap px-3 py-2.5 text-sm font-semibold', priced ? 'text-slate-900' : 'text-slate-400')}>
                        {/* 没计费的通话不写「0.00 元」——那读起来像「这通免费」，
                            实际是「暂不扣费、定价后补扣」。状态列已经说明了原因，这里留空。 */}
                        {priced ? yuan(record.amountCents) : '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(event) => { event.stopPropagation(); openBasis(row); }}
                            className="rounded px-2 py-1 text-xs text-primary hover:bg-blue-50"
                          >
                            为什么这个价
                          </button>
                          {row.inCallRecords && (
                            <button
                              type="button"
                              onClick={(event) => { event.stopPropagation(); onOpenCallRecord(record.callId); }}
                              className="inline-flex items-center gap-0.5 rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                              title="到通话记录里看这通电话"
                            >
                              通话记录
                              <ExternalLink size={12} />
                            </button>
                          )}
                          {/* 这个箭头只是「这一行可以点」的暗示，本身没有名字，
                              别让读屏把它念成一个没有标签的元素。 */}
                          <ChevronRight size={14} className="text-slate-300" aria-hidden />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={4} className="px-3 py-3 text-sm font-semibold text-slate-700">
                    已计费 {filtered.length - notCounted.length} 通合计
                  </td>
                  {/* 这一列的时长只统计已计费的通话，和右边的金额同口径；
                      未接通的通话没有时长可算，不计入这一行。 */}
                  <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-600">{formatDuration(billedSec)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-500" title="已计费金额 ÷ 已计费时长。每通都向上取整到分，所以这个数会略高于逐通的费率。">
                    {billedSec > 0 ? `平均 ${formatPricePerMin(avgPriceMilli)}` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm font-bold text-slate-900">{yuan(billedCents)}</td>
                  <td colSpan={2} className="px-3 py-3 text-right text-xs text-slate-500">
                    {/* 只列真的有的那几类：写「待定价 2 通、未接通 0 通」等于让客户
                        去读一个恒为 0 的数字，还得自己判断它是不是没统计上。 */}
                    {notCounted.length > 0
                      ? `另有 ${notCounted.length} 通未计入（${[
                          pendingCount > 0 ? `待定价 ${pendingCount} 通` : '',
                          freeCount > 0 ? `未接通 ${freeCount} 通` : '',
                        ].filter(Boolean).join('、')}）`
                      : '本筛选范围内没有未计入的通话'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <ReportTablePagination
            page={safePage}
            totalPages={totalPages}
            total={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            pageSizeOptions={[10, 20, 50]}
            onPageSizeChange={(size) => { setPageSize(size); resetPage(); }}
          />
        </>
      )}

      <p className="border-t border-slate-100 px-5 py-3 text-xs leading-5 text-slate-500">
        「本通费用」是这通电话实际扣掉的额度。「未接通不计费」表示客户没接，这通没有产生费用；
        「待定价」表示这通电话打的时候，这台机器人用的模型还没有配置价格，本通暂不扣费、也不计入合计，
        等价格补齐后会补扣。没计费的通话金额显示为「—」而不是「0.00 元」，避免看起来像「这通免费」。
        合计里的通话数和时长、金额都只统计已计费的通话——待定价的通话有时间但没有金额，
        全额算进来会让「金额 ÷ 时长」算不出这台机器人的真实单价，也会和「消费统计」里的同一行对不上。
        点任意一行（或行尾的「为什么这个价」按钮）可以看到这一通的价格是怎么来的。
      </p>
    </div>
  );
};

export default CallBillingDetail;
