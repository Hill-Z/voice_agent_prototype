# PolyAI 能力与当前产品菜单/原型功能的完整集成方案

更新时间：2026-04-08  
关联文档：

- `./2026-04-08-polyai-voice-agent-official-research.md`
- `./2026-04-08-polyai-capability-to-product-mapping.md`
- `./2026-04-07-flow-workbench-design.md`

适用目标：

- 基于当前项目已经存在的菜单、页面和原型功能
- 明确 PolyAI 的能力分别应该并入我们哪个现有菜单、哪个现有 tab、哪个现有功能
- 给出“保留现状 + 增量集成”的完整方案，而不是重新设计一套全新导航

---

## 1. 这份文档回答什么

前两份文档解决的是：

- PolyAI 官方到底有哪些能力
- 如果从零设计，我们的信息架构应该怎么分层

这份文档解决的是更贴近当前项目的问题：

1. 我们已经有哪些菜单和原型入口。
2. PolyAI 的能力应该怎么塞进这些现有入口，而不是推翻重做。
3. 哪些能力应该继续留在 `机器人配置 > 流程配置`，哪些必须拆出去。
4. 最终要形成什么样的“现有菜单不变，但产品能力接近 PolyAI”的结构。

这份文档的核心原则是：

- 保留现有左侧菜单骨架
- 保留现有 `机器人配置` 作为主要工作台
- 保留旧的 `意图技能 / 流程编排`
- 把 PolyAI 的全量能力分配到当前已有的菜单和功能上
- 尽量少改导航名，多改页面职责和内部 tab 结构

---

## 2. 当前产品已经有的入口

结合当前代码，现有入口可以分成两层。

### 2.1 左侧菜单层

当前左侧菜单主要入口包括：

- `机器人配置`
- `工具配置`
- `流程编排`
- `音色市场`
- `集成中心`
- `通信网关`
- `通话记录`
- `监控报表`
- `信息提取配置`
- `系统设置`
  - `号码管理`
  - `IVR管理`
  - `地理组合`
  - `工作时间`
  - `文件管理`
  - `模型训练`
  - `参数设置`
- `词库管理`
- `问答对管理`
- `知识发现`

### 2.2 机器人配置内部 tab 层

当前 `机器人配置` 已有 tab：

- `基础配置`
- `意图技能`
- `流程配置`
- `对话策略`
- `变量配置`
- `业务分析`
- `营销活动`
- `模型调试`
- `批量评测`
- `知识检索配置`

### 2.3 当前已经存在的关键原型能力

当前项目其实已经具备了不少可以承接 PolyAI 的能力雏形：

- `流程配置`
  - 多 flow
  - entry flow
  - 子 flow
  - step 节点
  - exit 节点
  - 实体采集
  - retry
  - goto flow
  - edge 条件
  - 半模拟调试
- `意图技能`
  - 旧流程编排
  - 工具绑定
  - LLM 节点 / cognitive config
- `工具配置`
  - 全局工具定义
  - MCP 接入入口
- `模型调试`
  - 单轮对话调试
  - 延迟和 token 观测
  - 标签和变量观察
- `批量评测`
  - 测试集
  - 用例管理
  - 执行结果
- `通话记录`
  - 会话详情
  - 从通话记录生成测试用例
- `监控报表`
  - 运营指标和趋势图
- `音色市场`
  - 音色资源浏览

这说明我们并不是“从 0 到 1”缺少 PolyAI 能力，而是“能力分散、归属还没理顺”。

---

## 3. 集成总原则

为了在不推翻现有产品结构的前提下接近 PolyAI，建议遵守下面五条原则。

### 3.1 `机器人配置` 继续做主工作台

PolyAI 的很多能力都是围绕“单个 agent/bot”展开的。  
所以我们不需要把所有能力都独立成左侧一级菜单。

建议：

- `机器人配置` 继续承担单 bot 的核心设计工作台
- 在其内部补足 `Agent / Voice / Speech / Response Control / Debug / Test`

