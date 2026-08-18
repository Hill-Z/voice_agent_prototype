# PolyAI 全量能力落地实施计划

> 目标：在保持现有产品菜单体系不推翻重做的前提下，把 PolyAI 语音 Agent 的核心能力完整映射到当前项目的页面、原型和前端数据模型中，形成一套可持续迭代的实施方案。

更新时间：2026-04-08  
适用范围：`C:\Users\13609\.trae-cn\AI-voice-bot`  
关联文档：
- `./2026-04-08-polyai-voice-agent-official-research.md`
- `./2026-04-08-polyai-capability-to-product-mapping.md`
- `./2026-04-08-polyai-current-product-integration.md`

---

## 1. 计划前提

这份计划基于以下已确认前提，不再反复摇摆：

1. 保留现有左侧菜单结构，不新增一套“PolyAI 式一级导航”。
2. `机器人配置` 继续作为单个 bot 的主工作台。
3. `基础配置` 负责 bot 基本信息、Agent 提示词、默认语音/识别等基础能力，不额外拆出 `Agent / Voice / 语音识别 / 输出控制` 四个新页签。
4. `流程配置` 只负责 Flow，本身不再吞掉全局语音治理、API 注册、词库治理等能力。
5. `工具配置` 负责全局工具资产；`代码块` 菜单继续单独承接 code 相关 tools。
6. `流程编排` 与 `流程配置` 并存，但职责不同：
   - `流程配置` = 单 bot 内结构化对话 Flow
   - `流程编排` = 跨 bot / IVR / 路由 / 转人工 / 外部动作总线
7. 页面风格必须延续现有产品 UI，中文为主，页面保持干净，不增加大段说明型文案。

---

## 2. 实施目标

最终要实现的不是“再做一个新页面集合”，而是把 PolyAI 的全量能力拆解后，准确落到当前已有模块中：

- `机器人配置`
  - 基础配置
  - 意图技能
  - 流程配置
  - 对话策略
  - 变量配置
  - 知识检索配置
  - 模型调试
  - 批量评测
- `工具配置`
- `代码块`
- `流程编排`
- `信息提取配置`
- `词库管理`
- `集成中心`
- `通信网关`
- `号码管理 / IVR管理 / 参数设置`
- `通话记录 / 监控报表`

目标状态是：

1. 用户可以在现有菜单体系内完整展示 PolyAI 的 Flow、Tool、Voice、Speech、Response Control、Handoff、QA 闭环能力。
2. 各模块职责清晰，引用关系明确，不重复造入口。
3. Flow 页面成为“结构化对话编排中心”，而不是“超级配置表单”。
4. 所有关键能力能在前端被配置、切换、联动、半模拟调试。

---

## 3. 当前系统与 PolyAI 能力归属

### 3.1 已有模块与建议承接关系

| 当前模块 | 保留定位 | 承接 PolyAI 能力 |
| --- | --- | --- |
| `机器人配置 / 基础配置` | 单 bot 基础信息与 Agent 基础能力 | role、system prompt、默认 voice、默认 ASR、基础模型参数 |
| `机器人配置 / 对话策略` | 全局对话行为策略 | greeting、静默处理、转人工规则、挂断规则、全局兜底 |
| `机器人配置 / 意图技能` | 弱结构化 topic / managed topics | 知识问答、topic 路由、非强流程处理 |
| `机器人配置 / 流程配置` | 单 bot Flow Studio | entry flow、sub flow、step、exit、edge、entity、retry、调试 |
| `机器人配置 / 变量配置` | bot 变量与会话状态配置 | state / variables / bindings |
| `机器人配置 / 知识检索配置` | knowledge / retrieval 策略 | retrieval source、召回策略、知识作用域 |
| `机器人配置 / 模型调试` | 单会话调试 | debug、latency、变量观察、链路复盘 |
| `机器人配置 / 批量评测` | 测试集与回归用例 | test suite、case、结果对比 |
| `工具配置` | 全局工具资产页 | tools、hooks、tool metadata、tool references |
| `代码块` | 独立的 code 资产页 | code blocks、函数脚本、片段模板 |
| `流程编排` | 跨 bot / IVR / handoff orchestration | handoff chain、外部动作编排、总线路由 |
| `信息提取配置` | 结构化抽取与触发规则 | extraction schema、参数映射、自动触发 |
| `词库管理` | 语音词表与纠错资产 | hotwords、transcript corrections、pronunciations、风险词 |
| `集成中心` | 外部系统连接器 | API registry、connector、认证配置 |
| `通信网关` | 通信链路基础设施 | SIP/PSTN/线路配置、接入路由 |
| `号码管理 / IVR管理 / 参数设置` | 号码、前置路由、平台默认参数 | numbers、ivr、global defaults |
| `通话记录 / 监控报表` | 上线后回放与指标分析 | conversation review、diagnosis detail、dashboards |

