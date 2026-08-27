// 实时监控与预警页面：同时展示当前运行健康、今日话务、转人工和工具调用状态。
import React, { useMemo, useState } from 'react';
import { Activity, BellRing, Edit2, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  ALERT_RECORDS, AlertRule, INITIAL_ALERT_RULES, LIVE_CALLS, METRIC_OPTIONS, MONITOR_BOTS,
  MonitorAlertRecord, MonitorMetricKey, TODAY_CALL_TREND, TODAY_TOOL_TREND,
} from './realtimeMonitoringData';

const inputClass = 'w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary';
const severityMeta = { critical: ['紧急', 'bg-red-50 text-red-600'], warning: ['警告', 'bg-amber-50 text-amber-700'], info: ['提醒', 'bg-blue-50 text-blue-600'] } as const;
const channelLabel = { email: '邮件', webhook: 'Webhook', wechat: '企业微信', dingtalk: '钉钉' } as const;

// 查找指标的展示信息。
const metricMeta = (key: MonitorMetricKey) => METRIC_OPTIONS.find(item => item.key === key) || METRIC_OPTIONS[0];

// 将通话时长转换成分秒格式。
const duration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

// 生成一条可编辑的新告警规则。
const createRule = (): AlertRule => ({
  id: '', name: '', scope: '全部机器人', metric: 'error_rate', comparator: 'gt', threshold: 5,
  windowMinutes: 5, schedule: 'all_day', severity: 'warning', channel: 'email', recipients: '', enabled: true,
});

interface MetricCardProps {
  label: string;
  value: string | number;
  note: string;
  valueClass?: string;
}

// 展示单个指标值和口径说明。
function MetricCard({ label, value, note, valueClass = 'text-slate-900' }: MetricCardProps) {
  return <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
    <div className="text-xs text-slate-500">{label}</div>
    <div className={`mt-1.5 text-2xl font-bold ${valueClass}`}>{value}</div>
    <div className="mt-1 text-[11px] text-slate-400">{note}</div>
  </div>;
}

