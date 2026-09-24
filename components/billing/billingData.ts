// 计费中心的演示数据。
// 这里只存一份「事实」——逐通通话：哪台机器人、什么时候、打了多久、有没有接通。
// 月度合计、机器人合计、账户流水、页面上的每一张卡片，全部由这批通话累加得出。
//
// 为什么不另存一份「每月通话量」的汇总：汇总和明细各存一份，等于同一笔账算两遍。
// 月度汇总按整月时长取整一次，明细按每通取整一次，两边的零头迟早分叉，
// 同一屏上就会出现两个「我花了多少钱」。只留逐通这一份，加法只有一次，天生相等。
import {
  ASRModel,
  BillingPackage,
  BotRateResult,
  BotRateSnapshot,
  CallBillingRecord,
  CreditLine,
  FundAllocation,
  FundGrant,
  FundKind,
  LedgerEntry,
  LedgerEntryType,
  ModelType,
  RechargeSource,
  TTSModel,
} from '../../types';
import {
  PRICING_RULE,
  buildFormula,
  captureSnapshotAt,
  computeAmountCents,
  computeRate,
  computeReserveCents,
  centsToYuan,
  milliToYuan,
} from './billingEngine';

export const BILLING_ACCOUNT_ID = 'acct_1001';
export const ACCOUNT_NAME = '滴滴出行';

// 平台授信：由平台核定，客户只读。开通它不产生到账流水，账面余额一分钱都不会变——
// 授信是「能欠多少」不是「存了多少」，把它算进余额，客户会以为账上凭空多了一笔钱。
// 演示数据给了 1 万元额度、已用 0，这样客户能看到这项能力长什么样；
// 想演示「未开通」，把 status 改成 'closed' 即可，余额与全部锚点都不受影响。
export const CREDIT_LINE: CreditLine = {
  accountId: BILLING_ACCOUNT_ID,
  totalCents: 1000000,
  grantedAt: '2026-03-01',
  expiresAt: '2027-03-01',
  status: 'active',
};

// 基准费率：把额度折算成「还能打多久」时用的最低档单价。
// 直接取定价规则里的底价，避免这里再写一个 150、平台调价时漏改。
export const BASE_RATE_MILLI = PRICING_RULE.priceFloorMilli;

// 当前两笔购买合计 7 路；展示可用路数时仍须逐批检查有效期，不能只读这个合计。
export const PURCHASED_CONCURRENCY = 7;

// 单路并发的套餐单价与其中随套餐附带的映射额度：1 路 1 年 1 万元，
// 含 7500 元映射额度（按最低档 0.15 元/分钟可打 5 万分钟），另 2500 元是平台与并发服务费。
export const PACKAGE_PRICE_PER_CONCURRENCY_CENTS = 1000000;
export const GRANT_CENTS_PER_CONCURRENCY = 750000;

// 3 月买 6 路、4 月增购 1 路，累计 7 万元，映射额度 7 × 7500 = 52500 元。
// 只有映射额度是能用来打电话的那笔钱。服务费客户确实花了，但不进余额、不能打电话，
// 所以余额永远小于套餐总额——这不是算错了，要在套餐明细里与映射额度分列写明。
export const PACKAGE_TOTAL_CENTS = 7000000;
const TALK_FEE_CENTS = 5250000;
export const PACKAGE_SERVICE_FEE_CENTS = PACKAGE_TOTAL_CENTS - TALK_FEE_CENTS;

export interface BillingRobotProfile {
  id: string;
  name: string;
  // deleted 表示机器人已删除，历史消费仍然保留——计费记录不能随机器人一起消失。
  state: 'active' | 'deleted';
  asrModel: string;
  ttsModel: string;
  llmModel: string;
  voiceName: string;
  language: string;
  publishVersion: string;
  // 已分配并发：这台机器人最多能同时打几路。所有机器人的分配之和不能超过已购路数。
  concurrency: number;
  // 并发峰值按「今日 / 昨日 / 最近 7 天」三个口径各存一份，切换时间范围时数字真的会变。
  peakToday: number;
  peakYesterday: number;
  peakWeek: number;
  // 因并发路数占满而被挡下来的通话次数，同样按三个口径各存一份。
  // 这台机器人当前余额还很充足，被挡的原因只可能是并发满了，不是钱不够。
  throttledToday: number;
  throttledYesterday: number;
  throttledWeek: number;
}

// 演示用机器人配置档：前两台按 App.tsx / agentDemoBot.ts 里演示机器人的真实配置填写，
// 这样计费中心算出的价就是客户在机器人列表里看到的那两台的价；
// 另加一台已删除的低配机器人、一台大模型还没配置的机器人，覆盖「已删除」「待定价」两种状态。
export const BILLING_ROBOT_PROFILES: BillingRobotProfile[] = [
  {
    id: 'bot_didi_demo',
    name: '滴滴出行智能客服 (Demo)',
    state: 'active',
    asrModel: ASRModel.OPENAI_WHISPER,
    ttsModel: TTSModel.GEMINI_TTS,
    llmModel: ModelType.GEMINI_PRO,
    voiceName: 'Azure-Xiaoxiao',
    language: 'zh-CN',
    publishVersion: 'V1.8',
    concurrency: 3,
    peakToday: 2,
    peakYesterday: 3,
    peakWeek: 3,
    throttledToday: 0,
    throttledYesterday: 1,
    throttledWeek: 4,
  },
  {
    // 名字与 services/agentDemoBot.ts 保持一致（含半角括号），
    // 否则客户在机器人配置页和计费中心会看到同一台机器人有两个名字。
    id: 'bot_agent_demo',
    name: '🤖 语音 Agent 演示 (多工具场景)',
    state: 'active',
    asrModel: ASRModel.OPENAI_WHISPER,
    ttsModel: TTSModel.GEMINI_TTS,
    llmModel: ModelType.GEMINI_PRO,
    voiceName: 'Azure-Xiaoxiao',
    language: 'zh-CN',
    publishVersion: 'V2.3',
    concurrency: 1,
    peakToday: 1,
    peakYesterday: 1,
    peakWeek: 1,
    throttledToday: 0,
    throttledYesterday: 0,
    throttledWeek: 0,
  },
  {
    id: 'bot_home_visit',
    name: '家政回访机器人',
    state: 'deleted',
    asrModel: 'asr.qwen.general',
    ttsModel: 'tts.minimax.std',
    llmModel: 'llm.qwen.plus',
    voiceName: '亲和女声',
    language: 'zh-CN',
    publishVersion: 'v3',
    concurrency: 2,
    peakToday: 0,
    peakYesterday: 0,
    peakWeek: 0,
    throttledToday: 0,
    throttledYesterday: 0,
    throttledWeek: 0,
  },
  {
    // 大模型还没配置就被启用了：费率算不出来，这台上产生的通话先不扣费，价格补齐后补扣。
    id: 'bot_outbound_test',
    name: '智能外呼测试机器人',
    state: 'active',
    asrModel: ASRModel.TENCENT_CHINESE_LARGE,
    ttsModel: TTSModel.SELF_DEVELOPED_TTS,
    llmModel: '',
    voiceName: '默认音色',
    language: 'zh-CN',
    publishVersion: 'v1',
    concurrency: 1,
    // 这台机器人最后一通通话是 2026-09-17，今天没有通话，峰值就是 0。
    peakToday: 0,
    peakYesterday: 0,
    peakWeek: 1,
    throttledToday: 0,
    throttledYesterday: 0,
    throttledWeek: 0,
  },
];

// 每台机器人的费率：由配置推导，和发布页的实时预览走同一个函数、同一张成本表。
// 这里算的是「这台机器人现在生效的价」，只用于页面展示和并发预占；
// 逐通通话的金额各自持有自己的快照副本（见 buildBilling），不引用这里的对象。
export const BILLING_RATES: Record<string, BotRateResult> = BILLING_ROBOT_PROFILES.reduce<Record<string, BotRateResult>>(
  (acc, profile) => {
    acc[profile.id] = computeRate({
      robotId: profile.id,
      robotName: profile.name,
      publishVersion: profile.publishVersion,
      asrModel: profile.asrModel,
      ttsModel: profile.ttsModel,
      llmModel: profile.llmModel,
      voiceName: profile.voiceName,
      language: profile.language,
      computedAt: '2026-03-01T10:12:00+08:00',
    });
    return acc;
  },
  {},
);

export const findRobotProfile = (robotId: string): BillingRobotProfile | undefined =>
  BILLING_ROBOT_PROFILES.find((item) => item.id === robotId);

// 取已定价机器人的快照；待定价的机器人没有费率，调用方必须自己处理这种情况。
export const getSnapshot = (robotId: string): BotRateSnapshot | undefined => {
  const result = BILLING_RATES[robotId];
  return result && result.accuracy === 'priced' ? result.rate : undefined;
};

export const getPendingReason = (robotId: string): string[] => {
  const result = BILLING_RATES[robotId];
  return result && result.accuracy === 'pending' ? result.reasons : [];
};

export const getRateMilli = (robotId: string): number | undefined => getSnapshot(robotId)?.priceMilli;

// 已分配的并发路数：只有还在用的机器人占着并发，已删除的机器人把路数还了回来。
export const ALLOCATED_CONCURRENCY = BILLING_ROBOT_PROFILES
  .filter((profile) => profile.state === 'active')
  .reduce((sum, profile) => sum + profile.concurrency, 0);

// ---------------- 通话来源：逐通通话 ----------------

export interface BillingCallInput {
  callId: string;
  robotId: string;
  startedAt: string;
  durationSec: number;
  phoneNumber: string;
  location: string;
  direction: 'outbound' | 'inbound';
  // 未接通不计费。显式记录，避免用「时长 0」冒充两种完全不同的情况。
  answered: boolean;
}

// 这 8 个 Call ID 在通话记录模块里真实存在（见 components/call/CallRecordList.tsx 的 MOCK_CALL_RECORDS），
// 所以消费明细里给出跳转入口。单独列一份，别在每行上各写一遍布尔值——那种写法错一位都看不出来。
export const CALL_IDS_IN_CALL_RECORDS: readonly string[] = [
  'a5eca2ef-d6dc-4e5e-b984-1c51c6d4b296',
  '80b85e14-7c02-497c-a82e-bfd27f11a3b2',
  'c24cdc8c-1d8f-45f6-8635-03d3ab6949ae',
  'd2b8b0cb-bfdd-4d38-9eb0-db115efae331',
  '0493b480-122a-44ea-9664-d68ac819476e',
  '08a7ebe7-6e5d-43ce-8f49-ebf87f3e34f7',
  '4cb67f3a-6d81-4033-bb5f-a3cf8292a2e5',
  '6ef90c43-8b89-44c3-98f7-733e31e21961',
];

