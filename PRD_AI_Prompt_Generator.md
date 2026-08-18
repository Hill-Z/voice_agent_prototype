# AI 智能提示词工坊 - 产品需求文档（PRD）

## 1. 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 创建日期 | 2026-02-27 |
| 产品负责人 | AI 产品团队 |
| 技术负责人 | 前端/AI 工程团队 |

---

## 2. 产品概述

### 2.1 产品背景

在语音机器人配置过程中，编写高质量的系统提示词（System Prompt）是核心环节，但面临以下挑战：

- **专业门槛高**：需要理解 LLM 的特性、语音交互的特殊性
- **耗时耗力**：人工编写一个完整的提示词可能需要数小时
- **质量不稳定**：不同人员编写的提示词效果差异大
- **难以优化**：缺乏数据反馈，不知道提示词效果如何改进

### 2.2 产品目标

通过 AI 技术，让用户只需提供简单的业务描述或上传业务文档截图，即可自动生成专业、高质量的机器人提示词，降低配置门槛，提升配置效率。

### 2.3 目标用户

| 用户类型 | 需求场景 | 核心痛点 |
|---------|---------|---------|
| 业务运营人员 | 快速配置机器人 | 不懂技术，不会写提示词 |
| 产品经理 | 验证业务方案 | 需要快速原型 |
| 技术实施人员 | 批量配置机器人 | 重复劳动，效率低 |
| 客服主管 | 优化现有话术 | 缺乏优化方向 |

---

## 3. 功能需求

### 3.1 核心功能架构

```
┌─────────────────────────────────────────────────────────────┐
│                    AI 智能提示词工坊                         │
├─────────────────────────────────────────────────────────────┤
│  输入层  │  处理层  │  输出层  │  应用层                      │
├─────────┼─────────┼─────────┼──────────────────────────────┤
│业务场景  │AI 解析  │机器人描述│一键应用                      │
│定义      │         │         │                              │
├─────────┤         ├─────────┤                              │
│文本描述  │变量注入 │系统提示词│编辑优化                      │
├─────────┤         │         │                              │
│图片上传  │多模态   │思维链   │版本对比                      │
│(SOP截图) │理解     │配置     │                              │
└─────────┴─────────┴─────────┴──────────────────────────────┘
```

### 3.2 功能模块详细设计

#### 3.2.1 业务场景定义

**功能描述**：用户选择机器人类型和业务场景，为 AI 提供上下文。

**需求详情**：

| 字段 | 类型 | 必填 | 选项值 | 说明 |
|------|------|------|--------|------|
| 所属行业 | 下拉选择 | 是 | 金融信贷、教育培训、电商零售、政务服务、医疗健康、企业服务、通用场景 | 决定 AI 的专业术语库 |
| 应用场景 | 下拉选择 | 是 | 客户接待/咨询、销售外呼/邀约、回访/通知、催收/提醒、信息核实、投诉处理 | 决定话术风格 |
| 可用变量 | 自动展示 | 否 | - | 展示已配置的变量，AI 会自动在提示词中使用 |

**交互设计**：
- 行业和应用场景使用级联选择，选择行业后推荐常用场景
- 变量区域显示为标签云，hover 显示变量描述

#### 3.2.2 素材导入

**功能描述**：支持文本描述和图片上传两种方式输入业务需求。

**需求详情**：

**方式一：文本描述**
- 输入框支持多行文本
- 占位符提示："请粘贴您的业务话术 SOP，或直接描述需求。例如：'这是一个催收机器人，开场需要核实身份，如果用户承认是本人，则告知欠款金额{{amount}}...'"
- 支持粘贴 Markdown 格式

**方式二：图片上传**
- 支持格式：PNG、JPG、JPEG
- 最大文件大小：5MB
- 支持拖拽上传
- 图片预览功能
- 可添加补充说明文本

**AI 解析能力**：
- 文本理解：提取业务逻辑、话术流程、关键信息
- 图片理解（OCR + 视觉理解）：
  - 识别流程图中的分支逻辑
  - 提取话术文本
  - 理解箭头指向的业务流程
  - 识别关键节点和判断条件

