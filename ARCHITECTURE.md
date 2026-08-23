# AI 语音机器人前端架构文档

更新时间：2026-08-18

## 1. 项目定位

这是一个面向 AI 语音客服、外呼运营和流程编排的前端演示项目。它用一个浏览器页面模拟“机器人配置、话术与流程、知识库、工具调用、外呼任务、通话记录和监控报表”等后台能力，主要用于产品原型展示和功能验证。

当前项目以前端本地状态和模拟数据为主，少量能力会调用外部 AI 服务生成提示词。

## 2. 技术架构

- **前端框架**：React 19 + TypeScript。
- **构建工具**：Vite。
- **样式体系**：Tailwind CSS + 少量全局 CSS。
- **图标与图表**：lucide-react 提供图标，recharts 提供报表图表。
- **AI 能力**：`@google/genai` 用于 Gemini 提示词生成。
- **数据来源**：大多数业务数据在组件或 `services/` 中模拟；函数目录、问答分类等少量内容使用浏览器 `localStorage` 保存。

## 3. 总体分层

```text
index.html
  ↓
index.tsx
  ↓
App.tsx
  ├─ components/ui：公共布局与表单控件
  ├─ components/bot：机器人配置中心
  ├─ components/flow：单次通话流程编排、长期任务流程配置与调试
  ├─ components/knowledge：问答、知识发现、RAG 配置
  ├─ components/tools：工具与 MCP 配置
  ├─ components/outbound、marketing、call、report：运营闭环
  └─ services：AI、模拟接口、RAG、向量检索、配置存取
       ↓
types.ts：全项目共享的数据结构

manual/：Docusaurus 操作手册源码
  ↓ npm run build:docs
public/docs/：构建期文档静态文件
  ↓ vite build
dist/docs/：与主系统一起部署的 /docs 子页面
```

## 4. 关键数据流

1. `index.tsx` 挂载 React 应用，加载 `App.tsx`。
2. `App.tsx` 维护顶层菜单、机器人列表、信息提取配置和营销活动等核心状态。
3. 用户在侧边栏选择菜单后，`App.tsx` 根据菜单名渲染对应业务模块。
4. 机器人配置由 `BotConfigForm` 汇总多个子配置页，保存后回写 `App.tsx` 的机器人列表。
5. 流程模块分为两类：单次通话 Flow 使用 `FlowConfig / FlowDefinition / FlowNode / FlowEdge` 等类型描述；任务流程配置使用方案列表、流程画布、节点/连线配置和运行任务视图描述多 Agent、跨天等待和人工兜底。
6. 服务层提供模拟接口、提示词生成、RAG 检索、向量库、函数目录和问答分类存取，供页面按需调用。
7. 客户画像、营销活动和自动跟进共享模拟数据；机器人配置决定是否启用识别、推荐、跟进、触达保护和结果回写。
8. `manual/` 保留操作手册源码；本地开发时由独立文档服务实时编译，并由 Vite 将 `/docs` 转发过去；正式构建时先生成 `public/docs/`，再一并输出到 `dist/docs/`。主系统侧边栏和文档导航负责双向跳转。

## 5. 根目录文件职责

