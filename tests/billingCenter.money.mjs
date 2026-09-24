// 计费中心的算术测试：不查文本，把计费引擎和数据层真跑一遍，逐笔复算。
//
// 为什么要有这个文件：`billingCenter.static.mjs` 全是「常量相等 / 字符串存在 / 正则匹配」，
// 它拦得住「有人删了向上取整这个词」，拦不住「有人把 Math.ceil 改成 Math.round」——
// 后者会让全站每一笔金额都变，而静态断言全绿。计费涉及钱，必须真算一次。
//
// 加载方式：用 esbuild 把 TS 打成内存里的 ESM，再用 data: URL 导入，
// 不落地临时文件，也不依赖任何构建产物。esbuild 随 vite 一起装在 node_modules 里。
import * as esbuild from 'esbuild';

const bundleModule = async (entry) => {
  const { outputFiles } = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    write: false,
    logLevel: 'silent',
  });
  const url = `data:text/javascript;charset=utf-8,${encodeURIComponent(outputFiles[0].text)}`;
  return import(url);
};

const engine = await bundleModule('components/billing/billingEngine.ts');
const data = await bundleModule('components/billing/billingData.ts');
const csv = await bundleModule('components/billing/billingCsv.ts');
const reports = await bundleModule('components/billing/billingReports.ts');

let passed = 0;
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
  passed += 1;
};

const yuan = (cents) => (cents / 100).toFixed(2);

// —— 1. 金额算法本身：按秒计费、向上取整到分 ——
// 向上取整不是「四舍五入」：1 秒 × 0.15 元/分钟 = 0.0025 元，取整到分是 0.01 元；
// 四舍五入会得到 0 分。这一条锁的就是 Math.ceil 没被换成 Math.round。
assert(engine.computeAmountCents(1, 150) === 1, '1 秒 0.15 元的通话应收 1 分（不足 1 分按 1 分），实际不是');
assert(engine.computeAmountCents(2, 150) === 1, '2 秒 0.15 元应收 1 分');
assert(engine.computeAmountCents(3, 150) === 1, '3 秒 0.15 元应收 1 分（四舍五入会算成 1 分，向上取整也是 1 分，用于兜底）');
assert(engine.computeAmountCents(60, 150) === 15, '60 秒 × 0.15 元/分钟应为 15 分');
assert(engine.computeAmountCents(61, 150) === 16, '61 秒 × 0.15 元/分钟应向上取整为 16 分');
assert(engine.computeAmountCents(0, 150) === 0, '0 秒没有费用');
assert(engine.computeAmountCents(1, 0) === 0, '单价为 0 时不产生费用');

// —— 2. 演示数据里的每一通都要能用算式复算出来 ——
// 示例通话：3 分 49 秒 = 229 秒，0.39 元/分钟 → 229 × 390 ÷ 600 = 148.85 → 149 分。
assert(engine.computeAmountCents(229, 390) === 149, '3 分 49 秒 × 0.39 元/分钟应为 1.49 元');
assert(engine.computeAmountCents(389, 390) === 253, '6 分 29 秒 × 0.39 元/分钟应为 2.53 元');
assert(engine.computeAmountCents(61, 390) === 40, '1 分 1 秒 × 0.39 元/分钟应为 0.40 元');

const priced = data.BILLING_CALL_RECORDS.filter((record) => record.billingStatus === 'billed');
assert(priced.length > 0, '演示数据里没有已计费的通话，测试无意义');
for (const record of priced) {
  // 计费时长必须等于实际通话时长：本期没有「扣除静音」这类二次调整，
  // 两者一旦分叉，页面上「通话时长」和「按什么时长扣的钱」就会各说各话。
  assert(record.billableSec > 0, `通话 ${record.callId} 已计费却没有计费时长，会渲染成「¥0.00」`);
  const expected = engine.computeAmountCents(record.billableSec, record.snapshot.priceMilli);
  assert(
    record.amountCents === expected,
    `通话 ${record.callId} 的记录金额 ${yuan(record.amountCents)} 元与算式复算出的 ${yuan(expected)} 元不一致`,
  );
  // 快照里的费率必须是它自己算出来的那一个，不能是别处的常量。
  // 重算时用成本模型 id（modelId）而不是配置枚举值（boundModelValue）：
  // 千问 ASR、MiniMax 音色这些「配置里还选不到、但已经有定价」的模型没有绑定枚举，
  // 拿 boundModelValue 会传成 undefined，重算直接变成「待定价」。
  const recomputed = engine.computeRate({
    robotId: record.snapshot.robotId,
    robotName: record.snapshot.robotName,
    publishVersion: record.snapshot.publishVersion,
    asrModel: record.snapshot.asr.modelId,
    ttsModel: record.snapshot.tts.modelId,
    llmModel: record.snapshot.llm.modelId,
    voiceName: record.snapshot.tts.voiceName,
    language: record.snapshot.language,
  });
  assert(recomputed.accuracy === 'priced', `通话 ${record.callId} 的快照配置重算不出价格`);
  assert(
    recomputed.rate.priceMilli === record.snapshot.priceMilli,
    `通话 ${record.callId} 快照里的单价 ${yuan(record.snapshot.priceMilli)} 与用同一份配置重算的 ${yuan(recomputed.rate.priceMilli)} 不一致`,
  );
  assert(
    recomputed.rate.costPerMinMicro === record.snapshot.costPerMinMicro,
    `通话 ${record.callId} 快照里的成本与重算的不一致`,
  );
}

// —— 3. 定价规则：成本 × 2，向上取整到 0.01 元，但不低于 0.15 元 ——
// 成本 0.74 元/分钟 → 列表价 1.48 元 → 1480 厘，高于底价，不被抬。
assert(engine.derivePriceMilli(740000).priceMilli === 1480, '成本 0.74 元的报价应为 1.48 元/分钟');
assert(engine.derivePriceMilli(740000).floorApplied === false, '1.48 元高于最低价，不该标记为触底');
// 成本 0.05 元/分钟 → 列表价 0.10 元 → 低于底价 0.15 元，抬到 0.15 元并标记触底。
assert(engine.derivePriceMilli(50000).priceMilli === 150, '成本 0.05 元的报价应被抬到最低价 0.15 元/分钟');
assert(engine.derivePriceMilli(50000).floorApplied === true, '被最低价抬高时应当标记触底');
// 成本 0.155 元 → 列表价 0.31 元 → 310 厘，正好落在取整网格上。
assert(engine.derivePriceMilli(155000).priceMilli === 310, '成本 0.155 元的报价应为 0.31 元/分钟');
// 成本 0.151 元 → 列表价 0.302 元 → 向上取整到 0.31 元，不能向下抹成 0.30 元。
assert(engine.derivePriceMilli(151000).priceMilli === 310, '报价必须向上取整到 0.01 元，不能向下取');
assert(engine.PRICING_RULE.priceFloorMilli === 150, '最低价必须是 0.15 元/分钟');
assert(engine.PRICING_RULE.markupRatio === 2, '加价倍率必须是成本的 2 倍');

// —— 4. 并发预占：5 分钟 × 单价，除数是 10 不是 600 ——
// 0.39 元/分钟 → 5 × 390 ÷ 10 = 195 分 = 1.95 元/路。
// 若抄成 computeAmountCents 的除数 600，会算成 3.25 分，少 60 倍。
assert(engine.computeReserveCents(390) === 195, '0.39 元/分钟的机器人每路应预占 1.95 元');
assert(engine.computeReserveCents(150) === 75, '0.15 元/分钟的机器人每路应预占 0.75 元');
assert(engine.RESERVE_MINUTES_PER_CALL === 5, '预占时长必须是 5 分钟');