#### 3.2.3 AI 生成引擎

**核心能力**：

1. **业务逻辑提取**
   - 识别开场白、结束语
   - 提取关键业务节点
   - 理解条件分支（if/else）
   - 识别循环和跳转逻辑

2. **变量自动注入**
   - 扫描用户输入，识别可能需要变量的位置
   - 匹配已配置的变量库
   - 自动替换为 `{{variable_name}}` 格式
   - 未匹配到的变量给出提示

3. **语音优化**
   - 书面语转口语化
   - 添加语气词（啊、呢、吧）
   - 长句拆分（每句不超过 50 字）
   - 数字日期自然读法转换

4. **思维链配置**
   - 自动生成 `<thought>` 分析框架
   - 配置半句识别逻辑
   - 配置上下文无关识别逻辑
   - 配置打断处理策略

**输出格式**：

```json
{
  "description": "机器人描述（50字以内）",
  "systemPrompt": "系统提示词（Markdown 格式）",
  "suggestedIntents": ["建议的意图列表"],
  "suggestedVariables": ["建议的变量列表"]
}
```

---

#### 3.2.3.1 内置提示词设计（Meta-Prompt）

**设计原则**：
- 使用结构化提示词，明确 Role-Context-Task-Requirements-Output 五要素
- 采用 Few-shot 示例引导输出格式
- 嵌入语音交互专业知识，确保生成结果符合行业最佳实践
- 支持多模态输入（文本+图片），统一处理逻辑

**完整 Meta-Prompt 模板**：

```markdown
# Role
你是一位拥有10年经验的语音机器人提示词工程专家，精通：
- 大型语言模型（LLM）的行为塑造与约束
- 语音交互设计（VUI）的最佳实践
- 电话场景下的用户心理与沟通策略
- 中文口语化表达与语气词运用

你的任务是根据用户提供的业务素材，生成生产级的机器人系统提示词（System Prompt）。

# Context
## 业务背景
- 所属行业：{{INDUSTRY}}
- 应用场景：{{SCENARIO}}

## 可用变量列表（必须在提示词中使用）
{{VARIABLES}}

## 语音交互核心原则
1. **口语化优先**：使用"咱们"而非"我们"，使用"说"而非"表示"
2. **短句原则**：每句话控制在30-50字，便于用户记忆和回应
3. **反AI特征**：禁止"我理解您的感受"、"作为AI助手"等机器话术
4. **自然停顿**：使用"啊"、"呢"、"吧"、"哈"等语气词增加亲和力
5. **数字读法**：日期读作"5月20号"而非"2024-05-20"，金额读作"一千二百块"而非"¥1,200.00"

## 思维链（CoT）交互协议
生成的提示词必须包含以下分析框架，让机器人在说话前进行静默思考：

```
<thought>
1. 【完整性检查】用户的话是否完整？如果是半句（如"我想..."、"那个..."），应等待而非回应
2. 【相关性检查】用户的话是否与当前话题相关？如果是背景噪音或旁白，应忽略
3. 【意图识别】用户的真实意图是什么？是否有言外之意？
4. 【策略选择】根据意图选择回应策略：确认/追问/转移/结束
</thought>
```

# Task
分析用户提供的业务素材（文本描述和/或图片），完成以下任务：

## Task 1: 提取业务逻辑
从素材中提取：
- 开场白话术（必须包含身份确认）
- 核心业务节点（3-7个关键步骤）
- 分支判断条件（if/else 逻辑）
- 结束话术（正常结束/异常结束）
- 转人工触发条件

## Task 2: 生成机器人描述
用50字以内概括机器人的核心功能和价值主张。

## Task 3: 生成系统提示词
按照以下结构生成完整的 System Prompt：

```markdown
# {{BOT_NAME}} - 系统提示词

## 角色定义
你是{{ROLE_DESCRIPTION}}，正在通过电话与用户沟通。

## 核心任务
{{MAIN_TASK}}

## 可用信息
{{VARIABLES_USAGE}}

## 话术规范
### 开场白
{{OPENING_SCRIPT}}

