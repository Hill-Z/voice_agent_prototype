
import React, { useState } from 'react';
import { Sidebar, Header } from './components/ui/LayoutComponents';
import { BotConfiguration, ModelType, TTSModel, ASRModel, EMOTIONS, LabelGroup, BotVariable, ExtractionConfig, BotIntent, MarketingCampaign } from './types';
import InformationExtraction from './InformationExtraction';
import BotConfigForm from './components/bot/BotConfigForm';
import BotListView from './components/bot/BotListView';
import LongTermFlowConfig from './components/flow/LongTermFlowConfig';
import FunctionManager from './components/flow/FunctionManager';
import IntegrationCenter from './components/integration/IntegrationCenter';
import GatewayCenter from './components/gateway/GatewayCenter';
import QAManager from './components/knowledge/QAManager';
import KnowledgeDiscovery from './components/knowledge/KnowledgeDiscovery';
import LexiconManager from './components/lexicon/LexiconManager';
import SeatManager from './components/seats/SeatManager';
import VoiceMarket from './components/market/VoiceMarket';
import TemplateMarket from './components/market/TemplateMarket';
import NumberManagement from './components/number/NumberManagement';
import GeoGroupManager from './components/settings/GeoGroupManager';
import BusinessHoursManager from './components/settings/BusinessHoursManager';
import ModelTraining from './components/settings/ModelTraining';
import IVRManager from './components/ivr/IVRManager';
import FileManager from './components/files/FileManager';
import OutboundTemplates from './components/outbound/OutboundTemplates';
import OutboundTasks from './components/outbound/OutboundTasks';
import ContactLists from './components/outbound/ContactLists';
import CampaignManager, { MOCK_CAMPAIGNS as INITIAL_CAMPAIGNS } from './components/marketing/CampaignManager';
import CustomerProfileManager from './components/marketing/CustomerProfileManager';
import CustomerMemoryManager from './components/memory/CustomerMemoryManager';
import FollowUpManager from './components/followup/FollowUpManager';
import MonitoringReport from './components/report/MonitoringReport';
import { BusinessEventConfigurationPage, FunnelConfigurationPage } from './components/report/FunnelConfigurationPages';
import CallRecordManager from './components/call/CallRecordManager';
import ToolConfigPage from './components/tools/ToolConfigPage';
import { AGENT_DEMO_BOT } from './services/agentDemoBot';

// --- CONSTANTS & DEFAULTS ---
const INITIAL_LABEL_GROUPS: LabelGroup[] = [
  {
    id: '1',
    name: '客户等级',
    tags: [
      { name: '黑金会员' }, 
      { name: '钻石会员' }, 
      { name: '黄金会员' }, 
      { name: '普通用户' }
    ],
    enabled: true
  },
  {
    id: '2',
    name: '诉求类型',
    tags: [
      { name: '物品遗失' }, 
      { name: '费用争议' }, 
      { name: '安全投诉' }, 
      { name: '发票问题' }, 
      { name: '司机态度' }
    ],
    enabled: true
  },
  {
    id: '3',
    name: '情绪状态',
    tags: [
      { name: '极度愤怒 (高危)' }, 
      { name: '焦急' }, 
      { name: '平静' }
    ],
    enabled: true
  }
];

const DEFAULT_SYSTEM_VARIABLES: BotVariable[] = [
  { id: 'sys_1', name: 'current_date', type: 'DATE', description: '通话的日期', isSystem: true, category: 'CONVERSATION' },
  { id: 'sys_2', name: 'current_datetime', type: 'DATETIME', description: '通话到当前节点的日期及时间', isSystem: true, category: 'CONVERSATION' },
  { id: 'sys_3', name: 'current_time', type: 'TIME', description: '通话到当前节点的时间', isSystem: true, category: 'CONVERSATION' },
  { id: 'sys_4', name: 'user_phone', type: 'TEXT', description: '进线号码', isSystem: true, category: 'CONVERSATION' },
];