### 3.2 核心判断

当前产品并不缺“菜单”，缺的是三件事：

1. 各页面对 PolyAI 能力的职责边界还不够清晰。
2. 各页面之间的引用链还没打通。
3. Flow、Tool、Code Block、提取、词库、集成、调试之间缺少统一数据模型。

---

## 4. 总体落地架构

### 4.1 单 bot 工作台

`机器人配置` 内部继续使用当前 tab 结构，但重新定义职责：

- `基础配置`
  - bot 名称、业务线、描述
  - system prompt / agent prompt
  - 默认语音、默认识别模型
  - 基础时延/打断参数
- `对话策略`
  - welcome/greeting
  - silence timeout
  - hangup
  - transfer
  - 通用应答风格与全局兜底
- `意图技能`
  - managed topics
  - FAQ
  - topic routing
- `流程配置`
  - 强结构化 Flow
- `变量配置`
  - 会话变量、提取变量、工具结果变量
- `知识检索配置`
  - retrieval sources
  - 检索策略
- `模型调试`
  - 单会话/单场景调试
- `批量评测`
  - 测试集、回归集、评测结果

### 4.2 平台级资产页

- `工具配置`：定义工具资产，不在节点里重复定义工具本体
- `代码块`：定义代码块资产，不在 Flow 页面单独维护脚本正文
- `信息提取配置`：定义抽取模板和触发规则，为 Flow 和 Tool 提供 schema
- `词库管理`：定义识别词表和发音纠正资产，为基础配置、对话策略和 Flow 提供引用
- `集成中心`：定义 API/Connector，不在 Tool 或 Flow 节点中硬编码 URL 和鉴权

### 4.3 编排与基础设施

- `流程编排`：承接高层 orchestration、IVR 分流、多 bot 总线路由、handoff bus
- `通信网关`、`号码管理`、`IVR管理`：承接 voice channel 接入与线路层能力

### 4.4 诊断与运营闭环

- `模型调试`：开发态调试
- `批量评测`：发布前回归
- `通话记录`：生产态会话复盘
- `监控报表`：聚合指标、趋势和告警视图

---

## 5. 重点缺口清单

### 5.1 Flow 能力缺口

当前 `流程配置` 已经有雏形，但距离完整 PolyAI Flow 仍缺：

1. `advanced` step 语义仍不完整。
2. step 内对 `工具 / 代码块 / transition function / handoff target / 变量模板` 的引用链还不统一。
3. 边条件缺少结构化表达，仅有 summary 和简单表达式。
4. DTMF 仍偏弱，只是“输入模式 + 位数”，缺少 timeout、结束键、speech+dtmf 双通道等配置。
5. retry 策略还没与 flow jump、handoff、exit 做完整联动。
6. debug scenario 还没覆盖 expected path / state assertions / exit assertions。

### 5.2 工具与代码能力缺口

1. `工具配置` 与 `代码块` 还没有形成一套统一引用模型。
2. start hook / end hook / delay control 缺少明确归属和前端表现。
3. Tool 与 `集成中心` 的 connector 关系还未标准化。

### 5.3 语音治理能力缺口

