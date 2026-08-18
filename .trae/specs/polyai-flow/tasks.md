# Tasks - PolyAI Flow 流程配置功能

- [x] Task 1: 创建 Flow 类型定义
  - [x] SubTask 1.1: 定义 FlowNode 类型（支持 Start、Default、Exit 三种节点）
  - [x] SubTask 1.2: 定义 FlowEdge 类型
  - [x] SubTask 1.3: 定义 FlowConfig 类型
  - [x] SubTask 1.4: 定义 StepPromptConfig 类型

- [x] Task 2: 创建 FlowEditor 主组件
  - [x] SubTask 2.1: 创建组件基础结构和 Props 接口
  - [x] SubTask 2.2: 实现画布容器（支持拖拽、缩放）
  - [x] SubTask 2.3: 实现左侧节点工具栏
  - [x] SubTask 2.4: 实现节点拖拽到画布功能

- [x] Task 3: 实现节点渲染
  - [x] SubTask 3.1: 创建 StartNode 组件（开始节点）
  - [x] SubTask 3.2: 创建 DefaultNode 组件（默认节点）
  - [x] SubTask 3.3: 创建 ExitNode 组件（结束节点）
  - [x] SubTask 3.4: 实现节点选中高亮效果
  - [x] SubTask 3.5: 实现节点拖拽移动功能

- [x] Task 4: 实现连线功能
  - [x] SubTask 4.1: 实现从节点拖拽创建连线
  - [x] SubTask 4.2: 实现贝塞尔曲线连线渲染
  - [x] SubTask 4.3: 实现连线点击显示信息
  - [x] SubTask 4.4: 实现连线删除功能

- [x] Task 5: 创建节点配置面板
  - [x] SubTask 5.1: 创建右侧配置面板布局
  - [x] SubTask 5.2: 实现步骤提示词编辑器（集成斜杠引用）
  - [x] SubTask 5.3: 实现可见函数绑定区域
  - [x] SubTask 5.4: 实现过渡函数绑定区域
  - [x] SubTask 5.5: 实现节点基本信息编辑（名称、描述）

- [x] Task 6: 集成代码块管理
  - [x] SubTask 6.1: 从 FunctionManager 获取代码块列表
  - [x] SubTask 6.2: 按类型过滤（可见函数/过渡函数）
  - [x] SubTask 6.3: 在配置面板中显示代码块选择器

- [x] Task 7: 创建 StepPromptEditor 组件
  - [x] SubTask 7.1: 复用现有的 PromptEditor 组件
  - [x] SubTask 7.2: 配置斜杠引用支持变量和函数
  - [x] SubTask 7.3: 实现函数标签显示（不同颜色区分类型）

- [x] Task 8: 实现流程验证和保存
  - [x] SubTask 8.1: 验证流程必须有开始节点
  - [x] SubTask 8.2: 验证流程必须有结束节点
  - [x] SubTask 8.3: 验证节点连接有效性
  - [x] SubTask 8.4: 实现保存流程配置功能

- [x] Task 9: 集成到机器人配置页面
  - [x] SubTask 9.1: 在 BotConfigForm 中添加"流程配置"Tab
  - [x] SubTask 9.2: 在 Tab 中嵌入 FlowEditor 组件
  - [x] SubTask 9.3: 实现流程配置的加载和保存
  - [x] SubTask 9.4: 添加流程配置与机器人配置的关联

- [x] Task 10: 实现流程运行基础支持
  - [x] SubTask 10.1: 创建 FlowRunner 类
  - [x] SubTask 10.2: 实现节点执行逻辑
  - [x] SubTask 10.3: 实现提示词拼接逻辑
  - [x] SubTask 10.4: 实现函数调用解析和执行

# Task Dependencies

- Task 3 depends on Task 2
- Task 4 depends on Task 3
- Task 5 depends on Task 4
- Task 6 depends on Task 5
- Task 7 depends on Task 5
- Task 8 depends on Task 4, Task 5
- Task 9 depends on Task 8
- Task 10 depends on Task 9