const DIDI_VARIABLES: BotVariable[] = [
  ...DEFAULT_SYSTEM_VARIABLES,
  { id: 'v1', name: 'current_order_id', type: 'TEXT', description: '当前/最近订单号', isSystem: false, category: 'CONVERSATION' },
  { id: 'v2', name: 'car_info', type: 'TEXT', description: '车辆信息(车型/牌照)', isSystem: false, category: 'CONVERSATION' },
  { id: 'v3', name: 'driver_name', type: 'TEXT', description: '司机姓名', isSystem: false, category: 'CONVERSATION' },
  { id: 'v4', name: 'lost_item_desc', type: 'TEXT', description: '遗失物品特征', isSystem: false, category: 'EXTRACTION' },
  { id: 'v5', name: 'refund_amount', type: 'NUMBER', description: '退款/差价金额', isSystem: false, category: 'EXTRACTION' },
  { id: 'v6', name: 'is_route_deviated', type: 'BOOLEAN', description: '是否绕路(API返回)', isSystem: false, category: 'CONVERSATION' }
];

const DEFAULT_STRATEGY_DEFAULTS = {
  welcomeMessageInterruptible: true,
  transferIntentDefaultEnabled: true,
  transferIntentCustomEnabled: false,
  transferCustomIntents: [],
  transferIntentThreshold: 1,
  transferConditionRoundsEnabled: false,
  transferConditionRounds: 3,
  transferConditionDurationEnabled: false,
  transferConditionDuration: 180,
  transferSpeech: '为了更好地解决您的问题，正在为您优先接入人工坐席，请稍后。',
  transferIvrTarget: 'ivr_general_queue',

  hangupIntentDefaultEnabled: true,
  hangupIntentCustomEnabled: false,
  hangupCustomIntents: ['不需要了', '挂了'],
  hangupIntentThreshold: 1,
  hangupConditionRoundsEnabled: false,
  hangupConditionRounds: 10,
  hangupConditionDurationEnabled: false,
  hangupConditionDuration: 300,
  hangupSpeech: '感谢致电滴滴出行，祝您行程愉快，再见。',

  noAnswerInterval: 6,
  noAnswerMaxRepeats: 2,
  noAnswerSpeech: '喂？请问您还在听吗？',

  // 长业务内容智能等待
  longContentSmartWaitEnabled: false,
  longContentScenarios: '',

  // 安全拦截策略
  securityInterceptEnabled: true,
  securityWords: [],
  safetyGuardrailConfig: {
    sensitiveInfoMode: 'mask' as const,
    fallbackSpeeches: ['抱歉，这个问题暂时无法处理，我帮您换一种方式。'],
    businessRules: [],
  },

  // 全局异常处理
  globalExceptionPolicy: {
    fallbackAction: 'transfer' as const,
    fallbackIvrTarget: 'ivr_general_queue',
    fallbackSpeeches: ['抱歉，当前服务出现异常，我帮您转接人工客服。'],
    maxConsecutiveErrors: 2,
  },

  // TTS朗读优化
  ttsOptimizationEnabled: false,
  ttsOptimizationRules: [],

  // ASR文本修正
  asrTextCorrectionEnabled: false,
  asrTextCorrectionRules: [],

  // 主题技能库配置
  topicSkillLibraryConfig: {
    enabled: false,
    historyConversationEnabled: true,
    historyConversationCount: 3,
    previousTopicPriorityEnabled: false,
    skills: [
      {
        id: '1',
        name: '订单查询',
        isEnabled: true,
        exampleQuestions: ['如何查询我的订单状态？', '我的订单在哪里查看？', '订单号怎么查询？'],
        prompt: '你是一名订单查询助手，帮助用户查询订单状态。当用户询问订单相关问题时，你需要：1. 询问用户的订单号 2. 使用订单查询工具获取订单信息 3. 清晰地向用户解释订单状态和预计送达时间',
        tools: ['订单查询工具'],
        variables: ['订单号', '用户手机号'],
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date('2024-01-01').toISOString()
      },
      {
        id: '2',
        name: '账户余额查询',
        isEnabled: true,
        exampleQuestions: ['我的账户余额是多少？', '如何查看账户余额？', '余额怎么查询？'],
        prompt: '你是一名账户余额查询助手，帮助用户查询账户余额。当用户询问余额相关问题时，你需要：1. 验证用户身份 2. 使用余额查询工具获取账户余额 3. 向用户展示当前余额和最近的交易记录',
        tools: ['余额查询工具'],
        variables: ['用户ID', '手机号'],
        createdAt: new Date('2024-01-02').toISOString(),
        updatedAt: new Date('2024-01-02').toISOString()
      },
      {
        id: '3',
        name: '退款申请',
        isEnabled: true,
        exampleQuestions: ['如何申请退款？', '退款流程是什么？', '我想退款怎么操作？'],
        prompt: '你是一名退款申请助手，帮助用户处理退款请求。当用户询问退款相关问题时，你需要：1. 了解用户的退款原因 2. 检查订单是否符合退款条件 3. 指导用户完成退款申请流程',
        tools: ['退款申请工具'],
        variables: ['订单号', '退款原因'],
        createdAt: new Date('2024-01-03').toISOString(),
        updatedAt: new Date('2024-01-03').toISOString()
      },
      {
        id: '4',
        name: '投诉处理',
        isEnabled: false,
        exampleQuestions: ['我要投诉', '如何提交投诉？', '投诉电话是多少？'],
        prompt: '你是一名投诉处理助手，帮助用户处理投诉。当用户提出投诉时，你需要：1. 认真倾听用户的投诉内容 2. 记录投诉的详细信息 3. 提供合理的解决方案或转接人工客服',
        tools: ['投诉记录工具'],
        variables: ['投诉类型', '联系方式'],
        createdAt: new Date('2024-01-04').toISOString(),
        updatedAt: new Date('2024-01-04').toISOString()
      },
      {
        id: '5',
        name: '产品咨询',
        isEnabled: true,
        exampleQuestions: ['这个产品有什么功能？', '产品的价格是多少？', '产品怎么使用？'],
        prompt: '你是一名产品咨询助手，帮助用户了解产品信息。当用户询问产品相关问题时，你需要：1. 详细介绍产品的功能和特点 2. 提供产品的价格和购买渠道 3. 解答用户的使用疑问',
        tools: ['产品信息查询工具'],
        variables: ['产品ID', '用户需求'],
        createdAt: new Date('2024-01-05').toISOString(),
        updatedAt: new Date('2024-01-05').toISOString()
      }
    ],
    pageSize: 10,
    currentPage: 1,
    totalPages: 1,
    totalCount: 5
  },
};