1. 词库管理尚未明确拆成：
   - ASR 热词
   - transcript corrections
   - pronunciations
   - 风险词 / 停止词
2. `基础配置 + 对话策略 + 词库管理 + 参数设置` 之间缺少统一映射，导致 Voice / Speech / Response Control 的能力分散存在但没有被组织起来。

### 5.4 诊断链路缺口

1. `模型调试`、`批量评测`、`通话记录`、`监控报表` 缺少统一 trace schema。
2. 目前可以看局部信息，但看不到完整的：
   - 命中 flow
   - 命中 step
   - 命中 edge
   - 实体采集结果
   - tool 调用结果
   - retry 过程
   - handoff 原因

---

## 6. 分阶段实施方案

## Phase 0：统一边界与引用模型

### 目标

先不扩 UI 范围，先把现有页面的职责和引用链打清楚，避免后面每补一个功能都落在错误页面。

### 涉及文件

- `App.tsx`
- `components/ui/LayoutComponents.tsx`
- `components/bot/BotConfigForm.tsx`
- `types.ts`

### 需要落实的结果

1. 固化页面职责：
   - `流程配置` 只管 Flow
   - `代码块` 只管 code 资产
   - `工具配置` 只管 tool 资产
   - `流程编排` 只管高层 orchestration
2. 在 `types.ts` 中拆清几类引用 ID：
   - `toolIds`
   - `codeBlockIds`
   - `transitionFunctionIds`
   - `handoffTargetId`
   - `extractionSchemaId`
   - `lexiconPresetIds`
   - `integrationOperationId`
3. 明确 bot 级配置与 flow 级配置的边界：
   - bot 级：基础配置、对话策略、知识、变量
   - flow 级：step、edge、retry、goto、exit

### 验收标准

1. 新能力归属不再冲突。
2. 后续每个页面补能力时，都能明确“是定义资产”还是“是消费资产”。

---

## Phase 1：补齐 `流程配置` 的 PolyAI 核心 Flow 能力

### 目标

把 `流程配置` 做成完整的单 bot Flow 工作台，达到“能完整演示 PolyAI Flow 能力”的程度。

### 涉及文件

- `components/flow/FlowStudio.tsx`
- `components/flow/FlowCanvas.tsx`
- `components/flow/FlowNodeConfig.tsx`
- `components/flow/FlowEdgeConfig.tsx`
- `components/flow/FlowDebugPanel.tsx`
- `components/flow/flowDebugSimulation.ts`
- `types.ts`

### 需要落实的结果

#### 1. 节点模型统一为三类

- 画布左侧只保留：
  - `Start`
  - `Step`
  - `Exit`
- 不再拆多个“看起来像 step 的节点”
- Step 的真实语义改为右侧抽屉配置：
  - `default`
  - `function`
  - `collect`
  - `advanced`

#### 2. Step 抽屉能力补齐

右侧抽屉采用现有 `意图技能 > llm 节点` 的交互心智，点击节点后展示配置详情，重点补齐：

- 基础信息
  - step 名称
  - description
  - stepType
- prompt 配置
  - 主提示词
  - few-shot 示例
  - 变量引用
- 引用资产
  - 可见工具
  - transition functions
  - 代码块引用
  - handoff target 引用
- collect 能力
  - entity name
  - entity type
  - required
  - validation pattern
  - options
- advanced 能力
  - ASR biasing
  - input mode
  - DTMF 规则
  - speech_or_dtmf
  - digit count
  - first digit timeout
  - inter digit timeout
  - terminator
  - pii 标识
- retry 能力
  - max attempts
  - no input prompt
  - no match prompt
  - confirmation prompt
  - fallback action
  - fallback node / fallback flow / handoff

#### 3. Edge 抽屉能力补齐

- 标签
- 描述
- priority
- edgeType
- required entity
- transition function reference
- structured condition
  - entity
  - state
  - expression
  - intent
- debug rule

#### 4. Flow 级能力补齐

- entry flow
- sub flow
- goto flow
- return flow
- exit type
  - stop
  - handoff
  - goto flow

