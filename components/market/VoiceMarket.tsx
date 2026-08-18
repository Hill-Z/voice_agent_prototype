
import React, { useState } from 'react';
import { 
  Music, Play, Pause, Star, Check, Globe, Filter, User
} from 'lucide-react';
import { VoiceProduct } from '../../types';

// --- MOCK DATA ---
const MOCK_VOICES: VoiceProduct[] = [
  { id: '1', name: 'Azure-Xiaoxiao', provider: 'Azure', gender: 'Female', language: '中文 (普通话)', tags: ['甜美', '客服首选', '自然'], isVip: false },
  { id: '2', name: 'Azure-Yunxi', provider: 'Azure', gender: 'Male', language: '中文 (普通话)', tags: ['沉稳', '男声', '新闻'], isVip: false },
  { id: '3', name: 'Gemini-Kore', provider: 'Google', gender: 'Male', language: 'English (US)', tags: ['Conversational', 'New'], isVip: true },
  { id: '4', name: 'Volc-Sichuan', provider: 'Volcengine', gender: 'Female', language: '中文 (四川话)', tags: ['方言', '亲切'], isVip: true },
  { id: '5', name: 'Azure-Xiaoyi', provider: 'Azure', gender: 'Female', language: '中文 (普通话)', tags: ['情感丰富', '有声书'], isVip: false },
  { id: '6', name: 'Google-Standard-A', provider: 'Google', gender: 'Female', language: 'English (UK)', tags: ['Standard', 'Formal'], isVip: false },
];

export default function VoiceMarket() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const togglePlay = (id: string) => {
    if (playingId === id) {
      setPlayingId(null); // Stop
    } else {
      setPlayingId(id); // Start (Mock)
      // Auto stop after 3s mock
      setTimeout(() => {
         setPlayingId(prev => prev === id ? null : prev);
      }, 3000);
    }
  };

  const filteredVoices = activeFilter === 'ALL' 
    ? MOCK_VOICES 
    : MOCK_VOICES.filter(v => v.language.includes(activeFilter) || v.tags.includes(activeFilter));

  return (
    <div className="p-8 max-w-full mx-auto w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Music size={24} className="mr-3 text-purple-600" />
            音色市场 (Voice Market)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            浏览并试听全球顶级 TTS 音色，为您的机器人注入灵魂。
          </p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
           {['ALL', '中文', 'English', '方言'].map(f => (
             <button 
               key={f}
               onClick={() => setActiveFilter(f)}
               className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeFilter === f ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               {f === 'ALL' ? '全部' : f}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-10">
         {filteredVoices.map(voice => (
            <div key={voice.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-all group relative overflow-hidden">
               {voice.isVip && (
                  <div className="absolute top-0 right-0 bg-gradient-to-bl from-amber-200 to-amber-100 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                     PRO
                  </div>
               )}
               
               <div className="flex items-start mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mr-4 shrink-0 ${
                     voice.gender === 'Female' ? 'bg-pink-50 text-pink-500' : 'bg-blue-50 text-blue-500'
                  }`}>
                     {voice.gender === 'Female' ? '👩' : '👨'}
                  </div>
                  <div>
                     <h3 className="font-bold text-slate-800 text-sm mb-1">{voice.name}</h3>
                     <div className="flex items-center text-xs text-slate-500 mb-1">
                        <Globe size={10} className="mr-1" /> {voice.language}
                     </div>
                     <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-500 font-medium">
                        {voice.provider}
                     </span>
                  </div>
               </div>

               <div className="flex flex-wrap gap-1.5 mb-6 h-12 overflow-hidden">
                  {voice.tags.map(tag => (
                     <span key={tag} className="px-2 py-0.5 rounded-md border border-slate-100 bg-slate-50 text-slate-600 text-[10px]">
                        {tag}
                     </span>
                  ))}
               </div>

               <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => togglePlay(voice.id)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                       playingId === voice.id 
                         ? 'bg-purple-100 text-purple-700 animate-pulse' 
                         : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                     {playingId === voice.id ? <Pause size={12} className="fill-current" /> : <Play size={12} className="fill-current" />}
                     <span>{playingId === voice.id ? '试听中...' : '试听'}</span>
                  </button>
                  
                  <button className="text-slate-400 hover:text-amber-500 transition-colors">
                     <Star size={18} />
                  </button>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
}
