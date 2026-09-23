// 计费中心：客户看自己在语音机器人上还剩多少钱、每笔钱是怎么花的。
// 三个视角——余额与额度（还剩多少、哪笔什么时候到期）、通话消费明细（每一通花了多少）、
// 消费统计（谁花的、哪个月花的）。
import React, { useState } from 'react';
import { Bell, Bot, Download, FileText, PieChart, Receipt, Wallet } from 'lucide-react';
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
  BALANCE_COMPOSITION,
  BILLING_GRANT_BALANCES,
  BILLING_ROBOT_PROFILES,
  DATA_CUTOFF_LABEL,
  MONTHLY_USAGE,
  NOTIFY_SETTINGS,
  getPendingReason,
  rechargeInRange,
  usageInRange,
} from './billingData';
import { PERIOD_LABEL, PeriodToggle, SummaryBar, num, yuan, type PeriodKey } from './billingUi';

type TabKey = 'overview' | 'flow' | 'calls' | 'stats' | 'notify' | 'export';

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
  { key: 'overview', label: '余额与额度', icon: Wallet },
  { key: 'flow', label: '资金流水', icon: Receipt },
  { key: 'calls', label: '通话消费明细', icon: FileText },
  { key: 'stats', label: '消费统计', icon: PieChart },
  { key: 'notify', label: '通知记录', icon: Bell },
  { key: 'export', label: '报表导出', icon: Download },
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
  const [tab, setTab] = useState<TabKey>('overview');
  const [basis, setBasis] = useState<RateBasisSubject | null>(null);
  // 默认停在本月：客户打开计费中心最先想知道的就是「这个月花了多少」。
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [customFrom, setCustomFrom] = useState(monthStartOf(TODAY));
  const [customTo, setCustomTo] = useState(TODAY);

  const { from, to } = periodRange(period, { from: customFrom, to: customTo });
  const spend = usageInRange(from, to);
  const recharge = rechargeInRange(from, to);
  const comp = BALANCE_COMPOSITION;

  // 余额不跟时间范围走：筛选变的是「这段时间花了多少」，不是「现在还剩多少」。
  // 所以这张卡固定读数据截止日那一刻的值，标题上标「截至今日」，避免客户以为切到上个月就能看到上个月的余额。
  // 看的是自有资金（代金券 + 单独充值）而不是「可用额度」：授信是能借的钱，
  // 把授信算进来，余额早就见底了这条提示却一直不出现——而那正是客户最需要被提醒的时候。
  const lowBalance = comp.balanceCents < ALERT_BELOW_CENTS;

  // 待定价的机器人：算不出费率就不能计费，这里在页面顶部直接告诉客户要补什么。
  // 取自计费侧的机器人档而非机器人列表——只要产生过通话的机器人就该在这里报出来，
  // 哪怕它后来被删了或者不在机器人列表里。
  const pendingRobots = BILLING_ROBOT_PROFILES
    .map((profile) => ({ profile, reasons: getPendingReason(profile.id) }))
    .filter((item) => item.reasons.length > 0);

  // 产生过通话的机器人台数（含已删除的）。注意是「产生过通话」而不是「产生过费用」：
  // 待定价和未接通的机器人有记录但没有金额，说成「产生过费用」会和下面的合计对不上。
  const archivedRobotCount = new Set(MONTHLY_USAGE.map((item) => item.robotId)).size;

  // 代金券额度的到期日：余额构成那行「哪部分会到期」靠它说清。有多笔代金券时取最近的那个到期日，
  // 客户最该先知道的就是最快到期的那一笔。没有代金券（或用光了）时留空，不编一个日期出来。
  const voucherExpiry = BILLING_GRANT_BALANCES
    .filter((item) => item.grant.kind === 'voucher' && item.grant.expiresAt !== null && item.remainingCents > 0)
    .map((item) => item.grant.expiresAt as string)
    .sort()[0] || '';
  const periodLabel = period === 'custom' ? `${from} ~ ${to}` : PERIOD_LABEL[period];

  return (
    <div className="flex h-full flex-col">
      {/* 页头只留时间范围和截止日：标题由面包屑承担，页面上不再重复一遍「这是计费中心」。
          下面四张卡都是钱的数，所以时间范围放在最上面、和它们同一屏。 */}
      <div className="border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
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
          <div className="text-right">
            <p className="text-xs text-slate-500">计费账户 · {ACCOUNT_NAME}</p>
            <p className="mt-0.5 text-sm text-slate-700">数据截止 {DATA_CUTOFF_LABEL}（今天）</p>
          </div>
        </div>

        <div className="mt-3">
          <SummaryBar
            items={[
              {
                label: '余额（截至今日）',
                value: yuan(comp.balanceCents),
                note: `代金券额度 ${yuan(comp.voucherCents)}${voucherExpiry ? `（${voucherExpiry} 到期）` : ''} · 单独充值 ${yuan(comp.cashCents)}（无限期）`,
                // 余额偏低或已经欠费才是风险状态，其余一律中性色。
                tone: lowBalance || comp.debtCents > 0 ? 'risk' : 'default',
              },
              {
                label: '可用额度（截至今日）',
                value: yuan(comp.availableCents),
                note: comp.creditTotalCents > 0
                  ? `已含可用信用额度 ${yuan(comp.creditAvailableCents)} · 通话中预占 ${yuan(comp.frozenCents)}`
                  : `账面余额扣掉通话中预占的 ${yuan(comp.frozenCents)} · 信用额度未开通`,
              },
              {
                label: `本期消费（${periodLabel}）`,
                value: yuan(spend.cents),
                note: `通话 ${num(spend.calls)} 通（其中智呼 ${num(spend.outboundCalls)} 通）· 时长 ${num(spend.talkMinutes)} 分钟`,
              },
              {
                label: `本期充值（${periodLabel}）`,
                value: yuan(recharge.totalCents),
                note: recharge.count === 0
                  ? '这段时间没有充值到账'
                  : `系统自动充值 ${yuan(recharge.autoCents)} · 单独充值 ${yuan(recharge.manualCents)}`,
              },
            ]}
          />
        </div>
      </div>

      {(lowBalance || pendingRobots.length > 0) && (
        <div className="space-y-2 border-b border-slate-200 bg-white px-6 py-3">
          {lowBalance && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs leading-5 text-amber-800">
              {/* 这句回答的是客户最关心的那个问题：钱花完了会怎样。
                  所以写的是余额的后果（新的拨不出去、在通话中的不中断），不是并发的后果——
                  余额和并发是两件事，拿「排队等一路空出来」解释余额不足，客户按这句话去
                  充值就会得出「充钱能解决排队」的错误结论。 */}
              账面余额 {yuan(comp.balanceCents)} 已经低于你设的预警值 {yuan(ALERT_BELOW_CENTS)}，建议及时充值。
              {comp.creditAvailableCents > 0
                ? `余额扣完后会先动用信用额度垫付（当前可用 ${yuan(comp.creditAvailableCents)}），垫付的部分形成欠费，欠费未结清时新的通话将无法发起；`
                : '余额扣完后新的通话将无法发起；'}
              正在通话中的不会中断，会按实际时长扣到本通结束；充值到账后即可继续发起通话。
              {/* 提醒里写着「充值到账后即可继续发起通话」，页面上就必须真的能充值——
                  文案承诺了一件产品做不到的事，客户按提示去找、找不到，比不承诺更糟。 */}
              <span className="ml-1 font-medium">「余额与额度」页可以直接充值，也可以开自动充值。</span>
            </div>
          )}
          {pendingRobots.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs leading-5 text-amber-800">
              <p className="font-semibold">有 {pendingRobots.length} 台机器人暂时算不出单价，这些机器人上的通话暂不扣费，价格补齐后会自动补扣。</p>
              <ul className="mt-1 space-y-0.5">
                {pendingRobots.map((item) => (
                  <li key={item.profile.id}>
                    · {item.profile.name}：{item.reasons.join('；')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 这一行是四个页签，所以按页签的语义写：读屏能念出「当前选中第 2 个，共 4 个」，
          而不是四个看不出关系的普通按钮。 */}
      <div role="tablist" aria-label="计费中心" className="flex items-center border-b border-slate-200 bg-white px-6">
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
              className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold ${
                active ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
        <span className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
          <Bot size={13} />
          共 {archivedRobotCount} 台机器人产生过通话
        </span>
      </div>

      <div
        id="billing-tabpanel"
        role="tabpanel"
        aria-labelledby={`billing-tab-${tab}`}
        className="flex-1 overflow-y-auto bg-slate-50 p-6"
      >
        {tab === 'overview' && <UsageOverview />}
        {tab === 'flow' && <FundFlow from={from} to={to} />}
        {tab === 'calls' && (
          <CallBillingDetail
            onOpenBasis={setBasis}
            onOpenCallRecord={(callId) => {
              setBasis(null);
              onOpenCallRecord(callId);
            }}
          />
        )}
        {tab === 'stats' && <BotBillingStats />}
        {tab === 'notify' && <NotifyRecords />}
        {tab === 'export' && <ReportExport from={from} to={to} />}

        <p className="mt-4 text-xs leading-5 text-slate-500">
          说明：费用按每通电话的通话时长计算，按秒向上取整到分。每分钟单价由该机器人使用的语音识别、
          大模型和音色共同决定，在发布时确定并记进这通电话的计费依据里，之后改配置不影响已经打完的电话。
          余额、月度合计和通话记录里的金额来自同一套账：把消费明细切到「全部月份」后，每一笔相加就等于累计已用额度。
        </p>
      </div>

      {/* 条件挂载而不是传 null：面板里「内部视角」这类开关是组件内部状态，
          常驻在树上会让下一次打开沿用上一次的选择。 */}
      {basis && <BillingBasisPanel subject={basis} onClose={() => setBasis(null)} />}
    </div>
  );
};

export default BillingCenter;
