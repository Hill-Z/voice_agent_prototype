
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export const KeyValueList: React.FC<{
  items: { key: string; value: string }[];
  onChange: (items: { key: string; value: string }[]) => void;
  keyLabel?: string;
  valueLabel?: string;
  addButtonLabel?: string;
}> = ({ items = [], onChange, keyLabel = "Key", valueLabel = "Value", addButtonLabel = "添加参数" }) => {
  const addRow = () => onChange([...items, { key: '', value: '' }]);
  const removeRow = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const updateRow = (idx: number, field: 'key' | 'value', val: string) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: val };
    onChange(newItems);
  };

  return (
    <div className="space-y-2">
      <div className="flex space-x-2 text-[10px] text-slate-500 font-medium px-1">
        <span className="flex-1">{keyLabel}</span>
        <span className="flex-1">{valueLabel}</span>
        <span className="w-6"></span>
      </div>
      {items.map((item, idx) => (
        <div key={idx} className="flex space-x-2 items-center">
          <input 
            className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-gray-200 rounded outline-none focus:border-primary"
            placeholder={keyLabel}
            value={item.key}
            onChange={(e) => updateRow(idx, 'key', e.target.value)}
          />
          <input 
            className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-gray-200 rounded outline-none focus:border-primary"
            placeholder={valueLabel}
            value={item.value}
            onChange={(e) => updateRow(idx, 'value', e.target.value)}
          />
          <button onClick={() => removeRow(idx)} className="text-slate-400 hover:text-red-500 p-1">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button onClick={addRow} className="w-full py-1.5 border border-dashed border-gray-300 rounded text-xs text-slate-500 hover:text-primary hover:border-primary transition-colors flex items-center justify-center mt-2">
        <Plus size={12} className="mr-1" /> {addButtonLabel}
      </button>
    </div>
  );
};

export const StringList: React.FC<{
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addButtonLabel?: string;
}> = ({ items = [], onChange, placeholder = "输入内容...", addButtonLabel = "添加一项" }) => {
  const addRow = () => onChange([...items, '']);
  const removeRow = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const updateRow = (idx: number, val: string) => {
    const newItems = [...items];
    newItems[idx] = val;
    onChange(newItems);
  };

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex space-x-2 items-center">
          <input 
            className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-gray-200 rounded outline-none focus:border-primary"
            placeholder={placeholder}
            value={item}
            onChange={(e) => updateRow(idx, e.target.value)}
          />
          <button onClick={() => removeRow(idx)} className="text-slate-400 hover:text-red-500 p-1">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button onClick={addRow} className="w-full py-1.5 border border-dashed border-gray-300 rounded text-xs text-slate-500 hover:text-primary hover:border-primary transition-colors flex items-center justify-center mt-2">
        <Plus size={12} className="mr-1" /> {addButtonLabel}
      </button>
    </div>
  );
};
