import React, { useState, useEffect } from 'react';
import { Database, Settings, TestTube, AlertCircle, CheckCircle, RefreshCw, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { RAGConfig as RAGConfigType, VectorDBConfig } from '../../types';
import { DEFAULT_RAG_CONFIG, testRAGConfig, getRAGStats, clearRAGCache, rebuildIndex } from '../../services/ragService';
import { getAvailableEmbeddingModels } from '../../services/embeddingService';
import { MOCK_QA_PAIRS } from './QAManager';

interface RAGConfigProps {
  config: RAGConfigType;
  onChange: (config: RAGConfigType) => void;
}

const RAGConfigPanel: React.FC<RAGConfigProps> = ({ config, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [stats, setStats] = useState({ totalIndexed: 0, dimension: 0, sizeInBytes: 0, cacheSize: 0 });
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [rebuildProgress, setRebuildProgress] = useState({ completed: 0, total: 0 });

  const embeddingModels = getAvailableEmbeddingModels();

  useEffect(() => {
    if (config.enabled) {
      loadStats();
    }
  }, [config.enabled]);

  const loadStats = async () => {
    const ragStats = await getRAGStats();
    setStats(ragStats);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus(null);
    
    const result = await testRAGConfig(config);
    setTestStatus({ success: result.success, message: result.message });
    
    if (result.success) {
      await loadStats();
    }
    
    setIsTesting(false);
  };

  const handleRebuildIndex = async () => {
    setIsRebuilding(true);
    setRebuildProgress({ completed: 0, total: MOCK_QA_PAIRS.length });
    
    await rebuildIndex(
      MOCK_QA_PAIRS,
      config,
      (completed, total) => {
        setRebuildProgress({ completed, total });
      }
    );
    
    await loadStats();
    setIsRebuilding(false);
  };

  const updateVectorDBConfig = (updates: Partial<VectorDBConfig>) => {
    onChange({
      ...config,
      vectorDB: { ...config.vectorDB, ...updates },
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div 
        className="px-4 py-3 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-slate-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Database size={18} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">RAG 向量检索</h3>
            <p className="text-xs text-slate-500">
              {config.enabled 
                ? `已启用 · ${stats.totalIndexed} 条索引 · ${embeddingModels.find(m => m.id === config.embeddingModel)?.name || config.embeddingModel}`
                : '未启用'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={config.enabled}
            onChange={(checked) => onChange({ ...config, enabled: checked })}
          />
          {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && config.enabled && (
        <div className="p-4 space-y-5">
          {/* Status Banner */}
          {testStatus && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${testStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {testStatus.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span className="text-sm">{testStatus.message}</span>
            </div>
          )}

          {/* Vector DB Configuration */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Database size={14} />
              向量数据库配置
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">数据库类型</label>
                <select
                  value={config.vectorDB.provider}
                  onChange={(e) => updateVectorDBConfig({ provider: e.target.value as VectorDBConfig['provider'] })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                >
                  <option value="qdrant">Qdrant</option>
                  <option value="milvus">Milvus</option>
                  <option value="pinecone">Pinecone</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">集合名称</label>
                <input
                  type="text"
                  value={config.vectorDB.collectionName}
                  onChange={(e) => updateVectorDBConfig({ collectionName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">服务器地址</label>
                <input
                  type="text"
                  value={config.vectorDB.host}
                  onChange={(e) => updateVectorDBConfig({ host: e.target.value })}
                  placeholder="localhost"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">端口</label>
                <input
                  type="number"
                  value={config.vectorDB.port || ''}
                  onChange={(e) => updateVectorDBConfig({ port: parseInt(e.target.value) })}
                  placeholder="6333"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                <TestTube size={14} />
                {isTesting ? '测试中...' : '测试连接'}
              </button>
            </div>
          </div>

          {/* Embedding Configuration */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Settings size={14} />
              Embedding 配置
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Embedding 模型</label>
                <select
                  value={config.embeddingModel}
                  onChange={(e) => onChange({ ...config, embeddingModel: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                >
                  {embeddingModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.dimension}维)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">向量维度</label>
                <input
                  type="number"
                  value={config.vectorDimension}
                  onChange={(e) => onChange({ ...config, vectorDimension: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Search Configuration */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Search size={14} />
              检索参数
            </h4>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Top-K</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={config.topK}
                  onChange={(e) => onChange({ ...config, topK: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">返回结果数量</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">相似度阈值</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                  value={config.similarityThreshold}
                  onChange={(e) => onChange({ ...config, similarityThreshold: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">0-1 之间</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">检索模式</label>
                <select
                  value={config.searchMode}
                  onChange={(e) => onChange({ ...config, searchMode: e.target.value as 'vector' | 'hybrid' })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-primary outline-none"
                >
                  <option value="vector">纯向量检索</option>
                  <option value="hybrid">混合检索</option>
                </select>
              </div>
            </div>
          </div>

          {/* Index Management */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <RefreshCw size={14} />
              索引管理
            </h4>
            
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-slate-800">{stats.totalIndexed}</div>
                  <div className="text-xs text-slate-500">已索引</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-800">{stats.dimension}</div>
                  <div className="text-xs text-slate-500">维度</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-800">{(stats.sizeInBytes / 1024 / 1024).toFixed(2)}</div>
                  <div className="text-xs text-slate-500">存储(MB)</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-800">{stats.cacheSize}</div>
                  <div className="text-xs text-slate-500">缓存数</div>
                </div>
              </div>
            </div>

            {isRebuilding && (
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-blue-700">重建索引中...</span>
                  <span className="text-sm text-blue-700">{rebuildProgress.completed}/{rebuildProgress.total}</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(rebuildProgress.completed / rebuildProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleRebuildIndex}
                disabled={isRebuilding}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw size={14} className={isRebuilding ? 'animate-spin' : ''} />
                {isRebuilding ? '重建中...' : '重建索引'}
              </button>
              
              <button
                onClick={() => { clearRAGCache(); loadStats(); }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded text-sm font-medium hover:bg-slate-50"
              >
                清除缓存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Switch Component
interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange }) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

export default RAGConfigPanel;