### 流程节点
{{FLOW_NODES}}

### 结束话术
{{CLOSING_SCRIPTS}}

## 交互协议
{{COT_PROTOCOL}}

## 约束条件
{{CONSTRAINTS}}
```

## Task 4: 建议意图列表
根据业务流程，建议3-5个核心意图（Intents）用于后续配置。

## Task 5: 建议变量列表
识别素材中可能需要动态替换的数据字段，建议新增变量。

# Requirements
## 输出质量要求
1. **准确性**：必须忠实反映用户素材中的业务流程，不得臆造
2. **完整性**：必须包含开场、流程、结束、异常处理全流程
3. **口语化**：所有话术必须经过口语化转换，禁止书面语
4. **变量使用**：必须在合适位置使用 `{{variable_name}}` 格式插入变量
5. **可执行性**：生成的提示词可以直接用于生产环境

## 禁止事项
- 禁止生成超过100字的连续段落
- 禁止出现"AI"、"机器人"、"智能助手"等自我暴露词汇
- 禁止在回应开头使用"好的"、"明白了"、"我理解"等填充语
- 禁止要求用户提供敏感信息（密码、验证码等）

## 行业特殊要求
{{INDUSTRY_SPECIFIC_REQUIREMENTS}}

# Output Format
必须以JSON格式输出，结构如下：

```json
{
  "description": "string (50字以内)",
  "systemPrompt": "string (Markdown格式，包含完整提示词)",
  "suggestedIntents": [
    {
      "name": "string (意图名称，如'确认欠款')",
      "description": "string (意图描述)",
      "examples": ["string (示例用户说法)"]
    }
  ],
  "suggestedVariables": [
    {
      "name": "string (变量名)",
      "description": "string (变量用途)",
      "type": "string (类型: input|conversation|extraction)"
    }
  ],
  "analysis": {
    "businessFlow": ["string (业务流程节点)"],
    "keyPoints": ["string (关键注意点)"],
    "riskWarnings": ["string (风险提示)"]
  }
}
```

# Input Data
## 用户文本描述
{{USER_TEXT}}

## 图片素材
{{IMAGE_DATA}}

---
请基于以上信息，生成高质量的机器人配置。
```

---

#### 3.2.3.2 Agent 处理架构

**Agent 设计模式**：采用 ReAct (Reasoning + Acting) 模式，让 AI 先思考再行动

**Agent 工作流程**：

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI 生成引擎 Agent                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   输入解析    │───▶│   思考规划    │───▶│   执行生成    │      │
│  │  (Parse)     │    │  (Reason)    │    │  (Act)       │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      观察反馈                            │   │
│  │  (Observation: 检查生成质量，如有问题循环优化)            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      输出结果                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Agent 核心组件**：

| 组件 | 职责 | 实现方式 |
|------|------|----------|
| Input Parser | 解析用户输入，提取关键信息 | 正则匹配 + LLM 提取 |
| Context Builder | 构建生成上下文，注入变量 | 模板渲染 |
| Prompt Engineer | 调用大模型生成提示词 | Gemini API |
| Quality Checker | 检查生成结果质量 | 规则引擎 + LLM 评估 |
| Output Formatter | 格式化输出结果 | JSON Schema 校验 |

**Agent 处理步骤详解**：

**Step 1: 输入解析（Parse）**

```typescript
interface ParseResult {
  industry: string;           // 行业
  scenario: string;           // 场景
  userIntent: string;         // 用户核心意图
  businessFlow: string[];     // 识别出的业务流程
  keyEntities: Entity[];      // 关键实体（金额、日期等）
  variablesNeeded: string[];  // 需要的变量
  imageAnalysis?: string;     // 图片分析结果（如有）
}

// 解析逻辑
async function parseInput(input: UserInput): Promise<ParseResult> {
  // 1. 提取结构化信息
  const structured = extractStructuredData(input.text);
  
  // 2. 如有图片，进行视觉分析
  let imageAnalysis = null;
  if (input.image) {
    imageAnalysis = await analyzeImage(input.image);
  }
  
  // 3. 识别业务实体
  const entities = await extractEntities(input.text + (imageAnalysis || ''));
  
  // 4. 推断需要的变量
  const variablesNeeded = inferVariables(entities);
  
  return {
    industry: input.industry,
    scenario: input.scenario,
    userIntent: structured.intent,
    businessFlow: structured.flow,
    keyEntities: entities,
    variablesNeeded,
    imageAnalysis,
  };
}
```

