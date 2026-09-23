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
  const [done, setDone] = useState<'renew' | 'add' | null>(null);

  // 路数只接受正整数：填 0 或负数会让报价变成一个没有意义的数。
  const ways = Math.max(1, Math.floor(Number(waysYuan) || 1));
  const renewal = renewalQuote();
  const addition = concurrencyQuote(ways);
  const current = BILLING_PACKAGES[0];
  const invoiceable = invoiceableCents();

  return (
    <Panel
      title="套餐续费与加购"
      desc="套餐到期前可以续费，并发不够可以加购。两者的额度到期日算法不一样，下面分开写。"
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Cell
          icon={RotateCcw}
          title="续费当前套餐"
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
          <p>
            当前套餐 {current.name}，{current.concurrency} 路，到期日 {current.expiresAt}。
          </p>
          <p>
            续费一年：套餐金额 <b className="text-slate-800">{yuan(renewal.packageCents)}</b>，
            其中映射额度 <b className="text-slate-800">{yuan(renewal.grantCents)}</b> 进余额，
            另 {yuan(renewal.serviceFeeCents)} 是平台与并发服务费（不进余额、不能打电话）。
          </p>
          <p>
            到期日从 {current.expiresAt} 顺延至 <b className="text-slate-800">{renewal.expiresAt}</b>，
            不是从今天起算——从今天起算会让你白白丢掉已付的剩余月份。
          </p>
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
          <p>
            单路 {yuan(PACKAGE_PRICE_PER_CONCURRENCY_CENTS)}／年，其中
            {yuan(GRANT_CENTS_PER_CONCURRENCY)} 是进余额的映射额度。
            {ways} 路合计 <b className="text-slate-800">{yuan(addition.packageCents)}</b>，
            余额增加 <b className="text-slate-800">{yuan(addition.grantCents)}</b>。
          </p>
          <p>
            加购的额度<b className="text-slate-800">自到账之日起算一年</b>，到期日{' '}
            {addition.expiresAt}，与主套餐（{current.expiresAt}）各自到期、不合并。
            加购后总并发 {PURCHASED_CONCURRENCY} → {PURCHASED_CONCURRENCY + ways} 路。
          </p>
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
          <p>
            抬头 {INVOICE_PROFILE.title}（{INVOICE_PROFILE.titleType === 'company' ? '企业' : '个人'}），
            税号 {INVOICE_PROFILE.taxNo}。
          </p>
          <p>
            已支付 <b className="text-slate-800">{yuan(INVOICE_PROFILE.paidCents)}</b>，
            已开票 <b className="text-slate-800">{yuan(INVOICE_PROFILE.invoicedCents)}</b>，
            可开票 {yuan(invoiceable)}。
          </p>
          <p className="text-slate-500">
            {invoiceable === 0
              ? '当前合同金额已经全额开票，没有未开票的金额，所以这个按钮是灰的——不是坏了。'
              : '可开票金额 = 已支付 − 已开票，是算出来的，不是一个凭感觉填的数。'}
          </p>
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
          <p>
            需要你确认付款后才会生效。付款到账之前，套餐、并发路数和余额都不会变化；
            生效之后映射额度会作为一个<b>新批次</b>出现在「额度批次明细」里，金额与到期日在那一行可查。
          </p>
        </div>
      )}

      <Note>
        两款额度的到期日<b>各算各的</b>：续费顺延主套餐的到期日，加购自成一年。
        发票按实付金额开，映射额度与服务费开在同一张票上。
      </Note>
    </Panel>
  );
};

export default PackageActionsPanel;
