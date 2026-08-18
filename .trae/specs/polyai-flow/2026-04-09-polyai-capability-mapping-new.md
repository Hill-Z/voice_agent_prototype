# PolyAI 能力到产品映射表（重新设计）

更新时间：2026-04-09  
基于文档：PolyAI 语音 Agent 官方能力研究报告  
设计目标：将 PolyAI 五层能力架构映射到我们产品的具体功能模块

---

## 1. 映射设计原则

根据调研报告，PolyAI 的核心设计思想是：

1. **分层解耦**：Agent、Flow、Tools、Voice、Analytics 各层职责清晰
2. **语音优先**：Greeting、ASR、DTMF、Response Control 都是语音场景专属能力
3. **结构化控制**：Flow 不是"大 prompt 切片"，而是每步自包含的结构化编排
4. **QA 闭环**：Test Suite + Diagnosis + Dashboard 是上线必备

映射原则：
- 不把所有能力塞进 Flow 页
- 语音通道能力独立成模块
- 全局配置与 Flow 配置分离
- 调试与分析能力预留接口

---

## 2. 五层能力架构映射总览

| PolyAI 层级 | 核心职责 | 映射到我们产品 |
|-------------|----------|----------------|
| Agent 层 | 身份、角色、全局行为、规则 | 机器人配置 > 基础配置 + 策略配置 |
| Flow 层 | 多步对话、实体采集、状态推进 | 流程配置（FlowStudio） |
| Tools 层 | 可执行动作、外部系统调用 | 工具配置（独立页面） |
| Voice 层 | 语音模型、欢迎语、ASR、DTMF | 语音配置（待新增） |
| Analytics 层 | 测试、诊断、指标分析 | 调试配置 + 监控报表 |

---

## 3. Agent 层能力映射

### 3.1 Greeting（欢迎语）

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| Greeting | 首句直接进 TTS，不经过 LLM | 机器人配置 > 基础配置 > 欢迎语 | ✅ 已有 |
| 动态欢迎语 | 用 start function 返回 utterance 覆盖 | 工具配置 > Start Function | ⚠️ 待设计 |

**关键点**：欢迎语不是 Flow 第一个 step，是语音通道的硬编码首句。

### 3.2 Personality & Role（人格与角色）

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| Personality | 整体语气：friendly/professional/empathetic | 机器人配置 > 策略配置 > 人格设定 | ✅ 已有 |
| Role | 身份定义：booking agent/support/technical | 机器人配置 > 基础配置 > 角色描述 | ✅ 已有 |

### 3.3 Rules（全局规则）

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| 用词风格 | 全局约束 | 机器人配置 > 策略配置 > 系统提示词 | ✅ 已有 |
| 合规表述 | 风控规则 | 机器人配置 > 策略配置 | ⚠️ 待增强 |
| 边缘情况处理 | 静默、转人工、越权请求 | 机器人配置 > 策略配置 | ⚠️ 待增强 |

### 3.4 Behavior Prompt 组织方式

PolyAI 建议全局行为描述分段：

| 段落类型 | 内容 | 映射位置 |
|----------|------|----------|
| Task and context | 任务与上下文 | 系统提示词 > 任务描述 |
| Conversational style | 对话风格 | 系统提示词 > 风格设定 |
| Special case handling | 特殊情况处理 | 系统提示词 > 边缘处理 |
| Smalltalk | 闲聊应对 | 系统提示词 > 闲聊规则 |
| Silence handling | 静默处理 | 语音配置 > 静默超时 |
| Call transfer and deflection | 转人工与分流 | 系统提示词 + Flow Exit |
| Goodbye handling | 结束语 | 系统提示词 > 结束规则 |
| Backout behavior | 用户退出行为 | Flow > Exit 节点 |
| Dynamic information | 动态信息引用 | 变量配置 + 工具配置 |

---

## 4. Flow 层能力映射

### 4.1 Flow 入口机制

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| 从代码触发 | conv.goto_flow("Flow name") | 工具配置 > 函数代码 | ⚠️ 待设计 |
| 从 Knowledge/Topic 触发 | intent action 绑定 | 意图技能 > 触发动作 | ⚠️ 待增强 |
| 从另一个 flow 内跳转 | subflow/goto flow | Flow > 节点配置 | ⚠️ 待设计 |

### 4.2 节点类型映射