**Step 2: 思考规划（Reason）**

```typescript
interface GenerationPlan {
  strategy: 'standard' | 'complex' | 'simple';  // 生成策略
  sections: SectionPlan[];                       // 各段落规划
  tone: 'professional' | 'friendly' | 'urgent'; // 语气风格
  estimatedLength: number;                       // 预估长度
  specialRequirements: string[];                 // 特殊要求
}

// 规划逻辑
async function planGeneration(parseResult: ParseResult): Promise<GenerationPlan> {
  const plan: GenerationPlan = {
    strategy: determineStrategy(parseResult),
    sections: [],
    tone: determineTone(parseResult.industry, parseResult.scenario),
    estimatedLength: 0,
    specialRequirements: [],
  };
  
  // 根据业务复杂度选择策略
  if (parseResult.businessFlow.length > 5) {
    plan.strategy = 'complex';
  } else if (parseResult.businessFlow.length < 3) {
    plan.strategy = 'simple';
  }
  
  // 规划各段落
  plan.sections = [
    { type: 'role', priority: 1, content: '角色定义' },
    { type: 'task', priority: 2, content: '核心任务' },
    { type: 'opening', priority: 3, content: '开场白' },
    { type: 'flow', priority: 4, content: '流程节点' },
    { type: 'closing', priority: 5, content: '结束话术' },
    { type: 'protocol', priority: 6, content: '交互协议' },
  ];
  
  // 行业特殊要求
  plan.specialRequirements = getIndustryRequirements(parseResult.industry);
  
  return plan;
}
```

**Step 3: 执行生成（Act）**

```typescript
// 生成逻辑
async function executeGeneration(
  parseResult: ParseResult,
  plan: GenerationPlan
): Promise<GenerationResult> {
  
  // 1. 构建 Meta-Prompt
  const metaPrompt = buildMetaPrompt(parseResult, plan);
  
  // 2. 调用大模型
  const response = await callLLM({
    model: 'gemini-2.0-flash',
    prompt: metaPrompt,
    temperature: 0.7,
    maxTokens: 4000,
  });
  
  // 3. 解析响应
  const rawResult = parseLLMResponse(response);
  
  // 4. 后处理
  const processedResult = postProcess(rawResult, parseResult);
  
  return processedResult;
}

// Meta-Prompt 构建
function buildMetaPrompt(parseResult: ParseResult, plan: GenerationPlan): string {
  return META_PROMPT_TEMPLATE
    .replace('{{INDUSTRY}}', parseResult.industry)
    .replace('{{SCENARIO}}', parseResult.scenario)
    .replace('{{VARIABLES}}', formatVariables(parseResult.variablesNeeded))
    .replace('{{USER_TEXT}}', parseResult.userIntent)
    .replace('{{IMAGE_DATA}}', parseResult.imageAnalysis || '无图片')
    .replace('{{INDUSTRY_SPECIFIC_REQUIREMENTS}}', 
      plan.specialRequirements.join('\n'));
}
```

**Step 4: 质量检查（Observation）**

