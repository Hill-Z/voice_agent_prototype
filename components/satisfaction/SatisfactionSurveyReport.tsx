// 满意度报表：只保留触发、完成率、满意度、项目汇总和明细。
import React, { useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { BotConfiguration, SatisfactionSurvey } from '../../types';
import { SATISFACTION_RESPONSE_RECORDS } from './satisfactionData';

interface Props { surveys: SatisfactionSurvey[]; bots: BotConfiguration[]; onOpenCallRecord: (callId: string) => void; }
const fieldClass = 'rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600';

const SatisfactionSurveyReport: React.FC<Props> = ({ surveys, bots, onOpenCallRecord }) => {
  const [surveyId, setSurveyId] = useState('all');
  const [botId, setBotId] = useState('all');
  const [mode, setMode] = useState('all');
  const [status, setStatus] = useState('all');
  const [keyword, setKeyword] = useState('');
  const records = useMemo(() => SATISFACTION_RESPONSE_RECORDS.filter(record => (surveyId === 'all' || record.surveyId === surveyId) && (botId === 'all' || record.botId === botId) && (mode === 'all' || record.mode === mode) && (status === 'all' || record.status === status) && (!keyword.trim() || `${record.callId}${record.feedback || ''}`.toLowerCase().includes(keyword.trim().toLowerCase()))), [surveyId, botId, mode, status, keyword]);
  const completed = records.filter(record => record.status === 'completed');
  const scored = completed.filter(record => typeof record.score === 'number');
  const satisfied = scored.filter(record => (record.score || 0) >= 4).length;
  const completionRate = records.length ? completed.length / records.length * 100 : 0;
  const satisfactionRate = scored.length ? satisfied / scored.length * 100 : 0;
  const visibleSurveys = surveyId === 'all' ? surveys : surveys.filter(item => item.id === surveyId);
  const items = visibleSurveys.flatMap(survey => survey.questions.map((question, index) => ({ id: `${survey.id}_${question.id}`, survey: survey.name, question: question.title, count: Math.max(0, Math.round((records.filter(record => record.surveyId === survey.id && record.status === 'completed').length || survey.responseCount) * (1 - index * 0.04))), result: question.type === 'open_text' ? '原因回答' : question.options?.map(option => option.label).join('、') || '评分分布' })));

  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-4"><select className={fieldClass}><option>最近 7 天</option><option>最近 30 天</option></select><select value={botId} onChange={event => setBotId(event.target.value)} className={fieldClass}><option value="all">全部机器人</option>{bots.map(bot => <option key={bot.id} value={bot.id}>{bot.name}</option>)}</select><select value={surveyId} onChange={event => setSurveyId(event.target.value)} className={fieldClass}><option value="all">全部调查</option>{surveys.map(survey => <option key={survey.id} value={survey.id}>{survey.name}</option>)}</select><select value={mode} onChange={event => setMode(event.target.value)} className={fieldClass}><option value="all">全部采集方式</option><option value="voice_agent">语音智能体</option><option value="ivr">IVR</option></select><select value={status} onChange={event => setStatus(event.target.value)} className={fieldClass}><option value="all">全部结果</option><option value="completed">已完成</option><option value="abandoned">未完成</option></select><div className="relative min-w-[220px] flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={keyword} onChange={event => setKeyword(event.target.value)} className="w-full rounded border border-slate-200 py-2 pl-9 pr-3 text-sm" placeholder="搜索 Call ID 或原因" /></div></div>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">{[['调查触发', records.length.toLocaleString(), '进入调查流程的通话'], ['完成率', `${completionRate.toFixed(1)}%`, `${completed.length} 条有效回答`], ['满意度', scored.length ? `${satisfactionRate.toFixed(1)}%` : '-', '满意回答占有效评分']].map(card => <div key={card[0]} className="rounded-lg border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">{card[0]}</div><div className="mt-2 text-2xl font-bold text-slate-900">{card[1]}</div><div className="mt-1 text-xs text-slate-400">{card[2]}</div></div>)}</div>
    <section className="rounded-lg border border-slate-200 bg-white"><div className="border-b px-5 py-4"><h3 className="text-sm font-bold text-slate-800">评价项目汇总</h3><p className="mt-1 text-xs text-slate-500">各调查项目分别汇总，不混合不同机器人的问题和选项。</p></div><table className="w-full text-left"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">调查</th><th className="px-5 py-3">评价项目</th><th className="px-5 py-3">有效回答</th><th className="px-5 py-3">结果内容</th></tr></thead><tbody className="divide-y">{items.map(item => <tr key={item.id} className="text-sm"><td className="px-5 py-3 text-slate-600">{item.survey}</td><td className="px-5 py-3 font-medium text-slate-800">{item.question}</td><td className="px-5 py-3 text-slate-600">{item.count.toLocaleString()}</td><td className="px-5 py-3 text-slate-500">{item.result}</td></tr>)}</tbody></table></section>
    <section className="rounded-lg border border-slate-200 bg-white"><div className="border-b px-5 py-4"><h3 className="text-sm font-bold text-slate-800">调查明细</h3></div><table className="w-full text-left"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">时间</th><th className="px-5 py-3">机器人</th><th className="px-5 py-3">调查</th><th className="px-5 py-3">结果</th><th className="px-5 py-3">回答 / 原因</th><th className="px-5 py-3 text-right">通话</th></tr></thead><tbody className="divide-y">{records.map(record => <tr key={record.id} className="text-sm"><td className="px-5 py-3 text-slate-500">{record.time}</td><td className="px-5 py-3 text-slate-600">{record.botName}</td><td className="px-5 py-3 text-slate-600">{record.surveyName}</td><td className="px-5 py-3 text-slate-600">{record.status === 'completed' ? '已完成' : '未完成'}</td><td className="px-5 py-3 text-slate-500">{typeof record.score === 'number' ? `${record.score} 分` : '-'}{record.feedback ? ` · ${record.feedback}` : ''}</td><td className="px-5 py-3 text-right"><button type="button" onClick={() => onOpenCallRecord(record.callId)} className="inline-flex items-center gap-1 text-primary">查看<ExternalLink size={12} /></button></td></tr>)}</tbody></table></section>
  </div>;
};

export default SatisfactionSurveyReport;
