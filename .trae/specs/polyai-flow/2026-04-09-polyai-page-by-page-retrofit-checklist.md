# PolyAI 全量集成改造清单（按页面拆分）

更新时间：2026-04-09  
适用范围：`C:\Users\13609\.trae-cn\AI-voice-bot` 当前前端原型  
分析原则：只基于当前代码结构、类型定义和页面职责，不沿用外部调研结论

关联代码：
- `App.tsx`
- `types.ts`
- `components/bot/BotConfigForm.tsx`
- `components/bot/BotBasicConfig.tsx`
- `components/bot/BotAgentConfig.tsx`
- `components/bot/BotKnowledgeConfig.tsx`
- `components/bot/intent/BotIntentConfig.tsx`
- `components/flow/FlowStudio.tsx`
- `components/flow/FlowNodeConfig.tsx`
- `components/flow/FunctionManager.tsx`
- `components/tools/ToolConfigPage.tsx`
- `components/integration/IntegrationCenter.tsx`
- `components/bot/BotDebugConfig.tsx`
- `components/bot/BotTestConfig.tsx`
- `components/report/MonitoringReport.tsx`
- `components/call/CallRecordManager.tsx`

---

## 1. 总体结论

当前产品已经有一套接近 PolyAI 的骨架，但它不是一套清晰的一致模型，而是以下几套东西并存：

- 老的意图技能流：`routerEnabled + intents + flowCanvas`
- 新的 PolyAI 风格流：`flowConfig + flows + nodes + functions`
- Bot 级工具配置：`agentConfig.tools`
- 全局工具配置页：`ToolConfigPage`
- 函数/代码块页：`FunctionManager`
- Demo 配置里已存在但正式 schema 未吸收的运行时字段

所以本次改造的核心不是“新增一个 PolyAI 模块”，而是：

- 把 `FLOW_CONFIG` 升级为主编排面
- 把 `FLOW` 降级成兼容路由入口
- 把 `Tool / Function / Code Block / Runtime Policy` 四类概念拆清楚
- 把 `types.ts` 先统一成能承载完整 PolyAI 运行模型的正式 schema

---

## 2. 导航和信息架构调整

### 2.1 左侧一级导航

保留现有导航，不建议再新开一个“PolyAI”一级菜单。  
调整现有页面职责：

- `机器人配置`
  - 继续做单个 agent 的主工作台
- `流程编排`
  - 改为全局 Flow 资源与跨 bot 复用视图
- `工具配置`
  - 改为平台级 API / Tool / Connector 资源中心
- `集成中心`
  - 改为运行环境、外部系统、handoff、alerts、webhook 配置中心
- `通话记录`
  - 改为单通会话回放与诊断入口
- `监控报表`
  - 改为实时运行指标与告警入口

### 2.2 `BotConfigForm` 内部 tab 调整

当前 tab：

- `基础配置`
- `意图技能`
- `流程配置`
- `对话策略`
- `变量配置`
- `业务分析`
- `营销活动`
- `模型调试`
- `批量评测`
- `知识检索配置`

建议改为：

- `Agent`
- `Flows`
- `Topics`
- `Functions`
- `Voice & Runtime`
- `Variables & State`
- `Debug`
- `Test`
- `Analytics`

映射方式：

- `基础配置` -> `Agent`
- `流程配置` -> `Flows`
- `知识检索配置` -> `Topics`
- `工具调用` 和 `FunctionManager` 部分能力并入 `Functions`
- `对话策略` + 部分 `基础配置` -> `Voice & Runtime`
- `变量配置` -> `Variables & State`
- `模型调试` -> `Debug`
- `批量评测` -> `Test`
- `业务分析` -> `Analytics`

旧 tab 不要立即删除，但应在 UI 上降级：

- `意图技能` 标记为“兼容模式”
- `营销活动` 标记为“非 PolyAI 核心”
- `业务分析` 标记为“运营扩展”

---

## 3. 按页面拆分的改造清单

## 3.1 `components/bot/BotConfigForm.tsx`