```typescript
interface QualityReport {
  score: number;              // 0-100 分
  passed: boolean;            // 是否通过
  issues: QualityIssue[];     // 问题列表
  suggestions: string[];      // 改进建议
}

interface QualityIssue {
  type: 'critical' | 'warning' | 'info';
  category: 'completeness' | 'colloquialism' | 'variables' | 'safety';
  message: string;
  location?: string;
}

// 质量检查逻辑
async function checkQuality(result: GenerationResult): Promise<QualityReport> {
  const issues: QualityIssue[] = [];
  
  // 1. 完整性检查
  if (!result.systemPrompt.includes('开场白')) {
    issues.push({
      type: 'critical',
      category: 'completeness',
      message: '缺少开场白部分',
    });
  }
  
  // 2. 口语化检查
  const writtenWords = ['因此', '然而', '综上所述', '根据'];
  writtenWords.forEach(word => {
    if (result.systemPrompt.includes(word)) {
      issues.push({
        type: 'warning',
        category: 'colloquialism',
        message: `发现书面语词汇：${word}`,
        location: word,
      });
    }
  });
  
  // 3. 变量使用检查
  const variableMatches = result.systemPrompt.match(/\{\{\w+\}\}/g) || [];
  if (variableMatches.length < 2) {
    issues.push({
      type: 'warning',
      category: 'variables',
      message: '变量使用较少，建议增加动态内容',
    });
  }
  
  // 4. 安全检查
  const sensitiveWords = ['密码', '验证码', '身份证号'];
  sensitiveWords.forEach(word => {
    if (result.systemPrompt.includes(word)) {
      issues.push({
        type: 'critical',
        category: 'safety',
        message: `发现敏感词汇：${word}，请确认是否符合安全规范`,
      });
    }
  });
  
  // 计算总分
  const criticalCount = issues.filter(i => i.type === 'critical').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  const score = Math.max(0, 100 - criticalCount * 20 - warningCount * 5);
  
  return {
    score,
    passed: score >= 80 && criticalCount === 0,
    issues,
    suggestions: generateSuggestions(issues),
  };
}
```

**Step 5: 迭代优化（Loop）**

```typescript
// 如果质量检查未通过，进行迭代优化
async function optimizeResult(
  result: GenerationResult,
  qualityReport: QualityReport
): Promise<GenerationResult> {
  
  let optimized = result;
  let attempts = 0;
  const maxAttempts = 3;
  
  while (!qualityReport.passed && attempts < maxAttempts) {
    attempts++;
    
    // 构建优化提示词
    const optimizationPrompt = `
      请优化以下机器人提示词，解决以下问题：
      ${qualityReport.issues.map(i => `- ${i.message}`).join('\n')}
      
      当前提示词：
      ${optimized.systemPrompt}
      
      请输出优化后的完整提示词。
    `;
    
    // 重新生成
    const response = await callLLM({
      model: 'gemini-2.0-flash',
      prompt: optimizationPrompt,
      temperature: 0.5,
    });
    
    optimized = parseLLMResponse(response);
    
    // 重新检查质量
    qualityReport = await checkQuality(optimized);
  }
  
  return optimized;
}
```

---

#### 3.2.3.3 变量智能注入策略

**注入流程**：

```
用户输入 → 实体识别 → 变量匹配 → 位置分析 → 智能替换 → 结果输出
```

**注入规则**：

| 实体类型 | 示例 | 匹配变量 | 注入位置 |
|---------|------|---------|---------|
| 人名 | 张三、李四 | {{customer_name}} | 称呼位置 |
| 金额 | 1000元、五千块 | {{amount}}、{{debt_amount}} | 告知位置 |
| 日期 | 5月20日、下周一 | {{due_date}}、{{appointment_date}} | 约定位置 |
| 电话号码 | 138xxxx | {{phone_number}} | 确认位置 |
| 订单号 | DD2024xxx | {{order_id}} | 查询位置 |
| 公司名称 | 滴滴出行 | {{company_name}} | 开场白 |

**注入示例**：

```
原文："您有一笔1000元的欠款需要在本月20日前还清"

注入后："您有一笔{{debt_amount}}元的欠款需要在{{due_date}}前还清"
```

---

#### 3.2.3.4 语音优化策略

**口语化转换规则**：

| 书面语 | 口语化 | 场景 |
|--------|--------|------|
| 因此 | 所以啊 | 因果连接 |
| 然而 | 不过呢 | 转折 |
| 综上所述 | 总的来说 | 总结 |
| 根据 | 按照 | 依据 |
| 是否 | 是不是 | 疑问 |
| 请提供 | 麻烦您给一下 | 请求 |
| 核实 | 确认一下 | 确认 |
| 告知 | 说一下 | 通知 |

**语气词插入策略**：

