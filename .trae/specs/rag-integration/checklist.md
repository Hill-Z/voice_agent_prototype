# Checklist - RAG 接入功能

## 类型定义和接口
- [x] RAGConfig 接口已正确定义（enabled, embeddingModel, vectorDimension, topK, similarityThreshold, searchMode, contextTemplate）
- [x] VectorDBConfig 接口已正确定义（provider, host, port, apiKey, collectionName）
- [x] RAGSearchRequest 接口已正确定义（query, topK, threshold, category, filter）
- [x] RAGSearchResponse 接口已正确定义（results, total, latency）
- [x] EmbeddingRequest/Response 接口已正确定义
- [x] QAPairVectorStatus 接口已定义（vectorId, embeddingStatus, lastEmbeddedAt, errorMessage）

## Embedding 服务
- [x] 文本向量化函数正常工作
- [x] 支持 OpenAI Embedding API
- [x] 支持 Mock Embedding（开发环境）
- [x] 批量向量化功能正常
- [x] 向量化错误处理完善
- [x] 向量化结果缓存机制
- [x] 余弦相似度计算函数

## Vector DB 服务
- [x] VectorDBService 类实现
- [x] 集合创建和管理功能正常
- [x] 单条向量存储功能正常
- [x] 批量向量存储功能正常
- [x] 向量检索功能正常（返回正确结果和相似度）
- [x] 集合统计信息准确
- [x] 内存存储实现（开发环境）

## RAG 核心服务
- [x] RAG 检索逻辑正确
- [x] 纯向量检索模式工作正常
- [x] 混合检索模式工作正常（RRF 融合）
- [x] 上下文构建器正确拼接知识片段
- [x] 结果排序和过滤逻辑正确
- [x] RAG 服务缓存机制有效
- [x] 索引管理功能（重建、清除）

## RAG 配置管理界面
- [x] RAGConfig 组件正确渲染
- [x] 向量数据库连接配置表单完整
- [x] 连接测试功能正常工作
- [x] Embedding 模型选择器可用
- [x] 检索参数配置（Top-K、阈值）可用
- [x] 配置保存和加载正常
- [x] 索引统计信息展示
- [x] 重建索引功能带进度条

## 知识库管理集成
- [x] QAManager 集成 RAGConfig 组件
- [x] RAG 启用开关可用
- [x] 索引状态实时显示

## LLM 节点 RAG 集成（基础）
- [x] buildRAGContext 函数实现
- [x] RAG 上下文注入接口

## 代码质量
- [x] 所有组件使用 TypeScript 类型
- [x] 服务代码有详细注释
- [x] 错误处理完善
- [x] 代码通过 ESLint 检查

## 已知限制（后续迭代）
- [ ] 需要接入真实向量数据库（Qdrant/Milvus）
- [ ] 需要实现问答对自动向量化触发
- [ ] 需要完善 LLM 节点的 RAG 开关 UI
- [ ] 需要添加 RAG 检索测试工具独立页面
- [ ] 需要添加 RAG 效果监控图表