#### 5. 调试能力补齐

调试不再挤进右侧抽屉，改为独立面板或底部面板，支持：

- 选择 debug scenario
- mock 输入
- 逐步运行
- path trace
- state 变化
- entity 采集结果
- retry 触发记录
- tool 调用记录
- exit / handoff 结果

### 验收标准

1. 单个 bot 可以展示多 flow、多 step、多分支、多退出路径。
2. 节点点击后右侧抽屉不再空白，且内容与节点语义一致。
3. `流程配置` 页面可以完整演示：
   - flow 入口
   - 子 flow
   - step prompt
   - 工具引用
   - 代码块引用
   - 实体采集
   - retry
   - 边条件
   - handoff
   - 场景调试

---

## Phase 2：补齐 `工具配置 + 代码块 + 集成中心` 的资产层

### 目标

把 PolyAI 的 Tools、Functions、Code Blocks、API Registry 对齐到现有三个模块中，形成统一的可引用资产层。

### 涉及文件

- `components/tools/ToolConfigPage.tsx`
- `components/flow/FunctionManager.tsx`
- `components/integration/IntegrationCenter.tsx`
- `types.ts`

### 需要落实的结果

#### 1. `工具配置` 负责全局工具资产

补齐工具类型：

- API 工具
- 查询工具
- 写入工具
- 短信工具
- 转人工工具
- 生命周期 Hook
  - start hook
  - end hook
- 延时控制配置

每个工具需要具备：

- 名称
- 描述
- category
- 入参 schema
- 出参 schema
- 关联 integration operation
- 超时 / 重试 / delay control
- 启用状态

#### 2. `代码块` 负责 code 资产

`函数管理` 或 `代码块` 菜单应升级为独立代码资产页，承接：

- 代码块列表
- 代码块分类
- 代码块内容
- 输入输出说明
- 使用位置引用
- 版本说明

这里不再承接“工具定义”，只承接 code 本体。

#### 3. `集成中心` 负责 connector 与 operation

- connector 列表
- 鉴权配置
- operation 列表
- mock/sandbox 标记
- 参数映射

最终引用链应变成：

`集成中心(operation)` -> `工具配置(tool)` -> `流程配置(step 引用 tool)`  
`代码块(menu)` -> `流程配置(step 引用 codeBlock)`

### 验收标准

1. Flow 节点中不再出现“自己维护工具本体”的做法。
2. Tool 与 Code Block 两套资产分层明确。
3. Tool 引用可以追溯到 Integration operation。

---

## Phase 3：补齐 `信息提取配置 + 词库管理` 的共享语义资产

### 目标

把 PolyAI 的 entity schema、speech recognition、response control 相关能力，映射到当前系统的共享资产页。

### 涉及文件

- `InformationExtraction.tsx`
- `components/extraction/InterfaceConfig.tsx`
- `components/extraction/TriggerConfig.tsx`
- `components/lexicon/LexiconManager.tsx`
- `types.ts`

### 需要落实的结果

#### 1. `信息提取配置` 升级为共享 extraction schema 库

支持以下资产：

- Flow collect step schema
- Tool 参数抽取 schema
- 输出结构化字段模板
- 自动触发规则

Flow 节点不再只写“entityName + entityType”，而可以引用：

- extraction schema
- 参数模板
- 字段校验模板

#### 2. `词库管理` 升级为语音治理资产页

建议拆成四类词库：

- ASR 热词
- transcript corrections
- pronunciations
- 风险词 / 停止词

对应关系：

- `基础配置` 使用默认语音与识别模型
- `对话策略` 使用全局欢迎语、静默和兜底策略
- `词库管理` 提供识别纠错、发音纠正和风险控制资产
- `流程配置` 按 step 引用局部 biasing / 局部词表

### 验收标准

1. Flow 的 collect/advanced step 可以引用信息提取模板和词库资产。
2. 语音识别与输出控制的能力不再散落在多个无关页面。

---

