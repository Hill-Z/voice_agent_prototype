
import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, Send, RefreshCw, 
  MessageSquare, User, Bot, 
  ChevronDown, ChevronRight, Hash, 
  Zap, PhoneOff, Headset, 
  Database, Server, Clock, Tag, Play, Check, AlertCircle, Wrench, Box, Target, FileText, VolumeX, ChevronUp
} from 'lucide-react';
import { BotConfiguration } from '../../types';
import { Switch, Select, Label } from '../ui/FormComponents';

interface BotDebugConfigProps {
  config: BotConfiguration;
}

interface LatencyMetrics {
  asr?: number;
  llmTTFB?: number;
  llmStreamOutput?: number;
  llmTotal: number;
  ttsFirstAudio?: number;
  ttsFullPlayback?: number;
  ttsTotal?: number;
  e2eTTFB?: number;
  e2eTotal?: number;
}

interface TokenMetrics {
  input: number;
  output: number;
  total: number;
}

// 执行事件类型
interface ExecutionEvent {
  type: 'tool_call' | 'code_block' | 'topic_match' | 'variable_change' | 'barge_in' | 'no_answer';
  name?: string;
  params?: any;
  result?: any;
  status?: 'success' | 'failed' | 'retrying' | 'pending';
  duration?: number;
  retryCount?: number;
  maxRetry?: number;
  confidence?: number;
  oldValue?: any;
  newValue?: any;
  source?: string;
  reason?: string;
  detail?: string;
  triggerType?: string;
  boundTools?: string[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  latency?: LatencyMetrics;
  tokens?: TokenMetrics;
  tags?: string[];
  actionEvent?: {
    type: 'TRANSFER' | 'HANGUP';
    detail: string;
    reason?: string;
  };
  executionEvents?: ExecutionEvent[];
  showExecutionDetail?: boolean;
}

const BotDebugConfig: React.FC<BotDebugConfigProps> = ({ config }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // --- Variable States ---
  // Translated keys to Chinese as requested
  const [inputVars, setInputVars] = useState<Record<string, string>>({
    '客户姓名': '张三',
    '客户电话': '13800138000',
    '工单编号': 'T_20240520_001',
    '欠款金额': '5000.00'
  });

  const [conversationVars, setConversationVars] = useState<Record<string, string>>({});
  const [extractionVars, setExtractionVars] = useState<Record<string, string>>({});

  // --- Tag States ---
  const [systemTags, setSystemTags] = useState<string[]>([]);
  const [manualTags, setManualTags] = useState<string[]>([]);

  // UI Toggle State
  const [saveToRecord, setSaveToRecord] = useState(true);
  const [debugVoice, setDebugVoice] = useState(config.voiceName || 'Azure-Xiaoxiao');
  const [showVariables, setShowVariables] = useState(true);
  const [showLatencyDetail, setShowLatencyDetail] = useState(false);
  const [showTags, setShowTags] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize Variables
  useEffect(() => {
    // Init Conversation Vars
    const conv: Record<string, string> = {};
    config.variables?.forEach(v => {
      // Map system vars to Chinese display for consistency in debug view
      if (v.name === 'current_date') conv['当前日期'] = new Date().toLocaleDateString();
      else if (v.name === 'current_time') conv['当前时间'] = new Date().toLocaleTimeString();
      else if (v.name === 'gender') conv['客户性别'] = '未知';
      else conv[v.name] = ''; 
    });
    setConversationVars(conv);

    // Init Extraction Vars
    const ext: Record<string, string> = {};
    config.parameters?.forEach(p => {
      ext[p.key] = ''; 
    });
    if (config.parameters.length === 0) {
        ext['下次回访时间'] = '';
        ext['客户意图'] = '';
    }
    setExtractionVars(ext);
    
    // Reset Tags
    setSystemTags([]);
    setManualTags([]);
  }, [config]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- MOCK LOGIC ENGINE ---
  const generateMockResponse = async (userText: string) => {
    const asrTime = isVoiceMode ? Math.floor(Math.random() * 200) + 100 : 0;
    const llmTTFB = Math.floor(Math.random() * 200) + 150;
    const llmStreamOutput = Math.floor(Math.random() * 300) + 100;
    const llmTotal = llmTTFB + llmStreamOutput;

    await new Promise(r => setTimeout(r, asrTime + llmTotal));

    let responseText = "好的，我记录下来了。请问还有其他问题吗？";
    let actionEvent = undefined;
    let messageTags = ['大模型回复'];
    let executionEvents: ExecutionEvent[] = [];

    if (userText.includes('你好') || userText.includes('开始')) {
      responseText = "您好，这里是智能客服中心，请问有什么可以帮您？";
      messageTags = ['开场白'];
      executionEvents.push({
        type: 'topic_match',
        name: '开场问候',
        confidence: 0.95,
        triggerType: '关键词匹配',
        boundTools: []
      });
    } else if (userText.includes('我是')) {
      const name = userText.replace('我是', '').replace('我叫', '');
      responseText = `${name}您好，很高兴为您服务。`;
      setExtractionVars(prev => ({ ...prev, '客户姓名': name }));
      messageTags = ['大模型回复', '信息提取'];
      executionEvents.push(
        {
          type: 'topic_match',
          name: '身份确认',
          confidence: 0.88,
          triggerType: '语义匹配',
          boundTools: ['normalize_phone_digits']
        },
        {
          type: 'code_block',
          name: 'normalize_phone_digits',
          params: { input: name },
          result: name,
          status: 'success',
          duration: 5
        },
        {
          type: 'variable_change',
          name: '客户姓名',
          oldValue: '',
          newValue: name,
          source: 'LLM 提取'
        }
      );
    } else if (userText.includes('转人工')) {
      responseText = "好的，正在为您转接高级客户经理，请稍候...";
      actionEvent = { type: 'TRANSFER' as const, detail: 'VIP专家坐席', reason: '客户主动要求' };
      messageTags = ['转人工话术', '意图识别: 转人工'];
      executionEvents.push(
        {
          type: 'topic_match',
          name: '转人工',
          confidence: 0.97,
          triggerType: '关键词匹配',
          boundTools: ['transfer_call']
        },
        {
          type: 'tool_call',
          name: 'transfer_call',
          params: { destination: 'VIP专家坐席', reason: '客户主动要求' },
          result: { status: 'transferring' },
          status: 'success',
          duration: 800
        }
      );
    } else if (userText.includes('挂断') || userText.includes('再见') || userText.includes('不需要') || userText.includes('结束')) {
      responseText = "感谢您的来电，祝您生活愉快，再见。";
      actionEvent = { type: 'HANGUP' as const, detail: '正常挂机', reason: '业务结束' };
      messageTags = ['挂机话术', '意图识别: 挂断'];
      executionEvents.push(
        {
          type: 'topic_match',
          name: '结束通话',
          confidence: 0.92,
          triggerType: '语义匹配',
          boundTools: ['hangup']
        },
        {
          type: 'tool_call',
          name: 'hangup',
          params: { reason: '业务结束' },
          result: { status: 'ended' },
          status: 'success',
          duration: 100
        }
      );
      const simulatedAutoTags: string[] = [];
      config.labelGroups.forEach(group => {
        if (!group.enabled || group.tags.length === 0) return;
        if (group.name === '意向标签') {
          if (userText.includes('不需要')) {
            const tag = group.tags.find(t => t.name.includes('拒绝') || t.name.includes('C级'));
            if (tag) simulatedAutoTags.push(tag.name);
          } else if (userText.includes('明天') || userText.includes('回访')) {
            const tag = group.tags.find(t => t.name.includes('A级') || t.name.includes('有意向'));
            if (tag) simulatedAutoTags.push(tag.name);
          } else {
            simulatedAutoTags.push(group.tags[0].name);
          }
        }
      });
      setSystemTags(simulatedAutoTags);
    } else if (userText.includes('明天') || userText.includes('回访')) {
      responseText = "好的，已为您预约明天下午的回访。";
      setExtractionVars(prev => ({
        ...prev,
        '下次回访时间': '2024-05-21 14:00',
        '客户意图': 'A级(有回访意愿)'
      }));
      messageTags = ['大模型回复', '信息提取', '预约成功'];
      executionEvents.push(
        {
          type: 'topic_match',
          name: '预约回访',
          confidence: 0.91,
          triggerType: '语义匹配',
          boundTools: ['save_state', 'send_sms']
        },
        {
          type: 'tool_call',
          name: 'send_sms',
          params: { template: 'SMS_REMINDER', phone: inputVars['客户电话'] },
          result: { status: 'sent', messageId: 'msg_12345' },
          status: 'success',
          duration: 1200
        },
        {
          type: 'code_block',
          name: 'save_state',
          params: { key: '回访时间', value: '2024-05-21 14:00' },
          result: { success: true },
          status: 'success',
          duration: 3
        },
        {
          type: 'variable_change',
          name: '下次回访时间',
          oldValue: '',
          newValue: '2024-05-21 14:00',
          source: 'LLM 提取'
        },
        {
          type: 'variable_change',
          name: '客户意图',
          oldValue: '',
          newValue: 'A级(有回访意愿)',
          source: 'LLM 提取'
        }
      );
    } else if (userText.includes('查询') || userText.includes('订单')) {
      responseText = "正在为您查询订单信息，请稍候...";
      messageTags = ['大模型回复', '工具调用'];
      executionEvents.push(
        {
          type: 'topic_match',
          name: '查询订单',
          confidence: 0.89,
          triggerType: '语义匹配',
          boundTools: ['query_order_status']
        },
        {
          type: 'tool_call',
          name: 'query_order_status',
          params: { order_id: '12345' },
          result: { status: 'shipped', eta: '3天' },
          status: 'success',
          duration: 1500
        }
      );
    } else if (userText.includes('等等') || userText.includes('打断')) {
      responseText = "好的，请问您需要什么帮助？";
      messageTags = ['打断处理', '重新采集'];
      executionEvents.push(
        {
          type: 'barge_in',
          detail: '用户打断',
          reason: '用户主动打断',
          params: { userText: userText, botText: '正在为您查询...' }
        }
      );
    } else if (userText === '' || userText.includes('静默')) {
      responseText = '';
      messageTags = ['无需回答'];
      executionEvents.push(
        {
          type: 'no_answer',
          reason: '用户输入为静默/背景噪音',
          detail: 'LLM 决策不生成回复，继续等待'
        }
      );
    } else {
      executionEvents.push(
        {
          type: 'topic_match',
          name: '通用回复',
          confidence: 0.75,
          triggerType: '默认匹配',
          boundTools: []
        }
      );
    }

    Object.values(inputVars).forEach((val) => {
      const v = val as string;
      if (v && responseText.includes(v)) {
        if (!messageTags.includes('使用输入变量')) messageTags.push('使用输入变量');
      }
    });

    setConversationVars(prev => ({ ...prev, '当前时间': new Date().toLocaleTimeString() }));

    const ttsFirstAudio = Math.floor(Math.random() * 100) + 50;
    const ttsFullPlayback = Math.min(800, responseText.length * 40);
    const ttsTotal = ttsFirstAudio + ttsFullPlayback;

    if (isVoiceMode) await new Promise(r => setTimeout(r, ttsTotal));

    const e2eTTFB = asrTime + llmTTFB + ttsFirstAudio;
    const e2eTotal = asrTime + llmTotal + ttsTotal;

    return {
      responseText,
      latency: {
        asr: asrTime,
        llmTTFB,
        llmStreamOutput,
        llmTotal,
        ttsFirstAudio,
        ttsFullPlayback,
        ttsTotal,
        e2eTTFB,
        e2eTotal
      },
      actionEvent,
      tags: messageTags,
      executionEvents
    };
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || inputValue;
    if (!textToSend.trim() || isLoading) return;

    // 1. User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // 2. Mock Process
      const result = await generateMockResponse(textToSend);

      // 3. System Action Message (if any)
      if (result.actionEvent) {
         const botMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            content: result.responseText,
            timestamp: Date.now(),
            latency: result.latency,
            tags: result.tags,
            executionEvents: result.executionEvents
         };
         setMessages(prev => [...prev, botMsg]);

         setTimeout(() => {
            const sysMsg: ChatMessage = {
              id: (Date.now() + 2).toString(),
              role: 'system',
              content: '',
              timestamp: Date.now(),
              actionEvent: result.actionEvent
            };
            setMessages(prev => [...prev, sysMsg]);
         }, 500);

      } else {
         const botMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            content: result.responseText,
            timestamp: Date.now(),
            latency: result.latency,
            tags: result.tags,
            executionEvents: result.executionEvents
         };
         setMessages(prev => [...prev, botMsg]);
      }

    } catch (error) {
       console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBotOpening = async () => {
    setIsLoading(true);
    setMessages([]);
    setSystemTags([]);
    setManualTags([]);
    
    await new Promise(r => setTimeout(r, 600));

    // DEMO: Inject Input Variable
    const clientName = inputVars['客户姓名'] || '客户';
    const money = inputVars['欠款金额'] || '0';
    
    // Construct dynamic opening based on variables
    const openingText = `您好，请问是${clientName}先生/女士吗？这里是智呼科技，系统显示您有一笔${money}元的账单即将到期。`;

    const botMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'model',
      content: openingText,
      timestamp: Date.now(),
      latency: { llmTotal: 120, e2eTTFB: 120, e2eTotal: 120 },
      tags: ['开场白', '使用输入变量', '自动触发'],
      executionEvents: [
        {
          type: 'topic_match',
          name: '开场问候',
          confidence: 0.98,
          triggerType: 'Flow 入口',
          boundTools: []
        },
        {
          type: 'variable_change',
          name: '客户姓名',
          oldValue: '',
          newValue: clientName,
          source: '输入变量'
        },
        {
          type: 'variable_change',
          name: '欠款金额',
          oldValue: '',
          newValue: money,
          source: '输入变量'
        }
      ]
    };
    setMessages([botMsg]);
    setIsLoading(false);
  };

