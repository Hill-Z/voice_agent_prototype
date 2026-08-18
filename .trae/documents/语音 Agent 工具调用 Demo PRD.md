# 语音 Agent 工具调用 Demo PRD

## 1. 文档概述

### 1.1 产品愿景
构建一个功能完善的语音 Agent Demo，展示大模型在语音通话场景中**边聊天边调用工具**的能力，实现真正的智能客服体验。

### 1.2 目标用户
- 企业客服部门负责人
- 技术决策者（CTO、技术总监）
- 产品经理和开发者
- 潜在企业客户（用于售前演示）

### 1.3 核心价值
- **并行工具调用**：同时调用多个 API，后台执行不阻塞对话
- **流式进度反馈**：实时播报查询进度，避免用户等待焦虑
- **自然对话体验**：支持打断、插话、进度询问
- **丰富工具生态**：内置多种常用工具，覆盖典型客服场景

---

## 2. 功能需求

### 2.1 工具类型规划

#### 2.1.1 API 调用类工具（6 个）

| 工具名称 | 函数名 | 用途 | 参数 | 预期耗时 |
|---------|--------|------|------|---------|
| 查询订单 | `query_order` | 查询订单详情和状态 | order_id, phone | 1-2 秒 |
| 创建工单 | `create_ticket` | 创建客服工单 | user_id, issue_type, description | 0.5-1 秒 |
| 查询物流 | `query_logistics` | 查询物流轨迹 | order_id | 2-3 秒 |
| 加企业微信 | `add_wechat` | 添加用户企业微信 | user_phone, employee_id | 1-2 秒 |
| 查询用户信息 | `get_user_info` | 获取用户基本信息 | user_id 或 phone | 0.5-1 秒 |
| 查询余额 | `check_balance` | 查询账户余额 | user_id | 0.5-1 秒 |

#### 2.1.2 通信类工具（3 个）

| 工具名称 | 函数名 | 用途 | 参数 | 预期耗时 |
|---------|--------|------|------|---------|
| 发送短信 | `send_sms` | 发送通知短信 | phone, template_id, params | 1-2 秒 |
| 转人工坐席 | `transfer_human` | 转接人工客服 | queue_id, priority | 即时 |
| 转外线电话 | `transfer_pstn` | 转接到外部电话 | phone_number | 即时 |

#### 2.1.3 扩展工具（预留）

- **发送邮箱**：`send_email`
- 查询知识库：**`search_knowledge`**
- 预约回呼：**`schedule_callback`**
- 评价工单：**`submit_rating`**

### 2.2 工具配置功能

#### 2.2.1 复用现有功能
基于当前的 `BotAgentConfig` 和 `AgentToolModal` 组件，进行以下增强：

1. **工具分类展示**：按工具类型分组显示（API 调用/通信/其他）
2. **快速添加预设工具**：提供常用工具模板，一键添加
3. **工具测试功能**：提供测试界面，可手动输入参数测试工具
4. **工具依赖关系**：可视化工具之间的依赖关系

#### 2.2.2 新增配置项

```typescript
interface EnhancedAgentTool {
  // 现有字段
  id: string;
  name: string;
  description: string;
  type: 'API' | 'SMS' | 'TRANSFER' | 'EMAIL' | 'CUSTOM';
  parameters: AgentToolParameter[];
  executionStrategy?: {
    playFiller: boolean;
    fillerType: 'TTS' | 'AUDIO';
    fillerContent: string;
  };
  
  // 新增字段
  category: 'api_call' | 'communication' | 'transfer' | 'other'; // 工具分类
  icon?: string; // 工具图标
  averageDuration?: number; // 平均执行时长（秒），用于进度估算
  supportsParallel?: boolean; // 是否支持并行执行
  testConfig?: { // 测试配置
    enabled: boolean;
    testParams: Record<string, any>;
  };
  errorHandling?: { // 错误处理策略
    retryCount: number;
    fallbackAction: 'transfer_human' | 'hangup' | 'goto_node';
    fallbackTargetId?: string;
  };
}
```

### 2.3 Demo 专用机器人配置

#### 2.3.1 新建 Demo 机器人

创建一个名为 **"智能客服演示机器人"** 的专用 Demo 机器人，配置如下：

