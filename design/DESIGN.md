# VoiceAgent DESIGN.md

## Source of truth

- Status: Active
- Last refreshed: 2026-06-24
- Primary product surfaces: 机器人配置、信息提取配置、问答对管理、知识发现、词库管理、工具配置、模型调试、通话记录、日志查看。
- Evidence reviewed: 当前设计交付包中的 token、组件规范、状态矩阵、组件展示页、高保真原型；参考 Vercel DESIGN.md 的“给 AI 可执行的设计契约”结构。

本文件是设计总纲。细节以 `docs/` 下的分项规范为准；当 AI 或设计/前端需要快速判断“能不能这么做”时，先看本文件。

## Product goals

- 提供企业级语音 Agent 配置、调试、观测、排查能力。
- 让配置人员能稳定完成复杂表单、流程、工具、知识、变量、日志相关操作。
- 让排查人员能快速定位一次回复的输入、Prompt、工具、知识、模型输出和播报结果。
- 视觉上面向海外工业级 B 端：克制、清晰、高密度、稳定、低装饰噪声。

## Non-goals

- 不做消费级 AI 聊天产品视觉。
- 不做营销官网式 Hero、口号、装饰性统计卡。
- 不用页面级解释文案替代组件规则。
- 不为单个页面临时新增颜色、阴影、字号和圆角体系。

## Visual language

### Color

- 页面和组件优先使用 semantic token，不直接使用基础色板。
- 主色只用于主操作、当前选中、关键路径高亮。
- 危险色只用于删除、停用、失败、风险确认。
- 成功、警告、信息色只表达状态，不用于装饰。
- 深色主要用于左侧导航、代码块、日志原始内容区域。

### Typography

- 正文默认 14px。
- 辅助信息和表格次级信息 12–13px。
- 页面标题 20–24px，不使用夸张大标题。
- Prompt、JSON、日志原始内容使用等宽字体。
- 长文本行高 1.65–1.75，保证阅读和复制。

### Spacing and density

- 后台配置允许中高密度，但模块之间保留 16–24px 呼吸空间。
- 表单控件高度默认 40px。
- 配置表格默认行高 64px，日志表格可用 52px compact。
- 弹窗、抽屉、大文本区域内部滚动，不撑爆页面。

### Shape and elevation

- 控件圆角 8–10px。
- 面板圆角 12–16px。
- 弹窗圆角 16px。
- 阴影只用于浮层、弹窗、重点悬浮容器，不给所有卡片加重阴影。

## Token usage rules

- `color.gray.*`、`color.blue.*` 等基础色只作为底层色板。
- 页面、组件和状态优先使用 `color.semantic.*`。
- 组件尺寸使用 `component.*`，不要在页面里随意写新尺寸。
- 状态使用 `state.*`，尤其是 focus、selected、readonly、disabled、error。
- 业务运行界面仍然使用统一基础组件和 token；不建立另一套视觉系统。
- 如果现有 token 不能满足需求，应先判断是否是通用后台能力，再扩展 token，而不是写一次性样式。

## Component rules

### Buttons

Do:
- 一屏主按钮尽量只有一个。
- 保存、发布、新增、确认使用 Primary。
- 删除、停用、清空使用 Danger，并二次确认。
- loading 时保持按钮宽度稳定。

Don’t:
- 不要同时出现多个强蓝主按钮。
- 不要用文字链接承载危险操作。
- 不要为强调临时新增按钮颜色。

### Forms

Do:
- label 必须清晰，不用 placeholder 替代 label。
- 错误信息放在字段附近，说明原因和修正方式。
- 长 Prompt、JSON、Schema、日志输入区必须内部滚动。
- 禁用项如果影响业务操作，应说明原因。

Don’t:
- 不要把规则全部塞进 placeholder。
- 不要让长文本撑高整个页面。
- 不要把多个不相关配置挤进一个无层级的大表单。

### Tables

Do:
- 表格列名简短，主列可包含标题和一行描述。
- 长文本截断，详情通过 Tooltip、Popover 或 Modal 查看。
- 操作列固定在右侧，操作不超过 3 个。
- 空态区分“无数据”和“筛选无结果”。

Don’t:
- 不要在表格里堆大段说明文案。
- 不要每列都使用彩色标签。
- 不要把详情页塞进列表页。

### Overlays and feedback

Do:
- Modal 用于明确任务，Header/Body/Footer 分区清楚。
- 大文本弹窗 Body 内部滚动。
- Toast 只反馈短结果，错误可带重试。
- Confirm 必须说明对象、影响和后果。

Don’t:
- 不要用 Popover 承载复杂流程。
- 不要让弹窗套弹窗成为主要路径。
- 不要用 Toast 展示长文案。

## Interaction and accessibility

- 所有可点击元素必须有 hover、focus、disabled 状态。
- 键盘 Tab 顺序应符合视觉顺序。
- focus ring 必须可见，不允许全局去掉 outline 后无替代。
- 弹窗打开后焦点进入弹窗，关闭后回到触发按钮。
- Esc 可关闭非阻断弹窗；危险确认弹窗需要明确按钮。
- 表单错误需要文本说明，不只靠红色。
- 色彩不能作为唯一状态表达，必须配合文字、图标或位置。
- 可复制内容，如 Prompt、JSON、日志、工具返回，应提供复制入口或可选中文本。
- 动效保持 120–220ms，避免夸张弹跳和大面积视差。

## Performance rules

- 表格超过 1000 行时使用分页、虚拟滚动或服务端查询。
- Prompt 超过 1000 字时默认放入滚动容器。
- 原始 JSON、工具返回、日志详情默认折叠或分区滚动。
- 流程画布节点超过 20 个时需要缩放、搜索或分组。
- 不允许一次性展开所有节点详情。
- 搜索和筛选需要防抖或显式提交，避免每次输入都触发重计算。
- 页面切换时避免 layout shift，保留主要容器尺寸。
- loading 使用 skeleton 或局部 loading，不整页闪烁。

## Content voice

- 文案短、准、业务化。
- 不写营销口号。
- 不用“智能赋能”“极致体验”等空泛词。
- 错误文案说明原因和下一步。
- 配置项说明不要超过两行，复杂说明放 Tooltip/Popover。
- 日志和调试界面只展示真实记录，不输出总结性诊断结论。

## AI usage rules

AI 生成或修改界面时必须遵守：

1. 先使用本文件和 `docs/` 下规范，不要凭空发明样式。
2. 不新增未定义颜色、字号、圆角、阴影体系。
3. 不新增营销化 Hero、装饰性统计卡、消费级 AI 聊天视觉。
4. 不改变既有左侧菜单层级和业务入口结构。
5. 复杂界面优先组合现有基础组件：表单、表格、弹窗、抽屉、标签页、状态反馈。
6. Prompt、日志、JSON、长文本必须可滚动、可复制、可追溯。
7. 表格、表单、弹窗必须覆盖 loading、empty、error、disabled、readonly 状态。
8. 不要把列表页和详情页合并成一个大卡片。
9. 不要在界面中放大段解释性产品文案。
10. 如果需要新组件，先判断是否能由已有组件组合；确需新增时补 token 和状态矩阵。

## Related files

- `tokens/tokens.css`
- `tokens/tokens.json`
- `docs/design-style-guide.md`
- `docs/design-tokens-spec.md`
- `docs/component-foundation.md`
- `docs/form-components.md`
- `docs/table-components.md`
- `docs/overlay-feedback-components.md`
- `docs/component-state-matrix.md`
- `examples/component-showcase.html`
- `prototype/voice-agent-redesign.html`