## Phase 4：补齐 `流程编排 + 通信网关 + IVR/号码管理` 的高层编排与通道层

### 目标

把 PolyAI 中不属于单 bot Flow 的能力，全部明确落到高层编排和通道基础设施上。

### 涉及文件

- `components/flow/FlowOrchestration.tsx`
- `components/gateway/GatewayCenter.tsx`
- `components/number/NumberManagement.tsx`
- `components/ivr/IVRManager.tsx`
- `types.ts`

### 需要落实的结果

#### 1. `流程编排` 聚焦高层总线

仅承接以下能力：

- 多 bot 协作
- IVR 前置分流
- 外部动作串联
- 高层 handoff chain
- 跨系统路由

不再与 `流程配置` 争抢“单 bot 内 Flow 编辑器”的职责。

#### 2. `通信网关 / 号码管理 / IVR管理` 聚焦 voice channel infra

- SIP/PSTN 线路
- 号码绑定
- 前置 IVR
- route rules
- channel defaults

#### 3. handoff 分层

建议明确两层 handoff：

- `流程配置`：在 exit/step 中引用 handoff target
- `流程编排`：维护 handoff target、路由链和升级路径

### 验收标准

1. 研发和产品在讨论“Flow”时不会再混淆是 bot 内流程还是总线编排。
2. 转人工、IVR、号码、线路、bot 路由之间形成清晰层次。

---

## Phase 5：补齐 `模型调试 + 批量评测 + 通话记录 + 监控报表` 的 QA 闭环

### 目标

把当前分散存在的调试、测试、复盘和报表能力串成 PolyAI 风格的闭环。

### 涉及文件

- `components/bot/BotDebugConfig.tsx`
- `components/bot/BotTestConfig.tsx`
- `components/call/CallRecordDetail.tsx`
- `components/report/MonitoringReport.tsx`
- `components/flow/flowDebugSimulation.ts`
- `types.ts`

### 需要落实的结果

#### 1. `模型调试`

补齐单会话开发态调试链路：

- 当前 flow
- 当前 step
- 触发 edge
- tool 调用
- latency breakdown
- 提取变量
- retry
- handoff / hangup

#### 2. `批量评测`

补齐 PolyAI Test Suite 心智：

- 测试集
- 测试用例
- 来源标签
  - 手工
  - 通话记录生成
  - Flow 调试场景生成
- expected path
- expected exit
- expected state assertions
- 版本前后对比

#### 3. `通话记录`

补齐生产态 Review / Diagnosis Detail：

- transcript
- ASR 修正前后
- flow trace
- step trace
- tool trace
- handoff reason
- failure tags

#### 4. `监控报表`

补齐聚合指标：

- containment rate
- handoff rate
- flow completion rate
- retry exhaustion rate
- tool success rate
- avg duration
- csat
- 场景失败率

### 验收标准

1. 从开发态调试到生产态回放，再到批量评测和报表分析，能看到同一套核心运行轨迹。
2. Flow、Tool、Extraction、Handoff 的行为都能在 QA 闭环中被观测。

---

## 7. 数据模型落地建议

### 7.1 核心原则

后续所有页面联动，必须建立在统一 schema 之上，否则页面越多，引用关系越乱。

### 7.2 需要补齐的关键字段

建议以 `types.ts` 为中心，补齐以下能力：

- `FlowStepKind`
  - `default`
  - `function`
  - `collect`
  - `advanced`
  - `exit`
- `FlowNodeData`
  - `toolIds`
  - `codeBlockIds`
  - `transitionFunctionIds`
  - `handoffTargetId`
  - `gotoFlowId`
  - `asrBiasingPresetId`
  - `lexiconPresetIds`
  - `extractionSchemaId`
- `FlowEntityConfig`
  - `entityName`
  - `entityType`
  - `required`
  - `validationPattern`
  - `options`
  - `inputMode`
  - `dtmfConfig`
