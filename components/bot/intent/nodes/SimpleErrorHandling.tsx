import React from 'react';

interface SimpleErrorHandlingProps {
  label?: string;
  tooltip?: string;
  value?: string;
  onChange: (value: string) => void;
  availableNodes: { label: string; value: string }[];
}

export default function SimpleErrorHandling({
  label = '节点执行异常时跳转至',
  tooltip = '',
  value = '',
  onChange,
  availableNodes,
}: SimpleErrorHandlingProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-700">{label}</span>
        {tooltip && (
          <span className="text-[10px] text-slate-400">{tooltip}</span>
        )}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white outline-none"
      >
        <option value="">-- 选择跳转节点 --</option>
        {availableNodes.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
