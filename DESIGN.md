# Design

## Source of truth
- Status: Active
- Last refreshed: 2026-06-10
- Primary product surfaces: AI 语音机器人后台、任务流程配置、工具配置、通话记录、综合运营报表。
- Evidence reviewed: `App.tsx`、`components/flow/LongTermFlowConfig.tsx`、`components/flow/LongTermFlowList.tsx`、`components/flow/LongTermFlowDesigner.tsx`、`components/flow/LongTermFlowDesignerPanels.tsx`、`components/flow/LongTermFlowRuns.tsx`、`components/flow/longTermFlowData.ts`、`components/report/MonitoringReport.tsx`、`docs/监控报表最终呈现方案.md`、`docs/html-showcase/index.html`、Refero / Refero Styles、getdesign.md、`README.md`、`ARCHITECTURE.md`。

## Brand
- Personality: 专业、清晰、可信，偏企业后台，不做娱乐化视觉。
- Trust signals: 指标口径清楚、筛选条件可见、数据状态明确、表格可排序和分页。
- Avoid: 炫技动画、过多颜色、把实时监控和历史报表混在一起、把 Topic 和 Flow 统计混在一起。

## Product goals
- Goals: 让业务人员能快速看到通话量、需求主题、流程表现、工具稳定性和实体质量。
- Non-goals: 不在报表页承载通话明细、实时排队、坐席空闲、告警订阅等独立模块。
- Success signals: 用户能看懂当前筛选口径，能对列表排序、搜索、分页，并能从无数据或加载中状态恢复。

## Personas and jobs
- Primary personas: 客服运营、业务负责人、机器人配置人员。
- User jobs: 看业务量变化、发现重复呼入和短通话、定位高频 Topic、查看 Flow 执行表现、发现工具和实体问题。
- Key contexts of use: 每日运营复盘、机器人调优前排查、业务周报/月报演示。

## Information architecture
- Primary navigation: 左侧菜单进入“任务流程配置”或“监控报表”，流程配置不再放在机器人配置的子页里。
- Core routes/screens: 任务流程配置包含流程方案列表、流程编排工作台、运行任务视图；报表为综合运营报表单页。
- Content hierarchy: 流程配置先看方案状态和运行指标，再进入画布配置节点、连线和兜底，最后从运行任务查看实例进度。

## Design principles
- Principle 1: 报表先说明“当前看的是哪批数据”，再展示指标。
- Principle 2: Topic 表达“用户在聊什么”，Flow 表达“流程怎么跑”，二者分表展示。
- Tradeoffs: Demo 保留模拟加载、刷新和导出反馈，不接真实接口；但交互形态要接近真实产品。
- Prototype direction: 设计原型采用企业后台配置台路线，页面内容必须复用当前项目已有字段、功能和交互，不为了视觉效果自创业务字段。
- 2026-06-09 competitor-informed variants: 先参考 Retool、Workato、Zapier、Twilio Flex Insights、Zendesk Explore、Intercom Reports、Amplitude、Looker 等海外 B 端产品，再抽取页面骨架、表格、流程画布、报表和视觉语言规则；原型回到浅色、密集、低装饰、可审计的工业级后台方向。
- 2026-06-09 Refero-informed refinement: 参考 Refero 的 SaaS App、Seline Analytics、Revenue-Grade Automation 方向后，设计不再只做“工业灰”；用清晰信息层级、紧凑工具栏、轻表格、浅色网格画布、单一蓝色强调和结构化属性面板提升完成度。
- 2026-06-09 getdesign-informed refinement: 参考 getdesign.md 的 DESIGN.md 写法后，外部灵感必须拆成可执行规则：色彩、字体、间距、圆角、阴影、组件状态和响应式行为；不能只写“参考某网站”。
- 2026-06-09 three-agent HTML variants: 三个子 agent 分别产出 `agent-a-enterprise-clarity.html`、`agent-b-automation-command.html`、`agent-c-data-ops.html`；三版均覆盖机器人方案管理、流程配置和综合运营报表，作为后续正式 UI 方向评审素材。
- 2026-06-10 getdesign independent variants: 按用户反馈重做三版，分别参考 getdesign.md 的 Retool、ClickHouse、Basedash 页面，产出 `getdesign-agent-1.html`、`getdesign-agent-2.html`、`getdesign-agent-3.html`；每版都必须独立覆盖三个模块并显示来源标签。
- 2026-06-10 presentation polish: 三版 getdesign HTML 已按正式展示口径统一 AI VOICEDESK 品牌、滴滴出行智能客服 Demo、原项目流程/报表字段和模型命名；页面内移除 getdesign 来源浮层，只在入口页和注释保留来源。
- 2026-06-10 screenshot-first HTML variants: 换风格类原型必须先用线上截图锁定结构母版，再让子 agent 只替换视觉 token；产物最终收口到 `docs/html-showcase/`，展示入口只保留一个。
- 2026-06-10 non-blue design direction candidates: 为 B 端语音机器人后台筛选了不含黄/黑/蓝主调的候选方向；首选 Clinical Mint Ops，备选 Parchment Ops Console 和 June Light Lavender Console。
- 2026-06-10 non-blue screenshot-first HTML implementations: 四名子 agent 分别按 Clinical Mint、Parchment Ops、Brex Risk、June Lavender 产出独立 HTML；最终统一收口到 `docs/html-showcase/index.html`。
- 2026-06-10 design-DNA polish: 根据用户反馈“只是换色”，只深打磨 Clinical Mint 和 Brex Risk 两套正式展示候选；每个 HTML 顶部必须写 `Style DNA`，并把参考产品特征落到侧边栏、顶部栏、表格、筛选、弹窗、表单、状态标签和外呼详情等组件语法。
- 2026-06-10 html-showcase consolidation: 所有静态 HTML 展示稿统一放入 docs/html-showcase/，只保留 index.html 作为查看入口；旧截图、验证截图、生成提示图和旧分散入口不再保留。

