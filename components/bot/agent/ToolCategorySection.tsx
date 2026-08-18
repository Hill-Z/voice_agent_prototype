import React from 'react';
import { ChevronDown, ChevronRight, Wrench, MessageSquare, Phone, MoreHorizontal, Database, Calculator } from 'lucide-react';
import { AgentTool } from '../../../types';

interface ToolCategorySectionProps {
  category: string;
  tools: AgentTool[];
  onEditTool: (tool: AgentTool) => void;
  onDeleteTool: (id: string) => void;
}

const CATEGORY_CONFIG: Record<string, { title: string; icon: React.ReactNode; color: string }> = {
  api_call: {
    title: 'API 调用',
    icon: <Wrench size={16} className="text-blue-600" />,
    color: 'blue'
  },
  knowledge: {
    title: '知识工具',
    icon: <Database size={16} className="text-amber-600" />,
    color: 'amber'
  },
  pricing: {
    title: '计价工具',
    icon: <Calculator size={16} className="text-emerald-600" />,
    color: 'emerald'
  },
  communication: {
    title: '通信工具',
    icon: <MessageSquare size={16} className="text-purple-600" />,
    color: 'purple'
  },
  transfer: {
    title: '转接工具',
    icon: <Phone size={16} className="text-green-600" />,
    color: 'green'
  },
  other: {
    title: '其他工具',
    icon: <MoreHorizontal size={16} className="text-slate-600" />,
    color: 'slate'
  }
};

export default function ToolCategorySection({
  category,
  tools,
  onEditTool,
  onDeleteTool
}: ToolCategorySectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
    green: 'bg-green-50 border-green-100 text-green-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    slate: 'bg-slate-50 border-slate-100 text-slate-700'
  };

  return (
    <div className="mb-6 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${colorClasses[config.color]}`}>
            {config.icon}
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-800">{config.title}</h3>
            <p className="text-xs text-slate-500">{tools.length} 个工具</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">
            {isExpanded ? '收起' : '展开'}
          </span>
          {isExpanded ? (
            <ChevronDown size={16} className="text-slate-400" />
          ) : (
            <ChevronRight size={16} className="text-slate-400" />
          )}
        </div>
      </button>

      {/* Tools List */}
      {isExpanded && (
        <div className="p-6 bg-white">
          {tools.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              暂无工具
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {tools.map(tool => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onEdit={() => onEditTool(tool)}
                  onDelete={() => onDeleteTool(tool.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ToolCardProps {
  tool: AgentTool;
  onEdit: () => void;
  onDelete: () => void;
}

function ToolCard({ tool, onEdit, onDelete }: ToolCardProps) {
  const typeColors: Record<string, string> = {
    API: 'bg-blue-50 text-blue-600 border-blue-100',
    SMS: 'bg-purple-50 text-purple-600 border-purple-100',
    TRANSFER: 'bg-green-50 text-green-600 border-green-100',
    EMAIL: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    CUSTOM: 'bg-slate-50 text-slate-600 border-slate-100'
  };

  return (
    <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all group">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          {tool.icon && (
            <span className="text-xl">{tool.icon}</span>
          )}
          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${typeColors[tool.type] || typeColors.CUSTOM}`}>
            {tool.type === 'API' ? 'API 接口' : tool.type === 'SMS' ? '发送短信' : tool.type === 'TRANSFER' ? '转接' : tool.type}
          </span>
          <h4 className="font-bold text-slate-800 font-mono text-sm">{tool.name}</h4>
        </div>
        
        {/* Actions */}
        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="编辑"
          >
            <Wrench size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="删除"
          >
            <Wrench size={14} className="rotate-180" />
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-600 mb-4 pl-1 border-l-2 border-slate-100 leading-relaxed">
        {tool.description}
      </p>

      {/* Response Instruction */}
      {tool.responseInstruction && (
        <div className="mb-4 bg-blue-50/30 p-2 rounded text-[10px] text-slate-500 flex items-start">
          <MessageSquare size={12} className="mr-2 mt-0.5 text-blue-400 flex-shrink-0" />
          <div>
            <span className="font-bold text-slate-600">回复指引：</span>
            {tool.responseInstruction}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between pt-3 border-t border-gray-50">
        {/* Parameters */}
        <div className="flex flex-wrap gap-2 pl-1">
          {tool.parameters.length > 0 ? (
            tool.parameters.slice(0, 3).map((p, idx) => (
              <span
                key={idx}
                className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 font-mono"
              >
                {p.name}: {p.type}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-slate-300 italic">无参数</span>
          )}
          {tool.parameters.length > 3 && (
            <span className="text-[10px] text-slate-400">+{tool.parameters.length - 3}</span>
          )}
        </div>

        {/* Execution Info */}
        <div className="flex items-center space-x-3">
          {tool.averageDuration && (
            <span className="text-[10px] text-slate-400">
              ⏱ {tool.averageDuration / 1000}s
            </span>
          )}
          {tool.executionStrategy?.playFiller && (
            <div className="flex items-center text-[10px] text-indigo-400">
              <Wrench size={10} className="mr-1" />
              {tool.executionStrategy.fillerType === 'TTS' ? 'TTS 播报' : '音频播放'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