### 页面职责调整

从“杂糅的 bot 配置集合页”改成“单个语音 agent 的统一工作台”。

### 需要新增的表单项/能力

- 顶部运行模式切换
  - `orchestrationMode`: `legacy_router` | `polyai_flow`
  - `channelMode`: `voice_only` | `voice_and_chat`
  - `environmentId`
  - `projectId`
  - `region`

- 顶部状态区
  - 当前 bot 是否绑定 flow
  - 当前 bot 是否绑定 topics
  - 当前 bot 是否有未发布变更
  - 最近一次测试结果
  - 最近一次 live 运行告警

### 需要隐藏/弱化的旧入口

- `意图技能`
  - 当 `orchestrationMode=polyai_flow` 时默认折叠并显示“兼容模式，仅用于旧 bot”
- `营销活动`
  - 从主 tab 中移出，放到“更多设置”
- `业务分析`
  - 从配置页主路径移出，放到 Analytics 页签或左侧运营模块

---

## 3.2 `components/bot/BotBasicConfig.tsx`

### 页面新定位

当前页主要是模型、TTS、ASR、大 prompt。  
改造后应只负责 `Agent 身份与全局行为`。

### 需要新增的表单区块

#### A. Agent Identity

- `displayName`
- `role`
- `persona`
- `businessContext`
- `supportedLanguages`
- `defaultLanguage`
- `brandTone`

#### B. Greeting

- `greeting.enabled`
- `greeting.mode`
  - `static_utterance`
  - `dynamic_start_function`
- `greeting.text`
- `greeting.interruptible`
- `greeting.cacheTts`
- `greeting.fallbackText`

#### C. Global Rules

- `globalRules.mustDo[]`
- `globalRules.mustNotDo[]`
- `globalRules.complianceRules[]`
- `globalRules.transferRules[]`
- `globalRules.goodbyeRules[]`
- `globalRules.silenceRules[]`
- `globalRules.smalltalkPolicy`

#### D. Model Split

- `models.primaryConversationModel`
- `models.functionCallModel`
- `models.extractionModel`
- `models.routingModel`

#### E. Response Style

- `responsePolicy.maxSentenceCount`
- `responsePolicy.maxWordsPerTurn`
- `responsePolicy.allowLists`
- `responsePolicy.allowParagraphs`
- `responsePolicy.voiceFirstStyle`
- `responsePolicy.confirmationStyle`
- `responsePolicy.errorStyle`

### 需要重构的现有字段

- `systemPrompt`
  - 改成结构化编辑器
  - 后台仍可序列化成 prompt，但前端不再只暴露一个大文本框

- `llmType / temperature / topP`
  - 移到高级区，不再放页面核心位置

### 需要隐藏的旧内容

- 将“AI 智能生成 prompt”降级成辅助工具，不要让页面主路径围绕 prompt 生成

---

## 3.3 `components/bot/BotStrategyConfig.tsx`

### 页面新定位

从“散装对话策略”升级为 `Voice & Runtime Policy`。

### 需要新增的表单区块

#### A. Interruption / Barge-in

- `interruption.enabled`
- `interruption.allowUserCutInDuringGreeting`
- `interruption.allowUserCutInDuringDelayMessage`
- `interruption.allowUserCutInDuringTts`
- `interruption.resumeStrategy`
  - `restart_turn`
  - `continue_after_interrupt`
  - `reprompt`

#### B. Delay Control

- `delayControl.enabled`
- `delayControl.defaultProfileId`
- `delayControl.globalThresholdMs`
- `delayControl.maxMessagesPerTurn`
- `delayControl.allowUserInterruptDuringDelay`
- `delayControl.stopDelayOnFunctionReturn`

#### C. Silence / No Input

- `silence.initialTimeoutMs`
- `silence.repromptCount`
- `silence.repromptMessages[]`
- `silence.finalAction`
  - `hangup`
  - `handoff`
  - `goto_flow`

#### D. Handoff Policy