### 3.2 `工具配置` 保持全局，而不是下沉回 Bot 内

PolyAI 的 Tools 是平台级资产，不是某个 Flow 自己私有的。

建议：

- 工具定义仍放全局 `工具配置`
- 机器人配置和流程配置只做引用

### 3.3 `流程配置` 只做 Flows，不再吞掉全局语音能力

这是最关键的一条。

`流程配置` 里应该保留：

- 多 flow 管理
- step 节点
- 边条件
- 实体
- retry
- goto flow
- tool/function/code block 引用
- Flow 调试

不应该继续放进去的：

- 欢迎语
- 全局 voice 选择
- 全局 ASR boosting
- transcript corrections
- response control
- API registry
- handoff 目标池

### 3.4 `流程编排` 不要和 `流程配置` 混为一谈

当前左侧还有一个独立的 `流程编排` 页面。  
从现有 UI 看，它更像：

- 多 agent 协作
- 业务总线
- IVR / 路由 / CRM 动作编排

这和 PolyAI 的 `Flows` 不是同一层。

建议：

- `流程配置` 对齐 PolyAI 的 `Build > Flows`
- `流程编排` 对齐更高层的 `Orchestration / Multi-Agent / Call Routing`

### 3.5 `通话记录 + 批量评测 + 模型调试 + 监控报表` 一起承担 Analytics

PolyAI 的 Analytics 不是一个页面，而是一套闭环。  
我们现在其实已经有四块雏形：

- `模型调试`
- `批量评测`
- `通话记录`
- `监控报表`

建议不要再新造一套“Analytics”，而是把这四块明确升级和串联起来。

---

## 4. PolyAI 能力如何并入当前左侧菜单

这一节是最关键的总映射。

| 当前菜单 | 当前角色 | 建议承接的 PolyAI 能力 | 结论 |
| --- | --- | --- | --- |
| 机器人配置 | 单 bot 设计工作台 | Agent、Knowledge、Flows、Voice、Speech、Response Control、Debug、Test | 作为主承载入口 |
| 工具配置 | 全局工具资产 | Tools、Functions、Start/End Function、Code Blocks、Variables 引用源 | 保持全局平台页 |
| 流程编排 | 跨 bot / 跨系统编排 | Handoffs、Multi-agent orchestration、IVR routing、等待音、业务动作串联 | 不与 Flow 合并 |
| 音色市场 | 音色资源中心 | Voice asset library | 做资源选择入口，不做 voice 配置主页面 |
| 集成中心 | 外部系统连接 | APIs、Connector registry、CRM/工单/知识库集成 | 承接 PolyAI APIs |
| 通信网关 | 通信通道能力 | 渠道接入、SIP/PSTN、号码绑定、路由基础设施 | 承接 Channels 基础设施 |
| 通话记录 | 会话回放和明细 | Conversation Review、Diagnosis 明细入口 | 承接单会话分析 |
| 监控报表 | 数据分析 | Dashboards、CSAT、Agent Analysis | 承接上线后运营闭环 |
| 信息提取配置 | 提取 schema | Entity schema library、结构化字段模板 | 给 Flow 和 Tool 提供实体模板 |
| 系统设置 > 号码管理 | 号码资产 | Numbers | 直接承接 |
| 系统设置 > IVR管理 | IVR 树 | 电话导航、前置分流、DTMF 基础设施 | 与流程编排协同 |
| 系统设置 > 参数设置 | 全局平台参数 | Speech / Response Control 的系统级默认值 | 可承接全局默认配置 |
| 词库管理 | 词条和发音 | Pronunciations、ASR 纠错词表、品牌词治理 | 很适合扩成语音治理资产页 |
| 问答对管理 | FAQ/知识问答 | Managed Topics / QA | 保留 |
| 知识发现 | 知识构建 | Knowledge ingestion / curation | 保留并与知识检索配置打通 |