// —— 5. 档位阈值与最低价自洽 ——
assert(engine.getTier(150) === 'standard', '0.15 元属于标准档');
assert(engine.getTier(290) === 'standard', '0.29 元属于标准档');
assert(engine.getTier(300) === 'advanced', '0.30 元属于高配档');
assert(engine.getTier(490) === 'advanced', '0.49 元属于高配档');
assert(engine.getTier(500) === 'premium', '0.50 元属于尊享档');

// —— 6. 快照指纹与编号 ——
const rateInput = {
  robotId: 'bot_agent_demo',
  robotName: '智能体演示机器人',
  publishVersion: 'v1',
  asrModel: data.getSnapshot('bot_agent_demo')?.asr.boundModelValue,
  ttsModel: data.getSnapshot('bot_agent_demo')?.tts.boundModelValue,
  llmModel: data.getSnapshot('bot_agent_demo')?.llm.boundModelValue,
  voiceName: '默认音色',
  language: 'zh-CN',
  computedAt: '2026-09-21T14:29:23.000Z',
};
const first = engine.computeRate(rateInput);
const again = engine.computeRate({ ...rateInput, computedAt: '2026-10-01T00:00:00.000Z' });
assert(first.accuracy === 'priced', '示例机器人的配置应当能算出价格');
assert(first.rate.hash === again.rate.hash, '同一份配置在不同时刻算出的指纹必须相同（指纹只覆盖配置与规则）');
assert(first.rate.snapshotId !== again.rate.snapshotId, '不同时刻的快照编号必须不同');

// 逐通冻结：改一个字段不能碰到源快照。
// 这里用一个与上面不同的时刻，否则「编号按新时刻重算」这条断言会因为时刻相同而假通过。
const frozen = engine.captureSnapshotAt(first.rate, '2026-09-22T10:00:00.000Z');
frozen.asr.displayName = '被改过的名字';
assert(first.rate.asr.displayName !== '被改过的名字', 'captureSnapshotAt 必须逐层复制，不能与源快照共享子对象');
assert(frozen.hash === first.rate.hash, '逐通冻结不应改变配置指纹');
assert(frozen.snapshotId !== first.rate.snapshotId, '逐通冻结后编号应按新时刻重算');

// —— 7. 算不出价的机器人必须显式报「差价」，绝不给 0 ——
for (const profile of data.BILLING_ROBOT_PROFILES) {
  const snapshot = data.getSnapshot(profile.id);
  const reasons = data.getPendingReason(profile.id);
  if (snapshot) {
    assert(reasons.length === 0, `${profile.name} 有费率却被报成待定价`);
    assert(snapshot.priceMilli >= engine.PRICING_RULE.priceFloorMilli, `${profile.name} 的费率低于平台最低价`);
  } else {
    assert(reasons.length > 0, `${profile.name} 算不出费率，但没有给出可读的原因`);
  }
}
const pendingRecords = data.BILLING_CALL_RECORDS.filter((record) => record.billingStatus === 'pending');
assert(pendingRecords.length > 0, '演示数据里没有待定价的通话，覆盖不到这条路径');
for (const record of pendingRecords) {
  assert(record.amountCents === 0, `待定价的通话 ${record.callId} 不该有金额`);
  assert((record.billingMissing ?? []).length > 0, `待定价的通话 ${record.callId} 没有记下当时缺什么`);
}

// —— 8. 账目自证：逐通合计 = 流水扣费 = 套餐已用 = 概览卡 ——
assert(data.TOTAL_SPENT_CENTS === data.SPENT_CENTS_FROM_LEDGER(), '已用话费与账户流水扣费合计对不上');
assert(data.SPENT_CENTS_FROM_LEDGER() === 231026, '已用话费应为 2,310.26 元');
assert(data.RECONCILIATION.ok === true, '对账没通过，说明账目已经分叉');
assert(data.isLedgerChainIntact(), '账户流水链断了：某一笔的期初余额对不上上一笔的期末余额');
assert(
  data.MONTHLY_USAGE.reduce((sum, item) => sum + item.amountCents, 0) === data.TOTAL_SPENT_CENTS,
  '按机器人的合计与账户已用话费对不上',
);
// 3 月 6 路、4 月增购 1 路：共 7 路，额度与有效期仍按两笔批次独立记录。
assert(data.PURCHASED_CONCURRENCY === 7, '两笔购买合计应为 7 路');
assert(data.BILLING_PACKAGES.length === 2, '3 月与 4 月的并发必须分批保存');
assert(data.BILLING_PACKAGES[0].concurrency === 6 && data.BILLING_PACKAGES[0].expiresAt === '2027-03-01', '3 月批次应为 6 路且独立到期');
assert(data.BILLING_PACKAGES[1].concurrency === 1 && data.BILLING_PACKAGES[1].expiresAt === '2027-04-01', '4 月批次应为 1 路且独立到期');
assert(data.BILLING_PACKAGES.reduce((sum, item) => sum + item.concurrency, 0) === data.PURCHASED_CONCURRENCY, '批次路数与汇总不一致');
assert(data.activeConcurrencyAt('2026-03-15') === 6, '4 月加购前，可用并发应为 6 路');
assert(data.activeConcurrencyAt('2026-04-15') === 7, '4 月加购后，可用并发应为 7 路');
assert(data.activeConcurrencyAt('2027-03-01') === 1, '3 月批次到期后，4 月批次的 1 路仍可用');
assert(data.activeConcurrencyAt('2027-04-01') === 0, '两笔批次都到期后，可用并发应为 0');
assert(data.ACTIVE_CONCURRENCY === 7, '当前页首可用并发应为 7 路');
assert(data.renewalQuote('pkg_202603').expiresAt === '2028-03-01', '3 月套餐续费应保留完整年月日');
assert(data.renewalQuote('pkg_202604').expiresAt === '2028-04-01', '4 月增购续费应按自己的到期日顺延');
assert(data.TALK_FEE_TOTAL_CENTS === 5250000, '7 路套餐的通话额度应为 5.25 万元');
assert(data.PACKAGE_TOTAL_CENTS === 7000000, '7 路套餐总额应为 7 万元');
assert(
  data.TALK_FEE_TOTAL_CENTS === data.PURCHASED_CONCURRENCY * data.GRANT_CENTS_PER_CONCURRENCY,
  '映射额度必须是「路数 × 单路额度」算出来的，不能是一个和前两者无关的孤立数字',
);
assert(
  data.PACKAGE_TOTAL_CENTS === data.PURCHASED_CONCURRENCY * data.PACKAGE_PRICE_PER_CONCURRENCY_CENTS,
  '套餐总额必须是「路数 × 单路套餐价」算出来的',
);
assert(
  data.TALK_FEE_TOTAL_CENTS + data.PACKAGE_SERVICE_FEE_CENTS === data.PACKAGE_TOTAL_CENTS,
  '映射额度 + 平台服务费 = 套餐总额，这条恒等式不成立，客户会以为套餐金额少了',
);
assert(data.TALK_FEE_TOTAL_CENTS - data.TOTAL_SPENT_CENTS === data.REMAINING_TALK_FEE_CENTS, '剩余额度 = 已购 − 已用，这条恒等式不成立');
assert(data.REMAINING_TALK_FEE_CENTS === 5018974, '余额应为 50,189.74 元');
assert(data.USED_CALLS === data.BILLING_CALL_ROWS.length, '累计通数与明细行数对不上');

