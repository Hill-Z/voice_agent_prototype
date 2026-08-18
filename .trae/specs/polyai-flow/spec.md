# PolyAI Flow 流程配置功能 Spec

## Why
当前意图技能模块过于复杂，需要简化并参考PolyAI Flow的设计，提供一个更直观、易用的流程配置功能。用户需要一个可视化的流程编辑器，支持节点拖拽、连线配置，以及类似PolyAI的步骤提示词和函数调用机制。

## What Changes
- 在机器人配置功能下新增"流程配置"Tab页
- 创建全新的Flow可视化编辑器，替代现有的意图技能模块
- 实现PolyAI风格的节点类型：开始节点、默认节点、结束节点
- 支持步骤提示词编辑和函数绑定（可见函数、过渡函数）
- 支持连线配置和流程跳转
- 集成代码块管理功能

**BREAKING**: 这是一个全新的功能模块，与现有意图技能模块并存，但不影响现有功能。

## Impact
- Affected specs: 机器人配置模块、代码块管理
- Affected code: BotConfigForm、新增FlowEditor组件
- New components: FlowEditor、FlowNode、FlowEdge、StepPromptEditor

## ADDED Requirements

### Requirement: Flow可视化编辑器
The system SHALL provide a visual flow editor similar to PolyAI's flow design.

#### Scenario: 创建流程
- **WHEN** 用户进入流程配置Tab
- **THEN** 系统显示空白画布或现有流程
- **WHEN** 用户从左侧拖拽节点到画布
- **THEN** 节点被创建并显示在画布上

#### Scenario: 配置节点
- **WHEN** 用户点击节点
- **THEN** 右侧显示节点配置面板
- **WHEN** 用户编辑步骤提示词
- **THEN** 支持斜杠快捷引用变量和函数
- **WHEN** 用户绑定可见函数
- **THEN** 函数列表显示在配置面板
- **WHEN** 用户绑定过渡函数
- **THEN** 过渡函数列表显示在配置面板

#### Scenario: 连接节点
- **WHEN** 用户从一个节点拖拽连线到另一个节点
- **THEN** 创建连线并显示流程走向
- **WHEN** 用户点击连线
- **THEN** 显示连线信息（仅展示，不配置逻辑）

#### Scenario: 保存流程
- **WHEN** 用户点击保存按钮
- **THEN** 验证流程完整性（必须有开始和结束节点）
- **THEN** 保存流程配置到数据库

### Requirement: 节点类型
The system SHALL support three node types as in PolyAI design.

#### Scenario: 开始节点 (Start Step)
- **GIVEN** 流程需要一个入口点
- **THEN** 提供开始节点作为流程起点
- **AND** 开始节点只能有一个
- **AND** 开始节点不能有入边

#### Scenario: 默认节点 (Default Step)
- **GIVEN** 流程需要处理用户输入
- **THEN** 提供默认节点用于LLM处理
- **AND** 默认节点包含步骤提示词配置
- **AND** 默认节点支持绑定可见函数和过渡函数

#### Scenario: 结束节点 (Exit Flow)
- **GIVEN** 流程需要结束
- **THEN** 提供结束节点作为流程终点
- **AND** 结束节点支持三种类型：finish、handoff、stop
- **AND** 结束节点不能有出边

### Requirement: 提示词编辑
The system SHALL provide a prompt editor with slash command support.

#### Scenario: 编辑步骤提示词
- **WHEN** 用户在节点配置中编辑提示词
- **THEN** 提供富文本编辑器
- **WHEN** 用户输入 `/`
- **THEN** 弹出下拉菜单显示可选项
- **AND** 选项包括：变量、可见函数、过渡函数

#### Scenario: 插入变量
- **WHEN** 用户选择变量
- **THEN** 插入 `{{变量名}}` 格式
- **AND** 显示为绿色标签

#### Scenario: 插入函数
- **WHEN** 用户选择函数
- **THEN** 插入 `/函数名` 格式
- **AND** 可见函数显示为蓝色标签
- **AND** 过渡函数显示为绿色标签

### Requirement: 函数绑定
The system SHALL support binding functions to LLM nodes.

#### Scenario: 绑定可见函数
- **WHEN** 用户在节点配置中选择可见函数
- **THEN** 函数被添加到该节点的可见函数列表
- **AND** LLM可以自主决定是否调用这些函数

#### Scenario: 绑定过渡函数
- **WHEN** 用户在节点配置中选择过渡函数
- **THEN** 函数被添加到该节点的过渡函数列表
- **AND** 用户需要在步骤提示词中显式引用 `/函数名`
- **AND** 函数内部使用 `flow.goto_step()` 控制跳转

### Requirement: 代码块管理集成
The system SHALL integrate with existing code block management.

#### Scenario: 使用代码块
- **GIVEN** 用户已在代码块管理中创建函数
- **WHEN** 用户在流程配置中绑定函数
- **THEN** 显示所有可用的代码块（内置+自定义）
- **AND** 按类型分类（可见函数/过渡函数）

## MODIFIED Requirements
None - this is a new feature module.

## REMOVED Requirements
None - existing intent skill module remains functional.