---

## 5. `机器人配置` 内部如何完整承接 PolyAI

如果只做一个页面的增强，最重要的就是 `机器人配置`。

当前它已经是“单 bot 的所有配置入口”，所以最合理的做法不是把 PolyAI 能力全部拆去左侧，而是先把它内部重构成更清晰的分组。

## 5.1 建议的内部分组

建议把当前 tab 重组为四组。

### 第一组：Build

- `基础配置`
- `Agent`
- `意图技能`
- `流程配置`
- `知识检索配置`
- `变量配置`

### 第二组：Channels

- `Voice`
- `Speech Recognition`
- `Response Control`

### 第三组：Optimize

- `模型调试`
- `批量评测`

### 第四组：业务扩展

- `业务分析`
- `营销活动`

这里最重要的是补出三个新 tab：

- `Voice`
- `Speech Recognition`
- `Response Control`

这是当前产品最缺、但又最像 PolyAI 的三个能力入口。

## 5.2 当前 tab 到 PolyAI 的详细映射

### 1. 基础配置

当前职责：

- bot 基础信息
- 名称、描述、业务线等

建议承接：

- bot identity
- deployment label
- 默认入口策略

保留，不需要大改。  
这是单 bot 元信息，不是 PolyAI 的核心差距点。

### 2. 新增 `Agent` tab

建议从当前 `对话策略` 中拆出一部分，形成单独的 `Agent` tab。

承接 PolyAI：

- greeting
- role
- personality
- behavior rules
- special case handling
- silence handling
- goodbye handling

为什么要单独拆：

- 这部分是 PolyAI `Build > Agent` 的核心
- 如果继续塞在 `对话策略`，用户很难形成“Agent 是一层、Flow 是另一层”的心智

### 3. 意图技能

承接 PolyAI：

- Managed Topics
- 宽松问答
- topic routing
- 非强流程对话

定位建议：

- 保留现状
- 明确说明：这里负责“不是强流程的对话”
- 与 `流程配置` 通过“进入 Flow”的动作联动

### 4. 流程配置

承接 PolyAI：

- Flows
- multi-flow
- subflow
- step config
- entities
- retries
- transition functions
- goto flow
- exit
- Flow debug

保留现状，并继续增强。  
这是当前最接近 PolyAI 的页。

必须补的点：

- `advanced` stepType
- 更强的 DTMF 配置
- code block 引用
- handoff target 引用
- edge 结构化条件

### 5. 知识检索配置

承接 PolyAI：

- knowledge / retrieval
- 非流程知识回答支持

建议：

- 继续保留
- 与 `意图技能` 更明确分工

分工建议：

- `意图技能` 管 topic / route / QA orchestration
- `知识检索配置` 管知识源、检索策略、召回范围

### 6. 变量配置

承接 PolyAI：

- variables
- conversation state
- runtime bindings

建议：

- 保留现状
- 增加与 Flow 节点的变量绑定映射
- 增加变量来源标记

变量来源建议：

- input vars
- extracted vars
- tool return vars
- session vars
- system vars

### 7. 对话策略

当前更像一个混合页。  
建议未来收窄职责，保留为：

- 回答风格
- 通用策略
- 全局兜底
- 小聊/拒答策略

需要从这里拆走的内容：

- greeting
- personality
- role
- voice
- speech recognition
- response control

也就是把它从“大杂烩策略页”收敛成“全局会话行为策略页”。

### 8. 业务分析

建议承接：

- 业务标签
- 业务分类
- 业务意图统计视角
- 提取字段分析

它不是 PolyAI 的直接一比一页面，但可以作为运营侧补充页。

### 9. 营销活动

这是当前产品的业务扩展能力，不是 PolyAI 核心模块。  
建议继续保留，不必强行对齐。

### 10. 模型调试

承接 PolyAI：

- 单会话调试
- latency 观测
- token 观测
- 变量变化
- action events

