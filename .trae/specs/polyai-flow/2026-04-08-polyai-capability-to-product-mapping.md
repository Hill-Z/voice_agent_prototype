# PolyAI 能力到本产品信息架构 / 页面结构 / 数据模型映射文档

更新时间：2026-04-08  
关联文档：

- `./2026-04-08-polyai-voice-agent-official-research.md`
- `./2026-04-07-flow-workbench-design.md`

适用目标：

- 给当前项目补一份可以直接指导产品原型和前端结构演进的映射文档
- 把 `PolyAI 官方能力`、`我们产品该放到哪个模块/页面`、`前端数据模型如何承接` 三件事彻底对齐
- 作为后续继续完善 `流程配置`、补 `Voice / Speech / Response Control / Tools / QA` 页面时的设计基线

---

## 1. 这份文档解决什么问题

前一份研究报告已经回答了 PolyAI 官方能力“是什么”。  
这份文档只回答更贴近项目落地的三个问题：

1. PolyAI 的每类能力，在我们的产品里应该归到哪个一级模块。
2. 每类能力在前端上应该以什么页面或工作台形态出现。
3. 当前项目已有的 `FlowStudio / FlowConfig / types.ts` 能承接到什么程度，还缺哪些关键数据结构。

结论先说：

- 不能把全部语音 agent 能力都挤进 `流程配置` 一个页面。
- `流程配置` 是 `Build > Flows` 域能力，不是整个语音 agent 平台。
- 如果目标是做接近 PolyAI 的完整产品原型，至少要把能力拆成 `Build / Channels / Configure / Analytics / Deployments` 五个域。
- 当前项目已经具备 `Flows` 原型的雏形，但 `Voice`、`Speech Recognition`、`Response Control`、`Tools 总览`、`QA` 仍然缺独立入口。

---

## 2. 当前项目的真实起点

结合代码现状，当前项目已经有以下基础：

- 保留中的旧能力：`意图技能 / 旧流程编排`
- 新独立原型页：`机器人配置 > 流程配置`
- 当前新原型核心组件：
  - `components/flow/FlowStudio.tsx`
  - `components/flow/FlowCanvas.tsx`
  - `components/flow/FlowNodeConfig.tsx`
  - `components/flow/FlowEdgeConfig.tsx`
  - `components/flow/FlowDebugPanel.tsx`
  - `components/flow/flowDebugSimulation.ts`
- 当前新原型入口：
  - `components/bot/BotConfigForm.tsx`
- 当前数据结构入口：
  - `types.ts` 中的 `FlowConfig / FlowDefinition / FlowNode / FlowEdge`

当前 `FlowConfig` 已经不是单 flow 结构，而是支持：

- `entryFlowId`
- `flows[]`
- `functions[]`
- `debugScenarios[]`

这意味着我们已经迈过了“只有一个流程画布”的阶段，正在进入“多 flow + 半模拟调试”的阶段。  
但它仍然只是 `Flows` 子系统，不等于完整的 PolyAI 风格平台。

---

## 3. 总体信息架构建议

如果以 PolyAI 官方心智来重组我们自己的语音 agent 产品，建议一级信息架构按下面划分。

### 3.1 一级导航建议

#### Build

- Agent
- Knowledge / 意图技能
- Flows
- Tools
- Handoffs
- SMS / 外呼扩展能力

#### Channels

- Voice
- Speech Recognition
- Response Control
- Audio / Prompt Assets

#### Configure

- APIs
- Numbers / 渠道接入
- Metrics
- CSAT

#### Analytics

- 调试场景
- 会话回放
- Diagnosis
- Test Suite
- Dashboards

#### Deployments

- Environments
- Versions
- Release history

### 3.2 为什么必须这样拆

因为 PolyAI 的核心不是“Flow 很强”，而是“Flow 只是平台中的一个编排域”。  
语音 agent 一旦进入真实业务，就必须同时管理：

