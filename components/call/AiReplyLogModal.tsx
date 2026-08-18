
// AI 回复日志弹窗，用于在通话详情中回看单轮回复的完整链路审计。
import React, { useMemo, useState } from 'react';
import { Copy, X } from 'lucide-react';

export type AiReplyLogScenario = 'tool' | 'knowledge';

export interface AiReplyLogData {
  scenario: AiReplyLogScenario;
  callId: string;
  turnName: string;
  time: string;
  userInput: string;
  assistantOutput: string;
  modelName: string;
  triggerType: string;
  topicName: string;
  flowName: string;
  stepName: string;
  firstResponseMs: string;
  totalMs: string;
}

interface AiReplyLogModalProps {
  log: AiReplyLogData | null;
  onClose: () => void;
}

type Row = [string, string];
type TableRow = Record<string, string>;

type FullLog = {
  summary: Row[];
  input: Row[];
  understanding: { rows: Row[]; entities: TableRow[]; variables: TableRow[]; extractionPrompt: string; extractionResult: string };
  flow: { rows: Row[]; edges: TableRow[]; nodePrompt: string };
  kt: { rows: Row[]; chunks: TableRow[]; tools: TableRow[]; rawToolResult: string };
  prompt: { rows: Row[]; fullPrompt: string; segments: TableRow[] };
  llm: { rows: Row[]; output: string; rawResponse: string };
  tts: Row[];
};

const tabs = ['概览', '输入', '理解', '流程', '知识/工具', 'Prompt', '模型输出', '播报'] as const;
type LogTab = typeof tabs[number];

const fullPromptTool = `system:
【平台内置安全与合规规则】
你是企业电话语音机器人，只能根据已配置的业务规则、知识库内容和工具返回结果进行回答。不要编造不存在的岗位、薪资、福利、客户名称、政策例外或实时状态。

【语音通道基础规则】
回答要短、自然、口语化，适合电话播报。默认不要超过三十个字。用户打断或纠正信息时，以用户最新表达为准。

【机器人主提示词】
你是聚思鸿招聘助手，负责通过电话和求职者沟通，目标是推荐合适岗位并推进面试。推荐岗位前尽量确认意向城市、语言技能和最高学历。你只能基于 search_jobs 工具返回的岗位推荐。

【当前主题配置】
主题：岗位推荐。主题目标：识别用户要看的城市、语言、学历或岗位方向；如果关键字段变化，需要重新查询岗位。

【当前流程配置】
流程：招聘推荐流程。当前步骤：查询岗位。步骤目标：基于用户最新意向城市、语言和学历调用 search_jobs，拿到岗位后用一句话推荐。

【客户记忆】
最近意向城市：大连。语言技能：日语。最高学历：大专。上次沟通：用户想找客服岗位。

【变量事实】
意向城市：苏州。语言技能：日语。最高学历：大专。岗位方向：客服岗位。信息变化：意向城市从大连更新为苏州，因此本轮必须重新查询岗位。

【知识召回内容】
chunk_job_req_001：日语客服岗位通常关注基础日语沟通能力、普通话表达、服务意识和抗压能力。
chunk_interview_002：电话初筛通过后，招聘顾问会继续沟通岗位细节和面试安排。

【工具调用结果】
工具：search_jobs。入参：city=苏州，language=日语，education=大专，jobDirection=客服。返回结果：匹配到 1 个岗位：苏州日语客服。

【历史对话】
用户：我想找大连的岗位。
助手：请问您会什么语言？
用户：日语。
助手：最高学历是什么？
用户：大专。
用户：我想看苏州日语岗位。

【当前用户输入】
我想看苏州日语岗位。

【本轮输出要求】
只输出给用户听的自然话术，不输出内部字段、JSON、工具名或分析过程。`;

