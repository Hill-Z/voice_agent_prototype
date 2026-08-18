# Checklist - PolyAI Flow 流程配置功能

## 类型定义
- [x] FlowNode 类型正确定义，支持 Start、Default、Exit 三种节点类型
- [x] FlowEdge 类型正确定义，包含 source、target、label 等字段
- [x] FlowConfig 类型正确定义，包含 nodes、edges、metadata
- [x] StepPromptConfig 类型正确定义，包含 prompt、visibleFunctions、transitionFunctions

## FlowEditor 主组件
- [x] FlowEditor 组件基础结构正确
- [x] 画布容器支持拖拽和缩放
- [x] 左侧节点工具栏显示三种节点类型
- [x] 节点可以从工具栏拖拽到画布

## 节点渲染
- [x] StartNode 组件正确渲染开始节点样式
- [x] DefaultNode 组件正确渲染默认节点样式
- [x] ExitNode 组件正确渲染结束节点样式（支持 finish/handoff/stop 三种类型）
- [x] 节点选中时显示高亮效果
- [x] 节点可以在画布上拖拽移动

## 连线功能
- [x] 可以从节点拖拽创建连线
- [x] 连线使用贝塞尔曲线渲染
- [x] 点击连线显示连线信息面板
- [x] 可以删除连线

## 节点配置面板
- [x] 右侧配置面板布局正确
- [x] 步骤提示词编辑器支持斜杠快捷引用
- [x] 可见函数绑定区域显示已绑定的函数
- [x] 过渡函数绑定区域显示已绑定的函数
- [x] 可以编辑节点名称和描述

## 代码块管理集成
- [x] 可以从 FunctionManager 获取代码块列表
- [x] 代码块按可见函数/过渡函数分类显示
- [x] 配置面板中代码块选择器正常工作

## StepPromptEditor 组件
- [x] 复用现有的 PromptEditor 组件
- [x] 斜杠引用支持变量和函数
- [x] 可见函数标签显示为蓝色
- [x] 过渡函数标签显示为绿色
- [x] 变量标签显示为绿色

## 流程验证和保存
- [x] 验证流程必须有且只有一个开始节点
- [x] 验证流程必须至少有一个结束节点
- [x] 验证节点连接有效性（开始节点不能有入边，结束节点不能有出边）
- [x] 保存流程配置功能正常工作

## 集成到机器人配置页面
- [x] BotConfigForm 中显示"流程配置"Tab
- [x] FlowEditor 组件正确嵌入到 Tab 中
- [x] 流程配置可以正确加载
- [x] 流程配置可以正确保存
- [x] 流程配置与机器人配置正确关联

## 流程运行基础支持
- [x] FlowRunner 类正确创建
- [x] 节点执行逻辑正确实现
- [x] 提示词拼接逻辑正确实现
- [x] 函数调用解析和执行正确实现
