# PolyAI Flow Workbench 原型设计

## 背景

当前项目已经有两套与流程相关的能力：

- 旧的“意图技能 / 流程编排”，入口在 [components/bot/intent/BotIntentConfig.tsx](C:/Users/13609/.trae-cn/AI-voice-bot/components/bot/intent/BotIntentConfig.tsx)
- 新增中的 `流程配置` 原型页，入口在 [components/bot/BotConfigForm.tsx](C:/Users/13609/.trae-cn/AI-voice-bot/components/bot/BotConfigForm.tsx)，底层字段为 `BotConfiguration.flowConfig`

用户已确认以下产品方向：

- 保留旧的“意图技能 / 流程编排”
- 将 `流程配置` 作为新的独立原型页
- 原型用于内部评审，不是对外售前页面
- 目标是“产品能力全量”展示，不是先跑一个业务闭环
- 本阶段只需要前端可配置、可切换、可半模拟调试
- 页面需要支持类似 Axure 的标号，点击标号后展示对应 PRD 说明

这意味着新原型不应改造旧系统的主路径，而应作为未来 Flow 产品形态的“独立工作台”。

## 目标

在现有 `机器人配置 / 流程配置` tab 内，构建一个接近 PolyAI Flow 的工作台式原型，完整展示以下能力面：

- 入口 Flow 与子 Flow 管理
- Start / Default / Function / Exit 等节点语义
- step prompt、visible functions、transition functions、few-shot 示例
- 实体采集、边条件、重试策略、退出方式
- 半模拟调试，包括 step 流转、state 变化、重试与 exit 演示
- Axure 式标号与 PRD 联动说明

## 非目标

以下内容明确不纳入本轮原型范围：

- 接真实后端执行引擎
- 调用真实 LLM 或 PolyAI API
- 与旧 `intents.flowCanvas` 的双向转换
- 完整权限、发布、版本管理、多人协作
- 真实运行时校验器和生产级导出格式

## 方案选择

评估过三种方案：

1. Flow 工作台
2. 旧编辑器叠加标号和少量新术语
3. 编辑态 / 评审态双视图

最终选用 `Flow 工作台`，原因如下：

- 最贴合当前代码现状。现有 [components/flow/FlowEditor.tsx](C:/Users/13609/.trae-cn/AI-voice-bot/components/flow/FlowEditor.tsx) 已经是“中间画布 + 右侧属性面板”的雏形。
- 最适合内部评审。评审者可以同时看到结构、配置、调试和 PRD，不需要频繁切换页面。
- 最容易承载“能力全量展示”。入口 flow、子 flow、节点类型、调试信息、PRD 标注都能放在同一个工作台里。
- 与旧系统隔离最清晰。新页只使用 `flowConfig`，不入侵旧的 `intents` 结构。

## 信息架构

新 `流程配置` 页调整为四区工作台。

### 1. 顶部工具栏

职责：

- 选择当前机器人下的 Flow 工作模式
- 保存原型
- 切换视图模式
- 切换标号模式
- 进入半模拟调试

建议控件：

- `Flow 列表 / Canvas / 调试` 视图标签
- `标号模式` 开关
- `保存原型` 按钮
- `重置视图` / `缩放`

### 2. 左侧导航区

职责：

- 展示入口 Flow 与子 Flow 列表
- 创建、重命名、删除子 Flow
- 标记某个 Flow 是否为 Entry Flow
- 展示每个 Flow 的节点数、实体数、重试点数量

建议结构：

- `主入口 Flow`
- `身份验证 Flow`
- `查询订单 Flow`
- `转人工 Flow`
- `结束处理 Flow`

说明：

- 左侧不是旧的“意图技能列表”
- 每个机器人只有一套 `flowConfig`，其中包含多个 flows
- 入口 flow 必须唯一

### 3. 中间 Canvas 区

职责：

- 绘制当前选中的 flow
- 拖拽节点
- 建立边连接
- 显示节点类型、状态、关键能力标签
- 在标号模式下叠加 PRD 热点编号

画布上需要支持的节点语义：

- `Start`
- `Default Step`
- `Function Step`
- `Entity Collect Step`
- `Exit`

说明：

