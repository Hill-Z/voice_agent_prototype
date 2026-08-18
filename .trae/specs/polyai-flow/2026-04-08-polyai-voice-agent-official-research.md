# PolyAI 语音 Agent 官方能力研究报告

更新时间：2026-04-08  
研究范围：仅基于 PolyAI 官方文档与官方 Release Notes 整理  
适用目标：为本项目的语音机器人产品设计 `Flow / Agent Studio / 调试 / 配置页` 提供一手参考

---

## 1. 这份报告回答什么

这份报告重点回答四件事：

1. PolyAI 在语音 agent 场景下，整体产品是怎么分层设计的。
2. PolyAI 的 Flow 到底负责什么，不负责什么。
3. 每个关键能力在官方体系里是怎么设计、怎么配置、怎么使用的。
4. 如果我们要在自己的语音机器人产品里做一个“像 PolyAI 一样”的完整前端原型，哪些能力是核心，哪些是增强项。

这不是对官方文档的逐页翻译，而是对官方设计思想、产品结构和运行机制的工程化归纳。

---

## 2. 先说结论

PolyAI 的语音 agent 不是“一个 prompt + 一堆函数”的产品，而是一个完整的语音对话操作系统。它把能力拆成了五层：

1. `Agent` 层：定义身份、角色、全局行为、规则。
2. `Flow` 层：定义多步对话、实体采集、状态推进、分支和退出。
3. `Tools / Functions / APIs` 层：定义可执行动作、外部系统调用和确定性逻辑。
4. `Voice / Speech / Response Control` 层：定义语音模型、欢迎语、免责声明、ASR、DTMF、发音和输出拦截。
5. `Analytics / Test / Review / Environments` 层：定义回归测试、单通话诊断、指标分析和环境发布。

从官方设计看，PolyAI 在语音场景最核心的思想不是“让模型自由发挥”，而是：

- 欢迎语和通道行为要硬控制。
- 结构化交互要用 Flow，不要靠大 prompt 让模型自己编排。
- 业务动作要用函数和 API，不要让模型“脑补执行”。
- 输出和识别要分别治理：识别用 ASR / biasing / transcript corrections，输出用 response control / pronunciations。
- 上线前后必须有 Test Suite、Conversation Review、Diagnosis、Dashboard 这一整套 QA 闭环。

这也是为什么 PolyAI 在语音 agent 场景下的产品并不是单页式配置，而是 `Build / Channels / Configure / Deployments / Analytics` 的完整 IA。

---

## 3. PolyAI 的整体产品结构

根据官方的 Agent Studio 导航与近两次版本演进，当前 PolyAI 的主结构已经非常明确：

- `Analytics`
  - Conversations
  - Diagnosis
  - Dashboards
  - Test Suite
  - Agent Analysis
  - Smart Analyst
- `Build`
  - Agent
  - Knowledge
  - Flows
  - Tools
  - SMS
  - Call handoffs
  - Variant management
- `Channels`
  - Voice
  - Response control
  - Audio management
  - Speech recognition
  - Chat / Widget
- `Configure`
  - APIs
  - General
  - Numbers
  - Metrics
  - Dashboards
  - CSAT
- `Deployments`
  - Environments
  - Project history

这说明 PolyAI 已经明确把“构建对话逻辑”和“构建语音通道行为”拆开了。  
2026 年 2 月官方 release 还专门强调了 `Channels` 重构，把 Voice / Chat / Widget 单独拎出来，这对我们很重要：  
对于语音 agent，`Flow` 不是唯一主角，语音通道层本身就是一个一等公民。

对我们产品的启发：

- 不能把 Flow 设计成“全部能力的唯一入口”。
- 语音模型、欢迎语、免责声明、ASR、DTMF、call handling，应该是 `Voice/Channel` 域能力。
- Flow 页只负责“结构化多步对话”。

---

## 4. PolyAI 语音 Agent 的运行链路

官方 `Conversation flow` 文档给出了 PolyAI 语音 agent 的处理顺序，核心机制如下：

1. 用户发起语音输入。
2. 音频先经过 ASR。
3. ASR 结果会经过后处理，例如 transcript corrections。
4. 系统检索知识库（RAG / retrieval）。
5. 系统构造 LLM prompt。
6. LLM 产生文本或函数调用。
7. 如有函数调用，函数执行结果再回流给 LLM。
8. 输出在说出来之前，还可能被 response controls 拦截或修正。
9. 最终文本送入 TTS 输出。

但有一个例外非常关键：

- `Greeting` 不经过 LLM，也不经过 Rules。
- Greeting 直接送进 TTS。

这意味着：

- 欢迎语必须被看成“语音通道的硬编码首句”，不是普通的 agent 回复。
- 如果欢迎语需要动态化，不能依赖普通 behavior prompt，而要用 `start function` 返回 `utterance` 去覆盖。

对我们产品的启发：

