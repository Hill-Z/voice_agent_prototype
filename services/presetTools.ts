import { AgentTool, PresetTool } from '../types';

/**
 * 预设工具列表 - 快速添加面板使用
 */
export const PRESET_TOOLS_LIST: PresetTool[] = [
  {
    id: 'query_order',
    name: '查询订单',
    icon: '📦',
    description: '查询订单详情和物流状态',
    category: 'api_call',
    defaultType: 'API'
  },
  {
    id: 'create_ticket',
    name: '创建工单',
    icon: '📝',
    description: '创建客服工单',
    category: 'api_call',
    defaultType: 'API'
  },
  {
    id: 'send_sms',
    name: '发送短信',
    icon: '📱',
    description: '发送通知短信',
    category: 'communication',
    defaultType: 'SMS'
  },
  {
    id: 'transfer_human',
    name: '转人工',
    icon: '🎧',
    description: '转接人工坐席',
    category: 'transfer',
    defaultType: 'TRANSFER'
  },
  {
    id: 'query_logistics',
    name: '查询物流',
    icon: '🚚',
    description: '查询物流轨迹',
    category: 'api_call',
    defaultType: 'API'
  },
  {
    id: 'add_wechat',
    name: '加企业微信',
    icon: '💬',
    description: '添加用户企业微信',
    category: 'api_call',
    defaultType: 'API'
  }
];

/**
 * 完整的 9 个预设工具配置 - 用于 Demo 机器人
 */
