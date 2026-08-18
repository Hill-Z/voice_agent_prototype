// 单个机器人的主题匹配设置，与 BotTopicManager 配合保存匹配上下文配置。
import React, { useState } from 'react';
import { ChevronDown, Settings2 } from 'lucide-react';
import { TopicSkillLibraryConfig } from '../../types';
import { Switch } from '../ui/FormComponents';

type TopicMatchingSettingsPatch = Required<Pick<
  TopicSkillLibraryConfig,
  'historyConversationEnabled' | 'historyConversationCount' | 'previousTopicContextEnabled'
>>;

interface TopicMatchingSettingsProps {
  value: TopicMatchingSettingsPatch;
  onChange: (patch: Partial<TopicMatchingSettingsPatch>) => void;
}

const MIN_HISTORY_COUNT = 1;
const MAX_HISTORY_COUNT = 50;

// 将历史消息条数限制在可配置范围内。
const normalizeHistoryCount = (value: number): number => (
  Math.min(MAX_HISTORY_COUNT, Math.max(MIN_HISTORY_COUNT, Math.round(value)))
);

// 展示默认收起的主题匹配设置，并将修改同步到机器人配置。
const TopicMatchingSettings: React.FC<TopicMatchingSettingsProps> = ({ value, onChange }) => {
  const [expanded, setExpanded] = useState<boolean>(false);

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--color-semantic-border-default)] bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls="topic-matching-settings-content"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-primary">
            <Settings2 size={18} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-800">主题匹配设置</span>
            <span className="mt-0.5 block text-xs text-slate-500">配置模型判断下一个主题时可参考的对话上下文</span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600 sm:inline-flex">
            历史对话 {value.historyConversationEnabled ? `${value.historyConversationCount} 条` : '未启用'}
          </span>
          <ChevronDown
            size={18}
            className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {expanded && (
        <div id="topic-matching-settings-content" className="border-t border-slate-100 px-6 py-2">
          <div className="flex min-h-16 items-center justify-between gap-6 border-b border-slate-100 py-3">
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-slate-800">历史对话辅助匹配</h4>
              <p className="mt-1 text-xs text-slate-500">参考最近的机器人和用户消息，与当前输入一起判断主题。</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <label htmlFor="history-conversation-count" className="text-xs text-slate-600">历史消息</label>
              <input
                id="history-conversation-count"
                aria-label="历史消息条数"
                type="number"
                min={MIN_HISTORY_COUNT}
                max={MAX_HISTORY_COUNT}
                disabled={!value.historyConversationEnabled}
                value={value.historyConversationCount}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  if (Number.isFinite(nextValue)) {
                    onChange({ historyConversationCount: normalizeHistoryCount(nextValue) });
                  }
                }}
                className="h-8 w-16 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-800 outline-none transition-colors hover:border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              <span className="text-xs text-slate-500">条</span>
              <Switch
                label=""
                ariaLabel="历史对话辅助匹配"
                compact
                checked={value.historyConversationEnabled}
                onChange={(checked) => onChange({ historyConversationEnabled: checked })}
              />
            </div>
          </div>

          <div className="flex min-h-16 items-center justify-between gap-6 py-3">
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-slate-800">上一轮主题辅助匹配</h4>
              <p className="mt-1 text-xs text-slate-500">将上一轮匹配主题作为本轮判断线索。</p>
            </div>
            <Switch
              label=""
              ariaLabel="上一轮主题辅助匹配"
              compact
              checked={value.previousTopicContextEnabled}
              onChange={(checked) => onChange({ previousTopicContextEnabled: checked })}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default TopicMatchingSettings;
