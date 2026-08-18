// 这个页面承载自动跟进的任务、Flow 编排和执行记录三个独立工作区。
import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  FileClock,
  Pencil,
  PhoneCall,
  Plus,
  Search,
  Workflow,
  X,
} from 'lucide-react';
import type { FollowUpAttempt, FollowUpTask, FollowUpTaskStatus } from '../../types';
import {
  FOLLOW_UP_STATUS_LABELS,
  formatDateTime,
  MOCK_FOLLOW_UP_RULES,
  MOCK_FOLLOW_UP_TASKS,
} from '../marketing/mockCustomerOperations';
import type { FollowUpRuleGraphDefinition } from './followUpRuleGraph';
import FollowUpRulesWorkspace, { loadFollowUpFlows } from './FollowUpRulesWorkspace';

export type FollowUpPage = 'tasks' | 'flows' | 'records';

interface FollowUpManagerProps {
  page?: FollowUpPage;
}

interface FollowUpRecordRow {
  task: FollowUpTask;
  attempt: FollowUpAttempt;
  sequence: number;
}

interface TaskFormDraft {
  id?: string;
  customerName: string;
  phoneNumber: string;
  reason: string;
  plannedCallTime: string;
  flowId: string;
  flowName: string;
}

const TASK_STORAGE_KEY = 'voice_agent_follow_up_tasks_v2';

const emptyTaskDraft = (): TaskFormDraft => ({
  customerName: '',
  phoneNumber: '',
  reason: '',
  plannedCallTime: toDateTimeLocal(Date.now() + 24 * 60 * 60 * 1000),
  flowId: '',
  flowName: '',
});

// 将时间戳转换为 datetime-local 可直接读取的本地时间。
function toDateTimeLocal(value: number): string {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

// 从本地缓存恢复任务，缓存异常时回退到内置数据。
function loadTasks(): FollowUpTask[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(TASK_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FollowUpTask[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // 缓存不可读时使用内置任务。
    }
  }
  return MOCK_FOLLOW_UP_TASKS;
}

// 返回任务状态对应的视觉样式。
function taskStatusClass(status: FollowUpTaskStatus): string {
  if (status === 'completed' || status === 'connected') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'pending' || status === 'running' || status === 'no_answer') return 'bg-amber-50 text-amber-700 border-amber-100';
  if (status === 'rejected' || status === 'failed' || status === 'expired') return 'bg-red-50 text-red-600 border-red-100';
  if (status === 'transferred') return 'bg-purple-50 text-purple-700 border-purple-100';
  return 'bg-slate-50 text-slate-600 border-slate-100';
}

// 返回单次跟进执行结果的标签。
function attemptResultLabel(result: FollowUpAttempt['result']): string {
  return {
    connected: '已接通',
    no_answer: '未接通',
    busy: '忙线',
    failed: '执行失败',
    transferred: '已转人工',
  }[result];
}

// 将任务中的执行明细展开为跟进记录列表。
function buildRecordRows(tasks: FollowUpTask[]): FollowUpRecordRow[] {
  return tasks
    .flatMap(task => task.attempts.map((attempt, index) => ({ task, attempt, sequence: index + 1 })))
    .sort((left, right) => right.attempt.executedAt - left.attempt.executedAt);
}

export default function FollowUpManager({ page = 'tasks' }: FollowUpManagerProps) {
  const [tasks, setTasks] = useState<FollowUpTask[]>(loadTasks);
  const [flows, setFlows] = useState<FollowUpRuleGraphDefinition[]>(() => loadFollowUpFlows(MOCK_FOLLOW_UP_RULES));

  useEffect(() => {
    window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    setFlows(loadFollowUpFlows(MOCK_FOLLOW_UP_RULES));
  }, [page]);

  if (page === 'flows') {
    return (
      <PageShell title="规则编排">
        <FollowUpRulesWorkspace legacyRules={MOCK_FOLLOW_UP_RULES} tasks={tasks} />
      </PageShell>
    );
  }

  if (page === 'records') {
    return <FollowUpRecordsPage tasks={tasks} flows={flows} />;
  }

  return <FollowUpTasksPage tasks={tasks} flows={flows} onTasksChange={setTasks} />;
}

