// 计费中心各页共用的一点界面零件：面板外壳、表格单元格、金额与数量的写法。
// 计费中心四个页面用的是同一套外壳，集中放一份，改样式不用改四处、也不会各页慢慢长歪。
import React from 'react';
import { CallBillingRecord, FundKind, LedgerEntryType, RechargeSource } from '../../types';
import { centsToYuan } from './billingEngine';
import type { GrantStatus } from './billingData';

// 计费状态徽章的唯一一份：标签和颜色都只在这里定义。
// 明细表、依据面板、通话详情三处都要显示这个状态，各写一份的后果不是重复代码，
// 是同一个状态在三处慢慢叫成三个名字——之前通话详情就把「未接通不计费」写成了「不收费」，
// 客户在计费中心看到的和点进通话记录看到的不一致。
export const BILLING_STATUS_META: Record<CallBillingRecord['billingStatus'], { label: string; tone: 'green' | 'amber' | 'slate' | 'red' | 'blue' }> = {
  billed: { label: '已计费', tone: 'green' },
  // 「未接通不计费」而不是「不计费」：客户一眼能看出没被收费的原因。
  free: { label: '未接通不计费', tone: 'slate' },
  pending: { label: '待定价', tone: 'amber' },
  partial: { label: '部分计费', tone: 'blue' },
  reversed: { label: '已冲正', tone: 'red' },
};

// 金额一律「¥1,234.56」。金额存的是「分」，这里只负责显示。
export const yuan = (cents: number) => `¥${centsToYuan(cents).toFixed(2)}`;

// 资金类别与充值方式的说法只有这一份：余额构成、额度批次、资金流水三处都要用。
// 各写一份的后果不是重复代码，是同一笔钱在三处慢慢叫成三个名字，客户对不上号。
export const FUND_KIND_LABEL: Record<FundKind, string> = {
  // 「代金券额度」而不是「代金券」：它没有券号、不能转赠，就是一笔有有效期的钱，
  // 叫「券」客户会去找券码在哪。
  voucher: '代金券额度',
  cash: '单独充值',
  credit: '信用额度',
};

export const RECHARGE_SOURCE_LABEL: Record<RechargeSource, string> = {
  auto: '系统自动充值',
  manual: '单独充值',
};

export const GRANT_STATUS_LABEL: Record<GrantStatus, string> = {
  active: '生效中',
  used: '已用完',
  expired: '已过期',
};

// 流水类型的说法只有这一份。预占与释放也必须给名字：它们在「全部」里是真实的余额变动，
// 不写清楚客户会看到两笔莫名其妙的一进一出，还以为账错了。
export const LEDGER_TYPE_LABEL: Record<LedgerEntryType, string> = {
  recharge: '充值到账',
  call_charge: '通话扣费',
  refund: '退款',
  reversal: '冲正',
  adjustment: '人工调整',
  reserve: '通话前预占',
  release: '预占释放',
  expire: '额度到期清零',
};

export const GRANT_STATUS_TONE: Record<GrantStatus, 'green' | 'slate' | 'amber'> = {
  active: 'green',
  used: 'slate',
  expired: 'amber',
};

// 分钟数一律取整显示：客户看的是「大概还能打多久」，不关心小数点。
export const num = (value: number, digits = 0) => value.toLocaleString('zh-CN', { maximumFractionDigits: digits });

export const Panel: React.FC<{
  title: string;
  desc: string;
  children: React.ReactNode;
  // 面板右上角的时间范围切换、筛选之类，跟着标题同一行。
  extra?: React.ReactNode;
}> = ({ title, desc, children, extra }) => (
  <section className="rounded-lg border border-slate-200 bg-white">
    <div className="border-b border-slate-200 px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">{desc}</p>
        </div>
        {extra}
      </div>
    </div>
    <div className="px-5 py-4">{children}</div>
  </section>
);

