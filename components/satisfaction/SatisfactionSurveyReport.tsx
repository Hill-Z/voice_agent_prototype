// 满意度报表：问卷完成率与核心满意度分开计算，逐题展示有效回答和回答分布。
import React, { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { BotConfiguration, SatisfactionSurvey, SatisfactionSurveyQuestion } from '../../types';
import { SATISFACTION_RESPONSE_RECORDS, SatisfactionResponseAnswer, resolvePrimaryQuestionId, resolveSurveyQuestions } from './satisfactionData';

interface Props { surveys: SatisfactionSurvey[]; bots: BotConfiguration[]; onOpenCallRecord: (callId: string) => void; }
const fieldClass = 'h-9 rounded border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-primary';

// 将问题回答转换为可汇总的固定枚举。
const distributionOf = (question: SatisfactionSurveyQuestion, answers: SatisfactionResponseAnswer[]): Array<[string, number]> => {
  const counts = new Map<string, number>();
  answers.forEach(answer => {
    const key = question.type === 'open_text' ? answer.category || '未归类' : answer.displayValue;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()].sort((left, right) => right[1] - left[1]);
};

// 根据问卷配置判断核心题回答是否计为满意。
const isSatisfiedAnswer = (question: SatisfactionSurveyQuestion, answer: SatisfactionResponseAnswer): boolean => {
  if (question.type === 'rating') return Number(answer.rawValue) >= (question.satisfactionThreshold ?? question.scaleMax ?? 5);
  if (question.type === 'single_choice') return Boolean(question.options?.find(option => option.value === String(answer.rawValue))?.satisfied);
  return false;
};

const SatisfactionSurveyReport: React.FC<Props> = ({ surveys, bots, onOpenCallRecord }) => {
  const [dateRange, setDateRange] = useState<'7' | '15' | '30' | 'custom'>('30');
  const [startDate, setStartDate] = useState('2026-08-19');
  const [endDate, setEndDate] = useState('2026-09-18');
  const [surveyId, setSurveyId] = useState('all');
  const [botId, setBotId] = useState('all');
  const [mode, setMode] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const selectedSurvey = surveys.find(item => item.id === surveyId);
  const records = useMemo(() => {
    const now = new Date('2026-09-18T23:59:59').getTime();
    const start = dateRange === 'custom' ? new Date(`${startDate}T00:00:00`).getTime() : now - Number(dateRange) * 86400000;
    const end = dateRange === 'custom' ? new Date(`${endDate}T23:59:59`).getTime() : now;
    return SATISFACTION_RESPONSE_RECORDS.filter(record => {
      const time = new Date(record.time).getTime();
      return time >= start && time <= end && (surveyId === 'all' || record.surveyId === surveyId) && (botId === 'all' || record.botId === botId) && (mode === 'all' || record.mode === mode) && (status === 'all' || record.status === status);
    });
  }, [dateRange, startDate, endDate, surveyId, botId, mode, status]);

  const completed = records.filter(record => record.status === 'completed');
  const completionRate = records.length ? completed.length / records.length * 100 : 0;
  // IVR 问卷的题目与核心满意度题来自绑定的 IVR 流程，统一走解析函数，避免两处各存一份。
  const primaryQuestionId = selectedSurvey ? resolvePrimaryQuestionId(selectedSurvey) : undefined;
  const primaryQuestion = selectedSurvey ? resolveSurveyQuestions(selectedSurvey).find(question => question.id === primaryQuestionId) : undefined;
  const primaryAnswers = primaryQuestion ? records.flatMap(record => record.answers.filter(answer => answer.questionId === primaryQuestion.id)) : [];
  const satisfiedCount = primaryQuestion ? primaryAnswers.filter(answer => isSatisfiedAnswer(primaryQuestion, answer)).length : 0;
  const satisfactionRate = primaryAnswers.length ? satisfiedCount / primaryAnswers.length * 100 : null;

  // 原因追溯不再做聚合：客户的原话和归类只在通话记录里逐条查看，报表不做逐题原因汇总。
  const summaries = selectedSurvey ? resolveSurveyQuestions(selectedSurvey).map(question => {
    const answers = records.flatMap(record => record.answers.filter(answer => answer.questionId === question.id));
    const classifiedCount = question.type === 'open_text' ? answers.filter(answer => answer.category).length : answers.length;
    return { question, answers, classifiedCount, distribution: distributionOf(question, answers) };
  }) : [];

  // 评价项目汇总是逐题口径：没选问卷、或者选中的问卷在当前筛选下一条回答都没有时，整块不渲染。
  // 空表和「请选择一份调查问卷」这类占位提示都是噪音，没有可汇总的数据就没有这个区块。
  const hasSummaryData = summaries.some(summary => summary.answers.length > 0);

  const pageCount = Math.max(1, Math.ceil(records.length / 10));
  const currentPage = Math.min(page, pageCount);
  const rows = records.slice((currentPage - 1) * 10, currentPage * 10);
  const resetPage = () => setPage(1);

  return <div className="space-y-4">
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap gap-2"><select value={dateRange} onChange={event => { setDateRange(event.target.value as typeof dateRange); resetPage(); }} className={fieldClass}><option value="7">最近 7 天</option><option value="15">最近 15 天</option><option value="30">最近 30 天</option><option value="custom">自定义时间</option></select>{dateRange === 'custom' && <><input type="date" value={startDate} onChange={event => { setStartDate(event.target.value); resetPage(); }} className={fieldClass} /><span className="self-center text-xs text-slate-400">至</span><input type="date" value={endDate} onChange={event => { setEndDate(event.target.value); resetPage(); }} className={fieldClass} /></>}<select value={botId} onChange={event => { setBotId(event.target.value); resetPage(); }} className={fieldClass}><option value="all">全部机器人</option>{bots.map(bot => <option key={bot.id} value={bot.id}>{bot.name}</option>)}</select><select value={surveyId} onChange={event => { setSurveyId(event.target.value); resetPage(); }} className={fieldClass}><option value="all">全部调查问卷</option>{surveys.filter(survey => survey.status === 'published').map(survey => <option key={survey.id} value={survey.id}>{survey.name}</option>)}</select><select value={mode} onChange={event => { setMode(event.target.value); resetPage(); }} className={fieldClass}><option value="all">全部采集方式</option><option value="voice_agent">语音智能体</option><option value="ivr">IVR</option></select><select value={status} onChange={event => { setStatus(event.target.value); resetPage(); }} className={fieldClass}><option value="all">全部完成状态</option><option value="completed">已完成</option><option value="incomplete">未完成</option></select></div>
    </div>

    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">调查触发</div><div className="mt-2 text-2xl font-bold text-slate-900">{records.length}</div><div className="mt-1 text-xs text-slate-400">进入调查流程的通话</div></div>
      <div className="rounded-lg border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">问卷完成率</div><div className="mt-2 text-2xl font-bold text-slate-900">{completionRate.toFixed(1)}%</div><div className="mt-1 text-xs text-slate-400">{completed.length} 份答完全部必答题</div></div>
      <div className="rounded-lg border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">满意度</div><div className="mt-2 text-2xl font-bold text-slate-900">{selectedSurvey && satisfactionRate !== null ? `${satisfactionRate.toFixed(1)}%` : '-'}</div><div className="mt-1 text-xs text-slate-400">{selectedSurvey ? primaryQuestion ? `按“${primaryQuestion.title}”计算，共 ${primaryAnswers.length} 条有效回答` : '该问卷未配置核心满意度题' : '不同问卷口径不混算，请选择具体问卷'}</div></div>
    </div>

    {hasSummaryData && <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b px-5 py-4"><h3 className="text-sm font-bold text-slate-800">评价项目汇总</h3><p className="mt-1 text-xs text-slate-500">有效回答是客户对该题实际作答的数量；开放回答同时展示成功归类比例。</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">评价项目</th><th className="px-5 py-3">类型</th><th className="px-5 py-3">有效回答</th><th className="px-5 py-3">回答分布</th></tr></thead><tbody className="divide-y">{summaries.map(summary => <tr key={summary.question.id} className="align-top text-sm"><td className="px-5 py-4"><div className="font-medium text-slate-800">{summary.question.title}</div></td><td className="px-5 py-4 text-slate-500">{summary.question.type === 'rating' ? '评分' : summary.question.type === 'single_choice' ? '枚举' : '开放回答'}</td><td className="px-5 py-4 text-slate-600"><div>{summary.answers.length} 条</div>{summary.question.type === 'open_text' && <div className="mt-1 text-xs text-slate-400">已归类 {summary.classifiedCount} 条（{summary.answers.length ? (summary.classifiedCount / summary.answers.length * 100).toFixed(0) : 0}%）</div>}</td><td className="px-5 py-4"><div className="flex max-w-[420px] flex-wrap gap-1.5">{summary.distribution.slice(0, 8).map(([label, count]) => <span key={label} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{label} {count}</span>)}{!summary.distribution.length && <span className="text-slate-400">暂无回答</span>}</div></td></tr>)}</tbody></table></div>
    </section>}

    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b px-5 py-4"><h3 className="text-sm font-bold text-slate-800">调查明细</h3><p className="mt-1 text-xs text-slate-500">一行代表一次调查；客户原话、聚合分类和原因追溯在对应的通话记录里查看。</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">时间</th><th className="px-5 py-3">机器人</th><th className="px-5 py-3">调查问卷</th><th className="px-5 py-3">完成状态</th><th className="px-5 py-3 text-right">操作</th></tr></thead><tbody className="divide-y">{rows.map(record => <tr key={record.id} className="text-sm"><td className="px-5 py-3 text-slate-500">{new Date(record.time).toLocaleString('zh-CN', { hour12: false })}</td><td className="px-5 py-3 text-slate-600">{record.botName}</td><td className="px-5 py-3 text-slate-600">{record.surveyName}</td><td className="px-5 py-3"><span className={`rounded-full px-2 py-0.5 text-xs ${record.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{record.status === 'completed' ? '已完成' : `未完成 ${record.answeredCount}/${record.totalQuestionCount}`}</span></td><td className="px-5 py-3"><div className="flex justify-end"><button type="button" onClick={() => onOpenCallRecord(record.callId)} className="inline-flex items-center gap-1 text-primary hover:underline">查看通话记录<ExternalLink size={12} /></button></div></td></tr>)}{!rows.length && <tr><td colSpan={5} className="px-5 py-14 text-center text-sm text-slate-400">当前条件下没有调查记录</td></tr>}</tbody></table></div>
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500"><span>共 {records.length} 条</span><div className="flex gap-2"><button type="button" disabled={currentPage <= 1} onClick={() => setPage(value => value - 1)} className="rounded border px-2 py-1 disabled:opacity-40">上一页</button><span>{currentPage} / {pageCount}</span><button type="button" disabled={currentPage >= pageCount} onClick={() => setPage(value => value + 1)} className="rounded border px-2 py-1 disabled:opacity-40">下一页</button></div></div>
    </section>
  </div>;
};

export default SatisfactionSurveyReport;