  const handleVoiceSimulate = () => {
    if (isRecording) {
      setIsRecording(false);
      // Random Mock ASR
      const mocks = ["你好", "不需要了，直接挂吧", "帮我转人工客服", "明天下午再给我打电话", "我是张三"];
      const randomText = mocks[Math.floor(Math.random() * mocks.length)];
      setInputValue(randomText);
      if (isVoiceMode) handleSendMessage(randomText);
    } else {
      setIsRecording(true);
      setIsVoiceMode(true);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setExtractionVars(prev => {
        const reset: Record<string, string> = {};
        Object.keys(prev).forEach(k => reset[k] = '');
        return reset;
    });
    setSystemTags([]);
    setManualTags([]);
  };

  const toggleManualTag = (tag: string) => {
    if (manualTags.includes(tag)) {
      setManualTags(prev => prev.filter(t => t !== tag));
    } else {
      setManualTags(prev => [...prev, tag]);
    }
  };
  
  const isTagActive = (tagName: string) => systemTags.includes(tagName) || manualTags.includes(tagName);

  return (
    <div className="flex h-[calc(100vh-240px)] bg-slate-50 border-t border-gray-200">
      
      {/* LEFT: Chat Area */}
      <div className="flex-1 flex flex-col border-r border-gray-200 bg-white min-w-0">
        
        {/* Chat Header */}
        <div className="h-12 border-b border-gray-100 flex items-center justify-between px-6 bg-slate-50/50">
          <div className="flex items-center space-x-4">
             <div className="flex items-center text-xs text-slate-500">
               <span className="font-bold text-slate-700 mr-2">模拟环境 (Mock)</span>
               <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">调试模式</span>
             </div>
          </div>
          <button onClick={clearChat} className="text-slate-400 hover:text-primary flex items-center text-xs transition-colors">
            <RefreshCw size={12} className="mr-1" /> 重置对话
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <MessageSquare size={48} className="mb-4 opacity-20" />
                <p className="text-sm">请选择测试场景或直接输入</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3 max-w-md">
                   <button 
                     onClick={handleBotOpening}
                     className="px-4 py-2 bg-primary text-white hover:bg-sky-600 rounded-lg text-xs font-bold transition-colors flex items-center shadow-sm"
                   >
                     <Play size={12} className="mr-2" /> 模拟外呼 (自动带入变量)
                   </button>
                   <button 
                     onClick={() => {
                        const cleanText = "不需要了，谢谢，挂断吧";
                        setInputValue(cleanText); 
                        handleSendMessage(cleanText); 
                     }}
                     className="px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded-lg text-xs font-bold transition-colors flex items-center shadow-sm"
                   >
                     <Tag size={12} className="mr-2" /> 模拟挂机并打标
                   </button>

                   {["你好 (呼入)", "转人工 (Action)", "明天回访 (提取)"].map(t => (
                     <button key={t} onClick={() => { 
                         const cleanText = t.split(' ')[0];
                         setInputValue(cleanText); 
                         handleSendMessage(cleanText); 
                     }} className="px-4 py-2 bg-white border border-slate-200 hover:border-primary hover:text-primary rounded-lg text-xs text-slate-600 transition-all shadow-sm">
                       {t}
                     </button>
                   ))}
                </div>
             </div>
          )}
          
