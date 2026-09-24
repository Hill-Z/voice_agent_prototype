// 计费中心 · 充值：怎么把钱充进来、怎么让系统在余额低的时候自己充。
//
// 这一块是提醒文案的兑现处。此前的页面上写着「请及时充值」「充值到账后即可继续发起通话」，
// 却没有任何地方能充值——文案承诺了一件产品做不到的事，客户按提示去找、找不到，比不承诺更糟。
// 所以这里的每一个按钮都要真的通向一个动作，做不了的动作（比如对公转账不能自动充）
// 要当场说明为什么，而不是给一个点了没反应的入口。
import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, CreditCard, Wallet, Zap } from 'lucide-react';
import {
  AUTO_RECHARGE_LIMITS,
  AUTO_RECHARGE_SETTINGS,
  BILLING_ACCOUNT_ID,
  BALANCE_COMPOSITION,
  RECHARGE_METHODS,
  RECHARGE_MIN_CENTS,
  RECHARGE_PRESET_CENTS,
  type RechargeMethod,
  type RechargeMethodId,
} from './billingData';
import { Note, Panel, yuan } from './billingUi';

// 自动充值的三个数都是客户填的，填错不能靠后台兜。这里的校验与
// AUTO_RECHARGE_LIMITS 是同一份约束的两个出口：数据层给默认值与上限，
// 这里负责在客户填错的那一刻就说清楚，而不是保存之后才报错。
const validateAuto = (thresholdCents: number, targetCents: number): string | null => {
  if (thresholdCents < AUTO_RECHARGE_LIMITS.minThresholdCents) {
    return `「低于」不能小于 ${yuan(AUTO_RECHARGE_LIMITS.minThresholdCents)}，否则等于每花一笔就充一次。`;
  }
  if (targetCents < AUTO_RECHARGE_LIMITS.minTargetCents) {
    return `「充到」不能小于 ${yuan(AUTO_RECHARGE_LIMITS.minTargetCents)}。`;
  }
  if (targetCents - thresholdCents < AUTO_RECHARGE_LIMITS.minTargetOverThresholdCents) {
    return `「充到」要比「低于」至少高 ${yuan(AUTO_RECHARGE_LIMITS.minTargetOverThresholdCents)}，否则一次充值顶不了多久，会连着触发。`;
  }
  return null;
};

const RechargePanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [amountYuan, setAmountYuan] = useState('');
  const [methodId, setMethodId] = useState<RechargeMethodId>('online');
  // 提交结果只保存「金额 + 方式」这两个数，不保存一份「充值记录」——
  // 真正的记录在资金流水里，页面自己再存一份就会与账上的那份对不上。
  const [submitted, setSubmitted] = useState<{ cents: number; method: RechargeMethod } | null>(null);

  const [auto, setAuto] = useState(AUTO_RECHARGE_SETTINGS);
  const [autoSaved, setAutoSaved] = useState(false);

  // 输入框里可能是空串或非数字，统一兜成 0：页面上宁可显示 ¥0，也不出现 NaN。
  const amountCents = Math.max(0, Math.round(Number(amountYuan) || 0)) * 100;
  const method = RECHARGE_METHODS.find((item) => item.id === methodId) as RechargeMethod;
  const amountTooSmall = amountCents > 0 && amountCents < RECHARGE_MIN_CENTS;
  const canSubmit = amountCents >= RECHARGE_MIN_CENTS;

  const autoError = auto.enabled ? validateAuto(auto.thresholdCents, auto.targetCents) : null;

  return (
    <Panel
      title="充值"
      desc="把钱充进这个账户。充进来的钱没有有效期，不会到期清零——和随套餐给的映射额度不一样。"
      extra={
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <Wallet size={13} aria-hidden />
          当前账面余额 {yuan(BALANCE_COMPOSITION.balanceCents)}
        </span>
      }
    >
      {/* 第一行是动作条：充值入口与自动充值开关并排，不展开时不占纵向空间。 */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => { setOpen((value) => !value); setSubmitted(null); }}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          <CreditCard size={15} aria-hidden />
          {open ? '收起' : '立即充值'}
        </button>
        <button
          type="button"
          onClick={() => { setAuto({ ...auto, enabled: !auto.enabled }); setAutoSaved(false); }}
          className={`inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium ${
            auto.enabled
              ? 'border-primary bg-white text-primary'
              : 'border-slate-200 bg-white text-slate-700'
          }`}
        >
          <Zap size={15} aria-hidden />
          自动充值：{auto.enabled ? '已开启' : '未开启'}
        </button>
      </div>

      {open && (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-800">充值金额</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {RECHARGE_PRESET_CENTS.map((cents) => (
              <button
                key={cents}
                type="button"
                onClick={() => { setAmountYuan(String(cents / 100)); setSubmitted(null); }}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  amountCents === cents ? 'border-primary bg-white font-medium text-primary' : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                {yuan(cents)}
              </button>
            ))}
            <label className="flex items-center gap-2 text-sm text-slate-600">
              自定义
              <input
                type="number"
                min={0}
                className="h-9 w-36 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700"
                value={amountYuan}
                onChange={(event) => { setAmountYuan(event.target.value); setSubmitted(null); }}
                placeholder="元"
              />
            </label>
          </div>
          {amountTooSmall && (
            <p className="mt-2 text-xs text-amber-600">
              单笔充值不低于 {yuan(RECHARGE_MIN_CENTS)}，当前填的是 {yuan(amountCents)}。
              金额更小的充值手续费比金额还高，建议累积到下限以上再充，或联系客户经理代充。
            </p>
          )}

          <p className="mt-4 text-sm font-medium text-slate-800">充值方式</p>
          <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-3">
            {RECHARGE_METHODS.map((item) => (
              <label
                key={item.id}
                className={`flex cursor-pointer items-start gap-2 rounded-md border bg-white px-3 py-2.5 ${
                  methodId === item.id ? 'border-primary' : 'border-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="recharge-method"
                  className="mt-1"
                  checked={methodId === item.id}
                  onChange={() => { setMethodId(item.id); setSubmitted(null); }}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-800">{item.label}</span>
                  <span className="block text-xs text-slate-500">{item.desc}</span>
                  <span className={`mt-0.5 block text-xs ${item.autoRecharge ? 'text-emerald-600' : 'text-slate-400'}`}>
                    到账：{item.settle}
                    {item.autoRecharge ? '；可用于自动充值' : '；不能用于自动充值（没有代扣授权，系统无法自己发起汇款）'}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => setSubmitted({ cents: amountCents, method })}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              确认充值
            </button>
            {!canSubmit && (
              <span className="text-xs text-slate-500">填一个不低于 {yuan(RECHARGE_MIN_CENTS)} 的金额，并选好充值方式。</span>
            )}
          </div>

          {submitted && (
            <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-6 text-emerald-800">
              <p className="inline-flex items-center gap-1 font-medium">
                <CheckCircle2 size={14} aria-hidden />
                已提交：通过{submitted.method.label}充值 {yuan(submitted.cents)}
              </p>
              {submitted.method.id === 'transfer' ? (
                <p>
                  请汇款至平台对公账户，<b>汇款备注里填账户号 {BILLING_ACCOUNT_ID}</b>——
                  不填备注我们无法确认这笔钱属于哪个账户，只能原路退回。
                  到账需要 {submitted.method.settle}；在到账之前，账户余额与可用额度都不会变化，
                  这段通话仍然按现有余额扣。
                </p>
              ) : (
                <p>实时到账，通常 1 分钟内余额就会更新。</p>
              )}
              <p>
                到账后会作为<b>一个新批次</b>出现在「额度批次明细」里，有效期为「无限期」；
                「资金流水」里同时会多一条充值记录，可以逐笔核对。
              </p>
              <p className="text-emerald-700">
                这笔钱属于「单独充值」，<b>没有有效期、不会到期清零</b>。
              </p>
            </div>
          )}
        </div>
      )}

      {auto.enabled && (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-800">自动充值</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            余额低到一定程度时，系统按你设的金额自动充值，避免通话因为余额耗尽而发不出去。
            <b className="text-slate-700">这一笔是系统替你花出去的钱</b>，所以下面三个数都要你确认过才生效。
          </p>

          <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-12">
            <label className="flex flex-col gap-1 lg:col-span-3">
              <span className="text-xs text-slate-500">余额低于（元）就自动充</span>
              <input
                type="number"
                min={0}
                className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700"
                value={auto.thresholdCents / 100}
                onChange={(event) => {
                  setAuto({ ...auto, thresholdCents: Math.max(0, Math.round(Number(event.target.value) || 0)) * 100 });
                  setAutoSaved(false);
                }}
              />
            </label>
            <label className="flex flex-col gap-1 lg:col-span-3">
              <span className="text-xs text-slate-500">充到（元）</span>
              <input
                type="number"
                min={0}
                className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700"
                value={auto.targetCents / 100}
                onChange={(event) => {
                  setAuto({ ...auto, targetCents: Math.max(0, Math.round(Number(event.target.value) || 0)) * 100 });
                  setAutoSaved(false);
                }}
              />
            </label>
            <label className="flex flex-col gap-1 lg:col-span-3">
              <span className="text-xs text-slate-500">每月最多自动充（元）</span>
              <input
                type="number"
                min={0}
                className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700"
                value={auto.monthlyCapCents / 100}
                onChange={(event) => {
                  setAuto({ ...auto, monthlyCapCents: Math.max(0, Math.round(Number(event.target.value) || 0)) * 100 });
                  setAutoSaved(false);
                }}
              />
            </label>
            <div className="flex flex-col gap-1 lg:col-span-3">
              <span className="text-xs text-slate-500">扣款方式</span>
              <div className="flex h-9 items-center rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700">
                在线支付（唯一支持代扣的方式）
              </div>
            </div>
          </div>

          <ul className="mt-3 space-y-1.5 rounded bg-white p-3 text-xs leading-6 text-slate-600">
            <li>
              · 余额低于 {yuan(auto.thresholdCents)} 时补齐到 {yuan(auto.targetCents)}，
              即<b className="text-slate-800">扣款额 = 目标值 − 触发时的余额</b>，不是固定金额。
            </li>
            <li>· 地板余额 {yuan(auto.floorCents)}：低到这个数立刻充，不等阈值。</li>
            <li>
              · 每月最多自动充 {yuan(auto.monthlyCapCents)}，本月已充 {yuan(auto.monthlyUsedCents)}（{auto.monthlyTimes} 次）。
              封顶后<b className="text-slate-800">停止自动充值，退回「只提醒、不充钱」</b>——它保证前两个数配错时损失有上限。
            </li>
            <li>· 每 24 小时最多充 {auto.maxPerDay} 次，不可解除。</li>
          </ul>

          {autoError && (
            <p className="mt-3 inline-flex items-center gap-1 text-xs text-amber-600">
              <AlertTriangle size={13} aria-hidden />
              {autoError}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={autoError !== null}
              onClick={() => setAutoSaved(true)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              保存自动充值设置
            </button>
            {autoSaved && !autoError && (
              <span className="text-xs text-emerald-600">
                已保存：余额低于 {yuan(auto.thresholdCents)} 时自动充到 {yuan(auto.targetCents)}，
                每月最多 {yuan(auto.monthlyCapCents)}。每一次自动充值都会记一条流水，可在「资金流水」页回查。
              </span>
            )}
          </div>
        </div>
      )}

      <Note>
        充值进来的是「单独充值的钱」，<b>没有有效期</b>；套餐给的映射额度有 1 年有效期，到期清零。
        自动充值和余额预警是两件事：前者会真的扣款，后者只发通知。两个开关可以同时开着。
      </Note>
    </Panel>
  );
};

export default RechargePanel;
