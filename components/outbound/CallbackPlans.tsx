// 回呼计划运营页面，集中展示来源联系单、回呼配置和任务执行结果。
import React, { useMemo, useState } from 'react';
import { ArrowLeft, CalendarClock, ChevronLeft, ChevronRight, Download, Eye, Search, Square, X } from 'lucide-react';

type PlanStatus = 'scheduled' | 'running' | 'completed' | 'terminated';
type StatusGroup = 'all' | 'unfinished' | 'finished';

interface PlanEvent { id: string; time: string; actor: string; action: string; detail: string }
interface CallbackPlan {
  id: string; plannedAt: string; createdAt: string; phone: string;
  botName: string; botVersion: string; scriptName: string; sourceTask: string; sourceTaskId: string;
  sourceContactList: string; sourceContactListId: string; sourceContactId: string;
  status: PlanStatus; lastResult: string; sourceCallId: string; executionCallId?: string;
  executionStartedAt?: string; executionEndedAt?: string; callDuration?: string;
  callbackContext: string; callbackSummary?: string;
  contactSnapshot: Record<string, string>; events: PlanEvent[];
}

const STATUS_LABEL: Record<PlanStatus, string> = { scheduled: '待执行', running: '执行中', completed: '已完成', terminated: '已终止' };
const STATUS_CLASS: Record<PlanStatus, string> = { scheduled: 'bg-blue-50 text-blue-600', running: 'bg-amber-50 text-amber-600', completed: 'bg-emerald-50 text-emerald-600', terminated: 'bg-slate-100 text-slate-500' };
const GROUP_STATUSES: Record<Exclude<StatusGroup, 'all'>, PlanStatus[]> = { unfinished: ['scheduled', 'running'], finished: ['completed', 'terminated'] };