- 语音配置里必须单列 `欢迎语 / Disclaimer / 首轮 listen`。
- 不要把欢迎语误建模成 Flow 第一个 step。
- Flow 是“从第二轮逻辑开始”最自然；若要做“首轮强流程”，也要清楚它和欢迎语是两个机制。

---

## 5. Agent 层：PolyAI 如何定义一个语音 agent

### 5.1 Agent 页负责什么

官方 `Build > Agent` 负责三类全局人格与行为配置：

- `Greeting`
- `Personality`
- `Role`

其中：

- `Greeting` 是首句，直接进 TTS，不走 LLM。
- `Personality` 决定整体语气，例如 friendly / professional / empathetic。
- `Role` 决定 agent 的身份，例如 booking agent / customer support / technical support。

官方还给了一个很重要的行为 prompt 组织方式，建议全局行为描述分成这些段落：

- Task and context
- Conversational style
- Special case handling
- Smalltalk
- Silence handling
- Call transfer and deflection
- Goodbye handling
- Backout behavior
- Dynamic information

其中几个关键原则很值得抄：

- 一轮里输出“文本”或“工具调用”二选一，不要同时做。
- 回答要短、口语化，适合语音。
- 一轮不要问多个问题。
- 电话号码这类内容要按口语读法输出。
- 对静默、转人工、越权请求、ASR 听错等边缘情况，要在全局规则里有统一处置。

### 5.2 Rules 在 PolyAI 里的作用

官方把 Rules 视作全局约束：

- 用词风格
- 合规表述
- 边缘情况处理
- 术语和读法约束

也就是说：

- Agent = 身份与风格
- Rules = 全局硬性行为约束
- Flow = 结构化多轮编排

对我们产品的启发：

- Flow 页不该吞掉全局规则能力。
- 应保留全局 `Agent / Rules / Voice` 配置域，Flow 只是其下一个 orchestration 能力。

---

## 6. Voice / Channel 层：PolyAI 如何做语音专属配置

### 6.1 Voice Configuration

官方 `Channels > Voice > Voice configuration` 负责：

- 语音通道使用的 LLM 模型
- Greeting
- Disclaimer
- 通话处理参数

其中通话处理参数包括：

- `Silence timeout`
- `Max call duration`
- `End of call behavior`

PolyAI 官方当前明确推荐 Raven 系列做 voice，对语音场景强调：

- 更自然
- 更短更口语
- 更低延迟
- 自带安全和 auto-reasoning

### 6.2 Agent Voice

官方把声音本身独立成 `Agent Voice`：

- 选 voice
- 调稳定度
- 调清晰度 / similarity
- Disclaimer 可用独立 voice

这说明在 PolyAI 里：

- 说什么：Agent / Rules / Flow / Functions 决定
- 怎么说：Voice configuration + Agent voice 决定

### 6.3 Response Control

官方 `Channels > Response control` 不是处理用户说什么，而是处理 agent 说什么。  
它主要解决：

- 不该说的词
- 风险词
- 竞品词
- 多余 preamble
- 不正确发音

Response Control 的两个核心子能力：

- `Stop keywords`
  - 拦截或记录某些 agent 输出
- `Pronunciations`
  - 调整具体词怎么发音

这套机制本质上是“输出后置治理层”。

它的作用不是补强 Flow 逻辑，而是：

- 在输出侧兜底
- 管品牌一致性
- 管风控

对我们产品的启发：

- 将来如果要更像 PolyAI，应该有一个独立于 Flow 的“输出控制”模块。
- Flow 只决定流程路线，不负责最终语音输出治理。

---

## 7. Speech Recognition 层：PolyAI 如何做语音识别治理

PolyAI 官方把语音识别能力拆成三层。

### 7.1 全局 ASR：Speech Recognition 页

官方 `Channels > Voice > Speech recognition` 提供两类核心能力：

- `Keyphrase Boosting`
- `Transcript Corrections`

#### Keyphrase Boosting

作用：

- 让 ASR 更容易识别某些领域词。

典型适用：

- 品牌名
- 产品名
- 医疗词
- 金融词
- 中英混合词

官方给了三个强度：

- `Default`
- `Boosted`
- `Maximum`

并且明确提醒：

- bias 加得太重会副作用很大；
- 不要一上来就 Maximum；
- 先 Default/Boosted，沙箱验证后再加。

#### Transcript Corrections

作用：

- ASR 出字后再做 regex/string 修正。

适合：

- “听得差不多，但拼错了”
- 固定误写
- 品牌词纠错

官方明确把两者区分得很清楚：

- 听错了：用 boosting
- 听到了但写错了：用 corrections

### 7.2 每步 ASR：Flow step biasing

官方允许在 Flow 的具体 step 上配置 per-step ASR biasing。  
这很符合语音 agent 场景，因为一个 agent 在不同 step 的输入类型差异很大。

例如：

- 收验证码时适合 `alphanumeric`
- 收姓名时适合 `name`
- 收时间时适合 `time`
- 收日期时适合 `precise date`
- 收 yes/no 时适合 `yes/no`

