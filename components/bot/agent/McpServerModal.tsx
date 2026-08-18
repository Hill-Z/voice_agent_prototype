import React, { useState } from 'react';
import { X, Server, Plug } from 'lucide-react';
import { McpServer } from '../../../types';
import { Input, Select, Switch, Label } from '../../ui/FormComponents';

interface McpServerModalProps {
  onClose: () => void;
  onSave: (mcpServer: McpServer) => void;
}

const DEFAULT_MCP_SERVER: McpServer = {
  id: '',
  name: '',
  description: '',
  type: 'stdio',
  command: '',
  args: [],
  url: '',
  headers: {},
  env: {},
  enabled: true
};

export default function McpServerModal({ onClose, onSave }: McpServerModalProps) {
  const [formData, setFormData] = useState<McpServer>({
    ...DEFAULT_MCP_SERVER,
    id: Date.now().toString()
  });
  const [argsInput, setArgsInput] = useState(formData.args?.join(' ') || '');

  const handleSubmit = () => {
    if (!formData.name) return alert("请输入服务器名称");
    if (!formData.description) return alert("请输入服务器描述");

    const args = argsInput.trim() ? argsInput.trim().split(/\s+/) : [];

    onSave({
      ...formData,
      args
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-base font-bold text-slate-800 flex items-center">
            <Server size={18} className="mr-2 text-emerald-600" />
            添加 MCP 服务器
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-1">
                <Label label="服务器名称" required />
                <Input
                  placeholder="例如: 文件系统服务器"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="flex items-center pt-6">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-600">启用</span>
                  <Switch
                    label=""
                    checked={formData.enabled}
                    onChange={(v) => setFormData({ ...formData, enabled: v })}
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <Label label="服务器描述" required tooltip="描述此服务器的功能和用途。" />
              <textarea
                className="w-full h-20 px-3 py-2 text-sm border border-slate-300 rounded focus:border-primary outline-none resize-none"
                placeholder="例如：提供文件系统操作能力，包括读取、写入、删除文件等功能。"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </section>

          <section>
            <h4 className="text-sm font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">
              连接配置
            </h4>

            <div className="mb-4">
              <Label label="连接类型" required />
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {['stdio', 'http', 'websocket'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFormData(prev => ({ ...prev, type: type as any }))}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                      formData.type === type ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {type === 'stdio' && 'STDIO'}
                    {type === 'http' && 'HTTP'}
                    {type === 'websocket' && 'WebSocket'}
                  </button>
                ))}
              </div>
            </div>

            {formData.type === 'stdio' && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <Label label="命令" required tooltip="执行 MCP 服务器的命令。" />
                  <Input
                    className="font-mono text-xs"
                    placeholder="例如: npx 或 node"
                    value={formData.command || ''}
                    onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                  />
                </div>
                <div>
                  <Label label="参数 (可选)" tooltip="用空格分隔多个参数。" />
                  <Input
                    className="font-mono text-xs"
                    placeholder="例如: -p 3000 --debug"
                    value={argsInput}
                    onChange={(e) => setArgsInput(e.target.value)}
                  />
                </div>
              </div>
            )}

            {(formData.type === 'http' || formData.type === 'websocket') && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <Label label="服务器 URL" required tooltip="MCP 服务器的访问地址。" />
                  <Input
                    className="font-mono text-xs"
                    placeholder={formData.type === 'http' ? 'http://localhost:3000' : 'ws://localhost:3000'}
                    value={formData.url || ''}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>
                {(formData.type === 'http' || formData.type === 'websocket') && (
                  <div>
                    <Label label="请求头 (可选)" tooltip="JSON 格式，例如: {&quot;Authorization&quot;: &quot;Bearer xxx&quot;}" />
                    <Input
                      className="font-mono text-xs"
                      placeholder='{"Authorization": "Bearer xxx"}'
                      value={formData.headers ? JSON.stringify(formData.headers) : ''}
                      onChange={(e) => {
                        try {
                          const headers = e.target.value ? JSON.parse(e.target.value) : {};
                          setFormData(prev => ({ ...prev, headers }));
                        } catch {
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-slate-600 text-sm hover:bg-white transition-colors">
            取消
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-bold hover:bg-emerald-700 shadow-sm transition-colors">
            保存服务器
          </button>
        </div>
      </div>
    </div>
  );
}