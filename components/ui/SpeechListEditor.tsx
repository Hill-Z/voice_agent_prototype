// 多条话术编辑器，供 Flow Step 和普通主题复用相同的增删交互。
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface SpeechListEditorProps {
  label: string;
  value?: string | string[];
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string[]) => void;
}

// 将旧的单字符串配置统一转换成可编辑列表。
export function normalizeSpeechItems(value?: string | string[]): string[] {
  if (Array.isArray(value)) return value.length > 0 ? value : [''];
  return [value || ''];
}

// 渲染紧凑的多条话术输入框，并保证至少保留一行。
export default function SpeechListEditor({
  label,
  value,
  placeholder,
  disabled = false,
  onChange,
}: SpeechListEditorProps) {
  const items = normalizeSpeechItems(value);

  const updateItem = (index: number, nextValue: string) => {
    const nextItems = [...items];
    nextItems[index] = nextValue;
    onChange(nextItems);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-xs font-bold text-slate-700">{label}</label>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange([...items, ''])}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={13} /> 添加
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              disabled={disabled}
              onChange={(event) => updateItem(index, event.target.value)}
              className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
              placeholder={placeholder}
            />
            <button
              type="button"
              title={`删除${label}`}
              aria-label={`删除第 ${index + 1} 条${label}`}
              disabled={disabled || items.length <= 1}
              onClick={() => removeItem(index)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-400"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