官方强调了优先级：

1. Dynamic biasing
2. Per-step biasing
3. Global biasing

### 7.3 动态 ASR：conv.set_asr_biasing()

官方 `conv` 对象支持在函数里动态设置 ASR biasing：

- `conv.set_asr_biasing(...)`
- `conv.clear_asr_biasing()`

适用场景：

- 先从 API 拉到一个客户名列表，再对下一步识别做动态偏置
- 某一步临时进入特定产品库、分支名、医生名等上下文

对我们产品的启发：

- 识别治理至少要分 `全局 / step / 动态` 三层。
- 仅靠 step-level entity type 还不够像 PolyAI。
- 原型页里至少应预留：
  - 全局 Speech Recognition 配置
  - step 级 ASR biasing
  - function 级 dynamic biasing 能力模型

---

## 8. Flow 在 PolyAI 里到底是什么

官方对 Flow 的定位非常明确：

- 适合多轮、强顺序、需要记忆和逻辑的交互
- 不适合简单 FAQ
- 不等于普通 prompt

官方给出的 Flow 适用场景包括：

- 收手机号、订单号、验证码
- 做校验和重试
- 调用 API
- 路由 / handoff / escalation
- 满足合规要求的固定顺序交互

一个特别关键的官方原则：

- 当前 step 的 prompt 必须 `self-contained`
- 因为 LLM 看不到前一个 step 的 prompt

也就是说，PolyAI Flow 不是“全局大剧本按 step 切片”，而是：

- 每个 step 都是独立对话状态
- 每个 step 都要自包含上下文和动作约束

这是我们做 Flow 编辑器时必须对齐的核心概念。

---

## 9. Flow 的进入方式

官方 Flow 有三种典型入口：

1. 从代码触发：`conv.goto_flow("Flow name")`
2. 从 Knowledge / Managed Topic action 触发
3. 从另一个 flow 内部切换到新 flow

官方特别强调：

- API 不直接触发 flow
- Flow 自己负责 orchestration
- API 只是被 Function step 或函数调用后影响路线

对我们产品的启发：

- `Flow` 不是一个被动静态图，它必须有“入口绑定”。
- 入口至少要支持：
  - topic/intent action
  - global function
  - current flow 内跳转

---

## 10. PolyAI 的 Flow 步骤模型

结合官方 Flow、No-code flow、Advanced step、Transition functions 文档，可以把其 step 模型理解成四层。

### 10.1 Default Step

适用场景：

- 大多数结构化收集流程
- 不需要写代码的多轮路由

能力：

- 有 prompt
- 可抽取实体
- 可基于边上的条件标签做 LLM 路由
- 可引用实体和变量

特点：

- 条件标签对 LLM 有意义
- required entities 会参与是否可走该边的判断
- routing 仍是 LLM 驱动

### 10.2 Function Step

适用场景：

- API 调用
- 严格业务规则
- 数值比较
- 自定义校验
- 状态写入

特点：

- 没有 prompt，主要是代码
- 条件标签只是装饰，真正的路由由代码决定
- 要显式调用 `flow.goto_step(...)`
- 不支持 DTMF / step ASR 这类音频配置

### 10.3 Advanced Step

这是 PolyAI 语音场景特别重要的一层。  
它用于补足 Default Step 的能力上限。

Advanced Step 支持：

- per-step ASR biasing
- DTMF
- rich text references
  - transition function
  - global function
  - SMS template
  - handoff
  - variant attribute

这意味着：

- 如果一个 step 既要写 prompt，又要在 prompt 中明确引用函数 / handoff / SMS，还要做 DTMF/ASR 精准控制，就该进 Advanced Step。

### 10.4 Exit Flow

官方明确要求：

- 每个 Flow 都应以 Exit flow 收尾。

Exit flow 的语义包括：

- 正常结束
- Handoff
- Stop

PolyAI 非常在意“可终止性”。  
官方甚至明确提醒：没有 exit 的 flow 更容易导致 hallucination。

对我们产品的启发：

- `Start / Step / Exit` 这三个基础节点一定要有。
- 但 `Step` 内部还应有 step kind：
  - default
  - function
  - advanced
- 否则无法完整表达 PolyAI 的语音 Flow。

---

## 11. No-code Flows：PolyAI 怎么把 Flow 做成可视化

2025 年 12 月官方 release 明确宣布了 `No-code flows`。  
它的目标不是取代代码，而是把大多数结构化对话先变成可视化搭建。

官方 no-code flow 的典型模式：

1. 提问
2. 抽取实体
3. 根据条件继续分支
4. 走到对应路径
5. 用 Exit flow 收尾

PolyAI 在 no-code flow 中的核心概念：

- `Step`
- `Edge`
- `Condition`
- `Entity`
- `Exit flow`

官方对边条件的设计非常值得参考：

- `Label`
  - 短、唯一、对人可读
- `Description`
  - 这是最核心的路由信号，给 LLM 看
- `Required entities`
  - 哪些实体满足前该条件不应触发

