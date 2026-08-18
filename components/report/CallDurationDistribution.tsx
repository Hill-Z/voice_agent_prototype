import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DurationDistribution, HangupReasonDistribution } from '../../types';
import { Clock, PhoneOff, PhoneCall, AlertCircle, UserX, CheckCircle } from 'lucide-react';

interface CallDurationDistributionProps {
  durationData: DurationDistribution[];
  hangupReasonData: HangupReasonDistribution[];
  avgWaitTime: number;
  avgHandleTime: number;
}

const CallDurationDistribution: React.FC<CallDurationDistributionProps> = ({
  durationData,
  hangupReasonData,
  avgWaitTime,
  avgHandleTime,
}) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const getHangupIcon = (reason: string) => {
    switch (reason) {
      case '正常结束':
        return <CheckCircle size={16} className="text-green-500" />;
      case '用户主动挂断':
        return <UserX size={16} className="text-orange-500" />;
      case '转人工':
        return <PhoneCall size={16} className="text-blue-500" />;
      case '超时挂断':
        return <Clock size={16} className="text-yellow-500" />;
      case '异常中断':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <PhoneOff size={16} className="text-slate-400" />;
    }
  };

  const getHangupColor = (reason: string) => {
    switch (reason) {
      case '正常结束':
        return 'bg-green-50 text-green-600';
      case '用户主动挂断':
        return 'bg-orange-50 text-orange-600';
      case '转人工':
        return 'bg-blue-50 text-blue-600';
      case '超时挂断':
        return 'bg-yellow-50 text-yellow-600';
      case '异常中断':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Duration Distribution Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-base font-bold text-slate-800 mb-4">通话时长分布</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={durationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="range" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: number, name: string, props: any) => {
                const percentage = props?.payload?.percentage;
                return [`${value} (${percentage}%)`, '通话数'];
              }}
            />
            <Bar dataKey="count" name="通话数" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Hangup Reason Pie Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-base font-bold text-slate-800 mb-4">挂断原因分布</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={hangupReasonData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="count"
              nameKey="reason"
            >
              {hangupReasonData.map((entry, index) => (
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

      {/* Key Metrics */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:col-span-2">
        <h3 className="text-base font-bold text-slate-800 mb-4">关键指标</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">平均等待时间</p>
              <p className="text-2xl font-bold text-slate-800">
                {Math.floor(avgWaitTime / 60)}分{avgWaitTime % 60}秒
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
            <div className="p-3 bg-green-100 rounded-lg">
              <PhoneCall size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">平均处理时间</p>
              <p className="text-2xl font-bold text-slate-800">
                {Math.floor(avgHandleTime / 60)}分{avgHandleTime % 60}秒
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hangup Reason Details */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:col-span-2">
        <h3 className="text-base font-bold text-slate-800 mb-4">挂断原因详情</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {hangupReasonData.map((item, index) => (
            <div
              key={item.reason}
              className={`flex items-center justify-between p-3 rounded-lg ${getHangupColor(
                item.reason
              )}`}
            >
              <div className="flex items-center gap-3">
                {getHangupIcon(item.reason)}
                <span className="text-sm font-medium">{item.reason}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold">{item.count}</span>
                <span className="text-xs ml-1 opacity-70">({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CallDurationDistribution;