- `handoff.enabled`
- `handoff.defaultTargetId`
- `handoff.summaryTemplate`
- `handoff.includeTranscript`
- `handoff.includeStateSnapshot`
- `handoff.playMessageBeforeTransfer`

#### E. Runtime Limits

- `runtime.maxTurnCount`
- `runtime.maxConversationDurationSec`
- `runtime.maxParallelFunctions`
- `runtime.functionTimeoutMs`
- `runtime.maxStateSize`

### 需要移动进来的字段

- `protectionDurationMs`
- `interruptionWaitMs`
- `maxCallDurationSeconds`
- `welcomeMessageInterruptible`
- `transfer*`
- `hangup*`
- `noAnswer*`

这些字段不应再散落在 bot 顶层。

---

## 3.4 `components/bot/BotVariableConfig.tsx`

### 页面新定位

改为 `Variables & State`。

### 需要新增的表单项

#### A. 变量定义增强

- `scope`
  - `session`
  - `flow`
  - `step_temp`
  - `system`
- `source`
  - `user_input`
  - `function_result`
  - `computed`
  - `system`
- `piiLevel`
  - `none`
  - `low`
  - `high`
- `persistPolicy`
  - `memory_only`
  - `save_to_crm`
  - `save_to_handoff`

#### B. State Schema

- `stateSchemaVersion`
- `stateDefaults`
- `stateWriteRules`
- `stateGuards`

#### C. Derived Variables

- `computedVariables[]`
  - `name`
  - `expression`
  - `dependencies[]`
  - `onUpdate`

### 页面行为增强

- 提供“哪些 flows / steps / functions 正在使用该变量”的反向引用面板
- 提供 state diff 预览能力，供 debug 页面复用

---

## 3.5 `components/bot/BotKnowledgeConfig.tsx`

### 页面新定位

从“知识检索配置”升级为 `Topics 绑定页`。

### 需要新增的表单项

- `topicBindings[]`
  - `topicId`
  - `enabled`
  - `priority`
  - `entryBehavior`
    - `answer_only`
    - `answer_or_action`
    - `must_enter_flow`
  - `allowedFlowIds[]`
  - `allowedFunctionIds[]`

- `knowledgeFallback`
  - `useGeneralQa`
  - `useRag`
  - `fallbackToFlow`
  - `fallbackFlowId`

- `smalltalkTopicId`
- `policyTopicIds[]`

### 需要降级的旧配置

- `kbCategories`
- `kbQACategories`
- `kbLexiconCategories`

这几组字段保留兼容，但不再作为主配置模型。

---

## 3.6 `components/knowledge/QAManager.tsx`

### 页面新定位

从 FAQ 管理器升级为 `Managed Topics` 管理器。

### 需要新增的表单区块

#### A. Topic 基础信息

- `topic.name`
- `topic.description`
- `topic.type`
  - `knowledge`
  - `transactional`
  - `policy`
  - `smalltalk`
  - `handoff`

#### B. Topic Prompt

- `topic.instructions`
- `topic.whenToUse`
- `topic.whenNotToUse`
- `topic.escalationRules`

#### C. Topic Actions

- `topic.actions[]`
  - `functionId`
  - `toolId`
  - `requiresConfirmation`
  - `writeStateKeys[]`
  - `successMessage`
  - `failureMessage`

#### D. Answer Sources

- `topic.answerMode`
  - `static_answer`
  - `qa_retrieval`
  - `rag`
  - `flow_entry`
- `topic.linkedQaIds[]`
- `topic.linkedKnowledgeSources[]`
- `topic.flowEntryId`

### 现有 QA 表单要补的字段

- `topicId`
- `entryPolicy`
- `answerPriority`
- `disallowedTools[]`
- `handoffOnFailure`

### 需要隐藏的旧交互

- 纯 FAQ 列表视图不再作为默认首页
- 默认首页改为 Topic 列表

---

## 3.7 `components/lexicon/LexiconManager.tsx`

### 需要新增的表单项

- `presetType`
  - `asr_biasing`
  - `entity_dictionary`
  - `pronunciation`
  - `business_terms`
