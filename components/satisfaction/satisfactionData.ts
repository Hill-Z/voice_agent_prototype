// 满意度调查演示数据：用 100 条多题型回答验证问卷完成率、核心满意度和逐题聚合口径。
import { SatisfactionSurvey, SatisfactionSurveyQuestion } from '../../types';

export const INITIAL_SATISFACTION_SURVEYS: SatisfactionSurvey[] = [
  {
    id: 'survey_after_sales_csat', name: '售后服务满意度调查', description: '覆盖服务评分、满意程度、问题解决、处理效率和改进建议。',
    mode: 'voice_agent', metricType: 'csat', language: 'inherit', status: 'published', version: 1,
    openingPrompt: '结束之前，想邀请您用一分钟评价本次服务。', closingPrompt: '感谢您的反馈，祝您生活愉快。',
    noInputPrompt: '没有听清，请您再说一次。', maxNoInputRetries: 1, primaryQuestionId: 'after_sales_score', responseCount: 40,
    updatedAt: new Date('2026-09-16 16:20:00').getTime(),
    questions: [
      {
        id: 'after_sales_score', title: '本次服务评分', prompt: '满分五分，您愿意为本次服务打几分？', type: 'rating', required: true,
        scaleMin: 0, scaleMax: 5, satisfactionThreshold: 4,
        reasonTraceEnabled: true, reasonScoreThreshold: 2, reasonTracePrompt: '方便说一下本次服务哪里没有做好吗？',
        reasonAggregationPrompt: '根据客户原话，从以下服务问题中选择最主要的一类。',
        reasonAggregationCategories: ['门店服务', '上门服务', '服务时间', '服务态度', '问题未解决', '其他'],
      },
      {
        id: 'after_sales_level', title: '满意程度', prompt: '整体来说，您对本次服务非常满意、满意、一般还是不满意？', type: 'single_choice', required: true,
        options: [{ value: 'very_satisfied', label: '非常满意', satisfied: true }, { value: 'satisfied', label: '满意', satisfied: true }, { value: 'normal', label: '一般' }, { value: 'dissatisfied', label: '不满意' }],
        reasonTraceEnabled: true, reasonTriggerValues: ['dissatisfied'], reasonTracePrompt: '您最不满意的是哪个方面？',
        reasonAggregationPrompt: '按最主要的不满意原因进行单选归类。',
        reasonAggregationCategories: ['服务态度', '等待时间', '业务能力', '流程复杂', '其他'],
      },
      { id: 'after_sales_resolved', title: '问题是否解决', prompt: '请问您的问题已经解决了吗？', type: 'single_choice', required: true, options: [{ value: 'resolved', label: '已解决' }, { value: 'partial', label: '部分解决' }, { value: 'unresolved', label: '未解决' }] },
      { id: 'after_sales_speed', title: '处理效率评分', prompt: '满分五分，您为本次处理效率打几分？', type: 'rating', required: true, scaleMin: 1, scaleMax: 5, satisfactionThreshold: 4 },
      { id: 'after_sales_suggestion', title: '改进建议', prompt: '您认为我们最需要改进的地方是什么？', type: 'open_text', required: true, aggregationPrompt: '根据客户原话归纳出最主要的改进方向；没有明确指向时归入其他。' },
    ],
  },
  {
    id: 'survey_store_experience', name: '门店服务体验调查', description: '三道题快速了解门店整体体验和改进方向。',
    mode: 'voice_agent', metricType: 'custom', language: 'inherit', status: 'published', version: 1,
    openingPrompt: '想请您简单评价一下本次门店服务。', closingPrompt: '感谢您的评价，我们会持续改进。',
    noInputPrompt: '没有听清，请您再说一次。', maxNoInputRetries: 1, primaryQuestionId: 'store_overall', responseCount: 26,
    updatedAt: new Date('2026-09-15 11:30:00').getTime(),
    questions: [
      {
        id: 'store_overall', title: '整体体验', prompt: '您对本次门店服务满意吗？', type: 'single_choice', required: true,
        options: [{ value: 'very_satisfied', label: '非常满意', satisfied: true }, { value: 'satisfied', label: '满意', satisfied: true }, { value: 'normal', label: '一般' }, { value: 'dissatisfied', label: '不满意' }],
        reasonTraceEnabled: true,
        reasonTriggerValues: ['normal', 'dissatisfied'], reasonTracePrompt: '可以说一下主要原因吗？',
        reasonAggregationPrompt: '根据客户原话选择最主要的原因。', reasonAggregationCategories: ['排队时间', '员工态度', '业务办理', '门店环境', '其他'],
      },
      { id: 'store_waiting', title: '等待时长感受', prompt: '您觉得本次等待时间可以接受吗？', type: 'single_choice', required: true, options: [{ value: 'acceptable', label: '可以接受' }, { value: 'long', label: '有点久' }, { value: 'too_long', label: '等待过久' }] },
      { id: 'store_comment', title: '门店建议', prompt: '您最希望门店改善什么？', type: 'open_text', required: true, aggregationPrompt: '根据客户原话归纳出最主要的改进方向。' },
    ],
  },
  {
    id: 'survey_delivery_ivr', name: '配送服务按键调查', description: '通过 IVR 按键采集配送评分、时效和服务态度。',
    mode: 'ivr', ivrFlowId: 'ivr_delivery_survey', ivrFlowName: '配送服务满意度 IVR', metricType: 'csat', language: 'zh-CN',
    status: 'published', version: 1, openingPrompt: '请不要挂机，接下来是本次配送服务评价。', closingPrompt: '感谢您的评价，再见。',
    noInputPrompt: '请输入一到五之间的数字。', maxNoInputRetries: 1, responseCount: 17,
    updatedAt: new Date('2026-09-14 10:00:00').getTime(),
    // 题目与核心满意度题由 ivr_delivery_survey 流程维护，问卷只保存绑定关系。
    questions: [],
  },
  {
    id: 'survey_claim_reason_draft', name: '理赔体验调查（草稿）', description: '尚未发布，可继续编辑。', mode: 'voice_agent',
    metricType: 'custom', language: 'inherit', status: 'draft', version: 1, openingPrompt: '想再占用您一分钟，了解本次理赔体验。',
    closingPrompt: '感谢参与。', noInputPrompt: '没有听清，请您再说一次。', maxNoInputRetries: 1, responseCount: 0,
    updatedAt: new Date('2026-09-17 11:15:00').getTime(),
    questions: [
      { id: 'claim_easy', title: '办理是否顺利', prompt: '您觉得本次理赔办理是否顺利？', type: 'single_choice', required: true, options: [{ value: 'smooth', label: '顺利', satisfied: true }, { value: 'normal', label: '一般' }, { value: 'difficult', label: '不顺利' }] },
      { id: 'claim_speed', title: '办理效率', prompt: '满分五分，您为办理效率打几分？', type: 'rating', required: true, scaleMin: 1, scaleMax: 5, satisfactionThreshold: 4 },
      { id: 'claim_comment', title: '改进建议', prompt: '请简单说说最需要改进的地方。', type: 'open_text', required: true },
    ],
  },
];

