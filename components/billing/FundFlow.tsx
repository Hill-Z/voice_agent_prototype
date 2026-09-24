// 计费中心 · 资金流水：每一笔钱什么时候进来的、什么时候被扣掉的，按时间倒序排成一条线。
// 充值记录与扣费记录是同一本账的两种视角，所以用子页签切，不另开两个页面——
// 分成两个页面之后，客户想看「这个月一共进来多少、出去多少」就得自己把两边加起来。
import React, { useMemo, useState } from 'react';
import {
  BALANCE_AS_OF,
  grantStatusAt,
  fundFlowInRange,
  type FundFlowRow,
} from './billingData';
import { formatPricePerMin } from './billingEngine';
import {
  FUND_KIND_LABEL,
  GRANT_STATUS_LABEL,
  GRANT_STATUS_TONE,
  LEDGER_TYPE_LABEL,
  Note,
  Panel,
  RECHARGE_SOURCE_LABEL,
  TD,
  TH,
  num,
  yuan,
} from './billingUi';
import {
  EmptyTableState,
  ReportTablePagination,
  StatusBadge,
  formatDuration,
  paginateRows,
} from '../report/reportUi';
import type { LedgerEntryType } from '../../types';

// 「全部」不是第三个筛选条件，是「不做筛选」。扣费记录只列真正扣钱的那一类，
// 预占与释放归在「全部」里——它们也动余额，但一笔一进一出，放进扣费记录会让客户
// 以为每通电话被扣了两次。
type FlowTabKey = 'all' | 'recharge' | 'call_charge';

const FLOW_TABS: { key: FlowTabKey; label: string; desc: string }[] = [
  { key: 'all', label: '全部', desc: '这段时间里所有动过余额的流水，含通话前预占与预占释放。' },
  { key: 'recharge', label: '额度到账', desc: '套餐购买形成的额度逐笔到账，并按各自有效期管理。' },
  { key: 'call_charge', label: '扣费记录', desc: '每一通电话实际扣掉的钱，以及从哪一笔额度里扣的。' },
];

const TYPE_OF_TAB: Record<FlowTabKey, LedgerEntryType | undefined> = {
  all: undefined,
  recharge: 'recharge',
  call_charge: 'call_charge',
};

interface Props {
  // 时间范围由页面顶部那一个控件统一下来，这一页不再自带一套范围选择，
  // 否则同一屏上两个范围各说各的，客户不知道哪个才算数。
  from: string;
  to: string;
}

