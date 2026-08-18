// 检查知识召回模式与 RAG 工具的最小前端配置。
import fs from 'node:fs';

const knowledgeSource = fs.readFileSync('components/bot/BotKnowledgeConfig.tsx', 'utf8');
const toolModalSource = fs.readFileSync('components/bot/agent/AgentToolModal.tsx', 'utf8');
const toolPageSource = fs.readFileSync('components/tools/ToolConfigPage.tsx', 'utf8');
const typesSource = fs.readFileSync('types.ts', 'utf8');

for (const snippet of ['召回模式', '全局召回', '工具调用', "config.knowledgeRetrievalMode ?? 'global'", "updateField('knowledgeRetrievalMode'"]) {
  if (!knowledgeSource.includes(snippet)) throw new Error(`知识检索配置缺少：${snippet}`);
}

for (const snippet of ['工具类型', '<option value="RAG">RAG</option>', '知识库 ID', 'Top-K', '相似度阈值']) {
  if (!toolModalSource.includes(snippet)) throw new Error(`RAG 工具配置缺少：${snippet}`);
}

for (const snippet of ["id: 'knowledge', label: 'RAG'", "type: 'RAG'", "category: 'knowledge'"]) {
  if (!toolPageSource.includes(snippet)) throw new Error(`工具配置页缺少：${snippet}`);
}

for (const snippet of ["knowledgeRetrievalMode?: 'global' | 'tool'", "type: 'API' | 'RAG'", "category?: 'api_call' | 'knowledge'", 'ragConfig?: {']) {
  if (!typesSource.includes(snippet)) throw new Error(`配置类型缺少：${snippet}`);
}

console.log('knowledge retrieval mode static check ok');
