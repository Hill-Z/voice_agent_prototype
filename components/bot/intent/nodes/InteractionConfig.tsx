
import React from 'react';
import { Play, Volume2, FileAudio } from 'lucide-react';
import { IntentNode } from '../../../../types';
import { Input, Label } from '../../../ui/FormComponents';
import SimpleErrorHandling from './SimpleErrorHandling';
import AudioSelector from './AudioSelector';

interface Props {
  node: IntentNode;
  onChange: (updates: any) => void;
  availableNodes?: { label: string; value: string }[];
}

const InteractionConfig: React.FC<Props> = ({ node, onChange, availableNodes = [] }) => {
  // 1. Play Audio (播放录音/TTS)
  if (node.subType === 'play_audio' || node.subType === 'play_tts') {
    const formatDuration = (seconds?: number) => {
      if (!seconds) return '--:--';
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const playType = node.config?.playType || 'audio';

    return (
      <>
        {/* 播放类型切换 */}
        <Label label="播放类型" />
        <div className="flex bg-slate-100 p-1 rounded mb-4">
          <button
            onClick={() => onChange({ playType: 'audio' })}
            className={`flex-1 py-2 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
              playType === 'audio'
                ? 'bg-white shadow text-primary'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileAudio size={14} />
            播放录音
          </button>
          <button
            onClick={() => onChange({ playType: 'tts' })}
            className={`flex-1 py-2 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
              playType === 'tts'
                ? 'bg-white shadow text-primary'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Volume2 size={14} />
            TTS合成
          </button>
        </div>

        {/* 播放录音配置 */}
        {playType === 'audio' && (
          <>
            <Label label="选择录音" required />
            <AudioSelector
              value={node.config?.audioId || ''}
              onChange={(audioId, audioName, audioUrl, duration) => {
                onChange({
                  audioId,
                  audioName,
                  audioUrl,
                  duration
                });
              }}
            />

            {/* 显示已选录音信息 */}
            {node.config?.audioId && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded mt-3">
                <div className="flex items-center gap-2">
                  <Play size={14} className="text-blue-500" />
                  <span className="text-sm font-medium text-slate-700">
                    {node.config.audioName}
                  </span>
                </div>
                {node.config.duration && (
                  <div className="text-xs text-slate-500 mt-1 ml-6">
                    时长: {formatDuration(node.config.duration)}
                  </div>
                )}
                {node.config.audioUrl && (
                  <div className="mt-2 ml-6">
                    <button
                      onClick={() => {
                        // 预览播放
                        const audio = new Audio(node.config.audioUrl);
                        audio.play().catch(e => console.error('播放失败:', e));
                      }}
                      className="text-xs text-primary hover:text-primary/80 flex items-center"
                    >
                      <Play size={12} className="mr-1" /> 预览播放
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* TTS合成配置 */}
        {playType === 'tts' && (
          <>
            <Label label="TTS文本" required />
            <textarea
              className="w-full h-32 px-3 py-2 text-sm border border-gray-200 rounded resize-none focus:border-primary outline-none leading-relaxed"
              placeholder="输入要合成的文本内容..."
              value={node.config?.ttsText || ''}
              onChange={(e) => onChange({ ttsText: e.target.value })}
            />
            <p className="text-xs text-slate-400 mt-1">
              支持变量插值，如：您好 {'{userName}'}
            </p>

            <div className="mt-4">
              <Label label="音色选择" />
              <select
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded bg-white outline-none"
                value={node.config?.ttsVoice || 'xiaoxiao'}
                onChange={(e) => onChange({ ttsVoice: e.target.value })}
              >
                <option value="xiaoxiao">晓晓 (女声)</option>
                <option value="xiaoyi">晓伊 (女声)</option>
                <option value="xiaoxuan">晓萱 (女声)</option>
                <option value="xiaochen">晓辰 (男声)</option>
                <option value="xiaoming">晓明 (男声)</option>
                <option value="xiaoyu">晓宇 (男声)</option>
              </select>
            </div>
          </>
        )}

        {/* 旧配置兼容提示 */}
        {node.config?.content && !node.config?.audioId && !node.config?.ttsText && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded mt-3">
            <p className="text-xs text-amber-700">
              ⚠️ 此节点包含旧版配置，请重新选择播放类型并配置。
            </p>
          </div>
        )}

        {/* Error Handling */}
        <div className="pt-4 border-t border-gray-100 mt-4">
          <SimpleErrorHandling
            label="播放异常时跳转至"
            tooltip={playType === 'audio' ? '包括录音文件不存在、格式不支持等' : '包括TTS合成失败、文本过长等'}
            value={node.config?.onErrorNodeId || ''}
            onChange={(value) => onChange({ onErrorNodeId: value })}
            availableNodes={availableNodes}
          />
        </div>
      </>
    );
  }

  // 2. Collect / Listen
  if (node.subType === 'collect') {
    return (
      <>
        <Label label="收集类型" />
        <select
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded bg-white outline-none"
          value={node.config?.collectType || 'intent'}
          onChange={(e) => onChange({ collectType: e.target.value })}
        >
          <option value="intent">意图识别 (Intent)</option>
          <option value="slot">槽位提取 (Slot)</option>
          <option value="dtmf">按键输入 (DTMF)</option>
        </select>

        {/* ASR Biasing */}
        <div className="mt-4">
          <Label label="ASR 偏置 (输入优化)" tooltip="针对不同类型的输入优化语音识别准确性" />
          <select
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded bg-white outline-none"
            value={node.config?.asrBiasing || 'default'}
            onChange={(e) => onChange({ asrBiasing: e.target.value })}
          >
            <option value="default">默认 (通用)</option>
            <option value="alphanumeric">字母数字 (验证码、订单号)</option>
            <option value="name">姓名拼写 (人名)</option>
            <option value="datetime">日期时间 (日期、时间)</option>
            <option value="number">数字 (金额、数量)</option>
            <option value="address">地址 (省市、门牌号)</option>
          </select>
          <p className="text-[10px] text-slate-400 mt-1">
            {node.config?.asrBiasing === 'default' && '使用通用识别模式'}
            {node.config?.asrBiasing === 'alphanumeric' && '优化识别 B-4-Z-Q-9 等验证码格式'}
            {node.config?.asrBiasing === 'name' && '优化识别人名拼音拼写，如 H-O-W-E Howe'}
            {node.config?.asrBiasing === 'datetime' && '优化识别日期时间表达，如二十七号、六月二十五号'}
            {node.config?.asrBiasing === 'number' && '优化识别数字和金额，如一百二十三块五'}
            {node.config?.asrBiasing === 'address' && '优化识别地址信息，如北京市朝阳区'}
          </p>
        </div>

        {node.config?.collectType !== 'intent' && (
          <Input
            label="存储变量名"
            placeholder="如: user_age"
            value={node.config?.variable || ''}
            onChange={(e) => onChange({ variable: e.target.value })}
          />
        )}
        {node.config?.collectType === 'dtmf' && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="最大位数"
              type="number"
              value={node.config?.dtmfConfig?.maxDigits || 1}
              onChange={(e) => onChange({ dtmfConfig: { ...node.config?.dtmfConfig, maxDigits: parseInt(e.target.value) } })}
            />
            <Input
              label="结束符"
              placeholder="#"
              value={node.config?.dtmfConfig?.terminator || '#'}
              onChange={(e) => onChange({ dtmfConfig: { ...node.config?.dtmfConfig, terminator: e.target.value } })}
            />
          </div>
        )}
      </>
    );
  }

  // 3. Wait (New)
  if (node.subType === 'wait') {
    return (
      <Input
        label="等待时长 (ms)"
        type="number"
        value={node.config?.durationMs || 1000}
        onChange={(e) => onChange({ durationMs: parseInt(e.target.value) })}
        placeholder="1000"
      />
    );
  }

  return null;
};

export default InteractionConfig;
