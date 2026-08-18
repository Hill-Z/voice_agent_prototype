# 提示词编辑器与引用功能 PRD

## 一、斜杠快捷引用功能

### 1.1 功能概述

在提示词编辑器中，用户输入 `/` 可快速插入变量、工具或代码块引用，实现所见即所得的编辑体验。

### 1.2 交互流程

| 步骤 | 操作          | 结果                    |
| -- | ----------- | --------------------- |
| 1  | 在编辑器中输入 `/` | 弹出引用选择下拉菜单，菜单位置跟随光标   |
| 2  | 输入关键词搜索     | 实时过滤匹配的变量/工具/代码块      |
| 3  | 点击或回车选择     | 将选中项插入到光标位置，以彩色标签形式展示 |
| 4  | 点击标签上的 ×    | 删除该引用项                |

### 1.3 引用项展示样式

| 类型  | 格式        | 样式                 |
| --- | --------- | ------------------ |
| 变量  | `{{变量名}}` | 绿色标签 + Variable 图标 |
| 工具  | `/工具名`    | 主色标签 + Wrench 图标   |
| 代码块 | `/代码块名`   | 蓝色标签 + Code 图标     |

### 1.4 快捷键

| 按键      | 功能     |
| ------- | ------ |
| `/`     | 打开引用菜单 |
| `↑` `↓` | 上下选择   |
| `Enter` | 确认选择   |
| `Esc`   | 关闭菜单   |

***

## 二、提示词拼接机制

### 2.1 提示词结构层次

系统采用分层结构拼接最终发送给LLM的完整提示词：

```
┌─────────────────────────────────────────────────────────────┐
│  System Prompt (系统提示词)                                  │
│  - 角色定义、全局行为约束、工具使用策略                       │
├─────────────────────────────────────────────────────────────┤
│  Step Prompt (步骤提示词)                                    │
│  - 当前步骤任务描述                                          │
│  - 可见函数列表（供LLM选择调用）                              │
│  - 过渡函数引用（提示LLM何时调用）                            │
│  - Few-shot示例                                              │
├─────────────────────────────────────────────────────────────┤
│  Context (上下文)                                            │
│  - 对话历史                                                  │
│  - 已收集的变量 (conv.state)                                  │
│  - RAG检索结果                                               │
├─────────────────────────────────────────────────────────────┤
│  User Input (用户输入)                                       │
│  - 当前用户输入                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 提示词拼接规则

| 层级        | 来源      | 拼接内容            | 是否必须 |
| --------- | ------- | --------------- | ---- |
| System    | 机器人配置   | 系统提示词 + 全局约束    | 是    |
| Step      | LLM节点配置 | 步骤提示词           | 是    |
| Functions | LLM节点绑定 | 可见函数签名 + 过渡函数签名 | 否    |
| Context   | 运行时     | 对话历史 + 变量状态     | 是    |
| User      | 用户输入    | 当前用户消息          | 是    |

### 2.3 全量提示词拼接实例

**场景**：预订确认流程 - 收集确认码步骤

#### 配置信息

```CQL
# 机器人系统配置
System Prompt: |
  你是专业的客服助手，帮助用户处理预订相关事宜。
  你需要保持礼貌、专业，并准确理解用户需求。

# LLM节点配置
Step Name: "收集确认码"
Step Prompt: |
  你的任务是收集用户的预订确认码。
  
  请按以下规则处理：
  - 如果用户提供了确认码，调用 /save_confirmation_code 保存
  - 如果用户要求转人工，调用 /transfer_call
  - 如果用户说再见或要结束，调用 /hangup
  
  确认码格式为字母数字组合，如：B4ZQ9

# 绑定的可见函数
Visible Functions:
  - ask_clarification: "向用户询问澄清"

# 绑定的过渡函数
Transition Functions:
  - save_confirmation_code: "保存确认码并跳转"
  - transfer_call: "转接人工"
  - hangup: "挂断电话"

