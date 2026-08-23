// 音色市场页面，提供基础筛选和列表试听，不承载音色配置或管理功能。
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Music2, Pause, Play, RotateCcw, Search, Volume2} from 'lucide-react';
import {VoiceProduct} from '../../types';
import {MOCK_VOICES, VOICE_GENDERS, VOICE_LANGUAGES, VOICE_PROVIDERS} from './voiceMarketData';

const GENDER_LABELS: Record<VoiceProduct['gender'], string> = {
  Female: '女声',
  Male: '男声',
  Neutral: '中性',
};

export default function VoiceMarket(): React.ReactElement {
  const [keyword, setKeyword] = useState<string>('');
  const [provider, setProvider] = useState<string>('ALL');
  const [language, setLanguage] = useState<string>('ALL');
  const [gender, setGender] = useState<string>('ALL');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const playbackTimerRef = useRef<number | null>(null);

  // 页面退出时清理原型试听计时器。
  useEffect(() => () => {
    if (playbackTimerRef.current !== null) window.clearTimeout(playbackTimerRef.current);
  }, []);

  const filteredVoices = useMemo<VoiceProduct[]>(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return MOCK_VOICES.filter((voice) => {
      const matchesKeyword = !normalizedKeyword || [voice.name, voice.voiceId, ...voice.tags]
        .join(' ')
        .toLowerCase()
        .includes(normalizedKeyword);
      const matchesProvider = provider === 'ALL' || voice.provider === provider;
      const matchesLanguage = language === 'ALL' || voice.languages.includes(language);
      const matchesGender = gender === 'ALL' || voice.gender === gender;
      return matchesKeyword && matchesProvider && matchesLanguage && matchesGender;
    });
  }, [gender, keyword, language, provider]);

  const hasActiveFilters = keyword.trim() !== '' || provider !== 'ALL' || language !== 'ALL' || gender !== 'ALL';

  // 切换当前试听音色，原型状态会在四秒后自动停止。
  const togglePlay = (voiceId: string): void => {
    if (playbackTimerRef.current !== null) window.clearTimeout(playbackTimerRef.current);
    if (playingId === voiceId) {
      setPlayingId(null);
      return;
    }
    setPlayingId(voiceId);
    playbackTimerRef.current = window.setTimeout(() => setPlayingId(null), 4000);
  };

  // 清空搜索和三个筛选项。
  const resetFilters = (): void => {
    setKeyword('');
    setProvider('ALL');
    setLanguage('ALL');
    setGender('ALL');
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-slate-50/70">
      <header className="shrink-0 border-b border-slate-200 bg-white px-7 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Music2 size={19} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">音色市场</h1>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                {MOCK_VOICES.length} 个音色
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">查看并试听当前已接入的音色。</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={keyword}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setKeyword(event.target.value)}
              className="field pl-9"
              placeholder="搜索音色名称、ID 或标签"
              aria-label="搜索音色"
            />
          </div>
          <select value={provider} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setProvider(event.target.value)} className="field w-36" aria-label="按厂商筛选">
            {VOICE_PROVIDERS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select value={language} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setLanguage(event.target.value)} className="field w-48" aria-label="按语种筛选">
            {VOICE_LANGUAGES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select value={gender} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setGender(event.target.value)} className="field w-32" aria-label="按性别筛选">
            {VOICE_GENDERS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          {hasActiveFilters && (
            <button type="button" onClick={resetFilters} className="button-secondary">
              <RotateCcw size={14} /> 清空
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-auto px-7 py-5">
        <p className="mb-3 text-xs text-slate-500">共找到 <strong className="font-semibold text-slate-800">{filteredVoices.length}</strong> 个音色</p>

        <div className="min-w-[980px] overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="grid grid-cols-12 items-center gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[11px] font-semibold text-slate-500">
            <span className="col-span-3">音色</span>
            <span className="col-span-2">厂商</span>
            <span className="col-span-2">语种</span>
            <span className="col-span-1">性别</span>
            <span className="col-span-2">标签</span>
            <span className="col-span-2 text-right">试听</span>
          </div>

          {filteredVoices.length > 0 ? filteredVoices.map((voice) => {
            const isPlaying = playingId === voice.id;
            return (
              <div
                key={voice.id}
                className={`grid grid-cols-12 items-center gap-4 border-b border-slate-100 px-5 py-3.5 last:border-b-0 ${isPlaying ? 'bg-blue-50/50' : 'hover:bg-slate-50/70'}`}
              >
                <div className="col-span-3 flex min-w-0 items-center gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isPlaying ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Volume2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{voice.name}</div>
                    <div className="mt-0.5 truncate font-mono text-[10px] text-slate-400">{voice.voiceId}</div>
                  </div>
                </div>
                <span className="col-span-2 text-xs font-medium text-slate-700">{voice.provider}</span>
                <div className="col-span-2 flex flex-wrap gap-1">
                  {voice.languages.map((item) => (
                    <span key={item} className="rounded bg-slate-100 px-1.5 py-1 text-[10px] text-slate-600">{item}</span>
                  ))}
                </div>
                <span className="col-span-1 text-xs text-slate-600">{GENDER_LABELS[voice.gender]}</span>
                <div className="col-span-2 flex flex-wrap gap-1">
                  {voice.tags.map((tag) => (
                    <span key={tag} className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500">{tag}</span>
                  ))}
                </div>
                <div className="col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => togglePlay(voice.id)}
                    className={`inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition-colors ${isPlaying ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'}`}
                    aria-label={`${isPlaying ? '停止试听' : '试听'} ${voice.name}`}
                  >
                    {isPlaying ? <Pause size={13} /> : <Play size={13} className="fill-current" />}
                    {isPlaying ? '停止' : '播放'}
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <Search size={20} className="text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-700">没有符合条件的音色</p>
              <button type="button" onClick={resetFilters} className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700">清空筛选</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
