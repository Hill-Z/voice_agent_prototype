# PolyAI 前端最小改造设计（需求 1、2、4、5、6、10）
更新时间：2026-04-10
适用项目：`C:\Users\13609\.trae-cn\AI-voice-bot`

## 1. 改造范围

本次只改现有页面和现有数据结构，目标是把 PolyAI 所需配置补进当前原型，前端做到“可配置、可展示、可联动”。

涉及页面：
- `components/bot/BotBasicConfig.tsx`
- `components/flow/FlowStudio.tsx`
- `components/flow/FlowNodeConfig.tsx`
- `components/bot/BotAgentConfig.tsx`
- `components/bot/BotKnowledgeConfig.tsx`
- `components/knowledge/QAManager.tsx`
- `components/bot/BotVariableConfig.tsx`
- `components/tools/ToolConfigPage.tsx`
- `components/flow/FunctionManager.tsx`

## 2. 需求 1：机器人配置 - 基础配置

页面：`BotBasicConfig.tsx`

### 2.1 页面调整

在“基础信息”卡片增加字段：
- `agentRole`
- `persona`
- `businessScene`

建议控件：
- `agentRole`：`Input`
- `persona`：`Select`
- `businessScene`：`textarea`

在 `systemPrompt` 编辑区域下方增加字段：
- `responseStyle`
- `maxSentenceCount`

建议控件：
- `responseStyle`：`Select`
- `maxSentenceCount`：数字输入框

### 2.2 文案调整

给 `systemPrompt` 的 placeholder 或说明文案补一句：
- 全局限制、角色边界、禁答要求、统一回复风格都写在这里

### 2.3 数据结构补充

基础配置对象新增字段：
- `agentRole: string`
- `persona: string`
- `businessScene: string`
- `responseStyle: string`
- `maxSentenceCount: number`

## 3. 需求 2：机器人配置 - 流程配置

页面：
- `FlowStudio.tsx`
- `FlowNodeConfig.tsx`

### 3.1 节点配置新增字段

在节点配置抽屉中补充以下字段：

#### A. Delay Control 绑定
- `delayProfileId`

控件：
- `Select`

位置：
- 放在步骤配置区，靠近函数配置区域

#### B. 主函数绑定
- `primaryFunctionId`

控件：
- `Select`

显示条件：
- 当节点类型为函数型步骤时显示

#### C. 函数参数映射
- `functionArgsMapping`

控件：
- 键值对列表
- 每行包含：`argName`、`sourceType`、`sourceKey`

位置：
- 放在 `primaryFunctionId` 下方

#### D. 实体校验 / 归一化
- `entityValidationFunctionId`
- `entityNormalizationFunctionId`

控件：
- 两个 `Select`

位置：
- 放在实体采集配置区下方

#### E. 状态变量读写
- `readStateKeys`
- `writeStateKeys`

控件：
- 两个多选控件

位置：
- 节点配置抽屉底部新增“状态变量”区块

#### F. 转人工摘要模板
- `handoffSummaryTemplate`

控件：
- `textarea`

显示条件：
- `handoff`、`exit` 类型节点显示

### 3.2 画布卡片补充标签

在节点卡片上增加轻量标签：
- 已绑函数
- 已绑实体
- 已绑延迟话术

### 3.3 数据结构补充

流程节点对象新增字段：
- `delayProfileId?: string`
- `primaryFunctionId?: string`
- `functionArgsMapping?: Array<{ argName: string; sourceType: string; sourceKey: string }>`
- `entityValidationFunctionId?: string`
- `entityNormalizationFunctionId?: string`
- `readStateKeys?: string[]`
- `writeStateKeys?: string[]`
- `handoffSummaryTemplate?: string`

## 4. 需求 4：机器人配置 - 工具调用 / Agent 配置

页面：`BotAgentConfig.tsx`

外部复用页面：
- `ToolConfigPage.tsx`
- `FunctionManager.tsx`

### 4.1 页面新增区块

#### A. 可用工具范围

新增字段：
- `enabledToolIds`

控件：
- 多选列表或标签选择器

位置：
- 页面上方新增“可用工具范围”区块

数据来源：
- `ToolConfigPage.tsx` 里已有工具定义