const fullPromptKnowledge = `system:
【平台内置安全与合规规则】
你是企业电话语音机器人，必须依据配置、知识库和工具返回内容回答。不要承诺未经确认的薪资、补贴、排班、社保、公积金、奖金或客户信息。

【语音通道基础规则】
回答要短、自然、口语化，适合电话播报。用户问岗位要求时，优先给概括性说明。

【机器人主提示词】
你是聚思鸿招聘助手，负责和求职者电话沟通。你的目标是让用户了解岗位并推进到面试或转人工顾问。

【当前主题配置】
主题：岗位了解。主题目标：回答用户关于已推荐岗位的基础要求、方向和后续流程。

【当前流程配置】
流程：招聘推荐流程。当前步骤：介绍岗位。步骤目标：基于已推荐的岗位和知识库召回内容，用简短话术回答“岗位有什么要求”。

【客户记忆】
用户最近关注：苏州日语客服。最高学历：大专。偏好：电话沟通简短直接。

【变量事实】
意向城市：苏州。语言技能：日语。最高学历：大专。已推荐岗位：苏州日语客服。用户意图：了解岗位要求。

【知识召回内容】
chunk_job_req_001：日语客服岗位通常关注日语基础沟通、普通话表达、服务意识、学习能力和抗压能力。
chunk_process_002：基础客服岗位重视沟通能力、抗压能力和工作意愿。
chunk_sensitive_003：薪资、排班、合同、试用期、社保、公积金、奖金等敏感细节，应建议用户联系招聘专员或面试时确认。

【工具调用结果】
本轮未调用新工具。沿用上一轮 search_jobs 返回的岗位：苏州日语客服。

【历史对话】
用户：我想看苏州日语岗位。
助手：按您的情况，苏州这边有日语客服岗位。您想了解吗？
用户：这个岗位有什么要求？

【当前用户输入】
这个岗位有什么要求？

【本轮输出要求】
请直接回答岗位要求，控制在一句到两句话，适合电话播报。不要说“根据知识库”。`;

