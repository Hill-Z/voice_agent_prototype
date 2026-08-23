// 对话策略底部的非真人接听配置，采用紧凑列表并按需展开单项详情。
import React, { useState } from 'react';
import { Bot, ChevronDown, MessageSquareText, Route } from 'lucide-react';
import { BotConfiguration, IntelligentAnsweringFollowUpConfig, IntelligentAnsweringHandlingConfig } from '../../types';
import { Switch } from '../ui/FormComponents';

interface IntelligentAnsweringHandlingConfigProps {
  config: BotConfiguration;
  updateField: <K extends keyof BotConfiguration>(key: K, value: BotConfiguration[K]) => void;
}

interface StrategyRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  summary: string;
  onEnabledChange: (enabled: boolean) => void;
  expanded?: boolean;
  onExpandedChange?: () => void;
  children?: React.ReactNode;
}

interface RoutingTaskOption {
  id: string;
  name: string;
  contactLists: Array<{ id: string; name: string }>;
}

interface FollowUpFieldsProps {
  value: IntelligentAnsweringFollowUpConfig;
  selectedTask: RoutingTaskOption;
  ariaPrefix: string;
  onChange: (patch: Partial<IntelligentAnsweringFollowUpConfig>) => void;
  onTaskChange: (taskId: string) => void;
}

const ROUTING_TASK_OPTIONS: RoutingTaskOption[] = [
  { id: '84011', name: '语音机器人英文 Demo 外呼任务', contactLists: [{ id: '1', name: '高崇联系单' }] },
  {
    id: '83957',
    name: '泰康客户回访外呼任务',
    contactLists: [{ id: '2', name: '北京车展留资名单' }, { id: '3', name: '到期客户回访名单' }],
  },
];

const DEFAULT_CONFIG: IntelligentAnsweringHandlingConfig = {
  ivr: { enabled: false },
  voicemail: {
    enabled: true,
    callAction: 'leave_message',
    message: '您好，这里是智能语音助手。稍后我们会再次与您联系，感谢您的关注。',
    nextAction: 'none',
    retryDelayMinutes: 30,
    maxRetryAttempts: 2,
    targetTaskId: ROUTING_TASK_OPTIONS[0].id,
    targetContactListId: ROUTING_TASK_OPTIONS[0].contactLists[0].id,
  },
  aiAssistant: {
    enabled: true,
    callAction: 'hangup',
    message: '您好，这里是智能语音助手。请转告机主，我们稍后会再次与他联系。',
    nextAction: 'none',
    retryDelayMinutes: 30,
    maxRetryAttempts: 2,
    targetTaskId: ROUTING_TASK_OPTIONS[0].id,
    targetContactListId: ROUTING_TASK_OPTIONS[0].contactLists[0].id,
  },
};

const SELECT_CLASS_NAME = 'h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20';

// 合并旧机器人缺失的字段，保证新增配置拥有稳定默认值。
function getHandlingConfig(value?: IntelligentAnsweringHandlingConfig): IntelligentAnsweringHandlingConfig {
  return {
    ...DEFAULT_CONFIG,
    ...value,
    ivr: { ...DEFAULT_CONFIG.ivr, ...value?.ivr },
    voicemail: { ...DEFAULT_CONFIG.voicemail, ...value?.voicemail },
    aiAssistant: { ...DEFAULT_CONFIG.aiAssistant, ...value?.aiAssistant },
  };
}

// 生成折叠状态下的后续操作摘要。
function getFollowUpSummary(value: IntelligentAnsweringFollowUpConfig, selectedTask: RoutingTaskOption): string {
  if (value.nextAction === 'retry') return `${value.retryDelayMinutes} 分钟后重呼，最多 ${value.maxRetryAttempts} 次`;
  if (value.nextAction === 'route_task') return `加入 ${selectedTask.name}`;
  return '无后续操作';
}

