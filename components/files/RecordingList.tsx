
import React, { useState } from 'react';
import { Search, Plus, Trash2, Edit3, Play, Volume2, Mic, X, Loader2 } from 'lucide-react';
import { AudioRecording } from '../../types';
import { Input, Label, Select } from '../../components/ui/FormComponents';

const MOCK_RECORDINGS: AudioRecording[] = [
  { id: '1', name: '欢迎语_通用', text: '您好，这里是智能客服中心，请问有什么可以帮您？', voice: 'Azure-Xiaoxiao', duration: 3, url: 'mock_audio_1.mp3', updatedAt: 1715420000000 },
  { id: '2', name: '忙线提示', text: '坐席全忙，请稍后再拨。', voice: 'Azure-Yunxi', duration: 2, url: 'mock_audio_2.mp3', updatedAt: 1715410000000 },
];

export default function RecordingList() {
  const [recordings, setRecordings] = useState<AudioRecording[]>(MOCK_RECORDINGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AudioRecording | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<AudioRecording>>({
    name: '',
    text: '',
    voice: 'Azure-Xiaoxiao'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handleOpenModal = (item?: AudioRecording) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        text: '',
        voice: 'Azure-Xiaoxiao'
      });
    }
    setIsModalOpen(true);
  };

  const handleGenerate = () => {
    if (!formData.text) return alert("请输入TTS文本");
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      // Simulate generation success
      alert("试听音频生成成功！");
    }, 1500);
  };

  const handleSave = () => {
    if (!formData.name) return alert("请输入录音名称");
    if (!formData.text) return alert("请输入TTS文本");

    const newItem: AudioRecording = {
      id: editingItem ? editingItem.id : Date.now().toString(),
      name: formData.name || '',
      text: formData.text || '',
      voice: formData.voice || 'Azure-Xiaoxiao',
      duration: Math.floor(Math.random() * 5) + 2, // Mock duration
      url: 'generated_mock.mp3',
      updatedAt: Date.now()
    };

    if (editingItem) {
      setRecordings(prev => prev.map(r => r.id === editingItem.id ? newItem : r));
    } else {
      setRecordings(prev => [newItem, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确认删除该录音吗？')) {
      setRecordings(prev => prev.filter(r => r.id !== id));
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

  const filteredData = recordings.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
           <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                className="pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:border-primary outline-none w-64 bg-white"
                placeholder="搜索录音名称"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-sky-600 transition-all flex items-center shadow-sm"
        >
          <Plus size={16} className="mr-1.5" /> 新建录音
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex-1 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">名称</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-1/3">文本内容</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">音色</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">时长</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">更新时间</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                   <div className="font-medium text-slate-800 text-sm flex items-center">
                      <Volume2 size={14} className="mr-2 text-primary" />
                      {item.name}
                   </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 truncate max-w-xs" title={item.text}>
                   {item.text}
                </td>
                <td className="px-6 py-4">
                   <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">{item.voice}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                   {item.duration}s
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                   {new Date(item.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex justify-end space-x-3">
                      <button 
                        onClick={() => togglePlay(item.id)}
                        className={`p-1.5 rounded transition-colors ${playingId === item.id ? 'text-green-600 bg-green-50' : 'text-slate-400 hover:text-primary hover:bg-slate-100'}`}
                        title="试听"
                      >
                         <Play size={16} className={playingId === item.id ? 'fill-current' : ''} />
                      </button>
                      <button onClick={() => handleOpenModal(item)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded transition-colors">
                         <Edit3 size={16} />
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
      </div>

      {/* Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-[600px] overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-base font-bold text-slate-800 flex items-center">
                     <Mic size={18} className="mr-2 text-primary" />
                     {editingItem ? '编辑录音' : '新建录音'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                     <X size={20} />
                  </button>
               </div>
               
               <div className="p-6 space-y-5">
                  <Input 
                     label="录音名称" 
                     required 
                     placeholder="例如：开场白_通用版"
                     value={formData.name}
                     onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                  
                  <Select 
                     label="合成音色"
                     required
                     options={[
                        {label: 'Azure-Xiaoxiao (女声)', value: 'Azure-Xiaoxiao'},
                        {label: 'Azure-Yunxi (男声)', value: 'Azure-Yunxi'},
                        {label: 'Gemini-Voice-Kore', value: 'Gemini-Voice-Kore'}
                     ]}
                     value={formData.voice}
                     onChange={(e) => setFormData({...formData, voice: e.target.value})}
                  />

                  <div>
                     <Label label="TTS 文本内容" required />
                     <div className="relative">
                        <textarea 
                           className="w-full px-3 py-2 border border-slate-300 rounded focus:border-primary outline-none text-sm h-32 resize-none"
                           placeholder="请输入需要合成的语音文本..."
                           value={formData.text}
                           onChange={(e) => setFormData({...formData, text: e.target.value})}
                        />
                        <button 
                           onClick={handleGenerate}
                           disabled={isGenerating}
                           className="absolute bottom-3 right-3 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded text-xs font-bold hover:bg-indigo-100 flex items-center border border-indigo-100"
                        >
                           {isGenerating ? <Loader2 size={12} className="animate-spin mr-1"/> : <Volume2 size={12} className="mr-1"/>}
                           生成试听
                        </button>
                     </div>
                  </div>
               </div>

               <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded text-slate-600 text-sm hover:bg-white">
                     取消
                  </button>
                  <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-sky-600 shadow-sm">
                     保存
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