# 当前对话状态
Conversation State:
  user_name: "张三"
  call_time: "2024-01-15 14:30:00"
  current_step: "收集确认码"

# 对话历史
History:
  - Assistant: "您好，请问有什么可以帮您？"
  - User: "我想查询我的预订"
  - Assistant: "好的，请提供您的确认码"

# 当前用户输入
User Input: "我的确认码是 B4ZQ9"
```

#### 最终拼接的完整提示词

````markdown
## System
你是专业的客服助手，帮助用户处理预订相关事宜。
你需要保持礼貌、专业，并准确理解用户需求。

## Available Tools (可见函数)
你可以根据上下文自主决定是否调用以下工具：

### ask_clarification
描述：向用户询问澄清
参数：
  - question: string (必填) - 询问内容

## Transition Functions (过渡函数)
根据步骤提示词中的指示调用以下函数：

### save_confirmation_code
描述：保存确认码并跳转
参数：
  - confirmation: string (必填) - 确认码

### transfer_call
描述：转接人工
参数：
  - destination: string (必填) - 目标技能组
  - reason: string (可选) - 转接原因

### hangup
描述：挂断电话
参数：
  - reason: string (可选) - 挂断原因

## Step Context
当前步骤：收集确认码

## Step Prompt
你的任务是收集用户的预订确认码。

请按以下规则处理：
- 如果用户提供了确认码，调用 /save_confirmation_code 保存
- 如果用户要求转人工，调用 /transfer_call
- 如果用户说再见或要结束，调用 /hangup

确认码格式为字母数字组合，如：B4ZQ9

## Conversation State (已收集变量)
- user_name: 张三
- call_time: 2024-01-15 14:30:00
- current_step: 收集确认码

## Conversation History
Assistant: 您好，请问有什么可以帮您？
User: 我想查询我的预订
Assistant: 好的，请提供您的确认码

## User Input
我的确认码是 B4ZQ9

## Response Format
请分析用户输入，决定是否需要调用函数。
如果需要调用函数，请输出：
```json
{
  "function_call": {
    "name": "函数名",
    "arguments": {
      "参数名": "参数值"
    }
  }
}
````

如果不需要调用函数，请直接回复用户。

```

### 2.4 LLM响应处理流程

```

用户输入: "我的确认码是 B4ZQ9"
↓
拼接完整提示词
↓
发送给LLM
↓
LLM分析 → 决定调用 save\_confirmation\_code
↓
解析函数调用
↓
执行过渡函数
↓

1. 保存确认码到 conv.state
2. 调用 flow\.goto\_step("验证确认码")
   ↓
   跳转到下一节点

````

### 2.5 变量引用替换

在提示词中引用的变量会在发送前被替换为实际值：

| 引用格式 | 替换前 | 替换后 |
|----------|--------|--------|
| `{{变量名}}` | `您好{{user_name}}` | `您好张三` |
| `/函数名` | 保留原样 | 保留原样（供LLM识别） |

---

## 三、QA知识引用工具功能

### 3.1 功能概述
在QA知识管理中，允许为每条问答绑定工具，当机器人匹配到该问答时，可调用绑定的工具获取数据或执行操作。

### 3.2 操作入口
QA管理 → 新建/编辑问答 → 表单视图 → 「绑定工具」区域

### 3.3 功能说明

| 功能点 | 说明 |
|--------|------|
| 工具选择 | 显示系统已配置的工具列表，支持多选 |
| 已选展示 | 以标签形式展示已绑定的工具，点击 × 可移除 |
| 数据保存 | 绑定的工具ID保存到 QA 对象的 `toolIds` 字段 |

### 3.4 使用场景示例
- 用户问「我的订单状态」→ 匹配QA → 调用「查询订单」工具 → 返回实时订单信息
- 用户问「附近门店」→ 匹配QA → 调用「门店查询」工具 → 返回门店列表

---

## 四、代码块管理功能

