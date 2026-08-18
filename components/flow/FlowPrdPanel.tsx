import React from 'react';
import { FileText, Hash } from 'lucide-react';
import { FlowAnnotation } from '../../types';

interface FlowPrdPanelProps {
  annotation?: FlowAnnotation | null;
  annotations?: FlowAnnotation[];
  onSelect?: (annotationId: string) => void;
}

export default function FlowPrdPanel({
  annotation,
  annotations = [],
  onSelect,
}: FlowPrdPanelProps) {
  if (!annotation) {
    return (
      <div className="flex h-full flex-col p-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <FileText size={16} className="text-primary" />
            PRD Overview
          </div>
          <div className="mt-2 text-xs leading-6 text-slate-500">
            Open annotation mode and click a numbered marker, or select a requirement point from the list below.
          </div>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto">
          <div className="space-y-3">
            {annotations.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect?.(item.id)}
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-sky-50"
              >
                <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                  <Hash size={12} />
                  {item.index}
                </div>
                <div className="text-sm font-semibold text-slate-800">{item.title}</div>
                <div className="mt-1 text-xs leading-6 text-slate-500">{item.summary}</div>
              </button>
            ))}
          </div>
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
        <div className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
          {annotation.details}
        </div>
      </div>

      {annotations.length > 1 ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Other PRD Points</div>
          <div className="mt-3 space-y-2">
            {annotations
              .filter((item) => item.id !== annotation.id)
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect?.(item.id)}
                  className="flex w-full items-start gap-3 rounded-xl border border-slate-200 px-3 py-3 text-left transition-colors hover:border-primary/40 hover:bg-sky-50"
                >
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                    {item.index}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-800">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{item.summary}</span>
                  </span>
                </button>
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
