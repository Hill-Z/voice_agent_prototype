# RAG (检索增强生成) 接入 Spec

## Why

当前系统的知识库采用传统的关键词匹配和规则匹配方式，存在以下问题：

1. **匹配精度低**：用户问法多样化，关键词匹配难以覆盖所有表达方式
2. **语义理解弱**：无法理解用户问题的真实意图，只能做字面匹配
3. **知识维护难**：需要维护大量相似问法，人工成本高
4. **无法处理开放域问题**：对于未配置的问题无法给出合理回答

通过接入 RAG 技术，利用向量检索和语义理解，可以：
- 提升问题匹配的准确率（从关键词匹配提升到语义匹配）
- 减少相似问法的人工维护成本
- 支持开放域问答，提供更自然的对话体验
- 实现知识的动态更新和实时检索

## What Changes

- 新增向量数据库支持（Qdrant/Milvus/Pinecone）
- 新增文本向量化服务（Embedding Service）
- 新增 RAG 检索服务（RAG Service）
- 新增 RAG 配置管理界面
- 修改知识库管理，支持向量索引
- 修改 LLM 节点，支持 RAG 上下文注入
- 新增 RAG 检索结果展示组件
- 新增 RAG 效果评估工具

## Impact

- Affected specs: QAManager, BotBusinessConfig, MicroFlowEditor
- Affected code:
  - `types.ts` - 新增 RAG 相关类型定义
  - `services/ragService.ts` - 新增 RAG 服务
  - `services/embeddingService.ts` - 新增向量化服务
  - `components/knowledge/RAGConfig.tsx` - 新增 RAG 配置组件
  - `components/knowledge/QAManager.tsx` - 集成向量索引管理
  - `components/bot/intent/nodes/LLMNodeConfig.tsx` - 支持 RAG 上下文
  - `components/bot/BotBusinessConfig.tsx` - 知识库配置增加 RAG 选项

## ADDED Requirements

### Requirement: 向量数据库集成

The system SHALL provide vector database integration for semantic search:

#### Scenario: 配置向量数据库连接
- **WHEN** 管理员进入知识库配置页面
- **THEN** 可以配置向量数据库连接参数（地址、端口、API Key）
- **AND** 支持测试连接
- **AND** 支持多种向量数据库（Qdrant、Milvus、Pinecone）

#### Scenario: 自动创建集合/索引
- **WHEN** 配置完成后
- **THEN** 系统自动创建问答对集合
- **AND** 自动配置向量索引参数（维度、距离算法）
- **AND** 显示集合状态和统计信息

### Requirement: 文本向量化服务

The system SHALL provide text embedding service:

#### Scenario: 选择 Embedding 模型
- **WHEN** 配置 RAG 功能
- **THEN** 可以选择 Embedding 模型（OpenAI、本地模型、第三方 API）
- **AND** 显示模型维度信息
- **AND** 支持模型切换

#### Scenario: 批量向量化问答对
- **WHEN** 新增或修改问答对
- **THEN** 系统自动将问题文本转换为向量
- **AND** 存储到向量数据库
- **AND** 显示向量化进度和状态

#### Scenario: 实时向量化
- **WHEN** 用户实时添加问答对
- **THEN** 5秒内完成向量化并入库
- **AND** 立即可用于检索

### Requirement: RAG 检索服务

The system SHALL provide RAG retrieval service:

#### Scenario: 语义检索
- **WHEN** 用户输入查询文本
- **THEN** 系统将查询转换为向量
- **AND** 在向量数据库中进行相似度搜索
- **AND** 返回 Top-K 个最相似的问答对
- **AND** 显示相似度分数

#### Scenario: 混合检索
- **WHEN** 开启混合检索模式
- **THEN** 同时进行关键词检索和向量检索
- **AND** 使用 RRF (Reciprocal Rank Fusion) 算法融合结果
- **AND** 返回综合排序后的结果

#### Scenario: 检索结果过滤
- **WHEN** 检索问答对
- **THEN** 支持按分类过滤
- **AND** 支持按状态过滤（仅启用）
- **AND** 支持相似度阈值设置

### Requirement: RAG 配置管理界面

The system SHALL provide RAG configuration UI:

#### Scenario: RAG 开关控制
- **WHEN** 进入知识库配置
- **THEN** 可以开启/关闭 RAG 功能
- **AND** 开启后显示 RAG 配置选项
- **AND** 关闭后回退到传统匹配模式

#### Scenario: 检索参数配置
- **WHEN** 配置 RAG
- **THEN** 可以设置 Top-K 数量（1-10）
- **AND** 可以设置相似度阈值（0-1）
- **AND** 可以选择检索模式（纯向量/混合）

#### Scenario: 向量索引管理
- **WHEN** 进入知识库管理
- **THEN** 显示向量索引状态（已索引/待索引/失败）
- **AND** 支持手动重建索引
- **AND** 支持批量重新向量化
- **AND** 显示索引统计（总数、维度、存储大小）