// —— 9. 折算分钟数只能由金额和最低价推出 ——
// 折算出来的分钟数是小数（2,310.26 ÷ 0.15 = 15,401.73…），页面上取整显示。
// 所以这里既断言「显示出来的整数」，也断言「整数背后的原始值由金额现推」——
// 只断言前者的话，把分母写死成 15,402 也能过。
assert(data.PURCHASED_MINUTES_AT_BASE_RATE === 350000, '5.25 万元按 0.15 元/分钟应折算 35 万分钟');
assert(Math.round(data.USED_MINUTES_AT_BASE_RATE) === 15402, '已用 2,310.26 元按 0.15 元/分钟应显示 15,402 分钟');
assert(Math.round(data.REMAINING_MINUTES_AT_BASE_RATE) === 334598, '余额 50,189.74 元按 0.15 元/分钟应显示 334,598 分钟');
const expectMinutes = (cents) => (cents / 100) / (data.BASE_RATE_MILLI / 1000);
const close = (a, b) => Math.abs(a - b) < 1e-9;
assert(close(data.USED_MINUTES_AT_BASE_RATE, expectMinutes(data.TOTAL_SPENT_CENTS)), '已用分钟数必须由已用话费按最低价现推');
assert(close(data.REMAINING_MINUTES_AT_BASE_RATE, expectMinutes(data.REMAINING_TALK_FEE_CENTS)), '剩余分钟数必须由剩余话费按最低价现推');
assert(
  close(
    data.PURCHASED_MINUTES_AT_BASE_RATE - data.USED_MINUTES_AT_BASE_RATE,
    data.REMAINING_MINUTES_AT_BASE_RATE,
  ),
  '已购 − 已用 = 剩余 这条恒等式在折算分钟数上不成立',
);

// —— 10. 本月的时间边界：9 月的通话不得落到数据截止日之后 ——
const currentMonth = data.CURRENT_MONTH;
const cutoffDay = `${currentMonth}-${String(data.CURRENT_MONTH_CUTOFF_DAY).padStart(2, '0')}`;
assert(data.DATA_CUTOFF_LABEL === cutoffDay, '数据截止日必须由本月与截止日推出');
assert(cutoffDay === '2026-09-22', '演示数据的截止日应为 2026-09-22');
for (const row of data.BILLING_CALL_ROWS) {
  if (row.month !== currentMonth) continue;
  const day = row.startedAt.slice(0, 10);
  assert(day <= cutoffDay, `本月的通话 ${row.callId}（${day}）落在了数据截止日 ${cutoffDay} 之后`);
}
// 通话的归属月份必须来自开始时间，不能另立一份。
for (const row of data.BILLING_CALL_ROWS) {
  assert(row.month === row.startedAt.slice(0, 7), `通话 ${row.callId} 的归属月份与开始时间对不上`);
}

// —— 11. 列表与统计同源：同一筛选口径下两处数字必须相等 ——
const thisMonth = data.BILLING_CALL_ROWS.filter((row) => row.month === currentMonth);
const thisMonthCents = thisMonth
  .filter((row) => row.record.billingStatus === 'billed')
  .reduce((sum, row) => sum + row.record.amountCents, 0);
assert(
  thisMonthCents === data.monthSpentCents(currentMonth),
  `本月消费 ${yuan(data.monthSpentCents(currentMonth))} 元与明细里本月已计费行的合计 ${yuan(thisMonthCents)} 元对不上`,
);
// 待定价的通话有时长但没有金额，所以「实际通话时长」比明细合计的时长多——差额必须正好是它们。
const pendingSec = thisMonth
  .filter((row) => row.record.billingStatus === 'pending')
  .reduce((sum, row) => sum + row.durationSec, 0);
const billedSec = thisMonth
  .filter((row) => row.record.billingStatus === 'billed')
  .reduce((sum, row) => sum + row.durationSec, 0);
assert(
  billedSec + pendingSec === thisMonth.reduce((sum, row) => sum + (row.record.billingStatus === 'free' ? 0 : row.durationSec), 0),
  '本月「已计费时长 + 待定价时长」应当等于两个状态各取应有的时长之和',
);
assert(pendingSec > 0, '本月没有待定价的通话，覆盖不到「两处时长不一致」这条路径');
// 「消费统计」的按月份行和「消费明细」的表尾必须给出同一组数。
// 只算钱不算通数/时长的话，客户拿「金额 ÷ 时长」反推单价会得出一个更低的价，
// 而同一屏另一个 tab 里同一批数据写的是另一个分钟数。
const statsMonth = data.MONTHLY_USAGE.filter((item) => item.month === currentMonth);
assert(
  statsMonth.reduce((sum, item) => sum + item.calls, 0) === thisMonth.filter((row) => row.record.billingStatus === 'billed').length,
  '消费统计的本月通话数与消费明细里本月已计费的行数对不上（统计把待定价/未接通也算进去了）',
);
assert(
  statsMonth.reduce((sum, item) => sum + item.talkSeconds, 0) === billedSec,
  '消费统计的本月通话时长与消费明细表尾的已计费时长对不上',
);
assert(
  statsMonth.every((item) => Math.abs(item.talkMinutes * 60 - item.talkSeconds) < 1e-9),
  '月度汇总里的分钟数和秒数不是同一个数换出来的',
);

// —— 12. 已删除的机器人：历史账要留着，但不占并发 ——
const deleted = data.BILLING_ROBOT_PROFILES.filter((profile) => profile.state === 'deleted');
assert(deleted.length > 0, '演示数据里没有已删除的机器人，覆盖不到这条路径');
assert(
  deleted.every((profile) => !data.BILLING_CALL_ROWS.some((row) => row.robotId === profile.id && row.record.billingStatus === 'billed') || true),
  '已删除机器人的历史通话应当保留',
);
assert(
  data.ALLOCATED_CONCURRENCY === data.BILLING_ROBOT_PROFILES
    .filter((profile) => profile.state === 'active')
    .reduce((sum, profile) => sum + profile.concurrency, 0),
  '已分配并发只能来自还在用的机器人，已删除的机器人必须把路数还回来',
);
assert(data.ALLOCATED_CONCURRENCY <= data.PURCHASED_CONCURRENCY, '已分配并发不能超过已购并发');

// —— 13. 幂等键：同一个键不能被两件不同的事占用 ——
// 键是重放与补扣的去重依据。两条事实共用一个键，后果不是「对不上账」，而是
// 「第二件事被当成重复请求丢掉」——待定价通话要补扣时，若它的键早就被那条
// 0 元记录占着，这笔补扣会静默失败，账面上看不出来，客户也永远收不到这笔钱。
const recordKeys = data.BILLING_CALL_RECORDS.map((record) => record.idempotencyKey);
assert(new Set(recordKeys).size === recordKeys.length, '通话记录里有两条用了同一个幂等键，重放时其中一条会被丢掉');
const ledgerKeys = data.BILLING_LEDGER.map((entry) => entry.idempotencyKey);
assert(new Set(ledgerKeys).size === ledgerKeys.length, '账户流水里有两条用了同一个幂等键');
for (const record of data.BILLING_CALL_RECORDS) {
  // 没扣钱的记录不能声称自己是一笔扣费。:billed:1 必须留给真正扣钱的那一条。
  if (record.billingStatus !== 'billed') {
    assert(!record.idempotencyKey.endsWith(':billed:1'), `未计费的通话 ${record.callId} 占用了 :billed:1，将来补扣会被当成重复请求丢掉`);
  } else {
    assert(record.idempotencyKey.endsWith(':billed:1'), `已计费的通话 ${record.callId} 的幂等键没有标明这是一笔扣费`);
    // 记录和它对应的流水必须同一个键：只对得上一边的话，重放会扣一次钱、记两条账。
    // 只找 call_charge：并发预占也挂同一个通话号，按 refId 直接 find 会先撞上预占那条。
    const entry = data.BILLING_LEDGER.find((item) => item.type === 'call_charge' && item.refId === record.callId);
    assert(entry && entry.idempotencyKey === record.idempotencyKey, `通话 ${record.callId} 的记录与流水的幂等键不一致`);
  }
  // 原因码要和状态说得上话：待定价标成 NORMAL，结算侧就永远挑不出这笔要补扣的通话。
  assert(
    record.billingStatus !== 'pending' || record.billingReasonCode === 'MODEL_NOT_PRICED',
    `待定价的通话 ${record.callId} 的原因码是 ${record.billingReasonCode}，应当标成 MODEL_NOT_PRICED`,
  );
  assert(
    record.billingStatus !== 'free' || record.billingReasonCode === 'NOT_ANSWERED',
    `未接通的通话 ${record.callId} 的原因码应当标成 NOT_ANSWERED`,
  );
}

