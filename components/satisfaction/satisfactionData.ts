// 满意度调查模块的演示数据，供问卷管理、报表和通话记录共同展示。
import { SatisfactionSurvey } from '../../types';

export const INITIAL_SATISFACTION_SURVEYS: SatisfactionSurvey[] = [
  {
    id: 'survey_after_sales_csat',
    name: '售后服务满意度调查',
    description: '通话结束前收集服务评分，低分时继续询问原因。',
    mode: 'voice_agent',
    metricType: 'csat',
    language: 'zh-CN',
    status: 'published',
    version: 3,
    openingPrompt: '结束之前，想邀请您用半分钟评价本次服务。',
    closingPrompt: '感谢您的反馈，祝您生活愉快。',
    noInputPrompt: '没有听清，您可以直接说出一到五分，也可以按键选择。',
    maxNoInputRetries: 1,
    responseCount: 1286,
    updatedAt: new Date('2026-08-25 16:20:00').getTime(),
    questions: [
      {
        id: 'csat_score',
        title: '本次服务评分',
        prompt: '请问您对本次服务满意吗？一分非常不满意，五分非常满意。',
        type: 'rating',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        lowScoreFollowUpEnabled: true,
        lowScoreThreshold: 3,
        lowScoreFollowUpPrompt: '方便告诉我本次服务哪里没有做好吗？',
      },
    ],
  },
  {
    id: 'survey_delivery_ivr',
    name: '配送结果按键评价',
    description: '使用按键快速评价配送服务。',
    mode: 'ivr',
    ivrFlowId: 'ivr_delivery_survey',
    ivrFlowName: '配送服务满意度 IVR',
    metricType: 'csat',
    language: 'zh-CN',
    status: 'published',
    version: 2,
    openingPrompt: '请不要挂机，接下来是本次配送服务评价。',
    closingPrompt: '感谢您的评价，再见。',
    noInputPrompt: '请输入一到五之间的数字。',
    maxNoInputRetries: 1,
    responseCount: 842,
    updatedAt: new Date('2026-08-23 10:00:00').getTime(),
    questions: [
      {
        id: 'delivery_score',
        title: '配送服务评分',
        prompt: '一分非常不满意，五分非常满意，请按一到五进行评价。',
        type: 'rating',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
      },
      {
        id: 'delivery_speed',
        title: '配送时效评价',
        prompt: '配送及时请按一，一般请按三，不及时请按九。',
        type: 'single_choice',
        required: true,
        options: [
          { value: '1', label: '及时' },
          { value: '3', label: '一般' },
          { value: '9', label: '不及时' },
        ],
      },
    ],
  },
  {
    id: 'survey_brand_nps',
    name: '品牌推荐度调查',
    description: '收集客户向他人推荐服务的可能性。',
    mode: 'voice_agent',
    metricType: 'nps',
    language: 'zh-CN',
    status: 'published',
    version: 1,
    openingPrompt: '结束前还有一个简短的问题。',
    closingPrompt: '感谢您的建议，再见。',
    noInputPrompt: '请说出零到十分中的一个分数。',
    maxNoInputRetries: 1,
    responseCount: 396,
    updatedAt: new Date('2026-08-21 14:30:00').getTime(),
    questions: [
      {
        id: 'nps_score',
        title: '推荐意愿',
        prompt: '零到十分，您有多大可能把我们的服务推荐给朋友？',
        type: 'rating',
        required: true,
        scaleMin: 0,
        scaleMax: 10,
        lowScoreFollowUpEnabled: true,
        lowScoreThreshold: 6,
        lowScoreFollowUpPrompt: '最需要我们改进的地方是什么？',
      },
    ],
  },
  {
    id: 'survey_claim_reason_draft',
    name: '理赔体验调查',
    description: '了解理赔流程中的主要问题。',
    mode: 'voice_agent',
    metricType: 'custom',
    language: 'zh-CN',
    status: 'draft',
    version: 1,
    openingPrompt: '想再占用您一分钟，了解本次理赔体验。',
    closingPrompt: '您的意见会帮助我们改进服务，感谢参与。',
    noInputPrompt: '没有听清，请您再说一次。',
    maxNoInputRetries: 1,
    responseCount: 0,
    updatedAt: new Date('2026-08-20 11:15:00').getTime(),
    questions: [
      {
        id: 'claim_easy',
        title: '办理是否顺利',
        prompt: '您觉得本次理赔办理是否顺利？',
        type: 'single_choice',
        required: true,
        options: [
          { value: '1', label: '顺利' },
          { value: '2', label: '一般' },
          { value: '3', label: '不顺利' },
        ],
      },
      {
        id: 'claim_comment',
        title: '改进建议',
        prompt: '请简单说说最需要改进的地方。',
        type: 'open_text',
        required: false,
      },
    ],
  },
];

