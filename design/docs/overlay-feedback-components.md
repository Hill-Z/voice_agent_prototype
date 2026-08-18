# 浮层与反馈组件规范

## 1. Modal

| 类型 | 宽度 | 用途 |
|---|---|---|
| Small Modal | 420px | 删除确认、轻量提示 |
| Medium Modal | 720px | 表单编辑、配置确认 |
| Large Modal | 1040px | 日志详情、Prompt 查看、工具调用详情 |

Modal 包含 Header、Body、Footer。Header 固定高度 64px，Footer 固定高度 64px，Body 超出时内部滚动。

## 2. 详情 Modal

详情 Modal 用于查看一次配置、调用或记录的完整上下文，必须支持：

- 基础字段。
- 全量长文本。
- 输入快照。
- 参考内容。
- 外部动作结果。
- 模型输出。
- 最终输出。
- 原始 JSON。

默认展示全量文本，大文本区域内部滚动。各部分来源可折叠查看。

## 3. Popover

用于短说明、变量选择、表格列设置、过滤项选择。Popover 不承载复杂流程。

## 4. Tooltip

用于解释图标、状态、指标缩写。Tooltip 文案不超过两行。

## 5. Toast

| 类型 | 场景 |
|---|---|
| Success | 保存成功、发布成功 |
| Info | 复制成功、已切换 |
| Warning | 配置未完成、需要确认 |
| Error | 保存失败、调用失败 |

Toast 显示 2–4 秒，可手动关闭。错误 Toast 可带重试入口。

## 6. Confirm

危险操作必须使用确认浮层。确认文案包含对象名称、影响范围和主按钮。

## 7. Loading / Empty / Error

| 组件 | 场景 |
|---|---|
| Skeleton | 表格、卡片、日志加载 |
| Spinner | 短操作等待 |
| Empty State | 无数据、无搜索结果 |
| Error State | 请求失败、权限不足、配置缺失 |