// 生成完整日志 mock：工具调用型回复和知识召回型回复。
const buildFullLog = (log: AiReplyLogData): FullLog => {
  const isTool = log.scenario === 'tool';
  return {
    summary: [
      ['会话 ID', log.callId], ['轮次 ID', isTool ? 'turn_12' : 'turn_13'], ['消息 ID', isTool ? 'msg_12' : 'msg_13'], ['触发时间', log.time],
      ['用户输入', log.userInput], ['AI 回复', log.assistantOutput], ['触发类型', log.triggerType], ['当前主题', log.topicName],
      ['当前流程', log.flowName], ['当前步骤', log.stepName], ['模型名称', log.modelName], ['首响耗时', log.firstResponseMs], ['总耗时', log.totalMs], ['状态', '成功'],
    ],
    input: [
      ['用户原始文本', log.userInput], ['ASR final 文本', log.userInput], ['ASR 置信度', isTool ? '0.94' : '0.92'], ['是否打断', '否'],
      ['被打断内容', '-'], ['输入时间', log.time], ['上一轮 AI 播报状态', '播放完成'],
    ],
    understanding: {
      rows: [['识别主题', log.topicName], ['主题置信度', isTool ? '0.91' : '0.84'], ['意图', isTool ? '岗位咨询' : '岗位要求'], ['意图置信度', isTool ? '0.88' : '0.86']],
      entities: isTool
        ? [{ 实体: '城市', 值: '苏州', 状态: 'confirmed' }, { 实体: '语言', 值: '日语', 状态: 'confirmed' }, { 实体: '岗位意向', 值: '客服岗位', 状态: 'confirmed' }]
        : [{ 实体: '岗位要求', 值: '日语客服要求', 状态: 'confirmed' }],
      variables: isTool
        ? [{ 变量: '意向城市', 旧值: '大连', 新值: '苏州', 来源: '实体抽取' }, { 变量: '语言技能', 旧值: '未填写', 新值: '日语', 来源: '实体抽取' }]
        : [{ 变量: '用户问题类型', 旧值: '未填写', 新值: '岗位要求', 来源: '实体抽取' }],
      extractionPrompt: isTool ? '# 目标\n基于历史对话提取用户本轮提到的招聘参数。\n# 输出\n仅输出 JSON。' : '# 目标\n提取用户询问的岗位相关问题类型。\n# 输出\n仅输出 JSON。',
      extractionResult: isTool ? '{"城市":"苏州","语言":"日语","岗位方向":"客服岗位"}' : '{"用户问题类型":"岗位要求"}',
    },
    flow: {
      rows: [['当前流程', log.flowName], ['当前节点', log.stepName], ['节点 Prompt', isTool ? '基于最新城市、语言、学历调用岗位搜索工具。' : '基于已推荐岗位和知识库回答岗位要求。']],
      edges: isTool
        ? [{ 命中边: '城市已变更', 条件表达式: 'city_changed=true', 输入值: '大连→苏州', 判断结果: 'true', 跳转目标: '查询岗位' }, { 命中边: '信息已完整', 条件表达式: 'city && language && education', 输入值: '缺少语言、学历', 判断结果: 'false', 跳转目标: '继续收集信息' }]
        : [{ 命中边: '询问岗位要求', 条件表达式: 'intent=job_requirement', 输入值: '岗位有什么要求', 判断结果: 'true', 跳转目标: '介绍岗位' }],
      nodePrompt: isTool ? '请先确认岗位关键字段，如字段完整则调用 search_jobs。' : '请结合知识库，用电话口吻说明岗位基础要求。',
    },
    kt: {
      rows: [['是否检索', '是'], ['检索 query', isTool ? '苏州日语客服岗位要求' : '苏州日语客服岗位要求'], ['命中知识库', '招聘岗位知识库']],
      chunks: isTool
        ? [{ 召回文档: '苏州日语客服岗位说明.md', 召回片段: '日语客服岗位关注日语基础沟通、普通话表达、服务意识和抗压能力。', 相似度: '0.82', 是否进入Prompt: '是' }, { 召回文档: '招聘流程通用说明.md', 召回片段: '薪资排班合同等细节建议面试或招聘顾问确认。', 相似度: '0.76', 是否进入Prompt: '是' }]
        : [{ 召回文档: '苏州日语客服岗位说明.md', 召回片段: '岗位关注日语基础沟通、普通话表达、服务意识、学习能力和抗压能力。', 相似度: '0.84', 是否进入Prompt: '是' }, { 召回文档: '敏感信息回复规则.md', 召回片段: '薪资、排班、合同、社保等敏感细节应建议面试确认。', 相似度: '0.78', 是否进入Prompt: '是' }],
      tools: isTool
        ? [{ 候选工具: 'search_jobs / send_sms / transfer', 实际调用工具: 'search_jobs', 工具入参: '{"city":"苏州","language":"日语","education":"大专"}', 工具结果摘要: '匹配到 1 个岗位：苏州日语客服', 是否进入Prompt: '是', 工具耗时: '230ms', 工具状态: 'success' }]
        : [{ 候选工具: 'send_sms / transfer', 实际调用工具: '未调用', 工具入参: '-', 工具结果摘要: '沿用上一轮岗位结果', 是否进入Prompt: '是', 工具耗时: '-', 工具状态: 'skipped' }],
      rawToolResult: isTool ? '{"jobs":[{"name":"苏州日语客服","city":"苏州","language":"日语","education":"大专及以上","recommendable":true}]}' : '{"toolCalls":[]}',
    },
    prompt: {
      rows: [['最终发送给模型的 Prompt', isTool ? '工具调用型回复完整 Prompt' : '知识召回型回复完整 Prompt'], ['Prompt token', isTool ? '1280' : '1120'], ['messages 数量', '2'], ['是否截断', '否']],
      fullPrompt: isTool ? fullPromptTool : fullPromptKnowledge,
      segments: [
        { 顺序: '1', 来源: '系统内置', role: 'system', 名称: '安全与合规规则', 是否使用: '是', token: '220', 内容预览: '不要编造不存在的信息。' },
        { 顺序: '2', 来源: '语音通道', role: 'system', 名称: '电话播报规则', 是否使用: '是', token: '180', 内容预览: '回答短、自然、口语化。' },
        { 顺序: '3', 来源: '机器人配置', role: 'system', 名称: '机器人主提示词', 是否使用: '是', token: '360', 内容预览: '你是聚思鸿招聘助手。' },
        { 顺序: '4', 来源: '流程配置', role: 'user', 名称: '当前节点 Prompt', 是否使用: '是', token: '160', 内容预览: log.stepName },
        { 顺序: '5', 来源: '客户记忆', role: 'user', 名称: '客户长期记忆', 是否使用: '是', token: '90', 内容预览: '城市、语言、学历、偏好。' },
        { 顺序: '6', 来源: '知识库', role: 'user', 名称: '知识召回内容', 是否使用: '是', token: '220', 内容预览: '岗位要求与敏感回复规则。' },
        { 顺序: '7', 来源: '工具', role: 'user', 名称: '工具调用结果', 是否使用: isTool ? '是' : '否', token: isTool ? '120' : '0', 内容预览: isTool ? 'search_jobs 返回岗位。' : '本轮未调用工具。' },
        { 顺序: '8', 来源: '用户输入', role: 'user', 名称: '当前用户输入', 是否使用: '是', token: '40', 内容预览: log.userInput },
      ],
    },
    llm: {
      rows: [['模型名称', log.modelName], ['是否流式', '是'], ['首 token 耗时', log.firstResponseMs], ['总耗时', log.totalMs], ['finishReason', 'stop'], ['promptTokens', isTool ? '1280' : '1120'], ['completionTokens', isTool ? '32' : '18'], ['totalTokens', isTool ? '1312' : '1138']],
      output: log.assistantOutput,
      rawResponse: JSON.stringify({ id: isTool ? 'chatcmpl_tool_001' : 'chatcmpl_knowledge_001', model: log.modelName, choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: log.assistantOutput } }] }, null, 2),
    },
    tts: [['播报文本', log.assistantOutput], ['TTS 音色', 'xiaomei'], ['TTS 首包耗时', isTool ? '180ms' : '160ms'], ['是否播报', '是'], ['是否被打断', '否'], ['播放完成时间', '2026-06-22 19:06:36']],
  };
};

