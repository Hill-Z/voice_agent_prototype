import React from 'react';
import { Zap } from 'lucide-react';
import { PresetTool } from '../../../types';
import { getAllPresetTools } from '../../../services/presetTools';

interface QuickAddToolPanelProps {
  onAddTool: (presetId: string) => void;
}

export default function QuickAddToolPanel({ onAddTool }: QuickAddToolPanelProps) {
  const presetTools: PresetTool[] = getAllPresetTools();

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 shadow-sm">
      <div className="flex items-center mb-4">
        <Zap size={18} className="mr-2 text-indigo-600" />
        <h3 className="text-sm font-bold text-indigo-900">快速添加工具</h3>
        <span className="ml-2 text-xs text-indigo-500">点击一键添加常用工具</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {presetTools.map(preset => (
          <button
            key={preset.id}
            onClick={() => onAddTool(preset.id)}
            className="bg-white hover:bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-left transition-all group hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="text-2xl mb-2">{preset.icon}</div>
            <div className="text-xs font-bold text-slate-700 mb-1">{preset.name}</div>
            <div className="text-[10px] text-slate-400 leading-tight">{preset.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