// --- SPLIT INTENTS ---

const INTENT_SAFETY: BotIntent = {
  id: 'intent_safety',
  name: '🚨 高危安全拦截',
  description: '当用户提到“救命”、“报警”、“骚扰”、“打人”等涉及人身安全的紧急情况时触发。优先级最高。',
  keywords: ['救命', '报警', '110', '杀人', '危险'],
  systemPrompt: '检测到用户处于极度危险或紧急状态。不要进行任何常规对话，保持冷静，立即安抚并转接安全专员。',
  flowCanvas: {
    nodes: [
      { id: 'start', type: 'START', subType: 'start', label: '意图触发', x: 50, y: 150 },
      { id: 'agent_calm', type: 'AI_AGENT', subType: 'llm_node', label: '紧急安抚', x: 250, y: 150, config: { prompt: '语气极其严肃且冷静。告知用户：“请保持冷静，保障自身安全，我立刻为您接通安全专员。”' } },
      { id: 'transfer_sos', type: 'ACTION', subType: 'transfer', label: '转安全专员(加急)', x: 500, y: 150, config: { queue: 'safety_emergency_team' } }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'agent_calm' },
      { id: 'e2', source: 'agent_calm', target: 'transfer_sos' }
    ]
  }
};

const INTENT_LOST_ITEM: BotIntent = {
  id: 'intent_lost_item',
  name: '👜 物品遗失查找',
  description: '用户反馈手机、钱包、雨伞等物品落在车上，需要寻找或联系司机。',
  keywords: ['落车上了', '丢了', '遗失', '手机忘在车上'],
  systemPrompt: '你是物品遗失处理专员。用户可能很焦急，请表现出同理心。你需要确认是哪一笔行程，并引导联系司机。',
  flowCanvas: {
    nodes: [
      { id: 'start', type: 'START', subType: 'start', label: '意图触发', x: 50, y: 150 },
      { id: 'data_get_order', type: 'DATA', subType: 'http_request', label: '查询最近行程', x: 250, y: 150, config: { apiId: 'get_last_order' } },
      { id: 'agent_confirm', type: 'AI_AGENT', subType: 'llm_node', label: '确认车辆信息', x: 500, y: 150, config: { prompt: '告知用户最近一单是{current_date}的{car_info}，司机是{driver_name}。询问：“请问是落在这一辆车上了吗？”' } },
      { id: 'listen_confirm', type: 'LISTEN', subType: 'slot_filling', label: '等待确认', x: 750, y: 150, config: { variable: 'user_confirmation' } },
      { id: 'branch_is_correct', type: 'BRANCH', subType: 'condition_switch', label: '是这辆车?', x: 1000, y: 150, config: {} },
      
      // Yes Branch
      { id: 'listen_item', type: 'LISTEN', subType: 'slot_filling', label: '询问物品特征', x: 1250, y: 100, config: { variable: 'lost_item_desc' } },
      { id: 'action_call', type: 'ACTION', subType: 'transfer_pstn', label: '隐私号连线司机', x: 1500, y: 100, config: { phoneNumber: '${driver_virtual_number}' } },
      
      // No Branch
      { id: 'transfer_human', type: 'ACTION', subType: 'transfer', label: '转人工查询', x: 1250, y: 300, config: { queue: 'general_service' } }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'data_get_order' },
      { id: 'e2', source: 'data_get_order', target: 'agent_confirm' },
      { id: 'e3', source: 'agent_confirm', target: 'listen_confirm' },
      { id: 'e4', source: 'listen_confirm', target: 'branch_is_correct' },
      { id: 'e5_yes', source: 'branch_is_correct', target: 'listen_item', label: '是/对' },
      { id: 'e6_no', source: 'branch_is_correct', target: 'transfer_human', label: '不是/不对' },
      { id: 'e7', source: 'listen_item', target: 'action_call' }
    ]
  }
};

