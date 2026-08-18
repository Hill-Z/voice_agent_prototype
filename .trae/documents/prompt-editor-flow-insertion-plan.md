# 提示词编辑器支持插入 Flow 引用

## 背景

当前 PromptEditor 组件支持通过 `/` 插入变量、工具和代码块，但不支持插入 Flow 引用。需要在基础配置（系统提示词）和流程配置（步骤提示词）的提示词编辑器中都支持 `/flow_name` 语法来引用其他 Flow。

---

## 设计方案

### 1. 数据结构扩展

在 `types.ts` 中，Flow 引用格式：
- 显示文本：`/flow:flow_name` 或 `@flow_name`
- 类型标识：`flow`

### 2. PromptEditor 组件修改

**新增 props：**
```typescript
interface PromptEditorProps {
  // ... 现有 props
  availableFlows?: Array<{ id: string; name: string; description?: string }>;
}
```

**下拉菜单新增分类：**
- 在现有"变量"、"工具"、"代码块"分类后，新增"流程"分类
- 图标：使用 `Workflow` 或 `GitBranch` 图标
- 颜色：紫色系（与现有分类区分）

**Chip 样式：**
```typescript
flow: 'inline-flex items-center gap-1 px-1.5 py-0 rounded text-[11px] font-mono border bg-purple-100 text-purple-700 border-purple-200'
```

**正则匹配：**
```typescript
{ type: 'flow' as const, regex: /\/flow:([a-zA-Z_]\w*)/ }
```

### 3. 使用场景

**基础配置（BotBasicConfig.tsx）：**
- 系统提示词编辑器
- 传入 `availableFlows` 参数

**流程配置（FlowNodeConfig.tsx）：**
- 步骤提示词编辑器
- 传入 `availableFlows` 参数（排除当前 Flow）

---

## 实施步骤

### 步骤 1：修改 PromptEditor.tsx
1. 新增 `availableFlows` prop
2. 导入 `Workflow` 图标
3. 在 `allItems` 中添加 Flow 类型数据
4. 在 `patterns` 中添加 Flow 正则匹配
5. 在 `CHIP_CLASS` 中添加 Flow 样式
6. 在 `iconMap` 中添加 Flow 图标
7. 在下拉菜单渲染中添加"流程"分类

### 步骤 2：修改 BotBasicConfig.tsx
1. 获取可用 Flow 列表（从 `config.flowConfig?.flows`）
2. 传递给 PromptEditor 的 `availableFlows` prop

### 步骤 3：修改 FlowNodeConfig.tsx
1. 新增 `availableFlows` prop
2. 传递给 PromptEditor 的 `availableFlows` prop
3. 过滤掉当前 Flow（避免引用自己）

### 步骤 4：修改 FlowStudio.tsx
1. 将 Flow 列表传递给 FlowNodeConfig

---

## 验收标准

- [ ] 提示词编辑器中输入 `/` 后下拉菜单显示"流程"分类
- [ ] 可以选择 Flow 并插入 `/flow:flow_name` 格式的引用
- [ ] 插入的 Flow 引用显示为紫色 Chip
- [ ] 可以点击 Chip 上的 X 删除引用
- [ ] 基础配置的系统提示词编辑器支持 Flow 引用
- [ ] 流程配置的步骤提示词编辑器支持 Flow 引用
- [ ] 流程配置中不显示当前 Flow 本身（避免循环引用）
