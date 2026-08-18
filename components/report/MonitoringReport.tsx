// 综合运营报表入口，统一按顶部筛选展示通话、Topic、Flow、工具和实体统计。
import React, { useEffect, useMemo, useState } from 'react';
import { Bot, Calendar, ChevronDown, Download, RefreshCw } from 'lucide-react';
import { CallDirectionFilter, TimeRange } from '../../types';
import { getReportData, MOCK_BOTS } from './mockData';
import { cx } from './reportUi';
import CallAnalysisTab from './CallAnalysisTab';
import FunnelDrilldownWorkspace from './FunnelDrilldownWorkspace';
import TopicFlowAnalysis from './TopicFlowAnalysis';
import ToolTransferTab from './ToolTransferTab';

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'today', label: '今日' },
  { value: 'yesterday', label: '昨日' },
  { value: 'this_week', label: '本周' },
  { value: 'last_week', label: '上周' },
  { value: 'this_month', label: '本月' },
  { value: 'last_month', label: '上月' },
];

const CALL_DIRECTION_OPTIONS: CallDirectionFilter[] = ['全部呼叫', '呼入', '外呼'];

export default function MonitoringReport() {
  const [timeRange, setTimeRange] = useState<TimeRange>('this_month');
  const [selectedBots, setSelectedBots] = useState<string[]>([]);
  const [showBotDropdown, setShowBotDropdown] = useState(false);
  const [callDirection, setCallDirection] = useState<CallDirectionFilter>(CALL_DIRECTION_OPTIONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const reportData = useMemo(() => getReportData(timeRange), [callDirection, refreshToken, selectedBots, timeRange]);
  const totalTransfers = reportData.transferReport.totalTransfers;

  useEffect(() => {
    setIsLoading(true);
    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, 360);
    return () => window.clearTimeout(timer);
  }, [timeRange, selectedBots, callDirection]);

  // 演示版导出先给出明确反馈，后续可替换真实下载。
  const handleExport = () => {
    alert('正在导出当前筛选条件下的综合报表，格式支持 Excel / CSV。');
  };

  // 演示版刷新用于展示真实报表会有的重新拉取数据过程。
  const handleRefresh = () => {
    setIsLoading(true);
    window.setTimeout(() => {
      setRefreshToken(current => current + 1);
      setIsLoading(false);
    }, 360);
  };

  // 演示版跳转先给出明确反馈，真实系统中应跳到通话记录菜单。
  const handleOpenCallRecord = () => {
    alert('请到左侧“通话记录”菜单查看通话详情。');
  };
  const renderFilters = () => (
    <div className="flex flex-wrap items-center justify-start gap-3 md:justify-end">
      <div className="flex items-center rounded-lg border border-gray-200 bg-white p-1">
        <Calendar size={16} className="ml-2 text-slate-400" />
        {TIME_RANGE_OPTIONS.map(option => (
          <button
            key={option.value}
            onClick={() => setTimeRange(option.value)}
            className={cx('rounded-md px-3 py-1.5 text-sm font-medium transition-all', timeRange === option.value ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50')}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <button onClick={() => setShowBotDropdown(!showBotDropdown)} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Bot size={16} /> 机器人 <ChevronDown size={14} />
        </button>
        {showBotDropdown && (
          <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
            {MOCK_BOTS.map(bot => (
              <label key={bot.id} className="flex cursor-pointer items-center px-4 py-2 text-sm hover:bg-slate-50">
                <input type="checkbox" className="mr-2" checked={selectedBots.includes(bot.id)} onChange={() => setSelectedBots(prev => (prev.includes(bot.id) ? prev.filter(id => id !== bot.id) : [...prev, bot.id]))} />
                {bot.name}
              </label>
            ))}
          </div>
        )}
      </div>

      <select value={callDirection} onChange={e => setCallDirection(e.target.value as CallDirectionFilter)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-slate-700">
        {CALL_DIRECTION_OPTIONS.map(option => <option key={option}>{option}</option>)}
      </select>
      <button onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
        <Download size={16} /> 导出
      </button>
      <button onClick={handleRefresh} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
        <RefreshCw size={16} className={cx(isLoading && 'animate-spin')} /> 刷新
      </button>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(320px,1fr)_auto] xl:items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">综合运营报表</h1>
        </div>
        {renderFilters()}
      </div>

      <div className="space-y-10">
        <section>
          <SectionTitle title="通话统计" />
          <CallAnalysisTab data={reportData.callAnalysis} transferCount={totalTransfers} callDirection={callDirection} onViewCall={handleOpenCallRecord} isLoading={isLoading} />
        </section>

        <section>
          <SectionTitle title="业务与流程分析" />
          <TopicFlowAnalysis topics={reportData.topicAnalysis} flows={reportData.flowFunnels} isLoading={isLoading} />
        </section>

        <section>
          <SectionTitle title="业务漏斗" />
          <FunnelDrilldownWorkspace
            source={reportData.funnelSource}
            timeRange={timeRange}
            selectedBotIds={selectedBots}
            callDirection={callDirection}
            isLoading={isLoading}
            pageMode="analysis"
          />
        </section>

        <section>
          <SectionTitle title="工具调用" />
          <ToolTransferTab tools={reportData.toolCalls} isLoading={isLoading} />
        </section>
      </div>
    </div>
  );
}

interface SectionTitleProps {
  title: string;
}

function SectionTitle({ title }: SectionTitleProps) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
    </div>
  );
}