// 指定通话：这些通话的时间、号码、时长都必须是定值，不能随机生成。
// 两种来源——① 通话记录模块里真实存在的那 8 通；② 用来覆盖「待定价」「未接通」的几通。
// 4cb67f3a 的时长取 229 秒，与通话详情页那份自带详情显示的「3 分 49 秒」对齐：
// 详情页左右两侧说的是同一通电话，时长必须一致，不能一边 3 分 49 秒、一边按 7 分半收费。
const PINNED_CALLS: BillingCallInput[] = [
  // 与通话记录模块共用的 8 通（2026-03-20 上午到下午）。
  { callId: 'a5eca2ef-d6dc-4e5e-b984-1c51c6d4b296', robotId: 'bot_didi_demo', startedAt: '2026-03-20 11:12:33', durationSec: 214, phoneNumber: '17625941334', location: '江苏/南京', direction: 'outbound', answered: true },
  { callId: '80b85e14-7c02-497c-a82e-bfd27f11a3b2', robotId: 'bot_didi_demo', startedAt: '2026-03-20 11:12:57', durationSec: 96, phoneNumber: '17625941334', location: '江苏/南京', direction: 'outbound', answered: true },
  { callId: 'c24cdc8c-1d8f-45f6-8635-03d3ab6949ae', robotId: 'bot_didi_demo', startedAt: '2026-03-20 11:15:43', durationSec: 331, phoneNumber: '17625941334', location: '江苏/南京', direction: 'outbound', answered: true },
  { callId: 'd2b8b0cb-bfdd-4d38-9eb0-db115efae331', robotId: 'bot_home_visit', startedAt: '2026-03-20 11:20:03', durationSec: 187, phoneNumber: '17625941334', location: '江苏/南京', direction: 'outbound', answered: true },
  { callId: '0493b480-122a-44ea-9664-d68ac819476e', robotId: 'bot_home_visit', startedAt: '2026-03-20 11:20:20', durationSec: 0, phoneNumber: '17625941334', location: '江苏/南京', direction: 'outbound', answered: false },
  { callId: '08a7ebe7-6e5d-43ce-8f49-ebf87f3e34f7', robotId: 'bot_home_visit', startedAt: '2026-03-20 14:09:40', durationSec: 268, phoneNumber: '15527562690', location: '湖北/武汉', direction: 'outbound', answered: true },
  { callId: '4cb67f3a-6d81-4033-bb5f-a3cf8292a2e5', robotId: 'bot_agent_demo', startedAt: '2026-03-20 14:29:23', durationSec: 229, phoneNumber: '15527562690', location: '湖北/武汉', direction: 'inbound', answered: true },
  { callId: '6ef90c43-8b89-44c3-98f7-733e31e21961', robotId: 'bot_agent_demo', startedAt: '2026-03-20 10:29:06', durationSec: 143, phoneNumber: '15527562690', location: '湖北/武汉', direction: 'inbound', answered: true },

  // 本月的几通：其中两通来自大模型还没配置的机器人，用来演示「待定价」。
  // 7 个 Call ID 的前 8 位必须互不相同：明细表只显示前 8 位，共用前缀会让这 7 行
  // 看起来是同一条记录，客户想报一个单号来问都指不清是哪一通，搜索也会一次命中 7 行。
  // （测试里锁了这条：tests/billingCenter.money.mjs 会检查显示用的前缀不重复。）
  { callId: 'a3f81c04-2b6e-4f19-9d72-5c0e8b41d001', robotId: 'bot_didi_demo', startedAt: '2026-09-21 16:42:11', durationSec: 389, phoneNumber: '13800004420', location: '广东/深圳', direction: 'outbound', answered: true },
  { callId: 'b7d2e94f-83a1-4c50-8e16-2f7a90cb3d02', robotId: 'bot_didi_demo', startedAt: '2026-09-21 15:08:47', durationSec: 61, phoneNumber: '13800004420', location: '广东/深圳', direction: 'outbound', answered: true },
  { callId: 'c6a10b7d-4e29-4d83-b5f1-8e3c72a0f603', robotId: 'bot_home_visit', startedAt: '2026-09-20 10:15:02', durationSec: 205, phoneNumber: '13900007781', location: '浙江/杭州', direction: 'outbound', answered: true },
  { callId: 'd9e4f2a8-7c15-4b06-a3d8-61f2e9074c04', robotId: 'bot_home_visit', startedAt: '2026-09-19 09:31:18', durationSec: 30, phoneNumber: '13900007781', location: '浙江/杭州', direction: 'outbound', answered: true },
  { callId: 'e1b73c5a-9f48-42d1-87b3-4a6d0e95c205', robotId: 'bot_agent_demo', startedAt: '2026-09-18 14:02:55', durationSec: 176, phoneNumber: '13700009032', location: '北京', direction: 'inbound', answered: true },
  { callId: 'f08a6d21-5e73-4a94-b2c6-7d18f3b24e06', robotId: 'bot_outbound_test', startedAt: '2026-09-17 11:27:40', durationSec: 95, phoneNumber: '13600002210', location: '四川/成都', direction: 'outbound', answered: true },
  { callId: '2c5e9b83-1d67-4e28-96a4-b3f07c15a907', robotId: 'bot_outbound_test', startedAt: '2026-09-17 11:25:06', durationSec: 42, phoneNumber: '13600002210', location: '四川/成都', direction: 'outbound', answered: true },
];

// ---------------- 每月通话量目标 ----------------
// 只描述「哪台机器人在哪个月打了多少通、一共多少分钟」，是生成演示通话的输入。
// 注意：这里不参与任何金额计算。金额一律由逐通通话累加得出，否则又变成两套口径。
export interface MonthTarget {
  robotId: string;
  month: string;
  calls: number;
  talkMinutes: number;
}

const MONTH_TARGETS: MonthTarget[] = [
  { robotId: 'bot_home_visit', month: '2026-03', calls: 96, talkMinutes: 330 },
  { robotId: 'bot_didi_demo', month: '2026-03', calls: 42, talkMinutes: 128 },
  { robotId: 'bot_agent_demo', month: '2026-03', calls: 15, talkMinutes: 52 },
  { robotId: 'bot_home_visit', month: '2026-04', calls: 347, talkMinutes: 1180 },
  { robotId: 'bot_home_visit', month: '2026-05', calls: 418, talkMinutes: 1420 },
  { robotId: 'bot_home_visit', month: '2026-06', calls: 379, talkMinutes: 1290 },
  { robotId: 'bot_home_visit', month: '2026-07', calls: 282, talkMinutes: 960 },
  { robotId: 'bot_home_visit', month: '2026-08', calls: 179, talkMinutes: 610 },
  { robotId: 'bot_home_visit', month: '2026-09', calls: 149, talkMinutes: 505 },
  { robotId: 'bot_didi_demo', month: '2026-04', calls: 136, talkMinutes: 395 },
  { robotId: 'bot_didi_demo', month: '2026-05', calls: 152, talkMinutes: 440 },
  { robotId: 'bot_didi_demo', month: '2026-06', calls: 179, talkMinutes: 520 },
  { robotId: 'bot_didi_demo', month: '2026-07', calls: 153, talkMinutes: 445 },
  { robotId: 'bot_didi_demo', month: '2026-08', calls: 128, talkMinutes: 370 },
  { robotId: 'bot_didi_demo', month: '2026-09', calls: 81, talkMinutes: 235 },
  { robotId: 'bot_agent_demo', month: '2026-04', calls: 48, talkMinutes: 150 },
  { robotId: 'bot_agent_demo', month: '2026-05', calls: 55, talkMinutes: 170 },
  { robotId: 'bot_agent_demo', month: '2026-06', calls: 63, talkMinutes: 195 },
  { robotId: 'bot_agent_demo', month: '2026-07', calls: 58, talkMinutes: 180 },
  { robotId: 'bot_agent_demo', month: '2026-08', calls: 39, talkMinutes: 120 },
  { robotId: 'bot_agent_demo', month: '2026-09', calls: 22, talkMinutes: 70 },
];

export const BILLING_MONTHS: string[] = Array.from(new Set(MONTH_TARGETS.map((item) => item.month))).sort();
export const CURRENT_MONTH = BILLING_MONTHS[BILLING_MONTHS.length - 1];
export const PREVIOUS_MONTH = BILLING_MONTHS[BILLING_MONTHS.length - 2];

export const monthLabelLong = (month: string): string => `${month.slice(0, 4)} 年 ${Number(month.slice(5, 7))} 月`;

// 数据截止日：本月还没过完，只统计到这一天，页面上要写明，避免客户以为本月就这么点量。
// 「今日」这个时间范围也依赖它：截止日就是今天，两者必须同一个数，不能一处写 21、一处写今天。
export const CURRENT_MONTH_CUTOFF_DAY = 22;

// 数据截止的具体日期，给页面直接引用，避免「数据截止 21 日」和「统计至 9 月 22 日」打架。
export const DATA_CUTOFF_LABEL = `${CURRENT_MONTH}-${String(CURRENT_MONTH_CUTOFF_DAY).padStart(2, '0')}`;

const monthDays = (month: string): number => {
  const [year, mon] = month.split('-').map(Number);
  return new Date(Date.UTC(year, mon, 0)).getUTCDate();
};

// ---------------- 生成演示通话 ----------------