const INITIAL_PLANS: CallbackPlan[] = [
  { id: 'CB202608250018', plannedAt: '2026-08-25 16:30', createdAt: '2026-08-25 09:38', phone: '13855676219', botName: '续费关怀机器人', botVersion: 'V12', scriptName: '会员续费挽留话术', sourceTask: '8月会员续费', sourceTaskId: 'TASK20260801', sourceContactList: '黄金会员待续费名单', sourceContactListId: 'LIST_RENEW_GOLD', sourceContactId: 'CONTACT202608010219', status: 'scheduled', lastResult: '等待计划时间执行', sourceCallId: 'CALL202608250931', callbackContext: '客户正在开会，约定 16:30 回电。继续说明年费优惠并确认续费意向。', contactSnapshot: { 客户等级: '黄金会员', 当前套餐: '年度会员', 到期日期: '2026-09-02', 所属城市: '上海' }, events: [{ id: 'E1', time: '2026-08-25 09:38', actor: '续费关怀机器人', action: '创建回呼任务', detail: '客户确认 16:30 方便接听，等待执行' }] },
  { id: 'CB202608250017', plannedAt: '2026-08-25 15:10', createdAt: '2026-08-25 10:02', phone: '18624683098', botName: '售后跟进机器人', botVersion: 'V8', scriptName: '维修进度跟进话术', sourceTask: '售后满意度回访', sourceTaskId: 'TASK20260728', sourceContactList: '已完成工单联系单', sourceContactListId: 'LIST_AFTERSALE_DONE', sourceContactId: 'CONTACT202607280086', status: 'running', lastResult: '已接通，通话 01:26', sourceCallId: 'CALL202608251002', executionCallId: 'CALL202608251510', executionStartedAt: '2026-08-25 15:10', callDuration: '01:26', callbackContext: '客户希望技术人员确认上门时间后回电。', contactSnapshot: { 工单编号: 'WO-92731', 产品型号: 'K3', 城市: '杭州' }, events: [{ id: 'E4', time: '2026-08-25 15:11', actor: '系统', action: '客户已接听', detail: '正在由售后跟进机器人执行回呼' }, { id: 'E3', time: '2026-08-25 15:10', actor: '系统', action: '开始呼叫', detail: '执行通话 CALL202608251510' }, { id: 'E2', time: '2026-08-25 15:09', actor: '系统', action: '进入执行队列', detail: '号码和可呼叫时段校验通过' }, { id: 'E1', time: '2026-08-25 10:02', actor: '售后跟进机器人', action: '创建回呼任务', detail: '客户确认稍后回电' }] },
  { id: 'CB202608240036', plannedAt: '2026-08-24 19:00', createdAt: '2026-08-24 13:16', phone: '15988761172', botName: '线索跟进机器人', botVersion: 'V5', scriptName: '课程咨询跟进话术', sourceTask: '暑期课程线索', sourceTaskId: 'TASK20260810', sourceContactList: '课程咨询线索', sourceContactListId: 'LIST_COURSE_LEADS', sourceContactId: 'CONTACT202608100137', status: 'completed', lastResult: '已接通 · 确认周六到店', sourceCallId: 'CALL202608241314', executionCallId: 'CALL202608241900', executionStartedAt: '2026-08-24 19:00', executionEndedAt: '2026-08-24 19:08', callDuration: '07:42', callbackContext: '客户需要和家人确认时间，约定晚上回电。', callbackSummary: '客户确认本周六 10:00 到店体验，已发送门店地址短信。', contactSnapshot: { 意向课程: '少儿编程', 孩子年龄: '9 岁', 城市: '南京' }, events: [{ id: 'E4', time: '2026-08-24 19:08', actor: '系统', action: '执行完成', detail: '通话 07:42，客户确认周六到店' }, { id: 'E3', time: '2026-08-24 19:00', actor: '系统', action: '客户已接听', detail: '开始执行回呼' }, { id: 'E2', time: '2026-08-24 18:59', actor: '系统', action: '进入执行队列', detail: '执行前校验通过' }, { id: 'E1', time: '2026-08-24 13:16', actor: '线索跟进机器人', action: '创建回呼任务', detail: '客户确认 19:00 回电' }] },
  { id: 'CB202608240028', plannedAt: '2026-08-24 17:30', createdAt: '2026-08-24 09:12', phone: '13368158041', botName: '续费关怀机器人', botVersion: 'V12', scriptName: '会员续费挽留话术', sourceTask: '8月会员续费', sourceTaskId: 'TASK20260801', sourceContactList: '全部待续费客户', sourceContactListId: 'LIST_RENEW_ALL', sourceContactId: 'CONTACT202608010174', status: 'completed', lastResult: '号码暂时无法接通', sourceCallId: 'CALL202608240910', executionCallId: 'CALL202608241730', executionStartedAt: '2026-08-24 17:30', executionEndedAt: '2026-08-24 17:31', callDuration: '00:00', callbackContext: '客户要求下班后说明续费权益。', contactSnapshot: { 客户等级: '白银会员', 当前套餐: '季度会员' }, events: [{ id: 'E3', time: '2026-08-24 17:31', actor: '系统', action: '执行结束', detail: '线路返回：暂时无法接通' }, { id: 'E2', time: '2026-08-24 17:30', actor: '系统', action: '开始呼叫', detail: '执行通话 CALL202608241730' }, { id: 'E1', time: '2026-08-24 09:12', actor: '续费关怀机器人', action: '创建回呼任务', detail: '客户确认下班后联系' }] },
];

const nowText = () => new Date().toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-');

// 将执行动作归并为客户可理解的计划状态，用于日志展示。
const getEventStatus = (event: PlanEvent): PlanStatus => {
  if (event.action.includes('终止')) return 'terminated';
  if (event.action.includes('完成') || event.action.includes('结束')) return 'completed';
  if (event.action.includes('呼叫') || event.action.includes('接听') || event.action.includes('队列')) return 'running';
  return 'scheduled';
};

