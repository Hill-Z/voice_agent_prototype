// 计费中心：客户看自己在语音机器人上还剩多少钱、每笔钱是怎么花的。
// 三个视角——余额与额度（还剩多少、哪笔什么时候到期）、通话消费明细（每一通花了多少）、
// 消费统计（谁花的、哪个月花的）。
import React, { useState } from 'react';
import { Bell, Download, FileText, Package, Receipt, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import BillingBasisPanel, { type RateBasisSubject } from './BillingBasisPanel';
import UsageOverview from './UsageOverview';
import FundFlow from './FundFlow';
import CallBillingDetail from './CallBillingDetail';
import BotBillingStats from './BotBillingStats';
import NotifyRecords from './NotifyRecords';
import ReportExport from './ReportExport';
import {
  ACCOUNT_NAME,
  ACTIVE_CONCURRENCY,
  ALLOCATED_CONCURRENCY,
  BALANCE_COMPOSITION,
  BILLING_CALL_ROWS,
  BILLING_GRANT_BALANCES,
  BILLING_ROBOT_PROFILES,
  DATA_CUTOFF_LABEL,
  NOTIFY_SETTINGS,
  getPendingReason,
  usageInRange,
} from './billingData';
import { PERIOD_LABEL, PeriodToggle, num, yuan, type PeriodKey } from './billingUi';

type TabKey = 'account' | 'package' | 'consumption' | 'flow' | 'reminders' | 'export';

// 余额不足的提醒线就是客户在「余额与额度」页设的那个预警值，不在这里另算一套。
//
// 原来这里是「映射额度总额的 20%」，与预警设置里的绝对金额（默认 ¥5000）对不上：
// 同一屏上告警条在说「还没到 20%」（即 ¥9000），设置里写着「低于 5000 才提醒」。
// 客户拿这两个数一对就会发现对不上，而这条正好是「余额快用完」唯一的出口，
// 「计费一定要做好，不能出现纰漏」说的就是这种地方。
// 统一到客户设的那个数：客户能理解「低于 5000 就提醒我」，理解不了「低于 20%」——
// 百分比的分母（映射额度总额）本身还会随加购变化。
const ALERT_BELOW_CENTS = NOTIFY_SETTINGS.thresholdCents;

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'account', label: '账户', icon: Wallet },
  { key: 'package', label: '套餐', icon: Package },
  { key: 'consumption', label: '消费', icon: FileText },
  { key: 'flow', label: '流水', icon: Receipt },
  { key: 'reminders', label: '提醒', icon: Bell },
];

// 演示数据没有实时钟：页面上的「今天」就是数据截止日，相对日期一律从它往前推。
// 不用 new Date() 取真实当天，否则换一天打开页面，「本月」会变成一个演示数据里没有的月份。
const TODAY = DATA_CUTOFF_LABEL;

const pad2 = (value: number): string => String(value).padStart(2, '0');

const shiftDays = (date: string, days: number): string => {
  const shifted = new Date(`${date}T00:00:00`);
  shifted.setDate(shifted.getDate() + days);
  return `${shifted.getFullYear()}-${pad2(shifted.getMonth() + 1)}-${pad2(shifted.getDate())}`;
};

const monthStartOf = (date: string): string => `${date.slice(0, 7)}-01`;

// 本周从周一起算：周日 getDay() 是 0，直接减 0 会算成「本周一 = 今天」。
const weekdayOffsetFromMonday = (date: string): number => (new Date(`${date}T00:00:00`).getDay() + 6) % 7;

const periodRange = (period: PeriodKey, custom: { from: string; to: string }): { from: string; to: string } => {
  if (period === 'today') return { from: TODAY, to: TODAY };
  if (period === 'yesterday') {
    const day = shiftDays(TODAY, -1);
    return { from: day, to: day };
  }
  if (period === 'week') return { from: shiftDays(TODAY, -weekdayOffsetFromMonday(TODAY)), to: TODAY };
  if (period === 'lastMonth') {
    const lastDay = shiftDays(monthStartOf(TODAY), -1);
    return { from: monthStartOf(lastDay), to: lastDay };
  }
  if (period === 'custom') return custom;
  return { from: monthStartOf(TODAY), to: TODAY };
};

interface Props {
  onOpenCallRecord: (callId: string) => void;
}

