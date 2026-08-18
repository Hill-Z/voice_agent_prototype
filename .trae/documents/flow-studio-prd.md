# 流程配置（Flow Studio）产品需求文档

## 一、产品概述

### 1.1 功能定位
流程配置是语音智能体的**结构化对话编排工具**，用于设计多轮对话流程、信息采集、条件分支和业务逻辑执行。

### 1.2 设计理念
基于 PolyAI 的"提示词驱动"理念：
- **极简节点**：只有开始、步骤、退出三种节点类型
- **提示词驱动**：用自然语言描述步骤目标，LLM 自主判断行为
- **可视化编排**：画布拖拽连线，直观展示对话流向
- **函数绑定**：通过 `/` 在提示词中引用工具、代码块、流程

### 1.3 目标用户
- 对话设计师：设计对话流程和话术
- 业务人员：配置信息采集和条件分支
- 开发者：编写业务逻辑函数和 API 调用

---

## 二、核心功能

### 2.1 画布编辑

| 功能 | 说明 |
|------|------|
| 节点拖拽创建 | 从左侧工具栏拖入画布 |
| 节点自由定位 | 拖拽节点调整位置 |
| 连线绘制 | 从节点输出点拖到目标节点 |
| 画布平移缩放 | 鼠标拖拽平移，滚轮缩放 |
| 节点选中删除 | 点击选中，Delete 键删除 |
| 全屏模式 | 全屏查看和编辑 |

### 2.2 节点类型

| 类型 | 说明 | 配置项 |
|------|------|--------|
| **开始节点** | 流程入口 | 名称、描述 |
| **步骤节点** | 对话执行单元 | 名称、描述、提示词、实体采集、重试策略、流程动作、状态变量、Few-shot 示例 |
| **退出节点** | 流程结束 | 名称、描述、退出类型（正常结束/转人工/停止） |

### 2.3 步骤节点配置

#### 基础配置
| 字段 | 说明 | 示例 |
|------|------|------|
| 步骤名称 | 节点标识 | 收集预约时间 |
| 步骤备注 | 选填说明 | 这里负责确认订单号 |

#### 提示词（核心）
| 功能 | 说明 |
|------|------|
| 自然语言指令 | 描述步骤要完成的对话目标 |
| 变量引用 | `{{变量名}}` 插入动态值 |
| 工具引用 | `/工具名` 插入工具调用 |
| 代码块引用 | `/代码块名` 插入函数 |
| 流程引用 | `/flow:流程名` 插入其他 Flow |

**示例：**
```
请用户确认预约信息。
如果用户确认，调用 confirm_booking() 函数。
如果用户拒绝或要求修改，调用 reschedule_booking() 函数。
如果用户说了无法识别的内容，调用 fallback_handler() 函数。
```

#### 实体采集（可选）
| 字段 | 说明 |
|------|------|
| 启用开关 | 是否启用结构化信息采集 |
| 实体名称 | 如：phone、order_id |
| 实体类型 | text、phone、number、datetime 等 |
| 采集提示词 | 引导用户提供信息的提示 |
| 输入模式 | 仅语音/仅按键/语音+按键 |
| ASR 偏置 | 提高特定类型识别准确率 |
| 必填/选填 | 是否必须提供 |
| 敏感信息 | 是否包含 PII 数据 |

#### 重试策略（可选）
| 字段 | 说明 |
|------|------|
| 启用开关 | 是否启用独立重试 |
| 最大尝试次数 | 默认 3 次 |
| 无输入话术 | 用户没说话时的提示 |
| 无匹配话术 | 识别失败时的提示 |
| 兜底动作 | 跳转节点/跳转 Flow/转人工/结束 |

#### 流程动作
| 字段 | 说明 |
|------|------|
| 目标 Flow | 选择要跳转的其他 Flow |
| 转人工目标 | 客服队列/VIP 专席/高风险专员 |
| 转接原因 | 路由备注 |

#### 状态变量
| 字段 | 说明 |
|------|------|
| 读取状态键 | 此步骤需要读取的状态变量 |
| 写入状态键 | 此步骤会修改的状态变量 |

#### Few-shot 示例（可选）
| 字段 | 说明 |
|------|------|
| 输入 | 用户可能的输入示例 |
| 期望输出 | 期望的回复或行为 |

### 2.4 边（连线）配置

| 字段 | 说明 | 示例 |
|------|------|------|
| 边标签 | 给人看的短标签 | 是/否/成功/失败 |
| 边描述 | 给 LLM 看的路由信号 | 用户确认了预约信息 |
| 边类型 | 普通/条件/兜底/跨 Flow 跳转 | 条件分支 |
| 条件函数 | 用于判断的过渡函数（可选） | check_confirmation |
| 条件表达式 | 自然语言描述条件 | 用户回答包含确认关键词 |
| 前置实体要求 | 必须满足的实体 | phone, order_id |
| 优先级 | 1-100，数字越大优先级越高 | 80 |
| 调试规则 | 强制走这条边（调试用） | 开关 |

**边的可视化：**
- 普通边：灰色实线
- 条件边：橙色实线
- 兜底边：灰色虚线
- 跨 Flow 跳转：紫色实线

### 2.5 多 Flow 管理

| 功能 | 说明 |
|------|------|
| Flow 列表 | 左侧面板显示所有 Flow |
| 创建 Flow | 一键创建子 Flow |
| 删除 Flow | 删除非入口 Flow |
| 设置入口 | 指定哪个 Flow 是对话入口 |
| 拖拽排序 | 调整 Flow 列表顺序 |
| Flow 配置 | 名称、描述、元数据 |

### 2.6 函数管理

