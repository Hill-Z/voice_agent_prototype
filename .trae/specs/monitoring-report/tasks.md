# Tasks - 监控报表功能

- [x] Task 1: 定义报表相关的 TypeScript 类型和接口
  - [x] SubTask 1.1: 在 types.ts 中添加 ReportMetrics 接口
  - [x] SubTask 1.2: 添加 TrendData 接口
  - [x] SubTask 1.3: 添加 BotPerformance 接口
  - [x] SubTask 1.4: 添加 IntentAnalysis 接口
  - [x] SubTask 1.5: 添加 CallRecord 扩展字段（满意度、挂断原因等）

- [x] Task 2: 创建 Mock 数据生成器
  - [x] SubTask 2.1: 生成 30 天的模拟通话数据
  - [x] SubTask 2.2: 生成机器人性能对比数据
  - [x] SubTask 2.3: 生成意图识别统计数据
  - [x] SubTask 2.4: 生成满意度分布数据

- [x] Task 3: 创建 MonitoringReport 主组件
  - [x] SubTask 3.1: 创建组件基础结构和布局
  - [x] SubTask 3.2: 实现时间范围选择器（今日/昨日/本周/本月/自定义）
  - [x] SubTask 3.3: 集成各个子组件
  - [x] SubTask 3.4: 实现数据筛选和状态管理

- [x] Task 4: 创建 DashboardCards 核心指标卡片组件
  - [x] SubTask 4.1: 创建指标卡片 UI（通话量、接通率、平均时长、满意度等）
  - [x] SubTask 4.2: 实现环比变化指示器（上升/下降箭头）
  - [x] SubTask 4.3: 添加卡片点击交互（显示详细趋势）
  - [x] SubTask 4.4: 实现不同指标的颜色主题

- [x] Task 5: 创建 TrendChart 趋势图表组件
  - [x] SubTask 5.1: 集成图表库（如 recharts 或 chart.js）
  - [x] SubTask 5.2: 实现通话量趋势折线图
  - [x] SubTask 5.3: 实现满意度趋势图
  - [x] SubTask 5.4: 实现时段分布热力图
  - [x] SubTask 5.5: 添加图表交互（悬停提示、缩放）

- [x] Task 6: 创建 BotPerformanceTable 机器人性能表格
  - [x] SubTask 6.1: 创建表格 UI 和列定义
  - [x] SubTask 6.2: 实现表格排序功能
  - [x] SubTask 6.3: 实现搜索和筛选功能
  - [x] SubTask 6.4: 添加分页或虚拟滚动

- [x] Task 7: 创建 IntentAccuracyChart 意图识别分析
  - [x] SubTask 7.1: 实现意图准确率柱状图/雷达图
  - [x] SubTask 7.2: 创建意图触发次数统计表格
  - [x] SubTask 7.3: 实现未识别意图 TOP 10 列表
  - [x] SubTask 7.4: 添加"添加到知识库"快捷操作

- [x] Task 8: 创建 SatisfactionAnalysis 满意度分析
  - [x] SubTask 8.1: 实现满意度分布饼图/环形图
  - [x] SubTask 8.2: 显示各评分等级的数量和占比
  - [x] SubTask 8.3: 实现满意度趋势分析

- [x] Task 9: 创建 CallDurationDistribution 通话时长分析
  - [x] SubTask 9.1: 实现通话时长分布柱状图
  - [x] SubTask 9.2: 实现挂断原因分布饼图
  - [x] SubTask 9.3: 显示平均等待时间、平均处理时间等指标

- [x] Task 10: 实现数据导出功能
  - [x] SubTask 10.1: 实现导出为 Excel/CSV 功能（基础按钮）
  - [x] SubTask 10.2: 实现导出图表为图片功能（基础按钮）
  - [x] SubTask 10.3: 添加导出按钮和加载状态

- [x] Task 11: 集成到 App.tsx
  - [x] SubTask 11.1: 在 App.tsx 中添加监控报表路由
  - [x] SubTask 11.2: 确保菜单点击正确导航到报表页面
  - [x] SubTask 11.3: 测试页面切换和状态保持

- [x] Task 12: UI/UX 优化和响应式设计
  - [x] SubTask 12.1: 实现大屏（1920px+）多列布局
  - [x] SubTask 12.2: 实现中屏（1280px-1920px）标准布局
  - [x] SubTask 12.3: 实现小屏（<1280px）单列布局
  - [x] SubTask 12.4: 添加加载状态和空状态提示

# Task Dependencies

- Task 3 depends on Task 1, Task 2
- Task 4 depends on Task 2
- Task 5 depends on Task 2
- Task 6 depends on Task 2
- Task 7 depends on Task 2
- Task 8 depends on Task 2
- Task 9 depends on Task 2
- Task 11 depends on Task 3
- Task 12 depends on Task 3, Task 4, Task 5, Task 6, Task 7, Task 8, Task 9
