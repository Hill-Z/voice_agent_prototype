// 计费中心 · 余额与额度：余额由哪几笔钱组成、每笔什么时候到期、并发用得紧不紧张。
// 这一页回答的是「我还有多少钱、这些钱什么时候会没」，不是「我花了多少钱」——后者在资金流水与消费统计里。
import React, { useState } from 'react';
import { Bell, Wallet } from 'lucide-react';
import { StatusBadge } from '../report/reportUi';
import {
  ALERT_TIERS,
  ALLOCATED_CONCURRENCY,
  BALANCE_AS_OF,
  BALANCE_COMPOSITION,
  BILLING_GRANT_BALANCES,
  BILLING_PACKAGES,
  BILLING_ROBOT_PROFILES,
  CREDIT_LINE,
  EXPIRY_TIER_DAYS,
  NOTIFY_SETTINGS,
  PURCHASED_CONCURRENCY,
  OUTBOUND_CALLS,
  OUTBOUND_MINUTES,
  PACKAGE_SERVICE_FEE_TOTAL_CENTS,
  TALK_FEE_TOTAL_CENTS,
  USED_CALLS,
  USED_MINUTES,
  getRateMilli,
  grantStatusAt,
  grantsByConsumeOrder,
  nearestExpiry,
} from './billingData';
import PackageActionsPanel from './PackageActionsPanel';
import RechargePanel from './RechargePanel';
import { PRICING_RULE, computeReserveCents, milliToYuan } from './billingEngine';
import {
  FUND_KIND_LABEL,
  GRANT_STATUS_LABEL,
  GRANT_STATUS_TONE,
  Note,
  Panel,
  RANGE_LABEL,
  RangeToggle,
  TD,
  TH,
  num,
  yuan,
  type RangeKey,
} from './billingUi';

// 并发峰值与限流次数按时间范围取对应的那一份。
const rangeField = (range: RangeKey, metric: 'peak' | 'throttled'): 'peakToday' | 'peakYesterday' | 'peakWeek' | 'throttledToday' | 'throttledYesterday' | 'throttledWeek' => {
  const suffix = range === 'today' ? 'Today' : range === 'yesterday' ? 'Yesterday' : 'Week';
  return `${metric}${suffix}` as const;
};

// 批次列表的顺序就是扣费顺序（数据层只实现一次）。客户照着从上往下读，
// 「先扣哪一笔」和列表顺序就是同一件事，不用再去别处找规则。
const sortedGrants = grantsByConsumeOrder();

// 有到期日的批次里最先到期的那一笔。即将到期提示条只针对它说话。
// 「还剩几天」由数据层算一次，通知记录页用的是同一个数——两页各算一遍会算出两个天数。
const expiring = nearestExpiry();
// 30 天以内才升级成醒目提示；还早的话只平铺陈述规则，不制造没必要的紧迫感。
const EXPIRY_WARN_DAYS = 30;

// 到期提醒的档位写成两句话给客户看：默认会发的那几档，与可选的那几档。
// 档位表在数据层，这里只负责排版——页面里再写一遍「30 / 7 / 1」，档位一调两处就会对不上。
const expiryDaysOn = EXPIRY_TIER_DAYS.filter((entry) => entry.defaultOn).map((entry) => `${entry.days} 天`).join(' / ');
const expiryDaysOptional = EXPIRY_TIER_DAYS.filter((entry) => !entry.defaultOn).map((entry) => `${entry.days} 天`).join(' / ');
const expiryTierText = expiryDaysOptional
  ? `到期前 ${expiryDaysOn} 各一次（可选更早：${expiryDaysOptional}）`
  : `到期前 ${expiryDaysOn} 各一次`;