// IVR 类型问卷的题目由 IVR 流程自己维护，问卷只保存绑定关系。
// 编辑器下拉、报表解析和演示问卷共用这一份定义，避免同一套题目在两处各配一遍。
export interface SatisfactionIvrFlow {
  id: string;
  name: string;
  primaryQuestionId: string;
  questions: SatisfactionSurveyQuestion[];
}

export const SATISFACTION_IVR_FLOWS: SatisfactionIvrFlow[] = [
  {
    id: 'ivr_delivery_survey', name: '配送服务满意度 IVR', primaryQuestionId: 'delivery_score',
    questions: [
      { id: 'delivery_score', title: '配送服务评分', prompt: '一分非常不满意，五分非常满意，请按一到五评价。', type: 'rating', required: true, scaleMin: 1, scaleMax: 5, satisfactionThreshold: 4 },
      { id: 'delivery_speed', title: '配送时效', prompt: '及时请按一，一般请按二，不及时请按三。', type: 'single_choice', required: true, options: [{ value: '1', label: '及时' }, { value: '2', label: '一般' }, { value: '3', label: '不及时' }] },
      { id: 'delivery_attitude', title: '配送员服务', prompt: '满意请按一，一般请按二，不满意请按三。', type: 'single_choice', required: true, options: [{ value: '1', label: '满意' }, { value: '2', label: '一般' }, { value: '3', label: '不满意' }] },
    ],
  },
  {
    id: 'ivr_service_rating', name: '服务评价按键流程', primaryQuestionId: 'service_rating_score',
    questions: [
      { id: 'service_rating_score', title: '服务总体评价', prompt: '满意请按一，一般请按二，不满意请按三。', type: 'single_choice', required: true, options: [{ value: '1', label: '满意', satisfied: true }, { value: '2', label: '一般' }, { value: '3', label: '不满意' }] },
      { id: 'service_rating_speed', title: '响应速度', prompt: '快请按一，一般请按二，慢请按三。', type: 'single_choice', required: true, options: [{ value: '1', label: '快' }, { value: '2', label: '一般' }, { value: '3', label: '慢' }] },
    ],
  },
  {
    id: 'ivr_after_sales', name: '售后回访 IVR', primaryQuestionId: 'after_sales_ivr_score',
    questions: [
      { id: 'after_sales_ivr_score', title: '售后处理评分', prompt: '一分非常不满意，五分非常满意，请按一到五评价。', type: 'rating', required: true, scaleMin: 1, scaleMax: 5, satisfactionThreshold: 4 },
      { id: 'after_sales_ivr_resolved', title: '问题是否解决', prompt: '已解决请按一，未解决请按二。', type: 'single_choice', required: true, options: [{ value: '1', label: '已解决' }, { value: '2', label: '未解决' }] },
    ],
  },
];