- 全局身份和行为
- 多步对话编排
- 语音通道
- 识别治理
- 输出治理
- 工具和外部接口
- 调试与测试
- 环境和发布

所以我们产品里：

- `意图技能` 继续承担问答、知识检索、宽松路由类能力
- `流程配置` 只承担强结构化、多轮、强顺序能力
- 其余能力要在独立页面中表达，不能继续塞在 Flow 右侧抽屉里

---

## 4. PolyAI 能力到我们产品模块的总映射

| PolyAI 官方能力 | 官方职责 | 我们产品建议归属 | 页面形态建议 | 当前项目状态 |
| --- | --- | --- | --- | --- |
| Agent | 定义 greeting、role、personality、rules | `Build > Agent` | 表单页 + 文本配置页 | 未独立成页 |
| Knowledge / Managed Topics | FAQ、检索、宽松对话 | `Build > 意图技能 / 知识` | 已有页，继续保留 | 已存在 |
| Flows | 多步对话编排 | `Build > 流程配置` | 工作台式可视化页 | 已有原型 |
| Tools / Functions | 函数、变量、开始/结束函数 | `Build > Tools` | 列表 + 编辑器 + 选择器 | 部分存在，仅内嵌于 Flow |
| Handoffs | 转人工、路由、升级 | `Build > Handoffs` | 配置页 + Flow 引用 | 未独立成页 |
| Voice | 语音模型、欢迎语、免责声明、超时 | `Channels > Voice` | 配置页 | 未独立成页 |
| Speech Recognition | boosting、corrections、全局识别治理 | `Channels > Speech Recognition` | 配置页 | 未独立成页 |
| Response Control | stop keywords、pronunciations | `Channels > Response Control` | 配置页 | 未独立成页 |
| APIs | 外部系统连接器 | `Configure > APIs` | API 注册表 | 未独立成页 |
| Test Suite | 回归测试集 | `Analytics > Test Suite` | 场景列表 + 结果页 | 仅有 Flow 调试雏形 |
| Diagnosis | 单会话诊断 | `Analytics > Diagnosis` | 诊断详情页 | 未独立成页 |
| Dashboards / Agent Analysis | 上线后指标闭环 | `Analytics > Dashboards` | 分析页 | 未独立成页 |
| Environments | 环境隔离与发布 | `Deployments` | 环境列表 + 发布记录 | 未独立成页 |

这张表本质上定义了一条边界：

- `FlowStudio` 继续做深，做成 `Build > Flows`
- 但不要再让 `FlowStudio` 兼任 Voice、Speech、Response Control、API Registry、Analytics 的角色

---

## 5. 页面结构建议

下面这一节直接回答“每个能力在前端应该是一个什么页面”。

### 5.1 Build 域页面

#### 1. Agent 页面

职责：

- 配置机器人角色、服务边界、人格、语气
- 配置全局规则
- 配置欢迎语和首轮引导策略

建议区块：

- 角色与目标
- Personality / Tone
- 全局 Rules
- Greeting
- 特殊场景处理
- 小聊与兜底策略

这个页面不应与 Flow 混合。  
Flow 节点里可以引用 Agent 层规则，但不应该在节点里重新定义整个机器人角色。

#### 2. Knowledge / 意图技能 页面

职责：

- 保留当前已有的意图技能、知识库、弱结构化对话能力
- 承担“不是强流程”的能力

与 Flow 的关系：

- Intent 负责“该不该进入结构化处理”
- Flow 负责“已经进入结构化处理后怎么一步步完成”

#### 3. Flows 页面

职责：

- 多 flow 管理
- flow 内节点和边编排
- 节点右侧抽屉编辑
- 边条件编辑
- 独立场景调试

这就是当前 `FlowStudio` 应该持续演进的主页面。

建议页面结构：

- 左侧：flow 列表、entry flow、子 flow 排序与切换
- 中间：画布
- 右侧：节点配置 / 边配置 / flow 配置
- 底部或弹层：调试器
- 画布角落：保存、全屏、缩放、适配视图