function FollowUpTasksPage({
  tasks,
  flows,
  onTasksChange,
}: {
  tasks: FollowUpTask[];
  flows: FollowUpRuleGraphDefinition[];
  onTasksChange: React.Dispatch<React.SetStateAction<FollowUpTask[]>>;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<FollowUpTask | null>(null);
  const [taskDraft, setTaskDraft] = useState<TaskFormDraft | null>(null);
  const publishedFlows = useMemo(() => flows.filter(flow => flow.status === 'published'), [flows]);
  const flowMap = useMemo(() => new Map(flows.map(flow => [flow.id, flow])), [flows]);
  const filteredTasks = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return tasks;
    return tasks.filter(task => `${task.customerName} ${task.phoneNumber} ${task.reason} ${task.executionFlowName}`.toLowerCase().includes(keyword));
  }, [tasks, searchTerm]);
  const pendingCount = tasks.filter(task => task.status === 'pending').length;
  const runningCount = tasks.filter(task => task.status === 'running' || task.status === 'no_answer').length;
  const completedCount = tasks.filter(task => task.status === 'completed').length;

  // 更新任务状态并同步当前详情弹窗。
  const updateTaskStatus = (taskId: string, status: FollowUpTaskStatus, result: string): void => {
    const attemptResult: FollowUpAttempt['result'] | null = status === 'completed' ? 'connected' : status === 'transferred' ? 'transferred' : null;
    const updateTask = (task: FollowUpTask): FollowUpTask => {
      if (task.id !== taskId) return task;
      const attempts = attemptResult && task.status !== status
        ? [...task.attempts, { id: `attempt_${Date.now()}`, taskId, executedAt: Date.now(), result: attemptResult, summary: result }]
        : task.attempts;
      return { ...task, status, latestResult: result, attempts };
    };
    onTasksChange(current => current.map(updateTask));
    setSelectedTask(current => current ? updateTask(current) : current);
  };

  // 打开任务编辑表单并回填已关联 Flow。
  const editTask = (task: FollowUpTask): void => {
    setTaskDraft({
      id: task.id,
      customerName: task.customerName,
      phoneNumber: task.phoneNumber,
      reason: task.reason,
      plannedCallTime: toDateTimeLocal(task.plannedCallTime),
      flowId: task.ruleId || '',
      flowName: task.executionFlowName,
    });
  };

  // 保存任务及其关联的已发布 Flow 版本。
  const saveTask = (draft: TaskFormDraft): void => {
    const flow = publishedFlows.find(item => item.id === draft.flowId);
    if (!flow) return;
    const plannedCallTime = new Date(draft.plannedCallTime).getTime();
    if (draft.id) {
      onTasksChange(current => current.map(task => task.id === draft.id ? {
        ...task,
        customerName: draft.customerName.trim(),
        phoneNumber: draft.phoneNumber.trim(),
        reason: draft.reason.trim(),
        plannedCallTime,
        ruleId: flow.id,
        flowVersion: flow.version,
        executionFlowName: flow.name,
      } : task));
    } else {
      const nextTask: FollowUpTask = {
        id: `fu_${Date.now()}`,
        customerName: draft.customerName.trim(),
        phoneNumber: draft.phoneNumber.trim(),
        sourceCallId: '人工创建',
        sourceBotName: '自动跟进',
        sourceFlowName: '-',
        reason: draft.reason.trim(),
        plannedCallTime,
        executionBotName: '由 Flow 决定',
        executionFlowName: flow.name,
        status: 'pending',
        retryCount: 0,
        latestResult: '等待执行',
        ruleId: flow.id,
        flowVersion: flow.version,
        attempts: [],
      };
      onTasksChange(current => [nextTask, ...current]);
    }
    setTaskDraft(null);
  };

  return (
    <PageShell title="跟进任务" action={(
      <button type="button" onClick={() => setTaskDraft(emptyTaskDraft())} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90">
        <Plus size={16} />新建任务
      </button>
    )}>
      <div className="mb-5 grid grid-cols-4 gap-3">
        <Metric title="全部任务" value={tasks.length} />
        <Metric title="待执行" value={pendingCount} tone="amber" />
        <Metric title="执行中" value={runningCount} tone="blue" />
        <Metric title="已完成" value={completedCount} tone="green" />
      </div>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden border border-slate-200 bg-white">
        <div className="flex items-center border-b border-slate-100 px-5 py-3">
          <div className="relative w-96">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary" placeholder="搜索客户、手机号、原因或 Flow" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
              <tr><Th>客户</Th><Th>跟进原因</Th><Th>计划执行时间</Th><Th>关联 Flow</Th><Th>状态</Th><Th>最近结果</Th><Th align="right">操作</Th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map(task => {
                const flow = task.ruleId ? flowMap.get(task.ruleId) : undefined;
                return (
                  <tr key={task.id} className="align-top hover:bg-slate-50">
                    <td className="px-4 py-4"><div className="font-medium text-slate-900">{task.customerName}</div><div className="mt-1 text-xs text-slate-500">{task.phoneNumber}</div></td>
                    <td className="max-w-xs px-4 py-4 text-slate-700">{task.reason}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatDateTime(task.plannedCallTime)}</td>
                    <td className="px-4 py-4"><div className="flex items-center gap-1.5 font-medium text-slate-700"><Workflow size={14} />{task.executionFlowName}</div><div className="mt-1 text-xs text-slate-400">V{task.flowVersion || flow?.version || '-'}</div></td>
                    <td className="px-4 py-4"><Badge className={taskStatusClass(task.status)}>{FOLLOW_UP_STATUS_LABELS[task.status]}</Badge><div className="mt-2 text-xs text-slate-400">已执行 {task.attempts.length} 次</div></td>
                    <td className="max-w-xs px-4 py-4 text-slate-500">{task.latestResult || '暂无结果'}</td>
                    <td className="px-4 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => editTask(task)} className="rounded border border-slate-200 p-1.5 text-slate-500 hover:border-primary hover:text-primary" aria-label={`编辑 ${task.customerName} 的跟进任务`}><Pencil size={14} /></button><button type="button" onClick={() => setSelectedTask(task)} className="rounded border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:border-primary hover:text-primary">查看</button><button type="button" onClick={() => updateTaskStatus(task.id, 'running', '已立即执行，等待跟进结果')} className="rounded border border-emerald-100 px-2.5 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50">立即执行</button><button type="button" onClick={() => updateTaskStatus(task.id, 'cancelled', '运营手动取消')} className="rounded border border-amber-100 px-2.5 py-1.5 text-xs text-amber-600 hover:bg-amber-50">取消</button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredTasks.length === 0 && <EmptyState icon={<FileClock size={22} />} text="没有符合条件的跟进任务" />}
        </div>
      </section>

      {taskDraft && <TaskForm draft={taskDraft} flows={publishedFlows} onChange={setTaskDraft} onSave={saveTask} onClose={() => setTaskDraft(null)} />}
      {selectedTask && <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} onUpdateStatus={updateTaskStatus} />}
    </PageShell>
  );
}

