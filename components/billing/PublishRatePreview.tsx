// 发布页的实时价格预览：发布前先把这个机器人每分钟多少钱、为什么是这个价告诉客户。
// 价格由外面算好传进来（BotConfigForm 里只算一次），预览价与发布时冻结的快照保证是同一个结果。
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { BotConfiguration, BotRateResult } from '../../types';
import { TIER_LABEL, centsToYuan, computeAmountCents, formatPricePerMin, languageLabel, milliToYuan } from './billingEngine';
import { StatusBadge } from '../report/reportUi';

interface Props {
  config: BotConfiguration;
  // 本次要发布的版本号，展示在预览里，让客户确认是按这个版本算的价。
  nextVersion: string;
  // 以「当前编辑中的配置 + 即将发布的版本号」算出的费率，由调用方算一次后传进来。
  result: BotRateResult;
}

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-4 py-1">
    <span className="shrink-0 text-xs text-slate-500">{label}</span>
    <span className="truncate text-right text-xs text-slate-700">{value}</span>
  </div>
);

const PublishRatePreview: React.FC<Props> = ({ config, nextVersion, result }) => {
  // 线上现在生效的价来自「上一次发布时冻结的快照」。改配置不会动它，
  // 所以把两份价摆在一起，客户才知道这次发布会把价格从哪里改到哪里。
  const published = config.billingRateSnapshot;

  // 算不出费率时不显示价格——宁可让客户看到「还算不出来」，也不能给一个假的数字。
  if (result.accuracy === 'pending') {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-800">
          <AlertTriangle size={14} />
          暂时算不出这个机器人的单价
        </p>
        <ul className="mt-1.5 space-y-0.5 text-xs leading-5 text-amber-700">
          {result.reasons.map((reason) => <li key={reason}>· {reason}</li>)}
        </ul>
        <p className="mt-1.5 text-xs leading-5 text-amber-700">
          现在发布也可以，但这台机器人上的通话暂不扣费，等把上面几项补齐后重新发布才开始计费，
          期间产生的通话会按补齐后的价格补扣。
        </p>
        {published && (
          <p className="mt-1.5 border-t border-amber-200 pt-1.5 text-xs leading-5 text-amber-700">
            线上现在生效的仍是 {published.publishVersion} 发布的 {formatPricePerMin(published.priceMilli)}，
            这次发布不会改变它。
          </p>
        )}
      </div>
    );
  }

  const { rate } = result;
  const changed = published ? published.priceMilli !== rate.priceMilli : false;
  const deltaMilli = published ? rate.priceMilli - published.priceMilli : 0;

  // 变价要能说清「是哪一项改的」。逐个比对这次预览的配置与线上快照里的配置，
  // 把不一样的那几项列出来——客户换了个更贵的模型却只看到价格变了，会以为是平台涨价。
  const attribution: string[] = [];
  if (published && changed) {
    if (published.asr.displayName !== rate.asr.displayName) attribution.push(`语音识别由「${published.asr.displayName}」换成「${rate.asr.displayName}」`);
    if (published.llm.displayName !== rate.llm.displayName) attribution.push(`大模型由「${published.llm.displayName}」换成「${rate.llm.displayName}」`);
    if (published.tts.displayName !== rate.tts.displayName) attribution.push(`音色由「${published.tts.displayName}」换成「${rate.tts.displayName}」`);
    if (published.tts.language !== rate.tts.language) attribution.push(`合成语言由「${languageLabel(published.tts.language)}」换成「${languageLabel(rate.tts.language)}」`);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">发布后每分钟费用</p>
          <p className="mt-0.5 text-2xl font-bold text-slate-900">{formatPricePerMin(rate.priceMilli)}</p>
        </div>
        <StatusBadge tone="blue">{TIER_LABEL[rate.tier]}</StatusBadge>
      </div>

      {rate.floorApplied && (
        <p className="mt-1 text-xs text-slate-500">
          已按平台最低价 {milliToYuan(rate.priceFloorMilli).toFixed(2)} 元/分钟计费。
        </p>
      )}

      {published && changed && (
        <div className="mt-2 rounded border border-slate-200 bg-white p-2">
          <p className="text-xs leading-5 text-slate-700">
            较线上（{published.publishVersion}）的 {formatPricePerMin(published.priceMilli)}
            <b className={deltaMilli > 0 ? 'text-amber-700' : 'text-emerald-700'}>
              {' '}{deltaMilli > 0 ? '涨' : '降'} {Math.abs(milliToYuan(deltaMilli)).toFixed(2)} 元/分钟
            </b>
          </p>
          {/* 客户改了配置却没看到任何一项变化时，不能说「成本参数调整或取整规则变化」——
              那是平台内部的定价机制，说出来等于告诉客户「我们这边还有一套你不参与的计算」。
              客户只需要知道「这不是你改的」，以及该找谁问。 */}
          <p className="mt-0.5 text-xs leading-5 text-slate-500">
            {attribution.length > 0
              ? `本次改动：${attribution.join('；')}。`
              : '上面这几项这次都没有改，价格变化是平台侧调价引起的，有疑问可以联系平台运营。'}
          </p>
        </div>
      )}

      <div className="mt-2 border-t border-slate-200 pt-2">
        <Row label="语音识别" value={rate.asr.displayName} />
        <Row label="大模型" value={rate.llm.displayName} />
        <Row label="音色" value={`${rate.tts.displayName} · ${rate.tts.voiceName}`} />
      </div>

      <p className="mt-2 border-t border-slate-200 pt-2 text-xs leading-5 text-slate-500">
        {published
          ? <>线上现在生效的是 <b className="text-slate-700">{published.publishVersion}</b> 发布的{' '}
              <b className="text-slate-700">{formatPricePerMin(published.priceMilli)}</b>
              {!changed
                ? '，与本次要发布的价格一致，价格不会变。'
                : published.publishVersion === nextVersion
                  ? '，本次是重新发布同一个版本，发布后新产生的通话按上面的新价计，已经打完的电话仍按原价。'
                  : '，本次发布后新产生的通话改按上面的新价计，已经打完的电话仍按原价。'}</>
          : '这台机器人还没有一份生效中的发布价格，本次发布后开始计费。'}
      </p>

      <p className="mt-2 border-t border-slate-200 pt-2 text-xs leading-5 text-slate-500">
        按通话时长计费，按秒向上取整到分。举例：这通电话打了 1 分 1 秒，费用约{' '}
        <b className="text-slate-700">{centsToYuan(computeAmountCents(61, rate.priceMilli)).toFixed(2)} 元</b>。
        发布后新产生的通话按这个价算，已经打完的电话不受影响；之后再改配置要重新发布才会变价。
      </p>
    </div>
  );
};

export default PublishRatePreview;