const INTENT_BILLING: BotIntent = {
  id: 'intent_billing',
  name: '💰 费用异议/绕路',
  description: '用户觉得车费太贵、预估价不符、或者投诉司机绕路。',
  keywords: ['车费贵', '绕路', '多收费', '价格不对'],
  systemPrompt: '你是费用争议处理专员。需客观公正。先调用系统检测路线，如果有绕路直接退款，如果没有则解释计费规则。',
  flowCanvas: {
    nodes: [
      { id: 'start', type: 'START', subType: 'start', label: '意图触发', x: 50, y: 200 },
      { id: 'data_check', type: 'DATA', subType: 'http_request', label: '检测路线偏移', x: 250, y: 200, config: { apiId: 'check_route' } },
      { id: 'branch_result', type: 'BRANCH', subType: 'condition_switch', label: '系统判定结果', x: 500, y: 200, config: {} },
      
      // Deviated (Refund)
      { id: 'agent_refund', type: 'AI_AGENT', subType: 'llm_node', label: '道歉并退款', x: 800, y: 100, config: { prompt: '系统检测显示确实存在绕路异常。真诚道歉，并告知将退还差价 {refund_amount} 元。' } },
      { id: 'data_coupon', type: 'DATA', subType: 'create_ticket', label: '发安抚红包', x: 1050, y: 100, config: { action: 'issue_coupon_10' } },
      
      // Normal (Explain)
      { id: 'agent_explain', type: 'AI_AGENT', subType: 'llm_node', label: '解释费用明细', x: 800, y: 300, config: { prompt: '系统显示路线正常。向用户解释可能因为“高峰时段拥堵费”或“高速费”导致价格差异。' } },
      { id: 'transfer_dispute', type: 'ACTION', subType: 'transfer', label: '仍不满意转人工', x: 1050, y: 300, config: { queue: 'dispute_team' } }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'data_check' },
      { id: 'e2', source: 'data_check', target: 'branch_result' },
      { id: 'e3_yes', source: 'branch_result', target: 'agent_refund', label: '有绕路 (True)' },
      { id: 'e4_no', source: 'branch_result', target: 'agent_explain', label: '无绕路 (False)' },
      { id: 'e5', source: 'agent_refund', target: 'data_coupon' },
      { id: 'e6', source: 'agent_explain', target: 'transfer_dispute', label: '用户仍有异议' }
    ]
  }
};