### Requirement: LLM 节点 RAG 集成

The system SHALL integrate RAG with LLM nodes:

#### Scenario: RAG 上下文注入
- **WHEN** 配置 LLM 节点
- **THEN** 可以选择启用 RAG 上下文
- **AND** 自动将检索结果注入到 System Prompt
- **AND** 支持自定义上下文模板

#### Scenario: 动态知识引用
- **WHEN** LLM 生成回答时
- **THEN** 基于检索到的知识生成回答
- **AND** 可以引用知识来源（问答对 ID）
- **AND** 支持知识片段拼接

#### Scenario: 无相关知识处理
- **WHEN** 检索不到相关知识（相似度低于阈值）
- **THEN** LLM 使用通用能力回答
- **AND** 或按配置执行兜底话术
- **AND** 记录未匹配问题用于后续优化

### Requirement: RAG 效果评估

The system SHALL provide RAG evaluation tools:

#### Scenario: 检索测试工具
- **WHEN** 进入 RAG 配置页面
- **THEN** 提供检索测试输入框
- **AND** 实时显示检索结果和相似度
- **AND** 支持对比不同参数的效果

#### Scenario: 检索日志分析
- **WHEN** 查看检索历史
- **THEN** 显示每次检索的查询、结果、耗时
- **AND** 统计检索命中率
- **AND** 识别高频未匹配问题

#### Scenario: 效果指标监控
- **WHEN** 查看监控报表
- **THEN** 显示 RAG 相关指标：
  - 平均检索耗时
  - 检索命中率
  - 用户满意度（RAG 回答 vs 普通回答）

## MODIFIED Requirements

无修改现有需求。

## REMOVED Requirements

无移除的需求。

## 技术架构

### 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         RAG 系统架构                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   用户查询   │───▶│  Query      │───▶│  Vector     │         │
│  │             │    │  Embedding  │    │  Search     │         │
│  └─────────────┘    └─────────────┘    └──────┬──────┘         │
│                                               │                 │
│                                               ▼                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   LLM       │◀───│  Context    │◀───│  Vector DB  │         │
│  │   Response  │    │  Builder    │    │  (Qdrant)   │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                               ▲                 │
│                                               │                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │  QAManager  │───▶│  Doc        │───▶│  Doc        │         │
│  │  (问答对)    │    │  Splitter   │    │  Embedding  │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 核心组件

| 组件 | 职责 | 技术选型 |
|------|------|----------|
| Embedding Service | 文本向量化 | OpenAI API / Local Model |
| Vector DB | 向量存储与检索 | Qdrant / Milvus |
| RAG Service | 检索逻辑编排 | Node.js Service |
| Context Builder | 上下文构建 | Template Engine |

### 数据流

1. **索引流程**：
   ```
   问答对 → 文本预处理 → Embedding → 向量存储 → 索引完成
   ```

2. **检索流程**：
   ```
   用户查询 → Query Embedding → 向量检索 → 结果排序 → 上下文构建 → LLM 生成
   ```

## 配置参数

### RAG 配置项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| enabled | boolean | false | 是否启用 RAG |
| embeddingModel | string | "text-embedding-3-small" | Embedding 模型 |
| vectorDimension | number | 1536 | 向量维度 |
| topK | number | 3 | 检索结果数量 |
| similarityThreshold | number | 0.7 | 相似度阈值 |
| searchMode | "vector" \| "hybrid" | "vector" | 检索模式 |
| contextTemplate | string | - | 上下文模板 |

### 向量数据库配置

| 参数 | 类型 | 说明 |
|------|------|------|
| provider | "qdrant" \| "milvus" \| "pinecone" | 数据库类型 |
| host | string | 服务器地址 |
| port | number | 端口 |
| apiKey | string | API 密钥 |
| collectionName | string | 集合名称 |

## 接口设计

### RAG 检索接口

```typescript
// 请求
interface RAGSearchRequest {
  query: string;
  topK?: number;
  threshold?: number;
  category?: string;
  filter?: Record<string, any>;
}

// 响应
interface RAGSearchResponse {
  results: RAGResult[];
  total: number;
  latency: number;
}

interface RAGResult {
  qaPair: QAPair;
  score: number;
  rank: number;
}
```

### 向量化接口

```typescript
// 请求
interface EmbeddingRequest {
  texts: string[];
  model?: string;
}

// 响应
interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}
```

## 性能指标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 检索延迟 | < 100ms | P95 检索耗时 |
| 向量化速度 | > 100 docs/s | 批量向量化速度 |
| 索引容量 | > 100K | 支持问答对数量 |
| 准确率提升 | > 20% | 相比关键词匹配 |

## 安全与合规

1. **数据隐私**：向量数据加密存储
2. **访问控制**：RAG 服务 API 鉴权
3. **审计日志**：记录所有检索操作
4. **数据隔离**：不同租户数据物理隔离
