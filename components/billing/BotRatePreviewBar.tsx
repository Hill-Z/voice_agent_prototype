// 机器人编辑页的「当前配置单价」只读条：改任何一个模型或音色，单价立刻重算，不用保存。
// 它和发布弹窗里那张卡片用的是同一份算好结果（由 BotConfigForm 算一次传下来），
// 所以「编辑页看到的价」和「发布时冻结的价」永远是同一个数——两处各算一遍迟早会分叉。
import React, { useState } from 'react';
import { ReceiptText } from 'lucide-react';
import { BotRateResult } from '../../types';
import { centsToYuan, formatPricePerMin, milliToYuan } from './billingEngine';
import { BILLING_PACKAGES, TALK_FEE_TOTAL_CENTS } from './billingData';
import { yuan } from './billingUi';
import BillingBasisPanel, { type RateBasisSubject } from './BillingBasisPanel';

interface Props {
  // 由机器人表单算好后传进来，本组件不自己调计价引擎。
  result: BotRateResult;
  robotName: string;
}

const BotRatePreviewBar: React.FC<Props> = ({ result, robotName }) => {
  const [subject, setSubject] = useState<RateBasisSubject | null>(null);

  // 算不出价时不编一个数出来。这里说的是「这台机器人现在算不出单价」，而不是「单价是 0」。
  if (result.accuracy !== 'priced') {
    return (
      <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <span className="text-xs font-bold text-amber-800">当前配置暂无价格</span>
        <span className="text-xs text-amber-700">这套模型组合还没有配置价格，暂不能显示单价。请联系平台运营。</span>
      </div>
    );
  }

  const { rate } = result;
  // 按这个单价，套餐里的映射额度能打多少分钟。它和「余额与额度」页上的金额出自同一笔钱，
  // 但那页不折算分钟数了——单价是动态的，余额页给的折算值客户会拿去对不上账。
  // 这里保留折算，是因为它就写在这个单价旁边：答案和它依据的价在同一行，不会产生误解。
  const minutes = centsToYuan(TALK_FEE_TOTAL_CENTS) / milliToYuan(rate.priceMilli);
  // 套餐金额和其中的映射额度都从套餐数据取，不写死在文案里：
  // 写死的话，运营改了套餐，这句话里的两个金额不会跟着变，而右边那个分钟数会跟着变，
  // 同一句话里两个数互相矛盾。（守卫测试也会拦：单价条里不允许出现套餐金额的字面数字。）
  const totalYuan = yuan(BILLING_PACKAGES.reduce((sum, item) => sum + item.totalCents, 0));
  const talkFeeYuan = yuan(TALK_FEE_TOTAL_CENTS);

  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3">
      <ReceiptText size={14} className="shrink-0 text-primary" />
      <span className="text-xs text-slate-600">当前配置单价</span>
      <span className="text-sm font-bold text-slate-900">{formatPricePerMin(rate.priceMilli)}</span>
      <span className="text-xs text-slate-500">
        按此单价，{totalYuan} 的套餐里有 {talkFeeYuan} 是可用来打电话的映射额度，约可通话 {Math.floor(minutes).toLocaleString('zh-CN')} 分钟
      </span>
      <button
        type="button"
        onClick={() =>
          setSubject({
            snapshot: rate,
            title: robotName,
            subtitle: '当前编辑中的配置（尚未发布）',
          })
        }
        className="text-xs font-semibold text-primary hover:underline"
      >
        查看计费依据
      </button>
      {/* 条件挂载而不是传 null：面板里「平台内部视图」这个开关是组件内部状态，
          常驻在树上会让下一次打开沿用上一次的选择——客户勾过一次成本明细，
          之后每次点开「查看计费依据」都会直接看到那一块。 */}
      {subject && <BillingBasisPanel subject={subject} onClose={() => setSubject(null)} />}
    </div>
  );
};

export default BotRatePreviewBar;