```typescript
const DEMO_BOT_CONFIG: BotConfiguration = {
  id: 'bot_agent_demo',
  name: '智能客服演示机器人',
  description: '展示语音 Agent 边聊天边调用工具的强大能力',
  
  // 基础配置
  llmType: ModelType.GEMINI_PRO,
  temperature: 0.3,
  systemPrompt: `你是一名专业的智能客服助手，正在通过电话与用户交流。

【核心能力】
1. 你可以调用多种工具来帮助用户解决问题
2. 在调用工具时，要实时告知用户进度
3. 如果用户询问进度，要如实汇报当前状态
4. 工具执行完成后，要用友好的语气播报结果

【工具调用规范】
- 查询订单时，先确认订单号
- 创建工单前，要收集完整的问题描述
- 转人工前，先询问用户是否同意
- 发送短信前，确认手机号码

【对话风格】
- 专业、友好、耐心
- 语速适中，表达清晰
- 适当使用礼貌用语
- 遇到技术问题要道歉并提供替代方案

【进度播报示例】
- "正在为您查询，已发送请求到系统..."
- "查询进度 50%，已获取到订单信息，正在等待物流返回..."
- "还在处理中，目前已有 3 个任务在执行..."

【结果播报示例】
- "查询到了！您的订单已从上海发出，预计明天送达。"
- "工单已创建成功，工单号是 12345，我们会在处理完成后短信通知您。"
`,

  // 工具配置
  orchestrationType: 'AGENT',
  agentConfig: {
    tools: [
      // 预设 9 个工具（见 2.1 节）
    ],
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
  }
};
```

#### 2.3.2 预设工具列表

为 Demo 机器人预配置以下 9 个工具：

```javascript
const PRESET_TOOLS: AgentTool[] = [
  {
    id: 'tool_query_order',
    name: 'query_order',
    description: '查询订单详情和状态。当用户询问订单、购买记录、商品状态时使用。需要提供订单号或手机号。',
    type: 'API',
    category: 'api_call',
    icon: '📦',
    refId: 'api_query_order',
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
    refId: 'api_create_ticket',
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
    refId: 'api_query_logistics',
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
    refId: 'api_add_wechat',
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
    refId: 'api_get_user_info',
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
    refId: 'api_check_balance',
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
      fillerContent: 'hold_music.mp3' // 播放等待音乐
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
```

---

## 3. 技术实现方案

### 3.1 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      前端展示层                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  BotAgentConfig 组件（增强版）                        │   │
│  │  - 工具分类展示                                       │   │
│  │  - 快速添加工具模板                                   │   │
│  │  - 工具测试界面                                       │   │
│  │  - 执行日志查看                                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Agent 执行引擎                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  LLM + Function Calling                              │   │
│  │  - 理解用户意图                                       │   │
│  │  - 决策是否调用工具                                   │   │
│  │  - 提取工具参数                                       │   │
│  │  - 生成回复话术                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                  │
│                            ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  工具调度器 (Tool Orchestrator)                      │   │
│  │  - 并行任务管理                                       │   │
│  │  - 进度追踪                                           │   │
│  │  - 错误处理和重试                                     │   │
│  │  - 超时控制                                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    工具执行层                                │
│  ┌──────────┐  ┌──────────  ┌──────────┐  ┌──────────┐    │
│  │ API 调用  │  │ 短信发送  │  │ 转人工   │  │ 其他工具 │    │
│  └──────────┘  └──────────┘  └──────────  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 核心流程

#### 3.2.1 工具调用主流程

```typescript
async function handleToolExecution(userText: string, conversationId: string) {
  // 1. LLM 分析用户意图，决定是否调用工具
  const llmResponse = await llm.chat({
    messages: conversationHistory,
    tools: registeredTools,
    tool_choice: 'auto'
  });
  
  // 2. 检测到工具调用
  if (llmResponse.tool_calls.length > 0) {
    const toolCalls = llmResponse.tool_calls;
    
    // 3. 立即生成等待回复（流式）
    const fillerMessage = generateFillerMessage(toolCalls);
    await tts.speak(fillerMessage);
    
    // 4. 后台并行执行工具
    const taskPromises = toolCalls.map(async (toolCall) => {
      return executeToolWithProgress(toolCall, conversationId);
    });
    
    // 5. 等待所有工具执行完成
    const results = await Promise.all(taskPromises);
    
    // 6. 基于工具结果生成最终回复
    const finalResponse = await llm.generateFinalResponse(results);
    await tts.speak(finalResponse);
  } else {
    // 无需调用工具，直接回复
    await tts.speak(llmResponse.text);
  }
}
```

