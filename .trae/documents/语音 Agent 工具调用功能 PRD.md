# 语音 Agent 工具调用功能 PRD

## 1. 产品概述

### 1.1 产品愿景
构建一个智能的语音 Agent 工具调用系统，使 AI 客服机器人能够在通话过程中**实时调用外部工具和 API**，实现查询、办理、通知等多种业务能力，打造真正的"边聊天边办事"的智能客服体验。

### 1.2 核心价值
- **并行工具调用**：同时执行多个工具，后台处理不阻塞对话
- **流式进度反馈**：实时播报查询进度，避免用户等待焦虑
- **自然对话体验**：支持打断、插话、进度询问
- **丰富工具生态**：内置多种常用工具，覆盖典型客服场景

### 1.3 目标场景
- 电商客服：订单查询、物流追踪、退换货处理
- 出行服务：行程查询、费用申诉、遗失物寻找
- 金融服务：余额查询、账单分期、信用卡办理
- 政务服务：业务办理进度、材料查询、预约服务

---

## 2. 功能需求

### 2.1 工具类型体系

#### 2.1.1 API 调用类工具
| 工具名称 | 函数名 | 用途 | 预期耗时 |
|---------|--------|------|---------|
| 查询订单 | `query_order` | 查询订单详情和状态 | 1-2 秒 |
| 创建工单 | `create_ticket` | 创建客服工单 | 0.5-1 秒 |
| 查询物流 | `query_logistics` | 查询物流轨迹 | 2-3 秒 |
| 加企业微信 | `add_wechat` | 添加用户企业微信 | 1-2 秒 |
| 查询用户信息 | `get_user_info` | 获取用户基本信息 | 0.5-1 秒 |
| 查询余额 | `check_balance` | 查询账户余额 | 0.5-1 秒 |

#### 2.1.2 通信类工具
| 工具名称 | 函数名 | 用途 | 预期耗时 |
|---------|--------|------|---------|
| 发送短信 | `send_sms` | 发送通知短信 | 1-2 秒 |
| 发送邮件 | `send_email` | 发送邮件通知 | 1-2 秒 |

#### 2.1.3 转接类工具
| 工具名称 | 函数名 | 用途 | 预期耗时 |
|---------|--------|------|---------|
| 转人工坐席 | `transfer_human` | 转接人工客服 | 即时 |
| 转外线电话 | `transfer_pstn` | 转接到外部电话 | 即时 |

### 2.2 工具配置功能

#### 2.2.1 工具定义
每个工具包含以下配置：
- **基本信息**：名称、描述、图标、分类
- **参数定义**：参数名、类型、是否必填、描述
- **执行策略**：等待音类型、背景音、超时时间
- **回复指引**：工具执行完成后的播报规范
- **错误处理**：重试次数、降级策略

#### 2.2.2 工具管理
- **添加工具**：支持手动配置和快速添加预设工具
- **编辑工具**：修改工具参数、执行策略
- **删除工具**：移除不需要的工具
- **工具测试**：手动输入参数测试工具执行

### 2.3 Agent 执行引擎

#### 2.3.1 核心能力
- **意图识别**：理解用户意图，判断是否需要调用工具
- **工具选择**：从可用工具中选择最合适的工具
- **参数提取**：从对话中提取工具调用所需的参数
- **并发控制**：管理多个工具的并发执行
- **进度追踪**：实时监控工具执行进度
- **结果处理**：解析工具返回结果，生成自然回复

#### 2.3.2 执行策略
- **并行执行**：支持同时执行多个独立工具
- **串行执行**：依赖关系的工具按顺序执行
- **超时控制**：单个工具执行超时自动终止
- **错误重试**：工具执行失败自动重试

---

## 3. 技术架构

### 3.1 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      用户通话层                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ASR (语音识别)                                       │   │
│  │  - 实时转写用户语音                                    │   │
│  │  - 置信度评估                                         │   │
│  │  - VAD (语音活动检测)                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    对话管理层                                │
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
│  │ API 调用  │  │ 短信发送 │  │ 转人工   │  │ 其他工具 │    │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    外部服务层                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────    │
│  │ 订单系统 │  │ 物流系统 │  │ 短信网关 │  │ CRM 系统  │    │
│  └──────────  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 核心流程

