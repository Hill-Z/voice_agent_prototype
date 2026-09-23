// 计费依据面板：回答「为什么是这个价」。
// 默认只给客户看得到的东西——用了哪些模型、属于哪个档位、最终费率；
// 成本明细、加价倍率和取整过程放在「内部视角」里，客户视角看不到加价率。
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { BotRateSnapshot, BillingCategory, CallBillingRecord } from '../../types';
import { StatusBadge, cx, formatDuration } from '../report/reportUi';
import { BILLING_STATUS_META } from './billingUi';
import {
  TIER_LABEL,
  buildPriceBreakdown,
  centsToYuan,
  findCostModel,
  formatPricePerMin,
  languageLabel,
  microToYuan,
} from './billingEngine';

export interface RateBasisSubject {
  snapshot: BotRateSnapshot;
  title: string;
  subtitle: string;
  pending?: { reasons: string[] };
  call?: CallBillingRecord;
}

// 成本参数是不是演示估值。快照里存的是价格，没存「这个价是不是估的」，
// 所以回到成本表按模型查一次——它只影响内部视角里的一句标注，不影响任何金额。
const isEstimatedCost = (category: BillingCategory, value?: string, fallback?: string): boolean =>
  findCostModel(category, value || fallback)?.estimated === true;

const Row: React.FC<{ label: string; value: React.ReactNode; hint?: string }> = ({ label, value, hint }) => (
  <div className="flex items-start justify-between gap-4 py-2">
    <span className="shrink-0 text-xs text-slate-500">{label}</span>
    <span className="text-right text-sm text-slate-800">
      {value}
      {hint && <span className="mt-0.5 block text-xs text-slate-400">{hint}</span>}
    </span>
  </div>
);

