
// Enums
export enum ModelType {
  GEMINI_FLASH = 'Gemini Flash 2.0',
  GEMINI_PRO = 'Gemini Pro 1.5',
  GPT4_O = 'GPT-4o',
  CLAUDE_35 = 'Claude 3.5 Sonnet'
}

export enum TTSModel {
  GEMINI_TTS = 'Gemini TTS',
  AZURE_TTS = 'Azure TTS',
  OPENAI_TTS = 'OpenAI TTS',
  VOLC_TTS = 'Volcengine TTS'
}

export enum ASRModel {
  OPENAI_WHISPER = 'Whisper V3',
  AZURE_STT = 'Azure STT',
  GOOGLE_STT = 'Google STT',
  VOLC_ASR = 'Volcengine ASR'
}

export const EMOTIONS = [
  '平静 (Calm)', '开心 (Happy)', '遗憾 (Sad)', '热情 (Excited)', '专业 (Professional)', '温和 (Gentle)'
];

// Basic Types
export interface TagItem {
  name: string;
  description?: string;
}

export interface LabelGroup {
  id: string;
  name: string;
  tags: TagItem[];
  enabled: boolean;
}

export interface BotVariable {
  id: string;
  name: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'DATETIME' | 'TIME' | 'BOOLEAN';
  description?: string;
  isSystem: boolean;
  category?: 'INPUT' | 'CONVERSATION' | 'EXTRACTION';
  isStateful?: boolean;
  defaultValue?: string;
  source?: 'system' | 'user_input' | 'extraction' | 'api' | 'flow';
}

// 实体类型定义
export interface BotEntity {
  id: string;
  name: string;
  description: string;
  validationRule: 'number' | 'letter' | 'date' | 'id_card' | 'phone' | 'email' | 'regex' | 'custom';
  regexPattern?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Parameter {
  id: string;
  key: string;
  description: string;
  source?: 'llm' | 'variable';
  variableName?: string;
}

export interface ExtractionConfig {
  id: string;
  name: string;
  description: string;
  lastUpdated: number;
  params: { 
    id: string; 
    key: string; 
    desc: string;
    source: 'llm' | 'variable';
    variableName?: string;
  }[];
  interfaceUrl: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  authType: 'basic' | 'url' | 'none';
  bodyType: 'json' | 'form';
  bodyContent: string;
  responseMapping: { key: string; path: string }[];
}

export type PricingTableType = 'SERVICE' | 'PRODUCT';
export type PricingMode = 'quote' | 'cart' | 'both';

export type PricingFieldType = 'text' | 'number' | 'select' | 'boolean' | 'date';

export interface PricingFieldDefinition {
  id: string;
  name: string;
  key: string;
  type: PricingFieldType;
  required: boolean;
  searchable: boolean;
  matchable: boolean;
  calculable: boolean;
  options?: string[];
}

export interface PricingTable {
  id: string;
  name: string;
  type: PricingTableType;
  version: string;
  rowCount: number;
  source: 'excel' | 'manual';
  status: 'draft' | 'published';
  updatedAt: number;
  fields?: PricingFieldDefinition[];
}

export type PricingRuleType = 'fixed' | 'unit' | 'base_increment' | 'tiered' | 'package' | 'surcharge' | 'api';

export type PricingConditionOperator = 'eq' | 'neq' | 'in' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'between';

export interface PricingRuleCondition {
  id: string;
  fieldKey: string;
  operator: PricingConditionOperator;
  valueSource: 'fixed' | 'input';
  value?: string;
  inputParameter?: string;
}

export interface PricingRule {
  id: string;
  name: string;
  tableId: string;
  tableType: PricingTableType;
  type: PricingRuleType;
  scope: string[];
  condition?: string;
  conditions?: PricingRuleCondition[];
  priority: number;
  parameters?: {
    unit?: string;
    quantityField?: string;
    fixedPrice?: number;
    unitPrice?: number;
    minimumQuantity?: number;
    baseQuantity?: number;
    basePrice?: number;
    excessUnitPrice?: number;
    tiers?: Array<{ from: number; to?: number; unitPrice: number }>;
  };
  version: string;
  status: 'draft' | 'published';
  updatedAt: number;
}

export type IntentNodeType = 'START' | 'LISTEN' | 'BRANCH' | 'AI_AGENT' | 'LOGIC' | 'ACTION' | 'DATA' | 'TRIGGER' | 'HANGUP' | 'END';

// --- V2 Flow Node Configurations ---
// ... (Existing Node Configs kept for compatibility) ...
export interface NodePreAction {
  type: 'CLEAR_VAR' | 'EXECUTE_SCRIPT';
  payload: string; 
}

export interface NodeCommonConfig {
  preActions?: NodePreAction[];
  nextTimeoutMs?: number; 
  nodeNote?: string; 
  nextNodeId?: string;
}

// 录音市场项目类型
export interface AudioMarketItem {
  id: string;
  name: string;
  url: string;
  duration?: number;
  category?: string;
  description?: string;
}

export interface PlayNodeConfig extends NodeCommonConfig {
  // 播放类型
  playType?: 'audio' | 'tts';  // audio: 播放录音, tts: TTS合成
  // 录音选择字段
  audioId?: string;           // 录音ID
  audioName?: string;         // 录音名称（用于显示）
  audioUrl?: string;          // 录音URL（从录音市场获取）
  duration?: number;          // 录音时长（秒）
  // TTS合成字段
  ttsText?: string;           // TTS合成文本
  ttsVoice?: string;          // TTS音色
  // 异常处理
  onErrorNodeId?: string;     // 播放异常时跳转节点
  // 保留向后兼容的字段
  type?: 'tts' | 'audio_file' | 'ssml';  // 已废弃，仅用于兼容旧数据
  content?: string;  // 已废弃，仅用于兼容旧数据
  voiceOverride?: string;  // 已废弃，仅用于兼容旧数据
  bargeIn?: boolean;
  bargeInThreshold?: number;
  backgroundAudio?: {
    url: string;
    volume: number;
    loop: boolean;
    fade?: 'in' | 'out' | 'cross';
  };
}

export interface WaitNodeConfig extends NodeCommonConfig {
  durationMs: number; 
}

export interface RetryStrategy {
  maxAttempts: number;
  noInputPrompts?: string[]; 
  noMatchPrompts?: string[]; 
  actionAfterExhaustion?: 'hangup' | 'transfer' | 'goto_node';
  exhaustionTargetId?: string;
}

export interface CollectNodeConfig extends NodeCommonConfig {
  collectType: 'intent' | 'slot' | 'dtmf';
  variable?: string;
  maxDurationSeconds?: number;
  silenceThresholdMs?: number;
  bargeIn?: boolean;
  asrBiasing?: 'default' | 'alphanumeric' | 'name' | 'datetime' | 'number' | 'address';
  dtmfConfig?: {
    maxDigits: number;
    terminator: string;
    timeoutMs: number;
  };
  retryStrategy?: RetryStrategy;
  onCollectErrorNodeId?: string;
}

export interface LLMNodeConfig extends NodeCommonConfig {
  modelType?: ModelType;
  temperature?: number;
  topP?: number;
  systemPrompt?: string;
  userPrompt?: string;
  fewShotExamples?:Array<{
    input: string;
    output: string;
  }>;
  knowledgeBaseIds?: string[];
  
  // 工具绑定（AgentTool - 用于API调用等业务操作）
  toolIds?: string[];
  
  // 全局函数绑定（Global Functions - LLM自主决定调用）
  visibleFunctionIds?: string[];
  
  // 过渡函数绑定（Transition Functions - 在提示词中引用，控制流程）
  transitionFunctionIds?: string[];
  
  // 步骤级提示词（类似PolyAI的Step Prompt）
  stepPrompt?: string;
  
  // ASR偏置配置
  asrBiasing?: {
    type: 'default' | 'alphanumeric' | 'name' | 'datetime' | 'number' | 'address';
    customPhrases?: string[];
  };
  
  outputFormat?: 'text' | 'json';
  jsonSchema?: string;
  onErrorNodeId?: string;
  
  // 兼容旧字段
  functionIds?: string[];
}

export interface IntentRoute {
  id: string;
  intentName: string; 
  description?: string; 
  keywords?: string[]; 
  targetNodeId?: string;
}

export interface IntentRouterNodeConfig extends NodeCommonConfig {
  routerType: 'llm_semantic' | 'keyword_exact' | 'hybrid';
  routes: IntentRoute[];
  fallbackTargetId?: string;
}

export interface ConditionExpression {
  id: string;
  name: string;
  logic: string; 
  targetNodeId?: string;
}

export interface ConditionNodeConfig extends NodeCommonConfig {
  expressions: ConditionExpression[];
  elseTargetId?: string;
}

// 提取方式
export type ExtractionMethod = 'REGEX' | 'LLM';

// 提取规则配置
export interface ExtractionRule {
  id: string;
  targetVariable: string;
  variableType: string;
  method: ExtractionMethod;
  regexPattern?: string;
  regexGroup?: number;
  llmPrompt?: string;
  sourceText?: string;
  fallbackValue?: string;
}

export interface VariableOperation {
  variableId: string;
  type: 'SET' | 'ADD' | 'SUBTRACT' | 'APPEND' | 'CLEAR';
  value: string;
}

export interface SetVariableNodeConfig extends NodeCommonConfig {
  mode?: 'SYSTEM' | 'EXTRACTION';
  operations?: VariableOperation[];
  extractionRules?: ExtractionRule[];
  voiceCollectionEnabled?: boolean;
  onExtractionErrorNodeId?: string;  // 提取失败时跳转节点
}

export interface TagNodeConfig extends NodeCommonConfig {
  action: 'ADD' | 'REMOVE';
  tags: string[]; 
}

export interface HttpRequestNodeConfig extends NodeCommonConfig {
  apiId?: string;
  paramMapping?: Array<{ paramKey: string; variableId: string }>;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  bodyType?: 'json' | 'form' | 'raw';
  body?: string;
  timeoutMs?: number;
  responseMapping?: Array<{
    responsePath: string;
    targetVariable: string;
  }>;
  // 多分支结果配置
  successTargetId?: string;
  errorTargetId?: string;
  timeoutTargetId?: string;
  notCalledTargetId?: string;
}

export interface SmsNodeConfig extends NodeCommonConfig {
  templateId: string;
  phoneNumberVariable?: string;
  params?: Record<string, string>;
  onSendErrorNodeId?: string;  // 发送失败时跳转节点（可选）
}

export interface TransferNodeConfig extends NodeCommonConfig {
  transferType: 'sip_trunk' | 'pstn' | 'queue' | 'agent';
  target: string;
  uui?: string;
  playBeforeTransfer?: string;
  maxQueueTimeSeconds?: number;
  queueFullTargetId?: string;
  onTransferErrorNodeId?: string;  // 转接失败时跳转节点
}

export interface ScriptNodeConfig extends NodeCommonConfig {
  language: 'javascript' | 'python';
  code: string;
  inputVariables?: string[];
  outputVariables?: string[];
  onErrorNodeId?: string;  // 执行异常时跳转节点
}

export type V2NodeConfig = 
  | PlayNodeConfig 
  | WaitNodeConfig
  | CollectNodeConfig 
  | LLMNodeConfig 
  | IntentRouterNodeConfig 
  | ConditionNodeConfig 
  | SetVariableNodeConfig 
  | TagNodeConfig
  | HttpRequestNodeConfig 
  | SmsNodeConfig
  | TransferNodeConfig 
  | ScriptNodeConfig
  | any; 

// --- End V2 Types ---

export interface IntentNode {
  id: string;
  type: IntentNodeType;
  subType: string;
  label: string;
  x: number;
  y: number;
  config?: V2NodeConfig; 
}

export interface IntentEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  branchId?: string;
  
