// 计费中心 · 报表导出：四张报表各有哪些字段、每个字段是什么意思、导出来的值长什么样。
//
// 这里只放「报表面向客户的定义」，不放取数逻辑的另一份实现——每一张报表的行都来自
// 与页面完全相同的那几个函数（fundFlowInRange / BILLING_CALL_ROWS / MONTHLY_USAGE）。
// 导出如果自己再查一遍库、再算一遍，屏幕上和导出的文件迟早不一样，
// 而客户是拿着文件去对账的，两处不一致他只会认为平台在改数。
//
// 字段的中文名与状态标签一律从 billingUi 取，不在这里另抄一份：
// 页面上叫「通话前预占」，导出的文件里也必须是「通话前预占」。
import {
  ALERT_TIERS,
  BALANCE_AS_OF,
  BILLING_CALL_ROWS,
  MONTHLY_USAGE,
  NOTIFY_RECORDS,
  fundFlowInRange,
  grantStatusAt,
} from './billingData';
import { TIER_LABEL, getTier } from './billingEngine';
import {
  BILLING_STATUS_META,
  FUND_KIND_LABEL,
  GRANT_STATUS_LABEL,
  RECHARGE_SOURCE_LABEL,
} from './billingUi';
import { csvMinutes, csvYuan } from './billingCsv';

// 提醒档位与渠道的中文名。档位名与「通知记录」页同源（都取自 ALERT_TIERS），
// 渠道名在这里定，因为通知记录页的那份带图标、是界面零件，导出物用不上。
const ALERT_TIER_LABEL = Object.fromEntries(ALERT_TIERS.map((item) => [item.tier, item.label]));

const CHANNEL_LABEL = { email: '邮箱', sms: '短信' } as const;

export type ReportId = 'recharge' | 'call_charge' | 'calls' | 'stats' | 'notify';

// 一个字段的完整口径。unit 是单位，meaning 是「这是什么」，note 是「怎么算出来的」——
// 客户对不上账时问的从来不是第一个，是后两个。
export interface ReportField {
  name: string;     // 表头，也是 CSV 的第一行
  unit: string;     // 单位；没有单位写「—」
  meaning: string;
  note?: string;
}

export interface ReportDefinition {
  id: ReportId;
  name: string;
  filePrefix: string;
  desc: string;
  // 这张报表与页面上哪一块是同一份数据。客户拿导出文件回来问时，这句话能立刻对上。
  source: string;
  fields: ReportField[];
  // 范围内的数据行，顺序与列表头一一对应。空对象表示该范围没有数据。
  rows: (from: string, to: string) => string[][];
}

// 时间列一律导出原始时刻（2026-09-21 16:41:50），不做任何本地化格式。
// 「9 月 21 日 16:41」这种写法在排序和筛选时都得再解析一次，导出物不该有这个负担。

const RECHARGE_FIELDS: ReportField[] = [
  { name: '时间', unit: '—', meaning: '这笔钱到账的时刻', note: '按到账时刻归属，不按订单创建时刻' },
  { name: '流水号', unit: '—', meaning: '这笔到账在账户流水里的编号', note: '唯一的，可用它对上资金流水页的同一行' },
  { name: '到账来源', unit: '—', meaning: '套餐购买 / 其他入账', note: '套餐通话额度按购买批次分别到期' },
  { name: '到账金额', unit: '元', meaning: '这一笔实际到账的金额', note: '不含平台与并发服务费，那部分不进余额' },
  { name: '资金形式', unit: '—', meaning: '这笔额度的性质（套餐通话额度 / 独立到账余额 / 平台授信）', note: '决定它有没有有效期' },
  { name: '有效期至', unit: '—', meaning: '这笔钱能用到的最后一天', note: '到期没用完的部分清零，不结转下一期；无有效期的写「无限期」' },
  { name: '期末余额', unit: '元', meaning: '这笔到账之后的账面余额', note: '同一张表里上一行的期末余额就是下一行的期初余额' },
  { name: '状态', unit: '—', meaning: '这笔额度的当前状态（生效中 / 已用完 / 已过期）', note: '由剩余金额与有效期现推，导出时刻的状态' },
];

const CALL_CHARGE_FIELDS: ReportField[] = [
  { name: '时间', unit: '—', meaning: '这通电话的开始时刻', note: '按通话开始时刻归属到账期' },
  { name: '流水号', unit: '—', meaning: '这笔扣费在账户流水里的编号', note: '唯一' },
  { name: '机器人', unit: '—', meaning: '这通电话由哪台机器人拨打', note: '机器人删除后历史记录仍在，仍按当时的名字列出' },
  { name: '计费时长', unit: '分钟', meaning: '这通电话实际计费的时长', note: '按秒计费，导出统一换算成分钟、保留两位小数' },
  { name: '适用费率', unit: '元/分钟', meaning: '这通电话计费时生效的每分钟单价', note: '按这通电话自己的计费快照，之后改配置不影响它' },
  { name: '扣费金额', unit: '元', meaning: '这通电话实际扣掉的钱', note: '按秒向上取整到分；接通即至少 1 分' },
  { name: '扣减来源', unit: '—', meaning: '这笔钱从哪个额度批次里扣的', note: '跨批次时标明含几个批次；先扣快到期的' },
  { name: '期初余额', unit: '元', meaning: '这笔扣费之前的账面余额', note: '等于上一笔的期末余额' },
  { name: '期末余额', unit: '元', meaning: '这笔扣费之后的账面余额', note: '与通话消费明细里的余额同一条账' },
];