export const findIvrFlow = (ivrFlowId?: string): SatisfactionIvrFlow | undefined =>
  SATISFACTION_IVR_FLOWS.find(flow => flow.id === ivrFlowId);

// IVR 问卷不自己保存题目：题目和核心满意度题统一从绑定的 IVR 流程读取。
export const resolveSurveyQuestions = (survey: SatisfactionSurvey): SatisfactionSurveyQuestion[] =>
  survey.mode === 'ivr' ? findIvrFlow(survey.ivrFlowId)?.questions ?? [] : survey.questions;

export const resolvePrimaryQuestionId = (survey: SatisfactionSurvey): string | undefined =>
  survey.mode === 'ivr' ? findIvrFlow(survey.ivrFlowId)?.primaryQuestionId : survey.primaryQuestionId;

export interface SatisfactionResponseAnswer {
  questionId: string;
  question: string;
  rawValue: string | number;
  displayValue: string;
  category?: string;
  reason?: string;
  reasonCategory?: string;
}

export interface SatisfactionResponseRecord {
  id: string;
  callId: string;
  time: string;
  botId: string;
  botName: string;
  surveyId: string;
  surveyName: string;
  mode: 'ivr' | 'voice_agent';
  status: 'completed' | 'incomplete';
  answeredCount: number;
  totalQuestionCount: number;
  answers: SatisfactionResponseAnswer[];
}

const reasonTexts = [
  ['等待时间太久了，一直没有人处理。', '服务时间'],
  ['上门师傅态度不错，但是问题没有彻底解决。', '问题未解决'],
  ['门店排队比较乱，找不到工作人员。', '门店服务'],
  ['客服解释得不清楚，来回问了好几次。', '服务态度'],
  ['预约时间一直变化，影响了我的安排。', '服务时间'],
] as const;

