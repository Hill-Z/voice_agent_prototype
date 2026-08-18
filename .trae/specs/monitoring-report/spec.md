# 监控报表功能 Spec

## Why

当前系统缺乏对机器人运行状态的全面监控和分析能力。管理员无法直观地了解机器人的服务质量、用户满意度、通话效率等关键指标。通过设计一个综合性的监控报表系统，管理员可以：

1. 实时监控机器人运行状态和关键指标
2. 分析通话质量和用户满意度趋势
3. 识别服务瓶颈和优化机会
4. 基于数据做出配置优化决策

## What Changes

- 新增监控报表页面 `MonitoringReport` 组件
- 新增核心指标仪表盘（通话量、接通率、平均通话时长、满意度）
- 新增趋势分析图表（日/周/月维度）
- 新增机器人性能对比分析
- 新增意图识别准确率统计
- 新增用户满意度分析
- 新增通话时长分布分析
- 新增实时监控看板（可选）
- 新增数据导出功能

## Impact

- Affected specs: BotConfiguration, OutboundTask, CallRecord
- Affected code:
  - `App.tsx` - 添加监控报表路由
  - 新增 `components/report/MonitoringReport.tsx`
  - 新增 `components/report/DashboardCards.tsx`
  - 新增 `components/report/TrendChart.tsx`
  - 新增 `components/report/BotPerformanceTable.tsx`
  - 新增 `components/report/IntentAccuracyChart.tsx`
  - 新增 `components/report/SatisfactionAnalysis.tsx`
  - 新增 `components/report/CallDurationDistribution.tsx`
  - 新增 `types.ts` - 报表相关类型定义

## ADDED Requirements

### Requirement: 核心指标仪表盘

The system SHALL provide a dashboard displaying key performance indicators:

#### Scenario: 显示核心指标卡片
- **WHEN** 管理员访问监控报表页面
- **THEN** 系统应显示以下核心指标卡片：
  - 今日通话总量（与昨日对比）
  - 接通率（接通数/拨打数）
  - 平均通话时长
  - 平均满意度评分
  - 转人工率
  - 机器人解决率

#### Scenario: 指标卡片交互
- **WHEN** 用户点击指标卡片
- **THEN** 应显示该指标的详细趋势图表
- **AND** 支持切换时间维度（今日/本周/本月）

### Requirement: 趋势分析图表

The system SHALL provide trend analysis charts for key metrics:

#### Scenario: 通话量趋势图
- **WHEN** 用户查看趋势分析区域
- **THEN** 显示通话量的折线图/柱状图
- **AND** 支持按日/周/月聚合
- **AND** 支持对比上一周期数据

#### Scenario: 满意度趋势图
- **WHEN** 用户查看满意度分析
- **THEN** 显示满意度评分趋势
- **AND** 显示各评分等级分布（1-5星）

#### Scenario: 时段分布热力图
- **WHEN** 用户查看时段分析
- **THEN** 显示24小时通话量热力图
- **AND** 帮助识别高峰时段

### Requirement: 机器人性能对比

The system SHALL provide robot performance comparison:

#### Scenario: 机器人性能表格
- **WHEN** 用户查看机器人性能区域
- **THEN** 显示所有机器人的性能对比表格：
  - 机器人名称
  - 通话量
  - 接通率
  - 平均通话时长
  - 满意度
  - 意图识别准确率
  - 转人工率

#### Scenario: 表格排序和筛选
- **WHEN** 用户点击表头
- **THEN** 按该列排序
- **AND** 支持按时间范围筛选
- **AND** 支持按机器人名称搜索

### Requirement: 意图识别分析

The system SHALL provide intent recognition accuracy analysis:

#### Scenario: 意图准确率统计
- **WHEN** 用户查看意图分析
- **THEN** 显示各意图的识别准确率
- **AND** 显示触发次数
- **AND** 显示平均处理时长

#### Scenario: 意图匹配失败分析
- **WHEN** 用户查看未识别意图
- **THEN** 显示高频未识别用户说法 TOP 10
- **AND** 支持一键添加到知识库

### Requirement: 通话质量分析

The system SHALL provide call quality analysis:

#### Scenario: 通话时长分布
- **WHEN** 用户查看通话质量
- **THEN** 显示通话时长分布图（0-30s, 30-60s, 1-3min, 3-5min, 5min+）

#### Scenario: 挂断原因分析
- **WHEN** 用户查看挂断分析
- **THEN** 显示挂断原因分布饼图：
  - 正常结束
  - 用户主动挂断
  - 超时挂断
  - 转人工
  - 异常中断

### Requirement: 实时监控看板（可选）

The system MAY provide real-time monitoring dashboard:

#### Scenario: 实时数据展示
- **WHEN** 用户开启实时监控
- **THEN** 显示当前在线通话数
- **AND** 显示今日累计数据（实时更新）
- **AND** 显示当前活跃机器人列表

### Requirement: 数据导出

The system SHALL support data export:

#### Scenario: 导出报表数据
- **WHEN** 用户点击导出按钮
- **THEN** 支持导出当前视图数据为 Excel/CSV
- **AND** 支持导出图表为图片（PNG/SVG）

## MODIFIED Requirements

无修改现有需求。

## REMOVED Requirements

无移除的需求。

## UI/UX 设计规范

### 视觉设计
- 报表页面使用卡片式布局，信息层次清晰
- 核心指标卡片使用不同颜色区分（蓝色-通话、绿色-满意度、橙色-转化、红色-异常）
- 图表使用一致的配色方案
- 关键数据使用大字体突出显示

### 交互设计
- 时间范围选择器支持快速选择（今日/昨日/本周/上周/本月/上月/自定义）
- 图表支持悬停显示详细数据
- 支持图表缩放和拖拽
- 表格支持分页和无限滚动

### 响应式设计
- 大屏（1920px+）：多列布局，同时显示多个图表
- 中屏（1280px-1920px）：标准布局
- 小屏（<1280px）：单列布局，图表堆叠显示

## 数据需求

### Mock 数据
- 生成30天的模拟通话数据
- 包含5-10个机器人的性能数据
- 包含10-20个意图的识别数据

### 数据结构
```typescript
interface ReportMetrics {
  totalCalls: number;
  connectedCalls: number;
  connectionRate: number;
  avgDuration: number;
  avgSatisfaction: number;
  transferRate: number;
  resolutionRate: number;
}

interface TrendData {
  date: string;
  totalCalls: number;
  connectedCalls: number;
  avgDuration: number;
  satisfaction: number;
}

interface BotPerformance {
  botId: string;
  botName: string;
  totalCalls: number;
  connectionRate: number;
  avgDuration: number;
  satisfaction: number;
  intentAccuracy: number;
  transferRate: number;
}

interface IntentAnalysis {
  intentId: string;
  intentName: string;
  triggerCount: number;
  accuracy: number;
  avgDuration: number;
}
```
