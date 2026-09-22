// 满意度调查模块入口：管理不可变的已发布问卷，并查看按问卷口径汇总的报表。
import React, { useMemo, useState } from 'react';
import { BarChart3, Copy, Edit2, Eye, FileText, Plus, Search, Trash2 } from 'lucide-react';
import { BotConfiguration, SatisfactionSurvey, SatisfactionSurveyQuestion } from '../../types';
import SatisfactionSurveyEditor from './SatisfactionSurveyEditor';
import SatisfactionSurveyReport from './SatisfactionSurveyReport';

interface Props { surveys: SatisfactionSurvey[]; onChange: (items: SatisfactionSurvey[]) => void; bots: BotConfiguration[]; onOpenCallRecord: (callId: string) => void; }
const statusMeta = { draft: ['草稿', 'bg-amber-50 text-amber-600'], published: ['已发布', 'bg-emerald-50 text-emerald-600'] } as const;

// 满意度只能由一道封闭题算出来，新建问卷直接预置一道总体满意度题并设为核心题，
// 客户不改它也能算出满意度；不想要可以删掉或换成自己的题。
const DEFAULT_PRIMARY_QUESTION_ID = 'overall_satisfaction';
const createDefaultPrimaryQuestion = (): SatisfactionSurveyQuestion => ({
  id: DEFAULT_PRIMARY_QUESTION_ID, title: '总体满意度', prompt: '满分五分，您对本次服务整体打几分？',
  type: 'rating', required: true, scaleMin: 1, scaleMax: 5, satisfactionThreshold: 4,
});

// 新建调查默认使用语音智能体类型。
const emptySurvey = (): SatisfactionSurvey => ({
  id: '', name: '', description: '', mode: 'voice_agent', metricType: 'custom', language: 'inherit', status: 'draft', version: 1,
  openingPrompt: '结束前，想邀请您评价本次服务。', closingPrompt: '感谢您的反馈，再见。', noInputPrompt: '没有听清，请您再说一次。',
  maxNoInputRetries: 1, responseCount: 0, updatedAt: Date.now(),
  primaryQuestionId: DEFAULT_PRIMARY_QUESTION_ID, questions: [createDefaultPrimaryQuestion()],
});

// 深复制问卷，使新草稿与历史问卷完全隔离。
const copySurvey = (item: SatisfactionSurvey): SatisfactionSurvey => {
  const copiedAt = Date.now();
  const questions = item.questions.map((question, index) => ({
    ...question, id: `question_${copiedAt}_${index}`,
    options: question.options?.map(option => ({ ...option })),
    aggregationCategories: question.aggregationCategories ? [...question.aggregationCategories] : undefined,
    reasonTriggerValues: question.reasonTriggerValues ? [...question.reasonTriggerValues] : undefined,
    reasonAggregationCategories: question.reasonAggregationCategories ? [...question.reasonAggregationCategories] : undefined,
  }));
  const primaryIndex = item.questions.findIndex(question => question.id === item.primaryQuestionId);
  return { ...item, id: '', name: `${item.name}（副本）`, status: 'draft', version: 1, responseCount: 0, updatedAt: copiedAt, questions, primaryQuestionId: primaryIndex >= 0 ? questions[primaryIndex].id : undefined };
};