  // 过渡函数配置
  transitionConfig?: {
    // 过渡函数ID
    functionId?: string;
    
    // 过渡条件描述（类似PolyAI的transition prompt）
    condition?: string;
    
    // 函数参数映射（变量名 -> 参数名）
    paramMapping?: Record<string, string>;
    
    // 过渡优先级（数字越小优先级越高）
    priority?: number;
    
    // 是否启用
    enabled?: boolean;
  };
}

export interface BotIntent {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  systemPrompt: string;
  similarQuestions?: string[]; // 相似问法，用于意图识别训练
  flowCanvas: {
    nodes: IntentNode[];
    edges: IntentEdge[];
  };
}

export interface ProfileExtractionRule {
  id: string;
  targetField: string;
  description: string;
}

// --- AGENT MODE TYPES (Updated) ---

export interface AgentToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  source?: 'llm' | 'variable';
  variableId?: string;
  variableName?: string;
  variableType?: BotVariable['type'];
}

export type ToolExecutionLevel = 'auto' | 'user_confirm' | 'human_approval' | 'human_only';

export type ToolRuleOperator = 'lt' | 'lte' | 'eq' | 'gte' | 'gt';

export interface ToolExecutionRule {
  id: string;
  parameterName: string;
  operator: ToolRuleOperator;
  compareValue: string;
  action: ToolExecutionLevel;
}

export interface AgentTool {
  id: string;
  name: string; // The function name for LLM (e.g. check_order)
  displayName?: string;
  description: string; // The function description
  type: 'API' | 'RAG' | 'PRICING' | 'QUOTE' | 'CART_PRICING' | 'SMS' | 'TRANSFER' | 'EMAIL' | 'CUSTOM'; // QUOTE/CART_PRICING 保留用于兼容旧配置
  enabled?: boolean;
  
  // Link to existing resources
  refId?: string; // ExtractionConfig ID for API
  smsTemplateId?: string; // ID for SMS Template
  ragConfig?: {
    knowledgeBaseId: string;
    topK: number;
    similarityThreshold: number;
  };
  pricingConfig?: {
    mode: PricingMode;
    dataSource: 'rule' | 'api';
    pricingRuleId?: string;
    externalInterfaceId?: string;
    storeVariableId?: string;
    resultSpeechMode?: 'change_and_total' | 'total_only';
  };
  duplicateCallPolicy?: 'reuse_result' | 'wait_running' | 'reject';
  interruptionPolicy?: 'cancel' | 'continue' | 'continue_silent';
  pauseSilenceTimer?: boolean;
  firstProgressFeedbackSeconds?: number;
  progressFeedbackIntervalSeconds?: number;
  maxExecutionSeconds?: number;
  progressSpeeches?: string[];
  executionLevel?: ToolExecutionLevel;
  executionRules?: ToolExecutionRule[];
  confirmationSpeeches?: string[];
  humanApprovalQueueId?: string;
  humanApprovalIvrTarget?: string;
  humanApprovalTimeoutSeconds?: number;
  approvalTimeoutAction?: 'cancel' | 'transfer';

  quoteConfig?: {
    dataSource: 'rule' | 'api' | 'platform';
    pricingRuleId?: string;
    schemeId?: string;
    productCatalogId?: string;
    productScope?: string[];
    externalInterfaceId?: string;
    validityMinutes?: number;
    failureAction?: 'ask' | 'transfer' | 'step';
    failureStepId?: string;
  };
  cartPricingConfig?: {
    dataSource: 'rule' | 'api' | 'catalog';
    pricingRuleId?: string;
    catalogId?: string;
    externalInterfaceId?: string;
    storeVariableId?: string;
    priceBookId?: string;
    stockInterfaceId?: string;
    promotionSchemeId?: string;
    resultSpeechMode?: 'change_and_total' | 'total_only';
    unavailableAction?: 'ask' | 'transfer' | 'step';
    unavailableStepId?: string;
  };
  
  // LLM Configuration
  parameters: AgentToolParameter[];
  
  // New: Instruction for LLM after receiving tool response
  responseInstruction?: string; 

  // Execution Behavior (Filler/Background)
  executionStrategy?: {
    playFiller: boolean;
    fillerType: 'TTS' | 'AUDIO';
    fillerContent: string; // TTS text or Audio URL
    backgroundMusicId?: string;
    soundEffect?: ToolSoundEffectConfig;
  };
  
  // === 新增字段 (用于 Demo 增强) ===
  // 工具分类
  category?: 'api_call' | 'knowledge' | 'pricing' | 'communication' | 'transfer' | 'other';
  // 工具图标 (emoji)
  icon?: string;
  // 平均执行时长（毫秒），用于进度估算
  averageDuration?: number;
  // 是否支持并行执行
  supportsParallel?: boolean;
  // 测试配置
  testConfig?: {
    enabled: boolean;
    testParams: Record<string, any>;
  };
  // 错误处理策略
  errorHandling?: {
    retryCount: number;
    fallbackAction: 'transfer_human' | 'hangup' | 'goto_node';
    fallbackTargetId?: string;
  };
  
  // 给模型的工具详细说明（模型使用指南）
  modelReadme?: string;

  // === 工具调用话术配置 ===
  // 工具调用开始话术
  startSpeech?: string;
  // 工具是否需要返回结果（向用户汇报）
  needReturn?: boolean;
  // 工具返回结果后是否跳过模型，直接播放固定话术
  directPlayOnReturn?: boolean;
  // 直接播放的固定话术
  directReturnSpeech?: string;
  // 工具调用成功话术
  successSpeech?: string;
  // 工具调用失败话术
  failureSpeech?: string;
  // 工具调用中，客户咨询问题的回复话术
  interruptSpeech?: string;
}

export interface ToolSoundEffectConfig {
  enabled: boolean;
  audioId?: string;
  audioName?: string;
  audioUrl?: string;
  stopOnTtsStart: boolean;
}

export interface DelayProfile {
  id: string;
  name: string;
  triggerMs: number;
  message: string;
  allowBargeIn: boolean;
}

export interface FirstResponseFillerConfig {
  enabled: boolean;
  triggerDelayMs: number;
  phrases: string[];
  minUserTurnsBetweenPlays: number;
  avoidConsecutiveRepeat: boolean;
}

// 函数类型枚举 - 区分过渡函数和全局函数
export type FunctionCategory = 'transition' | 'global';

// Flow 函数类型 - 用于流程内的可调用函数
// transition: 过渡函数 - 用于流程控制，在连线上配置，可使用 flow.goto_step()
// global: 全局函数 - 用于业务执行，在LLM节点中绑定，由LLM自主决定调用（对应 PolyAI 的 Global Functions）
export interface FlowFunction {
  id: string;
  name: string;           // 函数名称，如 save_confirmation_code
  description: string;    // 函数描述，用于 LLM 理解何时调用
  parameters: FlowFunctionParameter[];  // 参数定义
  code?: string;          // 函数实现代码（可选）
  scope: 'flow' | 'global';  // 作用域：流程级别或全局
  flowId?: string;        // 如果是 flow 级别，关联的 flow ID
  isBuiltIn: boolean;     // 是否内置函数
  
  // 新增：函数类别
  category: FunctionCategory;  // 'transition' 或 'visible'
  
  // 新增：过渡函数特有属性
  transitionConfig?: {
    canGotoStep: boolean;      // 是否可以使用 flow.goto_step()
    canGotoFlow: boolean;      // 是否可以使用 flow.goto_flow()
    canModifyState: boolean;   // 是否可以修改 conv.state
    targetStepId?: string;     // 默认跳转目标步骤（可选）
  };
  
  // 新增：全局函数特有属性
  globalConfig?: {
    triggerKeywords?: string[];  // 触发关键词（可选）
    executionStrategy?: 'sync' | 'async';  // 执行策略
    playFiller?: boolean;        // 是否播放等待音
    fillerContent?: string;      // 等待音内容
  };
}

export interface FlowFunctionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  description: string;
  required: boolean;
  defaultValue?: any;
}

