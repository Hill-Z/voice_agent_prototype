// 计费引擎：把机器人的模型配置换算成每分钟成本、对客费率和每通通话的扣费金额。
// 全部走整数运算——单价存「厘/分钟」，金额存「分」，中间成本存「微元」，不出现二进制浮点。
import {
  ASRModel,
  BillingCostModel,
  BillingLanguageParam,
  BillingTier,
  BotConfiguration,
  BotRateResult,
  BotRateSnapshot,
  ModelType,
  RateSnapshotAsr,
  RateSnapshotLlm,
  RateSnapshotTts,
  TTSModel,
} from '../../types';

// 一元 = 100 分 = 1000 厘 = 1000000 微元。三个刻度各管一段：成本用微元、单价用厘、金额用分。
export const MICRO_PER_YUAN = 1000000;
export const MILLI_PER_YUAN = 1000;
export const CENTS_PER_YUAN = 100;

// 定价规则：报价 = 向上取整(成本 × 2)，但不低于底价。粒度 0.01 元。
export const PRICING_RULE = {
  version: 'v1-A',
  markupRatio: 2,
  // 底价 0.15 元/分钟 = 150 厘/分钟，与「最低档一毛五」一致。
  priceFloorMilli: 150,
  // 取整粒度 0.01 元 = 10 厘。
  priceGridMilli: 10,
};

// 成本表版本。生效日必须早于演示数据里最早的通话，否则会出现「一通 3 月的电话
// 按 9 月才生效的价格计费」，历史记录没法自证。
export const COST_TABLE_VERSION = 'cost-2026-01';

// 演示用汇率：海外模型按 1 美元 = 7.00 元折算，真实实现按快照日汇率。
export const FX_USD_CNY = 7.0;

// 并发预占：每路并发在通话开始前先按 5 分钟预占一笔额度，通话结束后按实际扣费释放差额。
// 这 5 分钟只是「预估占多少」，不是计费上限——长于 5 分钟的通话会超出预占额，按实际结算。
export const RESERVE_MINUTES_PER_CALL = 5;

// 取整规则：按通话时长按秒计费，每通最低计 1 秒，金额向上取整到分。
// 存进快照是为了历史通话能自证口径——将来若改成按 6 秒计费，靠它才能把老账对回来。
export const ROUNDING_RULE = {
  version: 'round-v1',
  billableBasis: 'call_duration_sec',
  minBillableSec: 1,
} as const;

// 语言折算参数：一分钟通话里机器人大概说多久、说多少字符、输入多少 token。
// 每分钟说多少字符是语言相关的：中文一字一音节，英文一个词好几个字符，两者差近四倍。
const LANGUAGE_PARAMS: BillingLanguageParam[] = [
  { language: 'zh-CN', label: '中文', ttsCharsPerSec: 4, ttsSpeakSecPerMin: 30, llmInputTokensPerMin: 10000, llmOutputTokensPerMin: 0, asrSpeechSecPerMin: 50 },
  { language: 'en-US', label: '英文', ttsCharsPerSec: 15.25, ttsSpeakSecPerMin: 30, llmInputTokensPerMin: 10000, llmOutputTokensPerMin: 0, asrSpeechSecPerMin: 50 },
  { language: 'yue-HK', label: '粤语', ttsCharsPerSec: 4, ttsSpeakSecPerMin: 30, llmInputTokensPerMin: 10000, llmOutputTokensPerMin: 0, asrSpeechSecPerMin: 50 },
];

// 查不到就返回 undefined，让调用方走「待定价」，绝不回落到中文参数。
// 回落是最危险的一种「不报错」：给一台日语机器人套中文的字符数，费率会安静地少算或
// 多算，页面上却看不出来。宁可显式地说「这个语言还没有折算参数」。
export const getLanguageParam = (language?: string): BillingLanguageParam | undefined =>
  language ? LANGUAGE_PARAMS.find((item) => item.language === language) : undefined;

// 给客户看的语言名。页面上写「zh-CN」客户读不懂，写「中文」才读得懂；
// 查不到就原样返回代码——宁可显示一个看得懂是代码的东西，也不要猜一个语言出来。
export const languageLabel = (language: string): string => getLanguageParam(language)?.label ?? language;

// 成本参数表：供应商侧的单位价。标 estimated 的是演示估值，需业务替换为真实采购价。
const C = (
  id: string,
  category: BillingCostModel['category'],
  displayName: string,
  unit: BillingCostModel['unit'],
  unitPrice: number,
  boundModelValue?: string,
  estimated?: boolean,
): BillingCostModel => ({ id, category, displayName, unit, unitPrice, effectiveFrom: '2026-01-01', boundModelValue, estimated });