#### 3.2.2 带进度追踪的工具执行

```typescript
async function executeToolWithProgress(toolCall: ToolCall, conversationId: string) {
  const taskId = generateTaskId();
  
  // 创建任务追踪对象
  const task: TaskInfo = {
    id: taskId,
    toolName: toolCall.name,
    status: 'pending',
    progress: 0,
    startTime: Date.now(),
    estimatedDuration: getToolAverageDuration(toolCall.name)
  };
  
  // 注册到任务管理器
  taskManager.register(task);
  
  try {
    // 阶段 1: 准备请求
    task.status = 'preparing';
    task.progress = 10;
    taskManager.update(task);
    
    // 阶段 2: 调用 API
    task.status = 'executing';
    task.progress = 30;
    taskManager.update(task);
    
    const result = await callToolAPI(toolCall);
    
    // 阶段 3: 处理响应
    task.status = 'processing';
    task.progress = 70;
    taskManager.update(task);
    
    const processedResult = await processToolResult(result);
    
    // 阶段 4: 完成
    task.status = 'completed';
    task.progress = 100;
    task.endTime = Date.now();
    taskManager.update(task);
    
    return processedResult;
    
  } catch (error) {
    task.status = 'error';
    task.error = error.message;
    taskManager.update(task);
    throw error;
  }
}
```

#### 3.2.3 进度查询处理

```typescript
async function handleProgressQuery(userText: string, conversationId: string) {
  // 检测用户是否在询问进度
  if (isProgressQuery(userText)) {
    // 获取当前所有执行中的任务
    const activeTasks = taskManager.getActiveTasks(conversationId);
    
    if (activeTasks.length === 0) {
      await tts.speak('当前没有正在处理的任务。');
      return;
    }
    
    // 生成进度报告
    const progressReport = activeTasks.map(task => {
      return `${task.toolName}: ${task.status} (${task.progress}%)`;
    }).join('，');
    
    const response = `还在为您处理中，${progressReport}`;
    await tts.speak(response);
  }
}
```

### 3.3 前端组件增强

#### 3.3.1 工具分类展示

```typescript
function EnhancedBotAgentConfig({ config, updateField, extractionConfigs }: Props) {
  // 按分类分组工具
  const groupedTools = useMemo(() => {
    const groups: Record<string, AgentTool[]> = {
      api_call: [],
      communication: [],
      transfer: [],
      other: []
    };
    
    agentConfig.tools.forEach(tool => {
      const category = tool.category || 'other';
      if (groups[category]) {
        groups[category].push(tool);
      }
    });
    
    return groups;
  }, [agentConfig.tools]);
  
  return (
    <div>
      {/* 工具分类展示 */}
      {Object.entries(groupedTools).map(([category, tools]) => (
        <ToolCategorySection 
          key={category}
          category={category}
          tools={tools}
          onAddTool={() => openToolModal(category)}
          onEditTool={(tool) => openToolModal(undefined, tool)}
          onDeleteTool={handleDeleteTool}
        />
      ))}
      
      {/* 快速添加工具 */}
      <QuickAddToolPanel onAddTool={handleQuickAddTool} />
    </div>
  );
}
```

#### 3.3.2 快速添加工具面板