const FundFlow: React.FC<Props> = ({ from, to }) => {
  const [tab, setTab] = useState<FlowTabKey>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const rows = useMemo(() => {
    // 倒序：客户打开流水最先想看的是最近发生了什么。
    const list = fundFlowInRange(from, to, TYPE_OF_TAB[tab]);
    return [...list].reverse();
  }, [from, to, tab]);

  const { totalPages, safePage, rows: pageRows } = paginateRows(rows, page, pageSize);
  const activeTab = FLOW_TABS.find((item) => item.key === tab)!;

  const incomeCents = rows.filter((row) => row.entry.amountCents > 0).reduce((sum, row) => sum + row.entry.amountCents, 0);
  const outcomeCents = rows.filter((row) => row.entry.amountCents < 0).reduce((sum, row) => sum - row.entry.amountCents, 0);
  // 区间最后一笔的期末余额。倒序列表的第 0 行就是它。没有流水时留白，
  // 不能显示 0——那读起来像「余额已经归零」。
  const closingCents = rows.length > 0 ? rows[0].entry.balanceAfterCents : null;

  // 金额带正负号显示：流水里的正负是有意义的（进来还是出去），
  // 一律取绝对值会让「预占」和「预占释放」看起来一模一样。
  const amountOf = (row: FundFlowRow) => (
    <span className={row.entry.amountCents < 0 ? 'text-slate-900' : 'text-emerald-600'}>
      {row.entry.amountCents < 0 ? '−' : '+'}
      {yuan(Math.abs(row.entry.amountCents))}
    </span>
  );

  const grantTitleOf = (row: FundFlowRow): string => {
    if (!row.grantBalance) return '—';
    return row.allocationCount > 1
      ? `${row.grantBalance.grant.title}（含 ${row.allocationCount} 个批次）`
      : row.grantBalance.grant.title;
  };

  // 三个子页签的列数不同，表尾那行的跨列数要跟着算：首格占 4 列、末尾「期末余额」占 1 列，
  // 充值记录还多一格放状态。写死一个数字的话，换页签就会错位。
  const totalColumns = tab === 'all' ? 7 : tab === 'recharge' ? 8 : 9;
  const footerSpan = tab === 'recharge' ? totalColumns - 6 : totalColumns - 5;

  return (
    <Panel title="资金流水" desc={activeTab.desc}>
      {/* 子页签用分段按钮而不是三个下拉：它们互相排斥且只有三项，
          摊开比收进下拉少一次点击，也能一眼看出「还有充值记录这类东西」。 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-md bg-slate-100 p-0.5">
          {FLOW_TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={tab === item.key}
              onClick={() => { setTab(item.key); setPage(1); }}
              className={`h-8 rounded px-3 text-xs font-medium ${tab === item.key ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">时间范围 {from} ~ {to}（跟随页面顶部）</span>
      </div>

      {rows.length === 0 ? (
        <EmptyTableState
          title="这段时间没有流水"
          desc={`${from} ~ ${to} 之间没有${activeTab.label === '全部' ? '' : activeTab.label}记录。换一个时间范围看看。`}
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="border-b border-slate-200">
                <tr>
                  <TH>时间</TH>
                  <TH>流水号</TH>
                  {tab === 'all' && <TH>类型</TH>}
                  {tab === 'all' && <TH>说明</TH>}
                  {tab === 'recharge' && <TH>到账来源</TH>}
                  {tab === 'recharge' && <TH>到账金额</TH>}
                  {tab === 'recharge' && <TH>资金形式</TH>}
                  {tab === 'recharge' && <TH>有效期至</TH>}
                  {tab === 'call_charge' && <TH>机器人</TH>}
                  {tab === 'call_charge' && <TH>计费时长</TH>}
                  {tab === 'call_charge' && <TH>单价</TH>}
                  {tab === 'call_charge' && <TH>扣费金额</TH>}
                  {tab === 'call_charge' && <TH>扣减来源</TH>}
                  {tab === 'all' && <TH>金额</TH>}
                  {tab !== 'recharge' && <TH>期初余额</TH>}
                  <TH>期末余额</TH>
                  {tab === 'recharge' && <TH>状态</TH>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((row) => {
                  // 批次状态同一行只算一次：同一格里调两遍，将来两处改了其中一处就会自相矛盾。
                  const status = row.grantBalance ? grantStatusAt(row.grantBalance, BALANCE_AS_OF) : null;
                  return (
                  <tr key={row.entry.entryId}>
                    <TD>{row.entry.occurredAt}</TD>
                    <TD className="font-mono text-xs text-slate-500">{row.entry.entryId}</TD>
                    {tab === 'all' && <TD>{LEDGER_TYPE_LABEL[row.entry.type]}</TD>}
                    {tab === 'all' && <TD className="text-slate-600">{row.entry.title}</TD>}
                    {tab === 'recharge' && <TD>{row.grantBalance ? RECHARGE_SOURCE_LABEL[row.grantBalance.grant.source] : '—'}</TD>}
                    {tab === 'recharge' && <TD className="font-semibold text-emerald-600">+{yuan(row.entry.amountCents)}</TD>}
                    {tab === 'recharge' && <TD>{FUND_KIND_LABEL[row.entry.fundKind]}</TD>}
                    {/* 无限期必须写出来，留空客户会以为漏了。 */}
                    {tab === 'recharge' && <TD>{row.grantBalance?.grant.expiresAt || '无限期'}</TD>}
                    {tab === 'call_charge' && <TD className="font-medium text-slate-900">{row.call?.robotName ?? '—'}</TD>}
                    {tab === 'call_charge' && <TD>{row.call ? formatDuration(row.call.durationSec) : '—'}</TD>}
                    {tab === 'call_charge' && <TD>{row.call ? formatPricePerMin(row.call.record.snapshot.priceMilli) : '—'}</TD>}
                    {tab === 'call_charge' && <TD className="font-semibold text-slate-900">{yuan(Math.abs(row.entry.amountCents))}</TD>}
                    {tab === 'call_charge' && <TD className="text-slate-600">{grantTitleOf(row)}</TD>}
                    {tab === 'all' && <TD className="font-semibold">{amountOf(row)}</TD>}
                    {tab !== 'recharge' && <TD className="text-slate-500">{yuan(row.beforeCents)}</TD>}
                    <TD className="font-semibold text-slate-900">{yuan(row.entry.balanceAfterCents)}</TD>
                    {tab === 'recharge' && (
                      <TD>{status === null ? '—' : <StatusBadge tone={GRANT_STATUS_TONE[status]}>{GRANT_STATUS_LABEL[status]}</StatusBadge>}</TD>
                    )}
                  </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={4} className="px-3 py-3 text-sm font-semibold text-slate-700">
                    本范围共 {num(rows.length)} 笔
                  </td>
                  <td colSpan={footerSpan} className="px-3 py-3 text-sm text-slate-600">
                    {tab === 'recharge'
                      ? `到账合计 ${yuan(incomeCents)}`
                      : tab === 'call_charge'
                        ? `扣费合计 ${yuan(outcomeCents)}`
                        : `进账 ${yuan(incomeCents)} · 支出 ${yuan(outcomeCents)}`}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">
                    期末余额
                    <span className="ml-2 text-sm font-bold text-slate-900">{closingCents === null ? '—' : yuan(closingCents)}</span>
                  </td>
                  {tab === 'recharge' && <td className="px-3 py-3" />}
                </tr>
              </tfoot>
            </table>
          </div>
          <ReportTablePagination
            page={safePage}
            totalPages={totalPages}
            total={rows.length}
            pageSize={pageSize}
            onPageChange={setPage}
            pageSizeOptions={[20, 50, 100]}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          />
        </>
      )}

      <Note>
        两条读法：一、每一笔的「期初余额」就是上一笔的「期末余额」，中间不会跳；
        二、余额只在账户这一层，不分摊到机器人头上，所以每一笔扣费都从同一个余额里出。
        {tab === 'all' && '「通话前预占」与「预占释放」是通话开始前先占住 5 分钟额度、通话结束按实际费用结算后把多占的退回；两者一进一出金额相抵，不是两笔收费。'}
        {tab === 'call_charge' && '扣费金额是这通电话实际扣掉的钱；「扣减来源」写的是这笔钱从哪一个额度批次里扣的，跨批次时会标明含几个批次。'}
        {tab === 'recharge' && '「资金形式」说明这笔额度是否有有效期。每笔套餐额度独立到期，未用完的部分到期清零。'}
      </Note>
    </Panel>
  );
};

export default FundFlow;
