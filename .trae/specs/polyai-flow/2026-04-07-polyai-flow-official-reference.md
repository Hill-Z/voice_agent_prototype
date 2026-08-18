# PolyAI Flow 官方能力参考

## 文档目的

这份文档整理了 PolyAI 官方文档中与 `Flow` 直接相关的核心能力，用于本项目的产品设计参考。目标不是逐字翻译官方文档，而是把对产品设计有用的结构化信息沉淀到仓库里，供后续 `流程配置` 原型和真实实现对照。

## 官方定位

PolyAI 的 `Flow` 主要用于处理“必须按步骤推进”的对话流程，典型场景包括：

- 信息收集
- 输入校验
- 调用 API
- 分支决策
- 升级转人工
- 合规或强约束话术

相比之下：

- `Managed Topics` 更适合问答类内容
- `Functions` 更适合单次动作
- `Flows` 更适合多步、强顺序、需要可控推进的对话

这意味着 Flow 不是一个泛化聊天容器，而是一个受控的多步对话编排模型。

## 核心运行模型

从产品视角看，PolyAI Flow 可以理解为：

- 每个 `step` 是一个离散状态
- 每个 step 都有自己的 prompt 和可见函数
- 用户进入某个 step 后，模型主要依据当前 step 的配置来决策
- step 之间通过跳转函数或条件来推进

PolyAI 强调的一个关键点是：当前 step 的 prompt 具有很强的约束力。模型并不是无限自由地看完整套流程，而是在每一步里围绕当前 step 的配置做决策。

这也是 Flow 比“单一大 prompt 驱动复杂流程”更稳定的原因。

## Flow 适合做什么

官方文档对应的高价值场景包括：

- 收集手机号、验证码、订单号、姓名、地址
- 做格式校验和多次重试
- 调用接口确认身份、查订单、查状态
- 根据规则分流到不同处理链路
- 在失败后升级到人工
- 在对话中保持结构化状态

一个简单判断标准是：如果交互超过 2 到 3 轮，且顺序不能乱，就适合用 Flow。

## Step 设计思路

### Step 是最核心的单元

每个 step 应该：

- 只做一件事
- 有明确输入和输出
- 有清晰的下一步
- 有失败和退出路径

官方非常强调 step prompt 必须“自包含”。不要假设模型会自动继承前一个 step 的细节说明。

### 常见 step 类型

从官方能力和本文档抽象来看，Flow 里至少有以下几类 step 语义：

- `Start`
- `Collect`
- `Default / Prompted Step`
- `Function Step`
- `Exit`

这对于本项目的原型设计非常重要，因为“只分 start/default/exit”是不够支撑完整能力展示的，UI 上至少要表达 collect、function、exit 等不同语义。

## Default Step

Default step 是 PolyAI 推荐优先使用的主力 step。

特点：

- 有 prompt
- 可以收集实体
- 可以配置条件
- 模型根据当前 step prompt 和条件 label 决定下一步

适合：

- 常规收集
- 简单分支
- 不需要代码精确控制的对话

产品启发：

- 原型里应该把 `step prompt` 作为第一层配置能力
- Default step 应该支持函数、few-shot、变量和实体配置

## Function Step

Function step 对应更强控制、偏代码驱动的能力。

特点：

- 不依赖自然语言 prompt 做主要决策
- 由函数逻辑决定流转
- 常见于 API 调用、验证、严格分支、状态写入

适合：

- 身份验证结果判断
- 查接口后分流
- 重试上限判断
- 精确条件跳转

产品启发：

- 原型需要让评审者看懂“这个节点是 function step，不是普通对话 step”
- 即使不接真实后端，调试器也要能模拟 function step 改 state、命中下一条边

## Exit Flow

官方多次强调：每个 flow 必须有明确出口。

出口可以对应：

- 正常结束
- 转人工
- 停止

产品启发：

- 本项目中的 `Exit` 节点设计是正确方向
- 但不应只是视觉终点，还应表达退出原因和退出类型

## Entity 收集

PolyAI Flow 支持多种实体类型，官方文档明确提到常见类型包括：

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

产品启发：

- 原型里的 collect step 不能只写“变量名”
- 应该明确实体类型、提示词、是否必填、失败兜底
- 语音场景下，实体类型和 ASR biasing 是强相关的

## 状态管理

PolyAI 使用 `conv.state` 保存跨 step 状态。

常见存储内容：

- 已收集的实体
- API 返回值
- 当前上下文
- 重试次数
- 是否验证通过

产品启发：

- 本项目原型必须有显式的 `State` 展示区
- 调试时应让评审者看到 state 如何变化
- 节点配置里也需要能引用变量和状态

## 跳转能力

官方文档中与流程控制直接相关的能力包括：

- `flow.goto_step(...)`
- `conv.goto_flow(...)`
- `conv.exit_flow()`

这三类能力对应三种不同粒度的控制：

- 当前 flow 内跳 step
- 切换到另一个 flow
- 退出整个 flow

产品启发：

- 原型不能只支持“普通连线”
- 边或节点配置必须能表达“跳到另一个子 flow”
- 调试器必须能看见这三类跳转结果

## Transition Functions

Transition functions 是 Flow 的关键能力之一。

它们的作用不是完成业务动作，而是控制流程如何继续推进，比如：

- 根据条件去下一个 step
- 根据状态切换到另一个 flow
- 根据尝试次数决定是继续还是升级

