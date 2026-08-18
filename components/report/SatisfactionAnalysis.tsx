import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Star } from 'lucide-react';

interface SatisfactionAnalysisProps {
  distribution: { rating: number; count: number; percentage: number }[];
  avgSatisfaction: number;
}

const SatisfactionAnalysis: React.FC<SatisfactionAnalysisProps> = ({
  distribution,
  avgSatisfaction,
}) => {
  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981'];

  const pieData = distribution.map((item) => ({
    name: `${item.rating}星`,
    value: item.count,
    percentage: item.percentage,
  }));

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingBgColor = (rating: number) => {
    if (rating >= 4.5) return 'bg-green-50';
    if (rating >= 3.5) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Average Satisfaction Score */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-base font-bold text-slate-800 mb-4">平均满意度评分</h3>
        <div className="flex items-center justify-center py-8">
          <div
            className={`w-40 h-40 rounded-full ${getRatingBgColor(
              avgSatisfaction
            )} flex flex-col items-center justify-center border-4 border-white shadow-lg`}
          >
            <span className={`text-5xl font-bold ${getRatingColor(avgSatisfaction)}`}>
              {avgSatisfaction.toFixed(1)}
            </span>
            <div className="flex items-center gap-0.5 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={
                    star <= Math.round(avgSatisfaction)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }
                />
              ))}
            </div>
            <span className="text-xs text-slate-500 mt-1">满分 5.0</span>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2 mt-4">
          {distribution.map((item) => (
            <div key={item.rating} className="text-center">
              <div className="text-lg font-bold text-slate-800">{item.count}</div>
              <div className="flex items-center justify-center gap-0.5">
                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-slate-500">{item.rating}</span>
              </div>
              <div className="text-xs text-slate-400">{item.percentage}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Satisfaction Distribution Pie Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-base font-bold text-slate-800 mb-4">满意度分布</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: number, name: string, props: any) => {
                const percentage = props?.payload?.percentage;
                return [`${value} (${percentage}%)`, name];
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Rating Details */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:col-span-2">
        <h3 className="text-base font-bold text-slate-800 mb-4">评分详情</h3>
        <div className="space-y-3">
          {distribution
            .slice()
            .reverse()
            .map((item) => (
              <div key={item.rating} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-16">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium text-slate-700">{item.rating}</span>
                </div>
                <div className="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: COLORS[5 - item.rating],
                    }}
                  />
                </div>
                <div className="w-20 text-right">
                  <span className="text-sm font-medium text-slate-700">{item.count}</span>
                  <span className="text-xs text-slate-400 ml-1">({item.percentage}%)</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SatisfactionAnalysis;
