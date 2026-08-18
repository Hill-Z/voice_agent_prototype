import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { TrendData, HourlyDistribution } from '../../types';

interface TrendChartProps {
  data: TrendData[];
  type?: 'calls' | 'satisfaction' | 'duration';
  height?: number;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, type = 'calls', height = 300 }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const renderCallsChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorConnected" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          stroke="#6b7280"
          fontSize={12}
        />
        <YAxis stroke="#6b7280" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          labelFormatter={(label) => `日期: ${label}`}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="totalCalls"
          name="总通话数"
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#colorTotal)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="connectedCalls"
          name="接通数"
          stroke="#10b981"
          fillOpacity={1}
          fill="url(#colorConnected)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderSatisfactionChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          stroke="#6b7280"
          fontSize={12}
        />
        <YAxis 
          domain={[0, 5]} 
          stroke="#6b7280" 
          fontSize={12}
          tickFormatter={(value) => value.toFixed(1)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          labelFormatter={(label) => `日期: ${label}`}
          formatter={(value: number) => [value.toFixed(2), '满意度']}
        />
        <Line
          type="monotone"
          dataKey="satisfaction"
          name="满意度评分"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderDurationChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          stroke="#6b7280"
          fontSize={12}
        />
        <YAxis 
          stroke="#6b7280" 
          fontSize={12}
          tickFormatter={(value) => `${Math.floor(value / 60)}分`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          labelFormatter={(label) => `日期: ${label}`}
          formatter={(value: number) => {
            const mins = Math.floor(value / 60);
            const secs = value % 60;
            return [`${mins}分${secs}秒`, '平均时长'];
          }}
        />
        <Bar
          dataKey="avgDuration"
          name="平均通话时长"
          fill="#f59e0b"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  switch (type) {
    case 'satisfaction':
      return renderSatisfactionChart();
    case 'duration':
      return renderDurationChart();
    case 'calls':
    default:
      return renderCallsChart();
  }
};

interface HourlyHeatmapProps {
  data: HourlyDistribution[];
  height?: number;
}

export const HourlyHeatmap: React.FC<HourlyHeatmapProps> = ({ data, height = 200 }) => {
  const maxCount = Math.max(...data.map(d => d.callCount));
  
  const getColor = (count: number) => {
    const intensity = count / maxCount;
    if (intensity > 0.8) return 'bg-blue-600';
    if (intensity > 0.6) return 'bg-blue-500';
    if (intensity > 0.4) return 'bg-blue-400';
    if (intensity > 0.2) return 'bg-blue-300';
    return 'bg-blue-200';
  };

  return (
    <div style={{ height }} className="w-full">
      <div className="grid grid-cols-12 gap-1 h-full">
        {data.map((hour) => (
          <div
            key={hour.hour}
            className={`${getColor(hour.callCount)} rounded flex flex-col items-center justify-center p-1 transition-all hover:opacity-80 cursor-pointer`}
            title={`${hour.hour}:00 - ${hour.callCount} 通`}
          >
            <span className="text-[10px] text-white font-medium">{hour.hour}</span>
            <span className="text-[8px] text-white/80">{hour.callCount}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-slate-500">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
};

export default TrendChart;