export default function RealtimeMonitoringPage() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'alerts'>('monitor');
  const [alertSubTab, setAlertSubTab] = useState<'rules' | 'records'>('rules');
  const [dashboardBot, setDashboardBot] = useState('all');
  const [botFilter, setBotFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [rules, setRules] = useState<AlertRule[]>(INITIAL_ALERT_RULES);
  const [records, setRecords] = useState<MonitorAlertRecord[]>(ALERT_RECORDS);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [ruleError, setRuleError] = useState('');
  const [lastRefresh, setLastRefresh] = useState('刚刚');

  const activeCalls = MONITOR_BOTS.reduce((sum, item) => sum + item.activeCalls, 0);
  const concurrencyUsed = MONITOR_BOTS.reduce((sum, item) => sum + item.concurrencyUsed, 0);
  const concurrencyLimit = MONITOR_BOTS.reduce((sum, item) => sum + item.concurrencyLimit, 0);
  const calls = useMemo(() => LIVE_CALLS.filter(item =>
    (botFilter === 'all' || item.botName === botFilter)
    && (directionFilter === 'all' || item.direction === directionFilter)
    && (!keyword.trim() || `${item.id}${item.phone}${item.currentStep}`.toLowerCase().includes(keyword.trim().toLowerCase())),
  ), [botFilter, directionFilter, keyword]);

  // 保存告警规则并保留原有列表顺序。
  const saveRule = () => {
    if (!editingRule) return;
    if (!editingRule.name.trim()) return setRuleError('请输入规则名称。');
    if (!editingRule.recipients.trim()) return setRuleError('请输入消息接收地址或接收人。');
    const next = { ...editingRule, id: editingRule.id || `rule_${Date.now()}` };
    setRules(current => editingRule.id ? current.map(item => item.id === editingRule.id ? next : item) : [next, ...current]);
    setEditingRule(null);
    setRuleError('');
  };

  // 切换指标时带出常用阈值。
  const changeMetric = (metric: MonitorMetricKey) => {
    const option = metricMeta(metric);
    setEditingRule(current => current ? { ...current, metric, comparator: option.defaultComparator, threshold: option.defaultThreshold } : current);
  };

  return <div className="mx-auto max-w-[1480px] p-6">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-slate-900">实时监控</h1><p className="mt-1 text-sm text-slate-500">同时关注当前运行状态、今日话务、转人工和工具调用。</p></div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <select value={dashboardBot} onChange={event => setDashboardBot(event.target.value)} className="rounded border border-slate-200 bg-white px-3 py-2"><option value="all">全部机器人</option>{MONITOR_BOTS.map(bot => <option key={bot.id} value={bot.id}>{bot.name}</option>)}</select>
        <span>更新于 {lastRefresh}</span><select className="rounded border border-slate-200 bg-white px-2 py-2"><option>每 10 秒刷新</option><option>每 30 秒刷新</option><option>暂停刷新</option></select>
        <button type="button" onClick={() => setLastRefresh('刚刚')} className="rounded border border-slate-200 bg-white p-2 hover:bg-slate-50" aria-label="立即刷新"><RefreshCw size={15} /></button>
      </div>
    </div>

    <div className="mb-4 flex border-b border-slate-200">
      <button type="button" onClick={() => setActiveTab('monitor')} className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === 'monitor' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}><Activity size={16} />监控</button>
      <button type="button" onClick={() => setActiveTab('alerts')} className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === 'alerts' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}><BellRing size={16} />监控预警</button>
    </div>

    {activeTab === 'monitor' ? <div className="space-y-5">
      <section><div className="mb-2 flex items-center gap-2"><h2 className="text-sm font-bold text-slate-800">实时状态</h2><span className="text-xs text-slate-400">滚动窗口</span></div><div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="当前通话" value={activeCalls} note="正在进行" valueClass="text-emerald-600" />
        <MetricCard label="并发使用率" value={`${(concurrencyUsed / concurrencyLimit * 100).toFixed(0)}%`} note={`${concurrencyUsed} / ${concurrencyLimit}`} valueClass="text-blue-600" />
        <MetricCard label="近 5 分钟通话量" value={112} note="较上一窗口 +3.7%" />
        <MetricCard label="正常完成率" value="92.4%" note="近 15 分钟" valueClass="text-emerald-600" />
        <MetricCard label="异常率" value="2.1%" note="近 5 分钟" valueClass="text-amber-600" />
        <MetricCard label="P95 响应耗时" value="1.84 s" note="近 5 分钟" valueClass="text-amber-600" />
      </div></section>

      <section><div className="mb-2 flex items-center gap-2"><h2 className="text-sm font-bold text-slate-800">今日概览</h2><span className="text-xs text-slate-400">今日 00:00 至今</span></div><div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="呼入量" value="3,286" note="接通率 94.1%" />
        <MetricCard label="呼出量" value="1,742" note="接通率 72.6%" />
        <MetricCard label="平均通话时长" value="3:12" note="较昨日 -8 秒" />
        <MetricCard label="转人工" value="486" note="转人工率 13.6%" valueClass="text-violet-600" />
        <MetricCard label="工具调用" value="2,864" note="成功率 97.8%" valueClass="text-blue-600" />
        <MetricCard label="工具 P95 耗时" value="0.87 s" note="失败 63 次" valueClass="text-amber-600" />
      </div></section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-bold text-slate-800">今日通话趋势</h2><p className="mt-1 text-xs text-slate-500">累计呼入、呼出和转人工量，快速识别流量变化。</p><div className="mt-4 h-64 min-w-0"><ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 256 }}><LineChart data={TODAY_CALL_TREND}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="time" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend /><Line type="monotone" dataKey="inbound" name="呼入量" stroke="#2563eb" strokeWidth={2} /><Line type="monotone" dataKey="outbound" name="呼出量" stroke="#10b981" strokeWidth={2} /><Line type="monotone" dataKey="handoffs" name="转人工量" stroke="#8b5cf6" strokeWidth={2} /></LineChart></ResponsiveContainer></div></section>
        <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-bold text-slate-800">今日工具运行趋势</h2><p className="mt-1 text-xs text-slate-500">调用量与成功率需同时观察，避免只看到机器人在线。</p><div className="mt-4 h-64 min-w-0"><ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 256 }}><LineChart data={TODAY_TOOL_TREND}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="time" tick={{ fontSize: 11 }} /><YAxis yAxisId="left" tick={{ fontSize: 11 }} /><YAxis yAxisId="right" orientation="right" domain={[90, 100]} tick={{ fontSize: 11 }} /><Tooltip /><Legend /><Line yAxisId="left" type="monotone" dataKey="calls" name="工具调用量" stroke="#2563eb" strokeWidth={2} /><Line yAxisId="right" type="monotone" dataKey="successRate" name="成功率(%)" stroke="#10b981" strokeWidth={2} /></LineChart></ResponsiveContainer></div></section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-bold text-slate-800">机器人健康状态</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">机器人</th><th className="px-5 py-3">当前通话</th><th className="px-5 py-3">今日通话</th><th className="px-5 py-3">并发</th><th className="px-5 py-3">正常完成率</th><th className="px-5 py-3">转人工率</th><th className="px-5 py-3">工具成功率</th><th className="px-5 py-3">P95 耗时</th><th className="px-5 py-3">状态</th></tr></thead><tbody className="divide-y divide-slate-100">{MONITOR_BOTS.map(bot => <tr key={bot.id} className="text-sm"><td className="px-5 py-3 font-semibold text-slate-800">{bot.name}</td><td className="px-5 py-3 text-slate-600">{bot.activeCalls}</td><td className="px-5 py-3 text-slate-600">{bot.todayCalls.toLocaleString()}</td><td className="px-5 py-3 text-slate-600">{bot.concurrencyUsed}/{bot.concurrencyLimit}</td><td className="px-5 py-3 text-slate-600">{bot.successRate}%</td><td className="px-5 py-3 text-slate-600">{bot.handoffRate}%</td><td className={`px-5 py-3 ${bot.toolSuccessRate < 95 ? 'font-semibold text-amber-600' : 'text-slate-600'}`}>{bot.toolSuccessRate}%</td><td className="px-5 py-3 text-slate-600">{bot.latencyP95}ms</td><td className="px-5 py-3"><span className={`rounded-full px-2 py-0.5 text-xs ${bot.status === 'healthy' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700'}`}>{bot.status === 'healthy' ? '正常' : '预警'}</span></td></tr>)}</tbody></table></div></section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4"><h2 className="mr-auto text-sm font-bold text-slate-800">实时通话</h2><select value={botFilter} onChange={event => setBotFilter(event.target.value)} className={inputClass}><option value="all">全部机器人</option>{MONITOR_BOTS.map(bot => <option key={bot.id}>{bot.name}</option>)}</select><select value={directionFilter} onChange={event => setDirectionFilter(event.target.value)} className={inputClass}><option value="all">全部方向</option><option>呼入</option><option>外呼</option></select><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={keyword} onChange={event => setKeyword(event.target.value)} className="rounded border border-slate-200 py-2 pl-9 pr-3 text-sm" placeholder="搜索通话 ID 或号码" /></div></div><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">通话 ID</th><th className="px-5 py-3">客户号码</th><th className="px-5 py-3">机器人</th><th className="px-5 py-3">方向</th><th className="px-5 py-3">时长</th><th className="px-5 py-3">当前流程 / 节点</th><th className="px-5 py-3">当前响应耗时</th><th className="px-5 py-3">状态</th><th className="px-5 py-3 text-right">操作</th></tr></thead><tbody className="divide-y divide-slate-100">{calls.map(call => <tr key={call.id} className="text-sm"><td className="px-5 py-3 font-mono text-xs text-slate-600">{call.id}</td><td className="px-5 py-3 text-slate-600">{call.phone}</td><td className="px-5 py-3 text-slate-700">{call.botName}</td><td className="px-5 py-3 text-slate-600">{call.direction}</td><td className="px-5 py-3 text-slate-600">{duration(call.durationSeconds)}</td><td className="px-5 py-3 text-slate-600">{call.currentStep}</td><td className={`px-5 py-3 ${call.latencyMs > 2500 ? 'font-semibold text-red-600' : 'text-slate-600'}`}>{call.latencyMs.toLocaleString()} ms</td><td className="px-5 py-3"><span className={`rounded-full px-2 py-0.5 text-xs ${call.status === '异常' ? 'bg-red-50 text-red-600' : call.status === '转人工中' ? 'bg-violet-50 text-violet-600' : 'bg-emerald-50 text-emerald-600'}`}>{call.status}</span></td><td className="px-5 py-3 text-right"><button type="button" onClick={() => alert(`打开 ${call.id} 的实时详情`)} className="text-xs font-semibold text-primary">查看</button></td></tr>)}</tbody></table></div></section>
    </div> : <AlertArea alertSubTab={alertSubTab} setAlertSubTab={setAlertSubTab} rules={rules} setRules={setRules} records={records} setRecords={setRecords} setEditingRule={setEditingRule} />}

    {editingRule && <RuleDialog editingRule={editingRule} setEditingRule={setEditingRule} changeMetric={changeMetric} saveRule={saveRule} ruleError={ruleError} />}
  </div>;
}