const INTENT_INVOICE: BotIntent = {
  id: 'intent_invoice',
  name: '🧾 发票与报销',
  description: '用户询问开发票、行程单、报销凭证。',
  keywords: ['开发票', '报销', '行程单'],
  systemPrompt: '处理发票需求。引导用户使用短信链接自助开票。',
  flowCanvas: {
    nodes: [
      { id: 'start', type: 'START', subType: 'start', label: '意图触发', x: 50, y: 150 },
      { id: 'agent_ask', type: 'AI_AGENT', subType: 'llm_node', label: '确认开票范围', x: 250, y: 150, config: { prompt: '询问用户是需要开具“最近一单”还是“按金额”开票？' } },
      { id: 'listen_type', type: 'LISTEN', subType: 'slot_filling', label: '等待回答', x: 500, y: 150, config: { variable: 'invoice_type' } },
      { id: 'data_sms', type: 'DATA', subType: 'sms', label: '发送开票链接', x: 750, y: 150, config: { templateId: 'invoice_link' } },
      { id: 'agent_end', type: 'AI_AGENT', subType: 'llm_node', label: '结束语', x: 1000, y: 150, config: { prompt: '告知短信已发送，点击链接即可开票。' } }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'agent_ask' },
      { id: 'e2', source: 'agent_ask', target: 'listen_type' },
      { id: 'e3', source: 'listen_type', target: 'data_sms' },
      { id: 'e4', source: 'data_sms', target: 'agent_end' }
    ]
  }
};

const INTENT_COMPLAINT: BotIntent = {
  id: 'intent_complaint',
  name: '😤 投诉与建议',
  description: '用户投诉司机态度差、车内环境脏乱、未系安全带等非紧急服务问题。',
  keywords: ['投诉', '态度差', '骂人', '臭', '抽烟'],
  systemPrompt: '你是投诉受理专员。首先要安抚用户情绪，表示歉意。然后收集具体的投诉点。',
  flowCanvas: {
    nodes: [
      { id: 'start', type: 'START', subType: 'start', label: '意图触发', x: 50, y: 150 },
      { id: 'agent_apology', type: 'AI_AGENT', subType: 'llm_node', label: '安抚情绪', x: 250, y: 150, config: { prompt: '非常抱歉给您带来不好的体验。请问具体是司机态度问题还是车辆环境问题？' } },
      { id: 'listen_detail', type: 'LISTEN', subType: 'slot_filling', label: '收集详情', x: 500, y: 150, config: { variable: 'complaint_detail' } },
      { id: 'agent_record', type: 'AI_AGENT', subType: 'llm_node', label: '记录并转接', x: 750, y: 150, config: { prompt: '好的，我已经详细记录了您反馈的情况：{complaint_detail}。现在为您转接人工主管处理。' } },
      { id: 'transfer_manager', type: 'ACTION', subType: 'transfer', label: '转投诉主管', x: 1000, y: 150, config: { queue: 'complaint_manager' } }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'agent_apology' },
      { id: 'e2', source: 'agent_apology', target: 'listen_detail' },
      { id: 'e3', source: 'listen_detail', target: 'agent_record' },
      { id: 'e4', source: 'agent_record', target: 'transfer_manager' }
    ]
  }
};