function FollowUpRecordsPage({ tasks, flows }: { tasks: FollowUpTask[]; flows: FollowUpRuleGraphDefinition[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [resultFilter, setResultFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState<FollowUpRecordRow | null>(null);
  const flowMap = useMemo(() => new Map(flows.map(flow => [flow.id, flow])), [flows]);
  const records = useMemo(() => buildRecordRows(tasks), [tasks]);
  const visibleRecords = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return records.filter(row => {
      const matchesSearch = !keyword || `${row.task.id} ${row.task.customerName} ${row.task.phoneNumber} ${row.task.executionFlowName} ${row.attempt.summary}`.toLowerCase().includes(keyword);
      return matchesSearch && (resultFilter === 'all' || row.attempt.result === resultFilter);
    });
  }, [records, resultFilter, searchTerm]);

  return (
    <PageShell title="跟进记录">
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <div className="relative w-96"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary" placeholder="搜索任务、客户、Flow 或执行结果" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} /></div>
          <select className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-primary" value={resultFilter} onChange={event => setResultFilter(event.target.value)}><option value="all">全部结果</option><option value="connected">已接通</option><option value="no_answer">未接通</option><option value="busy">忙线</option><option value="failed">执行失败</option><option value="transferred">已转人工</option></select>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50"><tr><Th>执行时间</Th><Th>客户</Th><Th>任务 ID</Th><Th>Flow / 版本</Th><Th>执行次数</Th><Th>执行结果</Th><Th>结果说明</Th><Th align="right">操作</Th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRecords.map(row => {
                const flow = row.task.ruleId ? flowMap.get(row.task.ruleId) : undefined;
                return <tr key={row.attempt.id} className="hover:bg-slate-50"><td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatDateTime(row.attempt.executedAt)}</td><td className="px-4 py-4"><div className="font-medium text-slate-800">{row.task.customerName}</div><div className="mt-1 text-xs text-slate-400">{row.task.phoneNumber}</div></td><td className="px-4 py-4 font-mono text-xs text-slate-500">{row.task.id}</td><td className="px-4 py-4"><div className="font-medium text-slate-700">{row.task.executionFlowName}</div><div className="mt-1 text-xs text-slate-400">V{row.task.flowVersion || flow?.version || '-'}</div></td><td className="px-4 py-4 text-slate-600">第 {row.sequence} 次</td><td className="px-4 py-4"><Badge className={row.attempt.result === 'connected' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : row.attempt.result === 'transferred' ? 'border-purple-100 bg-purple-50 text-purple-700' : 'border-amber-100 bg-amber-50 text-amber-700'}>{attemptResultLabel(row.attempt.result)}</Badge></td><td className="max-w-sm px-4 py-4 text-slate-600">{row.attempt.summary}</td><td className="px-4 py-4 text-right"><button type="button" onClick={() => setSelectedRecord(row)} className="rounded border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:border-primary hover:text-primary">查看</button></td></tr>;
              })}
            </tbody>
          </table>
          {visibleRecords.length === 0 && <EmptyState icon={<FileClock size={22} />} text="没有符合条件的跟进记录" />}
        </div>
      </section>
      {selectedRecord && <RecordDetail record={selectedRecord} flow={selectedRecord.task.ruleId ? flowMap.get(selectedRecord.task.ruleId) : undefined} onClose={() => setSelectedRecord(null)} />}
    </PageShell>
  );
}

