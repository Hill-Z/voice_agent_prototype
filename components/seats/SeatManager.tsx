
import React, { useState } from 'react';
import {
  Headset, Plus, Search, Edit3, Trash2, Power, PowerOff, Users,
  Activity, AlertTriangle
} from 'lucide-react';
import { Seat, BotConfiguration, AudioRecording } from '../../types';
import { Input, Select, Label, Switch } from '../ui/FormComponents';

interface SeatManagerProps {
  bots: BotConfiguration[];
}

const TOTAL_LICENSE_CAPACITY = 200; // Mock Total Purchased Capacity

// 坐席排队时可播放的提示音，后续可替换为录音管理接口数据。
const QUEUE_PROMPT_RECORDINGS: AudioRecording[] = [
  { id: 'queue_default', name: '排队语音提示', text: '当前坐席繁忙，请您稍候，马上为您接入。', voice: 'Azure-Xiaoxiao', duration: 5, url: 'queue_default.mp3', updatedAt: 1773130717000 },
  { id: 'queue_busy', name: '忙线排队提示', text: '坐席正在服务其他客户，请您耐心等待。', voice: 'Azure-Yunxi', duration: 4, url: 'queue_busy.mp3', updatedAt: 1773130717000 },
  { id: 'queue_vip', name: '优先排队提示', text: '已为您进入优先排队，请稍候。', voice: 'Azure-Xiaoxiao', duration: 4, url: 'queue_vip.mp3', updatedAt: 1773130717000 },
];

const DEFAULT_QUEUE_PROMPT_AUDIO_ID = QUEUE_PROMPT_RECORDINGS[0].id;

const MOCK_SEATS: Seat[] = [
  { id: '9', name: '泰康Demo-02', botConfigId: 'bot_didi_demo', concurrency: 5, queuePromptAudioId: DEFAULT_QUEUE_PROMPT_AUDIO_ID, status: 'active', createdAt: 1773130717000 },
  { id: '8', name: '泰康Demo-01', botConfigId: 'bot_didi_demo', concurrency: 5, queuePromptAudioId: DEFAULT_QUEUE_PROMPT_AUDIO_ID, status: 'active', createdAt: 1773130694000 },
  { id: '6', name: '天鹅到家', botConfigId: 'bot_didi_demo', concurrency: 1, status: 'active', createdAt: 1772692096000 },
  { id: '3', name: '智能体坐席_外卖骑手', botConfigId: '', concurrency: 1, status: 'disabled', createdAt: 1768805996000 },
  { id: '5', name: '【勿动】官网呼入', botConfigId: '', concurrency: 10, status: 'active', createdAt: 1772678339000 },
];

