import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Volume2, Download, Edit, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Plus, FileSearch, CheckCircle2 } from 'lucide-react';
import AiReplyLogModal, { AiReplyLogData, AiReplyLogScenario } from './AiReplyLogModal';
import { SatisfactionSurveyResult } from '../../types';
import { INITIAL_SATISFACTION_SURVEYS, SATISFACTION_RESPONSE_RECORDS, SatisfactionResponseRecord, resolvePrimaryQuestionId, resolveSurveyQuestions } from '../satisfaction/satisfactionData';
import BillingBasisPanel, { type RateBasisSubject } from '../billing/BillingBasisPanel';
import { BILLING_CALL_ROWS } from '../billing/billingData';
import { centsToYuan, formatPricePerMin } from '../billing/billingEngine';

// 变量分类与「变量配置」页的四个页签一一对应，id 和顺序都保持一致；
// 展示名统一规整为「输入变量 / 对话变量 / 提取变量 / 实体」，不带「话术」前缀。
type VariableCategory = 'INPUT' | 'CONVERSATION' | 'EXTRACTION' | 'ENTITY';

const VARIABLE_CATEGORIES: { id: VariableCategory; label: string }[] = [
  { id: 'INPUT', label: '输入变量' },
  { id: 'CONVERSATION', label: '对话变量' },
  { id: 'EXTRACTION', label: '提取变量' },
  { id: 'ENTITY', label: '实体' },
];

// 本次通话中用到的变量：只记录真正参与过这通电话的变量，没用到的不进这个列表。
interface CallVariableUsage {
  category: VariableCategory;
  name: string;   // 变量名，取变量配置页里的中文说明；实体取实体名
  value: string;  // 本次通话中这个变量的取值
}

interface CallDetail {
  callId: string;
  startTime: string;
  endTime: string;
  duration: string;
  rounds: number;
  company: string;
  dialogues: {
    timestamp: string;
    content: string;
    isUser: boolean;
    tag?: string;
    model?: string;
    offsetSeconds: number;
  }[];
  labels: string[];
  emotionLabels: string[];
  audioFiles: {
    type: string;
    duration: string;
    url: string;
  }[];
  satisfactionSurveyResult?: SatisfactionSurveyResult;
  variableUsages: CallVariableUsage[];
}

