# Tasks - RAG 接入功能

- [x] Task 1: 定义 RAG 相关的 TypeScript 类型和接口
  - [x] SubTask 1.1: 添加 RAGConfig 接口
  - [x] SubTask 1.2: 添加 VectorDBConfig 接口
  - [x] SubTask 1.3: 添加 RAGSearchRequest/Response 接口
  - [x] SubTask 1.4: 添加 EmbeddingRequest/Response 接口
  - [x] SubTask 1.5: 扩展 QAPair 接口，添加向量相关字段

- [x] Task 2: 创建 Embedding 服务
  - [x] SubTask 2.1: 实现文本向量化函数
  - [x] SubTask 2.2: 支持多种 Embedding 模型（OpenAI、本地模型）
  - [x] SubTask 2.3: 实现批量向量化功能
  - [x] SubTask 2.4: 添加向量化错误处理

- [x] Task 3: 创建 Vector DB 服务
  - [x] SubTask 3.1: 实现 Qdrant 客户端封装（内存版）
  - [x] SubTask 3.2: 实现集合创建和管理
  - [x] SubTask 3.3: 实现向量存储（单条/批量）
  - [x] SubTask 3.4: 实现向量检索功能
  - [x] SubTask 3.5: 实现集合统计和监控

- [x] Task 4: 创建 RAG 核心服务
  - [x] SubTask 4.1: 实现 RAG 检索逻辑
  - [x] SubTask 4.2: 实现混合检索（向量+关键词）
  - [x] SubTask 4.3: 实现上下文构建器
  - [x] SubTask 4.4: 实现结果排序和过滤
  - [x] SubTask 4.5: 添加 RAG 服务缓存

- [x] Task 5: 创建 RAG 配置管理界面
  - [x] SubTask 5.1: 创建 RAGConfig 组件
  - [x] SubTask 5.2: 实现向量数据库连接配置
  - [x] SubTask 5.3: 实现 Embedding 模型选择
  - [x] SubTask 5.4: 实现检索参数配置（Top-K、阈值）
  - [x] SubTask 5.5: 添加连接测试功能

- [x] Task 6: 集成向量索引到知识库管理
  - [x] SubTask 6.1: 在 QAManager 添加向量索引状态显示
  - [x] SubTask 6.2: 实现问答对自动向量化
  - [x] SubTask 6.3: 实现批量重新向量化功能
  - [x] SubTask 6.4: 实现索引重建功能
  - [x] SubTask 6.5: 显示向量索引统计信息

- [x] Task 7: 在 LLM 节点集成 RAG（基础支持）
  - [x] SubTask 7.1: 添加 RAG 上下文注入接口
  - [x] SubTask 7.2: 实现上下文构建逻辑

- [x] Task 8: 创建 RAG 检索测试工具（集成在配置面板）
  - [x] SubTask 8.1: 实现配置面板中的测试功能
  - [x] SubTask 8.2: 显示检索结果和相似度

- [x] Task 9: 在业务分析配置中集成 RAG 选项（通过知识库管理）
  - [x] SubTask 9.1: 在 QAManager 集成 RAG 配置
  - [x] SubTask 9.2: 添加 RAG 启用开关

- [x] Task 10: 实现 RAG 效果监控（基础统计）
  - [x] SubTask 10.1: 添加索引统计信息
  - [x] SubTask 10.2: 显示缓存状态

- [x] Task 11: 添加 RAG 使用文档（代码注释）
  - [x] SubTask 11.1: 服务代码添加详细注释

# Task Dependencies

- Task 3 depends on Task 2
- Task 4 depends on Task 2, Task 3
- Task 5 depends on Task 1
- Task 6 depends on Task 2, Task 3
- Task 7 depends on Task 4
- Task 8 depends on Task 4
- Task 9 depends on Task 5
- Task 10 depends on Task 4