```typescript
function QuickAddToolPanel({ onAddTool }: { onAddTool: (preset: string) => void }) {
  const presetTools = [
    { id: 'query_order', name: '查询订单', icon: '📦', description: '查询订单详情和物流状态' },
    { id: 'create_ticket', name: '创建工单', icon: '📝', description: '创建客服工单' },
    { id: 'send_sms', name: '发送短信', icon: '📱', description: '发送通知短信' },
    { id: 'transfer_human', name: '转人工', icon: '🎧', description: '转接人工坐席' },
    { id: 'query_logistics', name: '查询物流', icon: '🚚', description: '查询物流轨迹' },
    { id: 'add_wechat', name: '加企业微信', icon: '💬', description: '添加用户企业微信' }
  ];
  
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
      <h3 className="text-sm font-bold text-indigo-900 mb-4 flex items-center">
        <Zap size={16} className="mr-2" />
        快速添加工具
      </h3>
      
      <div className="grid grid-cols-3 gap-3">
        {presetTools.map(preset => (
          <button
            key={preset.id}
            onClick={() => onAddTool(preset.id)}
            className="bg-white hover:bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-left transition-all group"
          >
            <div className="text-2xl mb-2">{preset.icon}</div>
            <div className="text-xs font-bold text-slate-700">{preset.name}</div>
            <div className="text-[10px] text-slate-400 mt-1">{preset.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

#### 3.3.3 工具测试界面

```typescript
function ToolTestModal({ tool, onClose }: { tool: AgentTool; onClose: () => void }) {
  const [testParams, setTestParams] = useState<Record<string, any>>({});
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  
  const handleTest = async () => {
    setIsTesting(true);
    try {
      const result = await testToolExecution(tool, testParams);
      setTestResult(result);
    } catch (error) {
      setTestResult({ error: error.message });
    } finally {
      setIsTesting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-800">测试工具：{tool.name}</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {/* 参数输入区 */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-slate-700 mb-4">输入参数</h4>
            {tool.parameters.map(param => (
              <div key={param.name} className="mb-4">
                <Label label={param.name} required={param.required} />
                <Input
                  placeholder={param.description}
                  value={testParams[param.name] || ''}
                  onChange={(e) => setTestParams({
                    ...testParams,
                    [param.name]: e.target.value
                  })}
                />
              </div>
            ))}
          </div>
          
          {/* 测试结果 */}
          {testResult && (
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-4">测试结果</h4>
              <pre className="bg-slate-50 p-4 rounded-lg text-xs font-mono overflow-auto max-h-64">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded">取消</button>
          <button 
            onClick={handleTest} 
            disabled={isTesting}
            className="px-4 py-2 bg-primary text-white rounded"
          >
            {isTesting ? '测试中...' : '开始测试'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 3.4 Mock API 实现

为了 Demo 能够独立运行，需要实现 Mock API 服务：

```typescript
// services/mockApiService.ts

const MOCK_DELAY = {
  query_order: 2000,
  create_ticket: 1000,
  query_logistics: 3000,
  add_wechat: 2000,
  get_user_info: 1000,
  check_balance: 1000,
  send_sms: 2000
};

const MOCK_DATA = {
  orders: {
    '123456': {
      order_id: '123456',
      status: '已发货',
      product_name: 'iPhone 15 Pro',
      order_time: '2026-03-15 14:30',
      logistics_status: '运输中',
      current_location: '杭州转运中心',
      estimated_delivery: '2026-03-18'
    }
  },
  
  users: {
    'user_001': {
      user_id: 'user_001',
      name: '张三',
      phone: '138****1234',
      level: 'VIP 会员',
      register_time: '2025-01-15',
      total_orders: 28,
      balance: 520.50
    }
  }
};

export async function mockApiCall(toolName: string, params: any) {
  // 模拟网络延迟
  await delay(MOCK_DELAY[toolName] || 1000);
  
  // 根据工具名返回 mock 数据
  switch (toolName) {
    case 'query_order':
      return MOCK_DATA.orders[params.order_id] || { error: '订单不存在' };
    
    case 'get_user_info':
      return MOCK_DATA.users[params.user_id] || { error: '用户不存在' };
    
    case 'create_ticket':
      return {
        ticket_id: `T${Date.now()}`,
        status: '已创建',
        created_at: new Date().toISOString(),
        estimated_resolve: '24 小时内'
      };
    
    case 'query_logistics':
      return {
        order_id: params.order_id,
        tracking_number: 'SF1234567890',
        current_status: '运输中',
        current_location: '杭州转运中心',
        estimated_delivery: '2026-03-18',
        history: [
          { time: '2026-03-15 14:30', status: '已签收' },
          { time: '2026-03-15 10:00', status: '上海浦东仓库已发出' },
          { time: '2026-03-14 18:00', status: '已打包' }
        ]
      };
    
    case 'send_sms':
      return {
        success: true,
        message_id: `SMS_${Date.now()}`,
        sent_at: new Date().toISOString()
      };
    
    default:
      return { success: true, message: 'Mock 执行成功' };
  }
}
```

---

## 4. 预期效果

### 4.1 功能指标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 工具调用成功率 | > 95% | Mock 环境下应达到 100% |
| 平均响应时间 | < 3 秒 | 从用户提问到工具执行完成 |
| 并行工具支持 | ≥ 3 个 | 同时执行 3 个工具不阻塞 |
| 进度播报准确率 | > 90% | 进度信息与实际执行一致 |
| 用户打断响应 | < 500ms | 检测到打断到暂停工具 |

### 4.2 演示场景

#### 场景 1：查询订单 + 发送短信

```
用户："帮我查一下订单 12345 的物流"
  ↓
Agent: "好的，正在为您查询订单 12345 的物流信息，请稍等..." (0.5 秒)
  ↓
[后台] 调用 query_order API (2 秒)
  ↓
Agent: "查询到了！您的订单已从上海浦东仓库发出，目前到达杭州转运中心，预计明天送达。需要给您发送物流短信吗？"
  ↓
用户："好的，发一个吧"
  ↓
Agent: "好的，正在发送短信到您手机 138****1234..." (1 秒)
  ↓
[后台] 调用 send_sms API
  ↓
Agent: "短信已发送，请注意查收！包含订单号和物流轨迹。"
```

#### 场景 2：并行执行多个任务

```
用户："我要查订单 12345，再查一下我的余额，然后创建个工单"
  ↓
Agent: "好的，正在为您同时处理三个任务：查询订单、查询余额和创建工单，请稍等..." (0.5 秒)
  ↓
[后台并行执行]
  - query_order (2 秒)
  - check_balance (1 秒)
  - 等待工单信息收集
  ↓
Agent: "订单查询完成！已从上海发出。余额查询完成！您的可用余额是 520.5 元。"
  ↓
Agent: "请问您需要创建什么类型的工单？是投诉、建议还是其他问题？"
  ↓
用户："投诉，司机态度不好"
  ↓
Agent: "好的，正在为您创建投诉工单..." (1 秒)
  ↓
Agent: "工单已创建成功！工单号是 T1234567890，我们将在 24 小时内处理并短信通知您。"
```

#### 场景 3：进度询问

```
用户："帮我查一下订单 12345 的物流，再加个企业微信"
  ↓
Agent: "好的，正在为您查询物流并添加企业微信，请稍等..."
  ↓
[后台执行中，物流查询较慢]
  ↓
用户 (等待 3 秒后)："进度怎么样了？"
  ↓
Agent: "还在为您处理中，企业微信已添加成功，物流查询进度 60%，正在等待物流公司返回最新轨迹..."
  ↓
[物流查询完成]
  ↓
Agent: "都处理完成了！企业微信已发送好友申请，请留意通过。物流方面，您的订单已从上海发出，预计明天送达。"
```

### 4.3 UI 展示效果

#### 工具配置页面
- 清晰的工具分类展示
- 每个工具显示：图标、名称、类型标签、参数预览、执行策略
- 快速添加工具面板，提供 6 个预设工具
- 支持工具测试，可手动输入参数测试执行

#### 调试页面（可选增强）
- 实时显示当前执行中的任务
- 每个任务显示：进度条、当前状态、已执行时长
- 支持查看任务详细日志
- 支持手动取消任务

---

## 5. 实施计划

### 5.1 第一阶段：基础功能（1-2 周）

**目标**：完成工具配置页面增强和 Mock API 实现

**任务**：
1. ✅ 增强 `BotAgentConfig` 组件，支持工具分类展示
2. ✅ 实现 `QuickAddToolPanel` 组件，提供快速添加工具
3. ✅ 创建 9 个预设工具配置模板
4. ✅ 实现 `mockApiService`，提供 Mock API 调用
5. ✅ 创建 Demo 机器人配置
6. ✅ 编写完整的 System Prompt

**交付物**：
- 增强的工具配置页面
- 9 个预设工具
- Mock API 服务
- Demo 机器人

### 5.2 第二阶段：执行引擎（2-3 周）

**目标**：实现并行工具调用和进度追踪

**任务**：
1. ✅ 实现 `ToolOrchestrator`（工具调度器）
2. ✅ 实现 `TaskManager`（任务管理器）
3. ✅ 实现带进度追踪的工具执行
4. ✅ 实现进度查询处理
5. ✅ 实现错误处理和重试机制
6. ✅ 添加执行日志记录

**交付物**：
- 完整的工具执行引擎
- 并行任务管理
- 进度追踪系统
- 错误处理机制

### 5.3 第三阶段：体验优化（1-2 周）

**目标**：优化用户体验和对话流畅度

**任务**：
1. ✅ 实现流式响应和即时播报
2. ✅ 优化等待音和背景音乐
3. ✅ 实现智能打断处理
4. ✅ 添加工具测试界面
5. ✅ 优化进度播报话术
6. ✅ 添加执行可视化（进度条、状态指示器）

**交付物**：
- 流畅的对话体验
- 工具测试功能
- 执行可视化
- 优化的播报话术

### 5.4 第四阶段：测试和文档（1 周）

**目标**：完成测试和文档编写

**任务**：
1. ✅ 编写单元测试
2. ✅ 编写集成测试
3. ✅ 编写用户手册
4. ✅ 录制演示视频
5. ✅ 收集反馈并优化

**交付物**：
- 完整的测试用例
- 用户手册
- 演示视频
- 优化建议文档

---

## 6. 风险和挑战

### 6.1 技术风险

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| 大模型 Function Calling 不稳定 | 高 | 使用成熟的 Gemini/GPT-4，添加重试机制 |
| 并行任务管理复杂 | 中 | 使用成熟的任务队列库，如 Bull、Agenda |
| 实时进度追踪延迟 | 中 | 使用 WebSocket 或 SSE 推送进度 |
| 错误处理不完善 | 中 | 设计完善的降级策略和 fallback 机制 |

### 6.2 产品风险

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| 工具配置过于复杂 | 高 | 提供预设模板，简化配置流程 |
| 演示效果不直观 | 中 | 添加工具执行可视化，实时显示进度 |
| 用户理解成本高 | 中 | 提供详细的使用说明和示例 |

---

## 7. 成功标准

### 7.1 功能完整性
- ✅ 支持 9 种以上工具类型
- ✅ 支持并行执行 3 个工具
- ✅ 支持进度追踪和播报
- ✅ 支持工具测试功能

### 7.2 用户体验
- ✅ 工具配置时间 < 5 分钟
- ✅ 对话响应时间 < 3 秒
- ✅ 进度播报准确率 > 90%
- ✅ 用户打断响应 < 500ms

### 7.3 演示效果
- ✅ 能够完整演示 3 个典型场景
- ✅ 工具调用成功率 > 95%
- ✅ 无明显技术故障
- ✅ 获得目标用户认可

---

## 8. 附录

### 8.1 术语表

| 术语 | 解释 |
|------|------|
| Agent | 智能体，能够自主决策和执行任务的 AI 系统 |
| Function Calling | 函数调用，让大模型能够调用外部工具 |
| Parallel Execution | 并行执行，同时执行多个任务 |
| Progress Tracking | 进度追踪，实时监控任务执行状态 |
| Filler | 填充音，工具执行期间播放的等待提示 |

### 8.2 参考资料

- [Gemini Function Calling 文档](https://ai.google.dev/docs/function_calling)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [LangChain Tool Execution](https://python.langchain.com/docs/modules/agents/tools/)
- [OpenCLAW 开源项目](https://github.com/OpenClaw/openclaw)

### 8.3 相关文件

- [PRD_AI_Prompt_Generator.md](./PRD_AI_Prompt_Generator.md) - AI 提示词生成器 PRD
- [调试功能增强计划.md](./Dify 风格调试功能增强计划.md) - 调试功能增强计划

---

**文档版本**: v1.0  
**创建日期**: 2026-03-18  
**最后更新**: 2026-03-18  
**作者**: AI Assistant  
**审核状态**: 待审核