- 本轮不必强行把每种语义拆成完全不同的 React 组件
- 可以先以 `FlowNodeType.DEFAULT` 为主，再通过 `node.data.stepType` 等字段表达更细分的语义
- UI 层上仍然要让评审者能一眼看懂“这是默认 step / function step / collect step”

### 4. 右侧上下文面板

右侧面板必须是多模式切换，而不是固定只显示节点配置。

建议三态：

- `节点配置`
- `PRD 说明`
- `调试详情`

节点配置态用于编辑当前节点。  
PRD 说明态用于查看当前标号热点对应的需求描述。  
调试详情态用于展示当前 step 输入、输出、state、边条件命中和退出原因。

这是整个工作台最关键的设计点。它允许一个页面同时承担编辑、评审和半模拟演示三种职责。

## 核心能力清单

### Flow 层

工作台原型需要展示的 Flow 层能力：

- 多 Flow 管理
- 唯一入口 Flow
- Flow 间跳转
- 子 Flow 引用
- Exit 方式区分

建议新增字段：

- `FlowConfig.entryFlowId`
- `FlowConfig.flows`
- 每个 `flow` 持有自身的 `nodes`、`edges`、`metadata`

当前 `FlowConfig` 只有一组 `nodes` / `edges`，不足以表达入口 Flow 和子 Flow。

### 节点层

节点层原型需要覆盖：

- 节点名称与说明
- step prompt
- visible functions
- transition functions
- few-shot 示例
- 实体采集配置
- 重试策略
- 边条件
- 退出类型

建议将节点数据补充为统一结构，而不是继续只依赖少量自由字段。

建议增加：

- `stepType`: `default | function | collect | exit`
- `entityConfig`
- `retryConfig`
- `transitionPrompt`
- `debugMeta`

### 边层

边不能再只是 `source/target/label`。

原型要展示的边能力：

- 条件文案
- 命中规则摘要
- 优先级
- 默认分支 / fallback 分支
- Flow 间跳转边

建议边结构支持：

- `conditionSummary`
- `edgeType`: `normal | conditional | fallback | goto_flow`
- `priority`
- `debugHint`

### 调试层

半模拟调试要体现的是“产品形态”，不是算法精度。

必须能展示：

- 当前 step 高亮
- 当前 state
- 最近一次输入
- 命中的边
- 重试次数
- 最终 exit reason

不要求：

- 真正执行 prompt
- 真实调用函数
- 真实解析表达式

调试器只需通过前端规则和预设 mock 流程推进。

## Axure 标号与 PRD 联动

这是本轮新增要求，且对内部评审非常重要。

### 目标

让评审者像看 Axure 一样：

- 打开 `标号模式`
- 页面热点出现编号
- 点击编号
- 右侧展示该功能点的 PRD 说明、价值、规则、限制

### 热点范围

不是只有节点才能打标号。以下区域都应允许打标：

- 左侧 Flow 列表
- 入口 Flow 标记
- 节点类型区
- step prompt 编辑器
- visible / transition functions 区
- 实体采集配置区
- 重试策略区
- 半模拟调试面板

### 结构建议

在 `flowConfig` 外另增一份页面级评审数据，而不是把 PRD 文案塞进每个节点本体。

建议结构：

- `flowPrototypeAnnotations`
  - `id`
  - `targetType`
  - `targetId`
  - `index`
  - `title`
  - `summary`
  - `details`
  - `status`

这样后续可以在页面任意区域叠加热点，不局限于画布内节点。

### 右侧 PRD 面板内容

点击编号后建议展示：

- 功能点标题
- 所属模块
- 目标用户
- 交互规则
- 需要展示的状态
- 本轮原型是否已覆盖
- 后续真实实现的差距

这会让原型从“能看”变成“能评审”。

## 数据模型调整建议

当前 [types.ts](C:/Users/13609/.trae-cn/AI-voice-bot/types.ts) 中的 `FlowConfig` 仍是单 flow 结构：

- `id`
- `name`
- `nodes`
- `edges`

建议升级为：

- `id`
- `name`
- `entryFlowId`
- `flows`
- `annotations`
- `debugScenarios`
- `metadata`

其中：

