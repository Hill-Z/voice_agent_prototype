# 意图技能可视化调试功能 Spec

## Why

当前意图技能（Intent）配置完成后，开发者无法直观地看到技能在实际运行时的执行流程和数据流转情况。当技能出现逻辑错误或者不符合预期时，开发者需要花费大量时间通过日志和代码来定位问题。为了提升开发效率，降低调试成本，需要一个类似扣子（Coze）和 Dify 平台的可视化调试功能，让开发者能够实时观察技能执行过程、检查节点数据、快速定位问题。

## What Changes

- 新增意图技能可视化调试器组件 `IntentFlowDebugger`
- 扩展 `MicroFlowEditor` 组件，集成调试模式切换功能
- 新增调试状态管理类型和接口
- 新增节点执行路径可视化展示功能
- 新增实时高亮当前执行节点功能
- 新增节点输入输出数据展示面板
- 新增断点设置与单步调试功能
- 新增手动触发节点执行和回退操作功能
- 新增执行耗时统计和状态显示功能

## Impact

- Affected specs: BotIntentConfig, MicroFlowEditor, BotDebugConfig
- Affected code: 
  - `components/bot/intent/MicroFlowEditor.tsx`
  - `components/bot/BotDebugConfig.tsx`
  - `types.ts`
  - 新增 `components/bot/intent/IntentFlowDebugger.tsx`
  - 新增 `components/bot/intent/DebugNodePanel.tsx`
  - 新增 `components/bot/intent/ExecutionTimeline.tsx`

## ADDED Requirements

### Requirement: 可视化调试器核心功能

The system SHALL provide a visual debugger for intent skill execution with the following capabilities:

#### Scenario: 调试模式启动
- **WHEN** 用户点击"调试"按钮进入调试模式
- **THEN** 系统应显示可视化调试界面，包含流程画布、调试控制栏、执行信息面板

#### Scenario: 实时执行流程可视化
- **WHEN** 技能开始执行
- **THEN** 系统应在流程图上实时高亮当前正在执行的节点
- **AND** 使用动画效果（如脉冲边框、发光效果）标识活跃节点
- **AND** 显示节点执行状态（等待中/执行中/已完成/错误）

#### Scenario: 执行路径展示
- **WHEN** 技能执行过程中
- **THEN** 系统应在连线上显示执行流向动画
- **AND** 已执行的路径使用高亮颜色标识
- **AND** 支持展开/折叠复杂的分支流程

#### Scenario: 节点数据查看
- **WHEN** 用户点击任意节点
- **THEN** 系统应在右侧面板显示该节点的详细信息：
  - 节点输入数据（变量值、上下文）
  - 节点输出数据（执行结果、返回值）
  - 执行状态（成功/失败/跳过）
  - 执行耗时（毫秒）
  - 错误信息（如有）

#### Scenario: 断点设置
- **WHEN** 用户在节点上右键点击或点击断点图标
- **THEN** 系统应在该节点上设置断点标记
- **AND** 当执行到断点节点时自动暂停
- **AND** 支持设置条件断点（当特定条件满足时才暂停）

#### Scenario: 单步调试
- **GIVEN** 执行已暂停在断点处
- **WHEN** 用户点击"单步执行"按钮
- **THEN** 系统应执行当前节点并暂停在下一个节点
- **AND** 支持"步入"（进入子流程）、"步过"（跳过子流程）、"步出"（跳出当前流程）

#### Scenario: 手动触发节点
- **WHEN** 用户右键点击节点并选择"从此节点执行"
- **THEN** 系统应从该节点开始执行流程
- **AND** 支持设置该节点的输入数据

#### Scenario: 执行回退
- **GIVEN** 执行已完成或暂停
- **WHEN** 用户点击"回退"按钮或选择历史节点
- **THEN** 系统应回退到指定节点的状态
- **AND** 恢复当时的上下文和变量值

#### Scenario: 执行历史记录
- **WHEN** 技能执行过程中
- **THEN** 系统应记录完整的执行历史
- **AND** 在时间轴上显示每个节点的执行顺序
- **AND** 支持点击历史节点跳转到对应状态

### Requirement: 调试控制栏

The system SHALL provide a debug control bar with the following controls:

#### Scenario: 调试控制按钮
- **WHEN** 用户查看调试界面
- **THEN** 应显示以下控制按钮：
  - 开始/继续执行（Play/Continue）
  - 暂停执行（Pause）
  - 单步执行（Step Over/Into/Out）
  - 停止调试（Stop）
  - 重置（Reset）

#### Scenario: 执行速度控制
- **WHEN** 用户需要调整执行速度
- **THEN** 系统应提供速度滑块（0.5x - 3x）
- **AND** 支持"慢动作"模式，每个节点执行时有延迟

#### Scenario: 调试配置
- **WHEN** 用户点击设置按钮
- **THEN** 应显示调试配置选项：
  - 是否自动在异常时暂停
  - 是否显示详细的执行日志
  - 最大执行步数限制
  - 超时时间设置

### Requirement: 变量和上下文监视器

The system SHALL provide a variable inspector panel:

#### Scenario: 变量实时监视
- **WHEN** 技能执行过程中
- **THEN** 系统应实时显示当前上下文中的所有变量
- **AND** 变量值变化时高亮显示
- **AND** 支持按变量类型过滤（输入变量、对话变量、提取变量）

#### Scenario: 变量值修改
- **GIVEN** 执行已暂停
- **WHEN** 用户双击变量值
- **THEN** 应允许编辑变量值
- **AND** 修改后从当前节点重新执行

## MODIFIED Requirements

### Requirement: MicroFlowEditor 增强

**Current**: MicroFlowEditor 仅支持流程编辑模式

**Modified**: MicroFlowEditor 应支持编辑模式和调试模式的双模式切换

#### Scenario: 模式切换
- **WHEN** 用户点击"编辑"/"调试"标签
- **THEN** 界面应在两种模式间平滑切换
- **AND** 调试模式下节点变为可交互的执行单元
- **AND** 编辑模式下保持原有拖拽编辑功能

#### Scenario: 调试信息叠加
- **WHEN** 在调试模式下
- **THEN** 节点上应显示执行次数、平均耗时等统计信息
- **AND** 节点边框颜色根据执行状态变化（绿色=成功，红色=错误，黄色=警告）

## REMOVED Requirements

无移除的需求。

## UI/UX 设计规范

### 视觉设计
- 调试界面采用深色主题，与编辑模式的浅色主题区分
- 活跃节点使用蓝色发光边框（box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5)）
- 已执行路径使用实线 + 流动动画
- 未执行路径使用虚线 + 灰色

### 交互设计
- 节点悬停显示快速操作菜单（设置断点、查看详情、从此执行）
- 右键菜单提供完整调试操作
- 键盘快捷键支持：F5（继续）、F10（步过）、F11（步入）、Shift+F11（步出）
- 时间轴支持拖拽缩放和滚动

### 响应式设计
- 调试面板宽度自适应，最小宽度 320px
- 画布区域支持缩放（50% - 200%）
- 移动端隐藏部分高级功能，保留核心调试能力