#### 3.2.1 工具调用主流程

```
1. 用户语音输入
   ↓
2. ASR 实时转写为文本
   ↓
3. LLM 分析用户意图
   - 判断是否需要调用工具
   - 选择合适的工具
   - 提取工具参数
   ↓
4. 检测到工具调用
   ↓
5. 立即生成等待回复（流式）
   - "好的，正在为您查询..."
   - 立即调用 TTS 播报
   ↓
6. 后台并行执行工具
   - 创建任务追踪对象
   - 并行调用多个 API
   - 实时更新任务进度
   ↓
7. 等待工具执行完成
   - 监控任务状态
   - 处理超时和错误
   - 收集执行结果
   ↓
8. 基于工具结果生成最终回复
   - LLM 解析工具返回
   - 生成自然语言回复
   - TTS 播报结果
   ↓
9. 对话继续或结束
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

### 3.3 数据结构设计

#### 3.3.1 工具定义

```typescript
interface AgentTool {
  // 基本信息
  id: string;
  name: string; // 函数名
  description: string; // 描述
  type: 'API' | 'SMS' | 'TRANSFER' | 'EMAIL' | 'CUSTOM';
  category: 'api_call' | 'communication' | 'transfer' | 'other';
  icon?: string; // 图标
  
  // 关联资源
  refId?: string; // API 配置 ID
  smsTemplateId?: string; // 短信模板 ID
  
  // 参数定义
  parameters: AgentToolParameter[];
  
  // 执行策略
  executionStrategy?: {
    playFiller: boolean;
    fillerType: 'TTS' | 'AUDIO';
    fillerContent: string;
    backgroundMusicId?: string;
    timeout?: number;
  };
  
  // 性能指标
  averageDuration?: number; // 平均执行时长（毫秒）
  supportsParallel?: boolean; // 是否支持并行
  
  // 回复指引
  responseInstruction?: string;
  
  // 错误处理
  errorHandling?: {
    retryCount: number;
    fallbackAction: 'transfer_human' | 'hangup' | 'goto_node';
    fallbackTargetId?: string;
  };
  
  // 测试配置
  testConfig?: {
    enabled: boolean;
    testParams: Record<string, any>;
  };
}
```

#### 3.3.2 任务追踪

```typescript
interface TaskInfo {
  id: string;
  toolName: string;
  status: 'pending' | 'preparing' | 'executing' | 'processing' | 'completed' | 'error';
  progress: number; // 0-100
  startTime: number;
  endTime?: number;
  estimatedDuration: number;
  result?: any;
  error?: string;
  conversationId: string;
}
```

#### 3.3.3 Agent 配置

```typescript
interface AgentConfig {
  tools: AgentTool[];
  generalFiller: {
    enabled: boolean;
    type: 'TTS' | 'AUDIO';
    content: string;
  };
  functionCallModel?: string;
  maxConcurrentTools?: number;
  progressReporting?: {
    enabled: boolean;
    intervalSeconds: number;
    autoReportOnQuery: boolean;
  };
}
```

### 3.4 API 接口设计

#### 3.4.1 工具调用接口

```typescript
// 工具调用请求
interface ToolCallRequest {
  conversationId: string;
  toolName: string;
  parameters: Record<string, any>;
  timestamp: number;
}

// 工具调用响应
interface ToolCallResponse {
  taskId: string;
  status: 'accepted' | 'processing' | 'completed' | 'error';
  progress?: number;
  result?: any;
  error?: string;
}

// 进度查询请求
interface ProgressQueryRequest {
  conversationId: string;
  taskIds: string[];
}

