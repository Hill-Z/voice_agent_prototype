# Checklist - 监控报表功能

## 类型定义和接口
- [x] ReportMetrics 接口已正确定义（totalCalls, connectedCalls, connectionRate, avgDuration, avgSatisfaction, transferRate, resolutionRate）
- [x] TrendData 接口已正确定义（date, totalCalls, connectedCalls, avgDuration, satisfaction）
- [x] BotPerformance 接口已正确定义（botId, botName, totalCalls, connectionRate, avgDuration, satisfaction, intentAccuracy, transferRate）
- [x] IntentAnalysis 接口已正确定义（intentId, intentName, triggerCount, accuracy, avgDuration）
- [x] CallRecord 接口已扩展（satisfaction, hangupReason, intentMatched 等字段）

## Mock 数据
- [x] 生成了 30 天的模拟通话数据
- [x] 数据包含合理的波动（工作日 vs 周末）
- [x] 生成了 5-10 个机器人的性能数据
- [x] 生成了 10-20 个意图的识别统计数据
- [x] 满意度数据分布合理（符合正态分布）

## MonitoringReport 主组件
- [x] 组件正确渲染所有子组件
- [x] 时间范围选择器支持快速选择（今日/昨日/本周/上周/本月/上月）
- [x] 时间范围选择器支持自定义日期范围
- [x] 切换时间范围时数据正确更新
- [x] 页面布局清晰，信息层次分明

## DashboardCards 核心指标卡片
- [x] 显示 6 个核心指标卡片（通话量、接通率、平均时长、满意度、转人工率、解决率）
- [x] 每个卡片显示当前值和环比变化
- [x] 环比上升显示绿色箭头和百分比
- [x] 环比下降显示红色箭头和百分比
- [x] 不同指标使用不同颜色主题（蓝色-通话、绿色-满意度、橙色-转化、红色-异常）
- [x] 点击卡片可查看该指标的详细趋势

## TrendChart 趋势图表
- [x] 图表库正确集成（recharts）
- [x] 通话量趋势折线图正常显示
- [x] 满意度趋势图正常显示
- [x] 时段分布热力图正常显示
- [x] 悬停时显示详细数据提示
- [x] 图表响应式适配不同屏幕

## BotPerformanceTable 机器人性能表格
- [x] 表格显示所有机器人的性能数据
- [x] 包含所有必要列（名称、通话量、接通率、平均时长、满意度、意图准确率、转人工率）
- [x] 点击表头可按该列排序
- [x] 支持按机器人名称搜索
- [x] 支持按时间范围筛选
- [x] 表格行有悬停效果

## IntentAccuracyChart 意图识别分析
- [x] 意图准确率柱状图/雷达图正常显示
- [x] 显示各意图的触发次数
- [x] 显示各意图的平均处理时长
- [x] 未识别意图 TOP 10 列表正常显示
- [x] "添加到知识库"按钮可点击

## SatisfactionAnalysis 满意度分析
- [x] 满意度分布饼图/环形图正常显示
- [x] 显示各评分等级的数量和占比
- [x] 显示平均满意度评分
- [x] 满意度趋势图正常显示

## CallDurationDistribution 通话时长分析
- [x] 通话时长分布柱状图正常显示
- [x] 分布区间合理（0-30s, 30-60s, 1-3min, 3-5min, 5min+）
- [x] 挂断原因分布饼图正常显示
- [x] 显示平均等待时间
- [x] 显示平均处理时间

## 数据导出功能
- [x] 导出为 Excel/CSV 按钮可用（基础实现）
- [x] 导出数据包含当前视图的所有数据
- [x] 导出图表为图片按钮可用（基础实现）
- [x] 导出时有加载状态提示

## App.tsx 集成
- [x] 监控报表路由正确配置
- [x] 点击菜单"监控报表"正确导航到报表页面
- [x] 页面切换时状态正确保持
- [x] 报表页面标题正确显示

## UI/UX 质量检查
- [x] 大屏（1920px+）多列布局正常
- [x] 中屏（1280px-1920px）标准布局正常
- [x] 小屏（<1280px）单列布局正常
- [x] 所有卡片和图表有统一的间距和边距
- [x] 加载状态有 loading 指示器
- [x] 空状态有友好的提示信息
- [x] 所有文本使用中文
- [x] 图标使用 Lucide React 图标库
- [x] 颜色使用项目统一的配色方案

## 代码质量
- [x] 所有组件使用 TypeScript 类型
- [x] 没有 any 类型的滥用
- [x] 组件 props 有完整的接口定义
- [x] 复杂逻辑有注释说明
- [x] 代码通过 ESLint 检查