- `language`
- `appliesTo`
  - `global`
  - `topic`
  - `flow`
  - `step`
- `linkedEntityTypes[]`
- `linkedFlowIds[]`
- `linkedStepIds[]`

### 页面行为增强

- 能被 `FlowNodeConfig` 直接引用
- 能被 `Topic` 直接引用
- 能被 `ASR` 配置直接引用

---

## 3.8 `components/flow/FlowStudio.tsx`

### 页面新定位

当前已经是最接近 PolyAI Workbench 的页面。  
改造后应成为单 bot 下的主 Flow 编排台。

### 需要新增的表单项/工作区能力

#### A. Flow 级配置

- `flow.description`
- `flow.entryConditions`
- `flow.visibleTopics[]`
- `flow.defaultDelayProfileId`
- `flow.defaultLexiconPresetIds[]`
- `flow.allowedFunctionIds[]`
- `flow.allowedToolIds[]`
- `flow.errorHandlingPolicy`

#### B. Canvas 工具栏

- 新增节点类型快捷创建
  - `Default Step`
  - `Collect Step`
  - `Function Step`
  - `Advanced Step`
  - `Handoff Exit`
  - `Finish Exit`
- “从函数创建 step”
- “从 topic 创建入口 flow”
- “校验 flow”
- “诊断回放”

#### C. Flow Validation

新增校验规则：

- 是否只有一个 start
- 是否存在不可达 step
- 是否存在无 fallback 的 collect step
- 是否引用了未暴露 function/tool
- 是否存在 state 写入但未声明 schema 的字段
- 是否存在 exit node 未配置 exitType
- 是否存在 gotoFlowId 指向不存在 flow

#### D. Debug 时间线

- 单次模拟执行 timeline
- 每个 node 的开始/结束时间
- function 执行耗时
- delay control 触发点
- 中断点
- state diff

---

## 3.9 `components/flow/FlowNodeConfig.tsx`

### 页面新定位

改成完整的 `Step Config Drawer`。

### 所有 step 都要新增的表单项

- `node.data.stepExecutionMode`
  - `speak_or_call`
  - `call_then_speak`
  - `silent_function`
- `node.data.delayProfileId`
- `node.data.interruptionPolicy`
- `node.data.allowedTopicIds[]`
- `node.data.readStateKeys[]`
- `node.data.writeStateKeys[]`
- `node.data.successMessage`
- `node.data.failureMessage`
- `node.data.fallbackNodeId`
- `node.data.latencyBudgetMs`

### `default` step 需要新增

- `speakFirst`
- `allowFreeformAnswer`
- `responseLengthHint`
- `mustAskSingleQuestion`

### `collect` step 需要新增

- `confirmationMode`
  - `implicit`
  - `explicit`
  - `none`
- `entityNormalizationFunctionId`
- `entityValidationFunctionId`
- `postCollectTransitionMode`
  - `edge_only`
  - `function_decides`

### `function` step 需要新增

- `primaryFunctionId`
- `functionArgsMapping`
- `onSuccessStateWrites`
- `onFailureStateWrites`
- `idempotencyKeyTemplate`
- `requiresUserConfirmation`
- `showDelayControl`
- `interruptWhileWaiting`

### `advanced` step 需要新增

- `dtmf.enabled`
- `dtmf.stopSpeechWhenPressed`
- `dtmf.maxDigits`
- `dtmf.finishOnHash`
- `bargeInSensitivity`
- `streamingMode`

### `exit` step 需要新增

- `exitType`
  - `finish`
  - `handoff`
  - `stop`
  - `goto_flow`
- `handoffTargetId`
- `handoffSummaryTemplate`
- `goodbyeMessage`
- `postExitAction`

---

## 3.10 `components/flow/FlowEdgeConfig.tsx`

### 需要新增的表单项

- `condition.mode`
  - `expression`
  - `entity`
  - `intent`
  - `state`
  - `function_result`
- `condition.descriptionForModel`
- `priority`
- `isFallback`
- `requiredEntities[]`
- `requiredStateKeys[]`
- `requiredFunctionResult`
- `debugRule`