| 文件/目录 | 职责 |
| --- | --- |
| `index.html` | Vite 应用的 HTML 入口，提供 React 挂载节点。 |
| `index.tsx` | React 启动入口，把 `App` 渲染到页面中。 |
| `App.tsx` | 应用总控制器，维护顶层状态并按菜单切换页面模块。 |
| `InformationExtraction.tsx` | 信息提取配置页，切换接口配置和触发器设置两个子页。 |
| `types.ts` | 全项目核心类型定义，覆盖机器人、流程、工具、知识库、外呼、报表等数据结构。 |
| `src/index.css` | 全局样式与 Tailwind 基础样式入口。 |
| `vite.config.ts` | Vite 构建配置。 |
| `tailwind.config.js` | Tailwind 主题和扫描范围配置。 |
| `postcss.config.js` | Tailwind 与 Autoprefixer 的 PostCSS 配置。 |
| `tsconfig.json` | TypeScript 编译配置。 |
| `package.json` | 项目依赖和 `dev/build/preview` 命令。 |
| `metadata.json` | AI Studio 应用元信息。 |
| `DESIGN.md` | 项目级 UI/UX 设计基线，约束报表和后台页面的交互状态、信息层级和视觉风格。 |
| `README.md` | 项目运行说明。 |
| `CONTEXT.md` | 当前工作进度和关键决定记录。 |
| `PRD_AI_Prompt_Generator.md` | AI 提示词生成器相关产品需求文档。 |
| `docs/` | 展示材料和需求文档存放目录。 |
| `docs/html-showcase/` | 所有静态 HTML 设计展示稿的统一存放目录，`index.html` 提供搜索、分组筛选和内嵌预览。 |
| `manual/` | 从 `voice_agent_docs` 融合进来的 Docusaurus 操作手册子项目，包含正文、目录、图片和本地全文搜索配置。 |
| `public/docs/` | 操作手册的临时构建结果，由构建命令生成，不提交版本库。 |
| `.trae/` | 历史产品方案、规格和实施计划资料。 |
| `测试用例文档/` | 手工测试和产品逻辑说明文档。 |
| `tests/` | 组件渲染和关键逻辑的自动化测试文件。 |
| `.tmp-flow-node-config-test.cjs` | 临时测试脚本，不属于正式运行架构。 |

## 6. 业务模块职责

### 6.1 公共 UI：`components/ui`

| 文件 | 职责 |
| --- | --- |
| `LayoutComponents.tsx` | 提供侧边栏和顶部标题栏，并通过“操作手册”入口跳转到 `/docs`。 |
| `FormComponents.tsx` | 提供通用输入框、选择器、标签、开关等表单控件。 |
| `PromptEditor.tsx` | 提供提示词编辑体验，支持变量或结构化内容编辑。 |

### 6.2 机器人配置：`components/bot`

| 文件 | 职责 |
| --- | --- |
| `BotListView.tsx` | 展示机器人列表，并提供新建、编辑、删除入口。 |
| `BotConfigForm.tsx` | 机器人配置总表单，组织基础、策略、知识、意图、流程等多个配置页。 |
| `AgentOrchestrationConfig.tsx` | 机器人级多 Agent 编排工作区，负责独立模式草稿、画布交互、节点与模式化边配置、校验和保存。 |
| `agentOrchestrationData.ts` | 多 Agent 默认配置、图快照、节点与边工厂、IVR 目标汇总及运行语义校验。 |
| `BotBasicConfig.tsx` | 配置机器人名称、模型、语音、识别等基础信息。 |
| `BotStrategyConfig.tsx` | 配置欢迎语、转人工、挂机、静默、安全护栏、全局异常兜底和语音优化策略。 |
| `BotBusinessConfig.tsx` | 配置业务参数、标签和上下文等业务相关信息。 |
| `BotVariableConfig.tsx` | 管理机器人变量、实体和状态变量。 |
| `BotAgentConfig.tsx` | 管理 Agent 工具、MCP 服务和函数调用相关配置。 |
| `BotKnowledgeConfig.tsx` | 配置知识空间、问答能力和 RAG 相关绑定。 |
| `BotIntentConfig.tsx` | 管理机器人意图、相似问法和意图内微流程。 |
| `BotDebugConfig.tsx` | 提供机器人调试配置入口。 |
| `BotTestConfig.tsx` | 管理测试用例、测试会话和结果展示。 |
| `BotTopicManager.tsx` | 组合主题匹配设置与原主题列表，并管理普通主题和流程主题的增删改查。 |
| `TopicMatchingSettings.tsx` | 提供默认收起的主题匹配设置，配置历史消息条数和是否优先匹配上一轮主题。 |
| `BotTriggerManager.tsx` | 管理机器人触发条件和触发动作。 |
| `BotMarketingConfig.tsx` | 配置机器人级客户运营能力绑定，包括画像识别、营销活动、自动跟进规则、策略模板与结果回写。 |
| `PromptGeneratorModal.tsx` | 调用 Gemini 服务生成或优化机器人提示词。 |

#### Agent 工具子模块：`components/bot/agent`