官方甚至明确说：

- label 主要告诉人“这条边是什么”
- description 才是告诉 LLM“什么时候走这条边”

对我们产品的启发：

- 边编辑器不能只有一个 label。
- 必须有：
  - 标签
  - 描述/条件摘要
  - required entities / prerequisite
  - priority / fallback / debug

---

## 12. Entity：PolyAI 怎么做实体采集、校验与重试

### 12.1 官方实体类型

PolyAI 官方在 no-code flow 和 flow overview 里明确支持这些实体类型：

- Free text
- Number
- Alphanumeric
- Phone number
- Date
- Time
- Multiple choice
- Name
- Address
- Email

并且每种类型都有自己的配置项，例如：

- Number：整数/小数、最小最大值
- Alphanumeric：内置 zip/postal，自定义 regex
- Phone：国家码限制
- Date：day-first、日期范围
- Time：时间范围
- Multiple choice：选项枚举

### 12.2 实体采集的运行机制

官方对实体采集的设计不是“字段表单”，而是“对话中的结构化识别”：

- 用户说出内容
- ASR 转文本
- 系统按 entity type 校验
- 成功则写入实体结果
- 失败则 re-ask 或 fallback

### 12.3 Retry 的官方态度

一个非常关键的点：

- 官方明确说没有自动重试上限。
- 必须由 flow 设计者自己提供 fallback path。

这对产品设计意义很大。  
PolyAI 并没有替用户自动生成一套完整 retry policy，而是把 retry 设计权交给构建者。

因此一个像 PolyAI 的 Flow 编辑器，至少应该支持：

- no input 提示
- no match 提示
- max attempts
- fallback target / caller unable to provide
- 手动显式兜底分支

### 12.4 Function Step 里如何取实体

官方给出固定读法：

```python
conv.entities.entity_name.value
```

并明确提醒：

- entity values 在函数里都是字符串
- 数字比较前要自己 cast

对我们产品的启发：

- 实体采集必须是 Flow 的核心一等能力，不是附属字段。
- Retry 不应只是 UI 展示项，必须要能和边、fallback、handoff 联动。

---

## 13. Transition Functions：PolyAI 如何做流程控制

Transition function 是 PolyAI Flow 的核心控制面。

官方定义：

- 它是 flow-scoped function
- 绑定在特定 flow 内
- 用来决定 step 怎么跳
- 不等于 global function

官方给出的几个关键点：

### 13.1 管理方式

- 在 step 上创建或选择 transition
- 在 Flow Functions modal 里统一查看、搜索、重命名、删除、复用

### 13.2 命名原则

官方非常强调名字要从“用户意图”命名，而不是从“流程结构”命名。

好例子：

- `save_postcode`
- `check_availability`
- `confirm_email`

不推荐：

- `goto_next_step`
- `continue_flow`
- `start_confirmation`

### 13.3 代码模式

典型 transition function：

```python
def check_user_verified(conv: Conversation, flow: Flow):
    if conv.state.user_verified:
        flow.goto_step("Account details")
    else:
        flow.goto_step("Verify identity")
    return
```

官方明确提醒：

- `return` 一定要写
- `flow.goto_step(...)` 大小写敏感
- step 改名或删掉后，transition 可能静默损坏

### 13.4 Function Step 与 Transition Function 的关系

官方实际上有两套 routing 模型：

- no-code/default step：LLM 基于 condition description 路由
- function/transition：代码用 `flow.goto_step()` 决定路由

对我们产品的启发：

- 节点右侧抽屉里，必须能配置该 step 可见的 transition functions。
- 边侧栏也应能绑定 transition function，用于说明/调试/映射运行时路线。
- 需要有一个“Flow Functions 总览”面板，这在 PolyAI 是显式存在的。

---

## 14. Flow Object 与 Conversation Object：PolyAI 的运行时对象模型

### 14.1 Flow Object

官方 `Flow` 对象主要解决“当前 flow 内部怎么跳”。

关键能力：

- `flow.current_step`
- `flow.goto_step(step_name, condition_label=None)`

重要注意：

- `condition_label` 在代码驱动路线里只是装饰，不影响运行时逻辑。
- 只有函数里最后一次 `goto_step()` 会生效，所以官方建议 `goto_step()` 后立刻 `return`。

### 14.2 Conversation Object

官方 `conv` 对象是语音 agent 运行时的总入口。

它至少覆盖这些能力：

- 上下文
  - `id`
  - `account_id`
  - `project_id`
  - `env`
  - `channel_type`
  - `caller_number`
  - `callee_number`
  - `sip_headers`
  - `integration_attributes`
- 会话状态
  - `state`
  - `current_flow`
  - `current_step`
  - `memory`
  - `entities`
  - `real_time_config`
- 流程控制
  - `goto_flow()`
  - `exit_flow()`
- 语音与通道控制
  - `say()`
  - `set_voice()`
  - `set_language()`
  - `randomize_voice()`
  - `set_variant()`