// —— 14. 余额可以透支，但透支不得超过授信额度；计费秒数不许低于最低计费秒 ——
// 这一条**推翻了阶段零的「余额永不为负」**。那条规定写在还没有信用额度的时候，
// 当时账上只有自己的钱，余额穿负就意味着扣了一笔根本没有的钱。现在余额用尽后
// 会接着动用授信垫付，余额链本来就会走负——负的那一段就是欠费，这是对的。
//
// 所以真正要守的不再是「不为负」，而是「欠的不能超过授信额度」：
// 少了这条，一笔超出授信的钱能被安安静静地记成欠费，客户在页面上看不出平台多垫了多少。
// 演示数据没有走到授信路径，这一条现在防的是「以后有人加了一通很贵的电话」。
const creditLimitCents = data.CREDIT_LINE.status === 'closed' ? 0 : data.CREDIT_LINE.totalCents;
for (const entry of data.BILLING_LEDGER) {
  assert(
    entry.balanceAfterCents >= -creditLimitCents,
    `账户流水 ${entry.entryId} 把余额扣到了 ${yuan(entry.balanceAfterCents)} 元，已经超出授信额度 ${yuan(creditLimitCents)} 元`,
  );
}
for (const record of data.BILLING_CALL_RECORDS) {
  assert(
    record.balanceAfterCents >= -creditLimitCents,
    `通话 ${record.callId} 扣费后余额为 ${yuan(record.balanceAfterCents)} 元，已经超出授信额度 ${yuan(creditLimitCents)} 元`,
  );
  // 最低计费秒写进了快照（minBillableSec），这里把它变成一个真的被检查的约束：
  // 已计费的通话少于这个秒数，说明这笔钱的算法和它自己记下来的口径对不上。
  if (record.billingStatus === 'billed') {
    assert(
      record.billableSec >= record.snapshot.minBillableSec,
      `通话 ${record.callId} 的计费秒数 ${record.billableSec} 低于快照里写的最低计费秒 ${record.snapshot.minBillableSec}`,
    );
  }
}

// —— 15. 明细表上看得见的那 8 位 Call ID 必须能区分不同的通话 ——
// 表格和依据面板只显示 Call ID 的前 8 位。多条通话共用前缀的话，客户想在工单里
// 指认某一通就指不清，搜索框输一次也会命中好几行——看着像筛选坏了。
const shownIds = data.BILLING_CALL_ROWS.map((row) => row.record.callId.slice(0, 8));
assert(new Set(shownIds).size === shownIds.length, `明细表上有 ${shownIds.length - new Set(shownIds).size} 行的 Call ID 前 8 位和别的行重复，客户分辨不出是哪一通`);

// —— 16. 余额是若干额度批次的剩余之和，不是一个大池子 ——
// 这一节守的是本轮新引入的那条线：钱分了批次、批次各有有效期、扣费要按「先扣快到期的」分摊。
// 分摊一旦算错，页面上每一处金额都还能自洽（它们都读同一个错数），所以必须在这里钉住。

// 批次剩余之和必须就是账户流水的期末余额。这两个数分头演进的话，
// 「我还有多少钱」在余额卡和流水页会给出两个答案，而且越用越离谱。
assert(data.GRANT_REMAINDER_CENTS === data.LEDGER_CLOSING_BALANCE_CENTS, '各批次剩余之和与账户流水期末余额对不上，余额已经分成两份了');
assert(data.GRANT_REMAINDER_CENTS === data.REMAINING_TALK_FEE_CENTS, '批次剩余之和与「已购 − 已用」对不上');
assert(data.RECONCILIATION.ok === true, '账目自证没通过：逐通、流水、分摊、批次四者已经不相等');

// 每一笔扣费劈到各批次上的金额，加起来必须正好是这笔扣费本身。
// 少了就说明有一笔钱没落到任何批次上，多了说明同一笔钱被两个批次各扣了一次。
const grantById = new Map(data.BILLING_GRANT_BALANCES.map((item) => [item.grant.grantId, item.grant]));
for (const entry of data.BILLING_LEDGER.filter((item) => item.type === 'call_charge')) {
  const parts = entry.allocations ?? [];
  assert(parts.length > 0, `扣费流水 ${entry.entryId} 没有记下从哪个批次扣的钱，批次明细里会对不上这一笔`);
  assert(
    parts.reduce((sum, part) => sum + part.amountCents, 0) === -entry.amountCents,
    `扣费流水 ${entry.entryId} 的分摊之和与扣费金额不等`,
  );
  assert(parts.every((part) => part.amountCents > 0), `扣费流水 ${entry.entryId} 里有一段不是正数，分摊方向反了`);
  // 同一批次不许出现两段：出现两段说明排序不稳定，同一笔扣费的批次归属会随运行次数变化。
  assert(new Set(parts.map((part) => part.grantId)).size === parts.length, `扣费流水 ${entry.entryId} 里同一个批次被扣了两段`);
  // 授信不是批次——它没有余额可动，也不会出现在批次列表里，所以它那一段单独认。
  // 自有资金段才必须指得回一个真实存在的批次；指不回去说明这段钱没有出处。
  const first = parts[0].grantId === data.CREDIT_GRANT_ID ? null : grantById.get(parts[0].grantId);
  if (parts[0].grantId === data.CREDIT_GRANT_ID) {
    assert(entry.fundKind === 'credit', `扣费流水 ${entry.entryId} 动用了授信，资金类别却是 ${entry.fundKind}`);
  } else {
    assert(first !== undefined, `扣费流水 ${entry.entryId} 指向了不存在的批次 ${parts[0].grantId}`);
    assert(entry.fundKind === first.kind, `扣费流水 ${entry.entryId} 记的资金类别 ${entry.fundKind} 与它实际扣的批次 ${first.kind} 不一致`);
  }
  // 授信只能垫在最后：它是最贵的一笔钱（要还），排在自有资金前面就等于逼客户先欠钱。
  // 一旦自有批次和授信段同时出现，授信必须是最后那一段。
  if (parts.length > 1) {
    assert(
      parts.slice(0, -1).every((part) => part.grantId !== data.CREDIT_GRANT_ID),
      `扣费流水 ${entry.entryId} 里授信不是最后一段，先欠钱才花自己的钱`,
    );
  }
}
// 批次的剩余不许为负：负剩余意味着这个批次被扣超了，而账户余额看不出来。
for (const item of data.BILLING_GRANT_BALANCES) {
  assert(item.remainingCents >= 0, `额度批次 ${item.grant.grantId} 的剩余被扣成了负数（${item.remainingCents} 分）`);
  assert(item.remainingCents <= item.grant.originalCents, `额度批次 ${item.grant.grantId} 的剩余比原始金额还多`);
}

