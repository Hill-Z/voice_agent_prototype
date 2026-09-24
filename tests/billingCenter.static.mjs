// 计费中心的守卫测试。计费涉及钱，这里锁的不是界面好不好看，而是几条一旦破掉就会让客户看到
// 错误金额的口径：只有一份账、金额向上取整、未计费不显示 0 元、跳转不串号、三列同口径。
// 全部用「读源文件 + 正则取常量」的方式做，不依赖 TypeScript 运行时，
// 但会拿源码里的常量真算一遍，所以改了单价却没同步演示口径一样会被拦下。
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

const engine = read('components/billing/billingEngine.ts');
const data = read('components/billing/billingData.ts');
const ui = read('components/billing/billingUi.tsx');
const overview = read('components/billing/UsageOverview.tsx');
const detail = read('components/billing/CallBillingDetail.tsx');
const stats = read('components/billing/BotBillingStats.tsx');
const flow = read('components/billing/FundFlow.tsx');
const center = read('components/billing/BillingCenter.tsx');
const notify = read('components/billing/NotifyRecords.tsx');
const exportPage = read('components/billing/ReportExport.tsx');
const csv = read('components/billing/billingCsv.ts');
const reports = read('components/billing/billingReports.ts');
const basis = read('components/billing/BillingBasisPanel.tsx');
const preview = read('components/billing/PublishRatePreview.tsx');
const callDetail = read('components/call/CallRecordDetail.tsx');
const botForm = read('components/bot/BotConfigForm.tsx');
const basicConfig = read('components/bot/BotBasicConfig.tsx');
const rateBar = read('components/billing/BotRatePreviewBar.tsx');

// 取「常量名 = 数字」或「字段名: 数字」，用于后面真算一遍。
const constant = (source, name) => {
  const match = source.match(new RegExp(`${name}\\s*[:=]\\s*([0-9_]+)`));
  if (!match) throw new Error(`解析不到常量 ${name}，取值规则可能已失效`);
  return Number(match[1].replace(/_/g, ''));
};

// ---------------- 一、定价规则与整数刻度 ----------------

// 一元 = 100 分 = 1000 厘 = 1000000 微元。三段刻度各管一段（成本用微元、单价用厘、金额用分），
// 少一个刻度就会出现浮点误差，钱不能这么算。
for (const [name, expected] of [['MICRO_PER_YUAN', 1000000], ['MILLI_PER_YUAN', 1000], ['CENTS_PER_YUAN', 100]]) {
  if (constant(engine, name) !== expected) {
    throw new Error(`${name} 应为 ${expected}，实际 ${constant(engine, name)}`);
  }
}

// 定价规则的三个数字必须同时钉住：加价倍数、最低价、取整粒度。
// 客户看到的话术「1 万元套餐含 7500 元话费，按最低档 0.15 元/分钟可打 5 万分钟」全靠这三个数成立。
const PRICE_FLOOR_MILLI = constant(engine, 'priceFloorMilli');
if (PRICE_FLOOR_MILLI !== 150) throw new Error(`最低价应为 150 厘（0.15 元/分钟），实际 ${PRICE_FLOOR_MILLI}`);
if (!/markupRatio:\s*2\b/.test(engine)) throw new Error('加价倍数应为 2（成本 × 2）');
if (!/priceGridMilli:\s*10\b/.test(engine)) throw new Error('取整粒度应为 10 厘（即 0.01 元）');
if (!/version:\s*'v1-A'/.test(engine)) throw new Error('定价规则版本号应为 v1-A，历史通话要靠它复算');
if (!/COST_TABLE_VERSION = 'cost-2026-01'/.test(engine)) throw new Error('成本表版本号应为 cost-2026-01');
// 成本表的生效日必须早于演示数据里最早的通话，否则会出现「一通 3 月的电话按 9 月才生效的价格计费」。
// 这里只校验版本号与生效日的写法，真实日期由 tests 之外的数值探针逐通复算。
if (!/effectiveFrom: '2026-01-01'/.test(engine)) throw new Error('成本参数生效日应为 2026-01-01，不能晚于演示数据里最早的通话');

// ---------------- 二、金额向上取整 ----------------