- 识别控制
  - `set_asr_biasing()`
  - `clear_asr_biasing()`
- 呼叫能力
  - `call_handoff()`
  - `discard_recording()`
  - `goto_csat_flow()`
- 外部能力
  - `api`
  - `functions`
  - `utils`
  - `send_sms()`
  - `send_sms_template()`
  - `send_email()`
- 观测能力
  - `log_api_response()`
  - `write_metric()`

对我们产品的启发：

- 如果我们未来要做“真实可运行”的 Flow，不要只设计节点图；还要定义一个统一 runtime context。
- 至少要有：
  - `state`
  - `entities`
  - `currentFlow/currentStep`
  - `gotoFlow/gotoStep/exitFlow`
  - `callHandoff/sendSms/api`

---

## 15. Tools / Functions：PolyAI 怎么让 Agent “会做事”

### 15.1 官方定位

官方对 Tools 的描述很直接：

- 没有 function，agent 只能“说”
- 有了 function，agent 才能“做”

Tool 的用途：

- 调 API
- 查订单
- 校验输入
- 写 CRM
- 发送短信
- 做 handoff

### 15.2 创建 function 的方式

官方 `Build > Tools` 创建函数时，核心字段是：

- Name
- Description
- LLM Parameters
- Python code

官方特别强调：

- 函数名会被 LLM 当作语义信号
- 名称必须是“做什么”，而不是“流程开始/停止”这类结构词

参数定义里要给：

- 参数名
- Context Description
- 类型

参数类型包括：

- string
- number
- integer
- boolean

### 15.3 Start Function

Start function 是 voice 场景极其关键的一环。

官方设计：

- 每通会话开始前执行
- 在 greeting 之前执行
- 同步执行
- 慢了会直接拖慢甚至影响首句播放

适用：

- 初始化 state
- 读 SIP headers
- 读 integration metadata
- 拉轻量 API
- 动态设置 variant / 语言 / voice

官方给出明确 decision framework：

- 首句前必须拿到的数据：放 start
- 快且稳定的 API：可以放 start
- 慢/不稳定 API：放 flow 第一个 step

### 15.4 End Function

End function 也是官方非常强的一层。

设计：

- 每次通话结束后执行
- 异步执行
- 不影响用户体验

用途：

- 结构化通话总结
- CRM 更新
- ticket 创建
- disposition logging
- follow-up workflow
- 短信/邮件/任务后处理

这说明 PolyAI 的 agent 不只是“对话当下”，而是把“通后处理”做成一等机制。

### 15.5 Delay Control

官方为高延迟函数设计了 `Delay control`：

- 可以配置 filler phrases
- 可设初始延时和间隔
- 只作用于具体 function
- 不支持 start / end function

一个很关键的官方提醒：

- delay timer 不是从用户说完开始计，而是从 function 真正开始执行时计
- 所以 LLM / ASR / 路由本身的延时也会让用户感受到“空窗”

对我们产品的启发：

- 如果以后做真实运行，不要只做 function timeout；还要做 `等待话术`。
- Flow 原型里可以预留 function-level delay control。

---

## 16. Function Return Values：PolyAI 如何精细控制下一步行为

官方函数返回值设计得非常工程化。

### 16.1 允许的返回类型

- string
- dict

### 16.2 主要字段

- `content`
  - 给 LLM 的系统提示
- `utterance`
  - 直接对用户说的话
- `handoff`
  - 发起转接
- `hangup`
  - 结束会话
- `listen`
  - 配置下一轮 listen
  - 可指定 ASR / DTMF / barge-in / smart VAD / channel
- `variant`
  - 切换 variant

### 16.3 为什么这对语音场景重要

这套设计让函数不仅能“做事”，还可以直接决定：

- 说什么
- 什么时候听
- 通过什么输入通道听
- 是否转接
- 是否挂断

这其实是 PolyAI 很重要的 runtime control 面。

尤其是 `listen` 对 voice 非常重要，因为它把下轮输入配置和本轮动作耦合在一起了。  
比如：

- 说一句“请输入 6 位验证码”
- 同时把下一轮 listen 配成 `SPEECH_AND_DTMF`
- 指定 digit 数、超时、结束键、是否 PII

这对我们产品的启发非常直接：

- 将来如果做真实执行层，Flow 节点不应只有 prompt/tool，还应能产生“listen 配置”。

---

## 17. API Integrations：PolyAI 如何把外部系统接进来

官方 `Configure > APIs` 不是一个简单 webhook 配置，而是一套可被运行时引用的 API definition 管理系统。

一个 API 定义包含：

- API 名称
- 每个环境的 Base URL
- Auth
- 多个 operations

运行时调用方式：

```python
conv.api.<api_name>.<operation_name>(...)
```

例如：

```python
response = conv.api.salesforce.get_contact("123")
```

设计优势：

- base URL 按环境切换
- auth 不写死在函数里
- function 代码更薄
- flow/function 可以共用同一 API 定义