| PolyAI 节点类型 | 职责 | 映射到我们产品 | 当前状态 |
|------------------|------|----------------|----------|
| Start | 流程入口 | Flow > 开始节点 | ✅ 已有 |
| Default Step | 大多数结构化收集流程 | Flow > 步骤节点（默认） | ✅ 已有 |
| Function Step | API 调用、严格业务规则 | Flow > 步骤节点（函数类型） | ⚠️ 待设计 |
| Advanced Step | DTMF、per-step ASR、rich text references | Flow > 步骤节点（高级） | ⚠️ 待设计 |
| Exit Flow | 正常结束/Handoff/Stop | Flow > 结束节点 | ✅ 已有 |

### 4.3 Step Prompt 设计

| PolyAI 设计要点 | 映射位置 | 当前状态 |
|-----------------|----------|----------|
| step prompt 必须自包含 | Flow > 步骤节点 > 步骤提示词 | ✅ 已有 |
| LLM 看不到前一个 step 的 prompt | 提示词编辑器提示 | ⚠️ 待增强提示 |
| 一轮输出"文本"或"工具调用"二选一 | 步骤节点配置 | ⚠️ 待设计约束 |
| 回答短、口语化、适合语音 | 提示词模板建议 | ⚠️ 待增强 |
| 一轮不问多个问题 | 提示词模板建议 | ⚠️ 待增强 |

### 4.4 Edge 条件设计

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| Label | 短、唯一、对人可读 | Flow > 连线配置 > 标签 | ✅ 已有 |
| Description | 给 LLM 看的路由信号 | Flow > 连线配置 > 条件描述 | ⚠️ 待增强 |
| Required entities | 实体满足前不应触发 | Flow > 连线配置 > 前置实体 | ⚠️ 待设计 |
| Priority/fallback | 优先级与兜底 | Flow > 连线配置 > 优先级 | ⚠️ 待设计 |

**关键点**：label 给人看，description 给模型看。

### 4.5 Entity 实体采集

| PolyAI 实体类型 | 配置项 | 映射位置 | 当前状态 |
|-----------------|--------|----------|----------|
| Free text | 无限制 | Flow > 步骤节点 > 实体配置 | ⚠️ 待设计 |
| Number | 整数/小数、最小最大值 | Flow > 步骤节点 > 实体配置 | ⚠️ 待设计 |
| Alphanumeric | regex、zip/postal | Flow > 步骤节点 > 实体配置 | ⚠️ 待设计 |
| Phone number | 国家码限制 | Flow > 步骤节点 > 实体配置 | ⚠️ 待设计 |
| Date | day-first、日期范围 | Flow > 步骤节点 > 实体配置 | ⚠️ 待设计 |
| Time | 时间范围 | Flow > 步骤节点 > 实体配置 | ⚠️ 待设计 |
| Multiple choice | 选项枚举 | Flow > 步骤节点 > 实体配置 | ⚠️ 待设计 |
| Name | 姓名格式 | Flow > 步骤节点 > 实体配置 | ⚠️ 待设计 |
| Address | 地址格式 | Flow > 步骤节点 > 实体配置 | ⚠️ 待设计 |
| Email | 邮箱格式 | Flow > 步骤节点 > 实体配置 | ⚠️ 待设计 |

### 4.6 Retry 与 Fallback

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| No input 提示 | 用户没说话时的提示 | Flow > 步骤节点 > 重试配置 | ⚠️ 待设计 |
| No match 提示 | 识别失败时的提示 | Flow > 步骤节点 > 重试配置 | ⚠️ 待设计 |
| Max attempts | 最大重试次数 | Flow > 步骤节点 > 重试配置 | ⚠️ 待设计 |
| Fallback target | 重试失败后的目标节点 | Flow > 步骤节点 > 兜底分支 | ⚠️ 待设计 |
| Caller unable to provide | 用户无法提供时的处理 | Flow > 步骤节点 > 兜底分支 | ⚠️ 待设计 |

**关键点**：PolyAI 没有自动重试上限，必须由设计者自己提供 fallback path。

### 4.7 Transition Functions

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| Flow-scoped function | 绑定在特定 flow 内 | Flow > 函数库面板 | ✅ 已有 |
| 决定 step 怎么跳 | flow.goto_step() | 函数代码 | ⚠️ 待设计 |
| 命名原则 | 从"用户意图"命名 | 函数命名提示 | ⚠️ 待增强 |
| Flow Functions 总览 | 统一查看、搜索、重命名、删除 | Flow > 函数库面板 | ✅ 已有 |