## Visual language
- Color: 当前 UI 原型采用中性浅灰工作区 + 白色面板 + 克制蓝主操作；状态色只服务状态和风险，不做装饰。
- Typography: 标题粗体、指标数字加粗放大、辅助说明控制在一行短句。
- Spacing/layout rhythm: 卡片和表格使用 16-24px 间距，区块之间留出明显纵向呼吸。
- Shape/radius/elevation: 卡片使用圆角和轻阴影，避免重边框。
- Motion: 只保留 hover、刷新旋转、加载骨架等低干扰反馈。
- Imagery/iconography: 使用 lucide-react 图标，图标只辅助识别，不替代文字。

## Components
- Existing components to reuse: `StatCard`、`StatusBadge`、`SortableHeader`、`ReportTablePagination`、`EmptyTableState`、`LoadingBlock`。
- New/changed components: 任务流程方案列表、流程画布节点卡、组件库、节点配置面板、连线配置面板、运行任务表格。
- Variants and states: 默认、加载、无数据、无搜索结果、排序激活、分页禁用、刷新中、节点选中、连线选中、拖拽中、保存成功。
- Token/component ownership: 报表共享展示组件集中在 `components/report/reportUi.tsx`。

## Accessibility
- Target standard: Demo 层面保证键盘可点击、按钮有文字、表头排序有 `aria-label`。
- Keyboard/focus behavior: 筛选按钮、刷新、导出、分页和排序都使用原生 button/select/input。
- Contrast/readability: 关键文字使用 slate-800/900，弱说明使用 slate-400/500。
- Screen-reader semantics: 表格保留原生 table/th/td 结构。
- Reduced motion and sensory considerations: 不使用大面积动画，加载只做轻量骨架。

## Responsive behavior
- Supported breakpoints/devices: 主要面向桌面后台，同时支持窄屏横向滚动表格。
- Layout adaptations: 顶部筛选自动换行；指标卡在窄屏两列、宽屏四列；宽表格使用横向滚动。
- Touch/hover differences: 可点击元素有 hover，触摸设备依赖原生点击反馈。

## Interaction states
- Loading: 筛选或刷新后展示“正在加载报表数据”和骨架。
- Empty: 列表无数据时展示空状态说明。
- Error: 当前 Demo 无真实接口，暂不展示接口错误；接后端后应补“重试”。
- Success: 刷新完成后更新当前报表数据。
- Disabled: 分页到首页/末页时禁用上一页/下一页。
- Flow editing: 画布节点支持拖拽定位、组件库添加、节点右侧拉线、连线配置、流程完整性校验和保存反馈。
- Offline/slow network: 当前 Demo 不接网络；真实接口接入后应保留加载骨架。

## Content voice
- Tone: 简洁、业务化、少术语。
- Terminology: “通话统计”“Topic 主题分析”“Flow 流程分析”“工具调用”保持固定。
- Microcopy rules: 不写无法解释的数据口径；演示反馈要说明“当前筛选条件”。

## Implementation constraints
- Framework/styling system: React 19 + TypeScript + Tailwind CSS。
- Design-token constraints: 沿用现有 `primary`、slate、blue/green/amber/red 色系。
- Performance constraints: 不引入新依赖；流程方案和运行任务用前端分页、排序、筛选模拟真实后台体验。
- Compatibility constraints: 保持 Vite 构建通过，不引入路由或 UI 组件库。
- Test/screenshot expectations: 静态测试覆盖报表入口、禁用项、加载、分页、排序、空态关键字；构建作为主要验证。

## Open questions
- [ ] 接入真实后端后是否需要“接口错误重试”和“导出任务队列”状态 / owner: 后端接口设计 / impact: 中
- [ ] 是否需要保存用户上次选择的筛选条件 / owner: 产品 / impact: 低
