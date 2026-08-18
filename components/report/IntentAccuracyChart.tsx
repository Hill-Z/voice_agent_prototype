import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { IntentAnalysis, UnmatchedIntent } from '../../types';
import { Plus } from 'lucide-react';

interface IntentAccuracyChartProps {
  data: IntentAnalysis[];
  unmatchedIntents: UnmatchedIntent[];
}

const IntentAccuracyChart: React.FC<IntentAccuracyChartProps> = ({
  data,
  unmatchedIntents,
}) => {
  const sortedData = [...data].sort((a, b) => b.triggerCount - a.triggerCount);

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.9) return '#10b981';
    if (accuracy >= 0.75) return '#f59e0b';
    return '#ef4444';
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Intent Accuracy Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-base font-bold text-slate-800 mb-4">主题识别准确率</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="intentName"
              width={75}
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: number, name: string, props: any) => {
                if (name === 'accuracy') {
                  return [`${(value * 100).toFixed(1)}%`, '准确率'];
                }
                return [value, name];
              }}
              labelFormatter={(label) => `${label}`}
            />
            <Bar dataKey="accuracy" name="准确率" radius={[0, 4, 4, 0]}>
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getAccuracyColor(entry.accuracy)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Intent Stats Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-base font-bold text-slate-800 mb-4">主题触发统计</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-gray-100">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold text-slate-500 uppercase">
                  主题名称
                </th>
                <th className="px-3 py-2 text-center text-xs font-bold text-slate-500 uppercase">
                  触发次数
                </th>
                <th className="px-3 py-2 text-center text-xs font-bold text-slate-500 uppercase">
                  平均时长
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedData.slice(0, 6).map((intent) => (
                <tr key={intent.intentId} className="hover:bg-slate-50/80">
                  <td className="px-3 py-2 text-sm text-slate-800">{intent.intentName}</td>
                  <td className="px-3 py-2 text-sm text-slate-600 text-center">
                    {intent.triggerCount}
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-600 text-center">
                    {formatDuration(intent.avgDuration)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unmatched Intents */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-slate-800">未识别主题 TOP 10</h3>
          <span className="text-xs text-slate-500">可一键添加到知识库</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {unmatchedIntents.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 w-5">{index + 1}</span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.text}</p>
                  <p className="text-xs text-slate-500">
                    出现 {item.count} 次 · 最近{' '}
                    {new Date(item.lastTime).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
              <button className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors">
                <Plus size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IntentAccuracyChart;
