import React from 'react';
import { Bug, Maximize2, Minimize2, PanelRightClose, PanelRightOpen, PanelsTopLeft, Save, Tags, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { FlowAnnotation } from '../../types';

interface FlowTopToolbarProps {
  annotationMode: boolean;
  isFullscreen: boolean;
  isSidebarCollapsed: boolean;
  zoom: number;
  annotations: FlowAnnotation[];
  onToggleAnnotationMode: () => void;
  onToggleFullscreen: () => void;
  onToggleSidebar: () => void;
  onSave: () => void;
  onRunDebug: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onAnnotationSelect: (annotationId: string) => void;
}

function AnnotationBadge({
  index,
  onClick,
}: {
  index: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white shadow"
    >
      {index}
    </button>
  );
}

export default function FlowTopToolbar({
  annotationMode,
  isFullscreen,
  isSidebarCollapsed,
  zoom,
  annotations,
  onToggleAnnotationMode,
  onToggleFullscreen,
  onToggleSidebar,
  onSave,
  onRunDebug,
  onZoomIn,
  onZoomOut,
  onResetView,
  onAnnotationSelect,
}: FlowTopToolbarProps) {
  const toolbarAnnotation = annotations.find(
    (annotation) => annotation.targetType === 'toolbar' && annotation.targetId === 'annotation-mode-toggle',
  );
  const fullscreenAnnotation = annotations.find(
    (annotation) => annotation.targetType === 'toolbar' && annotation.targetId === 'fullscreen-toggle',
  );
  const sidebarAnnotation = annotations.find(
    (annotation) => annotation.targetType === 'toolbar' && annotation.targetId === 'sidebar-toggle',
  );

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-primary">
            <PanelsTopLeft size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">Flow Workbench</div>
            <div className="text-xs text-slate-400">PolyAI 风格多 Flow 原型工作台</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-slate-100 p-1">
            <button
              onClick={onZoomOut}
              className="rounded p-1.5 text-slate-600 transition-colors hover:bg-white"
              title="缩小"
            >
              <ZoomOut size={14} />
            </button>
            <span className="w-14 text-center text-xs font-mono text-slate-600">{Math.round(zoom * 100)}%</span>
            <button
              onClick={onZoomIn}
              className="rounded p-1.5 text-slate-600 transition-colors hover:bg-white"
              title="放大"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          <button
            onClick={onResetView}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="inline-flex items-center gap-1">
              <RotateCcw size={14} />
              重置视图
            </span>
          </button>

          <div className="relative">
            <button
              id="annotation-mode-toggle"
              onClick={onToggleAnnotationMode}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                annotationMode
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-gray-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className="inline-flex items-center gap-1">
                <Tags size={14} />
                {annotationMode ? '隐藏标号' : '显示标号'}
              </span>
            </button>
            {annotationMode && toolbarAnnotation ? (
              <AnnotationBadge
                index={toolbarAnnotation.index}
                onClick={() => onAnnotationSelect(toolbarAnnotation.id)}
              />
            ) : null}
          </div>

          <button
            id="sidebar-toggle"
            onClick={onToggleSidebar}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="inline-flex items-center gap-1">
              {isSidebarCollapsed ? <PanelRightOpen size={14} /> : <PanelRightClose size={14} />}
              {isSidebarCollapsed ? '打开右栏' : '收起右栏'}
            </span>
          </button>

          {annotationMode && sidebarAnnotation ? (
            <div className="relative">
              <AnnotationBadge
                index={sidebarAnnotation.index}
                onClick={() => onAnnotationSelect(sidebarAnnotation.id)}
              />
            </div>
          ) : null}

          <button
            onClick={onRunDebug}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="inline-flex items-center gap-1">
              <Bug size={14} />
              半模拟调试
            </span>
          </button>

          <div className="relative">
            <button
              id="fullscreen-toggle"
              onClick={onToggleFullscreen}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <span className="inline-flex items-center gap-1">
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                {isFullscreen ? '退出全屏' : '全屏编辑'}
              </span>
            </button>
            {annotationMode && fullscreenAnnotation ? (
              <AnnotationBadge
                index={fullscreenAnnotation.index}
                onClick={() => onAnnotationSelect(fullscreenAnnotation.id)}
              />
            ) : null}
          </div>

          <button
            onClick={onSave}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-600"
          >
            <span className="inline-flex items-center gap-1">
              <Save size={14} />
              保存原型
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