#### 4. Tools 页面

职责：

- 全局函数列表
- 工具定义
- 代码块
- 变量
- start function / end function

和 Flow 的关系：

- Flow 节点里只做“引用”
- Tool 本体在独立页面管理
- 节点右侧抽屉负责选择 `visible tools / transition functions / code blocks`

#### 5. Handoffs 页面

职责：

- 配置转人工目标
- 配置转接原因和规则
- 配置失败兜底流向

和 Flow 的关系：

- Flow 节点里仅引用 `handoff target`
- 转人工的目标池和策略不要写死在单个 exit 节点里

### 5.2 Channels 域页面

#### 1. Voice 页面

职责：

- 语音模型选择
- 语音音色
- greeting
- disclaimer
- silence timeout
- max call duration
- end-of-call behavior

注意：

- Greeting 不应再作为 Flow 的开始节点描述
- 这是独立的语音通道行为页

#### 2. Speech Recognition 页面

职责：

- 全局 keyphrase boosting
- transcript corrections
- 识别调优预设

与 Flow 的关系：

- 全局识别能力在本页配置
- Flow 节点里只补 `per-step biasing` 和 `input mode`

#### 3. Response Control 页面

职责：

- stop keywords
- pronunciations
- 输出风险词兜底

这是输出治理页，不是 Flow 页的子面板。

### 5.3 Configure 域页面

#### 1. APIs 页面

职责：

- 外部 API 注册
- 鉴权信息
- 环境隔离
- mock / sandbox 标记

与 Flow / Tools 的关系：

- Flow 节点不直接维护 URL 和 token
- Tool/Function 仅引用 API registry 的条目

#### 2. Numbers / 渠道接入 页面

职责：

- 电话号码
- 呼入呼出接入
- 渠道绑定

#### 3. Metrics / CSAT 页面

职责：

- 采集指标
- 满意度配置
- 运营统计口径

### 5.4 Analytics 域页面

#### 1. 调试场景

职责：

- 维护 mock inputs
- 初始 state
- 预期路径

当前项目已有 `debugScenarios`，已经是一个很好的起点。

#### 2. Diagnosis

职责：

- 看单次会话的节点命中
- 看 state 演进
- 看重试、失败、handoff 原因

这比单纯 transcript 更接近 PolyAI 的心智。

#### 3. Test Suite

职责：

- 场景级回归用例
- 对比版本前后结果
- 记录 pass / fail

#### 4. Dashboards

职责：

- 完成率
- 转人工率
- 重试耗损
- CSAT
- 平均通话时长

### 5.5 Deployments 域页面

职责：

- 环境隔离
- 草稿、预发、正式版本
- 发布记录
- 差异比对

如果未来做真执行，这一层不是增强项，而是必需项。

---

## 6. Flow 页面内部结构映射

这一节只聚焦当前用户最关心的 `流程配置` 页面。

### 6.1 当前页面的正确定位

当前 `FlowStudio` 的正确定位是：

- 它不是“整个机器人配置页”的补丁
- 它是 `Build > Flows` 的独立工作台
- 它要表达的是“结构化对话编排能力”

### 6.2 页面分区建议

#### 左侧：Flow 列表

承载能力：

- 主入口 flow
- 子 flow
- flow 顺序与切换
- flow 概览统计

建议显示：

- flow 名称
- entry 标记
- step 数
- entity 数
- retry 节点数
- 是否存在未配置项

#### 中间：画布

承载能力：

- 拖拽创建 step
- 连接边
- 选中节点/边
- 节点状态标签

画布工具箱建议只保留三类基础节点：

- Start
- Step
- Exit

原因：

- 这更接近 PolyAI 的心智
- `Step` 的真实差异由右侧配置里的 `stepType` 控制
- 不需要在左侧再拆三四种外观接近的 step 节点

#### 右侧：配置抽屉

承载能力：

- 节点配置
- 边配置
- 当前 flow 配置