const UsageOverview: React.FC = () => {
  const [range, setRange] = useState<RangeKey>('today');
  // 预警设置的初值取数据层那份默认设置，不是页面里再写一遍字面量：
  // 页面上显示的数与「配置里真实的数」一旦分别维护，客户看到的就是两个不同的预警值。
  const [thresholdYuan, setThresholdYuan] = useState(String(NOTIFY_SETTINGS.thresholdCents / 100));
  const [channels, setChannels] = useState(NOTIFY_SETTINGS.channels);
  const [email, setEmail] = useState(NOTIFY_SETTINGS.email);
  const [phone, setPhone] = useState(NOTIFY_SETTINGS.phone);
  const [saved, setSaved] = useState(false);
  // 输入框里可能是空串或非数字，取整时兜成 0：页面上宁可显示 ¥0.00，
  // 也不能出现 NaN 这种数——那会让客户以为页面坏了。
  const thresholdCents = Math.max(0, Math.round(Number(thresholdYuan) || 0)) * 100;

  // 并发按路预占：每路在通话开始前按 5 分钟预估一笔额度，通话结束按实际费用结算、差额立即释放。
  // 已删除的机器人不占并发，所以这里只看还在的。
  const activeProfiles = BILLING_ROBOT_PROFILES.filter((item) => item.state === 'active');
  // 还没定价的机器人算不出「该预占多少」。这里返回 null 让页面显示「—」，绝不拿最低档
  // 凑一个数出来——那会让合计里凭空多出一笔并不存在的预占。
  const reserveOf = (robotId: string, concurrency: number): number | null => {
    const rateMilli = getRateMilli(robotId);
    return rateMilli === undefined ? null : computeReserveCents(rateMilli) * concurrency;
  };
  const unpricedProfiles = activeProfiles.filter((item) => getRateMilli(item.id) === undefined);
  const unpricedConcurrency = unpricedProfiles.reduce((sum, item) => sum + item.concurrency, 0);
  const reservedCents = activeProfiles.reduce((sum, item) => sum + (reserveOf(item.id, item.concurrency) ?? 0), 0);
  const rangeLabel = RANGE_LABEL[range];

  const comp = BALANCE_COMPOSITION;

  return (
    <div className="space-y-4">
      <Panel title="余额构成" desc="你的余额由哪几笔钱组成。它们的有效期不一样，所以要分开看；授信不在其中，它是能欠的钱。">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="border-b border-slate-200">
              <tr><TH>项目</TH><TH>金额</TH><TH>这一项是什么</TH></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <TD className="font-medium text-slate-900">{FUND_KIND_LABEL.voucher}</TD>
                <TD className="font-semibold text-slate-900">{yuan(comp.voucherCents)}</TD>
                <TD className="text-xs text-slate-500">随套餐一起给的额度，有有效期，到期没用完会清零</TD>
              </tr>
              <tr>
                <TD className="font-medium text-slate-900">{FUND_KIND_LABEL.cash}</TD>
                <TD className={comp.cashCents > 0 ? 'font-semibold text-slate-900' : 'text-slate-500'}>{yuan(comp.cashCents)}</TD>
                <TD className="text-xs text-slate-500">你自己充值进来的钱，没有有效期，不会清零</TD>
              </tr>
              <tr>
                <TD className="font-medium text-slate-900">冻结中</TD>
                <TD>{yuan(comp.frozenCents)}</TD>
                <TD className="text-xs text-slate-500">通话进行中先占住的那部分，打完按实际费用结算，多占的马上退回</TD>
              </tr>
              <tr>
                <TD className="font-medium text-slate-900">{FUND_KIND_LABEL.credit}</TD>
                <TD className={comp.creditTotalCents > 0 ? 'font-semibold text-slate-900' : 'text-slate-400'}>
                  {comp.creditTotalCents > 0 ? `可用 ${yuan(comp.creditAvailableCents)}` : '未开通'}
                </TD>
                <TD className="text-xs text-slate-500">
                  {comp.creditTotalCents > 0
                    ? `平台核定给你的授信额度 ${yuan(comp.creditTotalCents)}，自有资金付不出时垫上。它不增加账面余额`
                    : '平台核定给你的授信额度，开通后余额用尽还能继续打。当前账号未开通'}
                </TD>
              </tr>
              <tr>
                <TD className="font-medium text-slate-900">欠费</TD>
                <TD className={comp.debtCents > 0 ? 'font-semibold text-red-600' : ''}>{yuan(comp.debtCents)}</TD>
                <TD className="text-xs text-slate-500">动用授信垫付的那部分就是欠费，需要结清</TD>
              </tr>
            </tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50">
              <tr>
                <td className="px-3 py-3 text-sm font-semibold text-slate-700">账面余额</td>
                <td className="px-3 py-3 text-sm font-bold text-slate-900">{yuan(comp.balanceCents)}</td>
                <td className="px-3 py-3 text-xs text-slate-500">
                  代金券额度 + 单独充值。账上实际有的钱，<b>不含授信</b>——授信是能欠的钱，不是存的钱
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 text-sm font-semibold text-slate-700">可用额度</td>
                <td className="px-3 py-3 text-sm font-bold text-slate-900">{yuan(comp.availableCents)}</td>
                <td className="px-3 py-3 text-xs text-slate-500">
                  账面余额 + 可用授信 − 冻结中，这才是现在真能花的；授信那部分花掉就成为欠费
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <Note>
          余额只能用在本平台的通话，不能提现、不能转给手机号。
          扣费先扣快到期的，所以不会出现「现金还在、代金券却过期了」。授信只算在「可用额度」里。
        </Note>
      </Panel>

      <RechargePanel />

      <Panel
        title="信用额度"
        desc="余额不足以支付时，由平台授信先垫上，不用你申请，也不会中断正在进行的通话。"
        extra={<StatusBadge tone={CREDIT_LINE.status === 'active' ? 'green' : 'slate'}>{CREDIT_LINE.status === 'active' ? '已开通' : '未开通'}</StatusBadge>}
      >
        {comp.creditTotalCents === 0 ? (
          <div className="rounded-md bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            当前账号未开通信用额度。需要开通或调整额度，请联系你的客户经理。
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: '授信额度', value: yuan(comp.creditTotalCents), desc: '平台核定，客户不可自行调整' },
                { label: '已用（欠费）', value: yuan(comp.creditUsedCents), desc: '已经垫付出去、还没结清的部分' },
                { label: '可用授信', value: yuan(comp.creditAvailableCents), desc: '还能透支多少' },
                { label: '有效期至', value: CREDIT_LINE.expiresAt ?? '长期有效', desc: '到期后未用部分失效，已欠的仍要结清' },
              ].map((item) => (
                <div key={item.label} className="rounded-md border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className={`mt-1 text-lg font-bold ${item.label === '已用（欠费）' && comp.creditUsedCents > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                    {item.value}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">开通时间 {CREDIT_LINE.grantedAt}</p>
          </>
        )}
        <ul className="mt-3 space-y-2 rounded bg-slate-50 p-3 text-xs leading-6 text-slate-600">
          <li>· 授信额度由平台核定，客户不能自行调整；需要提高额度请联系客户经理。</li>
          <li>· 扣费顺序：先扣快到期的代金券额度，再扣单独充值的钱，<b className="text-slate-800">最后才动用授信</b>。动用授信就是欠费，需要结清。</li>
          <li>· 欠费不会自动从余额里补扣，要在账户里结清；欠费未结清期间无法开通新的通话，正在通话中的不会中断。</li>
          <li>· 余额低于预警值、余额用尽、已经欠费这三件事都会给你发提醒，提醒记录在「通知记录」页逐条可查。</li>
        </ul>
      </Panel>

      <Panel
        title="额度批次明细"
        desc="每一笔到账的钱分别还剩多少、什么时候到期。扣费时按到期日从近到远扣。"
      >
        {/* 到期规则只在这一处说全：别的页面写一句「即将到期」就够，写多了口径会散。
            没有批次要到期时（比如全部用光）这一条自然消失，不会留下一个空提示。 */}
        {expiring && (
          <div
            className={
              expiring.daysLeft <= EXPIRY_WARN_DAYS
                ? 'mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800'
                : 'mb-4 rounded-md bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600'
            }
          >
            <b>{expiring.grant.grant.title}</b> 将在 {expiring.daysLeft} 天后（{expiring.grant.grant.expiresAt}）到期，
            剩余 {yuan(expiring.grant.remainingCents)}。到期没用完的部分会清零，不会结转到下一期；
            这一笔用完之前，扣费不会动其他批次。
            到期前 {expiryDaysOn} 会给你发提醒，不需要自己盯日期——提醒记录可在「通知记录」页回查。
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="border-b border-slate-200">
              <tr>
                <TH>来源</TH><TH>到账时间</TH><TH>原始金额</TH><TH>剩余金额</TH><TH>有效期至</TH><TH>状态</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedGrants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-sm text-slate-500">
                    还没有任何额度到账。充值或购买套餐后，每一笔都会在这里单独列一行。
                  </td>
                </tr>
              ) : sortedGrants.map((item) => {
                const status = grantStatusAt(item, BALANCE_AS_OF);
                return (
                  <tr key={item.grant.grantId}>
                    <TD className="font-medium text-slate-900">{item.grant.title}</TD>
                    <TD>{item.grant.grantedAt}</TD>
                    <TD>{yuan(item.grant.originalCents)}</TD>
                    <TD className="font-semibold text-slate-900">{yuan(item.remainingCents)}</TD>
                    {/* 无限期必须写成「无限期」而不是留空：留空客户会以为漏了。 */}
                    <TD>{item.grant.expiresAt || '无限期'}</TD>
                    <TD><StatusBadge tone={GRANT_STATUS_TONE[status]}>{GRANT_STATUS_LABEL[status]}</StatusBadge></TD>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50">
              <tr>
                <td colSpan={3} className="px-3 py-3 text-sm font-semibold text-slate-700">
                  合计（{sortedGrants.length} 个批次）
                </td>
                <td className="px-3 py-3 text-sm font-bold text-slate-900">{yuan(comp.balanceCents)}</td>
                <td colSpan={2} className="px-3 py-3 text-xs text-slate-500">
                  各批次剩余之和就是上面的账面余额，没有第二本账
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>

      <Panel title="套餐" desc="你买过的套餐。套餐金额和你账户里能打电话的余额不是同一个数。">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="border-b border-slate-200">
              <tr>
                <TH>套餐</TH><TH>购买时间</TH><TH>并发</TH><TH>套餐金额</TH>
                <TH>其中映射额度</TH><TH>其中平台与并发服务费</TH><TH>有效期至</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {BILLING_PACKAGES.map((item) => (
                <tr key={item.id}>
                  <TD className="font-medium text-slate-900">{item.name}</TD>
                  <TD>{item.purchasedAt}</TD>
                  <TD>{item.concurrency} 路</TD>
                  <TD>{yuan(item.totalCents)}</TD>
                  <TD className="font-semibold text-slate-900">{yuan(item.talkFeeCents)}</TD>
                  <TD className="text-slate-500">{yuan(item.totalCents - item.talkFeeCents)}</TD>
                  <TD>{item.expiresAt || '无限期'}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note>
          套餐 {yuan(BILLING_PACKAGES.reduce((sum, item) => sum + item.totalCents, 0))} 里只有{' '}
          {yuan(TALK_FEE_TOTAL_CENTS)} 是映射额度，另外 {yuan(PACKAGE_SERVICE_FEE_TOTAL_CENTS)} 是服务费，
          不进余额、不能打电话——所以余额永远小于套餐金额。
        </Note>
      </Panel>

      <PackageActionsPanel />

      <Panel
        title="预警设置"
        desc="余额快用完、或者额度快到期时提醒你。这两件事要防的损失不一样，所以分成两维。"
        extra={<span className="inline-flex items-center gap-1 text-xs text-slate-400"><Bell size={13} aria-hidden />每次提醒都会留档，可在「通知记录」页回查</span>}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="border-b border-slate-200">
              <tr><TH>提醒档位</TH><TH>什么时候提醒</TH><TH>能不能关</TH></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ALERT_TIERS.map((item) => (
                <tr key={item.tier}>
                  <TD className="font-medium text-slate-900">{item.label}</TD>
                  <TD className="text-xs text-slate-600">
                    {item.tier === 'threshold'
                      ? `账面余额低于你设的 ${yuan(thresholdCents)} 时提醒`
                      : item.tier === 'expiry'
                        // 到期提醒按「还剩几天」触发，与按金额的三档不是同一维度，
                        // 所以这里要把档位一个个列出来，不能只写一句「快到期时提醒」。
                        ? `有额度批次快到期时提醒，${expiryTierText}`
                        : item.desc}
                  </TD>
                  <TD>
                    <StatusBadge tone={item.configurable ? 'blue' : 'slate'}>
                      {item.configurable ? '可调整预警值' : '必提醒，不能关闭'}
                    </StatusBadge>
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <label className="flex flex-col gap-1 lg:col-span-3">
            <span className="text-xs text-slate-500">余额低于这个数就提醒（元）</span>
            <input
              type="number"
              min={0}
              className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700"
              value={thresholdYuan}
              onChange={(event) => { setThresholdYuan(event.target.value); setSaved(false); }}
            />
          </label>
          <div className="flex flex-col gap-1 lg:col-span-3">
            <span className="text-xs text-slate-500">提醒方式（至少选一种）</span>
            <div className="mt-1 flex h-9 items-center gap-4 rounded-md border border-slate-200 bg-white px-3">
              <label className="flex items-center gap-1.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={channels.email}
                  onChange={(event) => { setChannels({ ...channels, email: event.target.checked }); setSaved(false); }}
                />
                邮箱
              </label>
              <label className="flex items-center gap-1.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={channels.sms}
                  onChange={(event) => { setChannels({ ...channels, sms: event.target.checked }); setSaved(false); }}
                />
                短信
              </label>
            </div>
          </div>
          <label className="flex flex-col gap-1 lg:col-span-3">
            <span className="text-xs text-slate-500">邮箱接收人</span>
            <input
              type="email"
              className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700"
              value={email}
              onChange={(event) => { setEmail(event.target.value); setSaved(false); }}
            />
          </label>
          <label className="flex flex-col gap-1 lg:col-span-3">
            <span className="text-xs text-slate-500">短信接收人</span>
            <input
              type="tel"
              className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700"
              value={phone}
              onChange={(event) => { setPhone(event.target.value); setSaved(false); }}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* 一种方式都不选等于「不提醒」，而这个功能存在的意义就是提醒；
              把保存按钮禁掉比保存之后再报错少一次来回。 */}
          <button
            type="button"
            disabled={!channels.email && !channels.sms}
            onClick={() => setSaved(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            保存设置
          </button>
          {!channels.email && !channels.sms && (
            <span className="text-xs text-amber-600">至少要选一种提醒方式，否则余额用尽时你不会收到任何提醒。</span>
          )}
          {saved && (
            <span className="text-xs text-emerald-600">
              设置已保存：余额低于 {yuan(thresholdCents)} 时，通过
              {[channels.email && '邮箱', channels.sms && '短信'].filter(Boolean).join('与')}提醒。
            </span>
          )}
          <span className="ml-auto text-xs text-slate-500">
            同一档每天最多 {NOTIFY_SETTINGS.maxPerDay} 次、最多连发 {NOTIFY_SETTINGS.maxDays} 天
          </span>
        </div>

        <Note>
          后三档不能关闭——它们不是偏好，是事实。同一档每天最多 1 次、连发最多 3 天，各档各自计数。
          提醒只是通知，<b className="text-slate-700">不会自动充值</b>、也<b className="text-slate-700">不会中断通话</b>；
          但余额和授信都用尽后<b className="text-slate-700">新通话会被拦住</b>，这条要提前知道。
          到期当日会在「资金流水」记一条「额度到期清零」分录，每条提醒可在「通知记录」页回查。
        </Note>
      </Panel>

      <Panel
        title="并发容量"
        desc={`你买了 ${PURCHASED_CONCURRENCY} 路并发，分配给 ${activeProfiles.length} 台在用的机器人 ${ALLOCATED_CONCURRENCY} 路。`}
        extra={<RangeToggle value={range} onChange={setRange} />}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="border-b border-slate-200">
              <tr>
                <TH>机器人</TH>
                <TH>已分配并发</TH>
                <TH>{rangeLabel}峰值并发</TH>
                <TH>通话前预占额度</TH>
                <TH>{rangeLabel}被限流次数</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeProfiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-sm text-slate-500">
                    还没有在用的机器人。启用机器人并分配并发后，这里会显示每台分到几路。
                  </td>
                </tr>
              ) : activeProfiles.map((item) => {
                const throttled = item[rangeField(range, 'throttled')];
                const reserve = reserveOf(item.id, item.concurrency);
                return (
                  <tr key={item.id}>
                    <TD className="font-medium text-slate-900">{item.name}</TD>
                    <TD>{item.concurrency} 路</TD>
                    <TD>{item[rangeField(range, 'peak')]} 路</TD>
                    <TD>{reserve === null ? <span title="这台机器人的模型还没有配置价格，算不出要预占多少">—</span> : yuan(reserve)}</TD>
                    <TD className={throttled > 0 ? 'text-amber-600' : ''}>{throttled} 次</TD>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50">
              <tr>
                <td colSpan={2} className="px-3 py-3 text-sm font-semibold text-slate-700">
                  合计（{activeProfiles.length} 台在用的机器人）
                </td>
                <td className="px-3 py-3 text-sm text-slate-600">
                  {activeProfiles.reduce((sum, item) => sum + item[rangeField(range, 'peak')], 0)} 路
                </td>
                <td className="px-3 py-3 text-sm font-semibold text-slate-900">
                  {yuan(reservedCents)}
                  {unpricedConcurrency > 0 && (
                    <span className="ml-1 text-xs font-normal text-slate-500">（另有 {unpricedConcurrency} 路待定价，未计入）</span>
                  )}
                </td>
                <td className="px-3 py-3 text-sm text-slate-600">
                  {activeProfiles.reduce((sum, item) => sum + item[rangeField(range, 'throttled')], 0)} 次
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <Note>
          每路并发在通话前按 5 分钟预占一笔额度（合计 {yuan(reservedCents)}），打完按实际费用结算、多占的马上退回。
          超过 5 分钟仍按实际时长计费，不少收也不中断。路数占满时新通话排队，这就是「被限流次数」。
        </Note>
      </Panel>

      <Panel title="费用怎么算" desc="定价口径的完整说明，可对客户原文解释。">
        <ul className="space-y-2 text-xs leading-6 text-slate-600">
          {/* 这两句必须一句说「时长」一句说「钱」：都说「不足 1 分按 1 分算」的话，
              上一句刚说完「不会按整分钟收」，下一句看起来就是在按整分钟收。 */}
          <li>· 费用按每通电话的<b className="text-slate-800">通话时长</b>计算，按秒计费、金额向上取整到分，不会把不足一分钟的通话按整分钟收。</li>
          <li>· 每一通接通的电话最低收 <b className="text-slate-800">0.01 元</b>，即算出来的钱不足 1 分钱时按 1 分钱收；未接通的电话不计费。</li>
          <li>· 振铃等待时间不计费；通话中的静音与等待客户回应的时间照常计费。</li>
          <li>· 每分钟单价由这个机器人使用的<b className="text-slate-800">语音识别、大模型和音色</b>共同决定，模型越强单价越高。当前平台最低 {milliToYuan(PRICING_RULE.priceFloorMilli).toFixed(2)} 元/分钟。</li>
          <li>· 更换模型会重新算价，但已经打完的电话仍按当时的单价计费，不会追溯调整。</li>
          <li>· 每个机器人有各自的单价，所以同一笔余额在不同机器人上能打的时长不一样。</li>
          <li>· 扣费顺序：先扣快到期的额度，再扣没有有效期的余额，最后才动用信用额度。信用额度一旦动用就是欠款。</li>
        </ul>
        <Note>
          你已经打了 {num(USED_CALLS)} 通电话、{num(USED_MINUTES)} 分钟，其中智呼 {num(OUTBOUND_CALLS)} 通、
          {num(OUTBOUND_MINUTES)} 分钟。通数与时长必须成对看——同一笔钱在不同机器人上能打的时长不一样。
          每一通的单价、金额和扣减来源，在「通话明细」里逐笔可查。
        </Note>
      </Panel>
    </div>
  );
};

export default UsageOverview;