### 4.8 Subflow 与 Exit Flow

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| goto_flow | 跳转到另一个 flow | Flow > 节点配置 > 跳转目标 | ⚠️ 待设计 |
| exit_flow | 当前 flow 结束 | Flow > 结束节点 | ✅ 已有 |
| Exit 类型 | finish/handoff/stop | Flow > 结束节点 > 退出类型 | ✅ 已有 |

---

## 5. Tools 层能力映射

### 5.1 Global Functions

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| Name | 函数名是语义信号 | 工具配置 > 函数名称 | ✅ 已有 |
| Description | 函数描述 | 工具配置 > 函数描述 | ✅ 已有 |
| LLM Parameters | 参数名、Context Description、类型 | 工具配置 > 参数配置 | ✅ 已有 |
| Python code | 函数代码 | 工具配置 > 代码编辑 | ⚠️ 待设计 |

### 5.2 Start Function

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| 每通会话开始前执行 | 在 greeting 之前 | 工具配置 > Start Function | ⚠️ 待设计 |
| 同步执行 | 慢了会影响首句 | 配置提示 | ⚠️ 待增强 |
| 初始化 state | 读 SIP headers、拉轻量 API | 函数代码 | ⚠️ 待设计 |
| 动态设置 variant/语言/voice | conv.set_variant() | 函数代码 | ⚠️ 待设计 |

**决策框架**：
- 首句前必须拿到的数据 → 放 start
- 快且稳定的 API → 可以放 start
- 慢/不稳定 API → 放 flow 第一个 step

### 5.3 End Function

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| 每次通话结束后执行 | 异步执行 | 工具配置 > End Function | ⚠️ 待设计 |
| 结构化通话总结 | CRM 更新、ticket 创建 | 函数代码 | ⚠️ 待设计 |
| disposition logging | 结果记录 | 函数代码 | ⚠️ 待设计 |
| follow-up workflow | 短信/邮件/任务后处理 | 函数代码 | ⚠️ 待设计 |

### 5.4 Delay Control

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| Filler phrases | 等待时说的话 | 工具配置 > Delay Control | ⚠️ 待设计 |
| 初始延时和间隔 | 配置参数 | 工具配置 > Delay Control | ⚠️ 待设计 |
| 只作用于具体 function | 不支持 start/end | 配置约束 | ⚠️ 待增强 |

### 5.5 Function Return Values

| PolyAI 返回字段 | 作用 | 映射位置 | 当前状态 |
|------------------|------|----------|----------|
| content | 给 LLM 的系统提示 | 函数返回值 | ⚠️ 待设计 |
| utterance | 直接对用户说的话 | 函数返回值 | ⚠️ 待设计 |
| handoff | 发起转接 | 函数返回值 | ⚠️ 待设计 |
| hangup | 结束会话 | 函数返回值 | ⚠️ 待设计 |
| listen | 配置下一轮 listen（ASR/DTMF/barge-in） | 函数返回值 | ⚠️ 待设计 |
| variant | 切换 variant | 函数返回值 | ⚠️ 待设计 |

### 5.6 Variables / State / Memory

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| conv.state | 会话内临时状态 | 变量配置 > 会话变量 | ✅ 已有 |
| conv.memory | 跨会话、按 caller identity 的记忆 | 变量配置 > 长期记忆 | ⚠️ 待设计 |
| Prompt templating | $variable_name 注入 | 提示词编辑器 | ✅ 已有 |

---

## 6. Voice 层能力映射

### 6.1 Voice Configuration

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| 语音通道使用的 LLM 模型 | Raven 系列推荐 | 语音配置 > LLM 模型 | ⚠️ 待新增 |
| Greeting | 首句 | 机器人配置 > 欢迎语 | ✅ 已有 |
| Disclaimer | 免责声明 | 语音配置 > 免责声明 | ⚠️ 待新增 |
| Silence timeout | 静默超时 | 语音配置 > 静默超时 | ⚠️ 待新增 |
| Max call duration | 最大通话时长 | 语音配置 > 最大时长 | ⚠️ 待新增 |
| End of call behavior | 结束行为 | 语音配置 > 结束行为 | ⚠️ 待新增 |