### 交互增强

- label 和 description 分开显示
- label 给人看
- description 给模型看

---

## 3.11 `components/flow/FunctionManager.tsx`

### 页面新定位

从“代码块管理”改成 `Functions` 管理页。

### 需要分成三类

- `transition functions`
- `visible functions`
- `backend functions`

### 每个 function 要新增的表单项

- `functionType`
  - `transition`
  - `visible`
  - `backend`
- `runtime`
  - `local_code`
  - `http_api`
  - `connector`
- `timeoutMs`
- `retryPolicy`
- `idempotent`
- `sideEffectLevel`
  - `none`
  - `soft`
  - `hard`
- `delayControlProfileId`
- `allowUserInterruptWhilePending`
- `writesStateKeys[]`
- `readsStateKeys[]`
- `returnsSchema`
- `argSchema`
- `environmentBindingId`
- `mockResponse`
- `observabilityTags[]`

### 页面行为增强

- 从现有 flow 中反查被哪些 node 使用
- schema 编辑器
- 返回值预览
- mock 执行
- latency 模拟

### 需要隐藏的旧叫法

- “代码块”不再作为主名称
- UI 上统一叫 `Functions`

---

## 3.12 `components/tools/ToolConfigPage.tsx`

### 页面新定位

平台级 `API / Connector / Tool Registry`。

### 需要新增的表单区块

#### A. Tool Definition

- `tool.kind`
  - `api`
  - `connector`
  - `handoff`
  - `notification`
  - `data_lookup`
- `tool.baseUrl`
- `tool.path`
- `tool.method`
- `tool.auth`
- `tool.headers`
- `tool.requestSchema`
- `tool.responseSchema`

#### B. Runtime Policy

- `tool.timeoutMs`
- `tool.retryCount`
- `tool.circuitBreaker`
- `tool.region`
- `tool.environmentId`
- `tool.idempotencySupported`
- `tool.streamingSupported`

#### C. Voice Experience

- `tool.delayProfileId`
- `tool.loadingSpeechPreset`
- `tool.successSpeechPreset`
- `tool.failureSpeechPreset`

#### D. Observability

- `tool.metricNamespace`
- `tool.alertThresholdMs`
- `tool.errorRateThreshold`
- `tool.enableDiagnosisTrace`

### 页面行为增强

- “平台资源”与“当前 bot 是否引用”分开显示
- 允许按 environment 预览真实 endpoint

---

## 3.13 `components/bot/BotAgentConfig.tsx`

### 页面新定位

从“工具调用页”改成 `Agent Runtime Policy`。

### 需要新增的表单项

- `agentConfig.generalFiller`
  - 继续保留，但结构扩展
- `agentConfig.delayControlProfiles[]`
- `agentConfig.startFunctionId`
- `agentConfig.endFunctionId`
- `agentConfig.defaultVisibleFunctionIds[]`
- `agentConfig.defaultTransitionFunctionIds[]`
- `agentConfig.maxConcurrentFunctions`
- `agentConfig.progressReporting`
- `agentConfig.interruptionConfig`
- `agentConfig.streamingConfig`
- `agentConfig.defaultHandoffTargetId`
- `agentConfig.defaultTopicIds[]`
- `agentConfig.defaultFlowEntryId`

### 页面中应删除/移出的东西

- 全局工具列表编辑能力
- MCP server 作为主内容

MCP 可以保留，但应放到高级设置或平台接入层。

---

## 3.14 `components/integration/IntegrationCenter.tsx`

### 页面新定位

从通用应用市场改成 `Environment / Connectors / Alerts / Handoff`。

### 需要新增的表单区块

#### A. Environment

- `environment.name`
- `environment.region`
- `environment.baseUrl`
- `environment.authMode`
- `environment.secretsRef`
- `environment.releaseStage`
  - `sandbox`
  - `pre_release`
  - `live`

#### B. Handoff