这是 PolyAI 很关键的“平台化”能力，而不是“每个函数自己 requests”。

对我们产品的启发：

- 后续如果要进化成真实产品，API 不该塞在单个节点里做孤立配置。
- 更像 PolyAI 的方案是：
  - 平台级 API registry
  - 节点/函数只引用 operation

---

## 18. DTMF：PolyAI 如何做电话按键交互

DTMF 是 PolyAI 语音场景的一个非常实用的专门能力。

### 18.1 官方设计

DTMF 只在 `Advanced step` 上提供。  
Low-code / Function step 不支持。

官方配置项包括：

- Number of digits expected
- First digit timeout
- Inter-digit timeout
- End key
- Collect while speaking
- Mark as PII

### 18.2 官方运行语义

官方明确说明：

- DTMF 打开时，ASR 仍然同时开着
- 用户可以“按键”也可以“说”
- 如果用户没按键，系统要等 digit timeout 才继续
- 因此 flow 设计必须考虑 speech 与 DTMF 共存

### 18.3 录音退出

官方还提供了一个典型场景：

- “按 1 退出录音”
- 然后用 `conv.discard_recording()`

这说明在 PolyAI 里，DTMF 不是单纯的“输入框”，而是一个跟：

- 通话控制
- PII
- 法务流程
- 录音策略

都有关系的 voice-native 能力。

对我们产品的启发：

- DTMF 不应只是 entity 的一个输入模式下拉框。
- 它应该至少有单独配置面：
  - digit count
  - first/inter timeout
  - end key
  - collect while speaking
  - pii
  - speech+dtmf 双通道模式

---

## 19. Handoff：PolyAI 如何做转人工 / 路由

PolyAI 的 handoff 有两层。

### 19.1 UI 配置层

官方有单独的 `Call handoffs` 配置页：

- 管目的地
- 管 SIP URI / 电话号
- 管 route

### 19.2 运行时触发层

运行时至少有两种方式：

1. return dict 里的 `handoff`
2. `conv.call_handoff(...)`

其中 `conv.call_handoff()` 支持：

- destination
- reason
- utterance
- sip_headers
- route override

而 return dict 里的 handoff 还支持更底层的 SIP 控制：

- REFER
- INVITE
- BYE

这说明 PolyAI 对 handoff 的设计不是一个简单布尔值，而是一个可运行的 telephony action。

对我们产品的启发：

- `handoff` 应是独立能力域，不只是 Exit 节点的一个 type。
- Flow 里至少要能：
  - 选 handoff destination
  - 传 handoff reason
  - 配前置 utterance
  - 指定 route override

---

## 20. Variables / State / Memory：PolyAI 如何保持多轮上下文

### 20.1 conv.state

这是对话级临时状态：

- 跨 turn 持续
- 可写任意值
- 可参与函数逻辑
- 可参与 prompt templating

官方还列出了很多系统内置 state 键，例如：

- `from_`
- `to`
- `call_sid`
- `asr_lang_code`
- `tts_lang_code`
- `handoff`
- `disable_recordings`

### 20.2 Prompt templating

官方支持在 prompt 里用 `$variable_name` 注入 state 变量。

### 20.3 conv.memory

这是跨会话、按 caller identity 取回的记忆。  
它不是当前通话临时 state，而是 repeat caller memory。

这点非常重要，因为它说明 PolyAI 把：

- 当前会话状态
- 跨会话记忆

是严格区分开的。

对我们产品的启发：

- 后续如果做完整产品，至少要有：
  - `state`：会话内临时变量
  - `memory`：客户长期记忆
  - `runtime config`：实时配置对象

---

## 21. Diagnosis / Conversation Review / Test Suite：PolyAI 如何调试和验收

### 21.1 Conversation Review

这是单通话复盘主界面，用来看：

- Transcript
- Metadata
- Matched topics
- Functions
- 用户体验发生了什么

### 21.2 Diagnosis

这是更深入的单 turn 分析层，官方支持的诊断视图包括：

- Variables
- Flows and steps
- Function calls
- LLM Request
- Topic citations
- Transcript corrections
- Turn latency
- Latency breakdown
- Interruptions
- Variants
- Logs
- Entities

这个层次对我们非常有启发。  
PolyAI 不是只给你“最终话术”，而是能让你看每一步系统内部到底发生了什么。

### 21.3 Test Suite

官方 Test Suite 的设计很实用：

- 从真实聊天或真实通话中保存 Test Case
- 多个 Test Case 组成 Test Set
- 可跑 Draft / Sandbox
- 可自动在发布或环境提升时跑

这非常适合 generative AI，因为它强调：

- 回归测试
- 非生产环境验证
- 改一处不应 silently break 别处

对我们产品的启发：

- 调试不能只做“场景预演”。
- 后续完整产品至少要有：
  - 场景保存
  - 批量回放
  - 结果对比
  - 发布前自动运行

---

## 22. Dashboards / Agent Analysis / CSAT：PolyAI 如何做上线后的运营闭环

