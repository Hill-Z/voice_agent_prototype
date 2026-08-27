import React, { useEffect, useRef, useState } from 'react';
import { Play, Volume2, Download, Edit, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Plus, FileSearch, CheckCircle2 } from 'lucide-react';
import AiReplyLogModal, { AiReplyLogData, AiReplyLogScenario } from './AiReplyLogModal';
import { SatisfactionSurveyResult } from '../../types';

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
}

const MOCK_CALL_DETAIL: CallDetail = {
  callId: '4cb67f3a-6d81-4033-bb5f-a3cf8292a2e5',
  startTime: '2026-03-20 14:29:23',
  endTime: '2026-03-20 14:33:19',
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
    {
      type: 'AI通话',
      duration: '03:50',
      url: 'ai_call1.mp3'
    },
    {
      type: 'AI通话',
      duration: '03:50',
      url: 'ai_call2.mp3'
    }
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

interface CallRecordDetailProps {
  callId?: string;
}

export default function CallRecordDetail({ callId }: CallRecordDetailProps) {
  const [callDetail, setCallDetail] = useState<CallDetail>(MOCK_CALL_DETAIL);
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null);
  const [debugMode, setDebugMode] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    '客户意向标签': true,
    '标签': true,
    '情绪标签': true
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
            {/* 客户意向标签 */}
            <div>
              <div 
                className="flex justify-between items-center cursor-pointer" 
                onClick={() => toggleSection('客户意向标签')}
              >
                <h3 className="text-sm font-bold text-slate-800">客户意向标签</h3>
                {expandedSections['客户意向标签'] ? 
                  <ChevronUp size={14} className="text-slate-400" /> : 
                  <ChevronDown size={14} className="text-slate-400" />
                }
              </div>
              {expandedSections['客户意向标签'] && (
                <div className="mt-2 space-y-1">
                  {callDetail.labels.map((label, index) => (
                    <div key={index} className="text-sm text-slate-600">{label}</div>
                  ))}
                </div>
              )}
            </div>

            {/* 标签 */}
            <div>
              <div 
                className="flex justify-between items-center cursor-pointer" 
                onClick={() => toggleSection('标签')}
              >
                <h3 className="text-sm font-bold text-slate-800">标签</h3>
                {expandedSections['标签'] ? 
                  <ChevronUp size={14} className="text-slate-400" /> : 
                  <ChevronDown size={14} className="text-slate-400" />
                }
              </div>
              {expandedSections['标签'] && (
                <div className="mt-2">
                  <div className="text-sm text-slate-500">-</div>
                </div>
              )}
            </div>

            {/* 情绪标签 */}
            <div>
              <div 
                className="flex justify-between items-center cursor-pointer" 
                onClick={() => toggleSection('情绪标签')}
              >
                <h3 className="text-sm font-bold text-slate-800">情绪标签</h3>
                {expandedSections['情绪标签'] ? 
                  <ChevronUp size={14} className="text-slate-400" /> : 
                  <ChevronDown size={14} className="text-slate-400" />
                }
              </div>
              {expandedSections['情绪标签'] && (
                <div className="mt-2">
                  <div className="text-sm text-slate-500">-</div>
                </div>
              )}
            </div>

            {/* 通话统计 */}
            <div className="pt-4 border-t border-slate-200">
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
              </div>
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
          {callDetail.satisfactionSurveyResult && (
            <div className="mb-4 rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-primary"><CheckCircle2 size={17} /></div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold text-slate-800">满意度调查</h3><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">已完成</span></div>
                    <div className="mt-1 text-xs text-slate-500">{callDetail.satisfactionSurveyResult.offeredAt} 发起 · {callDetail.satisfactionSurveyResult.surveyName} · V{callDetail.satisfactionSurveyResult.surveyVersion}</div>
                  </div>
                </div>
                <div className="text-right"><div className="text-2xl font-bold text-slate-900">{callDetail.satisfactionSurveyResult.score}<span className="ml-1 text-sm font-normal text-slate-400">/ 5</span></div><div className="mt-1 text-xs text-slate-500">{callDetail.satisfactionSurveyResult.mode === 'ivr' ? 'IVR 按键' : '语音智能体'}采集</div></div>
              </div>
              <div className="mt-4 overflow-hidden rounded border border-slate-100">
                {callDetail.satisfactionSurveyResult.answers.map((answer, index) => (
                  <div key={answer.questionId} className={`grid grid-cols-1 gap-1 px-4 py-3 text-sm md:grid-cols-[260px_minmax(0,1fr)_80px] ${index > 0 ? 'border-t border-slate-100' : ''}`}><span className="text-slate-500">{answer.question}</span><span className="font-medium text-slate-700">{typeof answer.value === 'number' ? `${answer.value} 分` : answer.value}</span><span className="text-xs text-slate-400 md:text-right">{answer.inputMode === 'dtmf' ? '按键输入' : '语音回答'}</span></div>
                ))}
              </div>
              {callDetail.satisfactionSurveyResult.feedbackTheme && <div className="mt-3 text-xs text-slate-500">开放回答归类：<span className="font-semibold text-slate-700">{callDetail.satisfactionSurveyResult.feedbackTheme}</span></div>}
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
    </div>
  );
}