interface AlertAreaProps {
  alertSubTab: 'rules' | 'records';
  setAlertSubTab: React.Dispatch<React.SetStateAction<'rules' | 'records'>>;
  rules: AlertRule[];
  setRules: React.Dispatch<React.SetStateAction<AlertRule[]>>;
  records: MonitorAlertRecord[];
  setRecords: React.Dispatch<React.SetStateAction<MonitorAlertRecord[]>>;
  setEditingRule: React.Dispatch<React.SetStateAction<AlertRule | null>>;
}

// 展示告警规则和告警记录。
function AlertArea({ alertSubTab, setAlertSubTab, rules, setRules, records, setRecords, setEditingRule }: AlertAreaProps) {
  return <div className="space-y-4">
    <div className="flex items-center justify-between"><div className="flex rounded-lg bg-slate-100 p-1"><button type="button" onClick={() => setAlertSubTab('rules')} className={`rounded px-3 py-1.5 text-sm ${alertSubTab === 'rules' ? 'bg-white font-semibold text-slate-800 shadow-sm' : 'text-slate-500'}`}>告警规则</button><button type="button" onClick={() => setAlertSubTab('records')} className={`rounded px-3 py-1.5 text-sm ${alertSubTab === 'records' ? 'bg-white font-semibold text-slate-800 shadow-sm' : 'text-slate-500'}`}>告警记录</button></div>{alertSubTab === 'rules' && <button type="button" onClick={() => setEditingRule(createRule())} className="inline-flex items-center gap-1.5 rounded bg-primary px-4 py-2 text-sm font-semibold text-white"><Plus size={15} />新建规则</button>}</div>
    {alertSubTab === 'rules' ? <section className="rounded-lg border border-slate-200 bg-white shadow-sm"><div className="border-b border-blue-100 bg-blue-50 px-5 py-3 text-xs text-blue-700">同一规则在同一机器人上只生成一条活动告警；指标恢复后自动关闭，避免重复通知。</div><div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-left"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">规则名称</th><th className="px-5 py-3">监控范围</th><th className="px-5 py-3">触发条件</th><th className="px-5 py-3">生效时间</th><th className="px-5 py-3">等级</th><th className="px-5 py-3">通知方式</th><th className="px-5 py-3">状态</th><th className="px-5 py-3 text-right">操作</th></tr></thead><tbody className="divide-y divide-slate-100">{rules.map(rule => { const metric = metricMeta(rule.metric); return <tr key={rule.id} className="text-sm"><td className="px-5 py-4 font-semibold text-slate-800">{rule.name}</td><td className="px-5 py-4 text-slate-600">{rule.scope}</td><td className="px-5 py-4 text-slate-600">{metric.label} 连续 {rule.windowMinutes} 分钟 {rule.comparator === 'gt' ? '>' : '<'} {rule.threshold}{metric.unit}</td><td className="px-5 py-4 text-slate-600">{rule.schedule === 'all_day' ? '全天' : '机器人工作时间'}</td><td className="px-5 py-4"><span className={`rounded-full px-2 py-0.5 text-xs ${severityMeta[rule.severity][1]}`}>{severityMeta[rule.severity][0]}</span></td><td className="px-5 py-4 text-slate-600">{channelLabel[rule.channel]}<div className="mt-1 max-w-[220px] truncate text-xs text-slate-400">{rule.recipients}</div></td><td className="px-5 py-4"><button type="button" onClick={() => setRules(current => current.map(item => item.id === rule.id ? { ...item, enabled: !item.enabled } : item))} className={`relative h-5 w-9 rounded-full ${rule.enabled ? 'bg-primary' : 'bg-slate-300'}`} aria-label={rule.enabled ? '停用规则' : '启用规则'}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white ${rule.enabled ? 'left-[18px]' : 'left-0.5'}`} /></button></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => setEditingRule({ ...rule })} className="text-slate-400 hover:text-primary" aria-label="编辑规则"><Edit2 size={15} /></button><button type="button" onClick={() => window.confirm('确定删除该告警规则吗？') && setRules(current => current.filter(item => item.id !== rule.id))} className="text-slate-400 hover:text-red-500" aria-label="删除规则"><Trash2 size={15} /></button></div></td></tr>; })}</tbody></table></div></section> : <section className="rounded-lg border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">触发时间</th><th className="px-5 py-3">规则</th><th className="px-5 py-3">机器人</th><th className="px-5 py-3">指标值</th><th className="px-5 py-3">触发条件</th><th className="px-5 py-3">状态</th><th className="px-5 py-3 text-right">操作</th></tr></thead><tbody className="divide-y divide-slate-100">{records.map(record => <tr key={record.id} className="text-sm"><td className="px-5 py-4 text-slate-500">{record.triggeredAt}</td><td className="px-5 py-4"><div className="font-semibold text-slate-800">{record.ruleName}</div><span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${severityMeta[record.severity][1]}`}>{severityMeta[record.severity][0]}</span></td><td className="px-5 py-4 text-slate-600">{record.botName}</td><td className="px-5 py-4 font-semibold text-slate-800">{record.metricLabel}：{record.observedValue}</td><td className="px-5 py-4 text-slate-600">{record.thresholdText}</td><td className="px-5 py-4"><span className={`rounded-full px-2 py-0.5 text-xs ${record.status === 'active' ? 'bg-red-50 text-red-600' : record.status === 'acknowledged' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-600'}`}>{record.status === 'active' ? '告警中' : record.status === 'acknowledged' ? '已确认' : '已恢复'}</span></td><td className="px-5 py-4 text-right">{record.status === 'active' && <button type="button" onClick={() => setRecords(current => current.map(item => item.id === record.id ? { ...item, status: 'acknowledged' } : item))} className="text-xs font-semibold text-primary">确认告警</button>}</td></tr>)}</tbody></table></div></section>}
  </div>;
}