// 内置 Flow 函数列表
export const BUILT_IN_FUNCTIONS: FlowFunction[] = [
  // ========== 过渡函数 ==========
  {
    id: 'builtin_save_state',
    name: 'save_state',
    description: '保存变量到对话状态',
    category: 'transition',
    parameters: [
      { name: 'key', type: 'string', description: '变量名', required: true },
      { name: 'value', type: 'string', description: '变量值', required: true }
    ],
    code: `def save_state(conv, flow, key, value):
    """保存变量到对话状态，供后续步骤使用"""
    conv.state[key] = value
    return`,
    scope: 'global',
    isBuiltIn: true,
    transitionConfig: {
      canGotoStep: false,
      canGotoFlow: false,
      canModifyState: true
    }
  },
  {
    id: 'builtin_goto_step',
    name: 'goto_step',
    description: '跳转到指定步骤，控制流程走向',
    category: 'transition',
    parameters: [
      { name: 'step_id', type: 'string', description: '目标步骤名称', required: true }
    ],
    code: `def goto_step(conv, flow, step_id):
    """跳转到当前流程中的指定步骤"""
    flow.goto_step(step_id)
    return  # 重要：必须return防止静默覆盖`,
    scope: 'global',
    isBuiltIn: true,
    transitionConfig: {
      canGotoStep: true,
      canGotoFlow: false,
      canModifyState: false
    }
  },
  {
    id: 'builtin_goto_flow',
    name: 'goto_flow',
    description: '跳转到另一个流程',
    category: 'transition',
    parameters: [
      { name: 'flow_name', type: 'string', description: '目标流程名称', required: true }
    ],
    code: `def goto_flow(conv, flow, flow_name):
    """跳转到另一个流程"""
    flow.goto_flow(flow_name)
    return`,
    scope: 'global',
    isBuiltIn: true,
    transitionConfig: {
      canGotoStep: false,
      canGotoFlow: true,
      canModifyState: false
    }
  },
  {
    id: 'builtin_conditional_goto',
    name: 'conditional_goto',
    description: '根据条件跳转到不同步骤',
    category: 'transition',
    parameters: [
      { name: 'condition', type: 'string', description: '条件表达式', required: true },
      { name: 'true_step', type: 'string', description: '条件为真时跳转的步骤', required: true },
      { name: 'false_step', type: 'string', description: '条件为假时跳转的步骤', required: false }
    ],
    code: `def conditional_goto(conv, flow, condition, true_step, false_step=None):
    """根据条件跳转到不同步骤"""
    if eval(condition, {}, conv.state):
        flow.goto_step(true_step)
    elif false_step:
        flow.goto_step(false_step)
    return`,
    scope: 'global',
    isBuiltIn: true,
    transitionConfig: {
      canGotoStep: true,
      canGotoFlow: false,
      canModifyState: false
    }
  },
  {
    id: 'builtin_collect_value',
    name: 'collect_value',
    description: '收集用户输入并保存到变量',
    category: 'transition',
    parameters: [
      { name: 'variable_name', type: 'string', description: '存储变量名', required: true },
      { name: 'prompt', type: 'string', description: '收集提示语', required: false }
    ],
    code: `def collect_value(conv, flow, variable_name, prompt=None):
    """收集用户输入并保存到变量"""
    if prompt:
        return {"utterance": prompt, "collect": variable_name}
    return`,
    scope: 'global',
    isBuiltIn: true,
    transitionConfig: {
      canGotoStep: false,
      canGotoFlow: false,
      canModifyState: true
    }
  },
  {
    id: 'builtin_check_verification',
    name: 'check_verification',
    description: '检查用户验证状态，支持重试机制',
    category: 'transition',
    parameters: [
      { name: 'max_attempts', type: 'number', description: '最大验证尝试次数', required: false, defaultValue: 3 }
    ],
    code: `def check_verification(conv, flow, max_attempts=3):
    """检查用户验证状态，失败则重试，超过次数转人工"""
    attempts = conv.state.get('verification_attempts', 0)
    if not conv.state.get('is_verified'):
        attempts += 1
        conv.state['verification_attempts'] = attempts
        if attempts >= max_attempts:
            flow.goto_flow("Escalation")
            return
        flow.goto_step("Retry verification")
        return
    flow.goto_step("Continue")
    return`,
    scope: 'global',
    isBuiltIn: true,
    transitionConfig: {
      canGotoStep: true,
      canGotoFlow: true,
      canModifyState: true
    }
  },
  
  // ========== 全局函数（PolyAI Global Functions）==========
  {
    id: 'builtin_transfer',
    name: 'transfer_call',
    description: '转接到人工客服或指定技能组',
    category: 'global',
    parameters: [
      { name: 'destination', type: 'string', description: '目标技能组或坐席', required: true },
      { name: 'reason', type: 'string', description: '转接原因', required: false },
      { name: 'utterance', type: 'string', description: '转接话语', required: false }
    ],
    code: `def transfer_call(conv, flow, destination, reason=None, utterance=None):
    """转接到人工客服或指定技能组"""
    if not utterance:
        utterance = "好的，我帮您转接人工客服，请稍等。"
    return {
        "action": "transfer",
        "destination": destination,
        "reason": reason,
        "utterance": utterance
    }`,
    scope: 'global',
    isBuiltIn: true,
    globalConfig: {
      triggerKeywords: ['转人工', '人工客服', '转接'],
      executionStrategy: 'sync',
      playFiller: true,
      fillerContent: '正在为您转接，请稍候...'
    }
  },
  {
    id: 'builtin_confirm_reservation',
    name: 'confirm_reservation',
    description: '确认预约信息',
    category: 'global',
    parameters: [
      { name: 'confirmation_code', type: 'string', description: '确认码', required: true },
      { name: 'first_name', type: 'string', description: '名', required: true },
      { name: 'last_name', type: 'string', description: '姓', required: true }
    ],
    code: `def confirm_reservation(conv, flow, confirmation_code, first_name, last_name):
    """确认预约信息是否匹配"""
    conv.state['confirmation_code'] = confirmation_code
    conv.state['first_name'] = first_name
    conv.state['last_name'] = last_name
    return {
        "status": "confirmed",
        "message": f"已确认 {first_name} {last_name} 的预约，确认码: {confirmation_code}"
    }`,
    scope: 'global',
    isBuiltIn: true,
    globalConfig: {
      triggerKeywords: ['确认预约', '预约确认'],
      executionStrategy: 'sync'
    }
  },
  {
    id: 'builtin_hangup',
    name: 'hangup',
    description: '挂断电话',
    category: 'global',
    parameters: [
      { name: 'reason', type: 'string', description: '挂断原因', required: false }
    ],
    code: `def hangup(conv, flow, reason=None):
    """挂断当前通话"""
    return {
        "action": "hangup",
        "reason": reason
    }`,
    scope: 'global',
    isBuiltIn: true,
    globalConfig: {
      triggerKeywords: ['挂断', '结束通话', '再见'],
      executionStrategy: 'sync'
    }
  },
  {
    id: 'builtin_send_sms',
    name: 'send_sms',
    description: '发送短信通知',
    category: 'global',
    parameters: [
      { name: 'template', type: 'string', description: '短信模板ID', required: true },
      { name: 'params', type: 'object', description: '模板参数', required: false }
    ],
    code: `def send_sms(conv, flow, template, params=None):
    """发送短信通知"""
    return {
        "action": "send_sms",
        "template": template,
        "params": params or {},
        "phone": conv.state.get('phone', '')
    }`,
    scope: 'global',
    isBuiltIn: true,
    globalConfig: {
      executionStrategy: 'async',
      playFiller: true,
      fillerContent: '正在发送短信...'
    }
  },
  // PolyAI 内置全局函数
  {
    id: 'builtin_say',
    name: 'say',
    description: '直接对用户说话，绕过 LLM 生成',
    category: 'global',
    parameters: [
      { name: 'text', type: 'string', description: '要说的话', required: true }
    ],
    code: `def say(conv, flow, text):
    """直接对用户说话"""
    return {"utterance": text}`,
    scope: 'global',
    isBuiltIn: true,
    globalConfig: {
      executionStrategy: 'sync'
    }
  },
  {
    id: 'builtin_goto_flow',
    name: 'goto_flow',
    description: '切换到另一个 flow',
    category: 'global',
    parameters: [
      { name: 'flow_name', type: 'string', description: '目标 flow 名称', required: true }
    ],
    code: `def goto_flow(conv, flow, flow_name):
    """切换到另一个 flow"""
    conv.goto_flow(flow_name)
    return`,
    scope: 'global',
    isBuiltIn: true,
    globalConfig: {
      executionStrategy: 'sync'
    }
  },
  {
    id: 'builtin_exit_flow',
    name: 'exit_flow',
    description: '退出当前 flow',
    category: 'global',
    parameters: [],
    code: `def exit_flow(conv, flow):
    """退出当前 flow"""
    conv.exit_flow()
    return`,
    scope: 'global',
    isBuiltIn: true,
    globalConfig: {
      executionStrategy: 'sync'
    }
  },
  {
    id: 'builtin_goto_csat',
    name: 'goto_csat_flow',
    description: '进入满意度调查流程',
    category: 'global',
    parameters: [],
    code: `def goto_csat_flow(conv, flow):
    """进入满意度调查流程"""
    conv.goto_csat_flow()
    return`,
    scope: 'global',
    isBuiltIn: true,
    globalConfig: {
      executionStrategy: 'sync'
    }
  },
  {
    id: 'builtin_send_email',
    name: 'send_email',
    description: '发送邮件通知',
    category: 'global',
    parameters: [
      { name: 'to', type: 'string', description: '收件人邮箱', required: true },
      { name: 'subject', type: 'string', description: '邮件主题', required: true },
      { name: 'body', type: 'string', description: '邮件正文', required: true }
    ],
    code: `def send_email(conv, flow, to, subject, body):
    """发送邮件通知"""
    return {
        "action": "send_email",
        "to": to,
        "subject": subject,
        "body": body
    }`,
    scope: 'global',
    isBuiltIn: true,
    globalConfig: {
      executionStrategy: 'async'
    }
  },
  {
    id: 'builtin_call_api',
    name: 'call_api',
    description: '调用已注册的 API 操作',
    category: 'global',
    parameters: [
      { name: 'api_name', type: 'string', description: 'API 名称', required: true },
      { name: 'operation', type: 'string', description: '操作名称', required: true },
      { name: 'params', type: 'object', description: '请求参数', required: false }
    ],
    code: `def call_api(conv, flow, api_name, operation, params=None):
    """调用已注册的 API"""
    return conv.api[api_name][operation](**(params or {}))`,
    scope: 'global',
    isBuiltIn: true,
    globalConfig: {
      executionStrategy: 'async',
      playFiller: true
    }
  },
  {
    id: 'builtin_set_voice',
    name: 'set_voice',
    description: '设置语音音色',
    category: 'global',
    parameters: [
      { name: 'voice_id', type: 'string', description: '语音 ID', required: true }
    ],
    code: `def set_voice(conv, flow, voice_id):
    """设置语音音色"""
    conv.set_voice(voice_id)
    return`,
    scope: 'global',
    isBuiltIn: true,
    globalConfig: {
      executionStrategy: 'sync'
    }
  },
  {
    id: 'builtin_set_language',
    name: 'set_language',
    description: '设置对话语言',
    category: 'global',
    parameters: [
      { name: 'lang_code', type: 'string', description: '语言代码，如 zh-CN, en-US', required: true }
    ],
    code: `def set_language(conv, flow, lang_code):
    """设置对话语言"""
    conv.set_language(lang_code)
    return`,
    scope: 'global',
    isBuiltIn: true,
    globalConfig: {
      executionStrategy: 'sync'
    }
  },
  {
    id: 'builtin_set_asr_biasing',
    name: 'set_asr_biasing',
    description: '动态设置 ASR 偏置，提高特定词汇识别率',
    category: 'global',
    parameters: [
      { name: 'phrases', type: 'object', description: '偏置短语列表', required: true },
      { name: 'boost', type: 'number', description: '偏置强度', required: false, defaultValue: 1.0 }
    ],
    code: `def set_asr_biasing(conv, flow, phrases, boost=1.0):
    """动态设置 ASR 偏置"""
    conv.set_asr_biasing({"phrases": phrases, "boost": boost})
    return`,
    scope: 'global',
    isBuiltIn: true,
    globalConfig: {
      executionStrategy: 'sync'
    }
  },
  {
    id: 'builtin_clear_asr_biasing',
    name: 'clear_asr_biasing',
    description: '清除动态 ASR 偏置',
    category: 'global',
    parameters: [],
    code: `def clear_asr_biasing(conv, flow):
    """清除 ASR 偏置"""
    conv.clear_asr_biasing()
    return`,
    scope: 'global',
    isBuiltIn: true,
    globalConfig: {
      executionStrategy: 'sync'
    }
  },
  {
    id: 'builtin_discard_recording',
    name: 'discard_recording',
    description: '丢弃当前通话录音（隐私保护）',
    category: 'global',
    parameters: [],
    code: `def discard_recording(conv, flow):
    """丢弃录音"""
    conv.discard_recording()
    return`,
    scope: 'global',
    isBuiltIn: true,
    globalConfig: {
      executionStrategy: 'sync'
    }
  },
  {
    id: 'builtin_write_metric',
    name: 'write_metric',
    description: '写入自定义指标数据',
    category: 'global',
    parameters: [
      { name: 'metric_name', type: 'string', description: '指标名称', required: true },
      { name: 'value', type: 'number', description: '指标值', required: true }
    ],
    code: `def write_metric(conv, flow, metric_name, value):
    """写入自定义指标"""
    conv.write_metric(metric_name, value)
    return`,
    scope: 'global',
    isBuiltIn: true,
    globalConfig: {
      executionStrategy: 'async'
    }
  }
];