export default function SeatManager({ bots }: SeatManagerProps) {
  const [seats, setSeats] = useState<Seat[]>(MOCK_SEATS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);

  // Form Data
  const [formData, setFormData] = useState<Partial<Seat>>({
    name: '',
    botConfigId: '',
    concurrency: 1,
    queuePromptAudioId: DEFAULT_QUEUE_PROMPT_AUDIO_ID,
    status: 'active',
  });

  // Calculations
  const totalUsed = seats.filter(s => s.status === 'active').reduce((sum, s) => sum + s.concurrency, 0);
  const isOverCapacity = totalUsed > TOTAL_LICENSE_CAPACITY;

  const handleOpenModal = (seat?: Seat) => {
    if (seat) {
      setEditingSeat(seat);
      setFormData({ ...seat });
    } else {
      setEditingSeat(null);
      setFormData({
        name: '',
        botConfigId: '',
        concurrency: 1,
        queuePromptAudioId: DEFAULT_QUEUE_PROMPT_AUDIO_ID,
        status: 'active',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return alert("请输入座席名称");
    if (!formData.botConfigId) return alert("请选择机器人配置");

    const newSeat = {
      ...formData,
      id: editingSeat ? editingSeat.id : Date.now().toString(),
      queuePromptAudioId: formData.queuePromptAudioId || DEFAULT_QUEUE_PROMPT_AUDIO_ID,
      createdAt: editingSeat ? editingSeat.createdAt : Date.now()
    } as Seat;

    if (editingSeat) {
      setSeats(prev => prev.map(s => s.id === editingSeat.id ? newSeat : s));
    } else {
      setSeats(prev => [newSeat, ...prev]);
    }
    setIsModalOpen(false);
  };

  const toggleStatus = (id: string) => {
    setSeats(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'active' ? 'disabled' : 'active' } : s));
  };

  const handleDelete = (id: string) => {
    if(confirm('确认删除该坐席吗？')) {
      setSeats(prev => prev.filter(s => s.id !== id));
    }
  };

  const getBotName = (id: string) => {
    const bot = bots.find(b => b.id === id);
    return bot ? bot.name : (id ? '未知配置' : '-');
  };

  // 根据录音 ID 显示坐席使用的排队提示音名称。
  const getQueuePromptName = (id?: string) => {
    const recording = QUEUE_PROMPT_RECORDINGS.find(item => item.id === id);
    return recording ? recording.name : '默认排队语音';
  };

  return (
    <div className="p-8 max-w-full mx-auto w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Headset size={24} className="mr-3 text-primary" />
            智呼机器人坐席管理
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            管理AI坐席实例，绑定话术配置并分配并发资源。
          </p>
        </div>
      </div>

      {/* Compact Status Strip */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm px-5 py-3 mb-6 flex items-center justify-between">
         <div className="flex items-center space-x-8">
            <div className="flex items-center">
               <span className="text-xs font-bold text-slate-500 mr-2 uppercase tracking-wide">总并发许可</span>
               <span className="text-xl font-bold text-slate-800">{TOTAL_LICENSE_CAPACITY}</span>
            </div>

            <div className="h-8 w-px bg-slate-100"></div>

            <div className="flex flex-col justify-center min-w-[300px]">
               <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex space-x-4">
                     <span className="flex items-center text-slate-600 font-medium">
                        当前占用: <span className={`ml-1 font-bold ${isOverCapacity ? 'text-red-500' : 'text-slate-800'}`}>{totalUsed}</span>
                     </span>
                  </div>
                  <span className={`font-mono ${isOverCapacity ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                     {Math.round((totalUsed / TOTAL_LICENSE_CAPACITY) * 100)}%
                  </span>
               </div>
               <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                     className={`h-full transition-all duration-500 ${isOverCapacity ? 'bg-red-500' : 'bg-primary'}`}
                     style={{ width: `${Math.min(100, (totalUsed / TOTAL_LICENSE_CAPACITY) * 100)}%` }}
                  ></div>
               </div>
            </div>
         </div>

         <div className="flex items-center text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded border border-slate-100">
            <AlertTriangle size={12} className="mr-1.5 text-amber-500" />
            <span className="font-medium">资源说明：</span>所有类型的呼叫（呼入/外呼）共享此并发资源池。
         </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
         {/* Toolbar */}
         <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="relative">
               <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <input
                 className="pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:border-primary outline-none w-72 bg-white"
                 placeholder="搜索座席名称..."
               />
            </div>
            <button
               onClick={() => handleOpenModal()}
               className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-sky-600 transition-all flex items-center shadow-sm"
            >
               <Plus size={16} className="mr-2" /> 新建坐席
            </button>
         </div>

         {/* Table */}
         <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">AI座席ID</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">座席名称</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">机器人配置</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">数量/并发</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">排队语音</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">状态</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">创建时间</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {seats.map(seat => (
                     <tr key={seat.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 text-sm text-slate-500 font-mono">{seat.id}</td>
                        <td className="px-6 py-4">
                           <div className="font-bold text-slate-800 text-sm">{seat.name}</div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded inline-block border border-slate-200 max-w-[200px] truncate" title={getBotName(seat.botConfigId)}>
                              {getBotName(seat.botConfigId)}
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center text-sm font-medium text-slate-700">
                              <Users size={14} className="mr-1.5 text-slate-400" /> {seat.concurrency}
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-xs text-slate-600">{getQueuePromptName(seat.queuePromptAudioId)}</span>
                        </td>
                        <td className="px-6 py-4">
                           {seat.status === 'active' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                 已启用
                              </span>
                           ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                                 已禁用
                              </span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                           {new Date(seat.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleOpenModal(seat)} className="text-primary hover:text-sky-700 text-xs font-bold">编辑</button>
                              <button onClick={() => toggleStatus(seat.id)} className={`text-xs font-bold ${seat.status === 'active' ? 'text-amber-500 hover:text-amber-700' : 'text-green-500 hover:text-green-700'}`}>
                                 {seat.status === 'active' ? '禁用' : '启用'}
                              </button>
                              <button onClick={() => handleDelete(seat.id)} className="text-slate-400 hover:text-red-500 text-xs transition-colors">删除</button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-[500px] overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-base font-bold text-slate-800">
                     {editingSeat ? '编辑坐席' : '新建AI坐席'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
               </div>

               <div className="p-6 space-y-5">
                  <Input
                     label="座席名称"
                     required
                     placeholder="例如：外卖骑手招聘专席"
                     value={formData.name}
                     onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />

                  <div>
                     <Label label="机器人配置" required />
                     <Select
                        label=""
                        value={formData.botConfigId}
                        onChange={(e) => setFormData({...formData, botConfigId: e.target.value})}
                        options={[
                           { label: '请选择关联的机器人...', value: '' },
                           ...bots.map(b => ({ label: b.name, value: b.id }))
                        ]}
                     />
                  </div>

                  <Select
                     label="排队语音提示"
                     value={formData.queuePromptAudioId || DEFAULT_QUEUE_PROMPT_AUDIO_ID}
                     onChange={(e) => setFormData({...formData, queuePromptAudioId: e.target.value})}
                     options={QUEUE_PROMPT_RECORDINGS.map(recording => ({ label: recording.name, value: recording.id }))}
                  />

                  <Input
                     label="并发数量"
                     type="number"
                     min="1"
                     value={formData.concurrency}
                     onChange={(e) => setFormData({...formData, concurrency: parseInt(e.target.value) || 1})}
                  />

                  <div className="flex items-center justify-between pt-2">
                     <Label label="初始状态" />
                     <Switch
                        label={formData.status === 'active' ? '启用' : '禁用'}
                        checked={formData.status === 'active'}
                        onChange={(v) => setFormData({...formData, status: v ? 'active' : 'disabled'})}
                     />
                  </div>
               </div>

               <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded text-slate-600 text-sm hover:bg-white">
                     取消
                  </button>
                  <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-sky-600 shadow-sm">
                     确定
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