- `FlowRetryConfig`
  - `maxAttempts`
  - `noInputPrompt`
  - `noMatchPrompt`
  - `confirmationPrompt`
  - `fallbackAction`
  - `fallbackTargetId`
  - `fallbackFlowId`
  - `handoffTargetId`
- `FlowEdge`
  - `label`
  - `description`
  - `priority`
  - `condition`
  - `requiredEntities`
  - `transitionFunctionId`
  - `debugRule`
- `FlowDebugScenario`
  - `mockInputs`
  - `initialState`
  - `expectedPath`
  - `expectedExit`
  - `assertions`

### 7.3 统一 Trace Schema

建议新增统一 trace 结构，供四个页面共用：

- `BotDebugConfig`
- `BotTestConfig`
- `CallRecordDetail`
- `MonitoringReport`

最少包含：

- conversationId
- flowId
- nodeId
- edgeId
- toolCallId
- entityEvents
- retryEvents
- handoffEvents
- latency
- finalOutcome

---

## 8. UI 实施要求

### 8.1 必须遵守

1. 中文优先。
2. 不增加大段页面说明文本。
3. 不复制左侧已有菜单入口。
4. 节点详情统一走右侧抽屉式配置。
5. 调试面板独立，不再塞进窄抽屉。
6. 继续沿用当前产品的卡片、抽屉、表格、Tag、按钮样式语言。

### 8.2 `流程配置` 特别要求

1. 画布只保留必要操作。
2. 非核心按钮不堆在顶部。
3. 保存、全屏等全局动作使用轻量图标放在画布角落。
4. 节点配置优先对齐 `意图技能` 下 LLM 节点的配置体验。

---

## 9. 推荐执行顺序

推荐按照下面顺序开工，能最小化返工：

1. `types.ts` 统一模型
2. `流程配置` 核心节点/边/调试能力补齐
3. `工具配置 + 代码块 + 集成中心` 资产链打通
4. `信息提取配置 + 词库管理` 升级为共享语义资产
5. `流程编排 + 通信网关 + IVR/号码管理` 分层对齐
6. `模型调试 + 批量评测 + 通话记录 + 监控报表` 统一 trace 闭环

---

## 10. 最终验收口径

实施完成后，应能满足以下判断标准：

1. 不改现有菜单体系，也能完整解释 PolyAI 的全量能力落到哪里。
2. `流程配置` 已能完整展示 Flow 相关能力，而不是只展示节点图。
3. `工具配置`、`代码块`、`信息提取配置`、`词库管理`、`集成中心`、`流程编排` 之间的关系清楚可演示。
4. `模型调试`、`批量评测`、`通话记录`、`监控报表` 之间形成可讲清楚的 QA 闭环。
5. 页面保持干净，不因为“解释能力映射”而在界面里堆说明文字。

---

## 11. 下一步建议

这份文档解决的是“做什么、落在哪、先后顺序是什么”。  
下一步建议直接进入执行文档，拆成可连续开发的任务包：

1. `Flow Studio 二期实施任务清单`
2. `工具 / 代码块 / 集成中心 引用链改造任务清单`
3. `信息提取 / 词库 / QA Trace 统一任务清单`

如果继续推进，建议先从 `Phase 1 + Phase 2` 开始，因为这两部分最直接决定“看起来是否已经具备 PolyAI 核心能力”。
---

可以。按你现在这个项目的菜单和页面结构来看，完整实现一套接近 PolyAI 的能力，核心不是“新加一个页面”，而是把你现有几个模块升级成一套完整工作流。

我按你现在产品里的“大块”来讲。

**1. 机器人配置 - 基础配置**
这里要从“模型/TTS/大 prompt 配置”升级成“Agent 身份配置”。

要增加的核心能力：

- `Agent 角色`：机器人是谁，负责什么业务
- `Personality / Tone`：专业、亲和、安抚、销售型等
- `Greeting`：首句欢迎语，是否可打断，是否静态话术
- `Global Rules`：必须做什么，不能做什么，什么时候转人工
- `Response Style`：一句话多长、能不能列表、是否偏口语化
- `语言/语音策略`：默认语言、音色、场景语调

