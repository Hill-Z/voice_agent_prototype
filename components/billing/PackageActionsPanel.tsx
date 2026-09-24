// 计费中心 · 套餐续费与加购：套餐到期怎么续、并发不够怎么加、发票怎么开。
//
// 这三件事都是「钱花出去之后」才需要做的动作，原来的页面上一个都没有——
// 客户看到「套餐有效期至 2027-03-01」，想问「到期了怎么办」，页面上答不上来。
// 报价一律现算（从套餐单价与映射额度推），不在页面里写死数字：
// 单价一调，写死的那几个数就会与套餐表对不上，客户按哪个数准备钱都可能是错的。
import React, { useState } from 'react';
import { CheckCircle2, FileText, Layers, RotateCcw } from 'lucide-react';
import {
  BILLING_PACKAGES,
  GRANT_CENTS_PER_CONCURRENCY,
  INVOICE_PROFILE,
  PACKAGE_PRICE_PER_CONCURRENCY_CENTS,
  PURCHASED_CONCURRENCY,
  concurrencyQuote,
  invoiceableCents,
  renewalQuote,
} from './billingData';
import { Note, Panel, yuan } from './billingUi';

// 一格的骨架：标题 + 一个关键数 + 一句它是什么 + 动作。三格用同一个形状，
// 客户扫一眼就能比「续费要花多少、加购要花多少、发票还差多少」。
const Cell: React.FC<{ icon: React.ElementType; title: string; children: React.ReactNode; action: React.ReactNode }> = ({
  icon: Icon,
  title,
  children,
  action,
}) => (
  <div className="flex flex-col rounded-md border border-slate-200 bg-white px-4 py-3">
    <p className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800">
      <Icon size={15} aria-hidden />
      {title}
    </p>
    <div className="mt-2 flex-1 space-y-1.5 text-xs leading-5 text-slate-600">{children}</div>
    <div className="mt-3">{action}</div>
  </div>
);

const PackageActionsPanel: React.FC = () => {
  const [waysYuan, setWaysYuan] = useState('1');
  const [renewalPackageId, setRenewalPackageId] = useState(BILLING_PACKAGES[0].id);
  const [done, setDone] = useState<'renew' | 'add' | null>(null);

  // 路数只接受正整数：填 0 或负数会让报价变成一个没有意义的数。
  const ways = Math.max(1, Math.floor(Number(waysYuan) || 1));
  const renewal = renewalQuote(renewalPackageId);
  const addition = concurrencyQuote(ways);
  const current = BILLING_PACKAGES.find((item) => item.id === renewalPackageId) ?? BILLING_PACKAGES[0];
  const invoiceable = invoiceableCents();

  return (
    <Panel title="套餐操作" desc="续费和加购分别计价；加购并发会形成独立的有效期。">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Cell
          icon={RotateCcw}
          title="按购买批次续费"
          action={
            <button
              type="button"
              onClick={() => setDone('renew')}
              className="rounded-md border border-primary bg-white px-3 py-1.5 text-xs font-medium text-primary"
            >
              续费一年
            </button>
          }
        >
          <select
            aria-label="选择续费批次"
            value={renewalPackageId}
            onChange={(event) => { setRenewalPackageId(event.target.value); setDone(null); }}
            className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"
          >
            {BILLING_PACKAGES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <p>当前 {current.concurrency} 路，到期 {current.expiresAt}</p>
          <p className="text-base font-semibold text-slate-900">{yuan(renewal.packageCents)} <span className="text-xs font-normal text-slate-500">/ 年</span></p>
          <p>续费后到期 {renewal.expiresAt}</p>
        </Cell>

        <Cell
          icon={Layers}
          title="加购并发"
          action={
            <button
              type="button"
              onClick={() => setDone('add')}
              className="rounded-md border border-primary bg-white px-3 py-1.5 text-xs font-medium text-primary"
            >
              提交加购
            </button>
          }
        >
          <label className="flex items-center gap-2">
            增加
            <input
              type="number"
              min={1}
              className="h-8 w-16 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
              value={waysYuan}
              onChange={(event) => { setWaysYuan(event.target.value); setDone(null); }}
            />
            路并发
          </label>
          <p className="text-base font-semibold text-slate-900">{yuan(addition.packageCents)} <span className="text-xs font-normal text-slate-500">/ 年</span></p>
          <p>付款后新增独立批次，到期 {addition.expiresAt}</p>
        </Cell>

        <Cell
          icon={FileText}
          title="发票"
          action={
            <button
              type="button"
              disabled={invoiceable === 0}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {invoiceable === 0 ? '没有可开票金额' : `申请开票 ${yuan(invoiceable)}`}
            </button>
          }
        >
          <p>开票抬头：{INVOICE_PROFILE.title}</p>
          <p className="text-base font-semibold text-slate-900">{yuan(invoiceable)} <span className="text-xs font-normal text-slate-500">可开票</span></p>
          <p>已支付 {yuan(INVOICE_PROFILE.paidCents)} · 已开票 {yuan(INVOICE_PROFILE.invoicedCents)}</p>
        </Cell>
      </div>

      {done && (
        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-6 text-emerald-800">
          <p className="inline-flex items-center gap-1 font-medium">
            <CheckCircle2 size={14} aria-hidden />
            {done === 'renew'
              ? `续费申请已提交：${yuan(renewal.packageCents)} 一年，到期日顺延至 ${renewal.expiresAt}。`
              : `加购申请已提交：新增 ${ways} 路，${yuan(addition.packageCents)}，余额将增加 ${yuan(addition.grantCents)}。`}
          </p>
          <p>付款到账后生效；加购并发和通话额度分别生成新的购买批次。</p>
        </div>
      )}

      <Note>
        单路价格 {yuan(PACKAGE_PRICE_PER_CONCURRENCY_CENTS)} / 年，其中 {yuan(GRANT_CENTS_PER_CONCURRENCY)} 计入通话额度。
        续费顺延当前套餐的到期日；加购批次从付款到账起计算有效期。当前有效并发 {PURCHASED_CONCURRENCY} 路。
      </Note>
    </Panel>
  );
};

export default PackageActionsPanel;