export const BILLING_COST_MODELS: BillingCostModel[] = [
  // ASR：元/小时。千问 ASR 按口述的 0.8 元/小时；AWS 按 1 美元/小时折 7 元。
  C('asr.qwen.general', 'ASR', '千问 ASR', 'per_hour', 0.8),
  C('asr.aws.transcribe', 'ASR', 'AWS Transcribe', 'per_hour', 1 * FX_USD_CNY, ASRModel.AWS_TRANSCRIBE),
  C('asr.azure.stt', 'ASR', 'Azure STT', 'per_hour', 6.5, ASRModel.AZURE_STT, true),
  C('asr.google.stt', 'ASR', 'Google STT', 'per_hour', 6.3, ASRModel.GOOGLE_STT, true),
  C('asr.openai.whisper', 'ASR', 'Whisper V3', 'per_hour', 4.2, ASRModel.OPENAI_WHISPER, true),
  C('asr.volc.asr', 'ASR', '火山引擎语音识别', 'per_hour', 2.4, ASRModel.VOLC_ASR, true),
  C('asr.tencent.zh', 'ASR', '腾讯中文', 'per_hour', 2.1, ASRModel.TENCENT_CHINESE, true),
  C('asr.tencent.zh.large', 'ASR', '腾讯中文大模型', 'per_hour', 3.5, ASRModel.TENCENT_CHINESE_LARGE, true),
  C('asr.tencent.en', 'ASR', '腾讯英文', 'per_hour', 2.1, ASRModel.TENCENT_ENGLISH, true),
  C('asr.tencent.en.large', 'ASR', '腾讯英文大模型', 'per_hour', 3.5, ASRModel.TENCENT_ENGLISH_LARGE, true),
  C('asr.tencent.yue', 'ASR', '腾讯粤语', 'per_hour', 2.4, ASRModel.TENCENT_CANTONESE, true),
  C('asr.tencent.zh_en_yue', 'ASR', '腾讯中英粤方言大模型', 'per_hour', 3.8, ASRModel.TENCENT_ZH_EN_YUE, true),
  C('asr.tencent.zh_large_16k', 'ASR', '腾讯普方英大模型', 'per_hour', 3.8, ASRModel.TENCENT_PUTONGHUA_ENGLISH, true),
  C('asr.tencent.multi_lang', 'ASR', '腾讯多语种大模型', 'per_hour', 4.2, ASRModel.TENCENT_MULTILINGUAL, true),
  C('asr.tencent.zh_en_yue_v2', 'ASR', '腾讯中英粤方言大模型 2.0', 'per_hour', 4.0, ASRModel.TENCENT_ZH_EN_YUE_V2, true),
  C('asr.tencent.speaker_v2', 'ASR', '腾讯中英粤方言大模型 2.0（说话人分离）', 'per_hour', 4.5, ASRModel.TENCENT_ZH_EN_YUE_SPEAKER, true),
  C('asr.tencent.hunyuan', 'ASR', '腾讯混元大模型 3.0', 'per_hour', 4.8, ASRModel.TENCENT_HUNYUAN, true),

  // TTS：元/万字符。MiniMax 三档按口述的 2 / 3.5 / 4 元。
  C('tts.minimax.std', 'TTS', 'MiniMax 标准音色', 'per_10k_chars', 2.0),
  C('tts.minimax.pro', 'TTS', 'MiniMax 高级音色', 'per_10k_chars', 3.5),
  C('tts.minimax.flagship', 'TTS', 'MiniMax 旗舰音色', 'per_10k_chars', 4.0),
  C('tts.self', 'TTS', '自研 TTS', 'per_10k_chars', 1.2, TTSModel.SELF_DEVELOPED_TTS, true),
  C('tts.gemini', 'TTS', 'Gemini TTS', 'per_10k_chars', 2.8, TTSModel.GEMINI_TTS, true),
  C('tts.azure', 'TTS', 'Azure TTS', 'per_10k_chars', 3.0, TTSModel.AZURE_TTS, true),
  C('tts.openai', 'TTS', 'OpenAI TTS', 'per_10k_chars', 3.6, TTSModel.OPENAI_TTS, true),
  C('tts.volc', 'TTS', '火山引擎 TTS', 'per_10k_chars', 1.8, TTSModel.VOLC_TTS, true),

  // 大模型：元/百万输入 token。千问 plus / max 按口述的 2 / 12 元。
  C('llm.qwen.plus', 'LLM', '千问 plus', 'per_million_tokens', 2.0),
  C('llm.qwen.max', 'LLM', '千问 max', 'per_million_tokens', 12.0),
  C('llm.gemini.flash', 'LLM', 'Gemini Flash 2.0', 'per_million_tokens', 1.5, ModelType.GEMINI_FLASH, true),
  C('llm.gemini.pro', 'LLM', 'Gemini Pro 1.5', 'per_million_tokens', 10.0, ModelType.GEMINI_PRO, true),
  C('llm.gpt4o', 'LLM', 'GPT-4o', 'per_million_tokens', 18.0, ModelType.GPT4_O, true),
  C('llm.claude35', 'LLM', 'Claude 3.5 Sonnet', 'per_million_tokens', 21.0, ModelType.CLAUDE_35, true),
];