抽屉切换原则：

- 点 step 节点，显示 step 详情
- 点 exit 节点，显示 exit / goto flow / handoff 配置
- 点边，显示条件和优先级
- 点 flow 空白态或 flow 项，显示 flow 元信息

#### 独立调试面板

承载能力：

- 选择调试场景
- 输入 mock user utterances
- 看节点命中路径
- 看 state 变化
- 看退出原因

调试器不应继续塞在右侧抽屉里。  
它应该是单独的大面板、底部面板或全屏弹层。

---

## 7. Flow 能力到页面元素的细粒度映射

| PolyAI Flow 能力 | 我们 Flow 页应该怎么表达 | 建议位置 |
| --- | --- | --- |
| Entry flow | 标记唯一入口 flow | 左侧 flow 列表 |
| Sub flow | 支持多个 flow | 左侧 flow 列表 |
| Start node | flow 起点 | 画布节点 |
| Default step | 常规主力 step | 画布节点 + 右侧抽屉 |
| Function step | 代码/逻辑主导 step | `Step` 节点的 `stepType=function` |
| Collect step | 实体采集 step | `Step` 节点的 `stepType=collect` |
| Advanced step | 语音增强 / DTMF / 强输入模式 step | `Step` 节点的 `stepType=advanced` |
| Exit | 结束、停止、转人工、goto flow | Exit 节点 |
| Transition functions | 当前 step 的流转控制函数 | 节点右侧抽屉 |
| Visible tools/functions | 当前 step 可调用动作 | 节点右侧抽屉 |
| Few-shot prompting | step 示例输入输出 | 节点右侧抽屉 |
| Entity collection | 实体名、类型、提示词、必填、输入模式 | 节点右侧抽屉 |
| Retry policy | 次数、no-input、no-match、fallback target | 节点右侧抽屉 |
| Edge conditions | 条件文案、优先级、默认/兜底 | 边右侧抽屉 |
| DTMF | 按键模式、最大位数、terminator | 节点右侧抽屉 |
| Per-step ASR biasing | 当前 step 的识别偏置 | 节点右侧抽屉 |
| goto flow | 跳子流程 | 节点右侧抽屉或 Exit 节点 |
| Debug trace | 路径、state、重试耗尽 | 独立调试面板 |

---

## 8. 数据模型映射

这一节直接对应 `types.ts` 该怎么演进。

## 8.1 当前已有的数据模型优点

当前项目已经有这些正确方向：

- `FlowConfig.entryFlowId`
- `FlowConfig.flows[]`
- `FlowConfig.functions[]`
- `FlowConfig.debugScenarios[]`
- `FlowNodeData.stepPrompt`
- `FlowNodeData.entityConfig`
- `FlowNodeData.retryConfig`
- `FlowEdge.edgeType / conditionSummary / priority`

这说明基础骨架已经具备。

## 8.2 当前数据模型的主要缺口

目前最主要的缺口有六类：

1. `FlowStepKind` 没有 `advanced`
2. `FlowNodeData` 缺少更明确的 `tool references / code block references / handoff references`
3. `FlowEntityConfig` 的 DTMF 能力过弱
4. `FlowEdge` 只有摘要，没有结构化条件表达
5. `FlowConfig` 还没把 `voice / speech / response control / handoffs / api registry references` 分离出去
6. `debugScenarios` 还不足以表达“预期路径”和“断言结果”

## 8.3 建议的目标数据结构

下面不是要求一次性全部实现，而是建议的目标方向。

### FlowStepKind

```ts
export type FlowStepKind =
  | 'default'
  | 'function'
  | 'collect'
  | 'advanced'
  | 'exit';
```

### StepPromptConfig

```ts
export interface StepPromptConfig {
  prompt: string;
  visibleFunctionIds: string[];
  transitionFunctionIds: string[];
  visibleToolIds?: string[];
  codeBlockIds?: string[];
  fewShotMode?: 'off' | 'inline' | 'library';
}
```