#### B. 可用函数范围

新增字段：
- `enabledFunctionIds`
- `defaultVisibleFunctionIds`
- `defaultTransitionFunctionIds`

控件：
- 三个多选控件

位置：
- 放在“可用工具范围”下方

数据来源：
- `FunctionManager.tsx` 里已有函数定义

#### C. Delay Control 默认配置

新增字段：
- `delayProfiles`
- `defaultDelayProfileId`
- `allowUserInterruptDuringDelay`

控件：
- `delayProfiles`：列表编辑器
- `defaultDelayProfileId`：`Select`
- `allowUserInterruptDuringDelay`：`Switch`

`delayProfiles` 每项字段：
- `id`
- `name`
- `triggerMs`
- `message`
- `allowBargeIn`

#### D. 插话与恢复策略

新增字段：
- `allowUserCutInDuringGreeting`
- `allowUserCutInDuringTts`
- `resumeStrategy`

控件：
- 两个 `Switch`
- 一个 `Select`

#### E. 默认转人工配置

新增字段：
- `defaultHandoffTargetId`
- `summaryTemplate`

控件：
- `Select`
- `textarea`

### 4.2 数据结构补充

Agent 配置对象新增字段：
- `enabledToolIds: string[]`
- `enabledFunctionIds: string[]`
- `defaultVisibleFunctionIds: string[]`
- `defaultTransitionFunctionIds: string[]`
- `delayProfiles: Array<{ id: string; name: string; triggerMs: number; message: string; allowBargeIn: boolean }>`
- `defaultDelayProfileId?: string`
- `allowUserInterruptDuringDelay: boolean`
- `allowUserCutInDuringGreeting: boolean`
- `allowUserCutInDuringTts: boolean`
- `resumeStrategy: string`
- `defaultHandoffTargetId?: string`
- `summaryTemplate?: string`

## 5. 需求 5：机器人配置 - 知识检索配置

页面：`BotKnowledgeConfig.tsx`

### 5.1 QA Tab 新增 Topic 绑定区块

新增字段：
- `topicBindings`
- `smalltalkTopicId`
- `fallbackFlowId`

控件：
- `topicBindings`：列表
- `smalltalkTopicId`：`Select`
- `fallbackFlowId`：`Select`

### 5.2 topicBindings 列表字段

每行展示并可编辑：
- `categoryId`
- `categoryName`
- `enabled`
- `entryBehavior`
- `priority`

### 5.3 数据来源

- `categoryId / categoryName` 来自 `QAManager.tsx` 的分类
- `fallbackFlowId` 来自 `FlowStudio.tsx`

### 5.4 数据结构补充

知识检索配置对象新增字段：
- `topicBindings: Array<{ categoryId: string; categoryName: string; enabled: boolean; entryBehavior: string; priority: number }>`
- `smalltalkTopicId?: string`
- `fallbackFlowId?: string`

## 6. 需求 6：问答对管理 / 知识库

页面：`QAManager.tsx`

本页把“分类”补成可承接 Topic 的配置对象。

### 6.1 分类配置新增字段

在分类新增 / 编辑弹窗补充字段：
- `description`
- `topicType`
- `entryBehavior`
- `linkedFlowId`
- `linkedToolIds`
- `linkedFunctionIds`
- `enabled`

建议控件：
- `description`：`textarea`
- `topicType`：`Select`
- `entryBehavior`：`Select`
- `linkedFlowId`：`Select`
- `linkedToolIds`：多选
- `linkedFunctionIds`：多选
- `enabled`：`Switch`

### 6.2 QA 表单新增字段

在 QA 新增 / 编辑表单补充字段：
- `entryPolicy`
- `handoffOnFailure`

建议控件：
- `entryPolicy`：`Select`
- `handoffOnFailure`：`Switch`

### 6.3 列表筛选补充

在 QA 列表顶部增加筛选项：
- `category`
- `topicType`

### 6.4 分类卡片补充展示

在分类列表卡片或列表项增加展示字段：
- `topicType`
- `enabled`
- `linkedFlowId`
- `linkedFunctionIds`

### 6.5 数据结构补充