// 进度查询响应
interface ProgressQueryResponse {
  tasks: Array<{
    taskId: string;
    toolName: string;
    status: string;
    progress: number;
    result?: any;
  }>;
}
```

#### 3.4.2 工具执行接口

```typescript
// 通用工具执行接口
interface ToolExecutor {
  execute(params: ToolCallRequest): Promise<ToolCallResponse>;
  cancel(taskId: string): Promise<void>;
  getProgress(taskId: string): Promise<ProgressQueryResponse>;
}

// API 调用工具实现
class APIToolExecutor implements ToolExecutor {
  async execute(params: ToolCallRequest): Promise<ToolCallResponse> {
    // 1. 获取 API 配置
    const apiConfig = await getApiConfig(params.toolName);
    
    // 2. 构建请求
    const request = buildHttpRequest(apiConfig, params.parameters);
    
    // 3. 发送请求
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
    
    // 4. 解析响应
    const result = await parseResponse(response, apiConfig.responseMapping);
    
    // 5. 返回结果
    return {
      taskId: generateTaskId(),
      status: 'completed',
      progress: 100,
      result
    };
  }
}
```

---

## 4. 实现原理

### 4.1 LLM Function Calling 原理

#### 4.1.1 工具定义注入
将工具定义以 JSON Schema 格式注入到 LLM 的 System Prompt 中：

```json
{
  "tools": [
    {
      "name": "query_order",
      "description": "查询订单详情和状态",
      "parameters": {
        "type": "object",
        "properties": {
          "order_id": {
            "type": "string",
            "description": "订单编号"
          },
          "phone": {
            "type": "string",
            "description": "下单手机号"
          }
        },
        "required": ["order_id"]
      }
    }
  ]
}
```

#### 4.1.2 工具调用决策
LLM 分析用户输入后，输出包含工具调用信息的结构化响应：

```json
{
  "content": "好的，正在为您查询订单 123456 的物流信息",
  "tool_calls": [
    {
      "id": "call_1",
      "name": "query_order",
      "arguments": {
        "order_id": "123456"
      }
    }
  ]
}
```

#### 4.1.3 结果回填
将工具执行结果回填给 LLM，生成最终回复：

```json
{
  "role": "tool",
  "tool_call_id": "call_1",
  "content": "{\"order_id\":\"123456\",\"status\":\"已发货\",\"location\":\"杭州转运中心\"}"
}
```

### 4.2 并发控制原理

#### 4.2.1 任务队列管理
使用任务队列管理并发执行：

```typescript
class TaskManager {
  private activeTasks: Map<string, TaskInfo> = new Map();
  private maxConcurrent: number = 3;
  private queue: Array<() => Promise<void>> = [];
  
  async register(task: TaskInfo): Promise<void> {
    if (this.activeTasks.size >= this.maxConcurrent) {
      // 加入队列等待
      await this.enqueue(task);
    } else {
      // 立即执行
      this.execute(task);
    }
  }
  
  private async execute(task: TaskInfo): Promise<void> {
    this.activeTasks.set(task.id, task);
    try {
      await this.runTask(task);
    } finally {
      this.activeTasks.delete(task.id);
      this.processQueue();
    }
  }
}
```

#### 4.2.2 依赖关系处理
对于有依赖关系的工具，使用 DAG（有向无环图）管理执行顺序：

```typescript
interface TaskDependency {
  taskId: string;
  dependsOn: string[]; // 依赖的任务 ID
}