export default function CallbackPlans({ onOpenCallRecord }: { onOpenCallRecord?: (callId: string) => void }) {
  const [plans, setPlans] = useState<CallbackPlan[]>(INITIAL_PLANS);
  const [group, setGroup] = useState<StatusGroup>('all');
  const [keyword, setKeyword] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [status, setStatus] = useState<'all' | PlanStatus>('all');
  const [bot, setBot] = useState('all');
  const [task, setTask] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [stopIds, setStopIds] = useState<string[]>([]);
  const [notice, setNotice] = useState('');

  const bots = Array.from(new Set(plans.map((item) => item.botName)));
  const tasks = Array.from(new Set(plans.map((item) => item.sourceTask)));
  const filtered = useMemo(() => plans.filter((item) => {
    const text = `${item.id} ${item.phone} ${item.sourceTask} ${item.lastResult}`.toLowerCase();
    return (!keyword || text.includes(keyword.toLowerCase()))
      && (group === 'all' || GROUP_STATUSES[group].includes(item.status))
      && (status === 'all' || item.status === status)
      && (bot === 'all' || item.botName === bot)
      && (task === 'all' || item.sourceTask === task)
      && (!dateFrom || item.plannedAt.slice(0, 10) >= dateFrom)
      && (!dateTo || item.plannedAt.slice(0, 10) <= dateTo);
  }).sort((a, b) => b.plannedAt.localeCompare(a.plannedAt)), [plans, keyword, group, status, bot, task, dateFrom, dateTo]);

  const selectedPlans = plans.filter((item) => selected.has(item.id));
  const stoppableSelected = selectedPlans.filter((item) => ['scheduled', 'running'].includes(item.status));
  const detail = plans.find((item) => item.id === detailId);
  const updatePlan = (id: string, changes: Partial<CallbackPlan>, action: string, detailText: string) => setPlans((current) => current.map((item) => item.id === id ? { ...item, ...changes, events: [{ id: `E${Date.now()}`, time: nowText(), actor: 'Admin User', action, detail: detailText }, ...item.events] } : item));
  const applyStop = () => { stopIds.forEach((id) => updatePlan(id, { status: 'terminated', lastResult: '管理员主动终止' }, '人工终止计划', '管理员主动终止')); setStopIds([]); setSelected(new Set()); setNotice('计划已终止并保留完整记录'); };
  const exportRows = () => { const rows = selectedPlans.length ? selectedPlans : filtered; const csv = ['计划编号,计划时间,客户号码,机器人,版本,话术,来源任务,状态,最近结果,执行通话', ...rows.map((item) => [item.id, item.plannedAt, item.phone, item.botName, item.botVersion, item.scriptName, item.sourceTask, STATUS_LABEL[item.status], item.lastResult, item.executionCallId || ''].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))].join('\n'); const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = '回呼计划.csv'; link.click(); URL.revokeObjectURL(url); setNotice(`已导出 ${rows.length} 条记录`); };

  if (detail) return <PlanDetail plan={detail} onBack={() => setDetailId(null)} onStop={() => setStopIds([detail.id])} onOpenCallRecord={onOpenCallRecord} />;

  const groupCount = (value: StatusGroup) => value === 'all' ? plans.length : plans.filter((item) => GROUP_STATUSES[value].includes(item.status)).length;
  return <div className="mx-auto w-full max-w-[1500px] space-y-4 px-8 py-6">
    <div className="flex items-start justify-between"><div><h1 className="flex items-center text-xl font-bold text-slate-900"><CalendarClock size={22} className="mr-2 text-primary" />回呼计划</h1><p className="mt-1 text-sm text-slate-500">从原通话承诺、计划执行到回呼结果，完整追踪每一次客户联系。</p></div><button onClick={exportRows} className="flex h-9 items-center rounded-lg border border-slate-200 px-4 text-xs font-medium text-slate-600"><Download size={14} className="mr-1" />导出{selectedPlans.length ? `已选 ${selectedPlans.length} 条` : '筛选结果'}</button></div>
    <div className="flex gap-1 border-b border-slate-200">{([['all', '全部'], ['unfinished', '未结束'], ['finished', '已结束']] as Array<[StatusGroup, string]>).map(([value, label]) => <button key={value} onClick={() => setGroup(value)} className={`border-b-2 px-4 py-2.5 text-xs font-semibold ${group === value ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>{label} {groupCount(value)}</button>)}</div>
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4"><div className="relative w-56"><Search size={14} className="absolute left-3 top-2.5 text-slate-400" /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="号码 / 计划编号 / 来源任务" className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-primary" /></div><input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-xs" /><span className="text-xs text-slate-400">至</span><input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-xs" /><select value={status} onChange={(event) => setStatus(event.target.value as 'all' | PlanStatus)} className="h-9 rounded-lg border border-slate-200 px-2 text-xs"><option value="all">全部状态</option>{Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select value={bot} onChange={(event) => setBot(event.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-xs"><option value="all">全部机器人</option>{bots.map((item) => <option key={item}>{item}</option>)}</select><select value={task} onChange={(event) => setTask(event.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-xs"><option value="all">全部来源任务</option>{tasks.map((item) => <option key={item}>{item}</option>)}</select></div>
      {selected.size > 0 && <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50/50 px-4 py-2.5 text-xs"><span>已选 {selected.size} 条，可终止 {stoppableSelected.length} 条</span><div className="flex gap-2"><button disabled={!stoppableSelected.length} onClick={() => setStopIds(stoppableSelected.map((item) => item.id))} className="rounded border border-red-100 bg-white px-3 py-1.5 text-red-500 disabled:opacity-40">批量终止</button><button onClick={() => setSelected(new Set())} className="p-1.5 text-slate-400"><X size={14} /></button></div></div>}
      <div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="w-10 px-4 py-3"><input type="checkbox" checked={filtered.length > 0 && filtered.every((item) => selected.has(item.id))} onChange={(event) => setSelected(event.target.checked ? new Set(filtered.map((item) => item.id)) : new Set())} /></th><th className="px-3 py-3">计划编号</th><th className="px-3 py-3">计划时间</th><th className="px-3 py-3">客户号码</th><th className="px-3 py-3">机器人</th><th className="px-3 py-3">来源外呼任务</th><th className="px-3 py-3">状态</th><th className="px-3 py-3 text-right">操作</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((item) => <tr key={item.id} className="hover:bg-slate-50/60"><td className="px-4 py-3"><input type="checkbox" checked={selected.has(item.id)} onChange={(event) => setSelected((current) => { const next = new Set(current); event.target.checked ? next.add(item.id) : next.delete(item.id); return next; })} /></td><td className="px-3 py-3 font-mono text-[11px] text-slate-600">{item.id}</td><td className="px-3 py-3 font-semibold text-slate-700">{item.plannedAt}</td><td className="px-3 py-3 text-slate-700">{item.phone}</td><td className="px-3 py-3 text-slate-700">{item.botName}</td><td className="px-3 py-3 text-slate-600">{item.sourceTask}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-medium ${STATUS_CLASS[item.status]}`}>{STATUS_LABEL[item.status]}</span></td><td className="px-3 py-3"><div className="flex justify-end gap-3"><button onClick={() => setDetailId(item.id)} className="flex items-center text-slate-500 hover:text-primary"><Eye size={13} className="mr-1" />查看详情</button>{['scheduled', 'running'].includes(item.status) && <button onClick={() => setStopIds([item.id])} className="flex items-center text-red-500"><Square size={12} className="mr-1" />终止</button>}</div></td></tr>)}</tbody></table></div>
      {filtered.length === 0 && <div className="py-16 text-center text-sm text-slate-400">暂无匹配的回呼计划</div>}<div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500"><span>共 {filtered.length} 条，每页 10 条</span><div className="flex items-center gap-2"><button className="rounded border border-slate-200 p-1.5 text-slate-300"><ChevronLeft size={14} /></button><span className="rounded bg-primary px-2.5 py-1 text-white">1</span><button className="rounded border border-slate-200 p-1.5 text-slate-300"><ChevronRight size={14} /></button></div></div>
    </section>
    {notice && <div className="fixed bottom-6 right-6 rounded-lg bg-slate-800 px-4 py-2 text-xs text-white shadow-lg">{notice}</div>}
    {stopIds.length > 0 && <StopDialog count={stopIds.length} onCancel={() => setStopIds([])} onConfirm={applyStop} />}
  </div>;
}

