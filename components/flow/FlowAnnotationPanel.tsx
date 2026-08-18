import React from 'react';
import { FileText, Hash } from 'lucide-react';
import { FlowAnnotation } from '../../types';

export default function FlowAnnotationPanel({ annotation }: { annotation?: FlowAnnotation | null }) {
  if (!annotation) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-400">
        <FileText size={40} className="mb-3 text-slate-200" />
        <div className="text-sm font-medium text-slate-500">选择一个标号查看 PRD</div>
        <div className="mt-1 text-xs leading-6 text-slate-400">
          打开标号模式后，点击页面上的编号气泡，这里会显示对应的需求说明。
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
          <Hash size={12} />
          {annotation.index}
        </div>
        <div className="text-lg font-semibold text-slate-800">{annotation.title}</div>
        <div className="mt-2 text-sm leading-6 text-slate-500">{annotation.summary}</div>
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-700 whitespace-pre-wrap">
          {annotation.details}
        </div>
      </div>
    </div>
  );
}