建议升级方向：

- 增加“当前命中 Flow / Step / Edge”
- 增加“ASR 结果 vs 修正后结果”
- 增加“response control 命中记录”

这样它会更像 PolyAI 的 Conversation Review + Diagnosis。

### 11. 批量评测

承接 PolyAI：

- Test Suite
- regression tests
- 回归集

当前已经很适合作为 PolyAI 的 `Test Suite` 雏形。

建议补充：

- 支持 Flow 调试场景导入为测试集
- 支持通话记录一键转测试用例
- 支持版本对比

---

## 6. `工具配置` 如何承接 PolyAI Tools

当前 `工具配置` 已经是一个非常合适的全局入口，不需要换位置。

### 6.1 当前定位

当前已经支持：

- 全局工具列表
- 添加/编辑工具
- MCP 接入

### 6.2 应补的 PolyAI 能力

建议把 `工具配置` 扩展成四个区块：

#### 1. Tools

- API 工具
- 查询工具
- 短信工具
- 转人工工具

#### 2. Functions

- 内置函数
- transition functions
- flow functions

#### 3. Code Blocks

- 代码块
- 模板脚本
- 条件逻辑片段

#### 4. Lifecycle Hooks

- start function
- end function
- delay control

### 6.3 和 Flow 的关系

原则必须明确：

- `工具配置` 定义资产
- `流程配置` 只做引用
- `意图技能` 也只做引用

这会形成一个很像 PolyAI 的平台结构：

- 全局工具资产池
- 局部节点引用能力

---

## 7. `流程配置` 如何继续增强但不越界

这一节专门回答：PolyAI 的哪些能力应该继续落在当前 `FlowStudio` 里。

## 7.1 应该留在 `流程配置` 的能力

### Flow 结构

- flow list
- entry flow
- subflow
- flow metadata

### Step 结构

- Start
- Step
- Exit

Step 的右侧抽屉应继续支持：

- `stepType = default`
- `stepType = function`
- `stepType = collect`
- `stepType = advanced`

### Step 详细配置

- prompt
- visible tools
- visible functions
- transition functions
- few-shot
- code block 引用
- entity collection
- retry policy
- step-level ASR biasing
- DTMF input mode

### Edge 配置

- 条件摘要
- 优先级
- fallback
- goto flow
- transition function reference

### 调试

- 调试场景
- 运行轨迹
- state 变化
- 命中边
- 重试耗尽
- exit / handoff

## 7.2 不应该再继续塞进 `流程配置` 的能力

- greeting
- 全局 voice 选择
- disclaimer
- silence timeout
- transcript corrections
- global ASR boosting
- stop keywords
- pronunciations
- API token / URL 配置
- handoff 目标池

这些能力如果继续塞在 `流程配置`，页面会越来越像“超级配置表单”，而不是 PolyAI 那种平台式分层。

---

## 8. `流程编排` 页面应该怎么重新定位

当前左侧已有独立的 `流程编排` 页面。  
它不应该和 `机器人配置 > 流程配置` 争角色。

建议重新定位如下：

### 8.1 `机器人配置 > 流程配置`

用于：

- 单 bot 内的结构化对话 flow

对应 PolyAI：

- `Build > Flows`

### 8.2 左侧 `流程编排`

用于：

- 多 bot 协作
- IVR 前置分流
- call routing
- CRM/短信/等待音/挂机动作编排
- 转人工链路

更接近：

- orchestration layer
- call handoffs
- external action bus

也就是说：

- `流程配置` 是 bot 内部流程
- `流程编排` 是 bot 外部总线

这两个页面必须并存，但边界要讲清楚。

---

## 9. `音色市场`、`词库管理`、`参数设置` 如何承接 Voice / Speech / Response Control

这一节解决当前比较分散的语音相关资产怎么整合。

### 9.1 音色市场

建议定位：

- 只做 `Voice asset library`
- 浏览、试听、收藏、选择音色模板