function PlanDetail({ plan, onBack, onStop, onOpenCallRecord }: { plan: CallbackPlan; onBack: () => void; onStop: () => void; onOpenCallRecord?: (callId: string) => void }) {
  const active = ['scheduled', 'running'].includes(plan.status);
  const basicRows: DetailRow[] = [
    { label: '计划编号', value: plan.id, mono: true },
    { label: '手机号', value: plan.phone },
    { label: '执行时间', value: plan.plannedAt },
    { label: '状态', value: <span className={`rounded-full px-2 py-1 text-[10px] ${STATUS_CLASS[plan.status]}`}>{STATUS_LABEL[plan.status]}</span> },
    { label: '来源外呼任务', value: plan.sourceTask },
    { label: '创建时间', value: plan.createdAt },
    { label: '来源联系单名称', value: plan.sourceContactList },
  ];
  const contactRows: DetailRow[] = [
    { label: '联系单记录编号', value: plan.sourceContactId, mono: true },
    { label: '客户号码', value: plan.phone },
    ...Object.entries(plan.contactSnapshot).map(([label, value]) => ({ label, value })),
  ];
  const executionRows: DetailRow[] = [
    { label: '执行机器人', value: plan.botName },
    { label: '实际开始时间', value: plan.executionStartedAt || '尚未开始' },
    { label: '实际结束时间', value: plan.executionEndedAt || '—' },
    { label: '通话时长', value: plan.callDuration || '—' },
    { label: '执行结果', value: plan.lastResult },
    { label: 'Call ID', value: plan.executionCallId ? <button onClick={() => onOpenCallRecord?.(plan.executionCallId as string)} className="font-mono text-primary hover:underline">{plan.executionCallId}</button> : '尚未生成' },
  ];
  return <div className="mx-auto w-full max-w-6xl space-y-5 px-8 py-6"><button onClick={onBack} className="flex items-center text-sm text-slate-500"><ArrowLeft size={16} className="mr-1" />返回回呼计划</button><div className="flex items-start justify-between"><div><div className="flex items-center gap-3"><h1 className="text-xl font-bold text-slate-900">回呼计划详情</h1><span className={`rounded-full px-2.5 py-1 text-xs ${STATUS_CLASS[plan.status]}`}>{STATUS_LABEL[plan.status]}</span></div><p className="mt-1 font-mono text-xs text-slate-400">{plan.id}</p></div>{active && <button onClick={onStop} className="h-9 rounded-lg border border-red-100 px-4 text-xs text-red-500">终止计划</button>}</div>
    <DetailSection title="基本信息"><DetailTable rows={basicRows} /></DetailSection>
    <DetailSection title="联系单详情"><DetailTable rows={contactRows} /></DetailSection>
    <DetailSection title="回呼上下文"><p className="px-5 py-4 text-sm leading-6 text-slate-600">{plan.callbackContext}</p></DetailSection>
    <DetailSection title="执行情况"><DetailTable rows={executionRows} />{plan.callbackSummary && <div className="border-t border-slate-100 px-4 py-4"><div className="mb-2 text-xs font-medium text-slate-500">回呼通话小结</div><p className="text-sm leading-6 text-slate-600">{plan.callbackSummary}</p></div>}</DetailSection>
    <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-sm font-bold text-slate-800">任务执行记录</h2><div className="mt-4 overflow-x-auto rounded-lg border border-slate-100"><div className="min-w-[720px]"><div className="grid grid-cols-[160px_150px_110px_1fr] gap-3 bg-slate-50 px-4 py-2.5 text-[10px] font-semibold text-slate-500"><span>时间</span><span>操作主体</span><span>状态</span><span>结果</span></div><div className="divide-y divide-slate-100">{plan.events.map((item) => { const eventStatus = getEventStatus(item); return <div key={item.id} className="grid grid-cols-[160px_150px_110px_1fr] items-center gap-3 px-4 py-3 text-xs"><span className="text-slate-400">{item.time}</span><span className="text-slate-600">{item.actor}</span><span><span className={`rounded-full px-2 py-1 text-[10px] font-medium ${STATUS_CLASS[eventStatus]}`}>{STATUS_LABEL[eventStatus]}</span></span><span className="text-slate-600">{item.detail}</span></div>; })}</div></div></div></section>
  </div>;
}