const CALLS_FIELDS: ReportField[] = [
  { name: '通话时间', unit: '—', meaning: '这通电话的开始时刻' },
  { name: 'Call ID', unit: '—', meaning: '这通电话的唯一编号', note: '报障或对账时报这个号' },
  { name: '机器人', unit: '—', meaning: '这通电话由哪台机器人拨打', note: '已删除的机器人仍按当时的名字列出' },
  { name: '客户号码', unit: '—', meaning: '通话对端的号码' },
  { name: '呼叫方向', unit: '—', meaning: '呼出（智呼，机器人打出去）还是呼入（客户打进来）' },
  { name: '通话时长', unit: '分钟', meaning: '这通电话的实际通话时长', note: '未接通的通话没有时长，导出为空' },
  { name: '适用费率', unit: '元/分钟', meaning: '这通电话计费时生效的每分钟单价', note: '算不出价的通话为空，不写 0' },
  { name: '本通费用', unit: '元', meaning: '这通电话实际扣掉的钱', note: '未接通与待定价的通话为空——写 0 会被读成「这通免费」' },
  { name: '状态', unit: '—', meaning: '这通电话的计费状态（已计费 / 未接通不计费 / 待定价）', note: '待定价是暂不扣费、补齐价格后自动补扣' },
];

const STATS_FIELDS: ReportField[] = [
  { name: '月份', unit: '—', meaning: '统计归属的月份', note: '按通话开始时刻归属；本月是进行中的月份' },
  { name: '机器人', unit: '—', meaning: '这台机器人的名字' },
  { name: '已计费通话数', unit: '通', meaning: '这个月这台机器人已计费的通话数', note: '未接通与待定价的通话不计入，它们有记录但没有金额' },
  { name: '其中智呼通话数', unit: '通', meaning: '上面这些通话里属于呼出的', note: '客户主动打进来的不算；与「已计费通话数」是包含关系' },
  { name: '已计费时长', unit: '分钟', meaning: '这个月这台机器人已计费通话的总时长' },
  { name: '其中智呼时长', unit: '分钟', meaning: '上面这些时长里属于呼出的' },
  { name: '已计费金额', unit: '元', meaning: '这个月这台机器人产生的费用', note: '各机器人相加等于当月总消费' },
  { name: '适用费率', unit: '元/分钟', meaning: '这台机器人当前生效的每分钟单价', note: '单价不同，所以「花的钱」和「打的时长」不成正比' },
  { name: '档位', unit: '—', meaning: '这台机器人按单价落在哪个档位', note: '由单价推出，不是一个可以选的设置' },
];

const NOTIFY_FIELDS: ReportField[] = [
  { name: '记录号', unit: '—', meaning: '这条提醒的唯一编号' },
  { name: '发送时间', unit: '—', meaning: '提醒实际发出的时刻' },
  { name: '提醒档位', unit: '—', meaning: '余额低于预警值 / 余额已用尽 / 已经欠费' },
  { name: '触发时余额', unit: '元', meaning: '触发那一刻的账面余额', note: '不是导出时的余额——事后回看要还原当时的处境' },
  { name: '触发时欠费', unit: '元', meaning: '触发那一刻已经形成的欠费' },
  { name: '提醒方式', unit: '—', meaning: '邮箱 / 短信' },
  { name: '接收人', unit: '—', meaning: '这一条发给了谁' },
  { name: '发送结果', unit: '—', meaning: '已发送 / 发送失败', note: '失败时在下一列给出原因' },
  { name: '失败原因', unit: '—', meaning: '发送失败的原因', note: '发送成功时为空' },
];

