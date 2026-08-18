# QA 管理 - 大模型调用工具功能设计

## 需求背景

在 QA 管理中，允许为每个问答对绑定特定的大模型工具，使机器人在回复该问题时可以调用对应的工具（如查询订单、发送短信等）。

## 实施步骤

### 1. 类型扩展 (`types.ts`)

在 `QAPair` 接口中添加 `toolIds` 字段：

```typescript
export interface QAPair {
  id: string;
  standardQuestion: string;
  similarQuestions: string[];
  answer: string;
  category?: string;
  validityType: 'permanent' | 'range';
  validityStart?: number;
  validityEnd?: number;
  lastUpdated: number;
  isActive: boolean;
  audioResources?: Record<string, string>;
  toolIds?: string[];  // 新增：绑定的工具 ID 列表
}
```

### 2. 导入 AgentTool 类型

在 `QAManager.tsx` 中导入 `AgentTool` 类型，并从 props 或 context 获取可用的工具列表。

### 3. 表单视图添加工具绑定区域

在 `QAManager.tsx` 的表单视图（FORM view）中，在答案编辑区域下方添加：

* 工具选择区域标题：「绑定工具 (可选)」

* 工具选择按钮列表（类似 CognitiveConfig 的样式）

* 已选工具显示 + 取消选择功能

* 说明文字：告知用户选择后机器人回复时可调用这些工具

### 4. 保存时处理 toolIds

在 `handleSave` 函数中，确保 `toolIds` 被正确保存到 QA 对象中。

### 5. 列表视图可选显示

在列表视图中可选择是否显示「工具」列，显示该 QA 绑定的工具数量。

## 关键文件

* `types.ts` - QAPair 类型定义

* `components/knowledge/QAManager.tsx` - QA 管理组件