// 金额 = 向上取整(计费秒数 × 单价厘 ÷ 600)。是向上取整不是四舍五入——
// 客户端按秒计费，任何四舍五入都会让某些秒数的通话少收钱。
// ceilDiv 是唯一的向上取整实现，所以它的**函数体**必须真的是 Math.ceil。
// 只检查名字存在是不够的：把 Math.ceil 改成 Math.round，全站每一笔金额都会变，
// 而当时这条断言（和整份文件其余 300 行）依旧全绿。
// 真正的算术验证在 tests/billingCenter.money.mjs，这里只做一层便宜的护栏。
const ceilDivBody = engine.match(/export const ceilDiv[^;]*;/);
if (!ceilDivBody) throw new Error('缺少 ceilDiv，整数向上取整应有唯一实现');
if (!/Math\.ceil\(/.test(ceilDivBody[0])) {
  throw new Error('ceilDiv 的函数体里没有 Math.ceil —— 向上取整被换成了别的取整方式，全站金额都会变');
}
// 只取到函数自己的那个分号为止。用 [\s\S]*? 配 \n}; 会一路吞到后面几十行，
// 那样后面的函数里出现 Math.round 也会被算到这个名字头上。
const amountBody = engine.match(/export const computeAmountCents[^;]*;/);
if (!amountBody) throw new Error('解析不到 computeAmountCents，函数可能被改名');
if (!amountBody[0].includes('ceilDiv')) throw new Error('computeAmountCents 必须用 ceilDiv 向上取整，不能四舍五入');
if (!amountBody[0].includes('600')) throw new Error('computeAmountCents 的除数应为 600 —— 它编码了「秒 × 厘/分 ÷ 600 = 分」，改这个数等于改计费刻度');
if (/Math\.round/.test(amountBody[0])) throw new Error('computeAmountCents 里出现 Math.round —— 金额只能向上取整');
// 预占用的是同一个 ceilDiv，但除数是 10 不是 600：抄错会把预占算成实收的 60 倍。
const reserveBody = engine.match(/export const computeReserveCents[^;]*;/);
if (!reserveBody) throw new Error('解析不到 computeReserveCents，函数可能被改名');
if (!reserveBody[0].includes('ceilDiv')) throw new Error('computeReserveCents 必须用 ceilDiv');
if (!/\b10\b/.test(reserveBody[0])) throw new Error('computeReserveCents 的除数应为 10（5 分钟 × 厘/分 ÷ 10 = 分），不能抄成 600');

// 费用最低 1 分。向上取整本来就保证了「有通话至少 1 分」，但这条要单独锁住：
// 一旦有人把 ceilDiv 换成 floor，0.4 秒的通话会算出 0 分，等于白打。
if (!/minBillableSec:\s*1/.test(engine)) throw new Error('取整规则里最低计费秒数应为 1 秒');

// ---------------- 三、只有一份账 ----------------

// 逐通通话是唯一的事实来源，月度合计、机器人合计、余额都必须是它的加法结果。
// 一旦有人再写一份「每月通话量」的汇总表，就会出现「概览一个数、明细另一个数」的老问题。
if (!/export const MONTHLY_USAGE[\s\S]{0,200}?\(\(\) =>/.test(data)) {
  throw new Error('MONTHLY_USAGE 必须由逐通通话累加得出，不能另存一份月度汇总');
}
if (/monthSpentCents\([^)]*\)\s*-/.test(data)) {
  throw new Error('出现「月度金额减去明细金额」这类对账补丁 —— 说明又出现了两份账，应当只留逐通一份');
}
if (!/export const RECONCILIATION/.test(data)) throw new Error('缺少 RECONCILIATION，页面上的金额无法自证');
if (!/export const isLedgerChainIntact/.test(data)) throw new Error('缺少余额链校验 isLedgerChainIntact');
// 月度合计只能是「逐通金额的加法」。一旦它去读机器人现在生效的单价（getRateMilli）或重新算一遍价，
// 客户改一次模型配置，几个月的旧账会跟着变——账面上还看不出痕迹。
const monthlyBody = data.match(/export const MONTHLY_USAGE[\s\S]*?\}\)\(\);/);
if (!monthlyBody) throw new Error('解析不到 MONTHLY_USAGE，汇总逻辑可能被改写');
if (/getRateMilli|computeRate|BILLING_RATES/.test(monthlyBody[0])) {
  throw new Error('MONTHLY_USAGE 读了机器人当前生效的价 —— 月度合计必须只累加逐通金额，不能按今天的配置重算');
}
if (!/record\.snapshot\.priceMilli/.test(monthlyBody[0]) && !/record\.snapshot/.test(monthlyBody[0])) {
  throw new Error('MONTHLY_USAGE 应当从每通记录自己的快照里取信息，而不是从机器人当前配置取');
}
// 时长不许为负：额度被前面的通话吃光时后面的只能是 0 秒。负时长会算出负金额，
// 把一笔「退款」混进消费明细里。
if (!/Math\.max\(0,\s*Math\.min\(sec,\s*left\)\)/.test(data)) {
  throw new Error('缺少时长兜底：通话时长必须夹在 0 到剩余额度之间，否则会出现负金额');
}
const ledgerTypes = [...data.matchAll(/type: '([a-z_]+)'/g)].map(([, t]) => t);
if (ledgerTypes.some((t) => t.includes('settle'))) {
  throw new Error(`流水里出现结算类条目（${ledgerTypes.filter((t) => t.includes('settle')).join(',')}）—— 每通通话只应有一条扣费记录`);
}

// 演示口径：3 月 6 路、4 月增购 1 路，两批合计 7 路、7 万元，额度 5.25 万元。
//
// 这三个数必须由「路数」推出来，不能各自写死：客户加买 1 路时只改路数，
// 额度与套餐总额要跟着走。写死了就成了三个互不相干的数字，改一个漏两个。
const concurrency = constant(data, 'PURCHASED_CONCURRENCY');
if (concurrency !== 7) throw new Error(`已购并发应为 7 路，实际 ${concurrency}`);
const perConcurrencyPrice = constant(data, 'PACKAGE_PRICE_PER_CONCURRENCY_CENTS');
if (perConcurrencyPrice !== 1000000) throw new Error(`单路并发 1 年的套餐价应为 1000000 分（1 万元），实际 ${perConcurrencyPrice}`);
const perConcurrencyGrant = constant(data, 'GRANT_CENTS_PER_CONCURRENCY');
if (perConcurrencyGrant !== 750000) throw new Error(`单路并发的映射额度应为 750000 分（7500 元），实际 ${perConcurrencyGrant}`);
const talkFeeCents = constant(data, 'TALK_FEE_CENTS');
if (talkFeeCents !== concurrency * perConcurrencyGrant) {
  throw new Error(`映射额度应为「路数 × 单路额度」= ${concurrency * perConcurrencyGrant} 分，实际 ${talkFeeCents} —— 额度不再跟着路数走`);
}
if (constant(data, 'PACKAGE_TOTAL_CENTS') !== concurrency * perConcurrencyPrice) {
  throw new Error('套餐总额应为「路数 × 单路套餐价」，否则客户加买并发时总额不会跟着变');
}
// 折算分钟数只在编辑页的单价条上用，且必须写明是按最低档估的。
const purchasedMinutes = talkFeeCents / 100 / (PRICE_FLOOR_MILLI / 1000);
if (purchasedMinutes !== 350000) {
  throw new Error(`52500 元按 ${PRICE_FLOOR_MILLI / 1000} 元/分钟应折出 350000 分钟，实际 ${purchasedMinutes} —— 单价或套餐金额被改过，对外话术要一起改`);
}

// ---------------- 四、没计费的通话不能显示成 0 元 ----------------

// 「0.00 元」读起来是「这通免费」，而待定价其实是「暂不扣费、定价后补扣」，两者对客户是两件事。
if (detail.includes("'0.00 元'")) throw new Error('明细表把未计费的通话显示成了 0.00 元');
if (!detail.includes("'—'")) throw new Error('未计费的通话应留白（—），而不是填一个金额');
// 待定价的原因必须读记录里冻结下来的那一份（billingMissing），不能读机器人现在的配置。
// 机器人补齐配置之后，读当前配置会把「当时缺什么」改写成「今天缺什么」，
// 客户回头再看这通电话，看到的原因就是假的。
if (!detail.includes('row.record.billingMissing')) {
  throw new Error('明细表没有从记录里取待定价原因，会拿机器人今天的配置解释当时的「算不出价」');
}
if (detail.includes('getPendingReason')) {
  throw new Error('明细表又去读机器人当前的待定价原因了 —— 历史记录必须保留当时的判定依据');
}
if (!data.includes('billingMissing: getPendingReason')) {
  throw new Error('待定价的缺失项必须在计费发生的那一刻写进记录，否则事后无从追溯');
}
if (!/pending:\s*pendingReasons\.length/.test(detail)) throw new Error('「算不出价」这条路径没有被接上，BillingBasisPanel 的 pending 分支会是死代码');
if (!basis.includes('算不出费率')) throw new Error('依据面板缺少「算不出费率」的说明文案');
if (!basis.includes('自动补扣')) throw new Error('依据面板的「算不出费率」里要说明会补扣，否则客户以为这通永远不收费');