// 五张报表。前四张是账：钱怎么进来的、怎么出去的、每一通花了多少、按谁和哪个月汇总；
// 第五张是凭证：提醒发过没有、发给了谁。
export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: 'recharge',
    name: '额度到账记录',
    filePrefix: '额度到账记录',
    desc: '每笔套餐通话额度的到账金额与到期日。',
    source: '资金流水 · 额度到账',
    fields: RECHARGE_FIELDS,
    rows: (from, to) =>
      [...fundFlowInRange(from, to, 'recharge')].reverse().map((row) => {
        const status = row.grantBalance ? grantStatusAt(row.grantBalance, BALANCE_AS_OF) : null;
        return [
          row.entry.occurredAt,
          row.entry.entryId,
          row.grantBalance ? RECHARGE_SOURCE_LABEL[row.grantBalance.grant.source] : '—',
          csvYuan(row.entry.amountCents),
          FUND_KIND_LABEL[row.entry.fundKind],
          row.grantBalance?.grant.expiresAt ?? '无限期',
          csvYuan(row.entry.balanceAfterCents),
          status === null ? '—' : GRANT_STATUS_LABEL[status],
        ];
      }),
  },
  {
    id: 'call_charge',
    name: '扣费记录',
    filePrefix: '扣费记录',
    desc: '每一通电话实际扣掉的钱，以及从哪一笔额度里扣的。',
    source: '资金流水 · 扣费记录',
    fields: CALL_CHARGE_FIELDS,
    rows: (from, to) =>
      [...fundFlowInRange(from, to, 'call_charge')].reverse().map((row) => [
        row.entry.occurredAt,
        row.entry.entryId,
        row.call?.robotName ?? '—',
        row.call ? csvMinutes(row.call.durationSec) : '—',
        row.call ? (row.call.record.snapshot.priceMilli / 1000).toFixed(2) : '—',
        csvYuan(Math.abs(row.entry.amountCents)),
        row.grantBalance
          ? (row.allocationCount > 1 ? `${row.grantBalance.grant.title}（含 ${row.allocationCount} 个批次）` : row.grantBalance.grant.title)
          : '—',
        csvYuan(row.beforeCents),
        csvYuan(row.entry.balanceAfterCents),
      ]),
  },
  {
    id: 'calls',
    name: '通话消费明细',
    filePrefix: '通话消费明细',
    desc: '逐通的费用明细，含未接通与还没有价格的通话。',
    source: '通话消费明细',
    fields: CALLS_FIELDS,
    rows: (from, to) =>
      BILLING_CALL_ROWS
        .filter((row) => row.startedAt.slice(0, 10) >= from && row.startedAt.slice(0, 10) <= to)
        // 导出的顺序与明细表默认的排序一致：最近的在最上面。
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .map((row) => {
          const priced = row.record.billingStatus === 'billed';
          return [
            row.startedAt,
            row.record.callId,
            row.robotName,
            row.phoneNumber,
            row.direction === 'outbound' ? '呼出' : '呼入',
            row.record.billingStatus === 'free' ? '' : csvMinutes(row.durationSec),
            priced ? (row.record.snapshot.priceMilli / 1000).toFixed(2) : '',
            priced ? csvYuan(row.record.amountCents) : '',
            BILLING_STATUS_META[row.record.billingStatus].label,
          ];
        }),
  },
  {
    id: 'stats',
    name: '消费统计',
    filePrefix: '消费统计',
    desc: '按月份 × 机器人汇总，每个月的钱花在哪台机器人上。',
    source: '消费统计',
    fields: STATS_FIELDS,
    rows: (from, to) =>
      MONTHLY_USAGE
        .filter((item) => {
          // 月份归属：只保留与所选范围有交集的月份，避免导出一份和范围对不上的文件。
          const monthStart = `${item.month}-01`;
          const monthEnd = `${item.month}-31`;
          return monthEnd >= from && monthStart <= to;
        })
        .sort((a, b) => (a.month === b.month ? b.amountCents - a.amountCents : b.month.localeCompare(a.month)))
        .map((item) => [
          item.month,
          item.robotName,
          String(item.calls),
          String(item.outboundCalls),
          csvMinutes(item.talkSeconds),
          csvMinutes(item.outboundSeconds),
          item.pending ? '' : csvYuan(item.amountCents),
          item.rateMilli === null ? '' : (item.rateMilli / 1000).toFixed(2),
          item.rateMilli === null ? '' : TIER_LABEL[getTier(item.rateMilli)],
        ]),
  },
  {
    id: 'notify',
    name: '提醒记录',
    filePrefix: '提醒记录',
    desc: '发过哪些提醒、发给了谁、发送结果如何。客户说没收到时，这份文件就是凭证。',
    source: '通知记录',
    fields: NOTIFY_FIELDS,
    // 提醒记录不按时间范围筛：它是凭证，不能因为页头选了个范围就查不到。
    // 范围只决定文件里有没有内容这件事本身就是错的，所以这里返回全部。
    rows: () =>
      NOTIFY_RECORDS.slice()
        .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
        .map((item) => [
          item.id,
          item.sentAt,
          ALERT_TIER_LABEL[item.tier],
          csvYuan(item.balanceCents),
          csvYuan(item.debtCents),
          CHANNEL_LABEL[item.channel],
          item.receiver,
          item.result === 'sent' ? '已发送' : '发送失败',
          item.failReason ?? '',
        ]),
  },
];

// 从真实数据里取一行做示例，不手写：手写的示例改了字段忘了改，口径表就成了一份假文档。
export const sampleRow = (rows: string[][]): string[] | null => (rows.length > 0 ? rows[0] : null);

// 页面上给客户看的金额格式（带 ¥ 与千分位），只用于界面，不进导出物。
export const formatSampleValue = (value: string, unit: string): string => {
  if (unit === '元' && /^\d+(\.\d+)?$/.test(value)) {
    const [int, dec] = value.split('.');
    return `¥${int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${dec === undefined ? '' : `.${dec}`}`;
  }
  if (unit === '元/分钟' && /^\d+(\.\d+)?$/.test(value)) return `¥${value}/分钟`;
  return value === '' ? '（空）' : value;
};