- `flows` 用于表达主入口和多个子 flow
- `annotations` 用于 Axure 标号 PRD
- `debugScenarios` 用于半模拟调试预置

这一点是本轮设计里最重要的数据变更。如果不做，入口 flow、子 flow 和标号系统都会被迫塞进不合适的字段。

## 组件层改造建议

### [components/bot/BotConfigForm.tsx](C:/Users/13609/.trae-cn/AI-voice-bot/components/bot/BotConfigForm.tsx)

保留 `流程配置` tab，但将其定位改为“Flow 工作台原型页”。

需要补充：

- 传入新的多 flow 数据结构
- 传入 annotations
- 传入 debug scenario 数据
- 提供 `标号模式` 开关

### [components/flow/FlowEditor.tsx](C:/Users/13609/.trae-cn/AI-voice-bot/components/flow/FlowEditor.tsx)

从“单画布编辑器”提升为“工作台主容器”。

建议职责变化：

- 管理当前选中的 flow
- 管理当前选中的节点 / 边
- 管理右侧面板模式
- 管理标号模式
- 管理半模拟调试会话

换句话说，`FlowEditor` 应该不只是 editor，而是 workbench。

### [components/flow/FlowNodeConfig.tsx](C:/Users/13609/.trae-cn/AI-voice-bot/components/flow/FlowNodeConfig.tsx)

扩成真正的节点配置器，覆盖：

- 节点基本信息
- step prompt
- visible / transition functions
- few-shot
- 实体采集
- 重试策略
- Exit 方式

当前已有的 prompt、函数绑定、few-shot 基础可以复用，但还缺实体采集和重试。

### 新增建议组件

建议新增以下组件，而不是把所有逻辑都继续堆进 `FlowEditor`：

- `FlowListPanel`
- `FlowCanvas`
- `FlowTopToolbar`
- `FlowAnnotationPanel`
- `FlowAnnotationOverlay`
- `FlowDebugPanel`
- `FlowEntityConfigSection`
- `FlowRetryConfigSection`

这样可以把“编辑”“评审”“调试”三类逻辑拆开，避免单文件继续膨胀。

## 半模拟调试设计

### 调试目标

调试器不是为了验证算法，而是为了演示产品能力：

- 输入一句用户话术
- 看到当前 flow 入口
- 看到 step 如何推进
- 看到 state 如何变化
- 看到条件分支如何命中
- 看到重试和 exit 如何发生

### 推荐交互

调试面板分为四块：

- `输入区`
- `State 区`
- `执行轨迹区`
- `当前节点详情区`

### 执行方式

使用“前端规则驱动”的假执行：

- Collect step 根据用户输入写入 mock entity
- Function step 写入 mock state
- Conditional edge 根据预设规则选边
- Retry 根据本地计数器推进
- Exit 输出固定结果

只要轨迹可信，内部评审就能理解产品方向，不需要真实引擎。

## 评审展示顺序

为了内部评审，页面和数据建议默认内置一套 demo：

1. 主入口 Flow
2. 身份验证子 Flow
3. 订单查询子 Flow
4. 转人工 Flow

推荐默认演示链路：

- 主入口
- 收集手机号
- 进入身份验证子 Flow
- 验证失败触发重试
- 超限后转人工

这条链路最能覆盖全量能力面：

- 入口 flow
- 子 flow
- collect
- transition
- state
- retry
- exit

## 风险与约束

### 风险 1：继续复用单 flow 数据结构会把原型做死

如果坚持单一 `nodes/edges` 模型，后续入口 flow、子 flow、标号系统都会变成 UI 侧 hack。

### 风险 2：PRD 标号直接写进节点会耦合过重

评审标号是页面级能力，不应依附于某一种节点类型。

### 风险 3：调试器如果追求“像真的”，会迅速扩张成引擎

本轮必须坚持“半模拟”，否则范围会失控。

## 最终结论

本轮 `流程配置` 原型应被实现为一个独立的 `Flow Workbench`：

- 不替代旧的“意图技能”
- 以 `flowConfig` 为独立数据入口
- 支持多 flow 管理、节点能力配置、半模拟调试
- 支持 Axure 式标号与 PRD 联动

如果后续评审通过，再考虑把这套工作台逐步演进为真正的主流程配置方式。
