// 计费中心 · 余额与额度：余额由哪几笔钱组成、每笔什么时候到期、并发用得紧不紧张。
// 这一页回答的是「我还有多少钱、这些钱什么时候会没」，不是「我花了多少钱」——后者在资金流水与消费统计里。
import React, { useState } from 'react';
import { paginateRows, ReportTablePagination, StatusBadge } from '../report/reportUi';
import {
  ALERT_TIERS,
  ACTIVE_CONCURRENCY,
  ALLOCATED_CONCURRENCY,
  BALANCE_AS_OF,
  BALANCE_COMPOSITION,
  BILLING_GRANT_BALANCES,
  BILLING_PACKAGES,
  BILLING_ROBOT_PROFILES,
  CREDIT_LINE,
  DATA_CUTOFF_LABEL,
  EXPIRY_TIER_DAYS,
  NOTIFY_SETTINGS,
  PACKAGE_SERVICE_FEE_TOTAL_CENTS,
  TALK_FEE_TOTAL_CENTS,
  getRateMilli,
  grantStatusAt,
  grantsByConsumeOrder,
  nearestExpiry,
} from './billingData';
import PackageActionsPanel from './PackageActionsPanel';
import { PRICING_RULE, computeReserveCents, milliToYuan } from './billingEngine';
import {
  GRANT_STATUS_LABEL,
  GRANT_STATUS_TONE,
  Note,
  Panel,
  RANGE_LABEL,
  RangeToggle,
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

type OverviewSection = 'account' | 'package' | 'alerts';

interface Props {
  section: OverviewSection;
}

const UsageOverview: React.FC<Props> = ({ section }) => {
  const [range, setRange] = useState<RangeKey>('today');
  const [purchasePage, setPurchasePage] = useState<number>(1);
  const [purchasePageSize, setPurchasePageSize] = useState<number>(5);
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
  const rangeLabel = RANGE_LABEL[range];

  const comp = BALANCE_COMPOSITION;
  // 并发按购买批次独立到期；当前总数只合计在统计日已经生效且尚未到期的批次。
  const purchaseEntries = BILLING_PACKAGES.map((item) => ({
    ...item,
    active: item.purchasedAt.slice(0, 10) <= DATA_CUTOFF_LABEL && (!item.expiresAt || item.expiresAt > DATA_CUTOFF_LABEL),
  })).sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt));
  const { totalPages: purchaseTotalPages, safePage: purchaseSafePage, rows: purchaseRows } = paginateRows(purchaseEntries, purchasePage, purchasePageSize);
  const availableConcurrency = Math.max(0, ACTIVE_CONCURRENCY - ALLOCATED_CONCURRENCY);

  return (
    <div className="space-y-4">
      {section === 'account' && <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
        <div><p className="text-xs text-slate-500">当前可用通话额度</p><p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">{yuan(comp.availableCents)}</p></div>
        <p className="text-xs text-slate-500">含可用授信 {yuan(comp.creditAvailableCents)} · 通话中占用 {yuan(comp.frozenCents)}</p>
      </div>

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
        <Note>先扣快到期的额度，再扣长期余额，最后使用授信。使用授信后会形成待结清欠费。</Note>
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
            <b>{expiring.grant.grant.title}</b> · 剩余 {yuan(expiring.grant.remainingCents)} · {expiring.grant.grant.expiresAt} 到期
          </div>
        )}
        <div className="space-y-2">
          {sortedGrants.length === 0 ? (
            <div className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">暂无额度批次</div>
          ) : sortedGrants.map((item) => {
            const status = grantStatusAt(item, BALANCE_AS_OF);
            return (
              <div key={item.grant.grantId} className="grid gap-3 rounded-lg border border-slate-100 px-4 py-3 sm:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(90px,1fr))_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{item.grant.title}</p>
                  <p className="mt-1 text-xs text-slate-400">到账 {item.grant.grantedAt}</p>
                </div>
                <div><p className="text-xs text-slate-400">原始金额</p><p className="mt-1 text-sm text-slate-700">{yuan(item.grant.originalCents)}</p></div>
                <div><p className="text-xs text-slate-400">剩余金额</p><p className="mt-1 text-sm font-semibold text-slate-900">{yuan(item.remainingCents)}</p></div>
                <div><p className="text-xs text-slate-400">有效期至</p><p className="mt-1 text-sm text-slate-700">{item.grant.expiresAt || '无限期'}</p></div>
                <StatusBadge tone={GRANT_STATUS_TONE[status]}>{GRANT_STATUS_LABEL[status]}</StatusBadge>
              </div>
            );
          })}
        </div>
      </Panel>

      </div>}

      {section === 'package' && <div className="space-y-4">
      <Panel title="套餐购买记录" desc="每笔购买独立生效和到期；按购买时间从近到远查看。">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr><th className="px-4 py-3 font-medium">套餐 / 批次</th><th className="px-3 py-3 font-medium">购买时间</th><th className="px-3 py-3 font-medium">并发</th><th className="px-3 py-3 font-medium">实付金额</th><th className="px-3 py-3 font-medium">通话额度</th><th className="px-3 py-3 font-medium">到期日</th><th className="px-3 py-3 font-medium">状态</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseRows.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3"><p className="font-medium text-slate-900">{item.name}</p><p className="mt-0.5 text-xs text-slate-400">{item.id}</p></td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-600">{item.purchasedAt}</td>
                  <td className="whitespace-nowrap px-3 py-3 font-medium text-slate-800">{item.concurrency} 路</td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-700">{yuan(item.totalCents)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-700">{yuan(item.talkFeeCents)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-600">{item.expiresAt || '长期有效'}</td>
                  <td className="px-3 py-3"><StatusBadge tone={item.active ? 'green' : 'slate'}>{item.active ? '使用中' : '已到期'}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
          <ReportTablePagination page={purchaseSafePage} totalPages={purchaseTotalPages} total={purchaseEntries.length} pageSize={purchasePageSize} onPageChange={setPurchasePage} pageSizeOptions={[5, 10, 20]} onPageSizeChange={(size) => { setPurchasePageSize(size); setPurchasePage(1); }} />
        </div>
        <Note>
          套餐购买金额 {yuan(BILLING_PACKAGES.reduce((sum, item) => sum + item.totalCents, 0))} 中，
          {yuan(TALK_FEE_TOTAL_CENTS)} 计入套餐通话额度，另有 {yuan(PACKAGE_SERVICE_FEE_TOTAL_CENTS)} 为平台服务费。
          当前余额是通话额度扣除已消费后的剩余金额，不能直接与套餐购买金额比较。
        </Note>
      </Panel>

      <Panel
        title="并发容量"
        desc="同一账户买入的并发可分批生效和到期；当前可用路数按每批有效期计算。"
        extra={<RangeToggle value={range} onChange={setRange} />}
      >
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
          <div><p className="text-xs text-slate-500">当前可用并发</p><p className="mt-1 text-xl font-semibold text-slate-900">{ACTIVE_CONCURRENCY} <span className="text-sm font-normal">路</span></p></div>
          <div><p className="text-xs text-slate-500">已分配给机器人</p><p className="mt-1 text-xl font-semibold text-slate-900">{ALLOCATED_CONCURRENCY} <span className="text-sm font-normal">路</span></p></div>
          <div><p className="text-xs text-slate-500">未分配</p><p className="mt-1 text-xl font-semibold text-slate-900">{availableConcurrency} <span className="text-sm font-normal">路</span></p></div>
        </div>
        <p className="mt-2 text-xs text-slate-500">截至 {DATA_CUTOFF_LABEL}；已到期批次不计入当前有效并发。</p>

        <h4 className="mb-2 mt-5 text-sm font-semibold text-slate-900">机器人分配</h4>
        <div className="grid gap-3 lg:grid-cols-3">
          {activeProfiles.map((item) => {
            const throttled = item[rangeField(range, 'throttled')];
            const reserve = reserveOf(item.id, item.concurrency);
            return (
              <div key={item.id} className="rounded-lg border border-slate-100 p-4">
                <p className="truncate text-sm font-medium text-slate-900">{item.name}</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div><p className="text-slate-400">已分配</p><p className="mt-1 font-semibold text-slate-800">{item.concurrency} 路</p></div>
                  <div><p className="text-slate-400">{rangeLabel}峰值</p><p className="mt-1 font-semibold text-slate-800">{item[rangeField(range, 'peak')]} 路</p></div>
                  <div><p className="text-slate-400">预占额度</p><p className="mt-1 font-semibold text-slate-800">{reserve === null ? '—' : yuan(reserve)}</p></div>
                  <div><p className="text-slate-400">限流</p><p className={`mt-1 font-semibold ${throttled > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{throttled} 次</p></div>
                </div>
              </div>
            );
          })}
        </div>
        <Note>每路通话开始前按 5 分钟预占，结束后按实际费用结算并释放差额。</Note>
      </Panel>
      <PackageActionsPanel />
      </div>}

      {section === 'alerts' && <div className="space-y-4">
      <Panel
        title="预警设置"
        desc="余额快用完、或者额度快到期时提醒你。这两件事要防的损失不一样，所以分成两维。"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ALERT_TIERS.map((item) => (
            <div key={item.tier} className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <StatusBadge tone={item.configurable ? 'blue' : 'slate'}>
                  {item.configurable ? '可调整' : '系统提醒'}
                </StatusBadge>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                {item.tier === 'threshold'
                  ? `余额低于 ${yuan(thresholdCents)} 时提醒`
                  : item.tier === 'expiry'
                    ? `额度快到期时提醒：${expiryTierText}`
                    : item.desc}
              </p>
            </div>
          ))}
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
          提醒只是通知，<b className="text-slate-700">不会自动增加额度</b>、也<b className="text-slate-700">不会中断通话</b>；
          但余额和授信都用尽后<b className="text-slate-700">新通话会被拦住</b>，这条要提前知道。
          到期当日会在「资金流水」记一条「额度到期清零」分录，每条提醒可在「通知记录」页回查。
        </Note>
      </Panel>

      <Panel title="计费规则" desc="每通电话的计费口径。">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ['计费粒度', '按秒'],
            ['最低单价', `${milliToYuan(PRICING_RULE.priceFloorMilli).toFixed(2)} 元/分钟`],
            ['单通最低', '0.01 元'],
            ['价格生效', '发布时锁定'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-slate-50 px-3 py-2.5">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
        <Note><ul className="space-y-1.5">
          {/* 这两句必须一句说「时长」一句说「钱」：都说「不足 1 分按 1 分算」的话，
              上一句刚说完「不会按整分钟收」，下一句看起来就是在按整分钟收。 */}
          <li>· 费用按每通电话的<b className="text-slate-800">通话时长</b>计算，按秒计费、金额向上取整到分，不会把不足一分钟的通话按整分钟收。</li>
          <li>· 每一通接通的电话最低收 <b className="text-slate-800">0.01 元</b>，即算出来的钱不足 1 分钱时按 1 分钱收；未接通的电话不计费。</li>
          <li>· 振铃等待时间不计费；通话中的静音与等待客户回应的时间照常计费。</li>
          <li>· 总通话数包含智呼与呼入；智呼是其中的呼出部分。</li>
          <li>· 每分钟单价由这个机器人使用的<b className="text-slate-800">语音识别、大模型和音色</b>共同决定，模型越强单价越高。</li>
          <li>· 更换模型会重新算价，但已经打完的电话仍按当时的单价计费，不会追溯调整。</li>
          <li>· 每个机器人有各自的单价，所以同一笔余额在不同机器人上能打的时长不一样。</li>
          <li>· 扣费顺序：先扣快到期的额度，再扣没有有效期的余额，最后才动用信用额度。信用额度一旦动用就是欠款。</li>
        </ul></Note>
      </Panel>
      </div>}
    </div>
  );
};

export default UsageOverview;