class DependencyResolver {
  resolveOrder(tasks: TaskDependency[]): TaskDependency[] {
    // 拓扑排序
    const sorted: TaskDependency[] = [];
    const visited: Set<string> = new Set();
    
    function visit(task: TaskDependency) {
      if (visited.has(task.taskId)) return;
      visited.add(task.taskId);
      
      // 先处理依赖
      task.dependsOn.forEach(depId => {
        const depTask = tasks.find(t => t.taskId === depId);
        if (depTask) visit(depTask);
      });
      
      sorted.push(task);
    }
    
    tasks.forEach(visit);
    return sorted;
  }
}
```

### 4.3 流式响应原理

#### 4.3.1 流式输出生成
使用 SSE (Server-Sent Events) 或 WebSocket 实现流式输出：

```typescript
async function* streamResponse(conversationId: string) {
  // 1. 立即输出等待回复
  yield {
    type: 'filler',
    content: '好的，正在为您查询...'
  };
  
  // 2. 后台执行工具
  const task = executeToolInBackground();
  
  // 3. 定期输出进度
  while (!task.isComplete()) {
    await sleep(2000);
    yield {
      type: 'progress',
      content: `查询进度 ${task.progress}%`
    };
  }
  
  // 4. 输出最终结果
  yield {
    type: 'result',
    content: task.result
  };
}
```

#### 4.3.2 TTS 流式合成
使用流式 TTS 减少延迟：

```typescript
async function streamTTS(text: AsyncIterable<string>) {
  const audioContext = new AudioContext();
  
  for await (const chunk of text) {
    // 合成音频
    const audio = await tts.synthesize(chunk);
    // 立即播放
    audioContext.play(audio);
  }
}
```

### 4.4 错误处理机制

#### 4.4.1 重试策略
使用指数退避算法进行重试：

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      // 指数退避：1s, 2s, 4s
      const delay = Math.pow(2, i) * 1000;
      await sleep(delay);
    }
  }
  
  throw lastError!;
}
```

#### 4.4.2 降级策略
工具执行失败时的降级处理：

```typescript
async function executeWithFallback(toolCall: ToolCall) {
  try {
    return await executeTool(toolCall);
  } catch (error) {
    const fallbackAction = toolCall.errorHandling?.fallbackAction;
    
    switch (fallbackAction) {
      case 'transfer_human':
        return await transferToHuman();
      case 'hangup':
        return await gracefulHangup();
      case 'goto_node':
        return await gotoFlowNode(toolCall.errorHandling!.fallbackTargetId!);
      default:
        throw error;
    }
  }
}
```

---

## 5. 性能优化

### 5.1 延迟优化

#### 5.1.1 预测性调用
基于对话上下文预测可能的工具调用：

```typescript
async function predictiveToolCall(context: ConversationContext) {
  // 分析对话模式
  const pattern = analyzePattern(context.history);
  
  // 预测下一步可能需要的工具
  const predictedTool = predictTool(pattern);
  
  if (predictedTool) {
    // 预加载数据
    const data = await prefetch(predictedTool);
    // 缓存结果
    cache.set(predictedTool.id, data);
  }
}
```

#### 5.1.2 结果缓存
缓存常用查询结果：

```typescript
class ResultCache {
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (item && item.expiry > Date.now()) {
      return item.data;
    }
    return null;
  }
  
  set(key: string, data: any, ttl: number = 60000) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }
}
```

### 5.2 并发优化

#### 5.2.1 批量执行
将多个独立工具调用批量执行：

```typescript
async function batchExecute(toolCalls: ToolCall[]) {
  // 分组：可以并行的工具
  const parallelGroups = groupByDependency(toolCalls);
  
  // 按组执行
  const results = [];
  for (const group of parallelGroups) {
    const groupResults = await Promise.all(
      group.map(tool => executeTool(tool))
    );
    results.push(...groupResults);
  }
  
  return results;
}
```

### 5.3 资源优化

#### 5.3.1 连接池管理
使用连接池复用 API 连接：

```typescript
class ConnectionPool {
  private pool: Array<Connection> = [];
  private maxConnections: number = 10;
  
  async acquire(): Promise<Connection> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    
    if (this.activeConnections < this.maxConnections) {
      return this.createConnection();
    }
    
    // 等待可用连接
    return this.waitForConnection();
  }
  
  release(conn: Connection) {
    this.pool.push(conn);
  }
}
```

---

## 6. 监控与日志

### 6.1 关键指标

| 指标 | 说明 | 目标值 |
|------|------|--------|
| 工具调用成功率 | 工具执行成功的比例 | > 95% |
| 平均响应时间 | 从用户提问到工具执行完成 | < 3 秒 |
| 并发工具数 | 同时执行的工具数量 | ≥ 3 个 |
| 进度播报准确率 | 进度信息与实际执行一致 | > 90% |
| 用户打断响应 | 检测到打断到暂停工具 | < 500ms |