const BillingBasisPanel: React.FC<{ subject: RateBasisSubject | null; onClose: () => void }> = ({ subject, onClose }) => {
  const [internal, setInternal] = useState(false);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  // Esc 关闭。挂在 document 上而不是面板上，是因为焦点可能还在明细表的行里。
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // 打开时把焦点移进面板、关闭时还给原来那个元素。
  // 面板写着 aria-modal="true"，等于向读屏声明「后面那层不可达」——
  // 焦点如果还留在背景里，第一次 Tab 就会走到被遮住的页面上，声明和实际对不上；
  // 关掉之后焦点若掉回 body，键盘用户得从头 Tab 一遍才能回到刚才那一行。
  useEffect(() => {
    if (!subject) return undefined;
    const previous = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    return () => previous?.focus?.();
  }, [subject]);

  if (!subject) return null;
  const { snapshot, call, pending } = subject;
  // 「这一通到底扣没扣钱」。时长、费率、算式三行都只对真的扣了钱的通话才有意义。
  const billed = call?.billingStatus === 'billed';
  // 待定价的判定放在面板自己这里，不靠调用方传 pending：
  // 只要这通记录的状态是待定价，就必须走「算不出费率」那一支。
  // 漏传一次，下面的正常分支就会拿占位快照渲染出「0.00 元/分钟 · 标准档 · 汇率 1 美元 = 0 元」——
  // 守在每个调用点上，新增一个入口就会重新踩一遍。
  const pendingView = call?.billingStatus === 'pending'
    ? {
        reasons: pending?.reasons?.length
          ? pending.reasons
          : call.billingMissing?.length
            ? call.billingMissing
            : ['这通电话打的时候，这台机器人使用的模型还没有配置价格'],
      }
    : pending;
  const asrEstimated = isEstimatedCost('ASR', snapshot.asr.boundModelValue, snapshot.asr.modelId);
  const ttsEstimated = isEstimatedCost('TTS', snapshot.tts.boundModelValue, snapshot.tts.modelId);
  const llmEstimated = isEstimatedCost('LLM', snapshot.llm.boundModelValue, snapshot.llm.modelId);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/30"
      role="dialog"
      aria-modal="true"
      aria-label="计费依据"
      // 点遮罩关闭，但点面板内部不关：面板里的文字是要给人选中复制的。
      onClick={onClose}
    >
      <div className="h-full w-[520px] max-w-[96vw] overflow-y-auto bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900">计费依据</h3>
            <p className="mt-1 truncate text-xs text-slate-500">{subject.title} · {subject.subtitle}</p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} className="rounded p-2 hover:bg-slate-100" aria-label="关闭计费依据">
            <X size={18} />
          </button>
        </div>

        {pendingView ? (
          <div className="p-5">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">这通电话算不出费率</p>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-700">
                {pendingView.reasons.map((reason) => <li key={reason}>· {reason}</li>)}
              </ul>
              <p className="mt-2 text-xs leading-5 text-amber-700">
                缺什么是这通电话打的时候记下来的，之后机器人补齐了配置也不会改这里——
                这通电话当时确实算不出价。在补齐之前本通暂不扣费，也不会算进任何消费合计；
                价格补齐后会自动补扣。
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* 客户视角：只讲「用了什么、所以什么价」，不出现成本与加价率。 */}
            <div className="border-b border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">适用费率</span>
                <StatusBadge tone="blue">{TIER_LABEL[snapshot.tier]}</StatusBadge>
              </div>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatPricePerMin(snapshot.priceMilli)}</p>
              {/* 带上具体数字，和发布预览里那句「已按平台最低价 0.15 元/分钟计费」对齐——
                  同一件事两处一个给数一个不给数，客户会以为两个最低价不是一回事。 */}
              {snapshot.floorApplied && <p className="mt-1 text-xs text-slate-500">{`已按平台最低价 ${formatPricePerMin(snapshot.priceFloorMilli)} 计费`}</p>}
            </div>

            <div className="border-b border-slate-200 p-5">
              <h4 className="mb-2 text-sm font-semibold text-slate-900">这台机器人用了什么</h4>
              <div className="divide-y divide-slate-100">
                <Row label="语音识别" value={snapshot.asr.displayName} />
                <Row label="大模型" value={snapshot.llm.displayName} />
                <Row label="音色" value={`${snapshot.tts.displayName} · ${snapshot.tts.voiceName}`} />
                <Row label="合成语言" value={languageLabel(snapshot.tts.language)} />
              </div>
              <p className="mt-3 rounded bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                每分钟的单价由这三项共同决定：模型越强，单价越高。更换任意一项都会重新算价，
                但已经打完的电话仍按当时的单价计费，不受影响。
              </p>
            </div>

            {call && (
              <div className="border-b border-slate-200 p-5">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">这通电话</h4>
                  <StatusBadge tone={BILLING_STATUS_META[call.billingStatus].tone}>{BILLING_STATUS_META[call.billingStatus].label}</StatusBadge>
                </div>
                <div className="divide-y divide-slate-100">
                  <Row label="Call ID" value={<span className="font-mono text-xs">{call.callId}</span>} />
                  {/* 没计费的通话不写「0 秒」和「0.15 元/分钟」：列表里这一行显示的是「—」，
                      点进来却有零有价，客户会以为「本来要收我 0.15，只是这次 0 秒」。
                      费率对没计费的通话根本不存在，一律留白。 */}
                  <Row label="通话时长" value={billed ? formatDuration(call.billableSec) : '—'} hint={billed ? undefined : '这通没有计费，没有可计的时长'} />
                  <Row label="适用费率" value={billed ? formatPricePerMin(call.snapshot.priceMilli) : '—'} />
                  {/* 没计费的通话不写「¥0.00」——那读起来像「这通免费」，
                      实际是「未接通」或者「暂不扣费、定价后补扣」。 */}
                  <Row
                    label="本通费用"
                    value={billed
                      ? <span className="font-semibold">{`¥${centsToYuan(call.amountCents).toFixed(2)}`}</span>
                      : <span className="text-slate-400">未扣费</span>}
                  />
                  {/* 算式只在真的扣了钱的时候才有意义：没计费的通话没有算式可言。 */}
                  {billed && <Row label="算式" value={<span className="text-xs text-slate-600">{call.formula}</span>} />}
                  <Row label="计费说明" value={call.billingReasonText} />
                  <Row label="通话时刻" value={call.computedAt} />
                </div>
              </div>
            )}

            {/* 内部视图：平台自己核对公式用，默认关闭。
                客户版上线时这个开关要摘掉——客户看到的应该只有上面那两段。
                开关本身也是客户能看到的，所以标签里不能出现「加价」「成本」这些词：
                那等于当着客户的面告诉他「我们还有一套不给你看的定价机制」。 */}
            <div className="p-5">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={internal} onChange={(event) => setInternal(event.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                平台内部视图
              </label>
              {internal ? (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-700">成本构成（每分钟）</p>
                    {(asrEstimated || ttsEstimated || llmEstimated) && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800" title="带「演示估值」的成本参数是原型里的占位价格，上线前要换成真实采购价">
                        含演示估值
                      </span>
                    )}
                  </div>
                  <div className="mt-2 divide-y divide-slate-200">
                    <Row label={`语音识别 · ${snapshot.asr.displayName}`} value={`${microToYuan(snapshot.asr.costPerMinMicro).toFixed(4)} 元${asrEstimated ? '（演示估值）' : ''}`} hint={`${snapshot.asr.unitPricePerHour} 元/小时 × ${snapshot.asr.speechSecPerMin} 秒有效语音 ÷ 3600`} />
                    <Row label={`音色 · ${snapshot.tts.displayName}`} value={`${microToYuan(snapshot.tts.costPerMinMicro).toFixed(4)} 元${ttsEstimated ? '（演示估值）' : ''}`} hint={`${snapshot.tts.unitPricePer10kChars} 元/万字符 × ${snapshot.tts.charsPerMin} 字/分钟 ÷ 10000`} />
                    <Row
                      label={`大模型 · ${snapshot.llm.displayName}`}
                      value={`${microToYuan(snapshot.llm.costPerMinMicro).toFixed(4)} 元${llmEstimated ? '（演示估值）' : ''}`}
                      hint={`${snapshot.llm.inputPricePerMillion} 元/百万 token × ${snapshot.llm.inputTokensPerMin} token/分钟${snapshot.llm.outputPriceMissing ? '（输出 token 单价暂缺，未计）' : ''}`}
                    />
                    <Row label="成本合计" value={<span className="font-semibold">{`${microToYuan(snapshot.costPerMinMicro).toFixed(4)} 元`}</span>} />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-slate-700">报价过程</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{buildPriceBreakdown(snapshot)}</p>
                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <Row label="定价规则版本" value={snapshot.pricingRuleVersion} />
                    <Row label="成本表版本" value={snapshot.costTableVersion} />
                    {/* 指纹和编号分开说：指纹只由配置决定，同一份配置打一万通电话都是同一个值，
                        可以用来判断「这两通的价是不是同一套配置算出来的」；编号每通都不一样。 */}
                    <Row
                      label="配置指纹"
                      value={<span className="font-mono text-xs">{snapshot.hash}</span>}
                      hint="只由模型配置和规则版本决定，配置不变则每一通都相同"
                    />
                    <Row
                      label="本次快照编号"
                      value={<span className="font-mono text-xs">{snapshot.snapshotId}</span>}
                      hint="同一份配置下，每一通电话各有各的编号"
                    />
                    <Row label="快照生成时刻" value={snapshot.computedAt} />
                    <Row label="汇率（美元折算）" value={`1 美元 = ${snapshot.fxUsdCny} 元`} />
                    {/* 账户流水号放在内部视图里：客户拿到 led_00107 这样的编号没有用，
                        问客服也解释不了，反倒让人怀疑这一页是内部后台改的。 */}
                    {call?.ledgerEntryId && <Row label="账户流水号" value={<span className="font-mono text-xs">{call.ledgerEntryId}</span>} />}
                  </div>
                  <p className={cx('mt-3 text-xs leading-5 text-slate-500')}>
                    快照一经生成不可修改：机器人改配置、供应商调价都不影响历史通话的单价与金额，
                    计费口径有误只能新增冲正记录，不能改原记录。
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  这一步是平台核对公式用的，默认不展开。展开后可以看到每分钟的成本是怎么算出来的，
                  以及这份价格是按哪一版规则算的。
                </p>
              )}
            </div>

            {/* 固定在面板底部的口径声明：客户拉到哪一段都能看到「价是什么时候定的」。 */}
            <div className="sticky bottom-0 border-t border-slate-200 bg-slate-50 px-5 py-3">
              <p className="text-xs leading-5 text-slate-600">
                这个价是<b className="text-slate-800">发布这台机器人时</b>按当时的模型配置和当时的计费口径算出来并记下的。
                之后改配置、调价，都不影响已经打完的电话——它们各自保留当时的单价与金额。
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BillingBasisPanel;
