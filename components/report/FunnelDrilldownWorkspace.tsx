// 业务漏斗工作区：维护可统计事件、漏斗阶段，并按通话事件展示真实漏斗。
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, BarChart3, ChevronRight, Pencil, Plus, Settings2, Trash2, X } from 'lucide-react';
import {
  BusinessEventDefinition,
  BusinessEventCondition,
  BusinessEventSourceType,
  BusinessFunnelCall,
  BusinessFunnelDefinition,
  BusinessFunnelSourceData,
  CallDirectionFilter,
  TimeRange,
} from '../../types';
import {
  BUSINESS_EVENT_OPERATOR_LABELS,
  BUSINESS_EVENT_SOURCE_LABELS,
  buildBusinessFunnelReport,
} from './funnelMockData';
import { cx, EmptyTableState, formatDuration, formatRate, formatTime, StatusBadge } from './reportUi';

interface FunnelDrilldownWorkspaceProps {
  source: BusinessFunnelSourceData;
  timeRange: TimeRange;
  selectedBotIds: string[];
  callDirection: CallDirectionFilter;
  isLoading?: boolean;
  pageMode?: 'analysis' | 'funnel_config' | 'event_config';
}

type CallSelection = { stageId: string; mode: 'reached' | 'lost' };

const RANGE_DAYS: Record<TimeRange, number> = {
  today: 1,
  yesterday: 1,
  this_week: 7,
  last_week: 7,
  this_month: 30,
  last_month: 30,
  custom: 30,
};

const FORM_CONTROL_CLASS = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10';

const SOURCE_OBJECT_OPTIONS: Record<BusinessEventSourceType, string[]> = {
  platform: ['Topic：退款申请', 'Flow：退款申请', 'Topic：服务预约', 'Flow：预约服务'],
  tool_result: ['Tool：订单查询', 'Tool：提交退款申请', 'Tool：查询服务时段'],
  callback: ['回调：预约结果通知', '回调：退款结果通知'],
  variable: ['通话变量：member_verified', '通话变量：refund_amount'],
};

const STATUS_LABELS: Record<BusinessFunnelCall['status'], { label: string; tone: 'green' | 'blue' | 'amber' | 'red' }> = {
  completed: { label: '已完成', tone: 'green' },
  transferred: { label: '已转人工', tone: 'blue' },
  hangup: { label: '用户挂断', tone: 'amber' },
  failed: { label: '执行失败', tone: 'red' },
};