interface DetailRow { label: string; value: React.ReactNode; mono?: boolean }
function DetailSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-5 py-4 text-sm font-bold text-slate-800">{title}</h2>{children}</section>; }
function DetailTable({ rows }: { rows: DetailRow[] }) { return <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="w-52 px-5 py-2.5 font-medium">字段</th><th className="px-5 py-2.5 font-medium">内容</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row.label}><td className="px-5 py-3 text-slate-500">{row.label}</td><td className={`px-5 py-3 font-medium text-slate-700 ${row.mono ? 'font-mono' : ''}`}>{row.value}</td></tr>)}</tbody></table></div>; }
function Field({ label, children }: { label: string; children: React.ReactElement }) { return <label className="block text-xs font-medium text-slate-600"><span className="mb-1.5 block">{label}</span>{React.cloneElement(children, { className: `${children.props.className || ''} h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-primary` })}</label>; }
function Dialog({ title, children, onCancel, onConfirm, confirmText, danger = false }: { title: string; children: React.ReactNode; onCancel: () => void; onConfirm: () => void; confirmText: string; danger?: boolean }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"><div className="w-[560px] rounded-xl bg-white shadow-xl"><div className="border-b border-slate-100 px-5 py-4 text-sm font-bold text-slate-800">{title}</div><div className="p-5">{children}</div><div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4"><button onClick={onCancel} className="h-9 rounded-lg border border-slate-200 px-4 text-xs text-slate-600">取消</button><button onClick={onConfirm} className={`h-9 rounded-lg px-4 text-xs font-semibold text-white ${danger ? 'bg-red-500' : 'bg-primary'}`}>{confirmText}</button></div></div></div>; }
function StopDialog({ count, onCancel, onConfirm }: { count: number; onCancel: () => void; onConfirm: () => void }) { return <Dialog title={`终止 ${count} 条回呼计划`} onCancel={onCancel} onConfirm={onConfirm} confirmText="确认终止" danger><p className="text-sm leading-6 text-slate-600">终止后计划不会继续执行，相关记录仍会保留。</p></Dialog>; }