const DIDI_BOT: BotConfiguration = {
  id: 'bot_didi_demo',
  status: true,
  lastUpdated: Date.now(),
  name: '滴滴出行智能客服 (Demo)',
  description: '全场景演示：包含安全拦截、遗失物寻找、费用申诉自动化处理流程。',
  llmType: ModelType.GEMINI_PRO,
  temperature: 0.3,
  topP: 0.8,
  ttsModel: TTSModel.GEMINI_TTS,
  voiceName: 'Azure-Xiaoxiao',
  volume: 100,
  speed: 1.1,
  emotion: '平静 (Calm)',
  asrModel: ASRModel.OPENAI_WHISPER,
  asrInterruptible: true,
  asrSilenceDurationMs: 600,
  systemPrompt: '你是一名专业的滴滴出行客服代表。你的职责是高效、礼貌地解决乘客的问题。对于安全类问题，你必须保持高度警惕；对于遗失物品，要表现出同理心；对于费用问题，要客观公正。',
  variables: DIDI_VARIABLES,
  parameters: [],
  extractionConfigId: '',
  extractionPrompt: '',
  routerEnabled: true,
  // Split intents into granular flows
  intents: [
    INTENT_SAFETY, 
    INTENT_LOST_ITEM, 
    INTENT_BILLING, 
    INTENT_INVOICE, 
    INTENT_COMPLAINT
  ],
  protectionDurationMs: 3000,
  interruptionWaitMs: 800,
  maxCallDurationSeconds: 1200,
  contextItems: [],
  labelGroups: INITIAL_LABEL_GROUPS,
  welcomeMessageEnabled: true, 
  welcomeMessage: '您好，这里是滴滴出行客服中心。请问有什么可以帮您？', 
  ...DEFAULT_STRATEGY_DEFAULTS
};

const DEFAULT_BOT: BotConfiguration = {
  id: '',
  status: true,
  lastUpdated: Date.now(),
  name: '',
  description: '',
  llmType: ModelType.GEMINI_FLASH,
  temperature: 0.7,
  topP: 0.9,
  ttsModel: TTSModel.GEMINI_TTS,
  voiceName: 'Azure-Xiaoxiao',
  volume: 80,
  speed: 1.0,
  emotion: EMOTIONS[0],
  asrModel: ASRModel.OPENAI_WHISPER,
  asrInterruptible: true,
  asrSilenceDurationMs: 500,
  systemPrompt: '你是一个专业的客服助手...',
  variables: DEFAULT_SYSTEM_VARIABLES,
  parameters: [],
  extractionConfigId: '',
  extractionPrompt: '',
  routerEnabled: false,
  intents: [],
  protectionDurationMs: 3000,
  interruptionWaitMs: 800,
  maxCallDurationSeconds: 600,
  contextItems: [],
  labelGroups: INITIAL_LABEL_GROUPS,
  welcomeMessageEnabled: true,
  welcomeMessage: '您好，这里是智能语音助手，请问有什么可以帮您？',
  ...DEFAULT_STRATEGY_DEFAULTS
};

// --- MOCK DATA FOR EXTRACTION ---
const INITIAL_EXTRACTION_CONFIGS: ExtractionConfig[] = [
  {
    id: 'get_last_order',
    name: '查询最近订单',
    description: '根据手机号获取用户最近一笔行程信息',
    lastUpdated: Date.now(),
    params: [{ id: '1', key: 'user_phone', desc: '用户手机号', source: 'llm' }],
    interfaceUrl: 'https://api.didi.com/v1/orders/last',
    method: 'GET',
    authType: 'url',
    bodyType: 'json',
    bodyContent: '',
    responseMapping: [
      { key: 'current_order_id', path: '$.data.order_id' },
      { key: 'car_info', path: '$.data.car_model' },
      { key: 'driver_name', path: '$.data.driver_name' }
    ]
  },
  {
    id: 'check_route',
    name: '检测路线偏移',
    description: '分析实际行驶路线与预估路线的差异',
    lastUpdated: Date.now(),
    params: [{ id: '1', key: 'order_id', desc: '订单ID', source: 'llm' }],
    interfaceUrl: 'https://api.didi.com/v1/risk/route_deviation',
    method: 'POST',
    authType: 'basic',
    bodyType: 'json',
    bodyContent: '{ "order_id": "{{current_order_id}}" }',
    responseMapping: [
      { key: 'is_route_deviated', path: '$.data.is_deviated' },
      { key: 'refund_amount', path: '$.data.suggested_refund' }
    ]
  }
];