const KeyValueGrid = ({ rows }: { rows: Row[] }) => <div className="grid grid-cols-[140px_1fr] gap-3 text-sm">{rows.map(([label, value]) => <React.Fragment key={label}><div className="text-slate-500">{label}</div><div className="text-slate-800 break-words">{value}</div></React.Fragment>)}</div>;
const DataTable = ({ rows }: { rows: TableRow[] }) => rows.length ? <div className="overflow-x-auto"><table className="w-full text-xs border border-slate-100"><thead className="bg-slate-50 text-slate-500"><tr>{Object.keys(rows[0]).map(key => <th key={key} className="text-left px-3 py-2 font-medium whitespace-nowrap">{key}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-t border-slate-100">{Object.values(row).map((value, cellIndex) => <td key={cellIndex} className="px-3 py-2 align-top text-slate-700">{value}</td>)}</tr>)}</tbody></table></div> : null;

export default function AiReplyLogModal({ log, onClose }: AiReplyLogModalProps) {
  const [activeTab, setActiveTab] = useState<LogTab>('概览');
  const [showJson, setShowJson] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const fullLog = useMemo(() => log ? buildFullLog(log) : null, [log]);

  if (!log || !fullLog) return null;

  const currentJson = { scenario: log.scenario === 'tool' ? '工具调用型回复' : '知识召回型回复', tab: activeTab, data: fullLog };

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(JSON.stringify(currentJson, null, 2));
      setCopyStatus('success');
    } catch {
      setCopyStatus('failed');
    }
    window.setTimeout(() => setCopyStatus('idle'), 1600);
  };

  const renderPane = () => {
    if (activeTab === '概览') return <KeyValueGrid rows={fullLog.summary} />;
    if (activeTab === '输入') return <KeyValueGrid rows={fullLog.input} />;
    if (activeTab === '理解') return <div className="space-y-4"><KeyValueGrid rows={fullLog.understanding.rows} /><h4 className="font-bold text-slate-800">实体抽取结果</h4><DataTable rows={fullLog.understanding.entities} /><h4 className="font-bold text-slate-800">变量变化</h4><DataTable rows={fullLog.understanding.variables} /><div className="bg-slate-900 text-blue-50 rounded-xl p-4 text-xs whitespace-pre-wrap">{fullLog.understanding.extractionPrompt}</div><div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">{fullLog.understanding.extractionResult}</div></div>;
    if (activeTab === '流程') return <div className="space-y-4"><KeyValueGrid rows={fullLog.flow.rows} /><DataTable rows={fullLog.flow.edges} /><div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm">节点 Prompt：{fullLog.flow.nodePrompt}</div></div>;
    if (activeTab === '知识/工具') return <div className="space-y-4"><KeyValueGrid rows={fullLog.kt.rows} /><h4 className="font-bold text-slate-800">知识召回</h4><DataTable rows={fullLog.kt.chunks} /><h4 className="font-bold text-slate-800">工具调用</h4><DataTable rows={fullLog.kt.tools} /><div className="bg-slate-950 text-slate-100 rounded-xl p-4 text-xs whitespace-pre-wrap">工具原始返回\n{fullLog.kt.rawToolResult}</div></div>;
    if (activeTab === 'Prompt') return <div className="space-y-4"><KeyValueGrid rows={fullLog.prompt.rows} /><h4 className="font-bold text-slate-800">Prompt 拼接明细</h4><DataTable rows={fullLog.prompt.segments} /><textarea className="w-full min-h-[360px] border border-slate-200 rounded-xl p-4 text-xs font-mono leading-6" readOnly value={fullLog.prompt.fullPrompt} /></div>;
    if (activeTab === '模型输出') return <div className="space-y-4"><KeyValueGrid rows={fullLog.llm.rows} /><div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm">{fullLog.llm.output}</div><pre className="bg-slate-950 text-slate-100 rounded-xl p-4 text-xs overflow-auto">{fullLog.llm.rawResponse}</pre></div>;
    return <KeyValueGrid rows={fullLog.tts} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-6xl max-h-[88vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">AI回复日志｜{log.turnName}</h3>
            <p className="text-xs text-slate-500 mt-1">{log.scenario === 'tool' ? '工具调用型回复' : '知识召回型回复'}｜{log.modelName}｜success</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-1"><Copy size={14} />复制日志</button>
            <button onClick={() => setShowJson(prev => !prev)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">查看原始JSON</button>
            {copyStatus === 'success' && <span className="text-xs text-emerald-600">已复制</span>}
            {copyStatus === 'failed' && <span className="text-xs text-red-500">复制失败</span>}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
          </div>
        </div>
        <div className="px-4 py-2 border-b border-slate-100 flex gap-1 overflow-x-auto">{tabs.map(tab => <button key={tab} onClick={() => { setActiveTab(tab); setShowJson(false); }} className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${activeTab === tab ? 'bg-blue-50 text-primary font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}>{tab}</button>)}</div>
        <div className="p-5 overflow-y-auto space-y-4">{renderPane()}{showJson && <pre className="bg-slate-950 text-slate-100 rounded-xl p-4 text-xs overflow-auto">{JSON.stringify(currentJson, null, 2)}</pre>}</div>
      </div>
    </div>
  );
}