- `handoffTargets[]`
  - `id`
  - `type`
  - `queueId`
  - `displayName`
  - `businessHours`
  - `fallbackTargetId`

#### C. Alerts

- `alerts.turnLatencyP50Threshold`
- `alerts.turnLatencyP95Threshold`
- `alerts.apiErrorsThreshold`
- `alerts.functionErrorsThreshold`
- `alerts.notifySlack`
- `alerts.notifyEmail`
- `alerts.webhookUrl`

#### D. Diagnosis / Trace Export

- `diagnosis.enabled`
- `diagnosis.traceRetentionDays`
- `diagnosis.includeStateDiff`
- `diagnosis.includeToolPayload`

### 页面行为增强

- 支持 environment 复制
- 支持 bot 绑定某个 environment
- 支持查看某个 connector 被哪些 bot/function 使用

---

## 3.15 `components/bot/BotDebugConfig.tsx`

### 页面新定位

从 mock 聊天器改成 `Turn-level Diagnosis`。

### 需要新增的面板

#### A. Turn Timeline

- `ASR start/end`
- `entity extraction`
- `LLM TTFB`
- `stream chunks`
- `function start/end`
- `delay control played`
- `TTS first audio`
- `turn end`

#### B. State Inspector

- 本轮前 state
- 本轮后 state
- diff

#### C. Flow Inspector

- 当前命中的 flow
- 当前 node
- 本轮命中的 edge
- 为什么命中

#### D. Interruption Inspector

- 是否被打断
- 打断发生在 greeting / delay / tts / function wait 哪一段
- 恢复策略是什么

### 需要接入的正式配置

- 从真实 `flowConfig`、`agentConfig`、`variables` 读取，不再仅靠 mock 逻辑

---

## 3.16 `components/flow/FlowDebugPanel.tsx`

### 需要新增的能力

- 从 debug scenario 选择 mock state
- 单步执行
- 自动回放
- 查看 function 返回值
- 查看 delay control 是否触发
- 查看 retry 是哪一条规则触发

---

## 3.17 `components/bot/BotTestConfig.tsx`

### 页面新定位

从批量评测升级为 `Flow / Topic / Runtime Test Sets`。

### 需要新增的表单项

- `testCase.initialState`
- `testCase.entryFlowId`
- `testCase.expectedPath[]`
- `testCase.expectedState[]`
- `testCase.expectedFunctions[]`
- `testCase.expectedHandoff`
- `testCase.expectedLatencyBudgetMs`
- `testCase.expectedFinalExitType`

### 需要新增的运行维度

- `text simulation`
- `voice simulation`
- `interrupt simulation`
- `slow function simulation`
- `dtmf simulation`

### 页面行为增强

- 支持从通话记录一键生成测试集
- 支持按 flow 过滤
- 支持 regression baseline

---

## 3.18 `components/report/MonitoringReport.tsx`

### 页面新定位

从 BI 仪表盘改成 `Runtime Monitoring`。

### 需要新增的指标

- `turn_latency_p50`
- `turn_latency_p95`
- `tts_first_audio_p50`
- `function_error_rate`
- `api_error_rate`
- `retry_exhaustion_rate`
- `handoff_rate`
- `topic_resolution_rate`
- `flow_completion_rate`
- `interrupt_rate`

### 需要新增的维度

- 按 bot
- 按 flow
- 按 topic
- 按 function
- 按 environment
- 按 release stage

### 需要新增的图表

- latency breakdown
- top slow functions
- top failed handoffs
- flow drop-off funnel
- topic fallback funnel

---

## 3.19 `components/call/CallRecordManager.tsx` 及详情页

### 页面新定位

从“通话记录列表”升级为 `Conversation Replay`。

### 详情页需要新增的信息块

- transcript
- turn timeline
- function calls
- delay control 播放记录
- interruption events
- flow path
- state snapshots
- handoff summary
- final exit reason

### 操作增强

- “从本通对话生成测试用例”
- “复制诊断链接”
- “按失败点跳转到对应 flow node”

---

## 4. `types.ts` 需要新增和调整的字段

