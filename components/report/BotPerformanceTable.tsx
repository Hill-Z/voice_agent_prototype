import React, { useState } from 'react';
import { Search, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { BotPerformance } from '../../types';

interface BotPerformanceTableProps {
  data: BotPerformance[];
}

type SortField = keyof BotPerformance;
type SortDirection = 'asc' | 'desc';

const BotPerformanceTable: React.FC<BotPerformanceTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalCalls');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data]
    .filter((bot) =>
      bot.botName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="text-slate-400" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp size={14} className="text-primary" />
    ) : (
      <ChevronDown size={14} className="text-primary" />
    );
  };

  const columns: { key: SortField; label: string; align?: 'left' | 'center' | 'right' }[] = [
    { key: 'botName', label: '机器人名称', align: 'left' },
    { key: 'totalCalls', label: '通话量', align: 'center' },
    { key: 'connectionRate', label: '接通率', align: 'center' },
    { key: 'avgDuration', label: '平均时长', align: 'center' },
    { key: 'satisfaction', label: '满意度', align: 'center' },
    { key: 'intentAccuracy', label: '主题准确率', align: 'center' },
    { key: 'transferRate', label: '转人工率', align: 'center' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header with search */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-base font-bold text-slate-800">机器人性能对比</h3>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索机器人..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:border-primary outline-none w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-gray-100">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 transition-colors ${
                    column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                  onClick={() => handleSort(column.key)}
                >
                  <div className={`flex items-center gap-1 ${column.align === 'center' ? 'justify-center' : column.align === 'right' ? 'justify-end' : ''}`}>
                    {column.label}
                    {getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedData.map((bot) => (
              <tr key={bot.botId} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-slate-800">{bot.botName}</td>
                <td className="px-4 py-3 text-sm text-slate-600 text-center">{bot.totalCalls}</td>
                <td className="px-4 py-3 text-sm text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    bot.connectionRate >= 0.8 ? 'bg-green-50 text-green-600' :
                    bot.connectionRate >= 0.6 ? 'bg-yellow-50 text-yellow-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {(bot.connectionRate * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 text-center">{formatDuration(bot.avgDuration)}</td>
                <td className="px-4 py-3 text-sm text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    bot.satisfaction >= 4.5 ? 'bg-green-50 text-green-600' :
                    bot.satisfaction >= 3.5 ? 'bg-yellow-50 text-yellow-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {bot.satisfaction.toFixed(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    bot.intentAccuracy >= 0.9 ? 'bg-green-50 text-green-600' :
                    bot.intentAccuracy >= 0.75 ? 'bg-yellow-50 text-yellow-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {(bot.intentAccuracy * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    bot.transferRate <= 0.15 ? 'bg-green-50 text-green-600' :
                    bot.transferRate <= 0.25 ? 'bg-yellow-50 text-yellow-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {(bot.transferRate * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 bg-slate-50 text-xs text-slate-500">
        共 {sortedData.length} 个机器人
      </div>
    </div>
  );
};

export default BotPerformanceTable;
