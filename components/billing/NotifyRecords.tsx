// 计费中心 · 通知记录：发过哪些提醒、发给了谁、当时余额是多少。
// 这一页存在的唯一理由是「留下凭证」：客户说「我没收到提醒」，平台说「提醒过了」，
// 有这一页就都不用争。所以每一行都必须带上发送结果与触发时的余额，
// 只记一句「已提醒」等于什么都没记。
import React from 'react';
import { Bell, Mail, MessageSquare } from 'lucide-react';
import {
  ALERT_TIERS,
  DATA_CUTOFF_LABEL,
  EXPIRY_TIER_DAYS,
  NOTIFY_RECORDS,
  NOTIFY_SETTINGS,
  NOTIFY_TEMPLATE,
  nearestExpiry,
  type AlertTier,
} from './billingData';
import { EmptyTableState, StatusBadge } from '../report/reportUi';
import { Note, Panel, TD, TH, num, yuan } from './billingUi';

// 档位名从规则表取，不在这里另写一份中文：两处各写一遍，改名那天就会只改一处。
const TIER_LABEL = new Map<AlertTier, string>(ALERT_TIERS.map((item) => [item.tier, item.label]));

// 到期提醒的档位名也从数据层取，页面里不再写一遍天数——
// 「7 天 / 1 天」两处各写一份，档位一调就会只改一处。
const EXPIRY_DAYS_ON = EXPIRY_TIER_DAYS.filter((entry) => entry.defaultOn).map((entry) => entry.days);
const EXPIRY_HINT = (() => {
  const nearest = nearestExpiry();
  if (!nearest) return '名下也没有会到期的额度';
  return `最近一笔额度（${nearest.grant.grant.title}）还有 ${nearest.daysLeft} 天到期，还没进入提前 ${Math.max(...EXPIRY_DAYS_ON)} 天的提醒范围`;
})();

const CHANNEL_META = {
  email: { label: '邮箱', icon: Mail },
  sms: { label: '短信', icon: MessageSquare },
} as const;

const receiversOf = (): { channel: 'email' | 'sms'; label: string; receiver: string }[] => [
  { channel: 'email', label: CHANNEL_META.email.label, receiver: NOTIFY_SETTINGS.email },
  { channel: 'sms', label: CHANNEL_META.sms.label, receiver: NOTIFY_SETTINGS.phone },
];

