// 满意度调查详情页：语音智能体采用简洁问卷，IVR 保留旧版评价项目并绑定现有流程。
import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { SatisfactionSurvey, SatisfactionSurveyQuestion } from '../../types';

interface Props { survey: SatisfactionSurvey; onSave: (survey: SatisfactionSurvey) => void; onCancel: () => void; }
const inputClass = 'w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary';
const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600';
const ivrFlows = [{ id: 'ivr_delivery_survey', name: '配送服务满意度 IVR' }, { id: 'ivr_service_rating', name: '服务评价按键流程' }, { id: 'ivr_after_sales', name: '售后回访 IVR' }];

// 创建一个新的评价项目。
const createItem = (index: number): SatisfactionSurveyQuestion => ({ id: `question_${Date.now()}_${index}`, title: '', prompt: '', type: 'single_choice', required: true, options: [{ value: '1', label: '满意' }, { value: '2', label: '一般' }, { value: '3', label: '不满意' }] });

const SatisfactionSurveyEditor: React.FC<Props> = ({ survey, onSave, onCancel }) => {
  const [draft, setDraft] = useState<SatisfactionSurvey>({ ...survey, questions: survey.questions.map(item => ({ ...item, options: item.options?.map(option => ({ ...option })) })) });
  const [error, setError] = useState('');
  const isIvr = draft.mode === 'ivr';
  const update = <K extends keyof SatisfactionSurvey>(key: K, value: SatisfactionSurvey[K]) => setDraft(current => ({ ...current, [key]: value }));
  const updateItem = (id: string, itemPatch: Partial<SatisfactionSurveyQuestion>) => update('questions', draft.questions.map(item => item.id === id ? { ...item, ...itemPatch } : item));

  // 保存前仅校验会影响执行的字段。
  const save = () => {
    if (!draft.name.trim()) return setError('请输入调查名称。');
    if (isIvr && !draft.ivrFlowId) return setError('请选择关联 IVR。');
    if (!draft.questions.length || draft.questions.some(item => !item.title.trim())) return setError('请至少填写一个评价项目。');
    setError('');
    onSave({ ...draft, updatedAt: Date.now() });
  };

  return <div className="mx-auto max-w-5xl p-6">
    <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-3"><button type="button" onClick={onCancel} className="rounded border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="返回"><ArrowLeft size={16} /></button><div><h2 className="text-lg font-bold text-slate-900">{survey.id ? '编辑满意度调查' : '新建满意度调查'}</h2><p className="mt-1 text-xs text-slate-500">发布后可在机器人的通话结束触发器中选择。</p></div></div><div className="flex gap-2"><button type="button" onClick={onCancel} className="rounded border border-slate-200 px-4 py-2 text-sm text-slate-600">取消</button><button type="button" onClick={save} className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white">保存</button></div></div>
    {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}

    <section className="mb-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h3 className="mb-4 text-sm font-bold text-slate-800">基本信息</h3><div className="grid grid-cols-1 gap-4 md:grid-cols-3"><label><span className={labelClass}>调查名称 *</span><input value={draft.name} onChange={event => update('name', event.target.value)} className={inputClass} /></label><label><span className={labelClass}>调查类型 *</span><select value={draft.mode} onChange={event => update('mode', event.target.value as SatisfactionSurvey['mode'])} className={inputClass}><option value="voice_agent">语音智能体</option><option value="ivr">IVR</option></select></label><label><span className={labelClass}>状态</span><select value={draft.status} onChange={event => update('status', event.target.value as SatisfactionSurvey['status'])} className={inputClass}><option value="draft">草稿</option><option value="published">已发布</option><option value="disabled">已停用</option></select></label><label className="md:col-span-3"><span className={labelClass}>说明</span><textarea value={draft.description} onChange={event => update('description', event.target.value)} className={`${inputClass} h-16 resize-none`} placeholder="说明调查用途" /></label></div></section>

    {isIvr ? <>
      <section className="mb-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h3 className="mb-3 text-sm font-bold text-slate-800">关联 IVR</h3><select value={draft.ivrFlowId || ''} onChange={event => { const flow = ivrFlows.find(item => item.id === event.target.value); setDraft(current => ({ ...current, ivrFlowId: flow?.id, ivrFlowName: flow?.name })); }} className={`${inputClass} max-w-xl`}><option value="">请选择已发布 IVR</option>{ivrFlows.map(flow => <option key={flow.id} value={flow.id}>{flow.name}</option>)}</select><p className="mt-2 text-xs text-slate-500">先在「IVR 管理」完成语音播放和按键收集流程，再在此绑定；旧版满意度 IVR 可直接选择，原配置保持不变。</p></section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-bold text-slate-800">评价项目</h3><p className="mt-1 text-xs text-slate-500">保持旧版配置方式，按顺序维护需要汇总的评价项目。</p></div><button type="button" onClick={() => update('questions', [...draft.questions, createItem(draft.questions.length)])} className="inline-flex items-center gap-1 rounded border border-primary px-3 py-1.5 text-xs font-semibold text-primary"><Plus size={13} />添加</button></div><div className="space-y-2">{draft.questions.map((item, index) => <div key={item.id} className="flex items-center gap-2"><span className="w-16 text-xs text-slate-500">项目 {index + 1}</span><input value={item.title} onChange={event => updateItem(item.id, { title: event.target.value, prompt: event.target.value })} className={inputClass} placeholder="请输入评价项目，最多100个字符" maxLength={100} /><button type="button" onClick={() => update('questions', draft.questions.filter(question => question.id !== item.id))} className="p-2 text-slate-400 hover:text-red-500" aria-label="删除项目"><Trash2 size={15} /></button></div>)}</div><label className="mt-4 flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={draft.includeUnmatchedAsValid ?? false} onChange={event => update('includeUnmatchedAsValid', event.target.checked)} />将无匹配数据计入有效评价</label></section>
    </> : <>
      <section className="mb-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h3 className="mb-4 text-sm font-bold text-slate-800">调查话术</h3><div className="grid gap-3"><label><span className={labelClass}>邀请话术</span><input value={draft.openingPrompt} onChange={event => update('openingPrompt', event.target.value)} className={inputClass} placeholder="结束前，想邀请您评价本次服务。" /></label><label><span className={labelClass}>结束话术</span><input value={draft.closingPrompt} onChange={event => update('closingPrompt', event.target.value)} className={inputClass} placeholder="感谢您的反馈，再见。" /></label></div></section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h3 className="text-sm font-bold text-slate-800">评价项目</h3><p className="mt-1 text-xs text-slate-500">机器人按顺序询问，回答按项目分别汇总。</p></div><button type="button" onClick={() => update('questions', [...draft.questions, createItem(draft.questions.length)])} className="inline-flex items-center gap-1 rounded border border-primary px-3 py-1.5 text-xs font-semibold text-primary"><Plus size={13} />添加项目</button></div><div className="space-y-3">{draft.questions.map((item, index) => <div key={item.id} className="grid grid-cols-[64px_minmax(0,1fr)_32px] items-center gap-2"><span className="text-xs text-slate-500">项目 {index + 1}</span><input value={item.title} onChange={event => updateItem(item.id, { title: event.target.value, prompt: event.target.value })} className={inputClass} placeholder="如：您对本次服务是否满意？" /><button type="button" onClick={() => update('questions', draft.questions.filter(question => question.id !== item.id))} className="text-slate-400 hover:text-red-500" aria-label="删除项目"><Trash2 size={15} /></button></div>)}</div><div className="mt-4 border-t border-slate-100 pt-4"><label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={draft.reasonTraceEnabled ?? false} onChange={event => update('reasonTraceEnabled', event.target.checked)} />开启原因追溯</label>{draft.reasonTraceEnabled && <input value={draft.reasonTracePrompt || ''} onChange={event => update('reasonTracePrompt', event.target.value)} className={`${inputClass} mt-3`} placeholder="如：客户评价不满意时，继续询问主要原因。" />}<p className="mt-2 text-xs text-slate-400">原因回答会在报表中按评价项目聚合，并保留原始内容。</p></div></section>
    </>}
  </div>;
};

export default SatisfactionSurveyEditor;