export default function FunnelDrilldownWorkspace({ source, timeRange, selectedBotIds, callDirection, isLoading = false, pageMode = 'analysis' }: FunnelDrilldownWorkspaceProps) {
  const [events, setEvents] = useState<BusinessEventDefinition[]>(source.events);
  const [funnels, setFunnels] = useState<BusinessFunnelDefinition[]>(source.funnels);
  const [selectedFunnelId, setSelectedFunnelId] = useState(source.funnels[0]?.id || '');
  const [versionId, setVersionId] = useState('all');
  const [callSelection, setCallSelection] = useState<CallSelection | null>(null);
  const [eventEditor, setEventEditor] = useState<BusinessEventDefinition | 'new' | null>(null);
  const [funnelEditor, setFunnelEditor] = useState<BusinessFunnelDefinition | 'new' | null>(null);

  const availableFunnels = useMemo(() => funnels.filter(funnel => (
    selectedBotIds.length === 0 || selectedBotIds.includes(funnel.botId)
  )), [funnels, selectedBotIds]);

  useEffect(() => {
    if (availableFunnels.length > 0 && !availableFunnels.some(funnel => funnel.id === selectedFunnelId)) {
      setSelectedFunnelId(availableFunnels[0].id);
      setCallSelection(null);
    }
  }, [availableFunnels, selectedFunnelId]);

  const selectedFunnel = funnels.find(funnel => funnel.id === selectedFunnelId) || availableFunnels[0];
  const dataSource = useMemo(() => ({ ...source, events, funnels }), [events, funnels, source]);
  const report = useMemo(() => selectedFunnel ? buildBusinessFunnelReport(dataSource, selectedFunnel, {
    botIds: selectedBotIds,
    callDirection,
    versionId,
  }, RANGE_DAYS[timeRange]) : null, [callDirection, dataSource, selectedBotIds, selectedFunnel, timeRange, versionId]);

  const selectedCallIds = useMemo(() => {
    if (!report || !callSelection) return [];
    return callSelection.mode === 'reached'
      ? report.reachedCallIdsByStage[callSelection.stageId] || []
      : report.lostCallIdsByStage[callSelection.stageId] || [];
  }, [callSelection, report]);
  const selectedCalls = useMemo(() => report?.calls.filter(call => selectedCallIds.includes(call.id)) || [], [report, selectedCallIds]);

  const saveEvent = (event: BusinessEventDefinition) => {
    setEvents(current => current.some(item => item.id === event.id)
      ? current.map(item => item.id === event.id ? event : item)
      : [...current, event]);
    setEventEditor(null);
  };

  const deleteEvent = (eventId: string) => {
    if (funnels.some(funnel => funnel.stages.some(stage => stage.eventId === eventId))) return;
    if (!window.confirm('确认删除该业务事件？')) return;
    setEvents(current => current.filter(event => event.id !== eventId));
  };

  const saveFunnel = (funnel: BusinessFunnelDefinition) => {
    setFunnels(current => current.some(item => item.id === funnel.id)
      ? current.map(item => item.id === funnel.id ? funnel : item)
      : [...current, funnel]);
    setSelectedFunnelId(funnel.id);
    setFunnelEditor(null);
    setCallSelection(null);
  };

  const toggleFunnel = (funnelId: string) => {
    setFunnels(current => current.map(funnel => funnel.id === funnelId ? { ...funnel, enabled: !funnel.enabled } : funnel));
  };

  const sectionTitle = pageMode === 'analysis' ? '业务漏斗' : pageMode === 'funnel_config' ? '漏斗列表' : '事件列表';

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-primary"><BarChart3 size={18} /></div>
          <h3 className="text-base font-bold text-slate-900">{sectionTitle}</h3>
        </div>
      </div>

      {isLoading ? <WorkspaceLoading /> : pageMode === 'event_config' ? (
        <BusinessEventTable events={events} funnels={funnels} onCreate={() => setEventEditor('new')} onEdit={setEventEditor} onDelete={deleteEvent} />
      ) : pageMode === 'funnel_config' ? (
        <FunnelDefinitionTable funnels={funnels} source={source} onCreate={() => setFunnelEditor('new')} onEdit={setFunnelEditor} onToggle={toggleFunnel} />
      ) : report && selectedFunnel ? (
        <>
          <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <select value={selectedFunnel.id} onChange={event => { setSelectedFunnelId(event.target.value); setCallSelection(null); }} className="min-w-52 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-primary">
                {availableFunnels.map(funnel => <option key={funnel.id} value={funnel.id}>{funnel.name}</option>)}
              </select>
              <select value={versionId} onChange={event => { setVersionId(event.target.value); setCallSelection(null); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary">
                <option value="all">全部版本</option>
                {source.versions.filter(version => version.botId === selectedFunnel.botId).map(version => <option key={version.id} value={version.id}>{version.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-8 px-6 py-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <FunnelChart report={report} selected={callSelection} onSelect={setCallSelection} />
            <StageSummary report={report} events={events} selected={callSelection} onSelect={setCallSelection} />
          </div>
          <CallEvidenceTable report={report} selection={callSelection} calls={selectedCalls} events={events} />
        </>
      ) : (
        <EmptyTableState title="暂无漏斗" desc="当前筛选条件下没有可用的业务漏斗。" />
      )}

      {eventEditor && <EventEditorModal initial={eventEditor === 'new' ? null : eventEditor} onClose={() => setEventEditor(null)} onSave={saveEvent} />}
      {funnelEditor && <FunnelEditorModal initial={funnelEditor === 'new' ? null : funnelEditor} bots={source.bots} versions={source.versions} events={events.filter(event => event.enabled)} onClose={() => setFunnelEditor(null)} onSave={saveFunnel} />}
    </div>
  );
}

function FunnelChart({ report, selected, onSelect }: { report: NonNullable<ReturnType<typeof buildBusinessFunnelReport>>; selected: CallSelection | null; onSelect: (selection: CallSelection) => void }) {
  const firstCount = report.stages[0]?.reachedCount || 1;
  return (
    <div className="min-w-0">
      <div className="mb-5 flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-900">转化漏斗</h4>
        <span className="text-sm font-semibold text-slate-500">累计转化 {formatRate(report.stages.at(-1)?.cumulativeConversionRate || 0)}</span>
      </div>
      <div className="space-y-2">
        {report.stages.map((stage, index) => {
          const width = Math.max(48, 100 * stage.reachedCount / firstCount);
          const isSelected = selected?.stageId === stage.id && selected.mode === 'reached';
          return (
            <div key={stage.id} className="grid grid-cols-[minmax(0,1fr)_132px] items-center gap-4">
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => onSelect({ stageId: stage.id, mode: 'reached' })}
                  className={cx('min-h-20 px-12 py-4 text-center text-white transition focus:outline-none focus:ring-2 focus:ring-primary/30', isSelected ? 'bg-blue-700' : index === 0 ? 'bg-blue-500 hover:bg-blue-600' : index === report.stages.length - 1 ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700')}
                  style={{ width: `${width}%`, clipPath: 'polygon(3% 0, 97% 0, 92% 100%, 8% 100%)' }}
                >
                  <span className="block truncate text-sm font-bold">{stage.name}</span>
                  <span className="mt-1 block text-2xl font-black">{stage.reachedCount.toLocaleString()}</span>
                </button>
              </div>
              <div className="text-right">
                {index === 0 ? <span className="text-xs font-semibold text-slate-500">进入漏斗</span> : <><div className="text-sm font-bold text-slate-800">{formatRate(stage.previousConversionRate)}</div><div className="text-xs text-slate-500">上一步转化</div></>}
                {stage.lossCount > 0 && (
                  <button type="button" onClick={() => onSelect({ stageId: stage.id, mode: 'lost' })} className={cx('mt-2 rounded-md px-2 py-1 text-xs font-semibold transition', selected?.stageId === stage.id && selected.mode === 'lost' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700')}>流失 {stage.lossCount}</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StageSummary({ report, events, selected, onSelect }: { report: ReturnType<typeof buildBusinessFunnelReport>; events: BusinessEventDefinition[]; selected: CallSelection | null; onSelect: (selection: CallSelection) => void }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <h4 className="mb-3 text-sm font-bold text-slate-900">阶段明细</h4>
      <div className="space-y-2">
        {report.stages.map((stage, index) => {
          const event = events.find(item => item.id === stage.eventId);
          return (
            <button key={stage.id} type="button" onClick={() => onSelect({ stageId: stage.id, mode: 'reached' })} className={cx('w-full rounded-lg border bg-white p-3 text-left transition hover:border-blue-200', selected?.stageId === stage.id ? 'border-primary ring-1 ring-primary/10' : 'border-slate-200')}>
              <div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-slate-800">{index + 1}. {stage.name}</span><ChevronRight size={15} className="text-slate-400" /></div>
              <div className="mt-2 truncate text-xs text-slate-500" title={event?.sourceObject}>{event?.sourceObject}</div>
              <div className="mt-2 flex items-center justify-between text-xs"><span className="font-semibold text-slate-500">累计 {formatRate(stage.cumulativeConversionRate)}</span><span className="font-bold text-slate-700">{stage.reachedCount.toLocaleString()} 通</span></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CallEvidenceTable({ report, selection, calls, events }: { report: ReturnType<typeof buildBusinessFunnelReport>; selection: CallSelection | null; calls: BusinessFunnelCall[]; events: BusinessEventDefinition[] }) {
  if (!selection) return <div className="border-t border-slate-100 px-6 py-5 text-sm text-slate-500">点击漏斗阶段或流失数量查看通话。</div>;
  const stage = report.stages.find(item => item.id === selection.stageId);
  const event = events.find(item => item.id === stage?.eventId);
  const reasons = selection.mode === 'lost' ? report.lossReasonsByStage[selection.stageId] || [] : [];
  return (
    <div className="border-t border-slate-100">
      <div className="flex flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div><h4 className="text-sm font-bold text-slate-900">{stage?.name} · {selection.mode === 'lost' ? '流失通话' : '到达通话'}</h4><p className="mt-1 text-xs text-slate-500">{event?.name}</p></div>
        {reasons.length > 0 && <div className="flex flex-wrap gap-2">{reasons.map(reason => <StatusBadge key={reason.code} tone="amber">{reason.name} {reason.count}</StatusBadge>)}</div>}
      </div>
      {calls.length === 0 ? <EmptyTableState desc="没有符合条件的通话记录。" /> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-6 py-3">Call ID</th><th className="px-6 py-3">通话时间</th><th className="px-6 py-3">客户号码</th><th className="px-6 py-3">机器人 / 版本</th><th className="px-6 py-3">方向</th><th className="px-6 py-3">时长</th><th className="px-6 py-3">状态</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{calls.slice(0, 10).map(call => { const status = STATUS_LABELS[call.status]; return <tr key={call.id} className="hover:bg-slate-50"><td className="px-6 py-4 font-semibold text-primary">{call.id}</td><td className="px-6 py-4 text-slate-600">{formatTime(call.startedAt)}</td><td className="px-6 py-4 text-slate-600">{call.customerPhone}</td><td className="px-6 py-4"><div className="font-semibold text-slate-800">{call.botName}</div><div className="text-xs text-slate-500">{call.versionName}</div></td><td className="px-6 py-4 text-slate-600">{call.direction === 'inbound' ? '呼入' : '外呼'}</td><td className="px-6 py-4 text-slate-600">{formatDuration(call.durationSeconds)}</td><td className="px-6 py-4"><StatusBadge tone={status.tone}>{status.label}</StatusBadge></td></tr>; })}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BusinessEventTable({ events, funnels, onCreate, onEdit, onDelete }: { events: BusinessEventDefinition[]; funnels: BusinessFunnelDefinition[]; onCreate: () => void; onEdit: (event: BusinessEventDefinition) => void; onDelete: (eventId: string) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><h4 className="text-sm font-bold text-slate-900">事件定义</h4><button type="button" onClick={onCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={15} />新增事件</button></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-6 py-3">事件名称</th><th className="px-6 py-3">事件编码</th><th className="px-6 py-3">来源</th><th className="px-6 py-3">来源对象</th><th className="px-6 py-3">触发条件</th><th className="px-6 py-3">状态</th><th className="px-6 py-3 text-right">操作</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{events.map(event => { const used = funnels.some(funnel => funnel.stages.some(stage => stage.eventId === event.id)); return <tr key={event.id} className="hover:bg-slate-50"><td className="px-6 py-4 font-bold text-slate-900">{event.name}</td><td className="px-6 py-4 font-mono text-xs text-slate-600">{event.code}</td><td className="px-6 py-4"><StatusBadge tone="blue">{BUSINESS_EVENT_SOURCE_LABELS[event.sourceType]}</StatusBadge></td><td className="px-6 py-4 text-slate-600">{event.sourceObject}</td><td className="px-6 py-4 text-slate-600">{event.condition ? `${event.condition.field} ${BUSINESS_EVENT_OPERATOR_LABELS[event.condition.operator]} ${event.condition.value}` : '-'}</td><td className="px-6 py-4"><StatusBadge tone={event.enabled ? 'green' : 'slate'}>{event.enabled ? '启用' : '停用'}</StatusBadge></td><td className="px-6 py-4"><div className="flex justify-end gap-1"><IconButton label="编辑" onClick={() => onEdit(event)}><Pencil size={15} /></IconButton><IconButton label={used ? '事件已被漏斗使用' : '删除'} disabled={used} onClick={() => onDelete(event.id)}><Trash2 size={15} /></IconButton></div></td></tr>; })}</tbody>
      </table></div>
    </div>
  );
}

function FunnelDefinitionTable({ funnels, source, onCreate, onEdit, onToggle }: { funnels: BusinessFunnelDefinition[]; source: BusinessFunnelSourceData; onCreate: () => void; onEdit: (funnel: BusinessFunnelDefinition) => void; onToggle: (funnelId: string) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><h4 className="text-sm font-bold text-slate-900">漏斗定义</h4><button type="button" onClick={onCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={15} />新建漏斗</button></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[880px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-6 py-3">漏斗名称</th><th className="px-6 py-3">机器人</th><th className="px-6 py-3">版本</th><th className="px-6 py-3">阶段数</th><th className="px-6 py-3">漏斗阶段</th><th className="px-6 py-3">状态</th><th className="px-6 py-3 text-right">操作</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{funnels.map(funnel => { const bot = source.bots.find(item => item.id === funnel.botId); const version = source.versions.find(item => item.id === funnel.versionId); return <tr key={funnel.id} className="hover:bg-slate-50"><td className="px-6 py-4 font-bold text-slate-900">{funnel.name}</td><td className="px-6 py-4 text-slate-600">{bot?.name}</td><td className="px-6 py-4 text-slate-600">{version?.name}</td><td className="px-6 py-4 font-semibold text-slate-700">{funnel.stages.length}</td><td className="px-6 py-4"><div className="flex max-w-md flex-wrap items-center gap-1.5">{funnel.stages.map((stage, index) => <React.Fragment key={stage.id}><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{stage.name}</span>{index < funnel.stages.length - 1 && <ChevronRight size={13} className="text-slate-300" />}</React.Fragment>)}</div></td><td className="px-6 py-4"><button type="button" onClick={() => onToggle(funnel.id)}><StatusBadge tone={funnel.enabled ? 'green' : 'slate'}>{funnel.enabled ? '启用' : '停用'}</StatusBadge></button></td><td className="px-6 py-4"><div className="flex justify-end"><button type="button" onClick={() => onEdit(funnel)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Settings2 size={14} />配置</button></div></td></tr>; })}</tbody>
      </table></div>
    </div>
  );
}

function EventEditorModal({ initial, onClose, onSave }: { initial: BusinessEventDefinition | null; onClose: () => void; onSave: (event: BusinessEventDefinition) => void }) {
  const [form, setForm] = useState<BusinessEventDefinition>(initial || { id: `event_${Date.now()}`, code: '', name: '', sourceType: 'tool_result', sourceObject: SOURCE_OBJECT_OPTIONS.tool_result[0], condition: { field: '', operator: 'equals', value: '' }, enabled: true });
  const requiresCondition = form.sourceType !== 'platform';
  const canSave = form.name.trim() && form.code.trim() && form.sourceObject.trim() && (!requiresCondition || (form.condition?.field.trim() && form.condition.value.trim()));
  return <Modal title={initial ? '编辑业务事件' : '新增业务事件'} onClose={onClose} onSave={() => canSave && onSave({ ...form, condition: requiresCondition ? form.condition : undefined })} saveDisabled={!canSave}>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="事件名称"><input value={form.name} onChange={e => setForm(current => ({ ...current, name: e.target.value }))} className={FORM_CONTROL_CLASS} /></Field><Field label="事件编码"><input value={form.code} onChange={e => setForm(current => ({ ...current, code: e.target.value }))} className={FORM_CONTROL_CLASS} /></Field><Field label="来源类型"><select value={form.sourceType} onChange={e => { const sourceType = e.target.value as BusinessEventSourceType; setForm(current => ({ ...current, sourceType, sourceObject: SOURCE_OBJECT_OPTIONS[sourceType][0] })); }} className={FORM_CONTROL_CLASS}>{Object.entries(BUSINESS_EVENT_SOURCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="来源对象"><select value={form.sourceObject} onChange={e => setForm(current => ({ ...current, sourceObject: e.target.value }))} className={FORM_CONTROL_CLASS}>{SOURCE_OBJECT_OPTIONS[form.sourceType].map(option => <option key={option} value={option}>{option}</option>)}</select></Field></div>
    {requiresCondition && <div className="mt-4 grid grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] gap-3"><Field label="字段"><input value={form.condition?.field || ''} onChange={e => setForm(current => ({ ...current, condition: { ...(current.condition || { operator: 'equals', value: '' }), field: e.target.value } }))} className={FORM_CONTROL_CLASS} /></Field><Field label="条件"><select value={form.condition?.operator || 'equals'} onChange={e => setForm(current => ({ ...current, condition: { ...(current.condition || { field: '', value: '' }), operator: e.target.value as BusinessEventCondition['operator'] } }))} className={FORM_CONTROL_CLASS}>{Object.entries(BUSINESS_EVENT_OPERATOR_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="值"><input value={form.condition?.value || ''} onChange={e => setForm(current => ({ ...current, condition: { ...(current.condition || { field: '', operator: 'equals' }), value: e.target.value } }))} className={FORM_CONTROL_CLASS} /></Field></div>}
    <label className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.enabled} onChange={e => setForm(current => ({ ...current, enabled: e.target.checked }))} />启用</label>
  </Modal>;
}

function FunnelEditorModal({ initial, bots, versions, events, onClose, onSave }: { initial: BusinessFunnelDefinition | null; bots: BusinessFunnelSourceData['bots']; versions: BusinessFunnelSourceData['versions']; events: BusinessEventDefinition[]; onClose: () => void; onSave: (funnel: BusinessFunnelDefinition) => void }) {
  const [form, setForm] = useState<BusinessFunnelDefinition>(initial ? structuredClone(initial) : { id: `funnel_${Date.now()}`, name: '', botId: bots[0]?.id || '', versionId: versions.find(version => version.botId === bots[0]?.id)?.id || '', enabled: true, stages: [] });
  const botVersions = versions.filter(version => version.botId === form.botId);
  const addStage = () => setForm(current => ({ ...current, stages: [...current.stages, { id: `stage_${Date.now()}`, name: '', eventId: events[0]?.id || '' }] }));
  const moveStage = (index: number, direction: -1 | 1) => setForm(current => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= current.stages.length) return current;
    const stages = [...current.stages];
    [stages[index], stages[targetIndex]] = [stages[targetIndex], stages[index]];
    return { ...current, stages };
  });
  const canSave = form.name.trim() && form.botId && form.versionId && form.stages.length >= 2 && form.stages.every(stage => stage.name.trim() && stage.eventId);
  return <Modal title={initial ? '配置漏斗' : '新建漏斗'} onClose={onClose} onSave={() => canSave && onSave(form)} saveDisabled={!canSave} wide>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><Field label="漏斗名称"><input value={form.name} onChange={e => setForm(current => ({ ...current, name: e.target.value }))} className={FORM_CONTROL_CLASS} /></Field><Field label="机器人"><select value={form.botId} onChange={e => { const botId = e.target.value; setForm(current => ({ ...current, botId, versionId: versions.find(version => version.botId === botId)?.id || '' })); }} className={FORM_CONTROL_CLASS}>{bots.map(bot => <option key={bot.id} value={bot.id}>{bot.name}</option>)}</select></Field><Field label="版本"><select value={form.versionId} onChange={e => setForm(current => ({ ...current, versionId: e.target.value }))} className={FORM_CONTROL_CLASS}>{botVersions.map(version => <option key={version.id} value={version.id}>{version.name}</option>)}</select></Field></div>
    <div className="mt-6 flex items-center justify-between"><h4 className="text-sm font-bold text-slate-900">漏斗阶段</h4><button type="button" onClick={addStage} className="inline-flex items-center gap-1 text-sm font-semibold text-primary"><Plus size={15} />添加阶段</button></div>
    <div className="mt-3 space-y-3">{form.stages.map((stage, index) => <div key={stage.id} className="grid grid-cols-[32px_minmax(0,1fr)_minmax(0,1fr)_104px] items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"><span className="mb-2 text-center text-sm font-bold text-slate-500">{index + 1}</span><Field label="阶段名称"><input value={stage.name} onChange={e => setForm(current => ({ ...current, stages: current.stages.map(item => item.id === stage.id ? { ...item, name: e.target.value } : item) }))} className={FORM_CONTROL_CLASS} /></Field><Field label="统计事件"><select value={stage.eventId} onChange={e => setForm(current => ({ ...current, stages: current.stages.map(item => item.id === stage.id ? { ...item, eventId: e.target.value } : item) }))} className={FORM_CONTROL_CLASS}>{events.map(event => <option key={event.id} value={event.id}>{event.name}</option>)}</select></Field><div className="mb-0.5 flex justify-end"><IconButton label="上移" disabled={index === 0} onClick={() => moveStage(index, -1)}><ArrowUp size={15} /></IconButton><IconButton label="下移" disabled={index === form.stages.length - 1} onClick={() => moveStage(index, 1)}><ArrowDown size={15} /></IconButton><IconButton label="删除阶段" onClick={() => setForm(current => ({ ...current, stages: current.stages.filter(item => item.id !== stage.id) }))}><Trash2 size={15} /></IconButton></div></div>)}</div>
  </Modal>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">{label}</span>{children}</label>; }

function IconButton({ label, onClick, disabled = false, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) { return <button type="button" title={label} aria-label={label} disabled={disabled} onClick={onClick} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30">{children}</button>; }

function Modal({ title, children, onClose, onSave, saveDisabled = false, wide = false }: { title: string; children: React.ReactNode; onClose: () => void; onSave: () => void; saveDisabled?: boolean; wide?: boolean }) {
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/30 p-5" role="dialog" aria-modal="true"><div className={cx('max-h-[86vh] w-full overflow-auto rounded-xl bg-white shadow-2xl', wide ? 'max-w-4xl' : 'max-w-2xl')}><div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4"><h3 className="font-bold text-slate-900">{title}</h3><IconButton label="关闭" onClick={onClose}><X size={18} /></IconButton></div><div className="p-6">{children}</div><div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">取消</button><button type="button" disabled={saveDisabled} onClick={onSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40">保存</button></div></div></div>;
}

function WorkspaceLoading() { return <div className="space-y-3 p-6" aria-busy="true">{Array.from({ length: 4 }, (_, index) => <div key={index} className="mx-auto h-20 animate-pulse rounded-lg bg-slate-100" style={{ width: `${100 - index * 12}%` }} />)}</div>; }