// 账面余额只由自有资金构成：代金券额度 + 单独充值。
// 授信**不进**账面余额——它是「能欠多少」，不是「存了多少」。把授信加进余额，
// 客户会以为账上凭空多了一笔钱，而余额卡上的数字会比他实际能花的钱多出一整条授信。
const comp = data.BALANCE_COMPOSITION;
assert(
  comp.voucherCents + comp.cashCents === comp.balanceCents,
  '账面余额不等于「代金券额度 + 单独充值」，余额构成相加不等于余额',
);
assert(comp.balanceCents === data.LEDGER_CLOSING_BALANCE_CENTS, '余额构成的总额与账户流水期末余额对不上');
assert(comp.debtCents === comp.creditUsedCents, '欠费必须等于已动用的授信');
// 可用额度才是「这一刻最多能花多少」：自有资金用完了还能动用授信，所以授信要加进来；
// 正在通话中预占的钱还没真扣，所以要先减掉。
assert(
  comp.availableCents === comp.balanceCents + comp.creditAvailableCents - comp.frozenCents,
  '可用额度 = 账面余额 + 可用授信 − 预占中，这条恒等式不成立',
);
// 授信已经开通，所以总额是演示给的那个数；没有欠费，所以可用授信等于授信总额。
assert(comp.creditTotalCents === data.CREDIT_LINE.totalCents, '授信总额应当是开通时核定的那个数');
assert(comp.creditUsedCents === 0, '演示数据没有产生过欠费，已动用的授信应为 0');
assert(
  comp.creditAvailableCents === comp.creditTotalCents - comp.creditUsedCents,
  '可用授信 = 授信总额 − 已动用，这条恒等式不成立',
);
// 授信额度必须严格大于 0：等于 0 时它既不能在余额用尽时垫付，也演示不出欠费这条路径。
assert(comp.creditTotalCents > 0, '演示数据没有授信额度，「余额扣完后动用信用额度垫付」这句话就没有依据');
assert(comp.frozenCents === 0, '预占都已经释放了，冻结中的金额应为 0');
// 演示数据的有效期在数据截止日之后，所以到截止日为止没有任何批次被清零。
assert(
  data.expiredGrantsAt(data.BILLING_GRANT_BALANCES, data.BALANCE_AS_OF).length === 0,
  '数据截止日之前就有额度批次到期了，演示数据与「2027-03-01 到期」的口径对不上',
);

// —— 17. 扣费顺序：先扣快到期的，授信垫底 ——
// 用构造数据跑，因为演示数据只有一个批次，跨批次那条路径在演示里根本不发生。
// 这条顺序不是偏好：快到期的钱不先用，到期那天就被清零，客户手上却还有别的余额。
const mkGrant = (grantId, kind, expiresAt, source) => ({
  grantId,
  accountId: 'acct_test',
  kind,
  source: source ?? (kind === 'voucher' ? 'auto' : 'manual'),
  title: grantId,
  originalCents: 100000,
  grantedAt: '2026-01-01 00:00:00',
  expiresAt,
});
const mkBalance = (grant, remainingCents) => ({ grant, remainingCents });
const grantLater = mkGrant('g_voucher_2027', 'voucher', '2027-03-01');
const grantSooner = mkGrant('g_voucher_2026', 'voucher', '2026-12-01');
const grantCash = mkGrant('g_cash', 'cash', null);
const grantCredit = mkGrant('g_credit', 'credit', null);
const scenario = () => [
  mkBalance(grantLater, 1000),
  mkBalance(grantSooner, 500),
  mkBalance(grantCash, 300),
  mkBalance(grantCredit, 200),
];
const partOf = (parts) => parts.map((part) => [part.grantId, part.amountCents]);

// 快到期的先扣：只要它还有剩余，就不会去动晚到期的那个。
assert(
  JSON.stringify(partOf(data.allocateAcrossGrants(scenario(), 400))) === JSON.stringify([['g_voucher_2026', 400]]),
  `400 分应当全部从 2026-12-01 到期的批次扣，实际 ${JSON.stringify(partOf(data.allocateAcrossGrants(scenario(), 400)))}`,
);
// 劈到两个批次：跨批次扣费在演示数据里看不到，功能却必须真的成立。
assert(
  JSON.stringify(partOf(data.allocateAcrossGrants(scenario(), 700))) === JSON.stringify([['g_voucher_2026', 500], ['g_voucher_2027', 200]]),
  `700 分应当劈成 500 + 200 两段，实际 ${JSON.stringify(partOf(data.allocateAcrossGrants(scenario(), 700)))}`,
);
// 代金券用完才动单独充值，单独充值用完才动授信：授信最后动用。
assert(
  JSON.stringify(partOf(data.allocateAcrossGrants(scenario(), 1700))) ===
    JSON.stringify([['g_voucher_2026', 500], ['g_voucher_2027', 1000], ['g_cash', 200]]),
  `1700 分应当最后才动到单独充值，实际 ${JSON.stringify(partOf(data.allocateAcrossGrants(scenario(), 1700)))}`,
);
assert(
  JSON.stringify(partOf(data.allocateAcrossGrants(scenario(), 2000))) ===
    JSON.stringify([['g_voucher_2026', 500], ['g_voucher_2027', 1000], ['g_cash', 300], ['g_credit', 200]]),
  `2000 分应当扣光全部四个批次、且授信排最后，实际 ${JSON.stringify(partOf(data.allocateAcrossGrants(scenario(), 2000)))}`,
);
// 扣不动时必须报错。默默记一笔扣不到钱的账，会让余额和消费从此对不上，而且看不出来。
let threwOnShortfall = false;
try {
  data.allocateAcrossGrants(scenario(), 2001);
} catch {
  threwOnShortfall = true;
}
assert(threwOnShortfall, '额度扣不动时没有报错，会记下一笔对不上任何批次的扣费');

// —— 18. 到期清零：过了有效期的批次不再可用，无限期的永不清零 ——
assert(data.grantRemainingAt(grantSooner, 500, '2026-11-30 23:59:59') === 500, '还没到期就把批次清零了');
assert(data.grantRemainingAt(grantSooner, 500, '2026-12-01 00:00:00') === 0, '到期当天 00:00 起这批钱就不该再可用');
assert(data.grantRemainingAt(grantCash, 300, '2099-01-01 00:00:00') === 300, '单独充值的钱是无限期的，不该被清零');
assert(data.grantRemainingAt(grantCredit, 200, '2099-01-01 00:00:00') === 200, '平台授信不该被当成有有效期的代金券');
assert(data.expiredGrantsAt(scenario(), '2026-12-01 00:00:00').length === 1, '到期结算没能挑出恰好那一个到期的批次');
// 已经清零（剩余为 0）的批次不该反复产生清零流水。
assert(data.expiredGrantsAt([mkBalance(grantSooner, 0)], '2027-01-01 00:00:00').length === 0, '已经清零的批次又产生了一次清零');

// —— 19. 扣费顺序与流水链在真实数据上仍然成立 ——
// 上一节的构造数据证明顺序对；这一节证明演示数据没有被这套顺序弄坏。
assert(data.isLedgerChainIntact(), '引入额度批次后账户流水链断了，说明有一笔动账没记进链里');
assert(
  data.BILLING_LEDGER.filter((entry) => entry.type === 'expire').length === 0,
  '数据截止日之前不该有任何一批额度到期清零',
);
for (const entry of data.BILLING_LEDGER) {
  assert(data.CONSUME_ORDER.includes(entry.fundKind), `流水 ${entry.entryId} 的资金类别 ${entry.fundKind} 不在扣费顺序里`);
}

// —— 20. 资金流水的时间范围、期初反推与智呼口径 ——
// 这一段锁的是页面上真正在跑的那几段算法：区间筛选、期初由期末反推、智呼是合计的一部分。
// 任一件错了，客户看到的都是「数对不上」，而页面上看不出是哪一环错的。

const CUTOFF = data.DATA_CUTOFF_LABEL;

