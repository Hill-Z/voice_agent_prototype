import { BotConfiguration, ModelType } from '../types';
import { PRESET_TOOLS_CONFIG } from './presetTools';

/**
 * Demo 机器人配置 - 智能客服演示机器人
 * 用于展示语音 Agent 边聊天边调用工具的能力
 */
export const DEMO_BOT_CONFIG: BotConfiguration = {
  id: 'bot_agent_demo',
  name: '🤖 智能客服演示机器人',
  description: '展示语音 Agent 边聊天边调用工具的强大能力 - 支持并行查询、进度播报、智能打断',
  
  // 基础配置
  llmType: ModelType.GEMINI_PRO,
  temperature: 0.3,
  maxOutputTokens: 500,
  
  // System Prompt - 详细的角色和行为规范
  systemPrompt: `你是一名专业的智能客服助手，正在通过电话与用户交流。

【核心能力】
1. 你可以调用多种工具来帮助用户解决问题
2. 在调用工具时，要实时告知用户进度
3. 如果用户询问进度，要如实汇报当前状态
4. 工具执行完成后，要用友好的语气播报结果

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

【工具调用规范】
- 查询订单时，先确认订单号或手机号
- 创建工单前，要收集完整的问题描述和用户 ID
- 转人工前，先询问用户是否同意并说明等待时间
- 发送短信前，确认手机号码
- 多个查询任务可以并行执行

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

  // 流程编排类型：AGENT 模式
  orchestrationType: 'AGENT',
  
  // Agent 配置
  agentConfig: {
    tools: PRESET_TOOLS_CONFIG, // 使用预设的 9 个工具
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
 * 获取 Demo 机器人配置
 */
export function getDemoBotConfig(): BotConfiguration {
  return DEMO_BOT_CONFIG;
}

/**
 * 检查是否是 Demo 机器人
 */
export function isDemoBot(botId: string): boolean {
  return botId === 'bot_agent_demo';
}