```typescript
const PARTICLE_RULES = [
  { pattern: /。$/g, particles: ['啊', '呢', '哈'], probability: 0.3 },
  { pattern: /？$/g, particles: ['呢', '吗'], probability: 0.5 },
  { pattern: /，/g, particles: ['啊'], probability: 0.1 },
];

function addParticles(text: string): string {
  return PARTICLE_RULES.reduce((result, rule) => {
    if (Math.random() < rule.probability) {
      const particle = rule.particles[Math.floor(Math.random() * rule.particles.length)];
      return result.replace(rule.pattern, particle + '$&');
    }
    return result;
  }, text);
}
```

**长句拆分策略**：

```typescript
function splitLongSentences(text: string, maxLength: number = 50): string {
  const sentences = text.split(/([。！？])/);
  const result: string[] = [];
  
  sentences.forEach(sentence => {
    if (sentence.length > maxLength) {
      // 在逗号处拆分
      const parts = sentence.split(/，/);
      let current = '';
      
      parts.forEach(part => {
        if ((current + part).length > maxLength) {
          if (current) result.push(current + '。');
          current = part;
        } else {
          current += (current ? '，' : '') + part;
        }
      });
      
      if (current) result.push(current + '。');
    } else {
      result.push(sentence);
    }
  });
  
  return result.join('');
}
```

#### 3.2.4 结果展示与编辑

**功能描述**：展示 AI 生成的结果，支持预览和编辑。

**需求详情**：

**机器人描述**
- 只读展示区域
- 显示生成的描述文本
- 支持一键复制

**系统提示词**
- 可编辑的文本区域
- Markdown 语法高亮
- 行号显示
- 支持全屏编辑
- 字数统计

**操作按钮**
- 重新生成：使用相同输入重新生成
- 放弃：关闭弹窗，不保存
- 应用到配置：将结果填入机器人配置表单

#### 3.2.5 版本对比（可选增强）

**功能描述**：支持对比不同版本的生成结果。

**需求详情**：
- 保存最近 5 次生成记录
- 左右分栏对比视图
- 高亮显示差异部分
- 支持选择最优版本应用

---

## 4. 技术方案

### 4.1 AI 模型选择

| 模型 | 用途 | 原因 |
|------|------|------|
| Gemini 2.0 Flash | 主生成模型 | 速度快、成本低、多模态能力强 |
| Gemini 2.0 Pro | 复杂场景 | 逻辑推理能力强，适合复杂业务流程 |

### 4.2 提示词工程

**Meta-Prompt 结构**：

```
# Role
定义 AI 角色为"高级语音机器人提示词工程师"

# Context
- 行业背景
- 应用场景
- 可用变量列表

# Task
1. 分析用户输入
2. 生成描述
3. 生成系统提示词

# Requirements
- 口语化要求
- 反 AI 特征要求
- 短句规则
- 思维链配置

# Output Format
JSON Schema 定义
```

### 4.3 错误处理

| 错误类型 | 处理策略 | 用户提示 |
|---------|---------|---------|
| AI 生成失败 | 重试 3 次后报错 | "生成失败，请检查网络后重试" |
| 图片解析失败 | 提示用户补充文字描述 | "图片识别失败，请补充文字说明" |
| 生成内容不完整 | 标记缺失部分 | "部分内容生成不完整，请手动补充" |
| 变量匹配失败 | 列出未匹配变量 | "以下变量未能自动匹配：xxx" |

---

## 5. 用户体验设计

### 5.1 交互流程

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  打开    │───▶│  选择    │───▶│  输入    │───▶│  点击    │
│  弹窗    │    │  场景    │    │  素材    │    │  生成    │
└──────────┘    └──────────┘    └──────────┘    └────┬─────┘
                                                      │
                         ┌────────────────────────────┘
                         ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  应用    │◀───│  编辑    │◀───│  查看    │◀───│  AI      │
│  配置    │    │  优化    │    │  结果    │    │  生成    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### 5.2 界面布局

**三栏布局**：
- 左栏（30%）：场景配置 + 素材输入
- 中栏（分隔线）：可拖拽调整宽度
- 右栏（70%）：结果预览 + 编辑区