### 6.2 Agent Voice

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| 选 voice | 声音选择 | 语音配置 > 声音选择 | ⚠️ 待新增 |
| 调稳定度 | stability | 语音配置 > 声音参数 | ⚠️ 待新增 |
| 调清晰度/similarity | clarity/similarity | 语音配置 > 声音参数 | ⚠️ 待新增 |
| Disclaimer 可用独立 voice | 免责声明用不同声音 | 语音配置 > 免责声明声音 | ⚠️ 待新增 |

### 6.3 Speech Recognition（全局）

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| Keyphrase Boosting | ASR 更容易识别某些领域词 | 语音配置 > ASR 增强 > 关键词提升 | ⚠️ 待新增 |
| Boosting 强度 | Default/Boosted/Maximum | 语音配置 > ASR 增强 > 强度 | ⚠️ 待新增 |
| Transcript Corrections | ASR 出字后做 regex/string 修正 | 语音配置 > ASR 增强 > 文本修正 | ⚠️ 待新增 |

**区分**：
- 听错了 → 用 boosting
- 听到了但写错了 → 用 corrections

### 6.4 Per-step ASR Biasing

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| Dynamic biasing | 最高优先级 | 函数代码 > conv.set_asr_biasing() | ⚠️ 待设计 |
| Per-step biasing | step 级配置 | Flow > 步骤节点 > ASR 配置 | ⚠️ 待设计 |
| Global biasing | 全局配置 | 语音配置 > ASR 增强 | ⚠️ 待新增 |

**优先级**：Dynamic > Per-step > Global

### 6.5 DTMF

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| Number of digits expected | 预期按键数 | Flow > 步骤节点 > DTMF 配置 | ⚠️ 待设计 |
| First digit timeout | 首键超时 | Flow > 步骤节点 > DTMF 配置 | ⚠️ 待设计 |
| Inter-digit timeout | 按键间隔超时 | Flow > 步骤节点 > DTMF 配置 | ⚠️ 待设计 |
| End key | 结束键 | Flow > 步骤节点 > DTMF 配置 | ⚠️ 待设计 |
| Collect while speaking | 边说边收 | Flow > 步骤节点 > DTMF 配置 | ⚠️ 待设计 |
| Mark as PII | 标记为敏感信息 | Flow > 步骤节点 > DTMF 配置 | ⚠️ 待设计 |
| Speech + DTMF 双通道 | 用户可按键也可说 | Flow > 步骤节点 > 输入模式 | ⚠️ 待设计 |

**关键点**：DTMF 只在 Advanced Step 上完整提供。

### 6.6 Response Control

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| Stop keywords | 拦截或记录某些 agent 输出 | 语音配置 > 输出控制 > 禁用词 | ⚠️ 待新增 |
| Pronunciations | 调整具体词怎么发音 | 语音配置 > 输出控制 > 发音调整 | ⚠️ 待新增 |

**作用**：输出侧兜底、管品牌一致性、管风控。

---

## 7. Handoff 层能力映射

### 7.1 Call Handoffs 配置

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| 管目的地 | SIP URI / 电话号 | 转接配置 > 目的地 | ⚠️ 待新增 |
| 管 route | 路由规则 | 转接配置 > 路由 | ⚠️ 待新增 |

### 7.2 运行时触发

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| return dict 里的 handoff | 函数返回值触发 | 工具配置 > 函数返回值 | ⚠️ 待设计 |
| conv.call_handoff() | destination/reason/utterance/sip_headers | 函数代码 | ⚠️ 待设计 |
| SIP 控制 | REFER/INVITE/BYE | 函数代码 | ⚠️ 待设计 |

---

## 8. API Integrations 层能力映射

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| API 名称 | 定义名称 | API 配置 > API 名称 | ⚠️ 待新增 |
| 每个环境的 Base URL | 按环境切换 | API 配置 > 环境 URL | ⚠️ 待新增 |
| Auth | 认证配置 | API 配置 > 认证 | ⚠️ 待新增 |
| 多个 operations | 操作定义 | API 配置 > 操作 | ⚠️ 待新增 |
| conv.api.<api_name>.<operation_name>() | 运行时调用 | 函数代码 | ⚠️ 待设计 |

**优势**：base URL 按环境切换、auth 不写死在函数里、function 代码更薄。

---

## 9. Analytics 层能力映射

