// 版本管理面板，用于管理 Flow 的版本创建、发布、回滚。
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, GitBranch, History, Play, RotateCcw, Trash2, X } from 'lucide-react';
import { FlowDefinition, FlowVersion } from '../../types';

interface FlowVersionManagerProps {
  versions: FlowVersion[];
  currentFlow: FlowDefinition;
  onVersionChange: (versions: FlowVersion[]) => void;
  onRollback: (version: FlowVersion) => void;
  onClose: () => void;
  readOnly?: boolean;
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function FlowVersionManager({
  versions,
  currentFlow,
  onVersionChange,
  onRollback,
  onClose,
  readOnly = false,
}: FlowVersionManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVersion, setNewVersion] = useState({ version: '', description: '' });

  const handleCreateVersion = () => {
    if (!newVersion.version) return;

    const version: FlowVersion = {
      id: `version_${Date.now()}`,
      flowId: currentFlow.id,
      version: newVersion.version,
      flowData: JSON.parse(JSON.stringify(currentFlow)),
      createdAt: Date.now(),
      createdBy: '当前用户',
      description: newVersion.description,
      isPublished: false,
    };

    onVersionChange([...versions, version]);
    setNewVersion({ version: '', description: '' });
    setShowCreateForm(false);
  };

  const handlePublish = (versionId: string) => {
    onVersionChange(
      versions.map((v) =>
        v.id === versionId ? { ...v, isPublished: true, publishedAt: Date.now() } : v
      )
    );
  };

  const handleDelete = (versionId: string) => {
    if (!confirm('确定删除该版本吗？')) return;
    onVersionChange(versions.filter((v) => v.id !== versionId));
  };

  const sortedVersions = [...versions].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-slate-800">版本管理</div>
          <div className="text-[11px] text-slate-400">共 {versions.length} 个版本</div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"><X size={16} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* 创建新版本 */}
        {!readOnly && (
          <div className="mb-4">
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 hover:border-primary hover:text-primary transition-colors"
              >
                + 创建新版本
              </button>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">版本号</label>
                  <input
                    value={newVersion.version}
                    onChange={(e) => setNewVersion({ ...newVersion, version: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder="如：v1.0.0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">版本描述</label>
                  <textarea
                    rows={2}
                    value={newVersion.description}
                    onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder="描述本次更新的内容"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateVersion}
                    className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-sky-600"
                  >
                    创建
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-white"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 版本列表 */}
        <div className="space-y-3">
          {sortedVersions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <History size={32} className="mb-3 opacity-30" />
              <p className="text-sm">暂无版本记录</p>
              <p className="text-xs mt-1">创建第一个版本开始管理</p>
            </div>
          ) : (
            sortedVersions.map((version) => (
              <div key={version.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{version.version}</span>
                      {version.isPublished ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">已发布</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">草稿</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!readOnly && !version.isPublished && (
                        <button
                          onClick={() => handlePublish(version.id)}
                          className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded"
                          title="发布"
                        >
                          <Play size={14} />
                        </button>
                      )}
                      {!readOnly && (
                        <button
                          onClick={() => onRollback(version)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="回滚"
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                      {!readOnly && !version.isPublished && (
                        <button
                          onClick={() => handleDelete(version.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3">
                  {version.description && (
                    <p className="text-xs text-slate-600 mb-2">{version.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {formatTime(version.createdAt)}
                    </span>
                    <span>{version.createdBy}</span>
                    {version.publishedAt && (
                      <span className="flex items-center gap-1">
                        <GitBranch size={10} />
                        发布于 {formatTime(version.publishedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export type { FlowVersionManagerProps };