// --- MAIN APP COMPONENT ---

export default function App() {
  const [activeMenu, setActiveMenu] = useState('机器人配置');
  const [bots, setBots] = useState<BotConfiguration[]>([
    { ...DIDI_BOT, currentVersion: '草稿', currentVersionType: 'draft', onlineVersion: 'V1.8', versionChangeSummary: ['提示词', '流程', '对话策略'] },
    { ...AGENT_DEMO_BOT, currentVersion: 'V2.3', currentVersionType: 'published', onlineVersion: 'V2.3', versionChangeSummary: ['提示词', '工具配置'] },
  ]); // Pre-load Didi Bot and Agent Demo Bot
  const [editingBot, setEditingBot] = useState<BotConfiguration | null>(null);
  const [versionBot, setVersionBot] = useState<BotConfiguration | null>(null);
  const [versionNotice, setVersionNotice] = useState('');
  const [view, setView] = useState<'LIST' | 'FORM'>('LIST');

  // Lifted state for Extraction Configs
  const [extractionConfigs, setExtractionConfigs] = useState<ExtractionConfig[]>(INITIAL_EXTRACTION_CONFIGS);
  
  // Lifted state for Campaigns
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(INITIAL_CAMPAIGNS);

  const handleCreate = () => {
    setEditingBot({ ...DEFAULT_BOT, id: Date.now().toString() });
    setView('FORM');
  };

  const handleEdit = (bot: BotConfiguration) => {
    const botToEdit = {
       ...bot,
       variables: bot.variables && bot.variables.length > 0 ? bot.variables : DEFAULT_SYSTEM_VARIABLES,
       welcomeMessageInterruptible: bot.welcomeMessageInterruptible ?? true,
       transferIntentThreshold: bot.transferIntentThreshold ?? 1,
       hangupIntentThreshold: bot.hangupIntentThreshold ?? 1,
    };
    setEditingBot(botToEdit);
    setView('FORM');
  };

  const handleDelete = (id: string) => {
    setBots(prev => prev.filter(b => b.id !== id));
  };

  const handleSave = (bot: BotConfiguration) => {
    const updatedBot = { ...bot, lastUpdated: Date.now() };
    setBots(prev => {
      const exists = prev.find(b => b.id === updatedBot.id);
      if (exists) return prev.map(b => b.id === updatedBot.id ? updatedBot : b);
      return [updatedBot, ...prev];
    });
    setEditingBot(updatedBot);
  };

  const handleNavigate = (menu: string) => {
    setActiveMenu(menu);
    if (menu === '机器人配置') {
      setView('LIST');
      setEditingBot(null);
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case '号码管理':
        return <NumberManagement />;
      case 'IVR管理':
        return <IVRManager bots={bots} />;
      case '地理组合':
        return <GeoGroupManager />;
      case '工作时间':
        return <BusinessHoursManager />;
      case '文件管理':
        return <FileManager />;
      case '模型训练':
        return <ModelTraining />;
      case '智呼坐席管理':
        return <SeatManager bots={bots} />;
      // --- Outbound Routes ---
      case '外呼模版':
        return <OutboundTemplates bots={bots} />;
      case '外呼任务列表':
        return <OutboundTasks />;
      case '外呼联系单':
        return <ContactLists />;
      // --- Marketing Route ---
      case '营销活动':
        return <CampaignManager campaigns={campaigns} onUpdateCampaigns={setCampaigns} />;
      case '客户画像':
        return <CustomerProfileManager />;
      case '客户记忆':
      case '记忆管理':
        return <CustomerMemoryManager initialPage="manage" />;
      case '记忆配置':
        return <CustomerMemoryManager initialPage="config" />;
      case '跟进任务':
        return <FollowUpManager page="tasks" />;
      case '规则编排':
        return <FollowUpManager page="flows" />;
      case '跟进记录':
        return <FollowUpManager page="records" />;
      // -----------------------
      case '机器人配置':
        return view === 'LIST' ? (
          <BotListView bots={bots} onEdit={handleEdit} onDelete={handleDelete} onCreate={handleCreate} onViewVersions={setVersionBot} />
        ) : (
          editingBot && (
            <BotConfigForm 
              initialData={editingBot} 
              onSave={handleSave} 
              onCancel={() => { setView('LIST'); setEditingBot(null); }} 
              extractionConfigs={extractionConfigs}
              campaigns={campaigns}
            />
          )
        );
      case '流程配置':
        return <LongTermFlowConfig />;
      case '函数管理':
        return <FunctionManager />;
      case '信息提取配置':
        return <InformationExtraction configs={extractionConfigs} onUpdateConfigs={setExtractionConfigs} availableVariables={DIDI_VARIABLES} />;
      case '机器人模版':
        return <TemplateMarket />;
      case '音色市场':
        return <VoiceMarket />;
      case '问答对管理':
        return <QAManager />;
      case '知识发现':
        return <KnowledgeDiscovery />;
      case '词库管理':
        return <LexiconManager />;
      case '集成中心':
        return <IntegrationCenter />;
      case '通信网关':
        return <GatewayCenter />;
      case '监控报表':
        return <MonitoringReport />;
      case '漏斗配置':
        return <FunnelConfigurationPage />;
      case '事件配置':
        return <BusinessEventConfigurationPage />;
      case '通话记录':
        return <CallRecordManager />;
      case '工具配置':
        return <ToolConfigPage bots={bots} extractionConfigs={extractionConfigs} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🚧</span>
            </div>
            <h2 className="text-lg font-bold text-slate-700 mb-2">{activeMenu}</h2>
            <p className="text-sm">该模块正在开发中...</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-slate-800">
      <Sidebar activeSubItem={activeMenu} onNavigate={handleNavigate} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={activeMenu === '机器人配置' ? (view === 'LIST' ? "机器人列表" : editingBot?.name || "配置详情") : activeMenu} />
        <main className="flex-1 overflow-y-auto relative">
          {renderContent()}

          {versionBot && (
            <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30">
              <div className="h-full w-[520px] max-w-[96vw] bg-white shadow-2xl overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-start justify-between">
                  <div><h3 className="text-xl font-bold text-slate-900">版本记录</h3><p className="text-sm text-slate-500 mt-1">{versionBot.name}</p></div>
                  <button onClick={() => { setVersionBot(null); setVersionNotice(''); }} className="p-2 hover:bg-slate-100 rounded-lg">×</button>
                </div>
                <div className="p-5 space-y-4">
                  {versionNotice && <div className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">{versionNotice}</div>}
                  {(versionBot.currentVersionType === 'draft' || !versionBot.currentVersionType) && <section className="border border-amber-100 bg-amber-50/40 p-4 rounded-xl"><h4 className="font-bold text-slate-900">当前草稿</h4><p className="text-sm text-slate-500 mt-2">当前修改涉及提示词、流程和对话策略。</p></section>}
                  <section className="border border-emerald-100 p-4 rounded-xl"><h4 className="font-bold text-slate-900">已发布版本：{versionBot.onlineVersion || '未发布'}</h4><p className="text-sm text-slate-500 mt-2">正式通话使用</p></section>
                  <section className="border border-slate-200 p-4 rounded-xl"><h4 className="font-bold text-slate-900">V1.7 历史</h4><button onClick={() => setVersionNotice('V1.7 已恢复为草稿')} className="mt-3 px-3 py-1.5 border border-slate-200 rounded text-sm">恢复为草稿</button></section>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