分类对象新增字段：
- `description?: string`
- `topicType?: string`
- `entryBehavior?: string`
- `linkedFlowId?: string`
- `linkedToolIds?: string[]`
- `linkedFunctionIds?: string[]`
- `enabled?: boolean`

QA 对象新增字段：
- `entryPolicy?: string`
- `handoffOnFailure?: boolean`

## 7. 需求 10：变量配置

页面：`BotVariableConfig.tsx`

### 7.1 新增系统内置变量

在变量初始化数据中增加系统变量：
- `current_date`
- `current_time`
- `current_datetime`
- `user_phone`
- `call_id`
- `turn_count`
- `last_user_utterance`
- `last_bot_utterance`
- `active_flow_id`
- `active_step_id`
- `last_function_name`
- `last_function_status`

展示方式：
- 继续放在 `CONVERSATION` tab
- 标记为系统变量

### 7.2 变量弹窗新增字段

新增字段：
- `isStateful`
- `defaultValue`
- `source`

建议控件：
- `isStateful`：`Switch`
- `defaultValue`：`Input` 或 `textarea`
- `source`：`Select`

### 7.3 表格新增列

变量列表增加列：
- `isStateful`
- `defaultValue`
- `source`

### 7.4 Conversation Tab 新增状态规则区块

新增字段：
- `stateDefaults`
- `stateWriteRules`

控件：
- 两个 `textarea`

### 7.5 数据结构补充

变量对象新增字段：
- `isStateful?: boolean`
- `defaultValue?: string`
- `source?: string`

变量配置对象新增字段：
- `stateDefaults?: string`
- `stateWriteRules?: string`

## 8. 页面联动

### 8.1 基础配置 -> 流程配置

以下字段支持在步骤 prompt 中引用：
- `agentRole`
- `persona`
- `businessScene`
- `responseStyle`
- `maxSentenceCount`

### 8.2 工具 / 函数 -> 流程配置

流程节点里的以下选择项从 Agent 配置过滤结果读取：
- `primaryFunctionId`
- `delayProfileId`

### 8.3 分类 -> 知识检索配置

`BotKnowledgeConfig.tsx` 中：
- `topicBindings`
- `smalltalkTopicId`

均从 `QAManager.tsx` 分类数据读取

### 8.4 变量 -> 流程配置

节点配置中的以下字段从变量列表读取：
- `readStateKeys`
- `writeStateKeys`
- `functionArgsMapping.sourceKey`

### 8.5 外部工具页 -> Agent 配置

`BotAgentConfig.tsx` 中：
- `enabledToolIds` 来自 `ToolConfigPage.tsx`
- `enabledFunctionIds / defaultVisibleFunctionIds / defaultTransitionFunctionIds` 来自 `FunctionManager.tsx`

## 9. 类型补充建议

如果项目把页面配置集中定义在 `types.ts` 或类似文件中，建议同步补以下类型：

### 9.1 Basic Config
- `agentRole`
- `persona`
- `businessScene`
- `responseStyle`
- `maxSentenceCount`

### 9.2 Flow Node
- `delayProfileId`
- `primaryFunctionId`
- `functionArgsMapping`
- `entityValidationFunctionId`
- `entityNormalizationFunctionId`
- `readStateKeys`
- `writeStateKeys`
- `handoffSummaryTemplate`

### 9.3 Agent Config
- `enabledToolIds`
- `enabledFunctionIds`
- `defaultVisibleFunctionIds`
- `defaultTransitionFunctionIds`
- `delayProfiles`
- `defaultDelayProfileId`
- `allowUserInterruptDuringDelay`
- `allowUserCutInDuringGreeting`
- `allowUserCutInDuringTts`
- `resumeStrategy`
- `defaultHandoffTargetId`
- `summaryTemplate`

### 9.4 Knowledge Config
- `topicBindings`
- `smalltalkTopicId`
- `fallbackFlowId`

### 9.5 Category / QA
- `description`
- `topicType`
- `entryBehavior`
- `linkedFlowId`
- `linkedToolIds`
- `linkedFunctionIds`
- `enabled`
- `entryPolicy`
- `handoffOnFailure`

### 9.6 Variable
- `isStateful`
- `defaultValue`
- `source`
- `stateDefaults`
- `stateWriteRules`