也就是：把现在单一的 `systemPrompt`，拆成结构化配置。

---

**2. 机器人配置 - 流程配置**
这是最核心的地方，应该做成你项目里的 PolyAI Workbench。

这里要增加的能力：

- `多 Flow 管理`：主 Flow、子 Flow、入口 Flow
- `Step 类型完善`
  - 普通对话 Step
  - 实体采集 Step
  - Function Step
  - 高级 Step
  - Exit / Handoff Step
- `Step Prompt`
  - 每个步骤单独 prompt
  - 每步绑定允许调用的函数和工具
- `Entity 采集`
  - 电话、日期、验证码、姓名等类型
  - 校验规则、确认方式、重试次数
- `Retry / Fallback`
  - 没听清、没输入、输错了怎么办
- `Edge 条件`
  - 根据 state、entity、函数结果决定跳转
- `goto flow / handoff / finish`
- `Delay Control 绑定`
  - 某个步骤调用函数慢时播什么
- `Debug Simulation`
  - 看用户输入后实际走了哪条路径

这一块本质上就是：把你现在的 [`FlowStudio`](/C:/Users/13609/.trae-cn/AI-voice-bot/components/flow/FlowStudio.tsx) 做成真正的 PolyAI 流程编排中心。

---

**3. 机器人配置 - 意图技能**
这一块不要再做主入口了，建议降级成“兼容模式”或“轻路由模式”。

它还能保留的职责：

- 老 bot 的兼容路由
- 简单意图到 Flow 的映射
- 非结构化入口分类

但不要再让它承担完整对话编排。  
主编排应该转到“流程配置”。

---

**4. 机器人配置 - 工具调用 / Agent 配置**
这一块要从“工具列表页”升级成“运行时策略页”。

要加的核心能力：

- `默认可见函数 / 默认过渡函数`
- `function call 策略`
- `Delay control profile`
- `General filler`
- `是否允许插话`
- `函数等待时怎么处理`
- `默认转人工目标`
- `start / end function`
- `是否允许某些工具在当前 bot 中暴露`

也就是：这里不再主要做“创建工具”，而是定义这个 bot 怎么用工具。

---

**5. 机器人配置 - 知识检索配置**
这一块不能只做 QA/RAG 开关，应该升级成 `Topics` 绑定页。

要增加的能力：

- `Topic 绑定`
  - 哪些 topic 对当前机器人可用
- `Topic 优先级`
- `哪些 topic 可以直接回答`
- `哪些 topic 必须进入 flow`
- `哪些 topic 可以触发 action`
- `smalltalk / policy / FAQ / transactional topic` 分类
- `topic 与 flow 的关系`

也就是：把“知识”从资料库，升级成“可参与对话编排的能力层”。

---

**6. 问答对管理 / 知识库**
现在的 `QAManager` 应该从 FAQ 管理器升级成 Topic 管理器。

这里要增加：

- Topic 基础信息
- Topic 说明 prompt
- Topic 使用条件 / 禁用条件
- Topic 对应 action
- Topic 是否能触发 flow
- Topic 对应知识源
- Topic 对应 QA 集合

简单说：  
不是“问什么答什么”，而是“这个主题在什么情况下介入，并且能做什么”。

---

**7. 词库 / Lexicon**
这一块要从独立词库，变成 Flow 和 ASR 的辅助配置。

要增加：

- 词库和 `entity` 绑定
- 词库和 `ASR biasing` 绑定
- 词库和 `某个 flow / 某个 step` 绑定
- 发音词典、业务术语词典、验证码词典等预设

这个能力对电话、验证码、订单号、姓名识别很关键。

---

**8. 工具配置**
这一块应该做成平台级 `Tool / API Registry`，而不是 bot 内工具页的重复版。

要增加：

- API 定义
- 请求/响应 schema
- 超时、重试
- 幂等配置
- 环境绑定
- mock 返回
- latency 模拟
- 是否副作用接口
- 可观测性标签
- delay control 预设

比如：