// 明细与统计不再各设一套月份，统一接页首的起止日期。
if (!/const CallBillingDetail: React\.FC<Props> = \(\{ from, to,/.test(detail) || !/row\.startedAt\.slice\(0, 10\)/.test(detail)) {
  throw new Error('逐通明细没有使用页首时间范围');
}
if (!/const BotBillingStats: React\.FC<Props> = \(\{ from, to \}\)/.test(stats) || !/usageInRange\(/.test(stats)) {
  throw new Error('机器人和月份统计没有使用页首时间范围');
}
if (!/from=\{from\}[\s\S]*?to=\{to\}[\s\S]*?<BotBillingStats from=\{from\} to=\{to\}/.test(center)) {
  throw new Error('消费两个视图没有收到同一个时间范围');
}

// ---------------- 五、跳转不串号 ----------------

// 从计费中心跳到通话记录时，如果通话记录里没有这一通的详情，页面会回落到示例通话——
// 那种情况下显示的时长和内容都属于另一通电话，金额必须一起藏起来。
if (!callDetail.includes('detailMatchesRequest')) {
  throw new Error('通话详情页缺少「详情是否真的是这一通」的判断，会把别的通话的金额显示出来');
}
if (!/\{!detailMatchesRequest && \(/.test(callDetail)) {
  throw new Error('详情页回落到示例通话时，应当明说「这里不显示金额」而不是默默少一行');
}

// ---------------- 六、余额要拆开说，折算分钟数下线 ----------------

// 折算出来的分钟数（「按最低档 0.15 元/分钟还能打多久」）不许再出现在面客的余额与汇总页上。
// 单价是动态的：今天折算出 28 万分钟，明天调价就变成 19 万，而客户会拿第一次看到的数去对。
// 余额、已用、汇总都是金额口径，客户能自己核对；折算出来的分钟数只能误导。
for (const [name, source] of [['余额与额度', overview], ['计费中心首页', center]]) {
  for (const ratio of ['PURCHASED_MINUTES_AT_BASE_RATE', 'USED_MINUTES_AT_BASE_RATE', 'REMAINING_MINUTES_AT_BASE_RATE']) {
    if (source.includes(ratio)) {
      throw new Error(`${name} 又出现了折算分钟数（${ratio}）—— 单价是动态的，折算值会让客户拿去对不上账`);
    }
  }
  // 「话费」这个词在余额语境下是错的：余额是语音智能体的余额，不是话费。
  // 话费是运营商的概念，客户会以为这是要充到手机号里的钱。
  // 只拦这几个组合，不拦「不是话费」这种澄清句——那句话正是要用来说清这件事的。
  for (const wrong of ['话费余额', '含话费', '剩余话费', '已用话费', '话费明细', '套餐话费']) {
    if (source.includes(wrong)) throw new Error(`${name} 出现了「${wrong}」—— 余额是语音智能体的余额，不是话费`);
  }
}

// 余额必须拆成成分展示：随套餐给的映射额度（有有效期）与客户单独充的钱（无限期）性质不同，
// 只给一个总额，客户问「哪部分要到期了」页面答不上来。
if (!overview.includes('BILLING_GRANT_BALANCES')) {
  throw new Error('余额与额度页没有列出额度批次，客户看不出哪一笔额度什么时候到期');
}
if (!overview.includes('BALANCE_COMPOSITION')) {
  throw new Error('余额与额度页没有给出余额构成，代金券额度与单独充值混成了一个数');
}
// 批次明细必须真的遍历出来，不能只把常量引进来了事。
// 列表顺序必须是数据层给的扣费顺序（grantsByConsumeOrder），不能是页面自己 sort 的结果：
// 页面上一旦有第二个排序，两处迟早给出不同的「先扣哪笔」，客户就会照着一份错的顺序去对账。
if (!/grantsByConsumeOrder\(\)/.test(overview) || !/sortedGrants\.map\(/.test(overview)) {
  throw new Error('余额与额度页没有按数据层给的扣费顺序遍历额度批次，批次明细是空的或顺序是另排的');
}
// 批次顺序与分摊规则只应有一处实现（数据层的 compareGrants / allocateAcrossGrants），
// 页面自己再排一遍、再分一遍，两处迟早给出不同的「先扣哪笔」。
if (!data.includes('compareGrants')) throw new Error('数据层缺少批次顺序的排序规则，页面会各自排各自的');
if (!data.includes('allocateAcrossGrants')) throw new Error('数据层缺少按批次分摊扣费的实现');
// 当前有效并发必须由购买批次与有效期计算，不能直接把历史已购数量写在页面上。
if (!overview.includes('ACTIVE_CONCURRENCY') || !overview.includes('ALLOCATED_CONCURRENCY') || !overview.includes('BILLING_PACKAGES.map')) {
  throw new Error('并发这张表要同时给出「已购」和「已分配」，否则看不出还能再分配几路');
}
if (!center.includes('ACTIVE_CONCURRENCY') || !center.includes('当前可用并发')) {
  throw new Error('当前可用并发没有与余额一起显示在计费中心页首');
}

// 今日 / 昨日 / 最近 7 天必须真的是三份数据，不能只是一个点了没反应的开关。
for (const field of ['peakToday', 'peakYesterday', 'peakWeek', 'throttledToday', 'throttledYesterday', 'throttledWeek']) {
  if (!data.includes(field)) throw new Error(`BillingRobotProfile 缺少 ${field}，时间范围切换会变成空操作`);
}
if (!overview.includes('rangeField(')) throw new Error('并发表没有按时间范围取值，切换开关不会改变数字');

// ---------------- 七、计费中心的界面零件只有一份 ----------------

// 四个页面各写一遍 Panel / TH / TD / 金额格式，改一处样式就会剩下三处对不上。
for (const [name, source] of [['UsageOverview', overview], ['BotBillingStats', stats], ['BillingCenter', center], ['CallBillingDetail', detail], ['FundFlow', flow], ['NotifyRecords', notify], ['ReportExport', exportPage]]) {
  if (/const (Panel|TH|TD|yuan)\b/.test(source)) {
    throw new Error(`${name} 又自己定义了一份界面零件（Panel/TH/TD/yuan），应统一用 billingUi.tsx`);
  }
}
if (!/export const Panel/.test(ui) || !/export const yuan/.test(ui)) {
  throw new Error('billingUi.tsx 应当导出共用零件（Panel / yuan）');
}

// ---------------- 八、发布价格只算一次、快照真的被读 ----------------

// 预览价和发布时冻结的快照必须是同一个计算结果，两处各算一遍迟早会分叉成「预览一个价、扣费另一个价」。
if (!botForm.includes('nextRateResult')) throw new Error('发布流程没有把算价结果收成一份，预览与快照可能各算一遍');
if (botForm.includes('const rateResult = computeRateForBot')) throw new Error('发布时又独立算了一遍价，应与预览共用同一个结果');
if (preview.includes('computeRateForBot')) throw new Error('发布预览应当接收算好的结果，而不是自己再算一遍');
// 冻结的快照必须有人读，否则「发布时的价」只写不读，快照形同虚设。
if (!preview.includes('billingRateSnapshot')) throw new Error('发布页面没有读发布快照，客户端看不到「现在生效的价」');
// 而且发布时必须真的把它写回配置。只读不写的话，第一次发布之后永远是「没有生效价格」。
if (!botForm.includes('billingRateSnapshot:')) throw new Error('发布流程没有把算出的费率写回配置，快照永远建不起来');
// 算不出价时不覆盖旧快照：否则配置里会留下一个 0 元单价冒充价格，历史通话也没法自证。
if (!/billingRateSnapshot:\s*nextRateResult\.accuracy === 'priced'/.test(botForm)) {
  throw new Error('发布时未判断「算得出价」就写快照，会把 0 元单价留在配置里');
}

// ---------------- 八之二、逐通快照真的是一份独立副本 ----------------

// 每通电话必须拿一份自己的快照副本。直接引用机器人级那个共享对象的话，
// 以后改一行配置就会连带改掉所有历史通话的单价和金额，而账面上什么都看不出来。
if (!/captureSnapshotAt\(rate,\s*input\.startedAt\)/.test(data)) {
  throw new Error('逐通通话没有拷贝自己的快照副本，历史金额会随配置一起变');
}
if (!/export const captureSnapshotAt/.test(engine)) throw new Error('缺少 captureSnapshotAt，逐通冻结没有实现');
const captureBody = engine.match(/export const captureSnapshotAt[^;]*;/);
if (!captureBody) throw new Error('解析不到 captureSnapshotAt，逐通冻结可能被改写');
for (const field of ['asr', 'tts', 'llm']) {
  if (!new RegExp(`${field}:\\s*\\{\\s*\\.\\.\\.rate\\.${field}`).test(captureBody[0])) {
    throw new Error(`captureSnapshotAt 没有逐层复制 ${field} —— 嵌套对象共享引用，改配置会连带改掉历史金额`);
  }
}
// 快照的编号依赖时刻、指纹不依赖时刻：同一份配置打一万通电话是同一个指纹，
// 这样才能用指纹判断「这两通的价是不是同一套配置算出来的」。
if (!/snapshotId:\s*hashSnapshot\(`\$\{hash\}/.test(engine)) {
  throw new Error('快照编号应由「配置指纹 + 时刻」推出，不能是随机数');
}
const hashInput = engine.match(/const hash = hashSnapshot\(\s*JSON\.stringify\(\{([\s\S]*?)\}\),\s*\);/);
if (!hashInput) throw new Error('解析不到配置指纹的输入，指纹规则可能被改写');
if (/computedAt|snapshotId/.test(hashInput[1])) {
  throw new Error('配置指纹里混进了时刻 —— 同一份配置每次算都会得到不同指纹，「同一输入同一输出」不再成立');
}
if (!/costPerMinMicro|priceMilli|priceListMicro/.test(hashInput[1])) {
  throw new Error('配置指纹里应当包含算出来的价 —— 否则换了成本参数却还是同一个指纹');
}
// 调用方给了时刻就必须用调用方给的，不能在函数内部取当前时间：否则预览算出来的编号
// 和发布时冻结下来的编号永远对不上，客户拿编号回查会对不到同一份依据。
if (!/const computedAt = input\.computedAt \|\|/.test(engine)) {
  throw new Error('费率计算没有优先采用调用方传入的时刻，预览价与发布价会对不上');
}

// ---------------- 九、两个同名 formatRate 不能复活 ----------------

// billingEngine 的 formatRate 返回「元/分钟」，reportUi 的 formatRate 返回百分比，语义相反。
// 计费侧已改名 formatPricePerMin，不能再改回去。
if (!/export const formatPricePerMin/.test(engine)) throw new Error('计费侧的单价格式化应为 formatPricePerMin');
if (/export const formatRate/.test(engine)) {
  throw new Error('billingEngine 又导出了 formatRate，与 reportUi 的同名函数语义相反，必须叫 formatPricePerMin');
}

// ---------------- 十、面客页面不出现内部术语 ----------------

// 客户看不懂 token、加价、快照编号这类内部说法。内部视角在 BillingBasisPanel 里，勾选后才展开。
// 所以这三个面客页面里一个都不能出现；发布预览和通话详情也是纯面客的，同样不许出现。
for (const [name, source] of [
  ['余额与额度', overview],
  ['资金流水', flow],
  ['通话消费明细', detail],
  ['消费统计', stats],
  ['计费中心首页', center],
  ['通知记录', notify],
  ['报表导出', exportPage],
  ['发布价格预览', preview],
  ['通话记录详情', callDetail],
  ['编辑页单价条', rateBar],
]) {
  for (const jargon of ['预估冻结金额', '今日被限流', '加价', '快照编号', 'token', '成本价']) {
    if (source.includes(jargon)) throw new Error(`${name} 出现了内部术语「${jargon}」，应换成客户看得懂的说法`);
  }
}

// 依据面板是唯一允许出现「加价」的地方，但它必须被开关挡住：默认关闭，勾选后才展开。
// 少了这道闸，客户打开「为什么这个价」就直接看到平台的成本与加价倍数。
// 断言的必须是**客户看得见的那个标签**。之前断言的是「内部视角」四个字，
// 而开关上写的已经改成「平台内部视图」，这四个字只剩在文件注释里——
// 也就是说把标签改成任何东西这条断言都还是绿的，等于没锁。
if (!basis.includes('平台内部视图')) throw new Error('依据面板缺少内部视图开关，成本与加价会直接暴露给客户');
if (!/\{internal \? \(/.test(basis)) throw new Error('依据面板的内部视角没有被开关挡住，成本明细会直接渲染出来');
if (!/useState\(false\)/.test(basis)) throw new Error('依据面板的内部视角应默认关闭');

// 未接通的通话不能用「不计费」这种含糊说法：客户看不出是「没接通所以不收费」还是「平台给免了」。
for (const [name, source] of [['用量与余额', overview], ['通话消费明细', detail], ['依据面板', basis], ['通话详情', callDetail]]) {
  if (/"不计费"|'不计费'|>不计费</.test(source)) {
    throw new Error(`${name} 用了「不计费」，应写清是「未接通不计费」`);
  }
}

// 自定义日期也须从逐通记录聚合，不能用整月数据冒充所选时间的消费。
if (!stats.includes('BILLING_CALL_ROWS.filter') || !stats.includes('usageInRange(from')) {
  throw new Error('消费统计没有按页首日期从逐通记录汇总');
}
if (stats.includes('最近 3 个月') || detail.includes('全部月份')) {
  throw new Error('消费页又出现了第二套时间范围');
}

// 明细表的合计与筛选范围必须自洽：合计只算已计费的通话，未计入的要单独报数。
if (!/已计费 \{[\s\S]{0,60}?\} 通合计/.test(detail)) throw new Error('明细表合计没有说明「只算已计费的通话」');
if (!detail.includes('未计入')) throw new Error('明细表要单独报出未计入合计的通话数，否则合计看起来是少算了');

// ---------------- 十一、编辑页的单价条和发布弹窗必须是同一个价 ----------------

// 编辑页那条「当前配置单价」和发布弹窗里的卡片，都由机器人表单算一次传下来。
// 编辑页要是自己再调一次计价引擎，两处的输入一旦有细微差别（比如一个带了版本号、
// 一个没带），客户就会看到「编辑页 0.39、发布弹窗 0.22」这种当场打脸的场面。
if (!botForm.includes('rateResult={nextRateResult}')) {
  throw new Error('机器人表单没有把算好的价传给基础配置页，编辑页的单价条会自己再算一遍');
}
if (basicConfig.includes('computeRateForBot')) {
  throw new Error('基础配置页自己调了计价引擎 —— 编辑页与发布弹窗必须共用同一个算价结果');
}
if (!basicConfig.includes('BotRatePreviewBar')) throw new Error('基础配置页缺少单价只读条');
// 算不出价时不能显示 0.00 元/分钟，也不能编一个价出来。
if (!rateBar.includes('当前配置暂无价格')) throw new Error('单价条在算不出价时没有明说「暂无价格」');
if (!rateBar.includes("accuracy !== 'priced'")) throw new Error('单价条没有区分「算得出价」和「算不出价」两种情况');
// 单价条上的「约可通话多少分钟」是编辑页选价时的参考（旁边就写着这个价），
// 与余额页的折算分钟数不是一回事：余额页那种折算已经下线了，这里保留。
// 但折算的分子必须取映射额度总额，不能在这里另写一个 7500。
if (!rateBar.includes('TALK_FEE_TOTAL_CENTS')) {
  throw new Error('单价条的「约可通话多少分钟」没有用映射额度总额折算，会与套餐金额对不上');
}
// 金额本身也必须从套餐数据取。
// 只匹配 \b7500\b 是抓不到「7,500」的——带千分位逗号的写法会让这条断言恒真，
// 而页面上写的正是「7,500 元」。所以先去掉逗号再匹配，数字和中文两种写法都拦。
const rateBarPlain = rateBar.replace(/,/g, '');
if (/7500|750000|10000/.test(rateBarPlain)) {
  throw new Error('单价条里硬编码了套餐金额 —— 应从套餐数据取，否则改了套餐这里不会跟着变');
}
if (/1\s*万元/.test(rateBar)) {
  throw new Error('单价条里硬编码了套餐金额（1 万元）—— 应从套餐数据取');
}
if (!rateBar.includes('BILLING_PACKAGES')) {
  throw new Error('单价条的套餐金额没有从 BILLING_PACKAGES 取，改了套餐这句话不会跟着变');
}

// ---------------- 十二、资金流水页（充值记录 / 扣费记录） ----------------

// 充值记录、扣费记录、报表都得有——这三样是客户对账的入口，缺一样就没法自己核对。
// 这一页必须是同一本账的两种视角（子页签），不能各写一套数据源。
for (const label of ['额度到账', '扣费记录']) {
  if (!flow.includes(label)) throw new Error(`资金流水页缺少「${label}」，客户无法逐笔核对`);
}
if (!/fundFlowInRange\(/.test(flow)) throw new Error('资金流水页没有走数据层的 fundFlowInRange，会另起一套取数逻辑');
if (!data.includes('export const fundFlowInRange')) throw new Error('数据层缺少资金流水的取数函数');

// 每一行必须带期初和期末余额：只给一个金额，客户没法把这笔和余额对上。
for (const column of ['期初余额', '期末余额']) {
  if (!flow.includes(column)) throw new Error(`资金流水页缺少「${column}」列，这一笔和余额对不上`);
}
// 期初必须由「期末 − 这笔金额」反推，不能另存一份：存两份迟早各走各的，
// 而页面上还看不出哪一份是错的。
if (!data.includes('entry.balanceAfterCents - entry.amountCents')) {
  throw new Error('期初余额不是由期末反推的，说明又存了第二份余额，两处会对不上');
}
// 预占与释放也动余额，必须给它们中文名，否则客户在「全部」里看到两笔无名的一进一出。
for (const label of ['通话前预占', '预占释放']) {
  if (!ui.includes(label)) throw new Error(`流水类型缺少「${label}」的说法，客户会看到两笔没有名字的进出`);
}
// 扣减来源必须能指回批次；指不回去就说明流水和批次两张表已经脱钩。
if (!flow.includes('grantBalance.grant.title')) throw new Error('扣费记录没有写出这笔钱从哪个额度批次扣的');
// 跨批次的扣费要标出来，只说第一段会让客户按批次名去核对时对不上金额。
if (!flow.includes('allocationCount')) throw new Error('扣费记录没有说明一笔扣费跨了几个批次');

// 「多少通通话、多少智呼的时长」是客户点名要的两个数：只给合计等于没回答。
// 按机器人和按月份两张表都要把智呼那一份单独列出来，且通数与时长成对给。
if (!stats.includes('其中智呼')) throw new Error('消费统计没有「其中智呼」这一列，客户问的两个数只答了一个');
if (!stats.includes('outboundCalls')) throw new Error('消费统计没有按机器人统计智呼，只剩一个合计');
if (!data.includes('monthOutboundMinutes')) throw new Error('数据层缺少按月的智呼时长，按月那张表给不出智呼');
if (!overview.includes('智呼')) throw new Error('余额与额度页的「费用怎么算」没有说明智呼与总通话数的关系');

// ---------------- 十三、信用额度、欠费提醒与报表导出 ----------------

// 这一节的算术验证在 billingCenter.money.mjs 第 21 节，这里只锁「接没接上」：
// 授信这条路径、提醒这三档、导出这五张表，任何一样只写在数据层没挂到页面上，
// 客户就等于没有这个功能，而页面看起来一切正常。

// 13.1 账面余额不许含授信，可用额度才含。
// 这两个数混起来是这类页面最容易犯也最难被发现的错：把授信加进余额，客户会看到
// 一笔自己从没充过的余额，而「余额不足」的提示再也不会出现——那正是他最需要被提醒的时候。
if (!/const balanceCents = voucherCents \+ cashCents;/.test(data)) {
  throw new Error('账面余额不再是「代金券 + 单独充值」，授信被算进了余额，客户账上会凭空多一笔钱');
}
if (!/availableCents: balanceCents \+ creditAvailableCents - frozenCents,/.test(data)) {
  throw new Error('可用额度不再等于「账面余额 + 可用授信 − 预占中」，授信要么用不了要么算了两次');
}
// 授信不是批次：它没有余额可动。真去动批次余额，批次剩余之和就与账户余额对不上了。
if (!/if \(part\.grantId === CREDIT_GRANT_ID\) return;/.test(data)) {
  throw new Error('授信那段分摊被真的落到了批次余额上，批次剩余之和会与账户余额分叉');
}
// 授信必须垫在自有资金之后：代码里那段必须写在自有批次循环之后，顺序反了就是逼客户先欠钱。
const allocateBody = data.match(/export const allocateAcrossGrants[\s\S]*?\n};/);
if (!allocateBody) throw new Error('解析不到 allocateAcrossGrants，扣费顺序可能被改写');
if (!/for \(const item of usable\)[\s\S]*creditAvailableCents > 0/.test(allocateBody[0])) {
  throw new Error('授信垫付没有排在自有额度之后，会先把客户的钱剩着、先让他欠钱');
}
// 授信不够时必须报错：这时这笔钱无论如何都扣不出来，默默记一笔对不上任何出处的扣费危险得多。
if (!/仍不足，还差/.test(allocateBody[0])) {
  throw new Error('授信也不够时没有抛错，会记下一笔扣不到钱的流水');
}
// 授信要有开通、有效期、关闭三个状态，缺了「关闭」就演示不出「未开通信用额度」这件事。
for (const field of ['totalCents', 'grantedAt', 'expiresAt', 'status']) {
  if (!new RegExp(`export interface CreditLine[\\s\\S]*?${field}`).test(read('types.ts'))) {
    throw new Error(`CreditLine 缺少 ${field}，授信的有效期或开关就表达不出来`);
  }
}
if (!/export const CREDIT_LINE/.test(data)) throw new Error('数据层没有开通信用额度，页面上那条「能欠多少」无处可取');

// 13.2 欠费提醒：三档规则、至少两种提醒方式、一份留痕的记录。
const alertTiers = [...data.matchAll(/tier: '(threshold|exhausted|debt)'/g)].map((match) => match[1]);
for (const tier of ['threshold', 'exhausted', 'debt']) {
  if (!alertTiers.includes(tier)) {
    throw new Error(`缺少提醒档位 ${tier}，余额不足 / 已用尽 / 已欠费这三件事有一件不会提醒客户`);
  }
}
// 「提醒方式至少两种」是客户点名要的：只有一种渠道，客户换了工作流就收不到。
for (const channel of ['email', 'sms']) {
  if (!new RegExp(`channels:[\\s\\S]{0,120}?${channel}`).test(data)) {
    throw new Error(`提醒方式缺少 ${channel}，客户收不到就没法及时充值`);
  }
}
if (!/export interface NotifyRecord/.test(data)) throw new Error('数据层缺少提醒记录的形态，发过什么就查不到了');
// 提醒记录必须是空数组起步，不许为了「页面好看」编几条假记录——
// 编出来的提醒记录是一条伪造的账务事实，客户会拿它当凭证。
if (!/export const NOTIFY_RECORDS: NotifyRecord\[\] = \[\];/.test(data)) {
  throw new Error('提醒记录不再是空数组起步，演示数据里出现了凭空编造的提醒记录');
}
// 三档并不能都关：前两档是事实，不是偏好。都能关的话，客户可以关掉「已经欠费」的提醒。
if (!/configurable: false/.test(data)) throw new Error('提醒的三档都能关闭，客户会关掉「已欠费」这类必须知道的提醒');
// 提醒记录页必须直读 NOTIFY_RECORDS，不能跟着页头的时间范围筛：
// 它是凭证，点一下筛选就查不到发过的提醒，客户说没收到时平台就答不上来了。
if (!/NOTIFY_RECORDS\.map\(/.test(notify)) throw new Error('通知记录页没有逐条列出提醒记录，这一页是空的');
if (/fundFlowInRange|usageInRange|rechargeInRange/.test(notify)) {
  throw new Error('通知记录页跟着时间范围筛了，凭证被筛选器藏起来就再也说不清');
}
// 提醒文案里的数必须是占位符，不能把演示余额写死在模板里：
// 写死了，真实触发时短信里会带着一个别人的余额发给客户。
if (!/\{账户名\}|\{账面余额\}|\{预警值\}/.test(data)) {
  throw new Error('提醒文案里没有占位符，实际发的短信会带着一份写死的演示余额');
}
// 提醒只是为了通知，不能顺手替客户充钱——那是一个没有授权的扣款动作。
if (!/不会自动增加额度/.test(notify)) throw new Error('通知记录页没有说明提醒不会自动增加额度');

// 13.3 报表导出：五张报表、字段口径、每一列都从同一份数据来。
for (const id of ['recharge', 'call_charge', 'calls', 'stats', 'notify']) {
  if (!new RegExp(`id: '${id}'`).test(reports)) throw new Error(`报表清单缺少 ${id}，客户少一个对账入口`);
}
// 报表明细页必须从 REPORT_DEFINITIONS 遍历出来，不能把五张表再抄一遍到页面上。
if (!/REPORT_DEFINITIONS\.map\(/.test(exportPage)) {
  throw new Error('报表导出页没有遍历报表定义，页面上的报表与数据层会各有一份清单');
}
// 每一列是什么、怎么算的，必须写在客户看得见的地方——对不上账时他得能自己查。
for (const column of ['单位', '含义', '计算口径', '表头']) {
  if (!exportPage.includes(column) && !reports.includes(column)) {
    throw new Error(`报表缺少「${column}」这一项，客户对不上账时查不到口径`);
  }
}
// 导出的行必须来自页面上同一份数据：导出自己再查一遍库、再算一遍，
// 屏幕上和文件里迟早不一样，而客户是拿着文件来对账的。
if (!/fundFlowInRange\(/.test(reports)) throw new Error('导出没有复用页面的取数函数，两边会各算一份');
if (/computeAmountCents|BILLING_LEDGER\.filter/.test(reports)) {
  throw new Error('导出自己又算了一遍金额或流水，与页面上看到的不是同一份账');
}
// 导出的 CSV 必须走 billingCsv：页面自己拼字符串，BOM、转义、公式防护三样迟早漏一样。
if (!/toCsv\(/.test(exportPage) || !/downloadCsv\(/.test(exportPage)) {
  throw new Error('报表导出没有走 billingCsv 的生成与下载，转义和 BOM 会各处写一份');
}
if (/join\(','\)|\.replace\(\/"\/g/.test(exportPage)) {
  throw new Error('报表导出页自己拼了 CSV 字符串，转义规则会分叉成两份');
}
// BOM 与 CRLF 是「用 Excel 打开不乱码、不错行」的前提，两条都必须真的在 toCsv 里。
if (!csv.includes('﻿')) throw new Error('toCsv 里没有 BOM，中文 CSV 用 Excel 打开是乱码');
if (!csv.includes(String.raw`join('\r\n')`)) throw new Error('toCsv 的行尾不是 CRLF，Windows 上打开会挤成一行');
// 公式注入防护：导出的是别人的数据，以 = + @ 开头会被 Excel 当公式在客户机器上执行。
if (!/\^\[=\+@\]\//.test(csv)) throw new Error('CSV 单元格没有做公式注入防护，导出的数据会在客户电脑上被当公式执行');
// 金额导出成纯数字：带千分位或货币符号，Excel 会当文本，客户连求和都做不了。
if (/toLocaleString/.test(csv)) throw new Error('导出的金额带了千分位，在 CSV 里会被切成两列');
// 一次导出留一条痕：账务数据出域必须有记录。
if (!/exportedAt/.test(exportPage) || !/operator/.test(exportPage)) {
  throw new Error('导出记录没有记下时刻与操作人，谁把数据导走了永远答不上来');
}
// 导出范围跟着页面顶部那一个控件：同一屏上两个范围各说各的，客户不知道哪个才算数。
if (!/from: string;\s*\n\s*to: string;/.test(exportPage) || !/<ReportExport from=\{from\} to=\{to\} \/>/.test(center)) {
  throw new Error('报表导出页的范围不是从页面顶部传下来的，会出现两个各说各话的时间范围');
}

// 13.4 主导航按客户的查账路径组织；详情、统计和提醒记录从对应页面切换。
for (const [label, component] of [['账户', 'UsageOverview'], ['套餐', 'UsageOverview'], ['消费', 'CallBillingDetail'], ['流水', 'FundFlow'], ['提醒', 'NotifyRecords'], ['下载', 'ReportExport']]) {
  if (!center.includes(label)) throw new Error(`计费中心缺少「${label}」入口，客户点不到这一块`);
  if (!new RegExp(`<${component}\\b`).test(center)) {
    throw new Error(`「${label}」入口没有挂上面板（${component}）`);
  }
}
if (!center.includes('逐通明细') || !center.includes('按机器人和月份统计') || !center.includes('发送记录')) {
  throw new Error('消费或提醒页面缺少子视图，客户无法按用途切换');
}

// ---------------- 十四、客户动作入口与到期提醒（第八轮新增） ----------------
// 这一节锁的是「承诺与能力必须对得上」：提醒文案里写了「请及时充值」，页面上就必须真有一个
// 能充值的地方；自动充值里写了「不能用于自动充值」，下拉里就不能出现它。这两类不一致
// 是客户最容易撞上的坑，且在代码里看不出来——只有把两处放在一起比才会暴露。

const recharge = read('components/billing/RechargePanel.tsx');
const packageActions = read('components/billing/PackageActionsPanel.tsx');

// 14.1 充值方式的可代扣标记必须与数据层一致，且必须真的存在一个可代扣的方式。
// 只取 RECHARGE_METHODS 这一段——全文件里的 `id: '` 到处都是，取错了就什么都没锁住。
const methodsSection = data.slice(
  data.indexOf('export const RECHARGE_METHODS'),
  data.indexOf('export const RECHARGE_PRESET_CENTS'),
);
// 按 `id: '` 切开，每一段正好是「这条方式自己的字段」——不会串到下一条去。
const methodChunks = methodsSection.split(/id: '/).slice(1);
const methodIds = methodChunks.map((chunk) => chunk.slice(0, chunk.indexOf('\'')));
for (const id of ['online', 'transfer', 'manager']) {
  if (!methodIds.includes(id)) throw new Error(`充值方式少了 ${id}，客户少一条付款路径`);
}
// 对公转账与客户经理代充没有代扣授权，系统无法自己发起汇款，必须标 autoRecharge: false。
// 标错不会报错，只会在客户选了它之后「自动充值不生效」——这种错最难查。
for (const [id, expected] of [['online', true], ['transfer', false], ['manager', false]]) {
  const index = methodIds.indexOf(id);
  if (index === -1) continue;
  const chunk = methodChunks[index];
  const flag = new RegExp(`autoRecharge: ${expected}\\b`);
  if (!flag.test(chunk)) {
    throw new Error(`充值方式「${id}」的 autoRecharge 应为 ${expected}，实际的代扣能力标错了`);
  }
}
// 到账时间必须逐条写出来：客户汇完款、余额没变的那几个小时里，这句话是他唯一的解释。
for (const chunk of methodChunks) {
  if (!/settle: '[^']+'/.test(chunk)) throw new Error('有充值方式没写「多久到账」，到账前客户会以为钱丢了');
}
// 自动充值的扣款方式必须是支持代扣的那一个，不能在页面上另选一个不支持代扣的。
if (!/method: 'online'/.test(data)) {
  throw new Error('自动充值的扣款方式不是支持代扣的在线支付，扣款会失败或悄悄不生效');
}
if (!/唯一支持代扣的方式/.test(recharge)) {
  throw new Error('自动充值区块没有说明「只有在线支付能代扣」，客户会以为三种方式都能自动充');
}

// 14.2 自动充值的三件套与两条硬约束必须真的在页面上被校验。
// 只把「每月最多」写出来而不校验阈值与目标的差值，「低于阈值 → 充到目标」会在同一秒反复成立。
for (const [pattern, why] of [
  [/AUTO_RECHARGE_LIMITS/, '自动充值没有引用数据层的硬约束常量，下限会各处写一份'],
  [/minTargetOverThresholdCents/, '「充到」与「低于」的差值没有校验，会被配成反复触发'],
  [/validateAuto/, '自动充值没有即时校验函数，配错了要等到扣款时才知道'],
  [/maxPerDay/, '每 24 小时的次数上限没有出现在页面上，客户不知道有一道闸门'],
]) {
  if (!pattern.test(recharge)) throw new Error(`自动充值：${why}`);
}
// 次数上限是硬上限，页面上不能给它一个可编辑的输入框——它防的是「阈值被反复击穿 → 连续扣款」。
if (/setAuto\(\{[^}]*maxPerDay/.test(recharge) || /value=\{auto\.maxPerDay\}/.test(recharge)) {
  throw new Error('每 24 小时的次数上限被做成了可编辑输入框，这道闸门等于没有');
}
// 默认必须是关闭的。它是一个会自己花钱的开关，默认打开等于替客户做了一个他没做过的决定。
if (!/export const AUTO_RECHARGE_SETTINGS[\s\S]{0,120}?enabled: false/.test(data)) {
  throw new Error('自动充值默认不是关闭的，客户会被一个他没开过的开关扣款');
}

// 14.3 到期提醒是第四档，且必须真的存在、且不能被关掉。
const expiryTierDays = data.slice(data.indexOf('export const EXPIRY_TIER_DAYS'), data.indexOf('export const EXPIRY_TIER_DAYS') + 400);
for (const days of [30, 7, 1]) {
  if (!new RegExp(`days: ${days}\\b`).test(expiryTierDays)) {
    throw new Error(`到期提醒少了「提前 ${days} 天」这一档，客户会少一次反应机会`);
  }
}
// 7 天与 1 天是默认开的，30 天是可选的：默认全开会变成噪音，默认全关等于没有这一档。
if (!/days: 7, optional: false, defaultOn: true/.test(expiryTierDays) || !/days: 1, optional: false, defaultOn: true/.test(expiryTierDays)) {
  throw new Error('到期提醒的 7 天 / 1 天不是默认开启，这一档等于没做');
}
if (!/days: 30, optional: true, defaultOn: false/.test(expiryTierDays)) {
  throw new Error('到期提醒的 30 天档不是「可选、默认关」，默认发就成了噪音');
}
// 「额度即将到期」在提醒档位里必须存在且不可关闭：它是事实，不是偏好。
if (!/tier: 'expiry'[\s\S]{0,200}?configurable: false/.test(data)) {
  throw new Error('「额度即将到期」这一档不存在或能被关掉，客户会错过额度清零');
}
// 三档「事实」都不能关：只有「余额低于预警值」是偏好。
{
  const tiers = data.slice(data.indexOf('export const ALERT_TIERS'), data.indexOf('export const EXPIRY_TIER_DAYS'));
  const openable = (tiers.match(/configurable: true/g) ?? []).length;
  if (openable !== 1) {
    throw new Error(`可关闭的提醒档位应只有「余额低于预警值」一档，实际 ${openable} 档`);
  }
}

// 14.4 提醒文案必须同时有那三句话，且余额提醒与到期提醒不共用文案。
const template = data.slice(data.indexOf('export const NOTIFY_TEMPLATE'), data.indexOf('export type RechargeMethodId'));
for (const [channel, body] of [['邮件', 'emailBody'], ['短信', 'smsBody']]) {
  const matched = template.match(new RegExp(`${body}:[\\s\\S]*?\\n  (?:[a-zA-Z]+):`));
  const text = matched ? matched[0] : '';
  if (!/不会自动增加额度/.test(text)) throw new Error(`${channel}提醒里没有「不会自动增加额度」`);
  if (!/不(会)?中断/.test(text)) throw new Error(`${channel}提醒里没有「不会中断通话」——客户会以为收到提醒就是服务要停了`);
  if (!/会被拦住|被拦/.test(text)) throw new Error(`${channel}提醒里没有「余额用尽后新通话会被拦住」——只报余额不说后果，客户到那天会认为平台骗了他`);
}
// 到期提醒是另一个事由：一个是「钱快花完了」，一个是「钱快过期了」，客户要做的事不一样。
for (const key of ['expiryEmailSubject', 'expiryEmailBody', 'expirySmsBody']) {
  if (!template.includes(key)) throw new Error(`提醒文案里没有 ${key}，到期提醒会被合并进余额那一套`);
}
if (!/不结转/.test(template) || !/清零/.test(template)) {
  throw new Error('到期提醒文案没有写「到期未用部分清零、不结转」，客户会以为额度能留着');
}
// 到期记录必须带出「还剩几天、是哪一批」：只记「发过到期提醒」，事后答不上客户必问的那句。
if (!/daysLeft\?: number/.test(data) || !/grantTitle\?: string/.test(data)) {
  throw new Error('提醒记录缺少到期档的「还剩几天 / 哪一批」字段，事后无法回查');
}
if (!/daysLeft !== undefined/.test(notify)) {
  throw new Error('提醒记录页没有渲染到期档的天数，记了却看不到');
}

// 14.5 面客页面不再提供充值入口；套餐续费与加购仍保留。
if (/RechargePanel|立即充值|自动充值/.test(overview)) throw new Error('账户页仍在显示充值入口');
if (/请及时充值/.test(center) || /请及时充值/.test(notify)) throw new Error('提醒仍引导客户使用已移除的充值入口');
for (const [component, pattern, why] of [
  ['UsageOverview', /PackageActionsPanel/, '余额与额度页没有挂续费与加购面板'],
]) {
  if (!new RegExp(pattern).test(overview)) throw new Error(why + `（${component}）`);
}
if (!/ReportTablePagination/.test(overview) || !/paginateRows\(purchaseEntries, purchasePage, purchasePageSize\)/.test(overview)) {
  throw new Error('套餐购买记录没有分页');
}

// 14.6 报价必须现算，不能把数字写死在页面里——写死那天改了套餐，页面说的还是旧价。
for (const [pattern, why] of [
  [/renewalQuote\(renewalPackageId\)/, '续费报价没有按所选购买批次计算'],
  [/concurrencyQuote\(/, '加购报价不是现算的'],
  [/invoiceableCents\(\)/, '可开票金额不是从已支付减已开票算出来的'],
]) {
  if (!pattern.test(packageActions)) throw new Error(`套餐动作：${why}`);
}
// 只看代码，不看注释：注释里举一个日期例子是说明，写进 JSX 里才是会显示给客户的错。
const codeOnly = (source) => source.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');
if (/20[2-9]\d-/.test(codeOnly(packageActions))) {
  throw new Error('套餐动作页写死了某个年份的到期日，套餐一改就会与真实到期日对不上');
}
// 两类额度的到期日各算各的，这一句必须写出来，否则客户会以为加购的额度跟着套餐一起到期。
if (!/独立的有效期/.test(packageActions)) {
  throw new Error('没有说明「续费顺延主套餐、加购自到账起另算一年」，客户的到期预期会错');
}

// 14.7 页头告警条与预警设置必须读同一个值。这一条是第八轮修掉的真纰漏：
// 原来告警条按「映射额度总额的百分比」判定，预警设置里客户设的是绝对金额，同一屏两个数对不上。
if (!/NOTIFY_SETTINGS\.thresholdCents/.test(center)) {
  throw new Error('页头余额告警线不是读客户设的预警值，与预警设置页会对不上');
}
if (/LOW_BALANCE_RATIO|ALERT_BELOW_CENTS\s*=\s*[^;]*\*/.test(center)) {
  throw new Error('页头余额告警线又在页面里另算了一套（百分比），与预警设置的绝对金额会分叉');
}
// 百分比口径对客户不可解释，且分母（映射额度总额）会随加购变化，不能用。
if (/映射额度总额\s*[\*×]\s*0?\.\d/.test(center)) {
  throw new Error('余额告警线用了「映射额度总额的百分比」，分母会随加购变化，客户也理解不了');
}

console.log('billingCenter 守卫测试通过');