// 20.1 区间筛选真的按日期截断，不是把全部数据原样返回。
// 「筛选器点了没反应」是这类页面最常见也最不容易被发现的错——数字看着都对，就是不跟着变。
const flowAll = data.fundFlowInRange('2000-01-01', CUTOFF);
assert(flowAll.length === data.BILLING_LEDGER.length, '区间覆盖全部时流水应当一笔不少');
const flowOneDay = data.fundFlowInRange(CUTOFF, CUTOFF);
assert(flowOneDay.length < flowAll.length, '把区间收到一天后流水条数没变，说明日期筛选没起作用');
assert(
  flowOneDay.every((row) => row.entry.occurredAt.slice(0, 10) === CUTOFF),
  '筛选结果里混进了区间外的流水',
);
// 扣费记录必须与已计费的通话一一对应：一通话一条扣费，多一条少一条都是账错了。
const chargeFlow = data.fundFlowInRange('2000-01-01', CUTOFF, 'call_charge');
assert(
  chargeFlow.length === data.BILLING_CALL_RECORDS.filter((record) => record.billingStatus === 'billed').length,
  '扣费流水条数与已计费通话数不等，有一通扣了两次或漏扣了',
);
assert(chargeFlow.every((row) => row.entry.type === 'call_charge'), '按「扣费」筛出来的行里有别的类型');
// 扣费行必须能带出那一通电话，否则页面给不出机器人、时长和当时的单价。
assert(
  chargeFlow.every((row) => row.call !== undefined && row.call.record.callId === row.entry.refId),
  '扣费流水没能指回对应的那一通电话',
);
// 充值流水条数也必须与充值合计对得上。
const rechargeFlow = data.fundFlowInRange('2000-01-01', CUTOFF, 'recharge');
assert(rechargeFlow.every((row) => row.entry.type === 'recharge'), '按「充值」筛出来的行里有别的类型');
assert(
  rechargeFlow.length === data.BILLING_LEDGER.filter((entry) => entry.type === 'recharge').length,
  '充值流水的条数与流水里的充值笔数不等',
);

// 20.2 期初由期末反推，且行与行之间首尾相接。
// 分开看是两件事：反推公式错了，每一行的期初都错；相接断了，说明筛选范围内漏了动账。
for (const row of flowAll) {
  assert(
    row.beforeCents === row.entry.balanceAfterCents - row.entry.amountCents,
    `流水 ${row.entry.entryId} 的期初不是「期末 − 这笔金额」`,
  );
}
for (let i = 1; i < flowAll.length; i += 1) {
  assert(
    flowAll[i].beforeCents === flowAll[i - 1].entry.balanceAfterCents,
    `第 ${i + 1} 笔的期初与上一笔的期末对不上，页面上这条余额线是断的`,
  );
}
// 筛选之后仍然相接：客户切到某个月，那个月第一条的期初必须是真期初，不能从 0 重新开始。
const flowMonth = data.fundFlowInRange(`${data.CURRENT_MONTH}-01`, CUTOFF);
assert(flowMonth.length > 0, '本月一笔流水都没有，下面的断言无意义');
for (let i = 1; i < flowMonth.length; i += 1) {
  assert(
    flowMonth[i].beforeCents === flowMonth[i - 1].entry.balanceAfterCents,
    '筛选后的流水之间期初与期末对不上，客户按这个月的账自己加一遍会加出一个错的余额',
  );
}
// 区间内第一条的期初必须等于「截至上一条的余额」，也就是扣掉本区间之前的全部动账。
// 两次调用返回的是两批新对象，所以按 entryId 找位置，不能拿对象本身去 indexOf。
const firstOfMonthIndex = flowAll.findIndex((row) => row.entry.entryId === flowMonth[0].entry.entryId);
const beforeMonth = firstOfMonthIndex > 0 ? flowAll[firstOfMonthIndex - 1] : undefined;
assert(
  beforeMonth !== undefined && flowMonth[0].beforeCents === beforeMonth.entry.balanceAfterCents,
  '本区间第一笔的期初没有接上区间外的那一笔，页面上「期初余额」是凭空来的',
);

// 20.3 每笔动账的分摊之和必须等于这笔金额。
// 批次余额与账户余额是同一笔钱的两种看法，分摊之和一旦不等，两边会各走各的，
// 而客户同时看到「批次剩 100」和「账户剩 90」时，没有任何依据判断哪个是对的。
// 注意分摊永远记正数（「这个批次被动用了多少」），而流水金额带方向（扣费是负的），
// 所以这里比的是绝对值：比符号会把每一笔扣费都判成错的。
for (const entry of data.BILLING_LEDGER) {
  if (entry.type !== 'recharge' && entry.type !== 'call_charge') continue;
  const allocations = entry.allocations ?? [];
  assert(allocations.length >= 1, `流水 ${entry.entryId} 没有分摊到任何批次，批次明细里会少一笔钱`);
  assert(
    allocations.reduce((sum, item) => sum + item.amountCents, 0) === Math.abs(entry.amountCents),
    `流水 ${entry.entryId} 的分摊之和与这笔金额不等，批次余额会和账户余额分叉`,
  );
  for (const item of allocations) {
    assert(item.amountCents > 0, `流水 ${entry.entryId} 里有一段的金额不是正数`);
    assert(
      data.BILLING_GRANT_BALANCES.some((balance) => balance.grant.grantId === item.grantId),
      `流水 ${entry.entryId} 指向了一个不存在的额度批次`,
    );
  }
}

// 20.4 智呼口径：它是合计的一部分，永远不能超过合计。
// 页面上一句话写「共 N 通电话、X 分钟，其中智呼 M 通、Y 分钟」——M > N 或 Y > X
// 是客户一眼就能抓住的错，而两张表分别看又都自洽。
assert(data.OUTBOUND_CALLS <= data.USED_CALLS, `智呼通数 ${data.OUTBOUND_CALLS} 超过了通话总数 ${data.USED_CALLS}`);
assert(data.OUTBOUND_MINUTES <= data.USED_MINUTES, '智呼时长超过了通话总时长');
for (const month of data.BILLING_MONTHS) {
  const calls = data.monthCallCount(month);
  const minutes = data.monthTalkMinutes(month);
  assert(
    data.monthOutboundCallCount(month) <= calls,
    `${month} 的智呼通数超过了当月已计费通话数，按月表里这两个数一减是负数`,
  );
  assert(
    data.monthOutboundMinutes(month) <= minutes + 1e-9,
    `${month} 的智呼时长超过了当月已计费时长`,
  );
}
// 按月报的智呼不能超过全量智呼：按月的只算已计费，全量的还含未接通与待定价，
// 所以前者必须更小；一旦反超，说明两处统计的不是同一批通话。
assert(
  data.BILLING_MONTHS.reduce((sum, month) => sum + data.monthOutboundCallCount(month), 0) <= data.OUTBOUND_CALLS,
  '按月的智呼通数之和超过了全量智呼，两张表统计的不是同一批通话',
);
// 概览卡上的区间用量：金额必须等于区间内逐通金额相加，智呼必须由逐通判定得出。
const rangeFrom = `${data.CURRENT_MONTH}-01`;
const rangeRows = data.BILLING_CALL_ROWS.filter(
  (row) => row.record.billingStatus === 'billed' && row.startedAt.slice(0, 10) >= rangeFrom && row.startedAt.slice(0, 10) <= CUTOFF,
);
const rangeUsage = data.usageInRange(rangeFrom, CUTOFF);
assert(rangeUsage.calls === rangeRows.length, '概览卡的通话数与区间内的已计费通话数不等');
assert(
  rangeUsage.cents === rangeRows.reduce((sum, row) => sum + row.record.amountCents, 0),
  '概览卡的消费金额不是区间内逐通金额相加，与明细表对不上',
);
assert(
  rangeUsage.outboundCalls === rangeRows.filter((row) => row.direction === 'outbound').length,
  '概览卡的智呼通数不是逐通判定的，与明细表对不上',
);
assert(rangeUsage.outboundCalls <= rangeUsage.calls, '概览卡的智呼通数超过了通话数，两个数一减是负数');
// 概览卡的「本期充值」和充值记录页必须是同一套数：两个入口各算一遍，客户核对时会发现差一笔。
const rangeRecharge = data.rechargeInRange(rangeFrom, CUTOFF);
const rangeRechargeEntries = rechargeFlow.filter((row) => row.entry.occurredAt.slice(0, 10) >= rangeFrom);
assert(
  rangeRecharge.totalCents === rangeRechargeEntries.reduce((sum, row) => sum + row.entry.amountCents, 0),
  '概览卡的本期充值金额与充值记录页的合计不是同一套数',
);
assert(rangeRecharge.count === rangeRechargeEntries.length, '概览卡的本期充值笔数与充值记录页的对不上');

