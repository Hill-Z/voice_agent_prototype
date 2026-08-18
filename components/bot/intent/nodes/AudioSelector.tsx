import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Play, Clock } from 'lucide-react';
import { AudioMarketItem } from '../../../types';

interface AudioSelectorProps {
  value: string;
  onChange: (audioId: string, audioName: string, audioUrl: string, duration?: number) => void;
  audioList?: AudioMarketItem[];
}

// 模拟录音市场数据
const MOCK_AUDIO_LIST: AudioMarketItem[] = [
  { id: '1', name: '欢迎语.wav', url: '/audio/welcome.wav', duration: 5, category: '欢迎语' },
  { id: '2', name: '欢迎语2.wav', url: '/audio/welcome2.wav', duration: 3, category: '欢迎语' },
  { id: '3', name: '提示音1.wav', url: '/audio/tip1.wav', duration: 2, category: '提示音' },
  { id: '4', name: '提示音2.wav', url: '/audio/tip2.wav', duration: 1, category: '提示音' },
  { id: '5', name: '转接提示.wav', url: '/audio/transfer.wav', duration: 4, category: '转接' },
  { id: '6', name: '等待音乐.wav', url: '/audio/hold.wav', duration: 30, category: '等待音乐' },
  { id: '7', name: '结束语.wav', url: '/audio/goodbye.wav', duration: 3, category: '结束语' },
];

export default function AudioSelector({
  value,
  onChange,
  audioList = MOCK_AUDIO_LIST,
}: AudioSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedAudio = audioList.find(audio => audio.id === value);

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 按分类分组
  const groupedAudio = audioList.reduce((acc, audio) => {
    const category = audio.category || '未分类';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(audio);
    return acc;
  }, {} as Record<string, AudioMarketItem[]>);

  // 过滤
  const filteredAudio = audioList.filter(audio =>
    audio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (audio.category && audio.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelect = (audio: AudioMarketItem) => {
    onChange(audio.id, audio.name, audio.url, audio.duration);
    setIsOpen(false);
    setSearchQuery('');
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 选择框 */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded text-sm cursor-pointer hover:border-primary transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedAudio ? (
            <>
              <Play size={14} className="text-blue-500" />
              <span className="truncate text-slate-700">{selectedAudio.name}</span>
              <span className="text-xs text-slate-400">
                {formatDuration(selectedAudio.duration)}
              </span>
            </>
          ) : (
            <span className="text-slate-400">-- 从录音市场选择 --</span>
          )}
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 遮罩 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
            {/* 搜索框 */}
            <div className="p-2 border-b border-slate-100">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded">
                <Search size={14} className="text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索录音..."
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* 录音列表 */}
            <div className="max-h-64 overflow-y-auto">
              {searchQuery ? (
                // 搜索结果
                filteredAudio.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-slate-400">
                    未找到匹配的录音
                  </div>
                ) : (
                  filteredAudio.map((audio) => (
                    <button
                      key={audio.id}
                      onClick={() => handleSelect(audio)}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                        value === audio.id
                          ? 'bg-blue-50 text-primary'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Play size={12} className="text-slate-400" />
                        <span>{audio.name}</span>
                      </div>
                      <span className="text-slate-400 text-[10px]">
                        {formatDuration(audio.duration)}
                      </span>
                    </button>
                  ))
                )
              ) : (
                // 按分类显示
                Object.entries(groupedAudio).map(([category, audios]) => (
                  <div key={category}>
                    <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                      {category}
                    </div>
                    {audios.map((audio) => (
                      <button
                        key={audio.id}
                        onClick={() => handleSelect(audio)}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                          value === audio.id
                            ? 'bg-blue-50 text-primary'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Play size={12} className="text-slate-400" />
                          <span>{audio.name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                          <Clock size={10} />
                          {formatDuration(audio.duration)}
                        </div>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
