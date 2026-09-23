// 计费中心 · 消费统计：按机器人看谁在花钱、按月份看每个月花多少。
// 「机器人花费」是把同一个账户的消费按机器人拆开看，机器人的额度是共享的，不存在各花各的余额。
import React, { useMemo, useState } from 'react';
import {
  BILLING_MONTHS,
  BILLING_ROBOT_PROFILES,
  CURRENT_MONTH,
  CURRENT_MONTH_CUTOFF_DAY,
  MONTHLY_USAGE,
  monthCallCount,
  monthOutboundCallCount,
  monthOutboundMinutes,
  monthSpentCents,
  monthSpentCentsThrough,
  monthTalkMinutes,
  PREVIOUS_MONTH,
  type RobotMonthlyUsage,
} from './billingData';
import { TIER_LABEL, formatPricePerMin, getTier } from './billingEngine';
import { EmptyTableState, StatusBadge, cx } from '../report/reportUi';
import { Note, Panel, TD, TH, num, yuan } from './billingUi';
import type { BillingTier } from '../../types';

const SELECT = 'h-9 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700';

interface RobotTotal {
  robotId: string;
  robotName: string;
  calls: number;
  talkMinutes: number;
  // 其中智呼（呼出）那一份：客户要的「多少通通话、多少智呼的时长」在这里分开给。
  outboundCalls: number;
  outboundMinutes: number;
  amountCents: number;
  rateMilli: number | null;
  tier: BillingTier | null;
  pending: boolean;
  months: number;
  latestMonth: string;
}