// 确定性伪随机：固定种子，保证每次刷新看到的演示数据完全一样，截图和核对才对得上。
const makeRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const seedOf = (text: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

// 演示通话的 Call ID：形状按真实的来（8-4-4-4-12 十六进制）。
// 明细表和依据面板只显示前 8 位，所以前 8 位必须能区分不同的通话——
// 之前用的是 gen_2026-03_bot_xxx_0001 这种内部记号，前 8 位整列都是「gen_2026」，
// 客户看到一整列一模一样的编号，想在工单里指认某一通都指不清，搜索输一次也命中所有行。
// 用独立的随机流生成，不碰上面那条 stream：改一列 Call ID 不该把每通通话的时长、
// 号码、金额全部洗一遍，页面上那些对得上的演示口径（已用话费、本月消费）会全变。
const buildCallId = (month: string, robotId: string, index: number): string => {
  const random = makeRandom(seedOf(`callid|${month}|${robotId}|${index}`));
  const hex = (count: number): string =>
    Array.from({ length: count }, () => Math.floor(random() * 16).toString(16)).join('');
  return `${hex(8)}-${hex(4)}-${hex(4)}-${hex(4)}-${hex(12)}`;
};

// 太短的通话不像真实外呼，太长的一条会吃掉整月额度、让样本失真。
const MIN_CALL_SEC = 8;
const MAX_CALL_SEC = 900;

const two = (value: number): string => String(value).padStart(2, '0');

// 把每个月的通话铺到当月各天：本月只铺到截止日，因为后面的日子还没到。
const buildMonthCalls = (target: MonthTarget, pinned: BillingCallInput[]): BillingCallInput[] => {
  const random = makeRandom(seedOf(`${target.robotId}|${target.month}`));
  const totalSec = Math.round(target.talkMinutes * 60);
  const pinnedSec = pinned.reduce((sum, item) => sum + item.durationSec, 0);
  const fillerCount = Math.max(0, target.calls - pinned.length);
  const usableDays = target.month === CURRENT_MONTH ? CURRENT_MONTH_CUTOFF_DAY : Math.max(1, monthDays(target.month) - 2);

  let left = Math.max(0, totalSec - pinnedSec);
  const filler: BillingCallInput[] = [];

  for (let index = 0; index < fillerCount; index += 1) {
    const remaining = fillerCount - index;
    // 给后面每通至少留 MIN_CALL_SEC，避免前面的通话把额度吃光、后面全是 0 秒。
    const reserve = MIN_CALL_SEC * (remaining - 1);
    let sec: number;
    if (remaining === 1) {
      sec = left;
    } else {
      const fair = (left - reserve) / remaining;
      const jittered = Math.round(fair * (0.6 + random() * 0.8));
      const ceiling = Math.max(MIN_CALL_SEC, Math.min(MAX_CALL_SEC, left - reserve));
      sec = Math.min(Math.max(jittered, MIN_CALL_SEC), ceiling);
    }
    // 兜底：时长只能落在 0 到 left 之间。前面的通话把额度吃光时，后面的只能是 0 秒，
    // 绝不能出现负时长——负时长会算出负金额，把一笔「退款」混进消费明细里。
    sec = Math.max(0, Math.min(sec, left));
    left -= sec;

    // 通话时刻均匀铺在当月，落在 09:00–19:59 的营业时间里。
    const day = 1 + Math.floor((index / Math.max(1, fillerCount)) * usableDays);
    const startedAt = `${target.month}-${two(day)} ${two(9 + Math.floor(random() * 11))}:${two(Math.floor(random() * 60))}:${two(Math.floor(random() * 60))}`;

    filler.push({
      callId: buildCallId(target.month, target.robotId, index),
      robotId: target.robotId,
      startedAt,
      durationSec: sec,
      // 号码在国内号段里取，中间四位打码——页面上给客户看的就是这个形状。
      phoneNumber: `${['138', '139', '155', '176', '186', '199'][Math.floor(random() * 6)]}****${String(1000 + Math.floor(random() * 9000))}`,
      location: ['广东/深圳', '浙江/杭州', '江苏/南京', '湖北/武汉', '四川/成都', '北京'][Math.floor(random() * 6)],
      direction: random() < 0.85 ? 'outbound' : 'inbound',
      answered: true,
    });
  }

  return [...pinned, ...filler];
};

const buildAllCalls = (): BillingCallInput[] => {
  const calls: BillingCallInput[] = [];
  const consumed = new Set<string>();

  MONTH_TARGETS.forEach((target) => {
    const pinned = PINNED_CALLS.filter((call) => call.robotId === target.robotId && call.startedAt.startsWith(target.month));
    pinned.forEach((call) => consumed.add(call.callId));
    calls.push(...buildMonthCalls(target, pinned));
  });

  // 没有月度目标的机器人（还没配置大模型的那台）不参与月度通话量，但它确实打过电话，
  // 这些通话照样要出现在明细里——只是不产生费用、不进任何合计。
  PINNED_CALLS.filter((call) => !consumed.has(call.callId)).forEach((call) => calls.push(call));

  return calls.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
};

const ALL_CALLS: BillingCallInput[] = buildAllCalls();

// ---------------- 账户流水与逐通扣费 ----------------

// 待定价的通话没有真实快照，这里给一个只用于占位的空壳，避免页面出现 undefined。
// 页面必须靠 billingStatus 判断「显示什么」，而不是靠这个快照里的数字——里面的 0 不是价格。
const pendingSnapshot = (robotId: string, robotName: string): BotRateSnapshot => ({
  snapshotId: 'pending',
  robotId,
  robotName,
  publishVersion: '—',
  language: 'zh-CN',
  asr: { modelId: '—', displayName: '—', unitPricePerHour: 0, speechSecPerMin: 0, costPerMinMicro: 0 },
  tts: { modelId: '—', displayName: '—', voiceName: '—', language: 'zh-CN', unitPricePer10kChars: 0, charsPerMin: 0, charsPerMinMethod: 'manual', speakSecPerMin: 0, costPerMinMicro: 0 },
  llm: { modelId: '—', displayName: '—', inputPricePerMillion: 0, outputPricePerMillion: null, outputPriceMissing: true, inputTokensPerMin: 0, outputTokensPerMin: 0, costPerMinMicro: 0 },
  costPerMinMicro: 0,
  markupRatio: 0,
  priceListMicro: 0,
  priceGridMilli: 0,
  priceFloorMilli: 0,
  priceMilli: 0,
  floorApplied: false,
  tier: 'standard',
  pricingRuleVersion: '—',
  costTableVersion: '—',
  roundingRuleVersion: '—',
  billableBasis: '—',
  minBillableSec: 0,
  fxUsdCny: 0,
  computedAt: '—',
  hash: 'pending',
});

// 并发预占的样本：拿本月最后一通有录音的通话演示「先预占、后按实际结算」。
const RESERVE_TARGET_CALL = 'a3f81c04-2b6e-4f19-9d72-5c0e8b41d001';

// ---------------- 额度批次与扣费顺序 ----------------
// 余额不是一个大池子，是若干批次各自的剩余之和。非得分批次，是因为有两件事必须说清楚：
// 这笔钱什么时候到期、这笔钱是客户自己掏的还是随套餐送的。只有总额，两件都说不清。

// 一笔到账形成的批次，加上它此刻还剩多少。
export interface GrantBalance {
  grant: FundGrant;
  remainingCents: number;
}

// 扣费顺序：自有资金优先，授信垫底。
//   1. voucher —— 随套餐给的映射额度，按到期日升序（最早到期先用）
//   2. cash     —— 客户单独充值的钱，无有效期，全部 voucher 用尽后才动
//   3. credit   —— 平台授信，自有资金全部耗尽才动用，动用即形成欠款
// 为什么快到期的先用：快到期的钱不先用，到期那天就被清零，
// 而客户手上还有别的余额——客户看到的是「我明明有钱，额度却没了」。
export const CONSUME_ORDER: FundKind[] = ['voucher', 'cash', 'credit'];

// 类内排序：同类里先扣快到期的，无限期（null）的排最后。
const compareGrants = (a: FundGrant, b: FundGrant): number => {
  const byKind = CONSUME_ORDER.indexOf(a.kind) - CONSUME_ORDER.indexOf(b.kind);
  if (byKind !== 0) return byKind;
  if (a.expiresAt === b.expiresAt) return a.grantId.localeCompare(b.grantId);
  if (a.expiresAt === null) return 1;
  if (b.expiresAt === null) return -1;
  return a.expiresAt.localeCompare(b.expiresAt);
};

// 批次在 asOf 时刻的剩余。过了有效期就是 0。
// 清零不另存一个「已清零」状态，由到期日现推——多存一份状态，就多一处会和金额分叉的地方。
// expiresAt 写成日期，含义是「当天 00:00 起这批钱不再可用」，所以前缀比较就够。
export const grantRemainingAt = (grant: FundGrant, rawRemainingCents: number, asOf: string): number =>
  grant.expiresAt !== null && asOf >= grant.expiresAt ? 0 : rawRemainingCents;

// asOf 时刻已经过了有效期、却还挂着剩余的批次——这些就是到期结算要做的事。
export const expiredGrantsAt = (balances: GrantBalance[], asOf: string): GrantBalance[] =>
  balances.filter((item) => item.remainingCents > 0 && grantRemainingAt(item.grant, item.remainingCents, asOf) === 0);

// 批次的三种状态，互不重叠，都由「剩余 + 有效期」现推，不另存一个状态字段。
export type GrantStatus = 'active' | 'used' | 'expired';

export const grantStatusAt = (item: GrantBalance, asOf: string): GrantStatus => {
  // 先判过期：过了有效期就是过期，不管它是被花光的还是被清零的——
  // 客户在批次列表里看到「已过期」，比看到「已用完」更接近事实。
  if (item.grant.expiresAt !== null && asOf >= item.grant.expiresAt) return 'expired';
  return item.remainingCents > 0 ? 'active' : 'used';
};

// 授信那段分摊用的批次号。它不是真批次（不进 BILLING_GRANT_BALANCES），
// 只是让「这段钱是从授信里垫的」在这笔分摊里有个可指认的名字。
export const CREDIT_GRANT_ID = `${BILLING_ACCOUNT_ID}:credit`;

// 把一笔扣费按扣费顺序劈到各批次上。返回的每一段都是正数，加起来正好等于 amountCents——
// 这条加法是「批次剩余之和 = 自有资金余额」成立的前提，所以扣不动时宁可报错也不能少记一段。
// creditAvailableCents 是授信的可透支额度：自有资金用尽后接着往下垫，
// 垫出去的那一段以 CREDIT_GRANT_ID 为记，形成欠费（余额链因此可能走负）。
// 不传就是不允许透支——演示数据里余额充足，两条路都走不到。
export const allocateAcrossGrants = (
  balances: GrantBalance[],
  amountCents: number,
  creditAvailableCents = 0,
): FundAllocation[] => {
  const usable = balances.filter((item) => item.remainingCents > 0).sort((a, b) => compareGrants(a.grant, b.grant));
  const allocations: FundAllocation[] = [];
  let left = amountCents;
  for (const item of usable) {
    if (left <= 0) break;
    const take = Math.min(left, item.remainingCents);
    allocations.push({ grantId: item.grant.grantId, amountCents: take });
    left -= take;
  }
  if (left > 0 && creditAvailableCents > 0) {
    const take = Math.min(left, creditAvailableCents);
    allocations.push({ grantId: CREDIT_GRANT_ID, amountCents: take });
    left -= take;
  }
  // 自有资金加授信还不够，说明这笔消费已经超出了账户能承担的范围。
  // 这时默默记一笔「扣不动钱」的账，比当场报错危险得多。
  if (left > 0) throw new Error(`自有额度与授信加起来仍不足，还差 ${left} 分：余额与流水已经对不上，不能再扣`);
  return allocations;
};

// 把分摊结果落到批次余额上。direction = -1 是扣减，+1 是还回（预占释放）。
// 用方向而不是「带符号的金额」，是因为金额本身带不带符号在这里没有语义，
// 只有一个方向能说清这一行到底在扣还是在还。
const applyAllocations = (balances: GrantBalance[], allocations: FundAllocation[], direction: 1 | -1): void => {
  allocations.forEach((part) => {
    // 授信那一垫没有批次余额可动：它不是账上有的钱，欠费从流水里现推。
    if (part.grantId === CREDIT_GRANT_ID) return;
    const target = balances.find((item) => item.grant.grantId === part.grantId);
    if (!target) throw new Error(`扣费指向了不存在的额度批次 ${part.grantId}`);
    target.remainingCents += direction * part.amountCents;
  });
};

// 到账事件本身就是批次的创建：批次的金额、有效期、来路只写在事件上，
// 不在别处再存一份「批次清单」——存两份，迟早有一份忘了改。
type BillingEvent =
  | {
      kind: 'recharge';
      at: string;
      amountCents: number;
      title: string;        // 流水标题（客户在资金流水里读到的）
      grantTitle: string;   // 批次标题（客户在额度批次明细里读到的）
      refId: string;
      grantId: string;
      fundKind: FundKind;
      source: RechargeSource;
      expiresAt: string | null;
    }
  | { kind: 'call'; at: string; input: BillingCallInput }
  | { kind: 'reserve'; at: string; callId: string; amountCents: number; title: string }
  | { kind: 'release'; at: string; callId: string; amountCents: number; title: string };

// 账户流水和逐通扣费必须一次算出来：两者共用同一条余额链，分开算迟早对不上。
// 事件按发生时刻排序后走一遍，每笔都记下「这笔之后余额是多少」。
// 账户级余额始终只有一条链（isLedgerChainIntact 检查的就是它）；一笔扣费劈到多个批次
// 这件事记在 allocations 里，不另开流水——开了就说不清「一通电话到底扣了几笔」，
// 记录与流水的幂等键也会撞。
const buildBilling = (): { records: CallBillingRecord[]; ledger: LedgerEntry[]; grants: GrantBalance[] } => {
  const reserveCents = computeReserveCents(getRateMilli('bot_didi_demo') ?? BASE_RATE_MILLI);

  // 先按类型收进数组、再排序：直接在字面量后面接 .sort()，类型标注就落不到字面量上，
  // kind 会被推成 string，赋回 BillingEvent[] 时报错。
  const events: BillingEvent[] = [
    {
      kind: 'recharge',
      at: '2026-03-01 00:05:00',
      amountCents: 6 * GRANT_CENTS_PER_CONCURRENCY,
      title: '标准套餐 A（6 路 · 1 年）映射额度到账',
      grantTitle: '标准套餐 A（6 路 · 1 年）· 映射额度',
      refId: 'pkg_202603',
      grantId: 'grant_20260301_01',
      fundKind: 'voucher',
      source: 'auto',
      expiresAt: '2027-03-01',
    },
    {
      kind: 'recharge',
      at: '2026-04-01 10:12:00',
      amountCents: GRANT_CENTS_PER_CONCURRENCY,
      title: '4 月增购 1 路并发通话额度到账',
      grantTitle: '4 月增购（1 路 · 1 年）· 通话额度',
      refId: 'pkg_202604',
      grantId: 'grant_20260401_01',
      fundKind: 'voucher',
      source: 'auto',
      expiresAt: '2027-04-01',
    },
    ...ALL_CALLS.map((input): BillingEvent => ({ kind: 'call', at: input.startedAt, input })),
    // 预占发生在通话开始前、释放发生在通话结束后，中间的扣费夹在两者之间，余额链才连贯。
    { kind: 'reserve', at: '2026-09-21 16:41:50', callId: RESERVE_TARGET_CALL, amountCents: reserveCents, title: '并发额度预占（按 5 分钟预估）' },
    { kind: 'release', at: '2026-09-21 16:48:45', callId: RESERVE_TARGET_CALL, amountCents: reserveCents, title: '并发额度预占释放（按实际通话结算）' },
  ];
  events.sort((a, b) => a.at.localeCompare(b.at));

  const records: CallBillingRecord[] = [];
  const ledger: LedgerEntry[] = [];
  const grants: GrantBalance[] = [];
  // 预占是从哪几个批次扣的：释放时要原样还回同一个批次。
  // 不还回原批次的话，一次预占就能把「先扣快到期的」这个顺序搅乱。
  const reserveAllocations = new Map<string, FundAllocation[]>();
  let balance = 0;
  let seq = 0;

  // 每次动账之前先做一次到期结算：过了有效期的批次清零、记一条负额流水。
  // 排在动账之前，是因为「这笔钱还能不能用」必须先于「用了这笔钱」定下来。
  const settleExpiries = (asOf: string) => {
    expiredGrantsAt(grants, asOf).forEach((item) => {
      const cleared = item.remainingCents;
      item.remainingCents = 0;
      balance -= cleared;
      seq += 1;
      ledger.push({
        entryId: `led_${String(seq).padStart(5, '0')}`,
        accountId: BILLING_ACCOUNT_ID,
        type: 'expire',
        amountCents: -cleared,
        balanceAfterCents: balance,
        refType: 'recharge',
        refId: item.grant.orderId ?? item.grant.grantId,
        title: `${item.grant.title} 到期清零`,
        occurredAt: `${item.grant.expiresAt} 00:00:00`,
        idempotencyKey: `${item.grant.grantId}:expire:1`,
        fundKind: item.grant.kind,
      });
    });
  };

  events.forEach((event) => {
    settleExpiries(event.at);
    seq += 1;
    const entryId = `led_${String(seq).padStart(5, '0')}`;

    if (event.kind === 'recharge') {
      balance += event.amountCents;
      grants.push({
        grant: {
          grantId: event.grantId,
          accountId: BILLING_ACCOUNT_ID,
          kind: event.fundKind,
          source: event.source,
          title: event.grantTitle,
          originalCents: event.amountCents,
          grantedAt: event.at,
          expiresAt: event.expiresAt,
          orderId: event.refId,
        },
        remainingCents: event.amountCents,
      });
      ledger.push({
        entryId,
        accountId: BILLING_ACCOUNT_ID,
        type: 'recharge',
        amountCents: event.amountCents,
        balanceAfterCents: balance,
        refType: 'recharge',
        refId: event.refId,
        title: event.title,
        occurredAt: event.at,
        idempotencyKey: `${event.refId}:recharge:1`,
        fundKind: event.fundKind,
        // 充值是「这笔钱充进了哪个批次」。资金流水页要给出这笔额度什么时候到期，
        // 靠这一条指回批次；不写的话页面只能按时刻去猜，猜错的那天没人会发现。
        allocations: [{ grantId: event.grantId, amountCents: event.amountCents }],
      });
      return;
    }

    if (event.kind === 'reserve' || event.kind === 'release') {
      const isReserve = event.kind === 'reserve';
      // 预占也按扣费顺序占额度：占住的必须是「本来就会先被扣掉的那一笔」，
      // 否则释放时还回去，客户的可用额度会在两次动账之间凭空变多或变少。
      const allocations = isReserve
        ? allocateAcrossGrants(grants, event.amountCents)
        : reserveAllocations.get(event.callId) ?? [];
      if (isReserve) {
        reserveAllocations.set(event.callId, allocations);
        applyAllocations(grants, allocations, -1);
      } else {
        // 释放按预占时那几段原样还回去，一段不多、一段不少。
        applyAllocations(grants, allocations, 1);
      }
      // 预占 = 先从批次扣走（方向 -1），释放 = 再还回（方向 +1）。
      balance += isReserve ? -event.amountCents : event.amountCents;
      ledger.push({
        entryId,
        accountId: BILLING_ACCOUNT_ID,
        type: isReserve ? 'reserve' : 'release',
        amountCents: isReserve ? -event.amountCents : event.amountCents,
        balanceAfterCents: balance,
        refType: 'call',
        refId: event.callId,
        title: event.title,
        occurredAt: event.at,
        idempotencyKey: `${event.callId}:${isReserve ? 'reserve' : 'release'}:1`,
        // 预占动的是它实际占住的那批钱；没占住任何批次时只能记 0 分，
        // 但演示数据里余额充足，这条分支只是防御，不会真的走到「无批次可占」。
        fundKind: grants.find((item) => item.grant.grantId === allocations[0]?.grantId)?.grant.kind ?? 'voucher',
        allocations: isReserve ? allocations : undefined,
      });
      return;
    }

    const { input } = event;
    const profile = findRobotProfile(input.robotId);
    const robotName = profile?.name || '未知机器人';
    const rate = getSnapshot(input.robotId);
    // 每通通话拿一份自己的快照副本，计费时刻就是这通电话的开始时间。
    // 不能直接引用 BILLING_RATES 里那份机器人级对象——那是共享引用，
    // 以后改一行机器人配置就会连带改掉所有历史通话的单价和金额。
    const snapshot = rate ? captureSnapshotAt(rate, input.startedAt) : pendingSnapshot(input.robotId, robotName);

    // 未接通：不产生费用，也不产生流水，只留一条免计费记录方便对账。
    // 哪怕这台机器人还没定价也要留：明细里少一行，月度通数就和明细加法对不上了。
    if (!input.answered) {
      records.push({
        callId: input.callId,
        snapshot,
        billableSec: 0,
        amountCents: 0,
        currency: 'CNY',
        balanceBeforeCents: balance,
        balanceAfterCents: balance,
        formula: '客户未接听，本通不计费',
        billingStatus: 'free',
        billingReasonCode: 'NOT_ANSWERED',
        // 「不产生流水」是账务内部的话，客户读不懂也没法拿它去对什么，只说「不计费」。
        billingReasonText: '客户未接听，这通不计费',
        ledgerEntryId: '',
        // 幂等键要写明这条记录是「哪一件账务事实」：未接通和待定价都没有扣过钱，
        // 都写成 :billed:1 的话，将来这笔待定价通话要补扣时，扣费请求会因为
        // 「同一个键已经用过」被当成重复请求丢掉——客户就永远收不到这笔补扣。
        idempotencyKey: `${input.callId}:free:1`,
        computedAt: input.startedAt,
      });
      return;
    }

    // 待定价：金额记 0，状态标记为待定价，不计入任何合计，也不扣余额。
    // 缺哪一项在计费这一刻就写进记录里；以后机器人补齐了配置，这条记录也不改口，
    // 否则回头再看这通电话，会拿今天已经配好的机器人去解释当时的「算不出来」。
    if (!rate) {
      records.push({
        callId: input.callId,
        snapshot,
        billableSec: input.durationSec,
        amountCents: 0,
        currency: 'CNY',
        balanceBeforeCents: balance,
        balanceAfterCents: balance,
        formula: '该机器人使用的模型还没有配置价格，本通暂不扣费',
        billingStatus: 'pending',
        // 待定价不是「正常计费」：结算侧按原因码挑补扣对象，标成 NORMAL 就挑不出来。
        billingReasonCode: 'MODEL_NOT_PRICED',
        billingReasonText: '模型还没配置价格，本通暂不扣费；价格补齐后会自动补扣',
        billingMissing: getPendingReason(input.robotId),
        ledgerEntryId: '',
        // 这一条占的是 :pending:1，把 :billed:1 留给将来真正补扣的那笔流水，两者不会撞键。
        idempotencyKey: `${input.callId}:pending:1`,
        computedAt: input.startedAt,
      });
      return;
    }

    // 金额按秒向上取整到分，只取整这一次——月度、机器人、账户的合计都是这批金额的和。
    const amountCents = computeAmountCents(input.durationSec, snapshot.priceMilli);
    const balanceBefore = balance;
    // 按扣费顺序决定这笔钱从哪几个批次出。跨批次时 allocations 会有多段，
    // 但账户流水仍然只有这一条——客户看资金流水是「一通电话一笔钱」，
    // 而批次明细里能看到这笔钱具体扣到了哪几个批次上。
    const allocations = allocateAcrossGrants(grants, amountCents);
    applyAllocations(grants, allocations, -1);
    balance -= amountCents;
    // 只有真的扣了钱才用 :billed:1。记录和流水共用这一个键，重放时两条一起被认出来。
    const idempotencyKey = `${input.callId}:billed:1`;

    records.push({
      callId: input.callId,
      snapshot,
      billableSec: input.durationSec,
      amountCents,
      currency: 'CNY',
      balanceBeforeCents: balanceBefore,
      balanceAfterCents: balance,
      // 算式统一由引擎生成，避免页面和数据各写一套、慢慢对不上。
      formula: buildFormula(input.durationSec, snapshot, amountCents),
      billingStatus: 'billed',
      billingReasonCode: 'NORMAL',
      billingReasonText: '正常计费',
      ledgerEntryId: entryId,
      idempotencyKey,
      computedAt: input.startedAt,
    });

    ledger.push({
      entryId,
      accountId: BILLING_ACCOUNT_ID,
      type: 'call_charge',
      amountCents: -amountCents,
      balanceAfterCents: balance,
      refType: 'call',
      refId: input.callId,
      title: `${profile?.name || '机器人'} 通话扣费`,
      occurredAt: input.startedAt,
      idempotencyKey,
      // 记第一段的类别当主来源，完整拆分看 allocations。
      // 跨批次时两段的类别必然不同（同类内部不会跨批次），所以「主来源」是唯一能填一个值的位置。
      fundKind: grants.find((item) => item.grant.grantId === allocations[0].grantId)!.grant.kind,
      allocations,
    });
  });

  // 走完全部事件后再结算一次：最后一批额度到期的时刻之后可能一通电话都没有，
  // 只在动账时结算的话，这笔到期清零会一直不落账，余额就永远显得比实际多。
  settleExpiries(`${DATA_CUTOFF_LABEL} 23:59:59`);

  return { records, ledger, grants };
};

const BUILT = buildBilling();

// 消费明细默认按时间倒序展示，最近发生的排在前面。
export const BILLING_CALL_RECORDS: CallBillingRecord[] = [...BUILT.records].sort((a, b) => b.computedAt.localeCompare(a.computedAt));
export const BILLING_LEDGER: LedgerEntry[] = BUILT.ledger;

// 各额度批次到数据截止日的剩余。余额就是这批剩余的和，不再另存一个总额。
export const BILLING_GRANT_BALANCES: GrantBalance[] = BUILT.grants;

// 批次列表的展示顺序就是扣费顺序：快到期的排前面，无限期的排最后。
// 页面必须直接用这个顺序，不要自己再排一遍——两处排序规则一旦分叉，
// 列表上排在最前面的批次和实际被最先扣的批次就不是同一笔，客户会以为顺序坏了。
export const grantsByConsumeOrder = (balances: GrantBalance[] = BILLING_GRANT_BALANCES): GrantBalance[] =>
  [...balances].sort((a, b) => compareGrants(a.grant, b.grant));

// 余额卡上的「此刻」：演示数据没有实时钟，就用数据截止日当天收盘。
// 余额不跟页面的时间范围筛选走（筛选变的是消费，不是钱），所以它固定读这一个时刻。
export const BALANCE_AS_OF = `${DATA_CUTOFF_LABEL} 23:59:59`;

// 最近一笔还没到期、且还有余额的批次，以及它还剩几天到期。
// 「还有几天到期」这句话在余额与额度页、通知记录页、消费统计页都要说，
// 各页自己算一遍，迟早会算出三个不同的天数——所以只在这里算一次。
// 取的是扣费顺序里的第一笔：那条顺序本身就是「先到期的排前面」，与客户看到的列表顺序一致。
export const nearestExpiry = (asOf: string = BALANCE_AS_OF): { grant: GrantBalance; daysLeft: number } | null => {
  const next = grantsByConsumeOrder().find(
    (item) => item.grant.expiresAt !== null && grantStatusAt(item, asOf) === 'active' && item.remainingCents > 0,
  );
  if (!next || !next.grant.expiresAt) return null;
  // 日期都是 YYYY-MM-DD 开头的本地时间，按整日相减，不需要考虑时区。
  const daysLeft = Math.round((Date.parse(next.grant.expiresAt) - Date.parse(asOf.slice(0, 10))) / 86400000);
  return { grant: next, daysLeft };
};

// 在 asOf 时刻还剩多少。过期的批次在这里归零，不需要先跑一遍到期结算。
export const grantBalanceAt = (asOf: string): GrantBalance[] =>
  BILLING_GRANT_BALANCES.map((item) => ({ grant: item.grant, remainingCents: grantRemainingAt(item.grant, item.remainingCents, asOf) }));

const sumKindAt = (asOf: string, kind: FundKind): number =>
  grantBalanceAt(asOf).filter((item) => item.grant.kind === kind).reduce((sum, item) => sum + item.remainingCents, 0);

// 尚未核销的预占：预占扣了、释放还没来。这部分钱还在账上，但客户已经用不了了。
const frozenAt = (asOf: string): number =>
  BILLING_LEDGER
    .filter((entry) => entry.occurredAt <= asOf && (entry.type === 'reserve' || entry.type === 'release'))
    .reduce((sum, entry) => sum - entry.amountCents, 0);

// 欠费 = 截至此刻从授信里垫出去、还没还上的钱。
// 从流水现推而不是记一个字段：还款、冲正、退款都动这个数，多存一份就多一处分叉的机会，
// 而客户看到「欠费 ¥0」时没有任何依据判断是还完了还是漏改了。
// 支出把授信垫出去是欠债增加，进账（退款 / 冲正 / 人工调整）还回授信是欠债减少。
const creditUsedAt = (asOf: string): number =>
  BILLING_LEDGER
    .filter((entry) => entry.occurredAt <= asOf)
    .reduce((sum, entry) => {
      const fromCredit = (entry.allocations ?? [])
        .filter((part) => part.grantId === CREDIT_GRANT_ID)
        .reduce((partSum, part) => partSum + part.amountCents, 0);
      return sum + (entry.amountCents < 0 ? fromCredit : -fromCredit);
    }, 0);

// 余额构成：客户问「我还有多少钱」时，这几个数才算把话说全了。
// 只有一个总额的页面回答不了「哪部分要到期了」「哪部分是我自己充的」「我还能欠多少」。
export interface BalanceComposition {
  // 随套餐给的映射额度（有有效期）
  voucherCents: number;
  // 客户单独充值的钱（无限期）
  cashCents: number;
  // 平台授信的总额度、已用、还可用。未开通授信时三个数都是 0。
  creditTotalCents: number;
  creditUsedCents: number;
  creditAvailableCents: number;
  // 预占中：账上有、但已经不能用的部分
  frozenCents: number;
  // 欠费：动用了授信就是欠款，要还
  debtCents: number;
  // 账面余额 = 代金券 + 单独充值。**不含授信**——授信是能欠的钱，不是账上的钱；
  // 把它加进来，客户会在页面上看到一笔自己从没充过的余额。
  balanceCents: number;
  // 可用额度 = 账面余额 + 可用授信 − 预占中，这才是现在真能花的钱。
  availableCents: number;
}

export const balanceCompositionAt = (asOf: string): BalanceComposition => {
  const voucherCents = sumKindAt(asOf, 'voucher');
  const cashCents = sumKindAt(asOf, 'cash');
  const frozenCents = frozenAt(asOf);
  // 欠费 = 流水里从授信垫出去、还没还上的那部分，现推不另存。
  // 存一个「已用授信」的字段，还款、冲正之后忘了改，客户就会一直看到一笔还完了的欠费。
  const creditUsedCents = creditUsedAt(asOf);
  const creditClosed = CREDIT_LINE.status !== 'active';
  // 过了授信有效期、或授信已关闭，可透支额度就是 0；已经欠下的仍然要还，两件事分开。
  const creditLive = !creditClosed && (CREDIT_LINE.expiresAt === null || asOf < `${CREDIT_LINE.expiresAt} 00:00:00`);
  const creditTotalCents = creditClosed ? 0 : CREDIT_LINE.totalCents;
  const creditAvailableCents = creditLive ? Math.max(0, creditTotalCents - creditUsedCents) : 0;
  const balanceCents = voucherCents + cashCents;
  return {
    voucherCents,
    cashCents,
    creditTotalCents,
    creditUsedCents,
    creditAvailableCents,
    frozenCents,
    debtCents: creditUsedCents,
    balanceCents,
    availableCents: balanceCents + creditAvailableCents - frozenCents,
  };
};

export const BALANCE_COMPOSITION = balanceCompositionAt(BALANCE_AS_OF);

// ---------------- 由逐通通话累加出的各种合计 ----------------

export interface RobotMonthlyUsage {
  robotId: string;
  robotName: string;
  month: string;
  calls: number;
  talkMinutes: number;
  talkSeconds: number;
  // 其中智呼（呼出）那一份。客户问的两个数是「多少通通话」和「多少智呼的时长」——
  // 这两件事对他们的业务不是一件事，只给合计等于没回答。
  outboundCalls: number;
  outboundSeconds: number;
  amountCents: number;
  rateMilli: number | null;
  // 待定价的机器人没有金额，合计时必须跳过。
  pending: boolean;
}

// 通话方向不属于「钱」，它属于通话本身，所以不在计费记录里。
// 汇总之前先按 callId 建一份对照表，月度汇总顺手把智呼那一份也累加起来——
// 汇总之后再按通话去查方向，就要再翻一遍全量记录，两处迟早对不上。
const DIRECTION_BY_CALL_ID = new Map(ALL_CALLS.map((input) => [input.callId, input.direction]));

// 月度 × 机器人：把逐通通话记录按键归并，只做加法。
// 这里绝不能拿「机器人现在生效的配置」重算一遍：那样一来「发布时冻结」就是句空话——
// 改一行机器人配置，历史通话的金额会跟着变，而对账依旧全绿，因为月度、余额、套餐
// 三处用的是同一份重算结果，互相印证不出任何问题。
// 明细表里同一个月同一台机器人的金额加起来，必然等于这一行的金额——本来就是同一批数字。
export const MONTHLY_USAGE: RobotMonthlyUsage[] = (() => {
  const map = new Map<string, RobotMonthlyUsage>();
  BUILT.records.forEach((record) => {
    const month = record.computedAt.slice(0, 7);
    const key = `${record.snapshot.robotId}|${month}`;
    const billed = record.billingStatus === 'billed';
    const rateMilli = billed ? record.snapshot.priceMilli : null;
    // 智呼只在已计费的通话里累加，和同一行的金额同口径。
    const outbound = billed && DIRECTION_BY_CALL_ID.get(record.callId) === 'outbound';
    const existing = map.get(key);
    if (existing) {
      // 通数和时长只累加已计费的通话，和同一行的金额保持同一个口径。
      // 全额算通数、只算已计费的钱，会让这一行的「金额 ÷ 时长」和单价对不上：
      // 客户拿 195.77 元去除以 812 分钟，得到的单价比这台机器人实际收的价低，
      // 而消费明细表尾同一批数据写的是 810 分钟——同一屏两个数，客户只会以为算错了。
      if (billed) {
        existing.calls += 1;
        existing.talkSeconds += record.billableSec;
        existing.amountCents += record.amountCents;
        if (outbound) {
          existing.outboundCalls += 1;
          existing.outboundSeconds += record.billableSec;
        }
      }
      // 有已计费的通话就用它的单价；整组都没计费时保持 null，页面显示「—」而不是 0。
      if (existing.rateMilli === null) existing.rateMilli = rateMilli;
      if (billed) existing.pending = false;
      return;
    }
    map.set(key, {
      robotId: record.snapshot.robotId,
      robotName: record.snapshot.robotName,
      month,
      calls: billed ? 1 : 0,
      talkSeconds: billed ? record.billableSec : 0,
      talkMinutes: 0,
      outboundCalls: outbound ? 1 : 0,
      outboundSeconds: outbound ? record.billableSec : 0,
      // 金额只做加法，绝不拿今天生效的配置重算一遍。
      amountCents: record.amountCents,
      rateMilli,
      pending: !billed,
    });
  });
  const rows = [...map.values()];
  rows.forEach((row) => { row.talkMinutes = row.talkSeconds / 60; });
  return rows.sort((a, b) => (a.month === b.month ? b.amountCents - a.amountCents : a.month.localeCompare(b.month)));
})();

export const monthSpentCents = (month: string): number =>
  MONTHLY_USAGE.filter((item) => item.month === month).reduce((sum, item) => sum + item.amountCents, 0);

export const monthTalkMinutes = (month: string): number =>
  MONTHLY_USAGE.filter((item) => item.month === month).reduce((sum, item) => sum + item.talkMinutes, 0);

export const monthCallCount = (month: string): number =>
  MONTHLY_USAGE.filter((item) => item.month === month).reduce((sum, item) => sum + item.calls, 0);

export const monthOutboundCallCount = (month: string): number =>
  MONTHLY_USAGE.filter((item) => item.month === month).reduce((sum, item) => sum + item.outboundCalls, 0);

export const monthOutboundMinutes = (month: string): number =>
  MONTHLY_USAGE.filter((item) => item.month === month).reduce((sum, item) => sum + item.outboundSeconds, 0) / 60;

export const totalSpentCents = (): number => MONTHLY_USAGE.reduce((sum, item) => sum + item.amountCents, 0);

// 同期口径：只统计到当月第 day 天发生的通话。
// 拿 22 天的本月去比 31 天的上月会得出「省了三成」的假象，实际同期只差几个点。
export const monthSpentCentsThrough = (month: string, day: number): number =>
  BUILT.records.reduce((sum, record) => {
    const at = record.computedAt;
    return at.startsWith(month) && Number(at.slice(8, 10)) <= day ? sum + record.amountCents : sum;
  }, 0);

// 通话总量：包含未接通和待定价的通话——它们确实打了，只是没产生费用。
// 每一通都有对应的计费记录（含未接通和待定价），所以这个数同时就是明细表的行数。
export const USED_CALLS = ALL_CALLS.length;
export const USED_SECONDS = ALL_CALLS.reduce((sum, call) => sum + call.durationSec, 0);
export const USED_MINUTES = USED_SECONDS / 60;

// 其中智呼（呼出）那一份。口径与上面的通话总量完全一致（同样含未接通与待定价）——
// 两句话里的数出自同一批通话，客户拿它们相减不会减出负数。
const OUTBOUND_CALLS_LIST = ALL_CALLS.filter((call) => call.direction === 'outbound');
export const OUTBOUND_CALLS = OUTBOUND_CALLS_LIST.length;
export const OUTBOUND_MINUTES = OUTBOUND_CALLS_LIST.reduce((sum, call) => sum + call.durationSec, 0) / 60;

// ---------------- 套餐与账户 ----------------

export const TOTAL_SPENT_CENTS = totalSpentCents();
export const TALK_FEE_TOTAL_CENTS = TALK_FEE_CENTS;
export const REMAINING_TALK_FEE_CENTS = TALK_FEE_CENTS - TOTAL_SPENT_CENTS;

export const BILLING_PACKAGES: BillingPackage[] = [
  {
    id: 'pkg_202603',
    name: '标准套餐 A（6 路 · 1 年）',
    purchasedAt: '2026-03-01 00:05',
    totalCents: 6 * PACKAGE_PRICE_PER_CONCURRENCY_CENTS,
    talkFeeCents: 6 * GRANT_CENTS_PER_CONCURRENCY,
    usedCents: TOTAL_SPENT_CENTS,
    expiresAt: '2027-03-01',
    concurrency: 6,
  },
  {
    id: 'pkg_202604',
    name: '4 月增购（1 路 · 1 年）',
    purchasedAt: '2026-04-01 10:12',
    totalCents: PACKAGE_PRICE_PER_CONCURRENCY_CENTS,
    talkFeeCents: GRANT_CENTS_PER_CONCURRENCY,
    usedCents: 0,
    expiresAt: '2027-04-01',
    concurrency: 1,
  },
];

// 当前并发按购买批次的生效日和到期日计算；历史购买合计不等于任意一天的可用路数。
export const activeConcurrencyAt = (day: string): number =>
  BILLING_PACKAGES.reduce((sum, item) => (
    item.purchasedAt.slice(0, 10) <= day && (!item.expiresAt || day < item.expiresAt)
      ? sum + item.concurrency
      : sum
  ), 0);
export const ACTIVE_CONCURRENCY = activeConcurrencyAt(DATA_CUTOFF_LABEL);

// 套餐总额里不形成余额的那部分：7 万元中 5.25 万元是通话额度，1.75 万元是平台服务费。
export const PACKAGE_SERVICE_FEE_TOTAL_CENTS = BILLING_PACKAGES.reduce((sum, item) => sum + (item.totalCents - item.talkFeeCents), 0);

// 余额折算可用时长：按平台最低价 0.15 元/分钟估算。
// 这几个常量不再出现在面客页面上（价格是动态的，折算出来的是「按今天这个价能打多久」，
// 不是「还剩多久」），保留是因为额度与最低档之间的关系本身仍要被测试钉住。
export const REMAINING_MINUTES_AT_BASE_RATE = centsToYuan(REMAINING_TALK_FEE_CENTS) / milliToYuan(BASE_RATE_MILLI);
export const PURCHASED_MINUTES_AT_BASE_RATE = centsToYuan(TALK_FEE_TOTAL_CENTS) / milliToYuan(BASE_RATE_MILLI);
// 已经消耗掉的「额度分钟数」：按最低档折算。它和实际通话分钟数不是一回事——
// 单价高于最低档的机器人，一分钟通话会消耗掉多于一分钟的额度。
export const USED_MINUTES_AT_BASE_RATE = centsToYuan(TOTAL_SPENT_CENTS) / milliToYuan(BASE_RATE_MILLI);

export const SPENT_CENTS_FROM_LEDGER = (): number =>
  BILLING_LEDGER.filter((entry) => entry.type === 'call_charge').reduce((sum, entry) => sum - entry.amountCents, 0);

export const LEDGER_CLOSING_BALANCE_CENTS = BILLING_LEDGER[BILLING_LEDGER.length - 1].balanceAfterCents;

// 一笔扣费劈到各批次的金额之和，必须正好等于这笔扣费本身。
// 这两个数一旦不等，「批次剩余之和 = 账户余额」会从那一刻起悄悄错位，
// 而且是两边都在动、越错越多的那种——查起来极难。
export const ALLOCATED_CENTS_FROM_LEDGER = (): number =>
  BILLING_LEDGER
    .filter((entry) => entry.type === 'call_charge')
    .reduce((sum, entry) => sum + (entry.allocations ?? []).reduce((inner, part) => inner + part.amountCents, 0), 0);

// 各额度批次剩余之和。它不是「另一个余额」，它就是余额——账户流水链的期末值。
export const GRANT_REMAINDER_CENTS = BILLING_GRANT_BALANCES.reduce((sum, item) => sum + item.remainingCents, 0);

// 对账：逐通合计 = 流水扣费合计 = 批次分摊合计 = 套餐已用 = 概览卡上的已用，
// 且 批次剩余之和 = 账户流水期末余额。五者必须完全相等。
export const RECONCILIATION = {
  monthlyCents: TOTAL_SPENT_CENTS,
  ledgerCents: SPENT_CENTS_FROM_LEDGER(),
  packageUsedCents: BILLING_PACKAGES.reduce((sum, item) => sum + item.usedCents, 0),
  ledgerClosingCents: LEDGER_CLOSING_BALANCE_CENTS,
  remainingCents: REMAINING_TALK_FEE_CENTS,
  grantRemainderCents: GRANT_REMAINDER_CENTS,
  allocatedCents: ALLOCATED_CENTS_FROM_LEDGER(),
  ok:
    TOTAL_SPENT_CENTS === SPENT_CENTS_FROM_LEDGER() &&
    TOTAL_SPENT_CENTS === BILLING_PACKAGES.reduce((sum, item) => sum + item.usedCents, 0) &&
    TOTAL_SPENT_CENTS === ALLOCATED_CENTS_FROM_LEDGER() &&
    LEDGER_CLOSING_BALANCE_CENTS === REMAINING_TALK_FEE_CENTS &&
    GRANT_REMAINDER_CENTS === LEDGER_CLOSING_BALANCE_CENTS,
};

export const isLedgerChainIntact = (entries: LedgerEntry[] = BILLING_LEDGER): boolean => {
  let running = 0;
  return entries.every((entry) => {
    running += entry.amountCents;
    return running === entry.balanceAfterCents;
  });
};

export const formatMonthLabel = (month: string): string => `${Number(month.slice(5, 7))} 月`;

export const billingSummary = () => ({
  // 套餐里随附的映射额度总额（不是「话费」，也不是套餐总额）。
  grantedCents: TALK_FEE_CENTS,
  spentCents: TOTAL_SPENT_CENTS,
  remainingCents: REMAINING_TALK_FEE_CENTS,
  usedMinutes: USED_MINUTES,
  usedCalls: USED_CALLS,
  purchasedConcurrency: PURCHASED_CONCURRENCY,
  allocatedConcurrency: ALLOCATED_CONCURRENCY,
  composition: BALANCE_COMPOSITION,
});

// ---------------- 区间口径（页面顶部的「时间范围」用） ----------------

// 区间内的充值：按到账时刻取，含首尾两天。
// 授信不是充值（它是「能欠多少」，不是到账的钱），所以不计入——把它算进充值，
// 客户会看到一个自己从没充过的数字。
export interface RechargeUsage {
  totalCents: number;
  // 两类充值分开报：客户问的是「我到底充了多少」，而系统自动充的和自己掏的钱不是一回事。
  autoCents: number;
  manualCents: number;
  count: number;
}

export const rechargeInRange = (from: string, to: string): RechargeUsage => {
  const entries = BILLING_LEDGER.filter(
    (entry) => entry.type === 'recharge' && entry.occurredAt.slice(0, 10) >= from && entry.occurredAt.slice(0, 10) <= to,
  );
  const sumOf = (kind: FundKind) => entries.filter((entry) => entry.fundKind === kind).reduce((sum, entry) => sum + entry.amountCents, 0);
  return {
    autoCents: sumOf('voucher'),
    manualCents: sumOf('cash'),
    totalCents: entries.reduce((sum, entry) => sum + entry.amountCents, 0),
    count: entries.length,
  };
};

// ---------------- 消费明细行 ----------------

// 明细表既要计费结果（扣了多少钱），也要通话本身的信息（什么时候、打给谁）。
// 两者分属 BillingCallInput 与 CallBillingRecord，这里按 callId 合成一行，页面不用各自查。
export interface BillingCallRow {
  record: CallBillingRecord;
  robotId: string;
  robotName: string;
  startedAt: string;
  month: string;
  durationSec: number;
  phoneNumber: string;
  location: string;
  direction: 'outbound' | 'inbound';
  // 这通电话在通话记录模块里查得到，明细表才给出跳转入口。
  inCallRecords: boolean;
}

const INPUT_BY_CALL_ID = new Map(ALL_CALLS.map((input) => [input.callId, input]));
const CALL_RECORD_ID_SET = new Set<string>(CALL_IDS_IN_CALL_RECORDS);

// 明细表展示全部通话：每一通都能在这里查到，不是抽样。
// 所以「共 N 通」和概览卡上的「累计通话 N 通」是同一个数，「合计」和月度金额也是同一个数。
export const BILLING_CALL_ROWS: BillingCallRow[] = BILLING_CALL_RECORDS.map((record) => {
  const input = INPUT_BY_CALL_ID.get(record.callId);
  const startedAt = input?.startedAt || record.computedAt;
  return {
    record,
    robotId: record.snapshot.robotId,
    robotName: record.snapshot.robotName,
    startedAt,
    month: startedAt.slice(0, 7),
    durationSec: record.billableSec,
    phoneNumber: input ? maskPhone(input.phoneNumber) : '—',
    location: input?.location || '—',
    direction: input?.direction || 'outbound',
    inCallRecords: CALL_RECORD_ID_SET.has(record.callId),
  };
});

// 号码中间四位打码：页面上给客户看的一律是这个形状，完整号码不出现在计费中心。
function maskPhone(phone: string): string {
  return phone.length === 11 ? `${phone.slice(0, 3)}****${phone.slice(7)}` : phone;
}

// 区间内的用量：通话数、时长、金额，含首尾两天。
// 口径与「消费统计」一致——只统计已计费的通话，待定价和未接通的既没有金额也没有可比时长，
// 混进来会让「金额 ÷ 时长」算不出真实单价。
export interface RangeUsage {
  cents: number;
  calls: number;
  talkMinutes: number;
  // 呼出（智呼）单独报一份：客户问的是「多少通通话、多少智呼的时长」，
  // 这两件事对他们的业务不是一件事，合成一个数就答不了这个问题。
  outboundCalls: number;
  outboundMinutes: number;
}

export const usageInRange = (from: string, to: string): RangeUsage => {
  const rows = BILLING_CALL_ROWS.filter(
    (row) => row.record.billingStatus === 'billed' && row.startedAt.slice(0, 10) >= from && row.startedAt.slice(0, 10) <= to,
  );
  const outbound = rows.filter((row) => row.direction === 'outbound');
  return {
    cents: rows.reduce((sum, row) => sum + row.record.amountCents, 0),
    calls: rows.length,
    talkMinutes: rows.reduce((sum, row) => sum + row.durationSec, 0) / 60,
    outboundCalls: outbound.length,
    outboundMinutes: outbound.reduce((sum, row) => sum + row.durationSec, 0) / 60,
  };
};

// ---------------- 资金流水（充值记录 / 扣费记录） ----------------

// 一笔流水在页面上要摆出来的全部信息，按 callId / grantId 在这里一次查好，
// 页面不用自己去翻三份数据。
export interface FundFlowRow {
  entry: LedgerEntry;
  // 期初余额不另存一份：余额链是连续的，期初 = 期末 − 这笔金额。
  // 反推出来的数和真存一份完全相同，还不会出现两个数各走各的。
  beforeCents: number;
  // 这笔钱落在哪个批次上：充值是「充进了哪一批」，扣费是「扣的第一段来自哪一批」。
  // 拿不到批次（比如人工调整）时为 undefined，页面留白而不是编一个批次名。
  grantBalance?: GrantBalance;
  // 分摊到了几个批次。多段时页面要明说「含 N 个批次」——只说第一段，
  // 客户按批次名去核对会发现金额对不上，而账本身没错。
  allocationCount: number;
  // 扣费行对应的那一通电话，用来给出机器人、时长和当时的单价。
  call?: BillingCallRow;
}

const GRANT_BALANCE_BY_ID = new Map(BILLING_GRANT_BALANCES.map((item) => [item.grant.grantId, item]));
const CALL_ROW_BY_CALL_ID = new Map(BILLING_CALL_ROWS.map((row) => [row.record.callId, row]));

// 按时刻区间取流水，含首尾两天。type 不给就是全部类型。
// 预占和释放也是真实的余额变动（钱被占住又还回来），所以「全部」里保留它们，
// 页面上各自标明——把它们藏起来的话，期初余额会和上一笔的期末对不上。
export const fundFlowInRange = (from: string, to: string, type?: LedgerEntryType): FundFlowRow[] =>
  BILLING_LEDGER
    .filter((entry) => entry.occurredAt.slice(0, 10) >= from && entry.occurredAt.slice(0, 10) <= to)
    .filter((entry) => type === undefined || entry.type === type)
    .map((entry) => {
      const grantId = entry.allocations?.[0]?.grantId;
      return {
        entry,
        beforeCents: entry.balanceAfterCents - entry.amountCents,
        grantBalance: grantId === undefined ? undefined : GRANT_BALANCE_BY_ID.get(grantId),
        allocationCount: entry.allocations?.length ?? 0,
        call: entry.type === 'call_charge' ? CALL_ROW_BY_CALL_ID.get(entry.refId) : undefined,
      };
    });

// ---------------- 欠费提醒（设置 / 规则 / 记录） ----------------
// 提醒是「钱快用完」这件事唯一的出口：余额扣完新的通话就发不出去，
// 客户如果在收到提醒之前才发现，损失的是业务。所以设置、规则、记录三样都要有，
// 少了任何一样，客户和平台之间就只剩「我以为你会提醒我」这一句。

export type AlertTier = 'threshold' | 'exhausted' | 'debt' | 'expiry';

// 余额向的三档。阈值档是客户自己定的数，后两档是事实，不可关闭——
// 「余额已经用尽」和「已经欠费」不是偏好，客户不该有机会把它们关掉。
// 「额度即将到期」是第四档，但它是按「还剩几天」触发而不是按金额，档位表在 EXPIRY_TIER_DAYS。
export const ALERT_TIERS: { tier: AlertTier; label: string; desc: string; configurable: boolean }[] = [
  { tier: 'threshold', label: '余额低于预警值', desc: '账面余额低于你设的这个数时提醒一次。', configurable: true },
  { tier: 'exhausted', label: '余额已用尽', desc: '账面余额扣完时提醒。这一档不能关闭。', configurable: false },
  { tier: 'debt', label: '已经欠费', desc: '动用了平台授信、形成欠费时提醒。这一档不能关闭。', configurable: false },
  {
    tier: 'expiry',
    label: '额度即将到期',
    desc: '有额度批次快到期时提醒，按「还剩几天」触发，不看金额。这一档不能关闭。',
    configurable: false,
  },
];

// 到期提醒的提前量档位。分两档看待：
// - 7 天 / 1 天是默认开的，节奏与百度智能云对「资源包到期」的 7/3/1 天同一量级，
//   是能站住「国内有同行这么做」的那部分。
// - 30 天是可选、默认关闭的：34 家竞品里没有任何一家给到 30 天，做成默认会比全行业都激进；
//   但我们的映射额度是一年一清零、金额到万级，客户想早一点知道也合理，所以留成开关。
// 到期当日与到期后不再单独设档：到期清零本身会写一条 expire 流水（见 settleExpiries），
// 提醒记录里能看到，不需要再靠一条提醒来证明这件事发生过。
export const EXPIRY_TIER_DAYS: { days: number; optional: boolean; defaultOn: boolean }[] = [
  { days: 30, optional: true, defaultOn: false },
  { days: 7, optional: false, defaultOn: true },
  { days: 1, optional: false, defaultOn: true },
];

export interface NotifySettings {
  accountId: string;
  // 余额低于这个数就提醒。客户自己定——「还能用几天」要预测消耗率，
  // 而单价是动态的，预测出来的天数第二天就不成立。
  thresholdCents: number;
  channels: { email: boolean; sms: boolean };
  email: string;
  phone: string;
  // 同一档每天最多发几次、最多连发几天。这是防打扰的下限，不是客户偏好，不给改。
  maxPerDay: number;
  maxDays: number;
}

// 演示数据里客户还没动过预警设置，这是平台给新账户的默认值。
export const NOTIFY_SETTINGS: NotifySettings = {
  accountId: BILLING_ACCOUNT_ID,
  thresholdCents: 500000,
  channels: { email: true, sms: false },
  email: 'finance@example.com',
  phone: '138****0000',
  maxPerDay: 1,
  maxDays: 3,
};

// 一条提醒记录。发出的提醒必须留档：客户说「我没收到」、平台说「提醒过了」，
// 双方都得拿得出时间、渠道、接收人和当时那一刻的余额与欠费。
export interface NotifyRecord {
  id: string;
  tier: AlertTier;
  sentAt: string;
  channel: 'email' | 'sms';
  receiver: string;
  // 触发那一刻的余额与欠费：事后回看才知道当时是「快用完了」还是「已经欠了」，
  // 只看一个当前余额是回不了头的。
  balanceCents: number;
  debtCents: number;
  // 到期提醒专用：触发时距离到期还有几天、是哪一批要到期。
  // 「还有 7 天」这个数必须记下来——只记「发过到期提醒」，事后没法回答
  // 「是提前 7 天发的还是提前 1 天发的」，而那正是客户会追问的。
  // 余额向的四档不带这两个字段，页面留白而不是填 0。
  daysLeft?: number;
  grantTitle?: string;
  result: 'sent' | 'failed';
  failReason?: string;
}

// 演示数据里一条都没有：余额从 4.5 万花到 4.27 万，离预警值 5000 元还差得远，
// 三档一次都没被触达过。凭空编几条提醒记录，等于伪造一条账务事实，
// 而客户在验收时无从分辨哪些是真的。页面给完整表结构、规则说明与文案预览——
// 客户点开就知道「长什么样、什么时候会有一条」，不需要看见假的行。
export const NOTIFY_RECORDS: NotifyRecord[] = [];

// 提醒文案预览。用占位符写出会填进去的数，而不是编一条已经发生的提醒：
// 这是「你会收到什么」的说明，不是历史记录。
//
// 三句话必须都在，缺哪一句都会出事：
// ①「不会自动充值」——否则客户以为平台替他扣了款（国内五家云厂商都把这句写在明面上）；
// ②「不会中断正在进行的通话」——否则客户一收到提醒就以为通话要断；
// ③「余额用尽后新的通话会被拦住」——**这句最容易被漏掉**。GCP / Azure / 阿里云原文是
//    「告警不会停止你的用量」，那是因为它们后付费、欠费不影响当次调用；我们是预付制，
//    余额用尽新通话确实发不出去。照抄它们的说法等于把「会拦住」这件事藏起来，
//    客户到那天才发现，比提前说清糟糕得多。
export const NOTIFY_TEMPLATE = {
  emailSubject: '【语音智能体】账户余额提醒',
  emailBody:
    '你的账户（{账户名}）当前余额为 {账面余额} 元，已低于你设置的预警值 {预警值} 元。' +
    '这条提醒只是通知，不会自动增加额度，' +
    '也不会中断正在进行的通话。但余额用尽后，新的通话会被拦住。请联系客户经理补充通话额度。' +
    '如需调整预警值或接收人，可在计费中心「提醒」页修改。',
  smsBody:
    '【语音智能体】账户余额 {账面余额} 元，已低于预警值 {预警值} 元。提醒不会自动增加额度、' +
    '不中断通话；余额用尽后新通话会被拦住。请联系客户经理补充额度。',
  // 到期提醒是另一个事由，不能复用余额那套文案：客户看到「余额 42689 元」是不会动的，
  // 看到「有 15000 元将在 7 天后清零」才会动。这两件事必须分别写。
  expiryEmailSubject: '【语音智能体】额度即将到期提醒',
  expiryEmailBody:
    '你的账户（{账户名}）有一笔额度即将到期：「{批次名称}」剩余 {剩余金额} 元，' +
    '将在 {到期日} 到期（还有 {剩余天数} 天）。到期后未使用的部分会清零，不结转到下一期，也不退款。' +
    '扣费时会优先使用快到期的额度，正常情况下会自动用完；' +
    '如果这笔额度用不完而你还打算继续通话，可以考虑调整套餐。如需帮助请联系你的客户经理。',
  expirySmsBody:
    '【语音智能体】「{批次名称}」剩余 {剩余金额} 元，将于 {到期日} 到期（还剩 {剩余天数} 天），' +
    '到期未用部分清零、不结转、不退款。',
};

// ---------------- 客户动作：充值 / 自动充值 / 续费 / 加购 / 开票 ----------------
// 这一节存在的理由，是计费中心原来只有「看」没有「动」：提醒文案里写着
// 「请及时充值」「充值到账后即可继续发起通话」，而页面上找不到任何地方能充值。
// 文案承诺了一件产品做不到的事，比不承诺更糟——客户按提示去找，找不到，就只剩投诉。

// 充值方式。能不能用于自动充值不是偏好，是支付通道的能力：
// 对公转账没有代扣授权，系统无法在余额低时自己发起一笔汇款，所以它必须标 false。
// 把不可代扣的方式也列进自动充值的下拉里，客户选完才发现不生效，是一个纯人造的坑。
export type RechargeMethodId = 'online' | 'transfer' | 'manager';

export interface RechargeMethod {
  id: RechargeMethodId;
  label: string;
  desc: string;
  // 到账时间必须写出来：客户打了钱、余额没变的那几个小时里，
  // 他会以为钱丢了，而这时他唯一能看到的说明就是这句话。
  settle: string;
  autoRecharge: boolean;
}

export const RECHARGE_METHODS: RechargeMethod[] = [
  {
    id: 'online',
    label: '在线支付',
    desc: '企业网银 / 支付宝，付款后系统自动入账',
    settle: '实时到账，通常 1 分钟内余额就会更新',
    autoRecharge: true,
  },
  {
    id: 'transfer',
    label: '对公转账',
    desc: '汇款到平台对公账户，备注里填写账户号',
    settle: '1–2 个工作日到账，遇节假日顺延；到账前余额不变',
    autoRecharge: false,
  },
  {
    id: 'manager',
    label: '客户经理代充',
    desc: '由你的客户经理在后台替你发起，适用于已签年度合同的情况',
    settle: '实时到账',
    autoRecharge: false,
  },
];

// 充值面额。给几个档是为了省掉一次输入，自定义入口同时留着——
// 只给固定档会把「我就要充 3 万」的客户挡在门外。
export const RECHARGE_PRESET_CENTS: number[] = [1000000, 3000000, 5000000, 10000000];
// 单笔下限。低于它的充值手续费比金额还高，不如走客经代充。
export const RECHARGE_MIN_CENTS = 100000;

// 自动充值的硬约束。这几条不是客户的偏好，是防止「没授权的扣款滚起来」的闸门：
// 阈值有下限（否则等于每花一笔就充一次）、目标必须明显高于阈值（否则阈值一破就反复触发）、
// 每 24 小时有次数上限且不可解除。参照 ElevenLabs 的自动充值四件套
// （阈值 / 充值额 / 地板余额 / 月度上限）与 Metronome 的硬下限。
export const AUTO_RECHARGE_LIMITS = {
  minThresholdCents: 50000,
  minTargetCents: 100000,
  // 目标值至少要比阈值高这么多，否则「低于阈值 → 充到目标」会在同一秒反复成立。
  minTargetOverThresholdCents: 50000,
  maxPerDay: 10,
  minFloorCents: 10000,
};

export interface AutoRechargeSettings {
  enabled: boolean;
  // 「低于这个数就充」。默认与余额预警值同值：两件事本来就是同一时刻发生的，
  // 默认给两个不同的数会让客户先怀疑其中一个写错了。两个值仍然各自可改——
  // 一个只通知、一个会花钱，合并成一个开关是不负责任的。
  thresholdCents: number;
  // 「充到多少」。按目标值补足，而不是每次固定充一笔——
  // 固定金额在消耗快的时候会连续触发，在消耗慢的时候又会充多。
  targetCents: number;
  // 每月最多自动充多少。这是最后一道闸门：前两个值配错时，它保证损失有上限。
  monthlyCapCents: number;
  // 地板余额：低于它立刻充，不再看阈值。ElevenLabs 也有这一档。
  floorCents: number;
  // 每 24 小时最多充几次。硬上限，不给客户改。
  maxPerDay: number;
  // 扣款方式。只能选支持代扣的通道，所以这里是 online 而不是让客户随便选。
  method: RechargeMethodId;
  // 本月已经自动充了多少、几次。客户问「这钱是谁扣的」，靠这两个数回答。
  monthlyUsedCents: number;
  monthlyTimes: number;
}

// 演示数据里自动充值默认关闭：它是一个会自己花钱的开关，
// 默认打开等于替客户做了一个他没做过的决定。
export const AUTO_RECHARGE_SETTINGS: AutoRechargeSettings = {
  enabled: false,
  thresholdCents: NOTIFY_SETTINGS.thresholdCents,
  targetCents: 2000000,
  monthlyCapCents: 6000000,
  floorCents: 100000,
  maxPerDay: AUTO_RECHARGE_LIMITS.maxPerDay,
  method: 'online',
  monthlyUsedCents: 0,
  monthlyTimes: 0,
};

// 开票。可开票金额 = 已支付但还没开过票的部分，不是一个凭感觉填的数。
// 演示数据里套餐 6 万元已经全额开票，所以可开票是 0——
// 页面会因此把「申请开票」按钮禁掉并说明原因，而不是留一个点了没反应的按钮。
export interface InvoiceProfile {
  titleType: 'company' | 'personal';
  title: string;
  taxNo: string;
  paidCents: number;
  invoicedCents: number;
}

export const INVOICE_PROFILE: InvoiceProfile = {
  titleType: 'company',
  title: ACCOUNT_NAME,
  taxNo: '91310000MA1FL2XXXX',
  paidCents: PACKAGE_TOTAL_CENTS,
  invoicedCents: PACKAGE_TOTAL_CENTS,
};

export const invoiceableCents = (profile: InvoiceProfile = INVOICE_PROFILE): number =>
  Math.max(0, profile.paidCents - profile.invoicedCents);

// 续费与加购的报价。两者的区别只在到期日怎么算：
// - 续费是把现有套餐的到期日往后顺延一年（同一批并发继续用）；
// - 加购是新增并发，新增部分的额度**自到账之日起算一年**，与主套餐各自到期。
//   这一点照的是腾讯云「套餐内分钟数按月清零 + 加油包按年有效」的并列口径：
//   订阅型与储值型额度各算各的期限，不合并成一个日子。
// 两种方式里，只有映射额度那部分进余额，服务费不进——与主套餐口径完全一致。
export interface PurchaseQuote {
  // 套餐要付的钱、其中进余额的映射额度、其中不进余额的服务费。
  packageCents: number;
  grantCents: number;
  serviceFeeCents: number;
  expiresAt: string;
  concurrency: number;
}

// 到期日按「年」顺延。日期都是 YYYY-MM-DD，不跨时区，直接改年份即可。
const plusYears = (date: string, years: number): string => {
  const [year, ...rest] = date.split('-');
  return `${Number(year) + years}-${rest.join('-')}`;
};

export const concurrencyQuote = (ways: number): PurchaseQuote => ({
  concurrency: ways,
  packageCents: ways * PACKAGE_PRICE_PER_CONCURRENCY_CENTS,
  grantCents: ways * GRANT_CENTS_PER_CONCURRENCY,
  serviceFeeCents: ways * (PACKAGE_PRICE_PER_CONCURRENCY_CENTS - GRANT_CENTS_PER_CONCURRENCY),
  // 加购的额度从加购那天起算一年，用数据截止日当天近似「今天」。
  expiresAt: plusYears(DATA_CUTOFF_LABEL, 1),
});

export const renewalQuote = (packageId: string = BILLING_PACKAGES[0].id): PurchaseQuote => {
  const selected = BILLING_PACKAGES.find((item) => item.id === packageId) ?? BILLING_PACKAGES[0];
  return {
    concurrency: selected.concurrency,
    packageCents: selected.totalCents,
    grantCents: selected.talkFeeCents,
    serviceFeeCents: selected.totalCents - selected.talkFeeCents,
    // 续费从所选购买批次到期日顺延，其他批次不受影响。
    expiresAt: plusYears(selected.expiresAt || DATA_CUTOFF_LABEL, 1),
  };
};
