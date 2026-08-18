// 监控报表二级配置页面，分别承载漏斗定义和业务事件定义。
import React from 'react';
import FunnelDrilldownWorkspace from './FunnelDrilldownWorkspace';
import { BUSINESS_FUNNEL_SOURCE_DATA } from './funnelMockData';

export function FunnelConfigurationPage() {
  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">漏斗配置</h1>
      <FunnelDrilldownWorkspace source={BUSINESS_FUNNEL_SOURCE_DATA} timeRange="this_month" selectedBotIds={[]} callDirection="全部呼叫" pageMode="funnel_config" />
    </div>
  );
}

export function BusinessEventConfigurationPage() {
  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">事件配置</h1>
      <FunnelDrilldownWorkspace source={BUSINESS_FUNNEL_SOURCE_DATA} timeRange="this_month" selectedBotIds={[]} callDirection="全部呼叫" pageMode="event_config" />
    </div>
  );
}