不建议做：

- bot 最终 voice 配置主页面

正确关系应该是：

- `音色市场` 提供可选资产
- `机器人配置 > Voice` 负责绑定具体 bot 的 voice

### 9.2 词库管理

这个页面非常适合升级成语音治理资产页。

建议承接：

- pronunciations
- transcript corrections 词表
- 品牌词
- 行业术语
- 竞品词

这样它就能同时服务：

- Speech Recognition
- Response Control
- Knowledge

### 9.3 系统设置 > 参数设置

建议承接：

- voice 默认参数
- speech recognition 默认参数
- response control 默认开关
- 全局超时

定位为：

- 平台级默认值

而不是：

- 单 bot 的具体配置

---

## 10. `集成中心`、`通信网关`、`号码管理`、`IVR管理` 如何承接 API / Channels / Handoffs

这一节负责把 PolyAI 的通道和集成能力分给我们现有的基础设施页。

### 10.1 集成中心

建议承接：

- API registry
- CRM/工单/短信/知识库连接器
- 鉴权配置
- mock/sandbox 标记

与工具配置的关系：

- `集成中心` 管连接器
- `工具配置` 管基于连接器封装出的工具

这会形成一个清晰链路：

- Connector
- Tool
- Node reference

### 10.2 通信网关

建议承接：

- SIP/PSTN 接入
- 呼入呼出链路
- 通道状态
- 语音底层链路

更偏基础设施。

### 10.3 系统设置 > 号码管理

建议承接：

- Numbers
- bot/线路绑定
- 国家/地区号码资源

### 10.4 系统设置 > IVR管理

建议承接：

- 前置 DTMF 树
- IVR 分流
- 呼入入口路由

与 Flow 的关系：

- IVR 管“进线前/进线初始路由”
- Flow 管“进入 bot 之后的结构化对话”

### 10.5 转人工能力怎么落

建议分成两层：

- `流程配置` 中的 exit/handoff 节点只引用目标
- 具体 handoff 目标池和规则放在：
  - `流程编排`
  - 或 `集成中心/通信网关` 下的转接配置

---

## 11. `模型调试`、`批量评测`、`通话记录`、`监控报表` 如何拼出 PolyAI Analytics

这是当前产品最有潜力的一块，因为你其实已经有四个入口了。

## 11.1 模型调试 -> Review / Diagnosis 实时态

当前已有：

- 对话调试
- voice mode
- latency
- tokens
- tags
- variables

建议增强为：

- 识别结果
- Flow 命中路径
- step/edge 命中
- tool 调用时间轴
- response control 命中

### 最终定位

- 调试态的 Review / Diagnosis

## 11.2 批量评测 -> Test Suite

当前已有：

- 测试集
- 用例管理
- 执行结果

建议增强为：

- 支持来源标记
  - 手工
  - 通话记录生成
  - Flow 场景导入
- 支持预期 path / 预期 exit / 预期 state
- 支持版本对比

### 最终定位

- PolyAI 的 `Test Suite`

## 11.3 通话记录 -> Conversations / Review

当前已有：

- 通话记录列表
- 通话详情
- 从通话记录生成测试用例

建议增强为：

- 识别文本 vs 修正文本
- 节点命中路径
- handoff reason
- 失败原因标签
- response control / policy 命中记录

### 最终定位

- PolyAI 的 `Conversations / Review / Diagnosis detail`

## 11.4 监控报表 -> Dashboards / CSAT / Agent Analysis

当前已有：

- 趋势图
- 绩效表
- 满意度分析
- 通话指标

建议增强指标：

- Flow 完成率
- retry 耗损率
- handoff 率
- DTMF 使用率
- 工具调用成功率
- bot 级 CSAT
- 场景级失败率

### 最终定位

- PolyAI 的 `Dashboards / CSAT / Agent Analysis`

---

## 12. `信息提取配置`、`问答对管理`、`知识发现` 如何协同