// 查成本模型：先按机器人配置里的枚举值找绑定项，找不到再按成本模型自身的 id 找。
// 按 id 找是为了让「配置里还选不到、但已经有定价」的模型（如千问、MiniMax）
// 也能用在演示数据和历史机器人上，不必为了计费去扩配置枚举。
export const findCostModel = (category: BillingCostModel['category'], value?: string): BillingCostModel | undefined => {
  if (!value) return undefined;
  return (
    BILLING_COST_MODELS.find((item) => item.category === category && item.boundModelValue === value) ||
    BILLING_COST_MODELS.find((item) => item.category === category && item.id === value)
  );
};

// 整数向上取整除法，只对非负数使用。
export const ceilDiv = (value: number, divisor: number): number => Math.ceil(value / divisor);

// 成本分项：把供应商单位价折算成「每分钟通话」的成本，单位微元。
const asrCostMicro = (unitPricePerHour: number, speechSecPerMin: number) =>
  Math.round((unitPricePerHour * MICRO_PER_YUAN * speechSecPerMin) / 3600);

const ttsCostMicro = (unitPricePer10kChars: number, charsPerMin: number) =>
  Math.round((unitPricePer10kChars * MICRO_PER_YUAN * charsPerMin) / 10000);

const llmCostMicro = (inputPricePerMillion: number, inputTokensPerMin: number) =>
  Math.round((inputPricePerMillion * MICRO_PER_YUAN * inputTokensPerMin) / 1000000);

// 报价 = 向上取整到分(成本 × 倍率)，再与底价取大。触底标记只在真的被底价抬高时才置位。
export const derivePriceMilli = (costTotalMicro: number) => {
  const priceListMicro = costTotalMicro * PRICING_RULE.markupRatio;
  const gridMicro = PRICING_RULE.priceGridMilli * (MICRO_PER_YUAN / MILLI_PER_YUAN);
  const roundedMilli = ceilDiv(priceListMicro, gridMicro) * PRICING_RULE.priceGridMilli;
  const floorApplied = roundedMilli < PRICING_RULE.priceFloorMilli;
  const priceMilli = Math.max(PRICING_RULE.priceFloorMilli, roundedMilli);
  return { priceListMicro, priceMilli, floorApplied };
};

// 档位名对客可见，所以要能自解释。
export const getTier = (priceMilli: number): BillingTier => {
  if (priceMilli >= 500) return 'premium';
  if (priceMilli >= 300) return 'advanced';
  return 'standard';
};

export const TIER_LABEL: Record<BillingTier, string> = {
  standard: '标准档',
  advanced: '高配档',
  premium: '尊享档',
};

// 扣费金额：只做一次取整，60 秒 × 150 厘/分 = 9000，除以 600（= 60 秒 × 10 厘）得 15 分。
export const computeAmountCents = (billableSec: number, priceMilli: number): number =>
  ceilDiv(billableSec * priceMilli, 600);

// 并发预占：按 5 分钟预估占一笔，通话结束后释放差额。
// 通话超过 5 分钟时预占额不够，仍然按实际时长结算——预占只管「能不能占用一路并发」。
export const computeReserveCents = (priceMilli: number): number =>
  ceilDiv(RESERVE_MINUTES_PER_CALL * priceMilli, 10);

export const microToYuan = (micro: number): number => micro / MICRO_PER_YUAN;
export const milliToYuan = (milli: number): number => milli / MILLI_PER_YUAN;
export const centsToYuan = (cents: number): number => cents / CENTS_PER_YUAN;

// 单价展示统一保留两位：0.15 显示为「0.15 元/分钟」。
// 注意别和 reportUi 的同名 formatRate 搞混——那个返回的是百分比（「92.5%」），
// 这两个函数名字一样但语义完全相反，所以这里叫 formatPricePerMin，把差异写进名字里。
export const formatPricePerMin = (milli: number): string => `${milliToYuan(milli).toFixed(2)} 元/分钟`;