**响应式适配**：
- 大屏（>1440px）：三栏布局
- 中屏（1024px-1440px）：左栏可收起
- 小屏（<1024px）：步骤式向导

### 5.3 视觉设计

**色彩方案**：
- 主色调：Indigo（科技、智能感）
- 辅助色：Purple（创意、AI 感）
- 成功色：Green（生成成功）
- 背景色：Slate-50（柔和、专业）

**动效设计**：
- 生成中：Sparkles 图标旋转动画
- 生成完成：淡入 + 从右滑入动画
- 切换输入方式：平滑过渡

---

## 6. 数据埋点

### 6.1 核心指标

| 指标 | 定义 | 目标值 |
|------|------|--------|
| 功能使用率 | 使用 AI 生成功能的用户占比 | > 60% |
| 生成成功率 | 成功生成提示词的请求占比 | > 95% |
| 应用率 | 生成后点击"应用"的占比 | > 70% |
| 平均生成时间 | 从点击生成到结果展示的时间 | < 5s |
| 用户满意度 | 用户对生成结果的评分 | > 4.0/5 |

### 6.2 埋点事件

```javascript
// 关键埋点事件
{
  "prompt_generator_open": "打开提示词生成器",
  "prompt_generator_select_industry": "选择行业",
  "prompt_generator_select_scenario": "选择场景",
  "prompt_generator_input_text": "输入文本描述",
  "prompt_generator_upload_image": "上传图片",
  "prompt_generator_click_generate": "点击生成",
  "prompt_generator_generate_success": "生成成功",
  "prompt_generator_generate_fail": "生成失败",
  "prompt_generator_click_apply": "点击应用",
  "prompt_generator_click_regenerate": "点击重新生成",
  "prompt_generator_edit_prompt": "编辑提示词"
}
```

---

## 7. 迭代规划

### 7.1 MVP 版本（当前）

- [x] 基础场景选择（行业 + 场景）
- [x] 文本输入生成
- [x] 图片上传生成
- [x] 变量自动注入
- [x] 结果展示和编辑
- [x] 一键应用

### 7.2 V1.1 版本（1 个月内）

- [ ] 历史版本保存
- [ ] 版本对比功能
- [ ] 提示词模板库
- [ ] 生成结果评分反馈

### 7.3 V1.2 版本（3 个月内）

- [ ] 基于通话数据的提示词优化建议
- [ ] A/B 测试支持
- [ ] 团队协作（共享提示词模板）
- [ ] 多语言支持

### 7.4 V2.0 版本（6 个月内）

- [ ] 意图自动识别和生成
- [ ] 全流程自动化配置
- [ ] 智能优化建议（基于通话质量数据）
- [ ] 行业最佳实践推荐

---

## 8. 风险与应对

| 风险 | 影响 | 概率 | 应对策略 |
|------|------|------|---------|
| AI 生成质量不稳定 | 高 | 中 | 建立质量评估机制，低质量结果给出提示 |
| 生成速度慢 | 中 | 中 | 增加 loading 状态，优化提示词减少 token |
| 用户不会描述需求 | 高 | 高 | 提供示例模板，增加引导提示 |
| 图片识别准确率低 | 中 | 中 | 结合 OCR，提供图片质量检测 |
| 成本过高 | 中 | 低 | 缓存常见场景结果，限制生成长度 |

---

## 9. 附录

### 9.1 术语表

| 术语 | 解释 |
|------|------|
| System Prompt | 系统提示词，定义 AI 角色和行为的指令 |
| Meta-Prompt | 用于生成提示词的提示词 |
| 思维链 (CoT) | Chain of Thought，让 AI 分步思考的机制 |
| 变量注入 | 将业务变量自动插入到提示词中 |
| 多模态 | 同时处理文本、图片等多种输入形式 |

### 9.2 参考资源

- [Voice Bot Prompt Engineering Best Practices](https://example.com)
- [Gemini API Documentation](https://ai.google.dev)
- [语音交互设计规范](./voice-interaction-design.md)

---

**文档结束**
