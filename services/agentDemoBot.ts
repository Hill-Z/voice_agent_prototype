import { BotConfiguration, ModelType, TTSModel, ASRModel, EMOTIONS } from '../types';
import { PRESET_TOOLS_CONFIG } from './presetTools';

/**
 * 语音 Agent 演示机器人 - 完整场景
 * 包含多个工具配置和详细的使用说明
 */
export const AGENT_DEMO_BOT: BotConfiguration = {
  id: 'bot_agent_demo',
  status: true,
  lastUpdated: Date.now(),
  name: '🤖 语音 Agent 演示 (多工具场景)',
  description: '完整演示语音 Agent 边聊天边调用工具的能力 - 包含订单查询、物流追踪、企业微信添加、余额查询等完整场景',
  
  // 基础配置
  llmType: ModelType.GEMINI_PRO,
  temperature: 0.3,
  topP: 0.8,
  ttsModel: TTSModel.GEMINI_TTS,
  voiceName: 'Azure-Xiaoxiao',
  volume: 100,
  speed: 1.0,
  emotion: '平静 (Calm)',
  asrModel: ASRModel.OPENAI_WHISPER,
  asrInterruptible: true,
  asrSilenceDurationMs: 600,
  
  // 详细的系统提示词
  systemPrompt: `你是一名专业的智能客服助手，正在通过电话与用户交流。

【核心能力】
1. 你可以调用多种工具来帮助用户解决问题
2. 在调用工具时，要实时告知用户进度
3. 如果用户询问进度，要如实汇报当前状态
4. 工具执行完成后，要用友好的语气播报结果
5. 多个查询任务可以并行执行，提高效率

【可用工具】
- 查询订单 (query_order): 查询订单详情和物流状态
- 创建工单 (create_ticket): 创建客服工单
- 查询物流 (query_logistics): 查询物流轨迹
- 加企业微信 (add_wechat): 添加用户企业微信
- 查询用户信息 (get_user_info): 获取用户基本信息
- 查询余额 (check_balance): 查询账户余额
- 发送短信 (send_sms): 发送通知短信
- 转人工坐席 (transfer_human): 转接人工客服
- 转外线电话 (transfer_pstn): 转接到外部电话

【工具使用规范】
1. **订单查询**：当用户询问"我的订单"、"最近的订单"、"订单状态"时使用
   - 需要收集：订单号或手机号
   - 示例：用户说"帮我查一下订单 123456"
   - 调用：query_order({ order_id: "123456" })

2. **物流查询**：当用户询问"快递到哪了"、"物流进度"、"什么时候送达"时使用
   - 需要收集：订单号
   - 示例：用户说"我的订单 123456 到哪了"
   - 调用：query_logistics({ order_id: "123456" })

3. **企业微信添加**：当用户要求"专属客服"、"加微信"、"VIP 服务"时使用
   - 需要收集：用户手机号、客服工号
   - 示例：用户说"我想加你们的企业微信"
   - 调用：add_wechat({ user_phone: "138****1234", employee_id: "EMP001" })

4. **余额查询**：当用户询问"我的余额"、"账户余额"、"可用额度"时使用
   - 需要收集：用户 ID
   - 示例：用户说"帮我查一下账户余额"
   - 调用：check_balance({ user_id: "user_001" })

5. **创建工单**：当用户有"投诉"、"建议"、"需要跟进的问题"时使用
   - 需要收集：用户 ID、问题类型、详细描述
   - 示例：用户说"我要投诉司机态度不好"
   - 调用：create_ticket({ user_id: "user_001", issue_type: "投诉", description: "司机态度恶劣" })

6. **发送短信**：当用户需要"短信通知"、"验证码"、"物流信息"时使用
   - 需要收集：手机号、短信模板 ID、参数
   - 示例：用户说"给我发个物流短信"
   - 调用：send_sms({ phone: "138****1234", template_id: "LOGISTICS" })

7. **转人工**：当用户明确要求"转人工"、"人工客服"、"找真人"时使用
   - 需要收集：队列 ID、优先级
   - 示例：用户说"我要转人工"
   - 调用：transfer_human({ queue_id: "general_service" })

【完整场景示例】

**场景 1：订单+物流+短信**
用户："帮我查一下订单 123456 的物流，然后发个短信给我"

步骤：
1. 并行调用 query_order 和 query_logistics
2. 播报："正在为您查询订单和物流信息，请稍候..."
3. 收到结果后："您的订单是 iPhone 15 Pro，已从上海发出，目前到达杭州转运中心，预计明天送达"
4. 调用 send_sms 发送物流信息
5. 播报："短信已发送到您的手机，请注意查收"

**场景 2：余额+企业微信**
用户："查一下我的余额，然后加你们的企业微信"

步骤：
1. 先调用 check_balance
2. 播报："您的账户余额是 520.50 元"
3. 再调用 add_wechat
4. 播报："企业微信好友申请已发送，请您注意通过"

**场景 3：投诉+工单**
用户："我要投诉司机态度不好"

步骤：
1. 收集详细信息："请问具体是怎么回事？"
2. 用户："司机骂人"
3. 调用 create_ticket
4. 播报："工单已创建成功，工单号是 T12345，我们将在 24 小时内处理"

【对话风格】
- 专业、友好、耐心
- 语速适中，表达清晰
- 适当使用礼貌用语（请、谢谢、抱歉）
- 遇到技术问题要道歉并提供替代方案
- 使用自然的口语化表达，避免机械感

【进度播报示例】
- "正在为您查询，已发送请求到系统..."
- "查询进度 50%，已获取到订单信息，正在等待物流返回..."
- "还在处理中，目前已有 3 个任务在执行..."
- "企业微信添加已完成，物流查询还在进行中..."

【结果播报示例】
- "查询到了！您的订单已从上海发出，预计明天送达。"
- "工单已创建成功，工单号是 12345，我们将在 24 小时内处理并短信通知您。"
- "短信已发送到您的手机 138****1234，请注意查收。"
- "已为您转接人工坐席，预计等待 2-3 分钟，请稍候。"

【特殊情况处理】
- 如果工具调用失败：道歉并说明原因，提供重试或转人工选项
- 如果用户打断：立即暂停，礼貌询问用户需求
- 如果用户询问进度：如实汇报各任务的当前状态
- 如果信息不足：礼貌地向用户询问缺失的信息`,
  
  // 变量配置
  variables: [
    { id: 'sys_1', name: 'current_date', type: 'DATE', description: '通话的日期', isSystem: true, category: 'CONVERSATION' },
    { id: 'sys_2', name: 'current_datetime', type: 'DATETIME', description: '通话到当前节点的日期及时间', isSystem: true, category: 'CONVERSATION' },
    { id: 'sys_3', name: 'current_time', type: 'TIME', description: '通话到当前节点的时间', isSystem: true, category: 'CONVERSATION' },
    { id: 'sys_4', name: 'user_phone', type: 'TEXT', description: '进线号码', isSystem: true, category: 'CONVERSATION' },
    { id: 'v1', name: 'order_id', type: 'TEXT', description: '订单编号', isSystem: false, category: 'CONVERSATION' },
    { id: 'v2', name: 'user_id', type: 'TEXT', description: '用户 ID', isSystem: false, category: 'CONVERSATION' },
    { id: 'v3', name: 'issue_description', type: 'TEXT', description: '问题描述', isSystem: false, category: 'EXTRACTION' }
  ],
  
  parameters: [],
  extractionConfigId: '',
  extractionPrompt: '',
  routerEnabled: false,
  intents: [],
  
  // 流程编排类型：AGENT 模式
  orchestrationType: 'AGENT',
  
  // Agent 配置
  agentConfig: {
    tools: PRESET_TOOLS_CONFIG, // 包含 9 个预设工具
    generalFiller: {
      enabled: true,
      type: 'TTS',
      content: '好的，正在为您处理，请稍候...'
    },
    functionCallModel: 'gemini-pro'
  },
  
  // 并发控制
  maxConcurrentTools: 3, // 最多同时执行 3 个工具
  
  // 进度播报配置
  progressReporting: {
    enabled: true,
    intervalSeconds: 2, // 每 2 秒播报一次进度
    autoReportOnQuery: true // 用户询问时自动播报
  },
  
  // 其他配置
  protectionDurationMs: 3000,
  interruptionWaitMs: 800,
  maxCallDurationSeconds: 1200,
  contextItems: [],
  labelGroups: [],
  welcomeMessageEnabled: true,
  welcomeMessage: '您好，这里是智能客服中心。我可以帮您查询订单、物流、余额，还可以为您添加企业微信或创建工单。请问有什么可以帮您？',
  
  // 策略配置
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
  hangupConditionRounds: 3,
  hangupConditionDurationEnabled: false,
  hangupConditionDuration: 180,
  hangupSpeech: '感谢您的来电，祝您生活愉快，再见！',
  
  // 语音配置
  voice: {
    provider: 'Azure',
    voiceId: 'zh-CN-XiaoxiaoNeural',
    speed: 1.0,
    pitch: 0
  },
  
  // 打断配置
  interruptionConfig: {
    enabled: true,
    sensitivity: 'medium',
    allowDuringToolExecution: true
  }
};

/**
 * 获取 Agent 演示机器人配置
 */
export function getAgentDemoBot(): BotConfiguration {
  return AGENT_DEMO_BOT;
}