### 22.1 Dashboards

官方提供三类 dashboard：

- Standard enterprise dashboard
- Safety dashboard
- Custom dashboards

标准指标包括：

- Containment rate
- Total calls
- Total automated minutes
- Average call duration

### 22.2 Agent Analysis

官方 `Agent Analysis` 本质是一个面向批量通话的 LLM 分类器：

- 用 prompt + categories 批量打标签
- 每次最多分析 250 通
- 支持定时批处理

它适合做：

- 转人工原因分类
- 结果归因
- 成功/失败归类

### 22.3 CSAT

官方支持 Voice CSAT 与 SMS CSAT。  
Voice CSAT 可以在通话尾部直接进入评分流程。

对我们产品的启发：

- PolyAI 的“语音 agent 产品”并不止于 Build。
- 它天然带着可运营、可分析、可 QA 的平台思路。

---

## 23. Environments：PolyAI 如何做安全发布

官方把发布环境分成：

- Draft
- Sandbox
- Pre-release
- Live

其中：

- `Draft`：个人工作态
- `Sandbox`：开发测试
- `Pre-release`：接近生产的 UAT / staging
- `Live`：真实生产

官方建议：

- Sandbox 改、测、频繁发布
- Pre-release 做最终 review、语音/pacing 检查、回归测试
- Live 不要直接改
- 一定从 Pre-release promote 到 Live

这个环境链路和 Test Suite、Conversation Review 是联动的。

对我们产品的启发：

- 真产品不能只有“保存配置”，必须有版本与环境。
- 原型可以先不做真实发布，但数据模型最好预留：
  - draft version
  - sandbox/pre-release/live 状态

---

## 24. PolyAI 在语音 agent 场景下的设计原则

综合官方文档，PolyAI 的设计原则可以总结成 12 条：

1. `Greeting` 是通道首句，不是普通回复。
2. 输出治理和识别治理分离。
3. FAQ 用 Knowledge，多轮强顺序用 Flow。
4. Default Step 优先，Function Step 只在必须时使用。
5. step prompt 必须自包含。
6. edge label 给人看，condition description 给 LLM 看。
7. entity validation 和 retry 需要显式设计 fallback。
8. DTMF 是 voice-native 能力，不是普通表单字段。
9. slow API 不要放 start function。
10. delay control 用来补高延迟函数体验。
11. 所有结构化交互都要有 exit path。
12. 上线前后必须靠 Test Suite + Review + Diagnosis + Dashboard 闭环。

---

## 25. 对我们产品的直接映射建议

下面这部分最重要，直接对应我们该怎么做。

### 25.1 必须做成独立模块的能力

如果目标是“看起来像 PolyAI”，至少要拆成这些模块：

- `Agent`
  - greeting
  - personality
  - role
  - rules
- `Voice`
  - LLM for voice
  - disclaimer
  - silence timeout
  - max call duration
  - end of call behavior
  - voice selection
- `Speech Recognition`
  - global boosting
  - transcript corrections
- `Response Control`
  - stop keywords
  - pronunciations
- `Flow`
  - start/default/function/advanced/exit
  - entity collection
  - retries
  - transition functions
  - subflow
  - exit flow
- `Tools`
  - global functions
  - start/end function
  - delay control
  - variables
- `APIs`
  - per-environment API registry
- `Handoffs`
  - destination/reason/route
- `Analytics & QA`
  - scenario debug
  - conversation diagnosis
  - test suite
  - dashboard hooks

### 25.2 Flow 页必须体现的 PolyAI 核心点

当前如果只看 Flow 编辑页，一个接近官方心智的前端原型，至少要能展示：

- Flow 列表
- 入口 flow
- 子 flow
- Start / Step / Exit
- Step 的三种语义
  - default
  - function
  - advanced
- Step prompt
- visible/global tools
- transition functions
- edge 条件
- entities
- retry/fallback
- goto flow / exit
- DTMF
- ASR biasing
- 调试场景
- 运行轨迹

### 25.3 哪些是“更像官方”的增强项

- Flow Functions modal
- API registry 引用而不是节点内直配 URL
- Start function / End function 专门页
- Delay control
- Response control
- 全局 Speech Recognition 页
- 环境与版本页
- 保存真实 Conversation diagnosis 数据结构

---

## 26. 一个更接近 PolyAI 的最终产品蓝图

如果我们后续不是做 demo，而是做正式产品，我建议把产品信息架构做成这样：

### Build

- Agent
- Knowledge / 意图技能
- Flows
- Tools
- SMS
- Handoffs

### Channels

- Voice
- Speech Recognition
- Response Control
- Audio

### Configure

- APIs
- Numbers
- Metrics
- CSAT

### Analytics

- Conversations
- Diagnosis
- Test Suite
- Dashboards
- Agent Analysis

### Deployments

- Draft / Sandbox / Pre-release / Live
- Version compare

这不是照搬导航，而是因为 PolyAI 的官方设计已经证明：  
语音 agent 一旦进入生产，就必须同时管理：