const MOCK_CALL_DETAIL: CallDetail = {
  callId: '4cb67f3a-6d81-4033-bb5f-a3cf8292a2e5',
  startTime: '2026-03-20 14:29:23',
  // 结束时间 = 开始时间 + 3 分 49 秒，跟下面的 duration 对得上。
  endTime: '2026-03-20 14:33:12',
  duration: '3分49秒',
  rounds: 23,
  company: '湖南壹行网络科技',
  dialogues: [
    {
      timestamp: '2026-03-20 14:29:30',
      content: '您好，壹行客服为您服务。',
      isUser: false,
      tag: '大模型智能体',
      model: 'gpt-4',
      offsetSeconds: 7,
    },
    {
      timestamp: '2026-03-20 14:29:35',
      content: '你好。',
      isUser: true,
      offsetSeconds: 12,
    },
    {
      timestamp: '2026-03-20 14:29:36',
      content: '您好，欢迎致电壹行汽车客服热线，我是您的智能语音助手，请问有什么可以帮助您的？',
      isUser: false,
      tag: '大模型智能体',
      model: 'gpt-4',
      offsetSeconds: 13,
    },
    {
      timestamp: '2026-03-20 14:29:40',
      content: '我想咨询一下你们的汽车保险服务。',
      isUser: true,
      offsetSeconds: 17,
    },
    {
      timestamp: '2026-03-20 14:29:45',
      content: '好的，我们提供多种汽车保险方案，包括交强险、商业险、第三者责任险等。请问您是需要了解哪一种保险的具体详情呢？',
      isUser: false,
      tag: '大模型智能体',
      model: 'gpt-4',
      offsetSeconds: 22,
    },
    {
      timestamp: '2026-03-20 14:29:50',
      content: '商业险有哪些具体的险种？',
      isUser: true,
      offsetSeconds: 27,
    },
    {
      timestamp: '2026-03-20 14:29:55',
      content: '商业险主要包括车辆损失险、第三者责任险、车上人员责任险、盗抢险、玻璃单独破碎险、自燃损失险、车身划痕险等。不同的险种保障范围不同，您可以根据自己的需求选择适合的保险方案。',
      isUser: false,
      tag: '大模型智能体',
      model: 'gpt-4',
      offsetSeconds: 32,
    }
  ],
  labels: ['B5R（可能有意向）'],
  emotionLabels: [],
  audioFiles: [
    {
      type: '振铃音',
      duration: '00:04',
      url: 'ring.mp3'
    },
    // 两段 AI 通话 116 秒 + 113 秒 = 229 秒，正好是上面的 3 分 49 秒，也是计费用的那 229 秒。
    // 振铃那 4 秒**不算在里面**：计费从接通开始，规则里写明「振铃等待时间不计费」，
    // 把 4 秒算进 229 秒的话，客户把三段加起来一算就会发现「说不计费、实际收了」。
    // （之前两段各写 03:50，加起来比整通电话还长。）
    {
      type: 'AI通话',
      duration: '01:56',
      url: 'ai_call1.mp3'
    },
    {
      type: 'AI通话',
      duration: '01:53',
      url: 'ai_call2.mp3'
    }
  ],
  variableUsages: [
    // 输入变量：通话发起时随任务传入。
    { category: 'INPUT', name: '客户姓名', value: '张先生' },
    { category: 'INPUT', name: '进线渠道', value: '官网在线咨询' },
    { category: 'INPUT', name: '客户等级', value: 'B5R（可能有意向）' },
    // 对话变量：本次通话真正读取或写入过的系统变量，名称与变量配置页的中文说明一致。
    { category: 'CONVERSATION', name: '当前通话 ID', value: '4cb67f3a-6d81-4033-bb5f-a3cf8292a2e5' },
    { category: 'CONVERSATION', name: '当前对话轮次', value: '23' },
    { category: 'CONVERSATION', name: '当前流程 ID', value: 'flow_auto_insurance' },
    { category: 'CONVERSATION', name: '用户上一轮发言', value: '商业险有哪些具体的险种？' },
    // 提取变量：通话中由模型从客户话术里抽出来的值。
    { category: 'EXTRACTION', name: '险种类型', value: '商业险' },
    { category: 'EXTRACTION', name: '车辆用途', value: '家用' },
    { category: 'EXTRACTION', name: '咨询阶段', value: '险种咨询' },
    // 实体：本次通话中真正命中过的实体及其取值，按原文完整展示，不做脱敏。
    { category: 'ENTITY', name: '手机号', value: '13812346621' },
    { category: 'ENTITY', name: '车牌号', value: '湘A·8F2K9' },
  ],
  satisfactionSurveyResult: {
    surveyId: 'survey_after_sales_csat',
    surveyName: '售后服务满意度调查',
    surveyVersion: 3,
    mode: 'voice_agent',
    metricType: 'csat',
    status: 'completed',
    offeredAt: '2026-03-20 14:33:02',
    completedAt: '2026-03-20 14:33:18',
    score: 2,
    feedbackTheme: '语音识别问题',
    sentiment: 'negative',
    answers: [
      { questionId: 'csat_score', question: '请问您对本次服务满意吗？', value: 2, inputMode: 'speech' },
      { questionId: 'csat_reason', question: '方便告诉我本次服务哪里没有做好吗？', value: '机器人一直没听懂我的车牌号，重复问了好几次。', inputMode: 'speech' },
    ],
  },
};

const pad = (value: number) => String(value).padStart(2, '0');