const NotifyRecords: React.FC = () => {
  const channels = receiversOf().filter((item) => NOTIFY_SETTINGS.channels[item.channel]);

  return (
    <div className="space-y-4">
      <Panel
        title="提醒规则"
        desc="四档提醒。只有「余额低于预警值」可关，其余三档是事实。"
        extra={<span className="inline-flex items-center gap-1 text-xs text-slate-400"><Bell size={13} aria-hidden />记录长期保留，可回查</span>}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="border-b border-slate-200">
              <tr><TH>提醒档位</TH><TH>触发条件</TH><TH>提醒方式</TH><TH>频率上限</TH></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ALERT_TIERS.map((item) => (
                <tr key={item.tier}>
                  <TD className="font-medium text-slate-900">{item.label}</TD>
                  <TD className="text-xs text-slate-600">
                    {item.tier === 'threshold'
                      ? `账面余额低于 ${yuan(NOTIFY_SETTINGS.thresholdCents)}（可在「余额与额度」页修改）`
                      : item.tier === 'expiry'
                        ? `有额度批次快到期时按「还剩几天」触发：到期前 ${EXPIRY_TIER_DAYS.filter((entry) => entry.defaultOn).map((entry) => entry.days).join(' 天 / ')} 天各一次`
                        : item.desc}
                  </TD>
                  <TD className="text-xs text-slate-600">
                    {channels.length === 0 ? '—' : channels.map((channel) => channel.label).join(' / ')}
                    {item.configurable ? '' : '（固定）'}
                  </TD>
                  <TD className="text-xs text-slate-600">
                    每天最多 {NOTIFY_SETTINGS.maxPerDay} 次，最多连发 {NOTIFY_SETTINGS.maxDays} 天
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note>
          四档各自计数，同一档每天最多 1 次、连发最多 3 天。
          提醒不会自动充值、不中断通话，但余额用尽后新通话会被拦住。
          到期清零当天会在「资金流水」记一条分录——这里只记「通知发出去过」。
        </Note>
      </Panel>

      <Panel title="提醒文案" desc="你会收到的内容。括号里的数会按触发时的真实余额填入。">
        <div className="space-y-3">
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Mail size={14} aria-hidden />
              邮件 · 收件人 {NOTIFY_SETTINGS.email}
            </div>
            <p className="text-sm font-medium text-slate-800">{NOTIFY_TEMPLATE.emailSubject}</p>
            <p className="mt-1 text-xs leading-6 text-slate-600">{NOTIFY_TEMPLATE.emailBody}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <MessageSquare size={14} aria-hidden />
              短信 · 接收人 {NOTIFY_SETTINGS.phone}
            </div>
            <p className="text-xs leading-6 text-slate-600">{NOTIFY_TEMPLATE.smsBody}</p>
          </div>
          {/* 到期提醒是另一个事由，单独摆出来：客户看到「余额 42689 元」是不会动的，
              看到「有 15000 元将在 7 天后清零」才会动。两条文案混在一起看，就会以为
              到期提醒也是「余额不够了」。 */}
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Bell size={14} aria-hidden />
              邮件 · 额度即将到期（另一个事由，与余额提醒分开）
            </div>
            <p className="text-sm font-medium text-slate-800">{NOTIFY_TEMPLATE.expiryEmailSubject}</p>
            <p className="mt-1 text-xs leading-6 text-slate-600">{NOTIFY_TEMPLATE.expiryEmailBody}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <MessageSquare size={14} aria-hidden />
              短信 · 额度即将到期
            </div>
            <p className="text-xs leading-6 text-slate-600">{NOTIFY_TEMPLATE.expirySmsBody}</p>
          </div>
        </div>
        <Note>
          余额提醒与到期提醒是两个事由，文案不共用：一个是「钱快花完了」，一个是「钱快过期了」。
          短信不带链接——账务类短信带链接会被当成诈骗。
        </Note>
      </Panel>

      <Panel
        title="提醒记录"
        desc="每一条发出的提醒都有一行，含发送失败的。"
        extra={<span className="text-xs text-slate-500">数据截止 {DATA_CUTOFF_LABEL}</span>}
      >
        {NOTIFY_RECORDS.length === 0 ? (
          <EmptyTableState
            title="还没有发出过提醒"
            desc={`截至 ${DATA_CUTOFF_LABEL}，余额没有低于过预警值 ${yuan(NOTIFY_SETTINGS.thresholdCents)}，也没有用尽或欠费；${EXPIRY_HINT}。四档提醒一次都没触发过，触发后会在这里逐条列出。`}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="border-b border-slate-200">
                <tr>
                  <TH>记录号</TH><TH>发送时间</TH><TH>提醒档位</TH><TH>触发时余额</TH>
                  <TH>触发时欠费</TH><TH>提醒方式</TH><TH>接收人</TH><TH>发送结果</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {NOTIFY_RECORDS.map((item) => {
                  const Icon = CHANNEL_META[item.channel].icon;
                  return (
                    <tr key={item.id}>
                      <TD className="font-mono text-xs text-slate-500">{item.id}</TD>
                      <TD>{item.sentAt}</TD>
                      <TD>
                        <span className="font-medium text-slate-900">{TIER_LABEL.get(item.tier) ?? item.tier}</span>
                        {/* 到期档要带出「还剩几天、是哪一批」：只记「发过到期提醒」，
                            事后没法回答「是提前 7 天发的还是提前 1 天发的」，而那正是客户会追问的。 */}
                        {item.daysLeft !== undefined && (
                          <span className="block text-xs text-slate-500">
                            还剩 {item.daysLeft} 天{item.grantTitle ? ` · ${item.grantTitle}` : ''}
                          </span>
                        )}
                      </TD>
                      <TD className="font-semibold text-slate-900">{yuan(item.balanceCents)}</TD>
                      <TD className={item.debtCents > 0 ? 'font-semibold text-red-600' : ''}>{yuan(item.debtCents)}</TD>
                      <TD className="text-slate-600">
                        <span className="inline-flex items-center gap-1"><Icon size={13} aria-hidden />{CHANNEL_META[item.channel].label}</span>
                      </TD>
                      <TD className="text-slate-600">{item.receiver}</TD>
                      <TD>
                        <StatusBadge tone={item.result === 'sent' ? 'green' : 'red'}>
                          {item.result === 'sent' ? '已发送' : `发送失败：${item.failReason ?? '原因未记录'}`}
                        </StatusBadge>
                      </TD>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={8} className="px-3 py-3 text-xs text-slate-500">
                    共 {num(NOTIFY_RECORDS.length)} 条提醒记录。
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <Note>
          提醒记录长期保留，不受时间范围影响——它是对账凭证。要存档到「报表导出」页下载。
        </Note>
      </Panel>
    </div>
  );
};

export default NotifyRecords;