const BillingCenter: React.FC<Props> = ({ onOpenCallRecord }) => {
  const [tab, setTab] = useState<TabKey>('account');
  const [consumptionView, setConsumptionView] = useState<'calls' | 'stats'>('calls');
  const [reminderView, setReminderView] = useState<'settings' | 'records'>('settings');
  const [basis, setBasis] = useState<RateBasisSubject | null>(null);
  // 默认停在本月：客户打开计费中心最先想知道的就是「这个月花了多少」。
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [customFrom, setCustomFrom] = useState(monthStartOf(TODAY));
  const [customTo, setCustomTo] = useState(TODAY);

  const { from, to } = periodRange(period, { from: customFrom, to: customTo });
  const spend = usageInRange(from, to);
  const comp = BALANCE_COMPOSITION;

  // 余额不跟时间范围走：筛选变的是「这段时间花了多少」，不是「现在还剩多少」。
  // 所以这张卡固定读数据截止日那一刻的值，标题上标「截至今日」，避免客户以为切到上个月就能看到上个月的余额。
  // 看的是自有资金（代金券 + 单独充值）而不是「可用额度」：授信是能借的钱，
  // 把授信算进来，余额早就见底了这条提示却一直不出现——而那正是客户最需要被提醒的时候。
  const lowBalance = comp.balanceCents < ALERT_BELOW_CENTS;

  // 待定价的机器人：算不出费率就不能计费，这里在页面顶部直接告诉客户要补什么。
  // 取自计费侧的机器人档而非机器人列表——只要产生过通话的机器人就该在这里报出来，
  // 哪怕它后来被删了或者不在机器人列表里。
  const callsInRange = BILLING_CALL_ROWS.filter((row) => row.startedAt.slice(0, 10) >= from && row.startedAt.slice(0, 10) <= to);
  const pendingRobotIds = new Set(callsInRange.filter((row) => row.record.billingStatus === 'pending').map((row) => row.robotId));
  const pendingRobots = BILLING_ROBOT_PROFILES
    .filter((profile) => pendingRobotIds.has(profile.id))
    .map((profile) => ({ profile, reasons: getPendingReason(profile.id) }))
    .filter((item) => item.reasons.length > 0);

  // 产生过通话的机器人台数（含已删除的）。注意是「产生过通话」而不是「产生过费用」：
  // 待定价和未接通的机器人有记录但没有金额，说成「产生过费用」会和下面的合计对不上。
  const archivedRobotCount = new Set(callsInRange.map((item) => item.robotId)).size;

  // 多笔套餐额度分别展示余额和到期日，不能把合计标成最近一笔的到期日。
  const voucherBatches = BILLING_GRANT_BALANCES
    .filter((item) => item.grant.kind === 'voucher' && item.remainingCents > 0)
    .sort((a, b) => (a.grant.expiresAt ?? '').localeCompare(b.grant.expiresAt ?? ''));
  const periodLabel = period === 'custom' ? `${from} ~ ${to}` : PERIOD_LABEL[period];

  return (
    <div className="min-h-full bg-slate-50">
      {/* 页面使用外层主区域自然滚动，不能再制造一个像 iframe 的内部滚动区。 */}
      <div className="mx-auto w-full max-w-[1600px] px-5 pb-3 pt-5 lg:px-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-950">计费中心</h1>
            <p className="mt-1 text-xs text-slate-500">{ACCOUNT_NAME} · 数据截止 {DATA_CUTOFF_LABEL}</p>
          </div>
          <div className="flex flex-col items-start gap-1">
          <span className="text-xs text-slate-500">消费与流水时间</span>
          <PeriodToggle value={period} onChange={setPeriod}>
            {period === 'custom' && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="date"
                  aria-label="开始日期"
                  className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
                  value={customFrom}
                  max={customTo}
                  onChange={(event) => setCustomFrom(event.target.value)}
                />
                <span className="text-slate-400">至</span>
                <input
                  type="date"
                  aria-label="结束日期"
                  className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
                  value={customTo}
                  min={customFrom}
                  max={TODAY}
                  onChange={(event) => setCustomTo(event.target.value)}
                />
              </div>
            )}
          </PeriodToggle>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">账户余额 <span className="font-normal">· 截至 {DATA_CUTOFF_LABEL}</span></p>
            <p className={`mt-1 text-[28px] font-semibold tracking-tight tabular-nums ${lowBalance || comp.debtCents > 0 ? 'text-amber-700' : 'text-slate-950'}`}>{yuan(comp.balanceCents)}</p>
            <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs">
              {voucherBatches.map((item) => (
                <div key={item.grant.grantId} className="flex flex-wrap items-center justify-between gap-x-2">
                  <span className="text-slate-500" title={item.grant.title}>{item.grant.grantedAt.slice(0, 7)} 套餐额度</span>
                  <span className="font-medium tabular-nums text-slate-800">{yuan(item.remainingCents)} <span className="font-normal text-slate-400">· {item.grant.expiresAt} 到期</span></span>
                </div>
              ))}
              {comp.cashCents > 0 && <div className="flex justify-between gap-2"><span className="text-slate-500">独立到账余额</span><span className="font-medium text-slate-800">{yuan(comp.cashCents)} · 长期有效</span></div>}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">当前可用并发 <span className="font-normal">· 截至 {DATA_CUTOFF_LABEL}</span></p>
            <p className="mt-1 text-[28px] font-semibold tracking-tight tabular-nums text-slate-950">{ACTIVE_CONCURRENCY} <span className="text-base font-normal">路</span></p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>已分配 {ALLOCATED_CONCURRENCY} 路</span>
              <span>待分配 {Math.max(0, ACTIVE_CONCURRENCY - ALLOCATED_CONCURRENCY)} 路</span>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{periodLabel}消费</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-slate-950">{yuan(spend.cents)}</p>
            <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">已计费 {num(spend.calls)} 通 · {num(spend.talkMinutes)} 分钟</p>
          </div>
        </div>
      </div>

      {lowBalance && (
        <div className="mx-auto w-full max-w-[1600px] space-y-2 px-5 pb-3 lg:px-7">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              {/* 这句回答的是客户最关心的那个问题：钱花完了会怎样。
                  所以写的是余额的后果（新的拨不出去、在通话中的不中断），不是并发的后果——
                  余额和并发是两件事，拿「排队等一路空出来」解释余额不足，客户按这句话去
                  充值就会得出「充钱能解决排队」的错误结论。 */}
              余额低于预警值 {yuan(ALERT_BELOW_CENTS)}，请联系客户经理补充通话额度。
              <span className="ml-1 text-amber-700">余额和授信用尽后，新通话将暂停。</span>
            </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-[1600px] px-5 lg:px-7">
      <div role="tablist" aria-label="计费中心" className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              id={`billing-tab-${item.key}`}
              aria-selected={active}
              aria-controls="billing-tabpanel"
              onClick={() => setTab(item.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'bg-blue-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
        <button type="button" role="tab" id="billing-tab-export" aria-selected={tab === 'export'} aria-controls="billing-tabpanel" onClick={() => setTab('export')} className={`ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${tab === 'export' ? 'bg-blue-50 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}><Download size={16} />下载</button>
      </div>
      </div>

      <div
        id="billing-tabpanel"
        role="tabpanel"
        aria-labelledby={`billing-tab-${tab}`}
        className="mx-auto w-full max-w-[1600px] p-5 lg:px-7 lg:py-6"
      >
        {tab === 'account' && <UsageOverview section="account" />}
        {tab === 'package' && <UsageOverview section="package" />}
        {tab === 'flow' && <FundFlow from={from} to={to} />}
        {tab === 'consumption' && <div className="space-y-4">
          {pendingRobots.length > 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">存在尚未计费的通话</p>
            <p className="mt-1 text-xs leading-5 text-amber-800">{pendingRobots.map((item) => `${item.profile.name}：${item.reasons.join('；')}`).join('。')}。相关通话可在逐通明细中查看，待价格确定后再计费。</p>
          </div>}
          <div className="flex items-center justify-between gap-3">
            <div role="tablist" aria-label="通话消费视图" className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
              {([['calls', '逐通明细'], ['stats', '按机器人和月份统计']] as const).map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={consumptionView === key} onClick={() => setConsumptionView(key)} className={`rounded-md px-3 py-1.5 text-sm ${consumptionView === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{label}</button>)}
            </div>
            <span className="hidden text-xs text-slate-500 lg:inline">共 {archivedRobotCount} 台机器人有通话记录</span>
          </div>
          {consumptionView === 'calls' ? (
          <CallBillingDetail
            from={from}
            to={to}
            onOpenBasis={setBasis}
            onOpenCallRecord={(callId) => {
              setBasis(null);
              onOpenCallRecord(callId);
            }}
          />
          ) : <BotBillingStats from={from} to={to} />}
        </div>}
        {tab === 'reminders' && <div className="space-y-4">
          <div role="tablist" aria-label="提醒视图" className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            {([['settings', '提醒设置'], ['records', '发送记录']] as const).map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={reminderView === key} onClick={() => setReminderView(key)} className={`rounded-md px-3 py-1.5 text-sm ${reminderView === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{label}</button>)}
          </div>
          {reminderView === 'settings' ? <UsageOverview section="alerts" /> : <NotifyRecords />}
        </div>}
        {tab === 'export' && <ReportExport from={from} to={to} />}

      </div>

      {/* 条件挂载而不是传 null：面板里「内部视角」这类开关是组件内部状态，
          常驻在树上会让下一次打开沿用上一次的选择。 */}
      {basis && <BillingBasisPanel subject={basis} onClose={() => setBasis(null)} />}
    </div>
  );
};

export default BillingCenter;