// 转写和录音的时间戳按通话起始时间加秒偏移推算，保证两者对得上。
const formatStamp = (base: number, offsetSeconds: number) => {
  const time = new Date(base + offsetSeconds * 1000);
  return `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())} ${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;
};

// 满意度调查发生在通话结束前，这里把这次调查的问答还原成通话转写，报表按 Call ID 跳过来才能看到对应的通话内容。
const buildCallDetailFromSurvey = (record: SatisfactionResponseRecord): CallDetail => {
  const startedAt = new Date(record.time).getTime();
  const dialogues: CallDetail['dialogues'] = [
    { timestamp: formatStamp(startedAt, 0), content: '您好，感谢您的来电，本次通话即将结束。', isUser: false, tag: '大模型智能体', model: 'gpt-4', offsetSeconds: 0 },
    { timestamp: formatStamp(startedAt, 4), content: '好的。', isUser: true, offsetSeconds: 4 },
  ];
  // 逐题还原成“机器人问、客户答”，客户原话取自调查记录本身。
  record.answers.forEach((answer, index) => {
    const askedAt = 8 + index * 14;
    dialogues.push({ timestamp: formatStamp(startedAt, askedAt), content: answer.question, isUser: false, tag: '满意度调查', model: 'gpt-4', offsetSeconds: askedAt });
    dialogues.push({ timestamp: formatStamp(startedAt, askedAt + 7), content: answer.displayValue, isUser: true, offsetSeconds: askedAt + 7 });
  });
  const closedAt = 12 + record.answers.length * 14;
  dialogues.push({ timestamp: formatStamp(startedAt, closedAt), content: '感谢您的反馈，祝您生活愉快。', isUser: false, tag: '大模型智能体', model: 'gpt-4', offsetSeconds: closedAt });
  const minutes = Math.floor(closedAt / 60);
  const seconds = closedAt % 60;
  return {
    callId: record.callId,
    startTime: formatStamp(startedAt, 0),
    endTime: formatStamp(startedAt, closedAt),
    duration: `${minutes}分${seconds}秒`,
    rounds: dialogues.filter(item => !item.isUser).length,
    company: record.botName,
    dialogues,
    labels: [],
    emotionLabels: [],
    // 这通是从满意度回答反推出来的，没有真实录音，不能编造分段：整通按一段 AI 通话呈现，
    // 也就没有「振铃」这一段可加。硬加一段 4 秒振铃的话，段加起来会比 duration 长 4 秒，
    // 而计费侧用的就是 duration —— 客户一加就能看出「说不计费、实际收了」。
    audioFiles: [
      { type: 'AI通话', duration: `${pad(minutes)}:${pad(seconds)}`, url: `ai_call_${record.callId.slice(0, 8)}.mp3` },
    ],
    // 调查记录里没有变量参与情况：这份通话是从满意度回答反推出来的，不是真实的变量运行轨迹。
    // 侧栏对没用到的变量分类本来就整段不渲染，给空数组正是「这通电话没有记录到变量」，不编造取值。
    variableUsages: [],
  };
};

// 满意度区块统一成一份视图数据：调查记录能给出聚合分类、原因追溯和完成进度，通话自带的旧结果只提供基础信息。
interface SatisfactionView {
  surveyName: string;
  surveyVersion?: number;
  mode: 'ivr' | 'voice_agent';
  completed: boolean;
  offeredAt: string;
  score?: number;
  scoreMax?: number;
  answeredCount: number;
  totalQuestionCount: number;
  answers: Array<{ questionId: string; question: string; value: string; inputMode: string; category?: string; reason?: string; reasonCategory?: string }>;
  feedbackTheme?: string;
}

interface CallRecordDetailProps {
  callId?: string;
}

export default function CallRecordDetail({ callId }: CallRecordDetailProps) {
  // 报表按 Call ID 跳过来，命中调查记录时展示那次调查对应的通话内容，否则回落到示例通话。
  const surveyRecord = useMemo(() => (callId ? SATISFACTION_RESPONSE_RECORDS.find(record => record.callId === callId) : undefined), [callId]);
  const callDetail = useMemo(() => (surveyRecord ? buildCallDetailFromSurvey(surveyRecord) : MOCK_CALL_DETAIL), [surveyRecord]);

  // 跳转过来、但通话记录里还没录入这一通的详情时，页面会回落到示例通话。
  // 这种时候页面上显示的时长、对话内容都来自另一通电话，计费金额当然也不对应，
  // 所以宁可整块不显示，也不能让客户看到「一通电话配着另一通的金额」。
  const detailMatchesRequest = !callId || callDetail.callId === callId;

  // 这通电话的计费信息按 Call ID 从计费中心取，不写进通话记录本身的数据结构：
  // 计费是独立一份账，通话记录只负责展示，两边各自演进、互不拖累。
  // 取不到表示这通电话没有计费记录，此时整块扣费信息都不展示（与「本通没用到某类变量就不展示」同一套做法）。
  const billingRow = useMemo(
    () => (detailMatchesRequest ? BILLING_CALL_ROWS.find((row) => row.record.callId === callDetail.callId) : undefined),
    [detailMatchesRequest, callDetail.callId],
  );
  const [isBillingBasisOpen, setIsBillingBasisOpen] = useState(false);
  const billingSubject = useMemo<RateBasisSubject | null>(() => {
    if (!billingRow) return null;
    return {
      snapshot: billingRow.record.snapshot,
      title: billingRow.robotName,
      subtitle: `${billingRow.startedAt} · 通话记录`,
      call: billingRow.record,
    };
  }, [billingRow]);

  // 满意度区块优先用调查记录渲染：记录里带着逐题聚合分类、原因追溯和完成进度。
  const satisfactionView = useMemo<SatisfactionView | undefined>(() => {
    if (surveyRecord) {
      const survey = INITIAL_SATISFACTION_SURVEYS.find(item => item.id === surveyRecord.surveyId);
      const primaryQuestion = survey ? resolveSurveyQuestions(survey).find(question => question.id === resolvePrimaryQuestionId(survey)) : undefined;
      const primaryAnswer = primaryQuestion ? surveyRecord.answers.find(answer => answer.questionId === primaryQuestion.id) : undefined;
      return {
        surveyName: surveyRecord.surveyName, surveyVersion: survey?.version, mode: surveyRecord.mode,
        completed: surveyRecord.status === 'completed', offeredAt: surveyRecord.time,
        score: primaryQuestion?.type === 'rating' && primaryAnswer ? Number(primaryAnswer.rawValue) : undefined,
        scoreMax: primaryQuestion?.scaleMax,
        answeredCount: surveyRecord.answeredCount, totalQuestionCount: surveyRecord.totalQuestionCount,
        answers: surveyRecord.answers.map(answer => ({
          questionId: answer.questionId, question: answer.question, value: answer.displayValue,
          inputMode: surveyRecord.mode === 'ivr' ? '按键输入' : '语音回答',
          category: answer.category, reason: answer.reason, reasonCategory: answer.reasonCategory,
        })),
      };
    }
    const fallback = callDetail.satisfactionSurveyResult;
    if (!fallback) return undefined;
    return {
      surveyName: fallback.surveyName, surveyVersion: fallback.surveyVersion, mode: fallback.mode,
      completed: fallback.status === 'completed', offeredAt: fallback.offeredAt,
      score: fallback.score, scoreMax: 5,
      answeredCount: fallback.answers.length, totalQuestionCount: fallback.answers.length,
      answers: fallback.answers.map(answer => ({
        questionId: answer.questionId, question: answer.question,
        value: typeof answer.value === 'number' ? `${answer.value} 分` : String(answer.value),
        inputMode: answer.inputMode === 'dtmf' ? '按键输入' : '语音回答',
      })),
      feedbackTheme: fallback.feedbackTheme,
    };
  }, [surveyRecord, callDetail]);
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null);
  const [debugMode, setDebugMode] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    '客户意向标签': true,
    '标签': true,
    '情绪标签': true,
    '输入变量': true,
    '对话变量': true,
    '提取变量': true,
    '实体': true,
  });
  const [addingToTestCase, setAddingToTestCase] = useState<boolean>(false);
  const [addSuccess, setAddSuccess] = useState<boolean>(false);
  const [selectedAiLog, setSelectedAiLog] = useState<AiReplyLogData | null>(null);
  const [activeAudioIndex, setActiveAudioIndex] = useState<number | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [activeDialogueIndex, setActiveDialogueIndex] = useState<number | null>(null);
  const dialogueRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (activeAudioIndex === null || callDetail.audioFiles[activeAudioIndex]?.type !== 'AI通话') return;
    const seconds = Math.round((playbackProgress / 100) * 230);
    const targetIndex = callDetail.dialogues.reduce((current, dialogue, index) => (
      dialogue.offsetSeconds <= seconds ? index : current
    ), 0);
    setActiveDialogueIndex((currentIndex) => {
      if (currentIndex !== targetIndex) {
        requestAnimationFrame(() => dialogueRefs.current[targetIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      }
      return targetIndex;
    });
  }, [activeAudioIndex, playbackProgress, callDetail.audioFiles, callDetail.dialogues]);

  useEffect(() => {
    if (playingAudioIndex === null) return;
    const currentAudio = callDetail.audioFiles[playingAudioIndex];
    if (currentAudio?.type !== 'AI通话') {
      const timeoutId = window.setTimeout(() => setPlayingAudioIndex(null), 3000);
      return () => window.clearTimeout(timeoutId);
    }

    const intervalId = window.setInterval(() => {
      setPlaybackProgress((currentProgress) => {
        const nextProgress = Math.min(100, currentProgress + 0.5);
        if (nextProgress >= 100) setPlayingAudioIndex(null);
        return nextProgress;
      });
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [playingAudioIndex, callDetail.audioFiles]);

  const syncAudioByDialogue = (dialogueIndex: number) => {
    const audioIndex = callDetail.audioFiles.findIndex((audio) => audio.type === 'AI通话');
    if (audioIndex < 0) return;
    setActiveDialogueIndex(dialogueIndex);
    setActiveAudioIndex(audioIndex);
    setPlaybackProgress(Math.min(100, (callDetail.dialogues[dialogueIndex].offsetSeconds / 230) * 100));
    setPlayingAudioIndex(audioIndex);
  };

  const togglePlay = (audioIndex: number) => {
    if (playingAudioIndex === audioIndex) {
      setPlayingAudioIndex(null);
      return;
    }

    setPlayingAudioIndex(audioIndex);
    if (callDetail.audioFiles[audioIndex]?.type === 'AI通话') {
      setActiveAudioIndex(audioIndex);
      if (activeAudioIndex !== audioIndex || playbackProgress >= 100) setPlaybackProgress(0);
    }
  };

  const handleEditCustomerInfo = () => {
    // 编辑客户信息
    console.log('编辑客户信息');
  };

  const handlePrevRecord = () => {
    // 查看上一条记录
    console.log('上一条记录');
  };

  const handleNextRecord = () => {
    // 查看下一条记录
    console.log('下一条记录');
  };

  const handleDownloadText = () => {
    // 下载文本
    console.log('下载文本');
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };


  // 打开某一轮 AI 回复日志，展示模型回复链路。
  const handleOpenAiLog = (dialogueIndex: number) => {
    const scenario: AiReplyLogScenario = dialogueIndex <= 2 ? 'tool' : 'knowledge';
    const dialogue = callDetail.dialogues[dialogueIndex];
    const previousUser = [...callDetail.dialogues.slice(0, dialogueIndex)].reverse().find(item => item.isUser);
    setSelectedAiLog({
      scenario,
      callId: callId || callDetail.callId,
      turnName: `Turn ${dialogueIndex + 1}`,
      time: dialogue.timestamp,
      userInput: previousUser?.content || '开场白',
      assistantOutput: dialogue.content,
      modelName: dialogue.model || 'qwen-plus',
      triggerType: dialogue.tag || '大模型触发',
      topicName: scenario === 'tool' ? '岗位推荐' : '岗位了解',
      flowName: '招聘推荐流程',
      stepName: scenario === 'tool' ? '查询岗位' : '介绍岗位',
      firstResponseMs: dialogueIndex % 2 === 0 ? '420ms' : '390ms',
      totalMs: dialogueIndex % 2 === 0 ? '1200ms' : '860ms',
    });
  };

  const handleAddToTestCase = () => {
    // 将通话记录添加到测试用例
    const currentCallId = callId || callDetail.callId;
    console.log('添加通话记录到测试用例:', currentCallId);
    
    // 构建测试用例数据
    const testCaseData = {
      id: `case_${Date.now()}`,
      name: `通话记录-${currentCallId.substring(0, 8)}`,
      suiteName: '通话记录测试集',
      sourceTag: '通话记录',
      conversations: callDetail.dialogues
        .filter((_, index) => index % 2 === 1) // 只取用户输入
        .map((dialogue, index) => {
          const userInput = dialogue.content;
          const aiResponse = callDetail.dialogues[index * 2 + 2]?.content || '';
          
          return {
            id: `conv_${Date.now()}_${index}`,
            userInput,
            expectedResponse: aiResponse,
            timestamp: Date.now()
          };
        }),
      expectedOutcome: '从通话记录自动生成的测试用例',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('生成的测试用例数据:', testCaseData);
    
    // 这里需要与BotTestConfig组件通信，将测试用例添加到对应测试集
    // 可以通过全局状态管理或其他方式实现
  };

  // 左侧栏七个板块（三个标签 + 四个变量分类）共用同一套折叠逻辑：标题和右侧箭头一行，
  // 点标题切换展开态。抽成一个函数而不是各写一遍，保证它们的折叠行为永远一致。
  const renderSection = (key: string, title: string, count: number | null, body: React.ReactNode) => {
    const expanded = expandedSections[key] ?? true;
    return (
      <div key={key}>
        <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection(key)}>
          <h3 className="text-sm font-bold text-slate-800">
            {title}
            {count !== null && <span className="ml-1.5 text-xs font-normal text-slate-400">{count}</span>}
          </h3>
          {expanded ?
            <ChevronUp size={14} className="text-slate-400" /> :
            <ChevronDown size={14} className="text-slate-400" />
          }
        </div>
        {expanded && <div className="mt-2">{body}</div>}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* 顶部信息栏 */}
      <div className="border-b border-slate-200 bg-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            通话详情 {callDetail.callId}
            <button className="ml-2 text-slate-400 hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </button>
          </h2>
        </div>
        <div className="flex items-center space-x-2">

          <button 
            onClick={handleEditCustomerInfo}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex items-center"
          >
            <Edit size={14} className="mr-1" /> 编辑客户信息
          </button>
          <button 
            onClick={handlePrevRecord}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex items-center"
          >
            <ChevronLeft size={14} className="mr-1" /> 上一条
          </button>
          <button 
            onClick={handleNextRecord}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex items-center"
          >
            下一条 <ChevronRight size={14} className="ml-1" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* 左侧边栏 */}
        <div className="w-64 border-r border-slate-200 bg-white p-4 overflow-y-auto">
          <div className="space-y-4">
            {/* 通话统计固定在左侧栏最上面。它不是标签也不是变量、没有折叠态，
                单独放在这里，避免和下面那组「长得一样、折叠逻辑也一样」的板块混在一起。 */}
            <div>
              <div className="mb-2 text-sm font-bold text-slate-800">通话统计</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">AI通话时长:</span>
                  <span className="text-sm font-bold text-blue-600">{callDetail.duration}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">对话轮次:</span>
                  <span className="text-sm font-bold text-blue-600">{callDetail.rounds}轮</span>
                </div>
                {/* 详情页回落到示例通话时，把「为什么没有金额」说清楚，而不是默默少一行。 */}
                {!detailMatchesRequest && (
                  <p className="rounded-md bg-slate-50 px-2.5 py-2 text-xs leading-5 text-slate-500">
                    这通电话的详情还没录入通话记录，页面内容是示例通话。费用与它不对应，这里不显示金额。
                  </p>
                )}
                {/* 扣费信息只在有计费记录时展示，并给出「为什么是这个价」的入口。 */}
                {billingRow && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">本通费用:</span>
                      {/* 三种状态三种写法，用词与颜色都跟计费中心明细表一致：
                          「未接通不计费」而不是「不收费」——「不收费」看起来像一个金额，
                          而且没说清是「这通不该收」还是「这通被免了」。
                          待定价用琥珀色、未接通用灰色，蓝色全站都表示「正常的一个金额」。 */}
                      <span className={`text-sm font-bold ${
                        billingRow.record.billingStatus === 'billed'
                          ? 'text-blue-600'
                          : billingRow.record.billingStatus === 'pending' ? 'text-amber-600' : 'text-slate-500'
                      }`}>
                        {billingRow.record.billingStatus === 'billed'
                          ? `¥${centsToYuan(billingRow.record.amountCents).toFixed(2)}`
                          : billingRow.record.billingStatus === 'pending' ? '待定价' : '未接通不计费'}
                      </span>
                    </div>
                    {/* 费率只对真的扣了钱的通话显示。没计费的通话里快照是占位值（单价 0），
                        照常渲染会写出「0.00 元/分钟」——和上面的「未接通不计费」自相矛盾。 */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">适用费率:</span>
                      <span className="text-sm text-slate-700">
                        {billingRow.record.billingStatus === 'billed'
                          ? formatPricePerMin(billingRow.record.snapshot.priceMilli)
                          : '—'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsBillingBasisOpen(true)}
                      className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      查看计费依据
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 三个标签板块和四个变量分类连续排布、共用 renderSection，折叠行为完全一致。
                变量分类与「变量配置」页的四个页签一一对应，只展示本次通话真正用到的变量：
                某一类没有用到的变量就整段不出现，不会留下一个空标题。 */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              {renderSection('客户意向标签', '客户意向标签', null,
                <div className="space-y-1">
                  {callDetail.labels.map((label, index) => (
                    <div key={index} className="text-sm text-slate-600">{label}</div>
                  ))}
                </div>
              )}
              {renderSection('标签', '标签', null, <div className="text-sm text-slate-500">-</div>)}
              {renderSection('情绪标签', '情绪标签', null, <div className="text-sm text-slate-500">-</div>)}
              {VARIABLE_CATEGORIES.map((category) => {
                const items = callDetail.variableUsages.filter((item) => item.category === category.id);
                if (items.length === 0) return null;
                return renderSection(category.label, category.label, items.length,
                  // 变量名做成浅灰标签、取值用深色加重：先看到的是取值，字段名退成次要信息。
                  // 不用彩色标签，B 端信息面板靠深浅和字重拉开层级就够了。
                  <div className="divide-y divide-slate-100">
                    {items.map((item, index) => (
                      <div key={`${item.name}-${index}`} className="py-2 first:pt-0 last:pb-0">
                        <span
                          className="inline-block max-w-full truncate rounded bg-slate-100 py-0.5 px-1.5 text-[11px] font-medium text-slate-500"
                          title={item.name}
                        >
                          {item.name}
                        </span>
                        {/* 取值可能很长且没有空格（比如通话 ID），必须允许任意位置换行，
                            否则会顶破左侧栏的右边界。 */}
                        <div className="mt-1 break-all text-sm font-medium leading-5 text-slate-800">{item.value}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 通话信息 */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800">AI通话</h3>
              <div className="text-sm text-slate-600">
                通话开始时间：{callDetail.startTime} 通话结束时间：{callDetail.endTime}
              </div>
            </div>

            {/* 音频播放条 */}
            <div className="space-y-3">
              {callDetail.audioFiles.map((audio, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-8 text-center">
                    <button 
                      type="button"
                      aria-label={playingAudioIndex === index ? `暂停${audio.type}` : `播放${audio.type}`}
                      onClick={() => togglePlay(index)}
                      className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      {playingAudioIndex === index ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="6" y="4" width="4" height="16"/>
                          <rect x="14" y="4" width="4" height="16"/>
                        </svg>
                      ) : (
                        <Play size={16} />
                      )}
                    </button>
                  </div>
                  <div className="text-sm text-slate-600 w-16">{audio.type}</div>
                  <div className="flex-1">
                    {audio.type === 'AI通话' ? (
                      <div
                        role="progressbar"
                        aria-label={`第 ${index + 1} 条 AI 通话播放进度`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(activeAudioIndex === index ? playbackProgress : 0)}
                        className="h-1 w-full overflow-hidden rounded-full bg-slate-200"
                      >
                        <div
                          className="h-full rounded-full bg-primary transition-[width] duration-200"
                          style={{ width: `${activeAudioIndex === index ? playbackProgress : 0}%` }}
                        />
                      </div>
                    ) : (
                      <div className="h-1 w-full rounded-full bg-slate-200" aria-hidden="true" />
                    )}
                  </div>
                  <div className="text-sm text-slate-500 w-12 text-right">{audio.duration}</div>
                  <div className="flex space-x-2">
                    <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                      <Volume2 size={16} />
                    </button>
                    <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 满意度调查是原通话的一段后续流程，结果与当前 Call ID 保持关联。 */}
          {satisfactionView && (
            <div className="mb-4 rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-primary"><CheckCircle2 size={17} /></div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold text-slate-800">满意度调查</h3><span className={`rounded-full px-2 py-0.5 text-xs ${satisfactionView.completed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{satisfactionView.completed ? '已完成' : `未完成 ${satisfactionView.answeredCount}/${satisfactionView.totalQuestionCount}`}</span></div>
                    <div className="mt-1 text-xs text-slate-500">{satisfactionView.offeredAt} 发起 · {satisfactionView.surveyName}{satisfactionView.surveyVersion ? ` · V${satisfactionView.surveyVersion}` : ''}</div>
                  </div>
                </div>
                <div className="text-right">{satisfactionView.score !== undefined && <div className="text-2xl font-bold text-slate-900">{satisfactionView.score}<span className="ml-1 text-sm font-normal text-slate-400">/ {satisfactionView.scoreMax ?? 5}</span></div>}<div className="mt-1 text-xs text-slate-500">{satisfactionView.mode === 'ivr' ? 'IVR 按键' : '语音智能体'}采集</div></div>
              </div>
              <div className="mt-4 overflow-hidden rounded border border-slate-100">
                {satisfactionView.answers.map((answer, index) => (
                  <div key={answer.questionId} className={`px-4 py-3 text-sm ${index > 0 ? 'border-t border-slate-100' : ''}`}>
                    <div className="grid grid-cols-1 gap-1 md:grid-cols-[260px_minmax(0,1fr)_80px]"><span className="text-slate-500">{answer.question}</span><span className="font-medium text-slate-700">{answer.value}</span><span className="text-xs text-slate-400 md:text-right">{answer.inputMode}</span></div>
                    {answer.category && <div className="mt-2 text-xs text-blue-600">聚合分类：{answer.category}</div>}
                    {answer.reason && <div className="mt-2 rounded bg-amber-50 p-3"><div className="text-xs font-semibold text-amber-700">原因追溯 · {answer.reasonCategory || '未归类'}</div><div className="mt-1 text-sm text-slate-700">{answer.reason}</div></div>}
                  </div>
                ))}
              </div>
              {!satisfactionView.completed && <div className="mt-3 rounded bg-slate-50 px-4 py-3 text-sm text-slate-500">客户在第 {satisfactionView.answeredCount + 1} 题前结束调查，后续问题没有回答。</div>}
              {satisfactionView.feedbackTheme && <div className="mt-3 text-xs text-slate-500">开放回答归类：<span className="font-semibold text-slate-700">{satisfactionView.feedbackTheme}</span></div>}
            </div>
          )}

          {/* 通话详情 */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800">通话详情</h3>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleDownloadText}
                  className="px-2 py-1 text-xs border border-slate-200 rounded text-slate-600 hover:bg-slate-50 flex items-center"
                >
                  <Download size={12} className="mr-1" /> 下载文本
                </button>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-slate-600">调试模式</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={debugMode}
                      onChange={(e) => setDebugMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="font-medium text-slate-800 mb-2">{callDetail.company}</div>
            </div>

            {/* 对话内容 */}
            <div className="space-y-6">
              {callDetail.dialogues.map((dialogue, index) => (
                <div
                  key={index}
                  ref={(element) => { dialogueRefs.current[index] = element; }}
                  className={`flex rounded-lg transition-colors ${dialogue.isUser ? 'justify-end' : 'justify-start'} ${activeDialogueIndex === index ? 'bg-blue-50/70' : ''}`}
                >
                  <div className={`max-w-[80%] ${dialogue.isUser ? 'text-right' : 'text-left'}`}>
                    {/* 时间戳 */}
                    <div className="text-xs text-slate-500 mb-1 flex items-center">
                      {!dialogue.isUser && (
                        <div className="w-4 h-4 mr-1 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                            <path d="M12 17h.01"/>
                          </svg>
                        </div>
                      )}
                      {dialogue.timestamp}
                      {activeDialogueIndex === index && <CheckCircle2 size={14} className="ml-2 text-primary" />}
                      {dialogue.isUser && (
                        <div className="w-4 h-4 ml-1 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* 对话内容 */}
                    <button
                      type="button"
                      onClick={() => syncAudioByDialogue(index)}
                      className={`w-full cursor-pointer rounded-lg p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${dialogue.isUser ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}
                    >
                      {dialogue.content}
                    </button>
                    
                    {/* AI 回复日志和添加测试用例按钮 */}
                    {!dialogue.isUser && (
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          className="text-xs border border-blue-100 text-primary px-2 py-0.5 rounded hover:bg-blue-50 transition-colors flex items-center gap-1"
                          onClick={() => handleOpenAiLog(index)}
                        >
                          <FileSearch size={12} /> 查看日志
                        </button>
                        <div className="relative group">
                          {addSuccess ? (
                            <div className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                              添加成功 ✓
                            </div>
                          ) : (
                            <button 
                              className={`text-xs ${addingToTestCase ? 'bg-slate-400' : 'bg-primary'} text-white px-2 py-0.5 rounded hover:bg-sky-600 transition-colors ${addingToTestCase ? 'cursor-not-allowed' : ''}`}
                              onClick={() => {
                                setAddingToTestCase(true);
                                // 模拟添加过程
                                setTimeout(() => {
                                  setAddingToTestCase(false);
                                  setAddSuccess(true);
                                  // 3秒后隐藏成功提示
                                  setTimeout(() => setAddSuccess(false), 3000);
                                }, 1000);
                              }}
                              disabled={addingToTestCase}
                            >
                              {addingToTestCase ? '添加中...' : '添加到测试用例'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    

                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <AiReplyLogModal log={selectedAiLog} onClose={() => setSelectedAiLog(null)} />
      {isBillingBasisOpen && <BillingBasisPanel subject={billingSubject} onClose={() => setIsBillingBasisOpen(false)} />}
    </div>
  );
}
