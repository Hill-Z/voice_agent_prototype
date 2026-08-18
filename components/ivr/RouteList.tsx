
import React, { useState } from 'react';
import { Search, Plus, Edit3, Trash2, X, PlusCircle } from 'lucide-react';
import { RouteRule, BotConfiguration } from '../../types';
import { Switch, Select } from '../ui/FormComponents';

interface RouteListProps {
  bots: BotConfiguration[];
}

// Mock Data
const MOCK_ROUTES: RouteRule[] = [
  { id: '1', priority: 1, name: '【勿动】官网呼入', status: true, conditionField: 'trunk', conditionOperator: 'equals', conditionValue: '【勿动】官网呼入', jumpTargetType: 'bot', jumpTargetValue: '【勿动】官网呼入' },
  { id: '2', priority: 2, name: '秀家测试-黑名单', status: false, conditionField: 'user_number', conditionOperator: 'include', conditionValue: 'black_list', jumpTargetType: 'bot', jumpTargetValue: '外卖骑手招聘' },
  { id: '3', priority: 3, name: '默认路由', status: false, conditionField: 'trunk', conditionOperator: 'equals', conditionValue: 'default', jumpTargetType: 'seat', jumpTargetValue: '智能体坐席_外卖骑手' },
  { id: '4', priority: 4, name: '天鹅到家', status: true, conditionField: 'trunk', conditionOperator: 'equals', conditionValue: '03192557939', jumpTargetType: 'bot', jumpTargetValue: '天鹅到家' },
  { id: '5', priority: 5, name: '高崇测试语音机器人路由', status: true, conditionField: 'trunk', conditionOperator: 'equals', conditionValue: '01012345678', jumpTargetType: 'bot', jumpTargetValue: '泰康Demo-01' },
];