function TaskForm({ draft, flows, onChange, onSave, onClose }: { draft: TaskFormDraft; flows: FollowUpRuleGraphDefinition[]; onChange: (draft: TaskFormDraft) => void; onSave: (draft: TaskFormDraft) => void; onClose: () => void }) {
  const selectedFlowAvailable = flows.some(flow => flow.id === draft.flowId);
  const canSave = Boolean(draft.customerName.trim() && draft.phoneNumber.trim() && draft.reason.trim() && draft.plannedCallTime && selectedFlowAvailable);
  return (
    <Modal title={draft.id ? '编辑跟进任务' : '新建跟进任务'} onClose={onClose}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="客户姓名"><input className={inputClass} value={draft.customerName} onChange={event => onChange({ ...draft, customerName: event.target.value })} /></Field>
        <Field label="客户手机号"><input className={inputClass} value={draft.phoneNumber} onChange={event => onChange({ ...draft, phoneNumber: event.target.value })} /></Field>
        <Field label="计划执行时间"><input type="datetime-local" className={inputClass} value={draft.plannedCallTime} onChange={event => onChange({ ...draft, plannedCallTime: event.target.value })} /></Field>
        <Field label="关联 Flow"><select className={inputClass} value={draft.flowId} onChange={event => { const flow = flows.find(item => item.id === event.target.value); onChange({ ...draft, flowId: event.target.value, flowName: flow?.name || '' }); }}><option value="">请选择已发布 Flow</option>{draft.flowId && !selectedFlowAvailable && <option value={draft.flowId} disabled>{draft.flowName} · 已停用</option>}{flows.map(flow => <option key={flow.id} value={flow.id}>{flow.name} · V{flow.version}</option>)}</select></Field>
        <div className="col-span-2"><Field label="跟进原因"><textarea className={`${inputClass} min-h-24 resize-none`} value={draft.reason} onChange={event => onChange({ ...draft, reason: event.target.value })} /></Field></div>
      </div>
      <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="h-9 rounded-md border border-slate-200 px-4 text-sm text-slate-600 hover:bg-slate-50">取消</button><button type="button" disabled={!canSave} onClick={() => onSave(draft)} className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">保存</button></div>
    </Modal>
  );
}