// MCP 服务器配置
export interface McpServer {
  id: string;
  name: string;
  description: string;
  type: 'stdio' | 'http' | 'websocket';
  command?: string;
  args?: string[];
  url?: string;
  headers?: Record<string, string>;
  env?: Record<string, string>;
  enabled: boolean;
}

export interface AgentConfig {
  tools: AgentTool[];
  mcpServers?: McpServer[];
  generalFiller: {
    enabled: boolean;
    type: 'TTS' | 'AUDIO';
    content: string;
  };
  functionCallModel?: string;
  
  // === 需求 4：Agent 配置新增字段 ===
  enabledToolIds?: string[];
  enabledFunctionIds?: string[];
  defaultVisibleFunctionIds?: string[];
  defaultTransitionFunctionIds?: string[];
  delayProfiles?: DelayProfile[];
  defaultDelayProfileId?: string;
  allowUserInterruptDuringDelay?: boolean;
  allowUserCutInDuringGreeting?: boolean;
  allowUserCutInDuringTts?: boolean;
  resumeStrategy?: 'continue' | 'restart' | 'skip';
  defaultHandoffTargetId?: string;
  summaryTemplate?: string;
}

// 机器人级 Agent 编排配置。它只组织现有 Flow、主题、工具和人工服务，不复制业务内容。
export type AgentOrchestrationMode = 'single' | 'supervisor' | 'handoff';
export type AgentOrchestrationNodeType = 'supervisor' | 'flow_agent' | 'topic_agent' | 'task_agent' | 'human' | 'end';
export type AgentOrchestrationEdgeType = 'handoff' | 'delegate' | 'fanout' | 'escalate' | 'fallback';
export type AgentOrchestrationHistoryMode = 'none' | 'summary' | 'last_n' | 'full';
export type AgentResourcePolicy = 'inherit' | 'custom';
export type AgentFanoutJoinStrategy = 'all' | 'first_success';
export type AgentFanoutMergeStrategy = 'source_agent' | 'supervisor' | 'structured';

export interface AgentOrchestrationContextPolicy {
  history: AgentOrchestrationHistoryMode;
  historyTurns?: number;
  variableNames: string[];
  includeCurrentStep: boolean;
  includeLastToolResult: boolean;
}

export interface AgentOrchestrationNode {
  id: string;
  type: AgentOrchestrationNodeType;
  name: string;
  description?: string;
  refId?: string;
  refName?: string;
  enabled: boolean;
  position: { x: number; y: number };
  entryIntents: string[];
  resourcePolicy: AgentResourcePolicy;
  toolIds: string[];
  knowledgeBaseIds: string[];
  contextPolicy: AgentOrchestrationContextPolicy;
  maxExecutionSeconds?: number;
  lockCurrentStep?: boolean;
  supervisorPrompt?: string;
  taskPrompt?: string;
  taskOutputSchema?: string;
  handoffSummaryTemplate?: string;
  humanTargetId?: string;
  hangupSpeeches?: string[];
}

export interface AgentOrchestrationEdge {
  id: string;
  source: string;
  target: string;
  type: AgentOrchestrationEdgeType;
  label: string;
  priority: number;
  conditionMode: 'intent' | 'expression' | 'always';
  conditionValue: string;
  eligibilityExpression?: string;
  inputMappings: Array<{ source: string; target: string }>;
  outputMappings: Array<{ source: string; target: string }>;
  contextPolicy: AgentOrchestrationContextPolicy;
  timeoutSeconds?: number;
  onFailure: 'return_error' | 'fallback' | 'handoff' | 'continue';
  returnToSource: boolean;
  speechMode: 'none' | 'fixed' | 'generated';
  speeches: string[];
  parallelGroupId?: string;
  fanoutJoinStrategy?: AgentFanoutJoinStrategy;
  fanoutMergeStrategy?: AgentFanoutMergeStrategy;
  enabled: boolean;
}

export interface AgentOrchestrationGraphSnapshot {
  supervisorNodeId?: string;
  initialNodeId?: string;
  fallbackNodeId?: string;
  maxHandoffCount: number;
  nodes: AgentOrchestrationNode[];
  edges: AgentOrchestrationEdge[];
}

export interface AgentOrchestrationConfig {
  enabled: boolean;
  mode: AgentOrchestrationMode;
  status: 'draft' | 'published' | 'disabled';
  draftVersion: number;
  publishedVersion?: number;
  supervisorNodeId?: string;
  initialNodeId?: string;
  fallbackNodeId?: string;
  maxHandoffCount: number;
  nodes: AgentOrchestrationNode[];
  edges: AgentOrchestrationEdge[];
  modeDrafts?: Partial<Record<'supervisor' | 'handoff', AgentOrchestrationGraphSnapshot>>;
  updatedAt: number;
}

export type ExceptionFallbackAction = 'continue' | 'transfer' | 'hangup';

export interface GlobalExceptionPolicy {
  fallbackAction: ExceptionFallbackAction;
  fallbackIvrTarget?: string;
  fallbackSpeeches: string[];
  maxConsecutiveErrors: number;
}

export interface StepExceptionPolicy {
  mode: 'inherit' | 'override';
  fallbackAction?: ExceptionFallbackAction | 'goto_node';
  fallbackTargetId?: string;
  fallbackIvrTarget?: string;
  fallbackSpeeches?: string[];
}

export interface SafetyGuardrailRule {
  id: string;
  trigger: string;
  action: 'continue' | 'transfer';
  speech: string;
}

export interface SafetyGuardrailConfig {
  sensitiveInfoMode: 'mask' | 'block' | 'verified';
  fallbackSpeeches: string[];
  businessRules: SafetyGuardrailRule[];
}

// === 增强工具类型 (用于 Demo) ===
export interface EnhancedAgentTool extends AgentTool {
  category: 'api_call' | 'knowledge' | 'pricing' | 'communication' | 'transfer' | 'other';
  icon: string;
  averageDuration: number;
  supportsParallel: boolean;
}

// 预设工具类型
export interface PresetTool {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'api_call' | 'communication' | 'transfer';
  defaultType: 'API' | 'SMS' | 'TRANSFER';
}

// ------------------------------

export interface BotConfiguration extends MarketingConfig, ProfileCollectionConfig, PolyAIConfig {
  id: string;
  name: string;
  description: string;
  status: boolean;
  lastUpdated: number;
  currentVersion?: string;
  currentVersionType?: 'draft' | 'published' | 'none';
  onlineVersion?: string;
  versionUpdatedAt?: number;
  versionChangeSummary?: string[];
  
  // Model Config
  llmType: ModelType;
  thinkingEnabled?: boolean;
  contextCompactionEnabled?: boolean;
  safetyGuardrailConfig?: SafetyGuardrailConfig;
  globalExceptionPolicy?: GlobalExceptionPolicy;
  temperature: number;
  topP: number;
  
  // Voice Config
  ttsModel: TTSModel;
  voiceName: string;
  ttsAutoSwitch?: boolean; 
  ttsVoiceMapping?: Record<string, string>; 
  volume: number;
  speed: number;
  emotion: string;
  
  // TTS Optimization
  ttsOptimizationEnabled?: boolean;
  ttsOptimizationRules?: Array<{
    id: string;
    matchText: string;
    replaceText: string;
  }>;
  
  // ASR Text Correction
  asrTextCorrectionEnabled?: boolean;
  asrTextCorrectionRules?: Array<{
    id: string;
    matchText: string;
    replaceText: string;
  }>;
  