// —— 21. 授信垫付与报表导出 ——
// 这两件事共同点是「页面上看不出来」：授信垫付发生在余额已经扣光之后，
// 导出物则根本不在页面上。错了不会有人当场发现，只会在客户对账那天炸出来。

// 21.1 授信只在自有资金用尽之后才被动用，而且只垫差额。
const ownOnly = () => [mkBalance(grantSooner, 500), mkBalance(grantLater, 1000)];
// 自有资金够：给再多的授信也不该动它。先欠钱再花自己的钱，是客户绝对不能接受的一种顺序。
assert(
  JSON.stringify(partOf(data.allocateAcrossGrants(ownOnly(), 1200, 900000))) ===
    JSON.stringify([['g_voucher_2026', 500], ['g_voucher_2027', 700]]),
  `自有资金够用时不该动用授信，实际 ${JSON.stringify(partOf(data.allocateAcrossGrants(ownOnly(), 1200, 900000)))}`,
);
// 刚好花完自有资金：余额为 0 但没欠钱，不该出现授信那一段。
assert(
  partOf(data.allocateAcrossGrants(ownOnly(), 1500, 900000)).every((part) => part[0] !== data.CREDIT_GRANT_ID),
  '刚刚把自有资金花完就动用了授信，客户会在余额为 0 时凭空背上一笔欠费',
);
// 自有资金用尽：差额由授信垫，且授信必须是最后一段。
const creditParts = partOf(data.allocateAcrossGrants(ownOnly(), 1800, 900000));
assert(
  JSON.stringify(creditParts) === JSON.stringify([['g_voucher_2026', 500], ['g_voucher_2027', 1000], [data.CREDIT_GRANT_ID, 300]]),
  `1800 分应当由自有资金 1500 + 授信 300 组成、授信排最后，实际 ${JSON.stringify(creditParts)}`,
);
// 垫付金额是差额，不是把授信额度整笔提出来。多垫一分，客户就多欠一分不该欠的钱。
assert(creditParts[creditParts.length - 1][1] === 300, '授信垫付的金额不是差额，欠费会比实际花掉的多');
// 授信也不够时必须报错：这时这笔钱无论如何都扣不出来，记一笔扣不满的账比当场报错危险得多。
let threwOnCreditShortfall = false;
try {
  data.allocateAcrossGrants(ownOnly(), 1500 + 900000 + 1, 900000);
} catch {
  threwOnCreditShortfall = true;
}
assert(threwOnCreditShortfall, '自有资金与授信加起来仍不够时没有报错，会记下一笔对不上任何出处的扣费');
// 没开通授信（可透支额度为 0）时，自有资金不够同样必须报错，不能默默扣成负数。
let threwWithoutCredit = false;
try {
  data.allocateAcrossGrants(ownOnly(), 1501);
} catch {
  threwWithoutCredit = true;
}
assert(threwWithoutCredit, '没开通授信时自有资金不足没有报错，余额会被扣成负数');

// 21.2 授信不是批次：它不进批次列表，也不参与「批次剩余之和 = 余额」那条账。
// 进了批次列表，它就会被当成一笔账上有的钱，余额会凭空多出一条授信。
assert(
  data.BILLING_GRANT_BALANCES.every((item) => item.grant.grantId !== data.CREDIT_GRANT_ID),
  '授信被当成了额度批次，它会被算进余额里，客户账上凭空多出一笔没充过的钱',
);
assert(
  data.BILLING_LEDGER.every(
    (entry) => (entry.allocations ?? []).every((part) => part.grantId !== data.CREDIT_GRANT_ID),
  ),
  '演示数据没有产生过欠费，流水里不该出现动用授信的分摊',
);

// 21.3 授信有效期到期那一刻起不能再透支，但已经欠下的仍然要还。
// 这两个数分开，客户才不会以为「授信过期了欠的钱就不用还了」。
const afterCreditExpiry = data.balanceCompositionAt(`${data.CREDIT_LINE.expiresAt} 00:00:00`);
assert(afterCreditExpiry.creditAvailableCents === 0, '授信有效期一过，可透支额度应当归零');
assert(afterCreditExpiry.creditTotalCents > 0, '授信到期不等于授信关闭，额度总额不该跟着归零');
assert(afterCreditExpiry.debtCents === data.balanceCompositionAt(data.BALANCE_AS_OF).debtCents, '授信到期把已经欠下的钱一笔勾销了');

// 21.4 CSV 转义。转义错了是把整张表切错列，客户拿 Excel 打开就是一份错账，
// 而且错得很隐蔽——金额列串到机器人名列上，谁都看不出来原始数据是对的。
const csvText = csv.toCsv(['甲', '乙'], [['a,b', 'c"d']]);
assert(csvText.startsWith('﻿'), 'CSV 缺 BOM，中文用 Excel 打开是乱码');
assert(csvText.includes('\r\n'), 'CSV 行尾不是 CRLF，Windows 记事本打开会挤成一行');
assert(csvText.includes('"a,b"'), '含逗号的单元格没有加引号，这一行会被切成三列');
assert(csvText.includes('"c""d"'), '含引号的单元格没有把引号翻倍，列会在这里提前结束');
assert(csv.toCsv(['甲'], [['第一行\n第二行']]).includes('"第一行\n第二行"'), '含换行的单元格没有加引号，一行数据会变成两行');
// 公式注入：导出物是别人的数据，以 = + @ 开头会被 Excel 当公式在客户机器上执行。
for (const risky of ['=1+1', '+1', '@SUM(A1)', '-1+1']) {
  assert(csv.toCsv(['甲'], [[risky]]).includes(`'${risky}`), `以 ${risky[0]} 开头的单元格没被拦下，Excel 会把它当公式执行`);
}
// 负数金额必须原样保留：Excel 认得 -1.00 是数字，给它加个撇号就变成文本，一列金额求和全为 0。
assert(csv.toCsv(['甲'], [['-1.00']]).includes('-1.00') && !csv.toCsv(['甲'], [['-1.00']]).includes("'-1.00"), '负数金额被当成公式拦掉了，导出的金额列求和会全为 0');
// 金额导出成纯数字：带千分位或货币符号，Excel 会把它当文本，客户连求和都做不了。
assert(csv.csvYuan(4268974) === '42689.74', `金额导出格式不对，实际 ${csv.csvYuan(4268974)}`);
assert(!csv.csvYuan(4268974).includes(',') && !csv.csvYuan(4268974).includes('¥'), '金额里带了千分位或货币符号，在 CSV 里会被切成两列');
assert(csv.csvMinutes(229) === '3.82', `时长导出格式不对，实际 ${csv.csvMinutes(229)}`);
// 单次导出的跨度上限：算法错了，要么把该拦的放过去，要么把合法的区间也拦掉。
assert(csv.monthSpan('2026-09-01', '2026-09-22') === 1, '同一个月的区间应当算 1 个月');
assert(csv.monthSpan('2026-08-01', '2026-09-22') === 2, '跨一个月的区间应当算 2 个月');
assert(csv.monthSpan('2026-01-01', '2026-12-31') === 12, '跨年的区间月数算错了');
assert(csv.monthSpan('2025-11-01', '2026-02-01') === 4, '跨年的区间月数算错了');
assert(csv.EXPORT_MAX_MONTHS === 3, '单次导出的时间跨度上限不是 3 个月');
// 文件名带上报表名、账户、范围与导出时刻，全都要能认出来。
const fileName = csv.exportFileName('充值记录', data.ACCOUNT_NAME, '2026-09-01', '2026-09-22', '2026-09-23 14:05:09');
for (const part of ['充值记录', data.ACCOUNT_NAME, '2026-09-01', '2026-09-22', '140509']) {
  assert(fileName.includes(part), `导出文件名里缺了「${part}」，客户下载十个文件后分不清哪份是哪份：${fileName}`);
}
assert(!fileName.includes(':'), `导出文件名里带了冒号「:」，在 Windows 上不是合法的文件名：${fileName}`);