const BotBillingStats: React.FC = () => {
  const [range, setRange] = useState<'all' | '3' | '1'>('all');

  const monthsInRange = useMemo(() => {
    if (range === 'all') return BILLING_MONTHS;
    return BILLING_MONTHS.slice(-Number(range));
  }, [range]);

  const rowsInRange = useMemo(
    () => MONTHLY_USAGE.filter((item) => monthsInRange.includes(item.month)),
    [monthsInRange],
  );

  // 同一台机器人在多个月份各有记录，这里按机器人合并，得到「这台一共花了多少」。
  const totals = useMemo<RobotTotal[]>(() => {
    const map = new Map<string, RobotTotal>();
    rowsInRange.forEach((item: RobotMonthlyUsage) => {
      const existing = map.get(item.robotId);
      if (existing) {
        existing.calls += item.calls;
        existing.talkMinutes += item.talkMinutes;
        existing.outboundCalls += item.outboundCalls;
        existing.outboundMinutes += item.outboundSeconds / 60;
        existing.amountCents += item.pending ? 0 : item.amountCents;
        existing.pending = existing.pending || item.pending;
        existing.months += 1;
        if (item.month > existing.latestMonth) existing.latestMonth = item.month;
        return;
      }
      map.set(item.robotId, {
        robotId: item.robotId,
        robotName: item.robotName,
        calls: item.calls,
        talkMinutes: item.talkMinutes,
        outboundCalls: item.outboundCalls,
        outboundMinutes: item.outboundSeconds / 60,
        amountCents: item.pending ? 0 : item.amountCents,
        rateMilli: item.rateMilli,
        // 档位一律走引擎的 getTier，避免这里再抄一遍阈值、两处慢慢对不上。
        tier: item.rateMilli === null ? null : getTier(item.rateMilli),
        pending: item.pending,
        months: 1,
        latestMonth: item.month,
      });
    });
    return [...map.values()].sort((a, b) => b.amountCents - a.amountCents);
  }, [rowsInRange]);

  const grandCents = totals.reduce((sum, item) => sum + item.amountCents, 0);
  const maxRobotCents = Math.max(1, ...totals.map((item) => item.amountCents));

  const monthlyTotals = monthsInRange.map((month) => ({
    month,
    cents: monthSpentCents(month),
    minutes: monthTalkMinutes(month),
    calls: monthCallCount(month),
    outboundCalls: monthOutboundCallCount(month),
    outboundMinutes: monthOutboundMinutes(month),
  }));
  const maxMonthCents = Math.max(1, ...monthlyTotals.map((item) => item.cents));
  const currentCents = monthSpentCents(CURRENT_MONTH);
  const previousCents = monthSpentCents(PREVIOUS_MONTH);
  // 本月还没过完（只统计到 22 日），拿它跟上月一整个月比，等于用 22 天去比 31 天，
  // 会得出一个「消费下降三成」的假结论。所以环比要跟上月的同一段比。
  const previousSamePeriodCents = monthSpentCentsThrough(PREVIOUS_MONTH, CURRENT_MONTH_CUTOFF_DAY);
  const momPercent = previousSamePeriodCents === 0 ? 0 : Math.round(((currentCents - previousSamePeriodCents) / previousSamePeriodCents) * 1000) / 10;
  // 已删除但仍产生过通话的机器人：计费记录不随机器人一起消失，表里要标出来，
  // 否则客户会以为名单里混进了不认识的名字。
  const deletedRobotIds = new Set(BILLING_ROBOT_PROFILES.filter((item) => item.state === 'deleted').map((item) => item.id));

  return (
    <div className="space-y-4">
      <Panel
        title="按机器人看消费"
        desc="同一个账户的消费按机器人拆开。额度是共享的，这里看的是「谁花的」而不是「谁还剩多少」。"
        extra={
          <label className="flex items-center gap-2">
            <span className="text-xs text-slate-500">时间范围</span>
            <select className={SELECT} value={range} onChange={(event) => setRange(event.target.value as typeof range)}>
              <option value="all">全部（{BILLING_MONTHS.length} 个月）</option>
              <option value="3">最近 3 个月</option>
              <option value="1">最近 1 个月</option>
            </select>
          </label>
        }
      >
        {totals.length === 0 ? (
          <EmptyTableState title="这个时间范围内没有消费记录" desc="换一个时间范围试试。" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="border-b border-slate-200">
                <tr>
                  {/* 三列都只算已计费的通话，表头就写清楚，别让客户拿它去除金额。
                      待定价和未接通的通话有记录没有金额，计进来会让「金额 ÷ 时长」算不出真实单价。 */}
                  <TH>机器人</TH><TH>适用费率</TH><TH>档位</TH><TH>已计费通话数</TH>
                  <TH>其中智呼</TH><TH>已计费时长</TH><TH>累计消费</TH><TH>占比</TH><TH>最近使用</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {totals.map((item) => (
                  <tr key={item.robotId}>
                    <TD className="font-medium text-slate-900">
                      {item.robotName}
                      {deletedRobotIds.has(item.robotId) && <span className="ml-2"><StatusBadge tone="slate">已删除</StatusBadge></span>}
                      {item.pending && <span className="ml-2"><StatusBadge tone="amber">待定价</StatusBadge></span>}
                    </TD>
                    <TD className={item.rateMilli === null ? 'text-slate-400' : ''}>
                      {item.rateMilli === null ? '—' : formatPricePerMin(item.rateMilli)}
                    </TD>
                    <TD>{item.tier === null ? '—' : TIER_LABEL[item.tier]}</TD>
                    <TD>{num(item.calls)} 通</TD>
                    {/* 智呼单独给一格：客户问的「多少通通话、多少智呼」是两个数，
                        合成一个数就答不了；这一格里同时给通数和时长，也是成对给的。 */}
                    <TD className="text-slate-600">{num(item.outboundCalls)} 通 · {num(Math.round(item.outboundMinutes))} 分钟</TD>
                    <TD>{num(Math.round(item.talkMinutes))} 分钟</TD>
                    <TD className={cx('font-semibold', item.pending && item.amountCents === 0 ? 'text-slate-400' : 'text-slate-900')}>
                      {/* 一分钱都没扣的机器人写「—」而不是「0.00 元」：0 元读起来像「免费」，
                          实际是「还没有价格、暂不扣费」。有已计费通话的机器人照常显示金额。 */}
                      {item.pending && item.amountCents === 0
                        ? <span title="这台机器人的模型还没配置价格，累计消费还不算数，价格补齐后会补扣">—</span>
                        : yuan(item.amountCents)}
                    </TD>
                    <TD>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((item.amountCents / maxRobotCents) * 100)}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">
                          {grandCents === 0 ? '—' : `${((item.amountCents / grandCents) * 100).toFixed(1)}%`}
                        </span>
                      </div>
                    </TD>
                    <TD className="text-slate-500">{item.latestMonth}</TD>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={4} className="px-3 py-3 text-sm font-semibold text-slate-700">合计（{totals.length} 台机器人）</td>
                  <td className="px-3 py-3 text-sm text-slate-600">
                    {num(totals.reduce((sum, item) => sum + item.outboundCalls, 0))} 通 · {num(Math.round(totals.reduce((sum, item) => sum + item.outboundMinutes, 0)))} 分钟
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-600">
                    {num(Math.round(totals.reduce((sum, item) => sum + item.talkMinutes, 0)))} 分钟
                  </td>
                  <td className="px-3 py-3 text-sm font-bold text-slate-900">{yuan(grandCents)}</td>
                  <td colSpan={2} className="px-3 py-3 text-xs text-slate-500">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <Note>
          单价不同，所以「花的钱」和「打的时长」不成正比。「其中智呼」只算呼出，不含客户打进来的。
          各列只统计已计费的通话，与「消费明细」表尾合计同一批数据；已删除的机器人只要产生过通话就留在表里。
        </Note>
      </Panel>

      <Panel
        title="按月份看消费"
        desc={`每个月的消费趋势。本月还没过完，统计到 ${CURRENT_MONTH_CUTOFF_DAY} 日，之后还会增加。`}
      >
        <div className="mb-4 flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-slate-500">本月消费（{CURRENT_MONTH}，1–{CURRENT_MONTH_CUTOFF_DAY} 日）</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{yuan(currentCents)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">上月同期（{PREVIOUS_MONTH}，1–{CURRENT_MONTH_CUTOFF_DAY} 日）</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{yuan(previousSamePeriodCents)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">环比上月同期</p>
            <p className={cx('mt-1 text-xl font-bold', momPercent > 0 ? 'text-amber-600' : 'text-emerald-600')}>
              {momPercent > 0 ? '+' : ''}{momPercent}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">上月整月（{PREVIOUS_MONTH}）</p>
            <p className="mt-1 text-xl font-bold text-slate-500">{yuan(previousCents)}</p>
          </div>
        </div>
        <Note>
          环比是拿本月 1–{CURRENT_MONTH_CUTOFF_DAY} 日跟上月同样的 {CURRENT_MONTH_CUTOFF_DAY} 天比。
          本月还没过完，直接跟上月一整个月（{yuan(previousCents)}）比会得出一个「消费下降」的假结论。
        </Note>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="border-b border-slate-200">
              <tr><TH>月份</TH><TH>已计费通话数</TH><TH>其中智呼</TH><TH>已计费时长</TH><TH>已计费金额</TH><TH className="w-[34%]">对比</TH></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...monthlyTotals].reverse().map((item) => (
                <tr key={item.month}>
                  <TD className="font-medium text-slate-900">{item.month}</TD>
                  <TD>{num(item.calls)} 通</TD>
                  <TD className="text-slate-600">{num(item.outboundCalls)} 通 · {num(Math.round(item.outboundMinutes))} 分钟</TD>
                  <TD>{num(Math.round(item.minutes))} 分钟</TD>
                  <TD className="font-semibold text-slate-900">{yuan(item.cents)}</TD>
                  <TD>
                    <div className="h-2 w-full max-w-[320px] overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((item.cents / maxMonthCents) * 100)}%` }} />
                    </div>
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="怎么用这张表" desc="三个最常见的看法。">
        <ul className="space-y-2 text-xs leading-6 text-slate-600">
          <li>· <b className="text-slate-800">想知道钱花在哪了</b>：看第一张表的「累计消费」，从高到低排好了。</li>
          {/* 说「换一个档位」会让人找不到地方改：档位是由模型算出来的结果，不是一个可以选的设置。 */}
          <li>· <b className="text-slate-800">想控制成本</b>：单价高的机器人往往是大模型或音色选了更贵的型号，把型号换成便宜一些的再发布，之后的新通话就按新价算。</li>
          <li>· <b className="text-slate-800">想知道某个月发生了什么</b>：到「消费明细」按月份筛选，逐通看。</li>
        </ul>
      </Panel>
    </div>
  );
};

export default BotBillingStats;