| 功能 | 说明 |
|------|------|
| 内置函数列表 | 显示 12 个内置函数 |
| 函数搜索 | 按名称过滤 |
| 函数详情 | 名称、描述、参数、返回值、示例 |
| 函数分类 | 过渡函数/可见函数 |

### 2.7 调试功能

| 功能 | 说明 |
|------|------|
| 调试场景管理 | 创建/删除/编辑场景 |
| 初始状态配置 | 设置场景的初始变量值 |
| 模拟输入配置 | 定义用户输入序列 |
| 调试面板 | 状态查看、执行历史 |
| 场景回放 | 一键运行调试场景 |

### 2.8 版本管理

| 功能 | 说明 |
|------|------|
| 创建版本 | 输入版本号和描述 |
| 版本列表 | 按时间倒序显示 |
| 发布版本 | 标记为已发布 |
| 回滚版本 | 恢复到历史版本 |
| 删除版本 | 删除草稿版本 |

---

## 三、数据模型

### 3.1 FlowConfig
```typescript
interface FlowConfig {
  id: string;
  name: string;
  entryFlowId: string;
  flows: FlowDefinition[];
  functions?: FlowFunction[];
  annotations: FlowAnnotation[];
  debugScenarios: FlowDebugScenario[];
  versions?: FlowVersion[];
  metadata?: FlowMetadata;
}
```

### 3.2 FlowDefinition
```typescript
interface FlowDefinition {
  id: string;
  name: string;
  isEntry?: boolean;
  nodes: FlowNode[];
  edges: FlowEdge[];
  metadata?: { description?: string };
}
```

### 3.3 FlowNode
```typescript
interface FlowNode {
  id: string;
  type: 'start' | 'default' | 'exit';
  position: { x: number; y: number };
  data: FlowNodeData;
}
```

### 3.4 FlowEdge
```typescript
interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  description?: string;
  edgeType?: 'normal' | 'conditional' | 'fallback' | 'goto_flow';
  priority?: number;
  transitionFunctionId?: string;
  conditionSummary?: string;
  requiredEntities?: string[];
  targetFlowId?: string;
  debugRule?: { forceEdge?: boolean };
}
```

---

## 四、交互流程

### 4.1 创建 Flow
1. 点击左侧"添加 Flow"按钮
2. 输入 Flow 名称
3. 画布自动生成开始节点
4. 拖拽步骤节点到画布
5. 配置步骤提示词
6. 连线到退出节点

### 4.2 配置步骤
1. 点击步骤节点
2. 右侧弹出配置面板
3. 填写步骤名称和提示词
4. 可选：配置实体采集、重试策略
5. 点击画布空白处关闭面板

### 4.3 连线
1. 从节点右侧连接点拖拽
2. 释放到目标节点
3. 点击连线配置边标签和描述
4. 选择边类型（普通/条件/兜底）

### 4.4 调试
1. 点击工具栏"场景调试"
2. 创建调试场景
3. 配置初始状态和模拟输入
4. 点击"运行场景"
5. 查看执行历史和状态变化

---

## 五、技术实现

### 5.1 核心组件
| 组件 | 文件 | 说明 |
|------|------|------|
| FlowStudio | FlowStudio.tsx | 主容器，状态管理 |
| FlowCanvas | FlowCanvas.tsx | 画布渲染，节点连线 |
| FlowNode | FlowNode.tsx | 节点组件 |
| FlowNodeConfig | FlowNodeConfig.tsx | 节点配置面板 |
| FlowEdgeConfig | FlowEdgeConfig.tsx | 边配置面板 |
| FlowStudioListPanel | FlowStudioListPanel.tsx | Flow 列表面板 |
| FlowStudioToolbar | FlowStudioToolbar.tsx | 工具栏 |
| FlowDebugPanel | FlowDebugPanel.tsx | 调试面板 |
| FlowVersionManager | FlowVersionManager.tsx | 版本管理 |
| FunctionManager | FunctionManager.tsx | 函数管理 |
| PromptEditor | PromptEditor.tsx | 提示词编辑器 |

### 5.2 状态管理
- 使用 React useState 管理本地状态
- FlowConfig 作为核心数据模型
- 支持导入导出 JSON

### 5.3 画布渲染
- SVG 渲染连线和箭头
- HTML 渲染节点（foreignObject）
- 支持平移缩放（transform）

---

## 六、验收标准

### 6.1 基础功能
- [ ] 能创建、删除、排序 Flow
- [ ] 能拖拽创建节点
- [ ] 能连线节点
- [ ] 能配置节点提示词
- [ ] 能配置边标签和描述
- [ ] 能保存 Flow 配置

### 6.2 高级功能
- [ ] 能配置实体采集
- [ ] 能配置重试策略
- [ ] 能配置状态变量读写
- [ ] 能配置跨 Flow 跳转
- [ ] 能创建调试场景
- [ ] 能运行场景回放
- [ ] 能创建和管理版本

### 6.3 用户体验
- [ ] 画布操作流畅（平移、缩放）
- [ ] 节点配置面板响应迅速
- [ ] 边的可视化区分明显
- [ ] 错误提示清晰
- [ ] 支持全屏编辑

---

## 七、后续规划

### 7.1 短期（P1）
- [ ] Flow 模板库（预置常见场景）
- [ ] 导入导出 JSON
- [ ] 代码块编辑器（Python）
- [ ] 条件函数执行模拟

### 7.2 中期（P2）
- [ ] Knowledge Topics 并行检索
- [ ] 语音层配置（ASR 增强、打断策略）
- [ ] 监控报表（通话记录、指标面板）
- [ ] 智能分析（转人工原因分类）

### 7.3 长期（P3）
- [ ] 多渠道入口（网页聊天、WhatsApp）
- [ ] 版本对比
- [ ] 协作编辑
- [ ] A/B 测试
