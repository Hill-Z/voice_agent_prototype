# 组件状态矩阵

## 1. 通用状态定义

| 状态 | 含义 | 视觉表现 | 交互规则 |
|---|---|---|---|
| default | 可用默认态 | 白底、默认边框、正常文字 | 可点击/可输入 |
| hover | 指针悬停 | 背景轻微变亮或边框加深 | 仅桌面端使用 |
| focus | 键盘或输入聚焦 | 使用 focus ring，不改变布局 | 必须可见 |
| active | 鼠标按下或当前操作中 | 背景加深 | 释放后回到目标状态 |
| selected | 当前选中项 | 主色浅底、左侧或边框强调 | 用于 nav、tab、row、option |
| disabled | 不可操作 | 降低透明度，禁止 hover | 不触发事件 |
| readonly | 只读可复制 | 浅灰底、正常文字 | 不可编辑，可复制 |
| loading | 正在加载 | 骨架、spinner 或按钮 loading | 阻止重复提交 |
| error | 校验失败或请求失败 | 危险色边框/提示 | 保留用户输入 |
| success | 成功完成 | 成功色提示 | 自动消失或保留状态 |
| empty | 无数据 | 空态图标、短提示、必要操作 | 不展示假数据 |
| no-access | 无权限 | 灰态说明 | 引导联系管理员 |
| dragging | 拖拽中 | 拖拽项浮起、目标区域高亮 | 仅排序/上传/画布使用 |

## 2. 基础组件矩阵

| 组件 | 必备状态 | 关键规则 |
|---|---|---|
| Button | default、hover、focus、active、loading、disabled、danger | loading 时保留按钮宽度；危险操作必须二次确认 |
| Icon Button | default、hover、focus、disabled、selected | 仅图标时必须有 tooltip 或 aria-label |
| Badge / Tag | default、selected、readonly、error、success、warning | 标签不承担按钮语义，除非明确可点击 |
| Tabs | default、hover、focus、selected、disabled、overflow | tab 不换行；超出横向滚动或更多菜单 |
| Sidebar Nav | default、hover、selected、expanded、collapsed、disabled | 一级菜单控制分组，二级菜单承载真实页面入口；选中态不能改变层级 |
| Header / Topbar | default、sticky、search-focus、action-disabled | 顶部固定时阴影轻，不遮挡内容 |
| SearchInput | default、focus、typing、clearable、loading、empty-result | 搜索中不清空列表；支持回车提交和清空 |
| Dropdown Menu | closed、open、hover-option、selected-option、disabled-option、empty | 菜单宽度不小于触发器，超长项截断 |

## 3. 表单组件矩阵

| 组件 | 必备状态 | 关键规则 |
|---|---|---|
| Input | default、hover、focus、filled、readonly、disabled、error、success | 错误提示在字段下方，不能用 placeholder 替代 label |
| Textarea | default、focus、filled、readonly、disabled、error、resize | 长文本支持滚动；Prompt 类 textarea 默认等宽/大高度 |
| Select | closed、open、focus、selected、disabled、error、loading、empty | 选项超过 8 条可搜索；选中项必须回显完整含义 |
| MultiSelect | default、open、tag-overflow、max-selected、disabled、error | 标签过多时折叠为 +N，不撑破表单 |
| Combobox | typing、loading、matched、empty、create-new、error | 输入和选项选择必须区分 |
| Checkbox / Radio | unchecked、checked、indeterminate、focus、disabled、error | 多选组必须有组标题；Radio 必须单选 |
| Switch | off、on、hover、focus、disabled、loading | 涉及上线/停用需展示保存结果 |
| Slider | default、dragging、disabled、error | 数值实时显示；业务阈值需标注推荐范围 |
| Date / Time Picker | closed、open、selected、range、disabled-date、error | 禁选日期必须可解释 |
| File Upload | idle、dragging、uploading、success、error、retry、disabled | 展示格式、大小、失败原因和重试入口 |
| Variable Picker | closed、open、searching、inserted、empty | 插入变量后保持光标位置 |
| Prompt Editor | editing、focus、dirty、saved、error、readonly、full-screen | 支持长文本滚动、变量高亮、保存态提示 |
| JSON / Schema / KeyValue Editor | editing、invalid、readonly、formatted、collapsed | JSON 错误定位到行；KeyValue 支持增删排序 |

## 4. 表格矩阵

| 区域 | 必备状态 | 关键规则 |
|---|---|---|
| Table Toolbar | default、filtering、searching、bulk-active、collapsed | 筛选条件多时折叠为摘要；批量操作只在选中后出现 |
| Header Cell | default、sortable、sorted-asc、sorted-desc、resizing、sticky | 排序图标只在可排序列显示；固定列有阴影分隔 |
| Row | default、hover、selected、expanded、disabled、error、loading | hover 不改变行高；选中行与 hover 可叠加 |
| Cell | default、ellipsis、copyable、editable、error、empty | 长文本单行截断，详情用 tooltip/popover/modal |
| Action Cell | default、hover、disabled、danger、more-menu | 操作不超过 3 个，更多动作进菜单 |
| Pagination | default、loading、first-page、last-page、page-size-open | 翻页保留筛选条件 |
| Empty / Error | empty-filter、empty-data、load-error、permission-empty | 空态文案区分无数据和筛选无结果 |
| Virtual Scroll | loading-more、row-recycle、sticky-header | 大数据场景不影响固定列与 hover |

## 5. 浮层与反馈矩阵

| 组件 | 必备状态 | 关键规则 |
|---|---|---|
| Modal | open、closing、loading、error、confirm-disabled | 弹窗有明确标题，底部操作固定 |
| Drawer | open、nested、loading、dirty、close-confirm | 抽屉用于上下文编辑，不替代复杂页面 |
| Popover | closed、open、hover、focus、empty | 内容轻量，不承载长流程 |
| Tooltip | hidden、visible、disabled | 不放关键业务信息，只做解释 |
| Toast | info、success、warning、error、loading | 位置固定，不遮挡主操作 |
| Confirm | neutral、danger、loading、failed | 危险操作用 danger 样式，失败保留弹窗 |
| Skeleton | loading、partial-loaded | 骨架尺寸贴近真实内容 |
| Empty / Error Block | empty、filtered-empty、network-error、permission-error | 提供可执行下一步，不堆长文案 |

## 6. 复杂内容组件矩阵

| 组件 | 必备状态 | 关键规则 |
|---|---|---|
| Transcript | agent、user、system、interrupted、selected、playing | 多角色消息清晰分列；打断、播放等附加信息贴近对应消息 |
| Status Indicator | listening、final、low-confidence、timeout、blocked | 低置信和被阻断状态必须可追溯，不直接当事实展示 |
| Result Card | pending、success、failed、timeout、cleaned | 展示名称、耗时、输入摘要、处理后结果；失败保留原因 |
| Reference Card | hit、miss、reranked、low-score、selected | 展示来源、标题、分数、片段摘要；低分结果弱化但可查看 |
| Text Viewer | full、section-expanded、copied、overflow | 默认展示全量文本；分段可展开；长文本内部滚动 |
| Metric Breakdown | normal、slow、timeout、partial | 拆分关键耗时或计量项；慢项需要明显但不夸张 |
| Flow Canvas | default、selected-node、edge-hover、dragging、invalid-edge | 节点类型颜色稳定，线条不抢主内容 |
| Log Viewer | overview、input、prompt、action、output、raw-json | 只展示真实返回内容，不生成诊断结论 |