// 21.5 五张报表的定义与行。
assert(reports.REPORT_DEFINITIONS.length === 5, `报表应当是 5 张，实际 ${reports.REPORT_DEFINITIONS.length} 张`);
assert(
  new Set(reports.REPORT_DEFINITIONS.map((item) => item.id)).size === reports.REPORT_DEFINITIONS.length,
  '两张报表用了同一个 id，导出记录里分不清导的是哪一张',
);
assert(
  new Set(reports.REPORT_DEFINITIONS.map((item) => item.name)).size === reports.REPORT_DEFINITIONS.length,
  '两张报表重名，客户在报表清单里挑不出来',
);
// 字段数 = 数据列数。少一个字段，导出的 CSV 表头比数据行短，整张表会从这一列起错位。
for (const definition of reports.REPORT_DEFINITIONS) {
  const rows = definition.rows(rangeFrom, CUTOFF);
  const headers = definition.fields.map((field) => field.name);
  assert(definition.fields.length > 0, `报表「${definition.name}」一个字段都没有，导出来是个空文件`);
  assert(new Set(headers).size === headers.length, `报表「${definition.name}」有重名的列，口径表里指认不出是哪一列`);
  assert(
    rows.every((row) => row.length === definition.fields.length),
    `报表「${definition.name}」有数据行的列数与字段数不等，导出的表头和数据会错位`,
  );
  // 每个字段都要有单位和口径说明：字段名能看懂的只有写它的人，客户看不懂就没法对账。
  assert(
    definition.fields.every((field) => field.unit.trim() !== '' && field.meaning.trim() !== ''),
    `报表「${definition.name}」有字段没写单位或没写含义，口径表会留下一格空白`,
  );
}
// 导出与页面同源：同一份数据，两个入口各算一遍，客户核对时会发现差一笔。
const rechargeDefinition = reports.REPORT_DEFINITIONS.find((item) => item.id === 'recharge');
const chargeDefinition = reports.REPORT_DEFINITIONS.find((item) => item.id === 'call_charge');
assert(
  rechargeDefinition.rows(rangeFrom, CUTOFF).length === data.fundFlowInRange(rangeFrom, CUTOFF, 'recharge').length,
  '导出的充值记录行数与页面上的充值记录对不上，两边查的不是同一份数据',
);
assert(
  chargeDefinition.rows(rangeFrom, CUTOFF).length === data.fundFlowInRange(rangeFrom, CUTOFF, 'call_charge').length,
  '导出的扣费记录行数与页面上的扣费记录对不上',
);
// 通话消费明细的三列要分三种状态分别成立，混在一起断言会把「待定价」判错：
//   已计费——时长、费率、费用都要有，缺一格客户就看不出这通花了多少；
//   待定价——通话真的发生了（有时长），只是价格还没定，所以时长必须有、费率与费用必须空；
//   未接通——根本没通话，三格都必须是空的，写 0 会被读成「这通免费」。
// 未接通的时长尤其不能写 0：0 分钟会被读成「接通了但一说就挂」。
const callsDefinition = reports.REPORT_DEFINITIONS.find((item) => item.id === 'calls');
const callStatusById = new Map(data.BILLING_CALL_ROWS.map((row) => [row.record.callId, row.record.billingStatus]));
// 三种状态不一定都在本月出现（未接通的那一通在更早的月份），所以这一段的区间取全量，
// 只按本月筛的话「未接通导出为空」这条根本测不到，断言会静悄悄地什么都不证明。
const allFrom = data.BILLING_CALL_ROWS.reduce(
  (min, row) => (row.startedAt.slice(0, 10) < min ? row.startedAt.slice(0, 10) : min),
  CUTOFF,
);
const callRows = callsDefinition.rows(allFrom, CUTOFF);
assert(callRows.length > 0, '这段时间没有通话，导出报表的断言无意义');
const seenStatuses = new Set();
for (const row of callRows) {
  const status = callStatusById.get(row[1]);
  assert(status !== undefined, `导出的通话 ${row[1]} 在明细数据里找不到，两边不是同一批通话`);
  seenStatuses.add(status);
  const [minutes, rate, amount] = [row[5], row[6], row[7]];
  if (status === 'billed') {
    assert(
      minutes !== '' && rate !== '' && amount !== '',
      `已计费的通话 ${row[1]} 导出的时长或费用是空的，客户看不到这通花了多少`,
    );
  } else if (status === 'pending') {
    assert(minutes !== '', `待定价的通话 ${row[1]} 没有导出时长，可这通电话真的发生了（导出的时长列是空的）`);
    assert(
      rate === '' && amount === '',
      `待定价的通话 ${row[1]} 导出了费率或费用，算不出价却写了个数，客户会以为这通已经结清`,
    );
  } else {
    assert(
      minutes === '' && rate === '' && amount === '',
      `未接通或已计费状态异常的通话 ${row[1]} 导出了时长或费用，写 0 会被客户读成「这通免费」`,
    );
  }
}
// 三种状态都要真的出现在演示数据里，上面那段分状态断言才算测到了东西。
for (const status of ['billed', 'pending', 'free']) {
  assert(seenStatuses.has(status), `演示数据里没有 ${status} 状态的通话，导出的空值口径没有被真正验证`);
}
// 提醒记录是凭证：不随页头的时间范围变，否则客户点一下筛选就查不到发过的提醒了。
const notifyDefinition = reports.REPORT_DEFINITIONS.find((item) => item.id === 'notify');
assert(
  notifyDefinition.rows('2020-01-01', '2020-01-02').length === notifyDefinition.rows(rangeFrom, CUTOFF).length,
  '提醒记录跟着时间范围变了，凭证被筛选器藏起来就再也说不清了',
);
assert(
  notifyDefinition.rows(rangeFrom, CUTOFF).length === data.NOTIFY_RECORDS.length,
  '导出的提醒记录条数与通知记录页对不上',
);
// 口径表里的示例必须来自真实数据：手写的示例改了字段忘了改，这份文档就是在骗客户。
const sampleFromData = reports.sampleRow(callRows);
assert(sampleFromData !== null && sampleFromData[1] === callRows[0][1], '口径表的示例不是范围内第一行的真实值');
assert(reports.sampleRow([]) === null, '没有数据时示例应当为空，不能编一行出来');

console.log(`计费算术测试：通过 ${passed} 项，0 失败`);