### 9.1 Conversation Review

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| Transcript | 对话文本 | 监控报表 > 通话详情 | ✅ 已有 |
| Metadata | 元数据 | 监控报表 > 通话详情 | ✅ 已有 |
| Matched topics | 匹配的意图 | 监控报表 > 通话详情 | ⚠️ 待增强 |
| Functions | 函数调用记录 | 监控报表 > 通话详情 | ⚠️ 待增强 |

### 9.2 Diagnosis

| PolyAI 诊断视图 | 内容 | 映射位置 | 当前状态 |
|------------------|------|----------|----------|
| Variables | 变量状态 | 调试配置 > 诊断面板 | ⚠️ 待设计 |
| Flows and steps | 流程与步骤 | 调试配置 > 诊断面板 | ⚠️ 待设计 |
| Function calls | 函数调用 | 调试配置 > 诊断面板 | ⚠️ 待设计 |
| LLM Request | LLM 请求详情 | 调试配置 > 诊断面板 | ⚠️ 待设计 |
| Topic citations | 意图引用 | 调试配置 > 诊断面板 | ⚠️ 待设计 |
| Transcript corrections | 文本修正记录 | 调试配置 > 诊断面板 | ⚠️ 待设计 |
| Turn latency | 轮次延迟 | 调试配置 > 诊断面板 | ⚠️ 待设计 |
| Latency breakdown | 延迟分解 | 调试配置 > 诊断面板 | ⚠️ 待设计 |
| Interruptions | 打断记录 | 调试配置 > 诊断面板 | ⚠️ 待设计 |
| Logs | 日志 | 调试配置 > 诊断面板 | ⚠️ 待设计 |
| Entities | 实体采集结果 | 调试配置 > 诊断面板 | ⚠️ 待设计 |

### 9.3 Test Suite

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| 从真实通话保存 Test Case | 场景保存 | 调试配置 > 测试用例 | ⚠️ 待设计 |
| 多个 Test Case 组成 Test Set | 批量回放 | 调试配置 > 测试集 | ⚠️ 待设计 |
| 可跑 Draft/Sandbox | 非生产环境验证 | 调试配置 > 环境 | ⚠️ 待设计 |
| 发布时自动跑 | 回归测试 | 发布流程 | ⚠️ 待设计 |

### 9.4 Dashboards

| PolyAI 指标 | 内容 | 映射位置 | 当前状态 |
|-------------|------|----------|----------|
| Containment rate | 自助完成率 | 监控报表 > 指标 | ⚠️ 待增强 |
| Total calls | 总通话数 | 监控报表 > 指标 | ✅ 已有 |
| Total automated minutes | 自动化分钟数 | 监控报表 > 指标 | ⚠️ 待增强 |
| Average call duration | 平均通话时长 | 监控报表 > 指标 | ✅ 已有 |

### 9.5 Agent Analysis

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| LLM 分类器 | 用 prompt + categories 批量打标签 | 监控报表 > 智能分析 | ⚠️ 待设计 |
| 转人工原因分类 | 归因分析 | 监控报表 > 智能分析 | ⚠️ 待设计 |
| 结果归因 | 成功/失败归类 | 监控报表 > 智能分析 | ⚠️ 待设计 |

### 9.6 CSAT

| PolyAI 能力 | 设计要点 | 映射位置 | 当前状态 |
|-------------|----------|----------|----------|
| Voice CSAT | 通话尾部评分流程 | 语音配置 > CSAT | ⚠️ 待设计 |
| SMS CSAT | 短信评分 | 语音配置 > CSAT | ⚠️ 待设计 |

---

## 10. Environments 层能力映射

| PolyAI 环境 | 职责 | 映射位置 | 当前状态 |
|-------------|------|----------|----------|
| Draft | 个人工作态 | 发布配置 > Draft | ⚠️ 待新增 |
| Sandbox | 开发测试 | 发布配置 > Sandbox | ⚠️ 待新增 |
| Pre-release | UAT/staging | 发布配置 > Pre-release | ⚠️ 待新增 |
| Live | 真实生产 | 发布配置 > Live | ⚠️ 待新增 |

**建议流程**：
- Sandbox 改、测、频繁发布
- Pre-release 做最终 review、回归测试
- Live 不要直接改
- 从 Pre-release promote 到 Live

---

## 11. 产品信息架构建议

基于以上映射，建议产品 IA 如下：

### 左侧菜单