以下是正式 schema 必须先补齐的内容。

## 4.1 `BotConfiguration` 新增字段

```ts
orchestrationMode?: 'legacy_router' | 'polyai_flow';
channelMode?: 'voice_only' | 'voice_and_chat';
projectId?: string;
environmentId?: string;
region?: string;
topicBindings?: TopicBinding[];
runtimeConfig?: RuntimeConfig;
voiceConfig?: VoiceRuntimeConfig;
monitoringConfig?: MonitoringConfig;
diagnosisConfig?: DiagnosisConfig;
```

### `BotConfiguration` 需要迁移/下沉的现有字段

以下字段不建议继续平铺在 bot 顶层：

- `welcomeMessageEnabled`
- `welcomeMessage`
- `welcomeMessageInterruptible`
- `transfer*`
- `hangup*`
- `noAnswer*`
- `protectionDurationMs`
- `interruptionWaitMs`
- `maxCallDurationSeconds`

应迁入：

- `runtimeConfig`
- `voiceConfig`
- `handoffPolicy`

## 4.2 `AgentConfig` 新增字段

```ts
delayControlProfiles?: DelayControlProfile[];
startFunctionId?: string;
endFunctionId?: string;
defaultVisibleFunctionIds?: string[];
defaultTransitionFunctionIds?: string[];
defaultTopicIds?: string[];
defaultFlowEntryId?: string;
maxConcurrentFunctions?: number;
progressReporting?: ProgressReportingConfig;
interruptionConfig?: InterruptionConfig;
streamingConfig?: StreamingConfig;
handoffPolicy?: HandoffPolicy;
```

## 4.3 新增 `TopicBinding`

```ts
interface TopicBinding {
  topicId: string;
  enabled: boolean;
  priority: number;
  entryBehavior: 'answer_only' | 'answer_or_action' | 'must_enter_flow';
  allowedFlowIds?: string[];
  allowedFunctionIds?: string[];
}
```

## 4.4 新增 `RuntimeConfig`

```ts
interface RuntimeConfig {
  maxTurnCount?: number;
  maxConversationDurationSec?: number;
  maxParallelFunctions?: number;
  functionTimeoutMs?: number;
  maxStateSize?: number;
  startFunctionId?: string;
  endFunctionId?: string;
}
```

## 4.5 新增 `VoiceRuntimeConfig`

```ts
interface VoiceRuntimeConfig {
  greeting?: GreetingConfig;
  interruption?: InterruptionConfig;
  silence?: SilenceConfig;
  delayControl?: DelayControlGlobalConfig;
  ttsCaching?: {
    enabled: boolean;
    cacheShortUtterancesOnly?: boolean;
  };
}
```

## 4.6 新增 `DelayControlProfile`

```ts
interface DelayControlProfile {
  id: string;
  name: string;
  thresholdMs: number;
  messages: string[];
  maxMessagesPerTurn?: number;
  interruptible?: boolean;
  stopOnFunctionReturn?: boolean;
}
```

## 4.7 新增 `FlowNodeData` 字段

```ts
stepExecutionMode?: 'speak_or_call' | 'call_then_speak' | 'silent_function';
delayProfileId?: string;
interruptionPolicy?: 'allow' | 'block' | 'reprompt';
allowedTopicIds?: string[];
readStateKeys?: string[];
writeStateKeys?: string[];
successMessage?: string;
failureMessage?: string;
fallbackNodeId?: string;
latencyBudgetMs?: number;
primaryFunctionId?: string;
functionArgsMapping?: Array<{ arg: string; source: string }>;
idempotencyKeyTemplate?: string;
requiresUserConfirmation?: boolean;
```

## 4.8 新增 `FlowFunction` 字段

```ts
functionType?: 'transition' | 'visible' | 'backend';
runtime?: 'local_code' | 'http_api' | 'connector';
timeoutMs?: number;
retryPolicy?: {
  retries: number;
  backoffMs?: number;
};
idempotent?: boolean;
sideEffectLevel?: 'none' | 'soft' | 'hard';
delayControlProfileId?: string;
allowUserInterruptWhilePending?: boolean;
readsStateKeys?: string[];
writesStateKeys?: string[];
argSchema?: string;
returnsSchema?: string;
environmentBindingId?: string;
mockResponse?: string;
observabilityTags?: string[];
```

