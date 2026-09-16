// 复用在 ASR 与开场白原配置位置的紧凑打断策略控件。
import React from 'react';
import { BotConfiguration } from '../../types';
import { Label, Switch } from '../ui/FormComponents';

type InterruptionMode = NonNullable<BotConfiguration['globalInterruptionMode']>;

interface InterruptionPolicyControlProps {
  label: string;
  mode: InterruptionMode;
  rounds: number;
  disabled?: boolean;
  onModeChange: (mode: InterruptionMode) => void;
  onRoundsChange: (rounds: number) => void;
}

// 1 次即为原“允许打断”的语义；2、3 次用于降低误打断。
const normalizeRounds = (value: number) => Math.max(1, Math.min(3, value || 1));

const InterruptionPolicyControl: React.FC<InterruptionPolicyControlProps> = ({
  label,
  mode,
  rounds,
  disabled = false,
  onModeChange,
  onRoundsChange,
}) => (
  <div className={disabled ? 'pointer-events-none opacity-45' : ''}>
    <Label label={label} tooltip="有效表达按完整识别的客户语音片段计算，不占用正常对话轮次；未触发时将在播报结束后继续处理。" />
    <div className="flex flex-wrap items-center gap-4">
      <Switch
        label="允许打断"
        checked={mode !== 'never'}
        compact
        onChange={(enabled) => onModeChange(enabled ? (normalizeRounds(rounds) === 1 ? 'always' : 'after_repeated') : 'never')}
      />
      {mode !== 'never' && (
        <div className="flex h-8 items-center rounded-md border border-blue-100 bg-blue-50 px-2 text-xs text-slate-600">
          <span className="mr-2">有效表达次数</span>
          {[1, 2, 3].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => {
                onRoundsChange(count);
                onModeChange(count === 1 ? 'always' : 'after_repeated');
              }}
              className={`h-7 min-w-7 rounded px-1 font-bold transition-colors ${rounds === count ? 'bg-white text-primary shadow-sm ring-1 ring-blue-200' : 'text-slate-500 hover:bg-white/70'}`}
            >
              {count}
            </button>
          ))}
          <span className="ml-1">次后打断</span>
        </div>
      )}
    </div>
  </div>
);

export default InterruptionPolicyControl;