| 文件 | 职责 |
| --- | --- |
| `AgentToolModal.tsx` | 新建或编辑单个 Agent 工具，并配置按参数分级的自动执行、用户确认和人工审批规则。 |
| `McpServerModal.tsx` | 新建或编辑机器人级 MCP 服务配置。 |
| `QuickAddToolPanel.tsx` | 提供常用工具快速添加入口。 |
| `ToolCategorySection.tsx` | 按类别展示工具卡片，并承接编辑、启停、删除操作。 |

#### 意图与微流程子模块：`components/bot/intent`

| 文件 | 职责 |
| --- | --- |
| `BotIntentConfig.tsx` | 意图配置总入口，管理意图列表和每个意图的配置。 |
| `MicroFlowEditor.tsx` | 编辑意图内的小型节点流程。 |
| `IntentFlowDebugger.tsx` | 模拟意图流程执行并展示节点运行状态。 |
| `DebugNodePanel.tsx` | 展示单个调试节点的执行详情。 |
| `ExecutionTimeline.tsx` | 展示流程调试过程的时间线。 |
| `EdgeTransitionEditor.tsx` | 配置节点连线、分支和跳转条件。 |
| `VariableInspector.tsx` | 查看调试过程中的变量和值。 |
| `NodeFormHelpers.tsx` | 提供意图节点表单的公共辅助组件。 |

#### 意图节点配置：`components/bot/intent/nodes`

| 文件 | 职责 |
| --- | --- |
| `AudioSelector.tsx` | 选择语音、背景音或录音资源。 |
| `CognitiveConfig.tsx` | 配置 AI 理解、意图判断和知识调用类节点。 |
| `DataConfig.tsx` | 配置数据读取、接口请求和变量写入类节点。 |
| `ExtractionRuleConfig.tsx` | 配置信息抽取规则。 |
| `InteractionConfig.tsx` | 配置播放、收集、等待等用户交互节点。 |
| `LogicConfig.tsx` | 配置判断、分支和变量运算类节点。 |
| `SimpleErrorHandling.tsx` | 配置节点异常、超时和兜底处理。 |
| `VisualConditionBuilder.tsx` | 用可视化方式编辑条件表达式。 |

### 6.3 流程编排：`components/flow`

| 文件 | 职责 |
| --- | --- |
| `FlowOrchestration.tsx` | 旧版流程编排页面，直接在画布中维护节点和连线。 |
| `FlowStudio.tsx` | 新版流程工作台入口，组织画布、配置抽屉、调试和版本管理。 |
| `FlowWorkbench.tsx` | 多 Flow 工作台，支持左侧流程列表、右侧配置面板和注释/调试。 |
| `FlowWorkbenchPrototype.tsx` | 工作台原型展示组件。 |
| `FlowEditor.tsx` | 传统流程编辑器，提供节点拖拽、缩放、保存和基础配置。 |
| `FlowCanvas.tsx` | 流程画布，负责节点、连线、工具箱、缩放和平移交互。 |
| `FlowNodeConfig.tsx` | 配置单个流程节点，并支持 Step 继承或覆盖机器人全局异常策略。 |
| `FlowWorkbenchNodeConfig.tsx` | 工作台版节点配置面板，覆盖步骤、采集、函数和退出配置。 |
| `FlowEdgeConfig.tsx` | 配置流程连线、条件、优先级和跳转规则。 |
| `FlowConfigPanel.tsx` | 配置整个 Flow 的基础信息和元数据。 |
| `FlowDebugPanel.tsx` | 选择场景并查看流程模拟执行结果。 |
| `FlowAnnotationPanel.tsx` | 展示流程注释和评审说明。 |
| `FlowListPanel.tsx` | 管理多个子 Flow 的列表和切换。 |
| `FlowStudioListPanel.tsx` | 新版 Studio 的 Flow 列表面板。 |
| `FlowPrdPanel.tsx` | 展示流程相关 PRD/说明信息。 |
| `FlowTopToolbar.tsx` | 工作台顶部工具栏，承接保存、调试、面板切换等操作。 |
| `FlowStudioToolbar.tsx` | Studio 版顶部工具栏。 |
| `FlowVersionManager.tsx` | 管理流程版本、发布状态和历史快照。 |
| `FlowFunctionLibraryPanel.tsx` | 展示流程可用函数库。 |
| `FunctionManager.tsx` | 管理自定义函数，并把函数目录保存到本地存储。 |
| `flowDebugSimulation.ts` | 根据调试场景模拟流程路径和节点执行结果。 |
| `LongTermFlowConfig.tsx` | 任务流程配置入口，管理流程方案列表、空白新建、模板复制、流程编排工作台和运行任务视图切换。 |
| `LongTermFlowList.tsx` | 长期任务流程方案列表，支持搜索、筛选、排序、分页、每页条数和运行指标查看。 |
| `LongTermFlowDesigner.tsx` | 多 Agent 流程编排工作台，支持画布滚动、节点拖拽、组件添加、拉线建边、模拟运行和保存反馈。 |
| `LongTermFlowDesignerPanels.tsx` | 流程工作台右侧配置面板，编辑节点执行目标、Prompt、变量、函数、状态、兜底和连线分支条件。 |
| `LongTermFlowCanvasParts.tsx` | 流程画布节点卡和组件库项，封装拖拽、选中和连接点交互。 |
| `longTermFlowDesignerUtils.ts` | 流程画布常量和纯函数，包括节点创建、连线创建、坐标换算、泳道定位和列表字段处理。 |
| `LongTermFlowRuns.tsx` | 长期任务运行视图，展示运行中、等待中、异常和需人工处理的任务实例及任务时间线，支持搜索、筛选、排序和分页。 |
| `longTermFlowData.ts` | 长期任务流程配置的模拟数据和筛选、排序、分页、统计纯函数。 |
| `longTermFlowTypes.ts` | 长期任务流程配置的类型定义。 |