export default function RouteList({ bots }: RouteListProps) {
  const [routes, setRoutes] = useState<RouteRule[]>(MOCK_ROUTES);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteRule | null>(null);

  // Form Data
  const [formData, setFormData] = useState<Partial<RouteRule>>({
    name: '',
    note: '',
    conditionField: 'trunk',
    conditionOperator: 'equals',
    conditionValue: '',
    jumpTargetType: 'bot',
    jumpTargetValue: ''
  });

  const handleOpenModal = (route?: RouteRule) => {
    if (route) {
      setEditingRoute(route);
      setFormData({ ...route });
    } else {
      setEditingRoute(null);
      setFormData({
        name: '',
        note: '',
        conditionField: 'trunk',
        conditionOperator: 'equals',
        conditionValue: '',
        jumpTargetType: 'bot',
        jumpTargetValue: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return alert("请输入路由名称");

    const newRoute: RouteRule = {
      id: editingRoute ? editingRoute.id : Date.now().toString(),
      priority: editingRoute ? editingRoute.priority : routes.length + 1,
      status: editingRoute ? editingRoute.status : true,
      name: formData.name || '',
      conditionField: formData.conditionField || 'trunk',
      conditionOperator: formData.conditionOperator || 'equals',
      conditionValue: formData.conditionValue || '',
      jumpTargetType: formData.jumpTargetType || 'bot',
      jumpTargetValue: formData.jumpTargetValue || '',
      note: formData.note
    };

    if (editingRoute) {
      setRoutes(prev => prev.map(r => r.id === editingRoute.id ? newRoute : r));
    } else {
      setRoutes(prev => [...prev, newRoute]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确认删除该路由吗？')) {
      setRoutes(prev => prev.filter(r => r.id !== id));
    }
  };

  const toggleStatus = (id: string) => {
    setRoutes(prev => prev.map(r => r.id === id ? { ...r, status: !r.status } : r));
  };

  const getBotName = (id: string) => {
    const bot = bots.find(b => b.id === id);
    return bot ? bot.name : (id || '-');
  };

  const filteredRoutes = routes.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
           <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                className="pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:border-primary outline-none w-64 bg-white"
                placeholder="请输入路由名称"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:text-primary">搜索</button>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-sky-600 transition-all flex items-center shadow-lg shadow-sky-100"
        >
          <Plus size={18} className="mr-2" /> 新建路由
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
         <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
               <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">优先级</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">名称</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">跳转</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">状态</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {filteredRoutes.map(route => (
                  <tr key={route.id} className="hover:bg-slate-50 transition-colors">
                     <td className="px-6 py-4 text-sm text-slate-500">{route.priority}</td>
                     <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 text-sm">{route.name}</div>
                     </td>
                     <td className="px-6 py-4 text-sm text-slate-600">
                        {getBotName(route.jumpTargetValue)}
                     </td>
                     <td className="px-6 py-4">
                        <div className="scale-75 origin-left">
                           <Switch label="" checked={route.status} onChange={() => toggleStatus(route.id)} />
                        </div>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-3">
                           <button onClick={() => handleOpenModal(route)} className="text-primary hover:text-sky-700 text-xs font-bold">编辑</button>
                           <button onClick={() => handleDelete(route.id)} className="text-slate-400 hover:text-red-500 text-xs transition-colors">删除</button>
                        </div>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
         
         <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end items-center space-x-2 text-xs text-slate-500">
            <span>共 {filteredRoutes.length} 条</span>
            <div className="flex border border-gray-200 rounded bg-white">
               <button className="px-2 py-1 border-r border-gray-200 hover:bg-slate-50">{'<'}</button>
               <button className="px-2 py-1 bg-primary text-white">1</button>
               <button className="px-2 py-1 hover:bg-slate-50">{'>'}</button>
            </div>
            <select className="border border-gray-200 rounded py-1 px-2 outline-none bg-white">
               <option>20 条/页</option>
            </select>
         </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-[700px] overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-base font-bold text-slate-800">
                     {editingRoute ? '编辑路由' : '新建路由'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                     <X size={20} />
                  </button>
               </div>
               
               <div className="p-8 space-y-6">
                  {/* Name */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                     <label className="col-span-2 text-right text-sm text-slate-600"><span className="text-red-500">*</span>路由名称:</label>
                     <div className="col-span-10">
                        <input 
                           className="w-full px-3 py-2 border border-slate-300 rounded focus:border-primary outline-none text-sm"
                           placeholder="路由名称"
                           value={formData.name}
                           onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                     </div>
                  </div>

                  {/* Note */}
                  <div className="grid grid-cols-12 gap-4 items-start">
                     <label className="col-span-2 text-right text-sm text-slate-600 mt-2">备注:</label>
                     <div className="col-span-10">
                        <textarea 
                           className="w-full px-3 py-2 border border-slate-300 rounded focus:border-primary outline-none text-sm h-20 resize-none"
                           placeholder="备注"
                           value={formData.note}
                           onChange={(e) => setFormData({...formData, note: e.target.value})}
                        />
                     </div>
                  </div>

                  {/* Condition */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                     <label className="col-span-2 text-right text-sm text-slate-600">满足条件:</label>
                     <div className="col-span-10 flex space-x-3">
                        <select 
                           className="w-1/3 px-3 py-2 border border-slate-300 rounded focus:border-primary outline-none text-sm bg-white"
                           value={formData.conditionField}
                           onChange={(e) => setFormData({...formData, conditionField: e.target.value as any})}
                        >
                           <option value="trunk">中继号</option>
                           <option value="geo">地理区域</option>
                           <option value="time">工作时间</option>
                           <option value="user_number">用户号码</option>
                        </select>
                        
                        <select 
                           className="w-1/3 px-3 py-2 border border-slate-300 rounded focus:border-primary outline-none text-sm bg-white"
                           value={formData.conditionOperator}
                           onChange={(e) => setFormData({...formData, conditionOperator: e.target.value as any})}
                        >
                           <option value="equals">等于</option>
                           <option value="include">包含</option>
                           <option value="exclude">不包含</option>
                        </select>

                        <input 
                           className="flex-1 px-3 py-2 border border-slate-300 rounded focus:border-primary outline-none text-sm"
                           placeholder={
                              formData.conditionField === 'trunk' ? '请输入中继号' : 
                              formData.conditionField === 'geo' ? '请选择地理组合' : 
                              formData.conditionField === 'time' ? '请选择工作时间' : '请输入用户号码'
                           }
                           value={formData.conditionValue}
                           onChange={(e) => setFormData({...formData, conditionValue: e.target.value})}
                        />
                     </div>
                  </div>
                  
                  {/* Add Condition Button (Mock) */}
                  <div className="grid grid-cols-12 gap-4">
                     <div className="col-span-2"></div>
                     <div className="col-span-10">
                        <button className="text-green-600 hover:text-green-700">
                           <PlusCircle size={20} className="fill-current" />
                        </button>
                     </div>
                  </div>

                  {/* Jump Target */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                     <label className="col-span-2 text-right text-sm text-slate-600">跳转:</label>
                     <div className="col-span-10 flex space-x-3">
                        <select 
                           className="w-1/3 px-3 py-2 border border-slate-300 rounded focus:border-primary outline-none text-sm bg-white"
                           value={formData.jumpTargetType}
                           onChange={(e) => setFormData({...formData, jumpTargetType: e.target.value as any})}
                        >
                           <option value="bot">智呼机器人</option>
                           <option value="seat">坐席队列</option>
                           <option value="ivr_node">IVR节点</option>
                        </select>
                        
                        <Select 
                           className="flex-1"
                           options={[
                              { label: '请选择', value: '' },
                              ...bots.map(b => ({ label: b.name, value: b.id }))
                           ]}
                           value={formData.jumpTargetValue}
                           onChange={(e) => setFormData({...formData, jumpTargetValue: e.target.value})}
                        />
                     </div>
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