### 4.1 功能概述
代码块是预定义的Python代码片段，用于在对话流程中执行特定逻辑。代码块分为两种类型：
- **可见函数**：LLM自主决定调用，用于执行业务操作
- **过渡函数**：在提示词中引用，用于控制流程跳转

### 4.2 入口位置
核心业务导航 → 代码块

### 4.3 代码块类型

| 类型 | 说明 | 是否可编辑 |
|------|------|------------|
| 内置代码块 | 系统预置，提供基础能力 | 不可编辑 |
| 自定义代码块 | 用户创建，满足特定需求 | 可编辑 |

### 4.4 代码块分类

#### 4.4.1 可见函数（Visible Functions）
LLM根据上下文自主决定是否调用，用于执行具体业务操作。

| 名称 | 功能描述 | 使用场景 |
|------|----------|----------|
| `transfer_call` | 转接人工客服 | 用户要求转人工时使用 |
| `confirm_reservation` | 确认预约信息 | 收集到预约信息后确认 |
| `hangup` | 挂断电话 | 通话结束时使用 |
| `send_sms` | 发送短信通知 | 需要发送短信验证码或通知时 |

**使用方式**：
1. 在LLM节点的「可见函数」区域绑定
2. LLM根据用户输入自主决定是否调用
3. 函数执行具体业务逻辑，返回结果给LLM

**代码示例**：
```python
def transfer_call(conv, destination, reason=None, utterance=None):
    """转接到人工客服或指定技能组"""
    if not utterance:
        utterance = "好的，我帮您转接人工客服，请稍等。"
    return {
        "action": "transfer",
        "destination": destination,
        "reason": reason,
        "utterance": utterance
    }
````

#### 4.4.2 过渡函数（Transition Functions）

在LLM节点的步骤提示词中显式引用，用于控制流程跳转。

| 名称                   | 功能描述         | 使用场景         |
| -------------------- | ------------ | ------------ |
| `save_state`         | 保存变量到对话状态    | 需要保存用户输入到变量时 |
| `goto_step`          | 跳转到指定流程步骤    | 需要跳转到特定步骤时   |
| `goto_flow`          | 跳转到另一个流程     | 需要切换到其他流程时   |
| `conditional_goto`   | 根据条件跳转到不同步骤  | 需要条件分支时      |
| `collect_value`      | 收集用户输入并保存到变量 | 主动收集用户信息时    |
| `check_verification` | 检查验证状态，支持重试  | 验证码验证失败重试时   |

**使用方式**：

1. 在LLM节点的「过渡函数」区域绑定
2. 在步骤提示词中使用 `/函数名` 引用
3. LLM根据提示词指示调用对应函数
4. 函数内部使用 `flow.goto_step()` 控制跳转

**代码示例**：

```python
def save_confirmation_code(conv, flow, confirmation):
    """保存确认码并跳转到下一步"""
    conv.state['confirmation_code'] = confirmation
    # 控制流程跳转到指定步骤
    flow.goto_step("Collect first name")
    return
```

**步骤提示词示例**：

```
你是预订确认助手。
请收集用户的确认码。
- 如果用户提供了确认码，调用 /save_confirmation_code
- 如果用户要求转人工，调用 /transfer_call
- 如果用户说再见，调用 /hangup
```

### 4.5 自定义代码块

| 字段 | 说明                              |
| -- | ------------------------------- |
| 名称 | 代码块标识，用于引用                      |
| 描述 | 功能说明                            |
| 类型 | visible（可见函数）/ transition（过渡函数） |
| 参数 | 定义入参名称和类型                       |
| 代码 | Python代码实现                      |

**过渡函数特有配置**：

* `canGotoStep`: 是否可以使用 `flow.goto_step()`

* `canGotoFlow`: 是否可以使用 `flow.goto_flow()`

* `canModifyState`: 是否可以修改 `conv.state`

**可见函数特有配置**：

* `executionStrategy`: 执行策略（sync/async）

* `playFiller`: 是否播放等待音

* `fillerContent`: 等待音内容

### 4.6 代码上下文对象

代码块可访问以下对象：

| 对象     | 说明   | 常用方法/属性                                                        |
| ------ | ---- | -------------------------------------------------------------- |
| `conv` | 对话对象 | `conv.state` - 对话状态存储                                          |
| `flow` | 流程对象 | `flow.goto_step("步骤名")` - 跳转到步骤`flow.goto_flow("流程名")` - 跳转到流程 |

**状态管理示例**：

```python
def save_user_info(conv, flow, name, phone):
    """保存用户信息"""
    # 保存到对话状态
    conv.state['user_name'] = name
    conv.state['user_phone'] = phone
    
    # 读取之前保存的状态
    previous_step = conv.state.get('current_step', 'unknown')
    
    # 控制流程跳转
    if phone:
        flow.goto_step("验证手机")
    else:
        flow.goto_step("收集手机")
    
    return {"status": "success"}
