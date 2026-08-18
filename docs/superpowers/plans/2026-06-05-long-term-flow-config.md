# 长期任务流程配置 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在「流程配置」一级菜单下实现可用于真实产品演示的长期任务 / 多 Agent 流程配置前端。

**Architecture:** 新增长期流程配置模块，保留原有单次通话 Flow 组件不动。入口由 `App.tsx` 路由到新的容器组件；数据、类型、列表页、工作台、运行视图按职责拆分，前端用本地状态模拟搜索、筛选、排序、分页、节点选择和运行时间线。

**Tech Stack:** React 19、TypeScript、Tailwind CSS、lucide-react、Vite。

---

### Task 1: 静态回归测试

**Files:**
- Create: `tests/longTermFlowConfig.static.mjs`

- [x] **Step 1: 写失败测试**
  - 检查 App 入口使用「流程配置」而不是旧的「流程编排」。
  - 检查新模块包含列表、泳道工作台、运行任务、搜索、筛选、排序、分页、模拟运行。
  - 检查两个核心模板：催收三轮跟进、外卖退款协商。

- [x] **Step 2: 运行测试确认失败**
  - Run: `node tests/longTermFlowConfig.static.mjs`
  - Expected: FAIL，因为新文件尚未创建。

### Task 2: 数据和类型层

**Files:**
- Create: `components/flow/longTermFlowTypes.ts`
- Create: `components/flow/longTermFlowData.ts`

- [ ] **Step 1: 定义长期流程、节点、泳道、运行任务类型。**
- [ ] **Step 2: 提供催收和外卖退款两个完整模板。**
- [ ] **Step 3: 提供统计、筛选、排序、分页辅助函数。**

### Task 3: 列表页

**Files:**
- Create: `components/flow/LongTermFlowList.tsx`

- [ ] **Step 1: 实现顶部统计。**
- [ ] **Step 2: 实现搜索、筛选、排序、分页、每页条数。**
- [ ] **Step 3: 实现空状态和搜索无结果状态。**

### Task 4: 编排工作台

**Files:**
- Create: `components/flow/LongTermFlowDesigner.tsx`

- [ ] **Step 1: 实现顶部操作栏和模板信息。**
- [ ] **Step 2: 实现左侧组件库。**
- [ ] **Step 3: 实现中间泳道式时间轴。**
- [ ] **Step 4: 实现右侧节点配置面板。**
- [ ] **Step 5: 实现底部模拟运行时间线。**

### Task 5: 运行任务视图和容器

**Files:**
- Create: `components/flow/LongTermFlowRuns.tsx`
- Create: `components/flow/LongTermFlowConfig.tsx`

- [ ] **Step 1: 实现运行任务表格、筛选、任务详情时间线。**
- [ ] **Step 2: 容器管理列表 / 设计 / 运行视图切换。**

### Task 6: 接入口和文档

**Files:**
- Modify: `App.tsx`
- Modify: `CONTEXT.md`
- Modify: `README.md`
- Modify: `ARCHITECTURE.md`

- [ ] **Step 1: App 路由接入「流程配置」。**
- [ ] **Step 2: README / ARCHITECTURE 记录新增模块。**
- [ ] **Step 3: 运行静态测试和构建。**