  // ASR Config
  asrModel: ASRModel;
  asrInterruptible: boolean;
  asrSilenceDurationMs: number;
  
  // Logic
  systemPrompt: string;
  variables: BotVariable[];
  parameters: Parameter[];
  
  // === 需求 1：基础配置新增字段 ===
  agentRole?: string;
  persona?: string;
  businessScene?: string;
  responseStyle?: string;
  maxSentenceCount?: number;
  
  // Extraction (Legacy field support)
  extractionConfigId?: string;
  extractionPrompt?: string;
  
  // *** ORCHESTRATION SWITCH ***
  orchestrationType?: 'WORKFLOW' | 'AGENT'; // Default 'WORKFLOW'
  agentConfig?: AgentConfig; // New Agent Mode Config
  agentOrchestration?: AgentOrchestrationConfig;
  
  // Intent/Flow (Workflow Mode)
  routerEnabled: boolean;
  intents: BotIntent[];
  
  // Strategy
  protectionDurationMs: number;
  interruptionWaitMs: number;
  maxCallDurationSeconds: number;
  contextItems: any[]; 
  labelGroups: LabelGroup[];
  
  // Knowledge Base Config (New)
  kbEnabled?: boolean;
  knowledgeRetrievalMode?: 'global' | 'tool';
  kbCategories?: string[]; // Legacy: List of categories enabled for this bot (deprecated, use kbQACategories and kbLexiconCategories)
  kbQACategories?: string[]; // 问答对分类列表
  kbLexiconCategories?: string[]; // 词库分类列表
  
  // === 需求 5：知识检索配置新增字段 ===
  qaCategoryConfigs?: QACategoryConfig[];
  topicBindings?: Array<{
    categoryId: string;
    categoryName: string;
    enabled: boolean;
    entryBehavior: string;
    priority: number;
  }>;
  smalltalkTopicId?: string;
  fallbackFlowId?: string;
  stateDefaults?: string;
  stateWriteRules?: string;

  // Strategy Details
  welcomeMessageEnabled: boolean;
  welcomeMessage: string;
  welcomeMessageInterruptible?: boolean;
  interruptionSensitivity?: 'sensitive' | 'balanced' | 'robust';
  validShortReplyWords?: string[];
  forceInterruptWords?: string[];
  forceInterruptReply?: string | string[];
  // 兼容旧版字段，前端不再展示。
  emergencyStopWords?: string[];
  
  transferIntentDefaultEnabled?: boolean;
  transferIntentCustomEnabled?: boolean;
  transferCustomIntents?: string[];
  transferIntentThreshold: number;
  
  // Scene-based transfer
  transferSceneEnabled?: boolean;
  transferScenes?: Array<{
    id: string;
    scene: string;
    description: string;
  }>;
  transferConditionRoundsEnabled?: boolean;
  transferConditionRounds?: number;
  transferConditionDurationEnabled?: boolean;
  transferConditionDuration?: number;
  transferSpeech?: string;
  transferIvrTarget?: string;

  hangupIntentDefaultEnabled?: boolean;
  hangupIntentCustomEnabled?: boolean;

  // Test Management
  testSuites?: TestSuite[];

  // Hangup settings
  hangupCustomIntents?: string[];
  hangupIntentThreshold: number;
  hangupConditionRoundsEnabled?: boolean;
  hangupConditionRounds?: number;
  hangupConditionDurationEnabled?: boolean;
  hangupConditionDuration?: number;
  hangupSpeech?: string;

  // Parallel turn classification speech
  channelCheckSpeech?: string | string[];
  unclearSpeech?: string | string[];

  // No answer settings
  noAnswerInterval?: number;
  noAnswerMaxRepeats?: number;
  noAnswerSpeech?: string;
  firstResponseFillerConfig?: FirstResponseFillerConfig;
  globalTimeoutEnabled?: boolean;
  globalTimeoutSeconds?: number;
  globalTimeoutSpeech?: string;

  // Security Intercept Strategy
  securityInterceptEnabled?: boolean;
  securityWords?: Array<{
    id: string;
    word: string;
    action?: 'continue' | 'transfer';
    speech?: string;
  }>;

  // Topic Skill Library Config
  topicSkillLibraryConfig?: TopicSkillLibraryConfig;

  // 触发器配置
  triggers?: BotTrigger[];
}

// 主题技能类型定义
export interface TopicSkill {
  id: string;
  name: string;
  description?: string;
  topicType?: 'normal' | 'flow';
  linkedFlowId?: string;
  isEnabled: boolean;
  exampleQuestions: string[];
  prompt: string;
  tools: string[];
  variables: string[];
  entities?: string[];
  flows?: string[];
  knowledgeTags?: string[];
  transferDecisionPrompt?: string;
  transferIvrTarget?: string;
  hangupDecisionPrompt?: string;
  transferSpeeches?: string | string[];
  hangupSpeeches?: string | string[];
  createdAt: string;
  updatedAt: string;
}

// 主题技能库配置类型
export interface TopicSkillLibraryConfig {
  enabled: boolean;
  historyConversationEnabled?: boolean;
  historyConversationCount?: number;
  previousTopicPriorityEnabled?: boolean;
  skills: TopicSkill[];
  pageSize: number;
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

// Marketing Config
export interface MarketingConfig {
  marketingEnabled?: boolean;
  marketingTimings?: string[];
  marketingConflictStrategy?: 'service_first' | 'record_only' | 'disabled' | 'marketing_first';
  activeCampaignIds?: string[];
  customerOperationsConfig?: BotMarketingConfig;
}

// 触发器配置
export interface BotTrigger {
  id: string;
  name: string;
  description?: string;
  triggerTime: 'call_start' | 'call_end';
  action: 'satisfaction_survey' | 'send_sms' | 'extract_info' | 'call_api' | 'pre_call_fetch';
  actionConfig?: {
    smsTemplateId?: string;
    smsParams?: Record<string, string>;
    apiConfigId?: string;
    apiParams?: Record<string, string>;
    extractionFields?: string[];
    surveyQuestions?: string[];
    waitAudioId?: string;
    timeoutSeconds?: number;
    failureAction?: 'continue' | 'hangup' | 'transfer';
    requestMappings?: Array<{
      parameterName: string;
      variableId: string;
    }>;
    responseMappings?: Array<{
      sourcePath: string;
      variableId: string;
      defaultValue?: string;
      required?: boolean;
    }>;
  };
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Profile Collection Config
export interface ProfileCollectionConfig {
  profileCollectionEnabled?: boolean;
  profileExtractionPrompt?: string;
  profileExtractionRules?: ProfileExtractionRule[];
}

// PolyAI Flow Config
export interface PolyAIConfig {
  flowConfig?: FlowConfig;
}

// Test Suite and Case Definitions
export interface TestCase {
  id: string;
  name: string;
  suiteName: string; // 所属测试集名称
  sourceTag?: string; // 来源标注
  conversations: TestConversation[]; // 对话轮次（仅用户输入）
  expectedOutcome?: string; // 预期结果
  createdAt: string;
  updatedAt: string;
}

export interface TestConversation {
  id: string;
  userInput: string; // 用户输入内容
  expectedResponse?: string; // 期望的机器人回复（可选）
  timestamp: number;
}

// 测试结果
export interface TestResult {
  caseId: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'error';
  actualResponses: string[]; // 实际LLM返回内容
  duration: number; // 测试耗时
  errorMessage?: string;
  completedAt?: string;
}

// 测试集（由测试用例按suiteName聚合而成）
export interface TestSuite {
  name: string; // 测试集名称
  description?: string;
  caseCount: number;
  testCases: TestCase[];
}

// ... (Rest of types unchanged)
// Extraction Trigger
export interface TriggerCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface TriggerAction {
  id: string;
  type: string;
  value: string;
}

export interface TriggerConfigItem {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  subjectType: string;
  subjectValue: string;
  timing: string;
  conditions: TriggerCondition[];
  logicType: 'ALL' | 'ANY' | 'CUSTOM';
  actions: TriggerAction[];
}

// Knowledge Base
export interface QAPair {
  id: string;
  standardQuestion: string;
  similarQuestions: string[];
  answer: string;
  category?: string;
  validityType: 'permanent' | 'range';
  validityStart?: number;
  validityEnd?: number;
  lastUpdated: number;
  isActive: boolean;
  audioResources?: Record<string, string>;
  toolIds?: string[];
  toolCallMode?: 'sync' | 'async';
  