- 查询订单
- 查询退票规则
- 提交退票
- 取消中的查询
- 转人工
- 发短信

都应该先在这里定义成平台资产，再被 bot / flow 引用。

---

**9. 集成中心**
这一块要升级成运行环境与外部系统中心。

要增加：

- `Environment`
  - sandbox / pre-release / live
  - region
  - base URL
  - secret 管理
- `handoff 目标`
  - 客服队列、人工组、外呼组
- `alerts`
  - 延迟、函数失败、API 错误
- `diagnosis trace`
  - 是否保留每轮 timing breakdown
- `webhook / CRM / ticket system` 集成

这一块是让你的原型真正具备“上线能力”的地方。

---

**10. 变量配置**
这一块要升级成 `Variables & State`。

要增加：

- session / flow / step 级 state
- 变量来源
  - 用户输入
  - 函数结果
  - 系统变量
- PII 标记
- 持久化策略
- 默认值
- 派生变量
- state 写入规则
- state 守卫规则

PolyAI 风格的流程里，state 是核心，不只是“变量列表”。

---

**11. 模型调试**
这一块要升级成真正的 `Diagnosis` 页面。

要增加：

- 每轮 timing breakdown
  - ASR
  - LLM TTFB
  - function
  - delay control
  - TTS
- 当前命中的 flow / step
- entity 提取结果
- state 变化
- edge 命中原因
- 用户插话发生点
- 某个函数等待期间发生了什么

也就是：从“聊天调试”升级成“单轮运行诊断”。

---

**12. 批量评测**
这一块要升级成 `Test Sets`。

要增加：

- flow 级测试
- topic 级测试
- function 级测试
- state 断言
- 路径断言
- handoff 断言
- latency 断言
- 慢函数场景
- 用户打断场景
- DTMF 场景

这部分非常关键，不然你做不出稳定的语音 agent。

---

**13. 通话记录**
这一块要升级成 `Conversation Replay`。

要增加：

- transcript
- 每轮事件时间线
- 调了哪些函数
- delay control 播了什么
- 插话发生在哪一段
- 最终走了哪个 flow
- 转人工原因
- state 快照

这块做完，你才能真正排查线上问题。

---

**14. 监控报表**
这一块要从运营 BI，升级成运行监控。

要增加：

- turn latency p50 / p95
- function error rate
- API error rate
- handoff rate
- retry exhaustion rate
- flow completion rate
- topic fallback rate
- 中断率
- top slow functions
- top failed flows

这块是 PolyAI 那种“上线后可运维”的关键。

---

**15. 底层 schema / types**
这其实是所有功能之前必须先做的一层。

你现在最先该补的是：

- `BotConfiguration`
- `AgentConfig`
- `FlowConfig`
- `FlowNodeData`
- `FlowFunction`
- `TopicDefinition`
- `RuntimeConfig`
- `VoiceRuntimeConfig`
- `DelayControlProfile`
- `MonitoringConfig`
- `DiagnosisConfig`

如果这层不先统一，前端页面会一直是“看起来能配，实际存不下”。

---

**一句话总结**

如果按你现在项目结构来做，完整实现 PolyAI 能力，主要就是这几大块：

- `机器人配置 - 基础配置`
  - 做 Agent 身份、Greeting、Rules、Response Style
- `机器人配置 - 流程配置`
  - 做主编排中心，补齐 step / entity / function / handoff / delay control
- `机器人配置 - 知识检索配置`
  - 升级成 Topics 绑定
- `工具配置`
  - 做平台级 API / Tool 资产中心
- `集成中心`
  - 做 environment / handoff / alerts / diagnosis
- `变量配置`
  - 做 state 管理
- `模型调试 / 批量评测 / 通话记录 / 监控报表`
  - 做完整调试、测试、回放、监控闭环

如果你愿意，我下一步可以直接给你一版更适合拿去开需求会的版本：

- 按“菜单 -> 新增功能点 -> 业务价值”三列表输出  
这样你可以直接给产品、设计、研发讲。