function TaskDetail({ task, onClose, onUpdateStatus }: { task: FollowUpTask; onClose: () => void; onUpdateStatus: (taskId: string, status: FollowUpTaskStatus, result: string) => void }) {
  return (
    <Modal title="跟进任务详情" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 text-sm"><Info label="客户" value={`${task.customerName} · ${task.phoneNumber}`} /><Info label="任务 ID" value={task.id} /><Info label="计划执行时间" value={formatDateTime(task.plannedCallTime)} /><Info label="关联 Flow" value={`${task.executionFlowName} · V${task.flowVersion || '-'}`} /><div className="col-span-2"><Info label="跟进原因" value={task.reason} /></div><Info label="当前状态" value={FOLLOW_UP_STATUS_LABELS[task.status]} /><Info label="最近结果" value={task.latestResult || '暂无结果'} /></div>
      <div className="mt-5 flex gap-2"><button type="button" onClick={() => onUpdateStatus(task.id, 'completed', '已接通并完成跟进')} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-600 text-sm font-medium text-white"><CheckCircle2 size={15} />标记完成</button><button type="button" onClick={() => onUpdateStatus(task.id, 'transferred', '用户要求人工接管')} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-primary text-sm font-medium text-white"><PhoneCall size={15} />转人工</button></div>
    </Modal>
  );
}

function RecordDetail({ record, flow, onClose }: { record: FollowUpRecordRow; flow?: FollowUpRuleGraphDefinition; onClose: () => void }) {
  return <Modal title="跟进记录详情" onClose={onClose}><div className="grid grid-cols-2 gap-3 text-sm"><Info label="执行时间" value={formatDateTime(record.attempt.executedAt)} /><Info label="执行结果" value={attemptResultLabel(record.attempt.result)} /><Info label="任务 ID" value={record.task.id} /><Info label="执行次数" value={`第 ${record.sequence} 次`} /><Info label="客户" value={`${record.task.customerName} · ${record.task.phoneNumber}`} /><Info label="Flow" value={`${record.task.executionFlowName} · V${record.task.flowVersion || flow?.version || '-'}`} /><div className="col-span-2"><Info label="结果说明" value={record.attempt.summary} /></div></div></Modal>;
}

function PageShell({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex h-full flex-col bg-slate-50 p-6"><header className="mb-5 flex shrink-0 items-center justify-between"><h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>{action}</header>{children}</div>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 p-6"><section className="w-[620px] max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"><header className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h3 className="font-semibold text-slate-900">{title}</h3><button type="button" onClick={onClose} className="rounded-md p-2 text-slate-400 hover:bg-slate-100" aria-label="关闭"><X size={17} /></button></header><div className="p-5">{children}</div></section></div>;
}

const inputClass = 'mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-medium text-slate-600">{label}</span>{children}</label>;
}

function Metric({ title, value, tone }: { title: string; value: string | number; tone?: 'green' | 'amber' | 'blue' }) {
  const toneClass = tone === 'green' ? 'text-emerald-600' : tone === 'amber' ? 'text-amber-600' : tone === 'blue' ? 'text-primary' : 'text-slate-900';
  return <div className="border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{title}</p><p className={`mt-1 text-xl font-bold ${toneClass}`}>{value}</p></div>;
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return <th className={`px-4 py-3 text-xs font-semibold text-slate-500 ${align === 'right' ? 'text-right' : 'text-left'}`}>{children}</th>;
}

function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${className}`}>{children}</span>;
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="border border-slate-100 bg-slate-50 p-3"><p className="text-xs text-slate-400">{label}</p><div className="mt-1 font-medium text-slate-700">{value}</div></div>;
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex h-60 flex-col items-center justify-center gap-3 text-sm text-slate-400"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">{icon}</span>{text}</div>;
}