  // === 需求 6：问答对新增字段 ===
  entryPolicy?: 'immediate' | 'after_confirmation' | 'fallback_only';
  handoffOnFailure?: boolean;
}

// === 需求 6：分类配置新增字段 ===
export interface QACategoryConfig {
  id: string;
  name: string;
  description?: string;
  topicType?: 'qa' | 'smalltalk' | 'fallback' | 'business';
  entryBehavior?: 'direct_answer' | 'flow_trigger' | 'tool_call';
  linkedFlowId?: string;
  linkedToolIds?: string[];
  linkedFunctionIds?: string[];
  enabled?: boolean;
}

export interface KnowledgeCandidate {
  id: string;
  question: string;
  similarQuestions?: string[];
  answer: string;
  sourceType: 'bot_dialog' | 'human_takeover';
  sourceId: string;
  frequency: number;
  confidence: number;
  extractedTime: number;
  status: 'pending' | 'approved' | 'rejected';
  // 新增字段
  category?: string;
  autoCategory?: string;
  categoryConfidence?: number;
  adoptedAt?: number;
  adoptedBy?: string;
}

// 批量操作请求类型
export interface BatchAdoptRequest {
  itemIds: string[];
  category: string;
  syncToQAManager: boolean;
}

export interface BatchUpdateCategoryRequest {
  itemIds: string[];
  category: string;
}

export interface KnowledgeSettings {
  enableExtraction: boolean;
  extractionPrompt: string;
  enableMissingIdentification: boolean;
  heatCalculationCycle: 'daily' | 'weekly' | 'monthly';
  extractionSchedule: 'realtime' | 'daily_2am' | 'manual';
  sourceFilter: 'all' | 'human_takeover';
  confidenceThreshold: number;
}

// --- RAG (Retrieval Augmented Generation) Types ---

export interface RAGConfig {
  enabled: boolean;
  embeddingModel: string;
  vectorDimension: number;
  topK: number;
  similarityThreshold: number;
  searchMode: 'vector' | 'hybrid';
  contextTemplate?: string;
  vectorDB: VectorDBConfig;
}

export interface VectorDBConfig {
  provider: 'qdrant' | 'milvus' | 'pinecone';
  host: string;
  port?: number;
  apiKey?: string;
  collectionName: string;
  https?: boolean;
}

export interface RAGSearchRequest {
  query: string;
  topK?: number;
  threshold?: number;
  category?: string;
  filter?: Record<string, any>;
}

export interface RAGSearchResponse {
  results: RAGResult[];
  total: number;
  latency: number;
}

export interface RAGResult {
  qaPair: QAPair;
  score: number;
  rank: number;
}

export interface EmbeddingRequest {
  texts: string[];
  model?: string;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface QAPairVectorStatus {
  vectorId?: string;
  embeddingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  lastEmbeddedAt?: number;
  errorMessage?: string;
}

// Extend QAPair with vector status
export interface QAPairWithVector extends QAPair {
  vectorStatus?: QAPairVectorStatus;
}

// Lexicon
export interface LexiconItem {
  id: string;
  term: string;
  synonyms: string[];
  category: string;
  description: string;
  weight: 'HIGH' | 'MEDIUM' | 'LOW';
  isActive: boolean;
  lastUpdated: number;
}

// Seats
export interface Seat {
  id: string;
  name: string;
  botConfigId: string;
  concurrency: number;
  queuePromptAudioId?: string;
  status: 'active' | 'disabled';
  createdAt: number;
}

// Market
export interface VoiceProduct {
  id: string;
  name: string;
  provider: string;
  gender: 'Male' | 'Female';
  language: string;
  tags: string[];
  isVip: boolean;
}

export interface BotTemplate {
  id: string;
  name: string;
  category: string;
  difficulty: 'Simple' | 'Medium' | 'Complex';
  usageCount: number;
  description: string;
  tags: string[];
}

// Number Management
export interface DisplaySettingsConfig {
  defaultOutboundType: 'trunk' | 'pool';
  defaultOutboundValue: string;
  inboundMappingType: 'original' | 'trunk' | 'specific' | 'pool';
  transferDisplayType: 'original' | 'trunk' | 'specific' | 'pool';
  mobileOutboundType: 'same_as_customer' | 'specific_trunk' | 'specific_pool';
}

export interface TrunkNumberItem {
  id: string;
  number: string;
  type: string;
  poolName?: string;
  location: string;
  status: 'active' | 'inactive';
  note?: string;
  name?: string;
}

export interface NumberPoolItem {
  id: string;
  name: string;
  strategy: 'random' | 'round_robin' | 'location' | 'custom';
  numbersCount: number;
  smartFilter: boolean;
  note: string;
}

// Settings
export interface GeoGroup {
  id: string;
  name: string;
  regions: string[];
  updatedAt: number;
  note: string;
}

export interface BusinessHourShift {
  day: number;
  start: string;
  end: string;
  enabled: boolean;
}

export interface BusinessHour {
  id: string;
  name: string;
  timezone: string;
  shifts: BusinessHourShift[];
  note: string;
}

// IVR
export interface RouteRule {
  id: string;
  priority: number;
  name: string;
  status: boolean;
  conditionField: 'trunk' | 'geo' | 'time' | 'user_number';
  conditionOperator: 'equals' | 'include' | 'exclude';
  conditionValue: string;
  jumpTargetType: 'bot' | 'seat' | 'ivr_node';
  jumpTargetValue: string;
  note?: string;
}

// File Management
export interface AudioRecording {
  id: string;
  name: string;
  text: string;
  voice: string;
  duration: number; // seconds
  url: string; // mock url
  updatedAt: number;
}

// --- DEBUG TYPES (New) ---

export type DebugExecutionState = 'idle' | 'running' | 'paused' | 'completed' | 'error';

export type NodeExecutionStatus = 'pending' | 'executing' | 'success' | 'error' | 'skipped';

export interface NodeExecutionInfo {
  nodeId: string;
  status: NodeExecutionStatus;
  input: Record<string, any>;
  output: Record<string, any>;
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: string;
  attemptCount: number;
  logs?: string[];  // 执行日志
}

export interface DebugBreakpoint {
  id: string;
  nodeId: string;
  condition?: string;
  enabled: boolean;
  hitCount: number;
}

export interface ExecutionStep {
  id: string;
  nodeId: string;
  timestamp: number;
  executionInfo: NodeExecutionInfo;
  variablesSnapshot: Record<string, any>;
}

export interface DebugSession {
  id: string;
  startTime: number;
  endTime?: number;
  state: DebugExecutionState;
  currentNodeId: string | null;
  executionHistory: ExecutionStep[];
  breakpoints: DebugBreakpoint[];
  variables: Record<string, any>;
  executionSpeed: number;
  maxSteps: number;
  currentStep: number;
  autoPauseOnError: boolean;
}

export interface DebugConfig {
  executionSpeed: number;
  autoPauseOnError: boolean;
  showDetailedLogs: boolean;
  maxSteps: number;
  timeoutMs: number;
}

export type StepType = 'over' | 'into' | 'out';

// ----------------------------

export interface BackgroundMusic {
  id: string;
  name: string;
  fileName: string;
  size: string; // e.g. "2.5 MB"
  url: string;
  uploadedAt: number;
}

// --- Outbound Types ---

export interface ContactList {
  id: string;
  name: string;
  totalCount: number;
  validCount: number;
  status: 'importing' | 'ready' | 'error' | 'running' | 'paused' | 'completed';
  createdAt: number;
  tags?: string[];
  // Stats for task execution
  executedCount?: number;
  connectedCount?: number;
  seatAnsweredCount?: number;
  retryCount?: number;
  successRate?: string;
  priority?: number;
}

export interface OutboundTemplate {
  id: string;
  name: string;
  remark: string;
  
  // Dialing Settings
  ivrMode: boolean; // IVR模式开关
  outboundMode: 'ai_bot' | 'predictive' | 'preview'; // 外呼模式
  botConfigId?: string; // 关联机器人
  
  callerIdType: 'number' | 'pool';
  callerIdValue: string; // ID of trunk or pool
  
  executionTimeId: string; // 关联工作时间ID
  blacklistId: string; // 关联黑名单ID
  
  taskConcurrency: number; // 任务并发
  botConcurrency: number; // 机器人并发
  
  // Call Options
  maxRingDuration: number;
  callValidDuration?: number; // 通话有效性判定时长
  retryStrategy: 'first_priority' | 'retry_priority'; // 首呼优先 vs 重呼优先
}

export interface OutboundTask {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'completed' | 'draft' | 'stopped';
  templateId: string;
  
  // Stats
  totalContacts: number;
  executedCount: number;
  connectedCount: number; // 客户接听
  unansweredCount: number;
  seatAnsweredCount: number;
  retryCount: number;
  
  // Config
  startType: 'manual' | 'scheduled' | 'periodic';
  endTime?: string;
  priority: number;
  stopOnEmpty: boolean;
  
  contactListIds: string[]; // Associated contact lists
  
  remark?: string;
  
  // Detail View Fields
  creator?: string;
  startTime?: string; // Actual start time
  createTime?: string;
  currentConcurrency?: number;
}

export interface CallRecord {
  id: string;
  taskId: string;
  phoneNumber: string;
  customerName?: string;
  startTime: number;
  duration: number; // seconds
  status: 'answered' | 'no_answer' | 'busy' | 'failed';
  intentResult: string; // e.g., 'A级意向', '拒绝'
  botName: string;
  rounds: number;
  recordingUrl?: string;
}

// --- Smart Marketing and Follow-up Operations ---

export type CustomerTagType = 'basic' | 'behavior' | 'intent' | 'risk' | 'result';
export type CustomerTagSource = 'call_recognition' | 'manual' | 'marketing_result' | 'follow_up_result';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface CustomerTag {
  id: string;
  name: string;
  type: CustomerTagType;
  source: CustomerTagSource;
  confidence: ConfidenceLevel;
  updatedAt: number;
  expiresAt?: number;
  explanation: string;
}

export interface CustomerInteraction {
  id: string;
  type: 'call' | 'marketing' | 'follow_up' | 'manual';
  time: number;
  title: string;
  detail: string;
  result?: string;
  botName?: string;
  flowName?: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phoneNumber: string;
  region: string; // e.g. "Shanghai"
  tags: string[]; // 保留旧页面兼容，展示时优先使用 structuredTags
  structuredTags?: CustomerTag[];
  customerLevel?: '普通客户' | 'VIP客户' | '企业客户' | '高价值客户';
  marketingStatus?: '可推荐' | '已触达' | '已拒绝' | '冷却中' | '禁止触达';
  followUpStatus?: '无跟进' | '待跟进' | '跟进中' | '已完成' | '已取消';
  riskStatus?: '正常' | '投诉风险' | '情绪异常' | '黑名单';
  lastCallResult?: '已解决' | '未解决' | '有意向' | '拒绝' | '转人工' | '未接通';
  recommendedCampaignIds?: string[];
  touchBlockReasons?: string[];
  interactions?: CustomerInteraction[];
  lastInteraction: number;
  notes?: string;
}

export type MarketingGoal = 'conversion' | 'renewal' | 'reactivation' | 'care' | 'follow_up';
export type MarketingTriggerTiming = 'post_resolution' | 'price_inquiry' | 'interest_detected' | 'hesitation' | 'pre_hangup';

export interface MarketingSpeechVariant {
  id: string;
  label: string;
  matchTags: string[];
  content: string;
}

export interface CampaignStats {
  exposureCount: number;
  interestedCount: number;
  rejectedCount: number;
  transferCount: number;
  conversionCount: number;
  negativeFeedbackCount: number;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  status: 'active' | 'draft' | 'ended' | 'scheduled';
  goal?: MarketingGoal;
  priority?: number;
  
  // Targeting
  targetRegions: string[]; // e.g. ["Shanghai", "Beijing"]
  targetTags: string[]; // e.g. ["VIP"]
  excludeTags?: string[];
  targetLastCallResults?: string[];
  requireNoRecentTouch?: boolean;
  requireFollowUpTask?: boolean;
  excludeRiskTags?: string[];
  