这三块容易被忽视，但对 PolyAI 式平台很关键。

### 12.1 信息提取配置

建议升级为：

- Flow entity schema library
- Tool parameter extraction schema
- 结构化字段模板

也就是说：

- 不只服务信息提取
- 也服务 Flow 的 collect step
- 也服务 Tool 的参数映射

### 12.2 问答对管理

建议继续承接：

- FAQ
- managed topics
- 弱结构化问答

### 12.3 知识发现

建议继续承接：

- 知识补全
- 语料发现
- 新问答生成

三者关系建议是：

- `知识发现` 发现内容
- `问答对管理` 维护知识问答
- `知识检索配置` 配置检索和召回

---

## 13. 一个最适合当前产品的最终集成结构

如果基于现有菜单做完整集成，我建议最终形成下面这个结构。

### 左侧菜单保持不变

- 机器人配置
- 工具配置
- 流程编排
- 音色市场
- 集成中心
- 通信网关
- 通话记录
- 监控报表
- 信息提取配置
- 系统设置
- 词库管理
- 问答对管理
- 知识发现

### 机器人配置内部升级为

#### Build

- 基础配置
- Agent
- 意图技能
- 流程配置
- 知识检索配置
- 变量配置

#### Channels

- Voice
- Speech Recognition
- Response Control

#### Optimize

- 模型调试
- 批量评测

#### Business

- 业务分析
- 营销活动

### 其它菜单承担的平台能力

- `工具配置`：Tools / Functions / Code Blocks / Hooks
- `流程编排`：Multi-Agent / Routing / Handoffs
- `集成中心`：APIs / Connectors
- `通信网关 + 号码管理 + IVR管理`：Channels infra / Numbers / IVR
- `音色市场 + 词库管理 + 参数设置`：Voice assets / Speech / Response Control assets
- `通话记录 + 监控报表`：Review / Diagnosis / Dashboards

---

## 14. 分阶段落地建议

为了让这份方案能真的执行，建议按下面顺序集成。

### 第一阶段：只改归属，不大改导航

- 在 `机器人配置` 内新增：
  - `Agent`
  - `Voice`
  - `Speech Recognition`
  - `Response Control`
- 明确 `流程配置` 的职责边界
- 明确 `流程编排` 是高层编排，不是单 bot flow

### 第二阶段：把全局资产页补全

- `工具配置` 增加 code blocks / hooks
- `集成中心` 增加 API registry
- `词库管理` 增加 pronunciations / transcript corrections

### 第三阶段：把 Analytics 闭环补完整

- `模型调试` 增强为诊断态
- `批量评测` 增强为 Test Suite
- `通话记录` 增强为 Review + Diagnosis detail
- `监控报表` 增强为 Flow/Tool/CSAT 指标面板

---

## 15. 结论

如果结合当前产品已有原型功能来看，最正确的做法不是“重新发明一套 PolyAI 菜单”，而是：

1. 保留现有左侧菜单体系。
2. 把 `机器人配置` 打造成单 bot 工作台，补齐 Agent、Voice、Speech、Response Control。
3. 把 `工具配置`、`集成中心`、`通信网关`、`通话记录`、`监控报表` 这些现有页重新赋予更清晰的 PolyAI 对应职责。
4. 把 `流程配置` 和 `流程编排` 明确分层，一个是 bot 内 flow，一个是跨 bot/跨系统 orchestration。

这样做的结果是：

- 产品不会推倒重来
- 原有原型能最大化复用
- PolyAI 的全量能力也能被完整映射进来

---

## 16. 下一步最值得补的文档

基于这份文档，下一份最值得补的是：

- `当前产品菜单改造清单`

它应该逐条列出：

- 哪些菜单保持不动
- 哪些 tab 需要新增
- 哪些现有页面需要挪职责
- 哪些数据结构要拆分成独立 config

如果继续，我建议下一份直接写成可执行清单，而不是继续做概念文档。
