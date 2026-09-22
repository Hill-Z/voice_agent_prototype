// 满意度问卷详情：草稿可编辑，发布后只读；语音智能体按题配置回答类型和原因追溯开关，IVR 的题目由 IVR 流程维护。
import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { SatisfactionSurvey, SatisfactionSurveyOption, SatisfactionSurveyQuestion } from '../../types';
import { SATISFACTION_IVR_FLOWS, findIvrFlow, resolvePrimaryQuestionId } from './satisfactionData';

interface Props { survey: SatisfactionSurvey; onSave: (survey: SatisfactionSurvey) => void; onCancel: () => void; }
const inputClass = 'w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary disabled:bg-slate-50 disabled:text-slate-500';
const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600';

// 枚举题默认给出常见的三档满意程度，客户只需要改展示名。
const createDefaultOptions = (): SatisfactionSurveyOption[] => [
  { value: 'option_1', label: '满意', satisfied: true }, { value: 'option_2', label: '一般' }, { value: 'option_3', label: '不满意' },
];

// 枚举值退化为内部标识：客户只填展示名，已有选项的值保持不变，新增选项自动补一个不冲突的值。
// 值必须保持稳定，报表按它对回答做“计为满意”判定，重新生成会让历史满意度算不出来。
const nextOptionValue = (options: SatisfactionSurveyOption[] = []): string => {
  const used = new Set(options.map(option => option.value));
  let index = options.length + 1;
  while (used.has(`option_${index}`)) index += 1;
  return `option_${index}`;
};

// 创建默认评价题。
const createQuestion = (index: number): SatisfactionSurveyQuestion => ({
  id: `question_${Date.now()}_${index}`, title: '', prompt: '', type: 'single_choice', required: true,
  options: createDefaultOptions(), reasonTraceEnabled: false,
});

