import React, { useState } from 'react';
import { X, Link, Server, Globe, Key, FileText } from 'lucide-react';

interface McpServer {
  id: string;
  name: string;
  description: string;
  type: 'stdio' | 'http' | 'websocket';
  command?: string;
  args?: string[];
  url?: string;
  headers?: Record<string, string>;
  env?: Record<string, string>;
  enabled: boolean;
}

interface Props {
  onClose: () => void;
  onSave: (server: McpServer) => void;
  initialData?: McpServer;
}

export default function McpServerModal({ onClose, onSave, initialData }: Props) {
  const [formData, setFormData] = useState<Partial<McpServer>>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    type: initialData?.type || 'stdio',
    command: initialData?.command || '',
    args: initialData?.args || [],
    url: initialData?.url || '',
    headers: initialData?.headers || {},
    env: initialData?.env || {},
    enabled: initialData?.enabled ?? true,
  });

  const handleSubmit = () => {
    if (!formData.name) {
      alert('请输入服务器名称');
      return;
    }

    onSave({
      id: initialData?.id || `mcp_${Date.now()}`,
      name: formData.name!,
      description: formData.description || '',
      type: formData.type as 'stdio' | 'http' | 'websocket',
      command: formData.command,
      args: formData.args,
      url: formData.url,
      headers: formData.headers,
      env: formData.env,
      enabled: formData.enabled ?? true,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Link size={20} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {initialData ? '编辑 MCP 服务器' : '添加 MCP 服务器'}
              </h3>
              <p className="text-sm text-gray-500">
                配置 Model Context Protocol 服务器以扩展智能体能力
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 基础信息 */}
          <div className="space-y-4 mb-6">
            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Server size={16} />
              基础信息
            </h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                服务器名称 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="例如：文件处理服务器、数据库查询服务器"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={2}
                placeholder="描述该 MCP 服务器的用途和功能"
              />
            </div>
          </div>

          {/* 连接类型 */}
          <div className="space-y-4 mb-6">
            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Globe size={16} />
              连接类型
            </h4>

            <div className="flex gap-4">
              <label className="flex-1 flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="connectionType"
                  value="stdio"
                  checked={formData.type === 'stdio'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="text-emerald-600"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">STDIO</div>
                  <div className="text-xs text-gray-500">本地进程通信</div>
                </div>
              </label>

              <label className="flex-1 flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="connectionType"
                  value="http"
                  checked={formData.type === 'http'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="text-emerald-600"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">HTTP</div>
                  <div className="text-xs text-gray-500">HTTP/SSE 通信</div>
                </div>
              </label>

              <label className="flex-1 flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="connectionType"
                  value="websocket"
                  checked={formData.type === 'websocket'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="text-emerald-600"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">WebSocket</div>
                  <div className="text-xs text-gray-500">WebSocket 通信</div>
                </div>
              </label>
            </div>
          </div>

          {/* STDIO 配置 */}
          {formData.type === 'stdio' && (
            <div className="space-y-4 mb-6">
              <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <FileText size={16} />
                STDIO 配置
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  启动命令
                </label>
                <input
                  type="text"
                  value={formData.command}
                  onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="例如：node /path/to/server.js"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  参数列表
                </label>
                <input
                  type="text"
                  value={formData.args?.join(' ') || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    args: e.target.value.split(' ').filter(Boolean)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="参数之间用空格分隔"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  环境变量
                </label>
                <div className="space-y-2">
                  {formData.env && Object.entries(formData.env).map(([key, value], index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => {
                          const newEnv = { ...formData.env };
                          delete newEnv[key];
                          newEnv[e.target.value] = value;
                          setFormData({ ...formData, env: newEnv });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="变量名"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => {
                          const newEnv = { ...formData.env };
                          newEnv[key] = e.target.value;
                          setFormData({ ...formData, env: newEnv });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="变量值"
                      />
                      <button
                        onClick={() => {
                          const newEnv = { ...formData.env };
                          delete newEnv[key];
                          setFormData({ ...formData, env: newEnv });
                        }}
                        className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setFormData({ 
                      ...formData, 
                      env: { ...formData.env, '': '' }
                    })}
                    className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                  >
                    + 添加环境变量
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* HTTP/WebSocket 配置 */}
          {(formData.type === 'http' || formData.type === 'websocket') && (
            <div className="space-y-4 mb-6">
              <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Globe size={16} />
                网络配置
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  服务器 URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder={formData.type === 'http' 
                    ? 'https://example.com/sse' 
                    : 'wss://example.com/ws'
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  请求头
                </label>
                <div className="space-y-2">
                  {formData.headers && Object.entries(formData.headers).map(([key, value], index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => {
                          const newHeaders = { ...formData.headers };
                          delete newHeaders[key];
                          newHeaders[e.target.value] = value;
                          setFormData({ ...formData, headers: newHeaders });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Header 名称"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => {
                          const newHeaders = { ...formData.headers };
                          newHeaders[key] = e.target.value;
                          setFormData({ ...formData, headers: newHeaders });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Header 值"
                      />
                      <button
                        onClick={() => {
                          const newHeaders = { ...formData.headers };
                          delete newHeaders[key];
                          setFormData({ ...formData, headers: newHeaders });
                        }}
                        className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setFormData({ 
                      ...formData, 
                      headers: { ...formData.headers, '': '' }
                    })}
                    className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                  >
                    + 添加请求头
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 使用说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
              <Key size={16} />
              使用说明
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• MCP (Model Context Protocol) 是一种标准化的工具调用协议</li>
              <li>• 通过 MCP 可以集成第三方工具和服务</li>
              <li>• STDIO 模式适合本地开发和测试</li>
              <li>• HTTP/WebSocket模式适合生产环境部署</li>
              <li>• 添加后需要在提示词中告知智能体如何使用这些工具</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
}