  // Validity
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  
  // Content
  speechContent: string; // TTS text for the bot to say
  speechVariants?: MarketingSpeechVariant[];
  interestedReply?: string;
  rejectedReply?: string;
  smsTemplateId?: string; // Optional follow-up SMS
  
  // Trigger and execution
  triggerTimings?: MarketingTriggerTiming[];
  executableBotIds?: string[];
  executableFlowIds?: string[];
  requireUserConfirmation?: boolean;
  allowAutoFollowUp?: boolean;
  
  // Stats
  exposureCount: number;
  conversionCount: number;
  stats?: CampaignStats;
  
  updatedAt: number;
}

export type FollowUpTrigger = 'later_contact' | 'explicit_time' | 'considering' | 'appointment_success' | 'no_answer' | 'post_call_review';
export type FollowUpAction = 'auto_call' | 'manual_task' | 'write_tag' | 'enter_flow';
export type FollowUpTaskStatus = 'pending' | 'running' | 'connected' | 'no_answer' | 'completed' | 'rejected' | 'cancelled' | 'failed' | 'transferred' | 'expired';

export interface TouchProtectionPolicy {
  maxDailyCalls: number;
  maxWeeklyCalls?: number;
  avoidNightCalls: boolean;
  avoidHolidays: boolean;
  rejectCooldownDays: number;
  blockComplaintRisk: boolean;
  blockBlacklist: boolean;
}

export interface FollowUpRetryPolicy {
  maxRetries: number;
  retryIntervalHours: number;
  maxDailyAttempts: number;
  failureAction: 'close' | 'transfer' | 'delay';
}

export interface FollowUpRule {
  id: string;
  name: string;
  enabled: boolean;
  applicableBotIds: string[];
  applicableFlowIds: string[];
  botNames?: string[];
  flowNames?: string[];
  triggers: FollowUpTrigger[];
  useUserSpecifiedTime: boolean;
  defaultDelayDays: number;
  preferredTimeRange: string;
  actions: FollowUpAction[];
  executionBotId?: string;
  executionFlowId?: string;
  retryPolicy: FollowUpRetryPolicy;
  touchProtection: TouchProtectionPolicy;
  exitConditions: string[];
}

export interface FollowUpAttempt {
  id: string;
  taskId: string;
  executedAt: number;
  result: 'connected' | 'no_answer' | 'busy' | 'failed' | 'transferred';
  summary: string;
}

export interface FollowUpTask {
  id: string;
  customerName: string;
  phoneNumber: string;
  sourceCallId: string;
  sourceBotName: string;
  sourceFlowName: string;
  reason: string;
  plannedCallTime: number;
  executionBotName: string;
  executionFlowName: string;
  status: FollowUpTaskStatus;
  retryCount: number;
  latestResult: string;
  ruleId?: string;
  flowVersion?: number;
  attempts: FollowUpAttempt[];
}

export interface BotMarketingConfig {
  profileRecognitionEnabled?: boolean;
  autoExtractTags?: boolean;
  autoGenerateSummary?: boolean;
  autoDetectIntent?: boolean;
  autoDetectFollowUpTime?: boolean;
  marketingRecommendationEnabled?: boolean;
  enabledCampaignIds?: string[];
  triggerTimings?: MarketingTriggerTiming[];
  conflictStrategy?: 'service_first' | 'record_only' | 'disabled';
  followUpEnabled?: boolean;
  enabledFollowUpRuleIds?: string[];
  defaultExecutionBotId?: string;
  defaultExecutionFlowId?: string;
  askWhenTimeUnclear?: boolean;
  defaultFollowUpDelayDays?: number;
  touchProtection?: TouchProtectionPolicy;
  writeBackTags?: boolean;
  writeBackSummary?: boolean;
  writeBackMarketingResult?: boolean;
  writeBackFollowUpResult?: boolean;
  generateReportData?: boolean;
}

// --- Monitoring Report Types (New) ---

export interface ReportMetrics {
  totalCalls: number;
  connectedCalls: number;
  connectionRate: number;
  totalDuration: number;
  avgDuration: number;
  avgSatisfaction: number;
  transferCount: number;
  transferRate: number;
  interceptRate: number;
}

export interface TrendData {
  date: string;
  totalCalls: number;
  connectedCalls: number;
  avgDuration: number;
  satisfaction: number;
}

export type CallDirectionFilter = '全部呼叫' | '呼入' | '外呼';

export interface BotPerformance {
  botId: string;
  botName: string;
  totalCalls: number;
  connectionRate: number;
  avgDuration: number;
  satisfaction: number;
  intentAccuracy: number;
  transferRate: number;
}

export interface IntentAnalysis {
  intentId: string;
  intentName: string;
  triggerCount: number;
  accuracy: number;
  avgDuration: number;
}

export interface HourlyDistribution {
  hour: number;
  callCount: number;
}

export interface DurationDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface HangupReasonDistribution {
  reason: string;
  count: number;
  percentage: number;
}

export interface UnmatchedIntent {
  text: string;
  count: number;
  lastTime: number;
}

export type RealtimeCallStatus = 'in_call' | 'queueing' | 'transferring' | 'error';

export interface RealtimeBotStatus {
  botId: string;
  botName: string;
  status: 'online' | 'offline' | 'warning';
  activeCalls: number;
  queueCount: number;
  concurrencyUsed: number;
  concurrencyLimit: number;
  lastHeartbeat: number;
}

export interface RealtimeCallQueueItem {
  id: string;
  customerPhone: string;
  botName: string;
  currentFlow: string;
  currentNode: string;
  duration: number;
  status: RealtimeCallStatus;
  startedAt: number;
}

export interface ConcurrencyTrendPoint {
  time: string;
  used: number;
  limit: number;
}

export interface RealtimeMonitorData {
  activeCalls: number;
  queueingCalls: number;
  concurrencyUsed: number;
  concurrencyLimit: number;
  todayCalls: number;
  todayErrors: number;
  todayTransfers: number;
  botStatuses: RealtimeBotStatus[];
  concurrencyTrend: ConcurrencyTrendPoint[];
  queueItems: RealtimeCallQueueItem[];
}

export interface AlertEvent {
  id: string;
  time: number;
  level: 'high' | 'medium' | 'low';
  type: string;
  botName: string;
  callId: string;
  reason: string;
  status: 'open' | 'acknowledged' | 'recovered';
  flowName: string;
  nodeName: string;
  target: string;
  errorMessage: string;
  suggestion: string;
}


export interface TopicAnalysisReport {
  id: string;
  topicName: string;
  callCount: number;
  callShare: number;
  firstTopicCallCount: number;
  firstTopicShare: number;
}

export interface BusinessResultReport {
  id: string;
  businessName: string;
  triggerCount: number;
  completedCount: number;
  transferCount: number;
  transferRate: number;
  transferAfterCompleted: number;
  avgHandleTime: number;
  abandonedCount: number;
  relatedFlowName: string;
  relatedTools: string[];
}

export interface FlowFunnelNodeReport {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  enteredCount: number;
  arrivedCount: number;
  passedCount: number;
  passRate: number;
  dropRate: number;
  transferRate: number;
  avgStaySeconds: number;
  userHangupCount: number;
  transferCount: number;
  toolFailureCount: number;
  errorCount: number;
}

export interface FlowFunnelEdgeReport {
  edgeId: string;
  fromNode: string;
  toNode: string;
  branchType: 'conditional' | 'llm_branch' | 'normal';
  conditionText: string;
  hitCount: number;
  hitRate: number;
}

export interface FlowFunnelReport {
  flowId: string;
  flowName: string;
  botName: string;
  enteredCount: number;
  completedCount: number;
  nodes: FlowFunnelNodeReport[];
  edges: FlowFunnelEdgeReport[];
  lossReasons: Array<{ reason: string; count: number; percentage: number }>;
}

export interface ToolCallReport {
  toolId: string;
  toolName: string;
  toolType: 'API' | 'SMS' | 'TRANSFER' | 'FUNCTION';
  callCount: number;
  successCount: number;
  successRate: number;
  failureRate: number;
  avgLatencyMs: number;
  timeoutCount: number;
  directPlayCount: number;
  directPlaySuccessRate: number;
  modelReplyCount: number;
  savedModelCalls: number;
  topFailureReason: string;
  botCount: number;
  errorCodes: Array<{ code: string; count: number }>;
  recentFailureSamples: string[];
  relatedFlowNodes: string[];
}

export interface TransferReportReason {
  reason: string;
  count: number;
  percentage: number;
  mainSourceFlow: string;
}

export interface TransferReport {
  totalTransfers: number;
  transferRate: number;
  reasons: TransferReportReason[];
}

export interface CallFlowPathItem {
  nodeName: string;
  nodeType: string;
  enteredAt: number;
  staySeconds: number;
  marker?: 'tool' | 'transfer' | 'error';
}

export interface CallToolRecord {
  toolName: string;
  calledAt: number;
  paramsSummary: string;
  resultSummary: string;
  status: 'success' | 'failed' | 'timeout';
  latencyMs: number;
}

export interface CallDetail {
  id: string;
  startedAt: number;
  customerPhone: string;
  botName: string;
  status: 'completed' | 'failed' | 'transferred' | 'error';
  duration: number;
  businessName: string;
  result: '完成' | '失败' | '转人工' | '异常';
  satisfaction?: number;
  recordingUrl?: string;
  transcript: Array<{ speaker: 'user' | 'bot' | 'agent'; text: string; time: number }>;
  flowPath: CallFlowPathItem[];
  toolRecords: CallToolRecord[];
  transferRecords: Array<{ reason: string; queueSeconds: number; result: string; time: number }>;
  alertRecords: Array<{ type: string; message: string; time: number }>;
  businessSummary: string;
}

export type BusinessEventSourceType = 'platform' | 'tool_result' | 'callback' | 'variable';

export interface BusinessEventCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'contains';
  value: string;
}

export interface BusinessEventDefinition {
  id: string;
  code: string;
  name: string;
  sourceType: BusinessEventSourceType;
  sourceObject: string;
  condition?: BusinessEventCondition;
  enabled: boolean;
}

export interface BusinessFunnelStageDefinition {
  id: string;
  name: string;
  eventId: string;
}

export interface BusinessFunnelDefinition {
  id: string;
  name: string;
  botId: string;
  versionId: string;
  enabled: boolean;
  stages: BusinessFunnelStageDefinition[];
}

export interface BusinessFunnelRuntimeEvent {
  id: string;
  callId: string;
  eventId: string;
  occurredAt: number;
  reasonCode?: string;
  reasonName?: string;
}

export interface BusinessFunnelCall {
  id: string;
  startedAt: number;
  customerPhone: string;
  botId: string;
  botName: string;
  versionId: string;
  versionName: string;
  direction: 'inbound' | 'outbound';
  durationSeconds: number;
  status: 'completed' | 'transferred' | 'hangup' | 'failed';
}

export interface BusinessFunnelSourceData {
  bots: Array<{ id: string; name: string }>;
  versions: Array<{ id: string; name: string; botId: string }>;
  events: BusinessEventDefinition[];
  funnels: BusinessFunnelDefinition[];
  calls: BusinessFunnelCall[];
  runtimeEvents: BusinessFunnelRuntimeEvent[];
}

export interface BusinessFunnelStageMetric extends BusinessFunnelStageDefinition {
  reachedCount: number;
  previousConversionRate: number;
  cumulativeConversionRate: number;
  lossCount: number;
}

export interface BusinessFunnelReport {
  funnel: BusinessFunnelDefinition;
  stages: BusinessFunnelStageMetric[];
  calls: BusinessFunnelCall[];
  reachedCallIdsByStage: Record<string, string[]>;
  lostCallIdsByStage: Record<string, string[]>;
  lossReasonsByStage: Record<string, Array<{ code: string; name: string; count: number }>>;
}

export interface ReportSubscription {
  id: string;
  name: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'custom';
  frequency: '每日' | '每周' | '每月';
  sendTime: string;
  recipients: string[];
  filters: string[];
  fileFormat: 'Excel' | 'CSV';
  enabled: boolean;
  contentSummary: string[];
}

// ==================== 通话分析 Tab ====================

export interface CallAnalysisMetrics {
  totalCalls: number;
  connectionRate: number;
  effectiveRate: number;       // 有效通话率（>15s）
  avgDuration: number;
  medianDuration: number;
  repeatCustomers: number;
  userHangupRate: number;      // 用户主动挂断量 / 通话总量
}

export interface CallVolumeTrendPoint {
  label: string;
  inbound: number;
  outbound: number;
  connected: number;
  inboundEffective: number;
  effective: number;
  outboundConnected: number;
  missed: number;
}

export interface CallDurationBucket {
  range: string;
  count: number;
  percentage: number;
  completionRate: number;
  transferRate: number;
}

export interface RepeatCallCustomer {
  customerPhone: string;
  count24h: number;
  count7d: number;
  lastBusiness: string;
  lastResult: string;
  unresolvedCount: number;
  lastCallTime: number;
}

export interface RegionCallStat {
  region: string;
  totalCalls: number;
  connectionRate: number;
  completionRate: number;
  transferRate: number;
}

export interface HangupReasonStat {
  reason: string;
  count: number;
  percentage: number;
}

export interface ShortCallSample {
  callId: string;
  customerPhone: string;
  duration: number;
  hangupBy: string;
  hangupReason: string;
  botName: string;
  businessName: string;
  lastNode: string;
}

export interface CallAnalysisData {
  metrics: CallAnalysisMetrics;
  volumeTrend: CallVolumeTrendPoint[];
  durationBuckets: CallDurationBucket[];
  repeatCustomers: RepeatCallCustomer[];
  regionStats: RegionCallStat[];
  weekdayHourHeatmap: number[][];
  hangupReasons: HangupReasonStat[];
  shortCallSamples: ShortCallSample[];
}

// ==================== 工具与实体：实体质量 ====================

export interface EntityFieldQuality {
  field: string;
  extractedCount: number;
  successRate: number;
  missingCount: number;
  formatErrorCount: number;
  lowConfidenceCount: number;
  affectedBusiness: string;
  suggestion: string;
}

export interface ValidationFunnelStage {
  stage: string;
  count: number;
  rate: number;
}

export interface EntityQualityReport {
  fields: EntityFieldQuality[];
  validationFunnel: ValidationFunnelStage[];
}

// Extend CallRecord with report-related fields
export interface CallRecordDetail extends CallRecord {
  satisfaction?: number; // 1-5 rating
  hangupReason: 'normal' | 'user_hangup' | 'timeout' | 'transfer' | 'error';
  intentMatched: boolean;
  intentName?: string;
  waitTime: number; // seconds before bot answers
  botId: string;
}

export type TimeRange = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';

// ==================== PolyAI Flow Types ====================

export enum FlowNodeType {
  START = 'start',
  DEFAULT = 'default',
  EXIT = 'exit'
}

export enum ExitNodeType {
  FINISH = 'finish',
  HANDOFF = 'handoff',
  STOP = 'stop'
}

export interface StepPromptConfig {
  prompt: string;
  visibleFunctionIds: string[];
  transitionFunctionIds: string[];
  codeBlockIds?: string[];
  transferDecisionPrompt?: string;
  transferIvrTarget?: string;
  hangupDecisionPrompt?: string;
  transferSpeeches?: string | string[];
  hangupSpeeches?: string | string[];
}

export type FlowStepKind = 'default' | 'function' | 'collect' | 'advanced' | 'exit';

export type FlowEntityType =
  | 'text'
  | 'phone'
  | 'number'
  | 'datetime'
  | 'address'
  | 'email'
  | 'alphanumeric';

export type FlowAsrBiasing =
  | 'default'
  | 'alphanumeric'
  | 'name'
  | 'datetime'
  | 'number'
  | 'address';

export interface FlowEntityConfig {
  enabled: boolean;
  entityName?: string;
  entityType?: FlowEntityType;
  prompt?: string;
  asrBiasing?: FlowAsrBiasing;
  required?: boolean;
  inputMode?: 'speech' | 'dtmf' | 'speech_or_dtmf';
  dtmfMaxDigits?: number;
  dtmfTerminator?: '#' | '*';
  dtmfFirstDigitTimeoutMs?: number;
  dtmfInterDigitTimeoutMs?: number;
  collectWhileSpeaking?: boolean;
  containsPii?: boolean;
  validationPattern?: string;
  options?: string[];
}

export interface FlowRetryConfig {
  enabled: boolean;
  maxAttempts: number;
  noInputPrompt?: string;
  noMatchPrompt?: string;
  confirmationPrompt?: string;
  fallbackAction?: 'goto_node' | 'goto_flow' | 'handoff' | 'exit';
  fallbackTargetId?: string;
  fallbackFlowId?: string;
  handoffTargetId?: string;
  repromptDelayMs?: number;
}

export interface FlowNodeData {
  name: string;
  description?: string;
  stepType?: FlowStepKind;
  // LLM Configuration (for DEFAULT nodes)
  modelType?: ModelType;
  temperature?: number;
  systemPrompt?: string;
  // Step Prompt Configuration
  stepPrompt?: StepPromptConfig;
  // Function Bindings
  visibleFunctionIds?: string[];
  transitionFunctionIds?: string[];
  toolIds?: string[];
  codeBlockIds?: string[];
  // Few-shot Examples
  fewShotExamples?: Array<{ input: string; output: string }>;
  entityConfig?: FlowEntityConfig;
  retryConfig?: FlowRetryConfig;
  gotoFlowId?: string;
  handoffTargetId?: string;
  handoffReason?: string;
  extractionSchemaId?: string;
  asrBiasingPresetId?: string;
  lexiconPresetIds?: string[];
  exceptionPolicy?: StepExceptionPolicy;
  // Exit Node Configuration
  exitType?: ExitNodeType;
  