```
├── 概览
├── 核心业务
│   ├── 智呼坐席管理
│   ├── 机器人配置
│   ├── 流程配置（Flow）
│   ├── 工具配置
│   ├── 客户画像
│   ├── 营销活动
├── 语音配置（新增）
│   ├── Voice 设置
│   ├── ASR 增强
│   ├── 输出控制
│   ├── 转接配置
├── API 配置（新增）
│   ├── API 管理
│   ├── 环境配置
├── 知识管理
│   ├── QA 问答对
│   ├── 意图技能
│   ├── 知识库文档
├── 监控分析
│   ├── 通话记录
│   ├── 监控报表
│   ├── 诊断面板
│   ├── 测试用例
├── 发布管理（新增）
│   ├── 环境管理
│   ├── 版本历史
```

### 机器人配置 Tab

```
├── 基础配置（Agent 层）
│   ├── 名称、角色、欢迎语
├── 策略配置（Rules 层）
│   ├── 系统提示词、人格设定、边缘处理
├── 变量配置（State 层）
│   ├── 会话变量、长期记忆
├── 流程配置（Flow 层）
│   ├── FlowStudio 编辑器
├── 调试配置（Analytics 层）
│   ├── 场景预演、诊断面板
```

---

## 12. 实施优先级建议

### P0 - 前端原型必须有

| 能力 | 映射位置 | 说明 |
|------|----------|------|
| Flow 编辑器 | 流程配置 | 已完成 |
| 节点配置抽屉 | Flow > 步骤节点 | 已完成 |
| Start/Step/Exit 节点 | Flow | 已完成 |
| 步骤提示词 | Flow > 步骤节点 | 已完成 |
| 工具绑定 | Flow > 步骤节点 | 已完成 |
| Transition Functions | Flow > 函数库 | 已完成 |
| Edge 条件配置 | Flow > 连线 | 待增强 |
| 实体采集配置 | Flow > 步骤节点 | 待设计 |
| Retry/Fallback 配置 | Flow > 步骤节点 | 待设计 |
| 调试场景预演 | Flow > 调试面板 | 已完成 |

### P1 - 为了更像 PolyAI 应继续补

| 能力 | 映射位置 | 说明 |
|------|----------|------|
| 语音配置页面 | 语音配置（新增） | 待新增 |
| ASR 增强（全局） | 语音配置 > ASR 增强 | 待新增 |
| 输出控制 | 语音配置 > 输出控制 | 待新增 |
| DTMF 配置 | Flow > 步骤节点 | 待设计 |
| Per-step ASR Biasing | Flow > 步骤节点 | 待设计 |
| Start/End Function | 工具配置 | 待设计 |
| API Registry | API 配置（新增） | 待新增 |
| Handoff 配置 | 转接配置（新增） | 待新增 |

### P2 - 如果未来做真执行

| 能力 | 映射位置 | 说明 |
|------|----------|------|
| Runtime Context | 运行时 | 数据模型设计 |
| Function Sandbox | 工具配置 | 代码执行环境 |
| Environment/Version | 发布管理 | 版本控制 |
| Conversation Trace | 监控分析 | 持久化存储 |
| Regression Test Set | 测试用例 | 自动化测试 |
| Diagnosis 数据结构 | 诊断面板 | 详细诊断视图 |

---

## 13. 关键设计要点总结

1. **Greeting 不经过 LLM** → 欢迎语是语音通道硬编码首句
2. **Flow 适用于多轮强顺序交互** → 不是 FAQ，不是大 prompt 切片
3. **Step prompt 必须自包含** → 前一步 prompt 不可见
4. **Default Step 是主力** → Function Step 是确定性补位，Advanced Step 是语音增强
5. **Edge label 给人看，description 给模型看** → 两种语义分离
6. **Retry 必须自己设计 fallback** → 平台不自动兜底
7. **DTMF 只在 Advanced Step 完整** → 不是普通表单字段
8. **Start function 要极快** → 慢 API 放 flow 第一步
9. **Diagnosis 是一等能力** → 不只是 transcript
10. **PolyAI 做的是整个平台** → 不是单个 Flow 画布

---

## 14. 下一步建议

1. 补充 Edge 条件配置（description、required entities、priority）
2. 设计实体采集配置面板
3. 设计 Retry/Fallback 配置
4. 新增语音配置页面（Voice、ASR、输出控制）
5. 设计 DTMF 和 Per-step ASR Biasing
6. 新增 API Registry 和 Handoff 配置页面
7. 增强 Diagnosis 面板数据结构