### 6.4 信息提取：`components/extraction`

| 文件 | 职责 |
| --- | --- |
| `InterfaceConfig.tsx` | 配置信息提取接口、参数、鉴权、请求体和响应映射。 |
| `TriggerConfig.tsx` | 配置信息提取触发器规则。 |

### 6.5 知识库与 RAG：`components/knowledge`

| 文件 | 职责 |
| --- | --- |
| `QAManager.tsx` | 管理问答对、分类、启停、批量操作和工具绑定。 |
| `RAGConfig.tsx` | 配置知识召回、向量库、检索参数和结果处理方式。 |
| `KnowledgeDiscovery.tsx` | 发现未知问题和候选知识，并支持采纳到知识库。 |
| `CategoryListView.tsx` | 展示和管理问答分类列表。 |
| `CategoryCard.tsx` | 展示单个分类卡片。 |
| `CategorySelector.tsx` | 提供分类选择控件。 |

### 6.6 工具配置：`components/tools`

| 文件 | 职责 |
| --- | --- |
| `ToolConfigPage.tsx` | 工具配置中心，管理工具列表、工具类别、MCP 和地理位置工具入口。 |
| `ToolEditPage.tsx` | 编辑单个工具的参数和能力配置。 |
| `GeoLocationToolConfig.tsx` | 配置地理位置查询工具。 |

### 6.7 号码、通信与坐席

| 目录/文件 | 职责 |
| --- | --- |
| `components/number/NumberManagement.tsx` | 号码管理总入口。 |
| `components/number/TrunkNumbers.tsx` | 管理中继号码。 |
| `components/number/Numbers400.tsx` | 管理 400 号码。 |
| `components/number/MobileCards.tsx` | 管理移动卡资源。 |
| `components/number/NumberPools.tsx` | 管理号码池。 |
| `components/number/DisplaySettings.tsx` | 配置外显规则。 |
| `components/ivr/IVRManager.tsx` | IVR 管理入口，使用机器人列表配置路由。 |
| `components/ivr/RouteList.tsx` | 管理 IVR 路由规则。 |
| `components/gateway/GatewayCenter.tsx` | 通信网关展示与配置入口。 |
| `components/integration/IntegrationCenter.tsx` | 外部系统集成入口。 |
| `components/seats/SeatManager.tsx` | 智呼坐席管理，关联机器人与坐席能力。 |

### 6.8 文件、市场和基础设置