export const PRESET_TOOLS_CONFIG: AgentTool[] = [
  {
    id: 'tool_query_order',
    name: 'query_order',
    description: '查询订单详情和状态。当用户询问订单、购买记录、商品状态时使用。需要提供订单号或手机号。',
    type: 'API',
    category: 'api_call',
    icon: '📦',
    refId: '', // 需要关联实际的 ExtractionConfig
    parameters: [
      { name: 'order_id', type: 'string', description: '订单编号', required: false },
      { name: 'phone', type: 'string', description: '下单手机号', required: false }
    ],
    averageDuration: 2000,
    supportsParallel: true,
    executionStrategy: {
      playFiller: true,
      fillerType: 'TTS',
      fillerContent: '好的，正在为您查询订单信息，请稍等...'
    },
    responseInstruction: '请以热情的语气播报订单状态、下单时间、商品名称和物流状态。如果订单已发货，询问用户是否需要发送物流短信。'
  },
  
  {
    id: 'tool_create_ticket',
    name: 'create_ticket',
    description: '创建客服工单。当用户有投诉、建议或需要跟进的问题时使用。需要收集问题类型和详细描述。',
    type: 'API',
    category: 'api_call',
    icon: '📝',
    refId: '',
    parameters: [
      { name: 'user_id', type: 'string', description: '用户 ID', required: true },
      { name: 'issue_type', type: 'string', description: '问题类型', required: true },
      { name: 'description', type: 'string', description: '问题详细描述', required: true }
    ],
    averageDuration: 1000,
    supportsParallel: true,
    executionStrategy: {
      playFiller: true,
      fillerType: 'TTS',
      fillerContent: '好的，正在为您创建工单...'
    },
    responseInstruction: '播报工单号、处理时效承诺（如"我们将在 24 小时内处理"），并告知用户会收到短信通知。'
  },
  
  {
    id: 'tool_query_logistics',
    name: 'query_logistics',
    description: '查询物流轨迹。当用户询问快递到哪了、物流进度、什么时候送达时使用。需要提供订单号或快递单号。',
    type: 'API',
    category: 'api_call',
    icon: '🚚',
    refId: '',
    parameters: [
      { name: 'order_id', type: 'string', description: '订单编号', required: true }
    ],
    averageDuration: 3000,
    supportsParallel: true,
    executionStrategy: {
      playFiller: true,
      fillerType: 'TTS',
      fillerContent: '正在为您查询物流信息，请稍候...'
    },
    responseInstruction: '清晰播报物流轨迹，包括：发货时间、当前位置、预计送达时间。如果物流异常，要道歉并提供解决方案。'
  },
  
  {
    id: 'tool_add_wechat',
    name: 'add_wechat',
    description: '添加用户企业微信。当用户需要专属客服、VIP 服务或长期跟进时使用。需要用户手机号和客服工号。',
    type: 'API',
    category: 'api_call',
    icon: '💬',
    refId: '',
    parameters: [
      { name: 'user_phone', type: 'string', description: '用户手机号', required: true },
      { name: 'employee_id', type: 'string', description: '客服工号', required: true }
    ],
    averageDuration: 2000,
    supportsParallel: false,
    executionStrategy: {
      playFiller: true,
      fillerType: 'TTS',
      fillerContent: '好的，正在为您添加企业微信好友...'
    },
    responseInstruction: '告知用户企业微信已发送好友申请，请用户注意通过。说明添加后的服务内容（如专属客服、优先处理等）。'
  },
  
  {
    id: 'tool_get_user_info',
    name: 'get_user_info',
    description: '查询用户基本信息。当需要确认用户身份、查询会员等级、了解用户画像时使用。',
    type: 'API',
    category: 'api_call',
    icon: '👤',
    refId: '',
    parameters: [
      { name: 'user_id', type: 'string', description: '用户 ID', required: false },
      { name: 'phone', type: 'string', description: '手机号', required: false }
    ],
    averageDuration: 1000,
    supportsParallel: true,
    executionStrategy: {
      playFiller: true,
      fillerType: 'TTS',
      fillerContent: '正在查询您的信息...'
    },
    responseInstruction: '简要播报用户等级、注册时间、历史订单数等关键信息。如果是 VIP 用户，要表示感谢和重视。'
  },
  
  {
    id: 'tool_check_balance',
    name: 'check_balance',
    description: '查询账户余额。当用户询问余额、充值金额、可用额度时使用。',
    type: 'API',
    category: 'api_call',
    icon: '💰',
    refId: '',
    parameters: [
      { name: 'user_id', type: 'string', description: '用户 ID', required: true }
    ],
    averageDuration: 1000,
    supportsParallel: true,
    executionStrategy: {
      playFiller: true,
      fillerType: 'TTS',
      fillerContent: '正在为您查询余额...'
    },
    responseInstruction: '清晰播报可用余额、冻结金额、代金券等。如果余额不足，可推荐充值方案。'
  },
  
  {
    id: 'tool_send_sms',
    name: 'send_sms',
    description: '发送通知短信。用于发送验证码、订单通知、工单进度、物流信息等。',
    type: 'SMS',
    category: 'communication',
    icon: '📱',
    smsTemplateId: 'SMS_NOTIFICATION',
    parameters: [
      { name: 'phone', type: 'string', description: '接收手机号', required: true },
      { name: 'template_id', type: 'string', description: '短信模板 ID', required: true },
      { name: 'params', type: 'object', description: '短信参数', required: false }
    ],
    averageDuration: 2000,
    supportsParallel: false,
    executionStrategy: {
      playFiller: true,
      fillerType: 'TTS',
      fillerContent: '好的，正在发送短信到您手机...'
    },
    responseInstruction: '告知用户短信已发送，请留意手机。说明短信内容概要（如"包含工单号和处理进度"）。'
  },
  
  {
    id: 'tool_transfer_human',
    name: 'transfer_human',
    description: '转接人工坐席。当用户要求人工服务、问题复杂无法自动处理、或用户情绪激动时使用。',
    type: 'TRANSFER',
    category: 'transfer',
    icon: '🎧',
    parameters: [
      { name: 'queue_id', type: 'string', description: '队列 ID', required: true },
      { name: 'priority', type: 'string', description: '优先级', required: false }
    ],
    averageDuration: 0,
    supportsParallel: false,
    executionStrategy: {
      playFiller: true,
      fillerType: 'AUDIO',
      fillerContent: 'hold_music.mp3'
    },
    responseInstruction: '告知用户正在转接人工坐席，预计等待时长，并播放等待音乐。'
  },
  
  {
    id: 'tool_transfer_pstn',
    name: 'transfer_pstn',
    description: '转接到外部电话号码。用于转接商家、合作机构或其他外部电话。',
    type: 'TRANSFER',
    category: 'transfer',
    icon: '📞',
    parameters: [
      { name: 'phone_number', type: 'string', description: '目标电话号码', required: true }
    ],
    averageDuration: 0,
    supportsParallel: false,
    executionStrategy: {
      playFiller: true,
      fillerType: 'TTS',
      fillerContent: '好的，正在为您转接，请稍候...'
    },
    responseInstruction: '告知用户要转接的号码，确认后再执行转接。'
  }
];

/**
 * 根据预设 ID 获取工具配置模板
 */
export function getPresetToolConfig(presetId: string): AgentTool | null {
  const preset = PRESET_TOOLS_LIST.find(p => p.id === presetId);
  if (!preset) return null;
  
  const config = PRESET_TOOLS_CONFIG.find(c => c.name === presetId);
  if (config) {
    return { ...config, id: `tool_${presetId}_${Date.now()}` };
  }
  
  // 如果找不到完整配置，返回基于预设的基础配置
  return {
    id: `tool_${presetId}_${Date.now()}`,
    name: presetId,
    description: preset.description,
    type: preset.defaultType,
    category: preset.category,
    icon: preset.icon,
    parameters: [],
    averageDuration: 1000,
    supportsParallel: true,
    executionStrategy: {
      playFiller: true,
      fillerType: 'TTS',
      fillerContent: '正在为您处理，请稍候...'
    }
  };
}

/**
 * 获取所有预设工具列表
 */
export function getAllPresetTools(): PresetTool[] {
  return PRESET_TOOLS_LIST;
}

/**
 * 根据分类筛选预设工具
 */
export function getPresetToolsByCategory(category: string): PresetTool[] {
  return PRESET_TOOLS_LIST.filter(tool => tool.category === category);
}