const SatisfactionSurveyManager: React.FC<Props> = ({ surveys, onChange, bots, onOpenCallRecord }) => {
  const [tab, setTab] = useState<'list' | 'report'>('list');
  const [editing, setEditing] = useState<SatisfactionSurvey | null>(null);
  const [keyword, setKeyword] = useState('');
  const [mode, setMode] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => surveys.filter(item => (!keyword.trim() || `${item.name}${item.description}`.toLowerCase().includes(keyword.trim().toLowerCase())) && (mode === 'all' || item.mode === mode) && (status === 'all' || item.status === status)), [surveys, keyword, mode, status]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * 10, currentPage * 10);

  // 已发布问卷只允许原样保留；任何调整通过复制草稿完成。
  const save = (item: SatisfactionSurvey) => {
    if (item.id) onChange(surveys.map(old => old.id === item.id && old.status === 'draft' ? item : old));
    else onChange([{ ...item, id: `survey_${Date.now()}` }, ...surveys]);
    setEditing(null);
  };

  const removeDraft = (item: SatisfactionSurvey) => {
    if (item.status !== 'draft') return;
    if (window.confirm(`确定删除草稿“${item.name}”吗？`)) onChange(surveys.filter(old => old.id !== item.id));
  };

  if (editing) return <SatisfactionSurveyEditor survey={editing} onSave={save} onCancel={() => setEditing(null)} />;

  return <div className="mx-auto max-w-[1480px] p-6">
    <div className="mb-5 flex items-end justify-between"><div><h2 className="text-xl font-bold text-slate-900">满意度调查</h2><p className="mt-1 text-sm text-slate-500">已发布问卷不能修改，需要调整请复制新建。</p></div>{tab === 'list' && <button type="button" onClick={() => setEditing(emptySurvey())} className="flex items-center gap-1.5 rounded bg-primary px-4 py-2 text-sm font-semibold text-white"><Plus size={16} />新建调查</button>}</div>
    <div className="mb-4 flex border-b border-slate-200"><button type="button" onClick={() => setTab('list')} className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold ${tab === 'list' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}><FileText size={16} />问卷管理</button><button type="button" onClick={() => setTab('report')} className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold ${tab === 'report' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}><BarChart3 size={16} />满意度报表</button></div>
    {tab === 'report' ? <SatisfactionSurveyReport surveys={surveys} bots={bots} onOpenCallRecord={onOpenCallRecord} /> : <>
      <div className="mb-4 flex gap-2 rounded-lg border border-slate-200 bg-white p-4"><div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={keyword} onChange={event => { setKeyword(event.target.value); setPage(1); }} placeholder="搜索调查名称或说明" className="w-full rounded border border-slate-200 py-2 pl-9 pr-3 text-sm" /></div><select value={mode} onChange={event => { setMode(event.target.value); setPage(1); }} className="rounded border border-slate-200 px-3 text-sm"><option value="all">全部采集方式</option><option value="voice_agent">语音智能体</option><option value="ivr">IVR</option></select><select value={status} onChange={event => { setStatus(event.target.value); setPage(1); }} className="rounded border border-slate-200 px-3 text-sm"><option value="all">全部状态</option><option value="published">已发布</option><option value="draft">草稿</option></select></div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white"><table className="w-full text-left"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">名称</th><th className="px-5 py-3">采集方式</th><th className="px-5 py-3">状态</th><th className="px-5 py-3">更新时间</th><th className="px-5 py-3 text-right">操作</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map(item => <tr key={item.id} className="text-sm"><td className="px-5 py-4"><button type="button" onClick={() => setEditing(item)} className="font-semibold text-slate-800 hover:text-primary">{item.name}</button><div className="mt-1 max-w-[360px] truncate text-xs text-slate-400">{item.description || '-'}</div></td><td className="px-5 py-4 text-slate-600">{item.mode === 'ivr' ? 'IVR' : '语音智能体'}</td><td className="px-5 py-4"><span className={`rounded-full px-2 py-0.5 text-xs ${statusMeta[item.status][1]}`}>{statusMeta[item.status][0]}</span></td><td className="px-5 py-4 text-slate-500">{new Date(item.updatedAt).toLocaleString('zh-CN', { hour12: false })}</td><td className="px-5 py-4"><div className="flex justify-end gap-1">{item.status === 'draft' ? <><button type="button" onClick={() => setEditing(item)} className="p-1.5 text-slate-400 hover:text-primary" title="编辑"><Edit2 size={15} /></button><button type="button" onClick={() => removeDraft(item)} className="p-1.5 text-slate-400 hover:text-red-500" title="删除草稿"><Trash2 size={15} /></button></> : <button type="button" onClick={() => setEditing(item)} className="p-1.5 text-slate-400 hover:text-primary" title="查看"><Eye size={15} /></button>}<button type="button" onClick={() => setEditing(copySurvey(item))} className="p-1.5 text-slate-400 hover:text-primary" title="复制新建"><Copy size={15} /></button></div></td></tr>)}{!rows.length && <tr><td colSpan={5} className="px-5 py-16 text-center text-sm text-slate-400">没有符合条件的满意度调查</td></tr>}</tbody></table><div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500"><span>共 {filtered.length} 条</span><div className="flex gap-2"><button type="button" disabled={currentPage <= 1} onClick={() => setPage(value => value - 1)} className="rounded border px-2 py-1 disabled:opacity-40">上一页</button><span>{currentPage} / {pageCount}</span><button type="button" disabled={currentPage >= pageCount} onClick={() => setPage(value => value + 1)} className="rounded border px-2 py-1 disabled:opacity-40">下一页</button></div></div></div>
    </>}
  </div>;
};

export default SatisfactionSurveyManager;