  // === 需求 2：流程节点配置新增字段 ===
  delayProfileId?: string;
  primaryFunctionId?: string;
  functionArgsMapping?: Array<{
    argName: string;
    sourceType: 'variable' | 'state' | 'constant' | 'entity';
    sourceKey: string;
  }>;
  entityValidationFunctionId?: string;
  entityNormalizationFunctionId?: string;
  readStateKeys?: string[];
  writeStateKeys?: string[];
  handoffSummaryTemplate?: string;
  
  [key: string]: any;
}

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  position: {
    x: number;
    y: number;
  };
  data: FlowNodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  edgeType?: 'normal' | 'conditional' | 'llm_branch' | 'fallback' | 'goto_flow';
  description?: string;
  conditionSummary?: string;
  llmRoutingPrompt?: string;
  priority?: number;
  requiredEntities?: string[];
  transitionFunctionId?: string;
  condition?: {
    mode: 'expression' | 'entity' | 'intent' | 'state';
    expression?: string;
    entityName?: string;
    stateKey?: string;
    operator?: 'exists' | 'equals' | 'not_equals' | 'contains';
    value?: string;
  };
  debugRule?: 'always' | 'condition' | 'entity_collected' | 'retry_exhausted';
}

export interface FlowMetadata {
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
  version?: string;
  description?: string;
  [key: string]: any;
}

export interface FlowDefinition {
  id: string;
  name: string;
  isEntry?: boolean;
  nodes: FlowNode[];
  edges: FlowEdge[];
  metadata?: FlowMetadata;
}

export interface FlowAnnotation {
  id: string;
  index: number;
  targetType: 'page' | 'flow' | 'node' | 'edge' | 'panel' | 'toolbar';
  targetId: string;
  title: string;
  summary: string;
  details: string;
  status?: 'draft' | 'ready';
}

export interface FlowDebugScenario {
  id: string;
  name: string;
  initialState: Record<string, any>;
  mockInputs: string[];
  expectedPath?: string[];
  expectedExitType?: ExitNodeType;
  assertions?: Array<{
    type: 'state' | 'path' | 'exit';
    key?: string;
    operator?: 'equals' | 'contains' | 'exists';
    value?: any;
  }>;
}

export interface FlowVersion {
  id: string;
  flowId: string;
  version: string;
  flowData: FlowDefinition;
  createdAt: number;
  createdBy: string;
  description: string;
  isPublished: boolean;
  publishedAt?: number;
}

export interface FlowConfig {
  id: string;
  name: string;
  entryFlowId: string;
  flows: FlowDefinition[];
  functions?: FlowFunction[];
  annotations: FlowAnnotation[];
  debugScenarios: FlowDebugScenario[];
  versions?: FlowVersion[];
  metadata?: FlowMetadata;
}

// ==================== End PolyAI Flow Types ====================