export interface SatisfactionResponseRecord {
  id: string;
  callId: string;
  time: string;
  botId: string;
  botName: string;
  surveyId: string;
  surveyName: string;
  metricType: 'csat' | 'nps' | 'custom';
  mode: 'ivr' | 'voice_agent';
  status: 'completed' | 'abandoned' | 'skipped' | 'failed';
  score?: number;
  feedback?: string;
  theme?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export const SATISFACTION_RESPONSE_RECORDS: SatisfactionResponseRecord[] = [
  { id: 'sr_1', callId: '4cb67f3a-6d81-4033-bb5f-a3cf8292a2e5', time: '2026-08-25 16:42:18', botId: 'bot_didi_demo', botName: '滴滴出行智能客服 (Demo)', surveyId: 'survey_after_sales_csat', surveyName: '售后服务满意度调查', metricType: 'csat', mode: 'voice_agent', status: 'completed', score: 2, feedback: '机器人一直没听懂我的车牌号，重复问了好几次。', theme: '语音识别问题', sentiment: 'negative' },
  { id: 'sr_2', callId: '08a7ebe7-6e5d-43ce-8f49-ebf87f3e34f7', time: '2026-08-25 15:19:04', botId: 'bot_agent_demo', botName: '🤖 语音 Agent 演示 (多工具场景)', surveyId: 'survey_after_sales_csat', surveyName: '售后服务满意度调查', metricType: 'csat', mode: 'voice_agent', status: 'completed', score: 5, feedback: '处理得很快，问题已经解决。', theme: '问题解决效率', sentiment: 'positive' },
  { id: 'sr_3', callId: '0493b480-122a-44ea-9664-d68ac819476e', time: '2026-08-25 13:08:52', botId: 'bot_didi_demo', botName: '滴滴出行智能客服 (Demo)', surveyId: 'survey_delivery_ivr', surveyName: '配送结果按键评价', metricType: 'csat', mode: 'ivr', status: 'completed', score: 4 },
  { id: 'sr_4', callId: 'd2b8b0cb-bfdd-4d38-9eb0-db115efae331', time: '2026-08-25 11:40:19', botId: 'bot_didi_demo', botName: '滴滴出行智能客服 (Demo)', surveyId: 'survey_brand_nps', surveyName: '品牌推荐度调查', metricType: 'nps', mode: 'voice_agent', status: 'completed', score: 9, feedback: '接通快，而且不用排队。', theme: '接通与等待', sentiment: 'positive' },
  { id: 'sr_5', callId: 'c24cdc8c-1d8f-45f6-8635-03d3ab6949ae', time: '2026-08-24 18:12:21', botId: 'bot_agent_demo', botName: '🤖 语音 Agent 演示 (多工具场景)', surveyId: 'survey_brand_nps', surveyName: '品牌推荐度调查', metricType: 'nps', mode: 'voice_agent', status: 'completed', score: 4, feedback: '最后还是转了人工，机器人没有解决。', theme: '问题未解决', sentiment: 'negative' },
  { id: 'sr_6', callId: '80b85e14-7c02-497c-a82e-bfd27f11a3b2', time: '2026-08-24 16:03:11', botId: 'bot_didi_demo', botName: '滴滴出行智能客服 (Demo)', surveyId: 'survey_after_sales_csat', surveyName: '售后服务满意度调查', metricType: 'csat', mode: 'voice_agent', status: 'abandoned' },
];