| 文件 | 职责 |
| --- | --- |
| `components/files/FileManager.tsx` | 文件管理总入口。 |
| `components/files/RecordingList.tsx` | 管理录音资源。 |
| `components/files/BgmList.tsx` | 管理背景音乐资源。 |
| `components/market/VoiceMarket.tsx` | 音色市场主页面，以紧凑列表提供厂商/语种/性别筛选和逐行试听。 |
| `components/market/voiceMarketData.ts` | 定义已接入音色、品牌、语种及多语言试听示例数据。 |
| `components/market/TemplateMarket.tsx` | 展示机器人模板。 |
| `components/settings/GeoGroupManager.tsx` | 管理地理分组。 |
| `components/settings/BusinessHoursManager.tsx` | 管理工作时间规则。 |
| `components/settings/ModelTraining.tsx` | 展示模型训练配置入口。 |
| `components/lexicon/LexiconManager.tsx` | 管理词库、热词和识别辅助词。 |

### 6.9 外呼、营销、记录和报表

| 文件 | 职责 |
| --- | --- |
| `components/outbound/OutboundTemplates.tsx` | 管理外呼模板，并关联机器人。 |
| `components/outbound/OutboundTasks.tsx` | 管理外呼任务列表。 |
| `components/outbound/OutboundTaskDetail.tsx` | 展示单个外呼任务详情和状态操作。 |
| `components/outbound/ContactLists.tsx` | 管理外呼联系单。 |
| `components/marketing/CampaignManager.tsx` | 管理营销活动的目标人群规则、排除人群规则、触发规则、语音话术、关联 Flow 和效果统计。 |
| `components/marketing/CustomerProfileManager.tsx` | 展示结构化客户标签、标签来源、AI 洞察、营销状态、跟进状态和禁止触达原因。 |
| `components/marketing/mockCustomerOperations.ts` | 提供客户画像、营销活动和自动跟进的共享演示数据。 |
| `components/followup/FollowUpManager.tsx` | 管理自动跟进任务、规则画布、节点配置和跟进报表。 |
| `components/call/CallRecordManager.tsx` | 通话记录模块入口。 |
| `components/call/CallRecordList.tsx` | 展示通话记录列表。 |
| `components/call/CallRecordDetail.tsx` | 展示单通电话的详情。 |
| `components/report/MonitoringReport.tsx` | 综合运营报表入口，组织顶部筛选、刷新状态、通话统计、业务与流程分析、工具调用区块。 |
| `components/report/reportUi.tsx` | 提供增强报表共享的指标卡、状态标签、排序表头、分页、空状态、加载骨架和格式化工具。 |
| `components/report/RealtimeReportTab.tsx` | 历史实时看板组件，当前综合报表入口不再渲染。 |
| `components/report/AlertCenterPanel.tsx` | 历史告警摘要组件，当前综合报表入口不再渲染。 |
| `components/report/BusinessReportTab.tsx` | 历史经营报表组件，当前综合报表入口不再渲染。 |
| `components/report/FlowAnalysisTab.tsx` | 历史流程分析组件，当前综合报表入口不再渲染。 |
| `components/report/ToolTransferTab.tsx` | 展示工具调用报表。 |
| `components/report/TopicFlowAnalysis.tsx` | 展示可搜索、排序、分页的 Topic 主题分析表和可展开 Flow 流程分析表。 |
| `components/report/FlowDetailModal.tsx` | 展示 Flow 的 Step 明细和边 / 分支明细，支持搜索、排序、滚动和分页。 |
| `components/report/CallDetailsTab.tsx` | 历史通话明细组件；通话详情当前统一走单独“通话记录”菜单。 |
| `components/report/SubscriptionPanel.tsx` | 历史报表订阅组件，当前综合报表入口不再渲染。 |
| `components/report/DashboardCards.tsx` | 展示旧版核心指标卡片，供历史报表组件复用。 |
| `components/report/TrendChart.tsx` | 展示趋势图和小时热力图。 |
| `components/report/BotPerformanceTable.tsx` | 展示机器人表现表格。 |
| `components/report/IntentAccuracyChart.tsx` | 展示意图准确率图表。 |
| `components/report/CallDurationDistribution.tsx` | 展示通话时长分布。 |
| `components/report/SatisfactionAnalysis.tsx` | 展示满意度分析。 |
| `components/report/mockData.ts` | 生成报表、通话记录、历史实时监控、告警、Topic、Flow、工具转人工和订阅模拟数据。 |