interface RuleDialogProps {
  editingRule: AlertRule;
  setEditingRule: React.Dispatch<React.SetStateAction<AlertRule | null>>;
  changeMetric: (metric: MonitorMetricKey) => void;
  saveRule: () => void;
  ruleError: string;
}

// 编辑一条告警规则。
function RuleDialog({ editingRule, setEditingRule, changeMetric, saveRule, ruleError }: RuleDialogProps) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b px-5 py-4"><h2 className="font-bold text-slate-900">{editingRule.id ? '编辑告警规则' : '新建告警规则'}</h2><button type="button" onClick={() => setEditingRule(null)} className="text-slate-400" aria-label="关闭"><X size={18} /></button></div><div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
    <label><span className="mb-1 block text-xs font-semibold text-slate-600">规则名称 *</span><input value={editingRule.name} onChange={event => setEditingRule({ ...editingRule, name: event.target.value })} className={inputClass} /></label>
    <label><span className="mb-1 block text-xs font-semibold text-slate-600">监控范围</span><select value={editingRule.scope} onChange={event => setEditingRule({ ...editingRule, scope: event.target.value })} className={inputClass}><option>全部机器人</option>{MONITOR_BOTS.map(bot => <option key={bot.id}>{bot.name}</option>)}</select></label>
    <label><span className="mb-1 block text-xs font-semibold text-slate-600">监控指标</span><select value={editingRule.metric} onChange={event => changeMetric(event.target.value as MonitorMetricKey)} className={inputClass}>{METRIC_OPTIONS.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}</select></label>
    <div><span className="mb-1 block text-xs font-semibold text-slate-600">触发条件</span><div className="grid grid-cols-[110px_minmax(0,1fr)_70px] gap-2"><select value={editingRule.comparator} onChange={event => setEditingRule({ ...editingRule, comparator: event.target.value as 'gt' | 'lt' })} className={inputClass}><option value="gt">大于</option><option value="lt">小于</option></select><input type="number" value={editingRule.threshold} onChange={event => setEditingRule({ ...editingRule, threshold: Number(event.target.value) })} className={inputClass} /><div className="rounded border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500">{metricMeta(editingRule.metric).unit}</div></div></div>
    <label><span className="mb-1 block text-xs font-semibold text-slate-600">持续时间</span><select value={editingRule.windowMinutes} onChange={event => setEditingRule({ ...editingRule, windowMinutes: Number(event.target.value) })} className={inputClass}><option value={5}>连续 5 分钟</option><option value={10}>连续 10 分钟</option><option value={15}>连续 15 分钟</option><option value={30}>连续 30 分钟</option></select></label>
    <label><span className="mb-1 block text-xs font-semibold text-slate-600">生效时间</span><select value={editingRule.schedule} onChange={event => setEditingRule({ ...editingRule, schedule: event.target.value as AlertRule['schedule'] })} className={inputClass}><option value="all_day">全天</option><option value="bot_working_hours">机器人工作时间</option></select></label>
    <label><span className="mb-1 block text-xs font-semibold text-slate-600">告警等级</span><select value={editingRule.severity} onChange={event => setEditingRule({ ...editingRule, severity: event.target.value as AlertRule['severity'] })} className={inputClass}><option value="critical">紧急</option><option value="warning">警告</option><option value="info">提醒</option></select></label>
    <label><span className="mb-1 block text-xs font-semibold text-slate-600">通知方式</span><select value={editingRule.channel} onChange={event => setEditingRule({ ...editingRule, channel: event.target.value as AlertRule['channel'] })} className={inputClass}><option value="email">邮件</option><option value="wechat">企业微信</option><option value="dingtalk">钉钉</option><option value="webhook">Webhook</option></select></label>
    <label className="md:col-span-2"><span className="mb-1 block text-xs font-semibold text-slate-600">接收人 / 地址 *</span><input value={editingRule.recipients} onChange={event => setEditingRule({ ...editingRule, recipients: event.target.value })} className={inputClass} placeholder="邮箱、群机器人或 Webhook 地址" /></label>
    {ruleError && <div className="md:col-span-2 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{ruleError}</div>}
    <div className="md:col-span-2 rounded bg-slate-50 px-3 py-2 text-xs text-slate-500">每分钟评估一次。比例指标在窗口内至少有 20 通已结束通话或 50 次工具调用时才判断；恢复正常后自动关闭。</div>
  </div><div className="flex justify-end gap-2 border-t px-5 py-4"><button type="button" onClick={() => setEditingRule(null)} className="rounded border border-slate-200 px-4 py-2 text-sm text-slate-600">取消</button><button type="button" onClick={saveRule} className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white">保存规则</button></div></div></div>;
}