const SatisfactionSurveyEditor: React.FC<Props> = ({ survey, onSave, onCancel }) => {
  const [draft, setDraft] = useState<SatisfactionSurvey>({ ...survey, questions: survey.questions.map(item => ({ ...item, options: item.options?.map(option => ({ ...option })) })) });
  const [error, setError] = useState('');
  const readOnly = survey.status === 'published';
  const isIvr = draft.mode === 'ivr';
  const ivrFlow = findIvrFlow(draft.ivrFlowId);
  const update = <K extends keyof SatisfactionSurvey>(key: K, value: SatisfactionSurvey[K]) => setDraft(current => ({ ...current, [key]: value }));
  const updateQuestion = (id: string, patch: Partial<SatisfactionSurveyQuestion>) => update('questions', draft.questions.map(item => item.id === id ? { ...item, ...patch } : item));

  // 校验并保存草稿或发布问卷。
  const save = (status: 'draft' | 'published') => {
    if (!draft.name.trim()) return setError('请输入调查名称。');
    if (isIvr && !draft.ivrFlowId) return setError('请选择关联 IVR。');
    // IVR 的题目由 IVR 流程维护，这里只校验语音智能体问卷自己配置的评价项目。
    if (!isIvr && (!draft.questions.length || draft.questions.some(item => !item.title.trim() || !item.prompt.trim()))) return setError('请完整填写每个评价项目的名称和调查话术。');
    if (status === 'published' && !resolvePrimaryQuestionId(draft)) return setError('发布前请选择一个核心满意度题，用于计算问卷满意度。');
    if (status === 'published' && !window.confirm('发布后问卷不能修改，需要调整请复制新建。确定发布吗？')) return;
    setError('');
    onSave({ ...draft, status, updatedAt: Date.now() });
  };

  return <div className="mx-auto max-w-6xl p-6">
    <div className="mb-5 flex items-center justify-between">
      <div className="flex items-center gap-3"><button type="button" onClick={onCancel} className="rounded border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="返回"><ArrowLeft size={16} /></button><div><div className="flex items-center gap-2"><h2 className="text-lg font-bold text-slate-900">{readOnly ? '查看满意度调查' : survey.id ? '编辑满意度调查' : '新建满意度调查'}</h2>{readOnly && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">已发布 · 只读</span>}</div><p className="mt-1 text-xs text-slate-500">{readOnly ? '已发布问卷不能修改，需要调整请返回列表复制新建。' : '发布后问卷不能修改，需要调整请复制新建。'}</p></div></div>
      <div className="flex gap-2"><button type="button" onClick={onCancel} className="rounded border border-slate-200 px-4 py-2 text-sm text-slate-600">返回</button>{!readOnly && <><button type="button" onClick={() => save('draft')} className="rounded border border-primary px-4 py-2 text-sm font-semibold text-primary">保存草稿</button><button type="button" onClick={() => save('published')} className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white">发布问卷</button></>}</div>
    </div>
    {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}

    <fieldset disabled={readOnly} className="contents">
      <section className="mb-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-slate-800">基本信息</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><label><span className={labelClass}>调查名称 *</span><input value={draft.name} onChange={event => update('name', event.target.value)} className={inputClass} /></label><label><span className={labelClass}>调查类型 *</span><select value={draft.mode} onChange={event => update('mode', event.target.value as SatisfactionSurvey['mode'])} className={inputClass}><option value="voice_agent">语音智能体</option><option value="ivr">IVR</option></select></label><label className="md:col-span-2"><span className={labelClass}>说明</span><textarea value={draft.description} onChange={event => update('description', event.target.value)} className={`${inputClass} h-16 resize-none`} placeholder="说明调查用途" /></label></div>
      </section>

      {isIvr ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h3 className="mb-3 text-sm font-bold text-slate-800">关联 IVR</h3><select value={draft.ivrFlowId || ''} onChange={event => { const flow = findIvrFlow(event.target.value); setDraft(current => ({ ...current, ivrFlowId: flow?.id, ivrFlowName: flow?.name })); }} className={`${inputClass} max-w-xl`}><option value="">请选择已发布 IVR</option>{SATISFACTION_IVR_FLOWS.map(flow => <option key={flow.id} value={flow.id}>{flow.name}</option>)}</select><p className="mt-2 text-xs text-slate-500">继续使用原有 IVR 播放和按键采集流程；旧版满意度 IVR 可直接选择。评价项目和核心满意度题在 IVR 流程中维护，这里只绑定流程。</p>{ivrFlow && <p className="mt-2 rounded bg-slate-50 px-3 py-2 text-xs text-slate-500">该 IVR 已配置 {ivrFlow.questions.length} 个评价项目，核心满意度题为“{ivrFlow.questions.find(question => question.id === ivrFlow.primaryQuestionId)?.title || '未设置'}”。</p>}</section>
      ) : <>
        <section className="mb-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h3 className="mb-4 text-sm font-bold text-slate-800">调查话术</h3><div className="grid gap-3 md:grid-cols-2"><label><span className={labelClass}>开始话术</span><textarea value={draft.openingPrompt} onChange={event => update('openingPrompt', event.target.value)} className={`${inputClass} h-20 resize-none`} /></label><label><span className={labelClass}>结束话术</span><textarea value={draft.closingPrompt} onChange={event => update('closingPrompt', event.target.value)} className={`${inputClass} h-20 resize-none`} /></label></div></section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><div><h3 className="text-sm font-bold text-slate-800">评价项目</h3><p className="mt-1 text-xs text-slate-500">逐题配置回答类型和原因追溯开关；开放回答可选填聚合提示词，核心满意度题用于计算问卷满意度。</p></div>{!readOnly && <button type="button" onClick={() => update('questions', [...draft.questions, createQuestion(draft.questions.length)])} className="inline-flex items-center gap-1 rounded border border-primary px-3 py-1.5 text-xs font-semibold text-primary"><Plus size={13} />添加项目</button>}</div>
          <div className="space-y-4">{draft.questions.map((question, index) => {
            const isPrimary = draft.primaryQuestionId === question.id;
            return <article key={question.id} className={`rounded-lg border p-4 ${isPrimary ? 'border-blue-300 bg-blue-50/30' : 'border-slate-200'}`}>
              <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">{index + 1}</span><span className="text-sm font-bold text-slate-800">{question.title || '未命名评价项目'}</span>{isPrimary && <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-600">核心满意度题</span>}</div>{!readOnly && <button type="button" onClick={() => { update('questions', draft.questions.filter(item => item.id !== question.id)); if (isPrimary) update('primaryQuestionId', undefined); }} className="text-slate-400 hover:text-red-500" aria-label="删除项目"><Trash2 size={15} /></button>}</div>
              <div className="grid gap-3 md:grid-cols-2"><label><span className={labelClass}>项目名称 *</span><input value={question.title} onChange={event => updateQuestion(question.id, { title: event.target.value })} className={inputClass} placeholder="如：本次服务评分" /></label><label><span className={labelClass}>回答类型 *</span><select value={question.type} onChange={event => { const type = event.target.value as SatisfactionSurveyQuestion['type']; updateQuestion(question.id, { type, options: type === 'single_choice' ? question.options?.length ? question.options : createDefaultOptions() : undefined, scaleMin: type === 'rating' ? 1 : undefined, scaleMax: type === 'rating' ? 5 : undefined }); if (type === 'open_text' && isPrimary) update('primaryQuestionId', undefined); }} className={inputClass}><option value="rating">评分</option><option value="single_choice">枚举选项</option><option value="open_text">开放回答</option></select></label><label className="md:col-span-2"><span className={labelClass}>调查话术 *</span><textarea value={question.prompt} onChange={event => updateQuestion(question.id, { prompt: event.target.value })} className={`${inputClass} h-16 resize-none`} placeholder="机器人实际询问客户的话术" /></label></div>

              {question.type === 'rating' && <div className="mt-3 grid gap-3 rounded bg-slate-50 p-3 md:grid-cols-3"><label><span className={labelClass}>最低分</span><input type="number" value={question.scaleMin ?? 1} onChange={event => updateQuestion(question.id, { scaleMin: Number(event.target.value) })} className={inputClass} /></label><label><span className={labelClass}>最高分</span><input type="number" value={question.scaleMax ?? 5} onChange={event => updateQuestion(question.id, { scaleMax: Number(event.target.value) })} className={inputClass} /></label><label><span className={labelClass}>达到多少分计为满意</span><input type="number" value={question.satisfactionThreshold ?? 4} onChange={event => updateQuestion(question.id, { satisfactionThreshold: Number(event.target.value) })} className={inputClass} /></label></div>}

              {question.type === 'single_choice' && <div className="mt-3 rounded bg-slate-50 p-3"><div className="mb-2 flex items-center justify-between"><span className={labelClass}>枚举选项</span>{!readOnly && <button type="button" onClick={() => updateQuestion(question.id, { options: [...(question.options || []), { value: nextOptionValue(question.options), label: '' }] })} className="text-xs font-semibold text-primary">+ 添加选项</button>}</div><div className="space-y-2">{(question.options || []).map((option, optionIndex) => <div key={`${question.id}_${optionIndex}`} className="grid grid-cols-[minmax(0,1fr)_110px_28px] items-center gap-2"><input value={option.label} onChange={event => updateQuestion(question.id, { options: question.options?.map((item, itemIndex) => itemIndex === optionIndex ? { ...item, label: event.target.value } : item) })} className={inputClass} placeholder="选项名称，如：非常满意" /><label className="flex items-center gap-1 text-xs text-slate-600"><input type="checkbox" checked={Boolean(option.satisfied)} onChange={event => updateQuestion(question.id, { options: question.options?.map((item, itemIndex) => itemIndex === optionIndex ? { ...item, satisfied: event.target.checked } : item) })} />计为满意</label>{!readOnly && <button type="button" onClick={() => updateQuestion(question.id, { options: question.options?.filter((_, itemIndex) => itemIndex !== optionIndex) })} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>}</div>)}</div></div>}

              {question.type === 'open_text' && <div className="mt-3"><label><span className={labelClass}>开放回答聚合提示词</span><textarea value={question.aggregationPrompt || ''} onChange={event => updateQuestion(question.id, { aggregationPrompt: event.target.value })} className={`${inputClass} h-16 resize-none`} placeholder="说明如何把客户原话归纳成稳定主题，便于报表汇总" /></label></div>}

              {question.type !== 'open_text' && <label className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-700"><input type="radio" name="primaryQuestion" checked={isPrimary} onChange={() => update('primaryQuestionId', question.id)} />设为核心满意度题</label>}

              {/* 原因追溯只留开关：触发条件、追问话术和原因归类都由平台按统一口径处理，
                  不再让客户逐题填写；报表侧也不按原因做聚合，客户原话只在通话记录里看。 */}
              <div className="mt-4 border-t border-slate-100 pt-4"><label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={Boolean(question.reasonTraceEnabled)} onChange={event => updateQuestion(question.id, { reasonTraceEnabled: event.target.checked })} />开启原因追溯</label></div>
            </article>;
          })}</div>
        </section>
      </>}
    </fieldset>
  </div>;
};

export default SatisfactionSurveyEditor;