### 6.10 其他组件

| 文件 | 职责 |
| --- | --- |
| `components/agent/McpServerModal.tsx` | 独立 MCP 服务配置弹窗，功能与机器人内 MCP 配置相近。 |

## 7. 服务层职责：`services`

| 文件 | 职责 |
| --- | --- |
| `agentDemoBot.ts` | 内置 Agent 工具调用演示机器人配置。 |
| `demoBotConfig.ts` | 通用演示机器人配置和演示机器人判断工具。 |
| `geminiService.ts` | 调用 Gemini 生成基础版和高级版机器人提示词。 |
| `mockApiService.ts` | 模拟订单、工单、物流、短信、余额、转人工等外部接口。 |
| `debugEngine.ts` | 模拟意图节点执行过程，用于调试面板。 |
| `presetTools.ts` | 定义常用预设工具，并提供按 ID/分类查询方法。 |
| `functionCatalogStore.ts` | 用 `localStorage` 保存和读取自定义函数目录。 |
| `polyaiConfigHelpers.ts` | 合并函数目录、生成状态变量选项、同步话题绑定等配置辅助逻辑。 |
| `qaTopicStore.ts` | 用 `localStorage` 保存和读取问答分类配置。 |
| `categoryExtractionService.ts` | 根据问答内容提取或推荐分类。 |
| `embeddingService.ts` | 生成文本向量、预处理文本、计算相似度并维护向量缓存。 |
| `vectorDBService.ts` | 提供浏览器内模拟向量库的增删查改和检索。 |
| `ragService.ts` | 构建 RAG 检索上下文、处理知识召回和机器人 RAG 配置。 |
| `customerOperationsService.ts` | 提供客户触达保护、活动匹配、跟进任务生成和重试策略的前端模拟逻辑。 |
| `voiceSafetyGuard.ts` | 在流式输出进入 TTS 前过滤隐藏或未知标签，并把转人工、挂机兼容标签转换为独立动作。 |
| `toolExecutionPolicy.ts` | 根据工具参数和规则计算自动执行、用户确认、人工审批或仅人工处理方式。 |

## 8. 类型模型：`types.ts`

`types.ts` 是当前项目的数据合同中心，主要分为这些类型组：

- **机器人基础配置**：模型、TTS、ASR、变量、实体、标签、机器人主体配置。
- **意图与节点流程**：意图、节点、连线、播放、收集、LLM、条件、接口、短信、转接、脚本等节点配置。
- **Agent 与工具**：工具参数、工具定义、MCP 服务、函数、预设工具和增强工具。
- **知识与 RAG**：问答对、分类、候选知识、RAG 配置、向量库配置、召回结果。
- **运营资源**：坐席、音色、模板、号码、地理分组、工作时间、录音、外呼任务、客户画像、营销活动、自动跟进。
- **报表与记录**：通话记录、指标、趋势、机器人表现、意图分析、历史实时监控、告警、Topic、Flow、工具调用、转人工和报表订阅。
- **Flow 工作台**：Flow 节点、连线、元数据、注释、调试场景、版本和完整流程配置。

## 9. 模块调用关系

```text
App.tsx
  ├─ BotListView / BotConfigForm
  │   ├─ BotBasicConfig / BotStrategyConfig / BotBusinessConfig
  │   ├─ BotVariableConfig / BotKnowledgeConfig / BotTopicManager / BotTriggerManager
  │   ├─ BotAgentConfig → AgentToolModal / McpServerModal / presetTools / functionCatalogStore
  │   ├─ AgentOrchestrationConfig → agentOrchestrationData / Flow / Topic / AgentTool
  │   ├─ BotIntentConfig → MicroFlowEditor → IntentFlowDebugger → debugEngine
  │   ├─ PromptGeneratorModal → geminiService
  │   └─ FlowStudio → FlowCanvas / FlowNodeConfig / FlowEdgeConfig / FlowDebugPanel
  ├─ FlowOrchestration / FunctionManager
  │   └─ FunctionManager → functionCatalogStore
  ├─ InformationExtraction → InterfaceConfig / TriggerConfig
  ├─ QAManager → RAGConfig / CategoryListView / qaTopicStore / ragService
  ├─ KnowledgeDiscovery → categoryExtractionService
  ├─ ToolConfigPage → AgentToolModal / McpServerModal / GeoLocationToolConfig
  ├─ Outbound / Marketing / Call / Report 页面
  └─ Integration / Gateway / Number / IVR / Settings / Market 页面
```