```

### 4.7 函数类型对比

| 特性        | 可见函数     | 过渡函数           |
| --------- | -------- | -------------- |
| **调用方式**  | LLM自主决定  | 提示词中显式引用       |
| **主要用途**  | 业务执行     | 流程控制           |
| **可跳转步骤** | ❌ 不可以    | ✅ 可以           |
| **可修改状态** | ✅ 可以     | ✅ 可以           |
| **返回值**   | 返回结果给LLM | 通常不返回值         |
| **配置位置**  | LLM节点    | LLM节点          |
| **提示词引用** | 不需要显式引用  | 使用 `/函数名` 显式引用 |

***

## 五、功能关联关系

```
┌─────────────────────────────────────────────────────────┐
│                    代码块管理                            │
│  ┌─────────────┐  ┌─────────────┐                      │
│  │ 内置代码块   │  │ 自定义代码块 │                      │
│  └─────────────┘  └─────────────┘                      │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  基础配置      │ │  意图技能      │ │  QA知识管理   │
│  系统提示词    │ │  LLM节点      │ │  问答绑定     │
│  /快捷引用    │ │  /快捷引用    │ │  工具绑定     │
└───────────────┘ └───────────────┘ └───────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        ↓
              ┌─────────────────┐
│    工具管理      │
│  (短信/查询等)   │
└─────────────────┘
```

***

## 六、数据结构

### 6.1 QA问答

```typescript
interface QAPair {
  id: string;
  question: string;
  answer: string;
  toolIds?: string[];  // 绑定的工具ID列表
}
```

### 6.2 LLM节点配置

```typescript
interface LLMNodeConfig {
  systemPrompt: string;           // 系统提示词
  stepPrompt: string;             // 步骤提示词
  toolIds?: string[];             // 绑定的工具ID列表
  visibleFunctionIds?: string[];  // 绑定的可见函数ID列表
  transitionFunctionIds?: string[]; // 绑定的过渡函数ID列表
}
```

### 6.3 代码块

```typescript
interface FlowFunction {
  id: string;
  name: string;
  description: string;
  category: 'visible' | 'transition';  // 函数类型
  parameters: FlowFunctionParameter[];
  code?: string;
  isBuiltIn: boolean;
  
  // 过渡函数特有配置
  transitionConfig?: {
    canGotoStep: boolean;
    canGotoFlow: boolean;
    canModifyState: boolean;
  };
  
  // 可见函数特有配置
  visibleConfig?: {
    executionStrategy: 'sync' | 'async';
    playFiller?: boolean;
    fillerContent?: string;
  };
}
```

### 6.4 最终提示词结构

```typescript
interface FinalPrompt {
  system: string;           // System Prompt
  step: string;             // Step Prompt
  visibleFunctions: string; // 可见函数签名列表
  transitionFunctions: string; // 过渡函数签名列表
  context: {
    state: Record<string, any>;  // 对话状态
    history: Message[];          // 对话历史
  };
  user: string;             // 用户输入
}
```