// 以紧凑行展示策略，只有正在配置的策略展开详情。
const StrategyRow: React.FC<StrategyRowProps> = ({ icon, title, description, enabled, summary, onEnabledChange, expanded = false, onExpandedChange, children }) => (
  <div className="border-b border-gray-100 last:border-b-0">
    <div className="grid gap-3 px-5 py-3 lg:grid-cols-[minmax(260px,0.9fr)_minmax(260px,1fr)_150px] lg:items-center">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-100 bg-sky-50 text-primary">{icon}</div>
        <div>
          <div className="text-sm font-bold text-slate-800">{title}</div>
          <div className="mt-0.5 text-xs leading-4 text-slate-500">{description}</div>
        </div>
      </div>
      <div className={`truncate text-sm ${enabled ? 'text-slate-600' : 'text-slate-400'}`} title={summary}>{summary}</div>
      <div className="flex items-center justify-end gap-3">
        {onExpandedChange && (
          <button type="button" onClick={onExpandedChange} disabled={!enabled} aria-expanded={expanded} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-sky-50 disabled:cursor-not-allowed disabled:text-slate-300">
            {expanded ? '收起' : '配置'}
            <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}
        <Switch label="" checked={enabled} onChange={onEnabledChange} ariaLabel={`${title}策略`} compact />
      </div>
    </div>
    {expanded && children && <div className="border-t border-gray-100 bg-slate-50/60 px-5 py-4 lg:pl-16">{children}</div>}
  </div>
);

// 语音留言和 AI 助手共用同一套后续操作表单。
const FollowUpFields: React.FC<FollowUpFieldsProps> = ({ value, selectedTask, ariaPrefix, onChange, onTaskChange }) => (
  <div className="space-y-3">
    <label className="block text-xs font-medium text-slate-600">
      后续操作
      <select aria-label={`${ariaPrefix}后续操作`} value={value.nextAction} onChange={(event) => onChange({ nextAction: event.target.value as IntelligentAnsweringFollowUpConfig['nextAction'] })} className={`${SELECT_CLASS_NAME} mt-1.5 w-full sm:max-w-xs`}>
        <option value="none">无</option>
        <option value="retry">延时重呼</option>
        <option value="route_task">加入指定外呼任务</option>
      </select>
    </label>

    {value.nextAction === 'retry' && (
      <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-600">
          重呼时间
          <div className="mt-1.5 flex h-9 items-center rounded-lg border border-gray-200 bg-white px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <input aria-label={`${ariaPrefix}重呼分钟数`} type="number" min={1} max={10080} value={value.retryDelayMinutes} onChange={(event) => onChange({ retryDelayMinutes: Math.max(1, Math.min(10080, Number(event.target.value) || 1)) })} className="h-full w-16 bg-transparent text-center text-sm font-semibold text-slate-700 outline-none" />
            <span className="ml-2 text-xs text-slate-500">分钟后重呼</span>
          </div>
        </label>
        <label className="text-xs font-medium text-slate-600">
          重呼上限
          <div className="mt-1.5 flex h-9 items-center rounded-lg border border-gray-200 bg-white px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <input aria-label={`${ariaPrefix}最多重呼次数`} type="number" min={1} max={10} value={value.maxRetryAttempts} onChange={(event) => onChange({ maxRetryAttempts: Math.max(1, Math.min(10, Number(event.target.value) || 1)) })} className="h-full w-16 bg-transparent text-center text-sm font-semibold text-slate-700 outline-none" />
            <span className="ml-2 text-xs text-slate-500">次后停止</span>
          </div>
        </label>
      </div>
    )}

    {value.nextAction === 'route_task' && (
      <div className="max-w-2xl space-y-2">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600">
            外呼任务
            <select aria-label={`${ariaPrefix}目标外呼任务`} value={selectedTask.id} onChange={(event) => onTaskChange(event.target.value)} className={`${SELECT_CLASS_NAME} mt-1.5 w-full`}>
              {ROUTING_TASK_OPTIONS.map((task) => <option key={task.id} value={task.id}>{task.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            联系单
            <select aria-label={`${ariaPrefix}目标联系单`} value={value.targetContactListId || selectedTask.contactLists[0]?.id || ''} onChange={(event) => onChange({ targetContactListId: event.target.value })} className={`${SELECT_CLASS_NAME} mt-1.5 w-full`}>
              {selectedTask.contactLists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}
            </select>
          </label>
        </div>
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">同一联系人最多流转一次，已处理过的任务不可再次加入。</div>
      </div>
    )}
  </div>
);

// 编辑对话策略中的智能接听识别与后续动作。
const IntelligentAnsweringHandlingConfigView: React.FC<IntelligentAnsweringHandlingConfigProps> = ({ config, updateField }) => {
  const [expandedStrategy, setExpandedStrategy] = useState<'voicemail' | 'aiAssistant' | null>(null);
  const handling = getHandlingConfig(config.intelligentAnsweringHandling);
  const selectedVoicemailTask = ROUTING_TASK_OPTIONS.find((task) => task.id === handling.voicemail.targetTaskId) || ROUTING_TASK_OPTIONS[0];
  const selectedAiAssistantTask = ROUTING_TASK_OPTIONS.find((task) => task.id === handling.aiAssistant.targetTaskId) || ROUTING_TASK_OPTIONS[0];

  // 将局部配置写回当前机器人。
  const updateHandling = (patch: Partial<IntelligentAnsweringHandlingConfig>): void => updateField('intelligentAnsweringHandling', { ...handling, ...patch });

  // 切换语音留言后续任务时同步选择第一张联系单。
  const updateVoicemailRoutingTask = (taskId: string): void => {
    const task = ROUTING_TASK_OPTIONS.find((item) => item.id === taskId) || ROUTING_TASK_OPTIONS[0];
    updateHandling({ voicemail: { ...handling.voicemail, targetTaskId: task.id, targetContactListId: task.contactLists[0]?.id } });
  };

  // 切换 AI 助手后续任务时同步选择第一张联系单。
  const updateAiAssistantRoutingTask = (taskId: string): void => {
    const task = ROUTING_TASK_OPTIONS.find((item) => item.id === taskId) || ROUTING_TASK_OPTIONS[0];
    updateHandling({ aiAssistant: { ...handling.aiAssistant, targetTaskId: task.id, targetContactListId: task.contactLists[0]?.id } });
  };

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-slate-50/50 px-5 py-3">
        <h3 className="text-base font-bold tracking-tight text-slate-800">智能接听识别与处理</h3>
        <p className="mt-0.5 text-xs text-slate-500">识别非真人接听，按类型执行通话及后续处理。</p>
      </div>

      <StrategyRow icon={<Route size={16} />} title="IVR 智能导航" description="识别对端导航菜单并自动选择路径。" enabled={handling.ivr.enabled} summary="按业务意图自动导航" onEnabledChange={(enabled) => updateHandling({ ivr: { enabled } })} />

      <StrategyRow
        icon={<MessageSquareText size={16} />}
        title="语音留言"
        description="识别提示音后留言或直接挂机。"
        enabled={handling.voicemail.enabled}
        summary={`${handling.voicemail.callAction === 'leave_message' ? '留言后挂机' : '直接挂机'} · ${getFollowUpSummary(handling.voicemail, selectedVoicemailTask)}`}
        expanded={expandedStrategy === 'voicemail'}
        onExpandedChange={() => setExpandedStrategy((current) => current === 'voicemail' ? null : 'voicemail')}
        onEnabledChange={(enabled) => {
          updateHandling({ voicemail: { ...handling.voicemail, enabled } });
          if (!enabled && expandedStrategy === 'voicemail') setExpandedStrategy(null);
        }}
      >
        <div className="space-y-4">
          <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-slate-600">
              通话处理
              <select aria-label="语音留言通话处理" value={handling.voicemail.callAction} onChange={(event) => updateHandling({ voicemail: { ...handling.voicemail, callAction: event.target.value as IntelligentAnsweringHandlingConfig['voicemail']['callAction'] } })} className={`${SELECT_CLASS_NAME} mt-1.5 w-full`}>
                <option value="leave_message">留言后挂机</option>
                <option value="hangup">直接挂机</option>
              </select>
            </label>
            {handling.voicemail.callAction === 'leave_message' && (
              <label className="text-xs font-medium text-slate-600">
                留言内容
                <input aria-label="留言内容" value={handling.voicemail.message} onChange={(event) => updateHandling({ voicemail: { ...handling.voicemail, message: event.target.value } })} placeholder="输入提示音后播放的留言" className="mt-1.5 h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </label>
            )}
          </div>
          <FollowUpFields value={handling.voicemail} selectedTask={selectedVoicemailTask} ariaPrefix="语音留言" onChange={(patch) => updateHandling({ voicemail: { ...handling.voicemail, ...patch } })} onTaskChange={updateVoicemailRoutingTask} />
        </div>
      </StrategyRow>

      <StrategyRow
        icon={<Bot size={16} />}
        title="AI 助手接听"
        description="仅高置信度识别后执行。"
        enabled={handling.aiAssistant.enabled}
        summary={`${handling.aiAssistant.callAction === 'play_message' ? '播报后挂机' : '直接挂机'} · ${getFollowUpSummary(handling.aiAssistant, selectedAiAssistantTask)}`}
        expanded={expandedStrategy === 'aiAssistant'}
        onExpandedChange={() => setExpandedStrategy((current) => current === 'aiAssistant' ? null : 'aiAssistant')}
        onEnabledChange={(enabled) => {
          updateHandling({ aiAssistant: { ...handling.aiAssistant, enabled } });
          if (!enabled && expandedStrategy === 'aiAssistant') setExpandedStrategy(null);
        }}
      >
        <div className="space-y-4">
          <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-slate-600">
              通话处理
              <select aria-label="AI 助手通话处理" value={handling.aiAssistant.callAction} onChange={(event) => updateHandling({ aiAssistant: { ...handling.aiAssistant, callAction: event.target.value as IntelligentAnsweringHandlingConfig['aiAssistant']['callAction'] } })} className={`${SELECT_CLASS_NAME} mt-1.5 w-full`}>
                <option value="play_message">播报说明后挂机</option>
                <option value="hangup">直接挂机</option>
              </select>
            </label>
            {handling.aiAssistant.callAction === 'play_message' && (
              <label className="text-xs font-medium text-slate-600">
                播报内容
                <input aria-label="AI 助手播报内容" value={handling.aiAssistant.message} onChange={(event) => updateHandling({ aiAssistant: { ...handling.aiAssistant, message: event.target.value } })} placeholder="输入向对端 AI 助手播报的说明" className="mt-1.5 h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </label>
            )}
          </div>
          <FollowUpFields value={handling.aiAssistant} selectedTask={selectedAiAssistantTask} ariaPrefix="AI 助手" onChange={(patch) => updateHandling({ aiAssistant: { ...handling.aiAssistant, ...patch } })} onTaskChange={updateAiAssistantRoutingTask} />
        </div>
      </StrategyRow>

      <div className="border-t border-gray-100 bg-slate-50 px-5 py-2 text-[11px] leading-5 text-slate-500">重呼和任务流转仍受全局触达上限、可呼叫时段及黑名单规则限制。</div>
    </div>
  );
};

export default IntelligentAnsweringHandlingConfigView;