## 10. 关键设计决定

1. **单页应用集中路由**：项目没有接入独立路由库，而是由 `App.tsx` 通过菜单名切换页面，适合当前原型和演示场景。
2. **类型先行**：大量业务对象集中在 `types.ts`，保证页面、服务和测试使用同一套数据结构。
3. **前端模拟优先**：外部接口、报表、知识库和流程调试多用本地模拟数据，降低演示环境依赖。
4. **静态展示与业务页面分离**：所有 HTML 设计展示稿统一放在 `docs/html-showcase/`，只用于正式展示和风格比较，不影响 React 应用运行入口。
4. **机器人配置分片管理**：`BotConfigForm` 只负责汇总和保存，具体配置拆到多个子组件，便于按业务域维护。
5. **流程能力逐步演进**：项目同时保留旧版 `FlowOrchestration/FlowEditor` 和新版 `FlowStudio/FlowWorkbench`，说明流程编排正在从简单画布向多 Flow 工作台演进。
6. **本地持久化只用于轻量配置**：函数目录和问答分类使用 `localStorage`，不承担正式后端数据存储职责。
7. **综合运营报表分层**：新版报表入口只负责顶部筛选和区块组合；通话、Topic/Flow、工具调用分别拆为子组件，所有保留模块统一受日期筛选影响。
8. **客户运营闭环保持语音机器人内聚**：客户画像、营销活动和自动跟进只服务语音机器人场景，不扩展成全渠道平台；自动跟进负责业务上下文，外呼任务负责拨号执行。
9. **机器人即 Agent 应用**：不新增独立应用层；单 Agent 沿用现有机器人配置，多 Agent 编排作为机器人级能力，并随机器人草稿和版本统一保存、发布。
10. **对话所有权与任务执行分离**：Flow/主题 Agent 可以接管对话；Supervisor 只路由，任务 Agent 只静默执行并回传结构化结果；机器人级 ASR/TTS、转人工和挂机策略保持全局生效。
11. **模式语义隔离**：Supervisor 的边代表能力分派并允许配置硬性准入条件；Handoff 的边代表显式接力并按条件和优先级执行，两种画布通过独立快照保存。

## 11. 测试覆盖

| 文件 | 覆盖重点 |
| --- | --- |
| `tests/botVariableConfig.state.render.tsx` | 机器人变量配置的状态渲染。 |
| `tests/flowCanvas.toolbox.render.tsx` | 流程画布工具箱渲染。 |
| `tests/flowDebugSimulation.behavior.ts` | 流程调试模拟逻辑。 |
| `tests/flowEdgeConfig.capabilities.render.tsx` | 流程连线配置能力渲染。 |
| `tests/flowNodeConfig.capabilities.render.tsx` | 流程节点配置能力渲染。 |
| `tests/flowWorkbenchNodeConfig.render.tsx` | 工作台节点配置面板渲染。 |
| `tests/polyaiConfigHelpers.behavior.ts` | PolyAI 配置辅助函数行为。 |
| `tests/toolConfigPage.render.tsx` | 工具配置页渲染。 |
| `tests/monitoringReport.enhancement.static.mjs` | 综合运营报表模块的静态能力检查。 |
| `tests/voiceCustomerOperations.static.mjs` | 客户画像、营销活动、自动跟进和机器人营销配置的静态能力检查。 |
| `tests/customerOperations.behavior.mjs` | 客户触达保护、活动匹配、跟进任务生成和重试策略行为检查。 |
| `tests/customerOperations.enterpriseUi.static.mjs` | 客户运营 B 端形态的静态能力检查，包括规则画布、筛选、规则配置和能力绑定。 |