// 生成固定的 100 条记录，方便稳定验证不同问卷、未完成问卷和原因追溯。
const buildRecords = (): SatisfactionResponseRecord[] => Array.from({ length: 100 }, (_, index) => {
  const group = index % 10;
  const survey = group < 5 ? INITIAL_SATISFACTION_SURVEYS[0] : group < 8 ? INITIAL_SATISFACTION_SURVEYS[1] : INITIAL_SATISFACTION_SURVEYS[2];
  // 所有样本放在最近 28 天内，确保默认“最近 30 天”能完整展示 100 条演示数据。
  const dayOffset = index % 28;
  const time = new Date(new Date('2026-09-17T18:00:00').getTime() - dayOffset * 86400000 - (index % 8) * 2820000).toISOString();
  let answers: SatisfactionResponseAnswer[];

  if (survey.id === 'survey_after_sales_csat') {
    const score = index % 6;
    const levelValues = [['very_satisfied', '非常满意'], ['satisfied', '满意'], ['normal', '一般'], ['dissatisfied', '不满意']] as const;
    const level = levelValues[index % levelValues.length];
    const reason = reasonTexts[index % reasonTexts.length];
    const resolved = index % 4 === 0 ? ['unresolved', '未解决'] : index % 3 === 0 ? ['partial', '部分解决'] : ['resolved', '已解决'];
    const suggestionCategories = ['服务时间', '上门服务', '门店服务', '服务态度', '业务流程', '其他'];
    answers = [
      { questionId: 'after_sales_score', question: '本次服务评分', rawValue: score, displayValue: `${score} 分`, ...(score <= 2 ? { reason: reason[0], reasonCategory: reason[1] } : {}) },
      { questionId: 'after_sales_level', question: '满意程度', rawValue: level[0], displayValue: level[1], ...(level[0] === 'dissatisfied' ? { reason: reason[0], reasonCategory: reason[1] } : {}) },
      { questionId: 'after_sales_resolved', question: '问题是否解决', rawValue: resolved[0], displayValue: resolved[1] },
      { questionId: 'after_sales_speed', question: '处理效率评分', rawValue: (index % 5) + 1, displayValue: `${(index % 5) + 1} 分` },
      { questionId: 'after_sales_suggestion', question: '改进建议', rawValue: reason[0], displayValue: reason[0], ...(index % 11 === 0 ? {} : { category: suggestionCategories[index % suggestionCategories.length] }) },
    ];
  } else if (survey.id === 'survey_store_experience') {
    const overallValues = [['very_satisfied', '非常满意'], ['satisfied', '满意'], ['normal', '一般'], ['dissatisfied', '不满意']] as const;
    const overall = overallValues[index % overallValues.length];
    const waitingValues = [['acceptable', '可以接受'], ['long', '有点久'], ['too_long', '等待过久']] as const;
    const waiting = waitingValues[index % waitingValues.length];
    const categories = ['排队时间', '员工态度', '业务能力', '门店环境', '其他'];
    const reason = reasonTexts[index % reasonTexts.length];
    answers = [
      { questionId: 'store_overall', question: '整体体验', rawValue: overall[0], displayValue: overall[1], ...(['normal', 'dissatisfied'].includes(overall[0]) ? { reason: reason[0], reasonCategory: categories[index % categories.length] } : {}) },
      { questionId: 'store_waiting', question: '等待时长感受', rawValue: waiting[0], displayValue: waiting[1] },
      { questionId: 'store_comment', question: '门店建议', rawValue: reason[0], displayValue: reason[0], ...(index % 13 === 0 ? {} : { category: categories[index % categories.length] }) },
    ];
  } else {
    const score = (index % 5) + 1;
    answers = [
      { questionId: 'delivery_score', question: '配送服务评分', rawValue: score, displayValue: `${score} 分` },
      { questionId: 'delivery_speed', question: '配送时效', rawValue: String((index % 3) + 1), displayValue: ['及时', '一般', '不及时'][index % 3] },
      { questionId: 'delivery_attitude', question: '配送员服务', rawValue: String((index % 3) + 1), displayValue: ['满意', '一般', '不满意'][index % 3] },
    ];
  }

  const incomplete = index % 6 === 0;
  const answeredCount = incomplete ? Math.max(1, answers.length - 1 - (index % Math.max(1, answers.length - 1))) : answers.length;
  const visibleAnswers = answers.slice(0, answeredCount);
  return {
    id: `survey_response_${String(index + 1).padStart(3, '0')}`,
    // 报表按 Call ID 跳到通话记录，这里统一成 UUID 形状，保证跳转能命中对应的那次通话。
    callId: `8c4f${String(index + 1).padStart(4, '0')}-6b21-4d3a-9f07-${String(index + 1).padStart(12, '0')}`,
    time, botId: 'bot_didi_demo', botName: '滴滴出行智能客服 (Demo)', surveyId: survey.id, surveyName: survey.name,
    mode: survey.mode, status: visibleAnswers.length === answers.length ? 'completed' : 'incomplete',
    answeredCount: visibleAnswers.length, totalQuestionCount: answers.length, answers: visibleAnswers,
  };
});

export const SATISFACTION_RESPONSE_RECORDS: SatisfactionResponseRecord[] = buildRecords();