### FlowEntityConfig

```ts
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
  validationPattern?: string;
  options?: string[];
}
```

### FlowRetryConfig

```ts
export interface FlowRetryConfig {
  enabled: boolean;
  maxAttempts: number;
  noInputPrompt?: string;
  noMatchPrompt?: string;
  confirmationPrompt?: string;
  fallbackTargetId?: string;
  fallbackAction?: 'goto_node' | 'goto_flow' | 'handoff' | 'exit';
  fallbackFlowId?: string;
  repromptDelayMs?: number;
}
```

### FlowEdge

```ts
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  edgeType?: 'normal' | 'conditional' | 'fallback' | 'goto_flow';
  conditionSummary?: string;
  priority?: number;
  transitionFunctionId?: string;
  debugRule?: 'always' | 'condition' | 'entity_collected' | 'retry_exhausted';
  condition?: {
    mode: 'expression' | 'entity' | 'intent' | 'state';
    expression?: string;
    entityName?: string;
    operator?: 'exists' | 'equals' | 'not_equals' | 'contains';
    value?: string;
  };
}
```

### FlowNodeData

```ts
export interface FlowNodeData {
  name: string;
  description?: string;
  stepType?: FlowStepKind;
  stepPrompt?: StepPromptConfig;
  entityConfig?: FlowEntityConfig;
  retryConfig?: FlowRetryConfig;
  gotoFlowId?: string;
  exitType?: ExitNodeType;
  handoffTargetId?: string;
  handoffReason?: string;
  toolIds?: string[];
  codeBlockIds?: string[];
  variableBindingIds?: string[];
  asrBiasingPresetId?: string;
  debugMeta?: {
    expectedIntent?: string;
    notes?: string;
  };
  [key: string]: any;
}
```

### FlowDebugScenario

```ts
export interface FlowDebugScenario {
  id: string;
  name: string;
  initialState: Record<string, any>;
  mockInputs: string[];
  expectedFlowId?: string;
  expectedExitType?: ExitNodeType;
  expectedPath?: string[];
  assertions?: Array<{
    type: 'state' | 'path' | 'exit';
    key?: string;
    operator?: 'equals' | 'contains' | 'exists';
    value?: any;
  }>;
}
```

---

## 9. 当前代码与目标架构的对应关系

这一节把“已有组件”直接映射到“未来产品模块”，方便后续逐步演进，不必推倒重来。

| 现有代码 | 当前职责 | 对应未来模块 | 建议 |
| --- | --- | --- | --- |
| `components/bot/BotConfigForm.tsx` | 机器人配置总入口 | Bot 配置容器 | 继续作为承载页，但内部 tab 要越来越清晰 |
| `components/bot/intent/BotIntentConfig.tsx` | 旧意图技能 / 旧编排 | Build > Knowledge / 意图技能 | 保留，不与新 Flow 合并 |
| `components/flow/FlowStudio.tsx` | 新 Flow 工作台 | Build > Flows | 继续作为主原型页 |
| `components/flow/FlowCanvas.tsx` | 画布与节点交互 | Flow 页面中心画布 | 继续演进 |
| `components/flow/FlowNodeConfig.tsx` | 节点右侧抽屉 | Flow 节点编辑器 | 继续做深 |
| `components/flow/FlowEdgeConfig.tsx` | 边条件编辑器 | Flow 边编辑器 | 继续做深 |
| `components/flow/FlowDebugPanel.tsx` | 场景调试 | Analytics > 调试 / Flow 内调试器 | 后续可拆成独立页 |
| `components/flow/flowDebugSimulation.ts` | 前端半模拟执行器 | 调试运行时 | 继续保留 |
| `types.ts` | Flow 数据结构 | 统一前端 schema | 按本文件建议扩展 |

---

## 10. 原型阶段的页面优先级

如果目标是“先把全量能力展示完整，但仍是前端原型”，建议页面建设顺序如下。