// 页面顶部那一行汇总：四个数并排，不用卡片。
// 四个数各自套一张带圆角、阴影的卡，一块屏就被占掉了，数字本身反而被摊薄；
// 一根发丝线隔开、一行读完，比四张卡省一大半高度，也更容易横向比较。
// 颜色只在真的出问题时用（余额偏低、已经欠费）——余额和可用额度不是两种「类别」，
// 不该用蓝紫绿三种颜色区分它们是「不同的东西」。
export const SummaryBar: React.FC<{
  items: { label: string; value: string; note: string; tone?: 'default' | 'risk' }[];
}> = ({ items }) => (
  // 容器铺一层灰、格子之间留 1px 缝、格子本身是白底：这样缝就是分隔线，
  // 窄屏折行时也不会像左侧边框那样在行首多出一根竖线。
  <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
    {items.map((item) => (
      <div key={item.label} className="bg-white px-4 py-3">
        <p className="text-xs text-slate-500">{item.label}</p>
        <p className={`mt-1 text-lg font-semibold tabular-nums ${item.tone === 'risk' ? 'text-amber-700' : 'text-slate-900'}`}>{item.value}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{item.note}</p>
      </div>
    ))}
  </div>
);

export const TH: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <th scope="col" className={`whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-slate-500 ${className || ''}`}>{children}</th>
);

export const TD: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <td className={`whitespace-nowrap px-3 py-2.5 text-sm text-slate-700 ${className || ''}`}>{children}</td>
);

// 表格下面那段灰色说明。计费中心每张表后面都有一句「这张表怎么读」，
// 形状一样，所以也放这里，保证各页的说明读起来是一个口径。
export const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mt-3 rounded bg-slate-50 p-3 text-xs leading-5 text-slate-600">{children}</p>
);

// 时间范围切换：今日 / 昨日 / 最近 7 天。并发相关的表共用这一个开关。
export type RangeKey = 'today' | 'yesterday' | 'week';

export const RANGE_LABEL: Record<RangeKey, string> = {
  today: '今日',
  yesterday: '昨日',
  week: '最近 7 天',
};

// 页面顶部的时间范围。它和上面那个 RangeKey 不是一回事：这个筛的是钱（消费、充值），
// 那个筛的是并发峰值这类容量指标。合成一个开关就会出现「切到上个月，并发峰值该显示哪个值」
// 这种答不上来的状态，所以分成两个开关，各自的选项也各自定。
export type PeriodKey = 'today' | 'yesterday' | 'week' | 'month' | 'lastMonth' | 'custom';

export const PERIOD_LABEL: Record<PeriodKey, string> = {
  today: '今日',
  yesterday: '昨日',
  week: '本周',
  month: '本月',
  lastMonth: '上月',
  // 「自定义」不在这排按钮里给死日期：点了才展开两个日期框，日期本身由页面传进来。
  custom: '自定义',
};

export const PeriodToggle: React.FC<{
  value: PeriodKey;
  onChange: (value: PeriodKey) => void;
  children?: React.ReactNode;
}> = ({ value, onChange, children }) => (
  <div className="flex flex-wrap items-center gap-3">
    <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1">
      {(Object.keys(PERIOD_LABEL) as PeriodKey[]).map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${value === key ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          {PERIOD_LABEL[key]}
        </button>
      ))}
    </div>
    {children}
  </div>
);

export const RangeToggle: React.FC<{ value: RangeKey; onChange: (value: RangeKey) => void }> = ({ value, onChange }) => (
  <div className="flex shrink-0 rounded-md bg-slate-100 p-0.5">
    {(Object.keys(RANGE_LABEL) as RangeKey[]).map((key) => (
      <button
        key={key}
        type="button"
        onClick={() => onChange(key)}
        aria-pressed={value === key}
        className={`h-7 rounded px-2.5 text-xs font-medium ${value === key ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
      >
        {RANGE_LABEL[key]}
      </button>
    ))}
  </div>
);
