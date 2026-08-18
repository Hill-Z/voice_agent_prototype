
import React, { useState, useRef } from 'react';
import { Search, Upload, Trash2, Play, Music, Pause } from 'lucide-react';
import { BackgroundMusic } from '../../types';

const MOCK_BGM: BackgroundMusic[] = [
  { id: '1', name: '轻快背景音', fileName: 'bgm_happy.mp3', size: '2.4 MB', url: 'mock_bgm_1.mp3', uploadedAt: 1715300000000 },
  { id: '2', name: '键盘敲击声', fileName: 'typing_sound_effect.wav', size: '0.5 MB', url: 'mock_bgm_2.wav', uploadedAt: 1715200000000 },
];

export default function BgmList() {
  const [bgmList, setBgmList] = useState<BackgroundMusic[]>(MOCK_BGM);
  const [searchTerm, setSearchTerm] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Mock upload
      const newBgm: BackgroundMusic = {
        id: Date.now().toString(),
        name: file.name.split('.')[0],
        fileName: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        url: 'uploaded_mock.mp3',
        uploadedAt: Date.now()
      };
      setBgmList(prev => [newBgm, ...prev]);
      alert("上传成功！");
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('确认删除该背景音吗？')) {
      setBgmList(prev => prev.filter(b => b.id !== id));
    }
  };

  const togglePlay = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
      setTimeout(() => setPlayingId(null), 3000); // Simulate play end
    }
  };

  const filteredData = bgmList.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
           <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                className="pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:border-primary outline-none w-64 bg-white"
                placeholder="搜索音乐名称"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
        <div>
           <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             accept="audio/*"
             onChange={handleFileChange}
           />
           <button 
             onClick={handleUploadClick}
             className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-sky-600 transition-all flex items-center shadow-sm"
           >
             <Upload size={16} className="mr-1.5" /> 上传音乐
           </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex-1 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">名称</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">文件名</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">文件大小</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">上传时间</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                   <div className="font-medium text-slate-800 text-sm flex items-center">
                      <Music size={14} className="mr-2 text-rose-500" />
                      {item.name}
                   </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                   {item.fileName}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                   {item.size}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                   {new Date(item.uploadedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex justify-end space-x-3">
                      <button 
                        onClick={() => togglePlay(item.id)}
                        className={`p-1.5 rounded transition-colors ${playingId === item.id ? 'text-green-600 bg-green-50' : 'text-slate-400 hover:text-primary hover:bg-slate-100'}`}
                        title="试听"
                      >
                         {playingId === item.id ? <Pause size={16} className="fill-current" /> : <Play size={16} className="fill-current" />}
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded transition-colors">
                         <Trash2 size={16} />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredData.length === 0 && (
           <div className="p-12 text-center text-slate-400 text-sm">
              暂无背景音乐文件，请点击右上角上传。
           </div>
        )}
      </div>
    </div>
  );
}