### 6.2 日志记录

```typescript
interface ToolExecutionLog {
  conversationId: string;
  taskId: string;
  toolName: string;
  parameters: Record<string, any>;
  startTime: number;
  endTime?: number;
  status: 'success' | 'error' | 'timeout';
  result?: any;
  error?: string;
  progressHistory: Array<{
    timestamp: number;
    progress: number;
    status: string;
  }>;
}
```

### 6.3 告警机制

```typescript
class AlertManager {
  checkMetrics(metrics: Metrics) {
    // 成功率过低
    if (metrics.successRate < 0.9) {
      this.sendAlert('工具调用成功率低于 90%');
    }
    
    // 响应时间过长
    if (metrics.avgResponseTime > 5000) {
      this.sendAlert('平均响应时间超过 5 秒');
    }
    
    // 并发数过高
    if (metrics.concurrentTools > 10) {
      this.sendAlert('并发工具数超过 10 个');
    }
  }
}
```

---

## 7. 安全与合规

### 7.1 数据安全
- **参数脱敏**：敏感参数（手机号、身份证）加密传输
- **结果过滤**：过滤敏感信息再返回给用户
- **访问控制**：基于角色的工具访问权限

### 7.2 API 安全
- **认证鉴权**：所有 API 调用需要认证
- **限流控制**：防止 API 滥用
- **审计日志**：记录所有工具调用行为

### 7.3 合规要求
- **通话录音**：完整记录通话和工具调用过程
- **数据保留**：按法规要求保留日志
- **隐私保护**：遵守 GDPR 等隐私法规

---

## 8. 测试策略

### 8.1 单元测试
- 工具参数验证
- 进度追踪逻辑
- 错误处理机制

### 8.2 集成测试
- 端到端工具调用流程
- 并发工具执行
- 进度播报准确性

### 8.3 性能测试
- 高并发场景
- 长时通话场景
- 大量工具调用场景

### 8.4 异常测试
- API 超时
- 网络中断
- 参数错误

---

## 9. 部署方案

### 9.1 环境要求
- **Node.js**: >= 18.0
- **数据库**: PostgreSQL / MongoDB
- **缓存**: Redis
- **消息队列**: RabbitMQ / Kafka

### 9.2 容器化部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### 9.3 扩缩容策略
- **水平扩展**：基于 CPU 使用率自动扩缩容
- **负载均衡**：使用 Nginx 或云负载均衡器
- **数据库分片**：按 conversationId 分片

---

## 10. 演进规划

### 10.1 短期（1-2 个月）
- [ ] 完善工具类型（邮件、工单、预约）
- [ ] 优化工具配置 UI
- [ ] 添加工具市场

### 10.2 中期（3-6 个月）
- [ ] 支持自定义工具开发
- [ ] 工具编排可视化
- [ ] A/B 测试框架

### 10.3 长期（6-12 个月）
- [ ] 多 Agent 协作
- [ ] 工具自学习优化
- [ ] 跨平台工具集成

---

## 11. 附录

### 11.1 术语表
| 术语 | 解释 |
|------|------|
| Agent | 智能体，能够自主决策和执行任务的 AI 系统 |
| Function Calling | 函数调用，让大模型能够调用外部工具 |
| Parallel Execution | 并行执行，同时执行多个任务 |
| Progress Tracking | 进度追踪，实时监控任务执行状态 |
| Filler | 填充音，工具执行期间播放的等待提示 |

### 11.2 参考资料
- [Gemini Function Calling 文档](https://ai.google.dev/docs/function_calling)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [LangChain Tool Execution](https://python.langchain.com/docs/modules/agents/tools/)

---

**文档版本**: v1.0  
**创建日期**: 2026-03-18  
**最后更新**: 2026-03-18  
**作者**: AI Assistant  
**状态**: 待审核
