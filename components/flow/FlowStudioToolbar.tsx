import React from 'react';
import { Bug, History, PencilLine, RotateCcw, Workflow, X, ZoomIn, ZoomOut } from 'lucide-react';

type DrawerMode = 'flow' | 'node' | 'edge' | 'debug' | 'version' | null;

interface FlowStudioToolbarProps {
  flowName: string;
  readOnly: boolean;
  drawerMode: DrawerMode;
  zoom: number;
  onFlowNameChange: (name: string) => void;
  onCloseDrawer: () => void;
  onOpenDebug: () => void;
  onOpenVersion: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export default function FlowStudioToolbar({
  flowName,
  readOnly,
  drawerMode,
  zoom,
  onFlowNameChange,
  onCloseDrawer,
  onOpenDebug,
  onOpenVersion,
  onZoomIn,
  onZoomOut,
  onResetView,
}: FlowStudioToolbarProps) {
  const drawerLabel =
    drawerMode === 'flow'
      ? '流程设置'
      : drawerMode === 'node'
        ? '节点配置'
        : drawerMode === 'edge'
          ? '边条件配置'
          : drawerMode === 'version'
            ? '版本管理'
            : null;

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-primary">
            <Workflow size={18} />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-[11px] font-medium text-slate-500">当前 Flow 名称</label>
            <div className="flex h-10 min-w-[320px] items-center gap-2 rounded-lg border border-sky-200 bg-sky-50/70 px-3 transition-colors focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10">
              <input
                value={flowName}
                disabled={readOnly}
                onChange={(event) => onFlowNameChange(event.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base font-semibold text-slate-900 outline-none placeholder:text-slate-300 disabled:cursor-not-allowed"
                placeholder="请输入 Flow 名称"
              />
              {!readOnly ? <PencilLine size={15} className="shrink-0 text-primary" /> : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {drawerLabel ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
              当前面板：{drawerLabel}
            </div>
          ) : null}

          <div className="flex items-center rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={onZoomOut}
              className="rounded p-1.5 text-slate-600 transition-colors hover:bg-white"
              title="缩小"
            >
              <ZoomOut size={14} />
            </button>
            <span className="w-14 text-center text-xs font-mono text-slate-600">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={onZoomIn}
              className="rounded p-1.5 text-slate-600 transition-colors hover:bg-white"
              title="放大"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={onResetView}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="inline-flex items-center gap-1">
              <RotateCcw size={14} />
              还原视图
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenDebug}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="inline-flex items-center gap-1">
              <Bug size={14} />
              场景调试
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenVersion}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="inline-flex items-center gap-1">
              <History size={14} />
              版本管理
            </span>
          </button>

          {drawerMode ? (
            <button
              type="button"
              onClick={onCloseDrawer}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <span className="inline-flex items-center gap-1">
                <X size={14} />
                关闭面板
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