          {messages.map((msg) => {
            if (msg.role === 'system' && msg.actionEvent) {
              return (
                <div key={msg.id} className="flex justify-center my-4 animate-in fade-in slide-in-from-bottom-2">
                   <div className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center shadow-sm border ${
                     msg.actionEvent.type === 'TRANSFER' 
                       ? 'bg-blue-50 text-blue-700 border-blue-100' 
                       : 'bg-red-50 text-red-700 border-red-100'
                   }`}>
                      {msg.actionEvent.type === 'TRANSFER' ? <Headset size={14} className="mr-2"/> : <PhoneOff size={14} className="mr-2"/>}
                      <span>
                        {msg.actionEvent.type === 'TRANSFER' ? '转接人工坐席' : '通话结束'} 
                        <span className="mx-2 opacity-50">|</span> 
                        {msg.actionEvent.detail}
                        {msg.actionEvent.reason && <span className="font-normal ml-2 opacity-80">({msg.actionEvent.reason})</span>}
                      </span>
                   </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm ${msg.role === 'user' ? 'bg-primary text-white ml-3' : 'bg-orange-500 text-white mr-3'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>

                  {/* Content Group */}
                  <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {/* Meta Info Top (Latency) */}
                    {msg.role === 'model' && msg.latency && (
                       <div className="text-[10px] text-slate-400 mb-1 ml-1 flex items-center space-x-2">
                          <span className="font-bold text-slate-600">Bot</span>
                          {isVoiceMode ? (
                            <div 
                              onClick={() => setShowLatencyDetail(!showLatencyDetail)}
                              className="flex space-x-1 bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-mono cursor-pointer hover:bg-slate-200 transition-colors"
                            >
                               <span title="端到端首字延迟（用户最关注）" className="text-red-600 font-bold">
                                 E2E首字:{msg.latency.e2eTTFB}ms
                               </span>
                               <span className="text-slate-300">|</span>
                               <span title="端到端总耗时">
                                 总耗时:{msg.latency.e2eTotal}ms
                               </span>
                               <span className="text-slate-400 ml-1">{showLatencyDetail ? '▲' : '▼'}</span>
                            </div>
                          ) : (
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[9px]">
                              耗时: {msg.latency.llmTotal}ms
                            </span>
                          )}
                       </div>
                    )}

                    {/* Latency Detail Panel */}
                    {msg.role === 'model' && msg.latency && isVoiceMode && showLatencyDetail && (
                      <div className="mb-2 ml-1 p-2 bg-slate-50 rounded-lg border border-slate-200 text-[10px]">
                        <div className="font-bold text-slate-500 mb-2 flex items-center">
                          <Clock size={10} className="mr-1" />耗时分解
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center">
                            <span className="w-14 text-slate-500">ASR</span>
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-400" 
                                style={{ width: `${Math.min(100, ((msg.latency.asr || 0) / (msg.latency.e2eTotal || 1)) * 100)}%` }}
                              />
                            </div>
                            <span className="w-12 text-right text-slate-600">{msg.latency.asr}ms</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-14 text-slate-500">LLM首字</span>
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-orange-500" 
                                style={{ width: `${Math.min(100, ((msg.latency.llmTTFB || 0) / (msg.latency.e2eTotal || 1)) * 100)}%` }}
                              />
                            </div>
                            <span className="w-12 text-right text-orange-600 font-bold">{msg.latency.llmTTFB}ms ⭐</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-14 text-slate-500">LLM输出</span>
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-orange-300" 
                                style={{ width: `${Math.min(100, ((msg.latency.llmStreamOutput || 0) / (msg.latency.e2eTotal || 1)) * 100)}%` }}
                              />
                            </div>
                            <span className="w-12 text-right text-slate-600">{msg.latency.llmStreamOutput}ms</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-14 text-slate-500">TTS首字</span>
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500" 
                                style={{ width: `${Math.min(100, ((msg.latency.ttsFirstAudio || 0) / (msg.latency.e2eTotal || 1)) * 100)}%` }}
                              />
                            </div>
                            <span className="w-12 text-right text-green-600 font-bold">{msg.latency.ttsFirstAudio}ms ⭐</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-14 text-slate-500">TTS播放</span>
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-400" 
                                style={{ width: `${Math.min(100, ((msg.latency.ttsFullPlayback || 0) / (msg.latency.e2eTotal || 1)) * 100)}%` }}
                              />
                            </div>
                            <span className="w-12 text-right text-slate-600">{msg.latency.ttsFullPlayback}ms</span>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-[9px]">
                          <span className="text-red-600 font-bold">⭐ E2E首字 = ASR + LLM首字 + TTS首字</span>
                          <span className="text-slate-400">{msg.latency.e2eTTFB}ms</span>
                        </div>
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`px-4 py-3 text-sm leading-relaxed rounded-2xl shadow-sm border ${
                      msg.role === 'user' 
                        ? 'bg-primary text-white border-primary rounded-tr-none' 
                        : 'bg-white text-slate-800 border-gray-200 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                    
                    {/* Tags */}
                    {msg.role === 'model' && msg.tags && (
                      <div className="mt-1 ml-1 flex flex-wrap gap-1 max-w-[300px]">
                        {msg.tags.map(tag => {
                            let colorClass = "bg-blue-50 text-blue-600 border-blue-100";
                            if (tag === '开场白' || tag === '结束语') colorClass = "bg-purple-50 text-purple-600 border-purple-100";
                            if (tag === '使用输入变量') colorClass = "bg-green-50 text-green-600 border-green-100";
                            if (tag.includes('挂机') || tag.includes('转人工')) colorClass = "bg-orange-50 text-orange-600 border-orange-100";
                            
                            return (
                              <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded border ${colorClass}`}>
                                {tag}
                              </span>
                            );
                        })}
                      </div>
                    )}
                    
                    {/* Execution Events Tags */}
                    {msg.role === 'model' && msg.executionEvents && msg.executionEvents.length > 0 && (
                      <div className="mt-2 ml-1">
                        <button 
                          onClick={() => {
                            setMessages(prev => prev.map(m => 
                              m.id === msg.id ? { ...m, showExecutionDetail: !m.showExecutionDetail } : m
                            ));
                          }}
                          className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-primary transition-colors"
                        >
                          {(() => {
                            const toolCount = msg.executionEvents!.filter(e => e.type === 'tool_call').length;
                            const codeCount = msg.executionEvents!.filter(e => e.type === 'code_block').length;
                            const topicMatch = msg.executionEvents!.find(e => e.type === 'topic_match');
                            const varCount = msg.executionEvents!.filter(e => e.type === 'variable_change').length;
                            const hasBargeIn = msg.executionEvents!.some(e => e.type === 'barge_in');
                            const hasNoAnswer = msg.executionEvents!.some(e => e.type === 'no_answer');
                            
                            const tags = [];
                            if (toolCount > 0) tags.push(<span key="tool" className="flex items-center gap-0.5 text-blue-600"><Wrench size={10} /> 工具调用({toolCount})</span>);
                            if (codeCount > 0) tags.push(<span key="code" className="flex items-center gap-0.5 text-green-600"><Box size={10} /> 代码块({codeCount})</span>);
                            if (topicMatch) tags.push(<span key="topic" className="flex items-center gap-0.5 text-purple-600"><Target size={10} /> 主题:{topicMatch.name}</span>);
                            if (varCount > 0) tags.push(<span key="var" className="flex items-center gap-0.5 text-orange-600"><FileText size={10} /> 变量({varCount})</span>);
                            if (hasBargeIn) tags.push(<span key="barge" className="flex items-center gap-0.5 text-yellow-600"><Zap size={10} /> 打断</span>);
                            if (hasNoAnswer) tags.push(<span key="noanswer" className="flex items-center gap-0.5 text-slate-400"><VolumeX size={10} /> 无需回答</span>);
                            
                            return (
                              <>
                                {tags.map((t, i) => (
                                  <React.Fragment key={i}>
                                    {t}
                                    {i < tags.length - 1 && <span className="text-slate-300 mx-1">|</span>}
                                  </React.Fragment>
                                ))}
                                <span className="ml-1 text-slate-300">{msg.showExecutionDetail ? '▲' : '▼'}</span>
                              </>
                            );
                          })()}
                        </button>
                        
                        {/* Execution Events Detail Panel */}
                        {msg.showExecutionDetail && (
                          <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-[10px] space-y-3 animate-in fade-in slide-in-from-top-2">
                            {/* Tool Calls */}
                            {msg.executionEvents!.filter(e => e.type === 'tool_call').map((event, idx) => (
                              <div key={`tool-${idx}`} className="border-b border-slate-100 pb-2 last:border-0">
                                <div className="flex items-center gap-1 font-bold text-blue-700 mb-1">
                                  <Wrench size={10} />
                                  <span>{idx + 1}. {event.name}</span>
                                  {event.status === 'success' && <Check size={10} className="text-green-500" />}
                                  {event.status === 'failed' && <AlertCircle size={10} className="text-red-500" />}
                                  {event.status === 'retrying' && <span className="text-yellow-500">⚠️ 重试 {event.retryCount}/{event.maxRetry || 3}</span>}
                                </div>
                                <div className="text-slate-600 ml-3">
                                  <div>参数: <code className="bg-white px-1 rounded">{JSON.stringify(event.params || {})}</code></div>
                                  {event.result && <div>结果: <code className="bg-white px-1 rounded">{JSON.stringify(event.result)}</code></div>}
                                  {event.duration && <div>耗时: <span className="font-mono">{event.duration}ms</span></div>}
                                  {event.reason && <div className="text-red-500">原因: {event.reason}</div>}
                                </div>
                              </div>
                            ))}
                            
                            {/* Code Blocks */}
                            {msg.executionEvents!.filter(e => e.type === 'code_block').map((event, idx) => (
                              <div key={`code-${idx}`} className="border-b border-slate-100 pb-2 last:border-0">
                                <div className="flex items-center gap-1 font-bold text-green-700 mb-1">
                                  <Box size={10} />
                                  <span>{idx + 1}. {event.name}</span>
                                  <span className="text-[8px] px-1 py-0.5 rounded bg-green-100 text-green-600">{event.source || '全局函数'}</span>
                                </div>
                                <div className="text-slate-600 ml-3">
                                  {event.params && <div>输入: <code className="bg-white px-1 rounded">{JSON.stringify(event.params)}</code></div>}
                                  {event.result && <div>输出: <code className="bg-white px-1 rounded">{JSON.stringify(event.result)}</code></div>}
                                  {event.duration && <div>耗时: <span className="font-mono">{event.duration}ms</span></div>}
                                </div>
                              </div>
                            ))}
                            
                            {/* Topic Match */}
                            {msg.executionEvents!.filter(e => e.type === 'topic_match').map((event, idx) => (
                              <div key={`topic-${idx}`} className="border-b border-slate-100 pb-2 last:border-0">
                                <div className="flex items-center gap-1 font-bold text-purple-700 mb-1">
                                  <Target size={10} />
                                  <span>主题: {event.name}</span>
                                </div>
                                <div className="text-slate-600 ml-3">
                                  <div className="flex items-center gap-2">
                                    置信度: 
                                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden max-w-[100px]">
                                      <div 
                                        className="h-full bg-purple-500" 
                                        style={{ width: `${(event.confidence || 0) * 100}%` }}
                                      />
                                    </div>
                                    <span className="font-mono">{Math.round((event.confidence || 0) * 100)}%</span>
                                  </div>
                                  {event.triggerType && <div>触发方式: {event.triggerType}</div>}
                                  {event.boundTools && event.boundTools.length > 0 && <div>绑定工具: {event.boundTools.join(', ')}</div>}
                                </div>
                              </div>
                            ))}
                            
                            {/* Variable Changes */}
                            {msg.executionEvents!.filter(e => e.type === 'variable_change').map((event, idx) => (
                              <div key={`var-${idx}`} className="border-b border-slate-100 pb-2 last:border-0">
                                <div className="flex items-center gap-1 font-bold text-orange-700 mb-1">
                                  <FileText size={10} />
                                  <span>{idx + 1}. {event.name}</span>
                                </div>
                                <div className="text-slate-600 ml-3">
                                  <div>
                                    值变化: 
                                    <code className="bg-slate-200 px-1 rounded text-slate-400">{String(event.oldValue || '')}</code>
                                    <span className="mx-1">→</span>
                                    <code className="bg-orange-100 px-1 rounded text-orange-700">{String(event.newValue || '')}</code>
                                  </div>
                                  {event.source && <div>来源: {event.source}</div>}
                                </div>
                              </div>
                            ))}
                            
                            {/* Barge In */}
                            {msg.executionEvents!.filter(e => e.type === 'barge_in').map((event, idx) => (
                              <div key={`barge-${idx}`} className="border-b border-slate-100 pb-2 last:border-0 bg-yellow-50/50 -mx-3 px-3">
                                <div className="flex items-center gap-1 font-bold text-yellow-700 mb-1">
                                  <Zap size={10} />
                                  <span>用户打断</span>
                                </div>
                                <div className="text-slate-600 ml-3">
                                  {event.params?.userText && <div>用户说: "{event.params.userText}"</div>}
                                  {event.params?.botText && <div>Bot 正在说: "{event.params.botText}"</div>}
                                  {event.reason && <div>原因: {event.reason}</div>}
                                </div>
                              </div>
                            ))}
                            
                            {/* No Answer */}
                            {msg.executionEvents!.filter(e => e.type === 'no_answer').map((event, idx) => (
                              <div key={`noanswer-${idx}`} className="border-b border-slate-100 pb-2 last:border-0 bg-slate-100/50 -mx-3 px-3">
                                <div className="flex items-center gap-1 font-bold text-slate-500 mb-1">
                                  <VolumeX size={10} />
                                  <span>无需回答</span>
                                </div>
                                <div className="text-slate-600 ml-3">
                                  {event.reason && <div>原因: {event.reason}</div>}
                                  {event.detail && <div>详情: {event.detail}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {isLoading && (
            <div className="flex justify-start">
               <div className="w-8 h-8 rounded-full bg-orange-500 text-white mr-3 flex items-center justify-center">
                  <Bot size={16} />
               </div>
               <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-none text-slate-400 text-sm flex items-center shadow-sm">
                  <div className="flex space-x-1">
                     <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                     <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                     <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                  </div>
               </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="relative">
            <input
              type="text"
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
              placeholder={isRecording ? "正在听..." : "输入消息..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading || isRecording}
            />
            <button 
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-white rounded-lg hover:bg-sky-600 disabled:bg-slate-200 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: Controls & Variable Inspector */}
      <div className="w-80 bg-white flex flex-col overflow-y-auto border-l border-gray-200 shrink-0">
         
         {/* Voice Panel (Fixed Content) */}
         <div className="p-6 border-b border-gray-100 text-center bg-slate-50/30">
            <div 
              onClick={handleVoiceSimulate}
              className={`w-24 h-24 mx-auto rounded-full border-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 mb-4 shadow-sm relative ${
                isRecording 
                  ? 'border-red-100 bg-red-50 text-red-500 scale-105 shadow-red-100' 
                  : 'border-white bg-white text-slate-400 hover:border-primary/20 hover:text-primary shadow-slate-200'
              }`}
            >
               {isRecording && (
                 <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-20"></div>
               )}
               <Mic size={28} className={`mb-1 ${isRecording ? 'animate-pulse' : 'opacity-80'}`} />
               <span className="text-[9px] font-bold uppercase tracking-wider">{isRecording ? '正在听' : '点击说话'}</span>
            </div>
            
            <div className="space-y-3 text-left px-2">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">保存录音</span>
                  <Switch label="" checked={saveToRecord} onChange={setSaveToRecord} />
               </div>
               <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label label="当前音色" />
                  </div>
                  <Select 
                    options={['Azure-Xiaoxiao', 'Azure-Yunxi', 'Google-Wavenet-A']} 
                    value={debugVoice}
                    onChange={(e) => setDebugVoice(e.target.value)}
                  />
               </div>
            </div>
         </div>

         {/* TAGS INSPECTOR */}
         <div className="bg-white border-b border-gray-200">
            <button 
              onClick={() => setShowTags(!showTags)}
              className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors border-b border-gray-100"
            >
               <div className="flex items-center text-xs font-bold text-slate-700">
                  <Tag size={14} className="mr-2 text-blue-600" />
                  客户标签 (Tags)
               </div>
               {showTags ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
            </button>
            
            {showTags && (
              <div className="p-4 bg-slate-50/20">
                  {config.labelGroups.filter(g => g.enabled).length === 0 && (
                     <div className="text-center text-xs text-slate-400 py-4 flex flex-col items-center">
                        <AlertCircle size={16} className="mb-2" />
                        暂无启用的标签组
                        <span className="text-[10px] opacity-70">请在“业务分析”中配置</span>
                     </div>
                  )}

                  {config.labelGroups.filter(g => g.enabled).map(group => (
                    <div key={group.id} className="mb-4 last:mb-0">
                       <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{group.name}</span>
                       </div>
                       <div className="flex flex-wrap gap-2">
                          {group.tags.map(tag => {
                             const isSystem = systemTags.includes(tag.name);
                             const isManual = manualTags.includes(tag.name);
                             const isActive = isSystem || isManual;

                             return (
                               <button 
                                 key={tag.name} 
                                 onClick={() => toggleManualTag(tag.name)}
                                 title={tag.description}
                                 className={`px-2 py-1 rounded text-xs font-medium border transition-all flex items-center ${
                                   isActive 
                                     ? (isSystem 
                                         ? 'bg-blue-100 text-blue-700 border-blue-200' // System selected style
                                         : 'bg-primary text-white border-primary shadow-sm') // Manual selected style
                                     : 'bg-white text-slate-600 border-gray-200 hover:border-primary hover:text-primary'
                                 }`}
                               >
                                 {tag.name}
                                 {isSystem && <Zap size={10} className="ml-1 fill-current" />}
                                 {isManual && !isSystem && <Check size={10} className="ml-1" />}
                               </button>
                             );
                          })}
                          {group.tags.length === 0 && <span className="text-[10px] text-slate-300 italic">空</span>}
                       </div>
                    </div>
                  ))}
                  
                  {systemTags.length > 0 && (
                     <div className="mt-3 pt-3 border-t border-dashed border-gray-200 text-[10px] text-blue-600 flex items-center animate-in fade-in">
                        <Zap size={10} className="mr-1 fill-current" /> 
                        AI 已在通话结束时自动打标
                     </div>
                  )}
              </div>
            )}
         </div>

         {/* Variable Inspector (Read Only) */}
         <div className="bg-white">
            <button 
              onClick={() => setShowVariables(!showVariables)}
              className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors border-b border-gray-100 sticky top-0 z-10"
            >
               <div className="flex items-center text-xs font-bold text-slate-700">
                  <Hash size={14} className="mr-2 text-purple-600" />
                  变量监视器
               </div>
               {showVariables ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
            </button>
            
            {showVariables && (
              <div className="pb-10">
                 {/* Section 1: Input Variables */}
                 <div className="px-4 py-2 bg-slate-50 border-b border-gray-100 flex items-center text-xs font-bold text-slate-600">
                    <Server size={12} className="mr-2" /> 输入变量
                 </div>
                 <div className="divide-y divide-gray-50 border-b border-gray-100">
                    {Object.entries(inputVars).map(([k, v]) => (
                      <div key={k} className="px-4 py-2 flex justify-between items-center text-xs">
                        <span className="font-mono text-slate-500 truncate mr-2" title={k}>{k}</span>
                        <input 
                          className="font-bold text-slate-800 truncate max-w-[120px] text-right bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary outline-none transition-colors"
                          value={v}
                          onChange={(e) => setInputVars(prev => ({ ...prev, [k]: e.target.value }))}
                        />
                      </div>
                    ))}
                 </div>

                 {/* Section 2: Conversation Variables */}
                 <div className="px-4 py-2 bg-slate-50 border-b border-gray-100 flex items-center text-xs font-bold text-slate-600">
                    <Clock size={12} className="mr-2" /> 对话变量
                 </div>
                 <div className="divide-y divide-gray-50 border-b border-gray-100">
                    {Object.entries(conversationVars).length === 0 ? (
                      <div className="px-4 py-2 text-xs text-slate-400 italic">无对话变量</div>
                    ) : (
                      Object.entries(conversationVars).map(([k, v]) => (
                        <div key={k} className="px-4 py-2 flex justify-between items-center text-xs">
                          <span className="font-mono text-slate-500 truncate mr-2" title={k}>{k}</span>
                          <span className={`font-bold truncate max-w-[120px] ${!v ? 'text-slate-300' : 'text-slate-800'}`}>{v || '-'}</span>
                        </div>
                      ))
                    )}
                 </div>

                 {/* Section 3: Extraction Variables */}
                 <div className="px-4 py-2 bg-slate-50 border-b border-gray-100 flex items-center text-xs font-bold text-slate-600">
                    <Database size={12} className="mr-2" /> 提取变量
                 </div>
                 <div className="divide-y divide-gray-50">
                    {Object.entries(extractionVars).length === 0 ? (
                      <div className="px-4 py-2 text-xs text-slate-400 italic">无提取配置</div>
                    ) : (
                      Object.entries(extractionVars).map(([k, v]) => (
                        <div key={k} className="px-4 py-2 flex justify-between items-center text-xs bg-purple-50/20">
                          <span className="font-mono text-slate-500 truncate mr-2" title={k}>{k}</span>
                          <span className={`font-bold truncate max-w-[120px] transition-all duration-300 ${v ? 'text-purple-700 bg-purple-100 px-1 rounded' : 'text-slate-300'}`}>{v || '等待提取...'}</span>
                        </div>
                      ))
                    )}
                 </div>
              </div>
            )}
         </div>

      </div>

    </div>
  );
};

export default BotDebugConfig;
