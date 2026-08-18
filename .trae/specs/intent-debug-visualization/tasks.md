# Tasks - 意图技能可视化调试功能

- [x] Task 1: 定义调试相关的 TypeScript 类型和接口
  - [x] SubTask 1.1: 在 types.ts 中添加 DebugExecutionState 类型
  - [x] SubTask 1.2: 添加 NodeExecutionInfo 接口（包含输入输出、耗时、状态）
  - [x] SubTask 1.3: 添加 DebugBreakpoint 接口（支持条件断点）
  - [x] SubTask 1.4: 添加 DebugSession 接口（完整调试会话数据）

- [x] Task 2: 创建 IntentFlowDebugger 主组件
  - [x] SubTask 2.1: 创建组件基础结构和 Props 接口
  - [x] SubTask 2.2: 实现调试状态管理（useDebugSession hook）
  - [x] SubTask 2.3: 集成 MicroFlowEditor 并添加调试模式支持
  - [x] SubTask 2.4: 实现调试控制栏（播放、暂停、单步、停止按钮）

- [x] Task 3: 实现节点执行可视化功能
  - [x] SubTask 3.1: 实现当前执行节点高亮效果（发光边框 + 脉冲动画）
  - [x] SubTask 3.2: 实现执行路径动画（连线上的流动效果）
  - [x] SubTask 3.3: 在节点上显示执行状态图标（成功/失败/跳过）
  - [x] SubTask 3.4: 实现节点执行统计信息显示（执行次数、平均耗时）

- [x] Task 4: 创建 DebugNodePanel 节点详情面板
  - [x] SubTask 4.1: 创建面板布局和基础样式
  - [x] SubTask 4.2: 实现输入数据展示区域（变量、上下文）
  - [x] SubTask 4.3: 实现输出数据展示区域（执行结果、返回值）
  - [x] SubTask 4.4: 实现执行信息展示（状态、耗时、错误信息）
  - [x] SubTask 4.5: 支持 JSON 数据格式化和高亮显示

- [x] Task 5: 实现断点设置和管理功能
  - [x] SubTask 5.1: 在节点上添加断点标记（右键菜单或图标点击）
  - [x] SubTask 5.2: 实现断点列表管理面板
  - [x] SubTask 5.3: 支持条件断点设置（表达式输入）
  - [x] SubTask 5.4: 实现断点触发时的自动暂停逻辑

- [x] Task 6: 实现单步调试功能
  - [x] SubTask 6.1: 实现 Step Over（步过）功能
  - [x] SubTask 6.2: 实现 Step Into（步入）功能
  - [x] SubTask 6.3: 实现 Step Out（步出）功能
  - [x] SubTask 6.4: 添加快捷键支持（F10, F11, Shift+F11）

- [x] Task 7: 创建 ExecutionTimeline 执行时间轴组件
  - [x] SubTask 7.1: 创建时间轴布局和样式
  - [x] SubTask 7.2: 实现执行历史记录展示
  - [x] SubTask 7.3: 支持点击历史节点跳转到对应状态
  - [x] SubTask 7.4: 实现时间轴缩放和滚动功能

- [x] Task 8: 实现变量和上下文监视器
  - [x] SubTask 8.1: 创建 VariableInspector 组件
  - [x] SubTask 8.2: 实现变量实时监视和变化高亮
  - [x] SubTask 8.3: 支持按变量类型过滤
  - [x] SubTask 8.4: 实现变量值编辑功能（暂停状态下）

- [x] Task 9: 实现手动触发和回退功能
  - [x] SubTask 9.1: 实现"从此节点执行"功能
  - [x] SubTask 9.2: 实现执行回退功能
  - [x] SubTask 9.3: 支持设置节点输入数据
  - [x] SubTask 9.4: 恢复回退时的上下文状态

- [x] Task 10: 增强 MicroFlowEditor 组件
  - [x] SubTask 10.1: 添加编辑/调试模式切换功能
  - [x] SubTask 10.2: 在调试模式下禁用编辑功能
  - [x] SubTask 10.3: 实现调试信息叠加显示
  - [x] SubTask 10.4: 添加模式切换动画效果

- [x] Task 11: 创建模拟执行引擎
  - [x] SubTask 11.1: 实现 MockExecutionEngine 类
  - [x] SubTask 11.2: 模拟节点执行逻辑和延迟
  - [x] SubTask 11.3: 模拟变量变化和上下文传递
  - [x] SubTask 11.4: 支持模拟错误和异常场景

- [x] Task 12: 集成到 BotIntentConfig 页面
  - [x] SubTask 12.1: 在 BotIntentConfig 中添加调试入口
  - [x] SubTask 12.2: 实现编辑器和调试器的切换
  - [x] SubTask 12.3: 传递意图配置数据到调试器
  - [x] SubTask 12.4: 添加调试按钮和状态指示器

# Task Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 3
- Task 5 depends on Task 2
- Task 6 depends on Task 5
- Task 7 depends on Task 2
- Task 8 depends on Task 2
- Task 9 depends on Task 6
- Task 10 depends on Task 2
- Task 12 depends on Task 10, Task 11