// 快照内容哈希：只用于校验快照未被改写，原型里用确定性的字符串散列即可。
const hashSnapshot = (payload: string): string => {
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `snap_${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

export interface RateInput {
  robotId: string;
  robotName: string;
  publishVersion: string;
  asrModel?: ASRModel | string;
  ttsModel?: TTSModel | string;
  llmModel?: ModelType | string;
  voiceName?: string;
  language?: string;
  computedAt?: string;
}

// 输入里缺哪个模型就报哪个，用来生成「待定价」的可读原因。
const CATEGORY_LABEL: Record<BillingCostModel['category'], string> = { ASR: '语音识别', TTS: '音色', LLM: '大模型' };

// 计费主入口：配置 → 费率快照。查不到成本模型时返回 pending，绝不返回 0 也绝不套默认值。
export const computeRate = (input: RateInput): BotRateResult => {
  const missing: string[] = [];
  const reasons: string[] = [];

  const resolve = (category: BillingCostModel['category'], value?: string): BillingCostModel | undefined => {
    if (!value) {
      missing.push(CATEGORY_LABEL[category]);
      reasons.push(`这台机器人还没有配置${CATEGORY_LABEL[category]}`);
      return undefined;
    }
    const model = findCostModel(category, value);
    if (!model) {
      missing.push(CATEGORY_LABEL[category]);
      reasons.push(`这台机器人使用的${CATEGORY_LABEL[category]}模型还没有配置价格`);
    }
    return model;
  };

  const asrCostModel = resolve('ASR', input.asrModel);
  const ttsCostModel = resolve('TTS', input.ttsModel);
  const llmCostModel = resolve('LLM', input.llmModel);

  if (!asrCostModel || !ttsCostModel || !llmCostModel) {
    return { accuracy: 'pending', missing, reasons };
  }

  const language = input.language || 'zh-CN';
  const langParam = getLanguageParam(language);

  // 语言没有折算参数就停在这里，不套一个别的语言的参数往下算。
  if (!langParam) {
    return {
      accuracy: 'pending',
      missing: ['主语言'],
      reasons: [`这台机器人的主语言（${language}）还没有折算参数，暂时算不出费率`],
    };
  }

  const asr: RateSnapshotAsr = {
    modelId: asrCostModel.id,
    displayName: asrCostModel.displayName,
    boundModelValue: asrCostModel.boundModelValue,
    unitPricePerHour: asrCostModel.unitPrice,
    speechSecPerMin: langParam.asrSpeechSecPerMin,
    costPerMinMicro: asrCostMicro(asrCostModel.unitPrice, langParam.asrSpeechSecPerMin),
  };

  // TTS 按机器人实际播报的字符数计价：每分钟说 30 秒 × 该语言每秒字数。
  const charsPerMin = Math.round(langParam.ttsSpeakSecPerMin * langParam.ttsCharsPerSec);
  const tts: RateSnapshotTts = {
    modelId: ttsCostModel.id,
    displayName: ttsCostModel.displayName,
    boundModelValue: ttsCostModel.boundModelValue,
    voiceName: input.voiceName || '默认音色',
    language,
    unitPricePer10kChars: ttsCostModel.unitPrice,
    charsPerMin,
    charsPerMinMethod: 'duration_x_rate',
    speakSecPerMin: langParam.ttsSpeakSecPerMin,
    costPerMinMicro: ttsCostMicro(ttsCostModel.unitPrice, charsPerMin),
  };

  // 输出 token 单价暂缺，只计输入，并在快照里显式标记，避免看起来像「输出免费」。
  const llm: RateSnapshotLlm = {
    modelId: llmCostModel.id,
    displayName: llmCostModel.displayName,
    boundModelValue: llmCostModel.boundModelValue,
    inputPricePerMillion: llmCostModel.unitPrice,
    outputPricePerMillion: null,
    outputPriceMissing: true,
    inputTokensPerMin: langParam.llmInputTokensPerMin,
    outputTokensPerMin: langParam.llmOutputTokensPerMin,
    costPerMinMicro: llmCostMicro(llmCostModel.unitPrice, langParam.llmInputTokensPerMin),
  };

  const costPerMinMicro = asr.costPerMinMicro + tts.costPerMinMicro + llm.costPerMinMicro;
  const { priceListMicro, priceMilli, floorApplied } = derivePriceMilli(costPerMinMicro);
  const computedAt = input.computedAt || new Date().toISOString();

  // 哈希只覆盖「配置和规则」，不含时刻——同样一份配置无论什么时候算，指纹都一样，
  // 这样才谈得上「同一输入得同一输出」。时刻的差异交给 snapshotId。
  const hash = hashSnapshot(
    JSON.stringify({
      robotId: input.robotId,
      robotName: input.robotName,
      publishVersion: input.publishVersion,
      language,
      asr,
      tts,
      llm,
      costPerMinMicro,
      markupRatio: PRICING_RULE.markupRatio,
      priceListMicro,
      priceGridMilli: PRICING_RULE.priceGridMilli,
      priceFloorMilli: PRICING_RULE.priceFloorMilli,
      priceMilli,
      floorApplied,
      tier: getTier(priceMilli),
      pricingRuleVersion: PRICING_RULE.version,
      costTableVersion: COST_TABLE_VERSION,
      roundingRuleVersion: ROUNDING_RULE.version,
      fxUsdCny: FX_USD_CNY,
    }),
  );

  return {
    accuracy: 'priced',
    rate: {
      // 编号带上时刻，逐通通话各不相同；指纹不带时刻，同配置跨通话一致。
      snapshotId: hashSnapshot(`${hash}|${computedAt}`),
      robotId: input.robotId,
      robotName: input.robotName,
      publishVersion: input.publishVersion,
      language,
      asr,
      tts,
      llm,
      costPerMinMicro,
      markupRatio: PRICING_RULE.markupRatio,
      priceListMicro,
      priceGridMilli: PRICING_RULE.priceGridMilli,
      priceFloorMilli: PRICING_RULE.priceFloorMilli,
      priceMilli,
      floorApplied,
      tier: getTier(priceMilli),
      pricingRuleVersion: PRICING_RULE.version,
      costTableVersion: COST_TABLE_VERSION,
      roundingRuleVersion: ROUNDING_RULE.version,
      billableBasis: ROUNDING_RULE.billableBasis,
      minBillableSec: ROUNDING_RULE.minBillableSec,
      fxUsdCny: FX_USD_CNY,
      computedAt,
      hash,
    },
  };
};

// 把一份费率钉到某一通通话上：每条记录都拿到一份独立的副本，计费时刻改成通话开始时间，
// 编号按新时刻重算，配置指纹保持不变（同一份配置本来就该有同一个指纹）。
// 必须逐层复制：直接引用机器人级共享对象的话，以后改一行配置就会连带改掉所有历史
// 通话的单价和金额，而账面上什么都看不出来。
export const captureSnapshotAt = (rate: BotRateSnapshot, capturedAt: string): BotRateSnapshot => ({
  ...rate,
  asr: { ...rate.asr },
  tts: { ...rate.tts },
  llm: { ...rate.llm },
  computedAt: capturedAt,
  snapshotId: hashSnapshot(`${rate.hash}|${capturedAt}`),
});

// 从机器人配置直接算费率，供列表页和发布预览复用同一套口径。
export const computeRateForBot = (bot: BotConfiguration, publishVersion?: string): BotRateResult =>
  computeRate({
    robotId: bot.id,
    robotName: bot.name,
    publishVersion: publishVersion || bot.currentVersion || bot.onlineVersion || '未发布',
    asrModel: bot.asrModel,
    ttsModel: bot.ttsModel,
    llmModel: bot.llmType,
    voiceName: bot.voiceName,
    language: bot.asrPrimaryLanguage,
  });

// 面向客户的计价说明：一句话讲清这通电话为什么是这个价。
export const buildFormula = (billableSec: number, snapshot: BotRateSnapshot, amountCents: number): string =>
  `${billableSec} 秒 × ${milliToYuan(snapshot.priceMilli).toFixed(2)} 元/分钟 ÷ 60 → 向上取整到分 = ${centsToYuan(amountCents).toFixed(2)} 元`;

export const buildPriceBreakdown = (snapshot: BotRateSnapshot): string => {
  const list = microToYuan(snapshot.priceListMicro).toFixed(4);
  const base = `${microToYuan(snapshot.costPerMinMicro).toFixed(4)} × ${snapshot.markupRatio} = ${list} 元/分钟`;
  return snapshot.floorApplied
    ? `${base}，低于最低价 ${milliToYuan(snapshot.priceFloorMilli).toFixed(2)} 元/分钟，已按最低价计费`
    : `${base}，向上取整到 ${milliToYuan(snapshot.priceGridMilli).toFixed(2)} 元，费率 ${milliToYuan(snapshot.priceMilli).toFixed(2)} 元/分钟`;
};