- 对话逻辑
- 通道行为
- 外部动作
- QA
- 发布
- 分析

---

## 27. 对当前项目原型的现实建议

结合我们这个项目的目标，建议分三层推进。

### 第一层：前端原型必须有

- Flow 编辑器
- 节点右侧配置抽屉
- 边条件配置
- 独立调试面板
- 实体/重试/子 flow/exit/goto flow
- prompt + tool + function 引用
- DTMF / ASR biasing 可配置

### 第二层：为了更像 PolyAI，应继续补

- Flow Functions 总览
- 全局 Voice 配置原型页
- Speech Recognition 原型页
- Response Control 原型页
- Start/End function 原型页

### 第三层：如果未来做真执行

- runtime context
- API registry
- function sandbox
- environment/version
- conversation trace persistence
- regression test set

---

## 28. 这份研究里最值得记住的 10 个点

1. PolyAI 的 Greeting 不经过 LLM。
2. Flow 适用于“多轮、强顺序、要记忆和验证”的交互。
3. 当前 step prompt 必须自包含，因为前一步 prompt 不可见。
4. Default Step 是主力；Function Step 是确定性补位；Advanced Step 是语音增强层。
5. edge label 给人看，description 给模型看。
6. Retry 不是平台自动兜底的，必须自己设计 fallback。
7. DTMF 只在 Advanced Step 上是真正完整的。
8. Start function 要极快，慢 API 应放到 flow 第一步。
9. Diagnosis 是一等能力，不只是 transcript。
10. PolyAI 做的是整个平台，不是单个 Flow 画布。

---

## 29. 官方资料来源

以下为本次整理直接参考的官方页面，建议后续继续以这些页面为主线跟进：

- Flows Overview  
  https://docs.poly.ai/flows/introduction
- Triggering Flows  
  https://docs.poly.ai/flows/triggering-flows
- Example Flow  
  https://docs.poly.ai/flows/example
- No-code Flows Overview  
  https://docs.poly.ai/flows/no-code/introduction
- No-code Entities  
  https://docs.poly.ai/flows/no-code/entities
- Advanced Steps  
  https://docs.poly.ai/flows/no-code/advanced-steps
- Transition Functions  
  https://docs.poly.ai/flows/transition-functions
- Flow Object  
  https://docs.poly.ai/flows/object
- ASR Biasing in Flows  
  https://docs.poly.ai/flows/asr-biasing
- DTMF in Flows  
  https://docs.poly.ai/flows/dtmf
- Few-shot Prompting  
  https://docs.poly.ai/flows/few-shot-prompting
- Agent Settings Overview  
  https://docs.poly.ai/agent-settings/introduction
- Agent / Behavior  
  https://docs.poly.ai/agent-settings/agent
- Voice Configuration  
  https://docs.poly.ai/voice/voice-configuration
- Speech Recognition  
  https://docs.poly.ai/speech-recognition/introduction
- Response Control  
  https://docs.poly.ai/response-control/introduction
- Tools Overview  
  https://docs.poly.ai/tools/introduction
- Create Tool  
  https://docs.poly.ai/tools/how-to-setup
- Start Function  
  https://docs.poly.ai/tools/start-function
- End Function  
  https://docs.poly.ai/tools/end-function
- Delay Control  
  https://docs.poly.ai/tools/delay-control
- Return Values  
  https://docs.poly.ai/tools/return-values
- Variables  
  https://docs.poly.ai/tools/variables
- Conversation Object  
  https://docs.poly.ai/tools/classes/conv-object
- Conversation API Client  
  https://docs.poly.ai/tools/classes/conv-api
- API Integrations  
  https://docs.poly.ai/api/introduction
- Test Suite  
  https://docs.poly.ai/analytics/test-suite/introduction
- Conversation Review  
  https://docs.poly.ai/analytics/conversations/review
- Diagnosis  
  https://docs.poly.ai/analytics/conversations/diagnosis
- Dashboards Overview  
  https://docs.poly.ai/analytics/dashboards/introduction
- Standard Dashboard  
  https://docs.poly.ai/analytics/dashboards/standard
- Agent Analysis  
  https://docs.poly.ai/agent-analysis/introduction
- CSAT  
  https://docs.poly.ai/analytics/csat/introduction
- Conversation Flow  
  https://docs.poly.ai/essentials/order
- Release Notes Overview  
  https://docs.poly.ai/releases/overview
- Release Notes 25.12  
  https://docs.poly.ai/releases/notes/25.12

---

## 30. 给本项目的下一步建议

建议基于这份报告，下一步再补一份项目内文档：

- `PolyAI 能力 -> 我们产品 IA 映射表`
- `Flow 原型剩余缺口清单`
- `从前端原型到真实运行时的数据模型设计`

如果要继续，我建议下一份直接写：

- 我们自己的 `语音 Agent 平台信息架构设计稿`
- 或者 `Flow / Voice / Tools / QA 四大模块的前端原型拆解方案`