### P0：必须先完整

- `Build > Flows`
- `Build > Agent`
- `Build > Tools`
- `Channels > Voice`

原因：

- 这是用户最容易感知“像不像 PolyAI”的第一层
- 也是当前原型最接近真实产品的主演示路径

### P1：补齐语音专属治理

- `Channels > Speech Recognition`
- `Channels > Response Control`
- `Build > Handoffs`
- `Configure > APIs`

### P2：补齐平台感

- `Analytics > Test Suite`
- `Analytics > Diagnosis`
- `Analytics > Dashboards`
- `Deployments > Environments / Versions`

---

## 11. 对当前项目最重要的直接建议

### 11.1 不要再把所有能力继续塞进 Flow 右侧抽屉

应该留在 Flow 抽屉里的只有：

- 当前节点配置
- 当前边配置
- 当前 flow 配置
- 引用工具、代码块、transition function

不应该继续塞进去的包括：

- Voice 全局设置
- 全局 Speech Recognition
- 全局 Response Control
- API Registry
- Handoff 目标池

### 11.2 Flow 节点仍然只保留 `Start / Step / Exit`

但 `Step` 要在右侧支持切换：

- 默认 step
- function step
- collect step
- advanced step

这比在左侧工具箱做很多相似节点更贴近 PolyAI。

### 11.3 `Tools` 应从“节点内配置”升级为“独立模块 + 节点引用”

这件事非常关键。  
如果工具、代码块、变量一直只存在节点表单里，产品很难长成平台。

### 11.4 `debugScenarios` 应升级成准测试用例

当前项目已经有 `debugScenarios`。  
下一步最有价值的升级，不是把 UI 做更花，而是让它支持：

- 预期路径
- 预期退出
- 关键 state 断言

这样后续就能自然长到 `Test Suite`。

### 11.5 `FlowConfig` 最终不应承担整个语音平台的全部配置

建议未来将机器人配置拆成：

- `agentConfig`
- `knowledgeConfig`
- `flowConfig`
- `toolConfig`
- `voiceConfig`
- `speechRecognitionConfig`
- `responseControlConfig`
- `handoffConfig`
- `apiRegistryConfig`
- `analyticsConfig`
- `deploymentConfig`

`flowConfig` 只保留 `Flows` 域数据。

---

## 12. 一个可执行的产品结构草案

为了让这份文档更直接，下面给出一个更贴近项目的页面组织草案。

### 机器人配置

#### 基础配置

- 机器人名称
- 业务线
- 渠道

#### Build

- Agent
- 意图技能
- 流程配置
- 工具与代码块
- 转人工

#### Channels

- Voice
- Speech Recognition
- Response Control

#### Configure

- APIs
- 渠道号码
- 指标与 CSAT

#### Analytics

- 场景调试
- 诊断
- 测试集
- 看板

#### Deployments

- 环境
- 版本

这个结构的好处是：

- 保留现有“机器人配置”的使用习惯
- 不必一下子做出完整平台级导航
- 但内部结构已经按 PolyAI 官方模型分层

---

## 13. 结论

这份映射文档的核心判断只有三条：

1. `流程配置` 应继续做强，但它只是 `Build > Flows`，不是整个语音 agent 平台。
2. 我们产品如果要真正长得像 PolyAI，必须把 `Voice / Speech / Response Control / Tools / Handoffs / QA / Deployments` 从 Flow 页里拆出来。
3. 当前项目的 `FlowStudio + FlowConfig + debugScenarios` 已经是很好的起点，下一步最值得做的是页面分层和数据模型补齐，而不是继续把所有能力塞进单一画布。

---

## 14. 建议的下一份文档

基于当前两份研究文档，下一份最值得补的是下面二选一：

- `流程配置原型缺口清单`
- `从前端原型到真实运行时的 schema 设计`

如果继续做，我建议先写第二份。  
因为页面可以后补，但 schema 一旦乱了，后面所有原型页都会越做越难收敛。