产品启发：

- 本项目中 `visible function` 和 `transition function` 的区分是必要的
- 右侧节点配置里必须继续保持两类函数的分区
- 调试时要展示“当前 step 可见哪些 transition function”

## Visible Functions

Visible functions 更接近业务动作：

- 调 API
- 发短信
- 转人工
- 挂断

这些函数通常是模型在业务上下文中调用的可见工具。

产品启发：

- `visible function` 代表业务动作面
- `transition function` 代表流程控制面
- 二者必须在产品上分开表达，否则评审者会看不懂能力边界

## Few-shot Prompting

官方明确强调在 Flow 中使用 few-shot 示例。

原因：

- Flow 中模型只看到当前 step 语境
- few-shot 对当前 step 的行为约束更强
- 能提高结构化回复和指定行为的稳定性

官方建议通常为少量、贴近真实输入的例子。

产品启发：

- 本项目原型中 few-shot 不是可有可无，而是 Flow 的一等能力
- 节点配置器里应保留 few-shot 区域
- 调试区可以展示“当前 step 参考了哪些 few-shot”

## ASR Biasing

PolyAI 官方对语音场景给出专门能力：ASR biasing。

适用场景：

- 验证码
- 姓名拼写
- 日期时间
- 数字
- 地址

产品启发：

- Collect step 配置里应允许设置 biasing 类型
- 原型里即使不接真实 ASR，也应把这个能力展示出来
- 对语音机器人产品来说，这是 Flow 产品化区别于普通流程图的关键点

## DTMF

官方支持在特定 step 里使用电话按键输入。

典型场景：

- 输入验证码
- 输入账号
- 简单菜单选择

官方限制：

- DTMF 不支持 realtime model

产品启发：

- 如果本项目未来继续深做语音流程，Collect step 需要考虑 `speech / dtmf` 两种模式
- 当前原型可先只展示入口，不必深做

## Retry 策略

官方一个很重要的现实限制是：平台不会自动帮你设计完整 retry 策略。

也就是说：

- 收集失败时如何重试
- 重试多少次
- 超过上限如何转人工
- 用户不回应时怎么办

这些都需要在 flow 设计里显式配置。

产品启发：

- Retry 不能只是调试器里的一个计数器
- 它应该是节点级配置的一部分
- 原型必须支持：
  - 最大重试次数
  - no input 话术
  - no match 话术
  - 超限后跳转目标

## 设计模式

官方 Academy 中一条非常有价值的模式是：

- `Collection`
- `Validation`
- `Verification`

这三段逻辑最好分开建模。

原因：

- 用户说出一个值，不代表格式正确
- 格式正确，不代表系统里真实存在
- 把这三者拆开，流程更稳定、调试更清晰

产品启发：

- 内部评审 demo 最适合用“身份验证 / 查订单 / 转人工”类链路
- 因为它天然覆盖 collect、validate、verify、retry、handoff

## 与本项目原型的映射建议

结合官方能力和本项目现状，建议对应关系如下：

- `Entry Flow / Sub Flow` 对应官方的 flow 切换与子流程组织
- `Default Step` 对应官方默认 step
- `Function Step` 对应官方 function step
- `Collect Step` 对应实体采集与 ASR biasing
- `Exit Step` 对应 finish / handoff / stop
- `Visible Functions` 对应业务动作函数
- `Transition Functions` 对应流程控制函数
- `Debug State` 对应 `conv.state`
- `Annotation / PRD` 对应内部评审层，而非官方运行时能力

## 建议纳入本轮原型的官方能力

推荐优先纳入：

- 入口 Flow
- 子 Flow
- step prompt
- visible functions
- transition functions
- few-shot
- entity collect
- retry
- exit type
- state 展示
- flow 间跳转

可以后续再补：

- DTMF 深度配置
- 更复杂的条件表达式编辑器
- 真实函数参数映射
- 发布和版本管理

## 官方文档入口

以下为本次整理时重点参考的官方页面：

- Flows Introduction: https://docs.poly.ai/flows/introduction
- Triggering Flows: https://docs.poly.ai/flows/triggering-flows
- No-code Flows Introduction: https://docs.poly.ai/flows/no-code/introduction
- Entities: https://docs.poly.ai/flows/no-code/entities
- Flow Object: https://docs.poly.ai/flows/object
- Transition Functions: https://docs.poly.ai/flows/transition-functions
- Few-shot Prompting: https://docs.poly.ai/flows/few-shot-prompting
- ASR Biasing: https://docs.poly.ai/flows/asr-biasing
- DTMF: https://docs.poly.ai/flows/dtmf
- Flow Fundamentals: https://docs.poly.ai/learn/guides/expert/flow-fundamentals
- Flow Patterns: https://docs.poly.ai/learn/guides/expert/flow-patterns
- Managed Topics Introduction: https://docs.poly.ai/managed-topics/introduction
- Order of processing: https://docs.poly.ai/essentials/order

## 结论

PolyAI Flow 的本质不是“流程图画布”，而是“受控的多步对话状态机”。

对本项目而言，真正值得借鉴的不是某一个 UI 样式，而是这几个产品原则：

- 把复杂对话拆成离散 step
- 让每个 step 自包含
- 区分业务动作和流程控制
- 显式管理状态、重试和退出
- 把语音场景特有的实体采集和 ASR biasing 放进产品能力面

这也是本项目 `Flow Workbench` 原型应该优先体现的方向。