## 4.9 新增 `QAPair` / Topic 相关字段

当前 `QAPair` 至少增加：

```ts
topicId?: string;
entryPolicy?: 'answer' | 'action' | 'flow';
answerPriority?: number;
disallowedTools?: string[];
handoffOnFailure?: boolean;
```

建议新增正式 `TopicDefinition`：

```ts
interface TopicDefinition {
  id: string;
  name: string;
  description?: string;
  type: 'knowledge' | 'transactional' | 'policy' | 'smalltalk' | 'handoff';
  instructions?: string;
  whenToUse?: string;
  whenNotToUse?: string;
  linkedQaIds?: string[];
  linkedKnowledgeSources?: string[];
  actions?: TopicAction[];
  flowEntryId?: string;
}
```

---

## 5. 哪些旧入口该隐藏或降级

## 5.1 立即降级为“兼容模式”

- `components/bot/intent/BotIntentConfig.tsx`
  - 仅用于旧 bot
  - 默认不展示给新 bot

## 5.2 从主路径移出

- `营销活动`
- `业务分析`

原因：

- 这两者不是 PolyAI 语音编排核心能力
- 放在主配置路径会稀释 Flow / Topic / Runtime 的心智

## 5.3 改名

- `代码块管理` -> `Functions`
- `工具调用` -> `Runtime Policy`
- `知识检索配置` -> `Topics`
- `流程配置` -> `Flows`

## 5.4 页面内隐藏项

- `BotBasicConfig` 中的单一大 prompt 主编辑器
  - 改为高级模式展开
- `ToolConfigPage` 中按 category 的弱业务型分组
  - 改为按 tool kind / environment / connector 分组
- `QAManager` 中 FAQ-first 首页
  - 改为 Topic-first 首页

---

## 6. 推荐实施顺序

### Phase 1：Schema 统一

- 先改 `types.ts`
- 把 `services/agentDemoBot.ts` 中已存在但未正式收编的字段吸收到 schema
- 统一 `agentConfig`、`flowConfig`、`runtimeConfig`、`voiceConfig`

### Phase 2：主工作台重构

- 改 `BotConfigForm`
- 改 `BotBasicConfig`
- 改 `BotStrategyConfig`
- 改 `BotVariableConfig`

### Phase 3：Flows / Functions 成型

- 改 `FlowStudio`
- 改 `FlowNodeConfig`
- 改 `FlowEdgeConfig`
- 改 `FunctionManager`

### Phase 4：Topics / Knowledge 成型

- 改 `BotKnowledgeConfig`
- 改 `QAManager`
- 改 `LexiconManager`

### Phase 5：Runtime / Integrations / Diagnostics

- 改 `BotAgentConfig`
- 改 `ToolConfigPage`
- 改 `IntegrationCenter`
- 改 `BotDebugConfig`
- 改 `BotTestConfig`
- 改 `MonitoringReport`
- 改 `CallRecordManager`

---

## 7. 最终落地后的产品边界

改造完成后，各页面职责应非常清晰：

- `Agent`
  - 定义这个 bot 是谁、怎么说、能不能被打断、默认怎么处理延迟和转人工
- `Flows`
  - 定义交易流程、收集步骤、函数执行、状态推进和出口
- `Topics`
  - 定义知识类、策略类、闲聊类能力，以及何时进入 flow
- `Functions`
  - 定义可以执行什么业务动作，参数/超时/副作用/可观测性是什么
- `Tools`
  - 定义平台级 API 和连接器资产
- `Debug / Test / Monitoring / Call Replay`
  - 定义怎么验证、怎么诊断、怎么监控线上质量

这套边界一旦清楚，后面再接 PolyAI 能力时，前端不会继续出现“同一个东西三个地方都能配”的问题。
